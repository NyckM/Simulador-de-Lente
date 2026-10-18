"""Experimental thin-lens point splats with optional per-aperture visibility.
This is a point-cloud z buffer, not a reconstruction of hidden surfaces.
"""
from pathlib import Path
import json,threading,time,uuid
import numpy as np
from PIL import Image
from . import jobs

LOCK=threading.RLock();TASKS={}
class Cancelled(Exception):pass

def options(body):
    result={}
    for key,default,lo,hi in [('focus_m',2.,.01,1000),('radius_mm',4.,0,50),('samples',64,1,256),('size',512,64,1024),('depth_jump_percent',5.,.1,100)]:
        v=body.get(key,default)
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not np.isfinite(v) or not lo<=v<=hi or (key in ('samples','size') and int(v)!=v):raise ValueError('Opção geométrica inválida: '+key)
        result[key]=int(v) if key in ('samples','size') else float(v)
    result['representation']=body.get('representation','points')
    if result['representation'] not in ('points','z'):raise ValueError('Representação inválida.')
    result['visibility']=body.get('visibility','additive')
    if result['visibility'] not in ('additive','zbuffer','mesh'):raise ValueError('Visibilidade inválida.')
    spatial=body.get('spatial_samples',1)
    if isinstance(spatial,bool) or not isinstance(spatial,int) or spatial not in (1,4,9,16):raise ValueError('Amostras por pixel inválidas.')
    if result['visibility']!='mesh' and spatial!=1:raise ValueError('Amostras por pixel disponíveis somente na malha.')
    result['spatial_samples']=spatial
    result['kernel']=body.get('kernel','sorted')
    if result['kernel'] not in ('sorted','reduction'):raise ValueError('Kernel geométrico inválido.')
    result['engine']=body.get('engine','reference')
    if result['engine'] not in ('reference','optimized'):raise ValueError('Motor geométrico inválido.')
    if result['kernel']=='reduction' and (result['visibility']!='mesh' or result['engine']!='optimized'):raise ValueError('Redução disponível somente na malha com reutilização.')
    if result['visibility']!='mesh' and result['engine']!='reference':raise ValueError('Motor otimizado disponível somente na malha.')
    blades=body.get('blades',0);rotation=body.get('rotation_deg',0.);aspect=body.get('pupil_aspect',1.)
    if isinstance(aspect,bool) or not isinstance(aspect,(int,float)) or not np.isfinite(aspect) or not .25<=aspect<=4:raise ValueError('Proporção da pupila inválida.')
    if result['visibility']!='mesh' and aspect!=1:raise ValueError('Pupila oval disponível somente na malha.')
    if isinstance(blades,bool) or not isinstance(blades,int) or blades not in (0,3,4,5,6,7,8,9,10,11):raise ValueError('Lâminas inválidas.')
    if isinstance(rotation,bool) or not isinstance(rotation,(int,float)) or not np.isfinite(rotation) or not -180<=rotation<=180:raise ValueError('Rotação da íris inválida.')
    if (result['visibility']!='mesh' or (blades==0 and aspect==1)) and (blades!=0 or rotation!=0):raise ValueError('Íris poligonal disponível somente na malha; circular usa rotação zero.')
    result.update(blades=blades,rotation_deg=float(rotation),pupil_aspect=float(aspect))
    index=body.get('index',0)
    if isinstance(index,bool) or not isinstance(index,int) or not 0<=index<1000000:raise ValueError('Frame inválido.')
    result['index']=index;return result

def pupil_transform(xy,aspect,rotation_deg):
    # Unit determinant stretch, then camera-plane rotation (positive clockwise).
    a=np.deg2rad(rotation_deg);rotation=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]])
    return (np.asarray(xy)*[np.sqrt(aspect),1/np.sqrt(aspect)])@rotation.T

