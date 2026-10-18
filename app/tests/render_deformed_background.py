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
  window.evaluate_js('(async()=>{try{\n const p=ProfileStore.parse({"schema": "optica-lab/lens-profile/1", "name": "Fundo deformado \\u00b7 alongamento suave", "snapshot": {"settings": {"lens_model": "dgauss50", "ray_backend": "auto", "render_backend": "auto", "field_grid": 5, "focus_m": 0.8, "source_m": 20, "iris_mm": 8.55, "sensor_mm": 36, "filmback_mm": 0, "blades": 0, "rotation": 0, "soften_internal_cutoff": true, "iris_softness": 0.04, "dispersion": 0, "diffusion": 0, "swirl": 1.1, "coma": 0.65, "squeeze": 1.7, "exposure": 0, "near_m": 0.8, "far_m": 20, "invert_depth": false, "depth_channel": "r", "depth_gain": 1, "depth_bias": 0, "eclipse_bokeh": false, "depth_mode": "auto", "depth_slices": 24, "depth_cut": 0.5, "depth_feather": 0.02, "bokeh_gain": 1.8, "highlight_gain": 0, "bokeh_dither": false, "dither_amount": 1, "highlight_detail": false, "highlight_quality": 128, "highlight_threshold": 0.8, "highlight_view": "final", "impression": 0.12, "spherical3": 0, "spherical5": 0, "k1": 0, "k2": 0, "p1": 0, "p2": 0, "master_blend": 1, "apodization": 0.15, "rim_gain": 0, "ca_red": 0, "ca_blue": 0, "ca_axial": 0, "coating_strength": 0, "coating_nm": 550, "ghost_gain": 0, "diffraction_gain": 0, "diffraction_scale": 1, "shimmer_amount": 0, "shimmer_depth": 1, "shimmer_size": 8, "shimmer_density": 0.3, "shimmer_seed": 1, "shimmer_threshold": 0.15, "drops_amount": 0, "drops_depth": 1, "drops_size": 30, "drops_density": 0.5, "drops_refraction": 20, "drops_seed": 1, "lens_edits": []}, "quality": "high", "exportQuality": "veryhigh", "exportSize": "source", "fps": 24, "useDepth": true}});await validateSnapshot(p.snapshot);\n const photo=document.createElement(\'canvas\');photo.width=640;photo.height=400;const c=photo.getContext(\'2d\');c.fillStyle=\'#283c30\';c.fillRect(0,0,640,400);\n c.font=\'bold 80px Arial\';c.fillStyle=\'#a0aca0\';c.fillText(\'FUNDO\',40,180);c.fillText(\'LENTE\',280,310);\n for(let x=35;x<640;x+=110){c.fillStyle=\'#bcc4b0\';c.beginPath();c.arc(x,65,14,0,Math.PI*2);c.fill();c.fillStyle=\'#17271c\';c.fillRect(x,225,12,170);}\n c.fillStyle=\'#a26e3a\';c.fillRect(265,90,110,180);for(let y=100;y<260;y+=12){c.fillStyle=\'#eedcad\';c.fillRect(277,y,86,3);}\n const map=document.createElement(\'canvas\');map.width=640;map.height=400;const d=map.getContext(\'2d\');d.fillStyle=\'black\';d.fillRect(0,0,640,400);d.fillStyle=\'white\';d.fillRect(265,90,110,180);\n const file=async(canvas,name)=>new File([await new Promise(r=>canvas.toBlob(r,\'image/png\'))],name,{type:\'image/png\'});await openImage(await file(photo,\'foto.png\'));await openDepth(await file(map,\'depth.png\'));await restoreProfile(p);await updateKernel();\n const result={};const options={limit:640,samples:256,aa:1};\n for(const backend of [\'webgl\',\'cuda\']){settings.render_backend=backend;settings.swirl=0;settings.coma=0;settings.squeeze=1;await draw(options);const base=canvas.toDataURL();settings.swirl=p.snapshot.settings.swirl;settings.coma=p.snapshot.settings.coma;settings.squeeze=p.snapshot.settings.squeeze;await draw(options);result[backend]={changed:base!==canvas.toDataURL(),focus:settings.focus_m,useDepth:$(\'use-depth\').checked};if(backend===\'webgl\'){result.before=base;result.after=canvas.toDataURL();}}\n window.previewTestResult=result;\n}catch(e){window.previewTestResult={error:e.message,stack:e.stack};}})()')
  for _ in range(160):
   value=window.evaluate_js('window.previewTestResult||null')
   if value:result.update(value);break
   time.sleep(.25)
  else:raise RuntimeError('Test timed out')
  assert not result.get('error'),result
  for backend in ['webgl','cuda']:
   r=result[backend];assert r['changed'] and r['focus']==.8 and r['useDepth'],result
  import base64,io
  from PIL import Image,ImageDraw
  images=[Image.open(io.BytesIO(base64.b64decode(result.pop(k).split(',')[1]))).convert('RGB') for k in ['before','after']]
  picture=Image.new('RGB',(1280,432),'#101813');d=ImageDraw.Draw(picture)
  for i,(im,label) in enumerate(zip(images,['Desfoque sem modificadores de proporcao','Preset: alongamento + swirl + coma'])):picture.paste(im,(640*i,32));d.text((640*i+10,10),label,fill='white')
  picture.save(root.parent/'Fundo-Deformado-Comparacao.png')
  result['success']=True
 except Exception as e:result.update(success=False,error=str(e))
 finally:(root.parent/'Fundo-Deformado-Comparacao.json').write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
webview.start(run,gui='edgechromium',private_mode=True);server.shutdown();server.server_close();print(json.dumps(result,indent=2));sys.exit(0 if result.get('success') else 1)

