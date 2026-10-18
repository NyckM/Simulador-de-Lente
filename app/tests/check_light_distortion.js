(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:512,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const w=640,h=400,scene=document.createElement('canvas');scene.width=w;scene.height=h;const ctx=scene.getContext('2d');ctx.fillStyle='#020508';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='white';for(const x of [95,270,295,505])for(const y of [95,315])ctx.fillRect(x-3,y-3,7,7);
 ctx.fillStyle='#729781';ctx.fillRect(285,150,70,100);ctx.fillStyle='#111';for(let x=295;x<350;x+=8)ctx.fillRect(x,165,3,70);
 const map=document.createElement('canvas');map.width=w;map.height=h;const mc=map.getContext('2d');mc.fillStyle='rgb(25,25,25)';mc.fillRect(0,0,w,h);mc.fillStyle='white';mc.fillRect(285,150,70,100);
 const file=async(c,name)=>new File([await new Promise(r=>c.toBlob(r,'image/png'))],name,{type:'image/png'});
 settings={...defaults,focus_m:.7,source_m:5,near_m:.7,far_m:5,invert_depth:false,blades:0,bokeh_gain:3,render_backend:'webgl',depth_mode:'slicing',depth_slices:16};quality='extreme';
 await openImage(await file(scene,'Luzes e alvo.png'));await openDepth(await file(map,'Depth.png'));await updateKernel();sync();await wait();
 const baseline=canvas.toDataURL(),mapBefore=depth,modelBefore=settings.lens_model;const images={'Sem deformação':baseline};
 $('apply-light-distortion').click();await wait();const changed=baseline!==canvas.toDataURL();images['Deformação no bokeh']=canvas.toDataURL();const frame=canvas.toDataURL();await wait();const stable=frame===canvas.toDataURL();
 const read=()=>{const g=gpu.gl,a=new Float32Array(w*h*4);g.bindFramebuffer(g.FRAMEBUFFER,gpu.renderFbo);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);g.bindFramebuffer(g.FRAMEBUFFER,null);if(g.getError()!==g.NO_ERROR)throw Error('Read failed');return a;};
 const difference=(a,b)=>{let total=0;for(let i=0;i<a.length;i++)total+=Math.abs(a[i]-b[i]);return total/a.length;};const gl=read();settings.render_backend='cuda';await wait();const cudaDifference=difference(gl,read());const cudaActive=!cudaFailed&&cudaRenderer?.stats?.backend==='cuda';settings.render_backend='webgl';
 const settingsPreserved=mapBefore===depth&&settings.focus_m===.7&&settings.near_m===.7&&settings.far_m===5&&modelBefore===settings.lens_model&&$('use-depth').checked;
 const profile=ProfileStore.create('Luz deformada',snapshot());settings.bokeh_distortion=0;settings.bokeh_distortion_color=0;await restoreProfile(profile);await wait();const profileRestored=settings.bokeh_distortion===1.4&&settings.bokeh_distortion_color===.65;
 $('bokeh_distortion_color').value=0;$('bokeh_distortion_color').onchange();await wait();const neutral=read();$('bokeh_distortion_color').value=1;$('bokeh_distortion_color').onchange();await wait();const colorDifference=difference(neutral,read());
 settings.focus_m=1.2;await wait();const focusChanges=frame!==canvas.toDataURL();images['Mudança de foco · 1,2 m']=canvas.toDataURL();
 settings.focus_m=.7;$('bokeh_distortion').value=0;$('bokeh_distortion').onchange();await wait();const zeroRestores=baseline===canvas.toDataURL();
 window.lightTestResult={changed,stable,settingsPreserved,profileRestored,colorDifference,focusChanges,zeroRestores,cudaDifference,cudaActive,images};
}catch(e){window.lightTestResult={error:e.message,stack:e.stack};}})()
