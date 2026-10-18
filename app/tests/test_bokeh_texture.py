import sys,json,ctypes as C
from pathlib import Path
from dataclasses import asdict,replace
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,make_psf
from optics.bokeh_texture import modulation
from optics import cuda
O=ROOT/'research/texture-stage5';O.mkdir(exist_ok=True)
p=np.random.default_rng(4).uniform(-1.5,1.5,(20000,2))
assert np.array_equal(modulation(p),np.ones(len(p)))
assert modulation(p,1,1,12,360).min()>=.06-1e-10
s=Settings(focus_m=.6,source_m=5,iris_mm=8,ray_focus=True)
plain,trans,ok=make_psf((0,0),5,s,1080,16384);assert ok
profiles=[('Sem textura',0,0),('Aneis',1,0),('Granulacao',0,1),('Combinacao',1,1)]
board=Image.new('RGB',(1000,280),(10,18,14));d=ImageDraw.Draw(board);cases=[]
for i,(name,rings,grain) in enumerate(profiles):
 settings=replace(s,bokeh_texture_rings=rings,bokeh_texture_grain=grain)
 psf,t,_=make_psf((0,0),5,settings,1080,16384)
 assert np.array_equal(psf>0,plain>0) and t==trans and np.allclose(psf.sum((0,1)),1)
 delta=float(abs(psf-plain).sum());assert i==0 or delta>.05
 tile=Image.fromarray((np.clip(psf/psf.max(),0,1)**.6*255).astype('uint8')).resize((210,210),Image.Resampling.NEAREST)
 board.paste(tile,(i*250+20,40));d.text((i*250+20,15),name,fill=(170,238,206));cases.append({'profile':name,'l1_delta':delta,'same_support':True,'same_transmission':True,'normalized_energy':True})
board.save(O/'textura-bokeh.png')
# Frame and atlas reuse: uniforms redistribute ray weights without tracing.
h,w=64,96;rgba=np.full((h,w,4),.03,dtype='f4');rgba[...,3]=1;rgba[h//2,w//2,:3]=3
cuda.upload(np.ascontiguousarray(rgba[::-1]),None,'texture')
base,info=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture')
textured,info=cuda.render(asdict(replace(s,bokeh_texture_rings=1,bokeh_texture_grain=1)),w,h,256,512,False,False,1,6,'texture')
restored,info=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture')
assert np.array_equal(base,restored) and abs(textured-base).max()>1e-4
# v2 adapter has a strictly 356-byte buffer. Never read the appended v3 fields.
raw=C.CDLL(str(ROOT/'native/cuda/bin/optica_cuda.dll'));ptr=C.POINTER(C.c_float);fn=raw.optica_cuda_render_v2;fn.argtypes=[C.c_void_p,ptr,ptr];original=cuda._dll.optica_cuda_render
seen=[]
def v2call(config,out,ms):
 buf=C.create_string_buffer(C.string_at(config,356));seen.append(356);return fn(C.cast(buf,C.c_void_p),out,ms)
cuda._dll.optica_cuda_render=v2call
old,info=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture');cuda._dll.optica_cuda_render=original
assert np.array_equal(base,old)
# Preserve the v2 focus fields, and verify the original 344-byte entry too.
focus_settings=replace(s,focus_m=5,focus_preservation=1)
focus_new,_=cuda.render(asdict(focus_settings),w,h,256,512,False,False,1,6,'texture')
cuda._dll.optica_cuda_render=v2call
focus_old,_=cuda.render(asdict(focus_settings),w,h,256,512,False,False,1,6,'texture');cuda._dll.optica_cuda_render=original
assert np.array_equal(focus_new,focus_old)
legacy=raw.optica_cuda_render;legacy.argtypes=[C.c_void_p,ptr,ptr]
def v1call(config,out,ms):
 buf=C.create_string_buffer(C.string_at(config,344));return legacy(C.cast(buf,C.c_void_p),out,ms)
cuda._dll.optica_cuda_render=v1call
legacy_frame,_=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture');cuda._dll.optica_cuda_render=original
assert np.array_equal(base,legacy_frame)
# Both half-precision entry points also accept the old strict-size buffer.
half_original=cuda._dll.optica_cuda_render_half
half_base,_=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture',preview=True)
half_v2=raw.optica_cuda_render_half_v2;half_v2.argtypes=[C.c_void_p,C.POINTER(C.c_ushort),ptr]
def v2half(config,out,ms):
 buf=C.create_string_buffer(C.string_at(config,356));return half_v2(C.cast(buf,C.c_void_p),out,ms)
cuda._dll.optica_cuda_render_half=v2half
half_old,_=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'texture',preview=True);cuda._dll.optica_cuda_render_half=half_original
assert np.array_equal(half_base,half_old)
# A constant full-frame signal remains constant away from the frame border.
rgba[:,:,:3]=.03;cuda.upload(np.ascontiguousarray(rgba[::-1]),None,'flat')
a,_=cuda.render(asdict(s),w,h,256,512,False,False,1,6,'flat');b,_=cuda.render(asdict(replace(s,bokeh_texture_rings=1,bokeh_texture_grain=1)),w,h,256,512,False,False,1,6,'flat')
flat_error=float(abs(a[16:-16,24:-24]-b[16:-16,24:-24]).max());assert flat_error<1e-6
report={'passed':True,'psf_profiles':cases,'cuda_changes_image':True,'disabled_exact':True,'flat_field_max_error':flat_error,'v1_adapter_exact':True,'v1_config_bytes':344,'v2_adapter_exact':True,'v2_focus_fields_preserved':True,'v2_half_adapter_exact':True,'v2_config_bytes':356,'v3_config_bytes':C.sizeof(cuda.Config)}
(O/'native-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
