'use strict';
// ComfyUI bridge for the desktop 1.2.17 WebGL2 renderer (same gpu.js / filter-stack.js / reflected-ghosts.js).
let engine;
const BRIDGE_DEFAULTS={flare_boost:8,starburst_gain:0,starburst_size:1,starburst_streaks:.35,highlight_recovery:0,
 lens_dirt_fingerprints:.7,lens_dirt_dust:.6,lens_dirt_scratches:.35,lens_dirt_fungus:0,lens_dirt_defocus:.35};
window.setupRenderer = atlas => {
  engine = new LensGPU(document.getElementById('output'));
  engine.setKernel(atlas);
  const gl=engine.gl, ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),version:gl.getParameter(gl.VERSION)};
};
function floats(encoded){const s=atob(encoded),bytes=new Uint8Array(s.length);for(let i=0;i<s.length;i++)bytes[i]=s.charCodeAt(i);return new Float32Array(bytes.buffer);}
let cache={key:null,rgba:null,sources:null};
function prepareImage(payload){
  const {w,h}=payload,s={...BRIDGE_DEFAULTS,...payload.settings},rgb=floats(payload.image),rgba=new Float32Array(w*h*4),rec=Math.max(0,Math.min(8,s.highlight_recovery||0));
  // ComfyUI IMAGE is sRGB [0,1]. Decode to linear light; clipped highlights (near 1.0) regain energy like the desktop "Recuperar luzes" control.
  for(let p=0;p<w*h;p++){let m=0;for(let c=0;c<3;c++){const v=rgb[p*3+c];m=Math.max(m,v);rgba[p*4+c]=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}
   if(rec>0&&m>.9){const t=Math.min(1,(m-.9)/.1),k=Math.pow(2,rec*t*t*(3-2*t));for(let c=0;c<3;c++)rgba[p*4+c]*=k;}rgba[p*4+3]=1;}
  engine.uploadSource(null,w,h,rgba);
  engine.uploadDepthFloat(floats(payload.depth),w,h);
  return {rgba,s};
}
function lightSources(rgba,w,h,s,depthValues,threshold,limit){
  const src=ReflectedGhosts.detectSources(rgba,w,h,threshold,limit),depth=DepthUtils.prepare(depthValues,s);
  return src.map(o=>({...o,distance_m:depth.distance_m[Math.min(h-1,Math.floor(o.uv[1]*h))*w+Math.min(w-1,Math.floor(o.uv[0]*w))]}));
}
window.prepareFlare = payload => {
 const {w,h}=payload,{rgba,s}=prepareImage(payload);
 return lightSources(rgba,w,h,s,floats(payload.depth),s.flare_threshold??.8,s.flare_limit??4);
};
window.renderImage = async payload => {
 const {w,h,samples}=payload,{rgba,s}=prepareImage(payload);
 const settings={...s};
 const ghosts=payload.ghosts||null;
 let stars=[];
 if((settings.starburst_gain||0)>0)stars=ghosts?.sources||lightSources(rgba,w,h,settings,floats(payload.depth),settings.flare_threshold??.8,settings.flare_limit??4);
 window.ghostInspector=(ghosts||stars.length)?{data:ghosts,flux:ghosts?.sources?.[0]?.flux||[0,0,0],sourceSize:[w,h],isCurrent:()=>!!ghosts,starSources:()=>stars,getState:()=>({width:w,height:h})}:null;
 if(settings.physical_ghosts)settings._reflected_gain=settings.ghost_gain;
 settings.ghost_gain=0;
  await engine.prepareDirt(settings.lens_dirt_texture||'',settings);
  engine.draw(settings,{limit:Math.max(w,h),samples,aa:1,depth:true,invert:settings.invert_depth,near:settings.near_m,far:settings.far_m});
  const gl=engine.gl;gl.finish();
  if(gl.isContextLost())throw Error('WebGL context lost. Reduce resolution/samples.');
  const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('WebGL render error '+error);
  const pixels=new Uint8Array(w*h*4),top=new Uint8Array(pixels.length);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  for(let y=0;y<h;y++)top.set(pixels.subarray(y*w*4,(y+1)*w*4),(h-1-y)*w*4);
  let binary='';for(let i=0;i<top.length;i+=16384)binary+=String.fromCharCode(...top.subarray(i,i+16384));return btoa(binary);
};
