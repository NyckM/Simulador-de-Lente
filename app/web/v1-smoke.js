(async()=>{try{
 offlineBusy=true;
 const saved=structuredClone(settings);settings.filters=[];
 await draw({limit:512,samples:24});const original=canvas.toDataURL();
 settings.filters=[ArtisticFilters.create('replicate')];settings.filters[0].amount=.8;
 await draw({limit:512,samples:24});const changed=original!==canvas.toDataURL();
 settings.filters[0].amount=0;await draw({limit:512,samples:24});const bypass=original===canvas.toDataURL();
 const bad=DepthUtils.prepare([0,.3,1],{...settings,depth_units:'relative',depth_normalize:'off',depth_gain:-10.27,depth_bias:0,invert_depth:false});
 const collapsed=bad.statistics.collapsed;
 const count=ArtisticFilters.kinds.length;
 settings=saved;sync();
 window.v1TestResult={passed:changed&&bypass&&collapsed&&count===15,changed,bypass,collapsed,profiles:count,backend:cudaRenderer.stats.backend};
}catch(error){window.v1TestResult={passed:false,error:error.message};}finally{offlineBusy=false;}})();
