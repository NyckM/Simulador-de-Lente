import unittest
from unittest.mock import patch
from pathlib import Path
from platform_support import user_data_dir,webview_backend
from optics import complements

class Platforms(unittest.TestCase):
    def test_mac_preferences_outside_application(self):
        self.assertEqual(user_data_dir('darwin'),Path.home()/'Library/Application Support/Bruxosdovfx/OpticaLab')
    def test_windows_renderer_preserved(self):
        self.assertEqual(webview_backend('win32'),'edgechromium')
        self.assertIsNone(webview_backend('darwin'))
    def test_mac_never_installs_windows_depth_runtime(self):
        with patch('sys.platform','darwin'):
            self.assertIsNone(complements.runtime())
            self.assertEqual(complements.status()['state'],'unavailable')
            with self.assertRaises(ValueError):complements.start()
