from pathlib import Path
import sys,json,time
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_render import options,Cancelled,start,status
from optics.geometry_mesh import render,topology
k=np.array([[1,0,.5],[0,1,.5],[0,0,1]],float);shape=(65,65)
uv=np.array([[-5,-5],[.2,-5],[.2,70],[-5,70]],float)
def points(q,z):return np.column_stack((((q+.5)/65-.5)*z,np.full(len(q),z)))
p=points(uv,1);faces=np.array([[0,1,2],[0,2,3]]);red=np.tile([1.,0,0],(4,1));cfg=options(dict(focus_m=1,radius_mm=0,samples=1,size=65,visibility='mesh'))
base,_=render(p,red,k,shape,cfg,faces,{},lambda a,b:None,lambda:False)
aa,ai=render(p,red,k,shape,{**cfg,'spatial_samples':16},faces,{},lambda a,b:None,lambda:False)
# Exact area of pixel [-.5,.5] covered by x <= .2 is .7.
assert base[32,0,3]==1 and aa[32,0,3]==.75
assert abs(aa[32,0,3]-.7)<abs(base[32,0,3]-.7)
np.testing.assert_allclose(aa[32,0],[.75,0,0,.75],atol=1e-12)
# Coverage integrates ONLY the visible foreground at each subpixel; it must
# not blend an occluded background color before visibility is decided.
backuv=np.array([[-5,-5],[70,-5],[70,70],[-5,70]],float)
pb=np.vstack((p,points(backuv,2)));rgb=np.vstack((red,np.tile([0,0,1.],(4,1))));f=np.vstack((faces,faces+4))
opaque,oi=render(pb,rgb,k,shape,{**cfg,'spatial_samples':16},f,{},lambda a,b:None,lambda:False)
np.testing.assert_allclose(opaque[32,0],[.75,0,.25,1],atol=1e-12)
# Full constant surface preserves exposure, coverage and linear color across
# all supported sample counts, with deterministic centered samples.
y,x=np.mgrid[:65,:65];flat=points(np.stack((x.ravel(),y.ravel()),-1),1).reshape(65,65,3);ff,mi=topology(np.ones(shape,bool),flat,.05);c=np.tile([.2,.4,.8],(65*65,1))
for n in (1,4,9,16):
 a,info=render(flat.reshape(-1,3),c,k,shape,{**cfg,'spatial_samples':n,'samples':4,'radius_mm':50},ff,mi,lambda a,b:None,lambda:False)
 np.testing.assert_allclose(a[2:-2,2:-2,:3],np.tile([.2,.4,.8],(61,61,1)),atol=1e-6);np.testing.assert_allclose(a[2:-2,2:-2,3],1,atol=1e-6)
 assert info['effective_samples']==4*n and info['spatial_samples']==n
b,_=render(p,red,k,shape,{**cfg,'spatial_samples':16},faces,{},lambda a,b:None,lambda:False);np.testing.assert_array_equal(aa,b)
# One sample reproduces the previous center-pixel raster exactly.
one,_=render(p,red,k,shape,{**cfg,'spatial_samples':1},faces,{},lambda a,b:None,lambda:False);np.testing.assert_array_equal(one,base)
steps=[]
def progress(a,b):steps.append((a,b))
try:render(p,red,k,shape,{**cfg,'spatial_samples':16},faces,{},progress,lambda:len(steps)>=2)
except Cancelled:pass
else:raise AssertionError('subpixel cancellation ignored')
assert steps==[(1,16),(2,16)]
for body in (dict(spatial_samples=True),dict(spatial_samples=3),dict(spatial_samples=4.0),dict(visibility='zbuffer',spatial_samples=4)):
 try:options(body)
 except ValueError:pass
 else:raise AssertionError('unsupported sampling accepted')
job=start(dict(job='17'*16,focus_m=3,radius_mm=10,samples=16,size=64,visibility='mesh',spatial_samples=4))
for _ in range(500):
 state=status(job['id'])
 if state['state'] not in ('starting','running'):break
 time.sleep(.02)
assert state['state']=='complete',state;assert state['current']==state['total']==64
report=dict(passed=True,analytic_edge_coverage=.7,single_sample_coverage=float(base[32,0,3]),sixteen_sample_coverage=float(aa[32,0,3]),edge_error_reduced=True,premultiplied_alpha_preserved=True,visibility_before_color_integration=True,constant_radiance_preserved=True,supported_modes=[1,4,9,16],deterministic=True,single_sample_legacy_exact=True,subpixel_cancellation=True,effective_progress_count=True,invalid_options_rejected=True)
(ROOT/'research/geometry021-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)
