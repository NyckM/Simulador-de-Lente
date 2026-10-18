"""Import numeric spherical prescriptions, never execute source TypeScript.

Usage: python tools/import_lensvisualizer.py PATH_TO_SOURCE_TREE
Only fixed literal prescriptions supported by this motor are activated.
Source code, descriptions, artwork and analyses are not redistributed.
"""
import sys,re,json,hashlib,collections,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from optics.core import LENS_PROFILES,Lens,Settings,layout,aperture_info

NUM=r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?"
def number(s,key):
 m=re.search(r"(?<![\w])"+re.escape(key)+r"\s*:\s*("+NUM+r")\s*(?:[,}]|$)",s)
 if not m:raise ValueError('campo numérico não literal: '+key)
 return float(m[1])
def string(s,key):
 m=re.search(r"(?<![\w])"+re.escape(key)+r'\s*:\s*"([^"\n]*)"',s)
 return m[1] if m else ''
def parse(path):
 original=path.read_text(encoding='utf-8')
 s=re.sub(r'/\*.*?\*/|//[^\n]*','',original,flags=re.S)
 if not re.search(r'asph\s*:\s*\{\s*\}',s):raise ValueError('superfícies asféricas ou coeficientes não suportados')
 m=re.search(r'surfaces\s*:\s*\[(.*?)\]\s*,',s,re.S)
 if not m:raise ValueError('prescrição dinâmica não suportada')
 blocks=re.findall(r'\{([^{}]*)\}',m[1],re.S)
 if not 3<=len(blocks)<=64:raise ValueError('número de superfícies incompatível')
 if re.sub(r'\{[^{}]*\}|[\s,]','',m[1]):raise ValueError('expressão dinâmica na prescrição')
 rows=[]
 for i,b in enumerate(blocks):
  r=number(b,'R');d=number(b,'d');n=number(b,'nd');sd=number(b,'sd');stop=string(b,'label')=='STO'
  if abs(r)>1e12:r=0.
  if not all(math.isfinite(v) for v in (r,d,n,sd)) or d<0 or not 1<=n<=2.5 or sd<=0 or (r and sd>=abs(r)):raise ValueError('geometria/vidro inválido')
  row=dict(index=i,curvature_radius=r,thickness=d if i<len(blocks)-1 else 0.,nd=n,aperture_diameter=sd*2)
  if stop:
   if r or n!=1:raise ValueError('diafragma não planar em ar')
   row['is_stop']=True
  rows.append(row)
 if sum(bool(r.get('is_stop')) for r in rows)!=1 or rows[-1]['nd']!=1:raise ValueError('diafragma/meio final incompatível')
 focal=number(s,'focalLengthMarketing');fno=number(s,'nominalFno')
 if not 5<=focal<=500 or not .7<=fno<=32:raise ValueError('faixa focal/abertura fora desta versão')
 model='lv_'+re.sub(r'[^a-z0-9]+','_',string(s,'key').lower()).strip('_')
 if model=='lv_':raise ValueError('identificação ausente')
 return model,string(s,'name'),string(s,'maker'),focal,fno,string(s,'patentNumber'),rows,hashlib.sha256(original.encode()).hexdigest()

def main(source):
 source=Path(source).resolve();data=source/'src/lens-data'
 profiles=json.loads((ROOT/'data/lens_profiles.json').read_text(encoding='utf-8'));existing={url.rsplit('/',1)[-1] for p in profiles.values() for url in p.get('sources',[])}
 catalogue=json.loads((ROOT/'data/lens_catalogue.json').read_text(encoding='utf-8'));report=[];accepted=0
 for path in sorted(data.rglob('*.data.ts')):
  rel=path.relative_to(source).as_posix();url='https://github.com/ronbuening/LensVisualizer/blob/main/'+rel
  if path.name in existing:report.append(dict(file=rel,state='existing'));continue
  dest=None;model=None
  try:
   model,name,maker,focal,fno,patent,rows,sha=parse(path)
   if model in profiles:raise ValueError('identificação duplicada')
   dest=ROOT/'data/prescriptions'/f'{model}.json';dest.write_text(json.dumps({f'lens{i}':row for i,row in enumerate(rows)},indent=2)+'\n',encoding='utf-8')
   profile=dict(name=name,group=maker,focal_mm=focal,nominal_f=fno,prescription='prescriptions/'+dest.name,status='reconstrução de patente; estado fixo; abertura modelada; sem calibração comercial',sources=[url],source_sha256=sha,patent=patent,look=dict(blades=0))
   LENS_PROFILES[model]=profile;lens=Lens(model=model)
   if not .5<=lens.max_iris<=80 or not lens.efl>0:raise ValueError('diafragma fora dos limites do app')
   initial=Settings(lens_model=model,iris_mm=lens.max_iris,blades=0,focus_m=5,source_m=5)
   points,energy,throughput=lens.spots((0,0),5,initial,count=2048)
   if len(points)<30 or not np.isfinite(points).all() or not throughput>0:raise ValueError('traçado axial insuficiente')
   aperture=aperture_info(initial)
   if not abs(aperture['f_number']-fno)<fno*.01:raise ValueError('abertura nominal não transmitida pelo stop')
   if abs(lens.efl-focal)>focal*.001:raise ValueError('focal incompatível')
   diagram=layout(initial)
   if not math.isfinite(diagram['sensor_z_mm']):raise ValueError('foco inválido')
   profiles[model]=profile;catalogue.append(dict(model=model,name=name,focal_mm=focal,nominal_f=fno,group=maker,state='experimental'));accepted+=1
   report.append(dict(file=rel,model=model,state='imported',focal_mm=focal,nominal_f=fno,surfaces=len(rows),patent=patent,source_sha256=sha))
  except Exception as exc:
   if model and model not in profiles:LENS_PROFILES.pop(model,None)
   if dest and dest.exists() and model not in profiles:dest.unlink()
   report.append(dict(file=rel,state='unsupported',reason=str(exc)))
 (ROOT/'data/lens_profiles.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'data/lens_catalogue.json').write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'data/LensVisualizer-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(dict(imported=accepted,counts=dict(collections.Counter(r['state'] for r in report)),reasons=dict(collections.Counter(r.get('reason') for r in report if r['state']=='unsupported'))),ensure_ascii=False))
if __name__=='__main__':main(sys.argv[1])

