"""Actual pupil integration: folds, HDR addition, depth, focus and CUDA parity."""
from dataclasses import replace,asdict
from render_gpu_banding import *
from optics import cuda

def main():
 ctx=moderngl.create_standalone_context(require=330)
 s=Settings(focus_m=.7,source_m=5,iris_mm=8.55,blades=0,ray_focus=True)
 raw=np.zeros((H,W,4),'f4');raw[...,3]=1
 for x,y in [(110,105),(295,105),(320,105),(510,105),(120,285),(320,285),(505,285)]:raw[y-2:y+3,x-2:x+3,:3]=[40,40,40]
 kwargs=dict(creative=False,gain=3)
 baseline=render(ctx,1024,True,s,raw,**kwargs)
 enabled=replace(s,bokeh_distortion=1.4,bokeh_distortion_color=.65)
 changed=render(ctx,1024,True,enabled,raw,**kwargs)
 repeat=render(ctx,1024,True,enabled,raw,**kwargs);np.testing.assert_array_equal(changed,repeat)
 delta=float(np.mean(abs(changed-baseline)));assert delta>.003,delta
 energy_ratio=float(changed.sum()/baseline.sum());assert .7<energy_ratio<1.3,energy_ratio
 # Pairwise illumination remains additive BEFORE display clipping.
 a=raw.copy();a[...,:3]=0;a[100:111,295:300,:3]=60
 b=raw.copy();b[...,:3]=0;b[100:111,319:324,:3]=60
 pa=render(ctx,1024,True,enabled,a,**kwargs);pb=render(ctx,1024,True,enabled,b,**kwargs)
 pair=a.copy();pair[...,:3]+=b[...,:3]
 added=render(ctx,1024,True,enabled,pair,**kwargs)
 add_error=float(np.max(abs(added-pa-pb)));assert add_error<.015,add_error
 overlap=(pa[...,1]>.1)&(pb[...,1]>.1);assert overlap.any()
 overlap_gain=float(np.max(added[...,1][overlap]/np.maximum(pa[...,1],pb[...,1])[overlap]));assert overlap_gain>1.2,overlap_gain
 peak=float(added.max());assert peak>1,peak
 # Own focus zeroes just this new term, including its chromatic component.
 focused=replace(s,source_m=s.focus_m)
 focused_off=render(ctx,512,True,focused,raw,**kwargs)
 focused_on=render(ctx,512,True,replace(focused,bokeh_distortion=2,bokeh_distortion_color=1),raw,**kwargs)
 focus_error=float(np.max(abs(focused_on-focused_off)));assert focus_error<1e-6,focus_error
 # Constant fractional depth must match the equivalent metric plane.
 depth=np.full((H,W),.3,'f4');mapped=1/((1-.3)/5+.3/.7)
 ds=replace(enabled,near_m=.7,far_m=5,depth_mode='slicing',depth_slices=12)
 depth_frame=render(ctx,512,True,ds,raw,depthmap=depth,**kwargs)
 cuda.upload(raw,depth,'light-distortion');native,info=cuda.render(dict(asdict(ds),bokeh_gain=3),W,H,512,1024,True,False,.7,5,'light-distortion')
 parity=float(np.mean(abs(native[...,:3]-depth_frame)));assert parity<.002,parity
 same=render(ctx,512,True,replace(ds,invert_depth=True),raw,depthmap=1-depth,**kwargs)
 invert_error=float(np.max(abs(same-depth_frame)));assert invert_error<.002,invert_error
 base=render(ctx,1024,True,enabled,raw,part=1,**kwargs);high=render(ctx,1024,True,enabled,raw,part=2,**kwargs)
 split=float(np.max(abs(changed-base-high)));assert split<.015,split
 canvas=Image.new('RGB',(3*W,H+40),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',19)
 for i,(title,img) in enumerate([('Sem deformação',baseline),('Dobras + dispersão no desfoque',changed),('Plano em foco · mesma deformação',focused_on)]):
  c=np.clip(img,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(W*i,40));draw.text((W*i+12,8),title,font=font,fill='#b9efc8')
 canvas.save(ROOT.parent/'Luz-Deformada-Comparacao-0.9.6.17.png')
 result=dict(success=True,shape_change=delta,energy_ratio=energy_ratio,addition_max_error=add_error,overlap_gain=overlap_gain,hdr_peak=peak,focused_difference=focus_error,cuda_difference=parity,invert_error=invert_error,split_error=split,stable=True)
 (ROOT.parent/'Luz-Deformada-Teste-0.9.6.17.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
if __name__=='__main__':main()
