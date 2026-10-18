(async()=>{try{
 offlineBusy=true;settings.physical_ghosts=true;settings.ghost_gain=15;ghostInspector.mode='auto';ghostInspector.limit=2;ghostInspector.threshold=.5;ghostInspector.invalidate();
 await draw({limit:256,samples:24,aa:1});const a=canvas.toDataURL(),count=ghostInspector.data?.sources?.length||0,current=ghostInspector.isCurrent();
 settings.ghost_gain=0;await draw({limit:256,samples:24,aa:1});const zero=canvas.toDataURL();settings.physical_ghosts=false;await draw({limit:256,samples:24,aa:1});const bypass=canvas.toDataURL();
 settings.physical_ghosts=true;settings.ghost_gain=15;await draw({limit:256,samples:24,aa:1});
 window.flareTestResult={success:count>0&&current&&a!==zero&&zero===bypass&&a===canvas.toDataURL()&&gpu.gl.getError()===0,sources:count,automatic:current,zero_exact:zero===bypass,restore_exact:a===canvas.toDataURL(),native_available:cudaInfo?.available};
 }catch(e){window.flareTestResult={success:false,error:e.message};}})();
