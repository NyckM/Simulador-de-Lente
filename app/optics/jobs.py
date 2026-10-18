"""Local media jobs. Fixed commands, bounded uploads, UUID-only paths."""
from pathlib import Path
import json, os, re, subprocess, threading, uuid, shutil, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT.parents[1]/'work'
CACHE=Path(os.environ['OPTICA_USER_DATA'])/'cache' if os.environ.get('OPTICA_USER_DATA') else ROOT/'cache'
CACHE.mkdir(parents=True,exist_ok=True)
LOCK=threading.RLock()
JOBS={}
DEPTH_ROOT=(Path(sys.executable).resolve().parent if getattr(sys,'frozen',False) else ROOT)/'native/depth'
PYTHON=DEPTH_ROOT/'python/python.exe' if (DEPTH_ROOT/'python/python.exe').exists() else WORK/'depth-env/Scripts/python.exe'
DEPTH_WORKER=DEPTH_ROOT/'worker/depth_worker.py' if (DEPTH_ROOT/'worker/depth_worker.py').exists() else ROOT/'optics/depth_worker.py'

def folder(key):
    if not re.fullmatch(r'[a-f0-9]{32}',key): raise ValueError('Job inválido')
    path=CACHE/key
    if not path.is_dir(): raise ValueError('Job não encontrado')
    return path

def ffmpeg():
    bundled=ROOT/'native/media'/('ffmpeg' if sys.platform=='darwin' else 'ffmpeg.exe')
    if bundled.exists():return str(bundled)
    if sys.platform=='darwin':
        for candidate in (shutil.which('ffmpeg'),'/opt/homebrew/bin/ffmpeg','/usr/local/bin/ffmpeg'):
            if candidate and Path(candidate).is_file():return candidate
        raise ValueError('Para exportar MP4 nesta build macOS, instale FFmpeg. Imagens e perfis não precisam dele.')
    paths=list(Path(os.environ.get('LOCALAPPDATA','')).glob('Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe'))
    found=shutil.which('ffmpeg') or (str(paths[0]) if paths else None)
    if not found: raise ValueError('FFmpeg não instalado.')
    return found

def status(key):
    p=folder(key)
    with LOCK:
        job=JOBS.get(key,{})
        proc=job.get('process')
        try: data=json.loads((p/'status.json').read_text())
        except (OSError,ValueError): data=dict(job.get('last_status',{'state':'upload'}))
        else: job['last_status']=dict(data)
        if proc and proc.poll() is not None and data.get('state') not in ('complete','error','cancelled'):
            data={'state':'error','error':(p/'log.txt').read_text(errors='replace')[-2000:]}
        if data.get('state')=='complete' and proc and not job.get('inference_recorded'):
            from .depth_runtime import record_inference
            record_inference(data.get('model'),data);job['inference_recorded']=True
        return data

def refresh_runtime():
    global DEPTH_ROOT,PYTHON,DEPTH_WORKER
    from .complements import runtime
    active=runtime()
    if active is not None:
        DEPTH_ROOT=active;PYTHON=active/'python/python.exe'
        # Inference code belongs to the app release, not the separately installed
        # dependencies. Updating the app must also update model-cache fixes.
    packaged=ROOT/'native/depth/worker/depth_worker.py'
    source=ROOT/'optics/depth_worker.py'
    DEPTH_WORKER=packaged if getattr(sys,'frozen',False) and packaged.is_file() else source if source.is_file() else DEPTH_ROOT/'worker/depth_worker.py'

