#define NOMINMAX
#include "Stack.h"
#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <mutex>
#include <queue>
#include <windows.h>
#undef FAR
#undef NEAR
#include "StackCommon.h"
extern HMODULE pluginModule;
namespace {
constexpr size_t maxBytes=size_t(3)*1024*1024*1024;
struct Packed {
 std::vector<float4> data;
 StackPyramid add(const std::vector<float4>& pixels,int w,int h){
  StackPyramid p;int total=0,ww=w,hh=h;do{int l=p.n++;p.w[l]=ww;p.h[l]=hh;p.off[l]=int(data.size())+total;total+=ww*hh;if(ww==1&&hh==1)break;ww=std::max(1,ww/2);hh=std::max(1,hh/2);}while(p.n<16);
  if((data.size()+total)*sizeof(float4)>maxBytes)throw std::runtime_error("Camadas: limite de 3 GB. Reduza as fatias ou use Proxy.");
  auto offset=data.size();data.resize(offset+total);std::copy(pixels.begin(),pixels.end(),data.begin()+offset);
  for(int l=1;l<p.n;l++){
   #pragma omp parallel for
   for(int id=0;id<p.w[l]*p.h[l];id++){float u=(id%p.w[l]+.5f)/p.w[l],v=(id/p.w[l]+.5f)/p.h[l];float4 sum{};for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float wx=x==0?6:std::abs(x)==1?4:1,wy=y==0?6:std::abs(y)==1?4:1;sum=stAdd(sum,stMul(stBilinear(data.data()+p.off[l-1],p.w[l-1],p.h[l-1],u+float(x)/p.w[l-1],v+float(y)/p.h[l-1],false),wx*wy));}data[p.off[l]+id]=stMul(sum,1/256.f);}
  }return p;
 }
};
inline float sgMix(float a,float b,float t){return a+(b-a)*t;}
inline float sgRaw(const float* p,Config s,float u,float v){
 float x=fminf(s.w-1.f,fmaxf(0,u*s.w-.5f)),y=fminf(s.h-1.f,fmaxf(0,v*s.h-.5f));int ix=int(x),iy=int(y),jx=std::min(ix+1,s.w-1),jy=std::min(iy+1,s.h-1);
 float d=sgMix(sgMix(p[iy*s.w+ix],p[iy*s.w+jx],x-ix),sgMix(p[jy*s.w+ix],p[jy*s.w+jx],x-ix),y-iy);
 return d;
}
inline float sgMapped(const float* p,Config s,float u,float v){float d=stSat(sgRaw(p,s,u,v)*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;}

// RGB-guided depth boundary repair. Only two locally flat, separated planes
// are eligible; a sloping depth surface or a third material stays unchanged.
inline float sgDot(float4 a,float4 b){return a.x*b.x+a.y*b.y+a.z*b.z;}
inline float4 sgDiff(float4 a,float4 b){return make_float4(a.x-b.x,a.y-b.y,a.z-b.z,0);}
inline float sgGuided(const float* depths,const std::vector<float4>& guide,Config s,float u,float v){
 float center=sgRaw(depths,s,u,v),lo=center,hi=center,lu=u,lv=v,hu=u,hv=v,tx=1.f/s.w,ty=1.f/s.h;
 if(center<=.001f||center>=.999f)return sgMapped(depths,s,u,v);
 float radius=fminf(32,fmaxf(6,s.w*.0375f));
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float qu=fminf(1-tx*.5f,fmaxf(tx*.5f,u+x*radius*.5f*tx)),qv=fminf(1-ty*.5f,fmaxf(ty*.5f,v+y*radius*.5f*ty)),d=sgRaw(depths,s,qu,qv);if(d<lo){lo=d;lu=qu;lv=qv;}if(d>hi){hi=d;hu=qu;hv=qv;}}
 if(hi-lo<.15f||center<=lo+.001f||center>=hi-.001f)return sgMapped(depths,s,u,v);
 float variation=0;for(int i=0;i<4;i++){float dx=i==0?tx:i==1?-tx:0,dy=i==2?ty:i==3?-ty:0;variation=fmaxf(variation,fabsf(sgRaw(depths,s,lu+dx,lv+dy)-lo));variation=fmaxf(variation,fabsf(sgRaw(depths,s,hu+dx,hv+dy)-hi));}
 if(variation>.002f)return sgMapped(depths,s,u,v);
 float4 centerColor=stBilinear(guide.data(),s.w,s.h,u,v),low=make_float4(0,0,0,0),high=low;float lc=0,hc=0,ld=1e30f,hd=1e30f;
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float qu=fminf(1-tx*.5f,fmaxf(tx*.5f,u+x*radius*.5f*tx)),qv=fminf(1-ty*.5f,fmaxf(ty*.5f,v+y*radius*.5f*ty)),d=sgRaw(depths,s,qu,qv);float4 c=stBilinear(guide.data(),s.w,s.h,qu,qv);float4 diff=sgDiff(c,centerColor);float dist=sgDot(diff,diff);if(d<=lo+.025f){lc++;if(dist<ld){low=c;ld=dist;}}if(d>=hi-.025f){hc++;if(dist<hd){high=c;hd=dist;}}}
 if(lc<3||hc<3)return sgMapped(depths,s,u,v);float4 delta=sgDiff(high,low);float contrast=sgDot(delta,delta);if(contrast<.005f)return sgMapped(depths,s,u,v);
 float4 c=centerColor;float t=stSat(sgDot(sgDiff(c,low),delta)/contrast);float4 residual=sgDiff(c,stLerp(low,high,t));
 if(sgDot(residual,residual)>contrast*.12f+.0004f)return sgMapped(depths,s,u,v);
 float d=stSat(sgMix(lo,hi,t)*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;
}


