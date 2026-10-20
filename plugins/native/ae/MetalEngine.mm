// Metal backend on macOS (MetalEngine.h): runs MetalEngine.metal and MetalStack.metal, precompiled by
// build-macos.sh into Contents/Resources/BruxosdovfxDesfoque.metallib, in the order of MetalSchedule.h.
// Buffers use shared storage, so on Apple Silicon the GPU works on the same memory as the host copy.
// Without a device or library, or with BRUXOS_DISABLE_METAL set, init fails and the plugin uses the CPU.
#import <Foundation/Foundation.h>
#import <Metal/Metal.h>
#include "Engine.h"
#include "MetalEngine.h"
#include "MetalSchedule.h"
#include <dlfcn.h>
#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <cstring>
#include <mutex>
#include <string>
namespace {
id<MTLDevice> device;id<MTLCommandQueue> queue;
id<MTLComputePipelineState> prefilterKernel,maskKernel,levelKernel,gatherKernel,finishKernel,stackKernel;
std::string deviceName;std::once_flag once;int status=1;

std::string libraryPath(){
 Dl_info info{};if(!dladdr(reinterpret_cast<void*>(&libraryPath),&info)||!info.dli_fname)return {};
 std::string path=info.dli_fname;return path.substr(0,path.find_last_of('/'))+"/../Resources/BruxosdovfxDesfoque.metallib";
}
id<MTLComputePipelineState> pipeline(id<MTLLibrary> library,const char* name){
 id<MTLFunction> function=[library newFunctionWithName:[NSString stringWithUTF8String:name]];if(!function)return nil;
 NSError* error=nil;return [device newComputePipelineStateWithFunction:function error:&error];
}
void setup(){@autoreleasepool{
 const char* off=std::getenv("BRUXOS_DISABLE_METAL");if(off&&*off&&std::strcmp(off,"0"))return;
 device=MTLCreateSystemDefaultDevice();if(!device)return;
 NSError* error=nil;id<MTLLibrary> library=[device newLibraryWithURL:[NSURL fileURLWithPath:[NSString stringWithUTF8String:libraryPath().c_str()]] error:&error];if(!library)return;
 prefilterKernel=pipeline(library,"prefilter");maskKernel=pipeline(library,"maskLayer");levelKernel=pipeline(library,"pyramidLevel");
 gatherKernel=pipeline(library,"gather");finishKernel=pipeline(library,"finish");stackKernel=pipeline(library,"stackKernel");
 queue=[device newCommandQueue];
 if(!prefilterKernel||!maskKernel||!levelKernel||!gatherKernel||!finishKernel||!stackKernel||!queue)return;
 deviceName=device.name.UTF8String;status=0;
}}
bool reserve(id<MTLBuffer> __strong& buffer,size_t bytes){
 if(buffer&&buffer.length>=bytes)return true;
 buffer=[device newBufferWithLength:std::max<size_t>(bytes,16) options:MTLResourceStorageModeShared];return buffer!=nil;
}

// Encodes into one command buffer until flush(), which submits it and waits for the result.
struct Commands {
 id<MTLCommandBuffer> commands;id<MTLComputeCommandEncoder> encoder;
 id<MTLComputeCommandEncoder> use(id<MTLComputePipelineState> kernel){
  if(!commands)commands=[queue commandBuffer];if(!commands)return nil;
  if(!encoder)encoder=[commands computeCommandEncoder];[encoder setComputePipelineState:kernel];return encoder;
 }
 static bool dispatch(id<MTLComputeCommandEncoder> e,id<MTLComputePipelineState> kernel,int threads){
  if(!e)return false;if(threads<=0)return true;NSUInteger group=std::min<NSUInteger>(256,kernel.maxTotalThreadsPerThreadgroup);
  [e dispatchThreadgroups:MTLSizeMake((NSUInteger(threads)+group-1)/group,1,1) threadsPerThreadgroup:MTLSizeMake(group,1,1)];return true;
 }
 bool flush(){
  if(!commands)return true;if(encoder){[encoder endEncoding];encoder=nil;}
  [commands commit];[commands waitUntilCompleted];bool ok=commands.status==MTLCommandBufferStatusCompleted;commands=nil;return ok;
 }
};

struct Engine {id<MTLBuffer> raw,depth,rays,pupils,out,full,base,layer;Levels levels{};int w=0,h=0;} engine;
struct Frame : Commands {
 const Config& s;
 explicit Frame(const Config& config):s(config){}
 id<MTLBuffer> pyramid(int p){return p==FULL_PYRAMID?engine.full:p==BASE_PYRAMID?engine.base:engine.layer;}
 bool prefilter(){auto e=use(prefilterKernel);[e setBuffer:engine.full offset:0 atIndex:0];[e setBuffer:engine.base offset:0 atIndex:1];[e setBuffer:engine.raw offset:0 atIndex:2];[e setBytes:&s length:sizeof(Config) atIndex:3];return dispatch(e,prefilterKernel,s.w*s.h);}
 bool level(int p,int l){auto e=use(levelKernel);[e setBuffer:pyramid(p) offset:0 atIndex:0];[e setBytes:&engine.levels length:sizeof(Levels) atIndex:1];[e setBytes:&l length:sizeof(int) atIndex:2];return dispatch(e,levelKernel,engine.levels.w[l]*engine.levels.h[l]);}
 bool mask(int slice){auto e=use(maskKernel);[e setBuffer:engine.layer offset:0 atIndex:0];[e setBuffer:engine.full offset:0 atIndex:1];[e setBuffer:engine.depth offset:0 atIndex:2];[e setBytes:&s length:sizeof(Config) atIndex:3];[e setBytes:&slice length:sizeof(int) atIndex:4];return dispatch(e,maskKernel,s.w*s.h);}
 bool gather(bool direct,int slice,Span span){
  auto e=use(gatherKernel);[e setBuffer:engine.out offset:0 atIndex:0];[e setBuffer:direct?engine.full:engine.layer offset:0 atIndex:1];[e setBytes:&engine.levels length:sizeof(Levels) atIndex:2];
  [e setBuffer:engine.full offset:0 atIndex:3];[e setBytes:&engine.levels length:sizeof(Levels) atIndex:4];[e setBuffer:engine.depth offset:0 atIndex:5];[e setBuffer:engine.rays offset:0 atIndex:6];[e setBuffer:engine.pupils offset:0 atIndex:7];
  [e setBytes:&s length:sizeof(Config) atIndex:8];[e setBytes:&slice length:sizeof(int) atIndex:9];[e setBytes:&span length:sizeof(Span) atIndex:10];return dispatch(e,gatherKernel,span.end-span.start);
 }
 bool finish(){auto e=use(finishKernel);[e setBuffer:engine.out offset:0 atIndex:0];[e setBuffer:engine.base offset:0 atIndex:1];[e setBytes:&engine.levels length:sizeof(Levels) atIndex:2];[e setBuffer:engine.full offset:0 atIndex:3];[e setBytes:&engine.levels length:sizeof(Levels) atIndex:4];[e setBytes:&s length:sizeof(Config) atIndex:5];return dispatch(e,finishKernel,s.rw*s.rh);}
};

struct StackBuffers {id<MTLBuffer> data,planes,rays,pupils,out;} stackBuffers;
struct Stack : Commands {
 const StackScene* scene;
 explicit Stack(const StackScene* sc):scene(sc){}
 bool stack(Span span){
  auto e=use(stackKernel);[e setBuffer:stackBuffers.data offset:0 atIndex:0];[e setBuffer:stackBuffers.planes offset:0 atIndex:1];[e setBuffer:stackBuffers.rays offset:0 atIndex:2];[e setBuffer:stackBuffers.pupils offset:0 atIndex:3];
  [e setBytes:scene length:sizeof(StackScene) atIndex:4];[e setBuffer:stackBuffers.out offset:0 atIndex:5];[e setBytes:&span length:sizeof(Span) atIndex:6];return dispatch(e,stackKernel,span.end-span.start);
 }
};
}

