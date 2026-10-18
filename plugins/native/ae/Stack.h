#pragma once
#include "Engine.h"
#include "StackTypes.h"
struct ExtraLayer {std::vector<float4> image;std::vector<float> depth;float distance=0;};
struct ExtraInputs {ExtraLayer layers[3];std::vector<float> glitterMatte;bool meters=true,cutActualDepth=false,depthEdgeSafe=false,glitter=false,normalize=true,distortion=false;float focus=2,glitterGain=1,distortionPixels=20,cutGrow=0,cutFeather=0;};
bool extraActive(Config s,const ExtraInputs& extra);
void stackRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,const ExtraInputs& extra,std::vector<float4>& out,bool cpuOnly);
