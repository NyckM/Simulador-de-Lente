import unittest
import numpy as np
from optics.core import Settings
from optics.filter_transform import region_mask
class TransformTests(unittest.TestCase):
 def test_global_independent_of_transform_and_kernel(self):
  s=Settings(diffusion_x=-1,diffusion_scale=.05,diffusion_reach=4)
  self.assertTrue(np.all(region_mask(s,120,200)==1))
 def test_local_geometry_and_kernel_separation(self):
  s=Settings(diffusion_region=True,diffusion_scale_x=2,diffusion_scale_y=.5)
  a=region_mask(s,200,200);s.diffusion_reach=3
  np.testing.assert_array_equal(a,region_mask(s,200,200))
  self.assertEqual(a[100,170],1);self.assertEqual(a[130,100],0)
  s.diffusion_rotation=90;b=region_mask(s,200,200)
  self.assertEqual(b[170,100],1);self.assertEqual(b[100,130],0)
 def test_off_frame_and_validation(self):
  s=Settings.parse(dict(diffusion_region=True,diffusion_x=-1,diffusion_y=2))
  self.assertTrue(np.all(region_mask(s,100,100)==0))
  for key,value in [('diffusion_scale',0),('diffusion_x',float('nan')),('diffusion_region',1)]:
   with self.assertRaises(ValueError):Settings.parse({key:value})
if __name__=='__main__':unittest.main()
