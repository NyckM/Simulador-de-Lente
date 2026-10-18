import unittest
from optics.core import Settings

class DistortionSettings(unittest.TestCase):
 def test_defaults_and_limits(self):
  self.assertEqual(Settings.parse({}).bokeh_distortion,0)
  self.assertEqual(Settings.parse({'bokeh_distortion':2,'bokeh_distortion_color':1}).bokeh_distortion,2)
 def test_invalid(self):
  for key in ('bokeh_distortion','bokeh_distortion_color'):
   for value in [-.1,3,'1',True,float('nan')]:
    with self.subTest(key=key,value=value),self.assertRaises(ValueError):Settings.parse({key:value})
