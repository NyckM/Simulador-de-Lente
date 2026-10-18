"""Image-defined transmission at the physical iris plane, up to 512 pixels."""
import base64, io
from functools import lru_cache
import numpy as np
from PIL import Image

@lru_cache(maxsize=8)
def mask_image(data):
    if not isinstance(data,str) or not data.startswith('data:image/png;base64,') or len(data)>1_500_000:
        raise ValueError('Máscara de abertura inválida: use PNG de até 512 × 512 px.')
    try:
        payload=base64.b64decode(data.split(',',1)[1],validate=True)
        with Image.open(io.BytesIO(payload)) as im:
            if im.format!='PNG' or not 1<=im.width<=512 or not 1<=im.height<=512:
                raise ValueError('Máscara de abertura deve ter até 512 × 512 px.')
            rgba=np.asarray(im.convert('RGBA'),dtype=float)/255
        result=(rgba[...,:3]@np.array([.2126,.7152,.0722]))*rgba[...,3]
        result.setflags(write=False)
        return result
    except (OSError,TypeError,ValueError) as exc:
        raise ValueError('Não foi possível ler a máscara PNG de abertura.') from exc

def mask_coverage(xy,settings):
    if not settings.aperture_custom or not settings.aperture_mask:return np.ones(len(xy))
    image=mask_image(settings.aperture_mask);h,w=image.shape
    angle=np.deg2rad(settings.rotation);c,s=np.cos(angle),np.sin(angle)
    xy=np.asarray(xy);x=(xy[:,0]*c+xy[:,1]*s)/settings.iris_mm;y=(-xy[:,0]*s+xy[:,1]*c)/settings.iris_mm
    finite=np.isfinite(x)&np.isfinite(y);x=np.nan_to_num(x);y=np.nan_to_num(y)
    u=np.clip((x+1)*.5*(w-1),0,w-1);v=np.clip((1-y)*.5*(h-1),0,h-1)
    u0=np.floor(u).astype(int);v0=np.floor(v).astype(int);u1=np.minimum(u0+1,w-1);v1=np.minimum(v0+1,h-1);a=u-u0;b=v-v0
    value=(1-b)*((1-a)*image[v0,u0]+a*image[v0,u1])+b*((1-a)*image[v1,u0]+a*image[v1,u1])
    if settings.aperture_invert:value=1-value
    return np.where(finite&(np.abs(x)<=1)&(np.abs(y)<=1),value,0)
