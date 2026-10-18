"""A focused textured plane must not inherit a neighboring defocus PSF."""
from dataclasses import replace,asdict
from pathlib import Path
import sys,json
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics.core import Settings,depth_layers
from optics.depth_mapping import focus_partition,focus_anchor
from optics import cuda

s=Settings(lens_model='zeiss_planar_50',focus_m=2.7,source_m=2.7,
           iris_mm=4,near_m=2,far_m=10,depth_slices=12,depth_mode='slicing',
           invert_depth=False,ray_backend='cpu',ray_focus=True,field_grid=3)
checks=[]
for focus in [2.0001,2.7,4.3,9.9999,1,20]:
 for n in [4,12,32]:
  q=replace(s,focus_m=focus,depth_slices=n)
  x=np.linspace(0,1,1001);y=focus_partition(x,q)
  assert np.all(np.diff(y)>0) and y[0]==0 and y[-1]==1
  assert np.max(abs(focus_partition(y,q,inverse=True)-x))<1e-12
  f=focus_anchor(q)
  if f:
   layers=depth_layers(np.array([[f,0.,1.]]),q)
   weights=np.array([m[0,0] for _,m in layers])
   assert abs(weights.sum()-1)<1e-12
   assert weights.max()>1-1e-12
   distance=layers[int(weights.argmax())][0]
   assert abs(distance-focus)<1e-10
  checks.append([focus,n])
assert cuda.available(),cuda.info()
h,w=64,96
rgba=np.ones((h,w,4),dtype='f4')
yy,xx=np.indices((h,w));rgba[...,:3]=(.2+.6*((xx//2+yy//2)%2))[...,None]
f=focus_anchor(s);depth=np.full((h,w),f,dtype='f4')
cuda.upload(rgba,depth,'anchor')
plain,_=cuda.render(asdict(s),w,h,128,128,False,False,2,10,'anchor')
focused,_=cuda.render(asdict(s),w,h,128,128,True,False,2,10,'anchor')
error=float(abs(plain[12:-12,12:-12,:3]-focused[12:-12,12:-12,:3]).max())
assert error<.003,error
# Moving focus changes cached masks; returning must reproduce the first result.
moved,_=cuda.render(asdict(replace(s,focus_m=4.3)),w,h,128,128,True,False,2,10,'anchor')
again,_=cuda.render(asdict(s),w,h,128,128,True,False,2,10,'anchor')
assert np.array_equal(again,focused)
assert np.max(abs(moved-focused))>.01
report=dict(partition_cases=len(checks),cuda_device=cuda.info()['device'],focused_vs_single_plane_max_error=error,focus_cache_restore_exact=True)
Path('research/focus-anchor-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(report)
