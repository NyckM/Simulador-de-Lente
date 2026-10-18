const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));if(process.env.OPTICA_FORCE_WEBGL)await p.route('**/api/cuda/info',route=>route.fulfill({json:{available:false}}));await p.goto(process.env.OPTICA_TEST_URL);
 await p.waitForFunction(()=>typeof gpu!=='undefined'&&gpu?.ready&&!kernelBusy&&!kernelTimer,null,{timeout:180000});
 const report=await p.evaluate(async()=>{
  offlineBusy=true;const test=new LensGPU(document.createElement('canvas')),g=test.gl,w=97,h=65;
  test.canvas.width=w;test.canvas.height=h;
  const map=[[.01,.25,.5],[.5,1,.5],[.25,.5,.75]];
  test.data={grid:3,distortion:{throughput:[map,map,map].flat(2)}};
  const t=g.createTexture(),plate=new Float32Array(w*h*4);for(let i=0;i<w*h;i++)plate.set([.02,.03,.04,1],i*4);
  g.activeTexture(g.TEXTURE6);g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,w,h,0,g.RGBA,g.FLOAT,plate);
  const read=(amount,extra={})=>{test.resolveFrame({...defaults,edge_compensation:amount,...extra},6,w,h);const a=new Uint8Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,a);return a;};
  const a=read(0),c=read(100),undo=read(0),coverage=read(100,{highlight_view:'coverage'}),blend=read(100,{master_blend:0});
  const encode=v=>255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055);
  let maxError=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const xx=(x+.5)/w*2,yy=(h-y-.5)/h*2,ix=Math.min(1,Math.floor(xx)),iy=Math.min(1,Math.floor(yy)),fx=xx-ix,fy=yy-iy;
   const light=(map[iy][ix]*(1-fx)+map[iy][ix+1]*fx)*(1-fy)+(map[iy+1][ix]*(1-fx)+map[iy+1][ix+1]*fx)*fy;
   for(let k=0;k<3;k++)maxError=Math.max(maxError,Math.abs(c[(y*w+x)*4+k]-encode([.02,.03,.04][k]/Math.max(light,.125))));
  }
  test.data={grid:3,distortion:{throughput:Array.from({length:3},()=>Array.from({length:3},()=>[1,1,1]))}};
  const changedMap=read(100);
  const equal=(x,y)=>x.every((v,i)=>v===y[i]);
  settings.edge_compensation=37;sync();persist();const persisted=JSON.parse(localStorage.getItem('optica-lab-v02')).settings.edge_compensation;
  const deps=LensDependencies.affects('edge_compensation',defaults);
  await draw({limit:384,samples:24});settings.edge_compensation=0;await draw({limit:384,samples:24});const original=canvas.toDataURL(),atlas=gpu.data;
  settings.edge_compensation=100;await draw({limit:384,samples:24});const brighter=canvas.toDataURL(),cached=cudaRenderer?.stats?.frame_cached;
  settings.edge_compensation=0;await draw({limit:384,samples:24});
  return {max_byte_error:maxError,bypass_exact:equal(a,undo),coverage_bypass:equal(a,coverage),blend_bypass:equal(a,blend),new_map_refresh:equal(a,changedMap),gl_error:g.getError(),native_available:cudaInfo?.available,cached,pixels_changed:original!==brighter,restore_exact:original===canvas.toDataURL(),atlas_unchanged:gpu.data===atlas,dependencies:deps,numeric_control:document.getElementById('edge_compensation').value,persisted};
 });
 console.log(report);assert.equal(report.persisted,37);assert(report.max_byte_error<2,JSON.stringify(report));for(const key of ['bypass_exact','coverage_bypass','blend_bypass','new_map_refresh','pixels_changed','restore_exact','atlas_unchanged'])assert(report[key],key);assert.equal(report.gl_error,0);assert.equal(report.dependencies.atlas,false);assert.equal(report.dependencies.layout,false);if(report.native_available)assert(report.cached);assert.deepEqual(errors,[]);
 fs.writeFileSync('research/edge-compensation-'+(process.env.OPTICA_FORCE_WEBGL?'webgl':'gpu')+'.json',JSON.stringify({...report,errors,passed:true},null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
