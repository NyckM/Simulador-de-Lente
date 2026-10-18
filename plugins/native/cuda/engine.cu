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
 IMPRESSION,ASTIGMATISM,FOCUSSHIFT,PAIR0,PAIR1=PAIR0+4,PAIR2=PAIR1+4,SHIMMERPRISM=PAIR2+4,SHIMMERNORMALIZE,BOKEHDISTORTION,BOKEHDISTORTIONCOLOR,FOCUSANCHOR,FOCUSPRESERVATION,FOCUSWIDTH,FOCUSDISTANCE,TEXRINGS,TEXGRAIN,TEXSCALE,TEXROTATION,FOREBLUR,BACKBLUR,NUMF };
struct Config {int w,h,rw,rh,taps,grid,samples,slices,depth,cut,eclipse,soften,dither,invert,part,blades;float f[NUMF];};
struct Pyramid {float4* p;int n,w[16],h[16],off[16];};
static char error_[1024];static cudaStream_t stream_;
static float4 *raw_,*rays_,*pupils_,*output_;static float* depth_;
static size_t rawSize_,atlasSize_,outSize_;static Pyramid full_,layer_,base_,waveLayer_,waveOutput_;
static cudaGraph_t graph_;static cudaGraphExec_t graphExec_;static Config graphConfig_;
static Pyramid cachedLayers_[32];static Config layerConfig_;static bool layersValid_,fullValid_;static float highlight_,shimmerThreshold_;
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
 float4 first=bilinear(p.p+p.off[a],p.w[a],p.h[a],u,v);
 // At integer LOD the second level has zero weight. Keep fractional LOD's
 // original interpolation and arithmetic; do not lower sampling precision.
 if(lod==float(a))return first;
 return lerp4(first,bilinear(p.p+p.off[b],p.w[b],p.h[b],u,v),lod-a);
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
__device__ float glitterHash(int x,int y,unsigned salt,Config s){return float(hash(unsigned(x)^hash(unsigned(y))^hash(unsigned(s.f[SHIMMERSEED])*31u+salt)))/4294967296.f;}
__device__ float3 shimmer(float u,float v,float layerBlur,Config s){
 float px=u*1080/s.f[SHIMMERSIZE],py=v*1080*s.h/s.w/s.f[SHIMMERSIZE],raster=1080.f/(s.w*s.f[SHIMMERSIZE]),blur=fminf(layerBlur,.8f)*.3f,variance=.0324f+raster*raster*.08f+blur*blur;
 int ix=int(floorf(px)),iy=int(floorf(py));float3 out=make_float3(0,0,0);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  int kx=ix+x,ky=iy+y;if(glitterHash(kx,ky,1,s)>s.f[SHIMMERDENSITY])continue;
  float dx=px-(kx+.2f+.6f*glitterHash(kx,ky,2,s)),dy=py-(ky+.2f+.6f*glitterHash(kx,ky,3,s));
  float angle=glitterHash(kx,ky,4,s)*6.2831853f,sx=cosf(angle)*.10f,sy=sinf(angle)*.10f,white=expf(-(dx*dx+dy*dy)/(2*variance));
  float red=expf(-((dx-sx)*(dx-sx)+(dy-sy)*(dy-sy))/(2*variance)),blue=expf(-((dx+sx)*(dx+sx)+(dy+sy)*(dy+sy))/(2*variance));
  float strength=(.5f+.5f*glitterHash(kx,ky,5,s))*.0324f/variance;
  out.x+=mixf(white,red,s.f[SHIMMERPRISM])*strength;out.y+=white*strength;out.z+=mixf(white,blue,s.f[SHIMMERPRISM])*strength;
 }float mean=s.f[SHIMMERDENSITY]*.75f*6.2831853f*.0324f,fade=smooth(.4f,1.2f,layerBlur);return make_float3(mixf(out.x,mean,fade),mixf(out.y,mean,fade),mixf(out.z,mean,fade));
}
__global__ void prefilter(float4* dst,float4* base,const float4* raw,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=mul(raw[id],raw[id].w);c.w=1;base[id]=c;float lum=c.x*.2126f+c.y*.7152f+c.z*.0722f;c=mul(c,1+s.f[HIGHLIGHT]*smooth(.45f,1,lum));float gate=fmaxf(0,peak(c)-s.f[SHIMMERTHRESHOLD])/fmaxf(peak(c),.00001f);c.w=(c.x*.2126f+c.y*.7152f+c.z*.0722f)*gate;dst[id]=c;
}

