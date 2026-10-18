import json,struct,urllib.request,urllib.error,subprocess,time,os
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent;meta=json.loads((root/'panel/controls.json').read_text(encoding='utf-8'));controls={c['id']:c for c in meta['controls']};p=np.zeros(meta['count'],np.float64)
for c in controls.values():p[c['index']]=c['default']
url='http://127.0.0.1:8769';headers={'X-Bruxos-Plugin':'Photoshop-1'};checks=0

def request(path,body=None,extra=None):
 h=dict(headers);h.update(extra or {});return urllib.request.urlopen(urllib.request.Request(url+path,data=body,headers=h),timeout=120).read()
def check(v,label):
 global checks
 assert v,label;checks+=1;print('PASS',label)
def setp(params,**kw):
 q=params.copy()
 for key,v in kw.items():q[controls[key]['index']]=v
 return q
w,h=64,48;rgba=np.zeros((h,w,4),np.float32);rgba[:,:,:3]=(.015,.025,.04);rgba[:,:,3]=1;rgba[10,8,:3]=[6,3,.2];rgba[9,50,:3]=[.2,3,7];rgba[36,15,:3]=[5,3,.3];rgba[18:37,25:40,:3]=[.2,.42,.28]
depth=np.zeros((h,w),np.float32);depth[18:37,25:40]=1

def packed(params,image=rgba,d=depth):
 hh,ww=image.shape[:2];return struct.pack('<4s6I',b'BXPS',1,ww,hh,len(params),int(d is not None),0)+params.tobytes()+image.tobytes()+(d.tobytes() if d is not None else b'')
