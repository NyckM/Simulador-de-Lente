import os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from optics.dvd_adapter import model_file

class DVDModelFilesTest(unittest.TestCase):
 def test_regular_file_keeps_extension_and_reuses_cache(self):
  with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'HF_HOME':tmp}):
   root=Path(tmp);blob=root/'blob';blob.write_bytes(b'weights')
   snapshot=root/'revision';snapshot.mkdir();cached=snapshot/'model.safetensors'
   try:cached.symlink_to(blob)
   except OSError:cached.write_bytes(blob.read_bytes())
   local=Path(model_file('repo/model','model.safetensors',lambda *args:str(cached)))
   self.assertTrue(local.is_file());self.assertFalse(local.is_symlink());self.assertEqual(local.suffix,'.safetensors');self.assertEqual(local.read_bytes(),b'weights')
   self.assertEqual(str(local),model_file('repo/model','model.safetensors',lambda *args:str(cached)))
 def test_missing_weight_has_actionable_error(self):
  with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'HF_HOME':tmp}):
   with self.assertRaisesRegex(RuntimeError,'arquivo .* ausente ou inacessível'):
    model_file('repo/model','model.pth',lambda *args:str(Path(tmp)/'missing.pth'))
 def test_empty_weight_rejected(self):
  with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'HF_HOME':tmp}):
   p=Path(tmp)/'empty.pth';p.touch()
   with self.assertRaisesRegex(RuntimeError,'vazio'):
    model_file('repo/model','empty.pth',lambda *args:str(p))
