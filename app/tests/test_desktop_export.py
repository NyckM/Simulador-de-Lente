import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

from desktop_export import JsonExporter


class ExportTests(unittest.TestCase):
    def test_chosen_path_and_unicode_are_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'Minha lente favorita.json'
            exporter=JsonExporter();exporter._window=Mock()
            exporter._window.create_file_dialog.return_value=(str(path),)
            text=json.dumps({'name':'Abertura e distorção','mask':'data:image/png;base64,ABC'},ensure_ascii=False,indent=2)
            result=exporter.save_json('perfil.json',text)
            self.assertEqual(result,{'path':str(path)})
            self.assertEqual(path.read_text(encoding='utf-8'),text)
            import webview
            exporter._window.create_file_dialog.assert_called_once_with(webview.FileDialog.SAVE,save_filename='perfil.json',file_types=('Arquivo JSON (*.json)',))

    def test_cancel_does_not_create_files(self):
        exporter=JsonExporter();exporter._window=Mock()
        exporter._window.create_file_dialog.return_value=None
        self.assertEqual(exporter.save_json('perfil.json','{}'),{'cancelled':True})

    def test_write_failure_is_reported_without_success(self):
        with tempfile.TemporaryDirectory() as folder:
            exporter=JsonExporter();exporter._window=Mock()
            exporter._window.create_file_dialog.return_value=(str(Path(folder)/'inexistente'/'perfil.json'),)
            result=exporter.save_json('perfil.json','{}')
            self.assertIn('error',result);self.assertNotIn('path',result)

    def test_invalid_payload_is_rejected_before_dialog(self):
        exporter=JsonExporter();exporter._window=Mock()
        for name,content in [('../x.json','{}'),('x.json','invalido'),('x.json',' '*8_000_001)]:
            self.assertIn('error',exporter.save_json(name,content))
        exporter._window.create_file_dialog.assert_not_called()

    def test_parallel_save_cannot_open_second_dialog(self):
        exporter=JsonExporter();exporter._window=Mock();exporter._lock.acquire()
        try:self.assertIn('error',exporter.save_json('perfil.json','{}'))
        finally:exporter._lock.release()
        exporter._window.create_file_dialog.assert_not_called()
