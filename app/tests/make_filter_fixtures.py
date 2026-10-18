from pathlib import Path
import sys,json,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics.filters import KINDS,DEFAULT,apply
h,w=32,48;y,x=np.mgrid[:h,:w];rgb=np.stack((x/(w-1),y/(h-1),np.ones((h,w))*.125),-1);rgb[10:15,22:27]=[3,2,1];rgb=rgb.astype(np.float16).astype(float)
cases=[]
for kind in KINDS:
 f={**DEFAULT,'kind':kind,'radius':.15,'rotation':27,'scale_x':1.2,'scale_y':.8,'pivot_x':.1,'threshold':.1,'count':4}
 if kind=='replicate':f['shift']=.15
 if kind=='fringing':f.update(threshold=.01,softness=.05,shift=.02)
 result=apply(rgb,[f]);assert np.isfinite(result).all() and (result>=0).all();cases.append(dict(kind=kind,filters=[f],expected=result.tolist()))
for kind in KINDS:
 f={**DEFAULT,'kind':kind,'amount':0};assert apply(rgb,[f]) is rgb
 uniform=np.ones((h,w,3))*.4
 if kind not in ('halation',):np.testing.assert_allclose(apply(uniform,[{**DEFAULT,'kind':kind}]),uniform,atol=1e-12)
Path('research/filter-reference-fixtures.json').write_text(json.dumps(dict(width=w,height=h,source=rgb.tolist(),cases=cases)),encoding='utf-8')
print('13 profiles: finite, nonnegative, exact bypass and neutral constants passed')
