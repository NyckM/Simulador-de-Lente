'use strict';
// Keep expensive optical dependencies separate from image-only controls.
const LensDependencies=(()=>{
 const atlasKeys=Object.freeze(['aperture_mask','aperture_custom','aperture_invert','ray_backend','field_grid','soften_internal_cutoff','iris_softness','lens_model','source_m','iris_mm','sensor_mm','blades','rotation','dispersion','coating_strength','coating_nm']);
 const layoutKeys=new Set(['lens_model','lens_edits','source_m','iris_mm','sensor_mm','blades','rotation','soften_internal_cutoff','iris_softness','aperture_mask','aperture_custom','aperture_invert','focus_m','filmback_mm','ray_focus']);
 function affects(key,known){const unknown=!(key in known);return {atlas:unknown||atlasKeys.includes(key)||key==='lens_edits'||key==='highlight_quality'||key==='highlight_detail',layout:unknown||layoutKeys.has(key),frame:true};}
 return Object.freeze({atlasKeys,affects});
})();
window.LensDependencies=LensDependencies;
