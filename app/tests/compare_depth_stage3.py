import sys,json,time
from pathlib import Path
import numpy as np
from dataclasses import asdict,replace
A=Path(sys.argv[1]).resolve();sys.path.insert(0,str(A))
from optics.core import Settings,srgb_encode
from optics import cuda
O=Path(__file__).resolve().parents[1]/'research/depth-stage3';O.mkdir(exist_ok=True)
w,h=192,128;y,x=np.mgrid[:h,:w];mask=((x-96)/31)**2+((y-64)/47)**2<1
# Known underlying gradient and bars let us measure estimated hidden color.
bg=np.stack([.08+.4*x/w,.08+.25*y/h,.08+.25*x/w],-1).astype('f4');bg+=((x//12)%2)[...,None]*.18
fg=np.full_like(bg,[.6,.025,.02]);rgb=np.where(mask[...,None],fg,bg);depth=mask.astype('f4')
s=Settings(focus_m=1,source_m=5,iris_mm=8,ray_focus=True,near_m=1,far_m=5,invert_depth=False,depth_mode='slicing',depth_slices=16,focus_preservation=1)
def draw(im,d,settings,use):
 rgba=np.concatenate([im,np.ones((h,w,1))],-1).astype('f4');cuda.upload(np.ascontiguousarray(rgba[::-1]),np.ascontiguousarray(d[::-1]),'stage3');start=time.perf_counter();out,info=cuda.render(asdict(settings),w,h,256,512,use,False,1,5,'stage3');return out[::-1,:,:3].copy(),time.perf_counter()-start
out,elapsed=draw(rgb,depth,s,True);back,_=draw(bg,np.zeros_like(depth),s,False);front,_=draw(fg,np.zeros_like(depth),replace(s,source_m=1),False);oracle=np.where(mask[...,None],front,back)
from scipy.ndimage import binary_dilation
ring=binary_dilation(mask,iterations=8)&~mask
label=sys.argv[2]
np.savez_compressed(O/(label+'.npz'),out=out,oracle=oracle,rgb=rgb,bg=bg,mask=mask,depth=depth)
for name,img in [(label,out),('input',rgb),('oracle',oracle)]:
 from PIL import Image
 Image.fromarray((np.clip(srgb_encode(img),0,1)*255).astype('uint8')).save(O/(name+'.png'))
report={'label':label,'ring_mae':float(abs(out-oracle)[ring].mean()),'finite':bool(np.isfinite(out).all()),'render_seconds':elapsed}
(O/(label+'.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report))

for mode,use,conf in [('no-depth',False,s),('eclipse',True,replace(s,eclipse_bokeh=True)),('cut',True,replace(s,depth_mode='cut'))]:
 frame,seconds=draw(rgb,depth,conf,use)
 np.save(O/(label+'-'+mode+'.npy'),frame)
 print(mode,seconds)
