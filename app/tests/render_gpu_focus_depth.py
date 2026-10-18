"""Depth focus must move from foreground to background, with source-aware occlusion."""
from dataclasses import replace
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,:3]=[.01,.005,.015];raw[...,3]=1
 depth=np.zeros((H,W),'f4');depth[70:330,240:400]=1
 raw[depth>0,:3]=[.04,.4,.08]
 # Foreground texture should lose contrast when focus moves to the background.
 for y in range(90,310,8):raw[y:y+4,255:385,2]=.4
 raw[140:143,120:123,:3]=[20,8,1]
 s=Settings(focus_m=2,source_m=5,near_m=2,far_m=5,iris_mm=8.55,depth_mode='auto')
 near=render(ctx,256,True,s,raw,depth,False,gain=6)
 far=render(ctx,256,True,replace(s,focus_m=5),raw,depth,False,gain=6)
 again=render(ctx,256,True,replace(s,focus_m=5),raw,depth,False,gain=6)
 np.testing.assert_array_equal(far,again)
 near_contrast=float(np.std(near[110:290,285:355,2]));far_contrast=float(np.std(far[110:290,285:355,2]))
 near_leak=float(np.max(near[130:270,410:425,1]));far_spill=float(np.max(far[130:270,410:425,1]))
 sharp_background=float(np.max(far[130:155,110:135,0]));blurred_background=float(np.max(near[130:155,110:135,0]))
 result=dict(renderer=ctx.info['GL_RENDERER'],foreground_near_contrast=near_contrast,foreground_far_contrast=far_contrast,focused_foreground_outside_green=near_leak,defocused_foreground_outside_green=far_spill,background_sharp_peak=sharp_background,background_blurred_peak=blurred_background)
 print(json.dumps(result))
 assert far_contrast<near_contrast*.35,result
 assert near_leak<.012,result
 assert far_spill>near_leak+.025,result
 assert sharp_background>blurred_background*5,result
 canvas=Image.new('RGB',(3*W,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,picture) in enumerate([('Entrada · RGB + depth',raw[...,:3]),('Foco perto · 2 m',near),('Foco fundo · 5 m',far)]):
  c=np.clip(picture,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 path=ROOT.parent/'Focus-Depth-GPU-0.7.15.png';canvas.save(path)
 (ROOT.parent/'Focus-Depth-GPU-0.7.15.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
