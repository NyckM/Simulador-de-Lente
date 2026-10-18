const {chromium}=require(process.env.PLAYWRIGHT_MODULE),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/cuda/info',route=>route.fulfill({json:{available:false}}));await p.route('**/api/kernel.bin',route=>route.abort());await p.goto(process.env.OPTICA_TEST_URL);
 await p.waitForFunction(()=>typeof LensGPU==='function');
 const report=await p.evaluate(async()=>{
  offlineBusy=true;const gpu=new LensGPU(document.createElement('canvas'));
  const s={...defaults,lens_model:'zeiss_planar_50',source_m:4,focus_m:4,iris_mm:4,field_grid:3,ray_backend:'cpu',depth_mode:'slicing',depth_slices:12,near_m:2,far_m:10,invert_depth:false};
  const w=96,h=64,linear=new Float32Array(w*h*4),z=new Float32Array(w*h).fill(.375);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=.2+.6*((Math.floor(x/2)+Math.floor(y/2))%2);linear.set([c,c,c,1],(y*w+x)*4);}
  gpu.setKernel(await post('/api/kernel',{settings:s,aspect:w/h,taps:32,interactive:true}));gpu.uploadSource(null,w,h,linear);gpu.uploadDepthFloat(z,w,h);
  const opts={limit:w,samples:32,aa:1,invert:false,near:2,far:10},g=gpu.gl;
  const pixels=depth=>{gpu.draw(s,{...opts,depth});const a=new Uint8Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,a);return a;};
  const a=pixels(false),b=pixels(true);let max=0;for(let y=12;y<h-12;y++)for(let x=12;x<w-12;x++)for(let c=0;c<3;c++)max=Math.max(max,Math.abs(a[(y*w+x)*4+c]-b[(y*w+x)*4+c]));
  const oldFocus=DepthUtils.focusPrepared(.375,s,{near:2,far:10},false);
  return {focused_vs_single_plane_max_byte_error:max,focus_picker_m:oldFocus,gl_error:g.getError()};
 });assert(report.focused_vs_single_plane_max_byte_error<=1,JSON.stringify(report));assert.equal(report.focus_picker_m,4);assert.equal(report.gl_error,0);assert.deepEqual(errors,[]);
 fs.writeFileSync('research/focus-anchor-webgl-validation.json',JSON.stringify({...report,errors},null,2));console.log(report);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
