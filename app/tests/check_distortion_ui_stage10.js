const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:2200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8892');
  const idle=()=>page.waitForFunction(()=>typeof atlas!=="undefined"&&atlas&&!kernelBusy&&!kernelTimer&&!drawTask&&!drawPending&&canvas.dataset.previewStage==='final'&&appliedAtlasSignature===signature()&&!layoutBusy&&lensDraftEdits===null,null,{timeout:120000});await idle();
  const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/distortion-stage10.json')));
  const result=await page.evaluate(f=>{
   const P=PhysicalDistortion,s={...defaults,...f.settings},d={...f.data,atlas:new Float32Array(f.data.atlas),pupils:new Float32Array(f.data.pupils)},m=P.fieldMap(d,s),prepared=P.prepare(d,s);
   const maxerr=(a,b)=>Math.max(...Array.from(a,(v,i)=>Math.abs(v-b[i])));
   const positions=maxerr(m.positions,f.expected.positions),jacobian=maxerr(m.jacobian,f.expected.jacobian),rays=maxerr(prepared.atlas,f.expected.prepared);
   let inverse=0;for(let y=1;y<10;y++)for(let x=1;x<10;x++){const q=[x/10,y/10],t=P.forward(m,q).position,r=P.inversePoint(m,t);if(!r)throw Error('inverse missing');inverse=Math.max(inverse,Math.hypot(r[0]-q[0],r[1]-q[1]));}
   let nonlinearInverse=0;for(const k of [-.35,.4]){const n=9,centers=new Array(3*n*n*4).fill(0);for(let ch=0;ch<3;ch++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){const xx=x/(n-1)-.5,yy=y/(n-1)-.5,r2=xx*xx+yy*yy,i=((ch*n+y)*n+x)*4;centers[i]=xx*36*(1+k*r2);centers[i+1]=yy*24*(1+k*r2);}const nonlinear={...d,distortion:{...d.distortion,grid:n,centroids_mm_and_slopes:centers,throughput:new Array(3*n*n).fill(1)}};const map=P.fieldMap(nonlinear,s);for(let y=1;y<10;y++)for(let x=1;x<10;x++){const q=[x/10,y/10],target=P.forward(map,q).position,r=P.inversePoint(map,target);if(!r)throw Error('nonlinear inverse missing');nonlinearInverse=Math.max(nonlinearInverse,Math.hypot(r[0]-q[0],r[1]-q[1]));}}
   const packed={...d,atlas_layout:'webgl-packed-f32',atlas:LensQuality.pack(d.atlas,d.grid,d.taps),pupils:LensQuality.pack(d.pupils,d.grid,d.taps),atlas_id:d.atlas_id};
   const packedRays=maxerr(P.prepare(packed,s).atlas,LensQuality.pack(prepared.atlas,d.grid,d.taps));
   const restored=P.prepare(d,{...s,physical_distortion:false})===d,cached=P.prepare(d,s)===P.prepare(d,s);
   // GPU inverse resampling oracle: UV gradient on the input plate.
   const w=128,h=96,c=document.createElement('canvas'),v=new LensGPU(c),pixels=new Float32Array(w*h*4);v.setKernel(d);v.inputSize=[w,h];
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)pixels.set([(x+.5)/w,(y+.5)/h,.3,1],(y*w+x)*4);
   v.presentCUDA(pixels,s,{width:w,height:h});const gl=v.gl,out=new Float32Array(pixels.length);gl.bindFramebuffer(gl.FRAMEBUFFER,v.physicalPass.fbo);gl.readPixels(0,0,w,h,gl.RGBA,gl.FLOAT,out);
   let shader=0,alpha=0,black=0,checked=0;for(let y=3;y<h-3;y+=5)for(let x=3;x<w-3;x+=5){const i=(y*w+x)*4,q=P.inversePoint(v.data._physicalMap,[(x+.5)/w,(y+.5)/h]);alpha=Math.max(alpha,Math.abs(out[i+3]-1));if(!q){black++;shader=Math.max(shader,Math.abs(out[i])+Math.abs(out[i+1])+Math.abs(out[i+2]));}else if(q.every(v=>v>.05&&v<.95)){checked++;shader=Math.max(shader,Math.abs(out[i]-q[0]),Math.abs(out[i+1]-q[1]),Math.abs(out[i+2]-.3));}}
   const glError=gl.getError();gl.getExtension('WEBGL_lose_context')?.loseContext();return {positions,jacobian,rays,inverse,nonlinearInverse,packedRays,restored,cached,shader,alpha,black,checked,glError};
  },fixture);
  assert(result.positions<1e-10&&result.jacobian<1e-10&&result.rays<1e-7&&result.packedRays<1e-7);assert(result.inverse<2e-6&&result.nonlinearInverse<3e-6);assert(result.cached&&result.restored);assert(result.shader<.002&&result.alpha===0&&result.glError===0);assert(result.checked>250&&result.black>0);
  await page.locator('#inspection-toggle').click();
  await page.evaluate(()=>{window.mapRequests=[];const original=window.fetch;window.fetch=(url,...args)=>{if(String(url).includes('/api/kernel')||String(url).includes('/api/layout'))mapRequests.push({url:String(url),body:args[0]?.body,stack:new Error().stack});return original(url,...args)};settings.render_backend='webgl';changed('render_backend');});await idle();
  const base=await page.evaluate(()=>{mapRequests=[];return gpu.data.atlas_id});await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel) input').check();await idle();
  assert(await page.evaluate(()=>settings.physical_distortion&&!!gpu.data._physicalMap));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('optica-lab-v02')).settings.physical_distortion),true);
  assert.deepEqual(await page.evaluate(()=>mapRequests.filter(r=>r.stack.includes("updateKernel")||r.url.includes("layout"))),[]);
  const first=await page.evaluate(()=>gpu.data.atlas_id);await page.evaluate(()=>{settings.focus_m=2;changed('focus_m');});await idle();assert.notEqual(await page.evaluate(()=>gpu.data.atlas_id),first);assert.deepEqual(await page.evaluate(()=>mapRequests.filter(r=>r.stack.includes("updateKernel")||r.url.includes("layout"))),[]);
  const payload=await page.evaluate(()=>physicalInspector.payload());assert.equal(payload.schema,'optica-distortion-export/1');assert.equal(payload.inverse.length,1089);assert.equal(payload.positions_mm.length,3*payload.grid*payload.grid*2);assert(payload.inverse.every(p=>p.valid===!!p.source_uv));
  const downloadPromise=page.waitForEvent('download');await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel) button').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'OpticaLab-Mapa-Fisico.json');
  const engines=[];for(const engine of ['webgl','cuda']){await page.evaluate(engine=>{settings.render_backend=engine;settings.lens_dirt_amount=.2;settings.diffusion=.1;settings.drops_amount=.2;changed('render_backend');},engine);await idle();const check=await page.evaluate(()=>{const g=gpu.gl,p=new Uint8Array(canvas.width*canvas.height*4);g.bindFramebuffer(g.FRAMEBUFFER,null);g.readPixels(0,0,canvas.width,canvas.height,g.RGBA,g.UNSIGNED_BYTE,p);let alpha=255;for(let i=3;i<p.length;i+=4)alpha=Math.min(alpha,p[i]);return {error:g.getError(),alpha,map:!!gpu.data._physicalMap,status:document.getElementById('status').textContent}});assert.equal(check.error,0);assert.equal(check.alpha,255);assert(check.map);if(engine==='cuda')assert(check.status.includes('CUDA'));engines.push(check);}
  for(const [lang,title]of [['en','Physical distortion map'],['zh-CN','物理畸变映射'],['pt-BR','Mapa físico de distorção']]){await page.evaluate(lang=>document.documentElement.lang=lang,lang);await page.waitForTimeout(80);assert.equal(await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel) h4').textContent(),title);}
  await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel)').scrollIntoViewIfNeeded();await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel)').screenshot({path:path.join(__dirname,'../research/distortion-stage10.png')});
  const profile=await page.evaluate(()=>ProfileStore.parse(ProfileStore.create('Physical map',{settings:{...settings},quality,exportQuality,exportSize:'1920',fps:30,useDepth:false},'stage10')));assert.equal(profile.snapshot.settings.physical_distortion,true);
  await page.reload();await idle();assert(await page.evaluate(()=>settings.physical_distortion&&gpu.data._physicalPrepared));await page.locator('#inspection-toggle').click();
  await page.locator('.physical-distortion-panel:not(.wavefront-panel):not(.spectral-psf-panel) input').uncheck();await idle();assert.equal(await page.evaluate(()=>gpu.data.atlas_id),base);
  assert.deepEqual(errors,[]);const report={...result,engines,no_retrace_on_focus_or_toggle:true,export_inverse_grid:payload.inverse.length,three_languages:true,persistence:true,legacy_restore:true,errors};fs.writeFileSync(path.join(__dirname,'../research/distortion-stage10-ui-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
