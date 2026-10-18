"""Desktop entry point; private local server with native platform webview."""
import argparse
import ctypes
import json
import logging
import os
from pathlib import Path
import sys
import threading
import time

from app_version import VERSION
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--smoke-test',type=Path);parser.add_argument('--ci-check',type=Path);args=parser.parse_args()
    if args.ci_check:
        from macos_validation import run
        return run(args.ci_check)
    from platform_support import user_data_dir,webview_backend
    user=user_data_dir()
    if args.smoke_test:user=args.smoke_test.resolve().parent/'desktop-test-data'
    user.mkdir(parents=True,exist_ok=True);os.environ['OPTICA_USER_DATA']=str(user)
    log=(user/'desktop.log').open('a',encoding='utf-8',buffering=1)
    sys.stdout=log;sys.stderr=log
    logging.basicConfig(stream=log,level=logging.INFO)
    mutex=None
    if os.name=='nt' and not args.smoke_test:
        api=ctypes.windll.kernel32;api.CreateMutexW.restype=ctypes.c_void_p
        mutex=api.CreateMutexW(None,False,'Local\\OpticaLabDesktop')
        if api.GetLastError()==183:
            ctypes.windll.user32.MessageBoxW(None,'O Simulador de Desfoque da Bruxosdovfx jÃ¡ estÃ¡ aberto.','Simulador de Desfoque da Bruxosdovfx',0);return 2
    from http.server import ThreadingHTTPServer
    from server import Handler
    import webview
    from desktop_export import JsonExporter
    webview.settings['ALLOW_DOWNLOADS']=True
    server=ThreadingHTTPServer(('127.0.0.1',0 if args.smoke_test else 8788),Handler)
    server.test_mode=False
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}/?desktop=1'
    exporter=JsonExporter()
    window=webview.create_window('Simulador de Desfoque da Bruxosdovfx',url,width=1440,height=960,min_size=(1000,700),hidden=bool(args.smoke_test),background_color='#101312',js_api=exporter)
    exporter._window=window
    result={}
    def smoke():
        try:
            for _ in range(120):
                try:
                    ready=window.evaluate_js("typeof gpu!=='undefined' && gpu?.ready && !kernelBusy")
                    if ready:break
                except Exception:pass
                time.sleep(.25)
            else:
                state=window.evaluate_js("({gpu:typeof gpu,ready:typeof gpu!=='undefined'&&gpu?.ready,status:document.getElementById('status')?.textContent,message:document.getElementById('messages')?.textContent})")
                raise RuntimeError('Desktop preview timed out: '+json.dumps(state))
            # A hidden WebView throttles requestAnimationFrame; explicitly draw
            # through the same production renderer during the smoke test.
            window.evaluate_js("requestDraw=()=>{};cudaRenderer?.cancelPreview();draw({...LensQuality.modes[quality],limit:384,samples:64,preview:true}).then(()=>{window.desktopSmokeReady=true}).catch(e=>{window.desktopSmokeError=e.message})")
            for _ in range(120):
                if window.evaluate_js('window.desktopSmokeReady===true'):break
                time.sleep(.25)
            else:raise RuntimeError('Desktop frame timed out: '+json.dumps(window.evaluate_js("({error:window.desktopSmokeError,status:document.getElementById('status')?.textContent,messages:document.getElementById('messages')?.textContent,pending:!!drawTask,cuda:cudaInfo})")))
            result.update(window.evaluate_js("({title:document.title,p2:settings.p2,backend:cudaRenderer?.stats?.backend,isolated:cudaRenderer?.stats?.isolated,workerGeneration:cudaRenderer?.stats?.workerGeneration,status:document.getElementById('status').textContent,width:canvas.width,height:canvas.height,tabs:document.querySelectorAll('.control-tabs button').length,complements:!!document.getElementById('install-complements')&&typeof refreshComplements==='function'})"))
            if not result.get('isolated') or result.get('backend')!='cuda' or result.get('tabs')!=7 or not result.get('complements'):raise RuntimeError('Desktop CUDA/layout not active')
            window.evaluate_js((Path(__file__).resolve().parent/'web/v1-smoke.js').read_text(encoding='utf-8'))
            for _ in range(480):
                value=window.evaluate_js('window.v1TestResult||null')
                if value:break
                time.sleep(.25)
            else:raise RuntimeError('V1 filters/depth smoke timed out')
            result['v1']=value
            if not value.get('passed'):raise RuntimeError('V1 smoke failed: '+json.dumps(value))
            if os.environ.get('OPTICA_ASTIGMATISM_SMOKE'):
                window.evaluate_js((Path(__file__).resolve().parent/'web/astigmatism-smoke.js').read_text(encoding='utf-8'))
                for _ in range(1200):
                    if window.evaluate_js('!!window.astigmatismTestResult'):break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged astigmatism test timed out')
                result['astigmatism']=window.evaluate_js('window.astigmatismTestResult')
                result['astigmatism'].pop('images',None)
                report=result['astigmatism']
                if report.get('error') or not all(report.get(key) for key in ['neutral','startsAtOne','negativeSelected','signPreservesMagnitude','profileRestored','manualSignSync','manualMagnitudePreserved','changed','locked','busyGuard','stable','settingsPreserved','zeroRestores','cudaActive']) or report['negativeDifference']>.002 or report['positiveDifference']>.002:raise RuntimeError('Packaged astigmatism modes failed: '+json.dumps(report))
            if os.environ.get('OPTICA_LIGHT_SMOKE'):
                window.evaluate_js((Path(__file__).resolve().parent/'web/light-smoke.js').read_text(encoding='utf-8'))
                for _ in range(1200):
                    if window.evaluate_js('!!window.lightTestResult'):break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged light deformation timed out')
                result['light']=window.evaluate_js('window.lightTestResult')
                result['light'].pop('images',None)
                report=result['light']
                if report.get('error') or not all(report.get(key) for key in ['changed','stable','settingsPreserved','profileRestored','focusChanges','zeroRestores','cudaActive']) or report['cudaDifference']>.002:raise RuntimeError('Packaged light deformation failed: '+json.dumps(report))
            if os.environ.get('OPTICA_ECLIPSE_SMOKE'):
                window.evaluate_js("(async()=>{try{const input=document.createElement('canvas');input.width=640;input.height=400;input.getContext('2d').drawImage(source,0,0,640,400);await openImage(new File([await new Promise(r=>input.toBlob(r,'image/png'))],'Cena de teste.png',{type:'image/png'}));const map=document.createElement('canvas');map.width=640;map.height=400;const ctx=map.getContext('2d');ctx.fillStyle='rgb(25,25,25)';ctx.fillRect(0,0,640,400);ctx.fillStyle='rgb(204,204,204)';ctx.fillRect(230,70,180,280);const blob=await new Promise(r=>map.toBlob(r,'image/png'));await openDepth(new File([blob],'Depth contÃ­nuo.png',{type:'image/png'}));settings.depth_mode='auto';settings.focus_m=1;settings.bokeh_gain=6;settings.eclipse_bokeh=false;await draw({limit:640,samples:256,aa:1});const before=canvas.toDataURL(),mapBefore=depth;$('eclipse-bokeh').checked=true;$('eclipse-bokeh').onchange();for(let i=0;i<240;i++){if(!kernelBusy&&!kernelTimer)break;await new Promise(r=>setTimeout(r,50));}await draw({limit:640,samples:256,aa:1});window.desktopEclipseResult={changed:before!==canvas.toDataURL(),active:settings.eclipse_bokeh,depthPreserved:mapBefore===depth&&$('use-depth').checked,mode:settings.depth_mode,continuous:gpu.depthBinary.r===false,focus:settings.focus_m,backend:cudaRenderer?.stats?.backend};}catch(e){window.desktopEclipseResult={error:e.message};}})()")
                for _ in range(120):
                    value=window.evaluate_js('window.desktopEclipseResult||null')
                    if value:result['eclipse']=value;break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged eclipse timed out')
                if not value.get('changed') or not value.get('active') or not value.get('continuous') or not value.get('depthPreserved') or value.get('mode')!='auto' or value.get('focus')!=1 or value.get('backend')!='cuda':raise RuntimeError('Packaged eclipse failed: '+json.dumps(value))
            if os.environ.get('OPTICA_SHIMMER_SMOKE'):
                window.evaluate_js("(async()=>{try{const input=document.createElement('canvas'),mapCopy=document.createElement('canvas');input.width=mapCopy.width=640;input.height=mapCopy.height=400;const ctx=input.getContext('2d');ctx.drawImage(source,0,0,640,400);ctx.fillStyle='white';for(const x of [100,530])for(const y of [90,200,310])ctx.fillRect(x-2,y-2,5,5);mapCopy.getContext('2d').drawImage(depth,0,0,640,400);await openImage(new File([await new Promise(r=>input.toBlob(r,'image/png'))],'Highlights LDR.png',{type:'image/png'}));await openDepth(new File([await new Promise(r=>mapCopy.toBlob(r,'image/png'))],'Depth de teste.png',{type:'image/png'}));settings.shimmer_depth=1;settings.shimmer_amount=0;settings.shimmer_threshold=.6;await draw({limit:640,samples:256,aa:1});const before=canvas.toDataURL(),map=depth,focus=settings.focus_m;$('shimmer_amount').value=4;$('shimmer_amount').onchange();$('shimmer_prism').value=.25;$('shimmer_prism').onchange();$('normalize-shimmer').checked=true;$('normalize-shimmer').onchange();for(let i=0;i<240;i++){if(!kernelBusy&&!kernelTimer)break;await new Promise(r=>setTimeout(r,50));}await draw({limit:640,samples:256,aa:1});window.desktopShimmerResult={changed:before!==canvas.toDataURL(),amount:settings.shimmer_amount,prism:settings.shimmer_prism,normalized:settings.shimmer_normalize,depthPreserved:map===depth&&$('use-depth').checked,focusPreserved:settings.focus_m===focus,backend:cudaRenderer?.stats?.backend};}catch(e){window.desktopShimmerResult={error:e.message};}})()")
                for _ in range(120):
                    value=window.evaluate_js('window.desktopShimmerResult||null')
                    if value:result['shimmer']=value;break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged shimmer timed out')
                if not value.get('changed') or not value.get('depthPreserved') or not value.get('focusPreserved') or not value.get('normalized') or value.get('amount')!=4 or value.get('prism')!=.25 or value.get('backend')!='cuda':raise RuntimeError('Packaged shimmer failed: '+json.dumps(value))
            if os.environ.get('OPTICA_WAVE_SMOKE'):
                window.evaluate_js("(async()=>{try{settings.focus_m=2;settings.bokeh_gain=6;document.getElementById('use-depth').checked=true;await draw({limit:640,samples:256,aa:1});const before=canvas.toDataURL(),map=depth;settings.ghost_gain=39.6;settings.diffraction_gain=1.1;settings.diffraction_scale=4.5;await draw({limit:640,samples:256,aa:1});window.desktopWaveResult={changed:before!==canvas.toDataURL(),depthPreserved:map===depth&&document.getElementById('use-depth').checked,focus:settings.focus_m,backend:cudaRenderer?.stats?.backend};}catch(e){window.desktopWaveResult={error:e.message};}})()")
                for _ in range(120):
                    value=window.evaluate_js('window.desktopWaveResult||null')
                    if value:result['wave']=value;break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged wave timed out')
                if not value.get('changed') or not value.get('depthPreserved') or value.get('focus')!=2 or value.get('backend')!='cuda':raise RuntimeError('Packaged wave failed: '+json.dumps(value))
            if os.environ.get('OPTICA_SWIRL_SMOKE'):
                window.evaluate_js("(async()=>{try{settings.focus_m=2;settings.bokeh_gain=2.5;document.getElementById('use-depth').checked=true;await draw({limit:640,samples:256,aa:1});const before=canvas.toDataURL(),model=settings.lens_model,map=depth;document.getElementById('apply-swirl-look').click();for(let i=0;i<240;i++){if(!kernelBusy&&!kernelTimer)break;await new Promise(r=>setTimeout(r,50));}await draw({limit:640,samples:256,aa:1});window.desktopSwirlResult={changed:before!==canvas.toDataURL(),swirl:settings.swirl,vignette:settings.vignette_amount,focus:settings.focus_m,depthPreserved:map===depth&&document.getElementById('use-depth').checked,modelPreserved:model===settings.lens_model};}catch(e){window.desktopSwirlResult={error:e.message};}})()")
                for _ in range(120):
                    value=window.evaluate_js('window.desktopSwirlResult||null')
                    if value:result['swirl']=value;break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged swirl timed out')
                if not value.get('changed') or not value.get('depthPreserved') or not value.get('modelPreserved') or value.get('focus')!=2 or value.get('swirl')!=1.8 or value.get('vignette')!=.8:raise RuntimeError('Packaged swirl failed: '+json.dumps(value))
            if os.environ.get('OPTICA_EXPORT_SMOKE'):
                export_paths=[]
                class SmokeDialog:
                    def create_file_dialog(self,kind,**kwargs):
                        if kind!=webview.FileDialog.SAVE:raise RuntimeError('Expected SAVE dialog')
                        path=user/kwargs['save_filename'];export_paths.append(path)
                        return (str(path),)
                exporter._window=SmokeDialog()
                window.evaluate_js("(async()=>{try{await document.getElementById('export-profile').onclick();await document.getElementById('save-settings').onclick();window.desktopExportReady=true;}catch(e){window.desktopExportError=e.message;window.desktopExportReady=true;}})()")
                for _ in range(120):
                    if window.evaluate_js('window.desktopExportReady===true'):break
                    time.sleep(.25)
                else:raise RuntimeError('Packaged JSON export timed out')
                if len(export_paths)!=2:raise RuntimeError('Packaged save dialog not called twice')
                exported=[json.loads(path.read_text(encoding='utf-8')) for path in export_paths]
                if exported[0]['snapshot']['settings']!=exported[1]['settings']:raise RuntimeError('Exported settings differ')
                result['export']={'dialog':'SAVE (controlled test destination)','paths':[str(path) for path in export_paths],'message':window.evaluate_js("document.getElementById('messages').textContent"),'downloads_enabled':webview.settings['ALLOW_DOWNLOADS']}
                if not result['export']['message'].startswith('Arquivo salvo em:'):raise RuntimeError('Saved path confirmation missing')
                exporter._window=window
            aperture_file=os.environ.get('OPTICA_APERTURE_SMOKE_MASK')
            if aperture_file:
                import base64
                encoded=base64.b64encode(Path(aperture_file).read_bytes()).decode()
                window.evaluate_js("(async()=>{try{const bytes=Uint8Array.from(atob("+json.dumps(encoded)+"),c=>c.charCodeAt(0));await openAperture(new File([bytes],'Teste.png',{type:'image/png'}));for(let i=0;i<240;i++){if(!kernelBusy&&!kernelTimer)break;await new Promise(r=>setTimeout(r,50));}await draw({limit:768,samples:256,aa:1});window.desktopApertureReady=true;}catch(e){window.desktopApertureError=e.message;window.desktopApertureReady=true;}})()")
                for _ in range(120):
                    if window.evaluate_js('window.desktopApertureReady===true'):break
                    time.sleep(.25)
                else:raise RuntimeError('Custom aperture timed out')
                result['aperture']=window.evaluate_js("({active:settings.aperture_custom,imported:!!settings.aperture_mask,trace:atlas.trace_backend,error:window.desktopApertureError})")
                if not result['aperture'].get('active') or not result['aperture'].get('imported') or result['aperture'].get('error'):raise RuntimeError('Packaged custom aperture failed')
            depth_model=os.environ.get('OPTICA_DEPTH_SMOKE_MODEL')
            if depth_model:
                if depth_model not in ('da2','da3','moge','dvd','moge3','marigold2'):raise ValueError('Invalid depth smoke model')
                window.evaluate_js("(async()=>{try{document.getElementById('depth-model').value="+json.dumps(depth_model)+";await document.getElementById('generate-depth').onclick();window.desktopDepthFinished=true;}catch(e){window.desktopDepthError=e.message;window.desktopDepthFinished=true;}})()")
                for _ in range(600):
                    if window.evaluate_js('window.desktopDepthFinished===true'):break
                    time.sleep(1)
                else:raise RuntimeError('Depth generation timed out')
                result['depth']=window.evaluate_js("({state:depthInfo?.state,model:depthInfo?.model,width:depthInfo?.width,height:depthInfo?.height,enabled:document.getElementById('use-depth').checked,message:document.getElementById('depth-progress').textContent,error:window.desktopDepthError})")
                from optics import jobs
                result['depth_worker']=str(jobs.DEPTH_WORKER)
                if result['depth'].get('state')!='complete' or result['depth'].get('model')!=depth_model:raise RuntimeError('Packaged depth failed: '+json.dumps(result['depth']))
            if os.environ.get('OPTICA_LANGUAGE_SMOKE')=='1':
                before=window.evaluate_js('JSON.stringify(settings)')
                result['languages']=[]
                for language,expected in [('en','Export PNG'),('zh-CN','å¯¼å‡º PNG'),('pt-BR','Exportar PNG')]:
                    window.evaluate_js("document.getElementById('app-language').value="+json.dumps(language)+";document.getElementById('app-language').onchange();")
                    record=window.evaluate_js("({language:document.documentElement.lang,exportLabel:document.getElementById('export').textContent,saved:localStorage.getItem('bruxos-language'),menuTop:document.querySelector('.controls').firstElementChild.classList.contains('language-picker')})")
                    record['settingsPreserved']=window.evaluate_js('JSON.stringify(settings)')==before
                    if record['language']!=language or record['exportLabel']!=expected or record['saved']!=language or not record['menuTop'] or not record['settingsPreserved']:raise RuntimeError('Packaged language test failed: '+json.dumps(record))
                    result['languages'].append(record)
            if os.environ.get('OPTICA_ANIMATION_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/animation-smoke.js').read_text(encoding='utf-8'))
                for _ in range(480):
                    value=window.evaluate_js('window.animationTestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Animation smoke timed out')
                result['animation']=value
                if not value.get('success'):raise RuntimeError('Packaged animation failed: '+json.dumps(value))
            if os.environ.get('OPTICA_FLARE_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/lens-flare-smoke.js').read_text(encoding='utf-8'))
                for _ in range(480):
                    value=window.evaluate_js('window.flareTestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Lens Flare packaged render timed out')
                result['lens_flare']=value
                if not value.get('success'):raise RuntimeError('Lens Flare packaged render failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE10_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage10-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage10TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 10 packaged render timed out')
                result['stage10']=value
                if value.get('error') or not value.get('success'):raise RuntimeError('Stage 10 packaged render failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE11_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage11-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage11TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 11 packaged wavefront timed out')
                result['stage11']=value
                if not value.get('success'):raise RuntimeError('Stage 11 packaged wavefront failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE12_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage12-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage12TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 12 packaged spectral PSF timed out')
                result['stage12']=value
                if not value.get('success'):raise RuntimeError('Stage 12 packaged spectral PSF failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE13_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage13-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage13TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 13 packaged depth test timed out')
                result['stage13']=value
                if not value.get('success'):raise RuntimeError('Stage 13 packaged depth failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE15_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage15-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage15TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 15 packaged layers test timed out')
                result['stage15']=value
                if not value.get('success'):raise RuntimeError('Stage 15 packaged layers failed: '+json.dumps(value))
            if os.environ.get('OPTICA_STAGE16_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/stage16-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.stage16TestResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Stage 16 packaged ghosts test timed out')
                result['stage16']=value
                if not value.get('success'):raise RuntimeError('Stage 16 packaged ghosts failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY026_SMOKE')=='1':
                window.evaluate_js('window.geometry026Job='+json.dumps(os.environ['OPTICA_GEOMETRY026_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry026-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry026Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.26 test timed out')
                result['geometry026']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.26 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY025_SMOKE')=='1':
                window.evaluate_js('window.geometry025Job='+json.dumps(os.environ['OPTICA_GEOMETRY025_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry025-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry025Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.25 test timed out')
                result['geometry025']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.25 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY024_SMOKE')=='1':
                window.evaluate_js('window.geometry024Job='+json.dumps(os.environ['OPTICA_GEOMETRY024_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry024-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry024Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.24 test timed out')
                result['geometry024']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.24 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY023_SMOKE')=='1':
                window.evaluate_js('window.geometry023Job='+json.dumps(os.environ['OPTICA_GEOMETRY023_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry023-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry023Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.23 test timed out')
                result['geometry023']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.23 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY022_SMOKE')=='1':
                window.evaluate_js('window.geometry022Job='+json.dumps(os.environ['OPTICA_GEOMETRY022_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry022-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry022Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.22 test timed out')
                result['geometry022']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.22 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY021_SMOKE')=='1':
                window.evaluate_js('window.geometry021Job='+json.dumps(os.environ['OPTICA_GEOMETRY021_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry021-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry021Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.21 test timed out')
                result['geometry021']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.21 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY020_SMOKE')=='1':
                window.evaluate_js('window.geometry020Job='+json.dumps(os.environ['OPTICA_GEOMETRY020_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry020-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry020Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.18 test timed out')
                result['geometry020']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.18 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY019_SMOKE')=='1':
                window.evaluate_js('window.geometry019Job='+json.dumps(os.environ['OPTICA_GEOMETRY019_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry019-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry019Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.18 test timed out')
                result['geometry019']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.18 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY018_SMOKE')=='1':
                window.evaluate_js('window.geometry018Job='+json.dumps(os.environ['OPTICA_GEOMETRY018_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry018-smoke.js').read_text(encoding='utf-8'))
                for _ in range(600):
                    value=window.evaluate_js('window.geometry018Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry render 0.9.18 test timed out')
                result['geometry018']=value
                if not value.get('success'):raise RuntimeError('Geometry render 0.9.18 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_GEOMETRY017_SMOKE')=='1':
                window.evaluate_js('window.geometry017Job='+json.dumps(os.environ['OPTICA_GEOMETRY017_JOB']))
                window.evaluate_js((Path(__file__).resolve().parent/'web/geometry017-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.geometry017Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Geometry 0.9.17 packaged test timed out')
                result['geometry017']=value
                if not value.get('success'):raise RuntimeError('Geometry 0.9.17 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_DEPTH_RANGE016_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/depth-range016-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.depthRange016Result||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Depth range 0.9.16 packaged test timed out')
                result['depth_range016']=value
                if not value.get('success'):raise RuntimeError('Depth range 0.9.16 failed: '+json.dumps(value))
            if os.environ.get('OPTICA_DEPTH_EDIT_SMOKE')=='1':
                result['depth_edit']=window.evaluate_js("(()=>{document.querySelector('[data-panel=focus]').click();document.getElementById('depth-mode').closest('details').open=true;const input=document.getElementById('di-cut-m'),saved=settings.depth_cut;input.focus();input.value='';depthInspector.sync();const empty=input.value==='';input.value='3,';depthInspector.sync();const partial=input.value==='3,';input.value='3,73';input.onchange();const comma=Math.abs(DepthUtils.meters(1-settings.depth_cut,settings.near_m,settings.far_m)-3.73)<1e-8;input.value='4.25';input.onchange();const point=Math.abs(DepthUtils.meters(1-settings.depth_cut,settings.near_m,settings.far_m)-4.25)<1e-8;input.value='';input.onchange();const invalid=Math.abs(DepthUtils.meters(1-settings.depth_cut,settings.near_m,settings.far_m)-4.25)<1e-8;input.blur();settings.depth_cut=saved;depthInspector.sync();return {empty,partial,comma,point,invalid};})()")
                if not all(result['depth_edit'].values()):raise RuntimeError('Packaged depth edit failed: '+json.dumps(result['depth_edit']))
            if os.environ.get('OPTICA_FOCUS_PRESERVATION_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/focus-preservation-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.focusPreservationResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Focus preservation smoke timed out')
                result['focus_preservation']=value
                if not value.get('passed'):raise RuntimeError('Focus preservation failed: '+json.dumps(value))
            if os.environ.get('OPTICA_ANIMATION_OPTICS_SMOKE')=='1':
                window.evaluate_js((Path(__file__).resolve().parent/'web/animation-optics-smoke.js').read_text(encoding='utf-8'))
                for _ in range(240):
                    value=window.evaluate_js('window.animationOpticsResult||null')
                    if value:break
                    time.sleep(.25)
                else:raise RuntimeError('Animation optics smoke timed out')
                result['animation_optics']=value
                if not value.get('passed'):raise RuntimeError('Animation optics failed: '+json.dumps(value))
            result['success']=True
        except Exception as exc:result.update(success=False,error=str(exc))
        finally:
            args.smoke_test.write_text(json.dumps(result,indent=2),encoding='utf-8');window.destroy()
    try:
        webview.start(smoke if args.smoke_test else None,gui=webview_backend(),private_mode=bool(args.smoke_test),storage_path=str(user/'webview'))
    finally:
        from optics import depth_setup,jobs,geometry_render
        from optics import cuda_worker
        cuda_worker.shutdown()
        geometry_render.shutdown()
        if depth_setup.busy():depth_setup.cancel()
        jobs.shutdown()
        server.shutdown();server.server_close()
        if mutex:ctypes.windll.kernel32.CloseHandle(ctypes.c_void_p(mutex))
    return 0 if not args.smoke_test or result.get('success') else 1
if __name__=='__main__':
    import multiprocessing
    multiprocessing.freeze_support()
    try:sys.exit(main())
    except Exception as exc:
        logging.exception('Desktop startup failed')
        if os.name=='nt':ctypes.windll.user32.MessageBoxW(None,f'NÃ£o foi possÃ­vel abrir o aplicativo.\n{exc}','Simulador de Desfoque da Bruxosdovfx',0x10)
        sys.exit(1)
