'use strict';
// Reorganize existing controls without cloning IDs or replacing event handlers.
document.addEventListener('DOMContentLoaded',()=>{
 const aside=document.querySelector('.controls'),workspace=document.querySelector('.workspace');
 const nav=document.createElement('nav');nav.className='control-tabs';nav.setAttribute('aria-label','Painéis de ajustes');
 const names=[['lens','Lente'],['focus','Foco'],['depth','Depth'],['effects','Efeitos'],['filters','Filtros'],['layers','Camadas'],['quality','Qualidade'],['project','Projeto']];
 const panels=new Map();
 for(const [id,label]of names){const panel=document.createElement('section');panel.id='panel-'+id;panel.className='control-panel';panel.hidden=id!=='lens';panels.set(id,panel);const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.panel=id;button.classList.toggle('active',id==='lens');button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-pressed',id==='lens'?'true':'false');button.onclick=()=>{for(const [key,p]of panels)p.hidden=key!==id;for(const b of nav.children){const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}aside.scrollTop=0;};nav.append(button);}
 const lens=panels.get('lens'),focus=panels.get('focus'),effects=panels.get('effects'),quality=panels.get('quality'),project=panels.get('project');
 const all=[...aside.children];let capture=false;
 for(const node of all){
  if(node.id==='capture-controls'){focus.append(node);capture=true;continue;}
  if(node.matches('h1,.intro,.divider,.footer-note')){node.remove();continue;}
  if(node.classList.contains('profile-actions')){project.append(node);continue;}
  if(node.tagName==='DETAILS'){
   const text=node.querySelector('summary').textContent;
   if(/Biblioteca/.test(text))lens.append(node);
   else if(/Profundidade/.test(text))panels.get('depth').append(node);
   else if(/Diafragma/.test(text))focus.append(node);
   else if(node.id==='layers-section')panels.get('layers').append(node);
   else if(/Amostragem/.test(text))quality.append(node);
   else if(/Projeto/.test(text))project.append(node);
   else effects.append(node);
   continue;
  }
  if(node.classList.contains('section-heading')){if(node.querySelector('#reset')){focus.append(node);capture=true;}else node.remove();continue;}
  if(node.classList.contains('bokeh-meter'))focus.append(node);
  else (capture?focus:lens).append(node);
 }
 aside.replaceChildren(nav,...panels.values());
 // Keep lens reset beside the preset; profile management gets its own panel.
 const reset=document.getElementById('reset-profile');lens.insertBefore(reset,lens.querySelector('.lens-library'));
 reset.classList.add('profile-reset');
 const title=document.createElement('h1');title.className='panel-title';title.textContent='Perfil de lente';lens.prepend(title);
 for(const [id,label]of names.slice(1)){const h=document.createElement('h2');h.className='panel-title';h.textContent=label;panels.get(id).prepend(h);}
 for(const panel of [focus,panels.get('depth'),effects,quality])for(const detail of panel.querySelectorAll('details'))detail.open=panel===quality||panel===panels.get('depth');
 // Each accordion keeps its own scope: nested controls never close their parent.
 function wrapFunction(node){
  const heading=node.querySelector('h4');if(!heading)return;
  const detail=document.createElement('details'),summary=document.createElement('summary');
  detail.className='menu-accordion';detail.dataset.i18nSkip='';
  summary.textContent=heading.textContent;heading.classList.add('accordion-heading');
  new MutationObserver(()=>{summary.textContent=heading.textContent;}).observe(heading,{childList:true,characterData:true,subtree:true});
  node.before(detail);detail.append(summary,node);return detail;
 }
 for(const node of document.querySelectorAll('#optics-diagnostics > section,#lens-3d > .surface-geometry-editor,#lens-3d > .material-editor'))wrapFunction(node);
 let groupIndex=0;
 const groups=new Map();
 for(const detail of document.querySelectorAll('.control-panel details,#optics-main details,#optics-diagnostics details')){
  const parent=detail.parentElement;
  if(!groups.has(parent))groups.set(parent,[]);
  groups.get(parent).push(detail);detail.classList.add('menu-accordion');
  const marker=detail.querySelector(':scope > summary > span');if(marker?.textContent.trim()==='+')marker.classList.add('accordion-old-marker');
 }
 for(const siblings of groups.values()){
  const name='optica-menu-'+(++groupIndex);let opened=false;
  for(const detail of siblings){
   if(detail.open){if(opened)detail.open=false;opened=true;}
   detail.setAttribute('name',name);
   detail.addEventListener('toggle',()=>{if(detail.open)for(const other of siblings)if(other!==detail)other.open=false;});
  }
 }
 const firstDiagnostic=document.querySelector('#optics-diagnostics > details');if(firstDiagnostic)firstDiagnostic.open=true;
 // Separate preview from output settings, instead of one long button row.
 const render=document.querySelector('.render-bar'),row=render.querySelector('.row'),output=document.createElement('div');output.className='output-toolbar';output.setAttribute('aria-label','Exportação');
 const label=document.createElement('strong');label.textContent='Saída';output.append(label);
 for(const id of ['export-quality','export-size','export']){const el=document.getElementById(id);const prev=el.previousElementSibling;if(prev?.tagName==='LABEL')output.append(prev);output.append(el);}
 render.after(output);document.getElementById('render').textContent='Atualizar prévia';document.getElementById('export').textContent='Exportar PNG';
 const inspection=document.createElement('aside');inspection.className='optical-inspection';inspection.id='optical-inspection';inspection.hidden=true;inspection.setAttribute('aria-labelledby','inspection-title');
 const inspectionHeader=document.createElement('div');inspectionHeader.className='inspection-header';const inspectionTitle=document.createElement('h2');inspectionTitle.id='inspection-title';inspectionTitle.textContent='Inspeção óptica';
 const closeInspection=document.createElement('button');closeInspection.type='button';closeInspection.textContent='Fechar';closeInspection.setAttribute('aria-label','Fechar inspeção óptica');inspectionHeader.append(inspectionTitle,closeInspection);
 const inspectionContent=document.createElement('div');inspectionContent.className='inspection-content';inspectionContent.append(document.querySelector('.analysis-grid'));inspection.append(inspectionHeader,inspectionContent);document.querySelector('main').append(inspection);
 const inspectionToggle=document.createElement('button');inspectionToggle.type='button';inspectionToggle.id='inspection-toggle';inspectionToggle.textContent='Inspeção óptica';inspectionToggle.setAttribute('aria-controls',inspection.id);inspectionToggle.setAttribute('aria-expanded','false');document.querySelector('.workspace-toolbar').append(inspectionToggle);
 function setInspection(open){inspection.hidden=!open;inspectionToggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('inspection-open',open);if(open)closeInspection.focus();else if(inspection.contains(document.activeElement))inspectionToggle.focus();}
 inspectionToggle.onclick=()=>setInspection(inspection.hidden);closeInspection.onclick=()=>setInspection(false);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!inspection.hidden){setInspection(false);e.preventDefault();}});
 const toolbar=document.querySelector('.workspace-toolbar');const imports=toolbar.querySelector('.row');if(imports){imports.classList.add('media-actions');const header=document.querySelector('header');header.insertBefore(imports,header.querySelector('.engine-picker'));}
 const brand=document.querySelector('.brand-icon');if(brand)brand.remove();
 document.body.classList.add('desktop-layout');
 // File operations stay in the project pane and support familiar shortcuts.
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const key=e.key.toLowerCase();const id=key==='o'?'import-image':key==='s'?'save-settings':null;if(id){e.preventDefault();document.getElementById(id).click();}});
 // 1.2.11: Lens Flare (ghosts físicos pela prescrição da lente) como opção principal na aba Efeitos.
 {const flare=document.querySelector('.reflected-ghosts-panel');if(flare){const wrapped=flare.parentElement?.tagName==='DETAILS'?flare.parentElement:null;const detail=wrapped||document.createElement('details');if(!wrapped){const summary=document.createElement('summary');summary.textContent='Lens Flare';detail.append(summary,flare);}detail.classList.add('menu-accordion','lens-flare-section');detail.querySelector(':scope>summary').textContent='Lens Flare · reflexos da lente';const fx=panels.get('effects'),first=fx.querySelector(':scope>details');if(first)detail.setAttribute('name',first.getAttribute('name')||'');detail.open=false;fx.insertBefore(detail,first||null);}}
 document.dispatchEvent(new Event('optica-layout-ready'));
});

