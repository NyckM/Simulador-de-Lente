"""Independent intersection/normal oracles, physical axis split and atlas checks."""
from pathlib import Path
import sys,json
import numpy as np
from scipy.optimize import brentq
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics import geometry,vulkan,cuda
from optics.core import Settings,get_lens,LENS,layout,normalize,refract
from optics.preview import kernel,focus_plane

def main():
    if len(sys.argv)>1:
        original=cuda.C.CDLL;candidate=str(Path(sys.argv[1]).resolve())
        cuda.C.CDLL=lambda path:original(candidate if str(path).endswith('optica_cuda.dll') else path)
    rng=np.random.default_rng(901);rows=[];normal_error=0.;residual_error=0.
    # Rotational sphere limit, both signs; an independent analytic sphere root.
    for radius in (30.,-30.):
        row=dict(curvature_radius=radius,shape=3,conic=0,a4=0,a6=0)
        p=np.column_stack((rng.uniform(-8,8,200),rng.uniform(-8,8,200),np.full(200,-10.)))
        d=normalize(np.column_stack((rng.uniform(-.04,.04,(200,2)),np.ones(200))))
        hit,n,valid=geometry.intersect(row,0,p,d)
        q=p-[0,0,radius];b=(q*d).sum(1);t=-b-np.sign(radius)*np.sqrt(b*b-(q*q).sum(1)+radius*radius)
        expected=p+t[:,None]*d;assert valid.all();assert np.max(np.abs(hit-expected))<1e-11
        e=(expected-[0,0,radius]);e/=np.linalg.norm(e,axis=1)[:,None]
        assert np.max(np.abs(np.abs((e*n).sum(1))-1))<1e-12
    # Gradient against central finite differences, then scalar brentq roots.
    configurations=[(1,30,0,0,0),(2,-30,0,0,0),(3,30,-1,1e-6,-2e-10),(3,-30,-.7,-2e-6,1e-10)]
    fixture=[];intersection_count=0
    for code,r,k,a4,a6 in configurations:
        row=dict(shape=code,curvature_radius=r,conic=k,a4=a4,a6=a6,aperture_diameter=25.2)
        x=rng.uniform(-7,7,128);y=rng.uniform(-7,7,128);h,gx,gy,domain=geometry.sag_gradient(row,x,y)
        delta=1e-5
        fx=(geometry.sag_gradient(row,x+delta,y)[0]-geometry.sag_gradient(row,x-delta,y)[0])/(2*delta)
        fy=(geometry.sag_gradient(row,x,y+delta)[0]-geometry.sag_gradient(row,x,y-delta)[0])/(2*delta)
        error=max(np.max(np.abs(gx-fx)),np.max(np.abs(gy-fy)));normal_error=max(normal_error,float(error));assert error<1e-9
        p=np.column_stack((x,y,np.full(len(x),-10.)));d=normalize(np.column_stack((rng.uniform(-.03,.03,(len(x),2)),np.ones(len(x)))))
        hit,n,valid=geometry.intersect(row,0,p,d);assert valid.all()
        for j in range(len(p)):
            # Independent scalar expression, not the intersection implementation.
            def f(t):
                point=p[j]+t*d[j];u=point[0]**2 if code==1 else point[1]**2 if code==2 else point[0]**2+point[1]**2
                c=1/r;kk=k if code==3 else 0;aa=a4 if code==3 else 0;bb=a6 if code==3 else 0
                sag=c*u/(1+np.sqrt(1-(1+kk)*c*c*u))+aa*u*u+bb*u*u*u
                return point[2]-sag
            t=brentq(f,0,20,xtol=1e-12);expected=p[j]+t*d[j];error=float(np.max(np.abs(expected-hit[j])));residual_error=max(residual_error,error);assert error<1e-9
        if code in (1,2):
            axis=2-code;out,ok,energy=refract(d,n,1,1.6);assert ok.all()
            assert np.max(np.abs(d[:,axis]-1.6*out[:,axis]))<1e-12
        for j in range(10):fixture.append(dict(surface={**row,'z':0},p=p[j][[2,0,1]].tolist(),d=d[j][[2,0,1]].tolist(),hit=hit[j][[2,0,1]].tolist(),normal=n[j][[2,0,1]].tolist()))
        intersection_count+=len(p)
    # Invalid domains/slopes/coefficients and crossings are refused.
    invalid=[[(0,'shape',1.5)],[(0,'shape',4)],[(0,'conic',-1)],[(0,'shape',1),(0,'a4',1e-6)],[(0,'shape',3),(0,'conic',5)],[(0,'shape',3),(0,'a4',.001)],[(0,'shape',3),(0,'a6',float('nan'))],[(0,'shape',3),(0,'a6',.00002)]]
    for edits in invalid:
        try:Settings.parse(dict(lens_edits=edits))
        except ValueError:pass
        else:raise AssertionError(('accepted invalid',edits))
    try:geometry.validate_rows([dict(shape=3,conic=-1,a4=.0002,curvature_radius=30,aperture_diameter=20,thickness=.1,nd=1.6),dict(curvature_radius=0,aperture_diameter=20,thickness=1,nd=1)])
    except ValueError:pass
    else:raise AssertionError('crossing glass accepted')
    # Changing either cylinder axis exchanges the complete physical ray bundle.
    base=dict(iris_mm=3,field_grid=3,ray_focus=False,blades=0)
    sx=Settings.parse(dict(**base,lens_edits=[(0,'shape',1)]));sy=Settings.parse(dict(**base,lens_edits=[(0,'shape',2)]))
    lx,ly=get_lens(sx),get_lens(sy)
    assert abs(lx.efl-ly.efl_y)<1e-9 and abs(lx.efl_y-ly.efl)<1e-9
    assert abs(lx.sensor_z(2)-lx.sensor_z(2,1))>100
    p=np.column_stack((rng.uniform(-5,5,(2048,2)),np.full(2048,-1.)));d=normalize(p-[0,0,-5000.])
    px,dx,vx,ex,_=lx.trace(p,d,sx);py,dy,vy,ey,_=ly.trace(p[:,[1,0,2]],d[:,[1,0,2]],sy)
    assert np.array_equal(vx,vy);assert np.max(np.abs(px-py[:,[1,0,2]]))<1e-10
    assert np.max(np.abs(dx-dy[:,[1,0,2]]))<1e-12;assert np.max(np.abs(ex-ey))<1e-12
    # Asphere affects aberrations, independently of post-image creative knobs.
    sa=Settings.parse(dict(**base,lens_edits=[(0,'shape',3),(0,'conic',-1),(0,'a4',.00000123456789),(0,'a6',-2e-10),(0,'material',2)]))
    la=get_lens(sa);pa,da,va,ea,_=la.trace(p,d,sa)
    spherical=get_lens(Settings(**base,lens_edits=((0,'material',2),)));pb,db,vb,eb,_=spherical.trace(p,d,sa)
    common=va&vb;assert common.any() and np.max(np.abs(da[common]-db[common]))>1e-6
    restored=get_lens(Settings.parse(json.loads(json.dumps(sa.__dict__))));assert restored.prescription.geometry_id==la.prescription.geometry_id
    exported=la.prescription.export()['surfaces'][0];assert exported['type']=='aspheric' and exported['geometry']['a4_mm_minus3']==.00000123456789
    assert exported['medium_after']['material_id']=='SCHOTT N-BK7'
    front=Settings.parse(dict(**base,lens_edits=[(0,'shape',3),(0,'conic',-1),(0,'a4',-.0002)]))
    front_lens=get_lens(front);assert geometry.entry_plane(front_lens)<-3
    fp,fd,fv,fe,paths=front_lens.bundle((0,0),5,front,count=1024,history=True)
    assert np.all(paths[0][:,2]==geometry.entry_plane(front_lens)) and fv.any()
    atlas_results=[]
    for s in (sx,sy,sa,front):
        lens=get_lens(s);cpu=kernel(Settings.parse({**s.__dict__,'ray_backend':'cpu'}),1.6,32,1024)
        auto=kernel(Settings.parse({**s.__dict__,'ray_backend':'vulkan'}),1.6,32,1024)
        assert auto['trace_backend'] in ('cpu','cpu-fallback');assert np.array_equal(cpu.ray_array,auto.ray_array)
        assert np.array_equal(cpu.pupil_array,auto.pupil_array)
        assert np.isfinite(auto.ray_array).all();assert auto is kernel(Settings.parse({**s.__dict__,'ray_backend':'vulkan'}),1.6,32,1024)
        # Finite 2 µm probing rays include a tiny higher-order aspheric term.
        assert abs(focus_plane(2,lens)-lens.sensor_z(2))<1e-5
        data=layout(s);assert data['efl_x_mm']==lens.efl and data['efl_y_mm']==lens.efl_y
        atlas_results.append(dict(shape=s.lens_edits,trace_backend=auto['trace_backend'],efl_x_mm=lens.efl,efl_y_mm=lens.efl_y))
    # Full CUDA composition still receives the physical atlas: stable opaque HDR.
    cuda_result={}
    if cuda.available():
        source=rng.random((32,32,4),dtype=np.float32);source[...,:3]*=2;source[...,3]=1
        cuda.upload(source,token='geometry-stage9')
        image,info=cuda.render(sa.__dict__,32,32,samples=32,taps=32,token='geometry-stage9')
        again,_=cuda.render(sa.__dict__,32,32,samples=32,taps=32,token='geometry-stage9')
        assert np.array_equal(image,again);assert np.isfinite(image).all();assert np.all(image[...,3]==1)
        cuda_result=dict(stable=True,opaque=True,device=info.get('device'))
    report=dict(intersections=intersection_count,sphere_limit_rays=400,normal_finite_difference_max=normal_error,brentq_position_max_mm=residual_error,invalid_inputs=len(invalid)+1,axis_exchange_rays=len(p),atlases=atlas_results,cuda=cuda_result)
    (ROOT/'research/geometry-stage9-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    (ROOT/'tests/fixtures/geometry-stage9.json').write_text(json.dumps(fixture),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
