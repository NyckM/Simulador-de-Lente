"""Small ray atlas for interactive GPU preview.

Each sample contains (position.xy, direction.xy/direction.z), allowing a change
of sensor position without tracing again. The UI applies sparse gather sampling;
this is an approximation to the CPU source-scatter renderer, not identical output.
"""
from functools import lru_cache
from dataclasses import replace
from threading import local
from time import perf_counter
import json
import struct
import hashlib
import numpy as np
from scipy.spatial import cKDTree
from .core import LENS, Settings, get_lens, coated_transmission, focus_calibration
from . import vulkan, geometry
from .cache import ByteCache
_request_profile=local()
_ray_cache=ByteCache(64*1024*1024)

@lru_cache(maxsize=6)
def _pupil_tree(taps):
    """One immutable Voronoi lookup per supported sample count, shared by fields."""
    t=np.arange(taps)+.5
    targets=np.column_stack((np.cos(t*2.39996323),np.sin(t*2.39996323)))*np.sqrt(t/taps)[:,None]
    targets.setflags(write=False)
    return cKDTree(targets)

def _field_bundles(key,lens,settings,fields,source,count,reference_z,backend):
    cached=_ray_cache.get(key)
    if cached is not None:return cached,True
    native=iter(vulkan.iter_bundles(lens,fields,source,settings,count)) if backend=='vulkan-compute' else None
    result=[];size=0
    for field in fields:
        channels=[]
        for wavelength in (.6563,.5876,.4861):
            p,d,valid,energy,paths=next(native) if native is not None else lens.bundle(field,source,settings,wavelength,count,history=True)
            xy=p[:,:2]+(reference_z-p[:,2,None])*d[:,:2]/d[:,2,None]
            slopes=d[:,:2]/d[:,2,None]
            pupil=paths[0][:,:2]/(lens.surfaces[0]['aperture_diameter']/2)
            values=(xy[valid],slopes[valid],pupil[valid],energy[valid])
            for value in values:value.setflags(write=False);size+=value.nbytes
            channels.append(values)
        result.append(tuple(channels))
    result=(tuple(result),'cpu' if native is None else vulkan.info()['trace_backend'],None if native is None or any(s.get('shape',0) for s in lens.surfaces) else vulkan.info().get('device'))
    _ray_cache.put(key,result,size)
    return result,False

class Atlas(dict):
    """Legacy mapping with reusable float32 arrays outside JSON fields."""
    def binary_packet(self,metadata):
        if not hasattr(self,'packed_bytes'):
            def packed(a):
                return a.reshape(3,self['taps'],self['grid'],self['grid'],4).transpose(1,2,0,3,4).astype('<f4',copy=False).tobytes()
            self.packed_bytes=packed(self.ray_array)+packed(self.pupil_array)
        header=json.dumps(metadata,separators=(',',':'),allow_nan=False).encode('utf-8')
        return struct.pack('<I',len(header))+header+b'\0'*((-len(header))%4),self.packed_bytes

def binary_kernel(settings,aspect=1.6,taps=64,rays=4096):
    # The regular call keeps identity for native CUDA; metrics use a copy.
    data=kernel(settings,aspect,taps,rays,profile=True)
    cached=kernel(settings,aspect,taps,rays)
    metadata={k:v for k,v in data.items() if k not in ('atlas','pupils')}
    metadata.update(wire_schema='optica-atlas/1',atlas_layout='webgl-packed-f32',array_floats=3*taps*cached['grid']**2*4)
    return cached.binary_packet(metadata)


def _cell_means(labels,values,energy,masses):
    totals=np.column_stack([np.bincount(labels,weights=energy*values[:,axis],minlength=len(masses)) for axis in range(values.shape[1])])
    return np.divide(totals,masses[:,None],out=np.zeros_like(totals),where=masses[:,None]>0)


def ghost_pairs(lens, coating_strength, coating_nm):
    """First-order two-bounce energy estimate; screen position is a GPU proxy."""
    n1=1.;interfaces=[]
    for surface,z in zip(lens.surfaces,lens.z):
        n2=surface['nd']
        if n1!=n2:
            rgb=[]
            for wavelength in (.6563,.5876,.4861):
                bare=((n1-n2)/(n1+n2))**2
                coated=1-float(coated_transmission(1.,n1,n2,wavelength,coating_nm))
                rgb.append((1-coating_strength)*bare+coating_strength*coated)
            interfaces.append((float(z),np.asarray(rgb)))
        n1=n2
    span=max(float(lens.z[-1]),1.)
    pairs=[]
    for i,(z1,r1) in enumerate(interfaces):
        for z2,r2 in interfaces[i+1:]:
            gap=(z2-z1)/span
            if gap>.06:
                power=r1*r2
                pairs.append((float(power[1]*gap),[min(.95,.12+.8*gap),*power.tolist()]))
    return [item for _,item in sorted(pairs,key=lambda x:x[0],reverse=True)[:3]]


