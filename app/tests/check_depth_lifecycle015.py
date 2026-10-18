"""Runtime lifecycle, terminal state, corruption and diagnostics regression checks."""
from pathlib import Path
import os,sys,tempfile,json,hashlib,unittest,subprocess,time
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics import depth_runtime as runtime,depth_setup as setup,depth_setup_worker as worker
from optics.depth_errors import diagnostic
class Lifecycle(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.patch=patch.object(runtime,'CONFIG',self.root/'runtimes.json');self.patch.start()
 def tearDown(self):self.patch.stop();self.temp.cleanup()
 def config(self):
  p=self.root/'python.exe';p.write_bytes(b'python');return dict(python=str(p),cache=str(self.root/'cache'),repository='',assets='')
 def test_registry_bad_data(self):
  for data in ['[1,2]','broken','{"moge3":null,"unknown":{}}']:
   runtime.CONFIG.write_text(data);self.assertEqual(runtime.load(),{})
 def test_probe_is_not_inference(self):
  c=self.config();runtime.save({'moge3':c});self.assertFalse(runtime.catalog()[0]['inference_verified'])
 def test_inference_evidence_and_invalidation(self):
  c=self.config();runtime.save({'moge3':c});info=dict(runtime_fingerprint=runtime.fingerprint(c),width=12,height=8,count=1,options={},device='fixture')
  runtime.record_inference('moge3',info);self.assertTrue(runtime.catalog()[0]['inference_verified'])
  Path(c['python']).write_bytes(b'changed-runtime');self.assertFalse(runtime.catalog()[0]['inference_verified'])
 def test_module_change_invalidates_evidence(self):
  module=self.root/'module.py';module.write_text('old');c=self.config();c['probe']={'module_files':[str(module)]};runtime.save({'moge3':c});runtime.record_inference('moge3',dict(runtime_fingerprint=runtime.fingerprint(c),width=2,height=2,count=1));self.assertTrue(runtime.catalog()[0]['inference_verified']);module.write_text('new content');self.assertFalse(runtime.catalog()[0]['inference_verified'])
 def test_old_worker_cannot_validate_replacement(self):
  c=self.config();runtime.save({'moge3':c});runtime.record_inference('moge3',dict(runtime_fingerprint='stale'));self.assertFalse(runtime.catalog()[0]['inference_verified'])
 def test_config_atomic_retry(self):
  original=os.replace;calls=[]
  def replace(a,b):
   calls.append(1)
   if len(calls)<3:raise PermissionError('reader holds file')
   return original(a,b)
  with patch.object(runtime.os,'replace',replace):runtime.save({'moge3':self.config()})
  self.assertEqual(len(calls),3);self.assertTrue(runtime.configured('moge3'));self.assertEqual(list(self.root.glob('tmp*')),[])
 def test_error_classes(self):
  for text,code in [('CUDA out of memory','gpu_memory'),('Disk full','disk_space'),('No module named x','dependencies'),('CUDA indisponível','cuda_unavailable'),('checksum bad','cache_integrity'),('connection timed out','download'),('Access denied','access')]:self.assertEqual(diagnostic(RuntimeError(text))['code'],code)
 def test_failed_cache_never_marked_ready(self):
  assets=self.root/'assets';p=assets/'files/weight.bin';p.parent.mkdir(parents=True);p.write_bytes(b'bad')
  manifest=[dict(repo='fixture',revision='pinned',folder='files',files=[dict(name='weight.bin',size=4,sha256=hashlib.sha256(b'good').hexdigest())])]
  import types
  fake=types.ModuleType('huggingface_hub');fake.HfApi=lambda:None;fake.hf_hub_download=lambda *a,**kw:None
  with patch.dict(sys.modules,{'huggingface_hub':fake}),patch.object(worker,'INPUT',dict(model='marigold2',assets=str(assets))),patch.object(worker,'MANIFEST',dict(marigold_assets=manifest)),patch.object(worker,'progress'):
   with self.assertRaisesRegex(ValueError,'Checksum'):worker.weights('')
  self.assertFalse((assets/'marigold2-weights.json').exists())
 def test_cache_is_reused_and_hash_checked(self):
  assets=self.root/'assets';p=assets/'files/weight.bin';p.parent.mkdir(parents=True);p.write_bytes(b'good')
  manifest=[dict(repo='fixture',revision='pinned',folder='files',files=[dict(name='weight.bin',size=4,sha256=hashlib.sha256(b'good').hexdigest())])]
  import types
  fake=types.ModuleType('huggingface_hub');fake.HfApi=lambda:None;fake.hf_hub_download=lambda *a,**kw:(_ for _ in ()).throw(AssertionError('Unexpected download'))
  with patch.dict(sys.modules,{'huggingface_hub':fake}),patch.object(worker,'INPUT',dict(model='marigold2',assets=str(assets))),patch.object(worker,'MANIFEST',dict(marigold_assets=manifest)),patch.object(worker,'progress'):worker.weights('')
  self.assertTrue((assets/'marigold2-weights.json').exists())
 def test_frozen_worker_without_legacy_complement(self):
  from optics import jobs
  packaged=self.root/'native/depth/worker/depth_worker.py';packaged.parent.mkdir(parents=True);packaged.write_text('# fixture')
  with patch.object(jobs,'ROOT',self.root),patch.object(jobs.sys,'frozen',True,create=True),patch('optics.complements.runtime',return_value=None),patch.object(jobs,'DEPTH_WORKER',Path('missing')):
   jobs.refresh_runtime();self.assertEqual(jobs.DEPTH_WORKER,packaged)
 def test_cancel_completed_does_not_overwrite(self):
  from optics.worker_status import write_status
  write_status(self.root,dict(state='complete'));proc=unittest.mock.Mock();proc.poll.return_value=0
  with patch.object(setup,'ACTIVE',dict(process=proc,job=self.root,model='moge3',action='download',registered=True,cache='',assets=str(self.root),log=None)):
   self.assertEqual(setup.cancel()['state'],'complete')
 def test_cancel_owned_process(self):
  from optics.worker_status import write_status
  write_status(self.root,dict(state='running'));log=(self.root/'log.txt').open('wb');proc=subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)'],stdout=log,stderr=log)
  try:
   with patch.object(setup,'ACTIVE',dict(process=proc,job=self.root,model='moge3',action='install',registered=False,cache='',assets=str(self.root),log=log)):
    self.assertEqual(setup.cancel()['state'],'cancelled');self.assertIsNotNone(proc.poll());self.assertEqual(setup.cancel()['state'],'cancelled')
  finally:
   if proc.poll() is None:proc.kill();proc.wait()
   log.close()
if __name__=='__main__':unittest.main()
