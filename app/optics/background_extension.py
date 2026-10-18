"""Estimate hidden far-layer radiance using only its depth-selected donors.

This is color extension for RGB+Z compositing, not hidden geometry recovery.
Foreground opacity is never changed. Empty layers remain empty.
"""
import numpy as np
from scipy.ndimage import gaussian_filter


def extend_background(rgb, mask):
    mask=np.clip(np.asarray(mask,dtype=float),0,1)
    if not np.any(mask>1e-5):
        return np.zeros_like(rgb),False
    if np.all(mask>=.99999):
        return rgb.copy(),True
    weighted=rgb*mask[...,None]
    # Grow the search footprint only where there is insufficient far-layer support.
    color=np.zeros_like(rgb)
    pending=np.ones(mask.shape,dtype=bool)
    local=weighted.copy();coverage=mask.copy()
    original=np.divide(weighted,mask[...,None],out=np.zeros_like(rgb),where=mask[...,None]>1e-5)
    t=np.clip((mask-.005)/(.2-.005),0,1);confidence=t*t*(3-2*t)
    sigma=0.
    while pending.any():
        ready=pending & (coverage>=.2)
        if sigma>=max(mask.shape)*2:
            ready=pending
        estimate=local/np.maximum(coverage[...,None],1e-12)
        color[ready]=estimate[ready]
        pending[ready]=False
        if not pending.any():break
        sigma=1. if sigma==0 else sigma*2
        local=gaussian_filter(weighted,(sigma,sigma,0),mode='nearest')
        coverage=gaussian_filter(mask,sigma,mode='nearest')
    color=color*(1-confidence[...,None])+original*confidence[...,None]
    return color,True
