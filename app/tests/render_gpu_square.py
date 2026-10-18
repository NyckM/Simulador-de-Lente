"""Bokeh cell reconstruction must not amplify a coarse mip's square support."""
import render_gpu_banding as gpu
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[198:201,318:321,:3]=[80,40,8]
 s=Settings(focus_m=1,source_m=5,iris_mm=8.55,blades=0)
 before=render(ctx,512,False,s,raw,creative=False,gain=3,samples=96)
 after=render(ctx,512,True,s,raw,creative=False,gain=3,samples=96)
 again=render(ctx,512,True,s,raw,creative=False,gain=3,samples=96);np.testing.assert_array_equal(after,again)
 yy,xx=np.mgrid[:H,:W];x=xx-319;y=yy-199;r=np.hypot(x,y);theta=np.arctan2(y,x)
 def square(a):
  c=a[...,0];outer=(r>8)&(r<45);return float(abs((c[outer]*np.cos(4*theta[outer])).sum())/c[outer].sum())
 result=dict(renderer=ctx.info['GL_RENDERER'],before_fourfold=square(before),after_fourfold=square(after),energy_ratio=float(after[...,0].sum()/before[...,0].sum()),stable=True)
 print(json.dumps(result))
 canvas=Image.new('RGB',(600,330),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',17)
 for i,(label,image) in enumerate([('Antes / suporte de mip',before),('Depois / integracao circular',after)]):
  c=np.clip(image[165:235,285:355],0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).resize((280,280)),(i*300+10,40));draw.text((i*300+10,9),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Bokeh-Reconstrucao-GPU-Diagnostico.png')
 assert square(after)<square(before),result;assert .8<result['energy_ratio']<1.2,result
if __name__=='__main__':main()
