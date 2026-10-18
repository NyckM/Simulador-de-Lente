"""Cache invalidation and compact transport against the previous native DLL."""
import sys,ctypes as C
from pathlib import Path
from dataclasses import asdict
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import cuda
from optics.core import Settings
ROOT=Path(__file__).resolve().parents[1]
assert cuda.available();current=cuda._dll
previous=C.CDLL(str(ROOT.parent/'Simulador-de-Desfoque-Bruxosdovfx-0.9.6.15-Windows/SimuladorDeDesfoque/_internal/native/cuda/bin/optica_cuda.dll'))
for name in ['optica_cuda_source','optica_cuda_atlas','optica_cuda_render']:
 getattr(previous,name).argtypes=getattr(current,name).argtypes
previous.optica_cuda_error.restype=C.c_char_p;previous.optica_cuda_device.restype=C.c_char_p
assert previous.optica_cuda_init()==0
h,w=96,160;rng=np.random.default_rng(13)
raw=rng.random((h,w,4),dtype='f4');raw[:,:,3]=1;raw[20:22,30:32,:3]=20
depth=rng.random((h,w),dtype='f4')
cases=[{},dict(focus_m=2),dict(highlight_gain=2),dict(depth_gain=.8,depth_bias=.1),dict(highlight_view='highlights',highlight_threshold=.3),dict(depth_mode='cut',depth_cut=.2),dict(depth_slices=4),dict(highlight_view='base'),dict(iris_mm=3),dict(exposure=1)]
outputs=[]
for dll in [previous,current]:
 cuda._dll=dll;cuda._atlas=None;cuda.upload(raw,depth,'cache')
 frames=[]
 for case in cases:
  s={**asdict(Settings(source_m=5,near_m=2,far_m=5)),**case}
  a,_=cuda.render(s,w,h,48,64,True,False,2,5,'cache');frames.append(a)
  again,_=cuda.render(s,w,h,48,64,True,False,2,5,'cache');np.testing.assert_array_equal(a,again)
  if dll is current:
   small,info=cuda.render(s,w,h,48,64,True,False,2,5,'cache',preview=True)
   np.testing.assert_array_equal(small,a.astype('f2'));assert small.nbytes*2==a.nbytes
   assert info['precision']=='float16'
 cuda.upload(raw*.5,depth,'cache');a,_=cuda.render(s,w,h,48,64,True,False,2,5,'cache');frames.append(a)
 outputs.append(frames)
for a,b in zip(*outputs):np.testing.assert_array_equal(a,b)
cuda._dll=current;cuda._atlas=None;cuda.upload(raw,depth,'glitter-cache')
for updates in [dict(shimmer_amount=4,shimmer_threshold=.1),dict(shimmer_amount=4,shimmer_threshold=.6),dict(eclipse_bokeh=True),dict(eclipse_bokeh=False)]:
 s={**asdict(Settings(source_m=5,near_m=2,far_m=5)),**updates}
 warm,_=cuda.render(s,w,h,48,64,True,False,2,5,'glitter-cache')
 cuda.upload(raw,depth,'glitter-cache')
 fresh,_=cuda.render(s,w,h,48,64,True,False,2,5,'glitter-cache')
 np.testing.assert_array_equal(warm,fresh)
print('Cache invalidation, repeated graphs, source replacement and float16 transport passed.')
