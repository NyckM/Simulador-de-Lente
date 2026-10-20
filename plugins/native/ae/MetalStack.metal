// Metal port of the layer stack (StackEngine.cu). The pixel code is StackCommon.h itself, shared with the
// CPU and CUDA stacks; this file only gives it Metal address spaces and dispatches one Span of pixels.
#include "MetalPrelude.h"
#ifdef __METAL_VERSION__
#define OPTICS_CONFIG thread const Config&
#define STACK_GLOBAL device
#define STACK_LOCAL thread
#endif
#include "StackTypes.h"
#include "StackCommon.h"
kernel void stackKernel(device const float4* data [[buffer(0)]],device const StackPlane* planes [[buffer(1)]],device const float4* rays [[buffer(2)]],device const float4* pupils [[buffer(3)]],constant StackScene& scene [[buffer(4)]],device float4* out [[buffer(5)]],constant Span& span [[buffer(6)]],uint gid [[thread_position_in_grid]]){
 int i=span.start+int(gid);if(i<span.end)out[i]=stPixel(data,planes,rays,pupils,scene,i);
}