def render(params,image=rgba,d=depth):return np.frombuffer(request('/api/render',packed(params,image,d)),np.float32).reshape(image.shape).copy()
process=subprocess.Popen([os.environ.get('BRUXOS_TEST_ENGINE',str(root/'panel/engine/BruxosPhotoshopEngine.exe'))],creationflags=0x08000000)
try:
 for _ in range(40):
  try:info=json.loads(request('/api/info'));break
  except OSError:time.sleep(.1)
 check(info['presets']==295 and info['protocol']==1,'Native engine info')
 near=render(setp(p,QUALITY=0,FOCUS=.8));far=render(setp(p,QUALITY=0,FOCUS=10));stopped=render(setp(p,QUALITY=0,FOCUS=10,FSTOP=16));cpu=render(setp(p,QUALITY=0,FOCUS=10,ENGINE=1))
 check(np.isfinite(far).all(),'Finite RGBA output');check(np.max(np.abs(far-near))>.01,'Focus racks through depth');check(np.max(np.abs(far-stopped))>.01,'Aperture changes image');check(np.max(np.abs(far-cpu))<.001,'CUDA/CPU agreement');check(np.max(np.abs(far-render(setp(p,QUALITY=0,FOCUS=10))))<1e-6,'Deterministic output')
 for preset in (1,2,4,12,294):check(np.isfinite(render(setp(p,QUALITY=0,PRESET=preset))).all(),f'Preset {preset}')
 negative=render(setp(p,QUALITY=0,IMPRESSION_PARAM=-.8));check(np.max(np.abs(negative-near))>.01,'Negative Impression render')
 # New controls: actual CPU/CUDA images, default compatibility and zero-side reconstruction.
 neutral=setp(p,QUALITY=1,USE_DEPTH=0,SOURCE_DISTANCE=2,FOCUS=2,SPHERICAL3=2)
 original=render(neutral,rgba,None)
 explicit=render(setp(neutral,FOCUS_KEEP=0,FOCUS_WIDTH=.1,FG_AMOUNT=100,BG_AMOUNT=100,TEXTURE_RINGS=0,TEXTURE_GRAIN=0,TEXTURE_SCALE=6,TEXTURE_ROT=0,POST_EDGE_LIMIT=3),rgba,None)
 check(np.array_equal(original,explicit),'New optical defaults preserve baseline')
 for label,settings in [('focus',dict(FOCUS_KEEP=1)),('transition',dict(FOCUS_KEEP=1,FOCUS_WIDTH=.3,SOURCE_DISTANCE=2.1)),('foreground',dict(FOCUS=5,SOURCE_DISTANCE=2,FG_AMOUNT=0)),('background',dict(FOCUS=.8,SOURCE_DISTANCE=5,BG_AMOUNT=0)),('rings',dict(TEXTURE_RINGS=1)),('grain',dict(TEXTURE_GRAIN=1)),('texture frequency / rotation',dict(TEXTURE_RINGS=.8,TEXTURE_GRAIN=.7,TEXTURE_SCALE=10,TEXTURE_ROT=73)),('edge cap',dict(POST_EDGE=100,POST_EDGE_LIMIT=1))]:
  conf=setp(neutral,**settings);gpu=render(conf,rgba,None);new_cpu=render(setp(conf,ENGINE=1),rgba,None)
  check(np.isfinite(gpu).all() and np.max(np.abs(new_cpu-gpu))<.001,'New optics CPU/CUDA parity: '+label)
  check(np.max(np.abs(gpu-original))>1e-5,'New optics changes image: '+label)
 edge0=render(setp(neutral,POST_EDGE=100,POST_EDGE_LIMIT=0),rgba,None)
 check(np.array_equal(original,edge0),'Zero EV limit bypasses compensation')
 # Exact optics baseline for effects: same focus.
 base=render(setp(p,QUALITY=0));positive=render(setp(p,QUALITY=0,IMPRESSION_PARAM=.8));check(np.max(np.abs(negative-base))>1e-4 and np.max(np.abs(positive-negative))>1e-4,'Signed Impression changes optical response')
 shimmer=render(setp(p,QUALITY=0,SHIMMER_PARAM=4));check(np.max(np.abs(shimmer-base))>1e-4,'Shimmer optical layer')
 transparent=np.zeros_like(rgba);transparent[18:37,25:40]=rgba[18:37,25:40]
 t=render(setp(p,QUALITY=0,FOCUS=10),transparent);check(t[:,:,3].min()<.01 and t[:,:,3].max()>.5,'Transparency preserved');check(((t[:,:,3]>.001)&(t[:,:,3]<.999)).any(),'Defocused alpha is smooth');check(np.max(np.abs(t[t[:,:,3]<1e-7,:3]))==0,'No RGB outside zero alpha')
 noDepth=render(setp(p,QUALITY=0,USE_DEPTH=0),rgba,None);check(np.isfinite(noDepth).all(),'Optional depth path');check(far[:,:,:3].max()>1,'HDR highlights retained')
 try:request('/api/render',packed(setp(p,FOCUS=float('nan'))));assert False
 except urllib.error.HTTPError as e:check(e.code==400,'Reject nonfinite params')
 try:request('/api/render',packed(p)[:-4]);assert False
 except urllib.error.HTTPError as e:check(e.code==400,'Reject truncated frame')
 try:request('/api/info',extra={'Origin':'https://example.com'});assert False
 except urllib.error.HTTPError as e:check(e.code==403,'Reject browser origin')
 try:urllib.request.urlopen(url+'/api/info');assert False
 except urllib.error.HTTPError as e:check(e.code==403,'Reject missing plugin header')
 # New post controls exercise the actual native service and CUDA/CPU composition.
 baseline=render(setp(p,QUALITY=0))
 for kind in range(1,16):
  filtered=render(setp(p,QUALITY=0,POST_KIND=kind,POST_THRESHOLD=.05,POST_SHIFT=.1,POST_INNER=0,POST_RADIUS=.08))
  check(np.isfinite(filtered).all(),f'Native post filter {kind}')
  check(np.max(abs(filtered[:,:,:3]-baseline[:,:,:3]))>1e-7,f'Filter {kind} changes output')
  check(np.array_equal(filtered[:,:,3],baseline[:,:,3]),f'Filter {kind} preserves alpha')
 flare=render(setp(p,QUALITY=0,FLARE_ENABLED=1,FLARE_GAIN=10,FLARE_THRESHOLD=.5))
 check(np.max(abs(flare-baseline))>1e-6,'Traced Lens Flare changes output')
 check(np.array_equal(flare[:,:,3],baseline[:,:,3]),'Lens Flare preserves alpha')
 zero=render(setp(p,QUALITY=0,POST_KIND=8,POST_AMOUNT=0,FLARE_ENABLED=1,FLARE_GAIN=0))
 check(np.array_equal(zero,baseline),'Post filters and flare exact zero')
 bright=render(setp(p,QUALITY=0,POST_EDGE=100));bright_cpu=render(setp(p,QUALITY=0,POST_EDGE=100,ENGINE=1))
 check(np.isfinite(bright).all() and np.max(abs(bright-baseline))>1e-7,'Pupil throughput edge compensation changes output')
 check(np.max(abs(bright-bright_cpu))<.001,'Edge compensation agrees CPU/CUDA')
 check(np.array_equal(bright[:,:,3],baseline[:,:,3]),'Edge compensation preserves alpha')
 target=root/'validation';target.mkdir(exist_ok=True)
 for name,a in [('source',rgba),('near',near),('far',far),('f16',stopped),('transparent',t),('negative',negative)]:
  rgb=np.clip(a[:,:,:3],0,None);rgb=rgb/(1+rgb);rgb=np.where(rgb<=.0031308,12.92*rgb,1.055*rgb**(1/2.4)-.055);Image.fromarray(np.uint8(np.clip(rgb*255,0,255))).resize((512,384)).save(target/(name+'.png'))
 (target/'results.json').write_text(json.dumps({'checks':checks,'cpuCudaMaxDifference':float(np.max(np.abs(far-cpu))),'realPhotoshopHostTested':False},indent=2));print('RESULT',checks,'checks')
finally:
 try:request('/api/quit',b'')
 except OSError:pass
 process.wait(timeout=10)
