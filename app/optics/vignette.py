"""Optional creative corner falloff, independent of depth and pupil tracing."""
import numpy as np

def vignette_mask(height,width,amount):
    x,y=np.meshgrid((np.arange(width)+.5)/width,(np.arange(height)+.5)/height)
    radius=np.hypot((x-.5)*2,(y-.5)*2*height/width)
    t=np.clip((radius-.45)/.65,0,1)
    return 1-amount*t*t*(3-2*t)


def compensation_gain(throughput,height,width,amount,limit_ev=3.):
    """Achromatic flat-field correction with an EV cap and blocked-field guard."""
    if not amount:return np.ones((height,width))
    t=np.asarray(throughput,dtype=float);ny,nx=t.shape
    reference=t[ny//2,nx//2]
    if reference<=0:return np.ones((height,width))
    t=np.clip(t/reference,0,1)
    xs=(np.arange(width)+.5)/width*(nx-1)
    ys=(np.arange(height)+.5)/height*(ny-1)
    rows=np.array([np.interp(xs,np.arange(nx),row) for row in t])
    mapped=np.array([np.interp(ys,np.arange(ny),rows[:,x]) for x in range(width)]).T
    confidence=np.clip(mapped/.01,0,1);confidence=confidence*confidence*(3-2*confidence)
    ev=np.minimum(-np.log2(np.maximum(mapped,1e-12)),limit_ev)*amount/100
    return 1+confidence*(np.exp2(ev)-1)
