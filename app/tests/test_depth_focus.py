import subprocess,shutil,unittest
from pathlib import Path
class DepthFocusTests(unittest.TestCase):
 def test_depth_composition_and_focus_mapping(self):
  r=subprocess.run([shutil.which('node'),str(Path(__file__).with_name('check_depth_focus.js'))],text=True,capture_output=True,timeout=15)
  self.assertEqual(r.returncode,0,r.stderr)
