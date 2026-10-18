(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:512,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 const file=async(c,name)=>new File([await new Promise(r=>c.toBlob(r,'image/png'))],name,{type:'image/png'});
 const read=()=>{const c=document.createElement('canvas');c.width=640;c.height=400;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,640,400);return ctx.getImageData(0,0,640,400).data;};
 const contrast=p=>{let n=0,sum=0,sq=0;for(let y=180;y<230;y++)for(let x=296;x<344;x++){const v=p[(y*640+x)*4];sum+=v;sq+=v*v;n++;}return Math.sqrt(Math.max(0,sq/n-(sum/n)**2));};
 const difference=(a,b,rect=[0,0,640,400])=>{let v=0,n=0;for(let y=rect[1];y<rect[3];y++)for(let x=rect[0];x<rect[2];x++)for(let c=0;c<3;c++){v+=Math.abs(a[(y*640+x)*4+c]-b[(y*640+x)*4+c])/255;n++;}return v/n;};
 settings={...defaults,focus_m:2,source_m:5,near_m:2,far_m:5,invert_depth:false,blades:0,bokeh_gain:2.5,highlight_gain:3,render_backend:'webgl',depth_mode:'cut',depth_cut:.5,depth_feather:0};quality='veryhigh';exportQuality='veryhigh';
 const image=document.createElement('canvas');image.width=640;image.height=400;const ctx=image.getContext('2d');ctx.fillStyle='#122712';ctx.fillRect(0,0,640,400);
 let seed=17;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<2800;i++){const x=random()*640,y=random()*400;ctx.fillStyle=['#275c1b','#407a29','#609931','#194822','#91ac42'][Math.floor(random()*5)];ctx.beginPath();ctx.ellipse(x,y,2+random()*6,1+random()*3,random()*Math.PI,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<120;i++){const x=random()*640,y=random()*400;ctx.fillStyle=i%3?'#fffade':'#daeaff';ctx.beginPath();ctx.arc(x,y,1.5+random()*2,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#16251a';ctx.fillRect(276,134,88,138);ctx.fillStyle='#b9c8b5';ctx.fillRect(281,139,78,128);
 for(let x=287;x<355;x+=8){ctx.fillStyle='#16251a';ctx.fillRect(x,153,3,93);}
 const map=document.createElement('canvas');map.width=640;map.height=400;const mc=map.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,640,400);mc.fillStyle='#fff';mc.fillRect(276,134,88,138);
 await openImage(await file(image,'Folhagem.png'));await openDepth(await file(map,'Profundidade.png'));await updateKernel();await wait();
 const focus=settings.focus_m,model=settings.lens_model,depthBefore=depth,sourceBefore=source;const images={'Desfoque neutro':canvas.toDataURL()},base=read();
 $('apply-swirl-look').click();await wait();const focusPreserved=settings.focus_m===focus&&settings.lens_model===model&&depth===depthBefore&&source===sourceBefore&&$('use-depth').checked&&settings.near_m===2&&settings.far_m===5;
 images['Bokeh giratório e vinheta']=canvas.toDataURL();const look=read(),centerDifference=difference(base,look,[300,180,340,230]),subjectContrast=contrast(look)/contrast(base);
 settings.vignette_amount=0;await wait();images['Somente bokeh giratório']=canvas.toDataURL();const noVignette=read();let dark=0,bright=0;
 for(let y=20;y<100;y++)for(let x=20;x<100;x++){dark+=look[(y*640+x)*4+1];bright+=noVignette[(y*640+x)*4+1];}
 const cornersDarken=dark<bright*.8;
 settings.vignette_amount=.8;settings.render_backend='cuda';await wait();const native=read(),cudaDifference=difference(native,look);const profile=ProfileStore.create('Bokeh giratório · centro em foco',snapshot());
 settings.swirl=0;settings.vignette_amount=0;await restoreProfile(profile);await wait();const profileRestored=settings.swirl===1.8&&settings.vignette_amount===.8;
 settings.focus_m=5;await wait();const farContrast=contrast(read());settings.focus_m=2;await wait();const nearContrast=contrast(read());
 // Isolate a point to measure the direction and aspect of its PSF at the right edge.
 const lights=document.createElement('canvas');lights.width=640;lights.height=400;const lc=lights.getContext('2d');lc.fillStyle='#000';lc.fillRect(0,0,640,400);lc.fillStyle='#fff';lc.fillRect(499,199,3,3);
 await openImage(await file(lights,'Ponto.png'));settings.focus_m=.8;settings.source_m=5;settings.bokeh_gain=2;settings.highlight_gain=0;settings.swirl=0;settings.coma=0;settings.vignette_amount=0;settings.render_backend='webgl';await updateKernel();await wait();
 const shape=p=>{let mass=0,mx=0,my=0;for(let y=130;y<270;y++)for(let x=430;x<570;x++){const v=p[(y*640+x)*4]/255;const energy=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;mass+=energy;mx+=x*energy;my+=y*energy;}mx/=mass;my/=mass;let xx=0,yy=0;for(let y=130;y<270;y++)for(let x=430;x<570;x++){const v=p[(y*640+x)*4]/255,energy=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;xx+=(x-mx)**2*energy;yy+=(y-my)**2*energy;}return Math.sqrt(yy/xx);};
 const neutralAxis=shape(read());settings.swirl=1.8;settings.coma=.25;await wait();const swirlAxis=shape(read());
 const vignetteDisabled=()=>{settings.vignette_amount=0;};vignetteDisabled();await wait();const zeroFrame=canvas.toDataURL();settings.vignette_amount=.8;await wait();vignetteDisabled();await wait();const zeroRestores=zeroFrame===canvas.toDataURL();
 window.swirlTestResult={focusPreserved,centerDifference,subjectContrast,cornersDarken,cudaDifference,profileRestored,nearContrast,farContrast,neutralAxis,swirlAxis,zeroRestores,images,profile};
}catch(e){window.swirlTestResult={error:e.message,stack:e.stack};}})()
