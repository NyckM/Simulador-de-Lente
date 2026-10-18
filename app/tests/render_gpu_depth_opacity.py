"""Regression: depth partitions must not leak bright background or form bands."""
from dataclasses import asdict
import render_gpu_banding as gpu
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 yy,xx=np.mgrid[:H,:W]
 depth=np.broadcast_to(np.linspace(0,1,W,dtype='f4'),(H,W)).copy()
 raw=np.ones((H,W,4),'f4');raw[...,:3]=(.08+.5*(xx<W*.22))[...,None];raw[...,1]*=.7
 s=Settings(focus_m=3,source_m=3,near_m=2,far_m=5,iris_mm=8.55,blades=0,depth_mode='slicing',depth_slices=12)
 fixed=gpu.SHADERS
 legacy=fixed.replace('mask=eclipseBokeh?weight:weight/max(cumulative,.00001);','mask=weight;')
 assert legacy!=fixed
 gpu.SHADERS=legacy;before=render(ctx,128,True,s,raw,depth,False,gain=0)
 gpu.SHADERS=fixed;after=render(ctx,128,True,s,raw,depth,False,gain=0)
 reference=render(ctx,128,True,s,raw,None,False,gain=0)
 old_error=float(abs(before-reference).mean());new_error=float(abs(after-reference).mean())
 assert old_error>.02 and new_error<.0001,(old_error,new_error)
 results=[];images=[]
 flat=raw.copy();flat[...,:3]=[.08,.056,.08]
 for n in (8,12,24):
  s.depth_slices=n
  gpu.SHADERS=legacy;a=render(ctx,128,True,s,raw,depth,False,gain=4)
  gpu.SHADERS=fixed;b=render(ctx,128,True,s,raw,depth,False,gain=4)
  baseline=render(ctx,128,True,s,flat,depth,False,gain=4)
  region=np.s_[100:300,450:600,:]
  old_leak=float(abs(a[region]-baseline[region]).mean());new_leak=float(abs(b[region]-baseline[region]).mean())
  assert new_leak<.002 and new_leak<old_leak*.03,(n,old_leak,new_leak)
  results.append(dict(slices=n,background_leak_before=old_leak,background_leak_after=new_leak))
  if n==12:images=[a,b]
 # CUDA must use the same opacity conversion, including non-binary depth.
 from optics import cuda
 assert cuda.available(),cuda.info()
 cuda_errors=[]
 for n in (8,12,24):
  s.depth_slices=n
  cuda.upload(raw,depth,'depth-opacity')
  a,info=cuda.render(dict(asdict(s),bokeh_gain=4),W,H,128,128,True,False,2,5,'depth-opacity')
  b=render(ctx,128,True,s,raw,depth,False,gain=4)
  error=float(abs(a[...,:3]-b).mean());assert error<.001,error;cuda_errors.append(error)
 canvas=Image.new('RGB',(W*2,H+40),'#202020');draw=ImageDraw.Draw(canvas)
 font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate(zip(('Antes / brilho e fatias','Depois / composição corrigida'),images)):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,12.92*c,1.055*c**(1/2.4)-.055)
  canvas.paste(Image.fromarray(np.uint8(c*255)),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#eee')
 canvas.save(ROOT.parent/'Depth-Brilho-Fatias-Corrigido.png')
 result=dict(no_blur_mean_error_before=old_error,no_blur_mean_error_after=new_error,depth_ramps=results,cuda_glsl_errors=cuda_errors)
 (ROOT.parent/'Depth-Brilho-Fatias-Corrigido.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()


