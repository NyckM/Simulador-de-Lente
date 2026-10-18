import os,sys,json,time,threading
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root));out=root.parents[1]/'work/preview-resolution-test';out.mkdir(exist_ok=True);os.environ['OPTICA_USER_DATA']=str(out)
from http.server import ThreadingHTTPServer
from server import Handler
import webview
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
window=webview.create_window('Teste da prévia',f'http://127.0.0.1:{server.server_port}',width=1440,height=960,hidden=True)
result={}
def run():
 try:
  for _ in range(160):
   try:
    if window.evaluate_js("typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&source&&typeof complementBusy!=='undefined'"):break
   except Exception:pass
   time.sleep(.25)
  else:raise RuntimeError('Preview not ready')
  window.evaluate_js('''(async()=>{try{
    const results={};const options={limit:768,samples:256,aa:1};
    for(const backend of ['webgl','cuda']){
     demoRangeSettings={near:2,far:5};await loadDemo();settings={...defaults,near_m:2,far_m:5,invert_depth:false,focus_m:2,render_backend:backend};sync();await updateKernel();
     $('use-depth').checked=true;await draw(options);const before=canvas.toDataURL();
     $('near_m').value='.8';$('near_m').onchange();$('far_m').value='100';$('far_m').onchange();
     const controls=depthRange(),caption=$('depth-caption').textContent;
     $('focus-near').click();await draw(options);
     results[backend]={near:controls.near,far:controls.far,focus:settings.focus_m,imageChanged:before!==canvas.toDataURL(),caption,stored:JSON.parse(localStorage.getItem('optica-lab-v02')).demoRange};
     if(backend==='webgl'){results.before=before;results.after=canvas.toDataURL();}
     await loadDemo();results[backend].reloaded=depthRange();
    }
    window.previewTestResult=results;
   }catch(e){window.previewTestResult={error:e.message,stack:e.stack};}})()''')
  for _ in range(160):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  for backend in ['webgl','cuda']:
   r=result[backend];assert r['near']==.8 and r['far']==100 and r['focus']==.8 and r['imageChanged'],result
   assert r['stored']==r['reloaded']=={'near':.8,'far':100} and '100.00' in r['caption'],result
  import base64
  from PIL import Image,ImageDraw
  import io
  images=[Image.open(io.BytesIO(base64.b64decode(result.pop(k).split(',')[1]))).convert('RGB') for k in ['before','after']]
  picture=Image.new('RGB',(images[0].width*2,images[0].height+32),'#101813');d=ImageDraw.Draw(picture)
  for i,(im,label) in enumerate(zip(images,['Objeto / foco 2 m; fundo 5 m','Objeto / foco 0.8 m; fundo 100 m'])):picture.paste(im,(i*im.width,32));d.text((i*im.width+10,10),label,fill='white')
  picture.save(root.parent/'Depth-Distancias-0.9.6.6.png')
  result['success']=True
 except Exception as e:result.update(success=False,error=str(e))
 finally:(root.parent/'Depth-Distancias-0.9.6.6.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

