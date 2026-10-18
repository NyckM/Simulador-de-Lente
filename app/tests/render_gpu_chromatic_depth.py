"""A depth boundary in a uniform plate must not create a chromatic matte rim."""
import render_gpu_banding as gpu
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.ones((H,W,4),'f4');raw[...,:3]=.25
 yy,xx=np.mgrid[:H,:W];mask=(xx>210+(yy-200)*.23)&(xx<425)&(yy>60)&(yy<340)
 settings=Settings(focus_m=5,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0)
 settings.ca_red=8.;settings.ca_blue=-8.;settings.ca_axial=1.
 fixed=gpu.SHADERS
 old=fixed.replace('mix(fill,straight,alpha)*opacity','mix(fill,straight,alpha.g)*opacity').replace('outColor=vec4(color,sliceChannel>=0?alpha[sliceChannel]:alpha.g);return;','outColor=vec4(straight*alpha.g,alpha.g);return;')
 gpu.SHADERS=old
 before=render(ctx,256,True,settings,raw,mask,False,gain=4,channel_coverage=False)
 gpu.SHADERS=fixed
 after=render(ctx,256,True,settings,raw,mask,False,gain=4)
 again=render(ctx,256,True,settings,raw,mask,False,gain=4);np.testing.assert_array_equal(after,again)
 # Uniform radiance isolates the compositor: real color fringes from a colored
 # subject are intentionally absent here. Measure jumps across its depth edge.
 rows=np.arange(120,280);boundary=np.floor(210+(rows-200)*.23).astype(int)
 def edge(a):return float(np.mean([np.max(abs(np.diff(a[y,x-28:x+29],axis=0))) for y,x in zip(rows,boundary)]))
 result=dict(before_edge_jump=edge(before),after_edge_jump=edge(after),stable=True)
 print(json.dumps(result))
 canvas=Image.new('RGB',(W*2,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate([('Antes / cobertura verde em RGB',before),('Depois / cobertura por canal',after)]):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Depth-Cobertura-Cromatica-GPU-0.8.8.png')
 (ROOT.parent/'Depth-Cobertura-Cromatica-GPU-0.8.8.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 assert edge(after)<edge(before)*.05,result
 # A softer jump alone is insufficient: the interior must retain all three
 # channels, and an all-foreground depth map must retain framebuffer opacity.
 assert np.min(after[180:220,280:320])>.15
 front=render(ctx,256,True,settings,raw,np.ones((H,W),'f4'),False,gain=4,return_rgba=True)
 assert float(front[180:220,280:320,:3].max())<.4
 assert float(front[180:220,280:320,3].min())>.99
if __name__=='__main__':main()
