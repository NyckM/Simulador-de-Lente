"""Two-reflection sequential lens paths. CPU float64; no sensor ghosts or interference."""
from dataclasses import asdict
import hashlib,json,time
import numpy as np
from .core import normalize,refract,coated_transmission,aperture_coverage,get_lens,focus_calibration
from .aperture import mask_coverage
from .geometry import intersect,entry_plane
from .preview import focus_plane
from .cache import ByteCache

_cache=ByteCache(24*1024*1024,6)
PHYSICAL=('lens_model','lens_edits','focus_m','filmback_mm','ray_focus','iris_mm','sensor_mm','blades','rotation','soften_internal_cutoff','iris_softness','aperture_custom','aperture_mask','aperture_invert','dispersion','coating_strength','coating_nm')

def fresnel(direction,normal,n1,n2,wavelength,settings):
    out,valid,T=refract(direction,normal,n1,n2)
    ci=np.abs(np.sum(direction*normal,axis=1))
    if settings.coating_strength:
        coated=coated_transmission(ci,n1,n2,wavelength,settings.coating_nm)
        T=(1-settings.coating_strength)*T+settings.coating_strength*coated
    # Coating formula does not describe TIR: all incident energy reflects there.
    T=np.where(valid,np.clip(T,0,1),0.)
    return out,valid,T,1-T

def coverage(row,hit,settings):
    r=np.linalg.norm(hit[:,:2],axis=1);a=row['aperture_diameter']/2
    valid=r<=a+1e-9
    energy=aperture_coverage(a-r,a*.025) if settings.soften_internal_cutoff else np.ones(len(hit))
    if row.get('is_stop'):
        a=min(a,settings.iris_mm)
        if settings.blades>=3 and not settings.aperture_custom:
            angle=np.arctan2(hit[:,1],hit[:,0])-np.deg2rad(settings.rotation)
            sector=(angle+np.pi/settings.blades)%(2*np.pi/settings.blades)-np.pi/settings.blades
            a=a*np.cos(np.pi/settings.blades)/np.cos(sector)
        valid &= r<=a+1e-9
        energy*=aperture_coverage(a-r,a*settings.iris_softness)
        if settings.aperture_custom:
            mask=mask_coverage(hit[:,:2],settings);energy*=mask;valid &= mask>1e-8
    return valid,energy

def route(count,pair):
    if pair is None:return [(i,1,False) for i in range(count)]
    j,i=pair
    if not 0<=i<j<count:raise ValueError('A primeira reflexão deve estar depois da segunda.')
    return [(k,1,k==j) for k in range(j+1)]+[(k,-1,k==i) for k in range(j-1,i-1,-1)]+[(k,1,False) for k in range(i+1,count)]

def trace(lens,points,directions,settings,wavelength=.5876,pair=None,history=False):
    """Medium follows travel direction; reflection never changes the medium."""
    p=np.asarray(points,dtype='f8').copy();d=normalize(np.asarray(directions,dtype='f8').copy())
    n_after=[lens.surface_index(row,wavelength,settings.dispersion) for row in lens.surfaces]
    n_before=[1.]+n_after[:-1];valid=np.ones(len(p),dtype=bool);energy=np.ones(len(p));paths=[p.copy()] if history else []
    for k,travel,reflection in route(len(lens.surfaces),pair):
        row=lens.surfaces[k];hit,normal,ok=intersect(row,lens.z[k],p,d)
        admitted,attenuation=coverage(row,hit,settings);valid &= ok&admitted;energy*=attenuation
        n1,n2=(n_before[k],n_after[k]) if travel==1 else (n_after[k],n_before[k])
        outgoing,transmitted,T,R=fresnel(d,normal,n1,n2,wavelength,settings)
        if reflection:
            if row.get('is_stop'):raise ValueError('A íris não é uma interface refletora.')
            d=normalize(d-2*np.sum(d*normal,axis=1)[:,None]*normal);energy*=R
            # Limit this solver to paths that retain their prescribed axial order.
            valid &= d[:,2]*travel < -1e-10
        else:
            d=outgoing;valid &= transmitted & (d[:,2]*travel>1e-10);energy*=T
        p=hit
        if history:paths.append(p.copy())
    valid &= np.isfinite(p).all(axis=1)&np.isfinite(d).all(axis=1)&np.isfinite(energy)&(energy>0)
    return p,d,valid,np.where(valid,energy,0),paths

def candidates(lens,settings,wavelength=.5876):
    after=[lens.surface_index(row,wavelength,settings.dispersion) for row in lens.surfaces];before=[1.]+after[:-1]
    n=np.array([[0.,0.,-1.]]);d=-n
    reflections=[0. if row.get('is_stop') else float(fresnel(d,n,a,b,wavelength,settings)[3][0]) for row,a,b in zip(lens.surfaces,before,after)]
    pairs=[(j,i) for j in range(len(after)) for i in range(j) if not lens.surfaces[j].get('is_stop') and not lens.surfaces[i].get('is_stop') and abs(after[j]-before[j])>1e-10 and abs(after[i]-before[i])>1e-10]
    return sorted(pairs,key=lambda p:(-reflections[p[0]]*reflections[p[1]],p))

