from pathlib import Path
import sys,json,tempfile,shutil
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_probe import footprint,inspect
from optics.geometry_render import options,aperture,project
from optics.geometry_cache import PREPARED,RESULTS
from optics import jobs
# Independent closed-form circle diameter: 2 R f_pixel |1/F-1/Z|.
k=np.array([[.9,0,.5],[0,1.2,.5],[0,0,1]],float)
c=options(dict(visibility='mesh',focus_m=2,radius_mm=20,samples=64,size=512))
r=footprint(k,(480,768),c);assert (r['width'],r['height'])==(512,320)
for spot in r['spots']:
 factor=abs(1/2-1/spot['depth_m'])
 np.testing.assert_allclose(spot['diameter_xy_px'],2*.02*np.array([.9*512,1.2*320])*factor,atol=1e-12)
assert r['spots'][1]['diameter_xy_px']==[0,0];assert not np.count_nonzero(r['spots'][1]['offsets_px'])
np.testing.assert_allclose(r['spots'][0]['offsets_px'],-2*np.array(r['spots'][2]['offsets_px']),atol=1e-12)
# Rotated oval under camera skew: independent covariance/support from ellipse axes.
k[0,1]=.08;a=np.deg2rad(31);rot=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]])
for n in (0,3,5,8,11):
 for ratio in (.25,.5,1,4):
  config={**c,'blades':n,'pupil_aspect':ratio,'rotation_deg':31 if n or ratio!=1 else 0}
  f=footprint(k,(480,768),config);openings=aperture(64,.02,n,config['rotation_deg'],ratio)
  transform=np.diag([512,320])@k[:2,:2]@rot@np.diag([np.sqrt(ratio),1/np.sqrt(ratio)])*.02
  if n==0 and ratio!=1:
   np.testing.assert_allclose(f['spots'][0]['diameter_xy_px'],np.linalg.norm(transform,axis=1),atol=1e-12)
  for spot in f['spots']:
   expected=openings@k[:2,:2].T*[512,320]*(.5-1/spot['depth_m'])
   np.testing.assert_allclose(spot['offsets_px'],expected,atol=1e-12)
   actual=np.abs(spot['outline_px']).max(axis=0)
   assert np.all(actual<=np.array(spot['diameter_xy_px'])/2+1e-12)
  assert sum([f['sample_weight']]*64)>1-1e-12
  assert footprint(k,(480,768),config)==f
zero=footprint(k,(480,768),{**c,'radius_mm':0});assert all(not np.count_nonzero(p['offsets_px']) for p in zero['spots'])
# Diagnostic reads existing geometry but neither creates render tasks nor alters caches/files.
folder=jobs.folder('17'*16);original=(folder/'geometry-000000.npz').read_bytes();before=(len(PREPARED),len(RESULTS),set(folder.iterdir()))
api=inspect(dict(job='17'*16,visibility='mesh',focus_m=3,radius_mm=10,pupil_aspect=.5,rotation_deg=-31))
assert api['source_width']==48 and api['source_height']==32 and len(api['spots'])==3
assert api['sample_weight']==1/64 and api['configuration']['pupil_aspect']==.5
assert before==(len(PREPARED),len(RESULTS),set(folder.iterdir()));assert (folder/'geometry-000000.npz').read_bytes()==original
for bad in ({'job':'../x','visibility':'mesh'},{'job':'17'*16,'visibility':'zbuffer'},{'job':'17'*16,'visibility':'mesh','focus_m':0},[],{'job':'17'*16,'visibility':'mesh','pupil_aspect':9}):
 try:inspect(bad)
 except (ValueError,TypeError):pass
 else:raise AssertionError('invalid request')
for bad in (np.eye(2),np.full((3,3),np.nan),np.diag([-1,1,1])):
 try:footprint(bad,(32,48),c)
 except ValueError:pass
 else:raise AssertionError('invalid camera')
report=dict(passed=True,analytic_circle_diameter=True,exact_focus_collapse=True,near_far_inversion=True,skew_and_rotated_oval=True,polygon_support=True,same_aperture_samples=True,deterministic=True,zero_radius=True,source_unchanged=True,no_render_or_cache_mutation=True,invalid_requests_rejected=True)
(ROOT/'research/geometry026-validation.json').write_text(json.dumps(report,indent=2));print(report)
