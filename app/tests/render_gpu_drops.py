"""Actual drops shader: focus response, fixed pattern and depth occlusion."""
from render_gpu_banding import *

def main():
 ctx=moderngl.create_standalone_context(require=330)
 program=ctx.program(vertex_shader=shader('VERT'),fragment_shader=shader('DROPS'))
 yy,xx=np.mgrid[:H,:W];raw=np.empty((H,W,4),'f4');raw[...,3]=1
 raw[...,0]=.25+.15*np.sin(xx*.05);raw[...,1]=.18+.1*np.cos(yy*.06);raw[...,2]=.1+.06*np.sin((xx+yy)*.07)
 plate=ctx.texture((W,H),4,raw.tobytes(),dtype='f4');plate.filter=(moderngl.LINEAR,moderngl.LINEAR);plate.repeat_x=plate.repeat_y=False;plate.use(6)
 s=Settings(focus_m=.6,source_m=5,iris_mm=8.55,blades=0);lens=get_lens(s);data=kernel(s,taps=64)
 for unit,key in [(2,'atlas'),(3,'pupils')]:
  array=np.asarray(data[key],'f4').reshape(3,64,data['grid'],data['grid'],4).transpose(1,2,0,3,4).copy()
  texture=ctx.texture_array((data['grid']*3,data['grid'],64),4,array.tobytes(),dtype='f4');texture.filter=(moderngl.LINEAR,moderngl.LINEAR);texture.repeat_x=texture.repeat_y=False;texture.use(unit)
  # Hold textures alive until all renders finish.
  if unit==2:rays=texture
  else:pupils=texture
 depth=ctx.texture((W,H),1,np.ones((H,W),'f4').tobytes(),dtype='f4');depth.use(1)
 target=ctx.texture((W,H),4,dtype='f4');fbo=ctx.framebuffer([target]);fbo.use();ctx.viewport=(0,0,W,H)
 values=dict(plate=6,depthMap=1,rays=2,pupils=3,imageSize=(W,H),focusMatrix=tuple(data['matrix']),lastZ=data['last_z'],referenceZ=data['reference_z'],sourceFocus=focus_plane(5,lens),sourceM=5.,sensorZ=focus_plane(.6,lens),sensorMM=36.,gridSize=data['grid'],apertureScale=1.,amount=1.,dropDepth=.6,dropSize=30.,density=.7,strength=35.,seed=7.,nearM=.3,farM=5.,depthGain=1.,depthBias=0.,taps=64,channel=0,hasDepth=False,invertDepth=False,scalarDepth=True)
 for key,value in values.items():program[key].value=value
 vao=ctx.vertex_array(program,[])
 def render(**changes):
  for key,value in changes.items():program[key].value=value
  vao.render(vertices=3);return np.frombuffer(fbo.read(components=4,dtype='f4'),'f4').reshape(H,W,4).copy()
 original=render(amount=0.);sharp=render(amount=1.);blurred=render(sensorZ=focus_plane(5,lens));again=render()
 np.testing.assert_array_equal(blurred,again)
 np.testing.assert_allclose(original,raw,atol=2e-4)
 blocked=render(hasDepth=True);np.testing.assert_allclose(blocked,original,atol=2e-6)
 def detail(a):
  d=(a-raw)[...,:3];return float(np.mean(np.abs(np.diff(d,axis=0)))+np.mean(np.abs(np.diff(d,axis=1))))
 result=dict(renderer=ctx.info['GL_RENDERER'],sharp_distortion_detail=detail(sharp),defocused_distortion_detail=detail(blurred),difference=float(np.mean(abs(sharp-blurred))),stable=True,foreground_preserved=True)
 print(json.dumps(result));assert result['sharp_distortion_detail']>result['defocused_distortion_detail']*1.2,result
 assert result['difference']>.001;assert np.isfinite(blurred).all()
 canvas=Image.new('RGB',(W*3,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,array) in enumerate([('Entrada',raw),('Gotas / foco 0,6 m',sharp),('Gotas / foco 5 m',blurred)]):
  c=np.clip(array[...,:3],0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
  canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Gotas-GPU-0.8.3.png');(ROOT.parent/'Gotas-GPU-0.8.3.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if __name__=='__main__':main()
