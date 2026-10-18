/* Optical focus/geometry shared by the diagram and its interaction tests. */
(function(root){
 'use strict';
 function fromPrescription(data){
  const p=data.prescription;if(!p)return data; // Older saved fixtures remain readable.
  if(p.schema!=='optical-prescription/1'||p.units.length!=='mm')throw Error('Prescrição óptica incompatível.');
  const surfaces=p.surfaces.map(s=>{const m=s.medium_after;return {index:s.index,type:s.type,z:s.z_mm,curvature_radius:s.radius_mm,thickness:s.thickness_to_next_mm,aperture_diameter:s.clear_diameter_mm,nd:m.nd,is_stop:s.is_stop,...(s.geometry?{shape:s.geometry.shape,conic:s.geometry.conic,a4:s.geometry.a4_mm_minus3,a6:s.geometry.a6_mm_minus5}:{}),...(m.dispersion_model?{material_spec:[m.dispersion_model,m.nd,m.abbe,m.sellmeier?.b||[],m.sellmeier?.c_um2||[],m.material_id,m.source]}:{})};});
  return {...data,surfaces};
 }
 function withSurfaces(data,surfaces){
  if(!data.prescription)return {...data,surfaces};
  const prescription={...data.prescription,geometry_id:null,pending:true,provenance:{...data.prescription.provenance,edited:true},surfaces:surfaces.map(s=>({index:s.index,type:({1:'cylindrical_x',2:'cylindrical_y',3:'aspheric'})[s.shape]||(s.curvature_radius===0?'plane':'spherical'),...(s.shape?{geometry:{shape:s.shape,conic:s.conic||0,a4_mm_minus3:s.a4||0,a6_mm_minus5:s.a6||0}}:{}),z_mm:s.z,radius_mm:s.curvature_radius,thickness_to_next_mm:s.thickness,clear_diameter_mm:s.aperture_diameter,medium_after:{...(data.prescription.surfaces[s.index]?.medium_after||{material_id:null,abbe:null}),nd:s.nd},is_stop:!!s.is_stop}))};
  return fromPrescription({...data,prescription});
 }
 function plane(data,meters){const [a,b,c,d]=data.focus_matrix;return data.last_z_mm-(a+b/(meters*1000))/(c+d/(meters*1000));}
 function withFocus(data,meters,filmback){return {...data,sensor_z_mm:plane(data,meters)+filmback+(data.focus_shift_mm||0),settings:{...data.settings,focus_m:meters,filmback_mm:filmback}};}
 function focusAfterTranslation(data,millimeters){
  const filmback=data.settings.filmback_mm+(data.focus_shift_mm||0),near=plane(data,data.focus_min_m??.3),far=plane(data,20);
  const z=Math.max(Math.min(near,far),Math.min(Math.max(near,far),data.sensor_z_mm-filmback-millimeters));
  const [a,b,c,d]=data.focus_matrix,t=data.last_z_mm-z;
  return Math.max(data.focus_min_m??.3,Math.min(20,(t*d-b)/(1000*(a-t*c))));
 }
 function projection(data){const reference=data.reference_sensor_z_mm,offset=reference-data.sensor_z_mm,scale=590/(reference+32);return {offset,scale,x:mm=>30+(mm+offset+8)*scale,sensorX:30+(reference+8)*scale};}
 function aperture(data,radius){
  const scale=data.aperture?.pupil_scale;if(!Number.isFinite(scale)||scale<=0)return null;
  const coefficient=Math.abs(data.efl_mm)/(2*scale);
  return {fNumber:coefficient/radius,maxRadius:data.aperture.max_iris_mm||8.55,minF:coefficient/(data.aperture.max_iris_mm||8.55),maxF:coefficient/.5,diameter:2*radius*scale,coefficient};
 }
 function radiusForFNumber(data,fNumber){const a=aperture(data,1);return Math.max(.5,Math.min(a.maxRadius,a.coefficient/fNumber));}
 function diagramYScale(data,radius=data.settings.iris_mm){return 72/Math.max(72/4.1,radius+3,...data.surfaces.map(s=>s.aperture_diameter/2+3));}
 function irisAfterDrag(radius,startY,currentY,sign,maximum=8.55,pixelsPerMm=4.1){return Math.max(.5,Math.min(maximum,radius-sign*(currentY-startY)/pixelsPerMm));}
 // Exact meridional Snell tracing, in mm, on the displayed prescription.
 // Blocked rays stop at the surface they hit; they never continue through the iris.
 function withAperture(data,radius,count=81){
  if(root.Lens3D&&data.surfaces.some(s=>s.shape||s.material_spec)){const seeds=Array.from({length:count},(_,i)=>[-12+24*i/(count-1),0]),rays=root.Lens3D.trace(data,radius,.5876,seeds);return {...data,rays:rays.map(r=>r.path.map(p=>[p[0],p[1]])),ray_passed:rays.map(r=>r.passed),settings:{...data.settings,iris_mm:radius}};}
  const rays=[],passed=[],source=data.settings.source_m*1000;
  const end=Math.max(data.sensor_z_mm,data.source_focus_z_mm??data.sensor_z_mm,data.reference_sensor_z_mm??data.sensor_z_mm)+12;
  for(let i=0;i<count;i++){
   let y=-12+24*i/(count-1),z=-1,dy=y,dz=source-1,n1=1,alive=true;
   let length=Math.hypot(dy,dz);dy/=length;dz/=length;const path=[[z,y]];
   for(const surface of data.surfaces){
    const r=surface.curvature_radius;let t,ny,nz;
    if(r===0){t=(surface.z-z)/dz;ny=0;nz=-1;}
    else {const qz=z-surface.z-r,b=y*dy+qz*dz,discriminant=b*b-y*y-qz*qz+r*r;if(discriminant<0){alive=false;break;}t=-b-Math.sign(r)*Math.sqrt(discriminant);ny=(y+t*dy)/Math.abs(r);nz=(z+t*dz-surface.z-r)/Math.abs(r);}
    if(t< -1e-7||!Number.isFinite(t)){alive=false;break;}
    y+=t*dy;z+=t*dz;path.push([z,y]);let aperture=surface.aperture_diameter/2;
    if(surface.is_stop){aperture=Math.min(aperture,radius);if(data.settings.blades>=3){const a=(y<0?Math.PI:0)-(data.settings.rotation||0)*Math.PI/180,beta=Math.PI/data.settings.blades,sector=((a+beta)%(2*beta)+2*beta)%(2*beta)-beta;aperture*=Math.cos(beta)/Math.cos(sector);}}
    if(Math.abs(y)>aperture+1e-9){alive=false;break;}
    if(dy*ny+dz*nz>0){ny=-ny;nz=-nz;}
    const cosine=-(dy*ny+dz*nz),eta=n1/surface.nd,k=1-eta*eta*(1-cosine*cosine);
    if(k<0){alive=false;break;}
    const factor=eta*cosine-Math.sqrt(k);dy=eta*dy+factor*ny;dz=eta*dz+factor*nz;length=Math.hypot(dy,dz);dy/=length;dz/=length;n1=surface.nd;
   }
   if(alive)path.push([end,y+(end-z)*dy/dz]);rays.push(path);passed.push(alive);
  }
  return {...data,rays,ray_passed:passed,settings:{...data.settings,iris_mm:radius}};
 }
 function withSource(data,distance){const focus=plane(data,distance),axes={};if(data.focus_matrix_y){const [a,b,c,d]=data.focus_matrix_y;axes.focus_x_z_mm=focus;axes.focus_y_z_mm=data.last_z_mm-(a+b/(distance*1000))/(c+d/(distance*1000));}return {...data,...axes,settings:{...data.settings,source_m:distance},source_focus_z_mm:focus+(data.focus_shift_mm||0)};}
 const api={fromPrescription,withSurfaces,plane,withSource,withFocus,focusAfterTranslation,projection,diagramYScale,aperture,radiusForFNumber,irisAfterDrag,withAperture};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LensView=api;
})(typeof window==='object'?window:globalThis);
