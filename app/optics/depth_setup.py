"""One owned model operation at a time; durable progress and cancellable process trees."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,threading,time,uuid,zipfile
from .complements import USER,ASSETS
from .depth_runtime import configured,configure,load,save,LOCK as CONFIG_LOCK
from .depth_errors import diagnostic
from .worker_status import write_status
ROOT=Path(__file__).resolve().parents[1];LOCK=threading.RLock();ACTIVE=None
TERMINAL={'complete','error','cancelled'}

def status():
 global ACTIVE
 with LOCK:
  if not ACTIVE:return dict(state='idle')
  op=ACTIVE
  try:data=json.loads((op['job']/'status.json').read_text(encoding='utf-8'))
  except (OSError,ValueError):data=op.get('last',dict(state='starting'))
  proc=op['process']
  if proc.poll() is not None:
   if data.get('state') not in TERMINAL:
    data=dict(state='error',**diagnostic((op['job']/'log.txt').read_text(encoding='utf-8',errors='replace')[-3000:] or 'Worker encerrado sem resultado.'))
   if data.get('state')=='complete' and not op.get('registered'):
    try:
     if op['model']=='moge3':configure(dict(model=op['model'],python=data['runtime']['python'],cache=op['cache']))
     elif op['action']=='download':configure(dict(model=op['model'],python=data['runtime']['python'],repository=data['runtime']['repository'],assets=op['assets'],cache=op['cache']))
     else:
      # Marigold needs weights before its full configuration probe can pass.
      data['pending_runtime']=data['runtime']
     if data.get('checkpoint'):
      with CONFIG_LOCK:
       registry=load();registry[op['model']]['checkpoint']=data['checkpoint'];save(registry)
     op['registered']=True
    except Exception as error:data=dict(state='error',**diagnostic(error))
    write_status(op['job'],data)
   if op.get('log'):op['log'].close();op['log']=None
  if data.get('state')=='downloading' and data.get('total'):
   try:
    partial=sum(p.stat().st_size for p in Path(op['assets']).rglob('*.incomplete'))
    data=dict(data,downloaded=min(data['total'],data.get('downloaded',0)+partial))
   except OSError:pass
  op['last']=data
  result=dict(data,model=op['model'],action=op['action'],log=str(op['job']/'log.txt'))
  return result

def start(body):
 global ACTIVE
 name=body.get('model');action=body.get('action')
 if name not in ('moge3','marigold2') or action not in ('install','download'):raise ValueError('Operação inválida.')
 if action=='install' and sys.platform!='win32':raise ValueError('Instalação automática disponível nesta versão apenas para Windows CUDA.')
 with LOCK:
  if ACTIVE and ACTIVE['process'].poll() is None:raise ValueError('Aguarde ou cancele a operação do modelo.')
  storage=Path(body.get('storage') or USER/'depth-models').expanduser().resolve();storage.mkdir(parents=True,exist_ok=True)
  cache=Path(body.get('cache') or storage/'huggingface').expanduser().resolve();assets=Path(body.get('assets') or storage/'assets').expanduser().resolve()
  runtime=storage/name/'runtime-0.9.15';config=configured(name)
  if action=='install':
   if (runtime/'installed.json').is_file():raise ValueError('Este ambiente já está instalado. Use baixar pesos ou verificar ambiente.')
   if shutil.disk_usage(storage).free<10_000_000_000:raise OSError('Disk full: reserve pelo menos 10 GB para o ambiente CUDA.')
   seed=ASSETS/'seed.zip';manifest=json.loads((ASSETS/'manifest.json').read_text(encoding='utf-8'))
   if hashlib.sha256(seed.read_bytes()).hexdigest()!=manifest['seed_sha256']:raise ValueError('Checksum do bootstrap inválido.')
   if not (runtime/'python/python.exe').is_file():
    runtime.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(seed) as z:
     for item in z.infolist():
      if not (runtime/item.filename).resolve().is_relative_to(runtime):raise ValueError('Arquivo inválido no bootstrap.')
     z.extractall(runtime)
   python=str(runtime/'python/python.exe');repository=''
  else:
   # Only runtimes installed by this app or explicitly configured are executable.
   if not config:
    marker=runtime/'installed.json'
    if not marker.is_file():raise ValueError('Instale ou configure o ambiente antes de baixar pesos.')
    installed=json.loads(marker.read_text(encoding='utf-8'));config=dict(python=str(runtime/'python/python.exe'),repository=installed.get('repository',''))
   python=config['python'];repository=config.get('repository','')
   assets=Path(body.get('assets') or config.get('assets') or assets).resolve()
  job=USER/'model-operations'/uuid.uuid4().hex;job.mkdir(parents=True)
  payload=dict(model=name,action=action,runtime=str(runtime),assets=str(assets),repository=repository,manifest=str(ROOT/'data/depth-models.json'))
  (job/'input.json').write_text(json.dumps(payload),encoding='utf-8');write_status(job,dict(state='starting',message='Preparando modelo…'))
  worker=ROOT/'native/depth/worker/depth_setup_worker.py' if getattr(sys,'frozen',False) else ROOT/'optics/depth_setup_worker.py'
  log=(job/'log.txt').open('wb');env=dict(os.environ,PYTHONUTF8='1',PYTHONNOUSERSITE='1',HF_HOME=str(cache),HF_HUB_CACHE=str(cache/'hub'),HF_HUB_DOWNLOAD_TIMEOUT='60',PIP_CACHE_DIR=str(storage/'pip-cache'))
  try:proc=subprocess.Popen([python,str(worker),str(job)],env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  except Exception:log.close();raise
  ACTIVE=dict(job=job,process=proc,log=log,model=name,action=action,cache=str(cache),assets=str(assets))
  return dict(state='starting',model=name,action=action)

def busy():
 with LOCK:return bool(ACTIVE and ACTIVE['process'].poll() is None)

def cancel():
 with LOCK:
  if not ACTIVE:return dict(state='idle')
  proc=ACTIVE['process']
  if proc.poll() is not None:return status()
  if proc.poll() is None:
   if os.name=='nt':subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],capture_output=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),timeout=15)
   else:proc.terminate()
   try:proc.wait(timeout=15)
   except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=5)
  # Write only after inference/download children have stopped: terminal state cannot race.
  if ACTIVE.get('log'):ACTIVE['log'].close();ACTIVE['log']=None
  write_status(ACTIVE['job'],dict(state='cancelled',message='Operação cancelada. Downloads concluídos foram preservados.'))
  return status()
