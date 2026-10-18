import json
from pathlib import Path
import shutil
import subprocess
import unittest
from optics.core import Settings
from optics.preview import kernel

class AtlasUploadTests(unittest.TestCase):
 def test_all_server_field_grids_can_load_in_the_viewer(self):
  node=shutil.which('node');self.assertIsNotNone(node)
  for grid in (3,5,9):
   with self.subTest(grid=grid):
    data=kernel(Settings(field_grid=grid),taps=32)
    result=subprocess.run([node,str(Path(__file__).with_name('check_atlas_upload.js'))],input=json.dumps(data),text=True,capture_output=True,timeout=20)
    self.assertEqual(result.returncode,0,result.stderr)
