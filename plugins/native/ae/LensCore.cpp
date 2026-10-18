#include "Engine.h"
#include "PostEffects.h"
#include <complex>
#include "LensDiagram.h"
#include "Prescriptions.generated.h"
#include <algorithm>
#include <cmath>
#include <mutex>
#include <sstream>
#include <stdexcept>
#include <numeric>
namespace {
constexpr double pi=3.14159265358979323846;
struct V {double x,y,z;V operator+(V b)const{return{x+b.x,y+b.y,z+b.z};}V operator-(V b)const{return{x-b.x,y-b.y,z-b.z};}V operator*(double k)const{return{x*k,y*k,z*k};}};
double dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}
V norm(V a){return a*(1/std::max(1e-20,std::sqrt(dot(a,a))));}
double taper(double margin,double width){if(width<=0)return margin>=0?1:0;double t=std::clamp(margin/width,0.,1.);return t*t*(3-2*t);}
double index(double nd,double wave,double dispersion){if(nd==1)return 1;double b=(nd-1)/45/(1/(.4861*.4861)-1/(.6563*.6563));return nd+dispersion*b*(1/(wave*wave)-1/(.5876*.5876));}
double coatingTransmission(double ci,double n1,double n2,double wave,double design){
 double nf=std::sqrt(n1*n2),si2=std::max(0.,1-ci*ci),cf=std::sqrt(std::max(0.,1-std::pow(n1/nf,2)*si2)),ct=std::sqrt(std::max(0.,1-std::pow(n1/n2,2)*si2)),phase=pi*design*.001*cf/wave;
 auto e=std::exp(std::complex<double>(0,phase));double sum=0;
 for(int polarization=0;polarization<2;polarization++){double a0=polarization?n1/std::max(ci,1e-12):n1*ci,af=polarization?nf/std::max(cf,1e-12):nf*cf,a2=polarization?n2/std::max(ct,1e-12):n2*ct;double a=(a0-af)/std::max(a0+af,1e-12),b=(af-a2)/std::max(af+a2,1e-12);sum+=std::norm((a+b*e)/(1.+a*b*e));}return std::clamp(1-sum/2,0.,1.);
}
struct Ray{double x,y,sx,sy,px,py,energy;};
struct NearestPupil {
 const std::vector<double>& x;const std::vector<double>& y;std::vector<int> ids,left,right;int root;
 NearestPupil(const std::vector<double>& xx,const std::vector<double>& yy):x(xx),y(yy),ids(xx.size()),left(xx.size(),-1),right(xx.size(),-1){std::iota(ids.begin(),ids.end(),0);root=build(0,int(ids.size()),0);}
 int build(int lo,int hi,int axis){if(lo==hi)return -1;int mid=(lo+hi)/2;std::nth_element(ids.begin()+lo,ids.begin()+mid,ids.begin()+hi,[&](int a,int b){return axis?y[a]<y[b]:x[a]<x[b];});int node=ids[mid];left[node]=build(lo,mid,1-axis);right[node]=build(mid+1,hi,1-axis);return node;}
 void search(int node,int axis,double px,double py,int& best,double& distance)const{if(node<0)return;double dx=px-x[node],dy=py-y[node],dd=dx*dx+dy*dy;if(dd<distance){distance=dd;best=node;}double delta=axis?dy:dx;int first=delta<0?left[node]:right[node],second=delta<0?right[node]:left[node];search(first,1-axis,px,py,best,distance);if(delta*delta<distance)search(second,1-axis,px,py,best,distance);}
 int query(double px,double py)const{int best=0;double dd=1e100;search(root,0,px,py,best,dd);return best;}
};
bool trace(const std::vector<Surface>& glass,const OpticalSettings& s,V& p,V& d,double wave,double& energy,std::vector<LensPoint>* path=nullptr){double z=0,n1=1;energy=1;
 for(auto surface:glass){double t;V normal;if(surface.radius==0){t=(z-p.z)/std::max(1e-12,d.z);normal={0,0,-1};}else{V q=p-V{0,0,z+surface.radius};double b=dot(q,d),disc=b*b-dot(q,q)+surface.radius*surface.radius;if(disc<0)return false;t=-b-std::copysign(std::sqrt(disc),surface.radius);normal=norm(p+d*t-V{0,0,z+surface.radius});}if(t< -1e-7)return false;p=p+d*t;if(path)path->push_back({p.z,p.y});double r=std::hypot(p.x,p.y),aperture=surface.diameter/2;if(r>aperture+1e-9)return false;if(s.soften)energy*=taper(aperture-r,aperture*.025);
 if(surface.stop){aperture=std::min(aperture,s.iris);if(s.blades>=3){double a=std::atan2(p.y,p.x)-s.rotation*pi/180,period=2*pi/s.blades;double sector=a+pi/s.blades-period*std::floor((a+pi/s.blades)/period)-pi/s.blades;aperture*=std::cos(pi/s.blades)/std::cos(sector);}if(r>aperture+1e-9)return false;energy*=taper(aperture-r,aperture*s.softness);}
 double n2=index(surface.nd,wave,s.dispersion);if(dot(d,normal)>0)normal=normal*(-1);double ci=-dot(d,normal),eta=n1/n2,k=1-eta*eta*(1-ci*ci);if(k<0)return false;double ct=std::sqrt(k),rs=std::pow((n1*ci-n2*ct)/std::max(1e-20,n1*ci+n2*ct),2),rp=std::pow((n2*ci-n1*ct)/std::max(1e-20,n2*ci+n1*ct),2);double T=1-(rs+rp)/2;if(s.coating>0)T=T*(1-s.coating)+s.coating*coatingTransmission(ci,n1,n2,wave,s.coatingNm);energy*=T;d=norm(d*eta+normal*(eta*ci-ct));n1=n2;z+=surface.thickness;
 }return energy>1e-12&&d.z>0;
}
std::vector<Surface> editedGlass(const OpticalSettings& s){
 if(s.preset<0||s.preset>=presetCount)throw std::runtime_error("Invalid lens preset");const auto& spec=prescriptions[s.preset];std::vector<Surface> glass(surfaces+spec.offset,surfaces+spec.offset+spec.count);
 if(s.edit>0&&s.edit<=spec.count){auto& surface=glass[s.edit-1];if(!surface.stop){surface.radius*=s.curvature;surface.diameter*=s.diameter;if(surface.nd>1)surface.nd=std::clamp(surface.nd+s.indexOffset,1.,2.5);}surface.thickness*=s.spacing;}
 return glass;
}
std::shared_ptr<const Atlas> build(OpticalSettings s){
 auto glass=editedGlass(s);const auto& spec=prescriptions[s.preset];
 auto result=std::make_shared<Atlas>();auto& a=*result;a.optics=s;a.maxIris=spec.maxIris;s.iris=std::clamp(s.iris,.05,a.maxIris);a.iris=s.iris;a.focal=spec.focal;a.last=0;for(int i=0;i<spec.count-1;i++)a.last+=glass[i].thickness;
 double A=1,B=0,C=0,D=1,n=1;for(auto row:glass){double power=row.radius?(row.nd-n)/row.radius:0,cc=C-power*A,dd=D-power*B;A+=row.thickness/row.nd*cc;B+=row.thickness/row.nd*dd;C=cc;D=dd;n=row.nd;}a.matrix[0]=A;a.matrix[1]=B;a.matrix[2]=C;a.matrix[3]=D;a.reference=focusPlane(a,2);a.sourcePlane=focusPlane(a,s.source);
 V p{.001,0,-1},direction{0,0,1};double energy;if(!trace(glass,s,p,direction,.5876,energy))throw std::runtime_error("Lens adjustment blocks paraxial ray");a.focal=-.001/(direction.x/direction.z);
 int count=int(4096*std::min(16.,std::max(1.,std::pow(3/s.iris,2))));int grid=s.grid,taps=s.taps;a.rays.resize(3*taps*grid*grid);a.pupils.resize(a.rays.size());std::vector<double> throughput(3*grid*grid);double wave[3]={.6563,.5876,.4861};
 std::vector<double> tx(taps),ty(taps);for(int t=0;t<taps;t++){double radius=std::sqrt((t+.5)/taps);tx[t]=std::cos((t+.5)*2.39996323)*radius;ty[t]=std::sin((t+.5)*2.39996323)*radius;}
 const NearestPupil targets(tx,ty);
 #pragma omp parallel for
 for(int field=0;field<grid*grid;field++){int gx=field%grid,gy=field/grid;double fx=(double(gx)/(grid-1)-.5)*s.sensor,fy=(double(gy)/(grid-1)-.5)*s.sensor/s.aspect;std::vector<Ray> bundles[3];double cx=0,cy=0,csx=0,csy=0,green=0;
 for(int c=0;c<3;c++){auto& rays=bundles[c];for(int i=0;i<count;i++){double radius=glass[0].diameter/2*std::sqrt((i+.5)/count),theta=(i+.5)*pi*(3-std::sqrt(5.));V target{radius*std::cos(theta),radius*std::sin(theta),-1},origin{-fx*s.source*1000/a.focal,-fy*s.source*1000/a.focal,-s.source*1000},d=norm(target-origin),p=target;double e;if(!trace(glass,s,p,d,wave[c],e))continue;double sx=d.x/d.z,sy=d.y/d.z;rays.push_back({p.x+(a.reference-p.z)*sx,p.y+(a.reference-p.z)*sy,sx,sy,target.x/(glass[0].diameter/2),target.y/(glass[0].diameter/2),e});}if(c==1)for(auto ray:rays){cx+=ray.x*ray.energy;cy+=ray.y*ray.energy;csx+=ray.sx*ray.energy;csy+=ray.sy*ray.energy;green+=ray.energy;}}
 if(green<=1e-12)continue;cx/=green;cy/=green;csx/=green;csy/=green;
 for(int c=0;c<3;c++){auto& rays=bundles[c];double total=0,px=0,py=0,vx=0,vy=0;for(auto ray:rays){total+=ray.energy;px+=ray.px*ray.energy;py+=ray.py*ray.energy;}if(total<=1e-12)continue;px/=total;py/=total;for(auto ray:rays){vx+=std::pow(ray.px-px,2)*ray.energy;vy+=std::pow(ray.py-py,2)*ray.energy;}vx=std::max(1e-6,2*std::sqrt(vx/total));vy=std::max(1e-6,2*std::sqrt(vy/total));throughput[c*grid*grid+field]=total/count;
 std::vector<double> sums(taps*7);for(auto ray:rays){double nx=(ray.px-px)/vx,ny=(ray.py-py)/vy;int cell=targets.query(nx,ny);double* acc=&sums[cell*7];acc[0]+=ray.energy;acc[1]+=ray.x*ray.energy;acc[2]+=ray.y*ray.energy;acc[3]+=ray.sx*ray.energy;acc[4]+=ray.sy*ray.energy;acc[5]+=nx*ray.energy;acc[6]+=ny*ray.energy;}
 for(int t=0;t<taps;t++){double* acc=&sums[t*7];int id=(c*taps+t)*grid*grid+field;if(acc[0]<=1e-12)continue;double w=acc[0];a.rays[id]={float(acc[1]/w-cx),float(acc[2]/w-cy),float(acc[3]/w-csx),float(acc[4]/w-csy)};a.pupils[id]={float(acc[5]/w),float(acc[6]/w),float(w/total*taps),0};}
 }}
 double center=std::max(1e-12,throughput[grid*grid+(grid/2)*grid+grid/2]);for(int c=0;c<3;c++)for(int t=0;t<taps;t++)for(int field=0;field<grid*grid;field++)a.pupils[(c*taps+t)*grid*grid+field].w=float(std::min(1.,throughput[c*grid*grid+field]/center));return result;
}
}
double focusPlane(const Atlas& a,double distance){double inv=1/(std::max(.05,distance)*1000),den=a.matrix[2]+a.matrix[3]*inv;if(std::abs(den)<1e-10)throw std::runtime_error("Focus plane at infinity");return a.last-(a.matrix[0]+a.matrix[1]*inv)/den;}
std::shared_ptr<const Atlas> makeAtlas(const OpticalSettings& s){std::ostringstream key;key.precision(12);key<<s.preset<<','<<s.blades<<','<<s.grid<<','<<s.taps<<','<<s.iris<<','<<s.source<<','<<s.sensor<<','<<s.aspect<<','<<s.rotation<<','<<s.dispersion<<','<<s.softness<<','<<s.edit<<','<<s.curvature<<','<<s.spacing<<','<<s.diameter<<','<<s.indexOffset<<','<<s.soften<<','<<s.coating<<','<<s.coatingNm;static std::mutex mutex;static std::vector<std::pair<std::string,std::shared_ptr<const Atlas>>> cache;std::lock_guard<std::mutex> guard(mutex);for(auto& entry:cache)if(entry.first==key.str())return entry.second;auto atlas=build(s);if(cache.size()>=8)cache.erase(cache.begin());cache.emplace_back(key.str(),atlas);return atlas;}

