from pathlib import Path
import sys,json,numpy as np
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from optics.core import Settings,normalize,refract,get_lens
from optics.ghosts import trace,analyze,fresnel,route
from optics.geometry import sag_gradient
s=Settings(soften_internal_cutoff=False,blades=0,focus_m=2,iris_mm=6)
plate=SimpleNamespace(surfaces=[dict(curvature_radius=0.,aperture_diameter=100.,nd=1.5),dict(curvature_radius=0.,aperture_diameter=100.,nd=1.)],z=[0.,5.],surface_index=lambda row,wave,disp:row['nd'])
p=np.array([[0.,0.,-1.],[1.,0.,-1.]]);d=normalize(np.array([[0.,0.,1.],[.1,0.,1.]]))
a=trace(plate,p,d,s,pair=(1,0),history=True);q,qd,v,E,h=a
assert v.all();assert abs(E[0]-(.96**2*.04**2))<1e-14
assert np.max(abs(qd-d))<1e-14
inside=refract(d,np.tile([0,0,-1.],(2,1)),1.,1.5)[0];expected=p[:,:2]+d[:,:2]/d[:,2:3]+15*inside[:,:2]/inside[:,2:3]
assert np.max(abs(q[:,:2]-expected))<1e-13
assert np.max(abs(np.array(h)[1:,:,2]-np.array([0,5,0,5])[:,None]))<1e-13
# Total internal reflection conserves energy on a reflected branch.
tir=normalize(np.array([[.9,0,.2]]));_,ok,T,R=fresnel(tir,np.array([[0,0,-1.]]),1.5,1.,.5876,s);assert not ok[0] and T[0]==0 and R[0]==1
# No-reflection tracing agrees with the original sequential model.
lens=get_lens(s);p=np.column_stack((np.linspace(-3,3,33),np.zeros(33),np.full(33,-1.)));d=normalize(p-np.array([0.,0.,-5000.]));ours=trace(lens,p,d,s);legacy=lens.trace(p,d,s)
assert np.array_equal(ours[2],legacy[2]);valid=ours[2];error=float(np.max(abs(ours[0][valid]-legacy[0][valid])));assert error<1e-9
report=analyze(s,[10,0],5,1024,16);assert report['families'];energies=[c['energy_fraction'] for f in report['families'] for c in f['channels']];assert max(energies)>0 and all(0<=e<=1 for e in energies);assert analyze(s,[10,0],5,1024,16)['profile']['cache_hit']
coated=analyze(Settings(**{**s.__dict__,'coating_strength':1}),[10,0],5,1024,16);assert sum(c['energy_fraction'] for f in coated['families'] for c in f['channels'])<sum(energies)
for bad in [dict(samples=True),dict(pair_limit=100),dict(distance_m=float('nan')),dict(field=[100,0])]:
 try:analyze(s,**bad);raise AssertionError('invalid request accepted')
 except ValueError:pass
geometry=[]
for edits in [(),((0,'shape',1.),),((0,'shape',3.),(0,'conic',-1.))]:
 config=Settings(**{**s.__dict__,'lens_edits':edits});test_lens=get_lens(config)
 report_case=analyze(config,[5,0],5,1024,8);assert all(np.isfinite(c['xy_mm']).all() for f in report_case['families'] for c in f['channels'])
 family=next(f for f in report_case['families'] if f['paths_xyz_mm']);pair=(family['first_surface'],family['second_surface']);schedule=route(len(test_lens.surfaces),pair);max_specular=0
 for path in family['paths_xyz_mm']:
  path=np.array(path)
  for step,(surface,travel,bounce) in enumerate(schedule):
   if not bounce:continue
   incoming=normalize(path[step+1]-path[step]);outgoing=normalize(path[step+2]-path[step+1]);row=test_lens.surfaces[surface];point=path[step+1];_,gx,gy,_=sag_gradient(row,point[0],point[1]);normal=normalize(np.array([gx,gy,-1.]));specular_expected=incoming-2*np.dot(incoming,normal)*normal;max_specular=max(max_specular,float(np.max(abs(outgoing-specular_expected))))
 assert max_specular<1e-10;geometry.append(dict(edits=edits,specular_error=max_specular))
result=dict(plane_plate_energy=float(E[0]),plane_plate_position_error=float(np.max(abs(q[:,:2]-expected))),legacy_position_error=error,geometry=geometry,TIR=True,cache=True,coating_reduces_energy=True,pairs=report['pairs_evaluated'],max_ghost_energy=max(energies),total_ms=report['profile']['total_ms'],input_validation=True)
Path(__file__).resolve().parents[1].joinpath('research/ghosts-stage16-validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
