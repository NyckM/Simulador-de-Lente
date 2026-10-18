# Packages AE / Resolve / Nuke 0.4.0 from the 0.3.1 zips, replacing binaries with work/plugins-040-hosts
# and adding bruxos_dirt.rgba beside every plugin binary. Run from the "ol" folder.
from pathlib import Path
import json,zipfile,hashlib
R=Path.cwd();A=R/'outputs/OpticaLab';O=R/'outputs/Versao-Atual-1.2.17';OLD=R/'outputs/Versoes-Antigas';B=R/'work/plugins-040-hosts';O.mkdir(parents=True,exist_ok=True)
dirt=(A/'native/ae/bruxos_dirt.rgba').read_bytes();assert len(dirt)==512*512*4,'bruxos_dirt.rgba inválido'
guide=(A/'PLUGINS-1.2.17.md').read_bytes();archives=[]
def zipped(path,files):
 files={k:v for k,v in files.items() if Path(k).name!='SHA256.json'}
 files['SHA256.json']=json.dumps({k:hashlib.sha256(v).hexdigest() for k,v in files.items()},indent=2).encode()
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for name,data in sorted(files.items()):z.writestr(name,data)
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None
  for name,digest in json.loads(z.read('SHA256.json')).items():assert hashlib.sha256(z.read(name)).hexdigest()==digest
 archives.append(path);print(path.name,path.stat().st_size,flush=True)
for lang in ['PT-BR','EN','ZH-CN']:
 for host,binary in [('AE','BruxosdovfxDesfoque.aex'),('Resolve','BruxosdovfxDesfoque.ofx'),('Nuke','BruxosdovfxNuke.ofx')]:
  base=OLD/{'AE':'After-Effects'}.get(host,host)/'0.3.1'/f'Bruxosdovfx-Desfoque-{host}-0.3.1-{lang}-Windows.zip'
  with zipfile.ZipFile(base) as z:files={n:z.read(n) for n in z.namelist() if not n.endswith('/') and not n.startswith('validation/host-') and Path(n).name!='SHA256.json'}
  target=B/lang/host
  for name in list(files):
   if Path(name).name==binary:
    files[name]=(target/binary).read_bytes();files[str(Path(name).parent/'bruxos_dirt.rgba').replace('\\','/')]=dirt
  files['GUIA-ATUALIZACAO.md']=guide
  files['README.txt']=(f'Bruxosdovfx {host} 0.4.0 / {lang} / Windows x64 (desktop 1.2.17 look)\n\nInstall the complete plugin folder: binary, both CUDA DLLs and bruxos_dirt.rgba (lens dirt texture) side by side. Presets and parameter IDs retained; new group "Visual 1.2.17 / Starburst / Dirt" at the end. See GUIA-ATUALIZACAO.md.\n').encode()
  for mode in ['CPU','CUDA']:files[f'validation/host-{mode}.txt']=(target/f'host-test-{mode}.txt').read_bytes()
  look=B/'look-test.txt'
  if look.exists():files['validation/look-test.txt']=look.read_bytes()
  zipped(O/f'Bruxosdovfx-Desfoque-{host}-0.4.0-{lang}-Windows.zip',files)
manifest=[dict(file=p.name,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in archives]
(O/'Plugins-Nativos-0.4.0-SHA256.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
combined=O/'Bruxos-Plugins-Nativos-0.4.0-Windows.zip'
with zipfile.ZipFile(combined,'w',zipfile.ZIP_STORED) as z:
 for p in archives:z.write(p,p.name)
 z.writestr('LEIA-ME.md',guide);z.write(O/'Plugins-Nativos-0.4.0-SHA256.json','SHA256.json')
print('Combined',combined.stat().st_size,flush=True)
