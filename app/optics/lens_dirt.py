"""Camera-space Lens Dirt reference; stable texture and highlight-only haze."""
import numpy as np
from scipy.ndimage import gaussian_filter,map_coordinates
from .aperture import mask_image

def dirt_map(settings,height,width):
    x,y=np.meshgrid((np.arange(width)+.5)/width,(np.arange(height)+.5)/height)
    angle=np.deg2rad(settings.lens_dirt_rotation);c,s=np.cos(angle),np.sin(angle)
    vx=c*(x-.5)-s*(y-.5)+.5;vy=s*(x-.5)+c*(y-.5)+.5
    if settings.lens_dirt_texture:
        image=mask_image(settings.lens_dirt_texture);h,w=image.shape
        value=map_coordinates(image,[(vy*(h-1)).ravel(),(vx*(w-1)).ravel()],order=1,mode='constant',cval=0).reshape(height,width)
        return value
    px=(vx-.5)*settings.lens_dirt_scale*5;py=(vy-.5)*(height/width)*settings.lens_dirt_scale*5
    def hash21(x,y):
        v=np.sin(x*127.1+y*311.7+settings.lens_dirt_seed*17.31)*43758.5453
        return v-np.floor(v)
    def noise(x,y):
        ix,iy=np.floor(x),np.floor(y);fx,fy=x-ix,y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy)
        return (1-fy)*((1-fx)*hash21(ix,iy)+fx*hash21(ix+1,iy))+fy*((1-fx)*hash21(ix,iy+1)+fx*hash21(ix+1,iy+1))
    n=.57*noise(px,py)+.28*noise(px*2.13+9.7,py*2.13+9.7)+.15*noise(px*4.37+21,py*4.37+21)
    t=np.clip((n-.25)/(.78-.25),0,1);smudge=t*t*(3-2*t)
    cx,cy=np.floor(px*5),np.floor(py*5);lx,ly=px*5-cx-.5,py*5-cy-.5
    speck=np.exp(-(lx*lx+ly*ly)*90)*(hash21(cx+51,cy+51)>=.89)
    return np.clip(.10+.65*smudge+.45*speck,0,1)

def dirt_layers(settings,height,width):
    """Textura real (R digitais, G poeira, B riscos, A fungos), desfocada pela abertura."""
    from .dirt_texture import generate
    tex=generate(max(1,min(1000,int(round(settings.lens_dirt_seed or 1))))).astype(np.float64)/255
    iris=settings.iris_mm;frac=.0035*iris*settings.lens_dirt_defocus;spread=max(1.,frac*1024*settings.lens_dirt_scale)
    if spread>1.:tex=gaussian_filter(tex,(spread*.55,spread*.55,0),mode='mirror')
    x,y=np.meshgrid((np.arange(width)+.5)/width,(np.arange(height)+.5)/height)
    angle=np.deg2rad(settings.lens_dirt_rotation);c,s=np.cos(angle),np.sin(angle)
    vx=c*(x-.5)-s*(y-.5)+.5;vy=s*(x-.5)+c*(y-.5)+.5
    tx=(vx-.5)*settings.lens_dirt_scale+.5;ty=(vy-.5)*(height/width)*settings.lens_dirt_scale+.5
    tx=1-np.abs(1-np.mod(tx,2));ty=1-np.abs(1-np.mod(ty,2))
    coords=[(ty*1024-.5).ravel(),(tx*1024-.5).ravel()]
    return np.stack([map_coordinates(tex[...,k],coords,order=1,mode='mirror').reshape(height,width) for k in range(4)],-1)

def apply_dirt(rgb,settings):
    if not settings.lens_dirt_amount:return rgb
    h,w=rgb.shape[:2];strength=settings.lens_dirt_amount
    if settings.lens_dirt_texture:
        L=np.zeros((h,w,4));L[...,0]=dirt_map(settings,h,w);W=np.array([1.,0,0,0])
    else:
        L=dirt_layers(settings,h,w);W=np.array([settings.lens_dirt_fingerprints,settings.lens_dirt_dust,settings.lens_dirt_scratches,settings.lens_dirt_fungus])
    LW=L*W;scatter=LW@np.array([1.,1.,1.25,1.]);block=LW@np.array([.35,1.,.15,1.])
    tint=(LW[...,0:1]*np.array([1.,1,1])+LW[...,1:2]*np.array([1.,1,1])+LW[...,2:3]*1.25*np.array([1.04,1,.96])+LW[...,3:4]*np.array([1.,.86,.68]))/np.maximum(scatter,1e-4)[...,None]
    out=rgb*(1-strength*settings.lens_dirt_block*np.minimum(block,1))[...,None]
    if settings.lens_dirt_scatter:
        peak=rgb.max(axis=2);high=rgb*np.maximum(0,peak-settings.lens_dirt_threshold)[...,None]/np.maximum(peak[...,None],1e-5)
        halo=gaussian_filter(high,(max(1,w*settings.lens_dirt_radius/1080*.36),)*2+(0,),mode='constant')
        out+=halo*strength*settings.lens_dirt_scatter*(.06+4.*scatter[...,None]*tint)
    return np.maximum(out,0)
