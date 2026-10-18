#pragma once
#include "Engine.h"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <mutex>
#include <map>
#include <tuple>
#include <string>
#include <vector>
#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#else
#include <dlfcn.h>
#endif
// Image-space artistic filters in linear RGB. No measured glass calibration.
// 1.2.17 port: continuous Black Mist (excess-light selection + true gaussian), 13-wavelength prism with
// eight prism types and blurred glass edges, frame-edge mirroring 6 px inside (no dark seams in Kaleidoscope),
// Fraunhofer iris starburst, procedural lens dirt lit by highlights and clipped-highlight recovery.
struct PostSettings {int kind=0,count=4;double amount=0,x=.5,y=.5,scale=1,rotation=0,radius=.04,threshold=.7,softness=.2,inner=.65,feather=.25,shift=.04,edge=0,edgeLimit=3;bool region=false,flare=false;double flareGain=1,flareThreshold=.8;int flareSources=4;
 int prismType=0;double prismShift=.015,edgeBlur=.06,recovery=0;
 double starGain=0,starSize=1,starStreaks=.35;
 double dirtAmount=0,dirtSeed=1,dirtFinger=.7,dirtDust=.6,dirtScratch=.35,dirtFungus=0,dirtDefocus=.35,dirtThreshold=.8;};
void nativeFlare(const PostSettings&,const Config&,const Atlas&,const std::vector<float4>&,const std::vector<float>&,std::vector<float4>&);
inline double postSmooth(double a,double b,double x){double t=std::clamp((x-a)/(b-a),0.,1.);return t*t*(3-2*t);}

