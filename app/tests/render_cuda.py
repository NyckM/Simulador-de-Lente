"""Native CUDA output, determinism, depth focus and real GLSL comparison."""
from dataclasses import asdict
from render_gpu_banding import *
from optics import cuda
def main():
    assert cuda.available(),cuda.info()
    ctx=moderngl.create_standalone_context(require=330)
    raw=np.ones((H,W,4),'f4');raw[...,:3]=[.01,.005,.015]
    depth=np.zeros((H,W),'f4');depth[70:330,240:400]=1;raw[depth>0,:3]=[.04,.4,.08]
    for y in range(90,310,8):raw[y:y+4,255:385,2]=.4
    raw[140:143,120:123,:3]=[20,8,1]
    cuda.upload(raw,depth,'test')
    results=[];images=[]
    for focus in (2,5):
        s=Settings(focus_m=focus,source_m=5,near_m=2,far_m=5,iris_mm=8.55,blades=0)
        settings=dict(asdict(s),bokeh_gain=6)
        a,info=cuda.render(settings,W,H,256,256,True,False,2,5,'test')
        again,_=cuda.render(settings,W,H,256,256,True,False,2,5,'test');np.testing.assert_array_equal(a,again)
        reference=render(ctx,256,True,s,raw,depth,False,gain=6)
        error=float(np.mean(abs(a[...,:3]-reference)))
        assert error<.012,error
        results.append(dict(focus=focus,mean_glsl_error=error,**info));images.append(a)
    assert np.std(images[1][110:290,285:355,2])<np.std(images[0][110:290,285:355,2])*.35
    assert np.max(images[1][130:155,110:135,0])>np.max(images[0][130:155,110:135,0])*5
    canvas=Image.new('RGB',(2*W,H+40),'#101813');draw=ImageDraw.Draw(canvas)
    for i,a in enumerate(images):
        c=np.clip(a[...,:3],0,1);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055);canvas.paste(Image.fromarray(np.uint8(c*255)).transpose(Image.Transpose.FLIP_TOP_BOTTOM),(i*W,40));draw.text((i*W+12,8),f'CUDA / foco {results[i]["focus"]} m',fill='#b9efc8')
    canvas.save(ROOT.parent/'CUDA-Depth-0.9.0.png')
    (ROOT.parent/'CUDA-Depth-0.9.0.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results))
if __name__=='__main__':main()
