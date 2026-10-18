"""Exercise actual CUDA/WebGL interaction, settling and export precision."""
import os,sys,json,threading,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH',str(Path(__file__).resolve().parents[3]/'work/test-browsers'))
from http.server import ThreadingHTTPServer
from server import Handler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=d3d11'])
  page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}')
  page.wait_for_function("gpu?.ready&&!kernelBusy&&!kernelTimer&&canvas.dataset.previewStage==='final'&&!cudaPending",timeout=45000)
  page.evaluate("quality='high';settings.highlight_detail=true;settings.highlight_quality=512;sync();scheduleKernel();requestDraw()")
  page.wait_for_function("!kernelBusy&&!kernelTimer&&canvas.dataset.previewStage==='final'&&!cudaPending",timeout=45000)
  for backend in ['cuda','webgl']:
   page.evaluate("b=>{settings.render_backend=b;cudaFailed=false;document.getElementById('focus_m-range').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));settings.focus_m=5;requestDraw()}",backend)
   page.wait_for_function("canvas.dataset.previewStage==='interactive'&&!cudaPending",timeout=15000)
   page.wait_for_timeout(300)
   assert page.evaluate('canvas.dataset.previewStage')=='interactive'
   if backend=='cuda':assert page.evaluate('cudaRenderer.stats.samples')==24
   quick=page.evaluate("({width:canvas.width,height:canvas.height,frameMs:Number(canvas.dataset.frameMs),precision:cudaRenderer?.stats?.precision})")
   page.evaluate("document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
   page.wait_for_function("canvas.dataset.previewStage==='final'&&!cudaPending",timeout=20000)
   if backend=='cuda':
    assert page.evaluate('cudaRenderer.stats.samples')==512
    assert page.evaluate('cudaRenderer.stats.precision')=='float16'
   final=page.evaluate("({width:canvas.width,height:canvas.height,frameMs:Number(canvas.dataset.frameMs)})")
   comparison=page.evaluate("""async()=>{const preview=canvas.toDataURL();await draw({...LensQuality.modes.high});return {same:preview===canvas.toDataURL(),precision:cudaRenderer?.stats?.precision};}""")
   assert comparison['same'],comparison
   if backend=='cuda':assert comparison['precision']=='float32'
   results.append(dict(backend=backend,interactive=quick,final=final,comparison=comparison))
  assert not errors,errors
  page.screenshot(path=str(ROOT.parent/'Preview-0.9.5-interface.png'))
  browser.close()
finally:server.shutdown();server.server_close()
(ROOT.parent/'Preview-0.9.5-UI-tests.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
