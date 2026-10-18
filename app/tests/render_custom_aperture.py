import os,sys,json,time,threading,base64,io
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root));out=root.parents[1]/'work/custom-aperture-test';out.mkdir(exist_ok=True);os.environ['OPTICA_USER_DATA']=str(out)
from http.server import ThreadingHTTPServer
from server import Handler
import webview
from PIL import Image,ImageDraw,ImageFont
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
window=webview.create_window('Teste de abertura personalizada',f'http://127.0.0.1:{server.server_port}',width=1440,height=960,hidden=True)
result={}
def run():
 try:
  for _ in range(160):
   try:
    if window.evaluate_js("typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&source"):break
   except Exception:pass
   time.sleep(.25)
  else:raise RuntimeError('Preview not ready')
  code=(root/'tests/check_custom_aperture.js').read_text(encoding='utf-8');window.evaluate_js(code)
  for _ in range(480):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  images=result.pop('images');masks=result.pop('masks');canvas=Image.new('RGB',(640*4,450),'#101813');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',19)
  for i,(name,data) in enumerate(images.items()):
   im=Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGB');canvas.paste(im,(i*640,35));draw.text((i*640+10,5),name,font=font,fill='#b9efc8')
  canvas.save(root.parent/'Aberturas-Personalizadas-0.9.6.11.png')
  folder=root.parent/'Mascaras-de-Abertura';folder.mkdir(exist_ok=True)
  for name,data in masks.items():(folder/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
  assert result['inspectionChanges'] and result['imported'] and result['resized']==512 and result['profileRestored'] and result['disabledRestores'] and result['rotationChanges'] and result['clearWorks'],result
  assert result['shapeDifference']>.001 and result['cudaDifference']<.01,result
  assert all(r['near']>r['far']*1.05 for r in result['depthChecks']),result
  result['success']=True
 except Exception as e:result.pop('images',None);result.pop('masks',None);result.update(success=False,error=str(e)[:1500])
 finally:(root.parent/'Aberturas-Personalizadas-0.9.6.11.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)
