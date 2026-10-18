(async()=>{try{
settings.depth_normalize='minmax';settings.depth_curve=1.5;settings.depth_mapping='linear';depthInspector.sync();depthInspector.refresh(true);
const mapped=gpu.prepareDepth(settings,{near:settings.near_m,far:settings.far_m,invert:settings.invert_depth});const cached=mapped===gpu.prepareDepth(settings,{near:settings.near_m,far:settings.far_m,invert:settings.invert_depth});
const bounds=mapped.statistics;settings.depth_low=bounds.low;settings.depth_high=bounds.high;settings.depth_normalize='manual';depthInspector.sync();depthInspector.refresh(true);
const controls=depthInspector.host.querySelector('#di-normal').value==='manual';
const engines=await (async()=>{

  const w=64,h=48,rgba=new Float32Array(w*h*4),raw=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;rgba[i*4]=(x%9===0&&y%7===0)?3:.12;rgba[i*4+1]=.05+x/w*.15;rgba[i*4+2]=.08;rgba[i*4+3]=1;raw[i]=.4+.2*x/(w-1)}raw[1]=NaN;
  const c=document.createElement('canvas'),v=new LensGPU(c);v.setKernel(gpu.data);v.uploadSource(document.createElement('canvas'),w,h,rgba);
  const s={...defaults,iris_mm:gpu.data.iris_mm,field_grid:gpu.data.grid,render_backend:'webgl',near_m:2,far_m:10,focus_m:3,depth_mode:'slicing',depth_slices:8,depth_normalize:'minmax',depth_curve:2,depth_mapping:'linear',eclipse_bokeh:true,ray_focus:false},o={limit:64,samples:32,depth:true,invert:false,near:2,far:10,upscale:true};
  const prepared=DepthUtils.prepare(raw,s,o).nearness,identity={...s,depth_normalize:'manual',depth_low:0,depth_high:1,depth_curve:1,depth_mapping:'inverse',depth_gain:1,depth_bias:0,depth_units:'relative'};
  const pixels=()=>{const g=v.gl,a=new Uint8Array(c.width*c.height*4);g.bindFramebuffer(g.FRAMEBUFFER,null);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,a);if(g.getError())throw Error('GL error');return a},compare=(a,b)=>{let error=0,alpha=255;for(let i=0;i<a.length;i++){error=Math.max(error,Math.abs(a[i]-b[i]));if(i%4===3)alpha=Math.min(alpha,a[i],b[i])}return {error,alpha}};
  v.uploadDepthFloat(raw,w,h);v.draw(s,o);const a=pixels();v.uploadDepthFloat(prepared,w,h);v.draw(identity,o);const b=pixels(),result=[{backend:'webgl',...compare(a,b)}];
  const renderer=new CUDARenderer(v);v.uploadDepthFloat(raw,w,h);await renderer.draw(s,o);const ca=pixels();v.uploadDepthFloat(prepared,w,h);await renderer.draw(identity,o);const cb=pixels();result.push({backend:'cuda',...compare(ca,cb)});
  // Low-resolution depth must be explicitly sampled, not indexed at source size.
  v.uploadDepthFloat(new Float32Array(16*12).fill(.5),16,12);await renderer.draw({...s,depth_units:'meters'},o);result.push({backend:'cuda-small-depth',finite:true,alpha:Math.min(...pixels().filter((_,i)=>i%4===3))});
  return result;
 })();
window.stage13TestResult={success:cached&&controls&&engines.every(e=>e.alpha===255&&(e.error===undefined||e.error<=1)),cache:cached,controls,encoding:'inverse-distance-nearness',engines,version:'0.9.10'};
}catch(e){window.stage13TestResult={success:false,error:e.message}}})();