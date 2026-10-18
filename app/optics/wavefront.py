"""CPU optical path and spherical-reference phase on an exit-space plane.

Irregular ray samples, not a diffraction PSF or an FFT-ready exit pupil.
"""
import json,time,hashlib
from dataclasses import asdict,replace
import numpy as np
from scipy.optimize import least_squares
from .core import get_lens,normalize,focus_calibration
from .preview import focus_plane
from .geometry import entry_plane
from .cache import ByteCache

_cache=ByteCache(16*1024*1024,8)
PHYSICAL_NAMES=('lens_model','lens_edits','source_m','focus_m','filmback_mm','ray_focus','iris_mm','blades','rotation','sensor_mm','dispersion','coating_strength','coating_nm','soften_internal_cutoff','iris_softness','aperture_custom','aperture_mask','aperture_invert')

def plane_reference(points,directions,opl,plane_z,image_point,index=1):
    """Continue in homogeneous image space and compare spherical eikonals."""
    t=(plane_z-points[:,2])/directions[:,2]
    hits=points+t[:,None]*directions
    length=opl+index*t
    referenced=length+index*np.linalg.norm(hits-image_point,axis=1)
    return hits,length,referenced

def remove_piston_tilt(xy,opd,energy):
    radius=max(float(np.max(np.linalg.norm(xy,axis=1))),1e-12)
    design=np.column_stack((np.ones(len(xy)),xy/radius));weight=np.sqrt(energy/energy.sum())
    coefficients,_,rank,_=np.linalg.lstsq(design*weight[:,None],opd*weight,rcond=None)
    if rank<3:raise ValueError('Amostras insuficientes para separar piston e tilt.')
    residual=opd-design@coefficients
    return residual,dict(piston_mm=float(coefficients[0]),tilt_gradient= (coefficients[1:]/radius).tolist())

