# Packages the macOS Resolve OFX built by build-macos.sh: bundle, universal test host, install scripts,
# licenses and source reference, as a folder and a zip (exec bits kept, SHA256.json like the Windows zips).
# Usage: python3 package_macos.py <build-macos.sh OUT folder> <dist folder>   (BRUXOS_LANGUAGE / VERSION as build-macos.sh)
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,zipfile
here=Path(__file__).resolve().parent;root=here.parents[2];build=Path(sys.argv[1]).resolve();dist=Path(sys.argv[2]).resolve()
version=os.environ.get('VERSION','0.4.0');language=['PT-BR','EN','ZH-CN'][int(os.environ.get('BRUXOS_LANGUAGE','1'))]
name=f'Bruxosdovfx-Desfoque-Resolve-{version}-{language}-macOS';out=dist/name
if out.exists():shutil.rmtree(out)
out.mkdir(parents=True)
shutil.copytree(build/'BruxosdovfxDesfoque.ofx.bundle',out/'BruxosdovfxDesfoque.ofx.bundle',symlinks=True)
(out/'README.txt').write_text((here/'macos/README.txt').read_text(encoding='utf-8').replace('{version}',version).replace('{language}',language),encoding='utf-8')
shutil.copy2(here/'macos/install.command',out/'install.command')
(out/'validation').mkdir();shutil.copy2(here/'macos/run-validation.command',out/'validation/run-validation.command');shutil.copy2(build/'HostTest',out/'validation/HostTest')
if (build/'host-test-CPU.txt').exists():shutil.copy2(build/'host-test-CPU.txt',out/'validation/host-CPU.txt')
(out/'Licenses').mkdir()
for source,target in [(root/'LICENSE','LICENSE-GPL-3.0.txt'),(here/'LICENSE-OpenFX.txt','LICENSE-OpenFX.txt'),(root/'LICENSE-LensSim.txt','LICENSE-LensSim.txt'),(root/'SOURCE-LensVisualizer.md','SOURCE-LensVisualizer.md'),(here/'macos/LICENSES.md','LICENSES.md')]:shutil.copy2(source,out/'Licenses'/target)
def git(*a):
 try:return subprocess.run(['git',*a],cwd=root,capture_output=True,text=True,check=True).stdout.strip()
 except Exception:return 'unknown'
repo=f"{os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}" if os.environ.get('GITHUB_REPOSITORY') else git('remote','get-url','origin')
(out/'source').mkdir();(out/'source/SOURCE.txt').write_text(f'Repository: {repo}\nCommit: {os.environ.get("GITHUB_SHA") or git("rev-parse","HEAD")}\nBuild: plugins/native/ofx/build-macos.sh, package: plugins/native/ofx/package_macos.py\n',encoding='utf-8')
execs={'install.command','validation/run-validation.command','validation/HostTest','BruxosdovfxDesfoque.ofx.bundle/Contents/MacOS/BruxosdovfxDesfoque.ofx'}
files={p.relative_to(out).as_posix():p.read_bytes() for p in sorted(out.rglob('*')) if p.is_file()}
files['SHA256.json']=json.dumps({k:hashlib.sha256(v).hexdigest() for k,v in files.items()},indent=2).encode();(out/'SHA256.json').write_bytes(files['SHA256.json'])
for n in execs:(out/n).chmod(0o755)
archive=dist/f'{name}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for n,data in sorted(files.items()):
  info=zipfile.ZipInfo(n,date_time=(2026,1,1,0,0,0));info.create_system=3;info.external_attr=(0o100755 if n in execs else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for n,digest in json.loads(z.read('SHA256.json')).items():assert hashlib.sha256(z.read(n)).hexdigest()==digest
print(archive,archive.stat().st_size)
