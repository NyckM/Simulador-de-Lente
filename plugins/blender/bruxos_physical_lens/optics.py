"""Sequential spherical optical model; millimetres, scene at negative z."""
import math
import numpy as np

def rows_from_props(props):
    rows=[dict(radius=s.radius, thickness=s.thickness, diameter=s.diameter, nd=s.nd,
        abbe=s.abbe, stop=s.stop, dx=s.dx, dy=s.dy, tx=s.tx, ty=s.ty) for s in props.surfaces]
    if rows and getattr(props,'focal_mm',0)>0:
        focal=abs(paraxial(rows,1e6)[1]);factor=props.focal_mm/focal
        for row in rows:
            for key in ('radius','thickness','diameter','dx','dy'):row[key]*=factor
    return rows

def aperture_info(rows):
    m=np.eye(2);n=1.
    for s in rows:
        if s['stop']:return abs(float(m[0,0])),s['diameter']/2
        power=(s['nd']-n)/s['radius'] if s['radius'] else 0
        m=np.array([[1,s['thickness']/s['nd']],[0,1]])@np.array([[1,0],[-power,1]])@m;n=s['nd']
    raise ValueError('Prescrição sem diafragma.')

def effective_iris(props,rows):
    mag,limit=aperture_info(rows);efl=abs(paraxial(rows,1e6)[1])
    radius=efl*mag/(2*props.fstop) if getattr(props,'aperture_mode','RADIUS')=='FSTOP' else props.iris
    radius=max(.01,min(radius,limit))
    return radius,efl*mag/(2*radius)


def validate(rows, iris):
    if not 2<=len(rows)<=64:raise ValueError('Use 2–64 superfícies.')
    if abs(rows[-1]['nd']-1)>1e-6:raise ValueError('O meio final precisa ser ar (IOR 1).')
    if not any(s['stop'] for s in rows):raise ValueError('Marque uma superfície como diafragma.')
    for i,s in enumerate(rows):
        if not all(math.isfinite(v) for k,v in s.items() if k!='stop'):raise ValueError('Valor não finito.')
        if not 1<=s['nd']<=2.5 or not 1<=s['abbe']<=150:raise ValueError('IOR/Abbe inválido.')
        if s['thickness']<0 or s['diameter']<=0:raise ValueError('Espessura/diâmetro inválido.')
        if s['radius'] and s['diameter']/2>=abs(s['radius']):raise ValueError(f'Superfície {i+1}: diâmetro excede a esfera.')
        if s['stop'] and iris>s['diameter']/2+1e-6:raise ValueError('Íris excede o diafragma da prescrição.')

def vertices(rows):
    z=[0.]
    for row in rows[:-1]:z.append(z[-1]+row['thickness'])
    return z

def axis(s):
    x,y=math.radians(s['tx']),math.radians(s['ty'])
    return np.array([math.sin(y)*math.cos(x),-math.sin(x),math.cos(y)*math.cos(x)])

def hit(p,d,s,z):
    a=axis(s);v=np.array([s['dx'],s['dy'],z]);r=s['radius']
    if abs(r)<1e-9:
        denom=np.dot(d,a)
        if abs(denom)<1e-10:return None
        t=np.dot(v-p,a)/denom
        if t<-1e-7:return None
        q=p+max(0,t)*d;n=a
    else:
        center=v+a*r;oc=p-center;b=np.dot(oc,d);disc=b*b-np.dot(oc,oc)+r*r
        if disc<0:return None
        roots=[-b-math.sqrt(disc),-b+math.sqrt(disc)];q=None
        for t in sorted(roots):
            candidate=p+max(0,t)*d
            if t>=-1e-7 and np.dot(candidate-center,a)*r<=1e-6:q=candidate;break
        if q is None:return None
        n=(q-center)/abs(r)
    delta=q-v;rad=math.sqrt(max(0,np.dot(delta,delta)-np.dot(delta,a)**2))
    if rad>s['diameter']/2:return None
    return q,n,rad

def forward(rows,p,d,iris):
    medium=1.;d=np.array(d,dtype=float);d/=np.linalg.norm(d);p=np.array(p,dtype=float)
    for s,z in zip(rows,vertices(rows)):
        h=hit(p,d,s,z)
        if h is None:return None
        p,n,rad=h
        if s['stop'] and rad>iris:return None
        if np.dot(n,d)>0:n=-n
        eta=medium/s['nd'];ci=-np.dot(n,d);k=1-eta*eta*(1-ci*ci)
        if k<0:return None
        d=eta*d+(eta*ci-math.sqrt(k))*n;d/=np.linalg.norm(d);medium=s['nd']
    return p,d

def paraxial(rows,focus_m):
    m=np.eye(2);n=1.
    for s in rows:
        power=(s['nd']-n)/s['radius'] if s['radius'] else 0
        m=np.array([[1,s['thickness']/s['nd']],[0,1]])@np.array([[1,0],[-power,1]])@m;n=s['nd']
    a,b,c,d=m.ravel();last=vertices(rows)[-1]
    if abs(c)<1e-9:raise ValueError('Prescrição sem potência óptica.')
    sensor=last-(a+b/(focus_m*1000))/(c+d/(focus_m*1000))
    return float(sensor),float(-1/c)

def focus_sensor(rows,focus_m,iris):
    sensor,efl=paraxial(rows,focus_m);points=[]
    front=rows[0]['diameter']/2
    for k in range(160):
        radius=front*.98*math.sqrt((k+.5)/160);angle=k*math.pi*(3-math.sqrt(5))
        ray=forward(rows,[0,0,-focus_m*1000],[radius*math.cos(angle),radius*math.sin(angle),focus_m*1000],iris)
        if ray is not None:points.append(ray)
    if len(points)>3:
        reference=vertices(rows)[-1]
        slopes=np.array([d[:2]/d[2] for p,d in points]);xy=np.array([p[:2]+d[:2]/d[2]*(reference-p[2]) for p,d in points])
        # Minimize spot variance around its own centroid, including a decentered lens.
        slopes-=slopes.mean(axis=0);xy-=xy.mean(axis=0);denom=float(np.sum(slopes*slopes))
        if denom>1e-10:sensor=float(reference-np.sum(slopes*xy)/denom)
    if sensor<=vertices(rows)[-1]+.01:raise ValueError('Foco não forma imagem atrás da lente.')
    return sensor,efl

def sag(r,radius):
    return (r-math.copysign(math.sqrt(max(0,r*r-radius*radius)),r)) if r else 0.
