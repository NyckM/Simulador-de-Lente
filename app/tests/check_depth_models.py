"""Depth units, mask/geometry preservation, normalization and job admission regression checks."""
from pathlib import Path
import os,sys,tempfile,unittest
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics.depth_models import options,metric_prediction,preview,normalize_sequence,convert_relative,save_geometry
class DepthModels(unittest.TestCase):
 def test_metric_geometry_mask(self):
  z=np.array([[1,2],[0,np.inf]],dtype='f4');a=metric_prediction(dict(depth=z,points=np.ones((2,2,3)),normal=np.ones((2,2,3)),intrinsics=np.eye(3),mask=np.array([[1,0],[1,1]])))
  self.assertEqual(a['mask'].sum(),1);self.assertEqual(a['depth'][0,0],1);self.assertTrue(np.isnan(a['points'][0,1]).all())
  with tempfile.TemporaryDirectory() as d:
   save_geometry(d,0,a)
   with np.load(Path(d)/'geometry-000000.npz',allow_pickle=False) as b:np.testing.assert_array_equal(b['depth'],a['depth']);self.assertEqual(b['intrinsics'].shape,(3,3))
 def test_reject_invalid_geometry(self):
  for output in [dict(depth=np.zeros((2,2))),dict(depth=np.ones((2,2)),points=np.ones((2,3,3))),dict(depth=np.ones((2,2)),intrinsics=np.zeros((2,2)))]:
   with self.assertRaises(ValueError):metric_prediction(output)
 def test_metric_preview_does_not_mutate_meters(self):
  z=np.array([[1,2,4,np.nan]],dtype='f4');old=z.copy();p=preview(z,.25,1,True)
  np.testing.assert_array_equal(z,old);self.assertEqual(p[0,0],1);self.assertEqual(p[0,2],0);self.assertEqual(p[0,3],0)
 def test_log_depth_direction(self):
  np.testing.assert_array_equal(convert_relative([[1,2]],'affine-log-distance'),[[-1,-2]])
 def test_constant_and_sparse_normalization(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'raw.npy';np.save(p,np.array([[np.nan,2]],dtype='f4'));lo,hi=normalize_sequence([p],True);self.assertEqual(lo,.5);self.assertEqual(hi,.5);self.assertEqual(preview(np.array([[2]]),lo,hi,True)[0,0],.5)
   np.save(p,np.array([[np.nan]],dtype='f4'))
   with self.assertRaises(ValueError):normalize_sequence([p],True)
 def test_options(self):
  self.assertEqual(options({})['seed'],2025)
  for b in [{'seed':True},{'refine_steps':-1},{'max_size':8192},{'resolution_level':'3'}]:
   with self.assertRaises(ValueError):options(b)
 def test_job_validation_does_not_create_orphan(self):
  from optics import jobs,depth_runtime
  with tempfile.TemporaryDirectory() as d:
   old=jobs.CACHE;jobs.CACHE=Path(d)
   try:
    for body in [dict(model='unknown'),dict(model='moge3',max_size=9999),dict(model='marigold2',kind='invalid')]:
     with self.assertRaises(ValueError):jobs.create(body,'depth')
    self.assertEqual(list(Path(d).iterdir()),[])
   finally:jobs.CACHE=old
if __name__=='__main__':unittest.main()
