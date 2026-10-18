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
   $('inspection-toggle').click();
   const wait=async()=>{for(let i=0;i<20;i++){if($('optical-lights').dataset.focus===String(settings.focus_m))return;await new Promise(r=>setTimeout(r,100));}throw Error(JSON.stringify({caption:$('optical-preview-caption').textContent,ready:!!window.opticalPreview,hidden:$('optical-inspection').hidden,state:window.opticalPreview?{revision:opticalPreview.revision,key:opticalPreview.key,renderer:!!opticalPreview.renderer}:null}));};
   await wait();const first=$('optical-lights').toDataURL();
   settings.focus_m=1.8;changed('focus_m');await wait();const second=$('optical-lights').toDataURL();
   const output=document.createElement('canvas');output.width=512;output.height=530;const c=output.getContext('2d');c.fillStyle='#101312';c.fillRect(0,0,512,530);c.drawImage($('optical-lights'),0,0,512,342);
   for(const [i,id]of ['optical-center','optical-edge','optical-front','optical-spot'].entries()){c.drawImage($(id),i*128,354,124,124);c.fillStyle='#b9c8be';c.font='11px Segoe UI';c.fillText(['Centro','Borda','Frente','Spot no foco'][i],i*128+8,500);}
   const previews={};for(const id of ['optical-center','optical-edge','optical-front','optical-spot']){const data=$(id).getContext('2d').getImageData(0,0,112,112).data;previews[id]=data.some((v,i)=>i%4!==3&&v>20);}
   $('inspection-toggle').click();const revision=$('optical-lights').dataset.revision;settings.focus_m=2;changed('focus_m');await new Promise(r=>setTimeout(r,800));
   window.previewTestResult={changed:first!==second,previews,closed:revision===$('optical-lights').dataset.revision,image:output.toDataURL(),caption:$('optical-preview-caption').textContent};
  }catch(e){window.previewTestResult={error:e.message,stack:e.stack};}})()''')
  for _ in range(160):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  assert result['changed'] and result['closed'] and all(result['previews'].values()),result
  import base64
  (root.parent/'Inspecao-Optica-0.9.6.4.png').write_bytes(base64.b64decode(result.pop('image').split(',')[1]))
  result['success']=True
 except Exception as e:result.update(success=False,error=str(e))
 finally:(root.parent/'Inspecao-Optica-0.9.6.4.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

