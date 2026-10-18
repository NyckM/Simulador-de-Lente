#include <cuda_runtime.h>
#include <math.h>
#include "StackTypes.h"
#define STACK_DEVICE __device__
#include "StackCommon.h"
static float4 *data_=nullptr,*rays_=nullptr,*pupils_=nullptr,*output_=nullptr;
static StackPlane* planes_=nullptr;static size_t dc_=0,rc_=0,pc_=0,oc_=0,lc_=0;
template<class T> int reserve(T*& p,size_t& capacity,size_t size){if(size>capacity){if(p)cudaFree(p);if(cudaMalloc((void**)&p,size)!=cudaSuccess){p=nullptr;capacity=0;return 1;}capacity=size;}return 0;}
__global__ void stackKernel(const float4* data,const StackPlane* planes,const float4* rays,const float4* pupils,StackScene scene,float4* out){int i=blockIdx.x*blockDim.x+threadIdx.x;if(i<scene.config.rw*scene.config.rh)out[i]=stPixel(data,planes,rays,pupils,scene,i);}
extern "C" __declspec(dllexport) int bruxos_stack_render(const StackScene* scene,const StackPlane* planes,int count,const float4* data,int pixels,const float4* rays,const float4* pupils,int atlasSize,float4* output){
 if(cudaSetDevice(0)!=cudaSuccess)return 1;size_t bytes=size_t(pixels)*sizeof(float4),atlas=size_t(atlasSize)*sizeof(float4),out=size_t(scene->config.rw)*scene->config.rh*sizeof(float4);
 if(reserve(data_,dc_,bytes)||reserve(rays_,rc_,atlas)||reserve(pupils_,pc_,atlas)||reserve(output_,oc_,out)||reserve(planes_,lc_,size_t(count)*sizeof(StackPlane)))return 1;
 if(cudaMemcpy(data_,data,bytes,cudaMemcpyHostToDevice)!=cudaSuccess||cudaMemcpy(rays_,rays,atlas,cudaMemcpyHostToDevice)!=cudaSuccess||cudaMemcpy(pupils_,pupils,atlas,cudaMemcpyHostToDevice)!=cudaSuccess||cudaMemcpy(planes_,planes,count*sizeof(StackPlane),cudaMemcpyHostToDevice)!=cudaSuccess)return 1;
 int n=scene->config.rw*scene->config.rh;stackKernel<<<(n+255)/256,256>>>(data_,planes_,rays_,pupils_,*scene,output_);
 if(cudaGetLastError()!=cudaSuccess||cudaMemcpy(output,output_,out,cudaMemcpyDeviceToHost)!=cudaSuccess)return 1;return 0;
}

extern "C" __declspec(dllexport) int bruxos_stack_abi(){return 3;}
