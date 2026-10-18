"""Export actual CUDA focus-rack frames; fixed source and glitter seed."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from optics import cuda
from optics.core import Settings
from dataclasses import asdict
root=Path(__file__).resolve().parents[1];w,h=640,400
raw=np.zeros((h,w,4),'f4');raw[...,3]=1
for x,y in [(135,115),(320,115),(505,115),(135,280),(320,280),(505,280)]:raw[y-1:y+2,x-1:x+2,:3]=[22,22,22]
cuda.upload(raw,np.zeros((h,w),'f4'),'glitter-focus-demo')
s=asdict(Settings(source_m=5,iris_mm=8.55,blades=0,shimmer_amount=6,shimmer_depth=.7,shimmer_size=12,shimmer_density=.65,shimmer_seed=4,shimmer_threshold=.6,shimmer_prism=.65))
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18);frames=[]
for focus in np.linspace(.7,1.05,18):
 s['focus_m']=float(focus);s['bokeh_gain']=2
 pixels,_=cuda.render(s,w,h,512,512,False,False,.8,10,'glitter-focus-demo')
 c=np.clip(pixels[...,:3],0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
 frame=Image.new('RGB',(w,h+40),'#101813');frame.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(0,40));draw=ImageDraw.Draw(frame)
 draw.text((12,8),f'Foco {focus:.2f} m · luzes 5 m · glitter fixo 0,70 m',fill='#b9efc8',font=font);frames.append(frame)
frames=frames+frames[-2:0:-1]
frames[0].save(root.parent/'Shimmer-Foco-0.9.6.16.gif',save_all=True,append_images=frames[1:],duration=100,loop=0)
print('Focus animation saved')
