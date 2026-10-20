#pragma once
// Common start of the .metal kernels. Under Metal it provides the CUDA/C spellings the engine code uses
// (fminf, make_float4...). Compiled as C++ by MetalEmulation.cpp, the Metal address-space keywords
// disappear, so the same kernel source runs on the CPU and can be compared with cpuRender.
#ifdef __METAL_VERSION__
#include <metal_stdlib>
using namespace metal;
inline float fminf(float a,float b){return fmin(a,b);}
inline float fmaxf(float a,float b){return fmax(a,b);}
inline float fabsf(float x){return fabs(x);}
inline float sqrtf(float x){return sqrt(x);}
inline float expf(float x){return exp(x);}
inline float exp2f(float x){return exp2(x);}
inline float log2f(float x){return log2(x);}
inline float sinf(float x){return sin(x);}
inline float cosf(float x){return cos(x);}
inline float floorf(float x){return floor(x);}
inline float hypotf(float a,float b){return sqrt(a*a+b*b);}
inline float4 make_float4(float x,float y,float z,float w){return float4(x,y,z,w);}
#else
// Standard headers come first: the macros below must not reach them.
#include "Engine.h"
#include <algorithm>
#include <cmath>
using std::min;using std::max;using std::abs;
typedef unsigned uint;
#define kernel
#define device
#define constant const
#define thread
#endif
#include "Config.h"
#include "MetalTypes.h"
