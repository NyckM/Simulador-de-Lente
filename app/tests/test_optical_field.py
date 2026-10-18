import unittest
from dataclasses import replace
import numpy as np
from optics.core import Settings,get_lens
from optics.preview import kernel,focus_plane

class OpticalFieldTests(unittest.TestCase):
 def test_native_glass_has_astigmatism_curved_focus_and_clipping(self):
  s=Settings(iris_mm=8.55,blades=0);lens=get_lens(s);results=[]
  for field in ((0,0),(16,0)):
   p,d,valid,energy,_=lens.bundle(field,5,s,.5876,4096)
   slopes=d[valid,:2]/d[valid,2,None];z=focus_plane(5,lens)
   xy=p[valid,:2]+(z-p[valid,2,None])*slopes;w=energy[valid]
   xy-=np.average(xy,axis=0,weights=w);slopes-=np.average(slopes,axis=0,weights=w)
   best=z-np.average(xy*slopes,axis=0,weights=w)/np.average(slopes**2,axis=0,weights=w)
   results.append((best,energy[valid].sum()/4096))
  self.assertGreater(abs(results[1][0][0]-results[1][0][1]),.01)
  self.assertGreater(abs(results[1][0].mean()-results[0][0].mean()),.01)
  self.assertLess(results[1][1],results[0][1])
 def test_detailed_field_is_distinct_and_focus_reuses_actual_rays(self):
  s=Settings(field_grid=9);data=kernel(s,taps=32)
  self.assertEqual(data['grid'],9);self.assertEqual(len(data['atlas']),3*32*9*9*4)
  self.assertIs(data,kernel(replace(s,focus_m=.8),taps=32))
  self.assertEqual(kernel(replace(s,field_grid=3),taps=32)['grid'],3)
  self.assertIsNot(data,kernel(replace(s,field_grid=5),taps=32))
 def test_invalid_field_resolution_rejected(self):
  for value in (True,4,99):
   with self.assertRaises(ValueError):Settings.parse({'field_grid':value})
   with self.assertRaises(ValueError):kernel(Settings(field_grid=value))
