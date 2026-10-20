// CPU emulation of the Metal backend, to check the Metal kernels without a Mac: MetalEngine.metal and
// MetalStack.metal compiled as C++, run by the same schedule as MetalEngine.mm (MetalSchedule.h).
// Test build (Linux): compile the OFX plugin with -DBRUXOS_METAL -fopenmp and this file in place of
// MetalEngine.mm, then run ofx/HostTest without --cpu-fallback: its CPU/GPU agreement checks compare these
// kernels with cpuRender and the CPU layer stack. Never part of a shipped plugin.
#include "Engine.h"
#include "MetalEngine.h"
#include "MetalSchedule.h"
#include "OpticalControls.h"
#include "StackTypes.h"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <vector>
// Own namespace: the kernel helpers (sat, add, sample...) must not meet CpuEngine's inline functions.
// Every header they include is already included above, so only the kernel code lands in it.
namespace metal_emulation {
#include "MetalEngine.metal"
#include "MetalStack.metal"
}
namespace {
namespace k=metal_emulation;
template<class F> void each(int n,F f){
 #pragma omp parallel for
 for(int i=0;i<n;i++)f(i);
}
struct State {std::vector<float4> raw,rays,pupils,full,base,layer;std::vector<float> depth;Levels levels{};int w=0,h=0;} state;
struct Frame {
 const Config& s;float4* out;
 std::vector<float4>& pyramid(int p){return p==FULL_PYRAMID?state.full:p==BASE_PYRAMID?state.base:state.layer;}
 bool prefilter(){each(s.w*s.h,[&](int i){k::prefilter(state.full.data(),state.base.data(),state.raw.data(),s,unsigned(i));});return true;}
 bool level(int p,int l){float4* data=pyramid(p).data();each(state.levels.w[l]*state.levels.h[l],[&](int i){k::pyramidLevel(data,state.levels,l,unsigned(i));});return true;}
 bool mask(int slice){each(s.w*s.h,[&](int i){k::maskLayer(state.layer.data(),state.full.data(),state.depth.data(),s,slice,unsigned(i));});return true;}
 bool gather(bool direct,int slice,Span span){const float4* layer=(direct?state.full:state.layer).data();each(span.end-span.start,[&](int i){k::gather(out,layer,state.levels,state.full.data(),state.levels,state.depth.data(),state.rays.data(),state.pupils.data(),s,slice,span,unsigned(i));});return true;}
 bool finish(){each(s.rw*s.rh,[&](int i){k::finish(out,state.base.data(),state.levels,state.full.data(),state.levels,s,unsigned(i));});return true;}
 bool flush(){return true;}
};
}

extern "C" {
int bruxos_metal_init(){const char* off=std::getenv("BRUXOS_DISABLE_METAL");return off&&*off&&std::strcmp(off,"0")?1:0;}
const char* bruxos_gpu_device(){return bruxos_metal_init()?nullptr:"CPU emulation of the Metal kernels";}
int bruxos_metal_source(const float* rgba,const float* depth,int w,int h){
 size_t n=size_t(w)*h;auto pixels=reinterpret_cast<const float4*>(rgba);state.raw.assign(pixels,pixels+n);
 if(depth)state.depth.assign(depth,depth+n);else state.depth.assign(n,0.f);
 if(w!=state.w||h!=state.h){int total=0;state.levels=metalLevels(w,h,total);for(auto* p:{&state.full,&state.base,&state.layer})p->assign(total,float4{});state.w=w;state.h=h;}
 return 0;
}
int bruxos_metal_atlas(const float* rays,const float* pupils,int count){
 auto r=reinterpret_cast<const float4*>(rays),p=reinterpret_cast<const float4*>(pupils);state.rays.assign(r,r+count);state.pupils.assign(p,p+count);return 0;
}
int bruxos_metal_render(Config* config,float* output,float* ms){
 auto begin=std::chrono::steady_clock::now();Config s=*config;
 if(state.raw.empty()||state.rays.empty()||s.w!=state.w||s.h!=state.h)return 1;
 std::vector<float4> out(size_t(s.rw)*s.rh,float4{});Frame frame{s,out.data()};
 if(!metalRender(frame,s,state.levels))return 1;
 std::memcpy(output,out.data(),out.size()*sizeof(float4));
 *ms=std::chrono::duration<float,std::milli>(std::chrono::steady_clock::now()-begin).count();return 0;
}
int bruxos_metal_stack(const StackScene* scene,const StackPlane* planes,int,const float4* data,int,const float4* rays,const float4* pupils,int,float4* output){
 struct Stack {const StackScene* scene;const StackPlane* planes;const float4 *data,*rays,*pupils;float4* out;
  bool stack(Span span){each(span.end-span.start,[&](int i){k::stackKernel(data,planes,rays,pupils,*scene,out,span,unsigned(i));});return true;}
  bool flush(){return true;}} stack{scene,planes,data,rays,pupils,output};
 int total=0;for(int count:scene->count)total+=count;
 return metalStack(stack,scene->config.rw*scene->config.rh,scene->config.rw,scene->config.samples,total)?0:1;
}
}
