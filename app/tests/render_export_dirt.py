"""Real WebView bridge export with a controlled save-dialog boundary."""
import json,os,sys,threading,time
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root))
out=root.parents[1]/'work/export-dirt-test';out.mkdir(exist_ok=True)
os.environ['OPTICA_USER_DATA']=str(out/'app-data')
from http.server import ThreadingHTTPServer
from server import Handler
from desktop_export import JsonExporter
import webview

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
exporter=JsonExporter()
window=webview.create_window('Exportação e Lens Dirt',f'http://127.0.0.1:{server.server_port}/?desktop=1',hidden=True,js_api=exporter)
calls=[];destinations=[out/'Perfil de teste.json',out/'Projeto de teste.json',None,out/'inexistente'/'erro.json']
class Dialog:
    def create_file_dialog(self,kind,**kw):
        calls.append({'kind':kind,**kw});path=destinations[len(calls)-1]
        return (str(path),) if path else None
exporter._window=Dialog()
result={}
def run():
    try:
        for _ in range(160):
            try:
                if window.evaluate_js("typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&source&&!!window.pywebview?.api?.save_json"):break
            except Exception:pass
            time.sleep(.25)
        else:raise RuntimeError('WebView/bridge did not initialize')
        window.evaluate_js((root/'tests/check_export_dirt.js').read_text(encoding='utf-8'))
        for _ in range(600):
            value=window.evaluate_js('window.exportTestResult||null')
            if value:result.update(value);break
            time.sleep(.25)
        else:raise RuntimeError('Export/render test timed out')
        assert not result.get('error'),result
        profile=json.loads(destinations[0].read_text(encoding='utf-8'))
        project=json.loads(destinations[1].read_text(encoding='utf-8'))
        assert profile['name']=='Minha lente · distorção'
        assert profile['snapshot']['settings']==project['settings']
        assert len(calls)==4 and all(c['kind']==webview.FileDialog.SAVE for c in calls)
        assert result['cancelled'] and result['failed'] and result['pathConfirmed'],result
        assert result['dirtStable'] and result['disabledRestores'] and result['dirtChanges'] and result['dirtCUDAChanges'],result
        assert result['cudaDifference']<.005,result
        assert result['imported'] and result['resized'] and result['rotated'] and result['textureRestored'],result
        result.update(success=True,dialogCalls=calls,profilePath=str(destinations[0]),projectPath=str(destinations[1]))
    except Exception as exc:result.update(success=False,error=str(exc))
    finally:
        (root.parent/'Exportacao-Lens-Dirt-0.9.6.12.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        window.destroy()
webview.start(run,gui='edgechromium',private_mode=True)
server.shutdown();server.server_close();print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(0 if result.get('success') else 1)
