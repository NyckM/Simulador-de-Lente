"""Independent slab OPL, perfect-sphere phase and per-segment accounting."""
from pathlib import Path
import json,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Lens,Settings,get_lens,normalize
from optics.wavefront import analyze,plane_reference,remove_piston_tilt

def main():
    # Analytic Snell slab: air followed by 5 mm glass, all incidence angles.
    slab=object.__new__(Lens);slab.surfaces=[dict(curvature_radius=0,aperture_diameter=100,nd=1.5),dict(curvature_radius=0,aperture_diameter=100,nd=1)];slab.z=np.array([0,5])
    angle=np.linspace(-.5,.5,101);p=np.tile([0,0,-10],(101,1));d=np.column_stack((np.sin(angle),np.zeros(101),np.cos(angle)));s=Settings(soften_internal_cutoff=False)
    old=slab.trace(p,d,s,history=True);new=slab.trace(p,d,s,history=True,optical_path=True)
    for a,b in zip(old[:4],new[:4]):assert np.array_equal(a,b)
    analytic=10/np.cos(angle)+1.5*5/np.sqrt(1-(np.sin(angle)/1.5)**2)
    slab_error=float(np.max(abs(new[5]-analytic)));assert slab_error<1e-13
    # A converging perfect sphere has constant total path to the image point.
    rng=np.random.default_rng(1101);points=np.column_stack((rng.uniform(-2,2,(4096,2)),np.full(4096,3.)))
    q=np.array([.2,-.1,20.]);direction=normalize(q-points);opl=100-np.linalg.norm(q-points,axis=1)
    hit,length,spherical=plane_reference(points,direction,opl,6,q)
    sphere_error=float(np.max(abs(spherical-100)));assert sphere_error<3e-14
    xy=hit[:,:2];energy=rng.uniform(.1,1,len(xy));plane=1.234+.02*xy[:,0]-.03*xy[:,1]
    residual,fit=remove_piston_tilt(xy,plane,energy);assert max(abs(residual))<2e-15;assert np.max(abs(np.array(fit['tilt_gradient'])-[.02,-.03]))<1e-15
    cases=[]
    for edits,field in [([], [0,0]),([], [12,0]),([(0,'material',2),(2,'material',3)],[0,0]),([(0,'shape',1)],[0,0]),([(0,'shape',3),(0,'conic',-1)],[0,0])]:
        settings=Settings.parse(dict(lens_edits=edits,iris_mm=6,ray_focus=False,focus_m=5));a=analyze(settings,field,samples=4096);assert analyze(settings,field,samples=4096)['profile']['cache_hit']
        assert a['backend']=='cpu-float64' and a['samples_valid']>20
        ray=a['rays'];assert np.isfinite(ray['opd_waves']).all();assert np.max(abs(np.array(ray['amplitude_per_ray'])**2-ray['energy']))<3e-16
        assert abs(np.average(ray['residual_waves'],weights=ray['energy']))<1e-9
        # Independent accounting using legacy path history, indexed accepted rays.
        lens=get_lens(settings);n=4096;i=np.arange(n)+.5;r=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(i/n);t=i*np.pi*(3-np.sqrt(5));launch=np.column_stack((r*np.cos(t),r*np.sin(t),np.full(n,a['reference']['launch_z_mm'])))
        source=np.array([-field[0]*settings.source_m*1000/lens.efl,-field[1]*settings.source_m*1000/lens.efl,-settings.source_m*1000]);p,d,valid,energy,paths=lens.trace(launch,normalize(launch-source),settings,.5876,history=True)
        ids=np.array(ray['sample_index']);oracle=np.linalg.norm(launch[ids]-source,axis=1);index=1.
        for j,row in enumerate(lens.surfaces):oracle+=index*np.linalg.norm(paths[j+1][ids]-paths[j][ids],axis=1);index=lens.surface_index(row,.5876,settings.dispersion)
        oracle+=index*(a['reference']['plane_z_mm']-p[ids,2])/d[ids,2]
        error=float(np.max(abs(oracle-ray['opl_to_plane_mm'])));assert error<1e-9
        cases.append(dict(edits=edits,field=field,accepted=a['samples_valid'],opl_error_mm=error,rms=a['statistics']))
    neutral=Settings.parse(dict(iris_mm=6,ray_focus=False,focus_m=5));a=analyze(neutral,samples=1024)
    altered=Settings.parse(dict(iris_mm=6,ray_focus=False,focus_m=5,k1=0,swirl=1,exposure=2));assert analyze(altered,samples=1024)['rays']==a['rays']
    focused=analyze(Settings.parse(dict(iris_mm=6,ray_focus=False,focus_m=4)),samples=1024);assert focused['rays']['opd_waves']!=a['rays']['opd_waves']
    for kwargs in (dict(samples=True),dict(samples=100000),dict(field=[float('nan'),0]),dict(wavelength_um=0)):
        try:analyze(neutral,**kwargs)
        except ValueError:pass
        else:raise AssertionError('invalid request')
    report=dict(slab_rays=101,slab_opl_error_mm=slab_error,perfect_spherical_rays=4096,sphere_error_mm=sphere_error,piston_tilt_exact=True,cases=cases,cache=True,creative_controls_excluded=True,focus_changes_phase=True,invalid_requests_rejected=4)
    (ROOT/'research/wavefront-stage11-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

if __name__=='__main__':main()
