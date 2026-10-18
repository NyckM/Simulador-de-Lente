(async()=>{try{
 const errors=[];window.addEventListener('error',e=>errors.push(e.message));
 quality='fast';exportQuality='fast';animation.data.duration=4;settings.physical_ghosts=false;
 offlineBusy=true;settings.filters=[];await draw({limit:256,samples:48});const bypass=canvas.toDataURL();settings.filters=[{...ArtisticFilters.create('prism'),amount:1,prism_shift:.07}];await draw({limit:256,samples:48});const prismChanged=bypass!==canvas.toDataURL();settings.filters[0].amount=0;await draw({limit:256,samples:48});const prismZero=bypass===canvas.toDataURL();settings.filters=[{...ArtisticFilters.create('directional'),amount:1,blur_radius:.08}];await draw({limit:256,samples:48});const horizontal=canvas.toDataURL();settings.filters[0].blur_angle=90;await draw({limit:256,samples:48});const blurRotates=horizontal!==canvas.toDataURL();settings.filters=[];offlineBusy=false;

 LensAnimation.put(animation.data,'main','focus_m',0,.8,.8);LensAnimation.put(animation.data,'main','focus_m',3,5,.8);animation.capture();
 await animation.seek(0);const first=canvas.toDataURL();await animation.seek(3);const last=canvas.toDataURL();await animation.seek(0);const repeat=first===canvas.toDataURL();
 const w=sourceW,h=sourceH,rgba=new Float32Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;rgba.set([x%12<6?1:.01,.1,.03,x<w/2?.7:0],i);}
 layers.setPixels(1,rgba,w,h);layers.configs[1].distance=2;layers.configs[1].optics={focus_m:2,iris_mm:2};animation.data.tracks=[];LensAnimation.put(animation.data,'B','optics.focus_m',0,2,2);LensAnimation.put(animation.data,'B','optics.focus_m',3,6,2);animation.capture();
 const global=settings.focus_m;await animation.seek(0);const front=canvas.toDataURL();await animation.seek(3);const back=canvas.toDataURL();const independent=settings.focus_m===global;
 const saved=LensAnimation.base(animation.data,settings,layers.configs);const parsed=animation.validate(animation.data,saved.settings,saved.layers);
 window.animationTestResult={success:prismChanged&&prismZero&&blurRotates&&first!==last&&repeat&&front!==back&&independent&&parsed.tracks.length===1&&gpu.gl.getError()===0&&!errors.length,prism_changed:prismChanged,prism_zero_exact:prismZero,directional_blur_rotates:blurRotates,main_frames_different:first!==last,main_repeat_exact:repeat,layer_frames_different:front!==back,global_focus_preserved:independent,timeline_present:!!document.getElementById('animation-timeline'),cuda_available:cudaInfo?.available,errors};
 }catch(e){window.animationTestResult={success:false,error:e.message,stack:e.stack};}})();