namespace bruxos_post {
struct RGB{double r,g,b;RGB operator+(RGB q)const{return{r+q.r,g+q.g,b+q.b};}RGB operator-(RGB q)const{return{r-q.r,g-q.g,b-q.b};}RGB operator*(double t)const{return{r*t,g*t,b*t};}};
inline double lum(RGB p){return p.r*.2126+p.g*.7152+p.b*.0722;}
// Excess-light selection (same as the app): only the light above the threshold spreads, so cores keep their energy.
inline RGB selectLight(RGB p,double threshold,double softness){double l=lum(p);return p*(postSmooth(threshold,threshold+softness,l)*std::max(0.,1-threshold/std::max(l,1e-5)));}
struct Plane{int w=0,h=0;std::vector<float> d;};// 3 floats per pixel
// Gaussian by three box passes (O(1) per pixel for any radius), mirrored edges.
inline void boxPass(const float* src,float* dst,int n,int stride,int r,int ch){if(r<1){for(int i=0;i<n;i++)dst[size_t(i)*stride+ch]=src[size_t(i)*stride+ch];return;}
 auto at=[&](int i){if(n==1)return src[ch];while(i<0||i>=n){if(i<0)i=-i-1;if(i>=n)i=2*n-i-1;}return src[size_t(i)*stride+ch];};
 double sum=0;for(int i=-r;i<=r;i++)sum+=at(i);double inv=1./(2*r+1);for(int i=0;i<n;i++){dst[size_t(i)*stride+ch]=float(sum*inv);sum+=at(i+r+1)-at(i-r);}}
inline Plane gaussian(const Plane& in,double sigma){Plane out=in;if(sigma<.35)return out;int boxes[3];{double wIdeal=std::sqrt(12*sigma*sigma/3+1);int wl=int(std::floor(wIdeal));if(wl%2==0)wl--;int wu=wl+2;double mIdeal=(12*sigma*sigma-3*wl*wl-12*wl-9)/(-4.*wl-4);int m=int(std::round(mIdeal));for(int i=0;i<3;i++)boxes[i]=((i<m?wl:wu)-1)/2;}
 int w=in.w,h=in.h;std::vector<float> tmp(in.d.size());
 for(int pass=0;pass<3;pass++){int r=boxes[pass];
  #pragma omp parallel for
  for(int y=0;y<h;y++)for(int c=0;c<3;c++)boxPass(out.d.data()+size_t(y)*w*3,tmp.data()+size_t(y)*w*3,w,3,r,c);
  #pragma omp parallel for
  for(int x=0;x<w;x++)for(int c=0;c<3;c++)boxPass(tmp.data()+size_t(x)*3,out.d.data()+size_t(x)*3,h,w*3,r,c);}
 return out;}
inline Plane downsample(const Plane& in,int f){if(f<=1)return in;Plane o;o.w=std::max(1,in.w/f);o.h=std::max(1,in.h/f);o.d.assign(size_t(o.w)*o.h*3,0);
 #pragma omp parallel for
 for(int y=0;y<o.h;y++)for(int x=0;x<o.w;x++){double s[3]{};int n=0;for(int j=0;j<f;j++)for(int i=0;i<f;i++){int xx=std::min(in.w-1,x*f+i),yy=std::min(in.h-1,y*f+j);for(int c=0;c<3;c++)s[c]+=in.d[(size_t(yy)*in.w+xx)*3+c];n++;}for(int c=0;c<3;c++)o.d[(size_t(y)*o.w+x)*3+c]=float(s[c]/n);}return o;}
// Bilinear lookup in normalized (0..1) coordinates; frame edge mirrored 6 px inside.
inline RGB lookup(const Plane& p,double px,double py,bool mirror=true){
 if(mirror){double ex=std::min(.1,6./p.w),ey=std::min(.1,6./p.h);auto fold=[](double v,double e){if(v>=e&&v<=1-e)return v;double q=(v-e)/(1-2*e);q=1-std::abs(1-(q-2*std::floor(q/2)));return e+q*(1-2*e);};px=fold(px,ex);py=fold(py,ey);}
 double x=std::clamp(px*p.w-.5,0.,double(p.w-1)),y=std::clamp(py*p.h-.5,0.,double(p.h-1));int ix=int(x),iy=int(y),jx=std::min(ix+1,p.w-1),jy=std::min(iy+1,p.h-1);double tx=x-ix,ty=y-iy;
 auto at=[&](int xx,int yy){const float* q=&p.d[(size_t(yy)*p.w+xx)*3];return RGB{q[0],q[1],q[2]};};return (at(ix,iy)*(1-tx)+at(jx,iy)*tx)*(1-ty)+(at(ix,jy)*(1-tx)+at(jx,jy)*tx)*ty;}
inline Plane fromFloat4(const std::vector<float4>& v,int w,int h,bool select=false,double threshold=0,double softness=1){Plane p;p.w=w;p.h=h;p.d.resize(size_t(w)*h*3);
 #pragma omp parallel for
 for(int i=0;i<w*h;i++){RGB c{v[i].x,v[i].y,v[i].z};if(select)c=selectLight(c,threshold,softness);p.d[size_t(i)*3]=float(std::max(0.,c.r));p.d[size_t(i)*3+1]=float(std::max(0.,c.g));p.d[size_t(i)*3+2]=float(std::max(0.,c.b));}return p;}
inline RGB specWeight(int i){const double t[7][3]={{.2,.02,.8},{.05,.2,1},{0,.8,.3},{.2,1,.02},{1,.7,0},{1,.15,0},{.7,0,0}};return RGB{t[i][0],t[i][1],t[i][2]};}
inline RGB specTable(double t){int a=std::min(6,int(std::floor(t)));int b=std::min(a+1,6);double f=t-a;return specWeight(a)*(1-f)+specWeight(b)*f;}
}

// Clipped highlights (8/16-bit or display-referred plates near 1.0) regain energy before bokeh and flare.
inline void postRecover(const PostSettings& f,std::vector<float4>& image){if(f.recovery<=0)return;
 #pragma omp parallel for
 for(long long i=0;i<(long long)image.size();i++){auto& p=image[i];double m=std::max({p.x,p.y,p.z});if(m<=.9)continue;float k=float(std::exp2(f.recovery*postSmooth(.9,1,m)));p.x*=k;p.y*=k;p.z*=k;}}

