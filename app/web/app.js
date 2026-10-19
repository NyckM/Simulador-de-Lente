'use strict';
const $=id=>document.getElementById(id);
const defaults={lens_model:'dgauss50',ray_backend:'auto',render_backend:'auto',field_grid:5,ray_focus:true,physical_distortion:false,physical_ghosts:false,flare_boost:8,starburst_gain:0,starburst_size:1,starburst_streaks:.35,focus_m:.8,focus_preservation:0,focus_width:.1,foreground_blur:100,background_blur:100,source_m:5,iris_mm:8.55,sensor_mm:36,filmback_mm:0,blades:7,rotation:0,soften_internal_cutoff:true,iris_softness:0,aperture_mask:'',aperture_custom:false,aperture_invert:false,aperture_name:'',dispersion:0,filters:[],diffusion:0,...FilterTransform.defaults,lens_dirt_amount:0,lens_dirt_block:.2,lens_dirt_scatter:2,lens_dirt_radius:120,lens_dirt_scale:1,lens_dirt_seed:1,lens_dirt_rotation:0,lens_dirt_threshold:.8,lens_dirt_fingerprints:.7,lens_dirt_dust:.6,lens_dirt_scratches:.35,lens_dirt_fungus:0,lens_dirt_defocus:.35,lens_dirt_texture:'',lens_dirt_name:'',swirl:0,vignette_amount:0,edge_compensation:0,edge_compensation_limit:3,astigmatism_mm:0,coma:0,squeeze:1,exposure:0,near_m:.8,far_m:10,invert_depth:true,depth_channel:'r',depth_gain:1,depth_bias:0,depth_units:'relative',depth_normalize:'off',depth_low:0,depth_high:1,depth_curve:1,depth_mapping:'inverse',eclipse_bokeh:false,depth_mode:'auto',depth_slices:12,depth_cut:.5,depth_feather:.02,bokeh_gain:1,highlight_gain:0,highlight_recovery:3,bokeh_dither:false,dither_amount:1,highlight_detail:false,highlight_quality:128,highlight_threshold:.8,highlight_view:'final',impression:0,bokeh_texture_rings:0,bokeh_texture_grain:0,bokeh_texture_scale:6,bokeh_texture_rotation:0,bokeh_distortion:0,bokeh_distortion_color:.25,spherical3:0,spherical5:0,k1:0,k2:0,p1:0,p2:0,master_blend:1,apodization:0,rim_gain:0,ca_red:0,ca_blue:0,ca_axial:0,coating_strength:0,coating_nm:550,ghost_gain:0,diffraction_gain:0,diffraction_scale:1,shimmer_amount:0,shimmer_depth:1,shimmer_size:8,shimmer_density:.3,shimmer_seed:1,shimmer_threshold:.6,shimmer_prism:.25,shimmer_normalize:true,drops_amount:0,drops_depth:1,drops_size:30,drops_density:.5,drops_refraction:20,drops_seed:1,lens_edits:[]};
let depthInspector=null,layers=null,depthModelPanel=null,animation=null;
let depthBusy=false,mediaFile=null,offlineBusy=false,cancelOffline=false,depthJob=null,depthInfo=null,depthFrame=-1,depthLoading=null;
let physicalInspector=null;
const depthCache=new Map();
let importedDepthVideo=null,importedDepthSync=null;
let settings={...defaults},gpu=null,source=null,sourceW=768,sourceH=480,sourceKind='demo',sourceURL=null,depth=null,demoData=null,atlas=null;
const zoomState={scale:1,x:0,y:0};
let kernelTimer=null,kernelBusy=false,kernelAgain=false,drawPending=false,diagTimer=null,diagVersion=0,quality='medium',exportQuality='veryhigh',recorder=null,recordTrack=null,sourceEpoch=0;
const video=$('source-video'),canvas=$('gpu-canvas');
const performancePanel=new LensPerformance();
const qualityModes=LensQuality.modes;
let viewerResolution='540';
try{const stored=localStorage.getItem('bruxosdovfx-viewer-resolution');if(['auto','360','540','720','1080'].includes(stored))viewerResolution=stored;}catch{}
$('viewer-resolution').value=viewerResolution;
$('viewer-resolution').onchange=()=>{if(offlineBusy||recorder)return;viewerResolution=$('viewer-resolution').value;try{localStorage.setItem('bruxosdovfx-viewer-resolution',viewerResolution);}catch{}requestDraw();};
let cudaRenderer=null,cudaInfo=null,cudaPending=null,cudaFailed=false,drawTask=null,drawAgain=false;
const schedulingStats={frameCoalesced:0,staleFrames:0,staleAtlases:0,atlasCoalesced:0};
let previewEpoch=0,previewStep=0,refineTimer=null,previewInteraction=false,lastPreviewChange=0;
document.addEventListener('pointerdown',e=>{if(e.target.matches('input[type=range],.glass-handle,.focus-drag-handle,.focus-drag-handle *'))previewInteraction=true;});
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{if(previewInteraction){previewInteraction=false;requestDraw();}});
let userProfiles=[];
const samplingKeys=new Set(['foreground_blur','background_blur','bokeh_texture_rings','bokeh_texture_grain','bokeh_texture_scale','bokeh_texture_rotation','bokeh_distortion','bokeh_distortion_color','edge_compensation','edge_compensation_limit','vignette_amount','lens_dirt_amount','lens_dirt_block','lens_dirt_scatter','lens_dirt_radius','lens_dirt_scale','lens_dirt_seed','lens_dirt_rotation','lens_dirt_threshold','lens_dirt_fingerprints','lens_dirt_dust','lens_dirt_scratches','lens_dirt_fungus','lens_dirt_defocus','lens_dirt_texture','render_backend','shimmer_prism','shimmer_normalize','shimmer_amount','shimmer_depth','shimmer_size','shimmer_density','shimmer_seed','shimmer_threshold','eclipse_bokeh','drops_amount','drops_depth','drops_size','drops_density','drops_refraction','drops_seed','bokeh_dither','dither_amount','highlight_detail','highlight_quality','highlight_threshold','highlight_view']);
const opticalKeys=new Set(LensDependencies.atlasKeys);
const ranges=[
 ['capture','master_blend','Mistura do efeito',0,1,.01],['capture','focus_m','Distância de foco · m',.3,1000,.01],['capture','source_m','Distância do plano · m',.3,30,.1],['capture','filmback_mm','Filmback · mm',-2,2,.01],['capture','bokeh_gain','Ampliação do bokeh · criativa',.25,6,.05],['capture','highlight_recovery','Recuperar luzes recortadas · EV',0,8,.1],['capture','highlight_gain','Realce de altas luzes · criativo',0,8,.1],['capture','exposure','Exposição · EV',-5,5,.1],
 ['iris','iris_mm','Raio da íris · mm',.5,80,.05],['iris','sensor_mm','Largura do sensor · mm',12,44,.1],['iris','blades','Lâminas · 0 = circular',0,32,1],['iris','rotation','Rotação da íris · °',0,360,1],
 ['iris','focus_preservation','Preservar detalhe no foco',0,1,.01],
 ['iris','foreground_blur','Desfoque à frente do foco · %',0,200,1],
 ['iris','background_blur','Desfoque atrás do foco · %',0,200,1],
 ['iris','focus_width','Transição do foco · dioptrias',.001,2,.001],
 ['iris','iris_softness','Suavidade da íris · fração do raio',0,.3,.01],
 ['iris','edge_compensation','Clarear laterais · compensação óptica %',0,100,1],
 ['iris','edge_compensation_limit','Limite do clareamento · EV',0,6,.1],
 ['creative','bokeh_texture_rings','Textura do bokeh · anéis',0,1,.01],['creative','bokeh_texture_grain','Textura do bokeh · granulação',0,1,.01],['creative','bokeh_texture_scale','Frequência da textura do bokeh',.5,12,.1],['creative','bokeh_texture_rotation','Rotação da textura do bokeh · °',0,360,1],
 ['creative','bokeh_distortion','Deformação da luz · dobras',0,2,.01],['creative','bokeh_distortion_color','Deformação · dispersão de cor',0,1,.01],
 ['creative','impression','Filtro de caráter · negativo / positivo',-1,1,.01],['creative','apodization','Pupila · centro suave',0,3,.01],['creative','rim_gain','Pupila · realce de borda',0,8,.05],['creative','spherical3','Esférica primária · sinal ±',-2,2,.01],['creative','spherical5','Esférica secundária · sinal ±',-2,2,.01],['creative','dispersion','Dispersão / fringe · proxy',0,2,.01],['creative','astigmatism_mm','Astigmatismo · intensidade ± mm',-6,6,.01],['creative','swirl','Swirl tangencial',0,2,.01],['creative','vignette_amount','Vinheta criativa',0,1,.01],['creative','coma','Coma adicional',0,2,.01],['creative','squeeze','Bokeh anamórfico',1,2,.01],['creative','diffusion','Difusão aproximada',0,.8,.01],
 ['creative','ca_red','CA lateral · vermelho/ciano %',-2,2,.01],['creative','ca_blue','CA lateral · azul/amarelo %',-2,2,.01],['creative','ca_axial','CA longitudinal · foco RGB mm',-2,2,.01],
 ['wave','coating_strength','Coating AR · cobertura idealizada',0,1,.01],['wave','coating_nm','Coating · comprimento de projeto nm',400,700,5],['wave','ghost_gain','Ghosts · ganho criativo',0,40,.1],['wave','diffraction_gain','Difração · ganho dos raios',0,10,.05],['wave','diffraction_scale','Difração · escala visual',1,20,.1],
 ['shimmer','shimmer_amount','Intensidade do Shimmer',0,8,.05],['shimmer','shimmer_depth','Distância da camada · m',.3,30,.01],['shimmer','shimmer_size','Escala · px em largura 1080',2,80,1],['shimmer','shimmer_density','Densidade',.05,1,.01],['shimmer','shimmer_threshold','Limiar das altas luzes · linear',0,20,.01],['shimmer','shimmer_seed','Distribuição · seed',1,1000,1],['shimmer','shimmer_prism','Cor prismática do glitter',0,1,.01],
 ['dirt','lens_dirt_amount','Intensidade da sujeira',0,1,.01],['dirt','lens_dirt_block','Obstrução / bloqueio',0,1,.01],['dirt','lens_dirt_scatter','Dispersão das altas luzes',0,8,.05],['dirt','lens_dirt_radius','Raio do halo · px em largura 1080',10,360,1],['dirt','lens_dirt_threshold','Limiar das altas luzes · linear',0,20,.01],['dirt','lens_dirt_fingerprints','Marcas de dedo',0,2,.01],['dirt','lens_dirt_dust','Poeira',0,2,.01],['dirt','lens_dirt_scratches','Riscos',0,2,.01],['dirt','lens_dirt_fungus','Fungos',0,2,.01],['dirt','lens_dirt_defocus','Desfoque da sujeira · × abertura',0,4,.01],['dirt','lens_dirt_scale','Escala das manchas procedurais',.25,4,.01],['dirt','lens_dirt_seed','Distribuição das manchas · seed',1,1000,1],['dirt','lens_dirt_rotation','Rotação da sujeira · °',0,360,1],
 ['drops','drops_amount','Mistura das gotas',0,1,.01],['drops','drops_depth','Distância das gotas · m',.3,30,.01],['drops','drops_size','Raio · px em largura 1080',5,120,1],['drops','drops_density','Densidade',.05,1,.01],['drops','drops_refraction','Refração · intensidade',0,80,.1],['drops','drops_seed','Distribuição · seed',1,1000,1],
 ['distortion','k1','Radial k₁',-.4,.4,.001],['distortion','k2','Radial k₂',-.2,.2,.001],['distortion','p1','Descentramento p₁',-.1,.1,.001],['distortion','p2','Descentramento p₂',-.1,.1,.001],
 ['sampling','dither_amount','Dither Amount',0,4,.01],['sampling','highlight_threshold','Highlight Threshold · linear',0,20,.01],
 ['depth','near_m','Limite próximo · m',.3,100,.1],['depth','far_m','Limite distante · m',.4,1000,.1],['depth','depth_gain','Gain · escala do mapa',-20,20,.01],['depth','depth_bias','Bias · deslocamento do mapa',-10,10,.01],['depth','depth_slices','Fatias de profundidade',4,32,1],['depth','depth_cut','Depth Cut · posição',0,1,.01],['depth','depth_feather','Depth Cut · transição de desfoque',0,.2,.001]
];
for(const[section,key,label,min,max,step]of ranges){const wrap=document.createElement('div');wrap.className='control';const top=document.createElement('div');top.className='control-top';const text=document.createElement('label');text.htmlFor=key;text.textContent=label;const number=document.createElement('input');Object.assign(number,{type:'text',inputMode:'decimal',id:key,min,max,step,value:settings[key]});const slider=document.createElement('input');Object.assign(slider,{type:'range',id:key+'-range',min,max,step,value:settings[key]});slider.setAttribute('aria-label',label);
 const parse=text=>{const t=String(text).trim().replace(',','.');return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)?Number(t):NaN;};
 const change=(el,commit=false)=>{let v=parse(el.value);if(!Number.isFinite(v)){if(commit)number.value=settings[key];return;}if(key==='depth_slices'||key==='blades')v=Math.round(v);if(key==='blades'&&(v===1||v===2))v=3;const previous=settings[key],lower=Number(number.min);settings[key]=Math.min(max,Math.max(Number.isFinite(lower)?lower:min,v));slider.value=settings[key];if(el===slider||commit)number.value=settings[key];if(previous!==settings[key])changed(key);};
 let editStart=settings[key];number.onfocus=()=>{editStart=settings[key];};
 slider.oninput=()=>change(slider,true);if(LensDependencies.affects(key,defaults).atlas){/* 1.2.9: arrastar um controle da lente usa o atlas interativo (rápido) e refina ao soltar */slider.addEventListener('pointerdown',()=>{if(!offlineBusy&&!recorder)liveLensEditing=true;});const release=()=>{if(liveLensEditing&&!lensDrag&&!lens3DGesture){liveLensEditing=false;scheduleKernel();}};for(const ev of ['pointerup','pointercancel','change','lostpointercapture'])slider.addEventListener(ev,release);}number.oninput=()=>change(number);number.onchange=()=>change(number,true);number.onblur=()=>{number.value=settings[key];};
 number.onkeydown=e=>{if(e.key==='Escape'){settings[key]=editStart;number.value=slider.value=editStart;changed(key);number.blur();e.preventDefault();}else if(e.key==='Enter'){change(number,true);number.blur();e.preventDefault();}else if(['ArrowUp','ArrowDown'].includes(e.key)){number.value=Number((settings[key]+(e.key==='ArrowUp'?1:-1)*step*(e.shiftKey?10:1)).toPrecision(12));change(number,true);e.preventDefault();}};
 top.append(text,number);wrap.append(top,slider);
 if(key==='astigmatism_mm'){
  const modes=document.createElement('div');modes.className='astigmatism-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Modo do astigmatismo');
  modes.innerHTML='<button type="button" id="astigmatism-negative" aria-pressed="false">Negativo</button><button type="button" id="astigmatism-positive" aria-pressed="false">Positivo</button>';
  const status=document.createElement('p');status.id='astigmatism-mode-status';status.className='note';status.setAttribute('aria-live','polite');wrap.prepend(modes);wrap.append(status);
 }
 if(key==='foreground_blur'){const note=document.createElement('p');note.className='note';note.textContent="100% mantém o desfoque original desse lado. A transição perto do foco usa a faixa em dioptrias. Na timeline, escolha Principal ou A/B/C para animar.";wrap.append(note);}
 if(key==='bokeh_texture_rings'){const note=document.createElement('p');note.className='note';note.textContent='Anéis e granulação redistribuem a luz dentro do bokeh, separados da máscara da íris. Zero desativa a textura. Use qualidade alta para mostrar seus detalhes.';wrap.append(note);}
 if(key==='edge_compensation'){const note=document.createElement('p');note.className='note';note.textContent='0% mantém a luz original. Aumente para compensar as laterais. O limite em EV controla o ganho máximo, sem mudar o recorte do bokeh. Regiões bloqueadas não são recuperadas.';wrap.append(note);}
 $(section+'-controls').append(wrap);}
