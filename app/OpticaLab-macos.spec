# Run on macOS with native Python (arm64 or x86_64), not from Windows.
import sys,platform
from pathlib import Path
from PyInstaller.utils.hooks import copy_metadata
if sys.platform != 'darwin':raise RuntimeError('Build this spec on a macOS GitHub runner.')
root=Path(SPECPATH)
import ast,os
version=next(ast.literal_eval(n.value) for n in ast.parse((root/'app_version.py').read_text(encoding='utf-8')).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='VERSION' for t in n.targets))
datas=[(str(root/'DEPTH-MODELS.md'),'.'),(str(root/'THIRD-PARTY.md'),'.'),(str(root/'MACOS.md'),'.'),(str(root/'web'),'web'),(str(root/'data'),'data')]
datas += [(str(root/'optics'/name),'native/depth/worker') for name in ('depth_worker.py','model_cache.py','dvd_adapter.py','worker_status.py','depth_models.py','depth_errors.py','depth_setup_worker.py')]
for package in ('numpy','scipy','pillow','pywebview'):
    datas += copy_metadata(package)
a=Analysis([str(root/'desktop.py')],pathex=[str(root)],binaries=[],datas=datas,
 hiddenimports=['webview.platforms.cocoa','scipy.signal','scipy.spatial','scipy.ndimage'],
 excludes=['playwright','moderngl','torch','matplotlib','pytest','tkinter','webview.platforms.edgechromium','webview.platforms.winforms'],noarchive=False)
pyz=PYZ(a.pure)
exe=EXE(pyz,a.scripts,[],exclude_binaries=True,name='SimuladorDeDesfoque',debug=False,strip=False,upx=False,console=False,target_arch=platform.machine())
coll=COLLECT(exe,a.binaries,a.datas,strip=False,upx=False,name='SimuladorDeDesfoque')
app=BUNDLE(coll,name='SimuladorDeDesfoque.app',bundle_identifier='com.bruxosdovfx.opticalab',
 info_plist={'CFBundleShortVersionString':version,'CFBundleVersion':version,'NSHighResolutionCapable':True,
 'NSHumanReadableCopyright':'Bruxosdovfx','LSMinimumSystemVersion':os.environ.get('MACOSX_DEPLOYMENT_TARGET','15.0')})
