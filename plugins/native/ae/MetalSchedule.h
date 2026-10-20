#pragma once
// Frame schedule shared by the Metal host (MetalEngine.mm) and its CPU emulation (MetalEmulation.cpp):
// which kernel runs over which pixels, in the order of cpuRender (CpuEngine.generated.cpp).
#include "Config.h"
#include "MetalTypes.h"
#include <algorithm>
enum MetalPyramid {FULL_PYRAMID,BASE_PYRAMID,LAYER_PYRAMID};
inline Levels metalLevels(int w,int h,int& total){
 Levels p{};total=0;do{int l=p.n++;p.w[l]=w;p.h[l]=h;p.off[l]=total;total+=w*h;if(w==1&&h==1)break;w=std::max(1,w/2);h=std::max(1,h/2);}while(p.n<16);return p;
}
// Sample evaluations per command buffer: enough to keep the GPU busy, small enough to stay far from the
// system GPU watchdog while Resolve also draws. A band is at least one row.
inline int metalBand(int width,double workPerPixel){return std::max(width,int(std::min(double(1<<30),double(1<<28)/std::max(1.,workPerPixel))));}

// B encodes kernels: prefilter(), level(pyramid,level), mask(slice), gather(direct,slice,span), finish();
// flush() submits what was encoded and waits for it. Every call returns false on failure.
template<class B> bool metalRender(B& b,const Config& s,const Levels& levels){
 if(!b.prefilter())return false;
 for(int p:{FULL_PYRAMID,BASE_PYRAMID})for(int l=1;l<levels.n;l++)if(!b.level(p,l))return false;
 bool direct=!s.depth&&s.part==0;int pixels=s.rw*s.rh,band=metalBand(s.rw,3.*s.samples);
 for(int i=0;i<s.slices;i++){
  if(!direct){if(!b.mask(i))return false;for(int l=1;l<levels.n;l++)if(!b.level(LAYER_PYRAMID,l))return false;}
  for(int start=0;start<pixels;start+=band)if(!b.gather(direct,i,Span{start,std::min(pixels,start+band)})||!b.flush())return false;
 }
 return b.finish()&&b.flush();
}
// Layer stack: one kernel over all output pixels, in bands. planes = total color planes in the scene.
template<class B> bool metalStack(B& b,int pixels,int width,int samples,int planes){
 int band=metalBand(width,3.*samples*std::max(1,planes));
 for(int start=0;start<pixels;start+=band)if(!b.stack(Span{start,std::min(pixels,start+band)})||!b.flush())return false;
 return true;
}
