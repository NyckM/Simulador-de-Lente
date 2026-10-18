(async()=>{try{
const inspector=spectralPSFInspector;await inspector.calculate();const first=inspector.data;
if(!inspector.current||first.schema!=='optica-spectral-psf/1'||first.channels.length!==3)throw Error('Spectral PSF not loaded');
await inspector.calculate();const cache=inspector.data.profile.cache_hit;inspector.host.querySelector('.sp-spectrum').value='F';inspector.host.querySelector('.sp-field').value='x';await inspector.calculate();const edge=inspector.data;
document.dispatchEvent(new Event('opticalsettingschange'));const stale=!inspector.current&&inspector.exportButton.disabled;
window.stage12TestResult={success:cache&&stale&&edge.field_mm[0]>0&&edge.channels[0].wavelength_um===.4861&&first.channels.every(c=>c.intensity.flat().every(v=>Number.isFinite(v)&&v>=0)&&c.captured_energy<=1.0000001)&&first.sensor_grid.pitch_um>0,backend:first.backend,cache,stale_guard:stale,physical_pitch_um:first.sensor_grid.pitch_um,energy:first.channels.map(c=>c.captured_energy),sampling_resolved:first.sampling_resolved,warnings:first.warnings,version:'0.9.9'};
}catch(e){window.stage12TestResult={success:false,error:e.message}}})();