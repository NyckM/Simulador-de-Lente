import unittest
import numpy as np
from optics.filters import apply,validate,DEFAULT,KINDS
from optics.core import Settings

class FilterTests(unittest.TestCase):
 def test_validation_and_persistence_contract(self):
  for kind in KINDS:self.assertEqual(Settings.parse({'filters':[{'kind':kind}]}).filters[0]['kind'],kind)
  for raw in ([{'kind':'unknown'}],[{'kind':'halo','scale':0}],[{'kind':'streak','enabled':1}],[{'kind':'star','count':2.5}],[{'kind':'halo','x':float('nan')}], [{'kind':'halo'}]*17):
   with self.assertRaises(ValueError):validate(raw)
 def test_bypass_black_neutral_and_center(self):
  rgb=np.ones((24,32,3))*.25
  for kind in KINDS:
   self.assertIs(apply(rgb,[{**DEFAULT,'kind':kind,'amount':0}]),rgb)
   self.assertIs(apply(rgb,[{**DEFAULT,'kind':kind,'enabled':False}]),rgb)
  z=np.zeros_like(rgb)
  for kind in KINDS:np.testing.assert_array_equal(apply(z,[{**DEFAULT,'kind':kind}]),z)
  noisy=np.random.default_rng(41).random((24,32,3))
  for kind in ('halo','window','kaleidoscope'):
   out=apply(noisy,[{**DEFAULT,'kind':kind}]);np.testing.assert_array_equal(out[12,16],noisy[12,16])
 def test_opaque_composite_nonnegative_and_order(self):
  rgb=np.zeros((32,48,3));rgb[10:15,22:27]=4
  black={**DEFAULT,'kind':'black_mist','radius':.2};linear={**DEFAULT,'kind':'replicate','shift':.12}
  a=apply(rgb,[black,linear]);b=apply(rgb,[linear,black])
  self.assertTrue(np.isfinite(a).all());self.assertGreaterEqual(a.min(),0);self.assertGreater(np.max(abs(a-b)),.001)
  out=apply(rgb,[black]);self.assertGreater(out[8:17,20:29].sum(),0)
if __name__=='__main__':unittest.main()
