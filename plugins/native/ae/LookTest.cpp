// 1.2.17 native look test: filters (all kinds, prism types), starburst, lens dirt, recovery. Writes PPM tiles.
#include "PostEffects.h"
#include <fstream>
#include <iostream>
#include <stdexcept>
static void ppm(const std::string& path,const std::vector<float4>& v,int w,int h){std::ofstream f(path,std::ios::binary);f<<"P6\n"<<w<<" "<<h<<"\n255\n";for(int y=h-1;y>=0;y--)for(int x=0;x<w;x++){auto p=v[size_t(y)*w+x];for(float c:{p.x,p.y,p.z}){float s=c<=.0031308f?12.92f*c:1.055f*std::pow(std::max(c,0.f),1/2.4f)-.055f;f.put(char(std::clamp(int(s*255+.5),0,255)));}}}
int main(int argc,char** argv){try{std::string dir=argc>1?argv[1]:".";
 const int w=320,h=200;Config config{};config.w=config.rw=w;config.h=config.rh=h;config.f[BLEND]=1;config.f[FOCUSDIST]=2;config.f[NEAR]=.8f;config.f[FAR]=10;
 std::vector<float4> src(w*h);for(int y=0;y<h;y++)for(int x=0;x<w;x++){int yy=h-1-y;float chk=((x/20+yy/20)%2)?.25f:.12f;src[size_t(y)*w+x]={chk+.2f*x/w,chk,chk+.15f*yy/h,1};}
 for(auto [cx,cy]:{std::pair{70,60},std::pair{230,80},std::pair{160,150}})for(int dy=-2;dy<=2;dy++)for(int dx=-2;dx<=2;dx++)src[size_t(h-1-(cy+dy))*w+cx+dx]={30,26,20,1};
 OpticalSettings optics;optics.iris=3;optics.grid=3;optics.taps=32;optics.aspect=double(w)/h;optics.blades=7;auto atlas=makeAtlas(optics);
 int n=0;double total=0;auto run=[&](const std::string& name,PostSettings f,bool look){auto out=src;if(look)postLook(f,config,*atlas,src,{},out);postRender(f,config,*atlas,out);for(auto p:out)if(!std::isfinite(p.x+p.y+p.z))throw std::runtime_error("nonfinite "+name);ppm(dir+"/"+name+".ppm",out,w,h);n++;};
 for(int kind=1;kind<=15;kind++){PostSettings f;f.kind=kind;f.amount=.6;f.radius=.08;f.shift=.06;f.threshold=1;f.count=6;run("k"+std::to_string(kind),f,false);}
 for(int t=0;t<8;t++){PostSettings f;f.kind=14;f.prismType=t;f.amount=.7;f.shift=.05;f.prismShift=.02;f.count=t==4?4:6;run("prism"+std::to_string(t),f,false);}
 run("base",PostSettings{},true);{PostSettings f;f.starGain=1;f.flareThreshold=5;run("star",f,true);}
 {PostSettings f;f.dirtAmount=.8;f.dirtFungus=1;run("dirt",f,true);}
 {PostSettings f;f.dirtAmount=.8;f.dirtSeed=7;run("dirt7",f,true);}
 {auto img=src;for(auto& p:img){p.x=std::min(p.x,1.f);p.y=std::min(p.y,1.f);p.z=std::min(p.z,1.f);}PostSettings f;f.recovery=4;postRecover(f,img);double m=0;for(auto p:img)m=std::max(m,double(p.x));if(m<15)throw std::runtime_error("recovery");}
 std::cout<<"{\"tiles\":"<<n<<",\"dirt_texture\":"<<bruxos_post::dirtTexture().n<<",\"recovery\":true}\n";return 0;}catch(std::exception& e){std::cerr<<e.what()<<"\n";return 1;}}