inline void postRender(const PostSettings& f,const Config& s,const Atlas& atlas,std::vector<float4>& out){
 using namespace bruxos_post;
 if((!f.kind||f.amount<=0)&&f.edge<=0)return;
 int w=s.rw,h=s.rh;double shortSide=std::min(w,h),ux=w/shortSide,uy=h/shortSide,angle=f.rotation*.017453292519943295,c=std::cos(angle),sn=std::sin(angle),radius=f.radius*f.scale;
 auto base=out;Plane plate=fromFloat4(base,w,h);
 // Wide kernels read pre-blurred planes: continuous diffusion, no point copies of highlights (1.2.11 fix).
 Plane blurred,blurredSel,blurredSmall;bool selKind=f.kind==1||f.kind==13||f.kind==4||f.kind==5;
 if(f.kind==1||f.kind==13)blurredSel=gaussian(fromFloat4(base,w,h,true,f.threshold,f.softness),.5*radius*shortSide);
 if(f.kind==2||f.kind==6||f.kind==7||f.kind==11)blurred=gaussian(plate,.5*radius*shortSide);
 if(f.kind==3||f.kind==9)blurredSmall=gaussian(plate,.1*radius*shortSide);
 Plane selected=selKind?fromFloat4(base,w,h,true,f.threshold,f.softness):Plane{};
 // Prism: each wavelength reads a plane pre-filtered by the spacing between wavelengths -> continuous spectrum.
 double prismOffset=f.shift*f.scale,prismShift=(f.prismType?f.prismShift:f.shift)*f.scale,edgeBlur=f.edgeBlur*f.scale*std::clamp(atlas.iris/8.55,.25,4.);
 Plane prismPlane=f.kind==14?gaussian(plate,std::max(.0,.12*prismShift*shortSide)):Plane{};
 auto sample=[&](double px,double py){return lookup(plate,px,py);};
 auto spectral=[&](double px,double py,double dx,double dy){RGB sum{},mass{};for(int i=0;i<13;i++){double wl=430+20*i,off=(std::pow(550./wl,2)-1)/.63600757;RGB wt=specTable(i*.5);RGB q=lookup(prismPlane,px+dx*off,py+dy*off);sum=sum+RGB{q.r*wt.r,q.g*wt.g,q.b*wt.b};mass=mass+wt;}return RGB{sum.r/mass.r,sum.g/mass.g,sum.b/mass.b};};
 auto edgeStep=[&](double x,double wdt){double e=std::max(std::sqrt(wdt*wdt+edgeBlur*edgeBlur),1e-5);return postSmooth(-e,e,x);};
 // Buffers are bottom-up in native hosts; public position/rotation are top-down.
 #pragma omp parallel for
 for(int y=0;y<h;y++)for(int x=0;x<w;x++){
  double px=(x+.5)/w,py=(y+.5)/h,lx=(px-f.x)*ux,ly=(py-(1-f.y))*uy;
  double qx=(lx*c-ly*sn)/f.scale,qy=(lx*sn+ly*c)/f.scale,dist=std::hypot(qx,qy)/.25,pe=f.kind==14?edgeBlur*2:0,periphery=postSmooth(f.inner-pe,f.inner+f.feather+pe,dist),mask=f.region?1-postSmooth(.8-pe,1+pe,dist):1;
  auto world=[&](double a,double b){return std::pair<double,double>{(a*c+b*sn)*f.scale/ux+f.x,(-a*sn+b*c)*f.scale/uy+1-f.y};};
  auto dirAt=[&](double a){return std::pair<double,double>{std::cos(a)/ux,-std::sin(a)/uy};};
  const auto& bp=base[size_t(y)*w+x];RGB b{bp.x,bp.y,bp.z},target=b,chosen=selectLight(b,f.threshold,f.softness);
  if(f.kind==1)target=b-chosen+lookup(blurredSel,px,py);
  else if(f.kind==2)target=lookup(blurred,px,py);
  else if(f.kind==3)target=lookup(blurredSmall,px,py);
  else if(f.kind==13){auto a=lookup(blurredSel,px,py);target=b-chosen+RGB{a.r,a.g*.3,a.b*.06};}
  else if(f.kind==4||f.kind==5){target={};double massW=0;int directions=f.kind==5?f.count:1;for(int j=0;j<directions;j++){double a=-angle+j*3.14159265358979323846/directions;for(int i=0;i<33;i++){double t=(i-16)/16.,weight=std::exp(-4*t*t);target=target+lookup(selected,px+std::cos(a)*t*radius/ux,py+std::sin(a)*t*radius/uy)*weight;massW+=weight;}}target=b-chosen+target*(1/massW);}
  else if(f.kind==8){target={};for(int i=0;i<f.count;i++){auto q=world(qx+(i-(f.count-1)/2.)*f.shift,qy);target=target+sample(q.first,q.second)*(1./f.count);}}
  else if(f.kind==10){double sector=6.283185307179586/f.count,a=std::atan2(-qy,qx)+sector/2;a=std::fmod(std::fmod(a,sector)+sector,sector)-sector/2;a=std::abs(a);double r=std::hypot(qx,qy);auto q=world(std::cos(a)*r,-std::sin(a)*r);target=sample(q.first,q.second);mask*=periphery;}
  else if(f.kind==9){auto q=world(qx*(1+f.shift*dist),qy*(1+f.shift*dist));target=lookup(blurredSmall,q.first,q.second);mask*=periphery;}
  else if(f.kind==6||f.kind==7||f.kind==11){auto q=world(qx+f.shift,qy);target=lookup(blurred,q.first,q.second);mask*=f.kind==7?periphery:postSmooth(-f.feather,f.feather,qx-(f.kind==11?f.inner*.25:0));}
  else if(f.kind==14){double A=angle;auto d=dirAt(A);int t=f.prismType;
   if(t==1){target={};for(int k=0;k<3;k++){auto e=dirAt(A+k*2.09439510239);target=target+spectral(px+e.first*prismOffset,py+e.second*prismOffset,e.first*prismShift,e.second*prismShift)*(1./3);}}
   else if(t==2){mask*=edgeStep(qx-f.inner*.25,f.feather);target=spectral(px+d.first*prismOffset,py+d.second*prismOffset,d.first*prismShift,d.second*prismShift);}
   else if(t==3){double sector=6.28318530718/f.count,u=std::atan2(-qy,qx)/sector,i0=std::floor(u),fr=u-i0,side=fr<.5?-1:1,dEdge=std::hypot(qx,qy)*std::sin(std::min(fr,1-fr)*sector),wn=.5-.5*postSmooth(0,std::max(edgeBlur,1e-5),dEdge);auto e0=dirAt((i0+.5)*sector+A),e1=dirAt((i0+side+.5)*sector+A);mask*=periphery;RGB c0=spectral(px+e0.first*prismOffset,py+e0.second*prismOffset,e0.first*prismShift,e0.second*prismShift);target=wn<.002?c0:c0*(1-wn)+spectral(px+e1.first*prismOffset,py+e1.second*prismOffset,e1.first*prismShift,e1.second*prismShift)*wn;}
   else if(t==4){target={};double m=0;for(int i=0;i<std::min(8,f.count);i++){double wt=std::pow(.62,i);target=target+spectral(px+d.first*prismOffset*i,py+d.second*prismOffset*i,d.first*prismShift*(1+i),d.second*prismShift*(1+i))*wt;m+=wt;}target=target*(1/m);}
   else if(t==5){double sector=6.28318530718/f.count,th=std::atan2(-qy,qx),a=std::abs(std::fmod(std::fmod(th+sector*.5,sector)+sector,sector)-sector*.5);mask*=periphery;double r=std::hypot(qx,qy);auto q=world(std::cos(a)*r,-std::sin(a)*r);auto e=dirAt(th+A);target=spectral(q.first,q.second,e.first*prismShift,e.second*prismShift);}
   else if(t==6){double side=edgeStep(qx-f.inner*.25,f.feather);target=spectral(px-d.first*prismOffset,py-d.second*prismOffset,-d.first*prismShift,-d.second*prismShift)*(1-side)+spectral(px+d.first*prismOffset,py+d.second*prismOffset,d.first*prismShift,d.second*prismShift)*side;}
   else if(t==7){auto e=dirAt(std::atan2(-qy,qx)+A);double r=std::min(dist,2.);mask*=periphery;target=spectral(px-e.first*prismOffset*r,py-e.second*prismOffset*r,e.first*prismShift*r,e.second*prismShift*r);}
   else target=spectral(px,py,c*prismShift/ux,-sn*prismShift/uy);}
  else if(f.kind==15){target={};double massW=0;for(int i=0;i<33;i++){double t=(i-16)/16.,weight=std::exp(-4*t*t);target=target+sample(px+c*t*radius/ux,py-sn*t*radius/uy)*weight;massW+=weight;}target=target*(1/massW);}
  else if(f.kind==12){double ax=c/ux,ay=-sn/uy,contrast=std::abs(lum(sample(px+ax*.002,py+ay*.002)-sample(px-ax*.002,py-ay*.002)));auto red=sample(px+ax*f.shift,py+ay*f.shift),blue=sample(px-ax*f.shift,py-ay*f.shift);target={red.r,b.g,blue.b};mask*=postSmooth(f.threshold,f.threshold+f.softness,contrast);}
  double amount=f.kind?f.amount*mask*s.f[BLEND]:0;RGB result=b*(1-amount)+RGB{std::max(0.,target.r),std::max(0.,target.g),std::max(0.,target.b)}*amount;
  if(f.edge>0){int grid=atlas.pupils.empty()?0:s.grid;if(grid>=2){double gx=px*(grid-1),gy=py*(grid-1);int ix=std::min(grid-2,int(gx)),iy=std::min(grid-2,int(gy));auto transmission=[&](int xx,int yy){return double(atlas.pupils[s.taps*grid*grid+yy*grid+xx].w);};double tx=gx-ix,ty=gy-iy,T=(transmission(ix,iy)*(1-tx)+transmission(ix+1,iy)*tx)*(1-ty)+(transmission(ix,iy+1)*(1-tx)+transmission(ix+1,iy+1)*tx)*ty;double cx=(grid-1)*.5,cy=cx;int ci=int(cx),cj=int(cy);double a=cx-ci,bb=cy-cj;double center=(transmission(ci,cj)*(1-a)+transmission(std::min(ci+1,grid-1),cj)*a)*(1-bb)+(transmission(ci,std::min(cj+1,grid-1))*(1-a)+transmission(std::min(ci+1,grid-1),std::min(cj+1,grid-1))*a)*bb;T=std::clamp(T/std::max(center,1e-12),0.,1.);double gain=1+postSmooth(0,.01,T)*(std::exp2(std::min(-std::log2(std::max(T,1e-12)),f.edgeLimit)*f.edge/100*s.f[BLEND])-1);result=result*gain;}}
  auto& p=out[size_t(y)*w+x];p.x=float(result.r);p.y=float(result.g);p.z=float(result.b);
 }
}

