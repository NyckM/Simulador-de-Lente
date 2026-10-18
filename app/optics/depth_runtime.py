"""Validated, separate runtimes and persistent evidence of real model inference."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,re,threading,tempfile,time
from .depth_models import MODELS
from .complements import USER
ROOT=Path(__file__).resolve().parents[1]
CONFIG=USER/'depth-model-runtimes.json';LOCK=threading.RLock()

def load():
 try:
  result=json.loads(CONFIG.read_text(encoding='utf-8'))
  return {k:v for k,v in result.items() if k in MODELS and isinstance(v,dict)} if isinstance(result,dict) else {}
 except (OSError,ValueError):return {}

def save(data):
 CONFIG.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=CONFIG.parent,delete=False) as f:json.dump(data,f);temporary=Path(f.name)
 try:
  for i in range(50):
   try:os.replace(temporary,CONFIG);return
   except PermissionError:
    if i==49:raise
    time.sleep(.02)
 finally:temporary.unlink(missing_ok=True)

def fingerprint(c):
 paths=[Path(c['python'])]
 paths.extend(Path(p) for p in c.get('probe',{}).get('module_files',[]) if isinstance(p,str))
 if c.get('repository'):paths.append(Path(c['repository'])/'scripts/infer.py')
 bits=[c.get('assets',''),c.get('cache','')]
 for p in paths:
  try:bits.append(f'{p.resolve()}:{p.stat().st_size}:{p.stat().st_mtime_ns}')
  except OSError:bits.append('missing:'+str(p))
 return hashlib.sha256('|'.join(bits).encode()).hexdigest()

def configured(name):
 c=load().get(name)
 if not c or not Path(c.get('python','')).is_file():return None
 if name=='marigold2' and not (Path(c.get('repository',''))/'scripts/infer.py').is_file():return None
 return c

def catalog():
 result=[];data=load()
 for name,meta in MODELS.items():
  c=configured(name);v=(c or {}).get('validation',{});verified=bool(c and v.get('fingerprint')==fingerprint(c) and v.get('success'))
  result.append(dict(id=name,**meta,configured=c is not None,runtime=c,inference_verified=verified,validation=v if verified else None,
   state='validated' if verified else 'configured' if c else 'missing_runtime' if name in data else 'not_configured',
   requirements='CUDA · MoGe 3 · FlexGEMM · Triton' if name=='moge3' else 'Marigold V2 · Qwen · Log-stage2 · CUDA (Linux oficial; Windows CUDA testado nesta versão)'))
 return result

def record_inference(name,info):
 if name not in MODELS:return
 with LOCK:
  data=load();c=configured(name)
  if not c or info.get('runtime_fingerprint')!=fingerprint(c):return
  c['validation']=dict(success=True,fingerprint=fingerprint(c),time=time.time(),width=info['width'],height=info['height'],count=info['count'],device=info.get('device'),elapsed_s=info.get('elapsed_s'),peak_vram_bytes=info.get('peak_vram_bytes'),checkpoint=info.get('checkpoint'),options=info.get('options'))
  data[name]=c;save(data)

def configure(body):
 name=body.get('model')
 if name not in MODELS:raise ValueError('Modelo desconhecido.')
 python=Path(body.get('python','')).expanduser().resolve()
 if not python.is_file() or not re.fullmatch(r'python(?:[0-9]+(?:\.[0-9]+)*)?(?:\.exe)?',python.name.lower()):raise ValueError('Selecione o executável Python do ambiente do modelo.')
 repository=Path(body.get('repository','')).expanduser().resolve()
 assets=Path(body.get('assets') or repository/'assets').expanduser().resolve() if name=='marigold2' else None
 cache=Path(body.get('cache') or USER/'model-cache').expanduser().resolve()
 if name=='marigold2' and not (repository/'scripts/infer.py').is_file():raise ValueError('Selecione a pasta do repositório oficial Marigold V2.')
 code="import json,torch;assert torch.cuda.is_available(),'CUDA indisponível';"
 if name=='moge3':code+="from moge.model.v3 import MoGeModel;import moge.model.v3 as core;import flex_gemm,triton;"
 else:
  code+="import marigoldv2,omegaconf,bitsandbytes;core=marigoldv2;from pathlib import Path;r=Path("+repr(str(assets))+");q=r/'checkpoints/Qwen-Image-Edit-2509';assert (q/'transformer/diffusion_pytorch_model.safetensors.index.json').is_file(),'Índice Qwen ausente';idx=json.loads((q/'transformer/diffusion_pytorch_model.safetensors.index.json').read_text());assert all((q/'transformer'/f).is_file() and (q/'transformer'/f).stat().st_size>0 for f in set(idx['weight_map'].values())),'Shards Qwen ausentes';assert (q/'vae/diffusion_pytorch_model.safetensors').is_file(),'VAE Qwen ausente';m=r/'checkpoints/Marigold-V2';assert (m/'depth/Log-stage2/trainables.safetensors').is_file(),'Pesos Log-stage2 ausentes';assert all((m/'qwen_text_embeddings'/('qwen_edit_2509_qwen_depth_realimg512'+s)).is_file() for s in ['_prompt_embeds.pt','_prompt_mask.pt']),'Embeddings ausentes';"
 code+="print(json.dumps({'torch':torch.__version__,'device':torch.cuda.get_device_name(),'platform':__import__('sys').platform,'vram_bytes':torch.cuda.get_device_properties(0).total_memory,'cuda':torch.version.cuda,'module_files':[f for f in [torch.__file__,core.__file__] if f]}))"
 env=os.environ.copy();env['PYTHONNOUSERSITE']='1';env['PYTHONUTF8']='1'
 if name=='marigold2':env['PYTHONPATH']=str(repository);env['DEPTH_ASSETS_DIR']=str(assets)
 try:result=subprocess.run([str(python),'-c',code],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=45,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 except subprocess.TimeoutExpired as e:raise ValueError('O ambiente excedeu 45 segundos na verificação.') from e
 if result.returncode:raise ValueError('Ambiente incompatível: '+result.stderr[-2000:])
 info=json.loads(result.stdout.strip().splitlines()[-1]);c=dict(python=str(python),repository=str(repository) if name=='marigold2' else '',assets=str(assets) if assets else '',cache=str(cache),probe=info,checked_at=time.time())
 with LOCK:
  data=load();old=data.get(name,{})
  if old.get('validation',{}).get('fingerprint')==fingerprint(c):c['validation']=old['validation']
  data[name]=c;save(data)
 return dict(model=name,configured=True,probe=info,inference_verified=bool(c.get('validation')))