__device__ float focusPartition(float x,Config s,bool inverse=false){
 float f=s.f[FOCUSANCHOR];if(f<=0||s.cut)return x;
 float a=fminf(s.slices-2,fmaxf(1,floorf(f*(s.slices-1)+.5f)))/(s.slices-1);
 return inverse?(x<=a?x*f/a:f+(x-a)*(1-f)/(1-a)):(x<=f?x*a/f:a+(x-f)*(1-a)/(1-f));
}
extern "C" __declspec(dllexport) int optica_cuda_focus_partition(){return 1;}

__global__ void maskLayer(float4* dst,Pyramid full,const float* depth,Config s,int slice){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=full.p[id];float k=peak(c),fraction=fmaxf(0,k-s.f[THRESHOLD])/fmaxf(k,.00001f);
 if(s.part==1)c=mul(c,1-fraction);if(s.part==2)c=mul(c,fraction);c.w=1;
 float a=1;if(s.depth){float d=guidedDep(depth,full,s,(id%s.w+.5f)/s.w,(id/s.w+.5f)/s.h),t=float(slice)/(s.slices-1);
  if(s.cut){float front=smooth(s.f[CUT]-fmaxf(.00001f,s.f[FEATHER]),s.f[CUT]+fmaxf(.00001f,s.f[FEATHER]),d);a=slice?front:1-front;}
  else { d=focusPartition(d,s); // Convert depth partition weights to conditional OVER opacity.
   float weight=fmaxf(0,1-fabsf(d-t)*(s.slices-1));
   float cumulative=sat(1+(t-d)*(s.slices-1));
   a=s.eclipse?weight:weight/fmaxf(cumulative,.00001f);
  }
 }dst[id]=mul(c,a);
}
__global__ void pyramidLevel(Pyramid p,int level){int id=blockIdx.x*blockDim.x+threadIdx.x,w=p.w[level],h=p.h[level];if(id>=w*h)return;
 float u=(id%w+.5f)/w,v=(id/w+.5f)/h;float4 sum=make_float4(0,0,0,0);
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float wx=x==0?6:abs(x)==1?4:1,wy=y==0?6:abs(y)==1?4:1;sum=add(sum,mul(bilinear(p.p+p.off[level-1],p.w[level-1],p.h[level-1],u+float(x)/p.w[level-1],v+float(y)/p.h[level-1]),wx*wy));}
 p.p[p.off[level]+id]=mul(sum,1/256.f);
}
__device__ float bokehTexture(float x,float y,Config s){
 float c=cosf(s.f[TEXROTATION]),si=sinf(s.f[TEXROTATION]),qx=(c*x-si*y)*s.f[TEXSCALE],qy=(si*x+c*y)*s.f[TEXSCALE];
 float radial=.5f+.5f*cosf(6.28318530718f*hypotf(qx,qy));
 float noise=.5f+.25f*sinf(2.17f*qx+.7f)*sinf(1.73f*qy+1.3f)+.25f*sinf(4.31f*qx+1.9f)*sinf(3.11f*qy-.4f);
 return (1-s.f[TEXRINGS]*.8f*(1-radial))*(1-s.f[TEXGRAIN]*.7f*(1-noise));
}
__device__ void fieldSample(const float4* rays,const float4* pupils,int n,float u,float v,float4& ray,float4& pupil){
 float x=sat(u)*(n-1),y=sat(v)*(n-1);int ix=int(x),iy=int(y);float fx=x-ix,fy=y-iy;
 ray=make_float4(0,0,0,0);pupil=make_float4(0,0,0,0);
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){
  int at=min(iy+j,n-1)*n+min(ix+i,n-1);float b=(i?fx:1-fx)*(j?fy:1-fy);float4 p=pupils[at];
  ray=add(ray,mul(rays[at],b*p.z));pupil.x+=p.x*b*p.z;pupil.y+=p.y*b*p.z;pupil.z+=b*p.z;pupil.w+=b*p.w;
 }
 if(pupil.z>0){ray=mul(ray,1/pupil.z);pupil.x/=pupil.z;pupil.y/=pupil.z;}
}
__global__ void gather(float4* out,Pyramid layer,Pyramid full,const float* depths,const float4* atlas,const float4* pupils,Config s,int slice){
 int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.rw*s.rh)return;
 float ux=(id%s.rw+.5f)/s.rw,uy=(id/s.rw+.5f)/s.rh,px=(ux-.5f)*2,py=(uy-.5f)*2*s.h/s.w,r=px*px+py*py;
 float qx=(px*(1+s.f[K1]*r+s.f[K2]*r*r)+2*s.f[P1]*px*py+s.f[P2]*(r+2*px*px))/2+.5f;
 float qy=(py*(1+s.f[K1]*r+s.f[K2]*r*r)+s.f[P1]*(r+2*py*py)+2*s.f[P2]*px*py)/(2.f*s.h/s.w)+.5f;
 float fx=(qx-.5f)*2,fy=(.5f-qy)*2*s.h/s.w,fr=hypotf(fx,fy),rx=fx/fmaxf(fr,.0001f),ry=fy/fmaxf(fr,.0001f);
 float d=s.depth?focusPartition(float(slice)/(s.slices-1),s,true):0,object=s.depth?1/mixf(1/s.f[FAR],1/s.f[NEAR],d):s.f[SOURCE_M];
 float ft=sat(fabsf(1/object-1/s.f[FOCUSDISTANCE])/fmaxf(s.f[FOCUSWIDTH],.000001f)),focusRamp=ft*ft*(3-2*ft),sideGain=(object<s.f[FOCUSDISTANCE]?s.f[FOREBLUR]:s.f[BACKBLUR])/100,focusKeep=(1-s.f[FOCUSPRESERVATION]*(1-focusRamp))*(1+(sideGain-1)*focusRamp);
 float scale=s.f[IRIS]/s.f[ATLASIRIS],ps=s.f[IRIS]/s.f[MAXIRIS],third=s.f[SPH3]*ps*ps*ps,fifth=s.f[SPH5]*ps*ps*ps*ps*ps;
 float extent=.35f*(fabsf(third)+fabsf(fifth)),astig=s.f[ASTIGMATISM]*fr*fr,radius=(fabsf(s.f[SENSORZ]-s.f[FOCUSSHIFT]-plane(s,object))+fabsf(astig))*s.f[IRIS]/fmaxf(1,plane(s,object)-s.f[LAST])+extent;
 float footprint=s.f[GAIN]*s.w/s.f[SENSORMM]*2.2f/sqrtf(float(s.samples)),raster=fmaxf(0,log2f(fmaxf(float(s.w)/s.rw,float(s.h)/s.rh)));
 float lod=fmaxf(raster,log2f(fmaxf(1,radius*footprint))),dz=s.f[SENSORZ]-s.f[REFERENCE]+s.f[SOURCEFOCUS]-plane(s,object);
 float sums[3]={},norms[3]={},alphas[3]={},trans[3]={};
 for(int i=0;i<s.samples;i++){int idx=int((i+.5f)*s.taps/s.samples);
  float3 glitter=make_float3(0,0,0);
  if(s.f[SHIMMER]>0){
   float4 green=bilinear(atlas+(s.taps+idx)*s.grid*s.grid,s.grid,s.grid,(sat(qx)*(s.grid-1)+.5f)/s.grid,(sat(1-qy)*(s.grid-1)+.5f)/s.grid);
   float dzLayer=s.f[SENSORZ]-s.f[REFERENCE]+s.f[SOURCEFOCUS]-plane(s,s.f[SHIMMERDEPTH]);
   float ox=(green.x+dzLayer*green.z)*scale*s.f[GAIN]/s.f[SQUEEZE],oy=(green.y+dzLayer*green.w)*scale*s.f[GAIN];
   float radius=fabsf(s.f[SENSORZ]-s.f[FOCUSSHIFT]-plane(s,s.f[SHIMMERDEPTH]))*s.f[IRIS]/fmaxf(1,plane(s,s.f[SHIMMERDEPTH])-s.f[LAST]);
   float blur=radius*fabsf(s.f[GAIN])*1080/(s.f[SENSORMM]*s.f[SHIMMERSIZE]);
   glitter=shimmer(qx-ox/s.f[SENSORMM],qy+oy/(s.f[SENSORMM]*s.h/s.w),blur,s);
  }
  for(int c=0;c<3;c++){
   float4 ray,pupil;fieldSample(atlas+(c*s.taps+idx)*s.grid*s.grid,pupils+(c*s.taps+idx)*s.grid*s.grid,s.grid,qx,1-qy,ray,pupil);
   float chroma=c==0?1:c==2?-1:0,ox=(ray.x+(dz+chroma*s.f[CAAXIAL])*ray.z)*scale,oy=(ray.y+(dz+chroma*s.f[CAAXIAL])*ray.w)*scale,rho=pupil.x*pupil.x+pupil.y*pupil.y;
   float ar=ray.z*rx+ray.w*ry,at=-ray.z*ry+ray.w*rx;ox+=astig*(ar*rx+at*ry)*scale;oy+=astig*(ar*ry-at*rx)*scale;
   float fd=s.f[SENSORZ]-s.f[FOCUSSHIFT]-plane(s,object),character=2.8f*s.f[IMPRESSION]*fd/sqrtf(fd*fd+.0001f),cs=expf(character*(rho-.5f));
   ox*=cs;oy*=cs;
   float distortionJacobian=1;
   if(s.f[BOKEHDISTORTION]>0){
    float angle=.35f+.9f*fx+.7f*fy,co=cosf(angle),si=sinf(angle),a=co*pupil.x+si*pupil.y,b=-si*pupil.x+co*pupil.y;
    float foldx=.9f*(a*a-b*b)+.3f*a*(a*a-3*b*b)+.15f*a*rho,foldy=-1.8f*a*b+.3f*b*(b*b-3*a*a)+.15f*b*rho;
    float strength=s.f[BOKEHDISTORTION]*(.65f+.35f*fminf(fr,1.5f))*(1+chroma*.2f*s.f[BOKEHDISTORTIONCOLOR]);
    float sr=fd*s.f[IRIS]/fmaxf(1,plane(s,object)-s.f[LAST]);ox+=sr*strength*(co*foldx-si*foldy);oy+=sr*strength*(si*foldx+co*foldy);
    float jx=1.8f*a+.9f*(a*a-b*b)+.15f*(rho+2*a*a),jy=-1.8f*a+.9f*(b*b-a*a)+.15f*(rho+2*b*b),jxy=-1.8f*b-1.5f*a*b;
    distortionJacobian=1+strength*sqrtf(jx*jx+jy*jy+2*jxy*jxy);
   }
   ox+=.35f*pupil.x*(third*rho+fifth*rho*rho);oy+=.35f*pupil.y*(third*rho+fifth*rho*rho);
   float cell=fmaxf(radius,.35f*(3*fabsf(third)*rho+5*fabsf(fifth)*rho*rho));cell=fmaxf(cell,hypotf(ox,oy));cell*=fmaxf(1,cs*fabsf(1+2*character*rho));cell=fmaxf(cell,radius*distortionJacobian);float stretch=1+s.f[SWIRL]*fr;cell*=stretch*(1+.6f*s.f[COMA]*hypotf(ox,oy)*stretch);
   float rl=(s.f[FOCUSPRESERVATION]>0||s.f[FOREBLUR]!=100||s.f[BACKBLUR]!=100)?fmaxf(raster,log2f(fmaxf(1,fmaxf(radius,cell*((s.soften?1.6f:1)+.8f*(fabsf(third)+fabsf(fifth))))*footprint*focusKeep))):fmaxf(lod,log2f(fmaxf(1,cell*footprint*((s.soften?1.6f:1)+.8f*(fabsf(third)+fabsf(fifth))))));
   if(fr>.0001f){float ra=ox*rx+oy*ry,ta=-ox*ry+oy*rx;ox=ra*rx/stretch-ta*ry*stretch;oy=ra*ry/stretch+ta*rx*stretch;float com=s.f[COMA]*(ox*ox+oy*oy)*.3f;ox+=com*rx;oy+=com*ry;}
   ox=ox/s.f[SQUEEZE]*s.f[GAIN];oy*=s.f[GAIN];
   if(s.dither){unsigned seed=hash(unsigned(ux*s.w)^hash(unsigned(uy*s.h))^hash(idx+17));float a=float(seed)/4294967296.f*6.2831853f,rr=sqrtf(float(hash(seed))/4294967296.f);float amp=cell*fabsf(s.f[GAIN])*2.2f/sqrtf(float(s.samples))*s.f[DITHERAMOUNT]*smooth(.5f,2,radius*fabsf(s.f[GAIN])*s.w/s.f[SENSORMM]);ox+=cosf(a)*rr*amp;oy+=sinf(a)*rr*amp;}
   ox*=focusKeep;oy*=focusKeep;
   float u=qx-ox/s.f[SENSORMM],v=qy+oy/(s.f[SENSORMM]*s.h/s.w),ca=(c==0?s.f[CARED]:c==2?s.f[CABLUE]:0)*.01f*focusKeep;u+=(qx-.5f)*ca;v+=(qy-.5f)*ca;
   float weight=pupil.z*expf(-s.f[APOD]*rho*4)*(1+s.f[RIM]*smooth(.25f,.85f,rho)),visibility=1;
   if(s.f[TEXRINGS]>0||s.f[TEXGRAIN]>0)weight*=bokehTexture(pupil.x,pupil.y,s);
   if(s.eclipse&&s.cut&&slice==0){float travel=(plane(s,object)-plane(s,s.f[NEAR]))*scale*s.f[GAIN];float ou=u-travel*ray.z/s.f[SQUEEZE]/s.f[SENSORMM],ov=v+travel*ray.w/(s.f[SENSORMM]*s.h/s.w);if(ou>=0&&ou<=1&&ov>=0&&ov<=1)visibility=1-smooth(s.f[CUT]-fmaxf(s.f[FEATHER],.0001f),s.f[CUT]+fmaxf(s.f[FEATHER],.0001f),dep(depths,s,ou,ov));}
   float4 light=sample(layer,u,v,rl);
   // Extend only far-layer RGB, before ray integration; never foreground alpha.
   if(s.depth&&slice==0&&!s.eclipse&&light.w<.99999f&&u>=0&&u<=1&&v>=0&&v<=1){
    float4 donor=light;
    for(int j=1;j<16;j++){
     if(donor.w>=.2f)break;
     int level=min(layer.n-1,int(floorf(rl))+j);
     donor=sample(layer,u,v,float(level),false);
     if(level>=layer.n-1)break;
    }
    if(donor.w>.00001f){
     float confidence=smooth(.005f,.2f,light.w);
     float4 fill=mul(donor,1/fmaxf(donor.w,.00001f));
     light=lerp4(fill,mul(light,1/fmaxf(light.w,.00001f)),confidence);light.w=1;
    }
   }
   float value=channel(light,c);
   if(s.eclipse&&!s.cut&&light.w>1e-5f){
    float width=1.f/(s.slices-1),sourceDepth=fminf(focusPartition(dep(depths,s,sat(u),sat(v)),s),float(slice)/(s.slices-1)+width*.999f);
    for(int j=slice+1;j<s.slices&&visibility>0;j++){
     float frontPlane=j*width,frontM=1/mixf(1/s.f[FAR],1/s.f[NEAR],focusPartition(frontPlane,s,true)),travel=(plane(s,object)-plane(s,frontM))*scale*s.f[GAIN];
     float ou=u-travel*ray.z/s.f[SQUEEZE]/s.f[SENSORMM],ov=v+travel*ray.w/(s.f[SENSORMM]*s.h/s.w);
     if(ou<0||ou>1||ov<0||ov>1)continue;
     float front=focusPartition(dep(depths,s,ou,ov),s);
     if(fabsf(front-frontPlane)<=width*.5f){float soft=fmaxf(s.f[FEATHER],.0001f);visibility*=1-smooth(sourceDepth+soft,sourceDepth+2*soft,front);}
    }
   }
   if(s.f[SHIMMER]>0){float4 incident=sample(full,u,v,rl);float gate=sat(incident.w/fmaxf(incident.x*.2126f+incident.y*.7152f+incident.z*.0722f,.00001f)),added=s.f[SHIMMER]*gate;
    value+=(light.x*.2126f+light.y*.7152f+light.z*.0722f)*added*(c==0?glitter.x:c==1?glitter.y:glitter.z);
    if(s.f[SHIMMERNORMALIZE]>0)value/=1+added*s.f[SHIMMERDENSITY]*.75f*6.2831853f*.0324f;
   }
   sums[c]+=value*weight*pupil.w*visibility;norms[c]+=weight;alphas[c]+=light.w*weight;trans[c]+=weight*pupil.w*visibility;
  }
 }
 float4 previous=out[id];float rgb[3];
 for(int c=0;c<3;c++){
  float norm=fmaxf(norms[c],.0001f),color=sums[c]/norm,a=sat(alphas[c]/norm);
  rgb[c]=slice==0?color:s.eclipse?channel(previous,c)+color:color+channel(previous,c)*(1-a);
 }
 out[id]=make_float4(rgb[0],rgb[1],rgb[2],1);
}
__global__ void finish(float4* out,Pyramid base,Pyramid full,Pyramid wave,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.rw*s.rh)return;float u=(id%s.rw+.5f)/s.rw,v=(id/s.rw+.5f)/s.rh;float4 color=out[id],original=sample(base,u,v,0),light=sample(full,u,v,0);
 float airy=s.f[AIRY]*s.rw/s.w;
 float fraction=fmaxf(0,peak(original)-s.f[THRESHOLD])/fmaxf(peak(original),.00001f);if(s.part==1)original=mul(original,1-fraction);if(s.part==2)original=mul(original,fraction);
 if(s.part==3){float coverage=peak(light)>s.f[THRESHOLD]?1:0;out[id]=make_float4(coverage,coverage,coverage,1);return;}
 if(s.part!=1&&s.f[BLEND]>0&&s.f[DIFFRACTION]>0){float norm=0;float4 spike=make_float4(0,0,0,0);for(int i=0;i<64;i++){float t=(i/8+.5f)/8,spoke=i%8,angle=s.blades>=3?s.f[ROTATION]+3.14159265f/s.blades+spoke*6.2831853f/8:spoke*2.39996323f,dist=airy*s.f[DIFFSCALE]*(1+14*t*t),l=log2f(1+airy*s.f[DIFFSCALE]*(.5f+2*t));float4 a=sample(wave,u+cosf(angle)*dist/s.rw,v+sinf(angle)*dist/s.rh,l);float weight=1/(1+30*t*t);spike=add(spike,mul(a,weight));norm+=weight;}color=add(color,mul(spike,s.f[DIFFRACTION]/fmaxf(norm,1)));}
 if(s.part!=1&&s.f[BLEND]>0&&s.f[GHOST]>0){for(int i=0;i<3;i++){float factor=s.f[PAIR0+i*4];if(factor<=0)continue;float mu=.5f-(u-.5f)/factor,mv=.5f-(v-.5f)/factor;float4 sum=make_float4(0,0,0,0);for(int j=0;j<4;j++){float angle=j*1.57079633f,dist=fmaxf(1,airy*s.f[DIFFSCALE]*3),lod=log2f(1+airy*s.f[DIFFSCALE]*12);float4 a=sample(wave,mu+cosf(angle)*dist/s.rw,mv+sinf(angle)*dist/s.rh,lod);sum=add(sum,a);}color.x+=sum.x*.25f*s.f[PAIR0+i*4+1]*s.f[GHOST];color.y+=sum.y*.25f*s.f[PAIR0+i*4+2]*s.f[GHOST];color.z+=sum.z*.25f*s.f[PAIR0+i*4+3]*s.f[GHOST];}}
 color=mul(lerp4(original,color,s.f[BLEND]),exp2f(s.f[EXPOSURE]));color.w=1;out[id]=color;
}
static int setupPyramid(Pyramid& p,int w,int h){int off=0,n=0;do{p.w[n]=w;p.h[n]=h;p.off[n]=off;off+=w*h;n++;if(w==1&&h==1)break;w=w/2>0?w/2:1;h=h/2>0?h/2:1;}while(n<16);if(p.p)CHK(cudaFree(p.p));CHK(cudaMalloc((void**)&p.p,off*sizeof(float4)));p.n=n;return 0;}
static void build(Pyramid p){for(int l=1;l<p.n;l++)pyramidLevel<<<(p.w[l]*p.h[l]+255)/256,256,0,stream_>>>(p,l);}
static bool sameLayers(Config a,Config b){return a.f[FOCUSANCHOR]==b.f[FOCUSANCHOR]&&a.slices==b.slices&&a.depth==b.depth&&a.cut==b.cut&&a.eclipse==b.eclipse&&a.invert==b.invert&&a.part==b.part&&a.f[DEPTHGAIN]==b.f[DEPTHGAIN]&&a.f[DEPTHBIAS]==b.f[DEPTHBIAS]&&a.f[CUT]==b.f[CUT]&&a.f[FEATHER]==b.f[FEATHER]&&a.f[THRESHOLD]==b.f[THRESHOLD];}
__global__ void packHalf(const float4* input,ushort4* output,int count){int i=blockIdx.x*blockDim.x+threadIdx.x;if(i>=count)return;float4 v=input[i];output[i]=make_ushort4(__half_as_ushort(__float2half_rn(v.x)),__half_as_ushort(__float2half_rn(v.y)),__half_as_ushort(__float2half_rn(v.z)),__half_as_ushort(__float2half_rn(v.w)));}
extern "C" __declspec(dllexport) const char* optica_cuda_error(){return error_;}
extern "C" __declspec(dllexport) const char* optica_cuda_device(){return device_;}
extern "C" __declspec(dllexport) int optica_cuda_init(){if(initialized_)return 0;CHK(cudaSetDevice(0));cudaDeviceProp p;CHK(cudaGetDeviceProperties(&p,0));snprintf(device_,sizeof(device_),"%s",p.name);CHK(cudaStreamCreate(&stream_));CHK(cudaEventCreate(&begin_));CHK(cudaEventCreate(&end_));initialized_=true;return 0;}
extern "C" __declspec(dllexport) int optica_cuda_source(const float* rgba,const float* depth,int w,int h){if(!initialized_)return 1;CHK(cudaSetDevice(0));size_t old=rawSize_;if(alloc(raw_,rawSize_,size_t(w)*h*sizeof(float4)))return 1;if(!depth_||old!=rawSize_){if(depth_)CHK(cudaFree(depth_));CHK(cudaMalloc((void**)&depth_,size_t(w)*h*sizeof(float)));}CHK(cudaMemcpyAsync(raw_,rgba,size_t(w)*h*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaMemcpyAsync(depth_,depth,size_t(w)*h*sizeof(float),cudaMemcpyHostToDevice,stream_));if(full_.w[0]!=w||full_.h[0]!=h){if(setupPyramid(full_,w,h)||setupPyramid(layer_,w,h)||setupPyramid(base_,w,h))return 1;}fullValid_=false;layersValid_=false;CHK(cudaStreamSynchronize(stream_));return 0;}
extern "C" __declspec(dllexport) int optica_cuda_atlas(const float* rays,const float* pupils,int count){CHK(cudaSetDevice(0));size_t old=atlasSize_;if(alloc(rays_,atlasSize_,size_t(count)*sizeof(float4)))return 1;if(!pupils_||old!=atlasSize_){if(pupils_)CHK(cudaFree(pupils_));CHK(cudaMalloc((void**)&pupils_,atlasSize_));}CHK(cudaMemcpyAsync(rays_,rays,size_t(count)*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaMemcpyAsync(pupils_,pupils,size_t(count)*sizeof(float4),cudaMemcpyHostToDevice,stream_));CHK(cudaStreamSynchronize(stream_));return 0;}
static int render(Config* config,void* output,float* ms,bool half){CHK(cudaSetDevice(0));Config s=*config;if(!raw_||!rays_)return 1;if(alloc(output_,outSize_,size_t(s.rw)*s.rh*sizeof(float4)))return 1;bool repeated=lastConfigValid_&&memcmp(&s,&lastConfig_,sizeof(Config))==0;lastConfig_=s;lastConfigValid_=true;if(graphExec_&&!repeated){CHK(cudaGraphExecDestroy(graphExec_));CHK(cudaGraphDestroy(graph_));graphExec_=nullptr;graph_=nullptr;}
CHK(cudaEventRecord(begin_,stream_));
if(!fullValid_||highlight_!=s.f[HIGHLIGHT]||shimmerThreshold_!=s.f[SHIMMERTHRESHOLD]){prefilter<<<(s.w*s.h+255)/256,256,0,stream_>>>(full_.p,base_.p,raw_,s);build(full_);build(base_);fullValid_=true;highlight_=s.f[HIGHLIGHT];shimmerThreshold_=s.f[SHIMMERTHRESHOLD];layersValid_=false;}
bool direct=!s.depth&&s.part==0;
size_t bytes=size_t(full_.off[full_.n-1]+1)*sizeof(float4);
bool cached=!direct&&s.slices<=32&&bytes*s.slices<=192*1024*1024;
for(int i=0;i<32;i++){if((!cached||i>=s.slices)&&cachedLayers_[i].p){CHK(cudaFree(cachedLayers_[i].p));cachedLayers_[i]={};}}
if(cached&&(!layersValid_||!sameLayers(s,layerConfig_))){for(int i=0;i<s.slices;i++){Pyramid& p=cachedLayers_[i];if(p.w[0]!=s.w||p.h[0]!=s.h){if(setupPyramid(p,s.w,s.h))return 1;}maskLayer<<<(s.w*s.h+255)/256,256,0,stream_>>>(p.p,full_,depth_,s,i);build(p);}layersValid_=true;layerConfig_=s;}
if(!cached)layersValid_=false;
bool waves=(s.f[GHOST]>0||s.f[DIFFRACTION]>0)&&s.f[BLEND]>0&&s.part!=1&&s.part!=3;
if(waves){if(waveLayer_.w[0]!=s.w||waveLayer_.h[0]!=s.h){if(setupPyramid(waveLayer_,s.w,s.h))return 1;}if(waveOutput_.w[0]!=s.rw||waveOutput_.h[0]!=s.rh){if(setupPyramid(waveOutput_,s.rw,s.rh))return 1;}}
auto launch=[&](){for(int i=0;i<s.slices;i++){Pyramid p=direct?full_:cached?cachedLayers_[i]:layer_;if(!direct&&!cached){maskLayer<<<(s.w*s.h+255)/256,256,0,stream_>>>(p.p,full_,depth_,s,i);build(p);}gather<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,p,full_,depth_,rays_,pupils_,s,i);}if(waves){Config ws=s;ws.part=2;ws.f[THRESHOLD]=.3f;
 for(int i=0;i<s.slices;i++){maskLayer<<<(s.w*s.h+255)/256,256,0,stream_>>>(waveLayer_.p,full_,depth_,ws,i);build(waveLayer_);gather<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(waveOutput_.p,waveLayer_,full_,depth_,rays_,pupils_,ws,i);}build(waveOutput_);}
 finish<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,base_,full_,waveOutput_,s);};
if(!graphExec_&&repeated){CHK(cudaStreamBeginCapture(stream_,cudaStreamCaptureModeThreadLocal));launch();CHK(cudaGetLastError());CHK(cudaStreamEndCapture(stream_,&graph_));CHK(cudaGraphInstantiate(&graphExec_,graph_,0));graphConfig_=s;}
if(graphExec_){CHK(cudaGraphLaunch(graphExec_,stream_));}else{launch();CHK(cudaGetLastError());}
if(half){if(alloc(halfOutput_,halfSize_,size_t(s.rw)*s.rh*sizeof(ushort4)))return 1;packHalf<<<(s.rw*s.rh+255)/256,256,0,stream_>>>(output_,halfOutput_,s.rw*s.rh);}
CHK(cudaEventRecord(end_,stream_));CHK(cudaMemcpyAsync(output,half?(void*)halfOutput_:(void*)output_,size_t(s.rw)*s.rh*(half?sizeof(ushort4):sizeof(float4)),cudaMemcpyDeviceToHost,stream_));CHK(cudaStreamSynchronize(stream_));CHK(cudaEventElapsedTime(ms,begin_,end_));return 0;}
// Keep the desktop 1.2.2 config prefix valid; new callers use explicit v3 exports.
static Config upgradeLegacy(const void* config){Config s={};memcpy(&s,config,16*sizeof(int)+FOCUSPRESERVATION*sizeof(float));s.f[FOCUSWIDTH]=.1f;s.f[FOCUSDISTANCE]=1;s.f[TEXSCALE]=6;s.f[FOREBLUR]=s.f[BACKBLUR]=100;return s;}
extern "C" __declspec(dllexport) int optica_cuda_render(const void* config,float* output,float* ms){Config s=upgradeLegacy(config);return render(&s,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half(const void* config,unsigned short* output,float* ms){Config s=upgradeLegacy(config);return render(&s,output,ms,true);}
static Config upgradeV2(const void* config){Config s={};memcpy(&s,config,16*sizeof(int)+TEXRINGS*sizeof(float));s.f[TEXSCALE]=6;s.f[FOREBLUR]=s.f[BACKBLUR]=100;return s;}
extern "C" __declspec(dllexport) int optica_cuda_render_v2(const void* config,float* output,float* ms){Config s=upgradeV2(config);return render(&s,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half_v2(const void* config,unsigned short* output,float* ms){Config s=upgradeV2(config);return render(&s,output,ms,true);}
static Config upgradeV3(const void* config){Config s={};memcpy(&s,config,16*sizeof(int)+FOREBLUR*sizeof(float));s.f[FOREBLUR]=s.f[BACKBLUR]=100;return s;}
extern "C" __declspec(dllexport) int optica_cuda_render_v3(const void* config,float* output,float* ms){Config s=upgradeV3(config);return render(&s,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half_v3(const void* config,unsigned short* output,float* ms){Config s=upgradeV3(config);return render(&s,output,ms,true);}
extern "C" __declspec(dllexport) int optica_cuda_render_v4(Config* config,float* output,float* ms){return render(config,output,ms,false);}
extern "C" __declspec(dllexport) int optica_cuda_render_half_v4(Config* config,unsigned short* output,float* ms){return render(config,output,ms,true);}
extern "C" __declspec(dllexport) int optica_cuda_blur_sides(){return 1;}
extern "C" __declspec(dllexport) int optica_cuda_bokeh_texture(){return 1;}

extern "C" __declspec(dllexport) int optica_cuda_focus_preservation(){return 1;}

