/* Visible-band materials assigned to the medium after a selected surface. */
(function(root){
 'use strict';
 const fields=['abbe','b1','b2','b3','c1','c2','c3'],materialFields=new Set(['material',...fields]);
 const words={
  'pt-BR':['Material do vidro · meio após a superfície','Prescrição original · material desconhecido','Abbe informado · aproximação Cauchy','SCHOTT N-BK7 · Sellmeier','SCHOTT F2 · Sellmeier','Sellmeier próprio','Aplicar material','nd em 587,6 nm','Abbe Vd','Atribuição manual; não identifica o vidro original da lente. B sem unidade; C em µm². Faixa: 380–780 nm.','Ar / diafragma: selecione um meio de vidro.','Carregando catálogo…','Índices C / d / F','Fonte dos coeficientes','Informe valores válidos.','Material original sem dados espectrais; usa o controle de dispersão criativa.'],
  en:['Glass material · medium after the surface','Original prescription · unknown material','Specified Abbe · Cauchy approximation','SCHOTT N-BK7 · Sellmeier','SCHOTT F2 · Sellmeier','Custom Sellmeier','Apply material','nd at 587.6 nm','Abbe Vd','Manual assignment; does not identify the original lens glass. B is dimensionless; C in µm². Range: 380–780 nm.','Air / stop: select a glass medium.','Loading catalog…','C / d / F indices','Coefficient source','Enter valid values.','Original material lacks spectral data; uses the creative dispersion control.'],
  'zh-CN':['玻璃材料 · 表面之后的介质','原始处方 · 未知材料','指定阿贝数 · 柯西近似','SCHOTT N-BK7 · Sellmeier','SCHOTT F2 · Sellmeier','自定义 Sellmeier','应用材料','587.6 nm 折射率','阿贝数 Vd','手动指定，不能证明原镜头使用此玻璃。B 无单位，C 单位 µm²。范围：380–780 nm。','空气 / 光阑：请选择玻璃介质。','正在加载材料数据…','C / d / F 折射率','系数来源','请输入有效值。','原始材料没有光谱数据，使用创意色散控制。']
 };
 function refractive(surface,wl,dispersion=0){
  const spec=surface.material_spec;
  if(!spec){const nd=surface.nd;if(nd===1||!dispersion)return nd;const b=(nd-1)/45/(1/.4861**2-1/.6563**2);return nd+dispersion*b*(1/wl**2-1/.5876**2);}
  const [model,nd,abbe,b,c]=spec;
  if(model==='abbe')return nd+(nd-1)/abbe/(1/.4861327**2-1/.6562725**2)*(1/wl**2-1/.5876**2);
  const square=wl*wl;return Math.sqrt(1+b.reduce((sum,value,i)=>sum+value*square/(square-c[i]),0));
 }
 class Editor{
  constructor(host,onApply){
   this.host=host;this.onApply=onApply;this.entries=[];host.dataset.i18nSkip='';host.classList.add('material-editor');
   host.innerHTML='<h4></h4><select aria-label="Material"></select><div class="material-fields"></div><p class="material-indices"></p><p class="material-hint"></p><button type="button"></button><a target="_blank" rel="noopener noreferrer"></a><p class="material-status" role="status"></p>';
   this.select=host.querySelector('select');this.inputs={};
   for(const key of ['nd',...fields]){const label=document.createElement('label'),name=document.createElement('span'),input=document.createElement('input');input.type='number';input.step='any';input.dataset.materialField=key;input.addEventListener('input',()=>this.preview());label.append(name,input);host.querySelector('.material-fields').append(label);this.inputs[key]=input;}
   this.select.onchange=()=>this.configure(true);host.querySelector('button').onclick=()=>this.apply();
   new MutationObserver(()=>this.translate()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});this.translate();
   this.ready=fetch('/api/materials').then(r=>{if(!r.ok)throw Error('Material catalog unavailable');return r.json();}).then(data=>{if(data.schema!=='optica-materials/1')throw Error('Material catalog incompatible');this.entries=data.entries;this.configure(false);}).catch(error=>{host.querySelector('.material-status').textContent=error.message;});
  }
  translate(){this.text=words[document.documentElement.lang]||words['pt-BR'];const selected=this.select.value;this.select.replaceChildren();for(let i=0;i<=4;i++)this.select.add(new Option(this.text[i+1],String(i)));this.select.value=selected||'0';this.host.querySelector('h4').textContent=this.text[0];this.select.setAttribute('aria-label',this.text[0]);this.host.querySelector('button').textContent=this.text[6];this.host.querySelector('.material-hint').textContent=this.text[9];this.host.querySelector('a').textContent=this.text[13];for(const [key,input]of Object.entries(this.inputs)){input.previousElementSibling.textContent=key==='nd'?this.text[7]:key==='abbe'?this.text[8]:key.toUpperCase()+(key[0]==='c'?' · µm²':'');}this.configure(false);}
  update(data,index,locked){const surface=data?.surfaces.find(s=>s.index===index);if(!surface)return;const key=JSON.stringify([index,surface.nd,surface.material_spec]);this.surface=surface;this.original=data.base_surfaces?.[index]||surface;this.locked=locked;
   if(this.key!==key){this.key=key;const spec=surface.material_spec;this.select.value=spec?spec[5]==='SCHOTT N-BK7'?'2':spec[5]==='SCHOTT F2'?'3':spec[0]==='abbe'?'1':'4':'0';this.inputs.nd.value=surface.nd;this.inputs.abbe.value=spec?spec[2]:'';for(let i=1;i<=3;i++){this.inputs['b'+i].value=spec?.[3]?.[i-1]??'';this.inputs['c'+i].value=spec?.[4]?.[i-1]??'';}}
   this.configure(false);
  }
  configure(changed){if(!this.text)return;const code=Number(this.select.value),catalog=this.entries.find(e=>e.code===code),blocked=this.locked||!this.surface||this.surface.is_stop||this.original?.nd===1;
   if(changed&&code===0){this.inputs.nd.value=this.surface?.nd??'';}
   if(catalog){this.inputs.nd.value=catalog.nd;this.inputs.abbe.value=catalog.abbe;for(let i=1;i<=3;i++){this.inputs['b'+i].value=catalog.sellmeier.b[i-1];this.inputs['c'+i].value=catalog.sellmeier.c_um2[i-1];}}
   this.select.disabled=blocked;this.host.querySelector('button').disabled=blocked||((code===2||code===3)&&!catalog);
   for(const [key,input]of Object.entries(this.inputs)){const visible=key==='nd'||(key==='abbe'?code>0:code>=2);input.parentElement.hidden=!visible;input.disabled=blocked||!(code===1&&(key==='nd'||key==='abbe')||code===4&&key!=='abbe'&&key!=='nd');}
   const source=this.host.querySelector('a');source.hidden=!catalog;source.href=catalog?.source||'#';this.preview();
   this.host.querySelector('.material-status').textContent=blocked&&this.surface?this.text[10]:((code===2||code===3)&&!catalog)?this.text[11]:'';
  }
  preview(){const code=Number(this.select.value);if(!this.surface)return;let spec;
   if(code===1)spec=['abbe',Number(this.inputs.nd.value),Number(this.inputs.abbe.value),[],[]];
   if(code>=2){const b=[1,2,3].map(i=>Number(this.inputs['b'+i].value)),c=[1,2,3].map(i=>Number(this.inputs['c'+i].value));spec=['sellmeier',0,0,b,c];}
   const target=this.host.querySelector('.material-indices');if(!code){target.textContent=this.text[15];return;}
   const s={nd:this.surface.nd,material_spec:spec},values=[.6562725,.5876,.4861327].map(w=>refractive(s,w));
   target.textContent=values.every(Number.isFinite)?this.text[12]+': '+values.map(x=>x.toFixed(8)).join(' / '):this.text[14];
   if(code===4&&values.every(Number.isFinite)){this.inputs.nd.value=values[1];this.inputs.abbe.value=(values[1]-1)/(values[2]-values[0]);}
  }
  apply(){if(this.host.querySelector('button').disabled)return;const code=Number(this.select.value),values={material:code};
   const keys=code===1?['nd','abbe']:code===4?['b1','b2','b3','c1','c2','c3']:[];
   for(const key of keys){const input=this.inputs[key];if(input.value.trim()===''||!Number.isFinite(Number(input.value))){this.host.querySelector('.material-status').textContent=this.text[14];return;}values[key]=Number(input.value);}
   this.onApply(this.surface.index,values);
  }
 }
 root.GlassMaterials={Editor,index:refractive,fields:materialFields};
})(typeof window==='object'?window:globalThis);
