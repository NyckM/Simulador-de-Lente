"""v1 artistic image filters. Linear RGB on the opaque lens composite.

Pixel-center sampling, edge replication, deterministic quadrature. These
profiles are original approximations, not measured glass or film stocks.
"""
import math
import numpy as np
from scipy.ndimage import map_coordinates,gaussian_filter
from scipy.signal import fftconvolve

KINDS=('black_mist','white_mist','detail','streak','star','veil','window','replicate','halo','kaleidoscope','split','fringing','halation','prism','directional')
DEFAULT=dict(enabled=True,amount=.35,x=.5,y=.5,scale=1.,scale_x=1.,scale_y=1.,rotation=0.,pivot_x=0.,pivot_y=0.,radius=.04,threshold=.7,softness=.2,inner=.65,feather=.25,shift=.04,count=4,tint=False,red=.25,green=.6,blue=1.,region=False,prism_amount=0.,prism_shift=.015,prism_angle=0.,prism_type=0,edge_blur=.06,blur_amount=0.,blur_radius=.04,blur_angle=0.)
LIMITS=dict(amount=(0,1),x=(-1,2),y=(-1,2),scale=(.05,4),scale_x=(.05,4),scale_y=(.05,4),rotation=(-360,360),pivot_x=(-2,2),pivot_y=(-2,2),radius=(.001,.3),threshold=(0,20),softness=(.001,5),inner=(0,2),feather=(.01,1),shift=(-.5,.5),count=(2,8),red=(0,2),green=(0,2),blue=(0,2),prism_amount=(0,1),prism_shift=(0,.1),prism_angle=(-360,360),prism_type=(0,7),edge_blur=(0,.3),blur_amount=(0,1),blur_radius=(0,.3),blur_angle=(-360,360))

def validate(raw):
    if not isinstance(raw,(list,tuple)) or len(raw)>16:raise ValueError('Filtros: use uma pilha de até 16 módulos.')
    result=[]
    for f in raw:
        if not isinstance(f,dict) or f.get('kind') not in KINDS:raise ValueError('Filtro desconhecido.')
        out={**DEFAULT,'kind':f['kind']}
        for key in ('enabled','tint','region'):
            value=f.get(key,out[key])
            if not isinstance(value,bool):raise ValueError('Filtro: opção booleana inválida.')
            out[key]=value
        for key,(lo,hi) in LIMITS.items():
            value=f.get(key,out[key])
            if isinstance(value,bool) or not isinstance(value,(float,int)) or not math.isfinite(value) or not lo<=value<=hi:raise ValueError('Filtro: '+key+' fora do intervalo.')
            out[key]=float(value)
        if out['count']!=int(out['count']):raise ValueError('Filtro: quantidade deve ser inteira.')
        if out['prism_type']!=int(out['prism_type']):raise ValueError('Filtro: tipo de prisma deve ser inteiro.')
        out['count']=int(out['count']);out['prism_type']=int(out['prism_type']);result.append(out)
    return result

def _inside(q,w,h):
    # Espelha 4 px para dentro da borda (bordas do quadro tendem a ser escuras); dentro do quadro não altera.
    e=np.minimum(np.array([6./w,6./h]),.1);m=(q-e)/(1-2*e);m=1-np.abs(1-np.mod(m,2));m=e+m*(1-2*e)
    inside=np.all((q>=e)&(q<=1-e),axis=-1,keepdims=True)
    return np.where(inside,q,m)

def smooth(lo,hi,x):
    t=np.clip((x-lo)/(hi-lo),0,1);return t*t*(3-2*t)

