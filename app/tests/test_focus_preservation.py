import sys,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from dataclasses import asdict,replace
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root))
from optics.core import Settings,make_psf,srgb_decode,srgb_encode
from optics.focus_preservation import spread_scale
from optics import cuda
folder=root/'research/focus-stage12';folder.mkdir(exist_ok=True)
def fixture(w=192,h=128):
 im=Image.new('RGB',(w,h),(50,65,80));d=ImageDraw.Draw(im)
 # Fine background grid and light sources; face/eye details are analytic ground truth.
 for x in range(0,w,12):d.line((x,0,x,h),fill=(110,135,155),width=1)
 for y in range(0,h,12):d.line((0,y,w,y),fill=(100,125,145),width=1)
 d.ellipse((60,16,132,114),fill=(165,115,75))
 for y in range(30,106,3):d.line((72,y,118,y),fill=(205,155,105),width=1)
 d.ellipse((73,47,118,66),fill=(235,225,205));d.ellipse((91,47,105,65),fill=(20,35,40));d.ellipse((95,50,100,58),fill=(0,0,0));d.point((97,51),fill='white')
 for x in range(68,128,4):d.line((x,20,x-5,38),fill=(20,15,10),width=1)
 for x,y in [(15,18),(165,20),(158,108)]:d.ellipse((x-1,y-1,x+1,y+1),fill=(255,245,190))
 # Near grille to expose occlusion failures; tests do not claim stage 3 is fixed.
 for x in range(8,40,7):d.rectangle((x,75,x+2,119),fill=(20,20,20))
 z=np.full((h,w),5.,dtype='f4');yy,xx=np.mgrid[:h,:w];face=((xx-96)/36)**2+((yy-65)/49)**2<=1;z[face]=2.;z[75:120,8:40]=1.
 n=(1/z-1/6)/(1/1-1/6)
 return srgb_decode(np.asarray(im)/255),z,n
rgb,z,n=fixture();Image.fromarray((srgb_encode(rgb)*255).astype('uint8')).save(folder/'target-eye-hair-grid-lights.png');np.savez_compressed(folder/'fixture.npz',rgb=rgb,z_m=z,nearness=n)
# Smooth endpoints, monotonic falloff, and unchanged defocus outside the band.
u=np.linspace(0,.1,1001);scale=spread_scale(1/(.5+u),2,1,.1)
assert scale[0]==0 and scale[-1]==1 and np.all(np.diff(scale)>=-1e-12)
assert abs(scale[1]-scale[0])<1e-5 and abs(scale[-1]-scale[-2])<1e-5
cases=[]
for model in ('dgauss50','zeiss_planar_50'):
 for iris in (3.,8.):
  for field in ((0,0),(9,0),(17,10)):
   s=Settings(lens_model=model,focus_m=2,source_m=2,iris_mm=iris)
   old,light,ok=make_psf(field,2,s,384,2048);same,_,_=make_psf(field,2,replace(s,focus_preservation=0,focus_width=.2),384,2048);assert np.array_equal(old,same)
   sharp,light2,_=make_psf(field,2,replace(s,focus_preservation=1),384,2048);assert light==light2 and np.allclose(sharp.sum((0,1)),1)
   assert np.allclose(sharp[sharp.shape[0]//2,sharp.shape[1]//2],1)
   for outside in (1.,5.):
    far,_,_=make_psf(field,outside,s,384,2048);far2,_,_=make_psf(field,outside,replace(s,focus_preservation=1),384,2048);assert np.array_equal(far,far2)
   cases.append(dict(model=model,iris=iris,field=field,transmission=light,physical_center=float(old[old.shape[0]//2,old.shape[1]//2,1]),preserved_center=1.))
rgba=np.concatenate((rgb,np.ones((*rgb.shape[:2],1))),-1).astype('f4');cuda.upload(np.ascontiguousarray(rgba[::-1]),np.ascontiguousarray(n[::-1],dtype='f4'),'stage12')
s=Settings(focus_m=2,source_m=5,iris_mm=8,ray_focus=True,near_m=1,far_m=6,invert_depth=False,depth_mode='slicing',depth_slices=16)
frames={}
for strength in (0,.5,1):
 image,info=cuda.render(asdict(replace(s,focus_preservation=strength)),192,128,128,512,True,False,1,6,'stage12');frames[strength]=image[::-1,:,:3].copy();Image.fromarray((srgb_encode(frames[strength])*255).astype('uint8')).save(folder/f'cuda-{strength}.png')
def detail(im):return float(np.abs(np.diff(im[49:64,80:113],axis=1)).mean())
metrics={str(k):detail(v) for k,v in frames.items()};assert metrics['1']>metrics['0']+1e-4,metrics
# Background patch away from the silhouette remains bit-identical.
assert np.array_equal(frames[0][:30,140:],frames[1][:30,140:])
report=dict(passed=True,psf_cases=cases,cuda_eye_detail=metrics,background_unchanged=True,transition_smooth=True,disabled_exact=True,stage3_not_claimed=True)
(folder/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='psf_cases'}))

