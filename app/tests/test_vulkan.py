import unittest
from dataclasses import replace
from unittest.mock import patch
import numpy as np
from optics.core import Settings,get_lens
from optics.preview import kernel,_cell_means
from optics import vulkan

class VulkanTests(unittest.TestCase):
 @unittest.skipUnless(vulkan.available(),'Native Vulkan backend unavailable')
 def test_gpu_matches_cpu_surfaces_iris_dispersion_and_coating(self):
  base=Settings(iris_mm=8.55,blades=0)
  cases=[(base,(0,0),5,.5876),(base,(16,8),5,.6563),(replace(base,iris_mm=2.5,blades=15,rotation=37,iris_softness=.1,dispersion=1,coating_strength=1),(8,4),.8,.4861)]
  for s,field,distance,wl in cases:
   lens=get_lens(s);p,d,valid,energy,paths=lens.bundle(field,distance,s,wl,8192,history=True)
   start=paths[0];origin=np.array([-field[0]*distance*1000/lens.efl,-field[1]*distance*1000/lens.efl,-distance*1000]);direction=start-origin;direction/=np.linalg.norm(direction,axis=1)[:,None]
   a,b,c,e=vulkan.trace(lens,s,start,direction,np.full(len(start),wl));both=valid&c
   self.assertLessEqual(np.count_nonzero(valid!=c),1);self.assertGreater(both.sum(),10)
   np.testing.assert_allclose(a[both],p[both],atol=5e-4,rtol=0)
   np.testing.assert_allclose(b[both],d[both],atol=1e-5,rtol=0)
   np.testing.assert_allclose(e[both],energy[both],atol=.002,rtol=0)
   again=vulkan.trace(lens,s,start,direction,np.full(len(start),wl))
   for expected,actual in zip((a,b,c,e),again):np.testing.assert_array_equal(expected,actual)
 def test_cpu_selection_and_unavailable_vulkan_fallback(self):
  data=kernel(Settings(ray_backend='cpu'),taps=32,rays=1024);self.assertEqual(data['trace_backend'],'cpu')
  with patch.dict('os.environ',{'OPTICA_RAY_BACKEND':'cpu'}):
   data=kernel(Settings(ray_backend='vulkan'),taps=32,rays=1024);self.assertEqual(data['trace_backend'],'cpu')
 def test_backend_validation(self):
  with self.assertRaises(ValueError):Settings.parse({'ray_backend':'unknown'})

class PupilReductionTests(unittest.TestCase):
 def test_weighted_reduction_matches_direct_cell_averages(self):
  rng=np.random.default_rng(19);labels=rng.integers(0,63,4096);values=rng.normal(size=(4096,2));energy=rng.random(4096)
  masses=np.bincount(labels,weights=energy,minlength=64);result=_cell_means(labels,values,energy,masses)
  for i in range(63):np.testing.assert_allclose(result[i],np.average(values[labels==i],axis=0,weights=energy[labels==i]),atol=1e-12)
  np.testing.assert_array_equal(result[63],[0,0])
