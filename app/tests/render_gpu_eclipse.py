"""Foreground visibility must change the shape of a background point PSF."""
from dataclasses import replace
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;depth=np.zeros((H,W),'f4')
 depth[:,:345]=1
 for y in (130,270):raw[y-1:y+2,349:352,:3]=[100,50,12]
 s=Settings(focus_m=1,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0,depth_mode='cut',depth_feather=0)
 flat=render(ctx,256,True,s,raw,depth,False,gain=6)
 eclipsed=render(ctx,256,True,replace(s,eclipse_bokeh=True),raw,depth,False,gain=6)
 again=render(ctx,256,True,replace(s,eclipse_bokeh=True),raw,depth,False,gain=6);np.testing.assert_array_equal(eclipsed,again)
 # Compare one isolated disc, excluding near-zero tails from the ratio.
 clear=render(ctx,256,True,replace(s,eclipse_bokeh=True),raw,np.zeros_like(depth),False,gain=6)
 a=clear[60:200,250:450,0];b=eclipsed[60:200,250:450,0];visible=a>a.max()*.02;ratio=b[visible]/a[visible]
 result=dict(renderer=ctx.info['GL_RENDERER'],unoccluded_energy=float(a.sum()),eclipsed_energy=float(b.sum()),ratio_low=float(np.percentile(ratio,10)),ratio_high=float(np.percentile(ratio,95)),stable=True)
 print(json.dumps(result))
 
 canvas=Image.new('RGB',(W*2,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,img) in enumerate([('Sem objeto bloqueando os raios',clear),('Eclipse por amostra da pupila',eclipsed)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Eclipse-GPU-0.8.6.png');assert result['ratio_high']-result['ratio_low']>.15,result;assert result['eclipsed_energy']<result['unoccluded_energy'],result;(ROOT.parent/'Eclipse-GPU-0.8.6.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
