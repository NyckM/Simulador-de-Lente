#pragma once
#include "Stack.h"
#include <algorithm>
#include <cmath>
// Convert metric data to the native inverse-distance convention before either
// renderer sees it. Config/CUDA ABI and legacy normalized-map behavior stay intact.
inline float metricDepth(float meters,const Config& s,bool clampValue=true){
 float d=(1/std::max(.0001f,meters)-1/s.f[FAR])/(1/s.f[NEAR]-1/s.f[FAR]);
 return clampValue?std::clamp(d,0.f,1.f):d;
}
inline void applyDepthUnits(Config& s,std::vector<float>& depth,ExtraInputs& extra,bool meters,int slices=12){
 if(!meters)return;
 float gain=s.f[DEPTHGAIN],bias=s.f[DEPTHBIAS];
 // Metric data carries its own scale: extend the internal normalization range
 // so a 20m pixel remains behind a 15m Cut even if the UI far limit was 10m.
 auto extend=[&](const std::vector<float>& values){for(float d:values){float m=d*gain+bias;if(std::isfinite(m)&&m>0){s.f[NEAR]=std::min(s.f[NEAR],std::max(.3f,m));s.f[FAR]=std::max(s.f[FAR],m);}}};
 if(s.depth)extend(depth);for(auto& layer:extra.layers)extend(layer.depth);
 s.f[FAR]=std::max(s.f[FAR],s.f[NEAR]+.01f);
 auto convert=[&](std::vector<float>& values){for(auto& d:values)d=metricDepth(std::isfinite(d)?d*gain+bias:s.f[FAR],s);};
 convert(depth);for(auto& layer:extra.layers)convert(layer.depth);
 s.f[CUT]=metricDepth(s.f[CUT],s,false);s.f[DEPTHGAIN]=1;s.f[DEPTHBIAS]=0;
 extra.cutActualDepth=true;s.slices=std::clamp(slices,4,32);
}
