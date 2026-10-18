"""Signed bokeh character: actual CUDA/GLSL renders and focus behavior."""
from dataclasses import asdict
from render_gpu_banding import *
from optics import cuda

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[H//2-1:H//2+2,W//2-1:W//2+2,:3]=10
 cuda.upload(raw,token='impression')
 results=[];images=[]
 for strength in (-1.,0.,1.):
  s=Settings(focus_m=2,source_m=5,iris_mm=8.55,blades=0,impression=strength)
  a,info=cuda.render(dict(asdict(s),bokeh_gain=6),W,H,1024,1024,token='impression')
  ref=render(ctx,1024,True,s,raw,None,'settings',gain=6)
  error=float(np.mean(abs(a[...,:3]-ref)));assert error<.001,error
  again,_=cuda.render(dict(asdict(s),bokeh_gain=6),W,H,1024,1024,token='impression');np.testing.assert_array_equal(a,again)
  y,x=np.mgrid[:H,:W];r=np.hypot(x-W//2,y-H//2);profile=[float(a[...,1][(r>=i)&(r<i+1)].mean()) for i in range(90)]
  center=float(a[H//2,W//2,1]);ring=max(profile);results.append(dict(strength=strength,center=center,ring=ring,ring_radius=int(np.argmax(profile)),glsl_error=error,gpuMs=info['gpuMs']));images.append(a)
 assert results[0]['ring']/results[0]['center']>2,results

 assert results[2]['ring']/results[2]['center']<1.5,results
 # Exactly on the focus plane, the new mapping leaves the image unchanged.
 focused=[]
 for strength in (-1.,0.,1.):
  s=Settings(focus_m=5,source_m=5,iris_mm=8.55,blades=0,impression=strength)
  a,_=cuda.render(dict(asdict(s),bokeh_gain=6),W,H,256,256,token='impression');focused.append(a)
 np.testing.assert_array_equal(focused[0],focused[1]);np.testing.assert_array_equal(focused[1],focused[2])
 # The same pupil mapping reverses across the physical focus-plane offset.
 # Symmetric sensor offsets avoid confusing the test with lens breathing.
 lens=get_lens(Settings());delta=focus_plane(2,lens)-focus_plane(5,lens)
 front=[]
 for strength in (-1.,1.):
  s=Settings(focus_m=5,source_m=5,filmback_mm=-delta,iris_mm=8.55,blades=0,impression=strength)
  a,_=cuda.render(dict(asdict(s),bokeh_gain=6),W,H,1024,1024,token='impression');front.append(a)
 assert front[0][H//2,W//2,1]>front[1][H//2,W//2,1]*2, 'Foreground response did not reverse'

 canvas=Image.new('RGB',(960,380),'#101312');d=ImageDraw.Draw(canvas)
 for i,a in enumerate(images):
  crop=a[H//2-80:H//2+80,W//2-80:W//2+80,:3];v=np.clip(crop*6,0,1);v=np.where(v<=.0031308,v*12.92,1.055*v**(1/2.4)-.055);im=Image.fromarray(np.uint8(v*255)).resize((320,320))
  canvas.paste(im,(i*320,50));d.text((i*320+12,15),['Negativo -1 / anel','Neutro 0','Positivo +1 / centro'][i],fill='#bbefca')
 canvas.save(ROOT.parent/'Impression-0.9.1.png');(ROOT.parent/'Impression-0.9.1-tests.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results))
if __name__=='__main__':main()
