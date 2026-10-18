"""Persistent native CUDA image renderer. Glass atlas retains Vulkan/CPU tracing.

CUDA allocations are reused. The WebView display bridge currently downloads HDR
frames; it is not Vulkan external-memory interop and has a measurable copy cost.
"""
import ctypes as C
import threading
from pathlib import Path
import time
import numpy as np
from dataclasses import replace
from .depth_mapping import prepare as prepare_depth,advanced as advanced_depth,KEYS as DEPTH_KEYS,blur_transition
from .core import Settings, get_lens
from .preview import kernel, focus_plane

FLOAT_NAMES = 'last reference sourcefocus sensorz sensormm iris atlasiris maxiris near far gain highlight exposure swirl coma squeeze sph3 sph5 k1 k2 p1 p2 blend apod rim cared cablue caaxial ditheramount depthgain depthbias cut feather threshold shimmer shimmerdepth shimmersize shimmerdensity shimmerseed shimmerthreshold source_m matrixa matrixb matrixc matrixd ghost diffraction diffscale airy rotation impression astigmatism focusshift'.split()
NUM_FLOATS = len(FLOAT_NAMES)+26
class Config(C.Structure):
    _fields_=[(name,C.c_int) for name in 'w h rw rh taps grid samples slices depth cut eclipse soften dither invert part blades'.split()]+[('f',C.c_float*NUM_FLOATS)]

_lock=threading.RLock();_dll=None;_attempted=False;_reason='';_source=None;_depth=None;_atlas=None;_token=None;_revision=0;_depth_key=None;_binary=False
_payload_prepared=False;_native_depth_key='raw'
def available():
    global _dll,_attempted,_reason
    with _lock:
        if _attempted:return _dll is not None
        _attempted=True
        try:
            dll=C.CDLL(str(Path(__file__).resolve().parents[1]/'native/cuda/bin/optica_cuda.dll'))
            if dll.optica_cuda_blur_sides()!=1:raise RuntimeError("Motor CUDA incompatível com desfoque por plano.")
            if dll.optica_cuda_bokeh_texture()!=1:raise RuntimeError("Motor CUDA incompatível com textura do bokeh.")
            ptr=C.POINTER(C.c_float)
            if dll.optica_cuda_focus_preservation()!=1:raise RuntimeError("Motor CUDA incompatível com preservação do foco.")
            if dll.optica_cuda_focus_partition()!=1:raise RuntimeError("Motor CUDA incompatível com foco ancorado.")
            dll.optica_cuda_init.restype=C.c_int
            dll.optica_cuda_error.restype=C.c_char_p;dll.optica_cuda_device.restype=C.c_char_p
            dll.optica_cuda_source.argtypes=[ptr,ptr,C.c_int,C.c_int]
            dll.optica_cuda_atlas.argtypes=[ptr,ptr,C.c_int]
            dll.optica_cuda_render=dll.optica_cuda_render_v4
            dll.optica_cuda_render_half=dll.optica_cuda_render_half_v4
            dll.optica_cuda_render.argtypes=[C.POINTER(Config),ptr,ptr]
            dll.optica_cuda_render_half.argtypes=[C.POINTER(Config),C.POINTER(C.c_ushort),ptr]
            if dll.optica_cuda_init():raise RuntimeError(dll.optica_cuda_error().decode())
            _dll=dll
        except Exception as exc:_reason=str(exc)
        return _dll is not None
def info():
    ready=available()
    return dict(available=ready,device=_dll.optica_cuda_device().decode() if ready else None,reason=_reason,backend='cuda' if ready else 'webgl',display_transfer='host-hdr',version=1)
def _check(code):
    if code:raise RuntimeError(_dll.optica_cuda_error().decode() or 'Falha CUDA')
