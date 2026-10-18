"""Material definitions, cache/serialization and CPU–Vulkan spectral tracing."""
from pathlib import Path
import sys,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,get_lens,LENS,layout,validate_lens_edits
from optics import materials,vulkan,cuda
from optics.preview import kernel

def main():
    if len(sys.argv)>1:
        original=cuda.C.CDLL;candidate=str(Path(sys.argv[1]).resolve())
        cuda.C.CDLL=lambda path:original(candidate if str(path).endswith('optica_cuda.dll') else path)
    references={2:([1.51432,1.51680,1.52238],64.17),3:([1.61503,1.62004,1.63208],36.37)}
    catalog=[]
    for code,(indices,abbe) in references.items():
        spec=materials.resolve(dict(material=code));actual=[float(materials.index(spec,w)) for w in (materials.C,materials.D,materials.F)]
        assert np.max(np.abs(np.asarray(actual)-indices))<6e-6
        assert abs(spec[2]-abbe)<.01,(spec[2],abbe)
        catalog.append(dict(code=code,id=spec[5],indices_CdF=actual,abbe=spec[2],source=spec[6]))
    low=materials.resolve(dict(material=1,nd=1.6,abbe=20));high=materials.resolve(dict(material=1,nd=1.6,abbe=80))
    assert float(materials.index(low,materials.D))==1.6
    spread=lambda spec:float(materials.index(spec,materials.F)-materials.index(spec,materials.C))
    assert abs(spread(low)/spread(high)-4)<1e-11
    glass=[s['index'] for s in LENS.surfaces if s['nd']>1 and not s['is_stop']]
    air=next(s['index'] for s in LENS.surfaces if s['nd']==1 and not s['is_stop'])
    cases=[((glass[0],'material',2),),((glass[0],'material',3),),((glass[0],'material',1),(glass[0],'abbe',35),(glass[0],'nd',1.6)),
           ((glass[0],'material',2),(glass[1],'material',3))]
    b,c=materials.CATALOG[2][1:];custom=tuple([(glass[0],'material',4)]+[(glass[0],f'b{i}',v) for i,v in enumerate(b,1)]+[(glass[0],f'c{i}',v) for i,v in enumerate(c,1)])
    cases.append(custom);ray_results=[]
    for edits in cases:
        settings=Settings.parse(dict(lens_edits=edits,iris_mm=3,field_grid=3,ray_backend='cpu',dispersion=.3,coating_strength=.6));lens=get_lens(settings)
        prescription=lens.prescription.export();encoded=json.dumps(prescription,allow_nan=False)
        assert prescription['geometry_id']!=LENS.prescription.geometry_id and prescription['provenance']['edited']
        assert 'assignment' in prescription['surfaces'][glass[0]]['medium_after']
        assert get_lens(Settings.parse(json.loads(json.dumps(settings.__dict__)))).prescription.geometry_id==prescription['geometry_id']
        for field in ((0,0),(6,0),(0,4)):
            count=768;i=np.arange(count)+.5;r=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(i/count);angle=i*np.pi*(3-np.sqrt(5))
            positions=np.column_stack((r*np.cos(angle),r*np.sin(angle),np.full(count,-1.)))
            origin=np.array([-field[0]*5000/lens.efl,-field[1]*5000/lens.efl,-5000]);directions=positions-origin;directions/=np.linalg.norm(directions,axis=1)[:,None]
            wavelengths=np.tile([.4861,.5876,.6563],count//3)
            expected_p=np.empty((count,3));expected_d=np.empty((count,3));expected_e=np.empty(count);expected_v=np.empty(count,dtype=bool)
            for w in np.unique(wavelengths):
                ids=np.flatnonzero(wavelengths==w);p,d,valid,energy,_=lens.trace(positions[ids],directions[ids],settings,w)
                expected_p[ids]=p;expected_d[ids]=d;expected_e[ids]=energy;expected_v[ids]=valid
            assert np.isfinite(expected_p[expected_v]).all() and np.all((expected_e>=0)&(expected_e<=1))
            row=dict(materials=[lens.surfaces[index]['material_spec'][5] for index in glass if lens.surfaces[index].get('material_spec')],field=field)
            if vulkan.available():
                p,d,valid,energy=vulkan.trace(lens,settings,positions,directions,wavelengths);common=valid&expected_v;assert common.any()
                row.update(position_max_mm=float(np.max(np.abs(p[common]-expected_p[common]))),direction_max=float(np.max(np.abs(d[common]-expected_d[common]))),energy_max=float(np.max(np.abs(energy[common]-expected_e[common]))),visibility_mismatch=int(np.count_nonzero(valid!=expected_v)))
                assert row['position_max_mm']<.005 and row['direction_max']<2e-5 and row['energy_max']<5e-4
                assert row['visibility_mismatch']/count<.002
            ray_results.append(row)
    base=kernel(Settings(ray_backend='cpu',field_grid=3),1.6,32,1024)
    catalog_settings=Settings.parse(dict(lens_edits=cases[0],field_grid=3,ray_backend='cpu'))
    selected=kernel(catalog_settings,1.6,32,1024);equivalent=kernel(Settings.parse(dict(lens_edits=custom,field_grid=3,ray_backend='cpu')),1.6,32,1024)
    assert not np.array_equal(base.ray_array,selected.ray_array)
    channels=selected.ray_array.reshape(3,-1);assert not np.array_equal(channels[0],channels[2])
    assert np.array_equal(selected.ray_array,equivalent.ray_array) and np.array_equal(selected.pupil_array,equivalent.pupil_array)
    assert kernel(catalog_settings,1.6,32,1024) is selected
    assert selected['prescription_id']==get_lens(catalog_settings).prescription.geometry_id
    assert not selected.ray_array.flags.writeable
    invalid=[[(glass[0],'material',1)],[(glass[0],'material',1),(glass[0],'abbe',0)],[(glass[0],'material',4)],[(glass[0],'material',2.5)],[(air,'material',2)],[(glass[0],'b1',float('nan'))],[(glass[0],'material',5)]]
    invalid.append([(i,f,.25 if f=='c1' else v) for i,f,v in custom])
    invalid.append([(i,f,0 if f.startswith('b') else v) for i,f,v in custom])
    for edits in invalid:
        try:validate_lens_edits(edits)
        except ValueError:pass
        else:raise AssertionError(edits)
    cuda_result=dict(available=cuda.available())
    if cuda_result['available']:
        rgba=np.random.default_rng(808).random((32,32,4),dtype=np.float32);rgba[:,:,:3]*=2;rgba[:,:,3]=1
        cuda.upload(rgba,token='stage8');frames=[]
        for edits in ((),cases[0],custom):
            raw={**Settings(ray_backend='cpu',field_grid=3,iris_mm=3).__dict__,'lens_edits':edits}
            frame,info=cuda.render(raw,32,32,samples=32,taps=32,token='stage8')
            again,_=cuda.render(raw,32,32,samples=32,taps=32,token='stage8')
            assert np.array_equal(frame,again) and np.isfinite(frame).all() and np.all(frame[:,:,3]==1)
            frames.append(frame)
        assert not np.array_equal(frames[0],frames[1]);assert np.array_equal(frames[1],frames[2])
        cuda_result.update(material_changes_frame=True,catalog_custom_frames_exact=True,stable=True,precision=info['precision'],device=info['device'])
    report=dict(catalog=catalog,abbe_spread_ratio=4,ray_cases=ray_results,vulkan_available=vulkan.available(),cuda=cuda_result,legacy_not_inferred=True,physical_dispersion_at_zero_creative_gain=True,catalog_custom_atlases_exact=True,material_changes_invalidate_cache=True,cache_identity_preserved=True,invalid_cases_rejected=len(invalid),serialization_roundtrip=True)
    (ROOT/'research/materials-stage8-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='ray_cases'},indent=2));print('PASS',len(ray_results),'spectral ray cases')
if __name__=='__main__':main()