function syncAstigmatism(){
 const amount=settings.astigmatism_mm||0;
 $('astigmatism-negative').setAttribute('aria-pressed',String(amount<0));$('astigmatism-positive').setAttribute('aria-pressed',String(amount>0));
 $('astigmatism-mode-status').textContent=amount===0?'Desligado. Escolher um modo ativa 1 mm; intensidade zero desativa.':(amount<0?'Modo negativo':'Modo positivo')+' · '+Math.abs(amount).toLocaleString('pt-BR',{maximumFractionDigits:2})+' mm. Trocar o modo conserva a intensidade.';
}
function setAstigmatismSign(sign){
 if(offlineBusy||recorder||depthBusy)return;
 settings.astigmatism_mm=sign*(Math.abs(settings.astigmatism_mm)||1);sync();changed('astigmatism_mm');
}
$('astigmatism-negative').onclick=()=>setAstigmatismSign(-1);$('astigmatism-positive').onclick=()=>setAstigmatismSign(1);
$('render-backend').onchange=()=>{settings.render_backend=$('render-backend').value;cudaFailed=false;changed('render_backend');};
$('eclipse-bokeh').onchange=()=>{settings.eclipse_bokeh=$('eclipse-bokeh').checked;changed('eclipse_bokeh');};
LensAnimation.configure(ranges);
function sync(){window.FilterStackUI?.sync();window.FilterTransformUI?.refresh();window.ghostInspector?.sync();depthInspector?.sync();if(physicalInspector)physicalInspector.check.checked=!!settings.physical_distortion;syncAstigmatism();$('normalize-shimmer').checked=settings.shimmer_normalize!==false;$('ray-focus').checked=!!settings.ray_focus;$('render-backend').value=settings.render_backend||'auto';$('eclipse-bokeh').checked=!!settings.eclipse_bokeh;$('ray-backend').value=settings.ray_backend;$('field-grid').value=settings.field_grid;$('soften-internal-cutoff').checked=settings.soften_internal_cutoff;for(const[,k]of ranges){if(document.activeElement!==$(k))$(k).value=settings[k];$(k+'-range').value=settings[k];}$('invert-depth').checked=settings.invert_depth;$('depth-channel').value=settings.depth_channel;$('depth-mode').value=settings.depth_mode;$('quality').value=quality;$('export-quality').value=exportQuality;$('bokeh-dither').checked=settings.bokeh_dither;$('highlight-detail').checked=settings.highlight_detail;$('highlight-quality').value=settings.highlight_quality;$('highlight-view').value=settings.highlight_view;syncAperture();syncCustomAperture();syncDirt();syncDepthFocus();}
$('normalize-shimmer').onchange=()=>{settings.shimmer_normalize=$('normalize-shimmer').checked;changed('shimmer_normalize');};
$('focus-shimmer').onclick=()=>{if(offlineBusy||recorder||depthBusy)return;settings.focus_m=settings.shimmer_depth;sync();changed('focus_m');};
$('focus-drops').onclick=()=>{if(offlineBusy||recorder||depthBusy)return;settings.focus_m=settings.drops_depth;sync();changed('focus_m');};
function syncAperture(){
 const data=displayedLensData||lensDiagramData,a=data&&LensView.aperture(data,settings.iris_mm);if(!a)return;
 const number=$('aperture-fnumber'),slider=$('aperture-stops'),preset=$('aperture-preset');number.min=Math.floor(a.minF*100)/100;number.max=Math.ceil(a.maxF*100)/100;if(document.activeElement!==number)number.value=a.fNumber.toFixed(2);slider.max=2*Math.log2(a.maxF/a.minF);slider.value=2*Math.log2(a.fNumber/a.minF);
 for(const el of [number,slider,preset])el.disabled=!!(offlineBusy||recorder||depthBusy);
 for(const option of preset.options)if(!['custom','open'].includes(option.value))option.disabled=Number(option.value)<a.minF||Number(option.value)>a.maxF;
 preset.value=Math.abs(settings.iris_mm-a.maxRadius)<.0001?'open':'custom';if(preset.value==='custom')for(const option of preset.options)if(!option.disabled&&Math.abs(Number(option.value)-a.fNumber)<.005)preset.value=option.value;
 for(const id of ['iris_mm','iris_mm-range'])$(id).max=a.maxRadius;
 const svg=$('aperture-view'),radius=56*settings.iris_mm/a.maxRadius;svg.replaceChildren();svg.append(svgEl('circle',{cx:70,cy:70,r:58,fill:'#25332a',stroke:'#65876c'}));
 if(settings.aperture_custom&&settings.aperture_mask){const clip=svgEl('clipPath',{id:'custom-iris-circle'});clip.append(svgEl('circle',{cx:70,cy:70,r:radius}));svg.append(clip);const image=svgEl('image',{href:settings.aperture_mask,x:70-radius,y:70-radius,width:radius*2,height:radius*2,'clip-path':'url(#custom-iris-circle)',transform:`rotate(${-settings.rotation} 70 70)`});if(settings.aperture_invert)image.style.filter='invert(1)';svg.append(image);}else if(settings.blades<3)svg.append(svgEl('circle',{cx:70,cy:70,r:radius,fill:'#101712',stroke:'#e9b989'}));else{const pts=Array.from({length:settings.blades},(_,i)=>{const t=(settings.rotation||0)*Math.PI/180+Math.PI/settings.blades+i*2*Math.PI/settings.blades;return `${70+radius*Math.cos(t)},${70-radius*Math.sin(t)}`;}).join(' ');svg.append(svgEl('polygon',{points:pts,fill:'#101712',stroke:'#e9b989'}));}
 $('aperture-caption').textContent=`f/${a.fNumber.toFixed(2)} · pupila de entrada Ø ${a.diameter.toFixed(2)} mm · máxima abertura f/${a.minF.toFixed(2)}. Estimativa paraxial; exposição preservada.`;
}
function setAperture(fNumber){if(offlineBusy||recorder||depthBusy||!displayedLensData||!Number.isFinite(fNumber)||fNumber<=0)return;settings.iris_mm=LensView.radiusForFNumber(displayedLensData,fNumber);sync();changed('iris_mm');}
$('aperture-fnumber').oninput=()=>{const el=$('aperture-fnumber');if(el.value!==''&&el.checkValidity())setAperture(Number(el.value));};
$('aperture-fnumber').onchange=()=>{setAperture(Number($('aperture-fnumber').value));const a=displayedLensData&&LensView.aperture(displayedLensData,settings.iris_mm);if(a)$('aperture-fnumber').value=a.fNumber.toFixed(2);};
$('aperture-stops').oninput=()=>{const a=LensView.aperture(displayedLensData,settings.iris_mm);setAperture(a.minF*2**(Number($('aperture-stops').value)/2));};
$('aperture-preset').onchange=()=>{const v=$('aperture-preset').value;if(v==='custom')return;const a=LensView.aperture(displayedLensData,settings.iris_mm);setAperture(v==='open'?a.minF:Number(v));};
let apertureEditVersion=0;
function syncCustomAperture(){
 const has=!!settings.aperture_mask,active=has&&settings.aperture_custom,busy=offlineBusy||!!recorder||depthBusy;
 $('aperture-custom').checked=active;$('aperture-custom').disabled=!has||busy;$('aperture-invert').checked=!!settings.aperture_invert;$('aperture-invert').disabled=!has||busy;$('clear-aperture').disabled=!has||busy;
 const preview=$('aperture-mask-preview');preview.hidden=!has;if(has){preview.src=settings.aperture_mask;preview.style.filter=settings.aperture_invert?'invert(1)':'';preview.style.transform=`rotate(${-settings.rotation}deg)`;}
 $('aperture-mask-name').textContent=has?(settings.aperture_name||'Máscara importada')+' · até 512 × 512 px'+(active?' · ativa':' · desativada'):'Nenhuma máscara importada.';
 for(const id of ['blades','blades-range'])$(id).disabled=busy||active;
}
async function applyCustomAperture(next){
 if(offlineBusy||recorder||depthBusy)return;const revision=++apertureEditVersion,lens=settings.lens_model;
 try{const data=await post('/api/layout',{settings:{...settings,...next,near_m:.8,far_m:10}});if(revision!==apertureEditVersion||lens!==settings.lens_model)return;Object.assign(settings,next);drawDiagram(data);syncCustomAperture();changed('aperture_mask');}
 catch(e){syncCustomAperture();notify(e.message,true);}
}
async function openAperture(file){
 if(offlineBusy||recorder||depthBusy)return;if(file.size>8_000_000)throw Error('Use uma imagem de máscara de até 8 MB.');
 const bitmap=await createImageBitmap(file);try{
  if(bitmap.width*bitmap.height>32_000_000)throw Error('Imagem de máscara muito grande.');
  const size=Math.min(512,Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');const scale=size/Math.max(bitmap.width,bitmap.height);ctx.drawImage(bitmap,(size-bitmap.width*scale)/2,(size-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);
  const image=ctx.getImageData(0,0,size,size);for(let i=0;i<image.data.length;i+=4){const value=Math.round((image.data[i]*.2126+image.data[i+1]*.7152+image.data[i+2]*.0722)*image.data[i+3]/255);image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;}ctx.putImageData(image,0,0);
  await applyCustomAperture({aperture_mask:c.toDataURL('image/png'),aperture_custom:true,aperture_invert:false,aperture_name:file.name.slice(0,100)});
 }finally{bitmap.close();}
}

function syncDirt(){const has=!!settings.lens_dirt_texture,p=$('dirt-preview');p.hidden=!has;if(has){p.src=settings.lens_dirt_texture;p.style.transform=`rotate(${settings.lens_dirt_rotation||0}deg)`;}$('dirt-texture-name').textContent=has?(settings.lens_dirt_name||'Textura importada')+' · branco = sujeira':'Manchas procedurais · distribuição fixa';$('clear-dirt').disabled=!has||offlineBusy||!!recorder||depthBusy;}
async function openDirt(file){
 if(offlineBusy||recorder||depthBusy)return;if(file.size>8_000_000)throw Error('Use uma textura de até 8 MB.');
 const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>32_000_000)throw Error('Textura muito grande.');
  const size=Math.min(512,Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');const scale=size/Math.max(bitmap.width,bitmap.height);ctx.drawImage(bitmap,(size-bitmap.width*scale)/2,(size-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);const im=ctx.getImageData(0,0,size,size);
  for(let i=0;i<im.data.length;i+=4){const value=Math.round((im.data[i]*.2126+im.data[i+1]*.7152+im.data[i+2]*.0722)*im.data[i+3]/255);im.data[i]=im.data[i+1]=im.data[i+2]=value;im.data[i+3]=255;}ctx.putImageData(im,0,0);
  const data=c.toDataURL('image/png');await gpu.prepareDirt(data);settings.lens_dirt_texture=data;settings.lens_dirt_name=file.name.slice(0,100);if(settings.lens_dirt_amount===0)settings.lens_dirt_amount=.25;sync();changed('lens_dirt_texture');
 }finally{bitmap.close();}
}
$('import-dirt').onclick=()=>$('dirt-input').click();$('dirt-input').onchange=async e=>{try{if(e.target.files[0])await openDirt(e.target.files[0]);}catch(err){notify(err.message,true);}finally{e.target.value='';}};
$('clear-dirt').onclick=()=>{settings.lens_dirt_texture='';settings.lens_dirt_name='';syncDirt();changed('lens_dirt_texture');};
$('import-aperture').onclick=()=>$('aperture-input').click();$('aperture-input').onchange=async e=>{try{if(e.target.files[0])await openAperture(e.target.files[0]);}catch(err){notify(err.message,true);}finally{e.target.value='';}};
$('aperture-custom').onchange=()=>applyCustomAperture({aperture_custom:$('aperture-custom').checked});
$('aperture-invert').onchange=()=>applyCustomAperture({aperture_invert:$('aperture-invert').checked});
$('clear-aperture').onclick=()=>applyCustomAperture({aperture_mask:'',aperture_custom:false,aperture_invert:false,aperture_name:''});


function notify(text,error=false){$('messages').textContent=text;$('messages').hidden=!text;$('messages').classList.toggle('error',error);}
function depthRange(){return {near:settings.near_m,far:settings.far_m};}
let demoRangeSettings={near:2,far:5};
function syncDepthFocus(){syncFocusPicker();const {near,far}=depthRange();if(sourceKind==='demo'&&!depthInfo&&!depth?.generated){$('depth-caption').textContent=`Demo: branco / objeto ${near.toFixed(2)} m · preto / luzes ${far.toFixed(2)} m`;$('depth-file-name').textContent=`Demo: objeto ${near.toFixed(2)} m; luzes ${far.toFixed(2)} m. Ajuste os limites abaixo do controle de foco.`;}if(near>=far)return;$('focus-depth').value=DepthUtils.position(settings.focus_m,near,far);$('focus-depth-caption').textContent=`Perto ${near.toFixed(2)} m → fundo ${far.toFixed(2)} m · foco ${settings.focus_m.toFixed(2)} m`+(settings.focus_m<near||settings.focus_m>far?' (fora do intervalo do mapa)':'');}
function setDepthFocus(value){if(offlineBusy||recorder||depthBusy)return;if(!depth){notify('Importe ou gere um mapa de profundidade para focar no depth.',true);return;}const {near,far}=depthRange();if(near>=far)return;const desired=DepthUtils.meters(value,near,far),minimum=displayedLensData?.focus_min_m??.3;if(desired<minimum){notify('Este plano fica abaixo do foco mínimo da lente: '+minimum.toFixed(3)+' m. Ajuste Near/Far ou escolha outra lente.',true);return;}$('use-depth').checked=true;settings.focus_m=desired;sync();changed('focus_m');}
let focusPicking=false,lastDepthPick=null;
const focusPicker=document.createElement('button');focusPicker.id='pick-depth-focus';focusPicker.type='button';focusPicker.textContent='Selecionar foco';focusPicker.title='Clique em uma pessoa ou objeto da imagem para focar usando o mapa de profundidade.';focusPicker.setAttribute('aria-pressed','false');document.querySelector('.workspace-toolbar').append(focusPicker);
function setFocusPicking(on){focusPicking=on;focusPicker.setAttribute('aria-pressed',String(on));focusPicker.textContent=on?'Clique na imagem · cancelar':'Selecionar foco';$('image-stage').classList.toggle('picking-focus',on);}
focusPicker.onclick=()=>{if(!depth){notify('Importe ou gere o mapa de profundidade desta imagem para selecionar o foco.',true);return;}setFocusPicking(!focusPicking);};
function syncFocusPicker(){focusPicker.disabled=offlineBusy||!!recorder||depthBusy;if(focusPicker.disabled)setFocusPicking(false);}
document.addEventListener('keydown',e=>{if(e.key==='Escape')setFocusPicking(false);});
async function pickDepthFocus(e){const epoch=sourceEpoch;try{
 if(offlineBusy||recorder||depthBusy)return;
 if(depthInfo&&depthFrame!==depthIndex())await ensureDepth(depthIndex());if(importedDepthSync)await importedDepthSync;if(epoch!==sourceEpoch)return;
 const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/sourceW,r.height/sourceH),left=r.left+(r.width-sourceW*scale)/2,top=r.top+(r.height-sourceH*scale)/2;
 let u=(e.clientX-left)/(sourceW*scale),v=(e.clientY-top)/(sourceH*scale);if(u<0||u>1||v<0||v>1)return;
 // Sample the same geometric warp used by the renderer, in GL coordinates.
 const px=(u-.5)*2,py=(.5-v)*2*sourceH/sourceW,rr=px*px+py*py;
 u=(px*(1+settings.k1*rr+settings.k2*rr*rr)+2*settings.p1*px*py+settings.p2*(rr+2*px*px))/2+.5;
 v=.5-(py*(1+settings.k1*rr+settings.k2*rr*rr)+settings.p1*(rr+2*py*py)+2*settings.p2*px*py)/(2*sourceH/sourceW);
 const prepared=gpu.prepareDepth(settings,{...depthRange(),invert:settings.invert_depth});if(!prepared)throw Error('O mapa de profundidade ainda não está disponível neste frame.');
 const index=Math.min(prepared.height-1,Math.max(0,Math.floor(v*prepared.height)))*prepared.width+Math.min(prepared.width-1,Math.max(0,Math.floor(u*prepared.width)));
 if(!prepared.valid[index])throw Error('Depth inválido nesse ponto. Escolha um pixel com distância válida.');
 if(prepared.statistics.collapsed)throw Error(depthInspector.collapseWords().warning);
 lastDepthPick={u,v,epoch};$('inspection-plane').value='picked';
 const desired=DepthUtils.focusPrepared(prepared.nearness[index],settings,depthRange(),prepared.statistics.binary),minimum=displayedLensData?.focus_min_m??.3;if(desired<minimum)throw Error('Este ponto fica abaixo do foco mínimo da lente: '+minimum.toFixed(3)+' m. Ajuste Near/Far ou escolha outra lente.');settings.focus_m=desired;$('use-depth').checked=true;setFocusPicking(false);sync();changed('focus_m');notify('Foco selecionado no depth: '+settings.focus_m.toFixed(2)+' m.');
 }catch(error){notify(error.message,true);}}
