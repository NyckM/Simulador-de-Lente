"""Real imported image/map and checkbox through WebView, WebGL and CUDA."""
import os,sys,json,time,threading,base64,io
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root));out=root.parents[1]/'work/eclipse-viewer-test';out.mkdir(exist_ok=True);os.environ['OPTICA_USER_DATA']=str(out)
from http.server import ThreadingHTTPServer
from server import Handler
import webview
from PIL import Image,ImageDraw,ImageFont
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
window=webview.create_window('Eclipse no desfoque',f'http://127.0.0.1:{server.server_port}',hidden=True)
result={}
def run():
 try:
  for _ in range(160):
   try:
    if window.evaluate_js("typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&source"):break
   except Exception:pass
   time.sleep(.25)
  else:raise RuntimeError('Preview did not initialize')
  legacy=(root.parents[1]/'work/eclipse-legacy-gpu.js').read_text(encoding='utf-8')
  window.evaluate_js('window.LegacyLensGPU=new Function('+json.dumps(legacy+';return LensGPU;')+')()')
  window.evaluate_js((root/'tests/check_eclipse_slicing.js').read_text(encoding='utf-8'))
  for _ in range(1200):
   value=window.evaluate_js('window.eclipseTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Eclipse test timed out')
  assert not result.get('error'),result
  images=result.pop('images');canvas=Image.new('RGB',(1920,440),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20)
  for i,name in enumerate(['Antes · blur em mapas contínuos','Depois · eclipse por pupila','Depois · foco nas luzes']):
   im=Image.open(io.BytesIO(base64.b64decode(images[name].split(',')[1]))).convert('RGB');canvas.paste(im,(640*i,40));draw.text((640*i+12,8),name,font=font,fill='#b9efc8')
  canvas.save(root.parent/'Eclipse-Viewer-Comparacao-0.9.6.15.png')
  assert result['disabledRestores'] and result['stable'] and result['settingsPreserved'] and result['cudaActive'],result
  assert result['shapeDifference']>.0001 and result['focusChanges'],result
  assert result['cudaDifference']<.015 and result['waveDifference']<.015 and result['splitError']<.005,result
  result['success']=True
 except Exception as exc:result.pop('images',None);result.update(success=False,error=str(exc))
 finally:(root.parent/'Eclipse-Viewer-Teste-0.9.6.15.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(0 if result.get('success') else 1)
