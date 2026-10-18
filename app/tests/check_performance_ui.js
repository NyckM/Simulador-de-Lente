const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8885');
  await page.waitForFunction(()=>typeof performancePanel!=='undefined'&&performancePanel.atlas&&performancePanel.latest,null,{timeout:120000});
  const panel=page.locator('#performance-panel');await panel.locator('summary').click();
  const initial=await page.evaluate(()=>performancePanel.snapshot());
  assert(initial.frame.wall_ms>=0&&initial.atlas.lookup_ms>=0);assert(initial.atlas.prescription_id);
  for(const [lang,title] of [['en','Performance'],['zh-CN','性能'],['pt-BR','Desempenho']]){
   await page.locator('#app-language').selectOption(lang);await page.waitForFunction(title=>document.querySelector('#performance-panel summary').textContent===title,title);
  }
  // This explicit bench uses readback and synchronization; production profiling does not.
  const bench=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=c.height=32;document.body.append(c);const v=new LensGPU(c);
   const n=32*32,rgba=new Float32Array(n*4),depth=new Float32Array(n);
   for(let i=0;i<n;i++){rgba.set([.25,.5,2,(i%32)<16?.5:1],i*4);depth[i]=(i%32)<16?1:0;}
   v.uploadSource(null,32,32,rgba);v.uploadDepthFloat(depth,32,32);
   const data=await post('/api/kernel',{settings:{...defaults,field_grid:3,ray_backend:'cpu'},taps:32,interactive:true,aspect:1});v.setKernel(data);
   const s={...defaults,master_blend:0,blades:0,ray_focus:false},options={limit:32,samples:32,aa:1,depth:false,invert:false,near:.8,far:10};
   const read=()=>{const g=v.gl,out=new Uint8Array(32*32*4);g.bindFramebuffer(g.FRAMEBUFFER,null);g.readPixels(0,0,32,32,g.RGBA,g.UNSIGNED_BYTE,out);if(g.getError())throw Error('WebGL readback failed');return out;};
   v.draw(s,options);const a=read();v.draw(s,options);const b=read();
   if(a.some((x,i)=>x!==b[i]))throw Error('WebGL temporal instability');
   const internal=new Float32Array(n*4);v.gl.bindFramebuffer(v.gl.FRAMEBUFFER,v.renderFbo);v.gl.readPixels(0,0,32,32,v.gl.RGBA,v.gl.FLOAT,internal);if(v.gl.getError())throw Error('HDR framebuffer read failed');
   if(internal[3]!==1||internal[127]!==1)throw Error('Opaque WebGL output contract changed');
   let webglHdrError=0;for(let i=0;i<n;i++)for(let ch=0;ch<3;ch++)webglHdrError=Math.max(webglHdrError,Math.abs(internal[i*4+ch]-rgba[i*4+ch]*rgba[i*4+3]));
   if(webglHdrError>.002)throw Error('WebGL HDR black composite mismatch');
   const cuda=await CUDARenderer.info(),results={webgl:{stable:true,hdrBlackCompositeError:webglHdrError,internalAlphaLeft:internal[3],internalAlphaRight:internal[127],viewerOpaque:true},cuda:{available:cuda.available}};
   if(cuda.available){
    const renderer=new CUDARenderer(v);const result=await renderer.draw(s,{...options,preview:false});
    const r=await fetch('/api/cuda/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:renderer.token,settings:s,options:{width:32,height:32,samples:32,taps:32,depth:false,preview:false}})});
    if(!r.ok)throw Error('CUDA test request failed');const pixels=new Float32Array(await r.arrayBuffer());
    let err=0;for(let i=0;i<n;i++)for(let ch=0;ch<4;ch++)err=Math.max(err,Math.abs(pixels[i*4+ch]-(ch===3?1:rgba[i*4+ch]*rgba[i*4+3])));
    if(err>.002)throw Error('CUDA HDR / opaque output error '+err+' first '+Array.from(pixels.slice(0,8)));
    const repeated=await renderer.draw(s,{...options,preview:false});const cr=read();await renderer.draw(s,{...options,preview:false});const cr2=read();
    if(cr.some((x,i)=>x!==cr2[i]))throw Error('CUDA temporal instability');
    if(!repeated.transfer.source_cached)throw Error('Repeated CUDA upload');
    results.cuda={available:true,device:result.device,hdrOpaqueError:err,stable:true,cachedUpload:true,transfer:result.transfer};
   }
   // Opaque depth boundary exercises both compositing paths, and keeps alpha opaque.
   for(let i=0;i<n;i++)rgba[i*4+3]=1;v.uploadSource(null,32,32,rgba);
   results.depth=[];
   for(const mode of ['cut','slicing']){
    const depthSettings={...defaults,ray_focus:false,depth_mode:mode,depth_slices:4,eclipse_bokeh:true};
    v.draw(depthSettings,{...options,depth:true});const pixels=read();v.draw(depthSettings,{...options,depth:true});const again=read();
    if(pixels.some((x,i)=>x!==again[i]))throw Error('Depth temporal instability '+mode);
    const alpha=Array.from({length:n},(_,i)=>pixels[i*4+3]);
    if(Math.min(...alpha)<253)throw Error('Opaque WebGL depth became transparent '+mode+' '+Math.min(...alpha));
    let cudaStable=null;
    if(cuda.available){const renderer=new CUDARenderer(v);await renderer.draw(depthSettings,{...options,depth:true,preview:false});const first=read();await renderer.draw(depthSettings,{...options,depth:true,preview:false});const second=read();cudaStable=!first.some((x,i)=>x!==second[i]);if(!cudaStable)throw Error('CUDA depth temporal instability '+mode);}
    results.depth.push({mode,minAlpha:Math.min(...alpha),maxAlpha:Math.max(...alpha),webglStable:true,cudaStable});
   }
   c.remove();return results;
  });
  assert(bench.webgl.stable&&bench.depth.length===2);
  const downloadEvent=page.waitForEvent('download');await panel.locator('button').click();const download=await downloadEvent;assert.equal(download.suggestedFilename(),'optica-performance.json');
  await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:path.join(__dirname,'../research/performance-stage3.png')});
  assert.deepEqual(errors,[]);
  const result={initial,bench,locales:3,diagnosticsDownload:true,errors};
  fs.writeFileSync(path.join(__dirname,'../research/performance-stage3-ui-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
