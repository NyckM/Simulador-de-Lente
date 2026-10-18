"""Install the tested, hash-locked depth runtime on demand, without admin access."""
from pathlib import Path
import hashlib, json, os, shutil, subprocess, sys, threading, time, urllib.request, urllib.parse, uuid, zipfile
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'native/depth/bootstrap'
USER=Path(os.environ.get('OPTICA_USER_DATA',str(Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'OpticaLab')))
TARGET=USER/'depth-runtime'
BUNDLED=(Path(sys.executable).resolve().parent if getattr(sys,'frozen',False) else ROOT)/'native/depth'
LOCK=threading.RLock();CANCEL=threading.Event();THREAD=None;PROCESS=None
STATE={'state':'idle','percent':0,'message':''}
class Cancelled(Exception):pass
def check_cancel():
    if CANCEL.is_set():raise Cancelled()
def runtime():
    if sys.platform=='darwin':return None
    for path in (TARGET,BUNDLED):
        if (path/'runtime.json').is_file() and (path/'python/python.exe').is_file():return path
    return None
def status():
    with LOCK:
        result=dict(STATE)
        if sys.platform=='darwin':
            result.update(installed=False,state='unavailable',message='Nesta build macOS, importe um mapa de profundidade. O complemento de geração IA ainda não foi portado.')
            return result
        result['installed']=runtime() is not None
        if result['state']=='idle':result['message']='Complementos instalados.' if result['installed'] else 'Instale os complementos para gerar depth com IA. Importar depth funciona sem eles.'
        return result

def update(**values):
    with LOCK:STATE.update(values)
def digest(file):
    h=hashlib.sha256()
    with file.open('rb') as f:
        while chunk:=f.read(1024*1024):check_cancel();h.update(chunk)
    return h.hexdigest()
def extract(seed,stage):
    with zipfile.ZipFile(seed) as z:
        for item in z.infolist():
            check_cancel();target=(stage/item.filename).resolve()
            if not target.is_relative_to(stage.resolve()):raise ValueError('Arquivo do complemento inválido.')
            z.extract(item,stage)
def download(wheel,cache,done,total):
    target=cache/wheel['filename']
    if target.is_file() and target.stat().st_size==wheel['size'] and digest(target)==wheel['sha256']:return target
    url=wheel['url'];host=urllib.parse.urlparse(url).hostname
    if urllib.parse.urlparse(url).scheme!='https' or host not in ('files.pythonhosted.org','download.pytorch.org'):raise ValueError('Origem de download inválida.')
    part=target.with_suffix('.part');downloaded=0;h=hashlib.sha256();last=0
    # A query avoids stale partial responses cached by some download proxies.
    if host=='download.pytorch.org':url+='?download=1'
    with urllib.request.urlopen(url,timeout=60) as response,part.open('wb') as f:
        if response.status!=200:raise ValueError('Servidor retornou um download parcial. Tente novamente.')
        while chunk:=response.read(1024*1024):
            check_cancel();f.write(chunk);h.update(chunk);downloaded+=len(chunk)
            if time.monotonic()-last>.3:
                last=time.monotonic();update(percent=round(5+80*(done+downloaded)/total,1),message=f'Baixando complementos: {(done+downloaded)/1e9:.2f} / {total/1e9:.2f} GB',downloaded=done+downloaded,total=total)
    if downloaded!=wheel['size'] or h.hexdigest()!=wheel['sha256']:raise ValueError('Download incompleto ou inválido. Tente novamente; arquivos completos serão reaproveitados.')
    os.replace(part,target);return target

def execute(command,env,log):
    global PROCESS
    check_cancel()
    process=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,env=env,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    with LOCK:PROCESS=process
    try:
        while process.poll() is None:
            if CANCEL.wait(.2):process.terminate();process.wait(timeout=15);raise Cancelled()
        if process.returncode:raise RuntimeError('Não foi possível instalar ou validar os complementos. Tente novamente. Detalhes: '+str(log.name))
    finally:
        with LOCK:PROCESS=None

