from pathlib import Path
import re,json
base=Path('native/photoshop');panel=base/'panel';presc=Path('native/ae/Prescriptions.generated.h').read_text()
core=Path('native/ofx/RenderConfig.generated.h').read_text();ids=[x.strip() for x in re.search(r'enum Param \{(.*?)\};',core,re.S)[1].split(',') if x.strip()!='NUM_PARAMS'];(base/'RenderConfig.generated.h').write_text(core.replace('enum Param {INPUT,','enum Param {SOURCE_INPUT,'))
text=Path('native/ofx/Params.generated.h').read_text();groups=[];controls=[];names=re.search(r'static const char presetNames\[\]="(.*?)";',presc,re.S)[1].split('|')
for line in text.splitlines():
 m=re.match(r'groupParam\(set,"(.*?)","(.*?)"\);',line)
 if m:groups.append({'id':m[1],'label':m[2]});continue
 m=re.match(r'doubleParam\(set,"(.*?)","(.*?)",([^,]+),([^,]+),([^,]+),"(.*?)"\);',line)
 if m:controls.append(dict(id=m[1],label=m[2],type='number',min=float(m[3]),max=float(m[4]),default=float(m[5]),group=m[6]));continue
 m=re.match(r'intParam\(set,kOfxParamType(Choice|Boolean),"(.*?)","(.*?)",([^,]+),(presetNames|nullptr|".*?"),"(.*?)",',line)
 if m:
  choice=m[1]=='Choice';options=names if m[5]=='presetNames' else (m[5][1:-1].split('|') if choice else [])
  controls.append(dict(id=m[2],label=m[3],type='choice' if choice else 'boolean',min=0,max=len(options)-1 if choice else 1,default=eval(m[4],{'true':1,'false':0}),options=options,group=m[6]))
for c in controls:c['index']=ids.index(c['id'])
surfblock=re.search(r'static const Surface surfaces\[\]=\{(.*?)\n\};',presc,re.S)[1];surfaces=[[float(x) for x in row.split(',')] for row in re.findall(r'\{([^{}]+)\}',surfblock)]
profiles=[];block=re.search(r'static const Prescription prescriptions\[\]=\{(.*?)\n\};',presc,re.S)[1]
for m in re.finditer(r'\{"(.*?)",([^{}]+)\}',block,re.S):
 f=m[2].split(',');A,B,C,D,n=1.,0.,0.,1.,1.
 for radius,thickness,diameter,nd,stop in surfaces[int(f[0]):int(f[0])+int(f[1])]:
  if stop:break
  power=(nd-n)/radius if radius else 0;cc=C-power*A;dd=D-power*B;A+=thickness/nd*cc;B+=thickness/nd*dd;C,D,n=cc,dd,nd
 fstop=max(.7,min(64,abs(float(f[2])*A)/(2*float(f[3]))))
 profiles.append(dict(name=m[1],fstop=fstop,swirl=float(f[4]),coma=float(f[5]),spherical=float(f[6]),dispersion=float(f[7]),blades=int(f[8])))
assert len(controls)==56;assert len(profiles)==295
(panel/'controls.json').write_text(json.dumps({'groups':groups,'controls':controls,'count':len(ids),'profiles':profiles},ensure_ascii=False,indent=2),encoding='utf-8')
rows=['struct Limit{int index;double lo,hi,initial;bool integer;};','static const Limit limits[]={']
for c in controls:rows.append('{%s,%s,%s,%s,%s},'%(c['id'],c['min'],c['max'],c['default'],'false' if c['type']=='number' else 'true'))
rows.append('};');(base/'Limits.generated.h').write_text('\n'.join(rows))
native=Path('native/ofx/NativeEngine.cpp').read_text().replace('HMODULE pluginModule=nullptr;','HMODULE pluginModule=GetModuleHandleW(nullptr);').replace('bruxos_ofx_cuda.dll','bruxos_ps_cuda.dll');native=re.sub(r'BOOL WINAPI DllMain.*?return TRUE;}\n','',native);(base/'NativeEngine.cpp').write_text(native)
print(len(controls),'controls;',len(profiles),'presets;',len(ids),'parameters')
