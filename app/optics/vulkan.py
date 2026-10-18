"""Native Vulkan sequential refraction; CPU fallback is explicit in metadata."""
import ctypes as C
import json
import os
from pathlib import Path
import threading
import numpy as np

class Params(C.Structure):
 _fields_=[('count',C.c_uint32),('surfaces',C.c_uint32),('iris',C.c_float),('rotation',C.c_float),('blades',C.c_uint32),('soften',C.c_uint32),('softness',C.c_float),('dispersion',C.c_float),('coating',C.c_float),('coatingNm',C.c_float)]
_lock=threading.RLock();_dll=None;_attempted=False;_reason='';_last_backend='cpu'

def available():
 global _dll,_attempted,_reason
 with _lock:
  if os.environ.get('OPTICA_RAY_BACKEND','auto').lower()=='cpu':return False
  if _attempted:return _dll is not None
  _attempted=True
  try:
   folder=Path(__file__).resolve().parents[1]/'native/vulkan/bin'
   dll=C.CDLL(str(folder/'optica_vk.dll'))
   ptr=C.POINTER(C.c_float)
   dll.optica_vk_init.argtypes=[C.c_char_p];dll.optica_vk_init.restype=C.c_int
   dll.optica_vk_trace.argtypes=[ptr,ptr,ptr,C.POINTER(Params)];dll.optica_vk_trace.restype=C.c_int
   dll.optica_vk_error.restype=C.c_char_p;dll.optica_vk_info.restype=C.c_char_p
   if dll.optica_vk_init(os.fsencode(folder/'lens.spv')):raise RuntimeError(dll.optica_vk_error().decode())
   _dll=dll
  except Exception as exc:_reason=str(exc)
  return _dll is not None

def info():
 with _lock:
  ready=available();result=json.loads(_dll.optica_vk_info().decode()) if ready else {}
  return {**result,'available':ready,'trace_backend':_last_backend,'fallback_reason':_reason}

def trace(lens,settings,positions,directions,wavelengths):
 global _last_backend,_reason
 with _lock:
  if any(s.get('shape',0) for s in lens.surfaces):
   # The deployed shader only supports spheres. Never silently approximate a
   # cylinder/asphere with a sphere, even when Vulkan was explicitly requested.
   wavelengths=np.broadcast_to(np.asarray(wavelengths,dtype=float),(len(positions),))
   p=np.empty_like(positions,dtype=float);d=np.empty_like(directions,dtype=float);valid=np.empty(len(p),bool);energy=np.empty(len(p))
   for w in np.unique(wavelengths):
    ids=np.flatnonzero(wavelengths==w);p[ids],d[ids],valid[ids],energy[ids],_=lens.trace(positions[ids],directions[ids],settings,w)
   _last_backend='cpu-fallback';_reason='Cylindrical/aspheric geometry: CPU reference tracer (shader supports spheres).'
   return p,d,valid,energy
  if not available():raise RuntimeError(_reason or 'Vulkan disabled')
  count=len(positions)
  rays=np.zeros((count,8),dtype='f4');rays[:,:3]=positions;rays[:,3]=wavelengths;rays[:,4:7]=directions
  surf=np.zeros((len(lens.surfaces),8),dtype='f4')
  for i,(s,z) in enumerate(zip(lens.surfaces,lens.z)):surf[i,:5]=[s['curvature_radius'],z,s['aperture_diameter']/2,s['nd'],float(s.get('is_stop',False))]
  output=np.empty((count,12),dtype='f4');ptr=C.POINTER(C.c_float)
  params=Params(count,len(surf),settings.iris_mm,np.deg2rad(settings.rotation),(0 if settings.aperture_custom else settings.blades),int(settings.soften_internal_cutoff),settings.iris_softness,settings.dispersion,settings.coating_strength,settings.coating_nm)
  if any(s.get('material_spec') for s in lens.surfaces):
   # Evaluate physical indices once per medium/wavelength in float64, then
   # upload float32 indices. Geometry and Snell tracing stay on Vulkan. The
   # app's atlas uses three wavelengths, so this needs three bounded dispatches.
   wavelengths=np.broadcast_to(np.asarray(wavelengths,dtype=float),(count,))
   for wavelength in np.unique(wavelengths):
    ids=np.flatnonzero(wavelengths==wavelength);subset=np.ascontiguousarray(rays[ids]);result=np.empty((len(ids),12),dtype='f4')
    spectral=surf.copy()
    for i,s in enumerate(lens.surfaces):spectral[i,3]=lens.surface_index(s,wavelength,settings.dispersion)
    params.count=len(ids);params.dispersion=0
    if _dll.optica_vk_trace(spectral.ctypes.data_as(ptr),subset.ctypes.data_as(ptr),result.ctypes.data_as(ptr),C.byref(params)):raise RuntimeError(_dll.optica_vk_error().decode())
    output[ids]=result
  elif _dll.optica_vk_trace(surf.ctypes.data_as(ptr),rays.ctypes.data_as(ptr),output.ctypes.data_as(ptr),C.byref(params)):raise RuntimeError(_dll.optica_vk_error().decode())
  _last_backend='vulkan-compute';_reason=''
  valid=output[:,9]>.5;energy=output[:,8]
  if settings.aperture_custom:
   from .aperture import mask_coverage
   coverage=mask_coverage(output[:,10:12],settings);energy*=coverage;valid&=coverage>1e-8
  return output[:,:3],output[:,4:7],valid,energy

def iter_bundles(lens,fields,source,settings,count):
 """Batch fields/channels into GPU dispatches; bounded working memory."""
 global _reason,_last_backend
 tasks=[(field,wavelength) for field in fields for wavelength in (.6563,.5876,.4861)]
 i=np.arange(count)+.5;r=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(i/count);theta=i*np.pi*(3-np.sqrt(5))
 from .geometry import entry_plane
 target=np.column_stack((r*np.cos(theta),r*np.sin(theta),np.full(count,entry_plane(lens))))
 per_batch=max(1,1048576//count)
 for start in range(0,len(tasks),per_batch):
  batch=tasks[start:start+per_batch];positions=np.tile(target,(len(batch),1));directions=[]
  for field,wl in batch:
   origin=np.array([-field[0]*source*1000/lens.efl,-field[1]*source*1000/lens.efl,-source*1000])
   d=target-origin;directions.append(d/np.linalg.norm(d,axis=1)[:,None])
  d=np.concatenate(directions);wl=np.repeat([wl for field,wl in batch],count)
  try:
   p,d,valid,energy=trace(lens,settings,positions,d,wl)
   for j in range(len(batch)):
    sl=slice(j*count,(j+1)*count);yield p[sl],d[sl],valid[sl],energy[sl],[target]
  except Exception as exc:
   _reason='GPU trace failed; CPU fallback: '+str(exc);_last_backend='cpu-fallback'
   for field,wl in batch:yield lens.bundle(field,source,settings,wl,count,history=True)
