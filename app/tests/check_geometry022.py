from pathlib import Path
import sys,json,tempfile,time,shutil,os
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_render import options,load,Cancelled
from optics.geometry_cache import compute,clear,put,get,PREPARED,RESULTS,size
from optics import jobs
clear();base=options(dict(focus_m=3,radius_mm=20,samples=16,size=64,visibility='mesh',spatial_samples=4,engine='optimized'))
with tempfile.TemporaryDirectory() as tmp:
 folder=Path(tmp);src=jobs.folder('17'*16)
 for name in ('geometry-000000.npz','rgb-000000.png'):shutil.copy2(src/name,folder/name)
 with Image.open(folder/'rgb-000000.png') as im:im.convert('RGB').save(folder/'rgb-000000.png',compress_level=0)
 original=(folder/'rgb-000000.png').read_bytes();stamp=(folder/'rgb-000000.png').stat()
 # Finite-aperture optimized render must be exactly the reference's float32 image.
 ref,ri=compute(folder,{**base,'engine':'reference'},load,lambda a,b:None,lambda:False)
 cold,ci=compute(folder,base,load,lambda a,b:None,lambda:False);np.testing.assert_array_equal(cold,ref)
 assert not ci['performance']['result_cache_hit'] and not ci['performance']['geometry_cache_hit']
 warm,wi=compute(folder,base,load,lambda a,b:None,lambda:False);np.testing.assert_array_equal(warm,ref)
 assert wi['performance']['result_cache_hit'] and wi['actual_raster_evaluations']==0
 assert not warm.flags.writeable
 changed,chi=compute(folder,{**base,'focus_m':4},load,lambda a,b:None,lambda:False)
 assert chi['performance']['geometry_cache_hit'] and not chi['performance']['result_cache_hit']
 _,cut=compute(folder,{**base,'depth_jump_percent':6},load,lambda a,b:None,lambda:False)
 assert not cut['performance']['geometry_cache_hit'] and not cut['performance']['result_cache_hit']
 # Replacement with the same size and timestamp must invalidate both caches.
 with Image.open(folder/'rgb-000000.png') as im:
  pixels=np.array(im.convert('RGB'));pixels[0,0]=[255,255,255];Image.fromarray(pixels).save(folder/'rgb-000000.png',compress_level=0)
 assert (folder/'rgb-000000.png').stat().st_size==stamp.st_size
 os.utime(folder/'rgb-000000.png',ns=(stamp.st_atime_ns,stamp.st_mtime_ns))
 replacement,rep=compute(folder,base,load,lambda a,b:None,lambda:False)
 assert not rep['performance']['geometry_cache_hit'] and not rep['performance']['result_cache_hit'];assert np.max(np.abs(replacement-ref))>0
 (folder/'rgb-000000.png').write_bytes(original)
 # Radius-zero reuse evaluates every spatial sample once, without dropping any
 # DISTINCT aperture position. The float64 reassociation is bounded in float32.
 zero={**base,'radius_mm':0,'samples':64}
 before=time.perf_counter();zr,zri=compute(folder,{**zero,'engine':'reference'},load,lambda a,b:None,lambda:False);reference_s=time.perf_counter()-before
 before=time.perf_counter();zo,zoi=compute(folder,zero,load,lambda a,b:None,lambda:False);optimized_s=time.perf_counter()-before
 np.testing.assert_allclose(zo,zr,atol=1e-7,rtol=1e-7)
 assert zri['actual_raster_evaluations']==256 and zoi['actual_raster_evaluations']==4 and zoi['reused_raster_evaluations']==252
 # Caching must not suppress cancellation or serve a partial image.
 try:compute(folder,base,load,lambda a,b:None,lambda:True)
 except Cancelled:pass
 else:raise AssertionError('cache cancellation ignored')
 for info in (ci,wi,chi,rep,zoi):assert all(v>=0 for k,v in info['performance'].items() if k.endswith('_s'))
# Exercise capacity and eviction without allocating the production memory budget.
from collections import OrderedDict
cache=OrderedDict();assert put(cache,'a',np.zeros(8),128);assert put(cache,'b',np.zeros(8),128);assert put(cache,'c',np.zeros(8),128);assert get(cache,'a') is None and size(tuple(cache.values()))<=128
assert not put(cache,'large',np.zeros(100),128);assert 'large' not in cache
for body in (dict(engine='imaginary'),dict(visibility='zbuffer',engine='optimized')):
 try:options(body)
 except ValueError:pass
 else:raise AssertionError('invalid engine')
clear();assert not PREPARED and not RESULTS
report=dict(passed=True,finite_aperture_float32_exact=True,result_cache_exact=True,focus_reuses_prepared_geometry=True,depth_cut_invalidates_topology=True,same_size_timestamp_replacement_invalidates=True,readonly_cached_arrays=True,bounded_lru_eviction=True,cancelled_cache_request_rejected=True,zero_aperture_reference_evaluations=256,zero_aperture_optimized_evaluations=4,zero_aperture_max_abs_error=float(np.max(np.abs(zr-zo))),reference_zero_s=reference_s,optimized_zero_s=optimized_s,profiling_nonnegative=True,invalid_engine_rejected=True)
(ROOT/'research/geometry022-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)
