"""Deterministic physical ray checks; no claim of full-frame CPU/GPU equivalence."""
from pathlib import Path
import sys,json,time
from dataclasses import replace
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import Settings,get_lens
from optics.preview import kernel,_kernel_cached
from optics import vulkan,cuda

def main():
    results=[];ready=vulkan.available()
    for model in ('dgauss50','tessar_50','zeiss_planar_50'):
        lens=get_lens(Settings(lens_model=model));count=4096
        i=np.arange(count)+.5;radius=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(i/count);theta=i*np.pi*(3-np.sqrt(5))
        p=np.column_stack((radius*np.cos(theta),radius*np.sin(theta),np.full(count,-1.)))
        s=Settings(lens_model=model,iris_mm=min(3,lens.max_iris),blades=7,dispersion=.4,coating_strength=.6)
        for field in ((0.,0.),(8.,0.),(0.,5.)):
            origin=np.array([-field[0]*5000/lens.efl,-field[1]*5000/lens.efl,-5000]);d=p-origin;d/=np.linalg.norm(d,axis=1)[:,None]
            for wl in (.4861,.5876,.6563):
                started=time.perf_counter();cpu=lens.trace(p,d,s,wl);cpu_ms=(time.perf_counter()-started)*1000
                assert np.isfinite(cpu[0][cpu[2]]).all() and np.isfinite(cpu[1][cpu[2]]).all()
                assert np.all((cpu[3]>=0)&(cpu[3]<=1))
                assert np.max(np.abs(np.linalg.norm(cpu[1][cpu[2]],axis=1)-1))<1e-10
                row=dict(model=model,field=field,wavelength_um=wl,cpu_ms=cpu_ms,passed=int(cpu[2].sum()))
                if ready:
                    started=time.perf_counter();gpu=vulkan.trace(lens,s,p,d,np.full(count,wl));row['gpu_wall_ms']=(time.perf_counter()-started)*1000
                    common=cpu[2]&gpu[2];assert common.any()
                    row.update(position_max_mm=float(np.max(np.abs(cpu[0][common]-gpu[0][common]))),direction_max=float(np.max(np.abs(cpu[1][common]-gpu[1][common]))),energy_max=float(np.max(np.abs(cpu[3][common]-gpu[3][common]))),visibility_mismatch=int(np.count_nonzero(cpu[2]!=gpu[2])))
                    assert row['position_max_mm']<.005,row
                    assert row['direction_max']<2e-5,row
                    assert row['energy_max']<5e-4,row
                    assert row['visibility_mismatch']/count<.002,row
                results.append(row)
    s=Settings(ray_backend='cpu',field_grid=3);_kernel_cached.cache_clear()
    a=kernel(s,16/9,32,1024,profile=True);b=kernel(s,16/9,32,1024,profile=True)
    assert not a['profile']['cache_hit'] and b['profile']['cache_hit']
    assert a['atlas']==b['atlas'] and a['pupils']==b['pupils']
    assert kernel(s,16/9,32,1024) is kernel(s,16/9,32,1024), 'CUDA cache identity regression'
    pupils=np.array(a['pupils']).reshape(3,32,3,3,4)
    mass=pupils[:,:,:,:,2].sum(axis=1)/32
    assert np.allclose(mass[mass>0],1,atol=2e-7)
    assert np.isfinite(a['atlas']).all() and np.all(pupils[:,:,:,:,2]>=0)
    assert np.all((pupils[:,:,:,:,3]>=0)&(pupils[:,:,:,:,3]<=1))
    # Optical change misses; focus/exposure keep the atlas as shader uniforms.
    assert kernel(replace(s,focus_m=2,exposure=1),16/9,32,1024,profile=True)['profile']['cache_hit']
    assert not kernel(replace(s,iris_mm=3),16/9,32,1024,profile=True)['profile']['cache_hit']
    cuda_check={'available':cuda.available()}
    if cuda_check['available']:
        rgba=np.empty((32,32,4),dtype='f4');rgba[:]=[.123456,.456789,2.12345,1.];rgba[:,:16,3]=.5
        cuda.upload(rgba,np.tile(np.linspace(0,1,32,dtype='f4'),(32,1)),token='stage3-bench')
        raw_settings={**s.__dict__,'master_blend':0,'ray_focus':False}
        full,info=cuda.render(raw_settings,32,32,samples=32,taps=32,token='stage3-bench',preview=False)
        half,half_info=cuda.render(raw_settings,32,32,samples=32,taps=32,token='stage3-bench',preview=True)
        expected=rgba.copy();expected[:,:,:3]*=expected[:,:,3,None];expected[:,:,3]=1
        full_error=float(np.max(np.abs(full-expected)));half_error=float(np.max(np.abs(half.astype('f4')-full)))
        assert full_error<1e-5 and half_error<.004
        assert full.dtype==np.float32 and half.dtype==np.float16
        cuda_check.update(full_error=full_error,preview_half_error=half_error,export_precision=info['precision'],preview_precision=half_info['precision'],alpha_contract='composite over black, opaque output')
    result=dict(vulkan_available=ready,device=vulkan.info().get('device'),cases=results,cuda=cuda_check,atlas_energy_normalized=True,cache_verified=True,cache_identity_preserved=True,cold_profile=a['profile'],warm_profile=b['profile'],scope='physical rays and atlas; gather/scatter full-frame equivalence not asserted')
    (ROOT/'research/engines-stage3-validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='cases'},indent=2));print('PASS',len(results),'ray cases')
if __name__=='__main__':main()
