import json
import unittest
from pathlib import Path
from dataclasses import replace
import numpy as np
from optics.core import Settings, LENS_PROFILES, get_lens, aperture_info, layout
from optics import vulkan

class LensLibraryTests(unittest.TestCase):
 def test_inventory_exposes_only_models_with_numerical_data(self):
  root=Path(__file__).resolve().parents[1]
  entries=json.loads((root/'data/lens_catalogue.json').read_text(encoding='utf-8'))
  self.assertGreaterEqual(len(entries),19)
  self.assertEqual(len({e['model'] for e in entries if e['model']}),sum(bool(e['model']) for e in entries))
  self.assertEqual(sum(e['model'] is not None for e in entries),10+sum(k.startswith('lv_') for k in LENS_PROFILES))
  html=(root/'web/index.html').read_text(encoding='utf-8')
  for e in entries:
   if e['model']:
    self.assertIn('value="'+e['model']+'"',html)
    self.assertIn('dgauss50' if e['model']=='physical' else e['model'],LENS_PROFILES)
   else:self.assertEqual(e['state'],'pending')
 def test_independent_prescriptions_focal_aperture_and_editing(self):
  signatures=[]
  for model,profile in LENS_PROFILES.items():
   if not profile.get('prescription'):continue
   with self.subTest(model=model):
    initial=Settings(lens_model=model);lens=get_lens(initial)
    s=Settings.parse(dict(lens_model=model,iris_mm=lens.max_iris,blades=32))
    self.assertAlmostEqual(lens.efl,profile['focal_mm'],places=5)
    self.assertAlmostEqual(aperture_info(s)['f_number'],profile['nominal_f'],delta=profile['nominal_f']*.01 if model.startswith('lv_') else 1e-5)
    self.assertAlmostEqual(aperture_info(replace(s,iris_mm=s.iris_mm/2))['f_number'],2*profile['nominal_f'],delta=profile['nominal_f']*.02 if model.startswith('lv_') else 1e-5)
    points,energy,throughput=lens.spots((0,0),5,s,count=4096)
    self.assertGreater(len(points),30);self.assertGreater(throughput,0)
    data=layout(s);self.assertEqual(len(data['surfaces']),len(lens.surfaces))
    index=next(i for i,row in enumerate(lens.surfaces) if row['curvature_radius'] and not row.get('is_stop'))
    edit=Settings.parse(dict(lens_model=model,iris_mm=lens.max_iris,lens_edits=[[index,'curvature_radius',lens.surfaces[index]['curvature_radius']*1.02]]))
    self.assertFalse(np.isclose(get_lens(edit).efl,lens.efl,rtol=1e-10))
    signatures.append(tuple((round(r['curvature_radius'],5),round(r['thickness'],5),r['nd']) for r in lens.surfaces))
  self.assertEqual(len(signatures),sum(bool(p.get('prescription')) for p in LENS_PROFILES.values()))
  self.assertGreaterEqual(len(set(signatures)),9)
 @unittest.skipUnless(vulkan.available(),'Vulkan unavailable')
 def test_new_constructions_cpu_gpu_agree(self):
  for model,profile in LENS_PROFILES.items():
   if not profile.get('prescription'):continue
   with self.subTest(model=model):
    lens=get_lens(Settings(lens_model=model));s=Settings(lens_model=model,iris_mm=lens.max_iris,blades=0)
    x=min(3,lens.efl*.04);y=x*2/3
    p,d,valid,energy,paths=lens.bundle((x,y),5,s,.5876,4096,history=True)
    start=paths[0];origin=np.array([-x*5000/lens.efl,-y*5000/lens.efl,-5000])
    direction=start-origin;direction/=np.linalg.norm(direction,axis=1)[:,None]
    a,b,c,e=vulkan.trace(lens,s,start,direction,np.full(len(start),.5876));both=valid&c
    self.assertGreater(both.sum(),30);self.assertLessEqual(np.count_nonzero(valid!=c),1)
    np.testing.assert_allclose(a[both],p[both],atol=.002,rtol=0)
    np.testing.assert_allclose(b[both],d[both],atol=1e-5,rtol=0)
    np.testing.assert_allclose(e[both],energy[both],atol=.004,rtol=0)
