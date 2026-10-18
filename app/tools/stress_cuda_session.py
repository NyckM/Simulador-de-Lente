"""Bounded CUDA session soak: changing depth/focus/source and shared-frame lifetime."""
from pathlib import Path
import argparse,ctypes,json,sys,time
from dataclasses import asdict
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import cuda_worker
from optics.core import Settings

def handles(pid=None):
 if sys.platform!='win32':return None
 kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.GetCurrentProcess.restype=ctypes.c_void_p
 kernel.OpenProcess.argtypes=[ctypes.c_ulong,ctypes.c_int,ctypes.c_ulong];kernel.OpenProcess.restype=ctypes.c_void_p
 kernel.GetProcessHandleCount.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_ulong)];kernel.CloseHandle.argtypes=[ctypes.c_void_p]
 process=kernel.OpenProcess(0x1000,False,pid) if pid else kernel.GetCurrentProcess();count=ctypes.c_ulong()
 try:return count.value if kernel.GetProcessHandleCount(process,ctypes.byref(count)) else None
 finally:
  if pid:kernel.CloseHandle(process)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--seconds',type=float,default=60);parser.add_argument('--output',required=True);args=parser.parse_args()
 if not 1<=args.seconds<=3600:raise ValueError('seconds must be 1..3600')
 w,h=768,480;rng=np.random.default_rng(29);rgb=rng.random((h,w,4),dtype='f4');rgb[:,:,3]=1;depth=np.broadcast_to(np.linspace(0,1,w,dtype='f4'),(h,w)).copy();base=Settings(ray_focus=False,field_grid=3,iris_mm=4,depth_slices=8)
 iterations=0;records=[]
 try:
  device=cuda_worker.info();assert device['available'],device
  revision=cuda_worker.upload(rgb,depth,'soak')
  for i in range(6):
   s=asdict(base);s.update(depth_mode=['auto','cut','slicing'][i%3],focus_m=1+i*.2)
   frame,info=cuda_worker.render(s,w,h,24,32,True,False,.8,10,'soak',preview=True)
  start=time.monotonic();baseline=dict(host_handles=handles(),worker_handles=handles(cuda_worker._worker.process.pid));next_sample=0
  while time.monotonic()-start<args.seconds:
   s=asdict(base);s.update(depth_mode=['auto','cut','slicing'][iterations%3],focus_m=1+(iterations%11)*.2,depth_cut=.3+(iterations%4)*.1,depth_feather=(iterations%3)*.02)
   if iterations%30==0:
    source=rgb.copy();source[:,:,:3]*=1-.1*(iterations%2);revision=cuda_worker.upload(source,depth,'soak')
   frame,info=cuda_worker.render(s,w,h,24,32,True,False,.8,10,'soak',preview=True)
   assert info['revision']==revision and info['workerTransfer']=='shared-memory-copy'
   assert np.isfinite(frame).all() and np.all(frame[:,:,3]==1)
   iterations+=1
   elapsed=time.monotonic()-start
   if elapsed>=next_sample:
    records.append(dict(seconds=elapsed,iterations=iterations,host_handles=handles(),worker_handles=handles(cuda_worker._worker.process.pid),generation=info['workerGeneration'],worker_ms=info['workerRoundtripMs']));next_sample=elapsed+10
  final=dict(host_handles=handles(),worker_handles=handles(cuda_worker._worker.process.pid))
  if baseline['host_handles'] is not None:assert final['host_handles']<=baseline['host_handles']+8
  if baseline['worker_handles'] is not None:assert final['worker_handles']<=baseline['worker_handles']+8
  report=dict(passed=True,device=device['device'],duration_s=time.monotonic()-start,iterations=iterations,baseline=baseline,final=final,samples=records,limitations=['Synthetic image at 768x480, 24 samples and half precision.','Windows process handle counts only; not a VRAM or RSS memory leak proof.','No driver/context failure induced; not hours of use.'])
  Path(args.output).write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
 finally:cuda_worker.shutdown()
if __name__=='__main__':main()
