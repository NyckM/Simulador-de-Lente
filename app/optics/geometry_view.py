"""Bounded inspection transport. Original geometry NPZ is never rewritten."""
from pathlib import Path
import json,struct
import numpy as np
from PIL import Image

MAX_POINTS=120000

def encode(folder,index):
    folder=Path(folder);path=folder/f'geometry-{index:06d}.npz'
    if not path.is_file():raise FileNotFoundError('Geometria ainda não disponível.')
    with np.load(path,allow_pickle=False) as data:
        if not all(k in data for k in ('depth','mask','points')):raise ValueError('Geometria sem pontos, depth ou máscara.')
        z=np.asarray(data['depth'],dtype='f4');points=np.asarray(data['points'],dtype='f4');mask=np.asarray(data['mask'],dtype=bool)
        if z.ndim!=2 or z.size>4200000 or points.shape!=(*z.shape,3) or mask.shape!=z.shape:raise ValueError('Dimensões de geometria inválidas.')
        h,w=z.shape
        valid=mask&np.isfinite(z)&(z>0)&np.isfinite(points).all(axis=-1)&(points[...,2]>0)
        ids=np.flatnonzero(valid);total_valid=len(ids)
        if not total_valid:raise ValueError('Geometria sem pontos válidos.')
        if len(ids)>MAX_POINTS:ids=ids[np.linspace(0,len(ids)-1,MAX_POINTS,dtype=int)]
        xyz=points.reshape(-1,3)[ids];uv=np.stack(((ids%w+.5)/w,(ids//w+.5)/h),axis=-1)
        with Image.open(folder/f'rgb-{index:06d}.png') as im:
            if im.size!=(w,h):raise ValueError('RGB e geometria não estão alinhados.')
            rgb=np.asarray(im.convert('RGB'),dtype='f4').reshape(-1,3)[ids]/255
        normals=np.zeros_like(xyz);normal_valid=np.zeros(len(ids),bool)
        if 'normal' in data:
            n=np.asarray(data['normal'],dtype='f4')
            if n.shape!=points.shape:raise ValueError('Dimensões das normais inválidas.')
            n=n.reshape(-1,3)[ids];length=np.linalg.norm(n,axis=-1);normal_valid=np.isfinite(n).all(axis=-1)&(length>1e-6)
            normals[normal_valid]=n[normal_valid]/length[normal_valid,None]
        intrinsics=None;rmse=None;max_error=None
        if 'intrinsics' in data:
            k=np.asarray(data['intrinsics'],dtype='f8')
            if k.shape!=(3,3) or not np.isfinite(k).all() or abs(np.linalg.det(k))<1e-12:raise ValueError('Intrínsecos inválidos.')
            intrinsics=k.tolist();project=xyz.astype('f8')@k.T;projection=project[:,:2]/project[:,2,None]
            delta=(projection-uv)*[w,h];rmse=float(np.sqrt(np.mean(np.sum(delta*delta,axis=-1))));max_error=float(np.linalg.norm(delta,axis=-1).max())
        records=np.concatenate((xyz,rgb,normals,uv,normal_valid[:,None]),axis=-1).astype('<f4')
        meta=dict(schema='optica-geometry-view/1',width=w,height=h,count=len(ids),valid=total_valid,invalid=int(z.size-total_valid),record_floats=12,intrinsics=intrinsics,bounds=[xyz.min(axis=0).tolist(),xyz.max(axis=0).tolist()],projection_rmse_px=rmse,projection_max_error_px=max_error,depth_z_max_error_m=float(np.max(np.abs(xyz[:,2]-z.ravel()[ids]))),normal_valid=int(normal_valid.sum()),units='meters',convention='OpenCV: X right, Y down, Z forward',sampled=len(ids)<total_valid,mask_bytes=z.size)
        header=json.dumps(meta,allow_nan=False,separators=(',',':')).encode()
        return struct.pack('<I',len(header))+header+records.tobytes()+valid.astype('uint8').tobytes()
