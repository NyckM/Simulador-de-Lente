"""Lens Dirt on a bright HDR source and a two-plane scene with real depth."""
import os,sys,json,time,threading,base64,io
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root));out=root.parents[1]/'work/lens-dirt-visual';out.mkdir(exist_ok=True)
os.environ['OPTICA_USER_DATA']=str(out)
from http.server import ThreadingHTTPServer
from server import Handler
import webview
from PIL import Image,ImageDraw,ImageFont
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
window=webview.create_window('Lens Dirt / profundidade',f'http://127.0.0.1:{server.server_port}',hidden=True)
result={}
def run():
 try:
  for _ in range(160):
   try:
    if window.evaluate_js("typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&source"):break
   except Exception:pass
   time.sleep(.25)
  else:raise RuntimeError('Preview did not initialize')
  window.evaluate_js((root/'tests/check_lens_dirt.js').read_text(encoding='utf-8'))
  for _ in range(600):
   value=window.evaluate_js('window.lensDirtTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Lens Dirt test timed out')
  assert not result.get('error'),result
  images=result.pop('images');font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20)
  for label,names in [('Comparacao',['Lente limpa','Somente obstrução','Manchas e halos']),('Depth',['Objeto em foco · Lens Dirt','Fundo em foco · Lens Dirt'])]:
   canvas=Image.new('RGB',(640*len(names),440),'#101813');draw=ImageDraw.Draw(canvas)
   for i,name in enumerate(names):
    im=Image.open(io.BytesIO(base64.b64decode(images[name].split(',')[1]))).convert('RGB')
    canvas.paste(im,(640*i,40));draw.text((640*i+12,8),name,font=font,fill='#b9efc8')
   canvas.save(root.parent/f'Lens-Dirt-{label}-0.9.6.12.png')
  assert result['zeroRestores'] and result['stable'] and result['blockingDarkens'] and result['haloBrightens'],result
  assert result['depthMapPreserved'] and result['inspectionUnchanged'],result
  assert all(check['nearContrast']>check['farContrast']*1.05 and check['dirtChanges'] for check in result['depthChecks']),result
  assert result['backendDifference']<.01,result
  result['success']=True
 except Exception as exc:result.pop('images',None);result.update(success=False,error=str(exc))
 finally:
  (root.parent/'Lens-Dirt-Depth-0.9.6.12.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(0 if result.get('success') else 1)
