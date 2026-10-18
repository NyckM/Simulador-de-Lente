const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OPTICA_TEST_URL||'http://127.0.0.1:8887');
  await page.waitForFunction(()=>typeof performancePanel!=='undefined'&&performancePanel.latest&&atlas?.atlas_layout==='webgl-packed-f32'&&!cudaPending&&!kernelBusy,null,{timeout:120000});
  const result=await page.evaluate(async()=>{
   const body={settings:{...defaults,field_grid:3,ray_backend:'cpu'},aspect:1,taps:32,interactive:true};
   const legacy=await post('/api/kernel',body),binary=await requestLensAtlas(body),packed=LensQuality.pack(legacy.atlas,3,32),pupils=LensQuality.pack(legacy.pupils,3,32);
   if(packed.some((x,i)=>x!==binary.atlas[i])||pupils.some((x,i)=>x!==binary.pupils[i]))throw Error('Binary differs from legacy float32 packing');
   const legacyBytes=new TextEncoder().encode(JSON.stringify(legacy)).length;
   const make=()=>{const c=document.createElement('canvas');c.width=c.height=32;document.body.append(c);return new LensGPU(c);},a=make(),b=make();
   const rgba=new Float32Array(32*32*4);for(let i=0;i<1024;i++)rgba.set([(i%32)/20,Math.floor(i/32)/20,((i%7)+1)/4,1],i*4);
   a.uploadSource(null,32,32,rgba);b.uploadSource(null,32,32,rgba);a.setKernel(legacy);b.setKernel(binary);
   const settings={...defaults,field_grid:3,ray_backend:'cpu'},options={limit:32,samples:32,aa:1,preview:false,depth:false,near:.8,far:10,invert:false};
   const read=v=>{const out=new Uint8Array(4096);v.gl.bindFramebuffer(v.gl.FRAMEBUFFER,null);v.gl.readPixels(0,0,32,32,v.gl.RGBA,v.gl.UNSIGNED_BYTE,out);if(v.gl.getError())throw Error('Readback failed');return out;};
   a.draw(settings,options);b.draw(settings,options);const oldPixels=read(a),newPixels=read(b);
   if(oldPixels.some((x,i)=>x!==newPixels[i]))throw Error('Binary atlas changes WebGL image');
   let uploads=0;const image3D=b.gl.texImage3D.bind(b.gl);b.gl.texImage3D=(...args)=>{uploads++;return image3D(...args);};
   b.setKernel(await requestLensAtlas(body));if(uploads!==0||!b.atlasUploadSkipped)throw Error('Identical atlas upload not skipped');
   b.setKernel(await requestLensAtlas({...body,settings:{...settings,iris_mm:3}}));if(uploads!==2||b.atlasUploadSkipped)throw Error('Changed atlas not uploaded');
   b.setKernel(binary);
   let imageCalls=0,subCalls=0;const image2D=b.gl.texImage2D.bind(b.gl),sub2D=b.gl.texSubImage2D.bind(b.gl);
   b.gl.texImage2D=(...args)=>{imageCalls++;return image2D(...args);};b.gl.texSubImage2D=(...args)=>{subCalls++;return sub2D(...args);};
   const scratch=b.sourceUploadBuffer;b.uploadSource(null,32,32,rgba);if(imageCalls!==0||subCalls!==1||b.sourceUploadBuffer!==scratch)throw Error('Source storage reuse failed');
   const cudaInfo=await CUDARenderer.info();let cuda={available:cudaInfo.available};
   if(cudaInfo.available){
    const client=new CUDARenderer(b),first=await client.draw(settings,options),firstPixels=read(b),cached=await client.draw(settings,options),cachedPixels=read(b);
    if(!cached.frame_cached||cached.transfer.render_request_ms!==0||cachedPixels.some((x,i)=>x!==firstPixels[i]))throw Error('Cached frame not identical');
    const cacheBuffer=client.lastFrame.pixels;await client.draw(settings,options);if(client.lastFrame.pixels!==cacheBuffer)throw Error('Cached pixels copied');
    b.draw(settings,options);const afterWebGL=await client.draw(settings,options);if(!afterWebGL.frame_cached||read(b).some((x,i)=>x!==firstPixels[i]))throw Error('Cached CUDA frame not restored after WebGL');
    for(const change of [{focus_m:2},{exposure:1},{depth_mode:'cut'},{shimmer_amount:.2}]){
     const changed=await client.draw({...settings,...change},options);if(changed.frame_cached)throw Error('Settings cache not invalidated '+JSON.stringify(change));
     const held=read(b);client.lastFrame=null;await client.draw({...settings,...change},options);if(read(b).some((x,i)=>x!==held[i]))throw Error('Fresh frame differs');
    }
    await client.draw(settings,{...options,limit:16});if(client.stats.frame_cached)throw Error('Resolution cache not invalidated');
    const full=await client.draw(settings,options);const half=await client.draw(settings,{...options,preview:true});if(full.precision!=='float32'||half.precision!=='float16'||half.frame_cached)throw Error('Precision cache not invalidated');
    const buffer=client.buffer;b.uploadSource(null,32,32,rgba);if((await client.draw(settings,options)).frame_cached||client.buffer!==buffer)throw Error('Source revision or reusable buffer failed');
    b.uploadDepthFloat(new Float32Array(1024).fill(.25),32,32);if((await client.draw(settings,{...options,depth:true})).frame_cached)throw Error('Depth revision not invalidated');
    b.nativeDepth=null;b.depthRevision++;await client.upload('r');if(client.buffer.subarray(4096).some(x=>x!==0))throw Error('Stale depth buffer');
    const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d'),im=ctx.createImageData(32,32);
    for(let i=0;i<1024;i++){im.data.set([i%256,(i*3)%256,(i*7)%256,255],i*4);}ctx.putImageData(im,0,0);b.uploadSource(c,32,32);await client.upload('r');
    const expected=new Float32Array(5120);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const src=(y*32+x)*4,dst=((31-y)*32+x)*4;for(let k=0;k<3;k++){const value=im.data[src+k]/255;expected[dst+k]=value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}expected[dst+3]=1;}
    if(expected.some((x,i)=>x!==client.buffer[i]))throw Error('Decode LUT changes float32 values');
    cuda={available:true,device:cudaInfo.device,cachedPixelIdentity:true,repeatedFrameExact:true,settingsInvalidation:true,resolutionInvalidation:true,precisionInvalidation:true,sourceDepthInvalidation:true,stagingBufferReused:true,clearedRemovedDepth:true,decodeExact:true,firstTransfer:first.transfer,cachedTransfer:cached.transfer};
   }
   a.canvas.remove();b.canvas.remove();
   return {float32AtlasExact:true,webglFrameExact:true,atlasUploadReuse:true,changedAtlasUploaded:true,sourceTextureReused:true,legacyBytes,binaryBytes:binary.transfer_bytes,byteReduction:1-binary.transfer_bytes/legacyBytes,cuda};
  });
  assert(result.byteReduction>0&&result.webglFrameExact);assert.deepEqual(errors,[]);
  const panel=page.locator('#performance-panel');await panel.locator('summary').click();await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:path.join(__dirname,'../research/transfers-stage4.png')});
  result.errors=errors;fs.writeFileSync(path.join(__dirname,'../research/transfers-stage4-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
