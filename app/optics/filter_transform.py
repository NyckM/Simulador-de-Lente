"""Image-space application mask, independent from the diffusion kernel."""
import numpy as np

def region_mask(s,h,w):
    if not s.diffusion_region:return np.ones((h,w))
    r=min(h,w)*.25
    y,x=np.mgrid[:h,:w]
    x=x+.5-s.diffusion_x*w-s.diffusion_pivot_x*r
    y=y+.5-s.diffusion_y*h-s.diffusion_pivot_y*r
    a=np.deg2rad(s.diffusion_rotation);c=np.cos(a);sn=np.sin(a)
    qx=(c*x+sn*y)/(s.diffusion_scale*s.diffusion_scale_x)+s.diffusion_pivot_x*r
    qy=(-sn*x+c*y)/(s.diffusion_scale*s.diffusion_scale_y)+s.diffusion_pivot_y*r
    t=np.clip((np.hypot(qx,qy)/r-.8)/.2,0,1)
    return 1-t*t*(3-2*t)
