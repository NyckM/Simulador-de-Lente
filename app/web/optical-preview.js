/* Independent inspection renderer. Runs only while the right drawer is open. */
'use strict';
class OpticalPreview {
 constructor(){
  this.drawer=document.getElementById('optical-inspection');this.caption=document.getElementById('optical-preview-caption');this.revision=0;this.timer=null;this.renderer=null;this.key='';
  new MutationObserver(()=>{if(this.drawer.hidden){clearTimeout(this.timer);this.revision++;}else this.schedule();}).observe(this.drawer,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('opticalsettingschange',()=>this.schedule());
 }
 schedule(){clearTimeout(this.timer);const revision=++this.revision;if(!this.drawer.hidden)this.timer=setTimeout(()=>this.update(revision),180);}
 image(point=null){
  if(!point&&this.sceneImage)return this.sceneImage;
  const w=384,h=256,a=new Float32Array(w*h*4),z=new Float32Array(w*h);for(let i=0;i<w*h;i++)a[i*4+3]=1;
  const paint=(x,y,color,front=false)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=(Math.round(y)+dy)*w+Math.round(x)+dx;a.set([...color,1],i*4);}if(front)for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++)z[(Math.round(y)+dy)*w+Math.round(x)+dx]=1;};
  if(point){a.set([160,160,160,1],(Math.round(point.y*h)*w+Math.round(point.x*w))*4);return {a,z};}
  let seed=139;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const colors=[[30,8,18],[5,24,40],[40,32,8],[9,22,15]];
  for(let i=0;i<42;i++)paint(12+random()*(w-24),12+random()*(h-24),colors[i%4],i%5===0);
  return this.sceneImage={a,z};
 }
 upload(image){if(this.uploadedImage===image)return;this.renderer.uploadSource(null,384,256,image.a);this.renderer.uploadDepthFloat(image.z,384,256);this.uploadedImage=image;}
 draw(s,near,far){return this.renderer.draw({...s,depth_mode:'slicing',depth_slices:2,depth_gain:1,depth_bias:0,invert_depth:false,highlight_detail:false,highlight_view:'final',master_blend:1},{limit:384,samples:256,aa:1,depth:true,invert:false,near,far});}
 response(id,s,distance,point,label){
  // Magnify traced PSFs directly, avoiding magnified source-pixel squares.
  const data=this.renderer.baseData||this.renderer.data,g=data.grid,n=data.taps,points=[],fr=Math.hypot((point.x-.5)*2,(.5-point.y)*4/3),rx=fr?((point.x-.5)*2)/fr:1,ry=fr?((.5-point.y)*4/3)/fr:0;
  const dz=this.renderer.plane(s.focus_m)+s.filmback_mm+(s.ray_focus?data.focus_calibration?.shift_mm||0:0)-data.reference_z+this.renderer.plane(data.source_m)-this.renderer.plane(distance),fd=this.renderer.plane(s.focus_m)+s.filmback_mm-this.renderer.plane(distance),ps=s.iris_mm/data.max_iris_mm,stretch=1+s.swirl*fr;
  const sample=(values,c,i)=>{const x=point.x*(g-1),y=(1-point.y)*(g-1),ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;return [0,1,2,3].map(k=>{const at=(xx,yy)=>values[((c*n+i)*g*g+Math.min(g-1,yy)*g+Math.min(g-1,xx))*4+k];return (at(ix,iy)*(1-tx)+at(ix+1,iy)*tx)*(1-ty)+(at(ix,iy+1)*(1-tx)+at(ix+1,iy+1)*tx)*ty;});};
  for(let c=0;c<3;c++)for(let i=0;i<n;i++){
   const ray=sample(data.atlas,c,i),pupil=sample(data.pupils,c,i),rho=pupil[0]**2+pupil[1]**2,chroma=c===0?1:c===2?-1:0;
   const character=2.8*s.impression*fd/Math.sqrt(fd*fd+.0001),scale=Math.exp(character*(rho-.5));
   let x=(ray[0]+(dz+chroma*s.ca_axial)*ray[2])*scale,y=(ray[1]+(dz+chroma*s.ca_axial)*ray[3])*scale;
   const split=(s.astigmatism_mm||0)*fr*fr,ar=ray[2]*rx+ray[3]*ry,at=-ray[2]*ry+ray[3]*rx;x+=split*(ar*rx+at*ry)*scale;y+=split*(ar*ry-at*rx)*scale;
   const spherical=.35*(s.spherical3*ps**3*rho+s.spherical5*ps**5*rho*rho);x+=pupil[0]*spherical;y+=pupil[1]*spherical;
   if(fr>.0001){const r=x*rx+y*ry,t=-x*ry+y*rx;x=r*rx/stretch-t*ry*stretch;y=r*ry/stretch+t*rx*stretch;const coma=s.coma*(x*x+y*y)*.3;x+=coma*rx;y+=coma*ry;}x/=s.squeeze;
   const rim=Math.max(0,Math.min(1,(rho-.25)/.6)),weight=pupil[2]*pupil[3]*Math.exp(-s.apodization*rho*4)*(1+s.rim_gain*rim*rim*(3-2*rim));if(weight>0)points.push({x,y,c,weight});
  }
  let radius=.0001;for(const p of points)radius=Math.max(radius,Math.hypot(p.x,p.y));const scale=44/radius,values=new Float32Array(112*112*3);
  for(const p of points){const x=56+p.x*scale,y=54-p.y*scale;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const xx=Math.round(x)+dx,yy=Math.round(y)+dy;if(xx>=0&&xx<112&&yy>=0&&yy<112)values[(yy*112+xx)*3+p.c]+=p.weight*Math.exp(-(dx*dx+dy*dy)/6.5);}}
  let peak=.00001;for(const value of values)peak=Math.max(peak,value);
  const target=document.getElementById(id),ctx=target.getContext('2d'),image=ctx.createImageData(112,112);for(let i=0;i<112*112;i++){for(let c=0;c<3;c++)image.data[i*4+c]=255*Math.pow(Math.min(1,values[i*3+c]/peak),1/2.2);image.data[i*4+3]=255;}ctx.putImageData(image,0,0);ctx.fillStyle='#aab6ad';ctx.font='9px Segoe UI';ctx.fillText(label,5,105);
 }
 spot(s){
  const data=this.spotData,grid=data.grid,n=data.taps,c=1,index=Math.floor(grid/2),points=[];
  const dz=this.renderer.plane(s.focus_m)-data.reference_z+s.filmback_mm+(s.ray_focus?data.focus_calibration?.shift_mm||0:0);
  for(let i=0;i<n;i++){const offset=((c*n+i)*grid*grid+index*grid+index)*4;const weight=data.pupils[offset+2];if(weight<=0)continue;points.push([data.atlas[offset]+dz*data.atlas[offset+2],data.atlas[offset+1]+dz*data.atlas[offset+3]]);}
  const canvas=document.getElementById('optical-spot'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,112,112);ctx.fillStyle='#000';ctx.fillRect(0,0,112,112);
  let radius=.001;for(const [x,y]of points)radius=Math.max(radius,Math.hypot(x,y));const scale=46/radius;
  ctx.fillStyle='#b9efc8';for(const [x,y]of points){ctx.beginPath();ctx.arc(56+x*scale,52-y*scale,.7,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#aab6ad';ctx.font='9px Segoe UI';ctx.fillText((radius*2000).toFixed(1)+' µm',5,105);
 }
 async update(revision){
  try{
   const s={...settings,lens_edits:(lensDraftEdits??settings.lens_edits).map(x=>[...x])};
   if(!this.renderer){this.scratch=document.createElement('canvas');this.renderer=new LensGPU(this.scratch);}
   const key=JSON.stringify([...opticalKeys].map(k=>s[k]).concat(s.lens_edits));
   if(key!==this.key){this.caption.textContent='Atualizando a resposta da lente…';const data=await post('/api/kernel',{settings:{...s,near_m:.8,far_m:10},aspect:1.5,taps:256});if(revision!==this.revision||this.drawer.hidden)return;this.renderer.setKernel(data);this.key=key;}
   if(revision!==this.revision||this.drawer.hidden)return;
   const spotKey=key+':'+s.focus_m;if(this.spotKey!==spotKey){const data=await post('/api/kernel',{settings:{...s,source_m:s.focus_m,near_m:.8,far_m:10},aspect:1.5,taps:256});if(revision!==this.revision||this.drawer.hidden)return;this.spotData=data;this.spotKey=spotKey;}
   // Test planes stay fixed while focus racks, matching the main demo/depth.
   const range=depthRange(),near=range.near,far=range.far;
   await this.renderer.prepareDirt(s.lens_dirt_texture||'',s);if(revision!==this.revision||this.drawer.hidden)return;
   this.upload(this.image());this.draw(s,near,far);
   const scene=document.getElementById('optical-lights'),ctx=scene.getContext('2d');ctx.clearRect(0,0,384,256);ctx.drawImage(this.scratch,0,0,384,256);
   ctx.strokeStyle='#98aaa333';ctx.beginPath();ctx.moveTo(186,128);ctx.lineTo(198,128);ctx.moveTo(192,122);ctx.lineTo(192,134);ctx.stroke();
   document.getElementById('optical-sensor-caption').textContent=`SENSOR ${s.sensor_mm.toFixed(0)} × ${(s.sensor_mm/1.5).toFixed(0)} MM · FRENTE ${near.toFixed(2)} M / FUNDO ${far.toFixed(2)} M`;
   this.response('optical-center',s,far,{x:.5,y:.5},far.toFixed(2)+' m');
   this.response('optical-edge',s,far,{x:.84,y:.5},far.toFixed(2)+' m');
   this.response('optical-front',s,near,{x:.5,y:.5},near.toFixed(2)+' m');this.spot(s);
   this.caption.textContent='Luzes renderizadas na GPU; bokeh do atlas de raios, ampliado individualmente com os ajustes criativos. Spot: raios da prescrição no eixo, ampliados; escala indicada em µm.';
   scene.dataset.revision=String(revision);scene.dataset.focus=String(s.focus_m);
  }catch(e){if(revision===this.revision)this.caption.textContent='Não foi possível atualizar a inspeção: '+e.message;}
 }
}
document.addEventListener('DOMContentLoaded',()=>{window.opticalPreview=new OpticalPreview();});
