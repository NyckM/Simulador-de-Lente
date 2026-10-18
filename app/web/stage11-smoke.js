(async()=>{try{
 const w=wavefrontInspector;w.host.querySelector('.wf-samples').value='1024';await w.calculate();const first=w.data;
 if(!w.current||first.schema!=='optica-wavefront/1'||first.backend!=='cpu-float64')throw Error('Wavefront not loaded');
 w.host.querySelector('.wf-field').value='x';w.host.querySelector('.wf-wave').value='.4861';await w.calculate();const edge=w.data;await w.calculate();const cache=w.data.profile.cache_hit;
 settings.focus_m=3;document.dispatchEvent(new Event('opticalsettingschange'));const stale=!w.current&&w.exportButton.disabled;await w.calculate();
 window.stage11TestResult={success:w.current&&stale&&cache&&edge.field_mm[0]>0&&edge.wavelength_um===.4861&&first.samples_valid>8&&w.data.rays.opd_waves.every(Number.isFinite)&&JSON.stringify(w.data.rays.opd_waves)!==JSON.stringify(edge.rays.opd_waves),backend:w.data.backend,export_schema:w.data.schema,cache,stale_guard:stale,accepted:w.data.samples_valid,version:'0.9.8'};
}catch(e){window.stage11TestResult={success:false,error:e.message}}})();