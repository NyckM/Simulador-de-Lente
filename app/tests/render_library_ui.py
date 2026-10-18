"""Isolated desktop interface: catalogue search and imported glass/CUDA."""
from render_desktop_ui import *

def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,args=['--use-angle=d3d11']);page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function("cudaRenderer?.stats?.backend==='cuda'&&!cudaPending",timeout=30000)
   assert page.locator('#preset option[value^=lv_]').count()==283
   page.locator('.lens-library summary').click();page.locator('#lens-search').fill('Summicron')
   assert page.locator('#lens-catalogue button').count()>=4
   page.locator('#lens-search').fill('Aero Ektar');assert page.locator('#lens-catalogue button').count()==1
   page.locator('#lens-catalogue button').click();page.wait_for_function("settings.lens_model==='lv_kodak_aero_ektar_6in_f35'&&gpu.data.lens_model===settings.lens_model&&!kernelBusy",timeout=30000)
   results=[]
   for model in ['lv_kodak_aero_ektar_6in_f35','lv_agfa_solagon_50mm_f2','lv_leica_summicron_r_50mm_f2']:
    page.locator('#preset').select_option(model);page.wait_for_function('(m)=>settings.lens_model===m&&gpu.data.lens_model===m&&!kernelBusy',arg=model,timeout=30000)
    result=page.evaluate("""async()=>{await draw({...LensQuality.modes[quality]});return {model:settings.lens_model,atlas:gpu.data.lens_model,focal:gpu.data.efl_mm,status:document.getElementById('status').textContent,error:gpu.gl.getError(),image:canvas.toDataURL()}}""")
    image=result.pop('image');assert result['model']==result['atlas']==model,result;assert result['error']==0;assert 'CUDA' in result['status'];results.append(result)
    (ROOT.parent/f'Library-0.9.2-{model}.png').write_bytes(base64.b64decode(image.split(',')[1]))
   page.locator('#optical-inspection summary').click();page.screenshot(path=str(ROOT.parent/'Library-0.9.2-interface.png'))
   page.reload(wait_until='domcontentloaded');page.wait_for_function("settings.lens_model==='lv_leica_summicron_r_50mm_f2'&&gpu?.data?.lens_model===settings.lens_model&&!kernelBusy",timeout=60000)
   assert not errors,errors
   (ROOT.parent/'Library-0.9.2-tests.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results));browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':main()
