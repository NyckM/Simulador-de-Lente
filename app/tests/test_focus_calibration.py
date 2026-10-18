import unittest
from dataclasses import replace
from optics.core import Settings,get_lens,focus_calibration,layout
from optics.preview import kernel

class FocusCalibrationTests(unittest.TestCase):
 def test_calibration_concentrates_rays_without_removing_aberrations(self):
  for model in ('dgauss50','sonnar_50','kino_100','lv_viltrox_af_75mm_f12_pro','lv_rodenstock_apo_sironar_w_150f56','lv_pentax_f_85_f28_soft'):
   lens=get_lens(Settings(lens_model=model));s=Settings(lens_model=model,iris_mm=lens.max_iris,source_m=5)
   c=focus_calibration(s)
   self.assertTrue(c['valid'],model)
   self.assertGreaterEqual(c['focused_core'],c['paraxial_core']-1e-12,model)
   self.assertGreater(c['best_rms_mm'],0,model)
 def test_layout_and_atlas_share_the_reference_focus_compensation(self):
  s=Settings(lens_model='kino_100',iris_mm=6,focus_m=2,source_m=5,ray_focus=True)
  a=layout(s);b=layout(replace(s,ray_focus=False));atlas=kernel(s,taps=64,rays=1024)
  self.assertAlmostEqual(a['sensor_z_mm']-b['sensor_z_mm'],a['focus_shift_mm'])
  self.assertAlmostEqual(a['focus_shift_mm'],atlas['focus_calibration']['shift_mm'])
 def test_focus_calibration_depends_on_aperture(self):
  s=Settings(lens_model='kino_100',iris_mm=6,source_m=5)
  self.assertNotEqual(focus_calibration(s)['shift_mm'],focus_calibration(replace(s,iris_mm=2))['shift_mm'])
 def test_ray_focus_requires_boolean(self):
  for value in (1,'true',None):
   with self.assertRaises(ValueError):Settings.parse({'ray_focus':value})
