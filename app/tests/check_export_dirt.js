(async()=>{try{
 const wait=async()=>{for(let i=0;i<300;i++){if(!kernelBusy&&!kernelTimer&&!layoutBusy&&!layoutTimer){await draw({limit:640,samples:128,aa:1});return;}await new Promise(r=>setTimeout(r,50));}throw Error('Render timed out');};
 $('profile-name').value='Minha lente · distorção';
 const saved=await $('export-profile').onclick();
 const pathConfirmed=$('messages').textContent==='Arquivo salvo em: '+saved.path;
 await $('save-settings').onclick();
 const cancelled=(await $('save-settings').onclick()).cancelled&&$('messages').textContent.includes('cancelada');
 const failed=!!(await $('save-settings').onclick()).error&&$('messages').classList.contains('error');
 settings.render_backend='webgl';settings.lens_dirt_amount=0;await wait();const baseline=canvas.toDataURL();
 settings.lens_dirt_amount=.4;settings.lens_dirt_threshold=0;settings.lens_dirt_scatter=4;await wait();const withDirt=canvas.toDataURL();await wait();
 const dirtStable=withDirt===canvas.toDataURL(),dirtChanges=baseline!==withDirt;
 const read=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};const gl=read();
 settings.render_backend='cuda';await wait();const cuda=read();let cudaDifference=0;for(let i=0;i<gl.length;i++)cudaDifference+=Math.abs(gl[i]-cuda[i])/255;cudaDifference/=gl.length;
 const cudaDirt=canvas.toDataURL();settings.lens_dirt_amount=0;await wait();const dirtCUDAChanges=cudaDirt!==canvas.toDataURL();settings.render_backend='webgl';await wait();const disabledRestores=baseline===canvas.toDataURL();
 const mask=document.createElement('canvas');mask.width=mask.height=1024;const mc=mask.getContext('2d');mc.fillStyle='#fff';mc.fillRect(0,0,512,1024);
 const file=new File([await new Promise(r=>mask.toBlob(r,'image/png'))],'Mancha.png',{type:'image/png'});await openDirt(file);await wait();
 const imported=settings.lens_dirt_amount===.25&&!!settings.lens_dirt_texture&&settings.lens_dirt_name==='Mancha.png';
 const mi=new Image();mi.src=settings.lens_dirt_texture;await mi.decode();const resized=mi.width===512;
 settings.lens_dirt_scatter=0;settings.lens_dirt_block=1;await wait();const masked=canvas.toDataURL();settings.lens_dirt_rotation=180;await wait();const rotated=masked!==canvas.toDataURL();
 const savedDirt=snapshot(),uri=settings.lens_dirt_texture;settings.lens_dirt_texture='';settings.lens_dirt_amount=0;await restoreProfile({snapshot:savedDirt,name:'Mancha salva'});await wait();
 const textureRestored=settings.lens_dirt_texture===uri&&settings.lens_dirt_rotation===180;
 window.exportTestResult={cancelled,failed,pathConfirmed,dirtStable,dirtChanges,dirtCUDAChanges,cudaDifference,disabledRestores,imported,resized,rotated,textureRestored};
}catch(e){window.exportTestResult={error:e.message,stack:e.stack};}})()
