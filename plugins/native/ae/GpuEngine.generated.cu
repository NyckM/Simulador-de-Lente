#include <cuda_runtime.h>
#include <cuda_fp16.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

// Persistent HDR image, depth, ray atlas and reconstruction pyramids.
// No CUDA toolkit is needed at runtime: cudart is linked statically.
enum F { LAST,REFERENCE,SOURCEFOCUS,SENSORZ,SENSORMM,IRIS,ATLASIRIS,MAXIRIS,NEAR,FAR,
 GAIN,HIGHLIGHT,EXPOSURE,SWIRL,COMA,SQUEEZE,SPH3,SPH5,K1,K2,P1,P2,BLEND,APOD,RIM,
 CARED,CABLUE,CAAXIAL,DITHERAMOUNT,DEPTHGAIN,DEPTHBIAS,CUT,FEATHER,THRESHOLD,
 SHIMMER,SHIMMERDEPTH,SHIMMERSIZE,SHIMMERDENSITY,SHIMMERSEED,SHIMMERTHRESHOLD,
 SOURCE_M,MATRIXA,MATRIXB,MATRIXC,MATRIXD,GHOST,DIFFRACTION,DIFFSCALE,AIRY,ROTATION,
 IMPRESSION,PAIR0,PAIR1=PAIR0+4,PAIR2=PAIR1+4,PIXELASPECT=PAIR2+4,FOCUSKEEP,FOCUSWIDTH,FOCUSDIST,TEXRINGS,TEXGRAIN,TEXSCALE,TEXROT,FG_BLUR,BG_BLUR,NUMF };
