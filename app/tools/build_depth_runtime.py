"""Build a relocatable Python 3.12 depth runtime, including all four engines."""
from pathlib import Path
import shutil,json,sys
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT.parents[1]/'work'
import os
# Python 3.12 portátil (uv). Defina BRUXOS_PY312 com a pasta da instalação.
base=Path(os.environ.get('BRUXOS_PY312',os.path.expandvars(r'%APPDATA%/uv/python/cpython-3.12-windows-x86_64-none')))
target=ROOT/'native/depth';python=target/'python';site=python/'Lib/site-packages'
def ignore(folder,names):
 return [n for n in names if n in ('.git','__pycache__','.DS_Store','_virtualenv.pth','_virtualenv.py') or n.startswith('__editable__') or n.startswith('_editable_impl_') or n.endswith('.pyc')]
python.mkdir(parents=True,exist_ok=True)
for name in ['python.exe','pythonw.exe','python3.dll','python312.dll','vcruntime140.dll','vcruntime140_1.dll','LICENSE.txt']:shutil.copy2(base/name,python/name)
for name in ['msvcp140.dll','msvcp140_1.dll','msvcp140_2.dll','msvcp140_atomic_wait.dll','msvcp140_codecvt_ids.dll']:
 shutil.copy2(Path('C:/Windows/System32')/name,python/name)
for name in ['Lib','DLLs']:shutil.copytree(base/name,python/name,dirs_exist_ok=True,ignore=ignore)
shutil.copytree(WORK/'depth-env/Lib/site-packages',site,dirs_exist_ok=True,ignore=ignore)
shutil.copytree(WORK/'moge/moge',site/'moge',dirs_exist_ok=True,ignore=ignore)
shutil.copytree(WORK/'depth-anything-3/src/depth_anything_3',site/'depth_anything_3',dirs_exist_ok=True,ignore=ignore)
vendors=target/'vendors';dvd=vendors/'dvd';dvd.mkdir(parents=True,exist_ok=True)
for name in ['diffsynth','examples','ckpt','configs']:shutil.copytree(WORK/'dvd'/name,dvd/name,dirs_exist_ok=True,ignore=ignore)
shutil.copy2(WORK/'dvd/LICENSE',dvd/'LICENSE');shutil.copy2(WORK/'moge/LICENSE',target/'LICENSE-MoGe.txt');shutil.copy2(WORK/'depth-anything-3/LICENSE',target/'LICENSE-DA3.txt')
(python/'python312._pth').write_text('Lib\nDLLs\nLib/site-packages\nimport site\n',encoding='utf-8')
worker=target/'worker';worker.mkdir(exist_ok=True)
for name in ['depth_worker.py','dvd_adapter.py']:shutil.copy2(ROOT/'optics'/name,worker/name)
(target/'runtime.json').write_text(json.dumps(dict(version=1,python='3.12.9',models=['da2','da3','moge','dvd'],cuda=True,weights='download-on-first-use'),indent=2),encoding='utf-8')
print('Depth runtime built:',target,flush=True)
