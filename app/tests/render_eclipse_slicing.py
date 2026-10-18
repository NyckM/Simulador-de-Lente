"""Eclipse changes disc shape at several depths, without self-occlusion."""
from dataclasses import replace,asdict
from render_gpu_banding import *
from optics import cuda

def main():
 ctx=moderngl.create_standalone_context(require=330)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1
 for y in (130,270):raw[y-1:y+2,349:352,:3]=[100,50,12]
 depth=np.zeros((H,W),'f4');depth[:200,:345]=.8;depth[200:,:345]=.5
 s=Settings(focus_m=1,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0,depth_mode='slicing',depth_slices=12,depth_feather=0,eclipse_bokeh=True)
 clear=render(ctx,256,True,s,raw,np.zeros_like(depth),False,gain=6)
 flat=render(ctx,256,True,replace(s,eclipse_bokeh=False),raw,depth,False,gain=6)
 eclipsed=render(ctx,256,True,s,raw,depth,False,gain=6)
 again=render(ctx,256,True,s,raw,depth,False,gain=6);np.testing.assert_array_equal(eclipsed,again)
 metrics=[]
 for region in (np.s_[60:200,250:450,0],np.s_[200:340,250:450,0]):
  a,b=clear[region],eclipsed[region];visible=a>a.max()*.03;ratio=b[visible]/a[visible]
  row=dict(energy_ratio=float(b.sum()/a.sum()),ratio_low=float(np.percentile(ratio,10)),ratio_high=float(np.percentile(ratio,95)))
  assert row['ratio_high']-row['ratio_low']>.2,row
  assert .08<row['energy_ratio']<.99,row
  metrics.append(row)
 cuda.upload(raw,depth,'eclipse-slices')
 native,info=cuda.render(dict(asdict(s),bokeh_gain=6),W,H,256,256,True,False,2,5,'eclipse-slices')
 error=float(np.mean(abs(native[...,:3]-eclipsed)));assert error<.004,error
 # Uniform fractional depth must retain its energy and stay sharp at its focus.
 solid=np.ones((H,W,4),'f4');solid[...,:3]=.2
 uniform=[]
 for d in (.13,.3,.65,.88):
  m=np.full((H,W),d,'f4');a=render(ctx,128,True,s,solid,m,False,gain=6)
  b=render(ctx,128,True,replace(s,eclipse_bokeh=False),solid,m,False,gain=6)
  value=float(a[100:300,150:490].mean());reference=float(b[100:300,150:490].mean())
  assert abs(value-reference)<.006,(d,value,reference)
  uniform.append(dict(depth=d,eclipse=value,reference=reference))
 # Inverting the map and the control together preserves the same geometry.
 inverted=render(ctx,256,True,replace(s,invert_depth=True),raw,1-depth,False,gain=6)
 assert np.mean(abs(inverted-eclipsed))<.0001
 canvas=Image.new('RGB',(3*W,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
 for i,(label,img) in enumerate([('Sem objeto à frente',clear),('Composição por blur',flat),('Eclipse · dois objetos em planos diferentes',eclipsed)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),label,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Eclipse-Desfoque-Comparacao-0.9.6.15.png')
 result=dict(success=True,discs=metrics,cuda_error=error,uniform_energy=uniform,stable=True,invert_preserved=True,backend=info['backend'])
 (ROOT.parent/'Eclipse-Desfoque-Teste-0.9.6.15.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
if __name__=='__main__':main()
