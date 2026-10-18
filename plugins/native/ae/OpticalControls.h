#pragma once
#include <cmath>
#ifdef __CUDACC__
#define OPTICS_INLINE __host__ __device__ inline
#else
#define OPTICS_INLINE inline
#endif
OPTICS_INLINE float opticsSpread(const Config& s,float distance){
 // Zero focus distance marks the legacy ABI/default-constructed test configuration.
 if(s.f[FOCUSDIST]<=0)return 1;
 float t=fminf(1,fmaxf(0,fabsf(1/fmaxf(distance,1e-6f)-1/s.f[FOCUSDIST])/fmaxf(s.f[FOCUSWIDTH],1e-6f)));
 float ramp=t*t*(3-2*t),side=(distance<s.f[FOCUSDIST]?s.f[FG_BLUR]:s.f[BG_BLUR])*.01f;
 return (1-s.f[FOCUSKEEP]*(1-ramp))*(1+(side-1)*ramp);
}
OPTICS_INLINE float opticsTexture(const Config& s,float x,float y){
 if(s.f[TEXRINGS]==0&&s.f[TEXGRAIN]==0)return 1;
 float angle=s.f[TEXROT]*.017453292519943295f,c=cosf(angle),sn=sinf(angle),xx=(x*c+y*sn)*s.f[TEXSCALE],yy=(-x*sn+y*c)*s.f[TEXSCALE];
 float radial=.5f+.5f*cosf(6.283185307179586f*hypotf(xx,yy));
 float grain=.5f+.25f*sinf(2.17f*xx+.7f)*sinf(1.73f*yy+1.3f)+.25f*sinf(4.31f*xx+1.9f)*sinf(3.11f*yy-.4f);
 return (1-s.f[TEXRINGS]*.8f*(1-radial))*(1-s.f[TEXGRAIN]*.7f*(1-grain));
}
