"""Separate refraction throughput from complete atlas wall time; no video-FPS claim."""
import sys,time,json,statistics
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from dataclasses import replace
from optics.core import Settings,get_lens
from optics.preview import kernel,_kernel_cached,_ray_cache
from optics import vulkan

def median(call,repeats=3):
 times=[]
 for _ in range(repeats):
  t=time.perf_counter();call();times.append((time.perf_counter()-t)*1000)
 return statistics.median(times)

def main():
 s=Settings(iris_mm=8.55,blades=0,source_m=5);lens=get_lens(s);count=262144
 i=np.arange(count)+.5;r=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(i/count);a=i*np.pi*(3-np.sqrt(5));p=np.column_stack((r*np.cos(a),r*np.sin(a),np.full(count,-1.)));o=np.array([-12*5000/lens.efl,0,-5000]);d=p-o;d/=np.linalg.norm(d,axis=1)[:,None];wl=np.full(count,.5876)
 vulkan.trace(lens,s,p,d,wl)
 cpu=median(lambda:lens.trace(p,d,s));gpu=median(lambda:vulkan.trace(lens,s,p,d,wl));dispatch=vulkan.info()['gpu_ms']
 results={'device':vulkan.info()['device'],'rays':count,'cpu_trace_wall_ms':cpu,'vulkan_trace_wall_ms':gpu,'last_gpu_dispatch_ms':dispatch,'trace_speedup':cpu/gpu,'atlas':[]}
 for grid in (5,9):
  times={}
  for backend in ('cpu','vulkan'):
   def build():
    _kernel_cached.cache_clear();_ray_cache.clear();data=kernel(replace(s,field_grid=grid,ray_backend=backend),taps=128)
    assert data['trace_backend']==('cpu' if backend=='cpu' else 'vulkan-compute')
   times[backend]=median(build)
  results['atlas'].append({'grid':grid,'taps':128,'cpu_wall_ms':times['cpu'],'vulkan_wall_ms':times['vulkan'],'speedup':times['cpu']/times['vulkan']})
 print(json.dumps(results,indent=2));path=Path(__file__).resolve().parents[2]/'Vulkan-Benchmark-0.8.0.json';path.write_text(json.dumps(results,indent=2),encoding='utf-8')
if __name__=='__main__':main()
