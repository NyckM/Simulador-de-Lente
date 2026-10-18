"""Selective dependencies, exact reuse and bounded intermediate storage."""
import sys,json
from pathlib import Path
from dataclasses import replace
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings
from optics.preview import kernel,_kernel_cached,_ray_cache
from optics.cache import ByteCache

def reset():_kernel_cached.cache_clear();_ray_cache.clear()
reset();s=Settings(ray_backend='cpu',field_grid=3)
cold=kernel(s,1.5,32,1024,profile=True)
assert not cold['profile']['ray_cache_hit']
quality=kernel(s,1.5,64,1024,profile=True)
assert not quality['profile']['cache_hit'] and quality['profile']['ray_cache_hit']
reset();fresh=kernel(s,1.5,64,1024,profile=True)
assert fresh['atlas']==quality['atlas'] and fresh['pupils']==quality['pupils']
assert not fresh['profile']['ray_cache_hit']
kernel(s,1.5,32,1024)
uniforms=kernel(replace(s,focus_m=2,exposure=1,depth_gain=2,swirl=.5),1.5,32,1024,profile=True)
assert uniforms['profile']['cache_hit']
dependencies=[]
for change in [{'iris_mm':3},{'source_m':3},{'sensor_mm':32},{'blades':5},{'rotation':12},{'dispersion':.2},{'coating_strength':.5},{'coating_nm':600},{'iris_softness':.1},{'soften_internal_cutoff':False},{'lens_model':'tessar_50'},{'lens_edits':((0,'nd',1.68),)}]:
    result=kernel(replace(s,**change),1.5,32,1024,profile=True)
    assert not result['profile']['ray_cache_hit'],change
    # Discard only the compressed atlas: an identical trace should be reusable.
    _kernel_cached.cache_clear()
    reused=kernel(replace(s,**change),1.5,32,1024,profile=True)
    assert reused['profile']['ray_cache_hit'],change
    assert reused['atlas']==result['atlas'] and reused['pupils']==result['pupils'],change
    dependencies.append(list(change)[0])
assert _ray_cache.info()['bytes']<=_ray_cache.max_bytes
tiny=ByteCache(64,max_entries=2);tiny.put('a',np.zeros(4),32);tiny.put('b',np.zeros(4),32);tiny.get('a');tiny.put('c',np.zeros(4),32)
assert tiny.get('b') is None and tiny.get('a') is not None
assert not tiny.put('oversized',np.zeros(20),160) and tiny.info()['bytes']==64
tiny.put('zero',(),0);tiny.put('zero2',(),0);assert tiny.info()['entries']==2
result=dict(quality_reuses_rays=True,reused_quality_exact=True,uniforms_reuse_atlas=True,dependencies=dependencies,recomputed_atlases_exact=True,ray_cache=_ray_cache.info(),byte_and_entry_limits_verified=True,cold=cold['profile'],quality=quality['profile'])
(ROOT/'research/cache-stage5-validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
