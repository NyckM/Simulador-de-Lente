"""Independent endpoint/metric checks and CPU/JS contract fixtures."""
from pathlib import Path
from dataclasses import replace,asdict
import sys,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,depth_nearness,depth_layers
from optics.depth_mapping import prepare

def main():
    base=Settings(near_m=2,far_m=10,depth_mode='slicing')
    specifications=[
        ('legacy',[0,.25,.5,.75,1],{}),('inverted',[0,.25,.5,.75,1],dict(invert_depth=True)),
        ('minmax',[.2,.3,.4,.7,.8],dict(depth_normalize='minmax')),
        ('percentile',[-100]+list(np.linspace(.2,.8,101))+[100],dict(depth_normalize='percentile')),
        ('manual',[0,.25,.5,.75,1],dict(depth_normalize='manual',depth_low=.25,depth_high=.75)),
        ('curve-linear',[0,.25,.5,.75,1],dict(depth_curve=2,depth_mapping='linear')),
        ('metric',[0,.3,2,8,5000,float('nan'),-2],dict(depth_units='meters',invert_depth=True,depth_gain=1)),
        ('metric-invalid-transform',[.3,2,8],dict(depth_units='meters',depth_gain=1,depth_bias=-3)),
        ('constant',[.4]*10,dict(depth_normalize='minmax')),
        ('negative-gain',[.2,.3,.4,.7,.8],dict(depth_normalize='minmax',depth_gain=-1,depth_bias=1,depth_curve=.5)),
        ('invalid-relative',[float('nan'),0,.5,1,float('inf')],{})]
    fixtures=[]
    for name,values,config in specifications:
        s=replace(base,**config);raw=np.array(values,dtype='f4');p=prepare(raw,s)
        assert np.isfinite(p['nearness']).all() and np.isfinite(p['distance_m']).all()
        assert np.all((p['nearness']>=-1e-12)&(p['nearness']<=1+1e-12))
        np.testing.assert_allclose(depth_nearness(raw,s),p['nearness'],atol=1e-15)
        masks=depth_layers(raw,s);np.testing.assert_allclose(np.array([m for _,m in masks]).sum(axis=0),1,atol=1e-14)
        if name=='legacy':np.testing.assert_allclose(p['distance_m'],1/(.1+raw*.4),rtol=1e-7)
        if name=='curve-linear':np.testing.assert_allclose(p['distance_m'],10-raw**2*8,rtol=1e-7)
        if name=='metric':np.testing.assert_equal(p['distance_m'],[10,2,2,8,10,10,10]);assert p['statistics']['invalid']==3
        if name=='constant':np.testing.assert_equal(p['nearness'],.5);assert p['warnings']==['constant_normalization']
        if name=='invalid-relative':np.testing.assert_equal(p['nearness'][[0,4]],0)
        fixtures.append(dict(name=name,raw=[float(v) if np.isfinite(v) else None for v in raw],settings=asdict(s),expected={k:v.tolist() if isinstance(v,np.ndarray) else v for k,v in p.items()}))
    # Fixed bounds cannot breathe when an outlier appears in a later video frame.
    s=replace(base,depth_normalize='manual',depth_low=.2,depth_high=.8)
    assert prepare([.5],s)['nearness'][0]==prepare([.5,1000],s)['nearness'][0]
    large=np.zeros(131073);large[1]=9;large[2]=-7
    st=prepare(large,replace(base,depth_normalize='minmax'))['statistics'];assert st['low']==-7 and st['high']==9
    for config in [dict(depth_units='bad'),dict(depth_normalize='bad'),dict(depth_curve=0),dict(depth_curve=True),dict(depth_low=2,depth_high=1),dict(depth_high=float('nan'))]:
        try:Settings.parse(config)
        except ValueError:pass
        else:raise AssertionError('invalid settings accepted')
    for near,far in [(0,10),(10,2),(2,float('nan'))]:
        try:prepare([.5],base,near=near,far=far)
        except ValueError:pass
        else:raise AssertionError('invalid distance bounds accepted')
    folder=ROOT/'tests/fixtures';folder.mkdir(exist_ok=True)
    (folder/'depth-stage13.json').write_text(json.dumps(fixtures,allow_nan=False),encoding='utf-8')
    report=dict(cases=len(fixtures),legacy_mapping_exact=True,inverse_distance_endpoints=True,linear_distance_and_curve=True,
        metric_clipping_and_invalid=True,constant_map_stable=True,fixed_bounds_video_stable=True,minmax_full_map_not_subsample=True,
        soft_partition_unity=True,invalid_settings_rejected=6)
    (ROOT/'research/depth-stage13-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)

if __name__=='__main__':main()
