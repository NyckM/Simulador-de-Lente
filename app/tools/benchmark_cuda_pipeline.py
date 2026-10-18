"""Reproducible isolated CUDA baseline; timings exclude HTTP/browser presentation."""
from pathlib import Path
import argparse,json,sys,time
from dataclasses import asdict
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import cuda,cuda_worker
from optics.core import Settings

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--repeat',type=int,default=3);args=parser.parse_args()
 if not 1<=args.repeat<=20:raise ValueError('repeat must be 1..20')
 s=Settings(ray_focus=False,field_grid=3,iris_mm=4,focus_m=2,depth_mode='slicing',depth_slices=8)
 cases=[]
 try:
  assert cuda.available(),cuda.info()
  for w,h in [(1920,1080),(3840,2160)]:
   y,x=np.mgrid[:h,:w];rgba=np.ones((h,w,4),'f4');rgba[:,:,0]=x/w;rgba[:,:,1]=y/h;rgba[:,:,2]=.1
   rgba[h//4:h//4+4,w//4:w//4+4,:3]=8
   depth=np.broadcast_to(np.linspace(0,1,w,dtype='f4'),(h,w)).copy();del x,y
   token=f'benchmark-{w}';start=time.perf_counter();cuda_worker.upload(rgba,depth,token);upload_ms=(time.perf_counter()-start)*1000
   cuda.upload(rgba,depth,token)
   call=(asdict(s),w,h,24,32,True,False,.8,10,token)
   reference,_=cuda.render(*call,preview=False)
   _,warm=cuda_worker.render(*call,preview=False)
   runs=[]
   for i in range(args.repeat):
    start=time.perf_counter();frame,info=cuda_worker.render(*call,preview=False);wall=(time.perf_counter()-start)*1000
    error=float(np.max(np.abs(frame-reference)));assert error==0
    runs.append(dict(wall_ms=wall,gpu_ms=info['gpuMs'],server_ms=info['totalMs'],worker_ms=info['workerRoundtripMs'],ipc_overhead_ms=max(0,info['workerRoundtripMs']-info['totalMs']),max_error=error))
   cases.append(dict(width=w,height=h,input_bytes=rgba.nbytes+depth.nbytes,output_bytes=reference.nbytes,upload_ms=upload_ms,warmup=warm,runs=runs,median_ms={key:float(np.median([run[key] for run in runs])) for key in runs[0]}))
   print(f'{w}x{h}: {cases[-1]["median_ms"]}',flush=True)
  report=dict(passed=True,device=cuda.info()['device'],settings=asdict(s),samples=24,taps=32,precision='float32',cases=cases,limitations=['Synthetic RGB and depth; not a real-footage benchmark.','24 samples, 32 taps; not final export quality.','Includes isolated-process transfer; excludes HTTP, WebGL presentation and optical atlas upload.','Input/output bytes are payload sizes, not peak CPU/GPU memory measurements.','Baseline only; no performance improvement claimed.'])
  Path(args.output).write_text(json.dumps(report,indent=2),encoding='utf-8')
 finally:cuda_worker.shutdown()
if __name__=='__main__':main()
