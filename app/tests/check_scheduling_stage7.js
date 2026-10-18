const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8889');
  const idle=()=>page.waitForFunction(()=>atlas&&!kernelBusy&&!kernelTimer&&!drawTask&&!drawPending&&canvas.dataset.previewStage==='final',null,{timeout:120000});
  await idle();
  await page.evaluate(()=>{
   window.s7={frames:[],presented:[],requests:[],uploads:[]};
   const change=(id,value,event='input')=>{const n=document.getElementById(id);n.value=value;n.dispatchEvent(new Event(event,{bubbles:true}));};s7.change=change;
   s7.webgl=gpu.draw.bind(gpu);gpu.draw=(s,o)=>{s7.frames.push({focus:s.focus_m,stage:o.stage,samples:o.samples});return s7.webgl(s,o);};
   s7.present=gpu.presentCUDA.bind(gpu);gpu.presentCUDA=(pixels,s,o)=>{s7.presented.push({focus:s.focus_m,samples:o.samples});return s7.present(pixels,s,o);};
   change('render-backend','webgl','change');change('viewer-resolution','360','change');
  });await idle();
  // Hold preparation, then deliver a burst through the actual numeric input handlers.
  await page.evaluate(()=>{
   s7.frames=[];s7.prepare=gpu.prepareDirt.bind(gpu);s7.preparing=0;s7.maxPreparing=0;s7.prepareCalls=0;
   const gate=new Promise(resolve=>s7.releasePrepare=resolve);
   gpu.prepareDirt=async texture=>{s7.preparing++;s7.maxPreparing=Math.max(s7.maxPreparing,s7.preparing);if(++s7.prepareCalls===1)await gate;try{return await s7.prepare(texture);}finally{s7.preparing--;}};
   s7.change('focus_m','1');
  });
  await page.waitForFunction(()=>s7.prepareCalls===1&&!!drawTask);
  await page.evaluate(()=>{for(let i=0;i<40;i++)s7.change('focus_m',String(1.1+i*.02));});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>s7.prepareCalls),1);
  await page.evaluate(()=>s7.releasePrepare());await idle();
  const prep=await page.evaluate(()=>({maxPreparing:s7.maxPreparing,frames:s7.frames,focus:settings.focus_m,stats:{...schedulingStats}}));
  assert.equal(prep.maxPreparing,1);assert(prep.frames.length<=3);assert(prep.frames.every(f=>f.focus===prep.focus));assert.equal(prep.frames.at(-1).stage,'final');
  assert.equal(prep.frames.at(-1).samples,96);
  await page.evaluate(()=>gpu.prepareDirt=s7.prepare);
  // Delay an interactive atlas: an obsolete result must never upload, even while dragging.
  await page.evaluate(()=>{
   s7.atlas=requestLensAtlas;s7.setKernel=gpu.setKernel.bind(gpu);gpu.setKernel=data=>{s7.uploads.push({iris:data.iris_mm,taps:data.taps});return s7.setKernel(data);};
   s7.atlasCalls=0;const gate=new Promise(resolve=>s7.releaseAtlas=resolve);
   requestLensAtlas=async body=>{s7.atlasCalls++;if(s7.atlasCalls===1){s7.firstBody=body;const data=await s7.atlas(body);s7.atlasHeld=true;await gate;return data;}return s7.atlas(body);};
   liveLensEditing=true;s7.change('iris_mm','6');
  });await page.waitForFunction(()=>s7.atlasHeld,null,{timeout:120000});
  await page.evaluate(()=>{
   for(let i=0;i<30;i++)s7.change('iris_mm',String(5+i*.01));
   try{exportMode();s7.exportBlocked=false;}catch{s7.exportBlocked=true;}
   // A refresh requested during a busy job must survive coalescing.
   updateKernel(true);
  });await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>s7.atlasCalls),1);
  await page.evaluate(()=>s7.releaseAtlas());
  await page.waitForFunction(()=>!kernelBusy&&!kernelTimer&&appliedAtlasSignature===signature(),null,{timeout:120000});
  const optical=await page.evaluate(()=>({calls:s7.atlasCalls,uploads:s7.uploads,blocked:s7.exportBlocked,iris:settings.iris_mm,stats:{...schedulingStats}}));
  assert.equal(optical.calls,2);assert.equal(optical.uploads.length,1);assert.equal(optical.uploads[0].iris,optical.iris);assert(optical.blocked);assert(optical.stats.staleAtlases>=1);
  // Releasing the editor restores the configured full atlas, not the 64-tap preview.
  await page.evaluate(()=>{liveLensEditing=false;scheduleKernel();});await idle();
  const full=await page.evaluate(()=>({taps:atlas.taps,required:requiredTaps(),mode:exportMode()}));assert.equal(full.taps,full.required);
  await page.evaluate(()=>{requestLensAtlas=s7.atlas;gpu.setKernel=s7.setKernel;});
  // Two explicit refreshes, with no settings change, must produce two jobs.
  await page.evaluate(()=>{
   s7.refreshCalls=0;const gate=new Promise(resolve=>s7.releaseRefresh=resolve);
   requestLensAtlas=async body=>{if(++s7.refreshCalls===1){const data=await s7.atlas(body);s7.refreshHeld=true;await gate;return data;}return s7.atlas(body);};
   updateKernel(true);
  });await page.waitForFunction(()=>s7.refreshHeld,null,{timeout:120000});
  await page.evaluate(()=>{updateKernel(true);s7.releaseRefresh();});
  await page.waitForFunction(()=>s7.refreshCalls===2&&!kernelBusy&&!kernelTimer,null,{timeout:120000});await idle();
  await page.evaluate(()=>requestLensAtlas=s7.atlas);
  // Continuous input may defer work by 90 ms, but never indefinitely.
  const debounce=await page.evaluate(async()=>{
   const original=updateKernel,started=performance.now(),jobs=[];
   updateKernel=async()=>jobs.push({ms:performance.now()-started,value:s7.burstValue});
   for(let i=0;i<15;i++){s7.burstValue=i;scheduleKernel();await new Promise(resolve=>setTimeout(resolve,20));}
   await new Promise(resolve=>setTimeout(resolve,120));updateKernel=original;return jobs;
  });assert(debounce.length>=2&&debounce.length<=3);assert(debounce[0].ms<260);assert.equal(debounce.at(-1).value,14);
  const cuda=await page.evaluate(()=>!!cudaInfo?.available);
  if(cuda){
   // A source upload can finish after an edit: do not dispatch that obsolete render.
   await page.evaluate(()=>{
    s7.fetch=window.fetch.bind(window);s7.requests=[];s7.presented=[];
    const gate=new Promise(resolve=>s7.releaseSource=resolve);s7.sourceHold=true;
    window.fetch=async(url,options)=>{const p=String(url);if(p==='/api/cuda/render')s7.requests.push(JSON.parse(options.body));const response=await s7.fetch(url,options);if(p==='/api/cuda/source'&&s7.sourceHold){s7.sourceHold=false;s7.sourceHeld=true;await gate;}return response;};
    cudaRenderer=null;s7.change('focus_m','3');s7.change('render-backend','cuda','change');
   });await page.waitForFunction(()=>s7.sourceHeld,null,{timeout:120000});
   await page.evaluate(()=>{for(let i=0;i<20;i++)s7.change('focus_m',String(3.1+i*.03));s7.releaseSource();});await idle();
   const upload=await page.evaluate(()=>({requests:s7.requests.map(r=>r.settings.focus_m),presented:s7.presented,focus:settings.focus_m}));
   assert(upload.requests.length>0);assert(upload.requests.every(f=>f===upload.focus));assert(upload.presented.every(f=>f.focus===upload.focus));
   // Delay an actual render response; only the latest state may reach presentCUDA.
   await page.evaluate(()=>{
    s7.requests=[];s7.presented=[];s7.renderHold=true;s7.staleReadbacks=0;const gate=new Promise(resolve=>s7.releaseRender=resolve);
    window.fetch=async(url,options)=>{const p=String(url);if(p==='/api/cuda/render')s7.requests.push(JSON.parse(options.body));const response=await s7.fetch(url,options);if(p==='/api/cuda/render'&&s7.renderHold){s7.renderHold=false;s7.renderHeld=true;const read=response.arrayBuffer.bind(response);response.arrayBuffer=()=>{s7.staleReadbacks++;return read();};await gate;}return response;};
    s7.change('focus_m','4');
   });await page.waitForFunction(()=>s7.renderHeld,null,{timeout:120000});
   await page.evaluate(()=>{for(let i=0;i<35;i++)s7.change('focus_m',String(4.1+i*.02));});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>s7.requests.length),1);
   await page.evaluate(()=>s7.releaseRender());await idle();
   const latest=await page.evaluate(()=>({requests:s7.requests.map(r=>r.settings.focus_m),presented:s7.presented,focus:settings.focus_m}));
   assert(latest.presented.length>0);assert(latest.presented.every(f=>f.focus===latest.focus));assert(latest.requests.length<=4);
   assert.equal(await page.evaluate(()=>s7.staleReadbacks),0);
   await page.evaluate(()=>window.fetch=s7.fetch);
  }
  // Export waits for the entire preparation/render task; it uses full export sampling.
  await page.evaluate(()=>{
   s7.prepareCalls=0;s7.exports=[];const gate=new Promise(resolve=>s7.releaseExport=resolve);
   gpu.prepareDirt=async texture=>{if(++s7.prepareCalls===1){s7.exportHeld=true;await gate;}return s7.prepare(texture);};
   s7.change('export-size','source','change');s7.change('focus_m','5');
  });await page.waitForFunction(()=>s7.exportHeld&&!!drawTask);
  await page.evaluate(()=>{s7.exportDone=false;s7.exportPromise=draw(exportMode()).then(result=>{s7.exportDone=true;s7.exportResult=result;});});
  await page.waitForTimeout(100);assert(!await page.evaluate(()=>s7.exportDone));
  await page.evaluate(()=>s7.releaseExport());await page.waitForFunction(()=>s7.exportDone,null,{timeout:120000});
  const output=await page.evaluate(()=>({samples:s7.exportResult.samples,expected:qualityModes[exportQuality].samples,stage:canvas.dataset.previewStage}));
  assert.equal(output.samples,output.expected);assert.equal(output.stage,'export');
  await page.evaluate(()=>gpu.prepareDirt=s7.prepare);
  assert.deepEqual(errors,[]);
  const result={serializedPreparation:true,burstInputs:40,onlyLatestWebGLFrame:true,finalPreviewSamples:96,staleInteractiveAtlasDiscarded:true,atlasBurstRequests:optical.calls,queuedRefreshPreserved:true,boundedDebounce:debounce,exportBlockedWithPendingAtlas:true,fullAtlasRestored:full,cuda:{available:cuda,staleUploadAvoidsDispatch:cuda,staleRenderAvoidsReadbackAndPresentation:cuda},export:output,stats:await page.evaluate(()=>({...schedulingStats})),errors};
  fs.writeFileSync(path.join(__dirname,'../research/scheduling-stage7-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
