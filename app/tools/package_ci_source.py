"""Export a repository root, excluding models, personal caches and large media binaries."""
from pathlib import Path
import argparse, hashlib, json, zipfile
ROOT=Path(__file__).resolve().parents[1]

def package(destination):
    destination=Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    files=set()
    for pattern in ('*.py','*.md','requirements*.txt','*.spec'):
        files.update(ROOT.glob(pattern))
    files.update(ROOT/name for name in ('.gitignore','installer-ci.iss'))
    for folder in ('web','data','.github','optics','tools','tests','localization','blender','comfyui'):
        files.update(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts
                     and 'node_modules' not in p.parts and p.suffix not in ('.pyc','.png','.exe','.dll'))
        if folder in ('web','data'):
            files.update(p for p in (ROOT/folder).rglob('*.png') if p.is_file())
    manifest=json.loads((ROOT/'native/ci-assets.json').read_text(encoding='utf-8'))
    files.update(ROOT/name for name in manifest['sha256'])
    files.update(ROOT/name for name in ('native/ci-assets.json','native/app.ico','native/media/LICENSE.txt',
                                       'native/cuda/engine.cu','native/vulkan/engine.cpp','native/vulkan/lens.comp','native/vulkan/CMakeLists.txt'))
    files.update(p for p in (ROOT/'native/installer').glob('*') if p.is_file())
    files.update(ROOT/'research'/name for name in ('lens-flare-iris-validation.json','lens-flare-v1-cuda-validation.json','lens-flare-v1-webgl-validation.json','flare-installer-validation.json','ghosts-stage16-validation.json','edge-compensation-cpu.json','edge-compensation-gpu.json','edge-compensation-webgl.json','edge-compensation-webgl.json','edge-installer-validation.json','focus-anchor-validation.json','focus-anchor-webgl-validation.json','focus-browser-regressions.json','focus-installer-validation.json'))
    files.update(ROOT/'research'/name for name in ('prism-blur-validation.json','prism-blur-fixtures.json','prism-installer-validation.json','animation-v12-validation.json','animation-installer-validation.json','EXECUCAO-1.0.md','filters-v1-validation.json','focus-v1-cuda.json','v1-flows-validation.json','v1-filter-performance.json','v1-installer-validation.json','v1-ci-validation.json','installer-dark-validation.json','filter-transform-validation.json','FLARESIM-LENS-AUDIT.md','FLARESIM-ENGINE-AUDIT.md','cuda-worker-parity100.json','blur-transition028-cuda.json','blur-transition028-webgl.json','layout029-validation.json','cuda-interaction029-real.json','cuda-pipeline029-before.json','cuda-pipeline029-after.json','cuda-session029-validation.json'))
    hashes={}
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(files):
            if file.stat().st_size>=100_000_000:raise ValueError('Too large for ordinary Git: '+str(file))
            name=file.relative_to(ROOT).as_posix();data=file.read_bytes()
            archive.writestr(name,data);hashes[name]=hashlib.sha256(data).hexdigest()
        # The fresh CI checkout receives the tested CUDA library at its expected path.
        name='native/cuda/bin/optica_cuda.dll';data=(ROOT/'native/ci/windows/optica_cuda.dll').read_bytes()
        archive.writestr(name,data);hashes[name]=hashlib.sha256(data).hexdigest()
        archive.writestr('SHA256.json',json.dumps(hashes,indent=2))
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None
        for name,digest in hashes.items():assert hashlib.sha256(archive.read(name)).hexdigest()==digest
    digest=hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(destination.suffix+'.sha256').write_text(digest+'  '+destination.name+'\n',encoding='utf-8')
    print(json.dumps(dict(files=len(hashes),bytes=destination.stat().st_size,sha256=digest,verified=True)))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('destination');package(parser.parse_args().destination)
