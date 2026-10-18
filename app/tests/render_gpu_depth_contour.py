"""Depth matte edge must not survive in a defocused foreground."""
import render_gpu_banding as gpu
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,:3]=[.12,.025,.02];raw[...,3]=1
 yy,xx=np.mgrid[:H,:W];mask=(xx>210+(yy-200)*.23)&(xx<425)&(yy>60)&(yy<340)
 raw[mask,:3]=[.03,.4,.12];depth=mask.astype('f4')
 settings=Settings(focus_m=5,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0)
 fixed_shader=gpu.SHADERS
 start=fixed_shader.index(' if(sliceMode){\n   vec3 alpha=')
 end=fixed_shader.index('\n if(compositeMode)',start)
 legacy=' if(sliceMode){vec3 alpha=clamp(coverage/max(norm,vec3(.0001)),0.,1.);vec3 straight=color/max(alpha,vec3(.00001));float opacity=sliceBackground?(alpha.g>.00001?1.:0.):alpha.g;outColor=vec4(straight*opacity,opacity);return;}'
 gpu.SHADERS=fixed_shader[:start]+legacy+fixed_shader[end:]
 before=render(ctx,256,True,settings,raw,depth,False,gain=4,channel_coverage=False)
 gpu.SHADERS=fixed_shader
 after=render(ctx,256,True,settings,raw,depth,False,gain=4)
 again=render(ctx,256,True,settings,raw,depth,False,gain=4);np.testing.assert_array_equal(after,again)
 def edge(a):
  rows=np.arange(120,280);boundary=np.floor(210+(rows-200)*.23).astype(int)
  return float(np.mean([np.max(abs(np.diff(a[y,x-24:x+25,1]))) for y,x in zip(rows,boundary)]))
 result=dict(before_edge_jump=edge(before),after_edge_jump=edge(after),stable=True)
 print(json.dumps(result));print("max difference",float(abs(before-after).max()))
 canvas=Image.new('RGB',(W*2,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate([('Antes / contorno do matte',before),('Depois / cobertura gradual',after)]):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Depth-Contorno-GPU-0.8.4.png');assert edge(after)<edge(before)*.3,result
if __name__=='__main__':main()
