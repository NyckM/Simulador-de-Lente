"""Verify the distributed Windows native/runtime assets before bundling them."""
from pathlib import Path
import argparse, hashlib, json, shutil

def verify(root=None):
    root=Path(root) if root else Path(__file__).resolve().parents[1]
    manifest=json.loads((root/'native/ci-assets.json').read_text(encoding='utf-8'))
    for name, expected in manifest['sha256'].items():
        data=(root/name).read_bytes()
        if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Asset checksum mismatch: '+name)
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--prepare',action='store_true');args=parser.parse_args()
    manifest=verify()
    if args.prepare:
        root=Path(__file__).resolve().parents[1]
        shutil.copy2(root/'native/ci/windows/optica_cuda.dll',root/'native/cuda/bin/optica_cuda.dll')
    print(json.dumps(manifest, indent=2))