// ---------- Starburst: Fraunhofer diffraction of the current iris, |FFT(aperture)|^2 summed over 16 wavelengths ----------
namespace bruxos_post {
inline void fft1(std::vector<double>& re,std::vector<double>& im,int n,int stride,size_t off){
 for(int i=1,j=0;i<n;i++){int bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){std::swap(re[off+size_t(i)*stride],re[off+size_t(j)*stride]);std::swap(im[off+size_t(i)*stride],im[off+size_t(j)*stride]);}}
 for(int len=2;len<=n;len<<=1){double a=-2*3.14159265358979323846/len;for(int i=0;i<n;i+=len)for(int k=0;k<len/2;k++){double wr=std::cos(a*k),wi=std::sin(a*k);size_t u=off+size_t(i+k)*stride,v=off+size_t(i+k+len/2)*stride;double xr=re[v]*wr-im[v]*wi,xi=re[v]*wi+im[v]*wr;re[v]=re[u]-xr;im[v]=im[u]-xi;re[u]+=xr;im[u]+=xi;}}}
inline RGB wavelengthRGB(double nm){auto g=[](double x,double m,double s1,double s2){double s=x<m?s1:s2;return std::exp(-.5*std::pow((x-m)/s,2));};double X=1.056*g(nm,599.8,37.9,31)+.362*g(nm,442,16,26.7)-.065*g(nm,501.1,20.4,26.2),Y=.821*g(nm,568.8,46.9,40.5)+.286*g(nm,530.9,16.3,31.1),Z=1.217*g(nm,437,11.8,36)+.681*g(nm,459,26,13.8);return RGB{std::max(0.,3.2406*X-1.5372*Y-.4986*Z),std::max(0.,-.9689*X+1.8758*Y+.0415*Z),std::max(0.,.0557*X-.204*Y+1.057*Z)};}
struct StarTexture{int N=0;std::vector<float> rgb;};
inline const StarTexture& starburstTexture(int blades,double streaks){
 static std::mutex mutex;static std::map<std::pair<int,int>,StarTexture> cache;std::lock_guard<std::mutex> lock(mutex);auto key=std::make_pair(blades,int(std::round(streaks*100)));auto found=cache.find(key);if(found!=cache.end())return found->second;
 const int N=256;const double P=2.5,R=N/(2*P);std::vector<double> re(size_t(N)*N,0),im(size_t(N)*N,0);
 uint64_t seed=9301+49297;auto rnd=[&](){seed=(seed*233280+49297)%2147483647ULL;return double(seed)/2147483647.;};std::vector<std::tuple<int,double,double>> waves;for(int k=0;k<48;k++){int fq=int(std::round(8+rnd()*360));double ph=rnd()*6.283,amp=rnd()-.5;waves.emplace_back(fq,ph,amp);}
 for(int y=0;y<N;y++)for(int x=0;x<N;x++){double dx=x-N/2+.5,dy=y-N/2+.5,r=std::hypot(dx,dy)/R,a=std::atan2(dy,dx);if(r>1.2)continue;double edge=1;
  if(blades>=3){double sector=2*3.14159265358979323846/blades,t=std::fmod(std::fmod(a+3.14159265358979323846/2,sector)+sector,sector)-sector/2;edge=std::cos(3.14159265358979323846/blades)/std::cos(t);}
  double rough=0;for(auto& [fq,ph,amp]:waves)rough+=amp*std::sin(fq*a+ph)/std::sqrt(double(fq));edge*=1+streaks*.06*rough;re[size_t(y)*N+x]=std::clamp(.5+(edge-r)*R,0.,1.);}
 for(int y=0;y<N;y++)fft1(re,im,N,1,size_t(y)*N);for(int x=0;x<N;x++)fft1(re,im,N,N,size_t(x));
 std::vector<double> mono(size_t(N)*N);for(int y=0;y<N;y++)for(int x=0;x<N;x++){int sx=(x+N/2)%N,sy=(y+N/2)%N;size_t i=size_t(sy)*N+sx;mono[size_t(y)*N+x]=re[i]*re[i]+im[i]*im[i];}
 auto sampleMono=[&](double x,double y){if(x<0||y<0||x>=N-1||y>=N-1)return 0.;int ix=int(x),iy=int(y);double fx=x-ix,fy=y-iy;size_t i=size_t(iy)*N+ix;return (mono[i]*(1-fx)+mono[i+1]*fx)*(1-fy)+(mono[i+N]*(1-fx)+mono[i+N+1]*fx)*fy;};
 StarTexture t;t.N=N;t.rgb.assign(size_t(N)*N*3,0);double c=N/2-.5,core=1.22*P*1.6,sum[3]{};std::vector<std::pair<double,RGB>> lams;for(int nm=400;nm<=700;nm+=20)lams.push_back({double(nm),wavelengthRGB(nm)});
 for(int y=0;y<N;y++)for(int x=0;x<N;x++){double dx=x-c,dy=y-c,rr=std::hypot(dx,dy),cut=std::pow(std::clamp((rr-core)/core,0.,1.),2);if(cut<=0)continue;RGB v{};for(auto& [nm,col]:lams){double k=550/nm,m=sampleMono(c+dx*k,c+dy*k)*k*k;v=v+col*m;}double fade=std::pow(std::max(0.,1-rr/(N*.5)),2);size_t i=(size_t(y)*N+x)*3;t.rgb[i]=float(v.r*cut*fade);t.rgb[i+1]=float(v.g*cut*fade);t.rgb[i+2]=float(v.b*cut*fade);sum[0]+=t.rgb[i];sum[1]+=t.rgb[i+1];sum[2]+=t.rgb[i+2];}
 double norm=1/std::max(1e-30,(sum[0]+sum[1]+sum[2])/3);for(auto& v:t.rgb)v=float(v*norm);return cache.emplace(key,std::move(t)).first->second;}

