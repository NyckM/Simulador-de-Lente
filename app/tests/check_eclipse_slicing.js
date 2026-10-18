(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:256,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const w=640,h=400,scene=document.createElement('canvas');scene.width=w;scene.height=h;const ctx=scene.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
 const raw=new Float32Array(w*h*4);for(let i=3;i<raw.length;i+=4)raw[i]=1;
 for(const y of [130,270])for(let yy=y-1;yy<=y+1;yy++)for(let xx=349;xx<=351;xx++){const i=(yy*w+xx)*4;raw[i]=100;raw[i+1]=50;raw[i+2]=12;}
 const map=document.createElement('canvas');map.width=w;map.height=h;const mc=map.getContext('2d');mc.fillStyle='black';mc.fillRect(0,0,w,h);mc.fillStyle='rgb(204,204,204)';mc.fillRect(0,0,345,200);mc.fillStyle='rgb(128,128,128)';mc.fillRect(0,200,345,200);
 const file=async(c,name)=>new File([await new Promise(r=>c.toBlob(r,'image/png'))],name,{type:'image/png'});
 settings={...defaults,focus_m:1,source_m:5,near_m:2,far_m:5,invert_depth:false,blades:0,bokeh_gain:6,render_backend:'webgl',depth_mode:'auto',depth_slices:12,depth_feather:0};quality='veryhigh';
 await openImage(await file(scene,'Luzes.png'));await openDepth(await file(map,'Depth contínuo.png'));gpu.uploadSource(scene,w,h,raw);await updateKernel();await wait();
 const legacyCanvas=document.createElement('canvas'),legacy=new LegacyLensGPU(legacyCanvas);legacy.uploadSource(scene,w,h,raw);legacy.uploadDepth(map);legacy.setKernel(atlas);
 const opts={limit:640,samples:256,aa:1,depth:true,invert:false,near:2,far:5};
 const read=()=>{const g=gpu.gl,a=new Float32Array(w*h*4);g.bindFramebuffer(g.FRAMEBUFFER,gpu.renderFbo);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);g.bindFramebuffer(g.FRAMEBUFFER,null);if(g.getError()!==g.NO_ERROR)throw Error('Read failed');return a;};
 const baseline=canvas.toDataURL(),base=read();legacy.draw(settings,opts);const disabledRestores=baseline===legacyCanvas.toDataURL();
 const depthBefore=depth;$('eclipse-bokeh').checked=true;$('eclipse-bokeh').onchange();await wait();const current=read(),frame=canvas.toDataURL();legacy.draw(settings,opts);const images={'Antes · blur em mapas contínuos':legacyCanvas.toDataURL(),'Depois · eclipse por pupila':frame};
 let shapeDifference=0;for(let i=0;i<current.length;i++)shapeDifference+=Math.abs(current[i]-base[i]);shapeDifference/=current.length;
 await wait();const stable=frame===canvas.toDataURL();const settingsPreserved=settings.focus_m===1&&settings.depth_mode==='auto'&&settings.near_m===2&&settings.far_m===5&&depth===depthBefore;
 const encoded=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;const d=c.getContext('2d');d.drawImage(canvas,0,0);return d.getImageData(0,0,w,h).data;};const gl=encoded();settings.render_backend='cuda';await wait();const native=encoded();let difference=0;for(let i=0;i<gl.length;i++)difference+=Math.abs(gl[i]-native[i])/255;difference/=gl.length;
 settings.focus_m=5;await wait();images['Depois · foco nas luzes']=canvas.toDataURL();const focusedFrame=canvas.toDataURL();
 // Highlights retain the same eclipse in both backends, including the new wave pass.
 settings.focus_m=1;settings.diffraction_gain=1.1;settings.ghost_gain=39.6;settings.diffraction_scale=4.5;await wait();const nativeWave=encoded();settings.render_backend='webgl';await wait();const glWave=encoded();let waveDifference=0;for(let i=0;i<glWave.length;i++)waveDifference+=Math.abs(nativeWave[i]-glWave[i])/255;waveDifference/=glWave.length;
 settings.ghost_gain=0;settings.diffraction_gain=0;settings.highlight_view='base';await wait();const low=read();settings.highlight_view='highlights';await wait();const high=read();settings.highlight_view='final';await wait();const final=read();let splitError=0;for(let i=0;i<final.length;i++)if(i%4!==3)splitError=Math.max(splitError,Math.abs(final[i]-low[i]-high[i]));
 window.eclipseTestResult={disabledRestores,stable,settingsPreserved,shapeDifference,cudaDifference:difference,waveDifference,splitError,focusChanges:focusedFrame!==frame,cudaActive:!cudaFailed,images};
}catch(e){window.eclipseTestResult={error:e.message,stack:e.stack};}})()
