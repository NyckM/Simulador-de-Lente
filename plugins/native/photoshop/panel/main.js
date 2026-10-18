const ps=require('photoshop'),uxp=require('uxp'),meta=require('./controls.json'),adapter=require('./adapter.js');
const locale=require('./localization.json'),translator=require('./i18n.js').create(locale.catalog,locale.language),t=translator.t;
const fs=uxp.storage.localFileSystem;
const panelTabs=require('./tabs.js');
const state={params:Array(meta.count).fill(0),custom:[],selection:0,sourceID:null,depthID:null};
meta.controls.forEach(c=>state.params[c.index]=c.default);
const byID=Object.fromEntries(meta.controls.map(c=>[c.id,c]));let profileItems=[],sourceItems=[],depthItems=[],busy=false;
const $=id=>document.getElementById(id);
function status(message){$('status').textContent=t(message);}
function dropdown(element,items,index=0){
 element.innerHTML='';const menu=document.createElement('sp-menu');menu.setAttribute('slot','options');
 items.forEach((item,n)=>{const option=document.createElement('sp-menu-item');option.textContent=item.label;if(n===index)option.setAttribute('selected','');menu.appendChild(option);});element.appendChild(menu);element.selectedIndex=index;
}
function value(id){return state.params[byID[id].index];}
function updateControls(){meta.controls.filter(c=>c.id!=='PRESET').forEach(c=>{const e=$(c.id);if(c.type==='boolean')e.checked=!!value(c.id);else if(c.type==='choice')e.selectedIndex=value(c.id);else e.value=String(value(c.id));});}
function resetLens(){
 const selected=value('PRESET'),profile=meta.profiles[selected];
 const ids=['EDIT','INDEX_OFFSET','SPHERICAL5','IMPRESSION_PARAM','APOD_PARAM','RIM_PARAM','CA_RED','CA_BLUE','CA_AXIAL','DISTORTION1','DISTORTION2','HIGHLIGHT_GAIN','EXPOSURE_PARAM','SHIMMER_PARAM'];ids.forEach(id=>state.params[byID[id].index]=0);
 ['CURVATURE','SPACING','DIAMETER','BOKEH_GAIN','BLEND_PARAM','SQUEEZE_PARAM'].forEach(id=>state.params[byID[id].index]=1);
 [['SWIRL_PARAM',profile.swirl],['COMA_PARAM',profile.coma],['SPHERICAL3',profile.spherical],['DISPERSION',profile.dispersion]].forEach(([id,v])=>state.params[byID[id].index]=v);
 const blades=[0,3,4,5,6,7,8,9,10,11,12,14,16,32];state.params[byID.BLADES.index]=Math.max(0,blades.indexOf(profile.blades));state.params[byID.FSTOP.index]=profile.fstop;
 updateControls();status('Parâmetros da lente restaurados. Foco e depth preservados.');
}
function populateProfiles(){
 const term=$('search').value.toLowerCase().trim();profileItems=meta.profiles.map((p,id)=>({label:p.name,key:id})).concat(state.custom.map((p,id)=>({label:t('Meu perfil · ')+p.name,key:'custom:'+id}))).filter(p=>!term||p.label.toLowerCase().includes(term));
 let index=profileItems.findIndex(p=>p.key===state.selection);dropdown($('profile'),profileItems,index>=0?index:-1);
 if(!profileItems.length)status('Nenhuma lente corresponde à busca.');
}
function buildControls(){
 meta.groups.forEach((group,n)=>{
  const section=group.id==='LENS_GROUP'?$('panel-LENS_GROUP'):document.createElement('section');section.className='tabPanel';section.id='panel-'+group.id;section.setAttribute('role','tabpanel');section.hidden=true;
  const title=document.createElement('h4');title.textContent=t(group.label);section.appendChild(title);const body=document.createElement('div');body.className='groupBody';section.appendChild(body);
  meta.controls.filter(c=>c.group===group.id&&c.id!=='PRESET').forEach(c=>{
   const row=document.createElement('div');row.className='field';let input;
   if(c.type==='boolean'){input=document.createElement('sp-checkbox');input.textContent=t(c.label);input.checked=!!c.default;}
   else{
    const label=document.createElement('label');label.textContent=t(c.label);row.appendChild(label);
    if(c.type==='choice'){row.className='field choice';input=document.createElement('sp-dropdown');dropdown(input,c.options.map(label=>({label:t(label)})),c.default);}
    else{input=document.createElement('sp-textfield');input.value=String(c.default);}
   }
   input.id=c.id;input.addEventListener('change',()=>{
    const v=c.type==='boolean'?Number(input.checked):c.type==='choice'?input.selectedIndex:Number(input.value.trim().replace(',','.'));
    if(!Number.isFinite(v)||v<c.min||v>c.max){status(t('Valor inválido: {0}. Use {1} a {2}.').replace('{0}',t(c.label)).replace('{1}',String(c.min)).replace('{2}',String(c.max)));updateControls();return;}state.params[c.index]=v;
   });row.appendChild(input);body.appendChild(row);
  });if(group.id!=='LENS_GROUP')$('controls').appendChild(section);
 });
}
function flatten(layers,prefix=''){let items=[];for(const l of layers){if(l.layers&&l.layers.length)items=items.concat(flatten(l.layers,prefix+l.name+' / '));else items.push({id:l.id,label:prefix+l.name});}return items;}
function refresh(){
 const doc=ps.app.activeDocument;if(!doc){sourceItems=[];depthItems=[{id:null,label:t('Sem depth')}];dropdown($('source'),[]);dropdown($('depth'),depthItems);state.sourceID=state.depthID=null;status('Abra uma imagem no Photoshop.');return;}
 const layers=flatten(doc.layers);sourceItems=layers;depthItems=[{id:null,label:t('Sem depth')},...layers];
 let src=sourceItems.findIndex(l=>l.id===state.sourceID);if(src<0)src=Math.max(0,sourceItems.findIndex(l=>doc.activeLayers.length&&l.id===doc.activeLayers[0].id));
 let dep=depthItems.findIndex(l=>l.id===state.depthID);if(dep<0)dep=0;
 dropdown($('source'),sourceItems,src);dropdown($('depth'),depthItems,dep);state.sourceID=sourceItems[src]?sourceItems[src].id:null;state.depthID=depthItems[dep].id;
}
async function save(){const folder=await fs.getDataFolder(),file=await folder.createFile('profiles.json',{overwrite:true});await file.write(JSON.stringify({version:1,params:state.params,custom:state.custom,selection:state.selection}));}
function validated(params){if(!Array.isArray(params)||![meta.count,meta.count-11,meta.count-34].includes(params.length))return null;const copy=Array(meta.count).fill(0);meta.controls.forEach(c=>copy[c.index]=c.default);params.forEach((v,i)=>copy[i]=v);for(const c of meta.controls){const v=copy[c.index];if(!Number.isFinite(v)||v<c.min||v>c.max||(c.type!=='number'&&!Number.isInteger(v)))return null;}return copy;}
async function load(){try{const folder=await fs.getDataFolder(),file=await folder.getEntry('profiles.json'),saved=JSON.parse(await file.read());const p=validated(saved.params);if(p)state.params=p;state.custom=(saved.custom||[]).filter(c=>typeof c.name==='string'&&validated(c.params)).slice(0,100).map(c=>({...c,params:validated(c.params)}));if(Number.isInteger(saved.selection)&&saved.selection>=0&&saved.selection<meta.profiles.length)state.selection=saved.selection;else if(typeof saved.selection==='string'&&/^custom:\d+$/.test(saved.selection)&&Number(saved.selection.split(':')[1])<state.custom.length)state.selection=saved.selection;}catch(e){}updateControls();populateProfiles();}
async function start(){
 try{await adapter.info();status('Motor conectado.');return;}catch(e){}
 const folder=await fs.getPluginFolder(),exe=await folder.getEntry('engine/BruxosPhotoshopEngine.exe'),error=await uxp.shell.openPath(exe.nativePath);
 if(error)throw Error(error);for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,300));try{await adapter.info();status('Motor conectado.');return;}catch(e){}}
 throw Error('Não foi possível iniciar o motor. Abra engine/BruxosPhotoshopEngine.exe na pasta do plugin e tente novamente.');
}
async function guard(action){if(busy)return;busy=true;$('apply').disabled=true;$('start').disabled=true;try{await action();}catch(e){status(e.message||String(e));}finally{busy=false;$('apply').disabled=false;$('start').disabled=false;}}
buildControls();panelTabs.mount(document,$('tabs'),$('tabViewport'),[{id:'SOURCES',label:t('Entrada')},...meta.groups.map(g=>({id:g.id,label:t({LENS_GROUP:'Lente',FOCUS_GROUP:'Foco',DEPTH_GROUP:'Depth',CREATIVE_GROUP:'Efeitos',SHIMMER_GROUP:'Shimmer',QUALITY_GROUP:'Qualidade'}[g.id]||g.label)}))]);populateProfiles();refresh();load();
$('refresh').addEventListener('click',refresh);
$('search').addEventListener('input',populateProfiles);
$('source').addEventListener('change',()=>{const p=sourceItems[$('source').selectedIndex];state.sourceID=p?p.id:null;});
$('depth').addEventListener('change',()=>{const p=depthItems[$('depth').selectedIndex];state.depthID=p?p.id:null;if(state.depthID){state.params[byID.USE_DEPTH.index]=1;updateControls();}});
$('profile').addEventListener('change',()=>{const p=profileItems[$('profile').selectedIndex];if(!p)return;state.selection=p.key;if(typeof p.key==='number'){state.params[byID.PRESET.index]=p.key;resetLens();}else{state.params=state.custom[Number(p.key.split(':')[1])].params.slice();updateControls();status('Perfil próprio carregado.');}});
$('reset').addEventListener('click',()=>{if(typeof state.selection==='string'){state.params=state.custom[Number(state.selection.split(':')[1])].params.slice();updateControls();status('Configuração salva do perfil restaurada.');}else resetLens();});
$('saveProfile').addEventListener('click',()=>guard(async()=>{const name=$('profileName').value.trim();if(!name)throw Error('Dê um nome ao seu perfil.');const found=state.custom.findIndex(p=>p.name===name);if(found<0){if(state.custom.length>=100)throw Error('Limite de 100 perfis próprios.');state.custom.push({name,params:state.params.slice()});state.selection='custom:'+(state.custom.length-1);}else{state.custom[found]={name,params:state.params.slice()};state.selection='custom:'+found;}$('search').value='';await save();populateProfiles();status('Perfil salvo neste Photoshop.');}));
$('removeProfile').addEventListener('click',()=>guard(async()=>{if(typeof state.selection!=='string')throw Error('Selecione um perfil próprio para excluir.');state.custom.splice(Number(state.selection.split(':')[1]),1);state.selection=value('PRESET');await save();populateProfiles();status('Perfil próprio excluído.');}));
$('start').addEventListener('click',()=>guard(start));
$('quit').addEventListener('click',()=>guard(async()=>{const r=await fetch(adapter.URL+'/api/quit',{method:'POST',headers:adapter.headers});if(!r.ok)throw Error(await r.text());status('Motor encerrado.');}));
$('apply').addEventListener('click',()=>guard(async()=>{
 const params=state.params.slice(),chosen=typeof state.selection==='string'?state.custom[Number(state.selection.split(':')[1])].name:meta.profiles[value('PRESET')].name;
 await adapter.apply(ps,fetch,params,{sourceID:state.sourceID,depthID:state.depthID,useDepth:!!value('USE_DEPTH'),channel:value('CHANNEL'),profileName:chosen,progress:status});await save();status('Desfoque aplicado em uma nova camada. Use a visibilidade da camada para comparar.');
}));
uxp.entrypoints.setup({panels:{desfoque:{show(){refresh();}}}});
