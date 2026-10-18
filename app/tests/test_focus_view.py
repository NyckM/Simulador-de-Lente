import json
from pathlib import Path
import shutil
import subprocess
import unittest
from optics.core import Settings, layout, get_lens


class FocusInteractionTests(unittest.TestCase):
    def test_diagram_model_and_drag_match_optical_focus(self):
        cases = [layout(Settings(focus_m=2, source_m=2)),
                 layout(Settings.parse({'focus_m': 2, 'filmback_mm': .4,
                                        'lens_edits': [[0, 'curvature_radius', 31.0]]}))]
        for data in cases:
            lens = get_lens(Settings.parse(data['settings']))
            a, b, c, d = data['focus_matrix']
            for meters in (.3, .5, 2, 5, 20):
                plane = data['last_z_mm']-(a+b/(meters*1000))/(c+d/(meters*1000))
                self.assertAlmostEqual(plane, lens.sensor_z(meters), places=4)
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Node.js necessário para o teste de interação do foco.')
        result = subprocess.run([node, str(Path(__file__).with_name('check_focus.js'))],
                                input=json.dumps(cases), text=True, capture_output=True,
                                timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr)

