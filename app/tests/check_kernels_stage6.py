"""Compare the optimized renderer with a saved baseline, including GPU timings.

Run baseline before editing: python tests/check_kernels_stage6.py baseline DIR
Then: python tests/check_kernels_stage6.py compare DIR [candidate DLL]
Timings include the native render's copy back; no end-to-end FPS claim.
"""
from pathlib import Path
import sys,json,time,statistics,os
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics import preview,cuda
from optics.core import Settings

def main():
    mode=sys.argv[1];folder=Path(sys.argv[2]);folder.mkdir(parents=True,exist_ok=True)
    if len(sys.argv)>3:
        original=cuda.C.CDLL;candidate=str(Path(sys.argv[3]).resolve())
        cuda.C.CDLL=lambda path:original(candidate if str(path).endswith('optica_cuda.dll') else path)
    rows=[]
    for grid,taps in ((3,32),(5,256),(9,1024)):
        s=Settings(ray_backend='cpu',field_grid=grid)
        preview.kernel(s,16/9,taps) # Warm tracing and calibration, exclude them from assembly measurement.
        times=[]
        for _ in range(5):
            preview._kernel_cached.cache_clear();start=time.perf_counter()
            atlas=preview.kernel(s,16/9,taps);times.append((time.perf_counter()-start)*1000)
        name=f'atlas-{grid}-{taps}';values=np.stack((atlas.ray_array,atlas.pupil_array))
        target=folder/(name+'.npy')
        if mode=='baseline':np.save(target,values)
        else:assert np.array_equal(values,np.load(target)),name
        rows.append(dict(name=name,median_ms=statistics.median(times),exact=True))
    assert cuda.available(),cuda.info()
    rng=np.random.default_rng(606);w=int(os.environ.get('OPTICA_KERNEL_TEST_WIDTH','256'));h=w*9//16
    rgba=rng.random((h,w,4),dtype=np.float32);rgba[:,:,:3]*=3;rgba[:,:,3]=1
    rgba[30:50,60:80,3]=.35
    depth=np.broadcast_to(np.linspace(0,1,w,dtype='f4'),(h,w)).copy()
    cases=[('focus',{},False),('blur',{'focus_m':.8},False),
           ('slicing',{'depth_mode':'slicing','depth_slices':4,'eclipse_bokeh':False},True),
           ('eclipse',{'depth_mode':'cut','eclipse_bokeh':True,'depth_feather':.02},True),
           ('shimmer',{'shimmer_amount':1.2,'shimmer_prism':.3,'shimmer_normalize':True},True),
           ('aberrations',{'swirl':.6,'coma':.2,'spherical3':.15,'bokeh_distortion':.3,'astigmatism_mm':.2},True),
           ('ghost-diffraction',{'ghost_gain':1.,'diffraction_gain':.5},False)]
    for name,extra,usedepth in cases:
        raw={**Settings(ray_backend='cpu',field_grid=3).__dict__,**extra}
        cuda.upload(rgba,depth,token='stage6')
        args=dict(samples=32,taps=32,use_depth=usedepth,token='stage6')
        cuda.render(raw,w,h,**args) # Initialize graphs and layer pyramids.
        times=[]
        for _ in range(15):
            frame,info=cuda.render(raw,w,h,**args);times.append(info['gpuMs'])
        half,_=cuda.render(raw,w,h,preview=True,**args)
        target=folder/(name+'.npz')
        if mode=='baseline':np.savez(target,frame=frame,half=half)
        else:
            before=np.load(target)
            assert np.array_equal(frame,before['frame']),(name,float(np.max(np.abs(frame-before['frame']))))
            assert np.array_equal(half,before['half']),name+' half'
        assert np.isfinite(frame).all() and np.all(frame[:,:,3]==1)
        rows.append(dict(name=name,median_ms=statistics.median(times),exact=True,precision=['float32','float16']))
    report=dict(mode=mode,device=cuda.info()['device'],width=w,height=h,cases=rows)
    if mode=='compare':
        before=json.loads((folder/'baseline.json').read_text())
        for row,old in zip(rows,before['cases']):
            assert row['name']==old['name']
            row.update(baseline_ms=old['median_ms'],speedup=old['median_ms']/row['median_ms'])
    (folder/(mode+'.json')).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