def apply(rgb,raw,aperture_scale=1.):
    aperture_scale=float(min(4,max(.25,aperture_scale)))
    filters=[]
    for f in validate(raw):
        if not f['enabled'] or not f['amount']:continue
        if not ((f['kind']=='prism' and not f['prism_shift'] and not (f['prism_type']>0 and f['shift'])) or (f['kind']=='directional' and not f['blur_radius'])):filters.append(f)
        if f['kind']!='prism' and f['prism_amount']>0 and f['prism_shift']>0:filters.append({**f,'kind':'prism','mask_kind':f['kind'],'prism_type':0,'amount':f['amount']*f['prism_amount']})
        if f['kind']!='directional' and f['blur_amount']>0 and f['blur_radius']>0:filters.append({**f,'kind':'directional','mask_kind':f['kind'],'amount':f['amount']*f['blur_amount']})
    if not any(f['enabled'] and f['amount'] for f in filters):return rgb
    out=np.asarray(rgb,dtype=np.float64);h,w=out.shape[:2];short=min(w,h)
    y,x=np.mgrid[:h,:w];p=np.stack(((x+.5)/w,(y+.5)/h),-1);units=np.array([w,h])/short
    for f in filters:
        if not f['enabled'] or f['amount']==0:continue
        base=out;ang=np.deg2rad(f['rotation']);c,s=np.cos(ang),np.sin(ang);rot=np.array([[c,-s],[s,c]])
        position=np.array([f['x'],f['y']]);pivot=np.array([f['pivot_x'],f['pivot_y']])*.25;scale=np.array([f['scale_x'],f['scale_y']])*f['scale']
        local=((p-position)*units-pivot)@rot/scale+pivot
        dist=np.linalg.norm(local,axis=-1)/.25
        eb=f['edge_blur']*f['scale']*aperture_scale;pe=eb*2
        def edge(x,width):
            e=max(math.sqrt(width*width+eb*eb),1e-5);return smooth(-e,e,x)
        periphery=smooth(f['inner']-pe,f['inner']+f['feather']+pe,dist)
        mask=1-smooth(.8-pe,1+pe,dist) if f['region'] else np.ones((h,w))
        def world(q):return (((q-pivot)*scale)@rot.T+pivot)/units+position
        def sample(q):
            q=_inside(q,w,h);coords=[q[...,1]*h-.5,q[...,0]*w-.5]
            return np.stack([map_coordinates(base[...,k],coords,order=1,mode='nearest',prefilter=False) for k in range(3)],-1)
        def selected(v):
            l=v@np.array([.2126,.7152,.0722])
            return v*(smooth(f['threshold'],f['threshold']+f['softness'],l)*np.maximum(0,1-f['threshold']/np.maximum(l,1e-5)))[...,None]
        blurred={}
        def blur(q,r,select=False):
            # 1.2.11: convolução contínua com o mesmo núcleo exp(-2(d/r)^2), d<=r (sem cópias pontuais).
            key=(round(r,6),select)
            if key not in blurred:
                src=selected(base) if select else base
                rp=r*short
                if rp<.75:blurred[key]=src
                else:
                    n=int(math.ceil(rp));yy,xx=np.mgrid[-n:n+1,-n:n+1];d=np.hypot(xx,yy)/rp
                    k=np.where(d<=1,np.exp(-2*d*d),0.);k/=k.sum()
                    pad=np.pad(src,((n,n),(n,n),(0,0)),mode='symmetric')
                    blurred[key]=np.stack([fftconvolve(pad[...,c],k,mode='valid') for c in range(3)],-1)
            B=blurred[key];qq=_inside(q,w,h);coords=[qq[...,1]*h-.5,qq[...,0]*w-.5]
            return np.stack([map_coordinates(B[...,c],coords,order=1,mode='nearest',prefilter=False) for c in range(3)],-1)
        kind=f['kind'];radius=f['radius']*f['scale'];chosen=selected(base)
        if kind=='black_mist':target=base-chosen+blur(p,radius,True)
        elif kind=='white_mist':target=blur(p,radius)
        elif kind=='detail':target=blur(p,radius*.2)
        elif kind=='halation':target=base-chosen+blur(p,radius,True)*np.array([1,.3,.06])
        elif kind in ('streak','star'):
            target=np.zeros_like(base);mass=0;directions=f['count'] if kind=='star' else 1
            for j in range(directions):
                a=ang+j*np.pi/directions;axis=np.array([np.cos(a),np.sin(a)])
                for i in range(33):
                    t=(i-16)/16;weight=np.exp(-4*t*t);target+=selected(sample(p+axis*t*radius/units))*weight;mass+=weight
            target=base-chosen+target/mass*(np.array([f['red'],f['green'],f['blue']]) if f['tint'] else 1)
        elif kind=='replicate':
            target=np.zeros_like(base)
            for i in range(f['count']):
                q=local.copy();q[...,0]+=(i-(f['count']-1)/2)*f['shift'];target+=sample(world(q))/f['count']
        elif kind=='kaleidoscope':
            a=np.arctan2(local[...,1],local[...,0]);sector=2*np.pi/f['count'];a=np.abs((a+sector/2)%sector-sector/2);r=np.linalg.norm(local,axis=-1)
            target=sample(world(np.stack((np.cos(a)*r,np.sin(a)*r),-1)));mask*=periphery
        elif kind=='halo':target=blur(world(local*(1+f['shift']*dist[...,None])),radius*.2);mask*=periphery
        elif kind in ('window','split','veil'):
            q=local.copy();q[...,0]+=f['shift'];target=blur(world(q),radius)
            mask*=periphery if kind=='window' else edge(local[...,0]-f['inner']*.25,f['feather']) if kind=='split' else edge(local[...,0],f['feather'])
        elif kind=='prism':
            weights=np.array([[.2,.02,.8],[.05,.2,1],[0,.8,.3],[.2,1,.02],[1,.7,0],[1,.15,0],[.7,0,0]])
            def dir_at(a):
                a=np.asarray(a,dtype=np.float64);return np.stack((np.cos(a),np.sin(a)),-1)/units
            spec_cache={}
            def spectral(q,d):
                # 13 comprimentos de onda; fonte pré-desfocada pelo espaçamento entre amostras (espectro contínuo)
                dn=np.asarray(d,dtype=np.float64);spacing=float(np.max(np.linalg.norm(dn*np.array([w,h]),axis=-1)))*.25
                sig=round(max(0.,spacing*.6),2)
                if sig not in spec_cache:spec_cache[sig]=base if sig<.5 else np.stack([gaussian_filter(base[...,k],sig,mode='mirror') for k in range(3)],-1)
                src=spec_cache[sig];acc=np.zeros_like(base);mass=np.zeros(3)
                for i in range(13):
                    t=i*.5;a=int(np.floor(t));wt=weights[a]*(1-(t-a))+weights[min(a+1,6)]*(t-a)
                    qq=_inside(q+dn*(((550/(430+20*i))**2-1)/.63600757),w,h);coords=[qq[...,1]*h-.5,qq[...,0]*w-.5]
                    acc+=np.stack([map_coordinates(src[...,k],coords,order=1,mode='nearest',prefilter=False) for k in range(3)],-1)*wt;mass+=wt
                return acc/mass
            t=0 if 'mask_kind' in f else int(f['prism_type'])
            A=ang+np.deg2rad(f['prism_angle']);d=dir_at(A);ps=f['prism_shift']*f['scale'];po=f['shift']*f['scale'];fe=f['feather']
            th=np.arctan2(local[...,1],local[...,0])
            if t==1:
                target=sum(spectral(p+dir_at(A+k*2*np.pi/3)*po,dir_at(A+k*2*np.pi/3)*ps) for k in range(3))/3
            elif t==2:
                mask=mask*edge(local[...,0]-f['inner']*.25,fe);target=spectral(p+d*po,d*ps)
            elif t==3:
                sector=2*np.pi/f['count'];u=th/sector;i0=np.floor(u);fr=u-i0;side=np.where(fr<.5,-1.,1.)
                d_edge=np.linalg.norm(local,axis=-1)*np.sin(np.minimum(fr,1-fr)*sector);wn=(.5-.5*smooth(0,max(eb,1e-5),d_edge))[...,None]
                e0=dir_at((i0+.5)*sector+A);e1=dir_at((i0+side+.5)*sector+A);mask=mask*periphery
                target=spectral(p+e0*po,e0*ps)*(1-wn)+spectral(p+e1*po,e1*ps)*wn
            elif t==4:
                target=np.zeros_like(base);m=0
                for i in range(f['count']):
                    w8=.62**i;target+=spectral(p+d*po*i,d*ps*(1+i))*w8;m+=w8
                target/=m
            elif t==5:
                sector=2*np.pi/f['count'];a=np.abs((th+sector/2)%sector-sector/2);r=np.linalg.norm(local,axis=-1)
                mask=mask*periphery;target=spectral(world(np.stack((np.cos(a)*r,np.sin(a)*r),-1)),dir_at(th+ang)*ps)
            elif t==6:
                side=edge(local[...,0]-f['inner']*.25,fe)[...,None]
                target=spectral(p-d*po,-d*ps)*(1-side)+spectral(p+d*po,d*ps)*side
            elif t==7:
                e=dir_at(th+ang);r=np.minimum(dist,2)[...,None];mask=mask*periphery;target=spectral(p-e*po*r,e*ps*r)
            else:
                target=spectral(p,d*ps)
        elif kind=='directional':
            a=ang+np.deg2rad(f['blur_angle']);axis=np.array([np.cos(a),np.sin(a)])/units;target=np.zeros_like(base);mass=0
            for i in range(33):
                t=(i-16)/16;weight=np.exp(-4*t*t);target+=sample(p+axis*t*f['blur_radius']*f['scale'])*weight;mass+=weight
            target/=mass
        else:
            axis=np.array([np.cos(ang),np.sin(ang)])/units;contrast=np.abs((sample(p+axis*.002)-sample(p-axis*.002))@np.array([.2126,.7152,.0722]))
            delta=axis*f['shift'];target=np.stack((sample(p+delta)[...,0],base[...,1],sample(p-delta)[...,2]),-1);mask*=smooth(f['threshold'],f['threshold']+f['softness'],contrast)
        if kind in ('prism','directional'):
            original=f.get('mask_kind',kind)
            if original in ('halo','kaleidoscope','window'):mask*=periphery
            elif original=='split':mask*=edge(local[...,0]-f['inner']*.25,f['feather'])
            elif original=='veil':mask*=edge(local[...,0],f['feather'])
        amount=f['amount']*mask[...,None];out=base*(1-amount)+np.maximum(target,0)*amount
    return out
