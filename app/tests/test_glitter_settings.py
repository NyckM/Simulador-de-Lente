import unittest
from optics.core import Settings

class GlitterSettings(unittest.TestCase):
 def test_old_project_defaults(self):
  s=Settings.parse({'shimmer_amount':2})
  self.assertTrue(s.shimmer_normalize);self.assertEqual(s.shimmer_prism,.25)
 def test_neutral_and_prismatic(self):
  for prism in (0,.25,1):self.assertEqual(Settings.parse({'shimmer_prism':prism}).shimmer_prism,prism)
 def test_invalid_controls(self):
  for value in (-.01,1.01,float('nan'),'pink',True):
   with self.assertRaises(ValueError):Settings.parse({'shimmer_prism':value})
  with self.assertRaises(ValueError):Settings.parse({'shimmer_normalize':'yes'})
if __name__=='__main__':unittest.main()
