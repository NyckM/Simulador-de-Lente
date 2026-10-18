"""Isolated browser integration: CUDA, WebGL fallback, controls and PNG output."""
from pathlib import Path
import sys,os,json,threading,base64
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH',str(Path(__file__).resolve().parents[3]/'work/test-browsers'))
from http.server import ThreadingHTTPServer
from server import Handler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{server.server_port}'
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,args=['--use-angle=d3d11'])
   page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   requests=[];page.on('response',lambda r:requests.append([r.url.split('/')[-1],r.status]));page.on('requestfailed',lambda r:requests.append([r.url,r.failure]))
   page.goto(url);
   try:page.wait_for_function("typeof cudaRenderer!=='undefined'&&cudaRenderer?.stats?.backend==='cuda'&&!cudaPending",timeout=30000)
   except Exception:
    print(json.dumps({'errors':errors,'requests':requests,'state':page.evaluate("({gpu:typeof gpu,pending:!!cudaPending,key:cudaRenderer?.uploadKey,stats:cudaRenderer?.stats,busy:kernelBusy,draws:gpu?.draws,available:typeof cudaInfo!=='undefined'?cudaInfo:null,status:document.getElementById('status')?.textContent,message:document.getElementById('messages')?.textContent})")}),flush=True)
    raise
   results=[]
   def probe(label):
    result=page.evaluate("""async()=>{await draw({...LensQuality.modes[quality]});const gl=gpu.gl,p=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,p);let min=255,max=0;for(let i=0;i<p.length;i+=4){min=Math.min(min,p[i]);max=Math.max(max,p[i]);}return {min,max,error:gl.getError(),backend:settings.render_backend,status:document.getElementById('status').textContent,cuda:cudaRenderer.stats,image:canvas.toDataURL()};}""")
    image=result.pop('image');assert result['max']-result['min']>50,result;assert result['error']==0,result
    (ROOT.parent/f'Desktop-0.9.1-{label}.png').write_bytes(base64.b64decode(image.split(',')[1]));results.append(dict(case=label,**result))
   assert page.locator('.control-tabs button').count()==5
   probe('cuda')
   page.locator('.control-tabs button[data-panel=effects]').click()
   page.locator('details').filter(has=page.locator('#impression')).locator('summary').click()
   page.locator('#impression').fill('-1');page.locator('#impression').dispatch_event('change');probe('negative')
   assert page.evaluate('settings.impression')==-1
   page.locator('#render-backend').select_option('webgl');probe('negative-webgl');assert 'CUDA' not in results[-1]['status']
   page.locator('#impression').fill('1');page.locator('#impression').dispatch_event('change');probe('positive-webgl')
   page.locator('#render-backend').select_option('cuda');probe('positive-cuda')
   page.reload(wait_until='domcontentloaded');page.wait_for_function("typeof cudaRenderer!=='undefined'&&cudaRenderer?.stats?.backend==='cuda'&&!cudaPending",timeout=30000)
   assert page.evaluate('settings.impression')==1, 'Character was not persisted'
   page.locator('.control-tabs button[data-panel=lens]').click();page.locator('#reset-profile').click()
   page.wait_for_function('settings.impression===0',timeout=15000)
   page.screenshot(path=str(ROOT.parent/'Desktop-0.9.1-interface.png'))
   page.locator('.control-tabs button[data-panel=focus]').click();page.locator('#reset').click();probe('reset')
   page.locator('details').filter(has=page.locator('#use-depth')).locator('summary').click();page.locator('#use-depth').check();probe('depth');assert results[-1]['cuda']['depthMode']=='cut'
   page.locator('#focus_m').fill('5');page.locator('#focus_m').dispatch_event('change');probe('focus-far')
   page.locator('#render-backend').select_option('webgl');probe('webgl');assert 'CUDA' not in results[-1]['status']
   page.locator('#render-backend').select_option('cuda');probe('cuda-return');assert 'CUDA' in results[-1]['status']
   page.locator('#export-size').select_option('1920')
   with page.expect_download() as pending:page.locator('#export').click()
   download=pending.value;download.save_as(str(ROOT.parent/'Desktop-0.9.1-export.png'))
   from PIL import Image
   assert Image.open(ROOT.parent/'Desktop-0.9.1-export.png').size==(1920,1200)
   page.reload(wait_until='domcontentloaded');page.wait_for_function("typeof cudaRenderer!=='undefined'&&cudaRenderer?.stats?.backend==='cuda'&&!cudaPending",timeout=30000);probe('reload')
   # Native layout must fit a smaller desktop without horizontal overflow.
   page.set_viewport_size({'width':1100,'height':760});page.screenshot(path=str(ROOT.parent/'Desktop-0.9.1-1100px.png'))
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Horizontal overflow'
   assert not errors,errors
   (ROOT.parent/'Desktop-0.9.1-tests.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results))
   browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':main()
