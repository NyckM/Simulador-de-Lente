"""Centroid projection oracle, Jacobian compensation and cache compatibility."""
from pathlib import Path
import sys,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,get_lens
from optics.preview import kernel,Atlas
from optics.distortion import field_map,prepare_atlas,_cache

def main():
    s=Settings.parse(dict(physical_distortion=True,field_grid=3,iris_mm=3,ray_focus=False,ray_backend='cpu'))
    data=kernel(s,1.5,32);lens=get_lens(s);m=field_map(data,s);meta=data['distortion'];g=data['grid']
    # Independent ray projection, with the same deterministic pupil samples.
    n=data['build_profile']['rays_per_field'] if 'rays_per_field' in data['build_profile'] else 4096
    errors=[]
    # Actual sample count is specified by quality, not atlas taps.
    for ch,wavelength in enumerate(meta['wavelengths_um']):
        field=(s.sensor_mm/2,0.)
        p,d,ok,energy,history=lens.bundle(field,s.source_m,s,wavelength,n,history=True)
        xy=p[ok,:2]+(m['sensor_z_mm']-p[ok,2,None])*d[ok,:2]/d[ok,2,None]
        expected=np.average(xy,axis=0,weights=energy[ok]);errors.append(float(np.max(abs(expected-m['positions'][ch,1,2]))))
    assert max(errors)<1e-8,errors
    # A known affine optical map, including shear and per-color offsets.
    fake=Atlas(data);centers=np.zeros((3,g,g,4));A=np.array([[1.15,.12],[-.08,.9]])
    for ch in range(3):
        for y in range(g):
            for x in range(g):
                field=np.array([(x/(g-1)-.5)*s.sensor_mm,(y/(g-1)-.5)*s.sensor_mm/1.5])
                centers[ch,y,x,:2]=A@field+np.array([.3+ch*.02,-.2])
    fake['distortion']={**meta,'centroids_mm_and_slopes':centers.ravel().tolist(),'throughput':np.ones((3,g,g)).ravel().tolist()}
    fake['atlas_id']='affine-stage10';fake.ray_array=data.ray_array;fake.pupil_array=data.pupil_array
    fm=field_map(fake,s);assert np.max(abs(fm['jacobian']-A))<1e-12
    prepared=prepare_atlas(fake,s);out=prepared.ray_array.reshape(3,32,g,g,4)
    original=data.ray_array.reshape(3,32,g,g,4)
    compensated=np.concatenate([np.einsum('ij,ctyxj->ctyxi',A,out[...,:2]),np.einsum('ij,ctyxj->ctyxi',A,out[...,2:])],axis=-1)
    error=float(np.max(abs(compensated-original)));assert error<2e-6,error
    assert np.array_equal(prepared.pupil_array,data.pupil_array)
    assert prepare_atlas(fake,s) is prepared
    assert not prepared.ray_array.flags.writeable and not prepared.pupil_array.flags.writeable
    assert isinstance(prepared['atlas'],np.ndarray)
    assert prepare_atlas(fake,Settings.parse(dict(physical_distortion=False))) is fake
    assert prepare_atlas(fake,s,0) is fake
    s2=Settings.parse(dict(physical_distortion=True,focus_m=4));assert prepare_atlas(fake,s2) is not prepared
    translated=Atlas(fake);translated.ray_array=fake.ray_array;translated.pupil_array=fake.pupil_array
    moved=centers.copy();moved[:,:,:,:2]+=[.4,.1]
    translated['distortion']={**fake['distortion'],'id':'translation-cache-test','centroids_mm_and_slopes':moved.ravel().tolist()}
    assert prepare_atlas(translated,s) is not prepared
    # Folded projection must carry no energy and have no inverse.
    bad=Atlas(fake);bad['atlas_id']='folded-stage10';bad.ray_array=fake.ray_array;bad.pupil_array=fake.pupil_array
    centers[:,:,:,0]*=-1;bad['distortion']={**fake['distortion'],'centroids_mm_and_slopes':centers.ravel().tolist()}
    assert not field_map(bad,s)['valid'].any();assert not prepare_atlas(bad,s).pupil_array.reshape(-1,4)[:,2].any()
    for blend in (float('nan'),2,-1):
        try:prepare_atlas(fake,s,blend)
        except ValueError:pass
        else:raise AssertionError('invalid blend')
    from optics.core import render
    try:render(np.ones((16,16,3)),s)
    except ValueError as exc:assert 'WebGL/CUDA' in str(exc)
    else:raise AssertionError('legacy CPU must not silently ignore projection')
    # Material dispersion and anisotropic optics originate in traced geometry.
    physical=[]
    for edits in ([(0,'material',2),(2,'material',3)],[(0,'shape',1)],[(0,'shape',2)]):
        ss=Settings.parse(dict(physical_distortion=True,iris_mm=3,field_grid=3,ray_backend='cpu',ray_focus=False,lens_edits=edits))
        dd=kernel(ss,1.5,32);mm=field_map(dd,ss);ll=get_lens(ss);error=0.;count=0
        for ch,wl in enumerate(dd['distortion']['wavelengths_um']):
            for y in range(3):
                for x in range(3):
                    if dd['distortion']['throughput'][ch*9+y*3+x]<=1e-12:continue
                    field=((x/2-.5)*ss.sensor_mm,(y/2-.5)*ss.sensor_mm/1.5)
                    p,d,ok,energy,_=ll.bundle(field,ss.source_m,ss,wl,4096,history=True)
                    expected=np.average(p[ok,:2]+(mm['sensor_z_mm']-p[ok,2,None])*d[ok,:2]/d[ok,2,None],axis=0,weights=energy[ok])
                    error=max(error,float(np.max(abs(expected-mm['positions'][ch,y,x]))));count+=1
        assert error<1e-10
        physical.append(dict(edits=edits,projected_fields=count,error_mm=error,chromatic_shift_mm=float(np.max(abs(mm['positions'][0]-mm['positions'][1]))),jacobian_center=mm['jacobian'][1,1].tolist()))
    assert physical[0]['chromatic_shift_mm']>1e-5
    assert abs(physical[1]['jacobian_center'][0][0]-physical[1]['jacobian_center'][1][1])>.1
    native={}
    if len(sys.argv)>1:
        from optics import cuda
        original_cdll=cuda.C.CDLL;candidate=str(Path(sys.argv[1]).resolve())
        cuda.C.CDLL=lambda path:original_cdll(candidate if str(path).endswith('optica_cuda.dll') else path)
        assert cuda.available()
        image=np.ones((24,32,4),'f4');image[:,:,:3]=np.linspace(0,1,32)[None,:,None]
        cuda.upload(image,token='stage10')
        raw=dict(physical_distortion=True,iris_mm=3,ray_focus=False,ray_backend='cpu',field_grid=3)
        on,info=cuda.render(raw,32,24,32,32,token='stage10');again,_=cuda.render(raw,32,24,32,32,token='stage10')
        off,_=cuda.render({**raw,'physical_distortion':False},32,24,32,32,token='stage10')
        restored,_=cuda.render({**raw,'physical_distortion':False},32,24,32,32,token='stage10')
        assert np.array_equal(on,again) and np.array_equal(off,restored) and np.isfinite(on).all() and np.all(on[:,:,3]==1)
        assert info['physicalDistortion']=='webgl-presenter-inverse-map'
        native=dict(device=info['device'],stable=True,opaque=True,presenter_required=True)
    # Cross-language fixture retains full precision and canonical order.
    fixture=dict(data={**fake,'atlas':fake.ray_array.tolist(),'pupils':fake.pupil_array.tolist()},settings=s.__dict__,expected=dict(positions=fm['positions'].ravel().tolist(),jacobian=fm['jacobian'].ravel().tolist(),prepared=prepared.ray_array.tolist()))
    (ROOT/'tests/fixtures/distortion-stage10.json').write_text(json.dumps(fixture),encoding='utf-8')
    report=dict(centroid_projection_error_mm=max(errors),affine_psf_compensation_error_mm=float(np.max(abs(compensated-original))),physical_cases=physical,cuda=native,cache_reuse=True,focus_invalidation=True,immutable=True,legacy_bypass=True,folded_energy_zero=True,bounded_cache=_cache.info())
    (ROOT/'research/distortion-stage10-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

if __name__=='__main__':main()

