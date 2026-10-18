import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from optics.vignette import compensation_gain
from optics.core import Settings
t=np.array([[.01,.25,.5],[.5,1,.5],[.25,.5,.75]])
a=compensation_gain(t,65,97,0);b=compensation_gain(t,65,97,50);c=compensation_gain(t,65,97,100)
assert np.array_equal(a,np.ones_like(a))
assert np.all(c>=b) and np.all(b>=a) and c.max()<=8
assert c[32,48]==1 and c[0,0]>c[-1,-1]
assert np.array_equal(compensation_gain(np.zeros((3,3)),65,97,100),a)
assert np.all(compensation_gain(np.full((3,3),.01),65,97,100)==1)
assert Settings.parse({}).edge_compensation==0
for v in [-1,101]:
    try: Settings.parse({'edge_compensation':v})
    except ValueError: pass
    else: raise AssertionError('invalid percentage accepted')
result=dict(passed=True,bypass_exact=True,monotonic=True,center_unchanged=True,max_gain=float(c.max()),blocked_field_safe=True)
Path('research/edge-compensation-cpu.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result)