def paraxial_matrix(lens=LENS):
    matrix=np.eye(2)
    n=1.
    for surface in lens.surfaces:
        n2=surface['nd']; r=surface['curvature_radius']
        power=(n2-n)*geometry.curvature(surface,0) if surface.get('shape',0) else (n2-n)/r if r else 0
        matrix=np.array([[1,surface['thickness']/n2],[0,1]])@np.array([[1,0],[-power,1]])@matrix
        n=n2
    return matrix


def focus_plane(distance_m, lens=LENS):
    a,b,c,d=paraxial_matrix(lens).ravel()
    return float(lens.z[-1]-(a+b/(distance_m*1000))/(c+d/(distance_m*1000)))


def kernel(settings, aspect=1.6, taps=64, rays=4096, profile=False):
    if not np.isfinite(aspect) or not .2 <= aspect <= 5:
        raise ValueError('Proporção da imagem fora de 0,2–5.')
    if isinstance(settings.field_grid,bool) or settings.field_grid not in (3,5,9):
        raise ValueError('Campo óptico: use 3, 5 ou 9 pontos por eixo.')
    if taps not in (32,64,128,256,512,1024):
        raise ValueError('Número de amostras não suportado.')
    if rays not in (1024,4096):
        raise ValueError('Qualidade de traçado desconhecida.')
    backend='vulkan-compute' if settings.ray_backend!='cpu' and vulkan.available() else 'cpu'
    # Focus, filmback and creative changes are shader uniforms, not cache keys.
    key=(round(settings.source_m,4), round(settings.iris_mm,4), round(settings.sensor_mm,4),
         settings.blades,round(settings.rotation,3),round(settings.dispersion,4),round(aspect,5),taps,settings.lens_edits,rays,
         round(settings.coating_strength,4),round(settings.coating_nm,2),settings.soften_internal_cutoff,round(settings.iris_softness,4),settings.lens_model,settings.field_grid,backend,settings.aperture_mask if settings.aperture_custom else '',settings.aperture_invert)
    started=perf_counter();_request_profile.built=False
    result=_kernel_cached(*key)
    if not profile:return result # Preserve cached identity for CUDA atlas uploads.
    return {**result,'profile':{**result['build_profile'],
            'cache_hit':not _request_profile.built,'lookup_ms':(perf_counter()-started)*1000}}


