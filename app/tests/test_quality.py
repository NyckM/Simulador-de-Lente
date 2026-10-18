import subprocess,shutil,unittest
from pathlib import Path
class QualityTests(unittest.TestCase):
 def test_rgb_atlas_repacking_and_quality_migration(self):
  run=subprocess.run([shutil.which('node'),str(Path(__file__).with_name('check_quality.js'))],capture_output=True,text=True,timeout=15)
  self.assertEqual(run.returncode,0,run.stderr)
