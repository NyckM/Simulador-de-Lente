"""Shimmer: independent light responses through a fixed plane, not time noise."""
from dataclasses import replace
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[...,:3]=.005
 for x in (150,450):raw[198:201,x-1:x+2,:3]=[40,20,8]
 s=Settings(focus_m=.6,source_m=5,iris_mm=8.55,blades=0,shimmer_depth=.6,shimmer_size=12,shimmer_density=.65,shimmer_seed=4,shimmer_threshold=.01,shimmer_normalize=False)
 enabled=replace(s,shimmer_amount=4)
 base=render(ctx,256,True,s,raw,creative=False,gain=2)
 near=render(ctx,256,True,enabled,raw,creative=False,gain=2)
 again=render(ctx,256,True,enabled,raw,creative=False,gain=2);np.testing.assert_array_equal(near,again)
 far_base=render(ctx,256,True,replace(s,focus_m=3),raw,creative=False,gain=2)
 far=render(ctx,256,True,replace(enabled,focus_m=3),raw,creative=False,gain=2)
 behind=render(ctx,256,True,replace(enabled,shimmer_depth=6),raw,creative=False,gain=2);assert np.max(abs(behind-base))>.001
 dark=np.ones_like(raw);dark[...,:3]=.02
 dark_off=render(ctx,64,True,replace(s,shimmer_threshold=.05),dark,creative=False,gain=2);dark_on=render(ctx,64,True,replace(enabled,shimmer_threshold=.05),dark,creative=False,gain=2);np.testing.assert_array_equal(dark_off,dark_on)
 def gains(a,b):return [float(b[80:320,x-100:x+100,0].sum()/a[80:320,x-100:x+100,0].sum()) for x in (150,450)]
 g1=gains(base,near);g2=gains(far_base,far)
 parts=replace(enabled,highlight_quality=256)
 low=render(ctx,256,True,parts,raw,creative=False,gain=2,part=1)
 high=render(ctx,256,True,parts,raw,creative=False,gain=2,part=2)
 error=float(np.max(abs(near-low-high)));assert error<.01,error
 result=dict(decomposition_error=error,renderer=ctx.info['GL_RENDERER'],gain_focus_layer=g1,gain_focus_3m=g2,stable=True,dark_unchanged=True,layer_behind_light_works=True)
 print(json.dumps(result));assert min(g1)>1.05;assert abs(g1[0]-g1[1])>.01;assert max(abs(a-b) for a,b in zip(g1,g2))>.005
 canvas=Image.new('RGB',(W*3,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate([('Sem Shimmer',base),('Shimmer / foco na camada',near),('Shimmer / foco 3 m',far)]):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Shimmer-GPU-0.8.7.png');(ROOT.parent/'Shimmer-GPU-0.8.7.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