@lru_cache(maxsize=24)
def _kernel_cached(source,iris,sensor,blades,rotation,dispersion,aspect,taps,edits,rays,coating_strength,coating_nm,soften_internal_cutoff,iris_softness,lens_model,field_grid,backend,aperture_mask,aperture_invert):
    _request_profile.built=True;started=perf_counter();trace_ms=0.
    s=Settings(lens_model=lens_model,source_m=source,iris_mm=iris,sensor_mm=sensor,blades=blades,rotation=rotation,dispersion=dispersion,lens_edits=edits,
               coating_strength=coating_strength,coating_nm=coating_nm,
               soften_internal_cutoff=soften_internal_cutoff,iris_softness=iris_softness,aperture_mask=aperture_mask,aperture_custom=bool(aperture_mask),aperture_invert=aperture_invert)
    lens=get_lens(s)
    lens_ms=(perf_counter()-started)*1000
    n=int(rays*min(16,max(1,(3/iris)**2)))
    reference_z=focus_plane(2.,lens)
    grid=min(3,field_grid) if rays==1024 else field_grid
    atlas=np.zeros((3*taps,grid,grid,4),dtype=np.float32)
    pupils=np.zeros_like(atlas)
    centroids=np.zeros((3,grid,grid,4),dtype=np.float64)
    throughput=np.zeros((3,grid,grid))
    extent=0.
    fields=[((gx/(grid-1)-.5)*sensor,(gy/(grid-1)-.5)*sensor/aspect) for gy in range(grid) for gx in range(grid)]
    ray_key=(source,iris,sensor,blades,rotation,dispersion,aspect,edits,rays,coating_strength,coating_nm,soften_internal_cutoff,iris_softness,lens_model,grid,backend,aperture_mask,aperture_invert)
    trace_started=perf_counter()
    (field_bundles,trace_backend,trace_device),ray_cache_hit=_field_bundles(ray_key,lens,s,fields,source,n,reference_z,backend)
    trace_ms=(perf_counter()-trace_started)*1000
    pupil_tree=_pupil_tree(taps)
    for gy in range(grid):
        for gx in range(grid):
            field=((gx/(grid-1)-.5)*sensor,(gy/(grid-1)-.5)*sensor/aspect)
            bundles=field_bundles[gy*grid+gx]
            if not len(bundles[1][0]):
                continue
            green_xy,green_slope,_,green_energy=bundles[1]
            center=np.average(green_xy,axis=0,weights=green_energy)
            slope_center=np.average(green_slope,axis=0,weights=green_energy)
            for channel,(xy,slopes,pupil,energy) in enumerate(bundles):
                if not len(xy):
                    continue
                throughput[channel,gy,gx]=energy.sum()/n
                centroids[channel,gy,gx,:2]=np.average(xy,axis=0,weights=energy)
                centroids[channel,gy,gx,2:]=np.average(slopes,axis=0,weights=energy)
                # Fixed pupil Voronoi cells carry integrated energy, position and
                # direction. The same cells at adjacent fields correspond, so
                # interpolation cannot randomly pair unrelated pupil positions.
                pc=np.average(pupil,axis=0,weights=energy)
                scale=np.maximum(np.sqrt(np.average((pupil-pc)**2,axis=0,weights=energy))*2,1e-6)
                normalized=(pupil-pc)/scale
                # Nearest-neighbour lookup avoids the dense N x taps distance
                # matrix, making the finer atlas practical during interaction.
                labels=pupil_tree.query(normalized,workers=1)[1]
                # Weighted histogram reduction is O(rays), replacing one
                # full boolean scan for every pupil cell.
                masses=np.bincount(labels,weights=energy,minlength=taps)
                offsets=_cell_means(labels,xy,energy,masses)-center
                slope=_cell_means(labels,slopes,energy,masses)-slope_center
                pupil_mean=_cell_means(labels,normalized,energy,masses)
                empty=masses==0;offsets[empty]=0;slope[empty]=0
                weights=masses/energy.sum()*taps
                layers=slice(channel*taps,(channel+1)*taps)
                atlas[layers,gy,gx,:2]=offsets
                atlas[layers,gy,gx,2:]=slope
                pupils[layers,gy,gx,:2]=pupil_mean
                pupils[layers,gy,gx,2]=weights
                extent=max(extent,float(np.linalg.norm(offsets,axis=1).max()))
    for channel in range(3):
        relative=throughput[channel]/max(throughput[1,grid//2,grid//2],1e-12)
        pupils[channel*taps:(channel+1)*taps,:,:,3]=np.minimum(relative,1.)
    map_digest=hashlib.sha256(centroids.tobytes());map_digest.update(throughput.tobytes())
    map_digest.update(np.asarray([reference_z,source,sensor,aspect],dtype='f8').tobytes())
    result=Atlas({'prescription_id':lens.prescription.geometry_id,'prescription_schema':'optical-prescription/1','atlas':atlas.ravel().tolist(),'pupils':pupils.ravel().tolist(),
            'trace_backend':trace_backend,
            'trace_device':trace_device,
            'distortion':{'schema':'optica-field-map/1','id':map_digest.hexdigest(),'grid':grid,'aspect':aspect,'wavelengths_um':[.6563,.5876,.4861],
                          'centroids_mm_and_slopes':centroids.ravel().tolist(),'throughput':throughput.ravel().tolist(),
                          'reference_z_mm':reference_z,'source_m':source,'sensor_mm':sensor},
            'grid':grid,'taps':taps,'reference_z':reference_z,'matrix':paraxial_matrix(lens).ravel().tolist(),
            'last_z':float(lens.z[-1]),'efl_mm':lens.efl,'source_m':source,'iris_mm':iris,'max_iris_mm':lens.max_iris,'lens_model':lens_model,
            'radius_mm':extent,'max_slope':float(np.linalg.norm(atlas[...,2:],axis=-1).max()),'model':'sparse-geometric-gather','field_interpolation':'conditional-pupil-moments/1',
            'soften_internal_cutoff':soften_internal_cutoff,'iris_softness':iris_softness,
            'ghost_pairs':ghost_pairs(lens,coating_strength,coating_nm),
            'focus_calibration':focus_calibration(s),
            'warnings':['Prévia esparsa na GPU: interpolação espacial e depth são aproximações; não equivale ao render CPU.']})
    result.ray_array=atlas.ravel();result.pupil_array=pupils.ravel()
    result.ray_array.setflags(write=False);result.pupil_array.setflags(write=False)
    digest=hashlib.sha256(result.ray_array);digest.update(result.pupil_array);result['atlas_id']=digest.hexdigest()
    total_ms=(perf_counter()-started)*1000
    result['build_profile']={'lens_ms':lens_ms,'trace_ms':trace_ms,
                             'assembly_ms':max(0.,total_ms-lens_ms-trace_ms),
                             'build_ms':total_ms,'rays_per_bundle':n,'bundles':len(fields)*3,
                             'ray_cache_hit':ray_cache_hit,'ray_cache':_ray_cache.info()}
    return result
