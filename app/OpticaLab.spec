# Build with: python -m PyInstaller --noconfirm OpticaLab.spec
from pathlib import Path
root=Path(SPECPATH)
datas=[(str(root/'DEPTH-MODELS.md'),'.'),(str(root/'THIRD-PARTY.md'),'.'),(str(root/'native/depth/bootstrap'),'native/depth/bootstrap'),(str(root/'native/media/LICENSE.txt'),'native/media'),(str(root/'web'),'web'),(str(root/'data'),'data'),(str(root/'native/vulkan/bin/lens.spv'),'native/vulkan/bin')]
datas += [(str(root/'optics'/name),'native/depth/worker') for name in ('depth_worker.py','model_cache.py','dvd_adapter.py','worker_status.py','depth_models.py','depth_errors.py','depth_setup_worker.py')]
binaries=[(str(root/'native/cuda/bin/optica_cuda.dll'),'native/cuda/bin'),(str(root/'native/vulkan/bin/optica_vk.dll'),'native/vulkan/bin')]
for name in ('ffmpeg.exe',):
    p=root/'native/media'/name
    if p.exists():binaries.append((str(p),'native/media'))
a=Analysis([str(root/'desktop.py')],pathex=[str(root)],binaries=binaries,datas=datas,hiddenimports=['webview.platforms.edgechromium','webview.platforms.winforms','scipy.signal','scipy.spatial','scipy.ndimage'],excludes=['playwright','moderngl','torch','matplotlib','pytest','tkinter'],noarchive=False)
pyz=PYZ(a.pure)
exe=EXE(pyz,a.scripts,[],exclude_binaries=True,name='SimuladorDeDesfoque',debug=False,bootloader_ignore_signals=False,strip=False,upx=False,console=False,icon=str(root/'native/app.ico'))
coll=COLLECT(exe,a.binaries,a.datas,strip=False,upx=False,name='SimuladorDeDesfoque')
