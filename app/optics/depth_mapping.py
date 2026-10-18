"""Depth contract v1: raw data -> bounds -> direction/curve -> metric distance.

Encoded nearness is always inverse-distance normalized, for existing renderers.
No alpha is inferred from a depth map. Invalid data uses the far plane.
"""
import numpy as np

KEYS=('depth_units','depth_normalize','depth_low','depth_high','depth_curve','depth_mapping','depth_gain','depth_bias')

def advanced(s):
    return s.depth_units!='relative' or s.depth_normalize!='off' or s.depth_curve!=1 or s.depth_mapping!='inverse' or s.depth_gain!=1 or s.depth_bias!=0

def prepare(values,s,near=None,far=None,invert=None):
    raw=np.asarray(values,dtype='f8');near=s.near_m if near is None else near;far=s.far_m if far is None else far
    invert=s.invert_depth if invert is None else invert
    if not np.isfinite(near) or not np.isfinite(far) or near<=0 or near>=far:raise ValueError('Depth: limites próximo e distante inválidos.')
    valid=np.isfinite(raw)
    if s.depth_units=='meters':valid &= raw>0
    finite=raw[valid]
    raw_min,raw_max=(float(finite.min()),float(finite.max())) if finite.size else (None,None)
    # Same deterministic stride and linear quantiles as JavaScript.
    stride=max(1,int(np.ceil(raw.size/65536)));sample=raw.ravel()[::stride];sample=sample[np.isfinite(sample)]
    if s.depth_units=='meters':sample=sample[sample>0]
    if not sample.size and finite.size:sample=finite
    low,high=(raw_min,raw_max) if finite.size else (0.,0.)
    if s.depth_normalize=='percentile' and sample.size:low,high=np.quantile(sample,[.01,.99]).tolist()
    elif s.depth_normalize=='manual':low,high=s.depth_low,s.depth_high
    elif s.depth_normalize=='off':low,high=0.,1.
    flat=high-low<=1e-12
    safe=np.where(valid,raw,0.)
    if s.depth_units=='meters':
        adjusted=safe*s.depth_gain+s.depth_bias
        valid &= np.isfinite(adjusted)&(adjusted>0)
        distance=np.clip(adjusted,near,far)
        distance=np.where(valid,distance,far);nearness=(1/distance-1/far)/(1/near-1/far)
        normalized=np.clip((distance-near)/(far-near),0,1)
    else:
        normalized=np.full(raw.shape,.5) if flat else np.clip((safe-low)/(high-low),0,1)
        d=np.clip(normalized*s.depth_gain+s.depth_bias,0,1)
        if invert:d=1-d
        d=d**s.depth_curve
        distance=(far-d*(far-near)) if s.depth_mapping=='linear' else 1/(1/far+d*(1/near-1/far))
        nearness=d if s.depth_mapping=='inverse' else (1/distance-1/far)/(1/near-1/far)
        nearness=np.where(valid,nearness,0.);distance=np.where(valid,distance,far)
    warnings=[]
    mapped=nearness[valid]
    collapsed=bool(mapped.size and np.ptp(mapped)<=1e-6 and finite.size and np.ptp(finite)>1e-6)
    if collapsed:warnings.append('collapsed_depth_mapping')
    if flat and s.depth_units=='relative' and s.depth_normalize!='off':warnings.append('constant_normalization')
    if not valid.all():warnings.append('invalid_depth_far_fallback')
    return dict(nearness=nearness,normalized=normalized,distance_m=distance,valid=valid,
        statistics=dict(low=float(low),high=float(high),raw_min=raw_min,
            raw_max=raw_max,invalid=int((~valid).sum()),total=int(raw.size),
            constant=flat,collapsed=collapsed,binary=bool(np.all((nearness<1e-6)|(nearness>1-1e-6))),sample_stride=stride),warnings=warnings)


def blur_transition(nearness, settings):
    """Cut band maps to intermediate inverse distances, never scene opacity."""
    if settings.depth_mode != 'cut' or settings.depth_feather <= 0:
        return nearness
    t=np.clip((nearness-settings.depth_cut+settings.depth_feather)/(2*settings.depth_feather),0,1)
    return t*t*(3-2*t)


def focus_anchor(settings, near=None, far=None):
    """Keep the physical focus plane as an exact interior partition node."""
    near=settings.near_m if near is None else near
    far=settings.far_m if far is None else far
    f=(1/settings.focus_m-1/far)/(1/near-1/far)
    return float(f) if 1e-6 < f < 1-1e-6 else 0.

def focus_partition(values, settings, inverse=False):
    f=focus_anchor(settings)
    if not f:return values
    n=settings.depth_slices if settings.depth_mode in ('auto','slicing','cut') else 5
    a=min(n-2,max(1,int(np.floor(f*(n-1)+.5))))/(n-1)
    x=np.asarray(values)
    if inverse:return np.where(x<=a,x*f/a,f+(x-a)*(1-f)/(1-a))
    return np.where(x<=f,x*a/f,a+(x-f)*(1-a)/(1-f))
