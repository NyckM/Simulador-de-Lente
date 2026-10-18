const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const panelRoot=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'panel');
const {pack,canvasPixels,cleanProfile}=require(path.join(panelRoot,'protocol.js')),adapter=require(path.join(panelRoot,'adapter.js')),meta=require(path.join(panelRoot,'controls.json'));
let checks=0;function check(condition,label){assert(condition,label);checks++;console.log('PASS '+label);}
function pixelsData(components=4,depth=false){let disposed=false;return {data:{width:2,height:1,components,componentSize:depth?16:32,colorSpace:'RGB',colorProfile:'sRGB IEC61966-2.1 (Linear RGB Profile)',getData:async()=>depth?new Uint16Array([16384,16384,16384,32768,32768,32768,32768,32768]):new Float32Array(components===4?[3,2,1,.5,0,0,0,0]:[3,2,1,0,0,0]),dispose(){disposed=true;}},get disposed(){return disposed;}};}
let img=pixelsData();let padded=canvasPixels(new Float32Array([3,2,1,.5,0,0,0,0]),img.data,{left:1,top:1},4,3,null);check(padded[20]===3&&padded[23]===.5&&padded[0]===0,'Crop placed at original document origin');
let gray=pixelsData(4,true);let depth=canvasPixels(new Uint16Array([16384,16384,16384,32768,32768,32768,32768,32768]),gray.data,{left:0,top:0},2,1,4);check(depth[0]===.5&&depth[1]===1,'Depth uses normalized encoded 16-bit values');
check(cleanProfile(img.data.colorProfile)==='sRGB IEC61966-2.1','Linear profile suffix removed for output API');
const rgba=new Float32Array(8),params=meta.controls.reduce((p,c)=>(p[c.index]=c.default,p),Array(meta.count).fill(0));let binary=pack(2,1,params,rgba,new Float32Array(2));let view=new DataView(binary);check(meta.count===105&&view.getUint32(0,true)===0x53505842&&view.getUint32(16,true)===meta.count,'Protocol header matches native ABI');check(binary.byteLength===28+meta.count*8+40,'Binary body exact length');
assert.throws(()=>pack(9000,1,params,new Float32Array(36000),null));checks++;
async function testApply(mode){
 let source=pixelsData(),map=pixelsData(4,true),put=false,resumed=null,created=false,outputDisposed=false,suspended=false,events=[];
 const doc={id:3,width:2,height:1,activeHistoryState:{id:9},createPixelLayer:async options=>{created=true;assert(options.name.includes('Helios'));return{id:100};}};
 const ps={app:{activeDocument:doc},imaging:{getPixels:async options=>{events.push(options);return{imageData:options.layerID===11?source.data:map.data,sourceBounds:{left:0,top:0,right:2,bottom:1},level:0};},createImageDataFromBuffer:async(data,options)=>{assert.equal(options.components,4);assert.equal(options.colorProfile,'sRGB IEC61966-2.1');return {dispose(){outputDisposed=true;}};},putPixels:async options=>{if(mode==='put-error')throw Error('Write error');assert.equal(options.layerID,100);put=true;}},core:{executeAsModal:async cb=>cb({hostControl:{suspendHistory:async()=>{suspended=true;return 5;},resumeHistory:async(id,commit)=>{assert.equal(id,5);resumed=commit;}}})}};
 const fetcher=async(url,options)=>{
  if(url.endsWith('/api/info'))return{ok:true,json:async()=>({plugin:'BruxosdovfxPhotoshop',protocol:1,parameterCount:meta.count})};
  if(mode==='server-error')return{ok:false,text:async()=>'CUDA unavailable'};
  if(mode==='changed')doc.activeHistoryState.id=10;
  const header=new DataView(options.body);assert.equal(header.getUint32(20,true),1);
  return{ok:true,arrayBuffer:async()=>new Float32Array(8).buffer};
 };
 const opts={sourceID:11,depthID:22,useDepth:true,channel:4,profileName:'Helios',progress:()=>{}};
 if(mode==='good'){const id=await adapter.apply(ps,fetcher,params,opts);check(id===100&&put&&created&&resumed===true,'Apply creates output layer and commits one history group');check(events[0].componentSize===32&&events[1].componentSize===16,'Source linear HDR and depth encoded values requested');}
 else{await assert.rejects(()=>adapter.apply(ps,fetcher,params,opts));check(mode==='put-error'?resumed===false:!created,'Failed '+mode+' leaves original intact');}
 check(source.disposed&&map.disposed,'Input Imaging buffers disposed: '+mode);if(mode==='good'||mode==='put-error')check(outputDisposed,'Output Imaging buffer disposed: '+mode);
}
class Element{
 constructor(tag,document){this.tagName=tag;this.document=document;this.children=[];this.events={};this.value='';this.checked=false;this.selectedIndex=0;this.hidden=false;this.attrs={};this.textContent='';}
 set id(x){this._id=x;this.document.elements[x]=this;}get id(){return this._id;}
 set innerHTML(x){this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}appendChild(e){this.children.push(e);}
 addEventListener(event,handler){this.events[event]=handler;}
 focus(){this.document.activeElement=this;}
 async fire(event,data={}){if(this.events[event])await this.events[event]({target:this,...data});await new Promise(r=>setImmediate(r));}
}
async function panelTest(){
 const document={elements:{},getElementById(id){return this.elements[id];},createElement(tag){return new Element(tag,this);}};
 for(const id of ['status','search','profile','controls','source','depth','apply','start','refresh','reset','saveProfile','profileName','removeProfile','quit','tabs','tabViewport','panel-SOURCES','panel-LENS_GROUP']){const e=document.createElement('div');e.id=id;}
 let saved='',registration;
 const legacy=params.slice(0,71);legacy[meta.controls.find(c=>c.id==='FOCUS').index]=3;
 const file={read:async()=>JSON.stringify({params:legacy,custom:[{name:'Legacy',params:legacy}],selection:0}),write:async s=>{saved=s;}};const folder={getEntry:async()=>file,createFile:async()=>file};
 const ps={app:{activeDocument:{layers:[{id:11,name:'Image'},{id:22,name:'Depth'}],activeLayers:[{id:11}]}}};
 const uxp={storage:{localFileSystem:{getDataFolder:async()=>folder}},entrypoints:{setup(x){registration=x;}}};
 const context={document,require(name){if(name==='photoshop')return ps;if(name==='uxp')return uxp;if(name==='./controls.json')return meta;if(name==='./adapter.js')return adapter;if(name==='./tabs.js')return require(path.join(panelRoot,'tabs.js'));if(name==='./i18n.js')return require(path.join(panelRoot,'i18n.js'));if(name==='./localization.json')return require(path.join(panelRoot,'localization.json'));throw Error(name);},fetch:async()=>{},setTimeout,console};
 vm.runInNewContext(fs.readFileSync(path.join(panelRoot,'main.js'),'utf8'),context);await new Promise(r=>setImmediate(r));
 check(!!registration.panels.desfoque,'UXP panel entry point registered');check(document.elements.controls.children.length===meta.groups.length-1&&document.elements.tabs.children.length===meta.groups.length+1,'All tabs include filters and lens flare');check(meta.controls.every(c=>c.id==='PRESET'||document.elements[c.id]),'Every editing control built');
 check(document.elements.FOCUS.value==='3'&&document.elements.POST_X.value==='50'&&!document.elements.FLARE_ENABLED.checked,'Legacy profile migration preserves focus and defaults new effects off');
 const panels=['SOURCES',...meta.groups.map(g=>g.id)].map(id=>document.elements['panel-'+id]);check(panels.filter(p=>!p.hidden).length===1&&!panels[0].hidden,'Only input tab initially visible');
 const viewport=document.elements.tabViewport;viewport.scrollTop=25;await document.elements['tab-FOCUS_GROUP'].fire('click');check(panels.filter(p=>!p.hidden).length===1&&!document.elements['panel-FOCUS_GROUP'].hidden,'Switch tab hides other sections');viewport.scrollTop=80;
 const focusControl=document.elements.FOCUS;focusControl.value='4';await focusControl.fire('change');await document.elements['tab-SOURCES'].fire('click');check(viewport.scrollTop===25&&focusControl.value==='4','Tab change preserves values and input scroll');await document.elements['tab-FOCUS_GROUP'].fire('click');check(viewport.scrollTop===80,'Each tab remembers its scroll position');
 await document.elements['tab-FOCUS_GROUP'].fire('keydown',{key:'ArrowRight',preventDefault(){}});check(document.activeElement.id==='tab-DEPTH_GROUP'&&!document.elements['panel-DEPTH_GROUP'].hidden,'Keyboard tab navigation updates focus and panel');
 focusControl.value='2';await focusControl.fire('change');
 const search=document.elements.search;search.value='Helios';await search.fire('input');const menu=document.elements.profile.children[0];check(menu.children.some(e=>e.textContent.includes('Helios-44')),'Search filters lens presets');
 document.elements.profile.selectedIndex=0;await document.elements.profile.fire('change');check(Number(document.elements.SWIRL_PARAM.value)>.5,'Selecting Helios restores its optical settings');
 document.elements.profileName.value='Minha Helios';await document.elements.saveProfile.fire('click');check(JSON.parse(saved).custom[1].name==='Minha Helios'&&JSON.parse(saved).custom[0].params.length===105,'Custom optical profile persisted and legacy custom profile migrated');
 document.elements.FOCUS.value='4';await document.elements.FOCUS.fire('change');await document.elements.reset.fire('click');check(document.elements.FOCUS.value==='2','Custom reset restores saved configuration');
 document.elements.FOCUS.value='-1';await document.elements.FOCUS.fire('change');check(document.elements.FOCUS.value==='2','UI rejects out-of-range focus');
}
(async()=>{for(const mode of ['good','server-error','changed','put-error'])await testApply(mode);await panelTest();fs.writeFileSync(path.join(__dirname,'validation/adapter-results.json'),JSON.stringify({checks,realPhotoshopHostTested:false},null,2));console.log('RESULT '+checks+' checks');})().catch(e=>{console.error(e);process.exitCode=1;});

