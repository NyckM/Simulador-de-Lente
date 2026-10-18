/* Actual 3D surface meshes and vector Snell rays, using the displayed prescription.
 * Event-driven Canvas renderer: no animation loop or additional GPU context competes
 * with the image renderer. Coordinates are [optical z, transverse x, transverse y].
 */
(function(root){
 'use strict';
 const sag=(r,h)=>r?r-Math.sign(r)*Math.sqrt(Math.max(0,r*r-h*h)):0;
 const surfaceSag=(s,x,y)=>s.shape?root.SurfaceGeometry.sagGradient(s,x,y)[0]:sag(s.curvature_radius,Math.hypot(x,y));
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
 const add=(a,b,k=1)=>a.map((x,i)=>x+k*b[i]);
 const unit=a=>a.map(x=>x/Math.hypot(...a));
 function trace(data,iris,wavelength=.5876,customSeeds=null){
  const rays=[],source=data.settings.source_m*1000;
  const end=Math.max(data.sensor_z_mm,data.source_focus_z_mm||0,data.focus_y_z_mm||0)+8;
  const radius=Math.min(12,data.surfaces[0].aperture_diameter*.49);
  const entry=root.SurfaceGeometry?root.SurfaceGeometry.entryPlane(data):-1,seeds=customSeeds||[[0,0]];
  if(!customSeeds)for(let ring=1;ring<=5;ring++)for(let i=0;i<16;i++){const a=2*Math.PI*i/16;seeds.push([radius*ring/5*Math.cos(a),radius*ring/5*Math.sin(a)]);}
  for(const [x,y]of seeds){
   let p=[entry,x,y],d=unit([source+entry,x,y]),n1=1,passed=true;const path=[p];
   for(const s of data.surfaces){
    let t,n;const r=s.curvature_radius;
    if(s.shape){const result=root.SurfaceGeometry.intersect(s,p,d);if(!result){passed=false;break;}t=result.t;n=result.normal;}
    else if(!r){t=(s.z-p[0])/d[0];n=[-1,0,0];}
    else{const q=add(p,[s.z+r,0,0],-1),b=dot(q,d),disc=b*b-dot(q,q)+r*r;if(disc<0){passed=false;break;}t=-b-Math.sign(r)*Math.sqrt(disc);n=unit(add(add(p,d,t),[s.z+r,0,0],-1));}
    if(!Number.isFinite(t)||t< -1e-7){passed=false;break;}
    p=add(p,d,t);path.push(p);let aperture=s.aperture_diameter/2;
    if(s.is_stop){aperture=Math.min(aperture,iris);const blades=data.settings.blades;
     if(blades>=3){const beta=Math.PI/blades,a=Math.atan2(p[2],p[1])-(data.settings.rotation||0)*Math.PI/180,sector=((a+beta)%(2*beta)+2*beta)%(2*beta)-beta;aperture*=Math.cos(beta)/Math.cos(sector);}}
    if(Math.hypot(p[1],p[2])>aperture+1e-9){passed=false;break;}
    if(dot(d,n)>0)n=n.map(v=>-v);
    const n2=root.GlassMaterials?root.GlassMaterials.index(s,wavelength,data.settings.dispersion||0):s.nd;
    const ci=-dot(d,n),eta=n1/n2,k=1-eta*eta*(1-ci*ci);
    if(k<0){passed=false;break;}
    d=unit(add(d.map(v=>v*eta),n,eta*ci-Math.sqrt(k)));n1=n2;
   }
   if(passed&&d[0]>1e-9)path.push(add(p,d,(end-p[0])/d[0]));
   rays.push({path,passed,wavelength});
  }
  return rays;
 }
 function mesh(data){
  const faces=[],rings=10,sectors=40;
  for(const s of data.surfaces){if(s.is_stop)continue;
   const a=s.aperture_diameter/2,point=(i,j)=>{const h=a*i/rings,t=2*Math.PI*j/sectors,x=h*Math.cos(t),y=h*Math.sin(t);return [s.z+surfaceSag(s,x,y),x,y];};
   for(let i=0;i<rings;i++)for(let j=0;j<sectors;j++){
    const vertices=[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)];
    faces.push({vertices,index:s.index,side:false});
   }
  }
  for(let i=0;i<data.surfaces.length-1;i++){
   const a=data.surfaces[i],b=data.surfaces[i+1];if(a.is_stop||a.nd<=1.00001)continue;
   const point=(s,j)=>{const r=s.aperture_diameter/2,t=2*Math.PI*j/sectors,x=r*Math.cos(t),y=r*Math.sin(t);return [s.z+surfaceSag(s,x,y),x,y];};
   for(let j=0;j<sectors;j++)faces.push({vertices:[point(a,j),point(b,j),point(b,j+1),point(a,j+1)],index:a.index,side:true});
  }
  return faces;
 }
 const labels={
  'pt-BR':['Vidros e raios em 3D','Arraste para girar · Shift + arraste para mover · roda para zoom · clique para selecionar','Perspectiva','Lateral','Frontal','Enquadrar','Corte','Raios','Bloqueados','Ampliar','Vista 3D da geometria óptica atual. Ajuste o vidro selecionado nos campos abaixo.','Superfície','Sensor','Íris'],
  en:['Glass and rays in 3D','Drag to orbit · Shift + drag to pan · wheel to zoom · click to select','Perspective','Side','Front','Fit','Cutaway','Rays','Blocked','Expand','3D view of the current optical geometry. Edit the selected surface in the fields below.','Surface','Sensor','Iris'],
  'zh-CN':['三维镜片与光线','拖动旋转 · Shift + 拖动平移 · 滚轮缩放 · 点击选择','透视','侧视','正视','适应视图','剖切','光线','被阻挡的光线','放大','当前光学几何的三维视图。在下方编辑所选表面。','表面','传感器','光圈']
 };
 const editorLabels={
  'pt-BR':['Recolher','Superfície selecionada','Anterior','Próxima','Curvatura · mm','Espessura seguinte · mm','Diâmetro · mm','Índice nd','Aplicar ao traçado'],
  en:['Collapse','Selected surface','Previous','Next','Curvature · mm','Following thickness · mm','Diameter · mm','Index nd','Apply to ray tracing'],
  'zh-CN':['收起','所选表面','上一个','下一个','曲率 · mm','下一段厚度 · mm','直径 · mm','折射率 nd','应用到光线追踪']
 };
 class Viewer{
  constructor(host,onSelect,onEdit,onMaterial,onGeometry){
   this.host=host;this.onSelect=onSelect;this.onEdit=onEdit;this.yaw=-.42;this.pitch=.24;this.zoom=1;this.pan=[0,0];this.selected=0;this.cut=false;this.showRays=true;this.blocked=false;
   host.setAttribute('data-i18n-skip','');this.anchor=document.createComment('lens-3d-home');host.before(this.anchor);
   host.innerHTML='<div class="lens3d-title"></div><div class="lens3d-tools"></div><canvas tabindex="0" aria-roledescription="3D lens viewer"></canvas><p class="lens3d-help"></p><form class="lens3d-editor"><div class="lens3d-selection"><button type="button" data-step="-1"></button><span role="status"></span><button type="button" data-step="1"></button></div><div class="lens3d-fields"></div><button type="submit" class="lens3d-apply"></button></form><p class="lens3d-note"></p>';
   this.form=host.querySelector('form');this.inputs=[];
   for(const [i,field]of ['curvature_radius','thickness','aperture_diameter','nd'].entries()){const label=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');input.type='number';input.step='any';input.dataset.field=field;label.append(span,input);this.form.querySelector('.lens3d-fields').append(label);this.inputs.push(input);}
   for(const button of this.form.querySelectorAll('[data-step]'))button.onclick=()=>{const surfaces=this.data?.surfaces.filter(s=>!s.is_stop)||[],at=surfaces.findIndex(s=>s.index===this.selected),next=surfaces[at+Number(button.dataset.step)];if(next)this.onSelect(next.index);};
   this.form.onsubmit=e=>{e.preventDefault();if(this.form.reportValidity()&&this.onEdit)this.onEdit(this.selected,Object.fromEntries(this.inputs.filter(i=>!i.disabled).map(i=>[i.dataset.field,Number(i.value)])));};
   this.status=document.createElement('p');this.status.className='lens3d-edit-status';this.status.setAttribute('role','status');this.form.append(this.status);
   this.origin=document.createElement('p');this.origin.className='lens3d-origin';this.status.after(this.origin);
   if(root.GlassMaterials&&onMaterial){const materialHost=document.createElement('section');this.form.after(materialHost);this.materialEditor=new root.GlassMaterials.Editor(materialHost,onMaterial);}
   if(root.SurfaceGeometry&&onGeometry){const geometryHost=document.createElement('section');this.form.after(geometryHost);this.geometryEditor=new root.SurfaceGeometry.Editor(geometryHost,onGeometry);}
   this.canvas=host.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
   this.buttons=[];const tools=host.querySelector('.lens3d-tools');
   const button=(label,action,toggle=false)=>{const b=document.createElement('button');b.type='button';b.dataset.label=label;b.onclick=()=>{action();if(toggle)b.setAttribute('aria-pressed',String(this[label===6?'cut':label===7?'showRays':'blocked']));this.schedule();};if(toggle)b.setAttribute('aria-pressed',String(label===7));tools.append(b);this.buttons.push(b);return b;};
   button(2,()=>this.reset(-.42,.24));button(3,()=>this.reset(0,0));button(4,()=>this.reset(Math.PI/2,0));button(5,()=>{this.zoom=1;this.pan=[0,0];});
   button(6,()=>this.cut=!this.cut,true);button(7,()=>this.showRays=!this.showRays,true);button(8,()=>this.blocked=!this.blocked,true);
   const xz=document.createElement('button'),yz=document.createElement('button');xz.type=yz.type='button';xz.textContent='XZ';yz.textContent='YZ';xz.onclick=()=>{this.reset(0,Math.PI/2);this.schedule();};yz.onclick=()=>{this.reset(0,0);this.schedule();};tools.append(xz,yz);
   const expand=button(9,()=>this.expand(!host.classList.contains('expanded')));expand.setAttribute('aria-expanded','false');
   const c=this.canvas;
   c.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;
    const handle=!e.shiftKey&&e.button===0?this.hitHandle(e):null;
    if(handle&&this.onManipulate?.('begin',{mode:handle.mode,index:this.selected})===false)return;
    this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,pan:e.shiftKey||e.button===2,handle:handle?{...handle}:null};
    c.focus({preventScroll:true});c.setPointerCapture(e.pointerId);e.preventDefault();});
   c.addEventListener('pointermove',e=>{const d=this.drag;if(!d){c.style.cursor=this.hitHandle(e)?'grab':'default';return;}if(d.id!==e.pointerId)return;
    const dx=e.clientX-d.lastX,dy=e.clientY-d.lastY;d.lastX=e.clientX;d.lastY=e.clientY;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>4)d.moved=true;
    if(d.moved){if(d.handle){const a=d.handle.axis,delta=((e.clientX-d.x)*a[0]+(e.clientY-d.y)*a[1])/(a[0]*a[0]+a[1]*a[1]);this.onManipulate?.('move',{mode:d.handle.mode,index:this.selected,delta});c.style.cursor='grabbing';}
     else if(d.pan){this.pan[0]+=dx;this.pan[1]+=dy;}else{this.yaw+=dx*.009;this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch+dy*.009));}this.schedule();}});
   c.addEventListener('pointerup',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;this.finishDrag(false);if(!d.handle&&!d.moved&&e.button===0)this.pick(e);});
   c.addEventListener('pointercancel',()=>this.finishDrag(true));c.addEventListener('contextmenu',e=>e.preventDefault());
   c.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.drag?.handle){this.finishDrag(true);e.preventDefault();e.stopPropagation();}else if(host.classList.contains('expanded')){this.expand(false);e.preventDefault();e.stopPropagation();}}});
   c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.25,Math.min(6,this.zoom*Math.exp(-e.deltaY*.001)));this.schedule();},{passive:false});
   c.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','-'].includes(e.key)){e.preventDefault();if(e.key==='Home')this.reset(-.42,.24);else if(e.key==='+')this.zoom=Math.min(6,this.zoom*1.1);else if(e.key==='-')this.zoom=Math.max(.25,this.zoom/1.1);else if(e.key==='ArrowLeft')this.yaw-=.1;else if(e.key==='ArrowRight')this.yaw+=.1;else this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch+(e.key==='ArrowUp'?-.1:.1)));this.schedule();}});
   this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(c);
   document.addEventListener('languagechange',()=>this.translate());
   new MutationObserver(()=>this.translate()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});this.translate();this.resize();
  }
  translate(){this.text=labels[document.documentElement.lang]||labels['pt-BR'];this.editText=editorLabels[document.documentElement.lang]||editorLabels['pt-BR'];this.host.querySelector('.lens3d-title').textContent=this.text[0];this.host.querySelector('.lens3d-help').textContent=this.text[1]+' · '+this.handleText()[4];this.host.querySelector('.lens3d-note').textContent=this.text[10];this.canvas.setAttribute('aria-label',this.text[0]+'. '+this.text[1]);for(const b of this.buttons)b.textContent=b.dataset.label==='9'&&this.host.classList.contains('expanded')?this.editText[0]:this.text[+b.dataset.label];this.inputs.forEach((input,i)=>input.previousElementSibling.textContent=this.editText[4+i]);this.form.querySelector('[data-step="-1"]').textContent=this.editText[2];this.form.querySelector('[data-step="1"]').textContent=this.editText[3];this.form.querySelector('.lens3d-apply').textContent=this.editText[8];this.syncEditor();this.schedule();}
  reset(yaw,pitch){this.yaw=yaw;this.pitch=pitch;this.zoom=1;this.pan=[0,0];}
  setStatus(text){this.status.textContent=text;}
  expand(open){this.host.classList.toggle('expanded',open);if(open)document.body.append(this.host);else this.anchor.after(this.host);this.buttons.find(b=>b.dataset.label==='9').setAttribute('aria-expanded',String(open));this.translate();this.canvas.focus({preventScroll:true});this.resize();}
  resize(){const rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.schedule();}
  update(data,selected,fields){const changed=this.selected!==selected;this.data=data;this.selected=selected;this.editorFields=fields;this.syncEditor(changed);const key=JSON.stringify([data.surfaces,data.settings.iris_mm,data.settings.blades,data.settings.rotation,data.settings.source_m,data.sensor_z_mm,data.source_focus_z_mm]);
   if(key!==this.key){this.key=key;this.geometryDirty=true;}
   this.schedule();
  }
  syncEditor(force=false){const s=this.data?.surfaces.find(s=>s.index===this.selected);if(!s)return;this.form.querySelector('[role="status"]').textContent=`${this.editText[1]} ${s.index+1} · z ${s.z.toFixed(2)} mm`;
   this.materialEditor?.update(this.data,this.selected,this.inputs.every(i=>i.disabled));
   this.geometryEditor?.update(this.data,this.selected,this.inputs.every(i=>i.disabled));
   const provenance=this.data.prescription?.provenance;
   if(provenance){const lang=document.documentElement.lang,names=lang==='en'?['Public reference','Reconstruction','Artistic look','Edited','No measured calibration']:lang==='zh-CN'?['公开参考','重建','艺术风格','已调整','未经实测校准']:['Referência pública','Reconstrução','Look artístico','Com ajustes','Sem calibração medida'];this.origin.replaceChildren();const text=document.createElement('span');text.textContent=[names[{public_reference:0,reconstructed:1,artistic:2}[provenance.category]??2],provenance.edited?names[3]:null,names[4]].filter(Boolean).join(' · ');this.origin.append(text);for(const url of provenance.sources||[]){if(!/^https:\/\//i.test(url))continue;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' ↗';a.setAttribute('aria-label',url);this.origin.append(a);}}
   const surfaces=this.data.surfaces.filter(s=>!s.is_stop),at=surfaces.findIndex(s=>s.index===this.selected);this.form.querySelector('[data-step="-1"]').disabled=at<=0;this.form.querySelector('[data-step="1"]').disabled=at===surfaces.length-1;
   for(const input of this.inputs){const metadata=this.editorFields?.[input.dataset.field];input.disabled=metadata?metadata.disabled:false;for(const attr of ['min','max']){if(metadata?.[attr])input.setAttribute(attr,metadata[attr]);else input.removeAttribute(attr);}input.required=true;if(force||document.activeElement!==input)input.value=s[input.dataset.field];}
  }
  handleText(){return ({'pt-BR':['Foco','Curvatura','Diâmetro','Espaçamento','Arraste as alças coloridas para editar · Esc cancela'],en:['Focus','Curvature','Diameter','Spacing','Drag colored handles to edit · Esc cancels'],'zh-CN':['对焦','曲率','直径','间距','拖动彩色控制柄编辑 · Esc 取消']})[document.documentElement.lang]||['Foco','Curvatura','Diâmetro','Espaçamento','Arraste as alças coloridas para editar · Esc cancela'];}
  hitHandle(e){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;return (this.handles||[]).find(h=>Math.hypot(x-h.x,y-h.y)<=12);}
  finishDrag(cancel){const d=this.drag;if(!d)return;this.drag=null;if(this.canvas.hasPointerCapture(d.id))this.canvas.releasePointerCapture(d.id);if(d.handle)this.onManipulate?.(cancel?'cancel':'end',{});this.canvas.style.cursor='default';this.schedule();}
  drawHandles(){const c=this.ctx,t=this.handleText();this.handles=[];
   const draw=(mode,point,axis,label,color)=>{if(Math.hypot(...axis)<.5||point[0]<12||point[0]>this.width-12||point[1]<12||point[1]>this.height-28)return;this.handles.push({mode,x:point[0],y:point[1],axis});c.beginPath();c.arc(point[0],point[1],7,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='#0b141a';c.lineWidth=2;c.stroke();c.font='11px sans-serif';const tw=c.measureText(label).width,x=Math.max(4,Math.min(this.width-tw-8,point[0]+11)),y=point[1]-11;c.fillStyle='#101a20';c.fillRect(x-3,y-12,tw+6,17);c.fillStyle=color;c.fillText(label,x,y);};
   // Focus is always available, including the front view where the optical axis is foreshortened.
   if(this.data.focus_matrix&&!this.inputs.every(i=>i.disabled))draw('focus',[this.width/2,this.height-48],[Math.max(1,this.scale),0],t[0]+' ↔ '+Number(this.data.settings.focus_m).toFixed(2)+' m','#9aefb6');
   const s=this.data.surfaces.find(s=>s.index===this.selected);if(!s||s.is_stop)return;
   const at=(mode,world,unit,label,color)=>{const p=this.project(world),q=this.project(add(world,unit));draw(mode,p,[q[0]-p[0],q[1]-p[1]],label,color);};
   const enabled=field=>!this.inputs.find(i=>i.dataset.field===field)?.disabled;
   const a=s.aperture_diameter/2;
   if(enabled('curvature_radius')&&s.curvature_radius&&!s.shape)at('curvature',[s.z+surfaceSag(s,0,a*.65),0,a*.65],[1,0,0],t[1],'#79d8ff');
   if(enabled('aperture_diameter'))at('diameter',[s.z+surfaceSag(s,0,a),0,a],[0,0,1],t[2],'#ffcb78');
   if(enabled('thickness'))at('spacing',[s.z+s.thickness,0,-a*.65],[1,0,0],t[3],'#d4aaff');
  }
  schedule(){if(!this.pending)this.pending=requestAnimationFrame(()=>{this.pending=null;this.draw();});}
  project(p){const x=p[0]-this.center,y=p[2],z=p[1],cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);const xx=cy*x+sy*z,zz=-sy*x+cy*z,yy=cp*y-sp*zz,depth=sp*y+cp*zz;const perspective=this.distance/(this.distance+depth);return [this.width/2+this.pan[0]+xx*this.scale*perspective,this.height/2+this.pan[1]-yy*this.scale*perspective,depth];}
  draw(){
   const c=this.ctx,w=this.width,h=this.height;if(!w||!h)return;c.clearRect(0,0,w,h);c.fillStyle='#101a20';c.fillRect(0,0,w,h);if(!this.data)return;
   if(this.geometryDirty){this.faces=mesh(this.data);this.rays=this.data.surfaces.some(s=>s.material_spec)?[.6563,.5876,.4861].flatMap(w=>trace(this.data,this.data.settings.iris_mm,w)):trace(this.data,this.data.settings.iris_mm);this.geometryDirty=false;}
   const data=this.data,end=Math.max(data.sensor_z_mm,data.source_focus_z_mm||0,data.focus_y_z_mm||0,data.surfaces.at(-1).z)+10,radius=Math.max(...data.surfaces.map(s=>s.aperture_diameter/2),data.settings.sensor_mm/2);
   this.center=(end-8)/2;this.distance=Math.max(end,radius*2)*4;this.scale=Math.min((w-60)/(end+12),(h-70)/(2*radius))*this.zoom;
   const path=(vertices,close=false)=>{c.beginPath();vertices.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath();};
   c.strokeStyle='#42606d';c.setLineDash([4,5]);path([this.project([-12,0,0]),this.project([end,0,0])]);c.stroke();c.setLineDash([]);
   const commands=[],push=(vertices,color,index=null,fill=true,stroke=null)=>{const projected=vertices.map(p=>this.project(p));commands.push({vertices:projected,depth:projected.reduce((s,p)=>s+p[2],0)/projected.length,color,index,fill,stroke});};
   for(const f of this.faces){if(this.cut&&f.vertices.reduce((s,p)=>s+p[1],0)<-1e-8)continue;const chosen=f.index===this.selected;push(f.vertices,chosen?'rgba(139,217,247,.22)':f.side?'rgba(86,150,176,.20)':'rgba(105,181,202,.085)',f.index,true,chosen?'rgba(173,233,255,.12)':null);}
   // Distinct rim per interface, including flat interfaces, for readable thickness.
   for(const s of data.surfaces){const a=s.aperture_diameter/2;
    if(s.is_stop){const outer=Math.max(a,data.settings.iris_mm+2),inner=Math.min(a,data.settings.iris_mm),blades=data.settings.blades;
     const edge=(r,t)=>{if(r===inner&&blades>=3){const beta=Math.PI/blades,b=t-(data.settings.rotation||0)*Math.PI/180,sector=((b+beta)%(2*beta)+2*beta)%(2*beta)-beta;r*=Math.cos(beta)/Math.cos(sector);}return [s.z,r*Math.cos(t),r*Math.sin(t)];};
     for(let j=0;j<80;j++){const t=j*2*Math.PI/80,u=(j+1)*2*Math.PI/80;push([edge(inner,t),edge(outer,t),edge(outer,u),edge(inner,u)],'rgba(229,173,101,.65)');}
    }else{const rim=[];for(let j=0;j<=80;j++){const t=j*2*Math.PI/80;if(!this.cut||Math.cos(t)>=-1e-8)rim.push([s.z+surfaceSag(s,a*Math.cos(t),a*Math.sin(t)),a*Math.cos(t),a*Math.sin(t)]);else if(rim.length>1){push(rim.splice(0),null,s.index,false,s.index===this.selected?'#c0f2ff':'#548da6');}}if(rim.length>1)push(rim,null,s.index,false,s.index===this.selected?'#c0f2ff':'#548da6');
     if(this.cut){const section=[];for(let j=0;j<=60;j++){const y=-a+2*a*j/60;section.push([s.z+surfaceSag(s,0,y),0,y]);}push(section,null,s.index,false,s.index===this.selected?'#c0f2ff':'#8bbbc9');}
    }
   }
   if(this.showRays)for(const r of this.rays){if(!r.passed&&!this.blocked)continue;if(this.cut&&r.path[0][1]<-1e-8)continue;const color=r.wavelength===.6563?'rgba(255,137,119,.48)':r.wavelength===.4861?'rgba(119,177,255,.48)':'rgba(160,245,182,.48)';for(let i=1;i<r.path.length;i++)push([r.path[i-1],r.path[i]],null,null,false,r.passed?color:'rgba(255,161,110,.35)');}
   const sx=data.settings.sensor_mm/2,sy=sx/(data.settings.aspect||16/9);push([[data.sensor_z_mm,-sx,-sy],[data.sensor_z_mm,sx,-sy],[data.sensor_z_mm,sx,sy],[data.sensor_z_mm,-sx,sy]],'rgba(231,172,100,.10)',null,true,'#e7ac64');
   if(Number.isFinite(data.focus_y_z_mm)){push([[data.focus_x_z_mm,-radius,0],[data.focus_x_z_mm,radius,0]],null,null,false,'#b9efc8');push([[data.focus_y_z_mm,0,-radius],[data.focus_y_z_mm,0,radius]],null,null,false,'#a1caff');}
   commands.sort((a,b)=>b.depth-a.depth);this.pickFaces=[];
   for(const cmd of commands){path(cmd.vertices,cmd.fill);if(cmd.fill){c.fillStyle=cmd.color;c.fill();if(cmd.index!==null)this.pickFaces.push(cmd);}if(cmd.stroke){c.strokeStyle=cmd.stroke;c.lineWidth=cmd.index===this.selected?1.3:.8;c.stroke();}}
   c.fillStyle='#e7ac64';c.font='12px sans-serif';const sensor=this.project([data.sensor_z_mm,0,sy]);c.fillText(this.text[12],sensor[0]+5,sensor[1]-8);
   if(Number.isFinite(data.focus_y_z_mm)){for(const [axis,z,color]of [['X',data.focus_x_z_mm,'#b9efc8'],['Y',data.focus_y_z_mm,'#a1caff']]){const p=this.project([z,0,0]);c.fillStyle=color;c.fillText(axis,p[0]+4,p[1]-6);}}
   this.drawHandles();
   c.fillStyle='#c2deea';c.fillText(`${this.text[11]} ${this.selected+1}  |  ${this.rays.filter(r=>r.passed).length}/${this.rays.length}`,12,h-14);
  }
  pick(e){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;for(let i=(this.pickFaces||[]).length-1;i>=0;i--){const f=this.pickFaces[i];let inside=false;for(let j=0,k=f.vertices.length-1;j<f.vertices.length;k=j++){const a=f.vertices[j],b=f.vertices[k];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside){this.onSelect(f.index);return;}}}
 }
 const api={Viewer,mesh,trace,sag};if(typeof module==='object'&&module.exports)module.exports=api;else root.Lens3D=api;
})(typeof window==='object'?window:globalThis);
