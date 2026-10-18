"""Atomic worker progress that tolerates Windows readers holding status.json."""
from pathlib import Path
import json, os, time, uuid

TERMINAL = {'complete', 'error', 'cancelled'}

def write_status(folder, data):
    folder = Path(folder)
    temporary = folder / ('status.' + uuid.uuid4().hex + '.tmp')
    terminal = data.get('state') in TERMINAL
    attempts = 50 if terminal else 12
    try:
        temporary.write_text(json.dumps(data), encoding='utf-8')
        for attempt in range(attempts):
            try:
                os.replace(temporary, folder / 'status.json')
                return True
            except OSError as exc:
                # Only retry sharing/access conflicts at replace. Folder/write
                # failures and unrelated errors must retain their diagnostic.
                transient = isinstance(exc, PermissionError) or getattr(exc, 'winerror', None) in (5, 32, 33)
                if not transient:
                    raise
                if attempt + 1 == attempts:
                    if terminal:
                        raise RuntimeError('Nao foi possivel salvar o resultado do depth: status.json permanece bloqueado. Feche o programa que esta usando o arquivo e tente novamente.') from exc
                    print('Depth: progresso temporariamente bloqueado; inferencia continua.', flush=True)
                    return False
                time.sleep(min(.05, .005 * (attempt + 1)))
    finally:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
