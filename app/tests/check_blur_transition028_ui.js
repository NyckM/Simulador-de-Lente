const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage();page.on('pageerror',e=>console.log('PAGE ERROR',e.message));await page.route('**/api/cuda/info',route=>route.fulfill({json:{available:false}}));await page.route('**/api/kernel.bin',route=>route.abort());await page.goto(process.env.OPTICA_TEST_URL);await page.waitForFunction(()=>typeof LensGPU==='function');
const report=await page.evaluate(async()=>{
 const w=96,h=64,c=document.createElement('canvas'),v=new LensGPU(c);v.setKernel(await post('/api/kernel',{settings:{ray_focus:false,field_grid:3,iris_mm:4},aspect:1.5,taps:32,interactive:true}));
 const rgba=new Float32Array(w*h*4),depth=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;rgba.set([x%4<2?1:.1,y%4<2?.8:.2,.4,1],i*4);depth[i]=x/(w-1);}
 v.uploadSource(c,w,h,rgba);
 const s={...defaults,ray_focus:false,render_backend:'webgl',depth_mode:'cut',depth_cut:.5,depth_feather:.2,depth_slices:12,invert_depth:false,iris_mm:4,focus_m:2,bokeh_gain:3};
 const options={limit:w,samples:32,depth:true,invert:false,near:.8,far:10,linearOnly:true};
 const read=()=>{const g=v.gl;g.bindFramebuffer(g.FRAMEBUFFER,v.renderFbo);const p=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,p);if(g.getError())throw Error('Readback failed');return p;};
 const mapped=DepthUtils.blurTransition(depth,s),errs=[];let opaque=true;
 for(const eclipse of [false,true]){
  s.eclipse_bokeh=eclipse;v.uploadDepthFloat(depth,w,h);v.draw(s,options);const actual=read();
  v.uploadDepthFloat(mapped,w,h);v.draw({...s,depth_mode:'slicing'},options);const expected=read();let e=0;
  for(let i=0;i<actual.length;i++){e=Math.max(e,Math.abs(actual[i]-expected[i]));if(i%4===3&&actual[i]!==1)opaque=false;}
  errs.push(e);
 }
 v.uploadDepthFloat(depth,w,h);v.draw(s,options);v.draw({...s,depth_feather:0},options);const restored=read();v.uploadDepthFloat(depth,w,h);v.draw({...s,depth_feather:0},options);const fresh=read();let restoreError=0;for(let i=0;i<fresh.length;i++)restoreError=Math.max(restoreError,Math.abs(restored[i]-fresh[i]));
 const centerFocus=DepthUtils.focusPrepared(.5,s,{near:.8,far:10},false);
 return {errors:errs,opaque,restoreError,centerFocus};
});assert(report.opaque);assert(report.errors.every(e=>e<=.002),JSON.stringify(report));assert.equal(report.restoreError,0);assert(report.centerFocus>.8&&report.centerFocus<10);report.passed=true;fs.writeFileSync(path.join(__dirname,'../research/blur-transition028-webgl.json'),JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
