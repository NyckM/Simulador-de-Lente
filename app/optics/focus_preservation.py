"""Editorial spread controls with a continuous transition in inverse metres."""
import numpy as np

def spread_scale(distance,focus,strength=0,width=.1,foreground=100,background=100):
    distance=np.asarray(distance,dtype=float)
    if strength<=0 and foreground==100 and background==100:return np.ones_like(distance)
    t=np.clip(np.abs(1/np.maximum(distance,1e-6)-1/max(focus,1e-6))/max(width,1e-6),0,1)
    ramp=t*t*(3-2*t)
    side=np.where(distance<focus,foreground,background)/100
    return (1-np.clip(strength,0,1)*(1-ramp))*(1+(side-1)*ramp)
