(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:256,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const w=640,h=400,scene=document.createElement('canvas');scene.width=w;scene.height=h;const ctx=scene.getContext('2d');ctx.fillStyle='#17232c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#729781';ctx.fillRect(272,122,96,168);for(let x=286;x<356;x+=9){ctx.fillStyle='#17232c';ctx.fillRect(x,150,4,110);}
 const map=document.createElement('canvas');map.width=w;map.height=h;const mc=map.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,w,h);mc.fillStyle='#fff';mc.fillRect(272,122,96,168);
 const raw=new Float32Array(w*h*4),pixel=ctx.getImageData(0,0,w,h).data;for(let i=0;i<pixel.length;i+=4){for(let c=0;c<3;c++){const v=pixel[i+c]/255;raw[i+c]=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}raw[i+3]=1;}
 for(const x of [100,520])for(const y of [75,140,205,270,335])for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){const i=(yy*w+xx)*4;raw[i]=6;raw[i+1]=3;raw[i+2]=.8;}
 const file=async(c,name)=>new File([await new Promise(r=>c.toBlob(r,'image/png'))],name,{type:'image/png'});
 settings={...defaults,focus_m:2,source_m:5,near_m:2,far_m:5,invert_depth:false,blades:7,bokeh_gain:6,coating_strength:.94,coating_nm:700,render_backend:'webgl',depth_mode:'cut',depth_feather:0};quality='veryhigh';
 await openImage(await file(scene,'Luzes.png'));await openDepth(await file(map,'Depth.png'));gpu.uploadSource(scene,w,h,raw);await updateKernel();await wait();
 const legacyCanvas=document.createElement('canvas'),legacy=new LegacyLensGPU(legacyCanvas);legacy.uploadSource(scene,w,h,raw);legacy.uploadDepth(map);legacy.setKernel(atlas);
 const opts={limit:640,samples:256,aa:1,depth:true,invert:false,near:2,far:5};
 const read=(renderer= gpu,withWave=false)=>{const g=renderer.gl,values=new Float32Array(w*h*4);g.bindFramebuffer(g.FRAMEBUFFER,withWave?renderer.waveMergedFbo:renderer.renderFbo);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,values);if(g.getError()!==g.NO_ERROR)throw Error('HDR read failed');g.bindFramebuffer(g.FRAMEBUFFER,null);return values;};
 const difference=(a,b)=>{let total=0;for(let i=0;i<a.length;i++)total+=Math.abs(a[i]-b[i]);return total/a.length;};
 const baseline=canvas.toDataURL();legacy.draw(settings,opts);const disabledRestores=baseline===legacyCanvas.toDataURL();
 settings.ghost_gain=39.6;settings.diffraction_gain=1.1;settings.diffraction_scale=4.5;await wait();legacy.draw(settings,opts);
 const images={'Antes · highlights da entrada':legacyCanvas.toDataURL(),'Depois · efeitos no desfoque':canvas.toDataURL()},glFrame=canvas.toDataURL();await wait();const stable=glFrame===canvas.toDataURL();
 const getEncoded=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;const d=c.getContext('2d');d.drawImage(canvas,0,0);return d.getImageData(0,0,w,h).data;};const gl=getEncoded();
 settings.render_backend='cuda';await wait();const native=getEncoded();let cudaDifference=0;for(let i=0;i<gl.length;i++)cudaDifference+=Math.abs(gl[i]-native[i])/255;cudaDifference/=gl.length;
 settings.render_backend='webgl';const depthBefore=depth;
 const spreads=[];for(const focus of [2,5]){settings.focus_m=focus;settings.ghost_gain=0;settings.diffraction_gain=0;await wait();const base=read();settings.diffraction_gain=1.1;await wait();const wave=read(gpu,true);
  let mass=0,r2=0;for(let y=160;y<235;y++)for(let x=60;x<145;x++){const i=(y*w+x)*4,v=Math.max(0,wave[i]-base[i]);mass+=v;r2+=((x-100)**2+(y-194)**2)*v;}spreads.push(r2/mass);
 }
 settings.focus_m=5;settings.ghost_gain=39.6;settings.diffraction_gain=1.1;await wait();images['Depois · foco nas luzes']=canvas.toDataURL();const depthPreserved=depth===depthBefore&&$('use-depth').checked&&settings.near_m===2&&settings.far_m===5;
 // Mirror a single point through a deliberately isolated reflection pair.
 const one=document.createElement('canvas');one.width=w;one.height=h;const oc=one.getContext('2d');oc.fillStyle='#000';oc.fillRect(0,0,w,h);oc.fillStyle='#fff';oc.fillRect(149,199,3,3);await openImage(await file(one,'Ponto.png'));settings.coating_strength=0;settings.bokeh_gain=6;settings.ghost_gain=40;settings.diffraction_gain=0;await updateKernel();gpu.data.ghost_pairs=[[1,.1,.1,.1],[0,0,0,0],[0,0,0,0]];
 const ghostSpreads=[];for(const focus of [2,5]){settings.focus_m=focus;await wait();const wave=read(gpu,true);let mass=0,mx=0,my=0,r2=0;for(let y=120;y<280;y++)for(let x=410;x<570;x++){const v=wave[(y*w+x)*4];mass+=v;mx+=x*v;my+=y*v;r2+=(x*x+y*y)*v;}ghostSpreads.push(r2/mass-(mx/mass)**2-(my/mass)**2);}
 settings.master_blend=0;await wait();const blendZeroSafe=gpu.gl.getError()===gpu.gl.NO_ERROR;settings.render_backend='cuda';await wait();const nativeBlendZeroSafe=!cudaFailed;settings.render_backend='webgl';settings.master_blend=1;settings.focus_m=2;
 // Base + Highlights must still reconstruct Final, including the wave energy.
 const views={};for(const view of ['final','base','highlights']){settings.highlight_view=view;await wait();views[view]=read(gpu,view!=='base');}let decompositionError=0;for(let i=0;i<views.final.length;i++)if(i%4!==3)decompositionError=Math.max(decompositionError,Math.abs(views.final[i]-views.base[i]-views.highlights[i]));
 settings.highlight_view='final';settings.diffusion=.2;settings.drops_amount=.2;settings.lens_dirt_amount=.25;await wait();const postEffectsSafe=gpu.gl.getError()===gpu.gl.NO_ERROR;
 // Smooth imported depth, without the two-plane cut used by the comparison.
 settings.diffusion=0;settings.drops_amount=0;settings.lens_dirt_amount=0;settings.depth_mode='slicing';settings.depth_slices=4;
 const ramp=document.createElement('canvas');ramp.width=w;ramp.height=h;const rc=ramp.getContext('2d'),gradient=rc.createLinearGradient(0,0,w,0);gradient.addColorStop(0,'black');gradient.addColorStop(1,'white');rc.fillStyle=gradient;rc.fillRect(0,0,w,h);
 await openDepth(await file(ramp,'Depth contínuo.png'));settings.diffraction_gain=1.1;settings.ghost_gain=39.6;await wait();const sliced=getEncoded();settings.render_backend='cuda';await wait();const slicedCUDA=getEncoded();let slicingDifference=0;for(let i=0;i<sliced.length;i++)slicingDifference+=Math.abs(sliced[i]-slicedCUDA[i])/255;slicingDifference/=sliced.length;const continuousDepthWorks=!cudaFailed&&gpu.gl.getError()===gpu.gl.NO_ERROR&&slicingDifference<.015;
 window.waveTestResult={disabledRestores,stable,cudaDifference,nearWaveSpread:spreads[0],farWaveSpread:spreads[1],nearGhostSpread:ghostSpreads[0],farGhostSpread:ghostSpreads[1],blendZeroSafe:blendZeroSafe&&nativeBlendZeroSafe,postEffectsSafe,depthPreserved,decompositionError,slicingDifference,continuousDepthWorks,images};
}catch(e){window.waveTestResult={error:e.message,stack:e.stack};}})()
