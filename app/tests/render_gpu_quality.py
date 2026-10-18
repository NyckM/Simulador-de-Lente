"""Compile production GLSL and render all six sampling levels offscreen."""
import json
import numpy as np
import moderngl
from PIL import Image,ImageDraw,ImageFont
from render_gpu_banding import render,W,H,ROOT
from optics.core import Settings

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),dtype='f4');raw[...,3]=1
 for x,y,color in [(W//2,H//2,(8,6,2)),(90,90,(1,5,8)),(W-80,280,(8,2,1))]:raw[y-1:y+2,x-1:x+2,:3]=color
 s=Settings(focus_m=1,source_m=5,iris_mm=8.55,soften_internal_cutoff=True)
 levels=[('Draft',24),('Fast',48),('Medium',96),('High',256),('Very High',512),('Extreme',1024)]
 pictures=[render(ctx,1024,True,s,raw,creative=False,samples=count) for _,count in levels]
 assert all(np.isfinite(p).all() for p in pictures)
 repeated=render(ctx,1024,True,s,raw,creative=False,samples=1024)
 assert np.array_equal(repeated,pictures[-1]),'Sampling changed between identical frames'
 difference=float(np.max(np.abs(pictures[-1]-pictures[3])))
 assert difference>1e-6,'Extreme did not change sampling beyond High'
 canvas=Image.new('RGB',(W*3,(H+36)*2),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,((name,count),picture) in enumerate(zip(levels,pictures)):
  row,col=divmod(i,3);c=np.clip(picture,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
  canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(col*W,row*(H+36)+36));draw.text((col*W+12,row*(H+36)+6),f'{name} · {count} amostras',font=font,fill='#b9efc8')
 path=ROOT.parent/'Quality-GPU-0.7.10.png';canvas.save(path)
 result=dict(renderer=ctx.info['GL_RENDERER'],levels=dict(levels),repeated_frames_identical=True,extreme_vs_high_max_difference=difference,path=str(path))
 (ROOT.parent/'Quality-GPU-0.7.10.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