LensDiagram makeLensDiagram(OpticalSettings s,double fstop,double focus,double filmback){
 s.preset=std::clamp(s.preset,0,presetCount-1);auto& spec=prescriptions[s.preset];auto glass=editedGlass(s);
 // Match the renderer's entrance-pupil calibration, including its current prescription convention.
 double A=1,B=0,C=0,D=1,n=1;for(int i=0;i<spec.count;i++){auto row=surfaces[spec.offset+i];if(row.stop)break;double power=row.radius?(row.nd-n)/row.radius:0,cc=C-power*A,dd=D-power*B;A+=row.thickness/row.nd*cc;B+=row.thickness/row.nd*dd;C=cc;D=dd;n=row.nd;}
 s.iris=std::clamp(std::abs(spec.focal*A)/(2*std::max(.7,fstop)),.05,spec.maxIris);
 LensDiagram out;out.name=spec.name;out.selected=s.edit;out.iris=s.iris;double z=0,maxY=1;Atlas a{};A=1;B=C=0;D=n=1;
 for(int i=0;i<int(glass.size());i++){auto row=glass[i];LensSurface surface{i+1,row.radius,row.thickness,row.diameter,row.nd,z,row.stop,{}};double half=row.diameter/2;if(row.radius)half=std::min(half,std::abs(row.radius)*.999999);maxY=std::max(maxY,half);
 for(int k=0;k<=64;k++){double y=half*(2.*k/64-1);double sag=row.radius?row.radius-std::copysign(std::sqrt(std::max(0.,row.radius*row.radius-y*y)),row.radius):0;surface.outline.push_back({z+sag,y});}out.surfaces.push_back(surface);
 double power=row.radius?(row.nd-n)/row.radius:0,cc=C-power*A,dd=D-power*B;A+=row.thickness/row.nd*cc;B+=row.thickness/row.nd*dd;C=cc;D=dd;n=row.nd;if(i+1<int(glass.size()))z+=row.thickness;
 }
 a.last=z;a.matrix[0]=A;a.matrix[1]=B;a.matrix[2]=C;a.matrix[3]=D;out.sensor=focusPlane(a,std::max(.3,focus))+filmback;
 out.height=std::max(maxY,s.sensor/2)*1.22;out.left=-maxY*.9;out.right=std::max(z+maxY*.4,out.sensor)+maxY*.35;
 for(auto& surface:out.surfaces)for(auto p:surface.outline){out.left=std::min(out.left,p.z-maxY*.15);out.right=std::max(out.right,p.z+maxY*.15);}
 V paraxial{.001,0,-1},direction{0,0,1};double energy;double focal=spec.focal;if(trace(glass,s,paraxial,direction,.5876,energy))focal=-.001/(direction.x/direction.z);
 double wave[]={.6563,.5876,.4861};double source=std::max(.3,s.source)*1000;
 for(int field=0;field<2;field++)for(int k=-5;k<=5;k++)for(int c=0;c<3;c++){
  double y=glass.front().diameter*.47*k/5*std::min(1.,s.iris/spec.maxIris),oy=field?source*s.sensor/(4*std::max(1.,std::abs(focal))):0;
  V target{0,y,-1},origin{0,oy,-source},direction=norm(target-origin),point=target;LensRay ray;ray.channel=c;double leftY=y+(out.left+1)*direction.y/direction.z;ray.points.push_back({out.left,leftY});
  ray.transmitted=trace(glass,s,point,direction,wave[c],ray.energy,&ray.points);
  if(ray.transmitted){double end=std::max(point.z,out.sensor);ray.points.push_back({end,point.y+(end-point.z)*direction.y/direction.z});}out.rays.push_back(ray);
 }
 return out;
}
std::string lensDiagramJSON(const LensDiagram& d){std::ostringstream o;o.precision(12);o<<"{\"name\":\"";for(char c:d.name){if(c=='"'||c=='\\')o<<'\\';o<<c;}o<<"\",\"bounds\":["<<d.left<<','<<d.right<<','<<d.height<<"],\"sensor\":"<<d.sensor<<",\"iris\":"<<d.iris<<",\"selected\":"<<d.selected<<",\"surfaces\":[";
 auto points=[&](const std::vector<LensPoint>& v){o<<'[';bool first=true;for(auto p:v){if(!first)o<<',';first=false;o<<'['<<p.z<<','<<p.y<<']';}o<<']';};
 bool first=true;for(auto s:d.surfaces){if(!first)o<<',';first=false;o<<"{\"id\":"<<s.id<<",\"radius\":"<<s.radius<<",\"thickness\":"<<s.thickness<<",\"diameter\":"<<s.diameter<<",\"index\":"<<s.index<<",\"z\":"<<s.z<<",\"stop\":"<<(s.stop?"true":"false")<<",\"points\":";points(s.outline);o<<'}';}o<<"],\"rays\":[";first=true;for(auto r:d.rays){if(!first)o<<',';first=false;o<<"{\"channel\":"<<r.channel<<",\"transmitted\":"<<(r.transmitted?"true":"false")<<",\"energy\":"<<r.energy<<",\"points\":";points(r.points);o<<'}';}o<<"]}";return o.str();}
