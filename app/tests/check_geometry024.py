from pathlib import Path
import sys,json,time
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_render import options,aperture,project,start,status
from optics.geometry_mesh import render,topology
# Default circular sample sequence stays exactly unchanged.
count=64;i=np.arange(count//2);theta=i*np.pi*(3-np.sqrt(5));rad=np.sqrt((i+.5)/(count//2))*.02;xy=np.stack((rad*np.cos(theta),rad*np.sin(theta)),-1)
np.testing.assert_array_equal(aperture(count,.02),np.concatenate((xy,-xy)))
for n in range(3,12):
 samples=aperture(4096,1,n,0)
 normals=np.stack((np.cos((np.arange(n)+.5)*2*np.pi/n),np.sin((np.arange(n)+.5)*2*np.pi/n)),-1)
 assert (samples@normals.T).max()<=np.cos(np.pi/n)+1e-12
 theoretical=(2+np.cos(2*np.pi/n))/6
 assert abs(np.mean(np.sum(samples*samples,axis=1))-theoretical)<.004
 assert np.linalg.norm(samples.mean(axis=0))<.008
 if n%2==0:np.testing.assert_allclose(samples.mean(axis=0),0,atol=1e-14)
 rotated=aperture(64,.02,n,37);base=aperture(64,.02,n,0);a=np.deg2rad(37);rotation=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]])
 np.testing.assert_allclose(rotated,base@rotation.T,atol=1e-16)
 np.testing.assert_array_equal(aperture(64,.02,n,37),rotated)
 assert np.count_nonzero(aperture(64,0,n,37))==0
# Projection transforms pupil coordinates with the thin-lens defocus factor.
k=np.array([[1,0,.5],[0,1,.5],[0,0,1]],float);p=np.array([[0,0,2.]])
for opening in aperture(16,.02,5,-30):np.testing.assert_allclose(project(p,k,opening,1)[0],[.5,.5]+opening*(1-1/2),atol=1e-15)
# A fully covered plane at focus keeps color and exposure for every pupil shape.
h=w=65;y,x=np.mgrid[:h,:w];points=np.stack(((x-32)/65,(y-32)/65,np.ones((h,w))),-1);faces,mi=topology(np.ones((h,w),bool),points,.05);rgb=np.tile([.2,.4,.8],(h*w,1))
config=options(dict(focus_m=1,radius_mm=20,samples=16,size=65,visibility='mesh',spatial_samples=4))
reference,_=render(points.reshape(-1,3),rgb,k,(h,w),config,faces,mi,lambda a,b:None,lambda:False)
for n in (3,5,8,11):
 result,info=render(points.reshape(-1,3),rgb,k,(h,w),{**config,'blades':n,'rotation_deg':-37},faces,mi,lambda a,b:None,lambda:False)
 np.testing.assert_array_equal(result,reference);assert len(info['pupil_vertices_mm'])==n and len(info['pupil_samples_mm'])==16
 np.testing.assert_allclose(info['pupil_area_mm2'],n*20**2*np.sin(2*np.pi/n)/2)
 assert info['pupil_shape']=='polygon' and info['rotation_deg']==-37
for bad in (dict(blades=2),dict(blades=True),dict(blades=12),dict(blades=3.0),dict(visibility='mesh',blades=3,rotation_deg=181),dict(visibility='mesh',rotation_deg=2),dict(blades=3)):
 try:options(bad)
 except ValueError:pass
 else:raise AssertionError('invalid iris')
job=start(dict(job='17'*16,focus_m=3,radius_mm=10,samples=16,size=64,visibility='mesh',spatial_samples=4,blades=5,rotation_deg=-30,engine='optimized'))
for _ in range(500):
 state=status(job['id'])
 if state['state'] not in ('starting','running'):break
 time.sleep(.02)
assert state['state']=='complete',state;assert state['info']['blades']==5
report=dict(passed=True,circular_legacy_exact=True,polygon_support_valid=True,uniform_area_second_moments=True,even_polygon_centroid_zero=True,rotation_consistent=True,deterministic=True,zero_radius_preserved=True,defocus_projection_valid=True,focus_plane_exposure_unchanged=True,pupil_area_and_samples_exported=True,invalid_controls_rejected=True,async_polygon_render=True)
(ROOT/'research/geometry024-validation.json').write_text(json.dumps(report,indent=2));print(report)
