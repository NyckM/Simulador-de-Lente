#pragma once
// Metal backend, with the entry points of the CUDA engine (optica_cuda_*, bruxos_stack_render). Implemented
// by MetalEngine.mm on macOS and by MetalEmulation.cpp for tests. Every call returns 0 on success; on
// failure the caller renders the frame on the CPU.
#include "Config.h"
#include "StackTypes.h"
struct float4;
extern "C" {
int bruxos_metal_init();
int bruxos_metal_source(const float* rgba,const float* depth,int w,int h);
int bruxos_metal_atlas(const float* rays,const float* pupils,int count);
int bruxos_metal_render(Config* config,float* output,float* ms);
int bruxos_metal_stack(const StackScene* scene,const StackPlane* planes,int count,const float4* data,int pixels,const float4* rays,const float4* pupils,int atlasSize,float4* output);
// Exported: the GPU name, or null when there is no usable Metal device (or BRUXOS_DISABLE_METAL is set).
__attribute__((visibility("default"))) const char* bruxos_gpu_device();
}
