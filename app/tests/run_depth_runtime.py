"""Real inference via the application's packaged depth runtime and job runner."""
from pathlib import Path
import sys,json,time,subprocess,shutil,os
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import jobs
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT.parents[1]/'work';TEST=WORK/'depth-runtime-test';TEST.mkdir(exist_ok=True)
subprocess.run([jobs.ffmpeg(),'-hide_banner','-loglevel','error','-y','-i',str(WORK/'dvd/demo/drone.mp4'),'-frames:v','5','-vf','scale=320:-2','-r','5',str(TEST/'clip.mp4')],check=True)
subprocess.run([jobs.ffmpeg(),'-hide_banner','-loglevel','error','-y','-i',str(TEST/'clip.mp4'),'-frames:v','1',str(TEST/'frame.png')],check=True)
jobs.DEPTH_ROOT=Path(os.environ.get('DEPTH_TEST_RUNTIME',str(ROOT.parent/'Simulador-de-Desfoque-Bruxosdovfx-0.9.4-Windows/SimuladorDeDesfoque/native/depth')))
jobs.PYTHON=jobs.DEPTH_ROOT/'python/python.exe'
jobs.DEPTH_WORKER=Path(os.environ.get('DEPTH_TEST_WORKER',str(ROOT/'optics/depth_worker.py')))
results=[]
for model in os.environ.get('DEPTH_TEST_MODELS','da2,moge,da3,dvd').split(','):
 kind='video' if model=='dvd' and os.environ.get('DEPTH_TEST_DVD_IMAGE')!='1' else 'image';key=jobs.create(dict(model=model,kind=kind),'depth')['id'];path=jobs.folder(key);shutil.copy2(TEST/('clip.mp4' if kind=='video' else 'frame.png'),path/'source');jobs.run(key)
 started=time.monotonic();last=''
 while True:
  status=jobs.status(key)
  if status.get('message','')!=last:print(model,status,flush=True);last=status.get('message','')
  if status['state'] in ('complete','error'):break
  if time.monotonic()-started>1200:jobs.cancel(key);raise TimeoutError(model)
  time.sleep(1)
 jobs.JOBS[key]['process'].wait(timeout=30)
 result={**status,'model':model,'id':key,'seconds':round(time.monotonic()-started,2)};results.append(result)
 if status['state']=='complete':
  depth=np.fromfile(path/'depth-000000.bin',dtype='<f4');assert len(depth)==status['width']*status['height'] and np.isfinite(depth).all() and np.ptp(depth)>.1;shutil.copy2(path/'depth-000000.png',ROOT.parent/f'Depth-runtime-{model}.png')
 else:print((path/'log.txt').read_text(errors='replace')[-2500:],flush=True)
 (ROOT.parent/'Depth-runtime-tests.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results),flush=True)
assert all(r['state']=='complete' for r in results)