struct Config {int w,h,rw,rh,taps,grid,samples,slices,depth,cut,eclipse,soften,dither,invert,part,blades;float f[NUMF];};
#include "OpticalControls.h"
struct Pyramid {float4* p;int n,w[16],h[16],off[16];};
static char error_[1024];static cudaStream_t stream_;
static float4 *raw_,*rays_,*pupils_,*output_;static float* depth_;
static size_t rawSize_,atlasSize_,outSize_;static Pyramid full_,layer_,base_;
static cudaGraph_t graph_;static cudaGraphExec_t graphExec_;static Config graphConfig_;
static Pyramid cachedLayers_[32];static Config layerConfig_;static bool layersValid_,fullValid_;static float highlight_;
static ushort4* halfOutput_;static size_t halfSize_;static Config lastConfig_;static bool lastConfigValid_;
static cudaEvent_t begin_,end_;static bool initialized_;static char device_[256];
static int check(cudaError_t e){if(e==cudaSuccess)return 0;snprintf(error_,sizeof(error_),"%s",cudaGetErrorString(e));return 1;}
#define CHK(call) do{if(check(call))return 1;}while(0)
template<class T> static int alloc(T*& p,size_t& old,size_t bytes){if(old<bytes){if(p)CHK(cudaFree(p));CHK(cudaMalloc((void**)&p,bytes));old=bytes;}return 0;}
__device__ float sat(float x){return fminf(1,fmaxf(0,x));}
__device__ float smooth(float a,float b,float x){float t=sat((x-a)/fmaxf(b-a,1e-12f));return t*t*(3-2*t);}
__device__ float mixf(float a,float b,float t){return a+(b-a)*t;}
__device__ float4 add(float4 a,float4 b){return make_float4(a.x+b.x,a.y+b.y,a.z+b.z,a.w+b.w);}
__device__ float4 mul(float4 a,float v){return make_float4(a.x*v,a.y*v,a.z*v,a.w*v);}
__device__ float4 lerp4(float4 a,float4 b,float t){return add(mul(a,1-t),mul(b,t));}
__device__ float channel(float4 a,int c){return c==0?a.x:c==1?a.y:a.z;}
__device__ float peak(float4 a){return fmaxf(a.x,fmaxf(a.y,a.z));}
__device__ float4 bilinear(const float4* p,int w,int h,float u,float v){
 float x=fminf(w-1.f,fmaxf(0,u*w-.5f)),y=fminf(h-1.f,fmaxf(0,v*h-.5f));int ix=int(x),iy=int(y),jx=min(ix+1,w-1),jy=min(iy+1,h-1);
 return lerp4(lerp4(p[iy*w+ix],p[iy*w+jx],x-ix),lerp4(p[jy*w+ix],p[jy*w+jx],x-ix),y-iy);
}
__device__ float4 sample(Pyramid p,float u,float v,float lod,bool outside=true){
 if(outside&&(u<0||u>1||v<0||v>1))return make_float4(0,0,0,0);
 lod=fminf(p.n-1.f,fmaxf(0,lod));int a=int(lod),b=min(a+1,p.n-1);
 return lerp4(bilinear(p.p+p.off[a],p.w[a],p.h[a],u,v),bilinear(p.p+p.off[b],p.w[b],p.h[b],u,v),lod-a);
}
__device__ float rawDep(const float* p,Config s,float u,float v){
 float x=fminf(s.w-1.f,fmaxf(0,u*s.w-.5f)),y=fminf(s.h-1.f,fmaxf(0,v*s.h-.5f));int ix=int(x),iy=int(y),jx=min(ix+1,s.w-1),jy=min(iy+1,s.h-1);
 float d=mixf(mixf(p[iy*s.w+ix],p[iy*s.w+jx],x-ix),mixf(p[jy*s.w+ix],p[jy*s.w+jx],x-ix),y-iy);
 return d;
}
__device__ float dep(const float* p,Config s,float u,float v){float d=sat(rawDep(p,s,u,v)*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;}

// RGB-guided depth boundary repair. Only two locally flat, separated planes
// are eligible; a sloping depth surface or a third material stays unchanged.
__device__ float colorDot(float4 a,float4 b){return a.x*b.x+a.y*b.y+a.z*b.z;}
__device__ float4 colorDiff(float4 a,float4 b){return make_float4(a.x-b.x,a.y-b.y,a.z-b.z,0);}
__device__ float guidedDep(const float* depths,Pyramid full,Config s,float u,float v){
 float center=rawDep(depths,s,u,v),lo=center,hi=center,lu=u,lv=v,hu=u,hv=v,tx=1.f/s.w,ty=1.f/s.h;
 if(center<=.001f||center>=.999f)return dep(depths,s,u,v);
 float radius=fminf(32,fmaxf(6,s.w*.0375f));
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float qu=fminf(1-tx*.5f,fmaxf(tx*.5f,u+x*radius*.5f*tx)),qv=fminf(1-ty*.5f,fmaxf(ty*.5f,v+y*radius*.5f*ty)),d=rawDep(depths,s,qu,qv);if(d<lo){lo=d;lu=qu;lv=qv;}if(d>hi){hi=d;hu=qu;hv=qv;}}
 if(hi-lo<.15f||center<=lo+.001f||center>=hi-.001f)return dep(depths,s,u,v);
 float variation=0;for(int i=0;i<4;i++){float dx=i==0?tx:i==1?-tx:0,dy=i==2?ty:i==3?-ty:0;variation=fmaxf(variation,fabsf(rawDep(depths,s,lu+dx,lv+dy)-lo));variation=fmaxf(variation,fabsf(rawDep(depths,s,hu+dx,hv+dy)-hi));}
 if(variation>.002f)return dep(depths,s,u,v);
 float4 centerColor=bilinear(full.p,s.w,s.h,u,v),low=make_float4(0,0,0,0),high=low;float lc=0,hc=0,ld=1e30f,hd=1e30f;
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float qu=fminf(1-tx*.5f,fmaxf(tx*.5f,u+x*radius*.5f*tx)),qv=fminf(1-ty*.5f,fmaxf(ty*.5f,v+y*radius*.5f*ty)),d=rawDep(depths,s,qu,qv);float4 c=bilinear(full.p,s.w,s.h,qu,qv);float4 diff=colorDiff(c,centerColor);float dist=colorDot(diff,diff);if(d<=lo+.025f){lc++;if(dist<ld){low=c;ld=dist;}}if(d>=hi-.025f){hc++;if(dist<hd){high=c;hd=dist;}}}
 if(lc<3||hc<3)return dep(depths,s,u,v);float4 delta=colorDiff(high,low);float contrast=colorDot(delta,delta);if(contrast<.005f)return dep(depths,s,u,v);
 float4 c=centerColor;float t=sat(colorDot(colorDiff(c,low),delta)/contrast);float4 residual=colorDiff(c,lerp4(low,high,t));
 if(colorDot(residual,residual)>contrast*.12f+.0004f)return dep(depths,s,u,v);
 float d=sat(mixf(lo,hi,t)*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;
}

