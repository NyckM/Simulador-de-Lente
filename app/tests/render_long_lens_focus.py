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
    clearTimeout(refineTimer);previewEpoch++;
    settings.focus_m=.3;$('preset').value='lv_yashica_ml_300mm_f56';await applyPreset();await updateKernel();const limits={focus:settings.focus_m,min:Number($('focus_m').min),sensor:displayedLensData.sensor_z_mm,last:displayedLensData.last_z_mm};if(limits.focus!==2||limits.sensor<=limits.last)throw Error(JSON.stringify(limits));
    const selectedModel=settings.lens_model,selectedIris=settings.iris_mm;const results={limits};const options={limit:640,samples:256,aa:1};
    for(const backend of ['webgl','cuda']){
     settings={...defaults,lens_model:selectedModel,iris_mm:selectedIris,render_backend:backend,bokeh_gain:4,near_m:3,far_m:12,invert_depth:false,depth_mode:'auto'};
     const photo=document.createElement('canvas');photo.width=320;photo.height=200;const c=photo.getContext('2d');c.fillStyle='#14202c';c.fillRect(0,0,320,200);c.fillStyle='#b26934';c.fillRect(120,35,80,130);for(let x=125;x<195;x+=8){c.fillStyle='#faf0b0';c.fillRect(x,60,4,70);}c.fillStyle='#fff9a1';c.fillRect(40,60,3,3);
     const map=document.createElement('canvas');map.width=320;map.height=200;const d=map.getContext('2d');d.fillStyle='#000';d.fillRect(0,0,320,200);d.fillStyle='#fff';d.fillRect(120,35,80,130);
     const file=async(canvas,name)=>new File([await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))],name,{type:'image/png'});
     await openImage(await file(photo,'foto.png'));await openDepth(await file(map,'depth.png'));await updateKernel();clearTimeout(refineTimer);
     const look=JSON.stringify([settings.bokeh_gain,settings.impression,settings.swirl,settings.coma,settings.spherical3,settings.iris_mm]);
     settings.focus_m=12;await draw(options);const before=canvas.toDataURL();
     $('pick-depth-focus').click();const r=canvas.getBoundingClientRect();$('image-stage').dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+r.width*.5,clientY:r.top+r.height*.5,button:0,bubbles:true}));
     for(let i=0;i<30&&focusPicking;i++)await new Promise(r=>setTimeout(r,50));await draw(options);
     results[backend]={focus:settings.focus_m,depth:$('use-depth').checked,photo:sourceKind==='image',lookPreserved:look===JSON.stringify([settings.bokeh_gain,settings.impression,settings.swirl,settings.coma,settings.spherical3,settings.iris_mm]),imageChanged:before!==canvas.toDataURL()};
     if(backend==='webgl')results.image=canvas.toDataURL();
     // The same click must work after zooming the viewer.
     zoomState.scale=2;applyZoom();settings.focus_m=12;$('pick-depth-focus').click();const z=canvas.getBoundingClientRect();$('image-stage').dispatchEvent(new PointerEvent('pointerdown',{clientX:z.left+z.width*.5,clientY:z.top+z.height*.5,button:0,bubbles:true}));for(let i=0;i<30&&focusPicking;i++)await new Promise(r=>setTimeout(r,50));results[backend].zoomFocus=settings.focus_m;resetZoom();
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
   r=result[backend];assert r['focus']==3 and r['zoomFocus']==3 and r['depth'] and r['photo'] and r['lookPreserved'] and r['imageChanged'],result
  import base64
  (root.parent/'Foco-Lente-300mm-0.9.6.5.png').write_bytes(base64.b64decode(result.pop('image').split(',')[1]))
  result['success']=True
 except Exception as e:result.update(success=False,error=str(e))
 finally:(root.parent/'Foco-Lente-300mm-0.9.6.5.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

