"""Scalar, paraxial Fourier PSFs from a transported, aberrated reference pupil.

Analysis only. Does not add diffraction to the existing geometric compositor.
"""
import hashlib,json,time
from dataclasses import replace,asdict
import numpy as np
from scipy.spatial import Delaunay
from scipy.sparse import csr_matrix
from .wavefront import analyze,PHYSICAL_NAMES
from .cache import ByteCache

_cache=ByteCache(96*1024*1024,8)
SPECTRA={'d':(.5876,), 'C':(.6563,), 'F':(.4861,), 'CFd':(.6563,.5876,.4861)}

def resample_intensity(intensity,source_pitch,target_size,target_pitch,offset):
    """Conservative pixel-area overlap on a shared physical sensor grid."""
    def weights(size,shift):
        old=(np.arange(size)-size//2)*source_pitch+shift
        new=(np.arange(target_size)-target_size//2)*target_pitch
        left=np.maximum(new[:,None]-target_pitch/2,old[None,:]-source_pitch/2)
        right=np.minimum(new[:,None]+target_pitch/2,old[None,:]+source_pitch/2)
        return csr_matrix(np.maximum(right-left,0)/source_pitch)
    mx=weights(intensity.shape[1],offset[0]);my=weights(intensity.shape[0],offset[1])
    return (mx@(my@intensity).T).T

def fft_psf(pupil,dx_mm,distance_mm,wavelength_um,index=1.,padding=4):
    """Return unit-energy intensity and sensor pitch in mm. No display gamma."""
    if pupil.ndim!=2 or pupil.shape[0]!=pupil.shape[1] or not np.isfinite(pupil).all():
        raise ValueError('Pupila complexa inválida.')
    if not all(np.isfinite(x) and x>0 for x in (dx_mm,distance_mm,wavelength_um,index)):
        raise ValueError('Escala física inválida.')
    size=pupil.shape[0]*padding
    padded=np.zeros((size,size),complex);start=(size-pupil.shape[0])//2
    padded[start:start+pupil.shape[0],start:start+pupil.shape[1]]=pupil
    amplitude=np.fft.fftshift(np.fft.fft2(np.fft.ifftshift(padded)))
    intensity=abs(amplitude)**2;total=intensity.sum()
    if not np.isfinite(total) or total<=0:raise ValueError('Pupila sem energia transmitida.')
    return intensity/total,wavelength_um*.001*distance_mm/(index*size*dx_mm)

def transported_pupil(wavefront,grid):
    """Rasterize connected input triangles, transporting flux by area Jacobian.

    Invalid vertices remove entire triangles; blocked holes are never filled
    by a convex hull of the remaining rays. Folded maps are rejected.
    """
    rays=wavefront['rays'];xy=np.array(rays['plane_xyz_mm'])[:,:2]
    chief=np.array(wavefront['reference']['chief_plane_point_mm'])[:2];xy-=chief
    ids=np.array(rays['sample_index']);count=wavefront['samples_requested']
    actual=np.array(rays['input_xy_mm']);i=ids+.5
    radius=float(np.median(np.linalg.norm(actual,axis=1)/np.sqrt(i/count)))
    i=np.arange(count)+.5;r=radius*np.sqrt(i/count);theta=i*np.pi*(3-np.sqrt(5))
    original=np.column_stack((r*np.cos(theta),r*np.sin(theta)))
    lookup=np.full(count,-1,int);lookup[ids]=np.arange(len(ids))
    triangles=Delaunay(original).simplices;triangles=lookup[triangles]
    triangles=triangles[(triangles>=0).all(axis=1)]
    extent=max(float(abs(xy).max())*1.08,1e-6);dx=2*extent/grid
    axis=(np.arange(grid)-grid//2)*dx
    pupil=np.zeros((grid,grid),complex);coverage=np.zeros((grid,grid),np.uint8);phase_grid=np.zeros((grid,grid))
    energy=np.array(rays['energy']);waves=np.array(rays['opd_waves'])
    # Piston removal changes no intensity and improves phase argument accuracy.
    waves-=np.average(waves,weights=energy)
    max_phase_span=0.;flux=0.;input_area=0.;folds=0
    for tri in triangles:
        source=actual[tri];target=xy[tri]
        a,b=source[1]-source[0],source[2]-source[0];ain=(a[0]*b[1]-a[1]*b[0])/2
        a,b=target[1]-target[0],target[2]-target[0];aout=(a[0]*b[1]-a[1]*b[0])/2
        if abs(aout)<1e-12 or ain*aout<=0:folds+=1;continue
        density=float(energy[tri].mean()*abs(ain/aout));input_area+=abs(ain);flux+=energy[tri].mean()*abs(ain)
        max_phase_span=max(max_phase_span,float(np.ptp(waves[tri])))
        lo=np.maximum(np.ceil(target.min(axis=0)/dx+grid//2).astype(int),0)
        hi=np.minimum(np.floor(target.max(axis=0)/dx+grid//2).astype(int),grid-1)
        if (hi<lo).any():continue
        xx,yy=np.meshgrid(axis[lo[0]:hi[0]+1],axis[lo[1]:hi[1]+1]);points=np.stack((xx-target[0,0],yy-target[0,1]),axis=-1)
        bary=points@np.linalg.inv(np.column_stack((a,b))).T
        u,v=bary[...,0],bary[...,1];inside=(u>=-1e-10)&(v>=-1e-10)&(u+v<=1+1e-10)
        phase=waves[tri[0]]+u*(waves[tri[1]]-waves[tri[0]])+v*(waves[tri[2]]-waves[tri[0]])
        sl=(slice(lo[1],hi[1]+1),slice(lo[0],hi[0]+1))
        pupil[sl][inside]=np.sqrt(density)*np.exp(2j*np.pi*phase[inside]);coverage[sl][inside]+=1;phase_grid[sl][inside]=phase[inside]
    if folds or (coverage>1).sum()>max(4,(coverage>0).sum()*.005):
        raise ValueError('Mapa de raios dobrado/caústica: a aproximação de pupila única não é válida neste plano.')
    if (coverage>0).sum()<16:raise ValueError('Pupila pouco amostrada; abra a íris ou aumente a qualidade.')
    raster_span=0.
    for dim in (0,1):
        mask=np.diff((coverage>0).astype(int),axis=dim)==0
        occupied=(coverage[:-1,:]>0) if dim==0 else (coverage[:,:-1]>0)
        delta=abs(np.diff(phase_grid,axis=dim))[mask&occupied]
        if delta.size:raster_span=max(raster_span,float(delta.max()))
    return pupil,dx,dict(connected_triangles=len(triangles),covered_pixels=int((coverage>0).sum()),max_triangle_phase_span_waves=max_phase_span,max_raster_phase_step_waves=raster_span,
        transmitted_input_area_mm2=float(input_area),transported_flux=float(flux),raster_flux=float((abs(pupil)**2).sum()*dx*dx))

def calculate(settings,field=(0.,0.),spectrum='CFd',quality='standard',depth='focus'):
    started=time.perf_counter()
    if spectrum not in SPECTRA or quality not in ('standard','high') or depth not in ('focus','scene'):
        raise ValueError('Opções de PSF inválidas.')
    effective=replace(settings,source_m=settings.focus_m) if depth=='focus' else settings
    samples,grid=(4096,128) if quality=='standard' else (16384,256)
    field=np.asarray(field,dtype='f8')
    if field.shape!=(2,) or not np.isfinite(field).all() or np.max(abs(field))>settings.sensor_mm/2:raise ValueError('Campo óptico inválido.')
    values=asdict(effective);configuration={k:values[k] for k in PHYSICAL_NAMES}
    key=hashlib.sha256(json.dumps([configuration,field.tolist(),quality,depth,spectrum],sort_keys=True).encode()).hexdigest()
    cached=_cache.get(key)
    if cached is not None:return {**cached,'profile':dict(cache_hit=True,total_ms=(time.perf_counter()-started)*1000)}
    waves=[analyze(effective,field,w,samples) for w in SPECTRA[spectrum]]
    channels=[];warnings=[]
    for wave in waves:
        pupil,dx,transport=transported_pupil(wave,grid);ref=wave['reference'];distance=ref['sensor_z_mm']-ref['plane_z_mm']
        intensity,pitch=fft_psf(pupil,dx,distance,wave['wavelength_um'],ref['image_space_index'])
        angle=np.linalg.norm(np.array(ref['image_point_mm'])[:2]-np.array(ref['chief_plane_point_mm'])[:2])/distance
        na_proxy=(grid*dx/2)/distance
        resolved=max(transport['max_triangle_phase_span_waves'],transport['max_raster_phase_step_waves'])<=.5
        if not resolved:warnings.append('phase_undersampled')
        if na_proxy>.15 or angle>.15:warnings.append('nonparaxial_field')
        flux_error=abs(transport['raster_flux']/transport['transported_flux']-1)
        if flux_error>.1:warnings.append('pupil_raster_error')
        channels.append(dict(wavefront_id=wave['wavefront_id'],wavelength_um=wave['wavelength_um'],pitch_mm=pitch,intensity=intensity,
            chief_image_mm=ref['image_point_mm'][:2],transport=transport,resolved=resolved,angle_proxy=float(angle),na_proxy=float(na_proxy)))
    # All colours share a sensor grid about the d-line (or the selected line).
    reference=channels[1] if len(channels)==3 else channels[0];center=np.array(reference['chief_image_mm'])
    pitch=max(c['pitch_mm'] for c in channels);output_size=257
    exports=[]
    for c in channels:
        offset=np.array(c['chief_image_mm'])-center
        # Integrate intensity over pixel area. Distinct wavelengths add incoherently.
        image=resample_intensity(c['intensity'],c['pitch_mm'],output_size,pitch,offset)
        capture=float(image.sum())
        if capture<.95:warnings.append('sensor_window_clipped')
        exports.append({k:v for k,v in c.items() if k!='intensity'}|dict(intensity=image.tolist(),captured_energy=capture,chief_offset_um=(offset*1000).tolist()))
    result=dict(schema='optica-spectral-psf/1',psf_id=key,backend='cpu-float64-fft',method='scalar-paraxial-reference-pupil-fourier',
        configuration=waves[0]['configuration'],field_mm=field.tolist(),depth_mode=depth,object_distance_m=effective.source_m,spectrum=spectrum,quality=quality,
        sensor_grid=dict(width=output_size,height=output_size,pitch_um=pitch*1000,center_image_mm=center.tolist(),units='unit-energy-per-pixel-before-crop'),
        channels=exports,sampling_resolved=all(c['resolved'] for c in channels),warnings=sorted(set(warnings)),cache_limits=_cache.info(),
        limits=['Paraxial scalar Fourier approximation on the exit-space reference plane; not a vector diffraction solver.',
                'Connected triangles and area Jacobian transport; caustics/folded maps are rejected.',
                'Intensity normalized on the full FFT; exported sensor window is not renormalized.',
                'C/d/F are three independent spectral samples, not calibrated RGB or continuous white light.',
                'Inspection and kernel export only; existing geometric image render is unchanged.'])
    _cache.put(key,result,len(json.dumps(result))*5)
    return {**result,'profile':dict(cache_hit=False,total_ms=(time.perf_counter()-started)*1000)}