def upload(rgba,depth=None,token=None,depth_prepared=False):
    global _source,_depth,_token,_revision,_payload_prepared,_native_depth_key
    rgba=np.asarray(rgba,dtype='f4')
    if rgba.ndim!=3 or rgba.shape[2]!=4 or min(rgba.shape[:2])<16 or max(rgba.shape[:2])>8192 or rgba.shape[0]*rgba.shape[1]>17_000_000 or not np.isfinite(rgba).all():raise ValueError('Imagem CUDA inválida.')
    depth=np.zeros(rgba.shape[:2],'f4') if depth is None else np.asarray(depth,dtype='f4')
    if depth.shape!=rgba.shape[:2] or not np.isfinite(depth).all():raise ValueError('Depth CUDA inválido.')
    if depth_prepared and (depth.min()<0 or depth.max()>1):raise ValueError('Depth preparado precisa estar entre 0 e 1.')
    with _lock:
        if not available():raise RuntimeError(_reason)
        # Input arrays use the same bottom-up convention as the WebGL framebuffer.
        _source=np.ascontiguousarray(rgba);_depth=np.ascontiguousarray(depth);ptr=C.POINTER(C.c_float)
        _check(_dll.optica_cuda_source(_source.ctypes.data_as(ptr),_depth.ctypes.data_as(ptr),rgba.shape[1],rgba.shape[0]))
        _token=token;_revision+=1
        _payload_prepared=depth_prepared;_native_depth_key='prepared' if depth_prepared else 'raw'
        return _revision
