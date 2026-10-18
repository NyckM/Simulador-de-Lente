from pathlib import Path
import sys,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_render import render,options,Cancelled
k=np.array([[1,0,.5],[0,1,.5],[0,0,1]],float)
config=options(dict(focus_m=1,radius_mm=0,samples=16,size=129,visibility='zbuffer'))
p=np.array([[0,0,1],[0,0,2]],float);c=np.array([[1,0,0],[0,0,3]],float)
a,info=render(p,c,k,(129,129),config)
assert a[64,64,0]==1 and a[...,2].sum()==0
np.testing.assert_allclose(info['occluded_linear_energy'],[0,0,3]);np.testing.assert_allclose(info['lost_linear_energy'],0,atol=1e-10)
# Permuting input must not change visibility or RGB.
b,_=render(p[::-1],c[::-1],k,(129,129),config);np.testing.assert_array_equal(a,b)
# Equal-depth fragments accumulate: no arbitrary input-order tie breaking.
same=p.copy();same[:,2]=1
tie,ti=render(same,c,k,(129,129),config);np.testing.assert_allclose(tie[64,64,:3],[.5,0,1.5]);assert max(ti['occluded_linear_energy'])==0
# Known focused foreground plane covering the left half of a defocused blue disc.
y,x=np.mgrid[55:74,55:65];near=np.column_stack(((x.ravel()-64)/129,(y.ravel()-64)/129,np.ones(x.size)))
points=np.vstack((near,[0,0,2]));rgb=np.vstack((np.tile([.2,0,0],(len(near),1)),[0,0,3]))
cfg={**config,'radius_mm':50,'samples':256}
blocked,bi=render(points,rgb,k,(129,129),cfg)
additive,ai=render(points,rgb,k,(129,129),{**cfg,'visibility':'additive'})
assert blocked[:,:65,2].max()==0 and blocked[:,65:,2].sum()>0
assert 0<bi['occluded_linear_energy'][2]<3
np.testing.assert_allclose(blocked[:,65:,2],additive[:,65:,2],atol=1e-7)
# This cannot be reproduced by a fixed camera-center mask: at focus=2,
# foreground moves through the aperture while the background remains a point.
shifted,si=render(p,c,k,(129,129),{**cfg,'focus_m':2})
assert shifted[64,64,2]>0 and shifted[64,64,2]<3
np.testing.assert_allclose(np.array(bi['output_linear_energy'])+bi['occluded_linear_energy']+bi['lost_linear_energy'],np.array(bi['input_linear_energy'])+bi['resampling_linear_energy'],rtol=1e-10,atol=1e-10)
# Zero aperture matches one aperture sample; uncovered pixels stay empty.
zero,_=render(points,rgb,k,(129,129),config);one,_=render(points,rgb,k,(129,129),{**config,'samples':1})
np.testing.assert_array_equal(zero,one);assert zero[0,0,3]==0
# Frame crop remains distinct from geometry rejection.
edge,_=render(np.array([[-1,0,1]]),np.array([[1,1,1]]),k,(129,129),config)
assert edge.sum()==0
try:options(dict(visibility='invented'))
except ValueError:pass
else:raise AssertionError('invalid mode')
try:render(points,rgb,k,(129,129),cfg,cancel=lambda:True)
except Cancelled:pass
else:raise AssertionError('cancel ignored')
# Dense sloping surfaces retain constant radiance when downsampled;
# neighboring points may differ in Z but are samples of the same opaque plane.
y,x=np.mgrid[:129,:129];z=1+(x/129)*.2
plane=np.stack(((x-64)/129*z,(y-64)/129*z,z),axis=-1).reshape(-1,3)
constant=np.tile([.25,.5,.75],(len(plane),1))
flat,fi=render(plane,constant,k,(129,129),{**config,'size':64})
np.testing.assert_allclose(flat[3:-3,3:-3,:3]/flat[3:-3,3:-3,3,None],[.25,.5,.75]*np.ones_like(flat[3:-3,3:-3,:3]),atol=1e-6);assert flat[3:-3,3:-3,3].min()>.999
assert flat[...,3].max()<=1+1e-6
report=dict(opaque_radiance_preserved=True,passed=True,nearest_surface_blocks_background=True,order_independent=True,equal_depth_ties=True,eclipsed_disc=True,per_aperture_visibility=True,energy_accounted=True,unknown_regions_unfilled=True,cancel=True,blocked_blue_energy=bi['occluded_linear_energy'][2],visible_blue_energy=bi['output_linear_energy'][2])
(ROOT/'research/geometry019-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)

