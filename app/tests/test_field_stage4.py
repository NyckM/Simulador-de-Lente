import sys,json,ctypes as C
from pathlib import Path
from dataclasses import asdict
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings
from optics.vignette import compensation_gain
from optics import cuda
O=ROOT/'research/field-stage4';O.mkdir(exist_ok=True)
# Cap, exact bypass, blocked support and continuous confidence at zero.
t=np.array([[.0,.000001,.0001],[.04,1.,.04],[.25,.125,.04]])
for limit in [0,1,3,6]:
 for amount in [0,50,100]:
  g=compensation_gain(t,3,3,amount,limit);assert np.isfinite(g).all() and g.min()>=1 and g.max()<=2**limit+1e-10
assert np.array_equal(compensation_gain(t,3,3,0),np.ones((3,3)))
assert np.array_equal(compensation_gain(t,3,3,100,0),np.ones((3,3)))
blocked=np.zeros((9,9));blocked[4,4]=1;assert compensation_gain(blocked,64,96,100,6)[0,0]==1
assert Settings.parse({'edge_compensation_limit':6}).edge_compensation_limit==6
try:Settings.parse({'edge_compensation_limit':6.1});raise AssertionError('missing limit validation')
except ValueError:pass
# Actual CUDA gather: absent cells may contain arbitrary unused positions.
h,w=64,96;y,x=np.mgrid[:h,:w];rgb=np.stack([x/w,y/h,.1+((x//7)%2)*.2],-1).astype('f4');rgba=np.concatenate([rgb,np.ones((h,w,1),dtype='f4')],-1)
cuda.upload(np.ascontiguousarray(rgba[::-1]),None,'stage4')
s=Settings(focus_m=1,source_m=5,iris_mm=8,ray_focus=True)
cuda.render(asdict(s),w,h,128,128,False,False,1,6,'stage4')
data=cuda._atlas;grid=data['grid'];taps=data['taps'];rays=data.ray_array.copy().reshape(3*taps,grid,grid,4);pupils=data.pupil_array.copy().reshape(rays.shape)
# Keep two adjacent fields with contrasting support; clear alternating left cells.
pupils[::2,:,1,2]=0
rays[pupils[...,2]==0]=0
ptr=C.POINTER(C.c_float)
def custom_render(r):
 cuda._check(cuda._dll.optica_cuda_atlas(np.ascontiguousarray(r).ctypes.data_as(ptr),np.ascontiguousarray(pupils).ctypes.data_as(ptr),r.size//4))
 out,info=cuda.render(asdict(s),w,h,128,128,False,False,1,6,'stage4');return out,info
before,info=custom_render(rays);rays[pupils[...,2]==0]=[500,-500,5,-5];after,info2=custom_render(rays)
assert np.array_equal(before,after),'Empty pupil cells influenced the CUDA ray moments'
report={'passed':True,'cuda_empty_cell_positions_ignored_exactly':True,'compensation_caps_ev':[0,1,3,6],'compensation_zero_exact':True,'blocked_fields_gain_one':True,'cuda_abi_bytes':C.sizeof(cuda.Config),'gpu_info':info2}
(O/'native-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))

