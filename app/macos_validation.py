"""Headless validation executed in source and inside each frozen desktop app.
This checks packaging/server/CPU optics. It does NOT claim WebGL or GUI testing.
"""
from pathlib import Path
import json,os,sys,tempfile,threading,urllib.request,platform

def run(destination):
    report={'passed':False,'platform':sys.platform,'architecture':platform.machine(),'guiTested':False,'webglTested':False,'aiDepthBundled':False}
    try:
        with tempfile.TemporaryDirectory(prefix='bruxos-ci-') as temp:
            os.environ['OPTICA_USER_DATA']=temp
            os.environ['OPTICA_RAY_BACKEND']='cpu'
            import numpy as np
            from platform_support import user_data_dir,webview_backend
            from optics.core import Settings
            from optics.preview import kernel
            import server
            root=Path(server.__file__).resolve().parent
            for name in ['web/index.html','web/gpu.js','web/i18n-catalog.js','web/depth-inspector.js','web/layers.js','web/layer-panel.js','web/reflected-ghosts.js','data/dgauss50mm.json']:
                assert (root/name).is_file(),name
            assert webview_backend('win32')=='edgechromium'
            assert webview_backend('darwin') is None
            assert user_data_dir('darwin').as_posix().endswith('Library/Application Support/Bruxosdovfx/OpticaLab')
            settings=Settings(field_grid=3,ray_backend='cpu')
            atlas=kernel(settings,taps=32,rays=1024)
            assert np.isfinite(atlas['atlas']).all()
            assert max(atlas['pupils'][2::4])>0
            http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
            thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
            try:
                base='http://127.0.0.1:'+str(http.server_port)
                with urllib.request.urlopen(base+'/api/health',timeout=20) as reply:health=json.load(reply)
                with urllib.request.urlopen(base+'/',timeout=20) as reply:assert b'gpu.js' in reply.read()
                if sys.platform=='darwin':
                    from optics import complements
                    assert complements.status()['installed'] is False
                    try:complements.start()
                    except ValueError:pass
                    else:raise AssertionError('Windows depth installer must not execute on macOS')
            finally:http.shutdown();http.server_close();thread.join(timeout=5)
            from app_version import VERSION
            from optics.ghosts import analyze
            from optics.depth_mapping import prepare
            ghosts=analyze(settings,[0,0],5,1024,8)
            assert ghosts['families'], 'Missing reflected paths'
            depth=prepare(np.array([0,.5,1],dtype='f4'),settings)
            assert np.isfinite(depth['distance_m']).all()
            report.update(passed=True,version=VERSION,assets=True,localServer=True,cpuOpticalAtlas=True,
                          reflectedGhosts=True,depthInterpretation=True,health=health,backend=webview_backend())
    except Exception as exc:
        import traceback
        report['error']=repr(exc);report['traceback']=traceback.format_exc()
    destination=Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(report,indent=2),encoding='utf-8')
    return 0 if report['passed'] else 1
