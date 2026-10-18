import hashlib, tempfile, unittest, zipfile
from pathlib import Path
from unittest.mock import patch
from optics import complements as c
class ComplementsTest(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
  self.patch=patch.multiple(c,USER=self.root,TARGET=self.root/'runtime',BUNDLED=self.root/'bundled',STATE={'state':'idle','percent':0,'message':''})
  self.patch.start();c.CANCEL.clear()
 def tearDown(self):c.CANCEL.clear();self.patch.stop();self.temp.cleanup()
 def test_missing_runtime_status(self):self.assertFalse(c.status()['installed'])
 def test_valid_runtime_priority(self):
  for root in (c.TARGET,c.BUNDLED):
   (root/'python').mkdir(parents=True);(root/'python/python.exe').write_bytes(b'python');(root/'runtime.json').write_text('{}')
  self.assertEqual(c.runtime(),c.TARGET)
 def test_incomplete_runtime_not_active(self):
  (c.TARGET/'python').mkdir(parents=True);(c.TARGET/'python/python.exe').write_bytes(b'python')
  self.assertIsNone(c.runtime())
 def test_zip_path_traversal_rejected(self):
  seed=self.root/'bad.zip'
  with zipfile.ZipFile(seed,'w') as z:z.writestr('../outside.txt','evil')
  stage=self.root/'stage';stage.mkdir()
  with self.assertRaises(ValueError):c.extract(seed,stage)
  self.assertFalse((self.root/'outside.txt').exists())
 def test_cancel_interrupts_extraction(self):
  seed=self.root/'seed.zip'
  with zipfile.ZipFile(seed,'w') as z:z.writestr('python/a','a')
  stage=self.root/'stage';stage.mkdir();c.CANCEL.set()
  with self.assertRaises(c.Cancelled):c.extract(seed,stage)
 def test_verified_cached_download_reused_offline(self):
  data=b'verified';target=self.root/'package.whl';target.write_bytes(data)
  wheel={'filename':target.name,'size':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  with patch.object(c.urllib.request,'urlopen',side_effect=AssertionError('network should not be used')):
   self.assertEqual(c.download(wheel,self.root,0,len(data)),target)
 def test_unapproved_url_rejected(self):
  wheel={'filename':'package.whl','size':1,'sha256':'no','url':'https://example.com/evil.whl'}
  with self.assertRaises(ValueError):c.download(wheel,self.root,0,1)
 def test_activation_refreshes_worker_without_restart(self):
  from optics import jobs
  (c.TARGET/'python').mkdir(parents=True);(c.TARGET/'python/python.exe').write_bytes(b'python');(c.TARGET/'runtime.json').write_text('{}')
  with patch.multiple(jobs,DEPTH_ROOT=c.BUNDLED,PYTHON=c.BUNDLED/'python/python.exe',DEPTH_WORKER=c.BUNDLED/'worker/depth_worker.py'):
   jobs.refresh_runtime();self.assertEqual(jobs.PYTHON,c.TARGET/'python/python.exe');self.assertEqual(jobs.DEPTH_WORKER,jobs.ROOT/'optics/depth_worker.py')
 def test_packaged_worker_overrides_old_runtime_after_app_update(self):
  from optics import jobs
  app=self.root/'app/_internal';worker=app/'native/depth/worker/depth_worker.py'
  worker.parent.mkdir(parents=True);worker.write_text('new worker')
  (c.TARGET/'python').mkdir(parents=True);(c.TARGET/'python/python.exe').write_bytes(b'python');(c.TARGET/'runtime.json').write_text('{}')
  with patch.multiple(jobs,ROOT=app,DEPTH_ROOT=c.BUNDLED,PYTHON=c.BUNDLED/'python/python.exe',DEPTH_WORKER=c.BUNDLED/'worker/depth_worker.py'),patch.object(jobs.sys,'frozen',True,create=True):
   jobs.refresh_runtime();self.assertEqual(jobs.DEPTH_WORKER,worker);self.assertEqual(jobs.PYTHON,c.TARGET/'python/python.exe')
if __name__=='__main__':unittest.main()
