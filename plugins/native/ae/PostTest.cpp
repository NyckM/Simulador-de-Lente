#include "PostEffects.h"
#include <fstream>
#include <iostream>
#include <stdexcept>
int main(int argc,char** argv){try{
 const int w=32,h=24;Config config{};config.w=config.rw=w;config.h=config.rh=h;config.f[BLEND]=1;std::vector<float4> source(w*h);for(int y=0;y<h;y++)for(int x=0;x<w;x++){int yy=h-1-y;source[y*w+x]={float(.1+.8*x/(w-1)),float(.1+.7*yy/(h-1)),float(.2+.4*((x+yy)%5)/4.),1};}
 Atlas dummy{};for(int kind=0;kind<=15;kind++){auto out=source;PostSettings f;f.kind=kind;f.x=.43;f.y=.58;f.scale=.9;f.rotation=27;f.amount=.35;f.radius=.11;f.shift=.08;f.threshold=.15;postRender(f,config,dummy,out);std::ofstream file(std::string(argv[1])+"/filter-"+std::to_string(kind)+".bin",std::ios::binary);file.write(reinterpret_cast<char*>(out.data()),out.size()*sizeof(float4));}
 config.grid=3;config.taps=32;Atlas field{};field.pupils.resize(3*32*9);double transmission[9]={.2,.4,.6,.4,1,.8,.3,.5,.7};for(int y=0;y<3;y++)for(int x=0;x<3;x++)field.pupils[32*9+y*3+x].w=float(transmission[(2-y)*3+x]);auto edges=source;PostSettings compensate;compensate.edge=100;postRender(compensate,config,field,edges);std::ofstream edgeFile(std::string(argv[1])+"/edges.bin",std::ios::binary);edgeFile.write(reinterpret_cast<char*>(edges.data()),edges.size()*sizeof(float4));edgeFile.close();
 OpticalSettings optics;optics.iris=6;optics.grid=3;optics.taps=32;optics.aspect=double(w)/h;auto atlas=makeAtlas(optics);config.grid=3;config.taps=32;config.f[SENSORZ]=float(focusPlane(*atlas,2));
 std::vector<float4> light(w*h,float4{0,0,0,1}),out(w*h,float4{0,0,0,1});light[h/2*w+w*3/4]={8,6,3,1};PostSettings flare;flare.flare=true;flare.flareSources=1;nativeFlare(flare,config,*atlas,light,{},out);double energy=0;for(auto p:out){if(!std::isfinite(p.x+p.y+p.z))throw std::runtime_error("nonfinite flare");energy+=p.x+p.y+p.z;}if(energy<=0)throw std::runtime_error("no reflected energy");
 optics.coating=1;auto coated=makeAtlas(optics);out.assign(w*h,{0,0,0,1});nativeFlare(flare,config,*coated,light,{},out);double coatingEnergy=0;for(auto p:out)coatingEnergy+=p.x+p.y+p.z;if(coatingEnergy>=energy)throw std::runtime_error("coating energy regression");
 light.assign(w*h,{0,0,0,0});out.assign(w*h,{0,0,0,1});nativeFlare(flare,config,*atlas,light,{},out);for(auto p:out)if(p.x||p.y||p.z)throw std::runtime_error("hidden source emitted flare");
 std::cout<<"{\"native_flare_energy\":"<<energy<<",\"coated_energy\":"<<coatingEnergy<<",\"blocked_source_zero\":true}";return 0;}catch(std::exception& e){std::cerr<<e.what();return 1;}}
