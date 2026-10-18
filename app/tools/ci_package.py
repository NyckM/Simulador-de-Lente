"""Create the portable Windows ZIP or macOS DMG with versioned filenames."""
from pathlib import Path
import argparse, hashlib, json, platform, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from app_version import VERSION

def package(target):
    artifacts=ROOT/'artifacts';artifacts.mkdir(exist_ok=True)
    if target=='windows':
        folder=ROOT/'dist/SimuladorDeDesfoque'
        assert (folder/'SimuladorDeDesfoque.exe').is_file()
        name=f'Bruxosdovfx-{VERSION}-Windows-x64-Portable'
        shutil.make_archive(str(artifacts/name),'zip',folder.parent,folder.name)
        package=artifacts/(name+'.zip')
    else:
        folder=ROOT/'dmg-stage';folder.mkdir(exist_ok=True)
        app=ROOT/'dist/SimuladorDeDesfoque.app'
        assert app.is_dir()
        subprocess.run(['ditto',str(app),str(folder/app.name)],check=True)
        link=folder/'Applications'
        if not link.is_symlink():link.symlink_to('/Applications')
        shutil.copy2(ROOT/'MACOS.md',folder/'LEIA-ME.md')
        package=artifacts/f'Bruxosdovfx-{VERSION}-macOS-{platform.machine()}.dmg'
        subprocess.run(['hdiutil','create','-volname','Bruxosdovfx','-srcfolder',str(folder),
                        '-ov','-format','UDZO',str(package)],check=True)
    checks={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in artifacts.iterdir() if p.suffix in ('.exe','.zip','.dmg')}
    for name,digest in checks.items():(artifacts/(name+'.sha256')).write_text(digest+'  '+name+'\n',encoding='utf-8')
    (artifacts/'build-info.json').write_text(json.dumps(dict(version=VERSION,platform=sys.platform,architecture=platform.machine(),sha256=checks),indent=2),encoding='utf-8')
    print(package)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('target',choices=['windows','macos'])
    package(parser.parse_args().target)
