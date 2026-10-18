"""Local-only desktop prototype UI. No remote uploads or external assets."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from io import BytesIO
import base64
import json
import time
import argparse
from app_version import VERSION
import threading
import webbrowser
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from optics.core import Settings, render, diagnostics, layout, make_psf, srgb_decode, srgb_encode
from optics.preview import kernel,binary_kernel
from optics import vulkan
from optics import cuda_worker as cuda
from optics import jobs, complements
import re

ROOT = Path(__file__).resolve().parent
RENDER_LOCK = threading.Lock()
Image.MAX_IMAGE_PIXELS = 25_000_000


def encode_image(rgb):
    out = BytesIO()
    Image.fromarray(np.uint8(np.clip(rgb,0,1)*255+.5)).save(out, format='PNG')
    return 'data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()


def decode_image(data, limit, depth=False, channel='luma'):
    if not isinstance(data,str) or not data.startswith('data:image/') or ',' not in data:
        raise ValueError('Imagem inválida. Use PNG ou JPEG.')
    raw = base64.b64decode(data.split(',',1)[1], validate=True)
    im = Image.open(BytesIO(raw))
    if im.format not in ('PNG','JPEG','WEBP'):
        raise ValueError('Formato suportado: PNG, JPEG ou WebP.')
    if im.width*im.height > 25_000_000 or min(im.size) < 16:
        raise ValueError('Use uma imagem de 16 pixels a 25 megapixels.')
    im = ImageOps.exif_transpose(im)
    original_size = im.size
    if depth:
        # Grayscale depth only. 16-bit PNG gets its full numeric range.
        if im.mode.startswith('I'):
            a = np.asarray(im,dtype=np.float32)/65535
            im = Image.fromarray(a)
        else:
            if channel not in ('r','g','b','a','luma'):
                raise ValueError('Canal de depth desconhecido.')
            if channel=='luma':
                rgba=np.asarray(im.convert('RGBA'),dtype=np.float32)/255
                im=Image.fromarray(rgba[...,:3]@np.array([.2126,.7152,.0722],dtype=np.float32))
            else:
                im=im.convert('RGBA').getchannel({'r':'R','g':'G','b':'B','a':'A'}[channel])
        im.thumbnail((limit,limit), Image.Resampling.NEAREST)
        result = np.asarray(im,dtype=float)
        if im.mode != 'F':
            result /= 255
        if result.min() < 0 or result.max() > 1:
            raise ValueError('Depth deve ser normalizado entre preto e branco.')
    else:
        # The MVP accepts display-referred sRGB, and explicitly composites alpha on black.
        im = im.convert('RGBA')
        bg = Image.new('RGBA',im.size,(0,0,0,255))
        im = Image.alpha_composite(bg,im).convert('RGB')
        im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
        result = srgb_decode(np.asarray(im,dtype=float)/255)
    return result, original_size


def demo(width=768):
    h = int(width* .625)
    y,x = np.mgrid[:h,:width]
    rgb = np.empty((h,width,3), dtype=float)
    rgb[:] = [.007,.014,.024]
    rgb += (y/h)[...,None]*np.array([.022,.009,.005])
    rng = np.random.default_rng(28)
    # Deterministic HDR point field reveals the physical off-axis PSFs.
    for i in range(85):
        cx,cy = rng.uniform(.03,.97)*width,rng.uniform(.07,.87)*h
        r = rng.uniform(.65,1.9)*width/768
        spot = np.exp(-((x-cx)**2+(y-cy)**2)/(2*r*r))
        tint = np.array([1.,.48,.12]) if i%3 else np.array([.16,.65,1.])
        rgb += spot[...,None]*tint*rng.uniform(2,10)
    # Foreground test card at 2m, background lights at 5m (depth shown separately).
    card = Image.new('L',(width,h),0)
    d = ImageDraw.Draw(card)
    box = (int(width*.39),int(h*.25),int(width*.61),int(h*.82))
    d.rounded_rectangle(box,radius=int(width*.015),fill=230)
    d.rectangle((int(width*.44),int(h*.18),int(width*.56),int(h*.3)),fill=180)
    for i in range(12):
        xx = int(width*(.405+i*.016))
        d.line((xx,int(h*.43),xx,int(h*.65)),fill=30,width=max(1,int(width*.007)))
    a = np.asarray(card)/255
    silhouette = a > 0
    rgb[silhouette] = a[silhouette,None]*np.array([.19,.28,.24])
    depth = np.zeros((h,width))
    depth[silhouette] = 1
    return rgb, depth


_demo_payload_lock=threading.Lock()
_demo_payload=None

def demo_payloads():
    """The two scene endpoints share one deterministic generation and encoding."""
    global _demo_payload
    with _demo_payload_lock:
        if _demo_payload is None:
            rgb,depth=demo()
            rgba=np.concatenate((rgb,np.ones((*rgb.shape[:2],1))),axis=-1).astype('<f4')
            _demo_payload=({'image':encode_image(srgb_encode(rgb)), 'depth':encode_image(depth),
                            'width':rgb.shape[1], 'height':rgb.shape[0]},rgba.tobytes())
        return _demo_payload


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def send(self, status, body, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers()
        self.wfile.write(body)

    def send_file(self,path,content_type):
        self.send_response(200);self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(path.stat().st_size));self.send_header('Cache-Control','no-store');self.end_headers()
        with path.open('rb') as f:
            import shutil
            shutil.copyfileobj(f,self.wfile,length=1024*1024)

    def json(self, obj, status=200):
        self.send(status,json.dumps(obj,allow_nan=False).encode())

    def local_request(self):
        host = self.headers.get('Host','')
        expected = f'127.0.0.1:{self.server.server_port}'
        if host != expected:
            return False
        origin = self.headers.get('Origin')
        return origin is None or origin == f'http://{expected}'

    def do_GET(self):
        if not self.local_request():
            self.json({'error':'Host inválido'},403)
            return
        path = self.path.split('?')[0]
        if path.startswith('/api/geometry/render/'):
            from optics.geometry_render import status
            try:self.json(status(path.rsplit('/',1)[-1]))
            except ValueError as exc:self.json({'error':str(exc)},400)
            return
        if path=='/api/depth/operation':
            from optics.depth_setup import status
            self.json(status());return
        if path=='/api/depth/models':
            from optics.depth_runtime import catalog
            self.json(catalog());return
        if path=='/api/materials':
            from optics.materials import catalog
            self.json(catalog());return
        if getattr(self.server,'test_mode',False) and path=='/test-video.mp4':self.send(200,(jobs.WORK/'test-video.mp4').read_bytes(),'video/mp4');return
        if getattr(self.server,'test_mode',False) and path=='/test-integration':self.send(200,(ROOT/'tests/web-integration.html').read_bytes(),'text/html; charset=utf-8');return
        if path.startswith('/api/jobs/'):
            try:
                parts=path.split('/');key=parts[3];item=parts[4]
                if item=='status':self.json(jobs.status(key));return
                if re.fullmatch(r'geometry-view-[0-9]{6}\.bin',item):
                    from optics.geometry_view import encode
                    self.send(200,encode(jobs.folder(key),int(item[14:20])),'application/octet-stream');return
                if not re.fullmatch(r'(georender-[a-f0-9]{32}\.(png|npz)|depth-[0-9]{6}\.(bin|png)|geometry-[0-9]{6}\.npz|mask-[0-9]{6}\.png|normal-[0-9]{6}\.png|video\.mp4|sequence\.zip)',item):raise ValueError('Arquivo inválido')
                p=jobs.folder(key)/item
                if not p.exists():self.json({'error':'Ainda não disponível'},404);return
                self.send_file(p,'video/mp4' if item.endswith('.mp4') else 'image/png' if item.endswith('.png') else 'application/octet-stream');return
            except (ValueError,IndexError,OSError) as e:self.json({'error':str(e)},400);return
        files = {'/optics-workspace.js':'optics-workspace.js','/geometry-render-panel.js':'geometry-render-panel.js','/geometry-viewer.js':'geometry-viewer.js','/reflected-ghosts.js':'reflected-ghosts.js','/layers.js':'layers.js','/layer-panel.js':'layer-panel.js','/depth-inspector.js':'depth-inspector.js','/spectral-psf.js':'spectral-psf.js','/wavefront.js':'wavefront.js','/physical-distortion.js':'physical-distortion.js','/surface-geometry.js':'surface-geometry.js','/material-editor.js':'material-editor.js','/dependencies.js':'dependencies.js','/atlas-client.js':'atlas-client.js','/performance.js':'performance.js','/cuda-client.js':'cuda-client.js','/desktop-ui.js':'desktop-ui.js','/':'index.html','/app.js':'app.js','/gpu.js':'gpu.js','/style.css':'style.css','/lens-view.js':'lens-view.js','/lens-3d.js':'lens-3d.js','/optical-preview.js':'optical-preview.js','/quality.js':'quality.js','/presets.js':'presets.js','/profile-store.js':'profile-store.js','/depth-utils.js':'depth-utils.js'}
        types = {'/optics-workspace.js':'text/javascript; charset=utf-8','/geometry-render-panel.js':'text/javascript; charset=utf-8','/geometry-viewer.js':'text/javascript; charset=utf-8','/reflected-ghosts.js':'text/javascript; charset=utf-8','/layers.js':'text/javascript; charset=utf-8','/layer-panel.js':'text/javascript; charset=utf-8','/depth-inspector.js':'text/javascript; charset=utf-8','/spectral-psf.js':'text/javascript; charset=utf-8','/wavefront.js':'text/javascript; charset=utf-8','/physical-distortion.js':'text/javascript; charset=utf-8','/surface-geometry.js':'text/javascript; charset=utf-8','/material-editor.js':'text/javascript; charset=utf-8','/dependencies.js':'text/javascript; charset=utf-8','/atlas-client.js':'text/javascript; charset=utf-8','/performance.js':'text/javascript; charset=utf-8','/cuda-client.js':'text/javascript; charset=utf-8','/desktop-ui.js':'text/javascript; charset=utf-8','/':'text/html; charset=utf-8','/app.js':'text/javascript; charset=utf-8','/gpu.js':'text/javascript; charset=utf-8','/style.css':'text/css; charset=utf-8','/lens-view.js':'text/javascript; charset=utf-8','/lens-3d.js':'text/javascript; charset=utf-8','/optical-preview.js':'text/javascript; charset=utf-8','/quality.js':'text/javascript; charset=utf-8','/presets.js':'text/javascript; charset=utf-8','/profile-store.js':'text/javascript; charset=utf-8','/depth-utils.js':'text/javascript; charset=utf-8'}
        for name in ('animation-model.js','animation-ui.js','character-looks.js'):
            files['/'+name]=name;types['/'+name]='text/javascript; charset=utf-8'
        files['/depth-models.js']='depth-models.js';types['/depth-models.js']='text/javascript; charset=utf-8'
        files.update({'/filter-stack.js':'filter-stack.js','/filter-transform.js':'filter-transform.js','/i18n.js':'i18n.js','/i18n-catalog.js':'i18n-catalog.js'})
        types.update({'/filter-stack.js':'text/javascript; charset=utf-8','/filter-transform.js':'text/javascript; charset=utf-8','/i18n.js':'text/javascript; charset=utf-8','/i18n-catalog.js':'text/javascript; charset=utf-8'})
        if path in files:
            self.send(200,(ROOT/'web'/files[path]).read_bytes(),types[path])
        elif path == '/api/demo':
            self.json(demo_payloads()[0])
        elif path == '/api/complements/status':
            self.json(complements.status())
        elif path == '/api/health':
            self.json({'app':'Simulador de Desfoque da Bruxosdovfx','version':VERSION,'mode':'cuda-webgl-desktop','rays':vulkan.info()})
        elif path == '/api/cuda/info':
            self.json(cuda.info())
        elif path == '/api/demo-linear':
            self.send(200,demo_payloads()[1],'application/octet-stream')
        else:
            self.json({'error':'Não encontrado'},404)

    def do_POST(self):
        if not self.local_request():
            self.json({'error':'Origem inválida'},403)
            return
        if self.path in ('/api/geometry/render','/api/geometry/cancel','/api/geometry/probe'):
            from optics.geometry_render import start,cancel
            from optics.geometry_probe import inspect
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=10000:raise ValueError('Configuração inválida.')
                body=json.loads(self.rfile.read(length));self.json(inspect(body) if self.path.endswith('/probe') else cancel(body.get('id')) if self.path.endswith('/cancel') else start(body))
            except (ValueError,TypeError,KeyError,OSError) as exc:self.json({'error':str(exc)},400)
            return
        if self.path in ('/api/depth/setup','/api/depth/setup/cancel'):
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=10000:raise ValueError('Configuração inválida.')
                body=json.loads(self.rfile.read(length))
                from optics.depth_setup import start,cancel
                if self.path.endswith('/cancel'):self.json(cancel())
                else:
                    if any(j.get('process') and j['process'].poll() is None for j in jobs.JOBS.values()):raise ValueError('Aguarde a inferência atual.')
                    self.json(start(body))
            except Exception as exc:
                from optics.depth_errors import diagnostic
                self.json(diagnostic(exc),400)
            return
        if self.path=='/api/depth/runtime':
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=10000:raise ValueError('Configuração inválida.')
                if any(j.get('process') and j['process'].poll() is None for j in jobs.JOBS.values()):raise ValueError('Aguarde o processamento atual.')
                from optics.depth_setup import busy
                if busy():raise ValueError('Aguarde a operação do modelo.')
                from optics.depth_runtime import configure
                self.json(configure(json.loads(self.rfile.read(length))))
            except Exception as exc:self.json({'error':str(exc)},400)
            return
        if self.path in ('/api/complements/install','/api/complements/cancel'):
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<=length<=1000:raise ValueError('Configuração inválida.')
                self.rfile.read(length)
                self.json(complements.start() if self.path.endswith('/install') else complements.cancel())
            except Exception as exc:self.json({'error':str(exc)},400)
            return
        if self.path in ('/api/cuda/source','/api/cuda/render'):
            try:
                length=int(self.headers.get('Content-Length','0'))
                if self.path.endswith('/source'):
                    w=int(self.headers.get('X-Optica-Width','0'));h=int(self.headers.get('X-Optica-Height','0'))
                    token=self.headers.get('X-Optica-Token','')
                    if not 16<=w<=8192 or not 16<=h<=8192 or w*h>17_000_000 or length!=w*h*20 or not re.fullmatch(r'[a-f0-9-]{36}',token):raise ValueError('Upload CUDA inválido.')
                    raw=self.rfile.read(length)
                    if len(raw)!=length:raise ValueError('Upload CUDA incompleto.')
                    values=np.frombuffer(raw,'<f4');rgba=values[:w*h*4].reshape(h,w,4);depth=values[w*h*4:].reshape(h,w)
                    encoding=self.headers.get('X-Optica-Depth-Encoding','raw')
                    if encoding not in ('raw','nearness-v1'):raise ValueError('Codificação de depth inválida.')
                    self.json({'revision':cuda.upload(rgba,depth,token,encoding=='nearness-v1')});return
                if not 0<length<=100_000:raise ValueError('Configuração CUDA inválida.')
                body=json.loads(self.rfile.read(length));options=body.get('options',{})
                image,info=cuda.render(body.get('settings',{}),int(options['width']),int(options['height']),int(options.get('samples',96)),int(options.get('taps',512)),bool(options.get('depth')),bool(options.get('invert')),float(options.get('near',.8)),float(options.get('far',10)),body.get('token'),preview=options.get('preview') is True)
                payload=image.astype('<f2' if options.get('preview') is True else '<f4',copy=False).tobytes()
                self.send_response(200);self.send_header('Content-Type','application/octet-stream');self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store');self.send_header('X-Optica-Render',json.dumps(info,separators=(',',':')));self.end_headers();self.wfile.write(payload);return
            except (ValueError,TypeError,KeyError,RuntimeError,OSError) as exc:self.json({'error':str(exc)},400);return
        if self.path.startswith('/api/jobs/'):
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<=length<=500_000_000:raise ValueError('Limite: 500 MB')
                parts=self.path.split('/');action=parts[-1]
                if action in ('depth','video'):
                    if length>10000:raise ValueError('Configuração grande demais')
                    self.json(jobs.create(json.loads(self.rfile.read(length)),action));return
                key=parts[3];p=jobs.folder(key)
                if action=='upload':
                    if key in jobs.JOBS:raise ValueError('Job já iniciado')
                    with (p/'source').open('wb') as f:
                        remaining=length
                        while remaining:
                            chunk=self.rfile.read(min(1024*1024,remaining))
                            if not chunk:raise ValueError('Upload interrompido')
                            f.write(chunk);remaining-=len(chunk)
                    self.json({'uploaded':True});return
                if action=='run':self.json(jobs.run(key));return
                if action=='cancel':self.json(jobs.cancel(key));return
                if action=='finish':self.json(jobs.finish(key));return
                if action=='frame':
                    if length>45_000_000:raise ValueError('Frame grande demais')
                    self.json(jobs.frame(key,self.rfile.read(length)));return
                raise ValueError('Operação inválida')
            except Exception as e:self.json({'error':str(e)},400);return
        if self.path not in ('/api/render','/api/diagnostics','/api/layout','/api/kernel','/api/kernel.bin','/api/spectral-psf','/api/wavefront','/api/reflected-ghosts'):
            self.json({'error':'Não encontrado'},404)
            return
        try:
            length = int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 45_000_000:
                raise ValueError('Requisição vazia ou maior que 45 MB.')
            body = json.loads(self.rfile.read(length))
            settings = Settings.parse(body.get('settings',{}))
            if self.path == '/api/spectral-psf':
                from optics.spectral_psf import calculate
                self.json(calculate(settings,body.get('field_mm',[0,0]),body.get('spectrum','CFd'),body.get('quality','standard'),body.get('depth','focus')))
                return
            if self.path == '/api/reflected-ghosts':
                from optics.ghosts import analyze
                self.json(analyze(settings,body.get('field_mm',[0,0]),body.get('distance_m',settings.source_m),body.get('samples',1024),body.get('pair_limit',16)))
                return
            if self.path == '/api/wavefront':
                from optics.wavefront import analyze
                self.json(analyze(settings,body.get('field_mm',[0,0]),body.get('wavelength_um',.5876),body.get('samples',4096)))
                return
            if self.path == '/api/layout':
                self.json(layout(settings))
                return
            if self.path == '/api/kernel.bin':
                header,payload=binary_kernel(settings,float(body.get('aspect',1.6)),int(body.get('taps',64)),1024 if body.get('interactive') is True else 4096)
                self.send_response(200);self.send_header('Content-Type','application/vnd.optica.atlas');self.send_header('Content-Length',str(len(header)+len(payload)));self.send_header('Cache-Control','no-store');self.end_headers()
                self.wfile.write(header);self.wfile.write(payload)
                return
            if self.path == '/api/kernel':
                t=time.perf_counter()
                result=dict(kernel(settings,float(body.get('aspect',1.6)),int(body.get('taps',64)),
                                   1024 if body.get('interactive') is True else 4096,profile=True))
                result['seconds']=round(time.perf_counter()-t,4)
                self.json(result)
                return
            if self.path == '/api/diagnostics':
                result = diagnostics(settings)
                images = []
                for field in ((0,0),(settings.sensor_mm*.42,0)):
                    psf,trans,ok = make_psf(field,settings.source_m,settings,1200,4096)
                    vis = np.power(psf/max(psf.max(),1e-20),.45)
                    images.append({'image':encode_image(vis),'transmission':trans,'valid':ok})
                result['psfs'] = images
                self.json(result)
                return
            if not RENDER_LOCK.acquire(blocking=False):
                self.json({'error':'Já existe um render em andamento.'},409)
                return
            try:
                started = time.perf_counter()
                limit = 768 if settings.quality == 'preview' else 1600
                depth = None
                if body.get('image'):
                    rgb,size = decode_image(body['image'],limit)
                    if body.get('depth'):
                        depth,dsize = decode_image(body['depth'],limit,True,settings.depth_channel)
                        if dsize != size or depth.shape != rgb.shape[:2]:
                            raise ValueError('Imagem e depth precisam ter as mesmas dimensões e orientação.')
                else:
                    rgb,depth_demo = demo(limit)
                    if body.get('use_demo_depth'):
                        depth = depth_demo
                        settings.near_m,settings.far_m = 2.,5.
                decoded=time.perf_counter()
                out,warnings = render(rgb,settings,depth)
                rendered=time.perf_counter()
                if body.get('image'):
                    warnings.append('Entrada tratada como sRGB; alfa composto sobre preto. EXR/Log ainda não suportados.')
                result = {'image':encode_image(srgb_encode(out)), 'source':encode_image(srgb_encode(rgb)),
                          'seconds':round(time.perf_counter()-started,2),'warnings':warnings,
                          'width':rgb.shape[1],'height':rgb.shape[0], 'settings':diagnostics(settings)['settings']}
                result['profile']={'decode_ms':(decoded-started)*1000,'render_ms':(rendered-decoded)*1000,
                                   'encode_and_diagnostics_ms':(time.perf_counter()-rendered)*1000,'backend':'cpu'}
                self.json(result)
            finally:
                RENDER_LOCK.release()
        except (ValueError,TypeError,KeyError,OSError,Image.DecompressionBombError) as e:
            self.json({'error':str(e)},400)
        except Exception as e:
            print(f'Render error: {e!r}',flush=True)
            self.json({'error':'Falha interna no render. Consulte o terminal.'},500)


if __name__ == '__main__':
    import multiprocessing
    multiprocessing.freeze_support()
    parser = argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8766)
    parser.add_argument('--open',action='store_true')
    parser.add_argument('--test',action='store_true',help='Enable local integration test fixtures')
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    server.test_mode=args.test
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'Simulador de Desfoque da Bruxosdovfx: {url}',flush=True)
    if args.open:
        webbrowser.open(url)
    server.serve_forever()
