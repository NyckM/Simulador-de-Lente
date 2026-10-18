"""Desktop platform paths and webview selection, without importing a GUI."""
import os,sys
from pathlib import Path

def user_data_dir(platform=None):
    platform=sys.platform if platform is None else platform
    if platform=='darwin':return Path.home()/'Library/Application Support/Bruxosdovfx/OpticaLab'
    if platform=='win32':return Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'OpticaLab'
    return Path(os.environ.get('XDG_DATA_HOME',str(Path.home()/'.local/share')))/'OpticaLab'

def webview_backend(platform=None):
    platform=sys.platform if platform is None else platform
    return 'edgechromium' if platform=='win32' else None
