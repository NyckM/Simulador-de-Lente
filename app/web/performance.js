'use strict';
// Bounded diagnostics only: no GPU fences or pixel readbacks during normal use.
class LensPerformance {
 constructor(){
  this.frames=[];this.atlas=null;this.latest=null;
  this.host=document.createElement('details');this.host.id='performance-panel';this.host.className='performance-panel';this.host.setAttribute('data-i18n-skip','');
  this.title=document.createElement('summary');this.table=document.createElement('dl');this.note=document.createElement('p');this.note.className='note';
  this.button=document.createElement('button');this.button.type='button';this.button.onclick=()=>this.download();
  this.host.append(this.title,this.table,this.note,this.button);document.querySelector('.render-bar').after(this.host);
  this.host.addEventListener('toggle',()=>this.paint());
  new MutationObserver(()=>this.paint()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});this.paint();
 }
 recordAtlas(data,httpMs,uploadMs,uploadSkipped=false){this.atlas={...data.profile,trace_backend:data.trace_backend,trace_device:data.trace_device,prescription_id:data.prescription_id,atlas_id:data.atlas_id,wire_layout:data.atlas_layout||'json',transfer_bytes:data.transfer_bytes??null,http_ms:httpMs,upload_ms:uploadMs,upload_skipped:uploadSkipped};this.paint();}
 recordFrame(result,wallMs,stage){this.latest={backend:result.backend||'webgl',device:result.device||null,wall_ms:wallMs,server_wall_ms:result.totalMs??null,gpu_ms:result.gpuMs??null,gpu_timing:result.frame_cached?'cached_no_dispatch':result.backend==='cuda'?'current':'last_completed_query',frame_cached:!!result.frame_cached,worker_transfer:result.workerTransfer||null,worker_ms:result.workerRoundtripMs??null,width:result.width,height:result.height,samples:result.samples,stage,transfer:result.transfer||null};this.frames.push(wallMs);if(this.frames.length>120)this.frames.shift();if(this.host.open)this.paint();}
 snapshot(){const values=[...this.frames].sort((a,b)=>a-b);return {schema:'optica-performance/1',timestamp:new Date().toISOString(),atlas:this.atlas,frame:this.latest,window:{count:values.length,median_ms:values.length?(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2:null,p95_ms:values.length?values[Math.min(values.length-1,Math.ceil(values.length*.95)-1)]:null}};}
 paint(){
  const lang=document.documentElement.lang,zh=lang.startsWith('zh'),en=lang.startsWith('en');
  const words=zh?['性能','光线追踪 / 图像','最近一次构建：镜头 / 追踪 / 汇总','缓存 / 查找','图集请求 / 上传命令','帧 / 中位数 / P95','GPU 计时','CUDA：输入准备 / 上传请求','CUDA：渲染请求 / 响应读取 / 显示命令','导出诊断','计时可能重叠。WebGL GPU 时间来自最近完成的查询；命令提交不代表 GPU 完成。请求时间包含服务器和传输。']:en?['Performance','Ray trace / image','Last build: lens / trace / assembly','Cache / lookup','Atlas request / upload submission','Frame / median / P95','GPU timer','CUDA: input preparation / upload request','CUDA: render request / response read / presentation submission','Export diagnostics','Timings may overlap. WebGL GPU time is the last completed query; command submission does not mean GPU completion. Request time includes server and transport.']:['Desempenho','Traçado / imagem','Última construção: lente / raios / montagem','Cache / consulta','Pedido do atlas / envio de comandos','Quadro / mediana / P95','Tempo GPU','CUDA: preparar entrada / pedido de envio','CUDA: pedido de render / leitura da resposta / comandos de exibição','Exportar diagnóstico','Os tempos podem se sobrepor. GPU WebGL mostra a última consulta concluída; enviar comandos não significa terminar na GPU. Pedidos incluem servidor e transporte.'];
  this.title.textContent=words[0];this.button.textContent=words[9];this.note.textContent=words[10];this.table.replaceChildren();
  const a=this.atlas,f=this.latest,s=this.snapshot(),ms=x=>Number.isFinite(x)?x.toFixed(2)+' ms':'—';
  const row=(label,value)=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;this.table.append(dt,dd);};
  row(words[1],`${a?.trace_backend||'—'} / ${f?.backend||'—'}${f?.device?' · '+f.device:''}`);
  row(words[2],[a?.lens_ms,a?.trace_ms,a?.assembly_ms].map(ms).join(' / '));
  row(words[3],`${a?(a.cache_hit?'hit':'miss'):'—'} / ${ms(a?.lookup_ms)}`);
  if(a?.ray_cache)row(zh?'最近构建：光线缓存 / 内存':en?'Last build: ray cache / memory':'Última construção: cache de raios / memória',`${a.ray_cache_hit?'hit':'miss'} / ${(a.ray_cache.bytes/1048576).toFixed(1)} / ${(a.ray_cache.max_bytes/1048576).toFixed(0)} MiB`);
  row(words[4],[a?.http_ms,a?.upload_ms].map(ms).join(' / ')+(a?.upload_skipped?' · cache':'')+(a?.transfer_bytes?' · '+(a.transfer_bytes/1024).toFixed(1)+' KiB':''));
  row(words[5]+` (${s.window.count})`,[f?.wall_ms,s.window.median_ms,s.window.p95_ms].map(ms).join(' / '));
  row(words[6],ms(f?.gpu_ms)+(f?.frame_cached?' · cache':''));
  if(f?.worker_transfer)row(zh?'CUDA 进程传输':en?'CUDA process transfer':'Transferência do processo CUDA',`${f.worker_transfer} / ${ms(f.worker_ms)}`);
  if(f?.transfer){row(words[7],[f.transfer.prepare_ms,f.transfer.upload_request_ms].map(ms).join(' / '));row(words[8],[f.transfer.render_request_ms,f.transfer.response_read_ms,f.transfer.present_ms].map(ms).join(' / '));}
 }
 download(){const blob=new Blob([JSON.stringify(this.snapshot(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='optica-performance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
window.LensPerformance=LensPerformance;
