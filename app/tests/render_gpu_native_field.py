"""Actual GPU field atlas with all extra creative aberrations disabled."""
from dataclasses import replace
from render_gpu_banding import *
def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1
 for y in (80,200,320):
  for x in (110,320,530):raw[y-1:y+2,x-1:x+2,:3]=[20,12,4]
 s=Settings(field_grid=9,focus_m=2,source_m=5,iris_mm=8.55,blades=0)
 near=render(ctx,256,True,s,raw,creative=False,gain=4)
 focus=render(ctx,256,True,replace(s,focus_m=5),raw,creative=False,gain=4)
 a=float(near[190:210,310:330,0].max());b=float(focus[190:210,310:330,0].max())
 result=dict(renderer=ctx.info['GL_RENDERER'],field_grid=9,creative_modifiers=False,center_peak_focus_2m=a,center_peak_focus_5m=b)
 print(json.dumps(result));assert b>a*2,result;assert np.isfinite(focus).all()
 canvas=Image.new('RGB',(2*W,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,img) in enumerate([('Vidros nativos · foco 2 m',near),('Vidros nativos · foco 5 m',focus)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Campo-Optico-GPU-0.7.17.png');(ROOT.parent/'Campo-Optico-GPU-0.7.17.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