$('focus-depth').oninput=()=>setDepthFocus(Number($('focus-depth').value));$('focus-near').onclick=()=>setDepthFocus(0);$('focus-far').onclick=()=>setDepthFocus(1);
function warnings(){let s='Prévia GPU esparsa: aproximação espacial da lente, em luz linear.';if(atlas?.trace_backend)s+=' Traçado dos vidros: '+(atlas.trace_backend==='vulkan-compute'?'Vulkan · '+atlas.trace_device:atlas.trace_backend==='cpu-fallback'?(settings.lens_edits.some(e=>e[1]==='shape'&&e[2]>0)?'CPU · geometria cilíndrica/asférica':'CPU · fallback após falha Vulkan'):settings.ray_backend==='cpu'?'CPU · referência':'CPU · Vulkan indisponível')+'.';if(settings.bokeh_gain!==1)s+=' Ampliação criativa ativa.';if(settings.highlight_gain)s+=' Realce de luzes não recupera HDR perdido.';if(settings.dispersion||settings.spherical3||settings.spherical5||settings.swirl||settings.vignette_amount||settings.astigmatism_mm||settings.coma||settings.squeeze!==1||settings.diffusion)s+=' Modificadores não calibrados ativos.';if(settings.ghost_gain||settings.diffraction_gain)s+=' Ghosts e raios de difração: proxies de imagem, sem validação fotométrica.';if($('use-depth').checked&&!depthInfo)s+=sourceKind==='video'?' Depth estático no vídeo; sem tracking ou oclusões exatas.':' Oclusão por depth aproximada.';if($('use-depth').checked)s+=['auto','continuous'].includes(settings.depth_mode)?' Depth automático: composição em ordem de distância.':settings.depth_mode==='cut'?(settings.depth_feather>0?` Depth Cut: transição de desfoque em ${settings.depth_slices} planos, fundo oculto não reconstruído.`:' Depth Cut: dois planos, sem recuperar fundo oculto.'):` Depth Slicing: ${settings.depth_slices} planos, fundo oculto não reconstruído.`;if(depthInfo)s+=' Depth gerado: '+depthInfo.model+'.';if(sourceKind==='video')s+=' MP4: exportação quadro a quadro. WebM: captura em reprodução. Sem áudio.';notify(s);}
for(const [id,key]of [['bokeh-dither','bokeh_dither'],['highlight-detail','highlight_detail']])$(id).onchange=()=>{settings[key]=$(id).checked;changed(key);};
$('ray-focus').onchange=()=>{if(offlineBusy||recorder||depthBusy)return;settings.ray_focus=$('ray-focus').checked;changed('ray_focus');};
$('ray-backend').onchange=()=>{settings.ray_backend=$('ray-backend').value;changed('ray_backend');};
$('field-grid').onchange=()=>{settings.field_grid=Number($('field-grid').value);changed('field_grid');};
$('highlight-quality').onchange=()=>{settings.highlight_quality=Number($('highlight-quality').value);changed('highlight_quality');};
$('highlight-view').onchange=()=>{settings.highlight_view=$('highlight-view').value;changed('highlight_view');};
$('soften-internal-cutoff').onchange=()=>{settings.soften_internal_cutoff=$('soften-internal-cutoff').checked;changed('soften_internal_cutoff');};
var persistTimer=0;function persist(){clearTimeout(persistTimer);persistTimer=setTimeout(persistNow,250);}
addEventListener('pagehide',()=>persistNow());addEventListener('beforeunload',()=>persistNow());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistNow();});
function persistNow(){clearTimeout(persistTimer);if(sourceKind==='demo')demoRangeSettings=depthRange();try{localStorage.setItem('optica-lab-v02',JSON.stringify({settings:animation?LensAnimation.base(animation.data,settings,layers.configs).settings:settings,demoRange:demoRangeSettings,quality,exportQuality,exportSize:$('export-size').value,fps:Number($('export-fps').value),preset:$('preset').value}));}catch{}}
let settingEditEpoch=0;const settingEditVersions=new Map();
function changed(key){animation?.edited();settingEditVersions.set(key,++settingEditEpoch);if(key==='astigmatism_mm')syncAstigmatism();if(key.startsWith('lens_dirt_'))syncDirt();if(key==='rotation')syncCustomAperture();document.dispatchEvent(new Event("opticalsettingschange"));if(key==='iris_mm'&&displayedLensData){if(lensDraftEdits===null)lensDraftEdits=settings.lens_edits.map(x=>[...x]);++layoutRevision;renderLensDiagram({...displayedLensData,settings:{...displayedLensData.settings,iris_mm:settings.iris_mm}},{draft:true});queueLensLayout();}persist();const affected=LensDependencies.affects(key,defaults);if(affected.atlas)scheduleKernel();requestDraw();if((key==='focus_m'||key==='filmback_mm')&&displayedLensData?.focus_matrix&&(!lensDrag||lensDrag.mode==='focus'))renderLensDiagram(LensView.withFocus(displayedLensData,settings.focus_m,settings.filmback_mm));syncDepthFocus();if(displayedLensData&&affected.layout&&!['focus_m','filmback_mm','iris_mm'].includes(key))renderLensDiagram(LensView.withFocus(displayedLensData,settings.focus_m,settings.filmback_mm));if(affected.layout)scheduleDiagnostics();warnings();}
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'Falha no servidor.');return j;}
let liveLensEditing=false,appliedAtlasSignature=null,kernelQueuedAt=null,kernelForce=false;
function requiredTaps(){return LensQuality.taps(quality,exportQuality,settings.highlight_detail?settings.highlight_quality:0,gpu?.gl.getParameter(gpu.gl.MAX_ARRAY_TEXTURE_LAYERS)||256);}
function signature(){return JSON.stringify([...opticalKeys].map(k=>settings[k]).concat(sourceW/sourceH,settings.lens_edits,liveLensEditing,requiredTaps()));}
function scheduleKernel(){if(kernelTimer){clearTimeout(kernelTimer);schedulingStats.atlasCoalesced++;}const now=performance.now();kernelQueuedAt??=now;kernelTimer=setTimeout(()=>{kernelTimer=null;kernelQueuedAt=null;const force=kernelForce;kernelForce=false;updateKernel(force);},Math.min(90,Math.max(0,180-(now-kernelQueuedAt))));}
async function updateKernel(force=false){if(kernelBusy){kernelAgain=true;kernelForce||=force;return;}if(!force&&gpu?.ready&&appliedAtlasSignature===signature()){requestDraw(true);return;}kernelBusy=true;kernelAgain=false;const sig=signature();$('status').textContent='Atualizando atlas da lente… vídeo continua';
 const interactive=liveLensEditing,aspect=sourceW/sourceH,taps=interactive?64:requiredTaps();
 try{const requestStarted=performance.now();const data=await requestLensAtlas({settings:{...settings,near_m:.8,far_m:10},aspect,interactive,taps});const httpMs=performance.now()-requestStarted;const current=sig===signature();if(current){const uploadStarted=performance.now();gpu.setKernel(data);appliedAtlasSignature=sig;performancePanel.recordAtlas(data,httpMs,performance.now()-uploadStarted,gpu.atlasUploadSkipped);atlas=data;if($('prescription-status'))$('prescription-status').textContent='Desenho, raios e imagem atualizados · '+settings.lens_edits.length+' ajuste(s).';requestDraw();$('export').disabled=false;warnings();}if(!current){schedulingStats.staleAtlases++;kernelAgain=true;}}
 catch(e){if(sig===signature()){notify(e.message,true);$('status').textContent='Não foi possível atualizar a lente';}}
 finally{kernelBusy=false;if(kernelAgain)scheduleKernel();}
}
function requestDraw(refine=false){if(offlineBusy)return;if(!refine){previewEpoch++;previewStep=0;lastPreviewChange=performance.now();clearTimeout(refineTimer);}if(drawTask){drawAgain=true;schedulingStats.frameCoalesced++;return;}if(drawPending){schedulingStats.frameCoalesced++;return;}drawPending=true;requestAnimationFrame(()=>{drawPending=false;draw();});}
let outputMode=null;
function exportMode(){if(kernelBusy||kernelTimer||appliedAtlasSignature!==signature()||!gpu?.ready||gpu.data.taps<requiredTaps())throw Error('Aguarde o atlas da qualidade escolhida terminar de atualizar.');if(qualityModes[exportQuality].samples>requiredTaps())throw Error('Esta GPU não suporta a qualidade de exportação escolhida. Selecione um nível menor.');const value=$('export-size').value;return {limit:value==='source'?Math.max(sourceW,sourceH):Number(value),samples:qualityModes[exportQuality].samples,aa:1,upscale:true};}
async function draw(mode=outputMode){
 if(drawTask){if(mode){await drawTask;return draw(mode);}drawAgain=true;schedulingStats.frameCoalesced++;return;}
 const task=renderFrame(mode);drawTask=task;
 try{return await task;}finally{drawTask=null;if(drawAgain){drawAgain=false;requestDraw(true);}}
}
// 1.2.17b: na prévia de vídeos acima de 2K, envia um proxy de até 2048 px para a GPU (o prefiltro e a pirâmide rodam
// por quadro na resolução da fonte; em 4K isso derrubava o contexto WebGL). Exportação e gravação continuam na resolução original.
let videoProxy=null;
function uploadVideoFrame(mode){const big=Math.max(sourceW,sourceH);if(!mode&&!recorder&&big>2048&&!$('use-depth').checked&&!layers?.active){const k=2048/big,pw=Math.max(16,Math.round(sourceW*k)),ph=Math.max(16,Math.round(sourceH*k));videoProxy??=document.createElement('canvas');if(videoProxy.width!==pw||videoProxy.height!==ph){videoProxy.width=pw;videoProxy.height=ph;}videoProxy.getContext('2d',{alpha:false}).drawImage(video,0,0,pw,ph);gpu.uploadSource(videoProxy,pw,ph);}else gpu.uploadSource(video,sourceW,sourceH);}
async function renderFrame(mode){if(!gpu?.ready||!source)return;
 const started=performance.now(),epoch=previewEpoch,step=previewStep;const frameSettings=LensAnimation.clone(settings),frameLayers=LensAnimation.clone(layers.configs);
 const current=()=>offlineBusy||epoch===previewEpoch;
 try{
 if(animation?.data.tracks.length||frameLayers.some(c=>Object.keys(c.optics||{}).length)){const prepared=await animation.prepare(frameSettings,frameLayers);if(!current())return;gpu.setKernel(prepared.main);atlas=prepared.main;appliedAtlasSignature=signature();mode=mode?{...mode,layerConfigs:frameLayers,layerAtlases:prepared.atlases}:mode;frameSettings._layerAtlases=prepared.atlases;}
 if(depthInfo&&$('use-depth').checked){const index=depthIndex();if(depthFrame!==index){ensureDepth(index).then(()=>requestDraw()).catch(e=>notify(e.message,true));return;}}
 if(importedDepthSync){if(mode)await importedDepthSync;else{importedDepthSync.then(()=>requestDraw()).catch(()=>{});return;}}
 if(importedDepthVideo&&$('use-depth').checked){
  const binding=importedDepthVideo,t=video.currentTime;
  binding.source.getContext('2d').drawImage(video,0,0,sourceW,sourceH);
  importedDepthSync=syncImportedDepth(binding,t);
  try{await importedDepthSync;}finally{importedDepthSync=null;}
  if(binding!==importedDepthVideo)return;
  gpu.uploadSource(binding.source,sourceW,sourceH);
 }else if(sourceKind==='video'&&video.readyState>=2)uploadVideoFrame(mode);
 depthInspector?.refresh();
 if(window.ghostInspector?.current&&!ghostInspector.isCurrent())ghostInspector.invalidate();
 if(frameSettings.physical_ghosts&&frameSettings.ghost_gain>0)await ghostInspector.ensure();
 const useDepth=$('use-depth').checked&&!!depth;const {near,far}={near:frameSettings.near_m,far:frameSettings.far_m};if(useDepth&&near>=far){notify('A distância próxima deve ser menor que a distante.',true);return;}
 if(!current()){schedulingStats.staleFrames++;return;}
 let target={...(mode||qualityModes[quality])};
 if(!mode&&zoomState.scale>1&&(sourceKind!=='video'||video.paused))target.limit=Math.min(3840,Math.max(sourceW,sourceH),Math.ceil(target.limit*zoomState.scale));
 if(!mode&&!recorder)target=LensQuality.previewTarget(target,viewerResolution);
 const progressive=!mode&&!recorder&&(sourceKind!=='video'||video.paused),plan=LensQuality.previewPlan(target);
 const options=progressive?plan[Math.min(step,plan.length-1)]:{...target,preview:!mode,stage:mode?'export':'playback'};
 const renderSettings={...frameSettings,lens_edits:frameSettings.lens_edits.map(x=>[...x])},renderOptions={...options,depth:useDepth,invert:frameSettings.invert_depth,near,far,layerConfigs:frameLayers,layerAtlases:frameSettings._layerAtlases};delete renderSettings._layerAtlases;let result;
 await gpu.prepareDirt(renderSettings.lens_dirt_texture||'',renderSettings);
 if(!current()){schedulingStats.staleFrames++;return;}
 if(options.interactive)renderSettings.highlight_detail=false;
 renderOptions.isCurrent=current;
 if(renderSettings.physical_ghosts){renderSettings._reflected_gain=renderSettings.ghost_gain;renderSettings.ghost_gain=0;}
 if(layers?.active){result=layers.render(gpu,renderSettings,renderOptions);}
 else if(renderSettings.render_backend!=='webgl'&&cudaInfo?.available&&!cudaFailed){
  cudaRenderer??=new CUDARenderer(gpu);cudaPending=cudaRenderer.draw(renderSettings,renderOptions);
  try{result=await cudaPending;}catch(e){cudaFailed=true;if(e.code!=='CUDA_PREVIEW_RESET')notify('CUDA: '+e.message+'. Prévia alternada para WebGL.',true);if(!current()){schedulingStats.staleFrames++;return;}result=gpu.draw(renderSettings,renderOptions);}
  finally{cudaPending=null;}
 }else result=gpu.draw(renderSettings,renderOptions);if(!result||result.skipped||!current()){schedulingStats.staleFrames++;return;}
 canvas.dataset.previewStage=options.stage;canvas.dataset.frameMs=(performance.now()-started).toFixed(2);
 performancePanel.recordFrame(result,performance.now()-started,options.stage);
 if(sourceKind==='video'&&!video.paused&&!video.ended){const now=performance.now();if(!fpsStart){fpsStart=now;fpsCount=0;}else fpsCount++;if(now-fpsStart>=1000){$('video-fps').textContent=`${(fpsCount*1000/(now-fpsStart)).toFixed(1)} frames/s processados`;fpsCount=0;fpsStart=now;}}
 $('resolution').textContent=`${result.width} × ${result.height}`;canvas.dataset.drawCount=String(result.draws);canvas.dataset.gpuMs=result.gpuMs?.toFixed(2)||'';
 if(result.backend==='cuda')$('status').textContent=`CUDA · ${result.device} · ${result.gpuMs.toFixed(1)} ms GPU · ${result.samples} amostras`;else if(!kernelBusy)$('status').textContent=result.gpuMs!==null?`Convolução GPU ${result.gpuMs.toFixed(1)} ms · campo ${atlas.grid} × ${atlas.grid} · ${result.samples} amostras`:`Prévia GPU ativa · campo ${atlas.grid} × ${atlas.grid} · ${result.samples} amostras`;
 if(result.samples<options.samples)$('status').textContent+=' · solicitado '+options.samples+'; limitado pelo atlas/GPU';
 if(result.backend==='webgl-layers')$('status').textContent='WebGL · '+result.layers+' camada(s) · alpha e radiância por pupila';
 if(result.depthMode)$('status').textContent+=' · depth '+(result.depthMode==='cut'?'2 planos':'slicing');
 if(result.highlightFallback)$('status').textContent+=' · qualidade alta no quadro inteiro';
 if(!mode)$('status').textContent+=` · ${(performance.now()-started).toFixed(0)} ms quadro`+(options.stage==='interactive'?' · ajustando':options.stage==='refining'?' · refinando':'');
 if(progressive&&step<plan.length-1&&!kernelBusy&&!kernelTimer&&!previewInteraction){clearTimeout(refineTimer);refineTimer=setTimeout(()=>{if(epoch!==previewEpoch||offlineBusy||recorder)return;previewStep=step+1;requestDraw(true);},Math.max(60,180-(performance.now()-lastPreviewChange)));}
 const delta=gpu.plane(frameSettings.focus_m)+frameSettings.filmback_mm-gpu.plane(frameSettings.source_m);
 const approx=2*frameSettings.iris_mm*Math.abs(delta)/Math.max(1,gpu.plane(frameSettings.source_m)-atlas.last_z)*canvas.width/frameSettings.sensor_mm*frameSettings.bokeh_gain;
 $('bokeh-size').textContent=`≈ ${approx.toFixed(1)} px`;if(recordTrack?.requestFrame)recordTrack.requestFrame();return result;
 }catch(e){if(current())notify(e.message,true);else schedulingStats.staleFrames++;}}
