"""Real app/WebGL regression in an isolated Chromium test profile.
Does not attach to the user browser or read its storage. Dev-only: playwright.
"""
from pathlib import Path
import json,os,base64
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH',str(Path(__file__).resolve().parents[3]/'work/test-browsers'))
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PROBE="""async () => {
 await draw();const c=document.getElementById('gpu-canvas'),gl=gpu.gl;
 const pixels=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 let min=255,max=0,total=0;for(let i=0;i<pixels.length;i+=4){min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);total+=pixels[i];}
 return {width:c.width,height:c.height,min,max,mean:total/(c.width*c.height),error:gl.getError(),p2:settings.p2,depth:document.getElementById('use-depth').checked,image:c.toDataURL()};
}"""
def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--use-angle=d3d11'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.on('requestfailed',lambda r:errors.append(r.url+' '+str(r.failure)))
  page.goto('http://127.0.0.1:8766/')
  def ready():page.wait_for_function("typeof gpu!=='undefined' && gpu?.ready && !kernelBusy && Number(document.getElementById('gpu-canvas').dataset.drawCount)>0",timeout=15000)
  results=[]
  def check(label):
   ready();result=page.evaluate(PROBE);image=result.pop('image')
   (ROOT.parent/('Browser-Preview-0.8.9-'+label+'.png')).write_bytes(base64.b64decode(image.split(',')[1]))
   assert result['error']==0,result
   assert result['max']-result['min']>50,(label,result)
   results.append(dict(case=label,**result))
  check('startup')
  page.locator('#reset').click();check('reset')
  page.locator('#reset-profile').click();check('profile-reset')
  page.locator('details').filter(has=page.locator('#use-depth')).locator('summary').click()
  page.locator('#use-depth').check();check('depth')
  page.evaluate("document.getElementById('use-depth').checked=false;delete settings.p2")
  check('legacy-missing-p2')
  page.evaluate("persist()")
  page.reload(wait_until='networkidle')
  try:check('legacy-reload')
  except Exception:
   print(json.dumps({'errors':errors,'body':page.locator('body').inner_text()[-1500:]}),flush=True)
   raise
  assert page.evaluate('settings.p2')==0
  assert not errors,errors
  (ROOT.parent/'Browser-Preview-0.8.9.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
  print(json.dumps(dict(results=results,errors=errors)))
  browser.close()
if __name__=='__main__':main()
