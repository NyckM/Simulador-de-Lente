"""Interleaved comparison with the pre-stage-6 assembly, without timing tracing."""
from pathlib import Path
import sys,types,time,statistics,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics import preview
from optics.core import Settings

def main():
    source=(ROOT/'optics/preview.py').read_text()
    source=source.replace('    pupil_tree=_pupil_tree(taps)\n','')
    source=source.replace('                labels=pupil_tree.query(normalized,workers=1)[1]',
        '                t=np.arange(taps)+.5\n'
        '                targets=np.column_stack((np.cos(t*2.39996323),np.sin(t*2.39996323)))*np.sqrt(t/taps)[:,None]\n'
        '                labels=cKDTree(targets).query(normalized,workers=1)[1]')
    old=types.ModuleType('optics.stage6_reference');old.__package__='optics';exec(compile(source,'stage6-reference','exec'),old.__dict__)
    results=[]
    for grid,taps in ((3,32),(5,256),(9,1024)):
        s=Settings(ray_backend='cpu',field_grid=grid)
        reference=old.kernel(s,16/9,taps);current=preview.kernel(s,16/9,taps)
        assert np.array_equal(reference.ray_array,current.ray_array)
        assert np.array_equal(reference.pupil_array,current.pupil_array)
        timings={'before':[],'after':[]}
        for repeat in range(12):
            order=(('before',old),('after',preview)) if repeat%2==0 else (('after',preview),('before',old))
            for name,module in order:
                module._kernel_cached.cache_clear();start=time.perf_counter();module.kernel(s,16/9,taps)
                timings[name].append((time.perf_counter()-start)*1000)
        before=statistics.median(timings['before']);after=statistics.median(timings['after'])
        results.append(dict(grid=grid,taps=taps,before_ms=before,after_ms=after,speedup=before/after,exact=True,runs_per_variant=12))
    report=dict(scope='Warm ray/calibration caches; atlas assembly and metadata; interleaved timings',cases=results)
    (ROOT/'research/assembly-stage6-benchmark.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
