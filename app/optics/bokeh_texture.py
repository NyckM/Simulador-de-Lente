"""Deterministic editorial pupil texture; positive, independent of the iris mask."""
import numpy as np


def modulation(pupil,rings=0.,grain=0.,scale=6.,rotation=0.):
    if not rings and not grain:return np.ones(np.asarray(pupil).shape[:-1])
    p=np.asarray(pupil);a=np.deg2rad(rotation);c=np.cos(a);s=np.sin(a)
    x=(c*p[...,0]-s*p[...,1])*scale;y=(s*p[...,0]+c*p[...,1])*scale
    radial=.5+.5*np.cos(2*np.pi*np.hypot(x,y))
    noise=.5+.25*np.sin(2.17*x+.7)*np.sin(1.73*y+1.3)+.25*np.sin(4.31*x+1.9)*np.sin(3.11*y-.4)
    return (1-rings*.8*(1-radial))*(1-grain*.7*(1-noise))