def analyze(settings,field=(0.,0.),wavelength_um=.5876,samples=4096):
    started=time.perf_counter()
    if isinstance(samples,bool) or samples not in (1024,4096,16384):raise ValueError('Frente de onda: use 1024, 4096 ou 16384 raios.')
    if isinstance(wavelength_um,bool) or not np.isfinite(wavelength_um) or not .38<=wavelength_um<=.78:raise ValueError('Comprimento de onda: 0,38 a 0,78 µm.')
    field=np.asarray(field,dtype='f8')
    if field.shape!=(2,) or not np.isfinite(field).all() or np.max(abs(field))>settings.sensor_mm/2:raise ValueError('Campo óptico inválido.')
    # Render-only controls cannot change a physical wavefront.
    names=PHYSICAL_NAMES
    values=asdict(settings);key=json.dumps([[(k,values[k]) for k in names],field.tolist(),float(wavelength_um),samples],sort_keys=True)
    key=hashlib.sha256(key.encode()).hexdigest()
    cached=_cache.get(key)
    if cached is not None:return {**cached,'profile':dict(cache_hit=True,total_ms=(time.perf_counter()-started)*1000)}
    lens=get_lens(settings);launch_z=entry_plane(lens);front_radius=lens.surfaces[0]['aperture_diameter']/2
    source=np.array([-field[0]*settings.source_m*1000/lens.efl,-field[1]*settings.source_m*1000/lens.efl,-settings.source_m*1000])
    stop=next(i for i,row in enumerate(lens.surfaces) if row.get('is_stop'))
    reference_settings=replace(settings,aperture_custom=False,blades=0,iris_mm=80,soften_internal_cutoff=False)
    def trace_targets(xy,s,history=True):
        launch=np.column_stack((xy,np.full(len(xy),launch_z)))
        result=lens.trace(launch,normalize(launch-source),s,wavelength_um,history=history,optical_path=True)
        return (*result[:-1],result[-1]+np.linalg.norm(launch-source,axis=1))
    def stop_residual(xy):
        return trace_targets(np.array([xy]),reference_settings)[4][stop+1][0,:2]
    solved=least_squares(stop_residual,[0.,0.],bounds=(-front_radius,front_radius),xtol=1e-12,ftol=1e-12,gtol=1e-12,max_nfev=50)
    cp,cd,cv,ce,cpaths,copl=trace_targets(np.array([solved.x]),reference_settings)
    if not solved.success or np.linalg.norm(stop_residual(solved.x))>1e-6 or not cv[0]:raise ValueError('Não foi possível encontrar o raio principal através do centro da íris.')
    i=np.arange(samples)+.5;r=front_radius*np.sqrt(i/samples);theta=i*np.pi*(3-np.sqrt(5));targets=np.column_stack((r*np.cos(theta),r*np.sin(theta)))
    p,d,valid,energy,paths,opl=trace_targets(targets,settings)
    valid &= np.isfinite(opl)&np.isfinite(p).all(axis=1)&(d[:,2]>1e-10)&(energy>1e-12)
    if valid.sum()<8:raise ValueError('Poucos raios transmitidos para avaliar a frente de onda. Abra a íris ou aumente as amostras.')
    indices=np.flatnonzero(valid);p=p[valid];d=d[valid];opl=opl[valid];energy=energy[valid]
    plane_z=float(max(p[:,2].max(),cp[0,2])+1.)
    sensor_z=focus_plane(settings.focus_m,lens)+settings.filmback_mm
    if settings.ray_focus:sensor_z+=focus_calibration(settings,settings.focus_m)['shift_mm']
    if sensor_z<=plane_z:raise ValueError('O sensor precisa estar depois do plano de avaliação, fora dos vidros.')
    image_point=cp[0]+(sensor_z-cp[0,2])/cd[0,2]*cd[0]
    out_index=lens.surface_index(lens.surfaces[-1],wavelength_um,settings.dispersion)
    hit,length,spherical=plane_reference(p,d,opl,plane_z,image_point,out_index)
    chief_hit,chief_length,chief_spherical=plane_reference(cp,cd,copl,plane_z,image_point,out_index)
    opd=spherical-chief_spherical[0];residual,fit=remove_piston_tilt(hit[:,:2]-chief_hit[0,:2],opd,energy)
    wavelength_mm=wavelength_um*.001;waves=opd/wavelength_mm;corrected=residual/wavelength_mm;phase=2*np.pi*corrected
    mean=float(np.average(waves,weights=energy));rms=float(np.sqrt(np.average((waves-mean)**2,weights=energy)))
    result=dict(schema='optica-wavefront/1',prescription_id=lens.prescription.geometry_id,wavefront_id=key,configuration={k:values[k] for k in names},backend='cpu-float64',samples_requested=samples,samples_valid=len(hit),field_mm=field.tolist(),wavelength_um=float(wavelength_um),units=dict(length='mm',opd='waves',phase='rad'),
        reference=dict(type='spherical-eikonal-on-exit-space-plane',chief='stop-center-solved',launch_z_mm=float(launch_z),plane_z_mm=plane_z,sensor_z_mm=float(sensor_z),image_point_mm=image_point.tolist(),chief_plane_point_mm=chief_hit[0].tolist(),chief_opl_mm=float(chief_length[0]),image_space_index=float(out_index)),
        fit=fit,statistics=dict(rms_piston_removed_waves=rms,rms_piston_tilt_removed_waves=float(np.sqrt(np.average(corrected**2,weights=energy))),pv_raw_waves=float(np.ptp(waves)),pv_piston_tilt_removed_waves=float(np.ptp(corrected))),
        rays=dict(sample_index=indices.tolist(),input_xy_mm=targets[valid].tolist(),stop_xy_mm=paths[stop+1][valid,:2].tolist(),plane_xyz_mm=hit.tolist(),opl_to_plane_mm=length.tolist(),opd_waves=waves.tolist(),residual_waves=corrected.tolist(),energy=energy.tolist(),amplitude_per_ray=np.sqrt(energy).tolist(),phase_residual_rad=phase.tolist()),
        limits=['Irregular samples; amplitude is per ray, not pupil-area density.','Reference plane lies outside glass; it is not the computed exit pupil.','Scalar geometric phase; coatings add transmission but no complex coating phase.','No diffraction PSF, interference render or artistic modifiers applied.'])
    _cache.put(key,result,len(json.dumps(result))*5)
    return {**result,'profile':dict(cache_hit=False,total_ms=(time.perf_counter()-started)*1000)}
