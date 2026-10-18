"""Stage-2 regression against the pre-refactor baseline captured in this workspace."""
import json
import sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from optics.core import Settings,get_lens,layout
from optics.preview import kernel
WORK=ROOT/'tests'/'fixtures'/'prescription-stage2'
baseline=json.loads((WORK/'prescription-stage2-baseline.json').read_text())
for b in baseline:
    lens=get_lens(Settings(lens_model=b['model']))
    expected=[dict(s,is_stop=bool(s.get('is_stop',False))) for s in b['surfaces']]
    assert [dict(s) for s in lens.surfaces]==expected,b['model']
    assert lens.z.tolist()==b['z'] and lens.efl==b['efl'],b['model']
    p,d,v,e,_=lens.trace(np.array([[0.,0.,-1.],[.001,0.,-1.],[2.,1.,-1.],[6.,2.,-1.]]),np.tile([0.,0.,1.],(4,1)),Settings(iris_mm=min(3,lens.max_iris)))
    for value,key in [(p,'p'),(d,'d'),(v,'v'),(e,'e')]:
        assert np.array_equal(value,np.array(b[key]),equal_nan=True),(b['model'],key)
    try:
        lens.surfaces[0]['nd']=1.1
        raise AssertionError('mutable')
    except TypeError:pass
    try:
        lens.z[0]=2
        raise AssertionError('mutable position')
    except ValueError:pass
k=kernel(Settings(ray_backend='cpu',field_grid=3),16/9,32,rays=1024)
old=json.loads((WORK/'prescription-stage2-atlas.json').read_text())
for key in ['atlas','pupils','matrix','efl_mm','ghost_pairs']:assert k[key]==old[key],key
data=layout(Settings())
assert k['prescription_id']==data['prescription']['geometry_id']
edited=get_lens(Settings(lens_edits=((0,'nd',1.68),)))
assert edited.prescription.geometry_id!=get_lens(Settings()).prescription.geometry_id
assert edited.prescription.export()['provenance']['edited']
result=dict(models=len(baseline),legacy_geometry_exact=True,ray_outputs_exact=True,atlas_exact=True,immutable=True,layout_atlas_id_match=True,edit_changes_id=True,categories=sorted(set(get_lens(Settings(lens_model=b['model'])).prescription.category for b in baseline)))
(ROOT/'research/prescription-stage2-validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
