import json,subprocess,shutil,unittest
from pathlib import Path
from optics.core import Settings,layout
class IrisRayTests(unittest.TestCase):
 def test_interactive_rays_match_cpu_and_shrink_with_aperture(self):
  cases=[layout(Settings(focus_m=.6,iris_mm=radius)) for radius in (8.55,4.275,2.1375)]
  cases.append(layout(Settings.parse(dict(iris_mm=4.275,rotation=31,blades=6,lens_edits=[[0,'curvature_radius',31.]]))))
  result=subprocess.run([shutil.which('node'),str(Path(__file__).with_name('check_iris_rays.js'))],input=json.dumps(cases),text=True,capture_output=True,timeout=15)
  self.assertEqual(result.returncode,0,result.stderr)
