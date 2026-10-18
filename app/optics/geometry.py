"""Centered cylindrical and even-aspheric surfaces, all lengths in mm.

shape: 0 legacy sphere/plane, 1 powered X cylinder, 2 powered Y cylinder,
3 rotational even asphere. Cylinders have zero curvature in the other axis.
"""
import numpy as np

FIELDS={'shape','conic','a4','a6'}
NAMES={1:'cylindrical_x',2:'cylindrical_y',3:'aspheric'}

def spec(row):
    code=int(row.get('shape',0))
    return (code,float(row.get('conic',0)),float(row.get('a4',0)),float(row.get('a6',0))) if code else ()

def sag_gradient(row,x,y):
    x,y=np.broadcast_arrays(np.asarray(x,dtype=float),np.asarray(y,dtype=float))
    code,k,a4,a6=spec(row) or (0,0.,0.,0.)
    u=x*x if code==1 else y*y if code==2 else x*x+y*y
    r=row['curvature_radius'];c=1/r if r else 0.
    if code!=3:k=a4=a6=0.
    q=1-(1+k)*c*c*u;root=np.sqrt(np.maximum(q,1e-20))
    h=c*u/(1+root)+a4*u*u+a6*u*u*u
    derivative=c/(2*root)+2*a4*u+3*a6*u*u
    gx=np.zeros_like(x) if code==2 else 2*x*derivative
    gy=np.zeros_like(y) if code==1 else 2*y*derivative
    return h,gx,gy,q>=0

def intersect(row,z,p,d):
    """Cylinder analytic root; asphere Newton with residual/domain rejection.

    Only converged frontward intersections on the intended sag branch survive.
    Invalid rays receive finite coordinates, then are rejected by the caller.
    """
    code=int(row.get('shape',0));r=row['curvature_radius']
    if code in (1,2) and r:
        axis=code-1;qz=p[:,2]-z-r
        a=d[:,axis]**2+d[:,2]**2;b=p[:,axis]*d[:,axis]+qz*d[:,2]
        disc=b*b-a*(p[:,axis]**2+qz*qz-r*r)
        t=(-b-np.sign(r)*np.sqrt(np.maximum(disc,0)))/np.maximum(a,1e-20)
        hit=p+t[:,None]*d
        normal=np.zeros_like(hit);normal[:,axis]=hit[:,axis];normal[:,2]=hit[:,2]-z-r
        normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-20)
        sag,_,_,domain=sag_gradient(row,hit[:,0],hit[:,1])
        return hit,normal,(disc>=0)&(t>=-1e-7)&domain&(np.abs(hit[:,2]-z-sag)<1e-7)
    # Seed on the vertex plane. Bound the update and reject non-convergence;
    # no unconverged ray may contribute energy to a PSF.
    dz=np.where(np.abs(d[:,2])>1e-12,d[:,2],1e-12)
    t=(z-p[:,2])/dz
    for _ in range(32):
        hit=p+t[:,None]*d;h,gx,gy,domain=sag_gradient(row,hit[:,0],hit[:,1])
        residual=hit[:,2]-z-h;derivative=d[:,2]-gx*d[:,0]-gy*d[:,1]
        safe=np.where(np.abs(derivative)>1e-12,derivative,1e-12)
        step=np.clip(residual/safe,-20,20);t-=step
        if np.all((np.abs(step)<1e-10)|~domain):break
    hit=p+t[:,None]*d;h,gx,gy,domain=sag_gradient(row,hit[:,0],hit[:,1])
    normal=np.column_stack((gx,gy,-np.ones(len(p))))
    normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-20)
    valid=domain & np.isfinite(t)&(t>=-1e-7)&(np.abs(hit[:,2]-z-h)<1e-7)
    return np.nan_to_num(hit),np.nan_to_num(normal),valid

def validate_value(field,value):
    limits={'shape':(0,3),'conic':(-20,5),'a4':(-.001,.001),'a6':(-.00001,.00001)}
    lo,hi=limits[field]
    if not lo<=value<=hi or (field=='shape' and int(value)!=value):
        raise ValueError('Geometria: valor fora dos limites para '+field)

def validate_rows(rows):
    if any(int(row.get('shape',0))!=3 and any(row.get(f,0) for f in ('conic','a4','a6')) for row in rows):
        raise ValueError('Coeficientes asféricos exigem o tipo asférico.')
    if not any(spec(row) for row in rows):return
    for row in rows:
        code=int(row.get('shape',0))
        if not code:continue
        h=np.linspace(0,row['aperture_diameter']/2,257)
        sag,gx,gy,valid=sag_gradient(row,h if code!=2 else 0,h if code==2 else 0)
        if not valid.all() or not np.isfinite(sag).all() or np.max(np.hypot(gx,gy))>2:
            raise ValueError('Superfície fora do domínio ou com inclinação excessiva na abertura.')
    # Sample the shared glass aperture in both meridians and diagonal. Reject
    # crossing interfaces; this is bounded validation, not manufacturing proof.
    for i,(a,b) in enumerate(zip(rows,rows[1:])):
        if a.get('is_stop') or b.get('is_stop') or a['nd']<=1:continue
        h=np.linspace(0,min(a['aperture_diameter'],b['aperture_diameter'])/2,257)
        for angle in (0,np.pi/4,np.pi/2):
            x,y=h*np.cos(angle),h*np.sin(angle)
            sa=sag_gradient(a,x,y)[0];sb=sag_gradient(b,x,y)[0]
            if np.min(a['thickness']+sb-sa)<=.001:
                raise ValueError(f'As superfícies {i+1} e {i+2} se cruzam dentro do vidro.')

def curvature(row,axis):
    code=int(row.get('shape',0));r=row['curvature_radius']
    return 0. if not r or (code==1 and axis==1) or (code==2 and axis==0) else 1/r

def entry_plane(lens):
    if not any(s.get('shape',0) for s in lens.surfaces):return -1.
    row=lens.surfaces[0];h=np.linspace(0,row['aperture_diameter']/2,257)
    sag=sag_gradient(row,0 if row.get('shape')==2 else h,h if row.get('shape')==2 else 0)[0]
    return min(-1.,float(lens.z[0]+np.min(sag)-1))