let fpsStart=0,fpsCount=0,videoCb=null;
async function onVideoFrame(now){videoCb=null;if(sourceKind!=='video')return;if(animation.data.tracks.length)animation.project(Math.min(animation.data.duration-1,Math.floor(video.currentTime*animation.data.fps)));await draw();$('seek').value=video.currentTime;timeLabel();if(!video.paused&&!video.ended)scheduleVideo();}
function scheduleVideo(){if(videoCb!==null)return;if(video.requestVideoFrameCallback)videoCb=video.requestVideoFrameCallback(onVideoFrame);else videoCb=requestAnimationFrame(onVideoFrame);}
video.onplay=()=>{$('play').textContent='Ⅱ Pausar';fpsStart=0;fpsCount=0;scheduleVideo();};
video.onpause=()=>{$('play').textContent='▶ Reproduzir';requestDraw();};video.onseeked=()=>{requestDraw();timeLabel();};video.onended=()=>{if(recorder?.state==='recording')recorder.stop();$('play').textContent='▶ Reproduzir';requestDraw();};
function timeLabel(){const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;$('video-time').textContent=`${fmt(video.currentTime)} / ${fmt(video.duration||0)}`;}
$('play').onclick=async()=>{try{if(video.paused)await video.play();else video.pause();}catch(e){notify('Não foi possível reproduzir: '+e.message,true);}};
$('seek').oninput=()=>{video.currentTime=Number($('seek').value);if(animation.data.tracks.length)animation.project(Math.min(animation.data.duration-1,Math.floor(video.currentTime*animation.data.fps)));timeLabel();};
function stopVideo(){video.pause();if(videoCb!==null){if(video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(videoCb);else cancelAnimationFrame(videoCb);videoCb=null;}video.removeAttribute('src');video.load();$('source-video').hidden=true;$('source-image').hidden=false;$('video-transport').hidden=true;$('video-fps').textContent='';if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=null;}}
function imgLoad(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Formato de imagem não suportado.'));img.src=url;});}
function stage(w,h){sourceW=w;sourceH=h;$('image-stage').style.aspectRatio=w+'/'+h;resetZoom();scheduleKernel();}
async function openImage(file){if(recorder||offlineBusy||depthBusy)return;mediaFile=file;layers?.clearAssets();clearGeneratedDepth();const epoch=++sourceEpoch;const url=URL.createObjectURL(file);try{const img=await imgLoad(url);if(epoch!==sourceEpoch){URL.revokeObjectURL(url);return;}stopVideo();sourceURL=url;source=img;sourceKind='image';setFocusPicking(false);syncFocusPicker();depth=null;$('depth-image').removeAttribute('src');$('depth-caption').textContent='Importe um mapa com as mesmas dimensões.';$('use-depth').checked=false;$('source-image').src=url;$('asset-name').textContent=file.name;$('depth-file-name').textContent='Nenhum mapa importado.';gpu.uploadSource(img,img.naturalWidth,img.naturalHeight);stage(img.naturalWidth,img.naturalHeight);requestDraw();warnings();}catch(e){URL.revokeObjectURL(url);throw e;}}
async function openVideo(file){if(recorder||offlineBusy||depthBusy)return;mediaFile=file;layers?.clearAssets();clearGeneratedDepth();++sourceEpoch;stopVideo();sourceURL=URL.createObjectURL(file);sourceKind='video';setFocusPicking(false);syncFocusPicker();source=video;depth=null;$('use-depth').checked=false;$('source-video').hidden=false;$('source-image').hidden=true;$('depth-image').removeAttribute('src');$('depth-caption').textContent='Vídeo sem mapa de profundidade.';$('depth-file-name').textContent='Importe um vídeo de depth sincronizado ou um mapa estático.';$('asset-name').textContent=file.name;
 await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Codec de vídeo não suportado pelo navegador. Tente MP4 H.264 ou WebM.'));video.src=sourceURL;video.load();});
 stage(video.videoWidth,video.videoHeight);gpu.uploadSource(video,video.videoWidth,video.videoHeight);$('video-transport').hidden=false;$('seek').max=video.duration;$('seek').value=0;timeLabel();requestDraw();warnings();}
async function openDepth(file){if(recorder||offlineBusy||depthBusy)return;if(file.type.startsWith('video/')||/\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name))return openDepthVideo(file);if(sourceKind==='demo')throw Error('O demo já tem depth próprio. Abra sua imagem ou vídeo primeiro.');const url=URL.createObjectURL(file);try{const img=await imgLoad(url);if(img.naturalWidth!==sourceW||img.naturalHeight!==sourceH)throw Error('O mapa deve ter as mesmas dimensões da imagem/vídeo.');clearGeneratedDepth();depth=img;gpu.uploadDepth(img);$('depth-image').src=url;$('depth-file-name').textContent=file.name;$('depth-caption').textContent=sourceKind==='video'?'Mapa estático: não acompanha movimento':'O sentido e a escala do mapa são definidos nos controles de profundidade.';$('use-depth').checked=true;requestDraw();warnings();}catch(e){URL.revokeObjectURL(url);throw e;}}

async function seekDepthVideo(element,time){
 if(Math.abs(element.currentTime-time)<.000001&&element.readyState>=2)return;
 await new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);element.removeEventListener('seeked',done);element.removeEventListener('error',fail);};const done=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(Error('Não foi possível decodificar o vídeo de depth. Use MP4 H.264 ou WebM.'));};const timer=setTimeout(()=>{cleanup();reject(Error('Tempo excedido ao buscar frame do vídeo de depth.'));},15000);element.addEventListener('seeked',done);element.addEventListener('error',fail);element.currentTime=time;});
}
async function syncImportedDepth(binding,time){
 await seekDepthVideo(binding.element,Math.min(time,Math.max(0,binding.element.duration-.001)));
 if(binding!==importedDepthVideo)return;
 binding.map.getContext('2d',{willReadFrequently:true}).drawImage(binding.element,0,0,sourceW,sourceH);
 gpu.uploadDepth(binding.map);
 if(!$('depth-stage').hidden)$('depth-image').src=binding.map.toDataURL('image/png');
}
async function openDepthVideo(file){
 if(sourceKind!=='video')throw Error('Abra o vídeo principal antes de importar um vídeo de depth.');
 const epoch=sourceEpoch,url=URL.createObjectURL(file),element=document.createElement('video');element.muted=true;element.playsInline=true;element.preload='auto';
 try{
  await new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);element.onloadeddata=null;element.onerror=null;};const timer=setTimeout(()=>{cleanup();reject(Error('Tempo excedido ao abrir o vídeo de depth.'));},15000);element.onloadeddata=()=>{cleanup();resolve();};element.onerror=()=>{cleanup();reject(Error('Codec de vídeo de depth não suportado. Use MP4 H.264 ou WebM.'));};element.src=url;});
  if(epoch!==sourceEpoch)throw Error('O vídeo principal mudou durante a importação.');
  if(element.videoWidth!==sourceW||element.videoHeight!==sourceH)throw Error('O vídeo de depth deve ter as mesmas dimensões do vídeo principal.');
  const map=document.createElement('canvas'),snapshot=document.createElement('canvas');map.width=snapshot.width=sourceW;map.height=snapshot.height=sourceH;
  await seekDepthVideo(element,Math.min(video.currentTime,Math.max(0,element.duration-.001)));
  clearGeneratedDepth();importedDepthVideo={element,url,map,source:snapshot};depth=map;await syncImportedDepth(importedDepthVideo,video.currentTime);
  $('depth-image').src=map.toDataURL('image/png');$('depth-file-name').textContent=file.name+' · vídeo de depth sincronizado';$('depth-caption').textContent='Depth externo por tempo do vídeo principal · início em 0 s';$('use-depth').checked=true;
  if(Math.abs(element.duration-video.duration)>.1)notify('As durações dos vídeos são diferentes. Após o fim do depth, o último mapa será mantido.');
  requestDraw();warnings();
 }catch(e){element.pause();element.removeAttribute('src');element.load();URL.revokeObjectURL(url);throw e;}
}

async function loadDemo(){if(recorder||offlineBusy||depthBusy)return;mediaFile=null;layers?.clearAssets();clearGeneratedDepth();const epoch=++sourceEpoch;stopVideo();$('busy-overlay').hidden=false;try{if(!demoData){const[r,b]=await Promise.all([fetch('/api/demo').then(r=>r.json()),fetch('/api/demo-linear').then(r=>r.arrayBuffer())]);demoData={...r,linear:new Float32Array(b)};}const [img,dep]=await Promise.all([imgLoad(demoData.image),imgLoad(demoData.depth)]);if(epoch!==sourceEpoch)return;source=img;sourceKind='demo';Object.assign(settings,{invert_depth:false,depth_channel:'r',depth_gain:1,depth_bias:0,depth_units:'relative',depth_normalize:'off',depth_curve:1,depth_mapping:'inverse'});settings.near_m=demoRangeSettings.near;settings.far_m=demoRangeSettings.far;sync();syncDepthFocus();setFocusPicking(false);syncFocusPicker();depth=dep;gpu.uploadSource(img,demoData.width,demoData.height,demoData.linear);gpu.uploadDepth(dep);$('source-image').src=demoData.image;$('depth-image').src=demoData.depth;$('asset-name').textContent='PONTOS DE LUZ / HDR SINTÉTICO';syncDepthFocus();$('use-depth').checked=false;stage(demoData.width,demoData.height);requestDraw();warnings();scheduleDiagnostics();}finally{$('busy-overlay').hidden=true;}}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
async function saveJSON(obj,name){
 const content=JSON.stringify(obj,null,2);
 try{
  if(new URLSearchParams(location.search).get('desktop')==='1'){
   for(let i=0;i<50&&!window.pywebview?.api?.save_json;i++)await new Promise(r=>setTimeout(r,100));
   if(!window.pywebview?.api?.save_json)throw Error('A janela de salvamento não está disponível. Reabra o app.');
   const result=await window.pywebview.api.save_json(name,content);
   if(result.error)throw Error(result.error);
   if(result.cancelled){notify('Exportação cancelada. Nenhum arquivo foi salvo.');return result;}
   if(!result.path)throw Error('Não foi possível confirmar o salvamento.');
   notify('Arquivo salvo em: '+result.path);return result;
  }
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));download(url,name);setTimeout(()=>URL.revokeObjectURL(url),60000);
  notify('Exportação enviada ao navegador. Consulte os downloads do navegador.');return {download:true};
 }catch(e){notify(e.message,true);return {error:e.message};}
}
function recordLock(lock){animation?.refresh();window.ghostInspector?.lock(lock);window.FilterStackUI?.lock(lock);window.FilterTransformUI?.refresh();depthModelPanel?.sync();layers?.sync();depthInspector?.lock(lock);for(const id of ['character-look','apply-character-look','reset-character-look','astigmatism-negative','astigmatism-positive','apply-light-distortion','apply-swirl-look','import-dirt','clear-dirt','import-aperture','clear-aperture','aperture-custom','aperture-invert','ray-focus','viewer-resolution','render-backend','normalize-shimmer','focus-shimmer','eclipse-bokeh','focus-drops','ray-backend','field-grid','bokeh-dither','highlight-detail','highlight-quality','highlight-view','aperture-fnumber','aperture-stops','aperture-preset','depth-channel','depth-mode','soften-internal-cutoff','import-image','import-video','import-depth','demo','load-settings','preset','reset-profile','profile-name','focus-depth','focus-near','focus-far','save-profile','update-profile','export-profile','import-profile','quality','export-quality','reset','play','seek','use-depth','invert-depth','export-size','export','export-video','export-fps','generate-depth','depth-model','glass-surface','glass-radius','glass-thickness','glass-diameter','glass-index','glass-apply','glass-reset'])$(id).disabled=lock;for(const[,k]of ranges){$(k).disabled=lock;$(k+'-range').disabled=lock;}for(const input of document.querySelectorAll('#prescription-table input'))input.disabled=lock||input.dataset.readonly==='true';if(!lock){profileControls();syncCustomAperture();syncDirt();}}
$('record').onclick=async()=>{if(offlineBusy||depthBusy)return;if(recorder){if(recorder.state==='recording')recorder.stop();return;}try{
 if(!window.MediaRecorder||!canvas.captureStream)throw Error('Este navegador não suporta gravação do canvas.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw Error('Encoder WebM indisponível.');
 if(kernelBusy||kernelTimer)throw Error('Aguarde o atlas da lente terminar de atualizar.');
 video.pause();if(video.currentTime!==0){await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=0;});}
 outputMode=exportMode();if(!await draw())throw Error('Não foi possível renderizar a saída.');const stream=canvas.captureStream(0);recordTrack=stream.getVideoTracks()[0];const chunks=[];let totalBytes=0;
 const instance=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.max(8_000_000,Math.round(canvas.width*canvas.height*5))});recorder=instance;recordLock(true);$('record').classList.add('recording');$('record').textContent='■ Parar e salvar trecho';
 instance.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);totalBytes+=e.data.size;if(totalBytes>500_000_000&&instance.state==='recording'){notify('Limite de 500 MB atingido; salvando o trecho gravado.');instance.stop();}}};
 instance.onstop=()=>{video.pause();stream.getTracks().forEach(t=>t.stop());recordTrack=null;recorder=null;outputMode=null;recordLock(false);requestDraw();$('record').classList.remove('recording');$('record').textContent='Gravar WebM sem áudio';if(chunks.length){const url=URL.createObjectURL(new Blob(chunks,{type:mime}));download(url,'bruxosdovfx-desfoque-video-sem-audio.webm');setTimeout(()=>URL.revokeObjectURL(url),60000);}notify('Gravação encerrada. WebM sem áudio, na resolução de exportação; ritmo depende dos frames processados.');};
 instance.onerror=e=>{notify('Erro na gravação: '+(e.error?.message||'encoder indisponível'),true);if(instance.state!=='inactive')instance.stop();};
 instance.start(1000);recordTrack.requestFrame?.();await video.play();
 }catch(e){if(recorder&&recorder.state!=='inactive')recorder.stop();else{recorder=null;outputMode=null;recordLock(false);requestDraw();}notify(e.message,true);}};
$('export').onclick=async()=>{if(recorder||offlineBusy||depthBusy)return;try{
 if(kernelBusy||kernelTimer)throw Error('Aguarde a atualização da lente.');
 const result=await draw(exportMode());if(!result)throw Error('Não foi possível renderizar o frame.');
 // toBlob captures the current canvas bitmap before the preview is restored.
 const pending=new Promise(resolve=>canvas.toBlob(resolve,'image/png'));requestDraw();
 const blob=await pending;if(!blob)throw Error('Falha ao exportar o frame.');
 const url=URL.createObjectURL(blob);download(url,`bruxosdovfx-desfoque-${result.width}x${result.height}.png`);setTimeout(()=>URL.revokeObjectURL(url),1000);
 notify(`PNG exportado: ${result.width} × ${result.height}.`+(Math.max(result.width,result.height)>Math.max(sourceW,sourceH)?' Fonte ampliada; não acrescenta detalhe capturado.':''));
 }catch(e){requestDraw();notify(e.message,true);}};
