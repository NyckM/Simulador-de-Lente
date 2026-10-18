import json,os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch,Mock
from desktop_export import JsonExporter

class LanguageTests(unittest.TestCase):
 def test_language_survives_restart_and_updates_native_title(self):
  with tempfile.TemporaryDirectory() as folder,patch.dict(os.environ,{'OPTICA_USER_DATA':folder}):
   first=JsonExporter();first._window=Mock()
   self.assertEqual(first.set_language('zh-CN'),{'language':'zh-CN'})
   first._window.set_title.assert_called_once_with('Bruxosdovfx 散焦模拟器')
   self.assertEqual(JsonExporter().get_ui_language(),{'language':'zh-CN'})
   before=(Path(folder)/'ui-language.json').read_bytes()
   self.assertIn('error',first.set_language('../../other'))
   self.assertEqual(before,(Path(folder)/'ui-language.json').read_bytes())
 def test_export_file_type_follows_language(self):
  with tempfile.TemporaryDirectory() as folder,patch.dict(os.environ,{'OPTICA_USER_DATA':folder}):
   bridge=JsonExporter();bridge._window=Mock();bridge._window.create_file_dialog.return_value=None
   bridge.set_language('en');bridge.save_json('profile.json','{}')
   self.assertEqual(bridge._window.create_file_dialog.call_args.kwargs['file_types'],('JSON file (*.json)',))
 def test_invalid_preferences_fall_back(self):
  with tempfile.TemporaryDirectory() as folder,patch.dict(os.environ,{'OPTICA_USER_DATA':folder}):
   (Path(folder)/'ui-language.json').write_text(json.dumps({'language':'unsupported'}),encoding='utf-8')
   self.assertEqual(JsonExporter().get_ui_language(),{'language':None})

if __name__=='__main__':unittest.main()