def analyze(settings,field=(0.,0.),distance_m=5.,samples=1024,pair_limit=16):
    start=time.perf_counter();field=np.asarray(field,dtype='f8')
    if field.shape!=(2,) or not np.isfinite(field).all() or np.max(abs(field))>settings.sensor_mm/2:raise ValueError('Campo inválido.')
    if isinstance(distance_m,bool) or not isinstance(distance_m,(int,float)) or not np.isfinite(distance_m) or not .001<=distance_m<=1000:raise ValueError('Distância da fonte inválida.')
    if isinstance(samples,bool) or not isinstance(samples,int) or samples not in (1024,4096,16384):raise ValueError('Use 1024, 4096 ou 16384 raios.')
    if isinstance(pair_limit,bool) or not isinstance(pair_limit,int) or pair_limit not in (8,16,32,64):raise ValueError('Use 8, 16, 32 ou 64 pares.')
    values=asdict(settings);physical={k:values[k] for k in PHYSICAL};key=hashlib.sha256(json.dumps([physical,field.tolist(),distance_m,samples,pair_limit],sort_keys=True).encode()).hexdigest()
    cached=_cache.get(key)
    if cached is not None:return {**cached,'profile':dict(cache_hit=True,total_ms=(time.perf_counter()-start)*1000)}
    lens=get_lens(settings);sensor=focus_plane(settings.focus_m,lens)+settings.filmback_mm
    if settings.ray_focus:sensor+=focus_calibration(settings,settings.focus_m)['shift_mm']
    if sensor<=lens.z[-1]:raise ValueError('Sensor precisa estar depois dos vidros.')
    indices=np.arange(samples)+.5;radius=lens.surfaces[0]['aperture_diameter']/2*np.sqrt(indices/samples);angle=indices*np.pi*(3-np.sqrt(5))
    launch=np.column_stack((radius*np.cos(angle),radius*np.sin(angle),np.full(samples,entry_plane(lens))))
    source=np.array([-field[0]*distance_m*1000/lens.efl,-field[1]*distance_m*1000/lens.efl,-distance_m*1000]);directions=normalize(launch-source)
    pairs=candidates(lens,settings);selected=pairs[:pair_limit];families=[];waves=[.6563,.5876,.4861]
    for j,i in selected:
        channels=[];paths=[]
        for channel,wave in enumerate(waves):
            p,d,valid,energy,history=trace(lens,launch,directions,settings,wave,(j,i),True)
            dz=np.where(abs(d[:,2])>1e-12,d[:,2],1.);t=(sensor-p[:,2])/dz;hit=p+t[:,None]*d;valid &= (t>=0)&np.isfinite(hit).all(axis=1)
            keep=np.flatnonzero(valid);xy=hit[valid,:2];weight=energy[valid]/samples
            total=float(weight.sum());inside=(abs(xy[:,0])<=settings.sensor_mm/2)&(abs(xy[:,1])<=settings.sensor_mm/2)
            channels.append(dict(wavelength_um=wave,sample_index=keep.tolist(),xy_mm=xy.tolist(),weight=weight.tolist(),energy_fraction=total,square_sensor_energy_fraction=float(weight[inside].sum()),centroid_mm=np.average(xy,weights=weight,axis=0).tolist() if total>0 else None))
            if channel==1 and len(keep):
                chosen=keep[np.linspace(0,len(keep)-1,min(6,len(keep))).astype(int)]
                paths=[np.vstack(([h[k] for h in history],hit[k])).tolist() for k in chosen]
        families.append(dict(first_surface=j,second_surface=i,channels=channels,paths_xyz_mm=paths,route=[dict(surface=k,direction=travel,reflection=r) for k,travel,r in route(len(lens.surfaces),(j,i))]))
    result=dict(schema='optica-reflected-ghosts/1',ghost_id=key,prescription_id=lens.prescription.geometry_id,backend='cpu-float64',configuration=physical,source=dict(field_mm=field.tolist(),distance_m=distance_m),samples=samples,sensor_z_mm=float(sensor),sensor_mm=settings.sensor_mm,pairs_available=len(pairs),pairs_evaluated=len(selected),pair_selection='largest-normal-incidence-R-products; not a guarantee of brightest visible ghosts',surfaces=[dict(z_mm=float(z),radius_mm=row['curvature_radius'],aperture_mm=row['aperture_diameter']/2,shape=int(row.get('shape',0)),conic=float(row.get('conic',0)),a4=float(row.get('a4',0)),a6=float(row.get('a6',0))) for row,z in zip(lens.surfaces,lens.z)],families=families,units=dict(position='mm',energy='fraction of uniform launch bundle'),limits=['Exactly two interface reflections; no sensor reflection, higher orders, scattering, interference or diffraction.','Idealized existing scalar unpolarized coating energy; no measured coating, polarization transport or complex phase.','Point-source approximation and finite deterministic launch sampling; energy is relative to the launch bundle, not absolute sensor irradiance.','Fixed axial path order rejects grazing rays that turn inside an intermediate traversal.','Pair subset ranked by normal-incidence Fresnel; occlusion can change actual order.'])
    _cache.put(key,result,len(json.dumps(result))*3)
    return {**result,'profile':dict(cache_hit=False,total_ms=(time.perf_counter()-start)*1000)}
