"""Validate field-dependent bokeh using the application's actual GLSL."""
from dataclasses import replace
from render_gpu_banding import *

def shape(image,x,y):
 patch=np.maximum(image[y-65:y+66,x-65:x+66,0],0)
 yy,xx=np.mgrid[-65:66,-65:66];mass=patch.sum();mx=(xx*patch).sum()/mass;my=(yy*patch).sum()/mass
 cov=np.array([[(((xx-mx)**2)*patch).sum(),((xx-mx)*(yy-my)*patch).sum()],[((xx-mx)*(yy-my)*patch).sum(),(((yy-my)**2)*patch).sum()]])/mass
 eig,vec=np.linalg.eigh(cov);return float(np.sqrt(eig[-1]/eig[0])),float(abs(vec[1,-1]))

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1
 for x,y in [(320,200),(530,200),(150,90)]:raw[y-1:y+2,x-1:x+2,:3]=[20,12,4]
 s=Settings(focus_m=2,source_m=5,iris_mm=8.55,blades=0)
 neutral=render(ctx,256,True,s,raw,creative='settings',gain=2)
 look=render(ctx,256,True,replace(s,swirl=1.7,coma=.65),raw,creative='settings',gain=2)
 center_delta=float(np.mean(np.abs(look[185:215,305:335]-neutral[185:215,305:335])))
 ratio0,orientation0=shape(neutral,530,200);ratio1,orientation1=shape(look,530,200)
 result=dict(renderer=ctx.info['GL_RENDERER'],center_mean_change=center_delta,neutral_edge_axis_ratio=ratio0,deakinizer_edge_axis_ratio=ratio1,tangential_alignment=orientation1)
 print(json.dumps(result));assert center_delta<.03,result;assert ratio1>ratio0*1.25,result;assert orientation1>.8,result
 canvas=Image.new('RGB',(W*2,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,img) in enumerate([('Double-Gauss · neutra',neutral),('Deakinizer · aproximação criativa',look)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Deakinizer-GPU-0.7.16.png');(ROOT.parent/'Deakinizer-GPU-0.7.16.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
