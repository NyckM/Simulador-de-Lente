from pathlib import Path
import sys,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_mesh import raster
from optics.geometry_render import options,Cancelled
rng=np.random.default_rng(923);cases=[]
# Include >2048 triangles so winners change across raster groups; shuffled
# triangles and exact shared-edge ties use the same stable face IDs in both paths.
for count in (1,100,2200):
 uv=rng.uniform(-10,74,(count*3,2));z=rng.uniform(.2,5,count*3);points=np.column_stack((rng.normal(size=(count*3,2)),z));rgb=rng.uniform(0,4,(count*3,3));faces=np.arange(count*3).reshape(-1,3)
 a=raster(uv,points,rgb,faces,64,64,lambda:False,'sorted');b=raster(uv,points,rgb,faces,64,64,lambda:False,'reduction');np.testing.assert_array_equal(a,b);cases.append(count)
stats=dict(candidate_pixels=0,accepted_fragments=0,color_fragments=0);sorted_stats=dict(stats)
uv=np.tile(np.array([[0,0],[63,0],[0,63]],float),(3,1));points=np.column_stack((np.zeros((9,2)),np.repeat([2,1,1],3)));rgb=np.repeat([[0,0,3],[2,0,0],[0,1,0]],3,axis=0);faces=np.arange(9).reshape(3,3)
a=raster(uv,points,rgb,faces,64,64,lambda:False,'sorted',sorted_stats);b=raster(uv,points,rgb,faces,64,64,lambda:False,'reduction',stats);np.testing.assert_array_equal(a,b);assert stats['color_fragments']<sorted_stats['color_fragments'];np.testing.assert_allclose(b.reshape(64,64,4)[10,10],[2,0,0,1])
# Two fragments in one pixel that differ by one representable depth value must
# obey the exact same nearest comparison, not a rounded/tolerant replacement.
points[:,2]=1;points[6:,2]=np.nextafter(1.,0.)
a=raster(uv,points,rgb,faces,64,64,lambda:False,'sorted');b=raster(uv,points,rgb,faces,64,64,lambda:False,'reduction');np.testing.assert_array_equal(a,b)
uv=np.array([[np.nan,0],[1,0],[0,1]],float);empty=raster(uv,points[:3],rgb[:3],faces[:1],64,64,lambda:False,'reduction');assert empty.sum()==0
try:raster(uv,points[:3],rgb[:3],faces[:1],64,64,lambda:True,'reduction')
except Cancelled:pass
else:raise AssertionError('cancellation')
for body in (dict(kernel='imaginary'),dict(kernel='reduction'),dict(visibility='zbuffer',engine='optimized',kernel='reduction')):
 try:options(body)
 except ValueError:pass
 else:raise AssertionError('invalid kernel')
report=dict(passed=True,float64_raster_exact=True,hidden_fragment_color_work_reduced=True,sorted_color_fragments=sorted_stats['color_fragments'],reduction_color_fragments=stats['color_fragments'],random_triangle_counts=cases,cross_group_winners=True,equal_depth_stable_owner=True,adjacent_float64_depths=True,hdr_values_preserved=True,invalid_projection_excluded=True,cancellation=True,invalid_options_rejected=True)
(ROOT/'research/geometry023-validation.json').write_text(json.dumps(report,indent=2));print(report)