$('render').onclick=()=>{updateKernel(true);requestDraw();scheduleDiagnostics();};
$('quality').onchange=()=>{quality=$('quality').value;persist();scheduleKernel();requestDraw();};
$('export-quality').onchange=()=>{exportQuality=$('export-quality').value;persist();scheduleKernel();};
$('use-depth').onchange=()=>{if($('use-depth').checked&&!depth){$('use-depth').checked=false;notify('Importe um mapa de profundidade primeiro.');return;}if($('use-depth').checked&&sourceKind==='demo'){const {near,far}=depthRange();if(settings.focus_m<near||settings.focus_m>far){settings.focus_m=near;sync();persist();}}syncDepthFocus();if(lensDiagramData)renderLensDiagram(LensView.withFocus(lensDiagramData,settings.focus_m,settings.filmback_mm));document.dispatchEvent(new Event('opticalsettingschange'));requestDraw();warnings();};
for(const [id,key]of [['depth-channel','depth_channel'],['depth-mode','depth_mode']])$(id).onchange=()=>{settings[key]=$(id).value;changed(key);};
$('invert-depth').onchange=()=>{settings.invert_depth=$('invert-depth').checked;changed('invert_depth');};
let wipePercent=28;
function setWipe(value){wipePercent=Math.max(0,Math.min(100,value));$('before-layer').style.clipPath=`inset(0 ${100-wipePercent}% 0 0)`;$('split-line').style.left=wipePercent+'%';$('split-line').setAttribute('aria-valuenow',String(Math.round(wipePercent)));$('split-line').setAttribute('aria-valuetext',`${Math.round(wipePercent)}% imagem original`);}
const wipeStage=$('image-stage'),wipeHandle=$('split-line');let viewPointer=null;
function applyZoom(){const z=zoomState;const transform=`translate(${z.x}px, ${z.y}px) scale(${z.scale})`;for(const el of [canvas,$('source-image'),video])el.style.transform=transform;wipeStage.classList.toggle('zoomed',z.scale>1.001);$('zoom-range').value=String(z.scale);$('zoom-reset').textContent=`${Math.round(z.scale*100)}%`;$('zoom-out').disabled=z.scale<=1.001;$('zoom-in').disabled=z.scale>=7.999;}
function zoomTo(scale,clientX,clientY){const rect=wipeStage.getBoundingClientRect(),old=zoomState.scale,next=Math.max(1,Math.min(8,scale));if(Math.abs(next-old)<.0001)return;const px=clientX-rect.left,py=clientY-rect.top;zoomState.x=px-(px-zoomState.x)*next/old;zoomState.y=py-(py-zoomState.y)*next/old;zoomState.scale=next;zoomState.x=Math.max(rect.width*(1-next),Math.min(0,zoomState.x));zoomState.y=Math.max(rect.height*(1-next),Math.min(0,zoomState.y));if(next===1)zoomState.x=zoomState.y=0;applyZoom();requestDraw();}
function resetZoom(){zoomState.scale=1;zoomState.x=zoomState.y=0;applyZoom();requestDraw();}
function zoomCenter(factor){const r=wipeStage.getBoundingClientRect();zoomTo(zoomState.scale*factor,r.left+r.width/2,r.top+r.height/2);}
$('zoom-in').onclick=()=>zoomCenter(1.5);$('zoom-out').onclick=()=>zoomCenter(1/1.5);$('zoom-reset').onclick=resetZoom;
$('zoom-range').oninput=e=>{const r=wipeStage.getBoundingClientRect();zoomTo(Number(e.target.value),r.left+r.width/2,r.top+r.height/2);};
wipeStage.addEventListener('wheel',e=>{e.preventDefault();zoomTo(zoomState.scale*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);},{passive:false});
function wipeAt(clientX){const bounds=wipeStage.getBoundingClientRect();if(bounds.width)setWipe((clientX-bounds.left)/bounds.width*100);}
wipeStage.addEventListener('pointerdown',e=>{if(window.ghostInspector?.picking){const rect=canvas.getBoundingClientRect();ghostInspector.select([(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height]);e.preventDefault();return;}if(focusPicking){e.preventDefault();pickDepthFocus(e);return;}if(e.button!==0&&e.pointerType==='mouse')return;const mode=e.target.closest('#split-line')||e.shiftKey||zoomState.scale<=1?'wipe':'pan';viewPointer={id:e.pointerId,mode,lastX:e.clientX,lastY:e.clientY};wipeStage.setPointerCapture(e.pointerId);if(mode==='wipe')wipeAt(e.clientX);else wipeStage.classList.add('panning');e.preventDefault();});
wipeStage.addEventListener('pointermove',e=>{const p=viewPointer;if(!p||e.pointerId!==p.id)return;if(p.mode==='wipe')wipeAt(e.clientX);else{const r=wipeStage.getBoundingClientRect();zoomState.x=Math.max(r.width*(1-zoomState.scale),Math.min(0,zoomState.x+e.clientX-p.lastX));zoomState.y=Math.max(r.height*(1-zoomState.scale),Math.min(0,zoomState.y+e.clientY-p.lastY));p.lastX=e.clientX;p.lastY=e.clientY;applyZoom();}});
function endViewPointer(e){if(!viewPointer||e.pointerId!==viewPointer.id)return;viewPointer=null;wipeStage.classList.remove('panning');if(wipeStage.hasPointerCapture(e.pointerId))wipeStage.releasePointerCapture(e.pointerId);}
wipeStage.addEventListener('pointerup',endViewPointer);wipeStage.addEventListener('pointercancel',endViewPointer);
wipeStage.addEventListener('dblclick',e=>{resetZoom();e.preventDefault();});
wipeHandle.addEventListener('keydown',e=>{const step=e.shiftKey?10:1;let next=wipePercent;if(e.key==='ArrowLeft'||e.key==='ArrowDown')next-=step;else if(e.key==='ArrowRight'||e.key==='ArrowUp')next+=step;else if(e.key==='Home')next=0;else if(e.key==='End')next=100;else return;setWipe(next);e.preventDefault();});
setWipe(wipePercent);
applyZoom();
function depthView(on){if(on)depthInspector?.refresh(true);$('image-stage').hidden=on;$('depth-stage').hidden=!on;$('view-depth').classList.toggle('active',on);$('view-result').classList.toggle('active',!on);}
$('view-depth').onclick=()=>{const st=$('image-stage'),r=st.getBoundingClientRect();if(r.width&&r.height){$('depth-stage').style.setProperty('--stage-aspect',String(sourceW/sourceH||r.width/r.height));Object.assign($('depth-stage').style,{maxWidth:'none',maxHeight:'none',width:Math.round(r.width)+'px',height:Math.round(r.height)+'px',aspectRatio:'auto'});}depthView(true);};$('view-result').onclick=()=>depthView(false);
for(const [button,input,fn]of [['import-image','image-input',openImage],['import-video','video-input',openVideo],['import-depth','depth-input',openDepth]]){$(button).onclick=()=>$(input).click();$(input).onchange=async e=>{try{const f=e.target.files[0];if(f)await fn(f);}catch(err){notify(err.message,true);}finally{e.target.value='';}};}
const viewport=document.querySelector('.viewport');viewport.ondragover=e=>{e.preventDefault();viewport.classList.add('dragging');};viewport.ondragleave=()=>viewport.classList.remove('dragging');viewport.ondrop=e=>{e.preventDefault();viewport.classList.remove('dragging');const f=e.dataTransfer.files[0];if(f)(f.type.startsWith('video/')?openVideo(f):openImage(f)).catch(err=>notify(err.message,true));};
function presetNote(){const profile=LensPresets[settings.lens_model],node=$('preset-note');node.replaceChildren();const custom=userProfiles.find(p=>p.id===$('preset').value);profileControls();const text=custom?custom.name+' · perfil personalizado sobre '+profile.name+'. Reset restaura a configuração salva.':settings.lens_model==='dgauss50'?($('preset').value==='physical'?'Double-Gauss 50,36 mm · prescrição pública.':($('preset').value==='deakinizer'?'Deakinizer · aproximação criativa sobre Double-Gauss. Centro preservado, bordas alongadas por Swirl e Coma; sem calibração da lente reconstruída.':'Estudo criativo sobre Double-Gauss.')):profile.name+' · '+profile.status+'. '+(profile.prescription?'Geometria independente; o desenho e o atlas usam esta prescrição.':'Geometria Double-Gauss derivada, não a prescrição original. Valores de aparência não medidos.');if(custom){const name=document.createElement('span');name.setAttribute('data-i18n-skip','');name.textContent=custom.name;node.append(name);}node.append(document.createTextNode((custom?text.slice(custom.name.length):text)+(/soft|fuwatto/i.test(profile.name)?' Esta prescrição é Soft Focus: mantém suavidade mesmo no plano focado. Fechar o diafragma reduz esse efeito.':'')));for(const [i,url]of (profile.sources||[]).entries()){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.textContent=' Fonte '+(i+1);node.append(link);}}
function prepareLensReset(){
 // End edit gestures before replacing their snapshot and invalidate late layout/diagnostic replies.
 lens3D.finishDrag(true);window.opticsWorkspace?.cancelFocusDrag?.();
 if(lensDrag){const id=lensDrag.pointerId;lensDrag=null;if(diagram.hasPointerCapture(id))diagram.releasePointerCapture(id);}
 liveLensEditing=false;previewInteraction=false;lensDraftEdits=null;clearTimeout(layoutTimer);layoutTimer=null;layoutAgain=false;
 clearTimeout(diagTimer);++diagVersion;clearTimeout(refineTimer);++previewEpoch;
 if(cudaPending){cudaFailed=true;cudaRenderer?.cancelPreview();}
 return ++layoutRevision;
}
async function applyPreset({reset=false}={}){if(offlineBusy||recorder||depthBusy)return;const editsAtStart=settingEditEpoch;const selected=$('preset').value,custom=userProfiles.find(p=>p.id===selected);if(custom){if(reset)prepareLensReset();await restoreProfile(custom,{reset});return;}const model=LensPresets[selected]?selected:'dgauss50',revision=reset?prepareLensReset():++layoutRevision;lensDraftEdits=null;
 const next={...(reset?defaults:settings),...Object.fromEntries(['foreground_blur','background_blur','bokeh_texture_rings','bokeh_texture_grain','bokeh_texture_scale','bokeh_texture_rotation','bokeh_distortion','bokeh_distortion_color','impression','swirl','vignette_amount','astigmatism_mm','coma','squeeze','diffusion','dispersion','spherical3','spherical5','coating_strength','coating_nm','ghost_gain','ca_red','ca_blue','ca_axial','k1','k2','p1','p2','apodization','rim_gain','blades','rotation','iris_softness'].map(k=>[k,defaults[k]])),lens_model:model,lens_edits:[],iris_mm:.5,filmback_mm:0};
 Object.assign(next,LensPresets[model].look||{});if(selected==='swirl')Object.assign(next,{swirl:.85,dispersion:.2,spherical3:.35});if(selected==='petzval')Object.assign(next,{swirl:1.8,coma:.25,spherical3:0,spherical5:0,vignette_amount:.8,blades:0});if(selected==='deakinizer')Object.assign(next,{swirl:1.7,coma:.65,spherical3:0,spherical5:0,dispersion:0,diffusion:0,blades:0});if(selected==='anamorphic')Object.assign(next,{squeeze:2,dispersion:.3,diffusion:.1});
 try{const data=await post('/api/layout',{settings:{...next,near_m:.8,far_m:10}});if(revision!==layoutRevision||offlineBusy||recorder||depthBusy)return;next.iris_mm=data.aperture.max_iris_mm;if(reset){for(const [key,edit]of settingEditVersions)if(edit>editsAtStart&&key!=='lens_model'&&key!=='lens_edits')next[key]=settings[key];}const minimum=data.focus_min_m??.3;if(next.focus_m<minimum)next.focus_m=Math.max(2,minimum);if(next.source_m<minimum)next.source_m=Math.max(5,minimum);settings=next;if(reset){quality='medium';exportQuality='veryhigh';$('export-size').value='3840';$('export-fps').value='30';$('use-depth').checked=false;}drawDiagram(data);sync();document.dispatchEvent(new Event("opticalsettingschange"));presetNote();persist();scheduleKernel();requestDraw();scheduleDiagnostics();}catch(e){notify(e.message,true);}
}
$('preset').onchange=()=>applyPreset();
function renderLensCatalogue(){const host=$('lens-catalogue'),query=$('lens-search').value.toLocaleLowerCase('pt-BR').trim();host.replaceChildren();for(const entry of LensCatalogue){const label=`${entry.name} · ${entry.focal_mm} mm f/${entry.nominal_f}`;if(query&&!label.toLocaleLowerCase('pt-BR').includes(query))continue;const row=document.createElement('div');row.className='catalogue-row';const title=document.createElement('span');title.textContent=label;row.append(title);if(entry.model){const button=document.createElement('button');button.type='button';button.textContent='Usar';button.onclick=()=>{if(offlineBusy||recorder||depthBusy)return;$('preset').value=entry.model;applyPreset();};row.append(button);}else{const status=document.createElement('small');status.textContent='Prescrição pendente';row.append(status);}host.append(row);}if(!host.children.length)host.textContent='Nenhum modelo encontrado.';}
$('lens-search').oninput=renderLensCatalogue;renderLensCatalogue();
function applySwirlLook(){
 if(offlineBusy||recorder||depthBusy)return;
 Object.assign(settings,{swirl:1.8,coma:.25,vignette_amount:.8,impression:0,astigmatism_mm:0,spherical3:0,spherical5:0,squeeze:1,blades:0});
 sync();changed('blades');notify('Bokeh giratório aplicado. Ajuste Swirl, Vinheta e Ampliação do bokeh; o foco e o depth foram mantidos.');
}
$('apply-swirl-look').onclick=applySwirlLook;
$('apply-light-distortion').onclick=()=>{if(offlineBusy||recorder||depthBusy)return;Object.assign(settings,{bokeh_distortion:1.4,bokeh_distortion_color:.65});sync();changed('bokeh_distortion');notify('Deformação da luz ativada no desfoque. Ajuste as dobras e a dispersão; foco e depth mantidos.');};
$('reset-profile').onclick=()=>applyPreset({reset:true});
function profileControls(){const p=userProfiles.find(p=>p.id===$('preset').value);$('update-profile').disabled=!p||offlineBusy||!!recorder||depthBusy;}
function refreshProfiles(selected=$('preset').value){let group=$('user-profiles');if(!group){group=document.createElement('optgroup');group.id='user-profiles';group.label='Meus perfis';$('preset').append(group);}group.replaceChildren();for(const p of userProfiles){const option=document.createElement('option');option.value=p.id;option.setAttribute('data-i18n-skip','');option.textContent=p.name;group.append(option);}$('preset').value=selected;if(!$('preset').value)$('preset').value='physical';profileControls();}
function snapshot(){return ProfileStore.clone({settings:{...settings,lens_edits:lensDraftEdits??settings.lens_edits},quality,exportQuality,exportSize:$('export-size').value,fps:Number($('export-fps').value),useDepth:$('use-depth').checked});}
async function validateSnapshot(s){const next={...defaults,...s.settings};for(const[,k,,min,max]of ranges)if(typeof next[k]!=='number'||!Number.isFinite(next[k])||next[k]<min||next[k]>max)throw Error('Parâmetro inválido: '+k);if(!LensPresets[next.lens_model])throw Error('Modelo de lente desconhecido.');return post('/api/layout',{settings:next});}
async function restoreProfile(p,{reset=false}={}){const editsAtStart=settingEditEpoch;try{const revision=++layoutRevision;lensDraftEdits=null;const saved=ProfileStore.clone(p.snapshot),data=await validateSnapshot(saved);if(revision!==layoutRevision||offlineBusy||recorder||depthBusy)return;settings={...defaults,...saved.settings,...(reset?Object.fromEntries([...settingEditVersions].filter(([key,edit])=>edit>editsAtStart&&key!=='lens_model'&&key!=='lens_edits').map(([key])=>[key,settings[key]])): {})};settings.filters=ArtisticFilters.validate(settings.filters);quality=saved.quality;exportQuality=saved.exportQuality;$('export-size').value=saved.exportSize;$('export-fps').value=String(saved.fps);$('use-depth').checked=saved.useDepth&&!!depth;$('profile-name').value=p.name;drawDiagram(data);sync();document.dispatchEvent(new Event("opticalsettingschange"));presetNote();persist();scheduleKernel();requestDraw();scheduleDiagnostics();}catch(e){notify(e.message,true);}}
async function storeProfile(update=false){if(offlineBusy||recorder||depthBusy)return;try{const previous=userProfiles.find(p=>p.id===$('preset').value);if(update&&!previous)throw Error('Selecione um dos seus perfis para atualizar.');const p=ProfileStore.create($('profile-name').value,snapshot(),update?previous.id:'user-'+crypto.randomUUID());await validateSnapshot(p.snapshot);const list=update?userProfiles.map(item=>item.id===p.id?p:item):[...userProfiles,p];const saved=ProfileStore.save(localStorage,list);userProfiles=saved;refreshProfiles(p.id);presetNote();persist();notify(update?'Perfil salvo atualizado.':'Perfil criado e salvo.');}catch(e){notify(e.message,true);}}
$('save-profile').onclick=()=>storeProfile(false);$('update-profile').onclick=()=>storeProfile(true);
$('export-profile').onclick=async()=>{try{const selected=userProfiles.find(p=>p.id===$('preset').value),name=$('profile-name').value.trim()||selected?.name||LensPresets[settings.lens_model].name,p=ProfileStore.create(name,snapshot());await validateSnapshot(p.snapshot);return await saveJSON(p,'bruxosdovfx-perfil-de-lente.json');}catch(e){notify(e.message,true);return {error:e.message};}};
$('export-size').addEventListener('change',persist);$('export-fps').addEventListener('change',persist);
$('import-profile').onclick=()=>$('profile-input').click();$('profile-input').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>8_000_000)throw Error('Arquivo de perfil muito grande.');const p=ProfileStore.parse(JSON.parse(await f.text()));await validateSnapshot(p.snapshot);p.id='user-'+crypto.randomUUID();userProfiles=ProfileStore.save(localStorage,[...userProfiles,p]);refreshProfiles(p.id);await restoreProfile(p);notify('Perfil importado e salvo na biblioteca.');}catch(err){notify(err.message,true);}finally{e.target.value='';}};
$('reset').onclick=()=>{if(offlineBusy||recorder||depthBusy)return;prepareLensReset();animation.load(null);settings={...defaults,...(sourceKind==='demo'?{near_m:2,far_m:5}:{})};$('preset').value='physical';$('use-depth').checked=false;sync();presetNote();changed('iris_mm');};
$('demo').onclick=()=>loadDemo().catch(e=>notify(e.message,true));
$('save-settings').onclick=()=>saveJSON({schema:'optica-lab/17',animation:animation.data,filterModel:'artistic-filters/2',lens:'LensSim/dgauss50mm',preset:$('preset').value,settings:LensAnimation.base(animation.data,settings,layers.configs).settings,quality,exportQuality,layers:LensAnimation.base(animation.data,settings,layers.configs).layers,ghosts:window.ghostInspector?.config(),customProfile:userProfiles.find(p=>p.id===$('preset').value)||null},'bruxosdovfx-projeto.json');
$('load-settings').onclick=()=>$('settings-input').click();$('settings-input').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>8_000_000)throw Error('JSON muito grande.');const obj=JSON.parse(await f.text());if(!['optica-lab/1','optica-lab/2','optica-lab/3','optica-lab/4','optica-lab/5','optica-lab/6','optica-lab/7','optica-lab/8','optica-lab/9','optica-lab/10','optica-lab/11','optica-lab/12','optica-lab/13','optica-lab/14','optica-lab/15','optica-lab/16','optica-lab/17'].includes(obj.schema)||obj.lens!=='LensSim/dgauss50mm')throw Error('Projeto incompatível.');const next={...defaults,...obj.settings};next.filters=ArtisticFilters.validate(next.filters);if(obj.layers)StackLayers.parse(obj.layers);const nextAnimation=animation.validate(obj.animation,next,obj.layers||'ABC'.split('').map(StackLayers.config));if(obj.ghosts)ReflectedGhosts.Inspector.parse(obj.ghosts);for(const[,k,,min,max]of ranges)if(typeof next[k]!=='number'||!Number.isFinite(next[k])||next[k]<min||next[k]>max)throw Error('Parâmetro inválido: '+k);if([1,2].includes(next.blades)||next.near_m>=next.far_m)throw Error('Íris ou profundidade inválida.');if(!['r','g','b','a','luma'].includes(next.depth_channel)||!['auto','continuous','slicing','cut'].includes(next.depth_mode)||!Number.isInteger(next.depth_slices))throw Error('Controles de depth inválidos.');await post('/api/diagnostics',{settings:{...next,near_m:.8,far_m:10}});if(obj.customProfile){const p=ProfileStore.parse(obj.customProfile);await validateSnapshot(p.snapshot);p.id='user-'+crypto.randomUUID();userProfiles=ProfileStore.save(localStorage,[...userProfiles,p]);obj.preset=p.id;refreshProfiles(p.id);}animation.suppress=true;settings=next;layers.load(obj.layers||'ABC'.split('').map(StackLayers.config));animation.suppress=false;animation.load(nextAnimation);if(obj.ghosts)ghostInspector.load(obj.ghosts);quality=LensQuality.normalize(obj.quality);exportQuality=qualityModes[obj.exportQuality]?obj.exportQuality:'veryhigh';$('preset').value=['physical','swirl','petzval','anamorphic','deakinizer',...Object.keys(LensPresets),...userProfiles.map(p=>p.id)].includes(obj.preset)?obj.preset:'physical';sync();presetNote();changed('iris_mm');}catch(err){notify(err.message,true);}finally{e.target.value='';}};
function scheduleDiagnostics(){clearTimeout(diagTimer);const revision=++diagVersion;diagTimer=setTimeout(async()=>{try{const data=await post('/api/diagnostics',{settings:{...settings,near_m:.8,far_m:10}});if(revision===diagVersion&&!lensDrag)drawDiagram(data);}catch(e){if(revision===diagVersion)notify(e.message,true);}},500);}
function svgEl(type,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',type);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
const glassFields=[['curvature_radius','glass-radius'],['thickness','glass-thickness'],['aperture_diameter','glass-diameter'],['nd','glass-index']];
let lensDiagramData=null,displayedLensData=null,lensDraftEdits=null,lensDrag=null,layoutTimer=null,layoutBusy=false,layoutAgain=false,layoutRevision=0;
const diagram=$('lens-diagram');
const lens3D=new Lens3D.Viewer($('lens-3d'),index=>{
 if(offlineBusy||recorder||depthBusy||!displayedLensData)return;
 $('glass-surface').value=String(index);
 renderLensDiagram(displayedLensData,{draft:lensDraftEdits!==null});
},(index,values)=>{
 if(offlineBusy||recorder||depthBusy||!displayedLensData||index!==Number($('glass-surface').value))return;
 for(const [field,id]of glassFields)if(field in values)$(id).value=values[field];
 $('glass-apply').click();
},(index,values)=>{
 if(offlineBusy||recorder||depthBusy||!displayedLensData)return;
 let edits=(lensDraftEdits??settings.lens_edits).filter(([i,f])=>i!==index||!GlassMaterials.fields.has(f));
 if(values.material!==0)for(const [field,value]of Object.entries(values))edits=editListWith(edits,index,field,value);
 lensDraftEdits=edits;++layoutRevision;clearTimeout(diagTimer);++diagVersion;$('prescription-status').textContent='Validando material e atualizando dispersão…';queueLensLayout(true);
},(index,values)=>{
 if(offlineBusy||recorder||depthBusy||!displayedLensData)return;
 let edits=(lensDraftEdits??settings.lens_edits).filter(([i,f])=>i!==index||!SurfaceGeometry.fields.has(f));
 if(values.shape!==0)for(const [field,value]of Object.entries(values))edits=editListWith(edits,index,field,value);
 lensDraftEdits=edits;++layoutRevision;clearTimeout(diagTimer);++diagVersion;$('prescription-status').textContent='Validando geometria e atualizando raios…';queueLensLayout(true);
});
// One draft transaction per 3D gesture; expensive layout validation runs on release.
let lens3DGesture=null;
lens3D.onManipulate=(stage,event)=>{
 if(stage==='begin'){
  if(offlineBusy||recorder||depthBusy||!displayedLensData||lensDrag||layoutBusy||layoutTimer)return false;
  lens3DGesture={mode:event.mode,index:event.index,data:displayedLensData,focus:settings.focus_m,draft:lensDraftEdits,edits:(lensDraftEdits??settings.lens_edits).map(e=>[...e]),moved:false};
  liveLensEditing=true;clearTimeout(diagTimer);++diagVersion;return true;
 }
 const g=lens3DGesture;if(!g)return;
 if(stage==='move'){
  if(offlineBusy||recorder||depthBusy){lens3D.finishDrag(true);return;}
  if(g.mode==='focus'){settings.focus_m=LensView.focusAfterTranslation(g.data,event.delta);sync();changed('focus_m');g.moved=true;return;}
  const s=g.data.surfaces[g.index],a=s.aperture_diameter/2;let field,value;
  if(g.mode==='diameter'){field='aperture_diameter';value=2*(a+event.delta);if(s.curvature_radius)value=Math.min(value,Math.abs(s.curvature_radius)*1.95);}
  else if(g.mode==='spacing'){field='thickness';value=s.thickness+event.delta;}
  else {field='curvature_radius';const h=a*.65,minimum=Math.max(a*1.022,h+.01),minSag=2000-Math.sqrt(2000**2-h*h),maxSag=minimum-Math.sqrt(minimum**2-h*h),sag=Math.sign(s.curvature_radius)*Math.max(minSag,Math.min(maxSag,Math.abs(lensSag(s.curvature_radius,h)+event.delta*.3)));value=(h*h+sag*sag)/(2*sag);}
  const input=lens3D.inputs.find(i=>i.dataset.field===field);if(!input||input.disabled||!Number.isFinite(value))return;
  if(input.min!=='')value=Math.max(Number(input.min),value);if(input.max!=='')value=Math.min(Number(input.max),value);
  lensDraftEdits=editListWith(g.edits,g.index,field,value);++layoutRevision;g.moved=true;renderLensDiagram(draftDiagram(lensDraftEdits),{draft:true});return;
 }
 lens3DGesture=null;liveLensEditing=false;
 if(stage==='cancel'){lensDraftEdits=g.draft;++layoutRevision;settings.focus_m=g.focus;sync();if(g.mode==='focus')changed('focus_m');renderLensDiagram(g.data,{draft:g.draft!==null});}
 else if(g.moved&&g.mode!=='focus')queueLensLayout(true);
 scheduleKernel();scheduleDiagnostics();
};
const depthModelHost=document.createElement('section');depthModelHost.className='depth-model-panel';$('depth-model').after(depthModelHost);depthModelPanel=new DepthModelPanel(depthModelHost,()=>({info:depthInfo,job:depthJob,index:depthIndex(),busy:depthBusy||offlineBusy||!!recorder}));window.depthModelPanel=depthModelPanel;window.geometryViewer=new SceneGeometry.Viewer(()=>({info:depthInfo,job:depthJob,index:depthIndex(),busy:depthBusy||offlineBusy||!!recorder,settings,previewCanvas:canvas}));geometryViewer.sync();
const depthMappingHost=document.createElement('section');$('depth-controls').before(depthMappingHost);depthInspector=new DepthInspector(depthMappingHost,()=>({gpu,settings,invert:settings.invert_depth,hasDepth:!!depth}),key=>{sync();changed(key);depthInspector.refresh(true);});window.depthInspector=depthInspector;
layers=new LayerPanel($('layer-controls'),()=>({width:sourceW,height:sourceH,epoch:sourceEpoch,busy:depthBusy||offlineBusy||!!recorder}),()=>{animation?.edited();persist();requestDraw();});window.layers=layers;animation=new AnimationTimeline();window.animation=animation;
const wavefrontHost=document.createElement('section');$('lens-3d').after(wavefrontHost);window.wavefrontInspector=new WavefrontInspector(wavefrontHost,()=>({...settings,lens_edits:settings.lens_edits.map(e=>[...e])}));
const ghostsHost=document.createElement('section');wavefrontHost.after(ghostsHost);window.ghostInspector=new ReflectedGhosts.Inspector(ghostsHost,()=>({settings:{...settings,lens_edits:settings.lens_edits.map(e=>[...e])},viewer:gpu,width:sourceW,height:sourceH,epoch:sourceEpoch,depthRevision:gpu?.depthRevision,useDepth:$('use-depth').checked&&!!depth,kind:sourceKind,frame:sourceKind==='video'?video.currentTime:0,busy:depthBusy||offlineBusy||!!recorder}),(value,gain)=>{if(typeof value==='boolean')settings.physical_ghosts=value;if(typeof gain==='number'){settings.ghost_gain=gain;sync();}if(value!==undefined||gain!==undefined)persist();requestDraw();});
const spectralHost=document.createElement('section');wavefrontHost.after(spectralHost);window.spectralPSFInspector=new SpectralPSFInspector(spectralHost,()=>({...settings,lens_edits:settings.lens_edits.map(e=>[...e])}));
const physicalHost=document.createElement('section');$('lens-3d').after(physicalHost);physicalInspector=new PhysicalDistortion.Inspector(physicalHost,value=>{settings.physical_distortion=value;changed('physical_distortion');});canvas.addEventListener('physicalmap',e=>physicalInspector.update(e.detail.data,e.detail.settings,e.detail.width));
new MutationObserver(()=>lens3D.setStatus($('prescription-status').textContent)).observe($('prescription-status'),{childList:true,characterData:true,subtree:true});
$('inspection-plane').onchange=()=>{if(lensDiagramData)renderLensDiagram(LensView.withFocus(lensDiagramData,settings.focus_m,settings.filmback_mm));};
function inspectionReference(){
 const active=$('use-depth').checked&&!!depth,validPick=lastDepthPick?.epoch===sourceEpoch;
 $('inspection-plane').disabled=!active;$('inspection-plane').querySelector('[value=picked]').disabled=!validPick;
 if($('inspection-plane').value==='picked'&&!validPick)$('inspection-plane').value='near';
 if(!active)return {distance:settings.source_m,label:'Plano sem depth'};
 const range=depthRange();
 if($('inspection-plane').value==='picked'){const p=gpu?.prepareDepth(settings,{...range,invert:settings.invert_depth});if(p){const i=Math.min(p.height-1,Math.max(0,Math.floor(lastDepthPick.v*p.height)))*p.width+Math.min(p.width-1,Math.max(0,Math.floor(lastDepthPick.u*p.width)));return {distance:DepthUtils.focusPrepared(p.nearness[i],settings,range,p.statistics.binary),label:'Ponto selecionado'};}}
 return $('inspection-plane').value==='far'?{distance:range.far,label:'Plano distante do depth'}:{distance:range.near,label:'Plano próximo do depth'};
}

function surfaceSectionSag(s,height){return s.shape?SurfaceGeometry.sagGradient(s,height,0)[0]:lensSag(s.curvature_radius,height);}
function lensSag(radius,height){return radius?radius-Math.sign(radius)*Math.sqrt(Math.max(0,radius*radius-height*height)):0;}
function showGlass(){const data=displayedLensData||lensDiagramData,s=data?.surfaces.find(x=>x.index===Number($('glass-surface').value));if(!s)return;for(const [field,id] of glassFields)$(id).value=s[field];$('glass-index').disabled=s.material_spec?.[0]==='sellmeier';$('glass-radius').disabled=s.curvature_radius===0;const base=lensDiagramData?.surfaces[s.index]||s;$('glass-thickness').max=Math.max(20,base.thickness*2);$('glass-diameter').max=Math.max(34,base.aperture_diameter*2);$('glass-thickness').disabled=s.index===data.surfaces.length-1;}
function renderLensDiagram(data,{draft=false,psfs=false}={}){
 data=LensView.fromPrescription(data);
 const inspected=inspectionReference();data={...data,focus_shift_mm:settings.ray_focus?(data.focus_calibration?.shift_mm||0):0};data=LensView.withSource(data,inspected.distance);
 data=LensView.withFocus(data,settings.focus_m,settings.filmback_mm);data=LensView.withAperture(data,settings.iris_mm);
 displayedLensData=data;const irisActiveSign=document.activeElement?.dataset.mode==='iris'?Number(document.activeElement.dataset.sign):0;const focusActive=document.activeElement?.dataset.mode==='focus',svg=diagram,reference=data.reference_sensor_z_mm??data.sensor_z_mm,offset=reference-data.sensor_z_mm,scale=590/(reference+32),X=x=>30+(x+offset+8)*scale,yScale=LensView.diagramYScale(data,settings.iris_mm),Y=y=>95-y*yScale;svg.replaceChildren();
 svg.append(svgEl('line',{x1:10,x2:640,y1:95,y2:95,stroke:'#364039','stroke-dasharray':'3 5'}));
 // Fill each glass interval from its entrance surface to the next interface.
 for(let j=0;j<data.surfaces.length-1;j++){
  const front=data.surfaces[j],back=data.surfaces[j+1];if(front.is_stop||front.nd<=1.00001)continue;
  const points=[];for(let k=0;k<=48;k++){const y=front.aperture_diameter/2*(1-2*k/48);points.push(`${X(front.z+surfaceSectionSag(front,y))},${Y(y)}`);}
  for(let k=0;k<=48;k++){const y=back.aperture_diameter/2*(-1+2*k/48);points.push(`${X(back.z+surfaceSectionSag(back,y))},${Y(y)}`);}
  const selected=Number($('glass-surface').value)===front.index||Number($('glass-surface').value)===back.index;
  svg.append(svgEl('polygon',{points:points.join(' '),class:'glass-volume',fill:selected?'#92c9df':'#63899c','fill-opacity':selected?.5:.3,stroke:'#87b4c4','stroke-width':.6,'pointer-events':'none','data-glass-index':front.index}));
 }
 for(const [i,ray] of (data.rays||[]).entries())if(ray.length>1)svg.append(svgEl('polyline',{points:ray.map(([x,y])=>`${X(x)},${Y(y)}`).join(' '),stroke:data.ray_passed[i]?'#b9efc8':'#65736a','stroke-width':.85,fill:'none',opacity:data.ray_passed[i]?(draft?.45:.58):.16,'data-ray-passed':String(data.ray_passed[i])}));
 const select=$('glass-surface'),selected=select.value;select.replaceChildren();
 for(const s of data.surfaces){
  if(s.is_stop){for(const sign of [-1,1]){svg.append(svgEl('line',{x1:X(s.z),x2:X(s.z),y1:Y(sign*settings.iris_mm),y2:Y(sign*Math.max(17,...data.surfaces.map(row=>row.aperture_diameter/2),settings.iris_mm)+sign*2),stroke:'#e9b989','stroke-width':2}));const handle=svgEl('circle',{cx:X(s.z),cy:Y(sign*settings.iris_mm),r:6,fill:'#e9b989',stroke:'#17251a','data-mode':'iris','data-sign':sign,role:'slider',tabindex:0,'aria-label':'Abrir ou fechar diafragma','aria-valuemin':.5,'aria-valuemax':data.aperture.max_iris_mm||8.55,'aria-valuenow':settings.iris_mm,style:'cursor:ns-resize'});const tip=svgEl('title',{});tip.textContent='Arraste para abrir / fechar a íris';handle.append(tip);handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown'].includes(e.key)||offlineBusy||recorder||depthBusy)return;settings.iris_mm=Math.max(.5,Math.min(data.aperture.max_iris_mm||8.55,settings.iris_mm+(e.key==='ArrowUp'?1:-1)*(e.shiftKey?.5:.05)));sync();changed('iris_mm');e.preventDefault();});svg.append(handle);if(irisActiveSign===sign)handle.focus();}continue;}
  const option=document.createElement('option');option.value=s.index;option.textContent=`${s.index+1} · z ${s.z.toFixed(2)} mm`;select.append(option);
  const a=s.aperture_diameter/2,points=[];for(let i=0;i<=60;i++){const y=-a+2*a*i/60;points.push(`${X(s.z+surfaceSectionSag(s,y))},${Y(y)}`);}
  const shape=points.join(' '),chosen=String(s.index)===selected;
  svg.append(svgEl('polyline',{points:shape,stroke:chosen?'#b9efc8':'#93cbd0','stroke-width':chosen?2.4:1.5,fill:'none','pointer-events':'none'}));
  const hit=svgEl('polyline',{points:shape,stroke:'transparent','stroke-width':13,fill:'none','data-index':s.index,'data-mode':'surface',class:'glass-surface-hit'});svg.append(hit);
 }
 select.value=selected&&[...select.options].some(o=>o.value===selected)?selected:select.options[0]?.value;
 const s=data.surfaces.find(x=>x.index===Number(select.value));
 if(s){const a=s.aperture_diameter/2,mark=(mode,cx,cy,title)=>{const node=svgEl('circle',{cx,cy,r:5.5,'data-index':s.index,'data-mode':mode,class:`glass-handle ${mode}`});const tip=svgEl('title',{});tip.textContent=title;node.append(tip);svg.append(node);};
  mark('diameter',X(s.z+surfaceSectionSag(s,a)),Y(a),'Arrastar para mudar o diâmetro');
  mark('curvature',X(s.z+surfaceSectionSag(s,a*.65)),Y(a*.65),'Arrastar para mudar a curvatura');
  if(s.index>0)mark('spacing',X(s.z),Y(0),'Arrastar para mudar o espaçamento anterior');
 }
 svg.append(svgEl('line',{x1:X(data.sensor_z_mm),x2:X(data.sensor_z_mm),y1:25,y2:165,stroke:'#e9b989','stroke-width':2,'pointer-events':'none'}));
 const focus=data.source_focus_z_mm??data.sensor_z_mm,delta=focus-data.sensor_z_mm;
 svg.append(svgEl('line',{x1:X(focus),x2:X(focus),y1:50,y2:140,stroke:'#93cbd0','stroke-width':1.2,'stroke-dasharray':'4 3','pointer-events':'none'}));
 const label=svgEl('text',{x:X(data.sensor_z_mm)+5,y:23,fill:'#e9b989','font-size':9,'pointer-events':'none'});label.textContent='Sensor';svg.append(label);
 $('focus-status').textContent=`${inspected.label} ${inspected.distance.toFixed(2)} m · `+(Math.abs(delta)<.02?(settings.ray_focus?'Foco compensado no sensor':'Foco paraxial no sensor'):`Foco paraxial ${Math.abs(delta).toFixed(2)} mm ${delta<0?'antes':'depois'} do sensor`)+` · conjunto ${offset>=0?'+':''}${offset.toFixed(2)} mm`+(settings.ray_focus?` · compensação pelos raios ${(data.focus_shift_mm||0).toFixed(3)} mm`:'');
 if(data.focus_matrix){
  const left=X(data.surfaces[0].z)-5,right=X(data.surfaces.at(-1).z)+5,cx=(left+right)/2;
  const handle=svgEl('g',{'data-mode':'focus',class:'focus-drag-handle',role:'slider',tabindex:0,'aria-label':'Mover conjunto da lente para focar','aria-valuemin':.3,'aria-valuemax':20,'aria-valuenow':settings.focus_m,'aria-valuetext':`${settings.focus_m.toFixed(2)} metros`});
  handle.append(svgEl('rect',{x:left,y:167,width:right-left,height:22,rx:4,fill:'#1d3023',stroke:'#65876c'}));
  const text=svgEl('text',{x:cx,y:182,fill:'#b9efc8','text-anchor':'middle','font-size':13,'pointer-events':'none'});text.textContent='↔ Arraste para focar';handle.append(text);svg.append(handle);if(focusActive)handle.focus();
  handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||offlineBusy||recorder)return;settings.focus_m=Math.round(100*LensView.focusAfterTranslation(displayedLensData,(e.key==='ArrowRight'?1:-1)*(e.shiftKey?.5:.05)))/100;sync();changed('focus_m');e.preventDefault();});
 }
 syncAperture();drawFocusDetail(data);
 if(!draft)$('efl').innerHTML=`${data.efl_mm.toFixed(2)} <small>mm</small>`;
 showGlass();renderPrescriptionTable(data);lens3D.update(data,Number(select.value),Object.fromEntries(glassFields.map(([field,id])=>[field,{disabled:$(id).disabled,min:$(id).min,max:$(id).max}])));
 if(psfs&&data.psfs){$('psf-center').src=data.psfs[0].image;$('psf-edge').src=data.psfs[1].image;document.querySelector('.psf-card .note').textContent='PSF de referência da prescrição, sem ampliação, esférica extra ou warp da prévia.';}
}
function renderPrescriptionTable(data){
 const body=$('prescription-table').tBodies[0],key=settings.lens_model+':'+data.surfaces.length;
 if(body.dataset.model!==key){body.replaceChildren();body.dataset.model=key;
  for(const surface of data.surfaces){
   const row=document.createElement('tr');row.dataset.index=surface.index;
   const id=document.createElement('th');id.scope='row';const button=document.createElement('button');button.type='button';button.textContent=surface.is_stop?'Íris':String(surface.index+1);button.title=surface.is_stop?'Plano do diafragma':'Selecionar superfície '+(surface.index+1);button.disabled=!!surface.is_stop;
   button.onclick=()=>{$('glass-surface').value=String(surface.index);renderLensDiagram(displayedLensData,{draft:lensDraftEdits!==null});};id.append(button);row.append(id);
   for(const [field,label] of [['curvature_radius','curvatura'],['thickness','espaçamento'],['aperture_diameter','diâmetro'],['nd','índice']]){
    const cell=document.createElement('td'),input=document.createElement('input');input.type='number';input.step='any';input.dataset.index=surface.index;input.dataset.field=field;input.setAttribute('aria-label',`Superfície ${surface.index+1}: ${label}`);
    input.onfocus=()=>{if(!surface.is_stop&&Number($('glass-surface').value)!==surface.index){$('glass-surface').value=String(surface.index);renderLensDiagram(displayedLensData,{draft:lensDraftEdits!==null});}};
    input.oninput=()=>editPrescriptionCell(input);input.onchange=()=>{editPrescriptionCell(input,true);};cell.append(input);row.append(cell);
   }
   body.append(row);
  }
 }
 const base=data.base_surfaces||lensDiagramData?.surfaces||data.surfaces;
 for(const row of body.rows){const surface=data.surfaces[Number(row.dataset.index)],original=base[surface.index];row.classList.toggle('selected',String(surface.index)===$('glass-surface').value);
  for(const input of row.querySelectorAll('input')){const field=input.dataset.field;const readOnly=(field==='nd'&&surface.material_spec?.[0]==='sellmeier')||(surface.is_stop&&field!=='thickness')||(field==='curvature_radius'&&!original.curvature_radius)||(field==='thickness'&&surface.index===data.surfaces.length-1);input.dataset.readonly=String(readOnly);input.disabled=offlineBusy||!!recorder||depthBusy||readOnly;
   if(field==='curvature_radius'){const bound=Math.max(2000,Math.abs(original.curvature_radius)*2),minimum=surface.aperture_diameter*.511;input.min=original.curvature_radius<0?-bound:minimum;input.max=original.curvature_radius<0?-minimum:bound;}
   else if(field==='thickness'){input.min=original.thickness===0?0:.02;input.max=Math.max(20,original.thickness*2);}
   else if(field==='aperture_diameter'){input.min=4;input.max=Math.min(Math.max(34,original.aperture_diameter*2),surface.curvature_radius?Math.abs(surface.curvature_radius)*1.95:Infinity);}
   else{input.min=1;input.max=2;}
   if(document.activeElement!==input)input.value=Number(surface[field].toFixed(field==='nd'?4:3));
  }
 }
}
function editPrescriptionCell(input,commit=false){
 if(offlineBusy||recorder||depthBusy||input.disabled)return;
 if(input.value===''||!input.checkValidity()){if(commit)$('prescription-status').textContent='Valor fora dos limites desta superfície. Corrija o campo destacado.';return;}
 const index=Number(input.dataset.index),field=input.dataset.field,value=Number(input.value),original=(lensDiagramData.base_surfaces||lensDiagramData.surfaces)[index][field];
 let edits=(lensDraftEdits??settings.lens_edits).map(edit=>[...edit]);
 if(Math.abs(value-draftDiagram(edits).surfaces[index][field])<1e-10)return;
 if(Math.abs(value-original)<1e-10)edits=edits.filter(([i,f])=>i!==index||f!==field);else edits=editListWith(edits,index,field,value);lensDraftEdits=edits;++layoutRevision;clearTimeout(diagTimer);++diagVersion;
 renderLensDiagram(draftDiagram(edits),{draft:true});queueLensLayout(commit);$('prescription-status').textContent='Atualizando vidro, raios e imagem…';
}
function drawFocusDetail(data){
 const svg=$('focus-detail');svg.replaceChildren();const sensor=data.sensor_z_mm,focus=data.source_focus_z_mm??sensor;
 const span=Math.max(2,Math.abs(focus-sensor)*1.25),xmin=sensor-span,xmax=sensor+span,X=x=>20+(x-xmin)/(xmax-xmin)*610;
 const rays=(data.rays||[]).filter(r=>r.length===data.surfaces.length+2).map(r=>{const a=r.at(-2),b=r.at(-1);return {a,slope:(b[1]-a[1])/(b[0]-a[0])};});
 // Hold the vertical scale at full aperture so closing the cone remains visible.
 const referenceRays=LensView.withAperture(data,data.aperture.max_iris_mm||8.55).rays.filter(r=>r.length===data.surfaces.length+2).map(r=>{const a=r.at(-2),b=r.at(-1);return {a,slope:(b[1]-a[1])/(b[0]-a[0])};});
 let radius=.02;for(const r of referenceRays)radius=Math.max(radius,Math.abs(r.a[1]+(xmin-r.a[0])*r.slope),Math.abs(r.a[1]+(xmax-r.a[0])*r.slope));
 const Y=y=>75-y*52/radius;
 svg.append(svgEl('line',{x1:20,x2:630,y1:75,y2:75,stroke:'#364039','stroke-dasharray':'3 5'}));
 for(const r of rays)svg.append(svgEl('line',{x1:X(xmin),x2:X(xmax),y1:Y(r.a[1]+(xmin-r.a[0])*r.slope),y2:Y(r.a[1]+(xmax-r.a[0])*r.slope),stroke:'#b9efc8','stroke-width':1,opacity:.6}));
 for(const [z,title,color,dash] of [[sensor,'Sensor','#e9b989',''],[focus,settings.ray_focus?'Foco compensado':'Foco paraxial','#93cbd0','4 3']]){svg.append(svgEl('line',{x1:X(z),x2:X(z),y1:18,y2:130,stroke:color,'stroke-width':2,'stroke-dasharray':dash}));const t=svgEl('text',{x:X(z)+5,y:title==='Sensor'?15:145,fill:color,'font-size':10});t.textContent=title;svg.append(t);}
 $('focus-detail-caption').textContent=`Plano de referência: ${data.settings.source_m.toFixed(2)} m · janela ±${span.toFixed(2)} mm do sensor · ${rays.length} raios transmitidos · escala vertical fixa`;
}
function drawDiagram(data){
 const minimum=data.focus_min_m??.3;for(const key of ['focus_m','source_m'])for(const id of [key,key+'-range'])$(id).min=minimum.toFixed(4);
 if(settings.focus_m<minimum||settings.source_m<minimum){settings.focus_m=Math.max(settings.focus_m,Math.max(2,minimum));settings.source_m=Math.max(settings.source_m,Math.max(5,minimum));persist();scheduleKernel();scheduleDiagnostics();}
 data={...data,focus_shift_mm:settings.ray_focus?(data.focus_calibration?.shift_mm||0):0};data=LensView.withFocus(data,settings.focus_m,settings.filmback_mm);
document.dispatchEvent(new Event("opticalsettingschange"));lensDiagramData=data;renderLensDiagram(data,{psfs:true});}
function editListWith(base,index,field,value){const map=new Map((base||[]).map(([i,f,v])=>[`${i}:${f}`,[i,f,v]]));map.set(`${index}:${field}`,[index,field,(GlassMaterials.fields.has(field)||SurfaceGeometry.fields.has(field)||field==='nd')?value:Math.round(value*1000)/1000]);return [...map.values()].sort((a,b)=>a[0]-b[0]||a[1].localeCompare(b[1]));}
function draftDiagram(edits){if(!lensDiagramData)return null;const surfaces=lensDiagramData.surfaces.map(s=>({...s}));for(const [index,field,value] of edits)surfaces[index][field]=value;let z=0;for(const s of surfaces){s.z=z;z+=s.thickness;}return LensView.withSurfaces(lensDiagramData,surfaces);}
function queueLensLayout(immediate=false){if(immediate){clearTimeout(layoutTimer);layoutTimer=null;}if(layoutTimer)return;layoutTimer=setTimeout(()=>{layoutTimer=null;updateLensLayout();},immediate?0:110);}
async function updateLensLayout(){if(lensDraftEdits===null){layoutAgain=false;return;}if(layoutBusy){layoutAgain=true;return;}layoutBusy=true;layoutAgain=false;const revision=layoutRevision,edits=lensDraftEdits.map(x=>[...x]);
 try{const data=await post('/api/layout',{settings:{...settings,lens_edits:edits,near_m:.8,far_m:10}});if(revision===layoutRevision){settings.lens_edits=edits;$('prescription-status').textContent='Geometria aplicada · atualizando a imagem na GPU.';lensDiagramData=data;renderLensDiagram(data);persist();scheduleKernel();if(!lensDrag){lensDraftEdits=null;scheduleDiagnostics();}}else layoutAgain=lensDraftEdits!==null;}
 catch(e){if(revision===layoutRevision){lensDraftEdits=null;renderLensDiagram(lensDiagramData);$('prescription-status').textContent='Alteração rejeitada; a última geometria válida foi preservada.';notify(e.message,true);}}finally{layoutBusy=false;if(layoutAgain&&lensDraftEdits!==null)queueLensLayout(true);else layoutAgain=false;}
}
$('glass-surface').onchange=()=>renderLensDiagram(displayedLensData||lensDiagramData,{draft:lensDraftEdits!==null});
function svgPoint(e){const p=diagram.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(diagram.getScreenCTM().inverse());}
diagram.addEventListener('pointerdown',e=>{if(offlineBusy||recorder||!displayedLensData||(e.pointerType==='mouse'&&e.button!==0))return;const irisTarget=e.target.closest('[data-mode="iris"]');if(irisTarget){lensDrag={pointerId:e.pointerId,mode:'iris',start:svgPoint(e),radius:settings.iris_mm,sign:Number(irisTarget.dataset.sign)};liveLensEditing=true;diagram.setPointerCapture(e.pointerId);e.preventDefault();return;}if(e.target.closest('[data-mode="focus"]')&&displayedLensData.focus_matrix){lensDrag={pointerId:e.pointerId,mode:'focus',start:svgPoint(e),data:displayedLensData,scale:LensView.projection(displayedLensData).scale};clearTimeout(diagTimer);++diagVersion;diagram.setPointerCapture(e.pointerId);e.preventDefault();return;}const target=e.target.closest('[data-index]');if(!target)return;const index=Number(target.dataset.index),wasSelected=Number($('glass-surface').value)===index,mode=target.dataset.mode==='surface'?(wasSelected&&index>0?'spacing':'select'):target.dataset.mode;
 $('glass-surface').value=String(index);renderLensDiagram(displayedLensData,{draft:lensDraftEdits!==null});if(mode==='select')return;
 const data=displayedLensData,s=data.surfaces[index],point=svgPoint(e);lensDrag={pointerId:e.pointerId,index,mode,start:point,surface:{...s},previousThickness:data.surfaces[index-1]?.thickness,scale:590/((data.reference_sensor_z_mm??data.sensor_z_mm)+32),edits:(lensDraftEdits??settings.lens_edits).map(x=>[...x])};liveLensEditing=true;clearTimeout(diagTimer);++diagVersion;diagram.setPointerCapture(e.pointerId);e.preventDefault();});
