/* Source-plane ray centroids; optical mm use +Y opposite image UV +V. */
(function(root){
 'use strict';
 function sensorPlane(data,s){const [a,b,c,d]=data.matrix,inv=1/(s.focus_m*1000);return data.last_z-(a+b*inv)/(c+d*inv)+s.filmback_mm+(s.ray_focus?data.focus_calibration?.shift_mm||0:0);}
 function fieldMap(data,s,blend=1){
  const m=data.distortion;if(!m||m.schema!=='optica-field-map/1')throw Error('Mapa físico de campo indisponível.');
  const g=m.grid,dx=m.sensor_mm/(g-1),dy=dx/m.aspect,z=sensorPlane(data,s),dz=z-m.reference_z_mm,centers=m.centroids_mm_and_slopes;
  const positions=new Float64Array(3*g*g*2),mapped=new Float64Array(g*g*2),uv=new Float32Array(g*g*4),jacobian=new Float64Array(g*g*4),inverse=new Float64Array(g*g*4),valid=new Uint8Array(g*g),determinant=new Float64Array(g*g);
  for(let c=0;c<3;c++)for(let i=0;i<g*g;i++)for(let a=0;a<2;a++)positions[(c*g*g+i)*2+a]=centers[(c*g*g+i)*4+a]+dz*centers[(c*g*g+i)*4+a+2];
  for(let y=0;y<g;y++)for(let x=0;x<g;x++){const i=y*g+x,fx=(x/(g-1)-.5)*m.sensor_mm,fy=(y/(g-1)-.5)*m.sensor_mm/m.aspect;mapped[i*2]=fx+blend*(positions[(g*g+i)*2]-fx);mapped[i*2+1]=fy+blend*(positions[(g*g+i)*2+1]-fy);}
  for(let y=0;y<g;y++)for(let x=0;x<g;x++){
   const i=y*g+x,x0=Math.max(0,x-1),x1=Math.min(g-1,x+1),y0=Math.max(0,y-1),y1=Math.min(g-1,y+1),j=i*4;
   const a=(mapped[(y*g+x1)*2]-mapped[(y*g+x0)*2])/((x1-x0)*dx),b=(mapped[(y1*g+x)*2]-mapped[(y0*g+x)*2])/((y1-y0)*dy),c=(mapped[(y*g+x1)*2+1]-mapped[(y*g+x0)*2+1])/((x1-x0)*dx),d=(mapped[(y1*g+x)*2+1]-mapped[(y0*g+x)*2+1])/((y1-y0)*dy),det=a*d-b*c;
   jacobian.set([a,b,c,d],j);determinant[i]=det;valid[i]=m.throughput[g*g+i]>1e-12&&Number.isFinite(det)&&det>1e-6?1:0;
   if(valid[i])inverse.set([d/det,-b/det,-c/det,a/det],j);
   uv.set([mapped[i*2]/m.sensor_mm+.5,.5-mapped[i*2+1]*m.aspect/m.sensor_mm,valid[i],det],j);
  }
  return {grid:g,sensor_z_mm:z,positions,mapped,uv,jacobian,inverse,valid,determinant};
 }
 function forward(map,q){
  const g=map.grid,xx=Math.max(0,Math.min(g-1,q[0]*(g-1))),yy=Math.max(0,Math.min(g-1,(1-q[1])*(g-1))),x=Math.min(g-2,Math.floor(xx)),y=Math.min(g-2,Math.floor(yy)),fx=xx-x,fy=yy-y;
  const ids=[y*g+x,y*g+x+1,(y+1)*g+x,(y+1)*g+x+1];if(ids.some(i=>!map.valid[i]))return null;
  const at=(i,a)=>map.uv[i*4+a],a=ids[0],b=ids[1],c=ids[2],d=ids[3],p=[],j=[];
  for(let k=0;k<2;k++){const lo=at(a,k)*(1-fx)+at(b,k)*fx,hi=at(c,k)*(1-fx)+at(d,k)*fx;p.push(lo*(1-fy)+hi*fy);j.push(((at(b,k)-at(a,k))*(1-fy)+(at(d,k)-at(c,k))*fy)*(g-1),-((at(c,k)-at(a,k))*(1-fx)+(at(d,k)-at(b,k))*fx)*(g-1));}
  return {position:p,jacobian:j};
 }
 function inversePoint(map,target){let q=[...target];for(let i=0;i<12;i++){const f=forward(map,q);if(!f)return null;const [a,b,c,d]=f.jacobian,det=a*d-b*c;if(det<=1e-6)return null;const x=f.position[0]-target[0],y=f.position[1]-target[1];if(Math.hypot(x,y)<2e-6)break;q[0]=Math.max(0,Math.min(1,q[0]-(d*x-b*y)/det));q[1]=Math.max(0,Math.min(1,q[1]-(-c*x+a*y)/det));}const f=forward(map,q);return f&&Math.hypot(f.position[0]-target[0],f.position[1]-target[1])<2e-5?q:null;}
 let cache=null;
 function prepare(data,s){
  const blend=s.master_blend??1;if(!Number.isFinite(blend)||blend<0||blend>1)throw Error("Mistura física deve estar entre 0 e 1.");if(!s.physical_distortion||blend<=0)return data;
  const key=JSON.stringify([data.atlas_id,data.prescription_id,data.distortion.id,data.atlas_layout||"canonical",sensorPlane(data,s),blend]);if(cache?.key===key)return cache.data;
  const map=fieldMap(data,s,blend),g=data.grid,t=data.taps,rays=new Float32Array(data.atlas.length),pupils=new Float32Array(data.pupils),packed=data.atlas_layout==='webgl-packed-f32';let radius=0,slope=0;
  for(let c=0;c<3;c++)for(let tap=0;tap<t;tap++)for(let y=0;y<g;y++)for(let x=0;x<g;x++){
   const i=packed?(((tap*g+y)*3+c)*g+x)*4:(((c*t+tap)*g+y)*g+x)*4,j=(y*g+x)*4,[a,b,cc,d]=map.inverse.subarray(j,j+4),v=data.atlas;
   rays[i]=a*v[i]+b*v[i+1];rays[i+1]=cc*v[i]+d*v[i+1];rays[i+2]=a*v[i+2]+b*v[i+3];rays[i+3]=cc*v[i+2]+d*v[i+3];pupils[i+2]*=map.valid[y*g+x];radius=Math.max(radius,Math.hypot(rays[i],rays[i+1]));slope=Math.max(slope,Math.hypot(rays[i+2],rays[i+3]));
  }
  const result={...data,atlas:rays,pupils,radius_mm:radius,max_slope:slope,atlas_id:data.atlas_id+'|physical|'+key,_physicalPrepared:true,_physicalMap:map};cache={key,data:result};return result;
 }
 const fragment=`#version 300 es
 precision highp float;in vec2 uv;out vec4 outColor;
 uniform sampler2D plate,fieldMap;uniform int grid;uniform vec2 renderSize;
 bool forwardMap(vec2 q,out vec2 p,out mat2 j){
  vec2 node=clamp(vec2(q.x,1.-q.y),0.,1.)*float(grid-1);ivec2 lo=min(ivec2(floor(node)),ivec2(grid-2));vec2 f=node-vec2(lo);
  vec4 a=texelFetch(fieldMap,lo,0),b=texelFetch(fieldMap,lo+ivec2(1,0),0),c=texelFetch(fieldMap,lo+ivec2(0,1),0),d=texelFetch(fieldMap,lo+ivec2(1,1),0);
  if(min(min(a.z,b.z),min(c.z,d.z))<.5)return false;
  p=mix(mix(a.xy,b.xy,f.x),mix(c.xy,d.xy,f.x),f.y);
  j=mat2(mix(b.xy-a.xy,d.xy-c.xy,f.y),-mix(c.xy-a.xy,d.xy-b.xy,f.x))*float(grid-1);return true;
 }
 void main(){vec2 q=uv,p;mat2 j;bool ok=true;
  for(int i=0;i<12;i++){if(!forwardMap(q,p,j)||determinant(j)<=1e-6){ok=false;break;}vec2 e=p-uv;if(length(e)<2e-6)break;q=clamp(q-inverse(j)*e,0.,1.);}
  if(!ok||!forwardMap(q,p,j)||length(p-uv)>2e-5){outColor=vec4(0.,0.,0.,1.);return;}
  vec2 dx=dFdx(q)*renderSize,dy=dFdy(q)*renderSize;float lod=.5*log2(max(1.,max(dot(dx,dx),dot(dy,dy))));outColor=vec4(textureLod(plate,q,lod).rgb,1.);
 }`;
 class Pass{
  constructor(viewer,vertex){this.viewer=viewer;const g=viewer.gl;this.program=g.createProgram();for(const [type,src]of [[g.VERTEX_SHADER,vertex],[g.FRAGMENT_SHADER,fragment]]){const sh=g.createShader(type);g.shaderSource(sh,src);g.compileShader(sh);if(!g.getShaderParameter(sh,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(sh));g.attachShader(this.program,sh);g.deleteShader(sh);}g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(this.program));this.uniforms=Object.fromEntries(['plate','fieldMap','grid','renderSize'].map(k=>[k,g.getUniformLocation(this.program,k)]));this.output=g.createTexture();this.map=g.createTexture();this.fbo=g.createFramebuffer();}
  draw(s,{rw,rh,plateUnit}){
   if(!s.physical_distortion||(s.master_blend??1)<=0)return plateUnit;
   const v=this.viewer,g=v.gl,m=v.data._physicalMap;if(!m)throw Error('Projeção física desatualizada.');
   g.activeTexture(g.TEXTURE0+plateUnit);const plate=g.getParameter(g.TEXTURE_BINDING_2D);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);v.buildGaussianPyramid(rw,rh,plate,plateUnit);
   g.activeTexture(g.TEXTURE3);g.bindTexture(g.TEXTURE_2D,plate);g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,this.map);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
   if(this.key!==v.data.atlas_id){g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);g.texImage2D(g.TEXTURE_2D,0,g.RGBA32F,m.grid,m.grid,0,g.RGBA,g.FLOAT,m.uv);this.key=v.data.atlas_id;}
   g.activeTexture(g.TEXTURE6);g.bindTexture(g.TEXTURE_2D,this.output);if(this.size!==rw+','+rh){g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.size=rw+','+rh;}
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.output,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer de distorção física indisponível.');g.viewport(0,0,rw,rh);g.useProgram(this.program);g.uniform1i(this.uniforms.plate,3);g.uniform1i(this.uniforms.fieldMap,2);g.uniform1i(this.uniforms.grid,m.grid);g.uniform2f(this.uniforms.renderSize,rw,rh);g.drawArrays(g.TRIANGLES,0,3);return 6;
  }
 }
 const texts={
  'pt-BR':['Mapa físico de distorção','Aplicar posição e magnificação da lente','Exportar mapa JSON','Projeção do plano de entrada; RGB vem dos raios. Preto fora do campo ou em regiões sem inversa válida. Tracejado: grade ideal; vermelho, verde e azul: projeção dos raios. Refine a grade óptica para maior precisão. Depth usa o mesmo mapa de referência.'],
  en:['Physical distortion map','Apply lens position and magnification','Export JSON map','Input-plane projection; RGB comes from traced rays. Black outside the field or without a valid inverse. Dashed: ideal grid; red, green and blue: traced projection. Refine the optical grid for accuracy. Depth uses the same reference map.'],
  'zh-CN':['物理畸变映射','应用镜头位置与放大率','导出 JSON 映射','输入平面投影，RGB 来自追踪光线。视场外或无有效逆映射时为黑色。虚线为理想网格，红、绿、蓝线为光线投影。提高光学网格精度可改善结果。深度使用同一参考映射。']
 };
 class Inspector{
  constructor(host,onChange){this.host=host;host.className='physical-distortion-panel';host.setAttribute('data-i18n-skip','');host.innerHTML='<h4></h4><label><input type="checkbox"><span></span></label><canvas width="640" height="400"></canvas><output></output><p></p><button type="button"></button>';this.check=host.querySelector('input');this.check.onchange=()=>onChange(this.check.checked);host.querySelector('button').onclick=()=>this.export();new MutationObserver(()=>this.translate()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});this.translate();}
  translate(){const t=texts[document.documentElement.lang]||texts['pt-BR'];this.host.querySelector('h4').textContent=t[0];this.host.querySelector('span').textContent=t[1];this.host.querySelector('button').textContent=t[2];this.host.querySelector('p').textContent=t[3];}
  update(data,s,width){this.check.checked=!!s.physical_distortion;this.data=data;this.settings={...s};this.width=width;if(!data?.distortion)return;const paintKey=data.atlas_id+"|"+data.distortion.id+"|"+sensorPlane(data,s);if(this.paintKey===paintKey)return;this.paintKey=paintKey;this.map=fieldMap(data,s);const m=this.map,g=m.grid,c=this.host.querySelector('canvas').getContext('2d'),sx=440,sy=280,X=u=>100+u*sx,Y=v=>340-v*sy;c.clearRect(0,0,640,400);c.fillStyle='#101a20';c.fillRect(0,0,640,400);c.setLineDash([4,5]);c.strokeStyle='#576b75';for(let i=0;i<g;i++){const t=i/(g-1);c.beginPath();c.moveTo(X(t),Y(0));c.lineTo(X(t),Y(1));c.moveTo(X(0),Y(t));c.lineTo(X(1),Y(t));c.stroke();}c.setLineDash([]);
   for(const [ch,color]of [[0,'#ff9b8d'],[1,'#b9efc8'],[2,'#92bdff']]){c.strokeStyle=color;for(let axis=0;axis<2;axis++)for(let line=0;line<g;line++){c.beginPath();let active=false;for(let k=0;k<g;k++){const i=axis?line*g+k:k*g+line;if(!m.valid[i]){active=false;continue;}const x=m.positions[(ch*g*g+i)*2]/data.distortion.sensor_mm+.5,y=.5-m.positions[(ch*g*g+i)*2+1]*data.distortion.aspect/data.distortion.sensor_mm;if(active)c.lineTo(X(x),Y(y));else c.moveTo(X(x),Y(y));active=true;}c.stroke();}}
   const det=[...m.determinant].filter((v,i)=>m.valid[i]),chroma=Math.max(...Array.from({length:g*g},(_,i)=>m.valid[i]?Math.hypot(m.positions[i*2]-m.positions[(g*g+i)*2],m.positions[i*2+1]-m.positions[(g*g+i)*2+1]):0));this.host.querySelector('output').textContent=`z ${m.sensor_z_mm.toFixed(3)} mm · J ${det.length?Math.min(...det).toFixed(3)+'…'+Math.max(...det).toFixed(3):'—'} · R−G ${chroma.toFixed(4)} mm · ${m.valid.reduce((a,b)=>a+b,0)}/${g*g}`;
  }
  payload(){if(!this.map)return null;const m=this.map,g=m.grid,inverse=[];for(let y=0;y<=32;y++)for(let x=0;x<=32;x++){const q=[x/32,y/32],source=inversePoint(m,q);inverse.push({destination_uv:q,source_uv:source,valid:!!source});}return {schema:'optica-distortion-export/1',distortion_id:this.data.distortion.id,prescription_id:this.data.prescription_id,units:{length:'mm',wavelength:'um'},uv_convention:'bottom_up_image; optical_y_opposes_v',projection:'source-plane-energy-weighted-centroids',sensor_reference_axis:'x',source_m:this.data.distortion.source_m,sensor_z_mm:m.sensor_z_mm,sensor_mm:this.data.distortion.sensor_mm,aspect:this.data.distortion.aspect,wavelengths_um:this.data.distortion.wavelengths_um,grid:g,centroids_and_slopes:this.data.distortion.centroids_mm_and_slopes,throughput:this.data.distortion.throughput,positions_mm:Array.from(m.positions),forward_green_uv:Array.from(m.uv),jacobian_mm_per_mm:Array.from(m.jacobian),valid:Array.from(m.valid),inverse_grid:33,inverse};}
  export(){const payload=this.payload();if(!payload)return;const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='OpticaLab-Mapa-Fisico.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }
 root.PhysicalDistortion={sensorPlane,fieldMap,forward,inversePoint,prepare,Pass,Inspector};
})(typeof window==='object'?window:globalThis);
