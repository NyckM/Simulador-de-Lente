#define NOMINMAX
#include "Engine.h"
#include <windows.h>
#include <algorithm>
#include <mutex>
#include <cmath>
HMODULE pluginModule=GetModuleHandleW(nullptr);
namespace{
std::mutex gpuMutex;
using Init=int(*)();using Source=int(*)(const float*,const float*,int,int);using Upload=int(*)(const float*,const float*,int);using Render=int(*)(Config*,float*,float*);
struct GPU{HMODULE module=nullptr;Source source=nullptr;Upload atlas=nullptr;Render render=nullptr;GPU(){wchar_t path[32768];DWORD size=GetModuleFileNameW(pluginModule,path,32768);if(!size||size>=32768)return;std::wstring p(path);p=p.substr(0,p.find_last_of(L"\\/")+1)+L"bruxos_ps_cuda.dll";module=LoadLibraryExW(p.c_str(),nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);if(!module)return;auto init=reinterpret_cast<Init>(GetProcAddress(module,"optica_cuda_init"));source=reinterpret_cast<Source>(GetProcAddress(module,"optica_cuda_source"));atlas=reinterpret_cast<Upload>(GetProcAddress(module,"optica_cuda_atlas"));render=reinterpret_cast<Render>(GetProcAddress(module,"optica_cuda_render_v2"));auto bytes=reinterpret_cast<Init>(GetProcAddress(module,"bruxos_cuda_config_bytes"));if(!bytes||bytes()!=sizeof(Config)||!init||!source||!atlas||!render||init()){source=nullptr;}}};
}
void nativeRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,std::vector<float4>& out,bool cpuOnly){
 std::lock_guard<std::mutex> guard(gpuMutex);static GPU gpu;
 auto render=[&](Config config,const std::vector<float4>& raw,const Atlas& optics,std::vector<float4>& result){result.resize(config.rw*config.rh);float ms=0;if(!cpuOnly&&gpu.source&&!gpu.source(reinterpret_cast<const float*>(raw.data()),depth.data(),config.w,config.h)&&!gpu.atlas(reinterpret_cast<const float*>(optics.rays.data()),reinterpret_cast<const float*>(optics.pupils.data()),int(optics.rays.size()))&&!gpu.render(&config,reinterpret_cast<float*>(result.data()),&ms))return;cpuRender(config,raw,depth,optics,result);};
 render(s,input,atlas,out);
 // Render alpha through the same pupil and depth visibility. Never copy the
 // sharp input matte onto defocused color. Transmission only affects RGB.
 std::vector<float4> raw=input,alpha;for(auto& p:raw)p={p.w,p.w,p.w,1};Atlas matte=atlas;for(auto& p:matte.pupils)p.w=1;
 Config mask=s;mask.f[HIGHLIGHT]=0;mask.f[EXPOSURE]=0;mask.f[GHOST]=0;mask.f[DIFFRACTION]=0;mask.f[SHIMMER]=0;mask.part=0;
 render(mask,raw,matte,alpha);for(size_t i=0;i<out.size();i++){out[i].w=std::clamp(std::max(alpha[i].x,std::max(alpha[i].y,alpha[i].z)),0.f,1.f);if(out[i].w<=1e-7f)out[i].x=out[i].y=out[i].z=0;}
}
