from pathlib import Path
import ast,zipfile,tomllib,runpy
root=Path(__file__).resolve().parents[1];source=root/'blender/bruxos_physical_lens'
manifest=tomllib.loads((source/'blender_manifest.toml').read_text(encoding='utf-8'))
assert manifest['id']=='bruxos_physical_lens'
for file in source.rglob('*.py'):ast.parse(file.read_text(encoding='utf-8'),filename=str(file))
spectral=runpy.run_path(str(source/'spectral.py'))
for channel in range(3):assert abs(sum(row[channel] for row in spectral['WEIGHTS'])/12-1)<1e-10
out=root/'artifacts';out.mkdir(exist_ok=True)
archive=out/('Bruxos-Physical-Lens-'+manifest['version']+'-Blender-Addon.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for file in sorted(source.rglob('*')):
  if file.is_file() and '__pycache__' not in file.parts:z.write(file,file.relative_to(source))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(archive)