def create(body,kind):
    refresh_runtime()
    from .depth_setup import busy
    if busy():raise ValueError('Aguarde ou cancele a instalação/download do modelo.')
    with LOCK:
        if any(j.get('sequence') or j.get('process') and j['process'].poll() is None for j in JOBS.values()):
            raise ValueError('Aguarde ou cancele o processamento atual.')
        key=uuid.uuid4().hex;p=CACHE/key
        if kind=='depth':
            from .depth_models import MODELS,options
            from .depth_runtime import configured
            model=body.get('model')
            if model not in (*MODELS,'da2','da3','moge','dvd'):raise ValueError('Modelo inválido')
            if body.get('kind','image') not in ('image','video'):raise ValueError('Mídia inválida')
            extra=options(body) if model in MODELS else {}
            if model in MODELS and not configured(model):raise ValueError('Configure o ambiente deste modelo no painel Depth.')
            if (model not in MODELS and not PYTHON.exists()) or not DEPTH_WORKER.exists():raise ValueError('Instale o Complemento Depth IA antes de gerar depth.')
            body={'model':model,'kind':body.get('kind','image'),**extra}
            p.mkdir()
        else:
            w,h,fps=int(body['width']),int(body['height']),float(body['fps'])
            if not (16<=w<=8192 and 16<=h<=8192 and w*h<=34_000_000 and 1<=fps<=120): raise ValueError('Formato de vídeo inválido')
            fmt=body.get('format','mp4')
            if fmt not in ('mp4','png'):raise ValueError('Formato de exportação inválido')
            body={'width':w,'height':h,'fps':fps,'format':fmt}
            p.mkdir()
            if fmt=='png':
                JOBS[key]={'sequence':True,'zip':zipfile.ZipFile(p/'sequence.zip','w',compression=zipfile.ZIP_STORED),'frames':0,'bytes':0}
                (p/'input.json').write_text(json.dumps(body))
                return {'id':key}
            log=(p/'log.txt').open('wb')
            cmd=[ffmpeg(),'-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',str(fps),'-i','pipe:0','-an','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(p/'video.mp4')]
            proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
            JOBS[key]={'process':proc,'log':log,'frames':0}
        (p/'input.json').write_text(json.dumps(body))
        return {'id':key}

def run(key):
    p=folder(key)
    with LOCK:
        if key in JOBS: raise ValueError('Job já iniciado')
        if status(key).get('state')=='cancelled': raise ValueError('Job cancelado')
        if any(j.get('process') and j['process'].poll() is None for j in JOBS.values()): raise ValueError('Outro processamento está ativo')
        if not (p/'source').exists(): raise ValueError('Envie a mídia primeiro')
        log=(p/'log.txt').open('wb')
        env=os.environ.copy();env['OPTICA_DEPTH_WORK']=str(DEPTH_ROOT/'vendors' if (DEPTH_ROOT/'vendors/dvd').is_dir() else WORK)
        from .depth_runtime import configured
        config=json.loads((p/'input.json').read_text(encoding='utf-8'))
        runtime=configured(config['model']) if config['model'] in ('moge3','marigold2') else None
        if config['model'] in ('moge3','marigold2') and not runtime:
            log.close();raise ValueError('Ambiente do modelo não está mais disponível.')
        if runtime:
            from .depth_runtime import fingerprint
            config['runtime_fingerprint']=fingerprint(runtime)
            if runtime.get('checkpoint'):config['checkpoint']=runtime['checkpoint']
            (p/'input.json').write_text(json.dumps(config),encoding='utf-8')
            if runtime.get('cache'):env['HF_HOME']=runtime['cache'];env['HF_HUB_CACHE']=str(Path(runtime['cache'])/'hub')
        if runtime and config['model']=='marigold2':
            env['OPTICA_MARIGOLD_ROOT']=runtime['repository'];env['PYTHONPATH']=runtime['repository']
            env['DEPTH_ASSETS_DIR']=runtime.get('assets') or str(Path(runtime['repository'])/'assets')
        env['PYTHONNOUSERSITE']='1'
        executable=runtime['python'] if runtime else str(PYTHON)
        try:proc=subprocess.Popen([executable,str(DEPTH_WORKER),str(p)],env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        except Exception:log.close();raise
        JOBS[key]={'process':proc,'log':log}
    return {'id':key}

def frame(key,raw):
    p=folder(key);j=JOBS[key]
    if not raw.startswith(b'\x89PNG\r\n\x1a\n'): raise ValueError('Frame PNG inválido')
    import struct
    w,h=struct.unpack('>II',raw[16:24]);config=json.loads((p/'input.json').read_text())
    if (w,h)!=(config.get('width'),config.get('height')): raise ValueError('Resolução do frame mudou')
    if j.get('sequence'):
        if j['frames']>=36000 or j['bytes']+len(raw)>20_000_000_000:raise ValueError('Limite de sequência PNG atingido')
        j['zip'].writestr(f'frames/{j["frames"]:06d}.png',raw);j['bytes']+=len(raw)
    else:j['process'].stdin.write(raw)
    j['frames']+=1
    return {'frames':j['frames']}

def finish(key):
    p=folder(key);j=JOBS[key]
    if j.get('sequence'):
        if not j['frames']:raise ValueError('Sequência sem quadros')
        metadata={**json.loads((p/'input.json').read_text()),'frames':j['frames'],'first_frame':0}
        j['zip'].writestr('timeline.json',json.dumps(metadata,indent=2));j['zip'].close();j['sequence']=False
        return {'url':f'/api/jobs/{key}/sequence.zip','frames':j['frames']}
    proc=j['process']
    proc.stdin.close()
    try: code=proc.wait(timeout=120)
    except subprocess.TimeoutExpired: proc.kill();raise ValueError('Encoder excedeu o tempo limite')
    j['log'].close()
    if code or not j['frames']: raise ValueError('Falha ao codificar vídeo: '+(p/'log.txt').read_text(errors='replace')[-1000:])
    return {'url':f'/api/jobs/{key}/video.mp4','frames':j['frames']}

def cancel(key):
    p=folder(key)
    with LOCK:
        job=JOBS.get(key);proc=job.get('process') if job else None
        if job and job.get('sequence'):
            job['zip'].close();job['sequence']=False
        if proc and proc.poll() is None:
            proc.terminate()
            try:proc.wait(timeout=10)
            except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=5)
        if job and job.get('log'):job['log'].close()
        from .worker_status import write_status
        write_status(p,{'state':'cancelled'})
    return {'state':'cancelled'}


def shutdown():
    for key,job in list(JOBS.items()):
        proc=job.get('process')
        if proc and proc.poll() is None:
            try:cancel(key)
            except Exception:proc.kill()
