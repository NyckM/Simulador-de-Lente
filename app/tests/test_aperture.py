import json
from pathlib import Path
import subprocess
import shutil
import unittest
import numpy as np
from optics.core import Settings,layout,aperture_info,get_lens

class ApertureTests(unittest.TestCase):
    def test_f_number_uses_the_entrance_pupil(self):
        s=Settings(iris_mm=8.55)
        a=aperture_info(s)
        self.assertAlmostEqual(a['f_number'],2.0301534,places=6)
        self.assertGreater(a['entrance_diameter_mm'],2*s.iris_mm)
        self.assertAlmostEqual(a['f_number']*a['entrance_diameter_mm'],get_lens(s).efl,places=9)
        smaller=aperture_info(Settings(iris_mm=s.iris_mm/2))
        self.assertAlmostEqual(smaller['f_number'],2*a['f_number'])
        self.assertAlmostEqual(smaller['entrance_diameter_mm'],a['entrance_diameter_mm']/2)

    def test_front_glass_edits_change_the_entrance_pupil(self):
        a=aperture_info(Settings())
        b=aperture_info(Settings.parse({'lens_edits':[[0,'curvature_radius',31.]]}))
        self.assertNotAlmostEqual(a['pupil_scale'],b['pupil_scale'],places=4)
        self.assertNotAlmostEqual(a['f_number'],b['f_number'],places=4)

    def test_ui_and_visual_drag_have_one_physical_radius(self):
        cases=[layout(Settings()),layout(Settings.parse({'lens_edits':[[0,'curvature_radius',31.]]}))]
        node=shutil.which('node');self.assertIsNotNone(node)
        result=subprocess.run([node,str(Path(__file__).with_name('check_aperture.js'))],input=json.dumps(cases),text=True,capture_output=True,timeout=15)
        self.assertEqual(result.returncode,0,result.stderr)

if __name__=='__main__':unittest.main()
