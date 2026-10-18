import sys,json,ctypes as C
from pathlib import Path
from dataclasses import asdict,replace
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,make_psf
from optics.focus_preservation import spread_scale
from optics import cuda
O=ROOT/'research/blur-stage6';O.mkdir(exist_ok=True)
x=np.linspace(.5,8,2000)
assert np.array_equal(spread_scale(x,2),np.ones_like(x))
assert spread_scale(2,2,0,.1,0,200)==1
assert spread_scale(.5,2,0,.1,0,100)==0 and spread_scale(8,2,0,.1,0,100)==1
assert spread_scale(.5,2,0,.1,100,0)==1 and spread_scale(8,2,0,.1,100,0)==0
assert abs(float(spread_scale(2-1e-6,2,0,.1,0,200))-float(spread_scale(2+1e-6,2,0,.1,0,200)))<1e-8
s=Settings.parse(dict(focus_m=2,source_m=5,iris_mm=4,ray_focus=True))
board=Image.new('RGB',(800,430),(10,18,14));draw=ImageDraw.Draw(board);cases=[]
for row,distance in enumerate([.7,5]):
 for col,gain in enumerate([0,50,100,200]):
  state=replace(s,foreground_blur=gain if row==0 else 100,background_blur=gain if row else 100)
  psf,t,_=make_psf((0,0),distance,state,384,4096)
  yy,xx=np.indices(psf.shape[:2]);moment=float(((xx-psf.shape[1]//2)**2+(yy-psf.shape[0]//2)**2).ravel()@psf.mean(2).ravel())
  assert np.allclose(psf.sum((0,1)),1)
  tile=Image.fromarray((np.clip(psf.mean(2)/psf.max(),0,1)**.5*255).astype('uint8')).resize((180,180),Image.Resampling.NEAREST)
  intensity=(np.clip(psf.mean(2)/psf.max(),0,1)**.5*255).astype('uint8')
  fixed=np.zeros((81,81),dtype='uint8');hh,ww=intensity.shape;assert max(hh,ww)<=81
  fixed[(81-hh)//2:(81-hh)//2+hh,(81-ww)//2:(81-ww)//2+ww]=intensity
  tile=Image.fromarray(fixed).resize((180,180),Image.Resampling.NEAREST)
  board.paste(tile,(col*200+10,row*215+30));draw.text((col*200+10,row*215+10),f'{"Frente" if row==0 else "Fundo"} {gain}%',fill=(170,238,206))
  cases.append(dict(distance=distance,gain=gain,moment=moment,transmission=t))
 for i in range(row*4,row*4+3):assert cases[i]['moment']<cases[i+1]['moment']
 assert len({c['transmission'] for c in cases[row*4:row*4+4]})==1
board.save(O/'desfoque-por-lado.png')
h,w=64,96;rgba=np.full((h,w,4),.03,dtype='f4');rgba[...,3]=1;rgba[h//2,w//2,:3]=3
cuda.upload(np.ascontiguousarray(rgba[::-1]),None,'sides')
frames=[]
for distance in [.7,5]:
 state=replace(s,source_m=distance)
 base,_=cuda.render(asdict(state),w,h,256,512,False,False,.6,6,'sides')
 opposite=replace(state,background_blur=0) if distance<2 else replace(state,foreground_blur=0)
 same,_=cuda.render(asdict(opposite),w,h,256,512,False,False,.6,6,'sides');assert np.array_equal(base,same)
 selected=replace(state,foreground_blur=0) if distance<2 else replace(state,background_blur=0)
 sharp,_=cuda.render(asdict(selected),w,h,256,512,False,False,.6,6,'sides');assert abs(base-sharp).max()>.001
 restored,_=cuda.render(asdict(state),w,h,256,512,False,False,.6,6,'sides');assert np.array_equal(base,restored)
 frames.append(base)
# Strict older buffers must never read new fields and default to 100%.
raw=C.CDLL(str(ROOT/'native/cuda/bin/optica_cuda.dll'));ptr=C.POINTER(C.c_float);original=cuda._dll.optica_cuda_render;legacy=[]
for version,size in [(1,344),(2,356),(3,372)]:
 fn=getattr(raw,'optica_cuda_render'+('' if version==1 else '_v'+str(version)));fn.argtypes=[C.c_void_p,ptr,ptr]
 def oldcall(config,out,ms):
  buf=C.create_string_buffer(C.string_at(config,size));return fn(C.cast(buf,C.c_void_p),out,ms)
 cuda._dll.optica_cuda_render=oldcall
 old,_=cuda.render(asdict(s),w,h,256,512,False,False,.6,6,'sides');assert np.array_equal(old,frames[1]);legacy.append(version)
cuda._dll.optica_cuda_render=original
assert C.sizeof(cuda.Config)==380
report=dict(passed=True,psf_cases=cases,default_exact=True,opposite_side_exact=True,near_focus_continuity=True,legacy_adapters=legacy,config_bytes=380)
(O/'native-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
