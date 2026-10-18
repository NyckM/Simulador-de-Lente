from pathlib import Path
import sys,json,tempfile,time
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_mesh import topology,raster,render
from optics.geometry_render import options,project,Cancelled,load,start,status
from optics import jobs
k=np.array([[1,0,.5],[0,1,.5],[0,0,1]],float)
h=w=65;y,x=np.mgrid[:h,:w];z=1+x/1000
p=np.stack(((x-32)/w*z,(y-32)/h*z,z),-1);valid=np.ones((h,w),bool)
f,info=topology(valid,p,.05);assert len(f)==2*(h-1)*(w-1)
c=np.stack((x/(w-1),y/(h-1),np.full_like(x,.25,dtype=float)),-1).reshape(-1,3)
cfg=options(dict(focus_m=1,radius_mm=0,samples=16,size=65,visibility='mesh'))
a,ai=render(p.reshape(-1,3),c,k,(h,w),cfg,f,info,lambda a,b:None,lambda:False)
np.testing.assert_allclose(a[2:-2,2:-2,:3],c.reshape(h,w,3)[2:-2,2:-2],atol=1e-6);assert a[2:-2,2:-2,3].min()==1
# A textured plane exactly at focus is invariant under aperture changes.
focused=p.copy();focused[...,0]=(x-32)/w;focused[...,1]=(y-32)/h;focused[...,2]=1
fa,_=render(focused.reshape(-1,3),c,k,(h,w),{**cfg,'radius_mm':50},f,info,lambda a,b:None,lambda:False)
fz,_=render(focused.reshape(-1,3),c,k,(h,w),cfg,f,info,lambda a,b:None,lambda:False)
np.testing.assert_array_equal(fa,fz)
# Two continuous opaque planes with a known edge: foreground cuts the blue
# background, then moves across that edge when focus racks to the background.
planes=np.array([[-.5,-.5,1],[0,-.5,1],[0,.5,1],[-.5,.5,1],[-1,-1,2],[1,-1,2],[1,1,2],[-1,1,2]],float)
plane_colors=np.array([[1,0,0]]*4+[[0,0,1]]*4,float);plane_faces=np.array([[0,1,2],[0,2,3],[4,5,6],[4,6,7]])
occ,_=render(planes,plane_colors,k,(h,w),{**cfg,'radius_mm':50},plane_faces,{},lambda a,b:None,lambda:False)
assert occ[10:55,5:32,2].max()==0 and occ[32,40,2]>0
rack,_=render(planes,plane_colors,k,(h,w),{**cfg,'radius_mm':50,'focus_m':2},plane_faces,{},lambda a,b:None,lambda:False)
assert 0<rack[32,32,0]<1 and 0<rack[32,32,2]<1
# Missing source pixels cannot become fabricated surface triangles.
valid[20:25,20:25]=False;hf,hi=topology(valid,p,.05);assert hi['invalid_triangles']>0
hole,hoi=render(p[valid],c.reshape(h,w,3)[valid],k,(h,w),cfg,hf,hi,lambda a,b:None,lambda:False);assert hole[21:24,21:24,3].max()==0
# No connection across the foreground/background depth discontinuity.
zcut=np.ones((h,w));zcut[:,33:]=2;pc=p.copy();pc[...,2]=zcut
cf,ci=topology(np.ones((h,w),bool),pc,.05);assert ci['depth_cut_triangles']==2*(h-1)
tri_z=pc.reshape(-1,3)[cf,2];assert (tri_z.max(1)==tri_z.min(1)).all()
# Independent perspective-correct barycentric reference.
uv=np.array([[10,10],[50,10],[10,50]],float);pts=np.column_stack((np.zeros(3),np.zeros(3),[1,2,4]));colors=np.eye(3)
r=raster(uv,pts,colors,np.array([[0,1,2]]),65,65,lambda:False).reshape(65,65,4)
expected=np.array([.5,.25/2,.25/4]);expected/=expected.sum();np.testing.assert_allclose(r[20,20,:3],expected,atol=1e-12)
# Nearer surface wins, independent of triangle processing order.
pp=np.vstack((pts,np.column_stack((np.zeros(3),np.zeros(3),[.5,.5,.5]))));uu=np.vstack((uv,uv));cc=np.vstack((colors,np.tile([.2,.4,.8],(3,1))));faces=np.array([[0,1,2],[3,4,5]])
near=raster(uu,pp,cc,faces,65,65,lambda:False);rev=raster(uu,pp,cc,faces[::-1],65,65,lambda:False);np.testing.assert_array_equal(near,rev);np.testing.assert_allclose(near.reshape(65,65,4)[20,20,:3],[.2,.4,.8])
# Raster candidate memory remains bounded for very large triangles; cancellation
# is checked inside a triangle's candidate chunks, not only between samples.
huge=np.array([[-1e6,-1e6],[1e6,-1e6],[0,1e6]])
hr=raster(huge,pts,np.tile([.2,.4,.8],(3,1)),np.array([[0,1,2]]),65,65,lambda:False);assert hr[:,3].min()==1
checks=[0]
def stop_in_large_triangle():
 checks[0]+=1;return checks[0]>=3
try:raster(huge,pts,colors,np.array([[0,1,2]]),512,512,stop_in_large_triangle)
except Cancelled:pass
else:raise AssertionError('candidate chunk cancellation ignored')
assert checks[0]==3
try:raster(uv,pts,colors,np.array([[0,1,2]]),65,65,lambda:True)
except Cancelled:pass
else:raise AssertionError('cancel ignored')
try:render(p.reshape(-1,3),c,k,(h,w),cfg,np.empty((0,3),int),{},lambda a,b:None,lambda:False)
except ValueError:pass
else:raise AssertionError('empty mesh accepted')
folder=jobs.folder('17'*16);original=(folder/'geometry-000000.npz').read_bytes();mp,mc,mk,shape,mf,mi=load(folder,0,'points',True);zp,zc,zk,_,zf,zi=load(folder,0,'z',True)
np.testing.assert_array_equal(mf,zf);np.testing.assert_allclose(mp,zp,atol=1e-6);assert (folder/'geometry-000000.npz').read_bytes()==original
job=start(dict(job='17'*16,focus_m=3,radius_mm=10,samples=16,size=64,visibility='mesh'))
for _ in range(500):
 state=status(job['id'])
 if state['state'] not in ('starting','running'):break
 time.sleep(.02)
assert state['state']=='complete',state;assert state['info']['model']=='thin-lens-grid-triangles'
report=dict(passed=True,continuous_textured_surface=True,focus_plane_invariant=True,per_aperture_surface_occlusion=True,perspective_correct_color=True,opaque_occlusion_order_independent=True,depth_edges_not_bridged=True,masked_holes_preserved=True,bounded_raster_candidates=True,cancellation=True,empty_mesh_rejected=True,original_npz_preserved=True,point_z_topology_matches=True,async_api_mesh=True,triangles=mi['triangles'],energy_semantics=state['info']['energy_semantics'])
(ROOT/'research/geometry020-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)
