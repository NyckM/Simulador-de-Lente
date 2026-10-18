"""Isolated installer process. Its Python is the hash-checked bootstrap, never the app."""
from pathlib import Path
import sys,json,os,subprocess,hashlib,urllib.request,zipfile,traceback,time
sys.path.insert(0,str(Path(__file__).resolve().parent))
from worker_status import write_status
from depth_errors import diagnostic
JOB=None;INPUT={};MANIFEST={}
def progress(state,**kw):write_status(JOB,dict(state=state,model=INPUT['model'],**kw))
def digest(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def execute(command):
 result=subprocess.run(command,env=dict(os.environ,PYTHONNOUSERSITE='1',PYTHONUTF8='1'),check=True)
 return result

def prepare_sdk(stage):
 item=MANIFEST['python_sdk'];archive=stage/'python-sdk.nupkg'
 if not archive.is_file() or digest(archive)!=item['sha256']:
  with urllib.request.urlopen(item['url'],timeout=60) as response,archive.open('wb') as f:
   while chunk:=response.read(1024*1024):f.write(chunk)
  if archive.stat().st_size!=item['size'] or digest(archive)!=item['sha256']:raise ValueError('Checksum do SDK Python inválido.')
 with zipfile.ZipFile(archive) as z:
  for item in z.infolist():
   if item.is_dir() or not item.filename.startswith(('tools/include/','tools/libs/')):continue
   relative=Path(item.filename).relative_to('tools');target=(stage/'python'/relative).resolve()
   if not target.is_relative_to((stage/'python').resolve()):raise ValueError('Arquivo inválido no SDK Python.')
   target.parent.mkdir(parents=True,exist_ok=True)
   with z.open(item) as source,target.open('wb') as dest:
    while chunk:=source.read(1024*1024):dest.write(chunk)

def install():
 stage=Path(INPUT['runtime']);sources=stage/'sources';sources.mkdir(parents=True,exist_ok=True);spec=MANIFEST['models'][INPUT['model']];python=sys.executable
 prepare_sdk(stage)
 progress('installing',message='Instalando PyTorch CUDA no ambiente separado…')
 constraints=stage/'constraints.txt';constraints.write_text('torch=='+spec['torch']+'\ntorchvision=='+spec['torchvision']+'\n',encoding='utf-8')
 execute([python,'-m','pip','install','torch=='+spec['torch'],'torchvision=='+spec['torchvision'],'--index-url','https://download.pytorch.org/whl/cu128'])
 if spec['packages']:execute([python,'-m','pip','install','-c',str(constraints),*spec['packages']])
 repository=''
 for name in spec['sources']:
  item=next(a for a in MANIFEST['sources'] if a['name']==name);archive=sources/(name+'.zip');temporary=archive.with_suffix('.part')
  if not archive.is_file() or digest(archive)!=item['sha256']:
   progress('downloading',message='Baixando código oficial: '+name)
   with urllib.request.urlopen(item['url'],timeout=60) as response,temporary.open('wb') as f:
    while chunk:=response.read(1024*1024):f.write(chunk)
   if temporary.stat().st_size!=item['size'] or digest(temporary)!=item['sha256']:raise ValueError('Checksum do código do modelo não confere.')
   os.replace(temporary,archive)
  with zipfile.ZipFile(archive) as z:
   for entry in z.infolist():
    target=(sources/entry.filename).resolve()
    if not target.is_relative_to(sources.resolve()):raise ValueError('Arquivo fora do diretório do modelo.')
   z.extractall(sources)
   folder=sources/z.namelist()[0].split('/')[0]
  progress('installing',message='Instalando '+name+'…')
  command=[python,'-m','pip','install','-c',str(constraints),str(folder)]
  if name!='marigold':command.append('--no-deps')
  execute(command)
  if name=='marigold':repository=str(folder)
 progress('validating',message='Verificando CUDA e dependências…')
 code="import torch;assert torch.cuda.is_available(),'CUDA indisponível';"
 code+="from moge.model.v3 import MoGeModel;import flex_gemm,triton" if INPUT['model']=='moge3' else "import marigoldv2,omegaconf,bitsandbytes"
 execute([python,'-c',code]);(stage/'installed.json').write_text(json.dumps(dict(model=INPUT['model'],repository=repository)),encoding='utf-8')
 return dict(python=python,repository=repository)

def weights(repository):
 from huggingface_hub import HfApi,hf_hub_download
 root=Path(INPUT['assets']);root.mkdir(parents=True,exist_ok=True)
 if INPUT['model']=='marigold2':items=MANIFEST['marigold_assets']
 else:
  repo='Ruicheng/moge-3-vitl';info=HfApi().model_info(repo,files_metadata=True);f=next(f for f in info.siblings if f.rfilename=='model.pt')
  items=[dict(repo=repo,revision=info.sha,folder='moge3',files=[dict(name='model.pt',size=f.size,sha256=f.lfs.sha256 if f.lfs else None)])]
 total=sum(f['size'] or 0 for item in items for f in item['files']);done=0
 import shutil
 needed=sum((f['size'] or 0) for item in items for f in item['files'] if not (root/item['folder']/f['name']).is_file() or (root/item['folder']/f['name']).stat().st_size!=f['size'])
 partial=sum(p.stat().st_size for p in root.rglob('*.incomplete'))
 needed=max(0,needed-partial)
 if shutil.disk_usage(root).free<needed+1_000_000_000:raise OSError('Disk full: espaço insuficiente para os pesos selecionados.')
 for item in items:
  for f in item['files']:
   target=root/item['folder']/f['name'];valid=target.is_file() and target.stat().st_size==f['size'] and (not f['sha256'] or digest(target)==f['sha256'])
   progress('downloading',file=f['name'],downloaded=done,total=total,message=f"Pesos: {done/1e9:.2f} / {total/1e9:.2f} GB · {f['name']}")
   if not valid:
    # HF resumes partial transfers; a truncated completed file must be requested again.
    for attempt in range(3):
     try:
      hf_hub_download(item['repo'],f['name'],revision=item['revision'],local_dir=str(root/item['folder']),force_download=target.is_file());break
     except Exception:
      if attempt==2:raise
      time.sleep(2**attempt)
   if not target.is_file() or target.stat().st_size!=f['size'] or (f['sha256'] and digest(target)!=f['sha256']):raise ValueError('Checksum dos pesos não confere: '+f['name'])
   done+=f['size'] or 0
 (root/(INPUT['model']+'-weights.json')).write_text(json.dumps(items),encoding='utf-8')
 return str(root/'moge3/model.pt') if INPUT['model']=='moge3' else ''

def main():
 global JOB,INPUT,MANIFEST
 JOB=Path(sys.argv[1]);INPUT=json.loads((JOB/'input.json').read_text(encoding='utf-8'));MANIFEST=json.loads(Path(INPUT['manifest']).read_text(encoding='utf-8'))
 try:
  runtime=install() if INPUT['action']=='install' else dict(python=sys.executable,repository=INPUT.get('repository',''))
  checkpoint=weights(runtime['repository']) if INPUT['action']=='download' else ''
  progress('complete',runtime=runtime,checkpoint=checkpoint,assets=INPUT['assets'],message='Ambiente instalado. Baixe os pesos e valide com uma imagem.' if INPUT['action']=='install' else 'Pesos verificados. Gere um depth para validar a inferência.')
 except Exception as error:traceback.print_exc();progress('error',**diagnostic(error))
if __name__=='__main__':main()