def aperture(count,radius,blades=0,rotation_deg=0,pupil_aspect=1):
    if pupil_aspect!=1:
        return pupil_transform(aperture(count,radius,blades,0),pupil_aspect,rotation_deg)
    # Deterministic, equal-weight antipodal disk samples. Pairing keeps the centroid at zero.
    if count==1:return np.zeros((1,2))
    if blades:
        # Equal-area triangular sectors: sqrt(u) gives uniform triangle area.
        # Even polygons use antipodal pairs; odd polygons use all sectors.
        paired=blades%2==0;number=count//2 if paired else count
        i=np.arange(number);sectors=i%(blades//2 if paired else blades)
        u=((i+.5)*(np.sqrt(5)-1)/2)%1;v=((i+.5)*np.sqrt(2))%1
        theta=2*np.pi*sectors/blades+np.deg2rad(rotation_deg)
        a=np.stack((np.cos(theta),np.sin(theta)),axis=-1);b=np.stack((np.cos(theta+2*np.pi/blades),np.sin(theta+2*np.pi/blades)),axis=-1)
        xy=np.sqrt(u)[:,None]*((1-v[:,None])*a+v[:,None]*b)*radius
        return np.concatenate((xy,-xy,np.zeros((count%2,2)))) if paired else xy
    pairs=count//2;i=np.arange(pairs);theta=i*np.pi*(3-np.sqrt(5));r=np.sqrt((i+.5)/pairs)*radius
    xy=np.stack((r*np.cos(theta),r*np.sin(theta)),axis=-1)
    return np.concatenate((xy,-xy,np.zeros((count%2,2))))

def project(points,k,opening,focus):
    q=points/points[:,2,None];q=q.copy();q[:,:2]+=opening[None,:]*(1/focus-1/points[:,2,None]);p=q@k.T
    return p[:,:2]/p[:,2,None]

def render(points,rgb,k,source_shape,config,progress=lambda a,b:None,cancel=lambda:False):
    h,w=source_shape;scale=min(1,config['size']/max(w,h));ow=max(1,round(w*scale));oh=max(1,round(h*scale));area=ow*oh/(w*h)
    rgb=np.asarray(rgb,dtype='f8');points=np.asarray(points,dtype='f8');k=np.asarray(k,dtype='f8');count=config['samples'];out=np.zeros((oh*ow,4),dtype='f8')
    samples=aperture(count,config['radius_mm']/1000);visibility=config.get('visibility','additive');cropped=np.zeros(3);rejected=np.zeros(3);resampling=np.zeros(3)
    colors=np.column_stack((rgb,np.ones(len(rgb))))*(area/count)
    for sample_id,a in enumerate(samples):
        if cancel():raise Cancelled()
        uv=project(points,k,a,config['focus_m'])*[ow,oh]-.5
        # Avoid converting extremely off-frame coordinates to overflowing integers.
        selected=np.isfinite(uv).all(axis=-1)&(uv[:,0]>-1)&(uv[:,0]<ow)&(uv[:,1]>-1)&(uv[:,1]<oh)
        q=uv[selected];color=colors[selected];z=points[selected,2];ix=np.floor(q[:,0]).astype('int64');iy=np.floor(q[:,1]).astype('int64');dx=q[:,0]-ix;dy=q[:,1]-iy
        fragments=[];in_frame=np.zeros(3)
        for ox,oy,weight in [(0,0,(1-dx)*(1-dy)),(1,0,dx*(1-dy)),(0,1,(1-dx)*dy),(1,1,dx*dy)]:
            xx=ix+ox;yy=iy+oy;inside=(xx>=0)&(xx<ow)&(yy>=0)&(yy<oh)&(weight>1e-12);ids=yy[inside]*ow+xx[inside]
            weighted=color[inside]*weight[inside,None];in_frame+=weighted[:,:3].sum(axis=0)
            fragments.append((ids,z[inside],weighted))
        cropped+=np.maximum(colors[:,:3].sum(axis=0)-in_frame,0)
        # The buffer is rebuilt for EVERY aperture position, including all four
        # bilinear taps, before any color is accumulated. World Z orders points
        # along the shifted parallel-axis camera. Equal-depth samples sum without
        # depending on input order; a small relative tolerance handles float32 data.
        nearest=np.full(oh*ow,np.inf) if visibility=='zbuffer' else None
        layer=np.zeros_like(out) if nearest is not None else out
        coverage=np.zeros(oh*ow) if nearest is not None else None
        if nearest is not None:
            for ids,depth,weighted in fragments:
                np.minimum.at(nearest,ids,depth)
                coverage+=np.bincount(ids,weights=weighted[:,3],minlength=oh*ow)
        for ids,depth,weighted in fragments:
            if cancel():raise Cancelled()
            if nearest is not None:
                visible=depth<=nearest[ids]+np.maximum(1e-7,nearest[ids]*1e-5)
                rejected+=weighted[~visible,:3].sum(axis=0);ids=ids[visible];weighted=weighted[visible]
            for channel in range(4):layer[:,channel]+=np.bincount(ids,weights=weighted[:,channel],minlength=oh*ow)
        if nearest is not None:
            # Opaque surface radiance is a weighted mean of visible fragments,
            # not source-point flux. Use the full projected sampling footprint
            # for coverage: downsampling or tilted neighbors must not darken an
            # otherwise covered surface just because the nearest splat won.
            target=np.minimum(coverage,1/count)
            ratio=np.divide(target,layer[:,3],out=np.zeros_like(target),where=layer[:,3]>0)
            before=layer[:,:3].sum(axis=0);layer*=ratio[:,None]
            resampling+=layer[:,:3].sum(axis=0)-before;out+=layer
        progress(sample_id+1,count)
    expected=rgb.sum(axis=0)*area;energy=out[:,:3].sum(axis=0);out=out.reshape(oh,ow,4)
    return out.astype('f4'),dict(width=ow,height=oh,input_points=len(points),input_linear_energy=expected.tolist(),output_linear_energy=energy.tolist(),lost_linear_energy=cropped.tolist(),occluded_linear_energy=rejected.tolist(),resampling_linear_energy=resampling.tolist(),samples=count,focus_m=config['focus_m'],radius_mm=config['radius_mm'],model='thin-lens-point-splats',visibility=visibility,coverage_min=float(out[...,3].min()),coverage_max=float(out[...,3].max()))

def load(folder,index,representation,mesh=False,depth_jump_percent=5):
    with np.load(Path(folder)/f'geometry-{index:06d}.npz',allow_pickle=False) as data:
        z=np.asarray(data['depth'],dtype='f4');p=np.asarray(data['points'],dtype='f4');mask=np.asarray(data['mask'],bool);k=np.asarray(data['intrinsics'],dtype='f8')
        if z.ndim!=2 or z.size>4200000 or p.shape!=(*z.shape,3) or mask.shape!=z.shape:raise ValueError('Geometria inválida.')
        if k.shape!=(3,3) or not np.isfinite(k).all() or k[0,0]<=0 or k[1,1]<=0 or not np.allclose(k[2],[0,0,1]) or k[1,0]!=0:raise ValueError('Intrínsecos de câmera incompatíveis.')
        valid=mask&np.isfinite(z)&(z>0)&np.isfinite(p).all(axis=-1)&(p[...,2]>0)
        if not valid.any():raise ValueError('Geometria sem pontos válidos.')
        h,w=z.shape
        if representation=='z':
            y,x=np.mgrid[:h,:w];q=np.stack(((x+.5)/w,(y+.5)/h,np.ones_like(z)),axis=-1);p=(q@np.linalg.inv(k).T)*z[...,None]
        with Image.open(Path(folder)/f'rgb-{index:06d}.png') as im:
            if im.size!=(w,h):raise ValueError('RGB desalinhado.')
            c=np.asarray(im.convert('RGB'),dtype='f8')/255
        c=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
        if mesh:
            from .geometry_mesh import topology
            faces,info=topology(valid,p,depth_jump_percent/100)
            return p[valid],c[valid],k,z.shape,faces,info
        return p[valid],c[valid],k,z.shape

def png(linear,path):
    # RGB is premultiplied linear radiance; coverage is retained independently in NPZ.
    alpha=np.clip(linear[...,3],0,1);rgb=linear[...,:3]/np.maximum(alpha[...,None],1e-12);rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*np.maximum(rgb,0)**(1/2.4)-.055)
    rgba=np.concatenate((np.clip(rgb,0,1),alpha[...,None]),axis=-1);Image.fromarray(np.uint8(rgba*255+.5)).save(path)

