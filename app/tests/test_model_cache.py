import os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from optics.model_cache import model_file, regular_cache_target

class CacheTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.repo=self.root/'hub/models--depth-anything--DA3-BASE'
        self.pointer=self.repo/'snapshots/revision/config.json'
        self.blob=self.repo/'blobs/hash'
        self.blob.parent.mkdir(parents=True);self.pointer.parent.mkdir(parents=True)
        self.blob.write_bytes(b'{"config":"downloaded"}')
    def tearDown(self): self.tmp.cleanup()
    def test_blocked_snapshot_link_is_never_traversed(self):
        original=Path.resolve
        def resolve(path,*args,**kw):
            if path==self.pointer:raise OSError(448,'untrusted mount point')
            return original(path,*args,**kw)
        with patch.object(Path,'is_symlink',lambda p:p==self.pointer),patch('os.readlink',return_value='../../blobs/hash'),patch.object(Path,'resolve',resolve),patch.dict(os.environ,{'HF_HOME':str(self.root)}):
            local=Path(model_file('depth-anything/DA3-BASE','config.json',lambda *args:str(self.pointer)))
            self.assertEqual(local.read_bytes(),self.blob.read_bytes())
            self.assertFalse(local.is_symlink());self.assertEqual(local.suffix,'.json')
    def test_cache_link_cannot_escape_model_cache(self):
        with patch.object(Path,'is_symlink',lambda p:p==self.pointer),patch('os.readlink',return_value='../../../../outside'):
            with self.assertRaisesRegex(OSError,'fora'):regular_cache_target(self.pointer)
    def test_missing_blob_reports_download_error(self):
        self.blob.unlink()
        with patch.object(Path,'is_symlink',lambda p:p==self.pointer),patch('os.readlink',return_value='../../blobs/hash'),patch.dict(os.environ,{'HF_HOME':str(self.root)}):
            with self.assertRaisesRegex(RuntimeError,'inacessível'):model_file('depth-anything/DA3-BASE','config.json',lambda *args:str(self.pointer))
