from pathlib import Path
import shutil,zipfile,json
from PIL import Image
import numpy as np
root=Path('native/photoshop');out=Path('../Bruxosdovfx-Desfoque-Photoshop-0.1.1-Windows');out.mkdir(exist_ok=True)
shutil.copytree(root/'panel',out/'plugin',dirs_exist_ok=True)
for name in ['README.md','LICENSES.md']:shutil.copy2(root/name,out/name)
(out/'data').mkdir(exist_ok=True)
for name in ['LICENSE-LensSim.txt','SOURCE-LensVisualizer.md','lens_profiles.json']:shutil.copy2(Path('data')/name,out/'data'/name)
shutil.copytree('data/prescriptions',out/'data/prescriptions',dirs_exist_ok=True)
eula=Path('../Bruxosdovfx-Desfoque-Resolve-0.1.0-Windows/CUDA-EULA.txt');assert eula.exists();shutil.copy2(eula,out/'CUDA-EULA.txt')
(out/'validacao').mkdir(exist_ok=True)
for name in ['results.json','cpu-only-results.json','adapter-results.json','halo-results.json']:shutil.copy2(root/'validation'/name,out/'validacao'/name)
(out/'exemplo').mkdir(exist_ok=True);shutil.copy2(root/'validation/source.png',out/'exemplo/imagem.png');d=np.zeros((48,64),np.uint8);d[18:37,25:40]=255;Image.fromarray(d).resize((512,384),Image.Resampling.NEAREST).save(out/'exemplo/depth.png')
archive=Path(str(out)+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in out.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(out))
checks=json.loads((root/'validation/results.json').read_text());checks['cpuFallbackChecks']=json.loads((root/'validation/cpu-only-results.json').read_text())['checks'];checks['adapterAndPanelMockChecks']=json.loads((root/'validation/adapter-results.json').read_text())['checks'];checks['files']=sum(1 for p in out.rglob('*') if p.is_file());checks['zipBytes']=archive.stat().st_size
print(json.dumps(checks,indent=2));print(archive.resolve())
