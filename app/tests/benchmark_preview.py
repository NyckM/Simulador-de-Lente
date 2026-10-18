"""Compare focus-rack throughput and preserve full-precision reference frames."""
from pathlib import Path
import sys,json,time
from dataclasses import asdict
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import cuda
from optics.core import Settings
ROOT=Path(__file__).resolve().parents[1]
phase=sys.argv[1]
h,w=480,768
yy,xx=np.mgrid[:h,:w]
raw=np.ones((h,w,4),'f4');raw[...,:3]=[.01,.025,.04]
raw[100:380,280:470,:3]=[.08,.4,.14]
for y,x in [(60,100),(190,190),(300,580),(390,650)]:raw[y:y+3,x:x+3,:3]=[12,6,2]
binary=np.zeros((h,w),'f4');binary[100:380,280:470]=1
results=[];frames={}
for name,depth,enabled in [('flat',binary,False),('cut',binary,True),('ramp',(xx/w).astype('f4'),True)]:
 cuda.upload(raw,depth,'benchmark')
 times=[];gpu=[]
 for i,focus in enumerate([2.,2.1,3.,4.,5.,3.5]):
  s=asdict(Settings(focus_m=focus,source_m=5,near_m=2,far_m=5,depth_slices=12))
  image,info=cuda.render(s,w,h,96,256,enabled,False,2,5,'benchmark')
  if i:times.append(info['totalMs']);gpu.append(info['gpuMs'])
  frames[f'{name}-{i}']=image
 results.append(dict(case=name,totalMs=float(np.median(times)),gpuMs=float(np.median(gpu))))
np.savez(ROOT.parent/f'Preview-{phase}-frames.npz',**frames)
(ROOT.parent/f'Preview-{phase}-benchmark.json').write_text(json.dumps(results,indent=2))
if phase=='after':
 baseline=np.load(ROOT.parent/'Preview-before-frames.npz')
 for key,image in frames.items():np.testing.assert_array_equal(image,baseline[key])
print(json.dumps(results),flush=True)
