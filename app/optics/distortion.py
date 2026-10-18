"""Source-plane centroid projection and first-order PSF preconditioning.

The final inverse warp is shared WebGL presentation for both image engines.
No additional chromatic warp: relative RGB centroids already belong to the PSF.
"""
import hashlib
import numpy as np
from .cache import ByteCache

_cache=ByteCache(32*1024*1024)

def sensor_plane(data,settings):
    a,b,c,d=data['matrix'];inv=1/(settings.focus_m*1000)
    return data['last_z']-(a+b*inv)/(c+d*inv)+settings.filmback_mm+(data.get('focus_calibration',{}).get('shift_mm',0) if settings.ray_focus else 0)

def field_map(data,settings,blend=1.):
    meta=data['distortion'];g=meta['grid'];aspect=meta['aspect'];sensor=meta['sensor_mm']
    centers=np.asarray(meta['centroids_mm_and_slopes']).reshape(3,g,g,4)
    z=sensor_plane(data,settings);delta=z-meta['reference_z_mm'];positions=centers[...,:2]+delta*centers[...,2:]
    x=np.linspace(-sensor/2,sensor/2,g);y=np.linspace(-sensor/(2*aspect),sensor/(2*aspect),g)
    xx,yy=np.meshgrid(x,y);ideal=np.stack((xx,yy),axis=-1)
    mapped=ideal+blend*(positions[1]-ideal)
    valid=np.asarray(meta['throughput']).reshape(3,g,g)[1]>1e-12
    # Node Jacobians in mm/mm. Identical finite differences in the JS client.
    j=np.empty((g,g,2,2));j[:,:,0,0]=np.gradient(mapped[:,:,0],x,axis=1);j[:,:,0,1]=np.gradient(mapped[:,:,0],y,axis=0)
    j[:,:,1,0]=np.gradient(mapped[:,:,1],x,axis=1);j[:,:,1,1]=np.gradient(mapped[:,:,1],y,axis=0)
    det=np.linalg.det(j);usable=valid & np.isfinite(j).all(axis=(-1,-2)) & (det>1e-6)
    inverse=np.zeros_like(j);inverse[usable]=np.linalg.inv(j[usable])
    return dict(sensor_z_mm=z,positions=positions,mapped=mapped,jacobian=j,inverse=inverse,valid=usable,determinant=det)

def prepare_atlas(data,settings,blend=1.):
    if not np.isfinite(blend) or not 0<=blend<=1:raise ValueError("Mistura física deve estar entre 0 e 1.")
    if not settings.physical_distortion or blend<=0:return data
    z=sensor_plane(data,settings);key=(data['atlas_id'],data['prescription_id'],data['distortion'].get('id'),z,float(blend))
    cached=_cache.get(key)
    if cached is not None:return cached
    mapping=field_map(data,settings,blend);g=data['grid'];t=data['taps']
    rays=data.ray_array.reshape(3,t,g,g,4).astype(np.float64)
    inverse=mapping['inverse'];out=np.empty_like(rays)
    out[...,:2]=np.einsum('yxij,ctyxj->ctyxi',inverse,rays[...,:2]);out[...,2:]=np.einsum('yxij,ctyxj->ctyxi',inverse,rays[...,2:])
    result=type(data)(data);result.ray_array=out.astype('f4').ravel();result.ray_array.setflags(write=False)
    # Unsupported/folded nodes cannot carry normalized energy into the image.
    pupils=data.pupil_array.reshape(3,t,g,g,4).copy();pupils[:,:,:, :,2]*=mapping['valid'][None,None]
    result.pupil_array=pupils.ravel();result.pupil_array.setflags(write=False)
    result['atlas']=result.ray_array;result['pupils']=result.pupil_array
    digest=hashlib.sha256(result.ray_array);digest.update(result.pupil_array);result['atlas_id']=digest.hexdigest()
    result['radius_mm']=float(np.max(np.linalg.norm(out[...,:2],axis=-1)))
    result['max_slope']=float(np.max(np.linalg.norm(out[...,2:],axis=-1)))
    _cache.put(key,result,result.ray_array.nbytes+result.pupil_array.nbytes)
    return result