#ifdef _WIN32
#define LENS_EXPORT extern "C" __declspec(dllexport)
#else
#define LENS_EXPORT extern "C" __attribute__((visibility("default")))
#endif
// ABI 1: preset/edit/curvature/spacing/diameter/index/fstop/focus/source/sensor/film/blades/rotation/dispersion.
// Returns required bytes including NUL, or -1 for invalid arguments. Query size before allocating.
LENS_EXPORT int bruxos_lens_diagram(const double* values,int count,char* buffer,int capacity){try{
 if(!values||count!=14||capacity<0)return -1;for(int i=0;i<count;i++)if(!std::isfinite(values[i]))return -1;
 OpticalSettings s;s.preset=int(values[0]);if(s.preset<0||s.preset>=presetCount)return -1;s.edit=int(values[1]);s.curvature=values[2];s.spacing=values[3];s.diameter=values[4];s.indexOffset=values[5];s.source=values[8];s.sensor=values[9];s.blades=int(values[11]);s.rotation=values[12];s.dispersion=values[13];
 auto json=lensDiagramJSON(makeLensDiagram(s,values[6],values[7],values[10]));int required=int(json.size()+1);if(buffer&&capacity>=required)std::copy(json.c_str(),json.c_str()+required,buffer);return required;
 }catch(...){return -1;}}

