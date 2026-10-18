from pathlib import Path
import sys,io,base64,json
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from PIL import Image
from optics.core import Settings
from optics.ghosts import analyze,coverage
from optics.aperture import mask_coverage
mask=np.zeros((32,32),dtype='uint8');mask[:,16:]=255
f=io.BytesIO();Image.fromarray(mask).save(f,format='PNG')
encoded='data:image/png;base64,'+base64.b64encode(f.getvalue()).decode()
s=Settings(aperture_custom=True,aperture_mask=encoded,iris_mm=6,blades=5,soften_internal_cutoff=False)
points=np.array([[-3,0,0],[3,0,0],[0,0,0]],dtype=float)
valid,energy=coverage(dict(aperture_diameter=20,is_stop=True),points,s)
expected=mask_coverage(points[:,:2],s)
assert np.allclose(energy,expected) and np.array_equal(valid,expected>1e-8)
a=analyze(Settings(iris_mm=6,blades=0,soften_internal_cutoff=False),[8,0],5,1024,8)
b=analyze(s,[8,0],5,1024,8)
assert a['ghost_id']!=b['ghost_id'] and b['configuration']['aperture_mask']==encoded
assert sum(c['energy_fraction'] for family in b['families'] for c in family['channels'])>0
result=dict(passed=True,custom_iris_shared=True,custom_mask_changes_trace=True,finite=True)
Path('research/lens-flare-iris-validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(result)
