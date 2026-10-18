"""Build a small Python seed and hash-locked wheel manifest from tested runtime."""
from pathlib import Path
import concurrent.futures, hashlib, importlib.metadata as md, json, re, urllib.request, urllib.parse, zipfile
from pip._vendor.packaging.tags import cpython_tags, compatible_tags
from pip._vendor.packaging.utils import parse_wheel_filename
root=Path(__file__).resolve().parent
site=root/'python/Lib/site-packages'
out=root/'bootstrap';out.mkdir(exist_ok=True)
tags=list(cpython_tags((3,12),platforms=['win_amd64']))+list(compatible_tags((3,12),interpreter='cp312',platforms=['win_amd64']))
rank={tag:i for i,tag in enumerate(tags)}
dists=list(md.distributions(path=[str(site)]))
local={'depth-anything-3','moge','utils3d-moge','pip'}
def normalized(s):return re.sub(r'[-_.]+','-',s).lower()
def find(dist):
 name=dist.metadata['Name'];version=dist.version;key=normalized(name)
 if key in local:return dist,None
 if key in ('torch','torchvision'):
  page=urllib.request.urlopen('https://download.pytorch.org/whl/cu128/'+key+'/',timeout=60).read().decode()
  expected=f'{key}-{version}-cp312-cp312-win_amd64.whl'
  for href in re.findall(r'href="([^"]+)"',page):
   url=urllib.parse.urljoin('https://download.pytorch.org',href).replace('https://download-r2.pytorch.org/','https://download.pytorch.org/')
   if urllib.parse.unquote(urllib.parse.urlparse(url).path).endswith('/'+expected):
    sha=urllib.parse.parse_qs(urllib.parse.urlparse(url).fragment)['sha256'][0]
    response=urllib.request.urlopen(urllib.request.Request(url.split('#')[0],headers={'Range':'bytes=0-0'}),timeout=60)
    size=int(response.headers.get('Content-Range','/'+response.headers['Content-Length']).split('/')[-1]);response.close()
    return dist,dict(name=name,version=version,filename=expected,url=url.split('#')[0],sha256=sha,size=size)
  raise RuntimeError('Missing CUDA wheel '+expected)
 data=json.load(urllib.request.urlopen(f'https://pypi.org/pypi/{name}/{version}/json',timeout=60))
 wheels=[]
 for f in data['urls']:
  if f['packagetype']!='bdist_wheel':continue
  try:compatible=parse_wheel_filename(f['filename'])[3]&rank.keys()
  except Exception:continue
  if compatible:wheels.append((min(rank[t] for t in compatible),f))
 if not wheels:return dist,None
 f=min(wheels,key=lambda pair:pair[0])[1]
 return dist,dict(name=name,version=version,filename=f['filename'],url=f['url'],sha256=f['digests']['sha256'],size=f['size'])
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(find,dists))
manifest={'schema':1,'runtime_version':'0.9.6','python':'3.12.9','wheels':[wheel for _,wheel in results if wheel]}
with zipfile.ZipFile(out/'seed.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 added=set()
 def add(file,arc):
  arc=str(arc).replace('\\','/')
  if arc not in added and file.is_file() and '__pycache__' not in arc and not arc.endswith(('.pyc','.pyo','.pth')) and '__editable__' not in arc and not arc.endswith('EXTERNALLY-MANAGED'):z.write(file,arc);added.add(arc)
 for file in (root/'python').rglob('*'):
  relative=file.relative_to(root/'python')
  if relative.parts[:2]==('Lib','site-packages'):continue
  add(file,Path('python')/relative)
 for dist,wheel in results:
  if wheel:continue
  for relative in dist.files or []:
   file=Path(dist.locate_file(relative)).resolve()
   try:arc=Path('python/Lib/site-packages')/file.relative_to(site.resolve())
   except ValueError:continue
   add(file,arc)
 for module in ('depth_anything_3','moge'):
  for file in (site/module).rglob('*'):add(file,Path('python/Lib/site-packages')/file.relative_to(site))
 for file in (root/'vendors').rglob('*'):add(file,file.relative_to(root))
 for file in (root/'worker').rglob('*'):add(file,file.relative_to(root))
 for file in root.glob('LICENSE*'):add(file,file.name)
manifest['seed_sha256']=hashlib.sha256((out/'seed.zip').read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Seed bytes:',(out/'seed.zip').stat().st_size,'Wheels:',len(manifest['wheels']),'Download bytes:',sum(x['size'] for x in manifest['wheels']))