// Two-reflection sequential paths. Same prescription, iris and coatings as bokeh.
void nativeFlare(const PostSettings& f,const Config& config,const Atlas& atlas,const std::vector<float4>& input,const std::vector<float>& depth,std::vector<float4>& output){
 if(!f.flare||f.flareGain<=0||config.f[BLEND]<=0)return;
 const auto& s=atlas.optics;auto glass=editedGlass(s);std::vector<double> z(glass.size());for(size_t i=1;i<z.size();i++)z[i]=z[i-1]+glass[i-1].thickness;
 struct Source{int x,y;double lum;};std::vector<Source> candidates,selected;
 for(int y=0;y<config.h;y++)for(int x=0;x<config.w;x++){const auto& p=input[size_t(y)*config.w+x];double L=(p.x*.2126+p.y*.7152+p.z*.0722)*std::clamp(double(p.w),0.,1.);if(L>=f.flareThreshold&&L>0)candidates.push_back({x,y,L});}
 std::sort(candidates.begin(),candidates.end(),[](Source a,Source b){return a.lum>b.lum||(a.lum==b.lum&&(a.y<b.y||(a.y==b.y&&a.x<b.x)));});
 for(auto p:candidates){bool separate=true;for(auto q:selected)if(std::abs(p.x-q.x)<=8&&std::abs(p.y-q.y)<=8)separate=false;if(separate)selected.push_back(p);if(int(selected.size())>=f.flareSources)break;}
 if(selected.empty())return;
 struct Pair{int j,i;double strength;};std::vector<Pair> pairs;double n1=1;std::vector<double> reflections(glass.size());for(size_t k=0;k<glass.size();k++){double n2=glass[k].nd,R=std::pow((n1-n2)/(n1+n2),2);if(s.coating>0)R=R*(1-s.coating)+(1-coatingTransmission(1,n1,n2,.5876,s.coatingNm))*s.coating;reflections[k]=glass[k].stop?0:R;n1=n2;}
 for(int j=0;j<int(glass.size());j++)for(int i=0;i<j;i++)if(reflections[j]>0&&reflections[i]>0)pairs.push_back({j,i,reflections[j]*reflections[i]});std::sort(pairs.begin(),pairs.end(),[](Pair a,Pair b){return a.strength>b.strength||(a.strength==b.strength&&(a.j<b.j||(a.j==b.j&&a.i<b.i)));});if(pairs.size()>16)pairs.resize(16);
 const int count=1024;const double waves[]={.6563,.5876,.4861};
 for(auto source:selected){double flux[3]{};for(int yy=std::max(0,source.y-4);yy<=std::min(config.h-1,source.y+4);yy++)for(int xx=std::max(0,source.x-4);xx<=std::min(config.w-1,source.x+4);xx++){auto p=input[size_t(yy)*config.w+xx];double alpha=std::clamp(double(p.w),0.,1.);flux[0]+=std::max(0.f,p.x)*alpha;flux[1]+=std::max(0.f,p.y)*alpha;flux[2]+=std::max(0.f,p.z)*alpha;}
 double distance=s.source;if(config.depth&&!depth.empty()){double d=std::clamp(double(depth[size_t(source.y)*config.w+source.x])*config.f[DEPTHGAIN]+config.f[DEPTHBIAS],0.,1.);if(config.invert)d=1-d;distance=1/(1/config.f[FAR]+d*(1/config.f[NEAR]-1/config.f[FAR]));}
 double fieldX=((source.x+.5)/config.w-.5)*s.sensor,fieldY=((source.y+.5)/config.h-.5)*s.sensor/s.aspect;V origin{-fieldX*distance*1000/atlas.focal,-fieldY*distance*1000/atlas.focal,-distance*1000};
 for(auto pair:pairs)for(int channel=0;channel<3;channel++){
  struct Hit{double x,y,e;bool ok;};std::vector<Hit> hits(count,Hit{0,0,0,false});
  std::vector<double> after(glass.size()),before(glass.size());for(size_t k=0;k<glass.size();k++){after[k]=index(glass[k].nd,waves[channel],s.dispersion);before[k]=k?after[k-1]:1;}
  for(int sample=0;sample<count;sample++){
   double r=glass[0].diameter/2*std::sqrt((sample+.5)/count),a=(sample+.5)*pi*(3-std::sqrt(5.));V p{r*std::cos(a),r*std::sin(a),-1},d=norm(p-origin);double energy=1;bool valid=true;
   auto visit=[&](int k,int travel,bool reflection){
    if(!valid)return;const auto& row=glass[k];double hitT=-1;V normal{0,0,-1};
    if(row.radius==0){if(std::abs(d.z)<1e-12){valid=false;return;}hitT=(z[k]-p.z)/d.z;}
    else{V center{0,0,z[k]+row.radius},q=p-center;double b=dot(q,d),disc=b*b-dot(q,q)+row.radius*row.radius;if(disc<0){valid=false;return;}for(double tt:{-b-std::sqrt(disc),-b+std::sqrt(disc)}){V hit=p+d*tt;if(tt>=-1e-7&&(hit.z-center.z)*row.radius<=1e-7&&(hitT<0||tt<hitT))hitT=tt;}if(hitT>=-1e-7)normal=norm(p+d*hitT-center);}
    if(hitT< -1e-7){valid=false;return;}p=p+d*hitT;double rr=std::hypot(p.x,p.y),aperture=row.diameter/2;if(rr>aperture+1e-9){valid=false;return;}if(s.soften)energy*=taper(aperture-rr,aperture*.025);
    if(row.stop){aperture=std::min(aperture,s.iris);if(s.blades>=3){double theta=std::atan2(p.y,p.x)-s.rotation*pi/180,period=2*pi/s.blades,sector=theta+pi/s.blades-period*std::floor((theta+pi/s.blades)/period)-pi/s.blades;aperture*=std::cos(pi/s.blades)/std::cos(sector);}if(rr>aperture+1e-9){valid=false;return;}energy*=taper(aperture-rr,aperture*s.softness);}
    double incident=travel>0?before[k]:after[k],exit=travel>0?after[k]:before[k];if(dot(d,normal)>0)normal=normal*(-1);double ci=-dot(d,normal),eta=incident/exit,kk=1-eta*eta*(1-ci*ci),T=0;
    if(kk>=0){double ct=std::sqrt(kk),rs=std::pow((incident*ci-exit*ct)/std::max(1e-20,incident*ci+exit*ct),2),rp=std::pow((exit*ci-incident*ct)/std::max(1e-20,exit*ci+incident*ct),2);T=1-(rs+rp)/2;if(s.coating>0)T=T*(1-s.coating)+s.coating*coatingTransmission(ci,incident,exit,waves[channel],s.coatingNm);}
    if(reflection){d=norm(d-normal*(2*dot(d,normal)));energy*=1-T;valid=d.z*travel< -1e-10;}else{if(kk<0){valid=false;return;}d=norm(d*eta+normal*(eta*ci-std::sqrt(kk)));energy*=T;valid=d.z*travel>1e-10;}
   };
   for(int k=0;k<=pair.j;k++)visit(k,1,k==pair.j);for(int k=pair.j-1;k>=pair.i;k--)visit(k,-1,k==pair.i);for(int k=pair.i+1;k<int(glass.size());k++)visit(k,1,false);
   if(!valid||energy<=0)continue;double tt=(config.f[SENSORZ]-p.z)/d.z;if(tt<0)continue;V hit=p+d*tt;double px=(hit.x/s.sensor+.5)*config.rw-.5,py=(hit.y/(s.sensor/s.aspect)+.5)*config.rh-.5;if(!std::isfinite(px)||!std::isfinite(py)||px< -1||py< -1||px>config.rw||py>config.rh)continue;double E=energy/count*flux[channel]*f.flareGain*config.f[BLEND]*std::pow(2.,config.f[EXPOSURE])*double(config.rw)/config.w*config.rh/config.h;hits[sample]={px,py,E,true};
  }
  // 1.2.17: gaussian splats sized by the spacing to the pupil-lattice neighbours (golden-angle spiral: indices differ
  // by Fibonacci numbers), so the reflected ghost is a continuous patch instead of 1024 speckles.
  static const int fib[]={1,2,3,5,8,13,21,34,55,89,144,233,377,610};
  for(int k=0;k<count;k++){const auto& h=hits[k];if(!h.ok||h.e==0)continue;double d[3]={1e30,1e30,1e30};
   for(int fbi:fib)for(int sgn:{-1,1}){int j=k+sgn*fbi;if(j<0||j>=count||!hits[j].ok)continue;double q=std::hypot(hits[j].x-h.x,hits[j].y-h.y);if(q<d[2]){d[2]=q;if(d[2]<d[1])std::swap(d[1],d[2]);if(d[1]<d[0])std::swap(d[0],d[1]);}}
   int n=0;double sum=0;for(double v:d)if(v<1e29){sum+=v;n++;}double sigma=std::clamp(n?.55*sum/n:.5,.5,24.);int R=int(std::ceil(2.5*sigma)),ix=int(std::floor(h.x)),iy=int(std::floor(h.y));
   double wsum=0;for(int dy=-R;dy<=R+1;dy++)for(int dx=-R;dx<=R+1;dx++){double ddx=ix+dx-h.x,ddy=iy+dy-h.y;wsum+=std::exp(-(ddx*ddx+ddy*ddy)/(2*sigma*sigma));}if(wsum<=0)continue;
   for(int dy=-R;dy<=R+1;dy++)for(int dx=-R;dx<=R+1;dx++){int x=ix+dx,y=iy+dy;if(x<0||y<0||x>=config.rw||y>=config.rh)continue;double ddx=x-h.x,ddy=y-h.y,wt=std::exp(-(ddx*ddx+ddy*ddy)/(2*sigma*sigma))/wsum;auto& pixel=output[size_t(y)*config.rw+x];(&pixel.x)[channel]+=float(h.e*wt);}}
 }
 }
}
