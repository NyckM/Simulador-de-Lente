"""Analytic Airy, spectral scaling, energy, tilt and real prescriptions."""
from pathlib import Path
import sys,json
from dataclasses import replace
import numpy as np
from scipy.special import j1
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings
from optics.spectral_psf import fft_psf,calculate,transported_pupil,resample_intensity,_cache

def main():
    grid=256;dx=.02;z=80.;w=.5876;radius=2.
    axis=(np.arange(grid)-grid//2)*dx;xx,yy=np.meshgrid(axis,axis)
    aperture=(xx*xx+yy*yy<=radius**2).astype(complex)
    image,pitch=fft_psf(aperture,dx,z,w,padding=8);middle=image.shape[0]//2
    x=(np.arange(image.shape[1])-middle)*pitch;arg=2*np.pi*radius*x/(w*.001*z)
    oracle=np.ones_like(arg);mask=abs(arg)>1e-12;oracle[mask]=(2*j1(arg[mask])/arg[mask])**2
    measured=image[middle]/image[middle,middle];mask=abs(x)<3*1.22*w*.001*z/(2*radius)
    airy_error=float(abs(measured[mask]-oracle[mask]).max());assert airy_error<.003
    expected_null=1.219669891*w*.001*z/(2*radius);target=round(expected_null/pitch)
    local=image[middle,middle+target-2:middle+target+3];minimum=target-2+int(np.argmin(local));left,mid,right=image[middle,middle+minimum-1:middle+minimum+2];subpixel=.5*(left-right)/(left-2*mid+right);first_null=(minimum+subpixel)*pitch
    assert abs(first_null/expected_null-1)<.03
    assert abs(image.sum()-1)<3e-15
    red,red_pitch=fft_psf(aperture,dx,z,.6563,padding=8);blue,blue_pitch=fft_psf(aperture,dx,z,.4861,padding=8)
    assert np.array_equal(red,blue);assert abs(red_pitch/blue_pitch-.6563/.4861)<1e-15
    tilted=aperture*np.exp(2j*np.pi*xx/(dx*grid*4)*5)
    shifted,_=fft_psf(tilted,dx,z,w,padding=4);peak=np.unravel_index(shifted.argmax(),shifted.shape)
    assert peak==(grid*2,grid*2+5)
    # Phase sign reversal mirrors intensity; piston does not change it.
    asymmetric=aperture*np.exp(2j*np.pi*(.14*xx**3+.22*yy**2))
    a,_=fft_psf(asymmetric,dx,z,w);b,_=fft_psf(asymmetric*np.exp(1.731j),dx,z,w)
    assert np.max(abs(a-b))<1e-15
    conjugate,_=fft_psf(asymmetric.conjugate(),dx,z,w)
    assert np.max(abs(conjugate-np.roll(a[::-1,::-1],(1,1),(0,1))))<1e-15
    # Explicit blocked central hole: connected triangles cannot fill it.
    count=4096;i=np.arange(count)+.5;r=2*np.sqrt(i/count);theta=i*np.pi*(3-np.sqrt(5));xy=np.column_stack((r*np.cos(theta),r*np.sin(theta)))
    valid=r>.7;ids=np.flatnonzero(valid);coords=xy[valid]
    synthetic=dict(samples_requested=count,reference=dict(chief_plane_point_mm=[0,0,0]),rays=dict(plane_xyz_mm=np.column_stack((coords,np.zeros(len(ids)))).tolist(),sample_index=ids.tolist(),input_xy_mm=coords.tolist(),energy=np.ones(len(ids)).tolist(),opd_waves=np.zeros(len(ids)).tolist()))
    pupil,_,transport=transported_pupil(synthetic,128);assert abs(pupil[64,64])==0
    assert abs(transport['raster_flux']/transport['transported_flux']-1)<.025
    tiny=np.arange(81,dtype=float).reshape(9,9);tiny/=tiny.sum();rebinned=resample_intensity(tiny,.73,21,.64,[.17,-.09]);assert abs(rebinned.sum()-1)<1e-14
    _cache.clear();s=Settings(focus_m=5,source_m=5,blades=0)
    mono=calculate(s,spectrum='d');assert mono['sampling_resolved'] and calculate(s,spectrum='d')['profile']['cache_hit']
    assert calculate(replace(s,exposure=2,swirl=1),spectrum='d')['psf_id']==mono['psf_id']
    cases=[]
    for spec,field,quality,depth in [('CFd',[0,0],'standard','focus'),('d',[12,0],'high','focus'),('F',[0,0],'standard','focus'),('d',[0,0],'standard','scene')]:
        obj=replace(s,source_m=3) if depth=='scene' else s
        result=calculate(obj,field,spec,quality,depth)
        assert result['sensor_grid']['pitch_um']>0
        for channel in result['channels']:
            a=np.array(channel['intensity']);assert a.shape==(257,257) and np.isfinite(a).all() and a.min()>=0
            assert abs(a.sum()-channel['captured_energy'])<1e-12
        cases.append(dict(spectrum=spec,field=field,quality=quality,depth=depth,resolved=result['sampling_resolved'],warnings=result['warnings'],energy=[c['captured_energy'] for c in result['channels']]))
    defocused=calculate(replace(s,source_m=2),spectrum='d',depth='scene');assert 'phase_undersampled' in defocused['warnings']
    assert not np.allclose(defocused['channels'][0]['intensity'],mono['channels'][0]['intensity'])
    # Source depth is irrelevant in focus-plane mode; aperture/focus are not.
    assert calculate(replace(s,source_m=2),spectrum='d')['psf_id']==mono['psf_id']
    assert calculate(replace(s,iris_mm=4),spectrum='d')['psf_id']!=mono['psf_id']
    assert calculate(replace(s,focus_m=4),spectrum='d')['psf_id']!=mono['psf_id']
    for kw in [dict(spectrum='RGB'),dict(quality='unbounded'),dict(depth='bad'),dict(field=[float('nan'),0])]:
        try:calculate(s,**kw)
        except ValueError:pass
        else:raise AssertionError('invalid request accepted')
    assert _cache.info()['bytes']<=_cache.max_bytes
    report=dict(airy_max_error=airy_error,first_null_mm=first_null,expected_first_null_mm=expected_null,unit_energy=True,
        spectral_scale=True,conservative_sensor_resampling=True,phase_tilt_displacement=True,piston_invariance=True,phase_conjugation=True,blocked_hole_preserved=True,
        area_jacobian_flux_error=abs(transport['raster_flux']/transport['transported_flux']-1),cache_selectivity=True,cases=cases,
        defocus_sampling_guard=True,invalid_requests_rejected=4,cache=_cache.info())
    (ROOT/'research/spectral-psf-stage12-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))

if __name__=='__main__':main()