def start(body):
    config=options(body);folder=jobs.folder(body.get('job',''))
    if not (folder/f"geometry-{config['index']:06d}.npz").is_file():raise ValueError('Gere geometria MoGe 3 primeiro.')
    with LOCK:
        if any(t['state'] in ('starting','running') for t in TASKS.values()):raise ValueError('Já existe um render geométrico ativo.')
        # Keep only recent owned tasks; artifacts remain in each job cache folder.
        for key in list(TASKS)[:-7]:TASKS.pop(key,None)
        key=uuid.uuid4().hex;stop=threading.Event();TASKS[key]=dict(state='starting',current=0,total=config['samples']*config['spatial_samples'],stop=stop,folder=folder,config=config,job=body['job'])
    def run():
        started=time.monotonic()
        def update(current,total):
            with LOCK:TASKS[key].update(state='running',current=current,total=total)
        try:
            if stop.is_set():raise Cancelled()
            from .geometry_cache import compute
            linear,info=compute(folder,config,load,update,stop.is_set)
            if stop.is_set():raise Cancelled()
            export_started=time.perf_counter()
            np.savez_compressed(folder/f'georender-{key}.npz',rgba_premultiplied=linear,configuration=json.dumps(config),metadata=json.dumps(info))
            npz_s=time.perf_counter()-export_started;export_started=time.perf_counter()
            png(linear,folder/f'georender-{key}.png')
            info['performance'].update(npz_export_s=npz_s,png_export_s=time.perf_counter()-export_started)
            with LOCK:TASKS[key].update(state='cancelled' if stop.is_set() else 'complete',info=dict(info,elapsed_s=time.monotonic()-started),png=f'/api/jobs/{body["job"]}/georender-{key}.png',linear=f'/api/jobs/{body["job"]}/georender-{key}.npz')
        except Cancelled:
            with LOCK:TASKS[key]['state']='cancelled'
        except Exception as exc:
            with LOCK:TASKS[key].update(state='error',error=str(exc))
    worker=threading.Thread(target=run,daemon=True);TASKS[key]['thread']=worker;worker.start();return dict(id=key)

def status(key):
    with LOCK:
        if key not in TASKS:raise ValueError('Render não encontrado.')
        return {k:v for k,v in TASKS[key].items() if k not in ('stop','folder','thread')}

def cancel(key):
    with LOCK:
        if key not in TASKS:raise ValueError('Render não encontrado.')
        t=TASKS[key]
        if t['state'] in ('starting','running'):t['stop'].set()
    return status(key)

def shutdown():
    with LOCK:
        for task in TASKS.values():task['stop'].set()
