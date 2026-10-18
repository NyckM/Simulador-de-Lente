from pathlib import Path
import sys,tempfile,json,struct,shutil
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.geometry_view import encode,MAX_POINTS
from optics import jobs
key='17'*16
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp);h,w=32,48;k=np.array([[.9,0,.5],[0,1.2,.5],[0,0,1]],dtype='f4');y,x=np.mgrid[:h,:w];z=(2+x/w+y/h).astype('f4');points=np.stack((((x+.5)/w-.5)/.9*z,((y+.5)/h-.5)/1.2*z,z),axis=-1).astype('f4');mask=np.ones((h,w),bool);mask[3:7,10:14]=False;normal=np.zeros_like(points);normal[...,2]=-1;normal[0,0]=np.nan;points[8,8]=np.nan
 np.savez_compressed(p/'geometry-000000.npz',depth=z,points=points,mask=mask,normal=normal,intrinsics=k)
 rgb=np.stack((x*255//w,y*255//h,np.full_like(x,100)),axis=-1).astype('uint8');Image.fromarray(rgb).save(p/'rgb-000000.png');original=(p/'geometry-000000.npz').read_bytes();payload=encode(p,0);length=struct.unpack('<I',payload[:4])[0];meta=json.loads(payload[4:4+length]);assert meta['invalid']==17;assert meta['count']==w*h-17;assert meta['projection_rmse_px']<1e-4;assert meta['depth_z_max_error_m']==0;assert meta['normal_valid']==meta['count']-1;assert (p/'geometry-000000.npz').read_bytes()==original
 records=np.frombuffer(payload,dtype='<f4',count=meta['count']*12,offset=4+length).reshape(-1,12);np.testing.assert_allclose(records[0,3:6],rgb[0,0]/255,atol=1e-6);assert np.isfinite(records).all();assert len(payload)==4+length+meta['count']*48+w*h
 dest=jobs.CACHE/key;dest.mkdir(exist_ok=True);shutil.copy2(p/'geometry-000000.npz',dest);shutil.copy2(p/'rgb-000000.png',dest);(dest/'status.json').write_text(json.dumps(dict(state='complete',model='moge3',geometry=True,width=w,height=h,count=1)),encoding='utf-8')
 # Dense scenes stay bounded without changing the original export.
 hh,ww=500,400;yy,xx=np.mgrid[:hh,:ww];zz=np.ones((hh,ww),dtype='f4')*3;pp=np.stack((((xx+.5)/ww-.5)/.9*zz,((yy+.5)/hh-.5)/1.2*zz,zz),axis=-1).astype('f4')
 np.savez_compressed(p/'geometry-000002.npz',depth=zz,points=pp,mask=np.ones_like(zz,bool),intrinsics=k);Image.new('RGB',(ww,hh),(20,30,40)).save(p/'rgb-000002.png');bounded=encode(p,2);nn=struct.unpack('<I',bounded[:4])[0];mm=json.loads(bounded[4:4+nn]);assert mm['count']==MAX_POINTS and mm['valid']==hh*ww and mm['sampled'];assert mm['normal_valid']==0;assert mm['projection_rmse_px']<1e-4
 # Unsupported or malformed arrays must fail explicitly rather than becoming a fake scene.
 np.savez_compressed(p/'geometry-000001.npz',depth=z,mask=mask)
 try:encode(p,1)
 except ValueError:pass
 else:raise AssertionError('missing points accepted')
 Image.fromarray(rgb[:1]).save(p/'rgb-000000.png')
 try:encode(p,0)
 except ValueError:pass
 else:raise AssertionError('unaligned RGB accepted')
report=dict(passed=True,known_projection_rmse_px=meta['projection_rmse_px'],opencv_axes=True,metric_z_preserved=True,rgb_pixel_centers=True,invalid_points_removed=17,invalid_normals_excluded=True,npz_unchanged=True,unaligned_inputs_rejected=True)
(ROOT/'research/geometry017-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)
