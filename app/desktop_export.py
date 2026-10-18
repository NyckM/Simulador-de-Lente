"""Save project/profile JSON through a native, user-selected file dialog."""
import json
from pathlib import Path
import threading
import os


class JsonExporter:
    def __init__(self):
        self._window = None
        self._lock = threading.Lock()
        self._prefs_lock = threading.Lock()
        folder = os.environ.get('OPTICA_USER_DATA')
        self._prefs = Path(folder) / 'ui-language.json' if folder else None
        self._language = self.get_ui_language().get('language') or 'pt-BR'

    def get_ui_language(self):
        with self._prefs_lock:
            try:
                value = json.loads(self._prefs.read_text(encoding='utf-8'))['language'] if self._prefs else None
                return {'language': value if value in ('pt-BR', 'en', 'zh-CN') else None}
            except (OSError, ValueError, KeyError, TypeError):
                return {'language': None}

    def set_language(self, language):
        if language not in ('pt-BR', 'en', 'zh-CN'):
            return {'error': 'Invalid language'}
        with self._prefs_lock:
            self._language = language
            if self._prefs:
                self._prefs.parent.mkdir(parents=True, exist_ok=True)
                self._prefs.write_text(json.dumps({'language': language}), encoding='utf-8')
            if self._window:
                title = {'pt-BR': 'Simulador de Desfoque da Bruxosdovfx', 'en': 'Bruxosdovfx Defocus Simulator', 'zh-CN': 'Bruxosdovfx 散焦模拟器'}[language]
                self._window.set_title(title)
        return {'language': language}

    def pick_depth_folder(self):
        if not self._lock.acquire(blocking=False):return {'error':'Já existe uma janela aberta.'}
        try:
            import webview
            selected=self._window.create_file_dialog(webview.FileDialog.FOLDER)
            if not selected:return {'cancelled':True}
            return {'path':str(Path(selected if isinstance(selected,str) else selected[0]))}
        finally:self._lock.release()

    def save_json(self, name, content):
        if not self._lock.acquire(blocking=False):
            return {'error': 'Já existe uma janela de salvamento aberta.'}
        try:
            if not isinstance(name, str) or '/' in name or '\\' in name or not name.endswith('.json'):
                raise ValueError('Nome de arquivo JSON inválido.')
            if not isinstance(content, str) or len(content.encode('utf-8')) > 8_000_000:
                raise ValueError('JSON muito grande ou inválido.')
            json.loads(content)
            import webview
            selected = self._window.create_file_dialog(
                webview.FileDialog.SAVE, save_filename=name,
                file_types=({'pt-BR': 'Arquivo JSON (*.json)', 'en': 'JSON file (*.json)', 'zh-CN': 'JSON 文件 (*.json)'}[self._language],),
            )
            if not selected:
                return {'cancelled': True}
            path = Path(selected if isinstance(selected, str) else selected[0])
            if not path.suffix:
                path = path.with_suffix('.json')
            # The native dialog confirms overwrites before returning a path.
            with path.open('w', encoding='utf-8', newline='\n') as stream:
                stream.write(content)
            return {'path': str(path)}
        except (OSError, ValueError, TypeError, RuntimeError) as exc:
            return {'error': 'Não foi possível salvar: ' + str(exc)}
        finally:
            self._lock.release()