// Lens dirt texture: bruxos_dirt.rgba (512 x 512 x RGBA8: fingerprints, dust, scratches, fungus) next to the plugin binary.
inline std::string moduleFolder(){
#ifdef _WIN32
 HMODULE module=nullptr;GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,reinterpret_cast<LPCWSTR>(&moduleFolder),&module);wchar_t path[MAX_PATH*4]{};GetModuleFileNameW(module,path,MAX_PATH*4);std::wstring p=path;auto slash=p.find_last_of(L"\\/");p=slash==std::wstring::npos?L".":p.substr(0,slash);int n=WideCharToMultiByte(CP_UTF8,0,p.c_str(),-1,nullptr,0,nullptr,nullptr);std::string out(size_t(std::max(1,n)),'\0');WideCharToMultiByte(CP_UTF8,0,p.c_str(),-1,&out[0],n,nullptr,nullptr);out.resize(strlen(out.c_str()));return out;
#else
 Dl_info info{};if(dladdr(reinterpret_cast<void*>(&moduleFolder),&info)&&info.dli_fname){std::string p=info.dli_fname;auto slash=p.find_last_of('/');return slash==std::string::npos?".":p.substr(0,slash);}return ".";
#endif
}
struct DirtTexture{int n=0;std::vector<uint8_t> rgba;};
inline const DirtTexture& dirtTexture(){static std::once_flag once;static DirtTexture t;std::call_once(once,[]{
 const char* env=std::getenv("BRUXOS_DIRT_TEXTURE");std::string path=env&&*env?std::string(env):moduleFolder()+"/bruxos_dirt.rgba";
#ifdef _WIN32
 FILE* file=nullptr;{int n=MultiByteToWideChar(CP_UTF8,0,path.c_str(),-1,nullptr,0);std::wstring w(size_t(std::max(1,n)),L'\0');MultiByteToWideChar(CP_UTF8,0,path.c_str(),-1,&w[0],n);file=_wfopen(w.c_str(),L"rb");}
#else
 FILE* file=std::fopen(path.c_str(),"rb");
#endif
 if(!file)return;std::vector<uint8_t> data(512*512*4);size_t got=std::fread(data.data(),1,data.size(),file);std::fclose(file);if(got==data.size()){t.n=512;t.rgba=std::move(data);}});return t;}
}

