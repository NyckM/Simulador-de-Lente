(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:256,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const read=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
 const sum=(pixels,rect)=>{let total=0;for(let y=rect[1];y<rect[3];y++)for(let x=rect[0];x<rect[2];x++)total+=pixels[(y*640+x)*4]+pixels[(y*640+x)*4+1]+pixels[(y*640+x)*4+2];return total;};
 settings={...defaults,focus_m:5,source_m:5,iris_mm:8.55,blades:0,render_backend:'webgl',lens_dirt_threshold:.4,lens_dirt_radius:280,lens_dirt_scale:1.6,lens_dirt_seed:7,lens_dirt_block:.65,lens_dirt_scatter:4};quality='veryhigh';
 const w=640,h=400,scene=document.createElement('canvas');scene.width=w;scene.height=h;const ctx=scene.getContext('2d'),pixels=ctx.createImageData(w,h),raw=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const d=(x-320)**2+(y-160)**2,beam=Math.exp(-d/26000),sun=Math.exp(-d/45)*70;
  const c=[.007+.025*beam+sun,.018+.07*beam+sun,.035+.13*beam+sun];const i=(y*w+x)*4;
  for(let k=0;k<3;k++){raw[i+k]=c[k];const v=Math.min(1,c[k]);pixels.data[i+k]=Math.round((v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)*255);}raw[i+3]=1;pixels.data[i+3]=255;
 }ctx.putImageData(pixels,0,0);
 await openImage(new File([await new Promise(r=>scene.toBlob(r,'image/png'))],'Sol HDR.png',{type:'image/png'}));gpu.uploadSource(scene,w,h,raw);await updateKernel();await wait();
 const images={'Lente limpa':canvas.toDataURL()},baseline=read(),clean=images['Lente limpa'];const atlasBefore=atlas;
 settings.lens_dirt_amount=.35;settings.lens_dirt_scatter=0;await wait();images['Somente obstrução']=canvas.toDataURL();const blockingDarkens=sum(read(),[20,20,180,380])<sum(baseline,[20,20,180,380]);
 settings.lens_dirt_scatter=4;await wait();images['Manchas e halos']=canvas.toDataURL();const haloBrightens=sum(read(),[260,195,380,250])>sum(baseline,[260,195,380,250]);await wait();const stable=images['Manchas e halos']===canvas.toDataURL(),inspectionUnchanged=atlas===atlasBefore;
 settings.lens_dirt_amount=0;await wait();const zeroRestores=clean===canvas.toDataURL();
 demoRangeSettings={near:2,far:5};await loadDemo();settings.focus_m=2;settings.source_m=5;settings.lens_dirt_amount=.25;settings.lens_dirt_block=.2;settings.lens_dirt_scatter=2;settings.lens_dirt_radius=120;settings.lens_dirt_threshold=.3;$('use-depth').checked=true;await updateKernel();const depthChecks=[],frames=[];
 const contrast=()=>{const p=read();let n=0,total=0,sq=0;for(let y=192;y<280;y++)for(let x=275;x<365;x++){const v=p[(y*640+x)*4+2];n++;total+=v;sq+=v*v;}return Math.sqrt(Math.max(0,sq/n-(total/n)**2));};
 const oldDepth=depth,near_m=settings.near_m,far_m=settings.far_m;
 for(const backend of ['webgl','cuda']){settings.render_backend=backend;settings.focus_m=2;await wait();const nearContrast=contrast(),on=canvas.toDataURL();frames.push(read());if(backend==='cuda')images['Objeto em foco · Lens Dirt']=on;
  settings.lens_dirt_amount=0;await wait();const dirtChanges=on!==canvas.toDataURL();settings.lens_dirt_amount=.25;settings.focus_m=5;await wait();const farContrast=contrast();if(backend==='cuda')images['Fundo em foco · Lens Dirt']=canvas.toDataURL();depthChecks.push({backend,nearContrast,farContrast,dirtChanges});
 }
 let backendDifference=0;for(let i=0;i<frames[0].length;i++)backendDifference+=Math.abs(frames[0][i]-frames[1][i])/255;backendDifference/=frames[0].length;
 const depthMapPreserved=depth===oldDepth&&near_m===settings.near_m&&far_m===settings.far_m&&$('use-depth').checked;
 window.lensDirtTestResult={zeroRestores,stable,blockingDarkens,haloBrightens,inspectionUnchanged,depthMapPreserved,depthChecks,backendDifference,images};
}catch(e){window.lensDirtTestResult={error:e.message,stack:e.stack};}})()
