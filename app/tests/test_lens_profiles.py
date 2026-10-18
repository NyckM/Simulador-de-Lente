import unittest
from dataclasses import replace
import numpy as np
from optics.core import Settings,get_lens,layout,aperture_info,LENS
from optics.preview import kernel
class LensProfileTests(unittest.TestCase):
 def test_named_models_have_their_own_focal_and_f2_aperture(self):
  for model,focal in [('zeiss_planar_50',50),('helios_44_2',58)]:
   s=Settings.parse(dict(lens_model=model));lens=get_lens(s)
   self.assertAlmostEqual(lens.efl,focal,places=6)
   opened=replace(s,iris_mm=lens.max_iris)
   self.assertAlmostEqual(aperture_info(opened)['f_number'],2,places=6)
   self.assertAlmostEqual(aperture_info(replace(opened,iris_mm=lens.max_iris/4))['f_number'],8,places=6)
   data=kernel(opened,taps=64,rays=1024)
   self.assertEqual(data['lens_model'],model)
   self.assertAlmostEqual(data['efl_mm'],focal,places=6)
   self.assertEqual(data['max_iris_mm'],lens.max_iris)
   self.assertIn('aproximado',layout(opened)['profile']['status'])
   self.assertIsNot(data,kernel(Settings(),taps=64,rays=1024))
 def test_surface_edits_apply_to_the_selected_model(self):
  s=Settings.parse(dict(lens_model='helios_44_2'));base=get_lens(s)
  edited=Settings.parse(dict(lens_model=s.lens_model,lens_edits=[[0,'curvature_radius',base.surfaces[0]['curvature_radius']*1.05]]))
  self.assertNotAlmostEqual(get_lens(edited).efl,base.efl)
  self.assertNotAlmostEqual(base.surfaces[0]['thickness'],LENS.surfaces[0]['thickness'])
 def test_unknown_model_and_excessive_aperture_are_rejected(self):
  for raw in [dict(lens_model='unknown'),dict(lens_model=[]),dict(lens_model='zeiss_planar_50',iris_mm=12.5)]:
   with self.assertRaises(ValueError):Settings.parse(raw)