def render(raw_settings,width,height,samples=96,taps=512,use_depth=False,invert=False,near=.8,far=10,token=None,preview=False):
    global _atlas,_depth_key,_binary,_native_depth_key
    started=time.perf_counter()
    settings=Settings.parse(raw_settings)
    if not 16<=width<=8192 or not 16<=height<=8192 or width*height>17_000_000:raise ValueError('Resolução CUDA inválida.')
    if isinstance(samples,bool) or not 1<=samples<=1024 or taps not in (32,64,128,256,512,1024):raise ValueError('Amostragem CUDA inválida.')
    if not .3<=near<far<=1000:raise ValueError('Distâncias CUDA inválidas.')
    with _lock:
        if not available():raise RuntimeError(_reason)
        if _source is None or (token is not None and token!=_token):raise ValueError('Envie a imagem CUDA desta sessão primeiro.')
        h,w=_source.shape[:2];data=kernel(settings,w/h,taps)
        if settings.physical_distortion:
            from .distortion import prepare_atlas
            data=prepare_atlas(data,settings,float(raw_settings.get('master_blend',1)))
        if _atlas is not data:
            rays=data.ray_array;pupils=data.pupil_array;ptr=C.POINTER(C.c_float)
            _check(_dll.optica_cuda_atlas(rays.ctypes.data_as(ptr),pupils.ctypes.data_as(ptr),len(rays)//4));_atlas=data
        transition=settings.depth_mode=='cut' and settings.depth_feather>0
        encoded=_payload_prepared or advanced_depth(settings) or transition
        depth_key=(_revision,tuple(getattr(settings,k) for k in DEPTH_KEYS),near,far,invert,_payload_prepared,settings.depth_mode,settings.depth_cut,settings.depth_feather)
        if depth_key!=_depth_key:
            mapped=_depth if _payload_prepared else prepare_depth(_depth,settings,near,far,invert)['nearness'] if encoded else np.clip(_depth*settings.depth_gain+settings.depth_bias,0,1)
            mapped=blur_transition(mapped,settings)
            native_key=depth_key if transition else 'prepared' if _payload_prepared else depth_key if encoded else 'raw'
            if native_key!=_native_depth_key:
                native=np.ascontiguousarray(mapped if encoded else _depth,dtype='f4');ptr=C.POINTER(C.c_float)
                _check(_dll.optica_cuda_source(_source.ctypes.data_as(ptr),native.ctypes.data_as(ptr),w,h));_native_depth_key=native_key
            _binary=bool(np.all((mapped<1e-6)|(mapped>1-1e-6)));_depth_key=depth_key
        if encoded:settings=replace(settings,depth_gain=1.,depth_bias=0.);invert=False
        if transition:settings=replace(settings,depth_mode='slicing')
        binary=_binary
        cut=settings.depth_mode=='cut' or (settings.depth_mode in ('auto','continuous') and binary)
        if settings.depth_mode in ('auto','continuous') and cut:cut_position=.5;feather=0
        else:cut_position=settings.depth_cut;feather=settings.depth_feather
        samples=min(samples,taps)
        # Uniform high-quality fallback preserves highlight detail; adaptive
        # coverage scheduling remains in the WebGL renderer for now.
        fallback=settings.highlight_detail and settings.highlight_quality>samples
        if fallback:samples=min(taps,settings.highlight_quality)
        cfg=Config(w,h,width,height,taps,data['grid'],samples,(2 if cut else settings.depth_slices) if use_depth else 1,int(use_depth),int(cut),int(use_depth and settings.eclipse_bokeh),int(settings.soften_internal_cutoff),int(settings.bokeh_dither),int(invert),['final','base','highlights','coverage'].index(settings.highlight_view),settings.blades)
        lens=get_lens(settings)
        def number(key,default=0,limit=1e4):
            v=float(raw_settings.get(key,default))
            if not np.isfinite(v) or abs(v)>limit:raise ValueError('Parâmetro CUDA inválido: '+key)
            return v
        values=[data['last_z'],data['reference_z'],focus_plane(data['source_m'],lens),focus_plane(settings.focus_m,lens)+settings.filmback_mm+(data.get('focus_calibration',{}).get('shift_mm',0) if settings.ray_focus else 0),settings.sensor_mm,settings.iris_mm,data['iris_mm'],data['max_iris_mm'],near,far,
                number('bokeh_gain',1),number('highlight_gain'),settings.exposure,settings.swirl,settings.coma,settings.squeeze,number('spherical3'),number('spherical5'),number('k1'),number('k2'),number('p1'),number('p2'),number('master_blend',1),number('apodization'),number('rim_gain'),number('ca_red'),number('ca_blue'),number('ca_axial'),settings.dither_amount,settings.depth_gain,settings.depth_bias,cut_position,feather,settings.highlight_threshold,settings.shimmer_amount,settings.shimmer_depth,settings.shimmer_size,settings.shimmer_density,settings.shimmer_seed,settings.shimmer_threshold,data['source_m'],*data['matrix'],0. if settings.physical_ghosts else settings.ghost_gain,settings.diffraction_gain,settings.diffraction_scale,1.22*.00055*data['efl_mm']/(2*settings.iris_mm)*w/settings.sensor_mm,np.deg2rad(settings.rotation),settings.impression,settings.astigmatism_mm,data.get('focus_calibration',{}).get('shift_mm',0) if settings.ray_focus else 0]
        pairs=(data['ghost_pairs']+[[0,0,0,0]]*3)[:3];values.extend(v for pair in pairs for v in pair)
        from .depth_mapping import focus_anchor
        values.extend([settings.shimmer_prism,float(settings.shimmer_normalize),settings.bokeh_distortion,settings.bokeh_distortion_color,focus_anchor(settings,near,far) if use_depth and not cut else 0.])
        values.extend([settings.focus_preservation,settings.focus_width,settings.focus_m])
        values.extend([settings.bokeh_texture_rings,settings.bokeh_texture_grain,settings.bokeh_texture_scale,np.deg2rad(settings.bokeh_texture_rotation)])
        values.extend([settings.foreground_blur,settings.background_blur])
        cfg.f[:]=values
        result=np.empty((height,width,4),'f2' if preview else 'f4');ms=C.c_float()
        fn=_dll.optica_cuda_render_half if preview else _dll.optica_cuda_render
        ptr=C.POINTER(C.c_ushort if preview else C.c_float)
        _check(fn(C.byref(cfg),result.ctypes.data_as(ptr),C.byref(ms)))
        if not np.isfinite(result).all():raise RuntimeError('Resultado CUDA não finito.')
        return result,dict(backend='cuda',device=info()['device'],gpuMs=ms.value,totalMs=(time.perf_counter()-started)*1000,width=width,height=height,samples=samples,taps=taps,depthMode=('cut' if cut else 'slicing') if use_depth else None,highlightFallback=bool(fallback),revision=_revision,precision='float16' if preview else 'float32',physicalDistortion='webgl-presenter-inverse-map' if settings.physical_distortion else 'off')
