"""Shared glitter plane: neutral/prismatic light, focus racks and native parity."""
from dataclasses import replace,asdict
from render_gpu_banding import *
from optics import cuda

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1;raw[...,:3]=.002
 for x,y in [(135,115),(320,115),(505,115),(135,280),(320,280),(505,280)]:raw[y-1:y+2,x-1:x+2,:3]=[18,18,18]
 s=Settings(focus_m=.7,source_m=5,iris_mm=8.55,blades=0,shimmer_depth=.7,shimmer_size=12,shimmer_density=.65,shimmer_seed=4,shimmer_threshold=.01,shimmer_prism=0,shimmer_normalize=True)
 base=render(ctx,512,True,s,raw,creative=False,gain=2)
 enabled=replace(s,shimmer_amount=6)
 neutral=render(ctx,512,True,enabled,raw,creative=False,gain=2)
 repeat=render(ctx,512,True,enabled,raw,creative=False,gain=2);np.testing.assert_array_equal(neutral,repeat)
 neutral_color_error=float(np.max(abs(neutral[...,0]-neutral[...,2])));assert neutral_color_error<1e-6,neutral_color_error
 colored=render(ctx,512,True,replace(enabled,shimmer_prism=1),raw,creative=False,gain=2)
 chroma=float(np.mean(abs(colored[...,0]-colored[...,2])));assert chroma>1e-5,chroma
 unnormalized=render(ctx,512,True,replace(enabled,shimmer_normalize=False),raw,creative=False,gain=2)
 energy=dict(base=float(base.sum()),normalized=float(neutral.sum()),additive=float(unnormalized.sum()))
 assert abs(energy['normalized']/energy['base']-1)<.18,energy
 assert energy['additive']>energy['normalized']*1.15,energy
 def gains(a,b):return [float(b[y-45:y+45,x-45:x+45,1].sum()/a[y-45:y+45,x-45:x+45,1].sum()) for x,y in [(135,115),(320,115),(505,115),(135,280),(320,280),(505,280)]]
 g1=gains(base,neutral);rack=replace(enabled,focus_m=1.1);racked=render(ctx,512,True,rack,raw,creative=False,gain=2);rack_base=render(ctx,512,True,replace(s,focus_m=1.1),raw,creative=False,gain=2);g2=gains(rack_base,racked)
 assert np.std(g1)>.005 and np.ptp(np.array(g2)-g1)>.01,(g1,g2)
 at_new_plane=render(ctx,512,True,replace(enabled,shimmer_depth=1.3),raw,creative=False,gain=2)
 assert np.mean(abs(at_new_plane-neutral))>.0001
 cuda.upload(raw,np.zeros((H,W),'f4'),'glitter-layer')
 errors=[]
 for settings,reference in [(enabled,neutral),(replace(enabled,shimmer_prism=1),colored),(rack,racked)]:
  native,info=cuda.render(dict(asdict(settings),bokeh_gain=2),W,H,512,512,False,False,.8,10,'glitter-layer')
  error=float(np.mean(abs(native[...,:3]-reference)));assert error<.001,error;errors.append(error)
 high=render(ctx,512,True,enabled,raw,creative=False,gain=2,part=2);low=render(ctx,512,True,enabled,raw,creative=False,gain=2,part=1)
 split=float(np.max(abs(neutral-high-low)));assert split<.005,split
 # An ordinary LDR point must qualify before reconstruction filters dilute it.
 ldr=raw.copy();ldr[...,:3]=np.maximum(.02,np.minimum(ldr[...,:3],1))
 ldr_settings=replace(enabled,shimmer_threshold=.6)
 ldr_base=render(ctx,512,True,replace(ldr_settings,shimmer_amount=0),ldr,creative=False,gain=2)
 ldr_glitter=render(ctx,512,True,ldr_settings,ldr,creative=False,gain=2)
 ldr_peak=float(np.max(abs(ldr_glitter-ldr_base)));assert ldr_peak>.001,ldr_peak
 canvas=Image.new('RGB',(3*W,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,img) in enumerate([('Glitter neutro · foco 0,7 m',neutral),('Pequenas cores prismáticas',colored),('Glitter neutro · foco 1,1 m',racked)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Shimmer-Glitter-Comparacao-0.9.6.16.png')
 result=dict(success=True,neutral_color_error=neutral_color_error,prism_chroma=chroma,energy=energy,gains_focus_07=g1,gains_focus_11=g2,cuda_errors=errors,split_error=split,ldr_glitter_peak_change=ldr_peak,stable=True,layer_depth_changes_pattern=True)
 (ROOT.parent/'Shimmer-Glitter-Teste-0.9.6.16.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
