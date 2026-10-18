"""Optional real-GPU tests of stable pupil dither and highlight decomposition."""
from dataclasses import replace
from render_gpu_banding import *

def combine(ctx,base,high,view):
    textures=[ctx.texture((W,H),4,a.astype('f4').tobytes(),dtype='f4') for a in (base,high)]
    for unit,t in enumerate(textures):t.filter=(moderngl.LINEAR,moderngl.LINEAR);t.use(unit)
    p=ctx.program(vertex_shader=shader('VERT'),fragment_shader=shader('HIGHLIGHTCOMBINE'))
    p['basePass'].value=0;p['highlightPass'].value=1;p['viewMode'].value=view
    out=ctx.texture((W,H),4,dtype='f2');f=ctx.framebuffer([out]);f.use();ctx.viewport=(0,0,W,H)
    ctx.vertex_array(p,[]).render(vertices=3)
    assert ctx.error=='GL_NO_ERROR',ctx.error
    return np.frombuffer(f.read(components=4,dtype='f4'),'f4').reshape(H,W,4).copy()

def main():
    ctx=moderngl.create_standalone_context(require=330)
    yy,xx=np.indices((H,W));raw=np.ones((H,W,4),'f4')
    raw[...,:3]=(.04+.09*((xx+yy)%2))[...,None]
    raw[190:197,316:323,:3]=[12,5,1]
    s=Settings(focus_m=.9,source_m=5,iris_mm=6,highlight_detail=True,highlight_quality=256)
    d=replace(s,bokeh_dither=True,dither_amount=1)
    off=render(ctx,256,True,s,raw,None,False,samples=24)
    on=render(ctx,256,True,d,raw,None,False,samples=24)
    again=render(ctx,256,True,d,raw,None,False,samples=24)
    np.testing.assert_array_equal(on,again)
    change=float(np.max(np.abs(on-off)));assert change>1e-5,change
    zero=render(ctx,256,True,replace(d,dither_amount=0),raw,None,False,samples=24)
    np.testing.assert_array_equal(zero,off)
    focused=replace(s,focus_m=5)
    a=render(ctx,256,True,focused,raw,None,False,samples=24)
    b=render(ctx,256,True,replace(focused,bokeh_dither=True),raw,None,False,samples=24)
    np.testing.assert_array_equal(a,b)
    base=render(ctx,256,True,s,raw,None,False,part=1,samples=24,return_rgba=True)
    high=render(ctx,256,True,s,raw,None,False,part=2,samples=24,return_rgba=True)
    final=combine(ctx,base,high,0);only_high=combine(ctx,base,high,1);only_base=combine(ctx,base,high,2);coverage=combine(ctx,base,high,3)
    error=float(np.max(np.abs(final[...,:3]-(only_base[...,:3]+only_high[...,:3]))))
    quantization=np.abs(np.spacing(final[...,:3].astype('f2')).astype('f4'))
    assert np.all(np.abs(final[...,:3]-(only_base[...,:3]+only_high[...,:3]))<=quantization+1e-7),error
    assert coverage[...,:3].min()==0 and coverage[...,:3].max()==1
    base_again=render(ctx,256,True,replace(s,highlight_quality=64),raw,None,False,part=1,samples=24,return_rgba=True)
    np.testing.assert_array_equal(base,base_again)
    high_low=render(ctx,256,True,replace(s,highlight_detail=False),raw,None,False,part=2,samples=24)
    assert np.max(np.abs(high[...,:3]-high_low))>1e-5
    empty=render(ctx,256,True,replace(s,highlight_threshold=20),raw,None,False,part=2,samples=24)
    assert np.max(np.abs(empty))==0
    # Same decomposition with ordered occlusion: opaque depth masks are shared by both parts.
    depth=np.zeros((H,W),'f4');depth[70:330,270:390]=1
    for mode in ('cut','slicing'):
        z=replace(s,depth_mode=mode,near_m=2,far_m=5,depth_slices=4)
        low=render(ctx,256,True,z,raw,depth,False,part=1,samples=24,return_rgba=True)
        hi=render(ctx,256,True,z,raw,depth,False,part=2,samples=24,return_rgba=True)
        total=combine(ctx,low,hi,0)
        assert np.isfinite(total).all()
    sparse_probe=render(ctx,256,True,s,raw,None,False,samples=24,return_rgba=True,probe=True)
    sparse_fraction=float(sparse_probe[...,0].mean());assert sparse_fraction<.65,sparse_fraction
    dense_raw=raw.copy();dense_raw[...,:3]=1.5
    dense_probe=render(ctx,256,True,s,dense_raw,None,False,samples=24,return_rgba=True,probe=True)
    dense_fraction=float(dense_probe[...,0].mean());assert dense_fraction>=.65,dense_fraction
    dense_full=render(ctx,256,True,s,dense_raw,None,False,samples=256)
    dense_low=render(ctx,256,True,s,dense_raw,None,False,part=1,samples=256)
    dense_high=render(ctx,256,True,s,dense_raw,None,False,part=2,samples=256)
    fallback_error=float(np.max(np.abs(dense_full-dense_low-dense_high)));assert fallback_error<.002,fallback_error
    panels=[('Dither OFF · 24 amostras',off),('Dither ON · padrão fixo',on),('Base · 24 amostras',only_base[...,:3]),('Highlights · 256 amostras',only_high[...,:3]),('Final · soma linear',final[...,:3]),('Coverage · limite conservador',coverage[...,:3])]
    canvas=Image.new('RGB',(3*W,2*(H+40)),'#101813');draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
    for i,(label,picture) in enumerate(panels):
        row,col=divmod(i,3);c=np.clip(picture,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
        canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(col*W,row*(H+40)+40))
        draw.text((col*W+10,row*(H+40)+8),label,font=font,fill='#b9efc8')
    path=ROOT.parent/'Highlights-GPU-0.7.9.png';canvas.save(path)
    result=dict(renderer=ctx.info['GL_RENDERER'],dither_fixed=True,focused_unchanged=True,zero_amount_unchanged=True,decomposition_error=error,dither_max_change=change,sparse_coverage=sparse_fraction,dense_coverage=dense_fraction,fallback_error=fallback_error,path=str(path))
    (ROOT.parent/'Highlights-GPU-0.7.9.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result))

if __name__=='__main__':main()