diagram.addEventListener('pointermove',e=>{const drag=lensDrag;if(!drag||e.pointerId!==drag.pointerId)return;const point=svgPoint(e);if(drag.mode==='iris'){settings.iris_mm=LensView.irisAfterDrag(drag.radius,drag.start.y,point.y,drag.sign,displayedLensData.aperture.max_iris_mm||8.55,LensView.diagramYScale(displayedLensData,drag.radius));sync();changed('iris_mm');e.preventDefault();return;}if(drag.mode==='focus'){settings.focus_m=Math.round(100*LensView.focusAfterTranslation(drag.data,(point.x-drag.start.x)/drag.scale))/100;sync();changed('focus_m');e.preventDefault();return;}const s=drag.surface,base=lensDiagramData.surfaces[drag.index],a=s.aperture_diameter/2,dx=(point.x-drag.start.x)/drag.scale,dy=point.y-drag.start.y;let index=drag.index,field,value;
 if(drag.mode==='diameter'){field='aperture_diameter';value=Math.max(4,Math.min(Math.max(34,base.aperture_diameter*2),2*(a-dy/LensView.diagramYScale(displayedLensData)),s.curvature_radius?Math.abs(s.curvature_radius)*1.95:Infinity));}
 else if(drag.mode==='curvature'){field='curvature_radius';const h=a*.65,minimumRadius=Math.max(s.aperture_diameter*.511,h+.01),sagMin=2000-Math.sqrt(2000*2000-h*h),sagMax=minimumRadius-Math.sqrt(minimumRadius*minimumRadius-h*h);let sag=lensSag(s.curvature_radius,h)+dx*.3;sag=Math.sign(s.curvature_radius)*Math.max(sagMin,Math.min(sagMax,Math.abs(sag)));value=(h*h+sag*sag)/(2*sag);}
 else{field='thickness';index--;value=Math.max(.02,Math.min(Math.max(20,lensDiagramData.surfaces[index].thickness*2),drag.previousThickness+dx));}
 const edits=editListWith(drag.edits,index,field,value);if(JSON.stringify(edits)===JSON.stringify(lensDraftEdits))return;lensDraftEdits=edits;++layoutRevision;renderLensDiagram(draftDiagram(edits),{draft:true});queueLensLayout();$('status').textContent='Movendo vidro · atualizando raios e prévia…';e.preventDefault();});
