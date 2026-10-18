'use strict';
// Explicit HDR host transfer; this is not Vulkan external-memory interop.
class CUDARenderer {
 constructor(viewer){this.viewer=viewer;this.token=crypto.randomUUID();this.uploadKey=null;this.stats=null;this.lastFrame=null;this.depthKey=null;this.buffer=null;
  this.decodeTable=new Float32Array(256);for(let i=0;i<256;i++){const c=i/255;this.decodeTable[i]=c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}}
 // Only previews have a deadline; an offline export may legitimately take longer.
 static previewTimeoutMs=15000;
 async request(url,init,read,preview){
  if(!preview)return read(await fetch(url,init));
  const controller=new AbortController();let timer,expired=false;
  let cancel;const canceled=new Promise((_,reject)=>{cancel=()=>{controller.abort();const e=Error('Requisição CUDA descartada ao restaurar a lente.');e.code='CUDA_PREVIEW_RESET';reject(e);};});
  this.previewCancels??=new Set();this.previewCancels.add(cancel);
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;controller.abort();const e=Error('CUDA não respondeu a tempo; prévia recuperada em WebGL.');e.code='CUDA_PREVIEW_TIMEOUT';reject(e);},CUDARenderer.previewTimeoutMs);});
  try{return await Promise.race([(async()=>read(await fetch(url,{...init,signal:controller.signal})))(),timeout,canceled]);}
  catch(error){this.uploadKey=null;this.lastFrame=null;if(expired){const e=Error('CUDA não respondeu a tempo; prévia recuperada em WebGL.');e.code='CUDA_PREVIEW_TIMEOUT';throw e;}throw error;}
  finally{clearTimeout(timer);this.previewCancels.delete(cancel);}
 }
 cancelPreview(){for(const cancel of this.previewCancels||[])cancel();}
 static async info(){const r=await fetch('/api/cuda/info');if(!r.ok)throw Error('CUDA indisponível');return r.json();}
 async upload(channel,preparation=null,preview=false){
  const recovery=Math.max(0,Math.min(8,(typeof settings!=='undefined'&&settings?.highlight_recovery)||0)),started=performance.now(),v=this.viewer,key=[v.sourceRevision,v.depthRevision,channel,preparation?.key||'raw',recovery].join(':');if(key===this.uploadKey)return {prepare_ms:0,upload_request_ms:0,source_cached:true};
  const [w,h]=v.inputSize,source=v.nativeSource,depth=v.nativeDepth,n=w*h;
  if(this.buffer?.length!==n*5){this.buffer=new Float32Array(n*5);this.depthKey=null;}
  const data=this.buffer;let rgba=source.linear;this.lastFrame=null;
  const readImage=image=>{const c=this.inputCanvas??=document.createElement('canvas');if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);return ctx.getImageData(0,0,w,h).data;};
  if(!rgba)rgba=readImage(source.image);
  if(source.linear){for(let y=0;y<h;y++)data.set(rgba.subarray(y*w*4,(y+1)*w*4),(h-1-y)*w*4);}
  else{
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const src=(y*w+x)*4,dst=((h-1-y)*w+x)*4;
   const m=Math.max(rgba[src],rgba[src+1],rgba[src+2])/255;let t=Math.min(1,Math.max(0,(m-.9)/.1));t=t*t*(3-2*t);const boost=recovery>0?2**(recovery*t):1;for(let c=0;c<3;c++)data[dst+c]=this.decodeTable[rgba[src+c]]*boost;data[dst+3]=rgba[src+3]/255;
  }
  }
  const nextDepthKey=[v.depthRevision,channel,w,h,!!depth,preparation?.key||'raw'].join(':');
  if(nextDepthKey!==this.depthKey){
  if(depth){let values=preparation?.nearness||depth.values;if(!values)values=readImage(depth.image);
   const dw=preparation?.width||depth.width||w,dh=preparation?.height||depth.height||h,c=['r','g','b','a'].indexOf(channel),scalar=!!(preparation||depth.values);
   const sample=(x,y)=>{const fx=(x+.5)*dw/w-.5,fy=(y+.5)*dh/h-.5,clampX=t=>Math.max(0,Math.min(dw-1,t)),clampY=t=>Math.max(0,Math.min(dh-1,t));if(preparation&&!v.depthFloatLinear)return values[clampY(Math.round(fy))*dw+clampX(Math.round(fx))];const ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,a=values[clampY(iy)*dw+clampX(ix)],b=values[clampY(iy)*dw+clampX(ix+1)],c=values[clampY(iy+1)*dw+clampX(ix)],d=values[clampY(iy+1)*dw+clampX(ix+1)];return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;};
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;data[n*4+(h-1-y)*w+x]=scalar?sample(x,y):channel==='luma'?(values[i*4]*.2126+values[i*4+1]*.7152+values[i*4+2]*.0722)/255:values[i*4+Math.max(0,c)]/255;}

  }else data.fill(0,n*4);
  this.depthKey=nextDepthKey;}
  const prepared=performance.now();await this.request('/api/cuda/source',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Optica-Width':String(w),'X-Optica-Height':String(h),'X-Optica-Token':this.token,'X-Optica-Depth-Encoding':preparation?'nearness-v1':'raw'},body:data},async response=>{if(!response.ok)throw Error((await response.json()).error);await response.json();},preview);this.uploadKey=key;
  return {prepare_ms:prepared-started,upload_request_ms:performance.now()-prepared,source_cached:false};
 }
 async draw(settings,options){
  if(options.isCurrent&&!options.isCurrent())return {backend:'cuda',skipped:true};
  const preparation=options.depth&&(DepthUtils.advanced(settings)||this.viewer.depthHasInvalid)?this.viewer.prepareDepth(settings,options):null;
  const transfer=await this.upload(settings.depth_channel||'r',preparation,!!options.preview);const v=this.viewer,[w,h]=v.inputSize;
  // An upload may complete after a newer slider/source state arrives. Do not
  // dispatch another native render for an already superseded preview.
  if(options.isCurrent&&!options.isCurrent())return {backend:'cuda',skipped:true};
  const scale=options.upscale?options.limit/Math.max(w,h):Math.min(1,options.limit/Math.max(w,h));
  const width=Math.max(16,Math.round(w*scale)),height=Math.max(16,Math.round(h*scale));
  const payload={token:this.token,settings,options:{...options,width,height,taps:v.data.taps}},body=JSON.stringify(payload);
  // Artistic filters run in the presenter; their edits reuse the native frame.
  const frameKey=this.uploadKey+'|'+JSON.stringify({...payload,settings:{...settings,filters:[],edge_compensation:0,edge_compensation_limit:3}});
  if(this.lastFrame?.key===frameKey){
   if(options.isCurrent&&!options.isCurrent())return {...this.lastFrame.info,skipped:true};
   const started=performance.now();v.presentCUDA(this.lastFrame.pixels,settings,{...options,width,height,precision:this.lastFrame.info.precision});
   Object.assign(transfer,{render_request_ms:0,response_read_ms:0,present_ms:performance.now()-started});
   const info={...this.lastFrame.info,gpuMs:0,totalMs:0,frame_cached:true,transfer,draws:++v.draws};this.stats=info;return info;
  }
  const requestStarted=performance.now();const {info,buffer}=await this.request('/api/cuda/render',{method:'POST',headers:{'Content-Type':'application/json'},body},async response=>{
   transfer.render_request_ms=performance.now()-requestStarted;
   if(!response.ok){this.uploadKey=null;this.lastFrame=null;throw Error((await response.json()).error);}
   const info=JSON.parse(response.headers.get('X-Optica-Render')),readStarted=performance.now(),buffer=await response.arrayBuffer();transfer.response_read_ms=performance.now()-readStarted;return {info,buffer};
  },!!options.preview);
  if(options.isCurrent&&!options.isCurrent())return {...info,skipped:true};
  const pixels=info.precision==='float16'?new Uint16Array(buffer):new Float32Array(buffer);
  if(options.isCurrent&&!options.isCurrent())return {...info,skipped:true};
  if(pixels.length!==width*height*4)throw Error('Frame CUDA incompleto.');const presentStarted=performance.now();v.presentCUDA(pixels,settings,{...options,width,height,precision:info.precision});transfer.present_ms=performance.now()-presentStarted;this.lastFrame={key:frameKey,info,pixels};this.stats={...info,transfer,frame_cached:false};return {...info,transfer,frame_cached:false,draws:++v.draws};
 }
}
window.CUDARenderer=CUDARenderer;
