from pathlib import Path
import sys,json,time
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_render import options,aperture,project,load,start,status,Cancelled
from optics.geometry_mesh import render,topology
from optics.geometry_cache import compute,clear
from optics import jobs
# Ratio one is exactly the prior disk/polygon sequence, including rotated polygons.
for n in (0,3,4,5,11):
 for count in (1,16,65):
  np.testing.assert_array_equal(aperture(count,.02,n,37,1),aperture(count,.02,n,37))
# Independent analytic ellipse support/covariance and rotation, equal-area transform.
for ratio in (.25,.5,2,4):
 samples=aperture(8192,1,0,0,ratio)
 q=samples/[np.sqrt(ratio),1/np.sqrt(ratio)]
 assert np.max(np.sum(q*q,axis=1))<=1+1e-12
 np.testing.assert_allclose(np.mean(samples*samples,axis=0),[ratio/4,1/(4*ratio)],rtol=.003)
 np.testing.assert_allclose(samples.mean(axis=0),0,atol=1e-14)
 angle=np.deg2rad(31);rot=np.array([[np.cos(angle),-np.sin(angle)],[np.sin(angle),np.cos(angle)]])
 for n in (0,3,6,11):
  np.testing.assert_allclose(aperture(64,.02,n,31,ratio),aperture(64,.02,n,0)*[np.sqrt(ratio),1/np.sqrt(ratio)]@rot.T,atol=1e-16)
  assert np.count_nonzero(aperture(64,0,n,31,ratio))==0
  np.testing.assert_array_equal(aperture(64,.02,n,31,ratio),aperture(64,.02,n,31,ratio))
# Camera-coordinate thin-lens projection sees the elliptical positions, not a post blur.
k=np.array([[1,0,.5],[0,1,.5],[0,0,1]],float);p=np.array([[0,0,2.]])
for a in aperture(64,.02,0,31,.5):np.testing.assert_allclose(project(p,k,a,1)[0],[.5,.5]+a*.5,atol=1e-15)
h=w=33;y,x=np.mgrid[:h,:w];points=np.stack(((x-16)/33,(y-16)/33,np.ones((h,w))),-1);faces,mi=topology(np.ones((h,w),bool),points,.05);rgb=np.tile([.2,.4,.8],(h*w,1))
config=options(dict(focus_m=1,radius_mm=20,samples=16,size=64,visibility='mesh',spatial_samples=4))
reference,_=render(points.reshape(-1,3),rgb,k,(h,w),config,faces,mi,lambda a,b:None,lambda:False)
for ratio in (.25,.5,2,4):
 for n in (0,5):
  result,info=render(points.reshape(-1,3),rgb,k,(h,w),{**config,'blades':n,'rotation_deg':31,'pupil_aspect':ratio},faces,mi,lambda a,b:None,lambda:False)
  np.testing.assert_array_equal(result,reference)
  assert info['pupil_shape']==('ellipse' if n==0 else 'polygon')
  assert info['pupil_aspect']==ratio and len(info['pupil_outline_mm'])==(n or 96)
  np.testing.assert_allclose(info['pupil_area_mm2'],(np.pi if n==0 else n*np.sin(2*np.pi/n)/2)*400)
  np.testing.assert_allclose(info['pupil_semiaxes_mm'],[20*np.sqrt(ratio),20/np.sqrt(ratio)])
# Real synthetic fixture: finite aperture changes rendered radiance, cache invalidates
# only result, and both CPU kernels/reference retain the same output and occlusion.
clear();folder=jobs.folder('17'*16);base=options(dict(focus_m=2,radius_mm=20,samples=16,size=64,visibility='mesh',spatial_samples=4,engine='optimized'))
circle,ci=compute(folder,base,load,lambda a,b:None,lambda:False)
oval={**base,'pupil_aspect':.5,'rotation_deg':31}
image,oi=compute(folder,oval,load,lambda a,b:None,lambda:False)
assert oi['performance']['geometry_cache_hit'] and not oi['performance']['result_cache_hit']
assert not np.array_equal(image,circle);assert np.all((image[...,3]>=0)&(image[...,3]<=1))
ref,_=compute(folder,{**oval,'engine':'reference'},load,lambda a,b:None,lambda:False);np.testing.assert_array_equal(image,ref)
reduction,_=compute(folder,{**oval,'kernel':'reduction'},load,lambda a,b:None,lambda:False);np.testing.assert_array_equal(image,reduction)
warm,wi=compute(folder,oval,load,lambda a,b:None,lambda:False);np.testing.assert_array_equal(warm,image);assert wi['performance']['result_cache_hit']
_,rotated=compute(folder,{**oval,'rotation_deg':32},load,lambda a,b:None,lambda:False);assert not rotated['performance']['result_cache_hit']
try:compute(folder,oval,load,lambda a,b:None,lambda:True)
except Cancelled:pass
else:raise AssertionError('cancel')
for bad in (True,0,.249,4.01,float('nan'),float('inf'),'2'):
 try:options(dict(visibility='mesh',pupil_aspect=bad))
 except ValueError:pass
 else:raise AssertionError('invalid aspect')
for bad in (dict(pupil_aspect=2),dict(visibility='zbuffer',pupil_aspect=.5),dict(visibility='mesh',rotation_deg=31)):
 try:options(bad)
 except ValueError:pass
 else:raise AssertionError('unsupported pupil')
assert options({})['pupil_aspect']==1
job=start(dict(job='17'*16,focus_m=2,radius_mm=20,samples=16,size=64,visibility='mesh',spatial_samples=4,pupil_aspect=.5,rotation_deg=31,engine='optimized'))
for _ in range(500):
 state=status(job['id'])
 if state['state'] not in ('starting','running'):break
 time.sleep(.02)
assert state['state']=='complete',state
with np.load(folder/('georender-'+job['id']+'.npz'),allow_pickle=False) as data:
 metadata=json.loads(str(data['metadata']));cfg=json.loads(str(data['configuration']))
 assert metadata['pupil_aspect']==cfg['pupil_aspect']==.5 and metadata['pupil_shape']=='ellipse'
 np.testing.assert_array_equal(data['rgba_premultiplied'],image)
report=dict(passed=True,legacy_ratio_one_exact=True,ellipse_support_and_covariance=True,rotation_after_stretch=True,area_preserved=True,focus_exposure_preserved=True,render_changes_before_visibility=True,cpu_kernels_identical=True,result_cache_invalidated=True,prepared_geometry_reused=True,metadata_and_npz_valid=True,invalid_controls_rejected=True,cancellation=True,async_ellipse=True)
(ROOT/'research/geometry025-validation.json').write_text(json.dumps(report,indent=2));print(report)