extern "C" {
int bruxos_metal_init(){std::call_once(once,setup);return status;}
const char* bruxos_gpu_device(){return bruxos_metal_init()?nullptr:deviceName.c_str();}
int bruxos_metal_source(const float* rgba,const float* depth,int w,int h){@autoreleasepool{
 if(bruxos_metal_init())return 1;size_t n=size_t(w)*h;
 if(!reserve(engine.raw,n*sizeof(float4))||!reserve(engine.depth,n*sizeof(float)))return 1;
 std::memcpy(engine.raw.contents,rgba,n*sizeof(float4));
 if(depth)std::memcpy(engine.depth.contents,depth,n*sizeof(float));else std::memset(engine.depth.contents,0,n*sizeof(float));
 if(w!=engine.w||h!=engine.h){
  engine.w=engine.h=0;int total=0;engine.levels=metalLevels(w,h,total);size_t bytes=size_t(total)*sizeof(float4);
  if(!reserve(engine.full,bytes)||!reserve(engine.base,bytes)||!reserve(engine.layer,bytes))return 1;engine.w=w;engine.h=h;
 }
 return 0;
}}
int bruxos_metal_atlas(const float* rays,const float* pupils,int count){@autoreleasepool{
 size_t bytes=size_t(count)*sizeof(float4);
 if(bruxos_metal_init()||!reserve(engine.rays,bytes)||!reserve(engine.pupils,bytes))return 1;
 std::memcpy(engine.rays.contents,rays,bytes);std::memcpy(engine.pupils.contents,pupils,bytes);return 0;
}}
int bruxos_metal_render(Config* config,float* output,float* ms){@autoreleasepool{
 auto begin=std::chrono::steady_clock::now();Config s=*config;
 if(bruxos_metal_init()||!engine.raw||!engine.rays||s.w!=engine.w||s.h!=engine.h)return 1;
 size_t bytes=size_t(s.rw)*s.rh*sizeof(float4);if(!reserve(engine.out,bytes))return 1;
 Frame frame(s);bool ok=metalRender(frame,s,engine.levels);frame.flush();if(!ok)return 1;
 std::memcpy(output,engine.out.contents,bytes);
 *ms=std::chrono::duration<float,std::milli>(std::chrono::steady_clock::now()-begin).count();return 0;
}}
int bruxos_metal_stack(const StackScene* scene,const StackPlane* planes,int count,const float4* data,int pixels,const float4* rays,const float4* pupils,int atlasSize,float4* output){@autoreleasepool{
 if(bruxos_metal_init())return 1;int n=scene->config.rw*scene->config.rh;
 size_t dataBytes=size_t(pixels)*sizeof(float4),planeBytes=size_t(count)*sizeof(StackPlane),atlasBytes=size_t(atlasSize)*sizeof(float4),outBytes=size_t(n)*sizeof(float4);
 if(!reserve(stackBuffers.data,dataBytes)||!reserve(stackBuffers.planes,planeBytes)||!reserve(stackBuffers.rays,atlasBytes)||!reserve(stackBuffers.pupils,atlasBytes)||!reserve(stackBuffers.out,outBytes))return 1;
 std::memcpy(stackBuffers.data.contents,data,dataBytes);std::memcpy(stackBuffers.planes.contents,planes,planeBytes);
 std::memcpy(stackBuffers.rays.contents,rays,atlasBytes);std::memcpy(stackBuffers.pupils.contents,pupils,atlasBytes);
 int total=0;for(int c:scene->count)total+=c;
 Stack stack(scene);bool ok=metalStack(stack,n,scene->config.rw,scene->config.samples,total);stack.flush();if(!ok)return 1;
 std::memcpy(output,stackBuffers.out.contents,outBytes);return 0;
}}
}
