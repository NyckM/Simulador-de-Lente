#pragma once
#include "Config.h"
#include <vector>
#include <string>
#include <memory>
struct float4{float x,y,z,w;};
inline float4 make_float4(float x,float y,float z,float w){return{x,y,z,w};}
struct OpticalSettings {int preset=0,blades=7,grid=5,taps=128,edit=0;double iris=6,source=5,sensor=36,aspect=1.6,rotation=0,dispersion=0,softness=0,curvature=1,spacing=1,diameter=1,indexOffset=0,coating=0,coatingNm=550;bool soften=true;};
struct Atlas{OpticalSettings optics;std::vector<float4> rays,pupils;double matrix[4],last,reference,sourcePlane,focal,iris,maxIris;};
std::shared_ptr<const Atlas> makeAtlas(const OpticalSettings& settings);
double focusPlane(const Atlas& a,double distance);
void cpuRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,std::vector<float4>& out);
void nativeRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,std::vector<float4>& out,bool cpuOnly);
