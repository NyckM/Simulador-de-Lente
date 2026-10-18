import os,sys,json,time,threading,base64
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
  window.evaluate_js('(async()=>{try{\n $(\'inspection-toggle\').click();demoRangeSettings={near:2,far:5};await loadDemo();settings={...defaults,focus_m:2,near_m:2,far_m:5,render_backend:\'webgl\'};await updateKernel();$(\'use-depth\').checked=true;$(\'use-depth\').onchange();\n const wait=async()=>{for(let i=0;i<160;i++){if(!layoutBusy&&!layoutTimer&&!kernelBusy&&!kernelTimer&&lensDraftEdits===null){await draw({limit:768,samples:256,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error(\'Geometry update timed out\');};\n await wait();const before=canvas.toDataURL(),initialEfl=displayedLensData.efl_mm,initialFill=diagram.querySelector(\'.glass-volume\').getAttribute(\'points\');\n const input=$(\'prescription-table\').querySelector(\'input[data-index="0"][data-field="curvature_radius"]\');input.focus();const original=Number(input.value);input.value=(original*1.08).toFixed(2);input.dispatchEvent(new Event(\'input\',{bubbles:true}));await wait();\n const changed={edits:settings.lens_edits.map(x=>[...x]),eflChanged:Math.abs(displayedLensData.efl_mm-initialEfl)>.001,imageChanged:before!==canvas.toDataURL(),glassChanged:initialFill!==diagram.querySelector(\'.glass-volume\').getAttribute(\'points\'),focusKept:document.activeElement===input};\n const row2=$(\'prescription-table\').tBodies[0].rows[1];row2.querySelector(\'button\').click();const selected=$(\'glass-surface\').value;\n const thickness=row2.querySelector(\'input[data-field="thickness"]\');const thicknessOriginal=Number(thickness.value);thickness.value=(thicknessOriginal+.25).toFixed(2);thickness.dispatchEvent(new Event(\'change\',{bubbles:true}));await wait();\n const afterThickness=settings.lens_edits.some(([i,f])=>i===1&&f===\'thickness\');\n const note=$(\'prescription-status\').textContent;const svgData=new XMLSerializer().serializeToString(diagram);const tableRows=[...$(\'prescription-table\').tBodies[0].rows].map(row=>({index:row.dataset.index,selected:row.classList.contains(\'selected\'),values:[...row.querySelectorAll(\'input\')].map(x=>x.value)}));\n $(\'glass-reset\').click();await wait();const restored={edits:settings.lens_edits.length,efl:Math.abs(displayedLensData.efl_mm-initialEfl)<1e-6};\n window.previewTestResult={changed,selected,afterThickness,restored,glassVolumes:diagram.querySelectorAll(\'.glass-volume\').length,surfaces:tableRows.length,expectedSurfaces:displayedLensData.surfaces.length,tableRows,svg:svgData,note};\n}catch(e){window.previewTestResult={error:e.message,stack:e.stack};}})()')
  for _ in range(160):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  assert all(result['changed'][key] for key in ['eflChanged','imageChanged','glassChanged','focusKept']),result
  assert result['selected']=='1' and result['afterThickness'],result
  assert result['restored']['edits']==0 and result['restored']['efl'],result
  assert result['glassVolumes']>0 and result['surfaces']==result['expectedSurfaces'],result
  preview=window.evaluate_js('''(async()=>{const xml=new XMLSerializer().serializeToString(diagram);const img=new Image();await new Promise((ok,fail)=>{img.onload=ok;img.onerror=fail;img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml)));});const c=document.createElement('canvas');c.width=1300;c.height=380;const ctx=c.getContext('2d');ctx.fillStyle='#111713';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);window.glassPreviewPng=c.toDataURL('image/png');})()''')
  for _ in range(40):
   preview=window.evaluate_js('window.glassPreviewPng||null')
   if preview:break
   time.sleep(.1)
  (root.parent/'Inspecao-Vidros-0.9.6.9.png').write_bytes(base64.b64decode(preview.split(',',1)[1]))
  (root.parent/'Inspecao-Vidros-0.9.6.9.svg').write_text(result.pop('svg'),encoding='utf-8')
  result['success']=True
 except Exception as e:result.pop('svg',None);result.update(success=False,error=str(e)[:300])
 finally:(root.parent/'Inspecao-Vidros-0.9.6.9.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