// 1.2.13 · Painéis modulares: arrastar abas ou o painel inteiro para as bordas (esquerda, direita, em cima, embaixo),
// juntar com outro painel ou soltar como janela flutuante. Layout salvo no navegador; "Restaurar layout" em Projeto.
document.addEventListener('optica-layout-ready',()=>{
 const main=document.querySelector('main'),workspace=document.querySelector('.workspace'),header=document.querySelector('header'),first=document.querySelector('aside.controls');
 if(!main||!workspace||!first||!header)return;
 const KEY='optica-dock-layout-v1',ZONES=['top','left','right','bottom'],LIMITS={left:[220,720],right:[220,720],top:[150,0.6],bottom:[150,0.6]};
 const setHeader=()=>document.documentElement.style.setProperty('--header-h',header.offsetHeight+'px');setHeader();new ResizeObserver(setHeader).observe(header);
 main.classList.add('dock-host');workspace.classList.add('dock-center');
 const zones={};for(const z of ZONES){const el=document.createElement('div');el.className='dock-zone';el.dataset.zone=z;const r=document.createElement('div');r.className='dock-resizer';r.dataset.zone=z;el.append(r);zones[z]=el;}
 main.prepend(zones.top,zones.left);workspace.after(zones.right,zones.bottom);
 const order=[...first.querySelectorAll(':scope>nav.control-tabs>button[data-panel]')].map(b=>b.dataset.panel);
 const tabs=new Map(order.map(id=>[id,{button:first.querySelector(`nav.control-tabs>button[data-panel="${id}"]`),panel:document.getElementById('panel-'+id)}]));
 const label=id=>tabs.get(id).button.textContent;
 const navOf=d=>d.querySelector(':scope>nav.control-tabs'),tabsOf=d=>[...navOf(d).children].map(b=>b.dataset.panel),docks=()=>[...document.querySelectorAll('aside.dock')];
 function bar(d){const b=document.createElement('div');b.className='dock-bar';b.innerHTML='<span class="dock-grip" title="Arraste para mover o painel">⠿</span><span class="dock-title"></span><button type="button" class="dock-float" title="Soltar como janela / encaixar à esquerda">⧉</button>';d.prepend(b);
  b.querySelector('.dock-grip').addEventListener('pointerdown',e=>startDrag(e,{dock:d}));
  b.querySelector('.dock-float').onclick=()=>{if(d.classList.contains('floating'))place(d,'left');else{const r=d.getBoundingClientRect();place(d,'float',{x:Math.max(20,r.left+40),y:Math.max(70,r.top+40),w:Math.max(300,r.width),h:Math.min(innerHeight*.7,620)});}save();};}
 function makeDock(){const d=document.createElement('aside');d.className='controls dock';const nav=document.createElement('nav');nav.className='control-tabs';nav.setAttribute('aria-label','Painéis de ajustes');d.append(nav);bar(d);return d;}
 first.classList.add('dock');bar(first);
 const nav0=navOf(first);if(first.firstElementChild!==first.querySelector('.dock-bar'))first.prepend(first.querySelector('.dock-bar'));
 function title(d){const t=tabsOf(d);d.querySelector('.dock-title').textContent=t.length===1?label(t[0]):'Painéis';}
 function activate(d,id){if(!tabsOf(d).includes(id))id=tabsOf(d)[0];for(const t of tabsOf(d)){const {button,panel}=tabs.get(t),on=t===id;panel.hidden=!on;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));}d.dataset.active=id||'';}
 function addTab(d,id){const {button,panel}=tabs.get(id);navOf(d).append(button);d.append(panel);}
 function picker(){return document.querySelector('.language-picker');}
 function cleanup(){for(const d of docks()){if(tabsOf(d).length){title(d);activate(d,d.dataset.active);continue;}const p=picker();if(p&&d.contains(p)){const other=docks().find(x=>x!==d&&tabsOf(x).length);if(other)other.insertBefore(p,navOf(other));}d.remove();}
  const p=picker(),firstDock=docks().find(x=>tabsOf(x).length);if(p&&firstDock&&!firstDock.contains(p))firstDock.insertBefore(p,navOf(firstDock));
  for(const z of ZONES)zones[z].classList.toggle('filled',!!zones[z].querySelector('aside.dock'));}
 function applySize(d){const z=d.dataset.zone,s=Number(d.dataset.size);if(!s||z==='float'){d.style.width=d.style.height='';if(z!=='float')return;}if(z==='left'||z==='right'){d.style.width=s+'px';d.style.height='';}else if(z==='top'||z==='bottom'){d.style.height=s+'px';d.style.width='';}}
 function place(d,zone,float){d.classList.remove('floating','dock-h');d.style.left=d.style.top=d.style.width=d.style.height='';
  if(zone==='float'){d.dataset.zone='float';d.classList.add('floating');document.body.append(d);const f=float||{x:120,y:120,w:340,h:Math.min(innerHeight*.7,620)};Object.assign(d.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});}
  else{const existing=zones[zone].querySelector('aside.dock');if(existing&&existing!==d){for(const id of tabsOf(d))addTab(existing,id);activate(existing,d.dataset.active);cleanup();return existing;}d.dataset.zone=zone;zones[zone].append(d);d.classList.toggle('dock-h',zone==='top'||zone==='bottom');applySize(d);}
  cleanup();return d;}
 // Ativação por painel (cada painel mostra sua própria aba ativa)
 function bindTab(id){const {button}=tabs.get(id);button.onclick=e=>{if(suppressClick){suppressClick=false;e.preventDefault();return;}const d=button.closest('aside.dock');if(!d)return;activate(d,id);d.scrollTop=0;save();};button.addEventListener('pointerdown',e=>startDrag(e,{tab:id}));}
 for(const id of tabs.keys())bindTab(id);
 // Painéis ocultos ficam guardados aqui (menu Janela reabre)
 const holder=document.createElement('div');holder.className='dock-holder';holder.hidden=true;document.body.append(holder);
 const visible=id=>!!tabs.get(id)?.button.closest('aside.dock');
 function detach(id){const t=tabs.get(id);if(!t)return;const src=t.button.closest('aside.dock');holder.append(t.button,t.panel);t.panel.hidden=true;if(src&&tabsOf(src).length)activate(src,src.dataset.active===id?tabsOf(src)[0]:src.dataset.active);cleanup();save();}
 function show(id){const t=tabs.get(id);if(!t)return;let d=t.button.closest('aside.dock');if(!d){const z=t.zone||'left';d=zones[z].querySelector('aside.dock');if(d)addTab(d,id);else{d=makeDock();addTab(d,id);if(t.size)d.dataset.size=t.size;place(d,z);}}activate(d,id);if(!d.classList.contains('floating'))d.scrollTop=0;cleanup();save();return d;}
 // Inspeção óptica como painel modular (antes era uma gaveta fixa)
 {const insp=document.getElementById('optical-inspection'),content=insp?.querySelector('.inspection-content');if(insp&&content){insp.id='optical-inspection-old';const panel=document.createElement('section');panel.id='optical-inspection';panel.className='control-panel inspection-panel';const h=document.createElement('h2');h.className='panel-title';h.textContent='Inspeção óptica';panel.append(h,content);const b=document.createElement('button');b.type='button';b.dataset.panel='inspection';b.textContent='Inspeção óptica';b.setAttribute('aria-controls','optical-inspection');tabs.set('inspection',{button:b,panel,zone:'right',size:600});holder.append(b,panel);panel.hidden=true;insp.remove();document.body.classList.remove('inspection-open');bindTab('inspection');
  const toggle=document.getElementById('inspection-toggle');if(toggle)toggle.onclick=()=>{if(visible('inspection'))detach('inspection');else show('inspection');toggle.setAttribute('aria-expanded',String(visible('inspection')));};}}
 // Arrastar
 let drag=null,suppressClick=false;const ghost=document.createElement('div');ghost.className='dock-ghost';ghost.hidden=true;const preview=document.createElement('div');preview.className='dock-preview';preview.hidden=true;document.body.append(ghost,preview);
 function startDrag(e,what){if(e.button!==0||innerWidth<=760)return;drag={...what,x:e.clientX,y:e.clientY,active:false};
  if(what.dock&&what.dock.classList.contains('floating')){const r=what.dock.getBoundingClientRect();drag.offset=[e.clientX-r.left,e.clientY-r.top];}
  addEventListener('pointermove',move);addEventListener('pointerup',up,{once:true});addEventListener('pointercancel',cancel,{once:true});if(what.dock)e.preventDefault();}
 function target(x,y){const r=main.getBoundingClientRect(),edge=Math.min(90,r.width*.12);const el=document.elementFromPoint(x,y),navHit=el?.closest?.('aside.dock>nav.control-tabs,aside.dock>.dock-bar');
  if(navHit){const d=navHit.closest('aside.dock');if(d!==drag.dock&&!(drag.tab&&d===tabs.get(drag.tab).button.closest('aside.dock')&&tabsOf(d).length===1))return {merge:d,rect:navHit.getBoundingClientRect()};}
  if(x<r.left+edge)return {zone:'left',rect:{left:r.left,top:r.top,width:Math.min(330,r.width*.3),height:r.height}};
  if(x>r.right-edge)return {zone:'right',rect:{left:r.right-Math.min(330,r.width*.3),top:r.top,width:Math.min(330,r.width*.3),height:r.height}};
  if(y<r.top+edge)return {zone:'top',rect:{left:r.left,top:r.top,width:r.width,height:Math.min(300,r.height*.35)}};
  if(y>r.bottom-edge)return {zone:'bottom',rect:{left:r.left,top:r.bottom-Math.min(300,r.height*.35),width:r.width,height:Math.min(300,r.height*.35)}};
  return {zone:'float',rect:{left:x-20,top:y-14,width:320,height:Math.min(innerHeight*.6,520)}};}
 function move(e){if(!drag)return;if(!drag.active){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;drag.active=true;document.body.classList.add('dock-dragging');if(drag.tab)tabs.get(drag.tab).button.classList.add('dragging');ghost.textContent=drag.tab?label(drag.tab):'Painel · '+tabsOf(drag.dock).map(label).join(', ');ghost.hidden=false;}
  ghost.style.left=e.clientX+14+'px';ghost.style.top=e.clientY+10+'px';
  if(drag.dock?.classList.contains('floating')){const t=target(e.clientX,e.clientY);if(t.zone==='float'||t.merge===drag.dock){preview.hidden=true;drag.dock.style.left=e.clientX-drag.offset[0]+'px';drag.dock.style.top=Math.max(0,e.clientY-drag.offset[1])+'px';drag.t={zone:'stay'};return;}}
  const t=target(e.clientX,e.clientY);drag.t=t;Object.assign(preview.style,{left:t.rect.left+'px',top:t.rect.top+'px',width:t.rect.width+'px',height:t.rect.height+'px'});preview.hidden=false;}
 function finish(){removeEventListener('pointermove',move);ghost.hidden=true;preview.hidden=true;document.body.classList.remove('dock-dragging');for(const {button}of tabs.values())button.classList.remove('dragging');}
 function cancel(){finish();drag=null;}
 function up(e){const d=drag;finish();drag=null;if(!d?.active)return;suppressClick=!!d.tab;setTimeout(()=>{suppressClick=false;},0);const t=d.t;if(!t||t.zone==='stay'){save();return;}
  if(d.tab){const src=tabs.get(d.tab).button.closest('aside.dock');let dest;
   if(t.merge)dest=t.merge;else if(t.zone==='float'){dest=makeDock();addTab(dest,d.tab);place(dest,'float',{x:t.rect.left,y:t.rect.top,w:t.rect.width,h:t.rect.height});}
   else{dest=zones[t.zone].querySelector('aside.dock');if(!dest){dest=makeDock();addTab(dest,d.tab);place(dest,t.zone);}}
   if(!navOf(dest).contains(tabs.get(d.tab).button))addTab(dest,d.tab);activate(dest,d.tab);if(src&&src!==dest)activate(src,src.dataset.active===d.tab?tabsOf(src)[0]:src.dataset.active);cleanup();}
  else if(t.merge){for(const id of tabsOf(d.dock))addTab(t.merge,id);activate(t.merge,d.dock.dataset.active);cleanup();}
  else place(d.dock,t.zone,t.zone==='float'?{x:t.rect.left,y:t.rect.top,w:Math.max(300,d.dock.offsetWidth||320),h:t.rect.height}:null);
  save();}
 // Redimensionar pelas bordas internas
 for(const z of ZONES){const r=zones[z].querySelector('.dock-resizer');r.addEventListener('pointerdown',e=>{const d=zones[z].querySelector('aside.dock');if(!d)return;e.preventDefault();r.setPointerCapture(e.pointerId);r.classList.add('active');const start=[e.clientX,e.clientY],size=z==='left'||z==='right'?d.offsetWidth:d.offsetHeight;
  const mv=ev=>{const delta=z==='left'?ev.clientX-start[0]:z==='right'?start[0]-ev.clientX:z==='top'?ev.clientY-start[1]:start[1]-ev.clientY;const [lo,hi]=LIMITS[z],max=hi<1?main.clientHeight*hi:hi;d.dataset.size=Math.round(Math.max(lo,Math.min(max,size+delta)));applySize(d);};
  const end=()=>{r.classList.remove('active');r.removeEventListener('pointermove',mv);save();dispatchEvent(new Event('resize'));};r.addEventListener('pointermove',mv);r.addEventListener('pointerup',end,{once:true});r.addEventListener('pointercancel',end,{once:true});});}
 // Persistência
 function save(){try{localStorage.setItem(KEY,JSON.stringify({docks:docks().map(d=>({zone:d.dataset.zone||'left',tabs:tabsOf(d),active:d.dataset.active,size:Number(d.dataset.size)||0,float:d.classList.contains('floating')?{x:d.offsetLeft,y:d.offsetTop,w:d.offsetWidth,h:d.offsetHeight}:null}))}));}catch{}dispatchEvent(new Event('resize'));}
 function restore(layout){const valid=layout&&Array.isArray(layout.docks)?layout.docks.filter(x=>x&&Array.isArray(x.tabs)&&(ZONES.includes(x.zone)||x.zone==='float')):[];
  const used=new Set(),built=[];first.dataset.zone='left';zones.left.append(first);first.dataset.size='';
  valid.forEach((x,i)=>{const ids=x.tabs.filter(id=>tabs.has(id)&&!used.has(id));if(!ids.length)return;ids.forEach(id=>used.add(id));const d=built.length?makeDock():first;for(const id of ids)addTab(d,id);d.dataset.active=x.active;if(x.size)d.dataset.size=x.size;built.push([d,x]);});
  if(!built.length)built.push([first,{zone:'left'}]);
  for(const id of order)if(!used.has(id))addTab(built[0][0],id);
  for(const [d,x]of built){if(d===first&&x.zone==='left'&&!x.float){d.dataset.zone='left';applySize(d);}else place(d,x.zone,x.float);}
  for(const [d]of built)activate(d,d.dataset.active);cleanup();}
 function reset(){try{localStorage.removeItem(KEY);}catch{}for(const d of docks())if(d!==first){for(const id of tabsOf(d))if(order.includes(id))addTab(first,id);}for(const id of order)addTab(first,id);for(const id of tabs.keys())if(!order.includes(id)){const t=tabs.get(id);holder.append(t.button,t.panel);t.panel.hidden=true;}first.dataset.size='';place(first,'left');activate(first,'lens');save();}
 let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 restore(saved);
 setTimeout(()=>{for(const d of docks())d.prepend(d.querySelector(':scope>.dock-bar'));cleanup();},0);
 const project=document.getElementById('panel-project');if(project){const b=document.createElement('button');b.type='button';b.className='dock-reset';b.textContent='Restaurar layout dos painéis';b.onclick=reset;const n=document.createElement('p');n.className='note';n.textContent='Arraste uma aba ou o ⠿ para as bordas da janela (esquerda, direita, em cima, embaixo), solte sobre outro painel para juntar, ou fora das bordas para criar uma janela flutuante.';project.append(b,n);}
 window.OpticaDock={reset,save,show,detach,visible,tabs:()=>[...tabs.keys()].map(id=>({id,label:label(id),visible:visible(id)}))};
 document.dispatchEvent(new Event('optica-dock-ready'));
});