def install():
    stage=None
    try:
        USER.mkdir(parents=True,exist_ok=True)
        if shutil.disk_usage(USER).free<12_000_000_000:raise ValueError('Libere pelo menos 12 GB para baixar e instalar os complementos.')
        manifest=json.loads((ASSETS/'manifest.json').read_text(encoding='utf-8'))
        seed=ASSETS/'seed.zip'
        if digest(seed)!=manifest['seed_sha256']:raise ValueError('Complemento de instalação inválido. Reinstale o app.')
        stage=USER/('.depth-install-'+uuid.uuid4().hex);stage.mkdir()
        update(state='installing',percent=2,message='Preparando os complementos…');extract(seed,stage)
        cache=USER/'depth-downloads';cache.mkdir(exist_ok=True)
        total=sum(w['size'] for w in manifest['wheels']);done=0;wheels=[]
        update(state='downloading',percent=5,total=total,downloaded=0,message='Baixando complementos…')
        for wheel in manifest['wheels']:
            wheels.append(download(wheel,cache,done,total));done+=wheel['size']
        update(state='installing',percent=85,message='Instalando bibliotecas de profundidade…')
        env=os.environ.copy();env['PYTHONNOUSERSITE']='1';env['PIP_DISABLE_PIP_VERSION_CHECK']='1'
        python=stage/'python/python.exe'
        with (USER/'depth-install.log').open('w',encoding='utf-8') as log:
            execute([str(python),'-m','pip','install','--no-index','--no-deps','--disable-pip-version-check',*[str(w) for w in wheels]],env,log)
            update(state='validating',percent=95,message='Verificando DA2, DA3, MoGe e DVD…')
            probe="import sys;sys.path.insert(0,"+repr(str(stage/'vendors/dvd'))+");import torch,cv2;from transformers import AutoImageProcessor,AutoModelForDepthEstimation;from depth_anything_3.api import DepthAnything3;from moge.model.v2 import MoGeModel;from examples.wanvideo.model_training.WanTrainingModule import WanTrainingModule;print('READY',torch.__version__,torch.cuda.is_available())"
            execute([str(python),'-c',probe],env,log)
        check_cancel();(stage/'runtime.json').write_text(json.dumps({'version':1,'app':'0.9.6','python':'3.12.9','models':['da2','da3','moge','dvd'],'cuda':True,'weights':'download-on-first-use'}),encoding='utf-8')
        # Only the newly validated runtime becomes active. Existing models remain intact.
        with LOCK:
            check_cancel()
            if TARGET.exists():os.replace(TARGET,USER/('.depth-backup-'+uuid.uuid4().hex))
            os.replace(stage,TARGET);stage=None
        update(state='complete',percent=100,message='Complementos prontos. Você já pode gerar depth; os pesos do modelo serão baixados no primeiro uso.')
    except Cancelled:update(state='cancelled',message='Instalação cancelada. Downloads concluídos serão reaproveitados.')
    except Exception as exc:update(state='error',message=str(exc),error=str(exc))
    finally:
        if stage is not None and stage.is_relative_to(USER) and stage.name.startswith('.depth-install-'):shutil.rmtree(stage,ignore_errors=True)

def start():
    global THREAD
    if sys.platform=='darwin':raise ValueError('O instalador Depth IA atual é para Windows. Nesta build macOS, importe um mapa de profundidade.')
    with LOCK:
        if THREAD and THREAD.is_alive():return status()
        if runtime() is not None:return dict(state='complete',installed=True,percent=100,message='Complementos já instalados.')
        if not (ASSETS/'manifest.json').is_file():raise ValueError('Instalador de complementos indisponível. Atualize o app.')
        CANCEL.clear();STATE.clear();STATE.update(state='starting',percent=0,message='Preparando instalação…')
        THREAD=threading.Thread(target=install,daemon=True);THREAD.start();return status()
def cancel():
    CANCEL.set();return status()
