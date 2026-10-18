/* Optical graph z=vertex+sag(x,y), in mm. Mirrors optics/geometry.py. */
(function(root){
 'use strict';
 const fields=new Set(['shape','conic','a4','a6']);
 function sagGradient(s,x,y){
  const code=s.shape||0,c=s.curvature_radius?1/s.curvature_radius:0,u=code===1?x*x:code===2?y*y:x*x+y*y;
  const k=code===3?(s.conic||0):0,a4=code===3?(s.a4||0):0,a6=code===3?(s.a6||0):0;
  const q=1-(1+k)*c*c*u,r=Math.sqrt(Math.max(q,1e-20)),h=c*u/(1+r)+a4*u*u+a6*u*u*u,g=c/(2*r)+2*a4*u+3*a6*u*u;
  return [h,code===2?0:2*x*g,code===1?0:2*y*g,q>=0];
 }
 function intersect(s,p,d){
  const code=s.shape||0,r=s.curvature_radius;let t;
  if((code===1||code===2)&&r){
   const axis=code,qz=p[0]-s.z-r,a=d[axis]**2+d[0]**2,b=p[axis]*d[axis]+qz*d[0],disc=b*b-a*(p[axis]**2+qz*qz-r*r);
   if(disc<0||a<1e-20)return null;t=(-b-Math.sign(r)*Math.sqrt(disc))/a;
  }else{
   t=(s.z-p[0])/(Math.abs(d[0])>1e-12?d[0]:1e-12);
   for(let i=0;i<32;i++){
    const hit=p.map((v,j)=>v+t*d[j]),[h,gx,gy,valid]=sagGradient(s,hit[1],hit[2]);
    const f=hit[0]-s.z-h,df=d[0]-gx*d[1]-gy*d[2],step=Math.max(-20,Math.min(20,f/(Math.abs(df)>1e-12?df:1e-12)));t-=step;
    if(Math.abs(step)<1e-10||!valid)break;
   }
  }
  if(!Number.isFinite(t)||t< -1e-7)return null;
  const hit=p.map((v,j)=>v+t*d[j]),[h,gx,gy,valid]=sagGradient(s,hit[1],hit[2]);
  if(!valid||Math.abs(hit[0]-s.z-h)>1e-7)return null;
  const len=Math.hypot(1,gx,gy);return {t,normal:[-1/len,gx/len,gy/len]};
 }
 function entryPlane(data){if(!data.surfaces.some(s=>s.shape))return -1;const s=data.surfaces[0],a=s.aperture_diameter/2;let low=0;for(let i=0;i<=256;i++){const h=a*i/256;low=Math.min(low,sagGradient(s,s.shape===2?0:h,s.shape===2?h:0)[0]);}return Math.min(-1,s.z+low-1);}
 const texts={
  'pt-BR':['Geometria da superfície','Esférica / plana original','Cilíndrica · curvatura X','Cilíndrica · curvatura Y','Asférica de revolução','Tipo','Constante cônica k','A4 · mm⁻³','A6 · mm⁻⁵','Aplicar geometria','X/Y indicam o eixo com curvatura; o outro eixo é plano. A4 e A6 usam milímetros. Traçado CPU para estas geometrias; composição GPU disponível. Sensor referenciado em X. Alterações são projetos do usuário, sem calibração medida.'],
  en:['Surface geometry','Original sphere / plane','Cylindrical · X curvature','Cylindrical · Y curvature','Rotational asphere','Type','Conic constant k','A4 · mm⁻³','A6 · mm⁻⁵','Apply geometry','X/Y identify the powered axis; the other axis is flat. A4 and A6 use millimeters. CPU tracing for these geometries; GPU composition remains available. Sensor references X. Edits are user designs, without measured calibration.'],
  'zh-CN':['表面几何','原始球面 / 平面','柱面 · X轴曲率','柱面 · Y轴曲率','旋转非球面','类型','圆锥常数 k','A4 · mm⁻³','A6 · mm⁻⁵','应用几何','X/Y 表示有曲率的轴，另一轴为平面。A4 和 A6 使用毫米。这些几何使用 CPU 光线追踪，仍可使用 GPU 合成。传感器以 X 轴为参考。编辑为用户设计，未经实测校准。']
 };
 class Editor{
  constructor(host,onApply){this.host=host;this.onApply=onApply;host.className='surface-geometry-editor';host.setAttribute('data-i18n-skip','');
   host.innerHTML='<form><h4></h4><label><span></span><select data-geometry="shape"></select></label><div class="geometry-coefficients"></div><output class="geometry-axes"></output><button type="submit"></button><p class="note"></p></form>';
   this.form=host.querySelector('form');this.select=host.querySelector('select');for(let i=0;i<4;i++){const option=document.createElement('option');option.value=i;this.select.append(option);}
   this.inputs={};for(const [field,min,max]of [['conic',-20,5],['a4',-.001,.001],['a6',-.00001,.00001]]){const label=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');input.type='number';input.step='any';input.min=min;input.max=max;input.dataset.geometry=field;label.append(span,input);host.querySelector('.geometry-coefficients').append(label);this.inputs[field]=input;}
   this.select.onchange=()=>this.controls();this.form.onsubmit=e=>{e.preventDefault();if(this.locked||!this.form.reportValidity())return;const shape=Number(this.select.value),values={shape};if(shape===3)for(const [field,input]of Object.entries(this.inputs))values[field]=Number(input.value);onApply(this.index,values);};
   new MutationObserver(()=>this.translate()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});this.translate();
  }
  translate(){const t=texts[document.documentElement.lang]||texts['pt-BR'];this.host.querySelector('h4').textContent=t[0];[...this.select.options].forEach((o,i)=>o.textContent=t[i+1]);this.select.previousElementSibling.textContent=t[5];Object.values(this.inputs).forEach((input,i)=>input.previousElementSibling.textContent=t[i+6]);this.host.querySelector('button').textContent=t[9];this.host.querySelector('p').textContent=t[10];}
  controls(){const asphere=this.select.value==='3';this.host.querySelector('.geometry-coefficients').hidden=!asphere;for(const input of Object.values(this.inputs)){input.disabled=this.locked||!asphere;input.required=asphere;}this.select.disabled=this.locked;this.host.querySelector('button').disabled=this.locked;}
  update(data,index,locked=false){const s=data.surfaces.find(s=>s.index===index);if(!s)return;this.index=index;this.locked=locked||s.is_stop;const key=JSON.stringify([index,...[...fields].map(f=>s[f]||0)]);if(key!==this.key){this.key=key;this.select.value=String(s.shape||0);for(const [f,input]of Object.entries(this.inputs))input.value=s[f]||0;}const out=this.host.querySelector('output');out.textContent=Number.isFinite(data.efl_y_mm)?`EFL X ${data.efl_x_mm.toFixed(2)} · Y ${data.efl_y_mm.toFixed(2)} mm | z X ${data.focus_x_z_mm.toFixed(2)} · Y ${data.focus_y_z_mm.toFixed(2)} mm · CPU`:'';this.controls();}
 }
 const api={fields,sagGradient,intersect,entryPlane,Editor};if(typeof module==='object'&&module.exports)module.exports=api;else root.SurfaceGeometry=api;
})(typeof window==='object'?window:globalThis);
