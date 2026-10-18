"""Build-time generation only; the AEX has no Python dependency."""
from pathlib import Path
import sys,json,unicodedata
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
from optics.core import Lens,LENS_PROFILES
HERE=Path(__file__).parent
s=(ROOT/'native/cuda/engine.cu').read_text()
s=s.replace('NUMF=PAIR2+4','PIXELASPECT=PAIR2+4,NUMF=PIXELASPECT+1').replace('s.h/s.w','s.h/s.w/s.f[PIXELASPECT]')
(HERE/'GpuEngine.generated.cu').write_text(s)
config=s[s.index('enum F'):s.index('struct Pyramid')]
(HERE/'Config.h').write_text('#pragma once\n'+config)
device=s[s.index('__device__ float sat'):s.index('static int setupPyramid')].replace('__device__','inline').replace('__global__','inline')
prefix='''#include "Engine.h"
#include <algorithm>
#include <cmath>
using std::min;using std::max;using std::abs;
struct Index{int x;};static thread_local Index blockIdx{},threadIdx{};static const Index blockDim{256};
struct Pyramid {float4* p;int n,w[16],h[16],off[16];};
'''
suffix='''
template<class Fn> void run(int n,Fn fn){
 #pragma omp parallel for
 for(int i=0;i<n;i++){blockIdx.x=i/256;threadIdx.x=i%256;fn();}
}
struct Buffer{Pyramid p{};std::vector<float4> data;Buffer(int w,int h){int o=0;do{int l=p.n++;p.w[l]=w;p.h[l]=h;p.off[l]=o;o+=w*h;if(w==1&&h==1)break;w=max(1,w/2);h=max(1,h/2);}while(p.n<16);data.resize(o);p.p=data.data();}void build(){for(int l=1;l<p.n;l++)run(p.w[l]*p.h[l],[&](){pyramidLevel(p,l);});}};
void cpuRender(Config s,const std::vector<float4>& input,const std::vector<float>& depth,const Atlas& atlas,std::vector<float4>& out){
 Buffer full(s.w,s.h),base(s.w,s.h),layer(s.w,s.h);out.assign(s.rw*s.rh,{});
 run(s.w*s.h,[&](){prefilter(full.p.p,base.p.p,input.data(),s);});full.build();base.build();
 for(int i=0;i<s.slices;i++){bool direct=!s.depth&&s.part==0;if(!direct){run(s.w*s.h,[&](){maskLayer(layer.p.p,full.p,depth.data(),s,i);});layer.build();}run(s.rw*s.rh,[&](){gather(out.data(),direct?full.p:layer.p,full.p,depth.data(),atlas.rays.data(),atlas.pupils.data(),s,i);});}
 run(s.rw*s.rh,[&](){finish(out.data(),base.p,full.p,s);});
}
'''
(HERE/'CpuEngine.generated.cpp').write_text(prefix+device+suffix)
surfaces=[];lenses=[];names=[]
for key,profile in LENS_PROFILES.items():
 try:lens=Lens(model=key)
 except (ValueError,RuntimeError,KeyError,FileNotFoundError):continue
 offset=len(surfaces)
 for row in lens.surfaces:surfaces.append('{'+','.join(format(float(row[k]),'.12g') for k in ('curvature_radius','thickness','aperture_diameter','nd'))+','+str(int(bool(row.get('is_stop'))))+'}')
 name=unicodedata.normalize('NFKD',profile['name']).encode('ascii','ignore').decode().replace('|','/').replace('"','')
 names.append(name)
 look=profile.get('look',{})
 lenses.append('{'+json.dumps(name)+','+f'{offset},{len(lens.surfaces)},{lens.efl:.12g},{lens.max_iris:.12g},'+','.join(str(look.get(k,d)) for k,d in [('swirl',0),('coma',0),('spherical3',0),('dispersion',0),('blades',7)])+'}')
(HERE/'Prescriptions.generated.h').write_text('#pragma once\nstruct Surface{double radius,thickness,diameter,nd;bool stop;};\nstruct Prescription{const char* name;int offset,count;double focal,maxIris,swirl,coma,spherical,dispersion;int blades;};\nstatic const Surface surfaces[]={\n'+',\n'.join(surfaces)+'\n};\nstatic const Prescription prescriptions[]={\n'+',\n'.join(lenses)+'\n};\nstatic const char presetNames[]='+json.dumps('|'.join(names))+';\nstatic constexpr int presetCount='+str(len(names))+';\n')
print('Generated',len(names),'lens prescriptions')