diagram.addEventListener('pointerup',e=>{if(!lensDrag||e.pointerId!==lensDrag.pointerId)return;const focusDrag=lensDrag.mode==='focus';lensDrag=null;liveLensEditing=false;if(diagram.hasPointerCapture(e.pointerId))diagram.releasePointerCapture(e.pointerId);if(focusDrag){scheduleDiagnostics();return;}if(lensDraftEdits!==null)queueLensLayout(true);scheduleKernel();});
diagram.addEventListener('pointercancel',e=>{if(!lensDrag||e.pointerId!==lensDrag.pointerId)return;const drag=lensDrag;lensDrag=null;liveLensEditing=false;if(drag.mode==='iris'){settings.iris_mm=drag.radius;sync();changed('iris_mm');return;}if(drag.mode==='focus'){settings.focus_m=drag.data.settings.focus_m;sync();changed('focus_m');return;}lensDraftEdits=null;++layoutRevision;renderLensDiagram(lensDiagramData);scheduleKernel();});
$('glass-apply').onclick=()=>{try{if(offlineBusy||recorder)throw Error('Aguarde o render terminar.');const index=Number($('glass-surface').value);let edits=(lensDraftEdits??settings.lens_edits).filter(([i,f])=>i!==index||(GlassMaterials.fields.has(f)||SurfaceGeometry.fields.has(f)));for(const [field,id] of glassFields){if($(id).disabled)continue;const value=Number($(id).value);if($(id).value===''||!Number.isFinite(value))throw Error('Preencha todos os valores da superfície.');edits=editListWith(edits,index,field,value);}lensDraftEdits=edits;++layoutRevision;clearTimeout(diagTimer);++diagVersion;renderLensDiagram(draftDiagram(edits),{draft:true});queueLensLayout(true);}catch(e){notify(e.message,true);}};
$('glass-reset').onclick=async()=>{
 if(offlineBusy||recorder||depthBusy)return;const revision=prepareLensReset();$('prescription-status').textContent='Restaurando a prescrição da lente.';
 try{const data=await post('/api/layout',{settings:{...settings,lens_edits:[],near_m:.8,far_m:10}});if(revision!==layoutRevision)return;
  settings.lens_edits=[];lensDraftEdits=null;lensDiagramData=data;renderLensDiagram(data);sync();changed('lens_edits');$('prescription-status').textContent='Prescrição restaurada · atualizando a prévia.';
 }catch(error){if(revision===layoutRevision){$('prescription-status').textContent='Não foi possível restaurar a prescrição.';notify(error.message,true);}}
};
canvas.addEventListener('rendererror',e=>notify(e.detail,true));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&sourceKind==='video'&&!recorder)video.pause();});
async function start(){try{userProfiles=ProfileStore.load(localStorage);}catch(e){notify('Não foi possível ler seus perfis: '+e.message,true);}refreshProfiles();try{const saved=JSON.parse(localStorage.getItem('optica-lab-v02')||'null');if(saved){if(saved.demoRange&&Number.isFinite(saved.demoRange.near)&&Number.isFinite(saved.demoRange.far)&&saved.demoRange.near>=.3&&saved.demoRange.far<=1000&&saved.demoRange.near<saved.demoRange.far)demoRangeSettings=saved.demoRange;const candidate={...defaults,...saved.settings};candidate.filters=ArtisticFilters.validate(candidate.filters);settings=candidate;quality=LensQuality.normalize(saved.quality);exportQuality=qualityModes[saved.exportQuality]?saved.exportQuality:'veryhigh';refreshProfiles(saved.preset||'physical');if(['1920','3840','4096','source'].includes(saved.exportSize))$('export-size').value=saved.exportSize;if([24,25,30,60].includes(saved.fps))$('export-fps').value=String(saved.fps);const selected=userProfiles.find(p=>p.id===$('preset').value);if(selected)$('profile-name').value=selected.name;}}catch{}try{animation.load(animation.validate(JSON.parse(localStorage.getItem('optica-animation-v1')||'null'),settings,layers.configs));}catch(e){notify('Timeline: '+e.message,true);}sync();presetNote();try{const data=await post('/api/layout',{settings:{...settings,near_m:.8,far_m:10}});drawDiagram(LensView.withFocus(data,settings.focus_m,settings.filmback_mm));}catch(e){notify(e.message,true);}try{gpu=new LensGPU(canvas);try{cudaInfo=await CUDARenderer.info();$('cuda-device').textContent=cudaInfo.available?cudaInfo.device:'CUDA indisponível · WebGL ativo';$('render-backend').querySelector('[value=cuda]').disabled=!cudaInfo.available;}catch{}await loadDemo();}catch(e){notify(e.message,true);$('status').textContent='Prévia GPU indisponível';$('busy-overlay').hidden=true;}}

