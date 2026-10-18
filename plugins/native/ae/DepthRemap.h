#pragma once
#include "DepthUnits.h"
#include <limits>
// Data remapping only. Metric maps and legacy defaults keep their exact path.
inline void remapRelativeDepth(Config& s,std::vector<float>& depth,ExtraInputs& extra,bool meters,bool normalize,float gamma,bool linearDistance){
 if(meters||(!normalize&&gamma==1&&!linearDistance))return;
 const float gain=s.f[DEPTHGAIN],bias=s.f[DEPTHBIAS];const bool invert=s.invert!=0;
 auto remap=[&](std::vector<float>& map){
  if(map.empty())return;
  float lo=std::numeric_limits<float>::infinity(),hi=-lo;
  if(normalize)for(float d:map){float v=d*gain+bias;if(std::isfinite(v)){lo=std::min(lo,v);hi=std::max(hi,v);}}
  const bool stretch=normalize&&std::isfinite(lo)&&std::isfinite(hi)&&hi-lo>1e-6f;
  for(auto& d:map){float v=d*gain+bias;bool valid=std::isfinite(v);if(!valid){d=0;continue;}if(stretch)v=(v-lo)/(hi-lo);v=std::clamp(v,0.f,1.f);if(invert)v=1-v;v=std::pow(v,std::clamp(gamma,.1f,5.f));if(linearDistance)v=metricDepth(s.f[NEAR]+(1-v)*(s.f[FAR]-s.f[NEAR]),s);d=v;}
 };
 remap(depth);for(auto& layer:extra.layers)remap(layer.depth);
 // Cut is expressed in the processed white-near map, before distance conversion.
 if(linearDistance&&s.f[CUT]>=0&&s.f[CUT]<=1)s.f[CUT]=metricDepth(s.f[NEAR]+(1-std::clamp(s.f[CUT],0.f,1.f))*(s.f[FAR]-s.f[NEAR]),s);
 s.f[DEPTHGAIN]=1;s.f[DEPTHBIAS]=0;s.invert=0;
}
