"""Regression against the previous executable: real native CUDA and CPU."""
import json,struct,urllib.request,subprocess,time
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter,distance_transform_edt
ROOT=Path(__file__).resolve().parents[2];here=Path(__file__).parent
meta=json.loads((here/'panel/controls.json').read_text(encoding='utf-8'));controls={c['id']:c for c in meta['controls']};params=np.zeros(meta['count'],np.float64)
for c in meta['controls']:params[c['index']]=c['default']
for k,v in dict(FOCUS=2,NEAR_DISTANCE=2,FAR_DISTANCE=5,QUALITY=1,BOKEH_GAIN=4,BLADES=0).items():params[controls[k]['index']]=v
w,h=640,400;yy,xx=np.mgrid[:h,:w];mask=(xx>220+(yy-200)*.35)&(xx<490)&(yy>60)&(yy<350)
image=np.zeros((h,w,4),np.float32);image[...,:3]=[.08,.055,.24];image[...,3]=1;image[mask,:3]=[.9,.18,.035];image[mask&(yy>145)&(yy<205)&(xx<410),:3]=[.85,.85,.85]
depth=gaussian_filter(mask.astype('f4'),5);headers={'X-Bruxos-Plugin':'Photoshop-1'}
def request(path,data=None):return urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8769'+path,data=data,headers=headers),timeout=120).read()
def frame(p,d):
 b=struct.pack('<4s6I',b'BXPS',1,w,h,len(p),1,0)+p.tobytes()+image.tobytes()+d.tobytes();return np.frombuffer(request('/api/render',b),np.float32).reshape(h,w,4).copy()
def run(exe,new=False):
 process=subprocess.Popen([str(exe)],creationflags=0x08000000);owned=False
 try:
  for i in range(50):
   if process.poll() is not None:raise RuntimeError('Engine could not bind port; an existing instance may be running.')
   try:info=json.loads(request('/api/info'));owned=True;break
   except OSError:time.sleep(.1)
  assert owned
  soft=frame(params,depth);hard=frame(params,mask.astype('f4'));result=[soft,hard]
  if new:
   p=params.copy();p[controls['ENGINE']['index']]=1;cpu=frame(p,depth);difference=float(abs(soft-cpu).max());assert difference<.001,difference;result.append(difference)
  return result
 finally:
  if owned:
   try:request('/api/quit',b'')
   except OSError:pass
  process.wait(timeout=10)
legacy=ROOT.parent/'Bruxosdovfx-Desfoque-Photoshop-0.1.0-Windows/plugin/engine/BruxosPhotoshopEngine.exe';old,_=run(legacy);after,reference,delta=run(here/'panel/engine/BruxosPhotoshopEngine.exe',True)
outside=(distance_transform_edt(~mask)>4)&(distance_transform_edt(~mask)<20)&(yy>100)&(yy<300)&(xx<350)
before_error=float(abs(old[outside,:3]-reference[outside,:3]).mean());after_error=float(abs(after[outside,:3]-reference[outside,:3]).mean());assert after_error<before_error*.2,(before_error,after_error)
report=dict(before_halo_error=before_error,after_halo_error=after_error,reduction_percent=100*(1-after_error/before_error),cpu_cuda_max_difference=delta,real_photoshop_host_tested=False)
(here/'validation/halo-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
