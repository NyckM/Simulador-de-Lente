import subprocess,shutil,unittest
from pathlib import Path
class UserProfileTests(unittest.TestCase):
 def test_saved_profiles_and_actual_reset_restore_functions(self):
  result=subprocess.run([shutil.which('node'),str(Path(__file__).with_name('check_profile_store.js'))],capture_output=True,text=True,timeout=15)
  self.assertEqual(result.returncode,0,result.stderr)
