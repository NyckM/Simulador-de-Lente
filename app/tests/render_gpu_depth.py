"""Optional real GLSL regression: run with development-only ModernGL installed."""
from dataclasses import replace
from render_gpu_banding import *

def main():
    ctx=moderngl.create_standalone_context(require=330)
    raw=np.ones((H,W,4),'f4');raw[...,:3]=.25
    ramp=np.tile(np.linspace(0,1,W,dtype='f4'),(H,1))
    step=(ramp>.5).astype('f4')
    base=Settings(focus_m=2,source_m=5,near_m=2,far_m=5,iris_mm=8.55,depth_slices=8)
    errors={}
    reference=render(ctx,64,True,base,raw,None,False) # Includes the real lens throughput / vignette.
    for mode,d in [('slicing',ramp),('cut',step)]:
        s=replace(base,depth_mode=mode)
        a=render(ctx,64,True,s,raw,d,False)
        b=render(ctx,64,True,s,raw,d,False)
        np.testing.assert_array_equal(a,b)
        error=float(np.max(np.abs(a[150:250,200:440]-reference[150:250,200:440])))
        assert error<.002,error;errors[mode+'_flat_error']=error
    # There must be no sudden hard bin transition when the map crosses a center.
    scene=raw.copy();scene[..., :3]=.015
    for x,y,c in [(220,180,(4,1,.1)),(430,250,(.1,2,5))]:scene[y-2:y+3,x-2:x+3,:3]=c
    s=replace(base,depth_mode='slicing')
    d=np.full((H,W),3/7-1e-5,'f4');a=render(ctx,64,True,s,scene,d,False)
    d+=2e-5;b=render(ctx,64,True,s,scene,d,False)
    transition=float(np.max(np.abs(a-b)))
    assert transition<.005,transition;errors['boundary_max_change']=transition
    # The mode has no effect when no depth is supplied.
    a=render(ctx,64,True,s,scene,None,False)
    b=render(ctx,64,True,replace(s,depth_mode='continuous'),scene,None,False)
    np.testing.assert_array_equal(a,b)
    # A focused opaque foreground must occlude background highlights.
    scene=raw.copy();scene[..., :3]=.01
    for x,y,c in [(255,150,(40,10,1)),(398,245,(1,20,50)),(470,100,(40,5,1))]:scene[y-2:y+3,x-2:x+3,:3]=c
    subject=np.zeros((H,W),'f4');subject[60:350,270:395]=1
    scene[subject>0,:3]=.08
    images=[]
    solid=raw.copy();solid[...,:3]=.08
    opaque_reference=render(ctx,128,True,replace(base,source_m=2),solid,None,False)
    for mode in ('continuous','cut','slicing'):
        image=render(ctx,128,True,replace(base,depth_mode=mode),scene,subject,False)
        if mode!='continuous':
            error=float(np.max(np.abs(image[130:270,310:350]-opaque_reference[130:270,310:350])))
            assert error<.003,error;errors[mode+'_opaque_subject_error']=error
        visual_scene=scene.copy();visual_scene[308:313,386:391,:3]=[40,10,1]
        images.append(render(ctx,128,True,replace(base,focus_m=5,depth_mode=mode),visual_scene,subject,False,gain=6.))
    spill=float(np.max(images[1][298:325,398:420,0]-images[0][298:325,398:420,0]))
    assert spill>.02,spill;errors['foreground_bokeh_spill_recovered']=spill
    canvas=Image.new('RGB',(4*W,H+80),'#101813');draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
    for i,(label,image) in enumerate(zip(['Entrada','Contínuo · rápido','Depth Cut · 2 planos','Depth Slicing · 8 planos'],[visual_scene[...,:3],*images])):
        c=np.clip(image,0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
        canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,35))
        draw.text((i*W+10,7),label,font=font,fill='#b9efc8')
    draw.text((10,H+48),'GLSL real · RGB + Z sintético · sujeito desfocado a 2 m · foco no fundo a 5 m · bokeh ampliado 6× · não reconstrói fundo oculto',font=font,fill='#e0ece3')
    path=ROOT.parent/'Depth-GPU-0.7.7.png';canvas.save(path)
    results=dict(renderer=ctx.info['GL_RENDERER'],repeated_frames_identical=True,errors=errors,path=str(path))
    (ROOT.parent/'Depth-GPU-0.7.7.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    print(json.dumps(results))

if __name__=='__main__':main()
