(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:512,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const w=640,h=400,scene=document.createElement('canvas');scene.width=w;scene.height=h;const c=scene.getContext('2d');c.fillStyle='#030508';c.fillRect(0,0,w,h);
 c.fillStyle='white';for(const x of [70,180,450,570])for(const y of [65,200,335])c.fillRect(x-3,y-3,7,7);
 c.fillStyle='#789d87';c.fillRect(280,145,80,110);c.fillStyle='#121b15';for(let x=290;x<355;x+=8)c.fillRect(x,160,3,80);
 const map=document.createElement('canvas');map.width=w;map.height=h;const m=map.getContext('2d');m.fillStyle='black';m.fillRect(0,0,w,h);m.fillStyle='white';m.fillRect(280,145,80,110);
 const file=async(canvas,name)=>new File([await new Promise(r=>canvas.toBlob(r,'image/png'))],name,{type:'image/png'});
 settings={...defaults,focus_m:2,source_m:5,near_m:2,far_m:5,invert_depth:false,blades:0,bokeh_gain:2,render_backend:'webgl',depth_mode:'auto'};quality='extreme';
 await openImage(await file(scene,'Astigmatismo.png'));await openDepth(await file(map,'Depth.png'));await updateKernel();sync();await wait();
 $('astigmatism-positive').closest('details').open=true;const base=canvas.toDataURL(),mapBefore=depth,model=settings.lens_model;
 const pressed=(id,value)=>$(id).getAttribute('aria-pressed')===String(value);
 const neutral=pressed('astigmatism-negative',false)&&pressed('astigmatism-positive',false);
 $('astigmatism-positive').click();const startsAtOne=settings.astigmatism_mm===1;
 $('astigmatism_mm').value=.8;$('astigmatism_mm').onchange();await wait();const positive=canvas.toDataURL();
 $('astigmatism-negative').click();await wait();const negative=canvas.toDataURL(),negativeSelected=pressed('astigmatism-negative',true)&&pressed('astigmatism-positive',false)&&settings.astigmatism_mm===-.8;
 const negativeProfile=ProfileStore.create('Astigmatismo negativo',snapshot());
 $('astigmatism-positive').click();await wait();const signPreservesMagnitude=settings.astigmatism_mm===.8&&pressed('astigmatism-positive',true)&&positive===canvas.toDataURL();
 const profile=ProfileStore.parse(JSON.parse(JSON.stringify(negativeProfile)));await restoreProfile(profile);await wait();const profileRestored=settings.astigmatism_mm===-.8&&pressed('astigmatism-negative',true)&&negative===canvas.toDataURL();
 $('astigmatism_mm-range').value=1.35;$('astigmatism_mm-range').oninput();const manualSignSync=pressed('astigmatism-positive',true);$('astigmatism-negative').click();const manualMagnitudePreserved=settings.astigmatism_mm===-1.35;
 settings.astigmatism_mm=-.8;sync();await wait();const before=canvas.toDataURL();await wait();const stable=before===canvas.toDataURL();
 const read=()=>{const g=gpu.gl,a=new Float32Array(w*h*4);g.bindFramebuffer(g.FRAMEBUFFER,gpu.renderFbo);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);g.bindFramebuffer(g.FRAMEBUFFER,null);if(g.getError()!==g.NO_ERROR)throw Error('Read failed');return a;};
 const difference=(a,b)=>{let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);return sum/a.length;};
 const glNegative=read();settings.render_backend='cuda';await wait();const negativeDifference=difference(glNegative,read());$('astigmatism-positive').click();await wait();const nativePositive=read();settings.render_backend='webgl';await wait();const positiveDifference=difference(nativePositive,read());
 const settingsPreserved=mapBefore===depth&&settings.focus_m===2&&settings.near_m===2&&settings.far_m===5&&model===settings.lens_model&&$('use-depth').checked;
 recordLock(true);const locked=$('astigmatism-negative').disabled&&$('astigmatism-positive').disabled;recordLock(false);
 const originalBusy=depthBusy;depthBusy=true;$('astigmatism-negative').onclick();const busyGuard=settings.astigmatism_mm===.8;depthBusy=originalBusy;
 $('astigmatism_mm').value=0;$('astigmatism_mm').onchange();await wait();const zeroRestores=base===canvas.toDataURL()&&pressed('astigmatism-negative',false)&&pressed('astigmatism-positive',false);
 window.astigmatismTestResult={neutral,startsAtOne,negativeSelected,signPreservesMagnitude,profileRestored,manualSignSync,manualMagnitudePreserved,stable,settingsPreserved,locked,busyGuard,zeroRestores,changed:positive!==negative,negativeDifference,positiveDifference,cudaActive:!cudaFailed,images:{'Positivo · +0,8 mm':positive,'Negativo · −0,8 mm':negative}};
}catch(e){window.astigmatismTestResult={error:e.message,stack:e.stack};}})()
