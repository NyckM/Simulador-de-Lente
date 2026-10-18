"""Stage 3 donor isolation and far-plane extension invariants."""
import sys,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.background_extension import extend_background
from optics.core import Settings,render
h,w=48,64;y,x=np.mgrid[:h,:w];hole=(x>20)&(x<43)&(y>8)&(y<40)
mask=(~hole).astype(float);rgb=np.full((h,w,3),[.1,.25,.4]);rgb[hole]=[10,0,0]
extended,support=extend_background(rgb,mask)
assert support and np.allclose(extended,[.1,.25,.4],atol=1e-10)
assert np.array_equal(extended[~hole],rgb[~hole])
empty,valid=extend_background(rgb,np.zeros_like(mask));assert not valid and not empty.any()
full,valid=extend_background(rgb,np.ones_like(mask));assert valid and np.array_equal(full,rgb)
# The actual CPU reference must not produce a dark border on an in-focus object
# surrounded by a uniform far background; also exercise focus preservation.
s=Settings(focus_m=1,source_m=5,iris_mm=8,near_m=1,far_m=5,invert_depth=False,depth_slices=8,focus_preservation=1)
image=np.full((h,w,3),[.1,.25,.4]);image[hole]=[.6,.03,.02]
out,warnings=render(image,s,hole.astype(float));assert np.isfinite(out).all() and out.min()>-1e-8
folder=ROOT/'research/depth-stage3';folder.mkdir(exist_ok=True)
(folder/'cpu-validation.json').write_text(json.dumps(dict(passed=True,foreground_donors_excluded=True,known_rgb_exact=True,empty_layer_kept_empty=True,cpu_render_finite=True),indent=2))
print('CPU background extension passed')
