#include "Engine.h"
#include "OpticalControls.h"
#include <algorithm>
#include <cmath>
using std::min;using std::max;using std::abs;
struct Index{int x;};static thread_local Index blockIdx{},threadIdx{};static const Index blockDim{256};
struct Pyramid {float4* p;int n,w[16],h[16],off[16];};
inline float sat(float x){return fminf(1,fmaxf(0,x));}
inline float smooth(float a,float b,float x){float t=sat((x-a)/fmaxf(b-a,1e-12f));return t*t*(3-2*t);}
inline float mixf(float a,float b,float t){return a+(b-a)*t;}
inline float4 add(float4 a,float4 b){return make_float4(a.x+b.x,a.y+b.y,a.z+b.z,a.w+b.w);}
inline float4 mul(float4 a,float v){return make_float4(a.x*v,a.y*v,a.z*v,a.w*v);}
inline float4 lerp4(float4 a,float4 b,float t){return add(mul(a,1-t),mul(b,t));}
inline float channel(float4 a,int c){return c==0?a.x:c==1?a.y:a.z;}
inline float peak(float4 a){return fmaxf(a.x,fmaxf(a.y,a.z));}
inline float4 bilinear(const float4* p,int w,int h,float u,float v){
 float x=fminf(w-1.f,fmaxf(0,u*w-.5f)),y=fminf(h-1.f,fmaxf(0,v*h-.5f));int ix=int(x),iy=int(y),jx=min(ix+1,w-1),jy=min(iy+1,h-1);
 return lerp4(lerp4(p[iy*w+ix],p[iy*w+jx],x-ix),lerp4(p[jy*w+ix],p[jy*w+jx],x-ix),y-iy);
}
inline float4 sample(Pyramid p,float u,float v,float lod,bool outside=true){
 if(outside&&(u<0||u>1||v<0||v>1))return make_float4(0,0,0,0);
 lod=fminf(p.n-1.f,fmaxf(0,lod));int a=int(lod),b=min(a+1,p.n-1);
 return lerp4(bilinear(p.p+p.off[a],p.w[a],p.h[a],u,v),bilinear(p.p+p.off[b],p.w[b],p.h[b],u,v),lod-a);
}
inline float rawDep(const float* p,Config s,float u,float v){
 float x=fminf(s.w-1.f,fmaxf(0,u*s.w-.5f)),y=fminf(s.h-1.f,fmaxf(0,v*s.h-.5f));int ix=int(x),iy=int(y),jx=min(ix+1,s.w-1),jy=min(iy+1,s.h-1);
 float d=mixf(mixf(p[iy*s.w+ix],p[iy*s.w+jx],x-ix),mixf(p[jy*s.w+ix],p[jy*s.w+jx],x-ix),y-iy);
 return d;
}
inline float dep(const float* p,Config s,float u,float v){float d=sat(rawDep(p,s,u,v)*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;}

// RGB-guided depth boundary repair. Only two locally flat, separated planes
// are eligible; a sloping depth surface or a third material stays unchanged.
inline float colorDot(float4 a,float4 b){return a.x*b.x+a.y*b.y+a.z*b.z;}
inline float4 colorDiff(float4 a,float4 b){return make_float4(a.x-b.x,a.y-b.y,a.z-b.z,0);}
inline float guidedDep(const float* depths,Pyramid full,Config s,float u,float v){
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

inline float plane(Config s,float m){float inv=1/(m*1000);return s.f[LAST]-(s.f[MATRIXA]+s.f[MATRIXB]*inv)/(s.f[MATRIXC]+s.f[MATRIXD]*inv);}
inline unsigned hash(unsigned x){x^=x>>16;x*=0x7feb352d;x^=x>>15;x*=0x846ca68b;x^=x>>16;return x;}
inline float noise(float x,float y,Config s){float v=sinf(x*127.1f+y*311.7f+s.f[SHIMMERSEED]*17.31f)*43758.5453f;return v-floorf(v);}
inline float shimmer(float u,float v,Config s){
 float x=u*1080/s.f[SHIMMERSIZE],y=v*1080*s.h/s.w/s.f[PIXELASPECT]/s.f[SHIMMERSIZE],ix=floorf(x),iy=floorf(y),tx=x-ix,ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);
 float n=mixf(mixf(noise(ix,iy,s),noise(ix+1,iy,s),tx),mixf(noise(ix,iy+1,s),noise(ix+1,iy+1,s),tx),ty);
 return smooth(1-s.f[SHIMMERDENSITY]-.02f,1-s.f[SHIMMERDENSITY]+.02f,n)*n*n;
}
inline void prefilter(float4* dst,float4* base,const float4* raw,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=mul(raw[id],sat(raw[id].w));c.w=1;base[id]=c;float lum=c.x*.2126f+c.y*.7152f+c.z*.0722f;c=mul(c,1+s.f[HIGHLIGHT]*smooth(.45f,1,lum));c.w=1;dst[id]=c;
}
inline void maskLayer(float4* dst,Pyramid full,const float* depth,Config s,int slice){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.w*s.h)return;
 float4 c=full.p[id];float k=peak(c),fraction=fmaxf(0,k-s.f[THRESHOLD])/fmaxf(k,.00001f);
 if(s.part==1)c=mul(c,1-fraction);if(s.part==2)c=mul(c,fraction);c.w=1;
 float a=1;if(s.depth){float d=guidedDep(depth,full,s,(id%s.w+.5f)/s.w,(id/s.w+.5f)/s.h),t=float(slice)/(s.slices-1);
  if(s.cut){float front=smooth(s.f[CUT]-fmaxf(.00001f,s.f[FEATHER]),s.f[CUT]+fmaxf(.00001f,s.f[FEATHER]),d);a=slice?front:1-front;}
  else a=fmaxf(0,1-fabsf(d-t)*(s.slices-1));
 }dst[id]=mul(c,a);
}
inline void pyramidLevel(Pyramid p,int level){int id=blockIdx.x*blockDim.x+threadIdx.x,w=p.w[level],h=p.h[level];if(id>=w*h)return;
 float u=(id%w+.5f)/w,v=(id/w+.5f)/h;float4 sum=make_float4(0,0,0,0);
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float wx=x==0?6:abs(x)==1?4:1,wy=y==0?6:abs(y)==1?4:1;sum=add(sum,mul(bilinear(p.p+p.off[level-1],p.w[level-1],p.h[level-1],u+float(x)/p.w[level-1],v+float(y)/p.h[level-1]),wx*wy));}
 p.p[p.off[level]+id]=mul(sum,1/256.f);
}
inline void gather(float4* out,Pyramid layer,Pyramid full,const float* depths,const float4* atlas,const float4* pupils,Config s,int slice){
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
inline void finish(float4* out,Pyramid base,Pyramid full,Config s){int id=blockIdx.x*blockDim.x+threadIdx.x;if(id>=s.rw*s.rh)return;float u=(id%s.rw+.5f)/s.rw,v=(id/s.rw+.5f)/s.rh;float4 color=out[id],original=sample(base,u,v,0),light=sample(full,u,v,0);
 float fraction=fmaxf(0,peak(original)-s.f[THRESHOLD])/fmaxf(peak(original),.00001f);if(s.part==1)original=mul(original,1-fraction);if(s.part==2)original=mul(original,fraction);
 if(s.part==3){float coverage=peak(light)>s.f[THRESHOLD]?1:0;out[id]=make_float4(coverage,coverage,coverage,1);return;}
 if(s.part!=1&&s.f[DIFFRACTION]>0){float norm=0;float4 spike=make_float4(0,0,0,0);for(int i=0;i<64;i++){float t=(i/8+.5f)/8,spoke=i%8,angle=s.blades>=3?s.f[ROTATION]+3.14159265f/s.blades+spoke*6.2831853f/8:spoke*2.39996323f,dist=s.f[AIRY]*s.f[DIFFSCALE]*(1+14*t*t),l=log2f(1+s.f[AIRY]*s.f[DIFFSCALE]*(.5f+2*t));float4 a=sample(full,u+cosf(angle)*dist/s.w,v+sinf(angle)*dist/s.h,l);a.x=fmaxf(0,a.x-.6f);a.y=fmaxf(0,a.y-.6f);a.z=fmaxf(0,a.z-.6f);float weight=1/(1+30*t*t);spike=add(spike,mul(a,weight));norm+=weight;}color=add(color,mul(spike,s.f[DIFFRACTION]/fmaxf(norm,1)));}
 if(s.part!=1&&s.f[GHOST]>0){for(int i=0;i<3;i++){float factor=s.f[PAIR0+i*4];if(factor<=0)continue;float mu=.5f-(u-.5f)/factor,mv=.5f-(v-.5f)/factor;float4 sum=make_float4(0,0,0,0);for(int j=0;j<4;j++){float angle=j*1.57079633f,dist=fmaxf(1,s.f[AIRY]*s.f[DIFFSCALE]*3),lod=log2f(1+s.f[AIRY]*s.f[DIFFSCALE]*12);float4 a=sample(full,mu+cosf(angle)*dist/s.w,mv+sinf(angle)*dist/s.h,lod);a.x=fmaxf(0,a.x-.3f);a.y=fmaxf(0,a.y-.3f);a.z=fmaxf(0,a.z-.3f);sum=add(sum,a);}color.x+=sum.x*.25f*s.f[PAIR0+i*4+1]*s.f[GHOST];color.y+=sum.y*.25f*s.f[PAIR0+i*4+2]*s.f[GHOST];color.z+=sum.z*.25f*s.f[PAIR0+i*4+3]*s.f[GHOST];}}
 color=mul(lerp4(original,color,s.f[BLEND]),exp2f(s.f[EXPOSURE]));color.w=1;out[id]=color;
}

template<class Fn> void run(int n,Fn fn){
 #pragma omp parallel for
 for(int i=0;i<n;i++){blockIdx.x=i/256;threadIdx.x=i%256;fn();}
}
struct Buffer{Pyramid p{};std::vector<float4> data;Buffer(int w,int h){int o=0;do{int l=p.n++;p.w[l]=w;p.h[l]=h;p.off[l]=o;o+=w*h;if(w==1&&h==1)break;w=max(1,w/2);h=max(1,h/2);}while(p.n<16);data.resize(o);p.p=data.data();}void build(){for(int l=1;l<p.n;l++)run(p.w[l]*p.h[l],[&](){pyramidLevel(p,l);});}};
void cpuRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,std::vector<float4>& out){
 Buffer full(s.w,s.h),base(s.w,s.h),layer(s.w,s.h);out.assign(s.rw*s.rh,{});
 run(s.w*s.h,[&](){prefilter(full.p.p,base.p.p,input.data(),s);});full.build();base.build();
 for(int i=0;i<s.slices;i++){bool direct=!s.depth&&s.part==0;if(!direct){run(s.w*s.h,[&](){maskLayer(layer.p.p,full.p,depth.data(),s,i);});layer.build();}run(s.rw*s.rh,[&](){gather(out.data(),direct?full.p:layer.p,full.p,depth.data(),atlas.rays.data(),atlas.pupils.data(),s,i);});}
 run(s.rw*s.rh,[&](){finish(out.data(),base.p,full.p,s);});
}
