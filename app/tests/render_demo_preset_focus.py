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
  window.evaluate_js("(async()=>{try{\n const rows=[];const models=['physical','sonnar_50','kino_100','lv_viltrox_af_75mm_f12_pro','lv_rodenstock_apo_sironar_w_150f56','lv_pentax_f_85_f28_soft'];\n demoRangeSettings={near:2,far:5};await loadDemo();\n const measure=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);const pixels=ctx.getImageData(Math.round(c.width*.43),Math.round(c.height*.48),Math.round(c.width*.14),Math.round(c.height*.25)).data;let n=0,sum=0,sq=0;for(let i=0;i<pixels.length;i+=4){n++;sum+=pixels[i+2];sq+=pixels[i+2]**2;}return Math.sqrt(Math.max(0,sq/n-(sum/n)**2));};\n for(const backend of ['webgl','cuda'])for(const model of models){\n  settings={...defaults,render_backend:backend,focus_m:.8,source_m:5,near_m:2,far_m:5};$('preset').value=model;await applyPreset();clearTimeout(kernelTimer);kernelTimer=null;while(kernelBusy)await new Promise(r=>setTimeout(r,20));await updateKernel();\n  $('use-depth').checked=true;$('use-depth').onchange();const enabledFocus=settings.focus_m;\n  $('focus-near').click();await draw({limit:768,samples:256,aa:1});const near=measure(),nearImage=canvas.toDataURL();\n  $('focus-far').click();await draw({limit:768,samples:256,aa:1});const far=measure();\n  let stopped=null;if(model.includes('soft')){const a=LensView.aperture(displayedLensData,settings.iris_mm);$('aperture-fnumber').value=String(a.fNumber*4);$('aperture-fnumber').onchange();clearTimeout(kernelTimer);kernelTimer=null;while(kernelBusy)await new Promise(r=>setTimeout(r,20));await updateKernel();$('focus-near').click();await draw({limit:768,samples:256,aa:1});const closedNear=measure();$('focus-far').click();await draw({limit:768,samples:256,aa:1});stopped={near:closedNear,far:measure()};}\n  rows.push({model,backend,enabledFocus,near,far,stopped,calibration:atlas.focus_calibration,depth:$('use-depth').checked});\n  if(backend==='webgl'&&model==='kino_100'){window.nearDemoImage=nearImage;window.farDemoImage=canvas.toDataURL();}\n }\n window.previewTestResult={rows,nearImage:window.nearDemoImage,farImage:window.farDemoImage};\n}catch(e){window.previewTestResult={error:e.message,stack:e.stack};}})()")
  for _ in range(160):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  for r in result['rows']:
   assert r['enabledFocus']==2 and r['depth'],r
   if r['stopped']:assert r['stopped']['near']>r['near'] and r['stopped']['near']>r['stopped']['far']*1.03,r
   else:assert r['near']>r['far']*1.03,r
  import base64,io
  from PIL import Image,ImageDraw
  images=[Image.open(io.BytesIO(base64.b64decode(result.pop(k).split(',')[1]))).convert('RGB') for k in ['nearImage','farImage']]
  picture=Image.new('RGB',(1536,512),'#101813');draw=ImageDraw.Draw(picture)
  for i,(im,label) in enumerate(zip(images,['Kino-Plasmat / foco no objeto / 2 m','Kino-Plasmat / foco nas luzes / 5 m'])):picture.paste(im,(i*768,32));draw.text((i*768+10,10),label,fill='white')
  picture.save(root.parent/'Demo-Foco-Depth-0.9.6.8.png')
  result['success']=True
 except Exception as e:result.update(success=False,error=str(e))
 finally:
  result.pop('nearImage',None);result.pop('farImage',None)
  (root.parent/'Demo-Foco-Depth-0.9.6.8.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

