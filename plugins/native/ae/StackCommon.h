#pragma once
#include "StackTypes.h"
#include "OpticalControls.h"
#ifndef STACK_DEVICE
#define STACK_DEVICE inline
#endif
STACK_DEVICE float stSat(float x){return fminf(1,fmaxf(0,x));}
STACK_DEVICE float4 stAdd(float4 a,float4 b){return make_float4(a.x+b.x,a.y+b.y,a.z+b.z,a.w+b.w);}
STACK_DEVICE float4 stMul(float4 a,float k){return make_float4(a.x*k,a.y*k,a.z*k,a.w*k);}
STACK_DEVICE float4 stLerp(float4 a,float4 b,float k){return stAdd(stMul(a,1-k),stMul(b,k));}
STACK_DEVICE float stChannel(float4 a,int c){return c==0?a.x:c==1?a.y:a.z;}
STACK_DEVICE float stLum(float4 a){return .2126f*a.x+.7152f*a.y+.0722f*a.z;}
STACK_DEVICE float4 stBilinear(const float4* data,int w,int h,float u,float v,bool transparent=true){
 if(transparent&&(u<0||u>1||v<0||v>1))return make_float4(0,0,0,0);
 float x=fminf(w-1.f,fmaxf(0,u*w-.5f)),y=fminf(h-1.f,fmaxf(0,v*h-.5f));int ix=int(x),iy=int(y),jx=ix+1<w?ix+1:ix,jy=iy+1<h?iy+1:iy;
 return stLerp(stLerp(data[iy*w+ix],data[iy*w+jx],x-ix),stLerp(data[jy*w+ix],data[jy*w+jx],x-ix),y-iy);
}
STACK_DEVICE float4 stSample(const float4* data,StackPyramid p,float u,float v,float lod){
 if(!p.n)return make_float4(0,0,0,0);if(p.edgeClamp){u=stSat(u);v=stSat(v);}else if(u<0||u>1||v<0||v>1)return make_float4(0,0,0,0);lod=fminf(p.n-1.f,fmaxf(0,lod));int l=int(lod),j=l+1<p.n?l+1:l;
 return stLerp(stBilinear(data+p.off[l],p.w[l],p.h[l],u,v),stBilinear(data+p.off[j],p.w[j],p.h[j],u,v),lod-l);
}
STACK_DEVICE float stPlane(Config s,float m){float inv=1/(fmaxf(.3f,m)*1000);return s.f[LAST]-(s.f[MATRIXA]+s.f[MATRIXB]*inv)/(s.f[MATRIXC]+s.f[MATRIXD]*inv);}
// This is the same signed pupil mapping as the plugin's original renderer.
STACK_DEVICE unsigned stHash(unsigned x){x^=x>>16;x*=0x7feb352d;x^=x>>15;x*=0x846ca68b;return x^(x>>16);}
STACK_DEVICE float stNoise(float x,float y,Config s){float v=sinf(x*127.1f+y*311.7f+s.f[SHIMMERSEED]*17.31f)*43758.5453f;return v-floorf(v);}
STACK_DEVICE float stProcedural(float u,float v,Config s){float x=u*1080/s.f[SHIMMERSIZE],y=v*1080*s.h/s.w/fmaxf(.01f,s.f[PIXELASPECT])/s.f[SHIMMERSIZE],ix=floorf(x),iy=floorf(y),tx=x-ix,ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);float a=stNoise(ix,iy,s)*(1-tx)+stNoise(ix+1,iy,s)*tx,b=stNoise(ix,iy+1,s)*(1-tx)+stNoise(ix+1,iy+1,s)*tx,n=a*(1-ty)+b*ty,t=stSat((n-(1-s.f[SHIMMERDENSITY]-.02f))/.04f);return t*t*(3-2*t)*n*n;}
STACK_DEVICE void stUV(Config s,float4 ray,float4 pupil,float distance,float qx,float qy,int c,float& u,float& v,float& lod,int index=0){
 float aspect=s.h/float(s.w)/fmaxf(.01f,s.f[PIXELASPECT]),fx=(qx-.5f)*2,fy=(.5f-qy)*2*aspect,fr=hypotf(fx,fy),rx=fx/fmaxf(fr,.0001f),ry=fy/fmaxf(fr,.0001f);
 float spread=opticsSpread(s,distance);
 float plane=stPlane(s,distance),fd=s.f[SENSORZ]-plane,dz=s.f[SENSORZ]-s.f[REFERENCE]+s.f[SOURCEFOCUS]-plane;
 float scale=s.f[IRIS]/fmaxf(.0001f,s.f[ATLASIRIS]),chroma=c==0?1:c==2?-1:0,rho=pupil.x*pupil.x+pupil.y*pupil.y;
 float ox=(ray.x+(dz+chroma*s.f[CAAXIAL])*ray.z)*scale,oy=(ray.y+(dz+chroma*s.f[CAAXIAL])*ray.w)*scale;
 float character=2.8f*s.f[IMPRESSION]*fd/sqrtf(fd*fd+.0001f),cs=expf(character*(rho-.5f));ox*=cs;oy*=cs;
 float ps=s.f[IRIS]/fmaxf(.001f,s.f[MAXIRIS]),third=s.f[SPH3]*ps*ps*ps,fifth=s.f[SPH5]*ps*ps*ps*ps*ps;
 ox+=.35f*pupil.x*(third*rho+fifth*rho*rho);oy+=.35f*pupil.y*(third*rho+fifth*rho*rho);
 float radius=fabsf(fd)*s.f[IRIS]/fmaxf(1,plane-s.f[LAST])+.35f*(fabsf(third)+fabsf(fifth));
 float cell=fmaxf(radius,.35f*(3*fabsf(third)*rho+5*fabsf(fifth)*rho*rho));cell=fmaxf(cell,hypotf(ox,oy))*fmaxf(1,cs*fabsf(1+2*character*rho));float stretch=1+s.f[SWIRL]*fr;cell*=stretch*(1+.6f*s.f[COMA]*hypotf(ox,oy)*stretch);
 float footprint=fabsf(s.f[GAIN])*s.w/s.f[SENSORMM]*2.2f/sqrtf(float(s.samples));lod=fmaxf(0,log2f(fmaxf(1,cell*footprint*spread*((s.soften?1.6f:1)+.8f*(fabsf(third)+fabsf(fifth))))));
 lod=fmaxf(lod,log2f(fmaxf(1,fmaxf(s.w/float(s.rw),s.h/float(s.rh)))));
 if(fr>.0001f){float ra=ox*rx+oy*ry,ta=-ox*ry+oy*rx;ox=ra*rx/stretch-ta*ry*stretch;oy=ra*ry/stretch+ta*rx*stretch;float coma=s.f[COMA]*(ox*ox+oy*oy)*.3f;ox+=coma*rx;oy+=coma*ry;}
 ox=ox/fmaxf(1,s.f[SQUEEZE])*s.f[GAIN];oy*=s.f[GAIN];
 if(s.dither){unsigned seed=stHash(unsigned(stSat(qx)*s.w)^stHash(unsigned(stSat(qy)*s.h))^stHash(index+17));float angle=float(seed)/4294967296.f*6.2831853f,rr=sqrtf(float(stHash(seed))/4294967296.f),t=stSat((radius*fabsf(s.f[GAIN])*s.w/s.f[SENSORMM]-.5f)/1.5f),amp=cell*fabsf(s.f[GAIN])*2.2f/sqrtf(float(s.samples))*s.f[DITHERAMOUNT]*t*t*(3-2*t);ox+=cosf(angle)*rr*amp;oy+=sinf(angle)*rr*amp;}
 ox*=spread;oy*=spread;
 u=qx-ox/s.f[SENSORMM];v=qy+oy/(s.f[SENSORMM]*aspect);
 float ca=(c==0?s.f[CARED]:c==2?s.f[CABLUE]:0)*.01f*spread;u+=(qx-.5f)*ca;v+=(qy-.5f)*ca;
}
STACK_DEVICE float4 stOver(float4 front,float4 back){return stAdd(front,stMul(back,1-stSat(front.w)));}
STACK_DEVICE float4 stLayer(const float4* data,const StackPlane* planes,StackScene scene,int layer,float4 ray,float4 pupil,float qx,float qy,int c,int index=0){
 float4 result=make_float4(0,0,0,0);for(int j=0;j<scene.count[layer];j++){auto p=planes[scene.start[layer]+j];float u,v,lod;stUV(scene.config,ray,pupil,p.distance,qx,qy,c,u,v,lod,index);result=stOver(stSample(data,p.color,u,v,lod),result);}return result;
}
STACK_DEVICE float4 stPixel(const float4* data,const StackPlane* planes,const float4* rays,const float4* pupils,StackScene scene,int id){
 Config s=scene.config;float ux=(id%s.rw+.5f)/s.rw,uy=(id/s.rw+.5f)/s.rh,aspect=s.h/float(s.w)/fmaxf(.01f,s.f[PIXELASPECT]);
 float px=(ux-.5f)*2,py=(uy-.5f)*2*aspect,r=px*px+py*py;
 float qx=(px*(1+s.f[K1]*r+s.f[K2]*r*r)+2*s.f[P1]*px*py+s.f[P2]*(r+2*px*px))/2+.5f;
 float qy=(py*(1+s.f[K1]*r+s.f[K2]*r*r)+s.f[P1]*(r+2*py*py)+2*s.f[P2]*px*py)/(2*aspect)+.5f;
 float sums[3]{},norms[3]{},alpha=0,anorm=0;
 for(int i=0;i<s.samples;i++){
  int idx=int((i+.5f)*s.taps/s.samples);float shiftX=0,shiftY=0;
  float gu=(stSat(qx)*(s.grid-1)+.5f)/s.grid,gv=(stSat(1-qy)*(s.grid-1)+.5f)/s.grid;
  if(scene.distortion&&scene.count[3]&&scene.distortionPixels>0){
   auto ray=stBilinear(rays+(s.taps+idx)*s.grid*s.grid,s.grid,s.grid,gu,gv,false);auto pupil=stBilinear(pupils+(s.taps+idx)*s.grid*s.grid,s.grid,s.grid,gu,gv,false);
   float dx=0,dy=0;for(int j=0;j<scene.count[3];j++){
    auto p=planes[scene.start[3]+j];float u,v,lod;stUV(s,ray,pupil,p.distance,qx,qy,1,u,v,lod,idx);
    dx+=4*(stLum(stSample(data,p.color,u+1.f/s.w,v,lod))-stLum(stSample(data,p.color,u-1.f/s.w,v,lod)));
    dy+=4*(stLum(stSample(data,p.color,u,v+1.f/s.h,lod))-stLum(stSample(data,p.color,u,v-1.f/s.h,lod)));
   }
   float scale=scene.distortionPixels/fmaxf(1,hypotf(dx,dy));shiftX=dx*scale/s.w;shiftY=dy*scale/s.h;
  }
  for(int c=0;c<3;c++){
   auto ray=stBilinear(rays+(c*s.taps+idx)*s.grid*s.grid,s.grid,s.grid,gu,gv,false);auto pupil=stBilinear(pupils+(c*s.taps+idx)*s.grid*s.grid,s.grid,s.grid,gu,gv,false);
   float4 a=make_float4(0,0,0,0),glitter=scene.glitter?stLayer(data,planes,scene,1,ray,pupil,qx+shiftX,qy+shiftY,c,idx):make_float4(0,0,0,0);
   for(int j=0;j<scene.count[0];j++){
    auto p=planes[scene.start[0]+j];float u,v,lod;stUV(s,ray,pupil,p.distance,qx+shiftX,qy+shiftY,c,u,v,lod,idx);auto light=stSample(data,p.color,u,v,lod);
    if(s.f[SHIMMER]>0&&!scene.glitter){float su,sv,sl;stUV(s,ray,pupil,s.f[SHIMMERDEPTH],qx+shiftX,qy+shiftY,c,su,sv,sl,idx);float peak=fmaxf(light.x,fmaxf(light.y,light.z)),factor=1+s.f[SHIMMER]*fmaxf(0,peak-s.f[SHIMMERTHRESHOLD])/fmaxf(peak,.00001f)*stProcedural(su,sv,s);light.x*=factor;light.y*=factor;light.z*=factor;}

    if(scene.glitter){float gate=fmaxf(0,stSample(data,scene.gate,u,v,lod).x),add=scene.glitterGain*gate;float factor=1+add*stChannel(glitter,c);if(scene.normalize)factor/=1+add*scene.glitterMean;light.x*=factor;light.y*=factor;light.z*=factor;}
    a=stOver(light,a);
   }
   for(int layer=1;layer<4;layer++){if((layer==1&&scene.glitter)||(layer==3&&scene.distortion))continue;a=stOver(stLayer(data,planes,scene,layer,ray,pupil,qx+shiftX,qy+shiftY,c,idx),a);}
   float rho=pupil.x*pupil.x+pupil.y*pupil.y,t=stSat((rho-.25f)/.6f);t=t*t*(3-2*t);float weight=opticsTexture(s,pupil.x,pupil.y)*pupil.z*expf(-s.f[APOD]*rho*4)*(1+s.f[RIM]*t);
   sums[c]+=stChannel(a,c)*weight*pupil.w;norms[c]+=weight;if(c==1){alpha+=a.w*weight;anorm+=weight;}
  }
 }
 float4 original=stSample(data,scene.original,ux,uy,0),out=make_float4(sums[0]/fmaxf(.0001f,norms[0]),sums[1]/fmaxf(.0001f,norms[1]),sums[2]/fmaxf(.0001f,norms[2]),stSat(alpha/fmaxf(.0001f,anorm)));
 float a=out.w;out=stLerp(original,out,stSat(s.f[BLEND]));out.x*=exp2f(s.f[EXPOSURE]);out.y*=exp2f(s.f[EXPOSURE]);out.z*=exp2f(s.f[EXPOSURE]);out.w=stSat(original.w*(1-stSat(s.f[BLEND]))+a*stSat(s.f[BLEND]));return out;
}
