"""Native CUDA preprocessing equivalence and raw-depth restoration."""
from pathlib import Path
from dataclasses import asdict,replace
import ctypes,json,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics import cuda
from optics.core import Settings
from optics.depth_mapping import prepare

def main():
    # Validate the production engine, not an archived Stage 6 ABI.
    assert cuda.available(),cuda.info()
    h,w=48,64;rgba=np.ones((h,w,4),dtype='f4');rgba[...,:3]=.1;rgba[::7,::9,:3]=3
    raw=np.broadcast_to(np.linspace(.4,.6,w,dtype='f4'),(h,w)).copy()
    common=Settings(iris_mm=4,focus_m=3,source_m=5,near_m=2,far_m=10,depth_mode='slicing',depth_slices=8,field_grid=3,ray_focus=False)
    results=[]
    for config in [dict(depth_normalize='minmax',depth_curve=2,depth_mapping='linear'),dict(depth_units='meters',depth_gain=10),dict(depth_normalize='manual',depth_low=.4,depth_high=.6,depth_gain=-1,depth_bias=1)]:
        s=replace(common,**config);cuda.upload(rgba,raw,'stage13')
        actual,_=cuda.render(asdict(s),w,h,32,32,True,True,2,10,'stage13')
        encoded=prepare(raw,s,2,10,True)['nearness'].astype('f4');cuda.upload(rgba,encoded,'stage13',depth_prepared=True)
        equivalent,_=cuda.render(asdict(s),w,h,32,32,True,True,2,10,'stage13')
        error=float(abs(actual-equivalent).max());assert error<2e-6 and np.isfinite(actual).all();assert actual[...,3].min()==1
        results.append(dict(configuration=config,error=error,alpha=float(actual[...,3].min())))
    # Without another upload, disabling the interpretation must restore raw input.
    s=replace(common,depth_normalize='minmax');cuda.upload(rgba,raw,'stage13');cuda.render(asdict(s),w,h,32,32,True,False,2,10,'stage13')
    restored,_=cuda.render(asdict(common),w,h,32,32,True,False,2,10,'stage13')
    cuda.upload(rgba,raw,'stage13');fresh,_=cuda.render(asdict(common),w,h,32,32,True,False,2,10,'stage13');assert np.array_equal(restored,fresh)
    report=dict(device=cuda.info()['device'],cases=results,raw_depth_restore_exact=True)
    (ROOT/'research/depth-stage13-cuda-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)

if __name__=='__main__':main()
