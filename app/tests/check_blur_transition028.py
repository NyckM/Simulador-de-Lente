from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from dataclasses import asdict,replace
import numpy as np
from optics import cuda
from optics.core import Settings
from optics.depth_mapping import blur_transition

def main():
    assert cuda.available(),cuda.info()
    w,h=64,48;rng=np.random.default_rng(28)
    rgba=rng.random((h,w,4),dtype='f4');rgba[:,:,3]=1
    depth=np.broadcast_to(np.linspace(0,1,w,dtype='f4'),(h,w)).copy()
    settings=Settings(depth_mode='cut',depth_feather=.2,depth_cut=.5,depth_slices=12)
    cases=[]
    for prepared in (False,True):
        for eclipse in (False,True):
            s=replace(settings,eclipse_bokeh=eclipse)
            cuda.upload(rgba,depth,'transition',prepared)
            actual,info=cuda.render(asdict(s),w,h,32,32,True,False,.8,10,'transition')
            cuda.upload(rgba,blur_transition(depth,s),'reference',True)
            expected,_=cuda.render(asdict(replace(s,depth_mode='slicing')),w,h,32,32,True,False,.8,10,'reference')
            np.testing.assert_allclose(actual,expected,rtol=0,atol=1e-6) # float32 upload vs float64 mapping rounds differently
            assert np.all(actual[:,:,3]==1)
            cases.append(dict(prepared=prepared,eclipse=eclipse,error=float(abs(actual-expected).max()),opaque=True))
    # Disabling the band without reupload restores the original map.
    cuda.upload(rgba,depth,'restore',True)
    cuda.render(asdict(settings),w,h,32,32,True,False,.8,10,'restore')
    hard=replace(settings,depth_feather=0)
    restored,_=cuda.render(asdict(hard),w,h,32,32,True,False,.8,10,'restore')
    cuda.upload(rgba,depth,'fresh',True)
    fresh,_=cuda.render(asdict(hard),w,h,32,32,True,False,.8,10,'fresh')
    np.testing.assert_array_equal(restored,fresh)
    report=dict(passed=True,cases=cases,restore_exact=True,device=cuda.info()['device'])
    (Path(__file__).resolve().parents[1]/'research/blur-transition028-cuda.json').write_text(json.dumps(report,indent=2))
    print(report)
if __name__=='__main__':main()
