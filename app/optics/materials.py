"""Explicit per-medium visible dispersion; no material is inferred from nd.

Immutable JSON-safe spec: model, nd, Vd, B, C, material id, source.
Sellmeier uses wavelength in micrometres and C in square micrometres.
"""
import numpy as np
D,F,C=.5876,.4861327,.6562725
SOURCE='https://www.schott.com/en-gb/products/optical-glass/-/media/Project/OnEx/Products/O/optical-glass/Downloads/schott-optical-glass-collection-datasheets-english-may2019.pdf?rev=5358bb64e13a44f2b37f5065490509af'
CATALOG={2:('SCHOTT N-BK7',(1.03961212,.231792344,1.01046945),(.00600069867,.0200179144,103.560653)),
         3:('SCHOTT F2',(1.34533359,.209073176,.937357162),(.00997743871,.0470450767,111.886764))}
FIELDS={'material','abbe','b1','b2','b3','c1','c2','c3'}

def sellmeier(wavelength,b,c):
    square=np.asarray(wavelength,dtype=float)**2;value=np.ones_like(square)
    for strength,pole in zip(b,c):value=value+strength*square/(square-pole)
    return np.sqrt(value)

def resolve(row):
    code=int(row.get('material',0))
    if code==0:return ()
    if code==1:
        abbe=row.get('abbe')
        if abbe is None or not 5<=abbe<=100:raise ValueError('Informe Abbe entre 5 e 100.')
        if not 1<row['nd']<=2:raise ValueError('O meio dispersivo precisa de nd maior que 1 e até 2.')
        return ('abbe',float(row['nd']),float(abbe),(),(),'custom-abbe','user')
    if code in CATALOG:name,b,c=CATALOG[code];source=SOURCE
    else:
        if not all(key in row for key in ('b1','b2','b3','c1','c2','c3')):raise ValueError('Informe os seis coeficientes de Sellmeier.')
        name='custom-sellmeier';source='user';b=tuple(row[f'b{i}'] for i in (1,2,3));c=tuple(row[f'c{i}'] for i in (1,2,3))
    if any(.38**2<=pole<=.78**2 for pole in c):raise ValueError('Sellmeier tem um polo na faixa visível (380–780 nm).')
    with np.errstate(invalid='ignore',divide='ignore'):indices=sellmeier(np.linspace(.38,.78,401),b,c)
    if not np.isfinite(indices).all() or np.any((indices<=1)|(indices>2)):raise ValueError('Sellmeier deve produzir índices entre 1 e 2 em 380–780 nm.')
    nd=float(sellmeier(D,b,c));spread=float(sellmeier(F,b,c)-sellmeier(C,b,c))
    if spread<=0:raise ValueError('Sellmeier precisa de dispersão normal nesta etapa.')
    return ('sellmeier',nd,(nd-1)/spread,tuple(b),tuple(c),name,source)

def index(spec,wavelength):
    wavelength=np.asarray(wavelength,dtype=float)
    if not np.isfinite(wavelength).all() or np.any((wavelength<.38)|(wavelength>.78)):raise ValueError('Materiais: comprimento de onda fora de 380–780 nm.')
    model,nd,abbe,b,c,_,_=spec
    if model=='sellmeier':return sellmeier(wavelength,b,c)
    strength=(nd-1)/abbe/(1/F**2-1/C**2)
    return nd+strength*(1/wavelength**2-1/D**2)

def medium(spec):
    model,nd,abbe,b,c,identity,source=spec
    return dict(nd=nd,material_id=identity,abbe=abbe,dispersion_model=model,
                sellmeier=dict(b=list(b),c_um2=list(c)) if b else None,
                wavelength_range_um=[.38,.78],assignment='user',source=source)

def validate_value(field,value):
    if field=='material' and (value!=int(value) or not 0<=value<=4):raise ValueError('Modelo de material inválido.')
    if field=='abbe' and not 5<=value<=100:raise ValueError('Abbe fora de 5–100.')
    if field in ('b1','b2','b3') and not -100<=value<=100:raise ValueError('Coeficiente B fora de -100–100.')
    if field in ('c1','c2','c3') and not 0<=value<=10000:raise ValueError('Coeficiente C fora de 0–10000 µm².')

def catalog():
    return dict(schema='optica-materials/1',wavelength_unit='um',c_unit='um2',
                entries=[dict(code=code,**medium(resolve(dict(material=code)))) for code in CATALOG])
