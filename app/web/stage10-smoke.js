(async()=>{try{
 settings.focus_m=2;const tests=[],options={limit:640,samples:96,aa:1};
 for(const backend of ['webgl','cuda']){
  settings.render_backend=backend;settings.physical_distortion=false;sync();await draw(options);const baseline=canvas.toDataURL(),original=gpu.data.atlas_id;
  settings.physical_distortion=true;sync();await draw(options);const physical=canvas.toDataURL();await draw(options);
  const g=gpu.gl,p=new Uint8Array(canvas.width*canvas.height*4);g.bindFramebuffer(g.FRAMEBUFFER,null);g.readPixels(0,0,canvas.width,canvas.height,g.RGBA,g.UNSIGNED_BYTE,p);let alpha=255;for(let i=3;i<p.length;i+=4)alpha=Math.min(alpha,p[i]);
  const test={backend,prepared:!!gpu.data._physicalPrepared,changed:baseline!==physical,stable:physical===canvas.toDataURL(),map_id:gpu.baseData.distortion.id,valid:gpu.data._physicalMap.valid.reduce((a,b)=>a+b,0),alpha,error:g.getError()};
  if(backend==='cuda')test.native=cudaRenderer.stats.backend;
  settings.physical_distortion=false;sync();await draw(options);test.restored=canvas.toDataURL()===baseline&&gpu.data.atlas_id===original;tests.push(test);
 }
 window.stage10TestResult={tests,success:tests.every(t=>t.prepared&&t.changed&&t.stable&&t.restored&&t.valid>0&&t.alpha===255&&t.error===0&&t.map_id?.length===64&&(t.backend!=='cuda'||t.native==='cuda')),version:'0.9.7'};
}catch(e){window.stage10TestResult={success:false,error:e.message}}})();