__device__ float plane(Config s,float m){float inv=1/(m*1000);return s.f[LAST]-(s.f[MATRIXA]+s.f[MATRIXB]*inv)/(s.f[MATRIXC]+s.f[MATRIXD]*inv);}
__device__ unsigned hash(unsigned x){x^=x>>16;x*=0x7feb352d;x^=x>>15;x*=0x846ca68b;x^=x>>16;return x;}
__device__ float noise(float x,float y,Config s){float v=sinf(x*127.1f+y*311.7f+s.f[SHIMMERSEED]*17.31f)*43758.5453f;return v-floorf(v);}
__device__ float shimmer(float u,float v,Config s){
 float x=u*1080/s.f[SHIMMERSIZE],y=v*1080*s.h/s.w/s.f[PIXELASPECT]/s.f[SHIMMERSIZE],ix=floorf(x),iy=floorf(y),tx=x-ix,ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);
 float n=mixf(mixf(noise(ix,iy,s),noise(ix+1,iy,s),tx),mixf(noise(ix,iy+1,s),noise(ix+1,iy+1,s),tx),ty);
 return smooth(1-s.f[SHIMMERDENSITY]-.02f,1-s.f[SHIMMERDENSITY]+.02f,n)*n*n;
}
__global__ void prefilter(float4* dst,float4* base,const float4* raw,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=mul(raw[id],sat(raw[id].w));c.w=1;base[id]=c;float lum=c.x*.2126f+c.y*.7152f+c.z*.0722f;c=mul(c,1+s.f[HIGHLIGHT]*smooth(.45f,1,lum));c.w=1;dst[id]=c;
}
__global__ void maskLayer(float4* dst,Pyramid full,const float* depth,Config s,int slice){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=full.p[id];float k=peak(c),fraction=fmaxf(0,k-s.f[THRESHOLD])/fmaxf(k,.00001f);
 if(s.part==1)c=mul(c,1-fraction);if(s.part==2)c=mul(c,fraction);c.w=1;
 float a=1;if(s.depth){float d=guidedDep(depth,full,s,(id%s.w+.5f)/s.w,(id/s.w+.5f)/s.h),t=float(slice)/(s.slices-1);
  if(s.cut){float front=smooth(s.f[CUT]-fmaxf(.00001f,s.f[FEATHER]),s.f[CUT]+fmaxf(.00001f,s.f[FEATHER]),d);a=slice?front:1-front;}
  else a=fmaxf(0,1-fabsf(d-t)*(s.slices-1));
 }dst[id]=mul(c,a);
}
__global__ void pyramidLevel(Pyramid p,int level){int id=blockIdx.x*blockDim.x+threadIdx.x,w=p.w[level],h=p.h[level];if(id>=w*h)return;
 float u=(id%w+.5f)/w,v=(id/w+.5f)/h;float4 sum=make_float4(0,0,0,0);
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float wx=x==0?6:abs(x)==1?4:1,wy=y==0?6:abs(y)==1?4:1;sum=add(sum,mul(bilinear(p.p+p.off[level-1],p.w[level-1],p.h[level-1],u+float(x)/p.w[level-1],v+float(y)/p.h[level-1]),wx*wy));}
 p.p[p.off[level]+id]=mul(sum,1/256.f);
}
__global__ void gather(float4* out,Pyramid layer,Pyramid full,const float* depths,const float4* atlas,const float4* pupils,Config s,int slice){
 int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.rw*s.rh)return;
 float ux=(id%s.rw+.5f)/s.rw,uy=(id/s.rw+.5f)/s.rh,px=(ux-.5f)*2,py=(uy-.5f)*2*s.h/s.w/s.f[PIXELASPECT],r=px*px+py*py;
 float qx=(px*(1+s.f[K1]*r+s.f[K2]*r*r)+2*s.f[P1]*px*py+s.f[P2]*(r+2*px*px))/2+.5f;
 float qy=(py*(1+s.f[K1]*r+s.f[K2]*r*r)+s.f[P1]*(r+2*py*py)+2*s.f[P2]*px*py)/(2.f*s.h/s.w/s.f[PIXELASPECT])+.5f;
 float fx=(qx-.5f)*2,fy=(.5f-qy)*2*s.h/s.w/s.f[PIXELASPECT],fr=hypotf(fx,fy),rx=fx/fmaxf(fr,.0001f),ry=fy/fmaxf(fr,.0001f);
 float d=s.depth?float(slice)/(s.slices-1):0,object=s.depth?1/mixf(1/s.f[FAR],1/s.f[NEAR],d):s.f[SOURCE_M];
 float spread=opticsSpread(s,object);
 float scale=s.f[IRIS]/s.f[ATLASIRIS],ps=s.f[IRIS]/s.f[MAXIRIS],third=s.f[SPH3]*ps*ps*ps,fifth=s.f[SPH5]*ps*ps*ps*ps*ps;
 float extent=.35f*(fabsf(third)+fabsf(fifth)),radius=fabsf(s.f[SENSORZ]-plane(s,object))*s.f[IRIS]/fmaxf(1,plane(s,object)-s.f[LAST])+extent;
 float footprint=s.f[GAIN]*s.w/s.f[SENSORMM]*2.2f/sqrtf(float(s.samples)),raster=fmaxf(0,log2f(fmaxf(float(s.w)/s.rw,float(s.h)/s.rh)));
 float lod=fmaxf(raster,log2f(fmaxf(1,radius*footprint*spread))),dz=s.f[SENSORZ]-s.f[REFERENCE]+s.f[SOURCEFOCUS]-plane(s,object);
 float sums[3]={},norms[3]={},alphas[3]={},trans[3]={};
 for(int i=0;i<s.samples;i++){int idx=int((i+.5f)*s.taps/s.samples);
  for(int c=0;c<3;c++){
   float4 ray=bilinear(atlas+(c*s.taps+idx)*s.grid*s.grid,s.grid,s.grid,(sat(qx)*(s.grid-1)+.5f)/s.grid,(sat(1-qy)*(s.grid-1)+.5f)/s.grid);
   float4 pupil=bilinear(pupils+(c*s.taps+idx)*s.grid*s.grid,s.grid,s.grid,(sat(qx)*(s.grid-1)+.5f)/s.grid,(sat(1-qy)*(s.grid-1)+.5f)/s.grid);
   float chroma=c==0?1:c==2?-1:0,ox=(ray.x+(dz+chroma*s.f[CAAXIAL])*ray.z)*scale,oy=(ray.y+(dz+chroma*s.f[CAAXIAL])*ray.w)*scale,rho=pupil.x*pupil.x+pupil.y*pupil.y;
   float fd=s.f[SENSORZ]-plane(s,object),character=2.8f*s.f[IMPRESSION]*fd/sqrtf(fd*fd+.0001f),cs=expf(character*(rho-.5f));
   ox*=cs;oy*=cs;
   ox+=.35f*pupil.x*(third*rho+fifth*rho*rho);oy+=.35f*pupil.y*(third*rho+fifth*rho*rho);
   float cell=fmaxf(radius,.35f*(3*fabsf(third)*rho+5*fabsf(fifth)*rho*rho));cell=fmaxf(cell,hypotf(ox,oy));cell*=fmaxf(1,cs*fabsf(1+2*character*rho));float stretch=1+s.f[SWIRL]*fr;cell*=stretch*(1+.6f*s.f[COMA]*hypotf(ox,oy)*stretch);
   float rl=fmaxf(lod,log2f(fmaxf(1,cell*footprint*spread*((s.soften?1.6f:1)+.8f*(fabsf(third)+fabsf(fifth))))));
   if(fr>.0001f){float ra=ox*rx+oy*ry,ta=-ox*ry+oy*rx;ox=ra*rx/stretch-ta*ry*stretch;oy=ra*ry/stretch+ta*rx*stretch;float com=s.f[COMA]*(ox*ox+oy*oy)*.3f;ox+=com*rx;oy+=com*ry;}
   ox=ox/s.f[SQUEEZE]*s.f[GAIN];oy*=s.f[GAIN];
   if(s.dither){unsigned seed=hash(unsigned(ux*s.w)^hash(unsigned(uy*s.h))^hash(idx+17));float a=float(seed)/4294967296.f*6.2831853f,rr=sqrtf(float(hash(seed))/4294967296.f);float amp=cell*fabsf(s.f[GAIN])*2.2f/sqrtf(float(s.samples))*s.f[DITHERAMOUNT]*smooth(.5f,2,radius*fabsf(s.f[GAIN])*s.w/s.f[SENSORMM]);ox+=cosf(a)*rr*amp;oy+=sinf(a)*rr*amp;}
   ox*=spread;oy*=spread;
   float u=qx-ox/s.f[SENSORMM],v=qy+oy/(s.f[SENSORMM]*s.h/s.w/s.f[PIXELASPECT]),ca=(c==0?s.f[CARED]:c==2?s.f[CABLUE]:0)*.01f*spread;u+=(qx-.5f)*ca;v+=(qy-.5f)*ca;
   float weight=opticsTexture(s,pupil.x,pupil.y)*pupil.z*expf(-s.f[APOD]*rho*4)*(1+s.f[RIM]*smooth(.25f,.85f,rho)),visibility=1;
   if(s.eclipse&&slice==0){float travel=(plane(s,object)-plane(s,s.f[NEAR]))*scale*s.f[GAIN];float ou=u-travel*ray.z/s.f[SQUEEZE]/s.f[SENSORMM],ov=v+travel*ray.w/(s.f[SENSORMM]*s.h/s.w/s.f[PIXELASPECT]);if(ou>=0&&ou<=1&&ov>=0&&ov<=1)visibility=1-smooth(s.f[CUT]-fmaxf(s.f[FEATHER],.0001f),s.f[CUT]+fmaxf(s.f[FEATHER],.0001f),dep(depths,s,ou,ov));}
   float4 light=sample(layer,u,v,rl);float value=channel(light,c);
   if(s.f[SHIMMER]>0&&object>s.f[SHIMMERDEPTH]){float travel=(plane(s,object)-plane(s,s.f[SHIMMERDEPTH]))*scale*s.f[GAIN],su=u-travel*ray.z/s.f[SQUEEZE]/s.f[SENSORMM],sv=v+travel*ray.w/(s.f[SENSORMM]*s.h/s.w/s.f[PIXELASPECT]);float incident=peak(sample(full,u,v,rl));value*=1+s.f[SHIMMER]*fmaxf(0,incident-s.f[SHIMMERTHRESHOLD])/fmaxf(incident,.00001f)*shimmer(su,sv,s);}
   sums[c]+=value*weight*pupil.w*visibility;norms[c]+=weight;alphas[c]+=light.w*weight;trans[c]+=weight*pupil.w*visibility;
  }
 }
 float4 previous=out[id];float rgb[3];
 for(int c=0;c<3;c++){
  float norm=fmaxf(norms[c],.0001f),color=sums[c]/norm,a=sat(alphas[c]/norm);
  if(s.depth&&slice==0&&!s.eclipse){float4 top=sample(layer,qx,qy,layer.n-1,false);float fill=channel(top,c)/fmaxf(top.w,.00001f);
   for(int l=layer.n-2;l>=0;l--){float4 local=sample(layer,qx,qy,l,false);fill=mixf(fill,channel(local,c)/fmaxf(local.w,.00001f),smooth(.005f,.2f,local.w));}
   color=mixf(fill*trans[c]/norm,color/fmaxf(a,.00001f),a);
  }
  rgb[c]=slice==0?color:s.eclipse?channel(previous,c)+color:color+channel(previous,c)*(1-a);
 }
 out[id]=make_float4(rgb[0],rgb[1],rgb[2],1);
}
__global__ void finish(float4* out,Pyramid base,Pyramid full,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.rw*s.rh)return;float u=(id%s.rw+.5f)/s.rw,v=(id/s.rw+.5f)/s.rh;float4 color=out[id],original=sample(base,u,v,0),light=sample(full,u,v,0);
 float fraction=fmaxf(0,peak(original)-s.f[THRESHOLD])/fmaxf(peak(original),.00001f);if(s.part==1)original=mul(original,1-fraction);if(s.part==2)original=mul(original,fraction);
 if(s.part==3){float coverage=peak(light)>s.f[THRESHOLD]?1:0;out[id]=make_float4(coverage,coverage,coverage,1);return;}
 if(s.part!=1&&s.f[DIFFRACTION]>0){float norm=0;float4 spike=make_float4(0,0,0,0);for(int i=0;i<64;i++){float t=(i/8+.5f)/8,spoke=i%8,angle=s.blades>=3?s.f[ROTATION]+3.14159265f/s.blades+spoke*6.2831853f/8:spoke*2.39996323f,dist=s.f[AIRY]*s.f[DIFFSCALE]*(1+14*t*t),l=log2f(1+s.f[AIRY]*s.f[DIFFSCALE]*(.5f+2*t));float4 a=sample(full,u+cosf(angle)*dist/s.w,v+sinf(angle)*dist/s.h,l);a.x=fmaxf(0,a.x-.6f);a.y=fmaxf(0,a.y-.6f);a.z=fmaxf(0,a.z-.6f);float weight=1/(1+30*t*t);spike=add(spike,mul(a,weight));norm+=weight;}color=add(color,mul(spike,s.f[DIFFRACTION]/fmaxf(norm,1)));}
 if(s.part!=1&&s.f[GHOST]>0){for(int i=0;i<3;i++){float factor=s.f[PAIR0+i*4];if(factor<=0)continue;float mu=.5f-(u-.5f)/factor,mv=.5f-(v-.5f)/factor;float4 sum=make_float4(0,0,0,0);for(int j=0;j<4;j++){float angle=j*1.57079633f,dist=fmaxf(1,s.f[AIRY]*s.f[DIFFSCALE]*3),lod=log2f(1+s.f[AIRY]*s.f[DIFFSCALE]*12);float4 a=sample(full,mu+cosf(angle)*dist/s.w,mv+sinf(angle)*dist/s.h,lod);a.x=fmaxf(0,a.x-.3f);a.y=fmaxf(0,a.y-.3f);a.z=fmaxf(0,a.z-.3f);sum=add(sum,a);}color.x+=sum.x*.25f*s.f[PAIR0+i*4+1]*s.f[GHOST];color.y+=sum.y*.25f*s.f[PAIR0+i*4+2]*s.f[GHOST];color.z+=sum.z*.25f*s.f[PAIR0+i*4+3]*s.f[GHOST];}}
 color=mul(lerp4(original,color,s.f[BLEND]),exp2f(s.f[EXPOSURE]));color.w=1;out[id]=color;
}
static int setupPyramid(Pyramid& p,int w,int h){int off=0,n=0;do{p.w[n]=w;p.h[n]=h;p.off[n]=off;off+=w*h;n++;if(w==1&&h==1)break;w=w/2>0?w/2:1;h=h/2>0?h/2:1;}while(n<16);if(p.p)CHK(cudaFree(p.p));CHK(cudaMalloc((void**)&p.p,off*sizeof(float4)));p.n=n;return 0;}
static void build(Pyramid p){for(int l=1;l<p.n;l++)pyramidLevel<<<(p.w[l]*p.h[l]+255)/256,256,0,stream_>>>(p,l);}
static bool sameLayers(Config a,Config b){return a.slices==b.slices&&a.depth==b.depth&&a.cut==b.cut&&a.invert==b.invert&&a.part==b.part&&a.f[DEPTHGAIN]==b.f[DEPTHGAIN]&&a.f[DEPTHBIAS]==b.f[DEPTHBIAS]&&a.f[CUT]==b.f[CUT]&&a.f[FEATHER]==b.f[FEATHER]&&a.f[THRESHOLD]==b.f[THRESHOLD];}
__global__ void packHalf(const float4* input,ushort4* output,int count){int i=blockIdx.x*blockDim.x+threadIdx.x;if(i>=count)return;float4 v=input[i];output[i]=make_ushort4(__half_as_ushort(__float2half_rn(v.x)),__half_as_ushort(__float2half_rn(v.y)),__half_as_ushort(__float2half_rn(v.z)),__half_as_ushort(__float2half_rn(v.w)));}
extern "C" __declspec(dllexport) const char* optica_cuda_error(){return error_;}
extern "C" __declspec(dllexport) const char* optica_cuda_device(){return device_;}
extern "C" __declspec(dllexport) int optica_cuda_init(){if(initialized_)return 0;CHK(cudaSetDevice(0));cudaDeviceProp p;CHK(cudaGetDeviceProperties(&p,0));snprintf(device_,sizeof(device_),"%s",p.name);CHK(cudaStreamCreate(&stream_));CHK(cudaEventCreate(&begin_));CHK(cudaEventCreate(&end_));initialized_=true;return 0;}
extern "C" __declspec(dllexport) int optica_cuda_source(const float* rgba,const float* depth,int w,int h){if(!initialized_)return 1;CHK(cudaSetDevice(0));size_t old=rawSize_;if(alloc(raw_,rawSize_,size_t(w)*h*sizeof(float4)))return 1;if(!depth_||old!=rawSize_){if(depth_)CHK(cudaFree(depth_));CHK(cudaMalloc((void**)&depth_,size_t(w)*h*sizeof(float)));}CHK(cudaMemcpyAsync(raw_,rgba,size_t(w)*h*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaMemcpyAsync(depth_,depth,size_t(w)*h*sizeof(float),cudaMemcpyHostToDevice,stream_));if(full_.w[0]!=w||full_.h[0]!=h){if(setupPyramid(full_,w,h)||setupPyramid(layer_,w,h)||setupPyramid(base_,w,h))return 1;}fullValid_=false;layersValid_=false;CHK(cudaStreamSynchronize(stream_));return 0;}
extern "C" __declspec(dllexport) int optica_cuda_atlas(const float* rays,const float* pupils,int count){CHK(cudaSetDevice(0));size_t old=atlasSize_;if(alloc(rays_,atlasSize_,size_t(count)*sizeof(float4)))return 1;if(!pupils_||old!=atlasSize_){if(pupils_)CHK(cudaFree(pupils_));CHK(cudaMalloc((void**)&pupils_,atlasSize_));}CHK(cudaMemcpyAsync(rays_,rays,size_t(count)*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaMemcpyAsync(pupils_,pupils,size_t(count)*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaStreamSynchronize(stream_));return 0;}
static int render(Config* config,void* output,float* ms,bool half){CHK(cudaSetDevice(0));Config s=*config;if(!raw_||!rays_)return 1;if(alloc(output_,outSize_,size_t(s.rw)*s.rh*sizeof(float4)))return 1;bool repeated=lastConfigValid_&&memcmp(&s,&lastConfig_,sizeof(Config))==0;lastConfig_=s;lastConfigValid_=true;if(graphExec_&&!repeated){CHK(cudaGraphExecDestroy(graphExec_));CHK(cudaGraphDestroy(graph_));graphExec_=nullptr;graph_=nullptr;}
CHK(cudaEventRecord(begin_,stream_));
if(!fullValid_||highlight_!=s.f[HIGHLIGHT]){prefilter<<<(s.w*s.h+255)/256,256,0,stream_>>>(full_.p,base_.p,raw_,s);build(full_);build(base_);fullValid_=true;highlight_=s.f[HIGHLIGHT];layersValid_=false;}
bool direct=!s.depth&&s.part==0;
size_t bytes=size_t(full_.off[full_.n-1]+1)*sizeof(float4);
bool cached=!direct&&s.slices<=32&&bytes*s.slices<=192*1024*1024;
for(int i=0;i<32;i++){if((!cached||i>=s.slices)&&cachedLayers_[i].p){CHK(cudaFree(cachedLayers_[i].p));cachedLayers_[i]={};}}
if(cached&&(!layersValid_||!sameLayers(s,layerConfig_))){for(int i=0;i<s.slices;i++){Pyramid& p=cachedLayers_[i];if(p.w[0]!=s.w||p.h[0]!=s.h){if(setupPyramid(p,s.w,s.h))return 1;}maskLayer<<<(s.w*s.h+255)/256,256,0,stream_>>>(p.p,full_,depth_,s,i);build(p);}layersValid_=true;layerConfig_=s;}
if(!cached)layersValid_=false;
auto launch=[&](){for(int i=0;i<s.slices;i++){Pyramid p=direct?full_:cached?cachedLayers_[i]:layer_;if(!direct&&!cached){maskLayer<<<(s.w*s.h+255)/256,256,0,stream_>>>(p.p,full_,depth_,s,i);build(p);}gather<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,p,full_,depth_,rays_,pupils_,s,i);}finish<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,base_,full_,s);};
if(!graphExec_&&repeated){CHK(cudaStreamBeginCapture(stream_,cudaStreamCaptureModeThreadLocal));launch();CHK(cudaGetLastError());CHK(cudaStreamEndCapture(stream_,&graph_));CHK(cudaGraphInstantiate(&graphExec_,graph_,0));graphConfig_=s;}
if(graphExec_){CHK(cudaGraphLaunch(graphExec_,stream_));}else{launch();CHK(cudaGetLastError());}
if(half){if(alloc(halfOutput_,halfSize_,size_t(s.rw)*s.rh*sizeof(ushort4)))return 1;packHalf<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,halfOutput_,s.rw*s.rh);}
CHK(cudaEventRecord(end_,stream_));CHK(cudaMemcpyAsync(output,half?(void*)halfOutput_:(void*)output_,size_t(s.rw)*s.rh*(half?sizeof(ushort4):sizeof(float4)),cudaMemcpyDeviceToHost,stream_));CHK(cudaStreamSynchronize(stream_));CHK(cudaEventElapsedTime(ms,begin_,end_));return 0;}
extern "C" __declspec(dllexport) int optica_cuda_render_v2(Config* config,float* output,float* ms){return render(config,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half_v2(Config* config,unsigned short* output,float* ms){return render(config,output,ms,true);}

struct LegacyConfig {int ints[16];float floats[PIXELASPECT+1];};
static Config upgrade(const LegacyConfig* old){Config s{};memcpy(&s,old,sizeof(LegacyConfig));s.f[FOCUSWIDTH]=.1f;s.f[TEXSCALE]=6;s.f[FG_BLUR]=s.f[BG_BLUR]=100;return s;}
extern "C" __declspec(dllexport) int bruxos_cuda_config_bytes(){return sizeof(Config);}
extern "C" __declspec(dllexport) int optica_cuda_render(const LegacyConfig* old,float* output,float* ms){auto s=upgrade(old);return render(&s,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half(const LegacyConfig* old,unsigned short* output,float* ms){auto s=upgrade(old);return render(&s,output,ms,true);}