float mapValue(float d,Config s){d=stSat(d*s.f[DEPTHGAIN]+s.f[DEPTHBIAS]);return s.invert?1-d:d;}
std::vector<float4> premultiply(const std::vector<float4>& image,bool highlights,Config s){std::vector<float4> result(image.size());for(size_t i=0;i<image.size();i++){auto p=image[i];p=stMul(p,stSat(p.w));p.w=stSat(image[i].w);if(highlights){float t=stSat((stLum(p)-.45f)/.55f),gain=1+s.f[HIGHLIGHT]*t*t*(3-2*t);p.x*=gain;p.y*=gain;p.z*=gain;}result[i]=p;}return result;}
std::vector<float> feather(const std::vector<float>& mask,int w,int h,float sigma){if(sigma<=0)return mask;int radius=std::min(192,int(std::ceil(sigma*3)));std::vector<float> kernel(2*radius+1),temp(mask.size()),result(mask.size());float sum=0;for(int i=-radius;i<=radius;i++){kernel[i+radius]=std::exp(-i*i/(2*sigma*sigma));sum+=kernel[i+radius];}for(auto& k:kernel)k/=sum;
 #pragma omp parallel for
 for(int y=0;y<h;y++)for(int x=0;x<w;x++){float k=0;for(int i=-radius;i<=radius;i++)k+=mask[y*w+std::clamp(x+i,0,w-1)]*kernel[i+radius];temp[y*w+x]=k;}
 #pragma omp parallel for
 for(int y=0;y<h;y++)for(int x=0;x<w;x++){float k=0;for(int i=-radius;i<=radius;i++)k+=temp[std::clamp(y+i,0,h-1)*w+x]*kernel[i+radius];result[y*w+x]=k;}return result;}