window.OPTICA_WEB_VERSION='1.2.17';
// 1.2.17 · Menu superior (Arquivo, Editar, Efeitos, Exibir, Janela, Ajuda) — atalhos para as ações já existentes.
document.addEventListener('optica-dock-ready',()=>{
 const header=document.querySelector('header');if(!header||document.querySelector('.app-menubar'))return;
 const $=id=>document.getElementById(id),click=id=>()=>{const el=$(id);if(el&&!el.disabled)el.click();},enabled=id=>()=>{const el=$(id);return !!el&&!el.disabled&&!el.hidden;};
 const effect=re=>()=>{const d=OpticaDock.show('effects');const det=[...document.querySelectorAll('#panel-effects details')].find(x=>re.test(x.querySelector(':scope>summary')?.textContent||''));if(det){det.open=true;setTimeout(()=>det.scrollIntoView({block:'start',behavior:'smooth'}),30);}};
 const addFilter=value=>()=>{OpticaDock.show('filters');const sel=$('filter-add-kind');if(!sel)return;sel.value=value;$('filter-add')?.click();};
 const filterItems=()=>{const sel=$('filter-add-kind');return sel?[...sel.options].map(o=>({label:o.textContent,action:addFilter(o.value)})):[];};
 const menus=[
  ['Arquivo',()=>[{label:'Cena de teste',action:click('demo')},{label:'Abrir imagem…',key:'Ctrl+O',action:click('import-image')},{label:'Abrir vídeo…',action:click('import-video')},{label:'Importar depth…',action:click('import-depth')},'-',{label:'Salvar parâmetros',key:'Ctrl+S',action:click('save-settings')},{label:'Carregar parâmetros…',action:click('load-settings')},'-',{label:'Exportar frame PNG',action:click('export'),enabled:enabled('export')},{label:'Exportar vídeo MP4',action:click('export-video'),enabled:enabled('export-video')},{label:'Gravar WebM',action:click('record'),enabled:enabled('record')}]],
  ['Editar',()=>[{label:'Reset do perfil de lente',action:click('reset-profile')},{label:'Reset geral dos ajustes',action:click('reset')},'-',{label:'Restaurar layout dos painéis',action:()=>OpticaDock.reset()}]],
  ['Efeitos',()=>[{label:'Lens Flare',action:effect(/Lens Flare/)},{label:'Starburst',action:()=>{effect(/Lens Flare/)();setTimeout(()=>document.querySelector('.rg-star')?.scrollIntoView({block:'center'}),80);}},{label:'Lens Dirt',action:effect(/Lens Dirt/)},{label:'Shimmer',action:effect(/Shimmer/)},{label:'Gotas',action:effect(/Gotas/)},{label:'Difração, reflexos e coatings',action:effect(/Difração/)},{label:'Distorção geométrica',action:effect(/Distorção/)},{label:'Caráter criativo',action:effect(/Caráter/)},'-',{label:'Adicionar filtro',submenu:filterItems}]],
  ['Exibir',()=>[{label:'Imagem',action:click('view-result')},{label:'Profundidade',action:click('view-depth')},{label:'Selecionar foco na imagem',action:click('pick-depth-focus')},'-',{label:'Aumentar zoom',action:click('zoom-in')},{label:'Reduzir zoom',action:click('zoom-out')},{label:'Enquadrar (100%)',action:click('zoom-reset')},'-',{label:'Atualizar prévia',action:click('render')}]],
  ['Janela',()=>[...OpticaDock.tabs().map(t=>({label:t.label,checked:t.visible,action:()=>t.visible?OpticaDock.detach(t.id):OpticaDock.show(t.id)})),'-',{label:'Restaurar layout dos painéis',action:()=>OpticaDock.reset()}]],
  ['Ajuda',()=>[{label:'Atalhos e painéis',action:()=>help()},{label:'Sobre',action:()=>about()}]]];
 const bar=document.createElement('nav');bar.className='app-menubar';bar.setAttribute('role','menubar');let open=null;
 const pop=document.createElement('div');pop.className='app-menu';pop.setAttribute('role','menu');pop.hidden=true;document.body.append(pop);
 const sub=document.createElement('div');sub.className='app-menu app-submenu';sub.setAttribute('role','menu');sub.hidden=true;document.body.append(sub);
 function fill(box,items,anchor,side){box.replaceChildren();for(const it of items){if(it==='-'){const hr=document.createElement('div');hr.className='app-menu-sep';box.append(hr);continue;}
   const b=document.createElement('button');b.type='button';b.className='app-menu-item';b.setAttribute('role',it.checked===undefined?'menuitem':'menuitemcheckbox');if(it.checked!==undefined)b.setAttribute('aria-checked',String(it.checked));
   b.innerHTML='<span class="app-menu-check"></span><span class="app-menu-label"></span><span class="app-menu-key"></span>';b.querySelector('.app-menu-check').textContent=it.checked?'✓':'';b.querySelector('.app-menu-label').textContent=it.label;b.querySelector('.app-menu-key').textContent=it.submenu?'▸':(it.key||'');
   if(it.enabled&&!it.enabled())b.disabled=true;
   if(it.submenu){b.onmouseenter=b.onfocus=()=>{fill(sub,it.submenu(),b,'right');};b.onclick=()=>fill(sub,it.submenu(),b,'right');}else{b.onmouseenter=()=>{if(box===pop)sub.hidden=true;};b.onclick=()=>{close();it.action?.();};}
   box.append(b);}
  const r=anchor.getBoundingClientRect();box.hidden=false;const w=box.offsetWidth,h=box.offsetHeight;
  let x=side==='right'?r.right-2:r.left,y=side==='right'?r.top-4:r.bottom+2;if(x+w>innerWidth-6)x=side==='right'?r.left-w+2:innerWidth-w-6;if(y+h>innerHeight-6)y=Math.max(6,innerHeight-h-6);box.style.left=x+'px';box.style.top=y+'px';}
 function openMenu(btn,i){open=i;for(const b of bar.children)b.classList.toggle('active',b===btn);sub.hidden=true;fill(pop,menus[i][1](),btn,'down');pop.querySelector('.app-menu-item:not(:disabled)')?.focus({preventScroll:true});}
 function close(){open=null;pop.hidden=sub.hidden=true;for(const b of bar.children)b.classList.remove('active');}
 menus.forEach(([name],i)=>{const b=document.createElement('button');b.type='button';b.className='app-menubar-item';b.textContent=name;b.setAttribute('role','menuitem');b.setAttribute('aria-haspopup','true');
  b.onclick=()=>open===i?close():openMenu(b,i);b.onmouseenter=()=>{if(open!==null&&open!==i)openMenu(b,i);};bar.append(b);});
 const brand=header.querySelector('.brand');if(brand)brand.after(bar);else header.prepend(bar);
 document.addEventListener('pointerdown',e=>{if(open!==null&&!pop.contains(e.target)&&!sub.contains(e.target)&&!bar.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(open===null)return;if(e.key==='Escape'){close();e.preventDefault();return;}const items=[...(sub.hidden?pop:sub).querySelectorAll('.app-menu-item:not(:disabled)')],i=items.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){items[(i+1)%items.length]?.focus();e.preventDefault();}else if(e.key==='ArrowUp'){items[(i-1+items.length)%items.length]?.focus();e.preventDefault();}
  else if(e.key==='ArrowRight'){if(sub.hidden)openMenu(bar.children[(open+1)%menus.length],(open+1)%menus.length);e.preventDefault();}else if(e.key==='ArrowLeft'){if(!sub.hidden){sub.hidden=true;pop.querySelector('.app-menu-item')?.focus();}else openMenu(bar.children[(open-1+menus.length)%menus.length],(open-1+menus.length)%menus.length);e.preventDefault();}});
 addEventListener('resize',close);
 function dialog(title,html){const d=document.createElement('dialog');d.className='app-dialog';d.innerHTML=`<h3></h3><div class="app-dialog-body"></div><div class="row"><button type="button">Fechar</button></div>`;d.querySelector('h3').textContent=title;d.querySelector('.app-dialog-body').innerHTML=html;d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();}
 function help(){dialog('Atalhos e painéis','<p><b>Ctrl+O</b> abrir imagem · <b>Ctrl+S</b> salvar parâmetros · <b>Esc</b> cancela gestos e fecha menus.</p><p>Arraste uma aba ou o ⠿ de um painel para as bordas da janela (esquerda, direita, em cima, embaixo), solte sobre outro painel para juntar, ou fora das bordas para criar uma janela flutuante. ⧉ solta ou encaixa. As bordas internas redimensionam.</p><p>Menu <b>Janela</b> liga e desliga cada painel, inclusive a Inspeção óptica. <b>Editar → Restaurar layout</b> volta ao original.</p>');}
 function about(){const v='Versão '+(window.OPTICA_WEB_VERSION||'')+' · Windows x64';dialog('Simulador de Desfoque da Bruxosdovfx',`<p>${v.replace(/</g,'&lt;')}</p><p>Desfoque por traçado de raios na prescrição da lente, profundidade, flare e starburst físicos, filtros e sujeira de lente.</p>`);}
});
