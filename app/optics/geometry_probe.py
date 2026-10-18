"""Geometric point footprint of the ideal thin lens; no diffraction or visibility."""
import numpy as np
from PIL import Image
from . import jobs
from .geometry_render import options,aperture,pupil_transform,project

def footprint(k,shape,config):
    k=np.asarray(k,dtype='f8');h,w=shape
    if k.shape!=(3,3) or not np.isfinite(k).all() or k[0,0]<=0 or k[1,1]<=0 or not np.allclose(k[2],[0,0,1]) or k[1,0]!=0:raise ValueError('Intrínsecos de câmera incompatíveis.')
    scale=min(1,config['size']/max(w,h));ow=max(1,round(w*scale));oh=max(1,round(h*scale))
    blades=config['blades'];aspect=config['pupil_aspect'];angle=config['rotation_deg'];radius=config['radius_mm']/1000
    samples=aperture(config['samples'],radius,blades,angle,aspect)
    n=blades or 96;theta=np.arange(n)*2*np.pi/n
    outline=pupil_transform(np.stack((np.cos(theta),np.sin(theta)),-1)*radius,aspect,angle)
    # Exact support extents of the ellipse (including rotation and camera skew).
    transform=pupil_transform(np.eye(2),aspect,angle).T
    matrix=np.diag([ow,oh])@k[:2,:2]@transform*radius
    extents=np.sqrt(np.sum(matrix*matrix,axis=1)) if not blades else np.max(np.abs(outline@k[:2,:2].T*[ow,oh]),axis=0)
    focus=config['focus_m'];spots=[]
    for role,depth in [('near',focus/2),('focus',focus),('far',focus*2)]:
        point=np.array([[0.,0.,depth]]);center=project(point,k,np.zeros(2),focus)[0]
        offsets=np.array([(project(point,k,a,focus)[0]-center)*[ow,oh] for a in samples])
        boundary=outline@k[:2,:2].T*[ow,oh]*(1/focus-1/depth)
        diameter=2*extents*abs(1/focus-1/depth)
        spots.append(dict(role=role,depth_m=depth,offsets_px=offsets.tolist(),outline_px=boundary.tolist(),diameter_xy_px=diameter.tolist(),centroid_px=offsets.mean(axis=0).tolist()))
    return dict(schema='optica-geometric-footprint/1',model='ideal-thin-lens-geometric-point',units='output pixels, meters and millimeters',width=ow,height=oh,source_width=w,source_height=h,intrinsics=k.tolist(),configuration=config,samples=config['samples'],sample_weight=1/config['samples'],spots=spots,limitations='No diffraction, glass aberrations, field variation, scene visibility or radiometric PSF. Finite equal-weight aperture samples; outline is geometric support. Camera intrinsics unchanged.')

def inspect(body):
    if not isinstance(body,dict):raise ValueError('Configuração inválida.')
    config=options(body)
    if config['visibility']!='mesh':raise ValueError('Inspeção da pupila disponível somente na malha.')
    folder=jobs.folder(body.get('job',''))
    with np.load(folder/f"geometry-{config['index']:06d}.npz",allow_pickle=False) as data:
        k=data['intrinsics'];depth_shape=data['depth'].shape
    with Image.open(folder/f"rgb-{config['index']:06d}.png") as im:w,h=im.size
    if depth_shape!=(h,w) or w<1 or h<1 or w*h>4200000:raise ValueError('Dimensões inválidas.')
    return footprint(k,(h,w),config)