std::vector<int> distances(const std::vector<float>& mask,int w,int h,bool front){std::vector<int> d(mask.size(),1000000000);std::queue<int> q;for(int i=0;i<int(mask.size());i++)if(front?mask[i]>.01f:mask[i]<.01f){d[i]=0;q.push(i);}while(!q.empty()){int i=q.front();q.pop();int x=i%w,y=i/w;int neighbors[]={x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1};for(int j:neighbors)if(j>=0&&d[j]>d[i]+1){d[j]=d[i]+1;q.push(j);}}return d;}
void addLayer(Packed&,std::vector<StackPlane>&,const std::vector<float4>&,const std::vector<float>&,Config,float,bool,bool,bool=false);
void cutPlanes(Packed& packed,std::vector<StackPlane>& planes,const std::vector<float4>& raw,const std::vector<float>& depth,Config s,const ExtraInputs& extra){
 auto image=premultiply(raw,true,s);bool opaque=std::all_of(raw.begin(),raw.end(),[](float4 p){return p.w>=.999999f;});std::vector<float> mask(raw.size()),mappedDepth(raw.size());float softness=std::max(.00001f,s.f[FEATHER]);for(size_t i=0;i<mask.size();i++){mappedDepth[i]=sgGuided(depth.data(),image,s,(i%s.w+.5f)/s.w,(i/s.w+.5f)/s.h);float t=stSat((mappedDepth[i]-s.f[CUT]+softness)/(2*softness));mask[i]=t*t*(3-2*t);}auto frontDistance=distances(mask,s.w,s.h,true);auto edge=feather(mask,s.w,s.h,extra.cutFeather);
 std::vector<float4> background(image.size()),foreground(image.size());std::vector<int> owner(image.size(),-1);std::queue<int> q;
 for(int i=0;i<int(image.size());i++){foreground[i]=stMul(image[i],edge[i]);if(mask[i]<.01f&&frontDistance[i]>extra.cutGrow){owner[i]=i;background[i]=image[i];q.push(i);}}
 if(q.empty()&&extra.depthEdgeSafe){
  // An empty cut side has no valid background donor. Keep the original depth
  // image rather than producing a transparent background.
  addLayer(packed,planes,raw,depth,s,s.f[SOURCE_M],true,false,opaque);return;
 }
 // Only known background supplies the fill. No foreground RGB enters it.
 while(!q.empty()){int i=q.front();q.pop();int x=i%s.w,y=i/s.w;int neighbors[]={x?i-1:-1,x+1<s.w?i+1:-1,y?i-s.w:-1,y+1<s.h?i+s.w:-1};for(int j:neighbors)if(j>=0&&owner[j]<0){owner[j]=owner[i];background[j]=image[owner[i]];q.push(j);}}
 std::vector<int> fgOwner(image.size(),-1);for(int i=0;i<int(image.size());i++)if(mask[i]>.99f){fgOwner[i]=i;q.push(i);}while(!q.empty()){int i=q.front();q.pop();int x=i%s.w,y=i/s.w;int neighbors[]={x?i-1:-1,x+1<s.w?i+1:-1,y?i-s.w:-1,y+1<s.h?i+s.w:-1};for(int j:neighbors)if(j>=0&&fgOwner[j]<0){fgOwner[j]=fgOwner[i];q.push(j);}}for(int i=0;i<int(image.size());i++)if(mask[i]<.99f&&fgOwner[i]>=0)foreground[i]=stMul(image[fgOwner[i]],edge[i]);
 if(extra.cutActualDepth){
  // Preserve each side's depth through the fill/edge extension instead of
  // replacing the subject and background by the near/far limits.
  std::vector<float> backgroundDepth(raw.size()),foregroundDepth(raw.size());
  for(size_t i=0;i<raw.size();i++){
   backgroundDepth[i]=owner[i]>=0?mappedDepth[owner[i]]:0;
   foregroundDepth[i]=fgOwner[i]>=0?mappedDepth[fgOwner[i]]:mappedDepth[i];
   auto unpremult=[](float4 p){return p.w>1e-7f?make_float4(p.x/p.w,p.y/p.w,p.z/p.w,p.w):make_float4(0,0,0,0);};
   background[i]=unpremult(background[i]);foreground[i]=unpremult(foreground[i]);
  }
  Config normalized=s;normalized.f[DEPTHGAIN]=1;normalized.f[DEPTHBIAS]=0;normalized.invert=0;
  addLayer(packed,planes,background,backgroundDepth,normalized,s.f[FAR],false,false,extra.depthEdgeSafe&&opaque);
  addLayer(packed,planes,foreground,foregroundDepth,normalized,s.f[NEAR],false,false);
 }else{planes.push_back({packed.add(background,s.w,s.h),s.f[FAR]});planes.push_back({packed.add(foreground,s.w,s.h),s.f[NEAR]});}
}
void addLayer(Packed& packed,std::vector<StackPlane>& planes,const std::vector<float4>& raw,const std::vector<float>& map,Config s,float distance,bool main,bool partition,bool filledBase){
 auto image=premultiply(raw,main,s);bool clampRear=filledBase&&std::all_of(raw.begin(),raw.end(),[](float4 p){return p.w>=.999999f;});if(map.empty()){auto pyramid=packed.add(image,s.w,s.h);pyramid.edgeClamp=clampRear;planes.push_back({pyramid,distance});return;}
 float lo=1,hi=0;std::vector<float> mapped(map.size());for(size_t i=0;i<map.size();i++){mapped[i]=sgGuided(map.data(),image,s,(i%s.w+.5f)/s.w,(i/s.w+.5f)/s.h);lo=std::min(lo,mapped[i]);hi=std::max(hi,mapped[i]);}
 if(hi-lo<1e-6f){distance=1/((1-lo)/s.f[FAR]+lo/s.f[NEAR]);auto pyramid=packed.add(image,s.w,s.h);pyramid.edgeClamp=clampRear;planes.push_back({pyramid,distance});return;}
 int slices=std::clamp(s.slices,4,32);std::vector<float4> masked(image.size());
 for(int j=0;j<slices;j++){float t=float(j)/(slices-1);bool active=false;for(size_t i=0;i<masked.size();i++){float weight=std::max(0.f,1-std::abs(mapped[i]-t)*(slices-1));if(!partition)weight/=std::max(.00001f,1-image[i].w*stSat((mapped[i]-t)*(slices-1)));masked[i]=stMul(image[i],weight);active|=masked[i].w>1e-8f;}
  if(active){
   bool rear=filledBase&&clampRear;
   if(filledBase){
    // Reconstruct the rear plate from its own depth slice before convolution.
    // A source foreground must never become a colour donor for the rear plate.
    std::vector<int> owner(image.size(),-1);std::queue<int> q;
    for(int i=0;i<int(image.size());i++)if(masked[i].w>1e-6f){owner[i]=i;q.push(i);}
    while(!q.empty()){int i=q.front();q.pop();int x=i%s.w,y=i/s.w;int neighbors[]={x?i-1:-1,x+1<s.w?i+1:-1,y?i-s.w:-1,y+1<s.h?i+s.w:-1};for(int j:neighbors)if(j>=0&&owner[j]<0){owner[j]=owner[i];q.push(j);}}
    for(int i=0;i<int(image.size());i++)if(owner[i]>=0&&image[i].w>.999f){
      auto donor=image[owner[i]];float alpha=image[i].w;
      masked[i]=donor.w>1e-7f?stMul(donor,alpha/donor.w):make_float4(0,0,0,0);masked[i].w=alpha;
    }
    filledBase=false;
   }
   auto pyramid=packed.add(masked,s.w,s.h);pyramid.edgeClamp=rear;planes.push_back({pyramid,1/((1-t)/s.f[FAR]+t/s.f[NEAR])});
  }
 }
}
using StackGPU=int(*)(const StackScene*,const StackPlane*,int,const float4*,int,const float4*,const float4*,int,float4*);
struct GPU {HMODULE module=nullptr;StackGPU render=nullptr;GPU(){wchar_t path[32768];auto size=GetModuleFileNameW(pluginModule,path,32768);if(!size||size>=32768)return;std::wstring file(path);file=file.substr(0,file.find_last_of(L"\\/")+1)+L"bruxos_layers_cuda.dll";module=LoadLibraryExW(file.c_str(),nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);auto abi=module?reinterpret_cast<int(*)()>(GetProcAddress(module,"bruxos_stack_abi")):nullptr;if(abi&&abi()==3)render=reinterpret_cast<StackGPU>(GetProcAddress(module,"bruxos_stack_render"));}};
std::mutex stackMutex;
thread_local bool usedGPU=false;
}
extern "C" __declspec(dllexport) int bruxos_layer_backend(){return usedGPU?1:0;}
bool extraActive(Config s,const ExtraInputs& extra){for(auto& layer:extra.layers)if(!layer.image.empty())return true;return s.depth&&(extra.depthEdgeSafe||(s.cut&&(extra.cutActualDepth||extra.cutGrow>0||extra.cutFeather>0)));}
void stackRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,const ExtraInputs& extra,std::vector<float4>& out,bool cpuOnly){
 usedGPU=false;
 if(!extraActive(s,extra)){nativeRender(s,input,depth,atlas,out,cpuOnly);return;}
 auto size=size_t(s.w)*s.h;if(input.size()!=size||depth.size()!=size)throw std::runtime_error("Buffers de camadas invalidos");for(auto& layer:extra.layers)if((!layer.image.empty()&&layer.image.size()!=size)||(!layer.depth.empty()&&layer.depth.size()!=size))throw std::runtime_error("Camada e depth precisam estar alinhados");if(!extra.glitterMatte.empty()&&extra.glitterMatte.size()!=size)throw std::runtime_error("Glitter Matte desalinhado");
 StackScene scene;scene.config=s;scene.glitter=extra.glitter&&!extra.layers[0].image.empty();scene.normalize=extra.normalize;scene.distortion=extra.distortion&&!extra.layers[2].image.empty();scene.glitterGain=extra.glitterGain;scene.distortionPixels=extra.distortionPixels;
 Packed packed;std::vector<StackPlane> planes;scene.original=packed.add(premultiply(input,false,s),s.w,s.h);
 std::vector<float4> gate(size);for(size_t i=0;i<size;i++){float value=extra.glitterMatte.empty()?std::max(0.f,input[i].w-1):std::max(0.f,extra.glitterMatte[i]);gate[i]={value,value,value,1};}scene.gate=packed.add(gate,s.w,s.h);
 scene.start[0]=0;if(s.depth&&s.cut)cutPlanes(packed,planes,input,depth,s,extra);else addLayer(packed,planes,input,s.depth?depth:std::vector<float>{},s,s.f[SOURCE_M],true,false,extra.depthEdgeSafe);scene.count[0]=int(planes.size());
 for(int j=0;j<3;j++){
  scene.start[j+1]=int(planes.size());auto& layer=extra.layers[j];if(!layer.image.empty()){
   float distance=extra.meters?(layer.distance<=0?extra.focus:layer.distance):std::max(.3f,s.f[SOURCE_M]+layer.distance);
   addLayer(packed,planes,layer.image,layer.depth,s,distance,false,j==2&&scene.distortion);
   if(j==0&&scene.glitter){double mean=0;for(auto p:layer.image)mean+=std::max(0.f,stLum(p))*stSat(p.w);scene.glitterMean=float(mean/size);}
  }scene.count[j+1]=int(planes.size())-scene.start[j+1];
 }
 out.resize(size_t(s.rw)*s.rh);
 if(!cpuOnly){std::lock_guard<std::mutex> guard(stackMutex);static GPU gpu;if(gpu.render&&!gpu.render(&scene,planes.data(),int(planes.size()),packed.data.data(),int(packed.data.size()),atlas.rays.data(),atlas.pupils.data(),int(atlas.rays.size()),out.data())){usedGPU=true;return;}}
 #pragma omp parallel for
 for(int i=0;i<s.rw*s.rh;i++)out[i]=stPixel(packed.data.data(),planes.data(),atlas.rays.data(),atlas.pupils.data(),scene,i);
}
