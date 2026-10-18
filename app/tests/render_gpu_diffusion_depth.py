"""Diffusion must never restore texture from an out-of-focus source plate."""
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,:3]=[.015,.02,.03];raw[...,3]=1
 depth=np.zeros((H,W),'f4');depth[70:330,230:410]=1;raw[depth>0,:3]=[.025,.25,.06]
 for y in range(90,310,8):raw[y:y+4,245:395,1]=.5
 s=Settings(focus_m=5,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0)
 base=render(ctx,256,True,s,raw,depth,False,gain=4)
 plate=ctx.texture((W,H),3,base.astype('f4').tobytes(),dtype='f4');plate.filter=(moderngl.LINEAR,moderngl.LINEAR);plate.repeat_x=plate.repeat_y=False;plate.use(6)
 p=ctx.program(vertex_shader=shader('VERT'),fragment_shader=shader('DIFFUSION'));p['plate'].value=6;p['imageSize'].value=(W,H);p['amount'].value=.8
 output=ctx.texture((W,H),4,dtype='f4');fbo=ctx.framebuffer([output]);fbo.use();ctx.viewport=(0,0,W,H);vao=ctx.vertex_array(p,[]);vao.render(vertices=3)
 fixed=np.frombuffer(fbo.read(components=3,dtype='f4'),'f4').reshape(H,W,3).copy()
 vao.render(vertices=3);again=np.frombuffer(fbo.read(components=3,dtype='f4'),'f4').reshape(H,W,3);np.testing.assert_array_equal(fixed,again)
 # Reproduce the prior raw-source halo path for a direct comparison.
 legacy=ctx.program(vertex_shader=shader('VERT'),fragment_shader='''#version 330
 in vec2 uv;out vec4 outColor;uniform sampler2D plate,original;uniform vec2 imageSize;
 void main(){vec3 halo=vec3(0.);for(int i=0;i<12;i++){float t=float(i)+.5;float a=t*2.399963;vec2 d=vec2(cos(a),sin(a))*sqrt(t/12.)*.04;halo+=texture(original,uv+d*vec2(1.,imageSize.x/imageSize.y)).rgb;}outColor=vec4(mix(texture(plate,uv).rgb,halo/12.,.8),1.);}''')
 source=ctx.texture((W,H),4,raw.tobytes(),dtype='f4');source.filter=(moderngl.LINEAR,moderngl.LINEAR);source.use(0);legacy['plate'].value=6;legacy['original'].value=0;legacy['imageSize'].value=(W,H);ctx.vertex_array(legacy,[]).render(vertices=3)
 old=np.frombuffer(fbo.read(components=3,dtype='f4'),'f4').reshape(H,W,3).copy()
 def contrast(a):return float(np.mean(abs(np.diff(a[130:270,280:360,1],axis=0))))
 result=dict(base_contrast=contrast(base),old_diffusion_contrast=contrast(old),fixed_diffusion_contrast=contrast(fixed),stable=True)
 print(json.dumps(result));assert contrast(fixed)<contrast(old)*.5,result
 assert contrast(fixed)<=contrast(base)+.001,result
 canvas=Image.new('RGB',(W*2,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,a) in enumerate([('Antes / difusao puxando a entrada',old),('Depois / difusao da imagem desfocada',fixed)]):
  c=np.clip(a,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Difusao-Depth-GPU-0.8.5.png')
if __name__=='__main__':main()