// Starburst + lens dirt, after reflected flare and before the image filters (same order as the app).
inline void postLook(const PostSettings& f,const Config& s,const Atlas& atlas,const std::vector<float4>& input,const std::vector<float>& depth,std::vector<float4>& out){
 using namespace bruxos_post;if(s.f[BLEND]<=0)return;int w=s.rw,h=s.rh;double shortSide=std::min(w,h);
 if(f.starGain>0){
  // sources: same detection as the reflected flare (threshold, minimum spacing, count)
  struct Src{int x,y;double lum;};std::vector<Src> cand,sel;for(int y=0;y<s.h;y++)for(int x=0;x<s.w;x++){const auto& p=input[size_t(y)*s.w+x];double L=(p.x*.2126+p.y*.7152+p.z*.0722)*std::clamp(double(p.w),0.,1.);if(L>=f.flareThreshold&&L>0)cand.push_back({x,y,L});}
  std::sort(cand.begin(),cand.end(),[](Src a,Src b){return a.lum>b.lum||(a.lum==b.lum&&(a.y<b.y||(a.y==b.y&&a.x<b.x)));});
  for(auto p:cand){bool separate=true;for(auto q:sel)if(std::abs(p.x-q.x)<=8&&std::abs(p.y-q.y)<=8)separate=false;if(separate)sel.push_back(p);if(int(sel.size())>=std::max(1,f.flareSources))break;}
  const auto& o=atlas.optics;int blades=o.blades>=3?o.blades:0;const auto& tex=starburstTexture(blades,f.starStreaks);
  double efl=std::max(1.,atlas.focal),iris=std::max(.25,atlas.iris),fnum=efl/(2*iris),span=std::clamp(f.starSize*shortSide*.22*std::sqrt(std::clamp(fnum/2.8,.5,6.)),16.,std::max(w,h)*1.5);
  double A=2*iris,fmm=std::max(efl*1.01,double(s.f[FOCUSDIST]>0?s.f[FOCUSDIST]:o.source)*1000),pxmm=w/std::max(1.,o.sensor),rot=-o.rotation*3.14159265358979323846/180,cr=std::cos(rot),sr=std::sin(rot);
  double scale=f.starGain*std::pow(2.,s.f[EXPOSURE])*s.f[BLEND]*double(tex.N)*tex.N/(span*span);
  for(auto src:sel){double flux[3]{};for(int yy=std::max(0,src.y-4);yy<=std::min(s.h-1,src.y+4);yy++)for(int xx=std::max(0,src.x-4);xx<=std::min(s.w-1,src.x+4);xx++){auto p=input[size_t(yy)*s.w+xx];double al=std::clamp(double(p.w),0.,1.);flux[0]+=std::max(0.f,p.x)*al;flux[1]+=std::max(0.f,p.y)*al;flux[2]+=std::max(0.f,p.z)*al;}
   double distance=o.source;if(s.depth&&!depth.empty()){double d=std::clamp(double(depth[size_t(src.y)*s.w+src.x])*s.f[DEPTHGAIN]+s.f[DEPTHBIAS],0.,1.);if(s.invert)d=1-d;distance=1/(1/s.f[FAR]+d*(1/s.f[NEAR]-1/s.f[FAR]));}
   // in focus a point gives the diffraction star; defocused it becomes a bokeh disc and the star fades
   double dmm=std::max(efl*1.01,distance*1000),coc=A*efl*std::abs(dmm-fmm)/(dmm*(fmm-efl))*pxmm,wt=std::exp(-std::pow(coc/3,2));if(wt<.01)continue;
   double cx=(src.x+.5)*w/s.w,cy=(src.y+.5)*h/s.h,half=span*.5;int x0=std::max(0,int(cx-half*1.42)),x1=std::min(w-1,int(cx+half*1.42)),y0=std::max(0,int(cy-half*1.42)),y1=std::min(h-1,int(cy+half*1.42));double k=scale*wt*double(w)/s.w*double(h)/s.h;
   #pragma omp parallel for
   for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++){double dx=x+.5-cx,dy=y+.5-cy,u=(dx*cr-dy*sr)/span+.5,v=(dx*sr+dy*cr)/span+.5;if(u<0||v<0||u>=1||v>=1)continue;double tx=u*tex.N-.5,ty=v*tex.N-.5;int ix=std::clamp(int(std::floor(tx)),0,tex.N-2),iy=std::clamp(int(std::floor(ty)),0,tex.N-2);double fx=std::clamp(tx-ix,0.,1.),fy=std::clamp(ty-iy,0.,1.);auto& p=out[size_t(y)*w+x];
    for(int ch=0;ch<3;ch++){auto T=[&](int xx,int yy){return double(tex.rgb[(size_t(yy)*tex.N+xx)*3+ch]);};double val=(T(ix,iy)*(1-fx)+T(ix+1,iy)*fx)*(1-fy)+(T(ix,iy+1)*(1-fx)+T(ix+1,iy+1)*fx)*fy;(&p.x)[ch]+=float(val*flux[ch]*k);}}
  }
 }
 if(f.dirtAmount>0){const auto& tex=dirtTexture();if(!tex.n)return;
  // dirt layers: weighted channels, cover-fit; the seed varies offset, quarter turns and mirror
  int seed=std::max(1,int(std::round(f.dirtSeed)));uint64_t r=uint64_t(seed)*2654435761u;int offX=int(r%512),offY=int((r>>9)%512),turns=int((r>>18)%4);bool flip=(r>>20)&1;if(seed==1){offX=offY=turns=0;flip=false;}
  double wts[4]={f.dirtFinger,f.dirtDust,f.dirtScratch,f.dirtFungus};Plane dirt;dirt.w=w;dirt.h=h;dirt.d.assign(size_t(w)*h*3,0);double cover=std::max(w,h);
  #pragma omp parallel for
  for(int y=0;y<h;y++)for(int x=0;x<w;x++){double u=((x+.5)-w*.5)/cover+.5,v=((h-1-y+.5)-h*.5)/cover+.5;for(int t=0;t<turns;t++){double nu=1-v,nv=u;u=nu;v=nv;}if(flip)u=1-u;double tx=u*tex.n-.5+offX,ty=v*tex.n-.5+offY;int ix=int(std::floor(tx)),iy=int(std::floor(ty));double fx=tx-ix,fy=ty-iy;auto at=[&](int xx,int yy,int ch){xx=((xx%tex.n)+tex.n)%tex.n;yy=((yy%tex.n)+tex.n)%tex.n;return tex.rgba[(size_t(yy)*tex.n+xx)*4+ch]/255.;};double sum=0;for(int ch=0;ch<4;ch++)if(wts[ch]>0)sum+=wts[ch]*((at(ix,iy,ch)*(1-fx)+at(ix+1,iy,ch)*fx)*(1-fy)+(at(ix,iy+1,ch)*(1-fx)+at(ix+1,iy+1,ch)*fx)*fy);for(int ch=0;ch<3;ch++)dirt.d[(size_t(y)*w+x)*3+ch]=float(sum);}
  double defocus=.0035*std::max(.25,atlas.iris)*f.dirtDefocus*shortSide*.5;if(defocus>.35)dirt=gaussian(dirt,defocus);
  // scatter halo: highlights spread wide over the front element (computed at 1/4 resolution)
  int ds=std::max(1,int(shortSide/270));Plane light=downsample(fromFloat4(out,w,h,true,f.dirtThreshold,.5),ds);Plane halo=gaussian(light,.08*shortSide/ds),local=gaussian(light,.02*shortSide/ds);
  double amount=f.dirtAmount*s.f[BLEND];
  #pragma omp parallel for
  for(int y=0;y<h;y++)for(int x=0;x<w;x++){double px=(x+.5)/w,py=(y+.5)/h;RGB H=lookup(halo,px,py,false)*.7+lookup(local,px,py,false)*.3;double D=dirt.d[(size_t(y)*w+x)*3];auto& p=out[size_t(y)*w+x];double T=1-.12*amount*std::min(1.,D);double k=amount*2*(.06+4*D);p.x=float(p.x*T+H.r*k);p.y=float(p.y*T+H.g*k);p.z=float(p.z*T+H.b*k);}
 }
}
