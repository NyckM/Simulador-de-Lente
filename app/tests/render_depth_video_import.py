"""External depth video: timeline sync, CUDA/WebGL and fixed export frames."""
from pathlib import Path
import sys,os,threading
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT));os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(ROOT.parents[1]/'work/test-browsers')
from server import Handler
from http.server import ThreadingHTTPServer
from playwright.sync_api import sync_playwright
MEDIA=ROOT.parents[1]/'work/depth-import-test'
MEDIA.mkdir(exist_ok=True)
import subprocess
from optics.jobs import ffmpeg
for name,flt in [('source','null'),('depth',"geq=lum='if(lt(T,1),32,224)':cb=128:cr=128")]:
 subprocess.run([ffmpeg(),'-y','-v','error','-f','lavfi','-i','testsrc2=size=160x96:rate=10:duration=2','-vf',flt,'-c:v','libx264','-pix_fmt','yuv420p',str(MEDIA/(name+'.mp4'))],check=True)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=d3d11']);page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('gpu?.ready&&sourceKind==="demo"',timeout=60000)
  page.select_option('#render-backend','webgl');page.set_input_files('#video-input',str(MEDIA/'source.mp4'));page.wait_for_function('sourceKind==="video"&&video.readyState>=2&&sourceW===160')
  page.set_input_files('#depth-input',str(MEDIA/'depth.mp4'));page.wait_for_function('!!importedDepthVideo&&document.getElementById("use-depth").checked',timeout=30000)
  def sample(t,backend):
   return page.evaluate("""async ([t,backend])=>{settings.render_backend=backend;await seekFrame(t);await draw({limit:160,samples:24,aa:1,preview:true,stage:'test'});const b=importedDepthVideo,d=b.map.getContext('2d').getImageData(0,0,1,1).data;return {value:d[0],sourceTime:video.currentTime,depthTime:b.element.currentTime,revision:gpu.depthRevision,backend:backend};}""",[t,backend])
  results=[sample(0,'webgl'),sample(1.2,'webgl'),sample(.3,'webgl'),sample(1.5,'cuda')]
  assert results[0]['value']<50 and results[1]['value']>200 and results[2]['value']<50 and results[3]['value']>200,results
  for r in results:assert abs(r['sourceTime']-r['depthTime'])<.001,r
  assert page.evaluate('cudaRenderer.stats.backend')=='cuda'
  page.evaluate('video.play()');page.wait_for_timeout(300);page.evaluate('video.pause()');sample(1.3,'webgl')
  page.evaluate("async()=>{await seekFrame(.2);await draw({limit:160,samples:24,aa:1,upscale:true});}")
  assert page.evaluate("importedDepthVideo.map.getContext('2d').getImageData(0,0,1,1).data[0]")<50
  page.evaluate('loadDemo()');page.wait_for_function('sourceKind==="demo"&&!importedDepthVideo')
  assert not errors,errors
  print('PASS: imported MP4 depth changes per frame, forward/reverse seeking, playback, CUDA/WebGL, export mode and source cleanup.',results)
  browser.close()
finally:server.shutdown();server.server_close()