function clearGeneratedDepth(){if(importedDepthVideo){const v=importedDepthVideo.element;v.pause();v.removeAttribute('src');v.load();URL.revokeObjectURL(importedDepthVideo.url);importedDepthVideo=null;}depthJob=null;depthInfo=null;depthFrame=-1;depthLoading=null;depthCache.clear();depthModelPanel?.sync();}
function depthIndex(){const ts=depthInfo?.timestamps;if(ts?.length){let lo=0,hi=ts.length;while(lo<hi){const mid=(lo+hi)>>1;if(ts[mid]<=video.currentTime+.0001)lo=mid+1;else hi=mid;}return Math.max(0,lo-1);}return depthInfo?.fps?Math.min(depthInfo.count-1,Math.max(0,Math.floor(video.currentTime*depthInfo.fps))):0;}
async function ensureDepth(index){
 const job=depthJob,info=depthInfo;if(!info)return;
 if(depthFrame===index)return;
 const key=job+':'+index;
 if(!depthCache.has(key)){
  if(depthLoading?.key===key)return depthLoading.promise;
  const promise=(async()=>{const r=await fetch(`/api/jobs/${job}/depth-${String(index).padStart(6,'0')}.bin`);if(!r.ok)throw Error('Falha ao carregar frame de depth');const values=new Float32Array(await r.arrayBuffer());if(values.length!==info.width*info.height)throw Error('Depth incompleto');depthCache.set(key,values);while(depthCache.size>8)depthCache.delete(depthCache.keys().next().value);})();
  depthLoading={key,promise};await promise;
 }
 if(job!==depthJob)return;
 gpu.uploadDepthFloat(depthCache.get(key),info.width,info.height);depthFrame=index;window.geometryViewer?.sync();
 for(let n=index+1;n<Math.min(index+4,info.count);n++){const nextKey=job+':'+n;if(!depthCache.has(nextKey))fetch(`/api/jobs/${job}/depth-${String(n).padStart(6,'0')}.bin`).then(r=>{if(!r.ok)throw Error('prefetch');return r.arrayBuffer();}).then(b=>{if(job===depthJob&&b.byteLength===info.width*info.height*4){depthCache.set(nextKey,new Float32Array(b));while(depthCache.size>12)depthCache.delete(depthCache.keys().next().value);}}).catch(()=>{});}

 $('depth-image').src=`/api/jobs/${job}/depth-${String(index).padStart(6,'0')}.png`;
}
async function rawPost(path,body){const r=await fetch(path,{method:'POST',body});const data=await r.json();if(!r.ok)throw Error(data.error||'Falha no processamento');return data;}
$('cancel-depth').onclick=async()=>{if(depthJob)await post(`/api/jobs/${depthJob}/cancel`,{});};
$('generate-depth').onclick=async()=>{
 if(offlineBusy||recorder||depthBusy)return;if(complementBusy){notify('Aguarde a instalação dos complementos.',true);return;}depthBusy=true;const epoch=sourceEpoch;let id;
 try{
  video.pause();recordLock(true);$('cancel-depth').hidden=false;
  const result=await post('/api/jobs/depth',{model:$('depth-model').value,kind:sourceKind==='video'?'video':'image',...depthModelPanel.options()});id=result.id;depthJob=id;
  let file=mediaFile;
  if(!file){const c=document.createElement('canvas');c.width=sourceW;c.height=sourceH;c.getContext('2d').drawImage(source,0,0);file=await new Promise(resolve=>c.toBlob(resolve,'image/png'));}
  $('depth-progress').textContent='Enviando mídia ao motor local…';await rawPost(`/api/jobs/${id}/upload`,file);await post(`/api/jobs/${id}/run`,{});
  while(true){
   const r=await fetch(`/api/jobs/${id}/status`);const state=await r.json();$('depth-progress').textContent=state.message||state.state;
   if(state.state==='error')throw Error(depthModelPanel?.formatError(state)||state.error);
   if(state.state==='cancelled')throw Error('Geração cancelada.');
   if(state.state==='complete'){
    if(epoch!==sourceEpoch)throw Error('A mídia mudou durante a geração');
    if(settings.near_m>=settings.far_m){settings.near_m=.8;settings.far_m=10;sync();persist();state.message+=' Faixa de distância inválida restaurada para 0,8–10 m.';}
    clearGeneratedDepth();depthJob=id;Object.assign(settings,{invert_depth:false,depth_channel:'r',depth_gain:1,depth_bias:0,depth_normalize:'off',depth_curve:1,depth_mapping:'inverse',depth_units:state.units==='meters'?'meters':'relative'});sync();persist();depthInfo=state;depthFrame=-1;depth={generated:true};await ensureDepth(depthIndex());$('use-depth').checked=true;
    $('depth-caption').textContent='Depth por frame · '+state.model;$('depth-file-name').textContent=`${state.count} mapa(s), ${state.width} × ${state.height} · ${state.units==='meters'?'Z métrico estimado':'escala relativa global'}`;depthModelPanel.refresh();
    notify(state.message);requestDraw();break;
   }
   await new Promise(resolve=>setTimeout(resolve,700));
  }
 }catch(e){notify(e.message,true);$('depth-progress').textContent=e.message;}
 finally{depthBusy=false;recordLock(false);$('cancel-depth').hidden=true;}
};
async function seekFrame(t){
 if(Math.abs(video.currentTime-t)<.000001&&video.readyState>=2)return;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(Error('Tempo excedido ao buscar frame do vídeo'));},15000);const done=()=>{cleanup();resolve();};const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);};video.addEventListener('seeked',done);video.currentTime=t;});
}
$('cancel-job').onclick=()=>{cancelOffline=true;};
$('export-video').onclick=async()=>{
 if(animation.data.tracks.length)return animation.export();
 if(offlineBusy||depthBusy||recorder||sourceKind!=='video')return;let id;const oldTime=video.currentTime;
 try{
  if(kernelBusy||kernelTimer)throw Error('Aguarde a atualização da lente.');
  offlineBusy=true;cancelOffline=false;video.pause();recordLock(true);$('cancel-job').hidden=false;
  const fps=Number($('export-fps').value),total=Math.ceil(video.duration*fps);if(!Number.isFinite(total)||total<1)throw Error('Duração de vídeo inválida.');
  const mode=exportMode();if(depthInfo&&$('use-depth').checked)await ensureDepth(depthIndex());const size=await draw(mode);if(!size)throw Error('Falha ao preparar render.');
  ({id}=await post('/api/jobs/video',{width:size.width,height:size.height,fps}));
  for(let i=0;i<total;i++){
   if(cancelOffline)throw Error('Exportação cancelada.');
   await seekFrame(Math.min(i/fps,Math.max(0,video.duration-.001)));
   if(depthInfo&&$('use-depth').checked)await ensureDepth(depthIndex());
   if(!await draw(mode))throw Error('Falha no frame '+i);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Falha ao capturar frame');
   await rawPost(`/api/jobs/${id}/frame`,blob);
   $('status').textContent=`Exportando MP4: ${i+1}/${total} · ${Math.round((i+1)/total*100)}%`;
  }
  const result=await post(`/api/jobs/${id}/finish`,{});download(result.url,'optica-lab-video.mp4');id=null;notify(`MP4 pronto: ${size.width} × ${size.height}, ${fps} fps. Sem áudio.`);
 }catch(e){if(id)await post(`/api/jobs/${id}/cancel`,{}).catch(()=>{});notify(e.message,true);}
 finally{await seekFrame(oldTime).catch(()=>{});offlineBusy=false;recordLock(false);$('cancel-job').hidden=true;requestDraw();}
};
start();






let complementBusy=false,complementTimer;
async function refreshComplements(){
 try{
  const response=await fetch('/api/complements/status');if(!response.ok)throw Error('Falha ao consultar complementos');const state=await response.json();
  complementBusy=['starting','downloading','installing','validating'].includes(state.state);
  $('install-complements').disabled=complementBusy||state.installed||depthBusy;
  $('install-complements').textContent=state.installed?'Complementos instalados':'Instalar complementos';
  $('cancel-complements').hidden=!complementBusy;$('complements-bar').hidden=!complementBusy;$('complements-bar').value=state.percent||0;
  $('complements-progress').textContent=state.message+(complementBusy?' ('+(state.percent||0)+'%)':'');
  if(complementBusy){clearTimeout(complementTimer);complementTimer=setTimeout(refreshComplements,800);}
  return state;
 }catch(e){$('complements-progress').textContent=e.message;}
}
$('install-complements').onclick=async()=>{
 if(complementBusy||depthBusy||offlineBusy||recorder)return;
 try{await post('/api/complements/install',{});await refreshComplements();}catch(e){$('complements-progress').textContent=e.message;notify(e.message,true);}
};
$('cancel-complements').onclick=async()=>{try{await post('/api/complements/cancel',{});await refreshComplements();}catch(e){notify(e.message,true);}};
refreshComplements();

for(const look of LensCharacterLooks.catalog){const option=document.createElement('option');option.value=look.id;option.textContent=look.name;$('character-look').append(option);}
function applyCharacterLook(id){if(offlineBusy||recorder||depthBusy)return;settings=LensCharacterLooks.apply(settings,id);sync();document.dispatchEvent(new Event('opticalsettingschange'));persist();scheduleKernel();requestDraw();scheduleDiagnostics();}
$('apply-character-look').onclick=()=>applyCharacterLook($('character-look').value);
$('reset-character-look').onclick=()=>{$('character-look').value='clean';applyCharacterLook('clean');};
