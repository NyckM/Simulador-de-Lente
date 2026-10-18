const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'msedge',executablePath:process.env.OPTICA_EDGE_EXECUTABLE||undefined,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));if(process.env.OPTICA_FORCE_WEBGL)await p.route('**/api/cuda/info',route=>route.fulfill({json:{available:false}}));await p.goto(process.env.OPTICA_TEST_URL);await p.waitForFunction(()=>gpu?.ready&&!kernelBusy&&!kernelTimer&&!drawTask,null,{timeout:180000});
 const r=await p.evaluate(async()=>{
  offlineBusy=true;
  const fixture=new Float32Array(32*24*4);for(let i=3;i<fixture.length;i+=4)fixture[i]=1;for(const [x,y]of [[5,6],[25,18]])for(let j=y;j<y+2;j++)for(let i=x;i<x+2;i++)fixture.set([8,6,3,1],(j*32+i)*4);
  const sources=ReflectedGhosts.detectSources(fixture,32,24,.8,4);if(sources.length!==2)throw Error('source detection');fixture.fill(0);const invisible=ReflectedGhosts.detectSources(fixture,32,24,.8,4);
  settings.physical_ghosts=true;settings.ghost_gain=15;ghostInspector.mode='auto';ghostInspector.limit=2;ghostInspector.threshold=.5;ghostInspector.invalidate();
  await draw({limit:256,samples:32,aa:1});const first=ghostInspector.data,withFlare=canvas.toDataURL();
  settings.ghost_gain=0;await draw({limit:256,samples:32,aa:1});const zero=canvas.toDataURL();settings.physical_ghosts=false;await draw({limit:256,samples:32,aa:1});const bypass=canvas.toDataURL();
  settings.physical_ghosts=true;settings.ghost_gain=15;await draw({limit:256,samples:32,aa:1});const restore=canvas.toDataURL();
  settings.coating_strength=1;ghostInspector.invalidate();await draw({limit:256,samples:32,aa:1});const coated=ghostInspector.data;
  const sum=d=>d.families.reduce((a,f)=>a+f.channels.reduce((b,c)=>b+c.energy_fraction,0),0);
  settings.blades=5;settings.iris_mm=3;ghostInspector.invalidate();await draw({limit:256,samples:32,aa:1});const iris=ghostInspector.data;
  const config=ghostInspector.config();ReflectedGhosts.Inspector.parse(config);let invalid=false;try{ReflectedGhosts.Inspector.parse({...config,limit:99});}catch{invalid=true;}
  const old=ReflectedGhosts.Inspector.parse({uv:[.5,.5],samples:1024,pairs:16});
  await draw({limit:384,samples:32,aa:1,upscale:true});const exported=ghostInspector.isCurrent(),gl=gpu.gl.getError();
  const host=document.createElement('section');document.body.append(host);const plate=new Float32Array(32*24*4);for(let i=3;i<plate.length;i+=4)plate[i]=1;plate.set([8,6,3,1],(12*32+24)*4);let frame=1;
  const state={settings:{...defaults,physical_ghosts:true,ghost_gain:1},viewer:{nativeSource:{linear:plate}},width:32,height:24,epoch:1,kind:'video',busy:true};
  const inspector=new ReflectedGhosts.Inspector(host,()=>({...state,frame}),()=>{});inspector.mode='auto';inspector.limit=1;inspector.host.querySelector('.rg-pairs').value='8';await inspector.ensure();const lit=inspector.data.sources.length;
  plate.fill(0);frame=2;await inspector.ensure();const dark=inspector.data.sources.length;
  // Invalidate while a real trace is in flight; the old response must not become current.
  plate.set([8,6,3,1],(12*32+24)*4);frame=3;const pending=inspector.ensure().catch(()=>{});inspector.invalidate();await pending;const stale=!inspector.current;await inspector.ensure();const fresh=inspector.isCurrent();host.remove();
  return {sources:sources.length,alpha_blocked:invisible.length===0,automatic:!!first.sources?.length,changed:withFlare!==zero,zero_exact:zero===bypass,restore_exact:restore===withFlare,coatings_change_paths:first.ghost_id!==coated.ghost_id,coatings_reduce_energy:sum(coated)<sum(first),iris_shared:iris.configuration.blades===5&&iris.configuration.iris_mm===3,export_current:exported,invalid_config:invalid,legacy_selected:old.mode==='selected',frame_visibility:lit===1&&dark===0,stale_response_rejected:stale&&fresh,gl_error:gl,backend:cudaRenderer?.stats?.backend||'webgl',config};
 });console.log(r);for(const k of ['alpha_blocked','automatic','changed','zero_exact','restore_exact','coatings_change_paths','coatings_reduce_energy','iris_shared','export_current','invalid_config','legacy_selected','frame_visibility','stale_response_rejected'])assert(r[k],k);assert.equal(r.gl_error,0);assert.deepEqual(errors,[]);fs.writeFileSync('research/lens-flare-v1-'+(process.env.OPTICA_FORCE_WEBGL?'webgl':'cuda')+'-validation.json',JSON.stringify({...r,passed:true,errors},null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
