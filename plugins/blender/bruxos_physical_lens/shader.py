from .optics import vertices,axis
from .spectral import WAVELENGTHS,WEIGHTS

def camera_source(rows):
    def arr(name,values):return 'float '+name+'['+str(len(values))+'] = {'+','.join(format(float(x),'.12g') for x in values)+'};\n'
    axes=[axis(s) for s in rows];z=vertices(rows)
    arrays=''.join(arr(k,[s[v] for s in rows]) for k,v in [('R','radius'),('ND','nd'),('V','abbe'),('A','diameter'),('X','dx'),('Y','dy'),('STOP','stop')])
    arrays+=arr('WAVE',WAVELENGTHS)+''.join(arr(k,[w[j] for w in WEIGHTS]) for j,k in enumerate(['SRED','SGREEN','SBLUE']))
    arrays+=arr('Z',z)+''.join(arr(k,[a[j] for a in axes]) for j,k in enumerate(['AX','AY','AZ']))
    return r'''// Generated original sequential lens shader. No compositor blur.
float glass_index(float nd,float vd,float wavelength,float chromatic){
 float B=(nd-1)/(vd*(1/(.4861327*.4861327)-1/(.6562725*.6562725)));
 return nd+chromatic*B*(1/(wavelength*wavelength)-1/(.5875618*.5875618));
}
// Single idealized quarter-wave film. Complex magnitude expressed with real cosines.
float thin_reflectance(float ni,float nt,float ci,float ct,float wave,float nm){
 float nf=sqrt(ni*nt),sf=ni/nf;float cf2=1-sf*sf*(1-ci*ci);
 if(cf2<=0)return 1;float cf=sqrt(cf2),phase=3.14159265359*nm*.001*cf/wave;
 float a=(ni*ci-nf*cf)/max(1e-8,ni*ci+nf*cf),b=(nf*cf-nt*ct)/max(1e-8,nf*cf+nt*ct);
 float c=(nf*ci-ni*cf)/max(1e-8,nf*ci+ni*cf),d=(nt*cf-nf*ct)/max(1e-8,nt*cf+nf*ct);
 float rs=(a*a+b*b+2*a*b*cos(2*phase))/max(1e-8,1+a*a*b*b+2*a*b*cos(2*phase));
 float rp=(c*c+d*d+2*c*d*cos(2*phase))/max(1e-8,1+c*c*d*d+2*c*d*cos(2*phase));
 return clamp(.5*(rs+rp),0,1);
}
shader bruxos_physical_lens(
 float sensor_z=80 [[float min=0]],
 float iris_radius=6 [[float min=.01]],
 int blades=7 [[int min=0,int max=32]],
 float iris_rotation=0,
 float dispersion=0 [[float min=0,float max=1]],
 int spectral_bokeh=1 [[int min=0,int max=1]],
 float exposure=0,
 float coating_strength=0 [[float min=0,float max=1]],
 float coating_nm=550 [[float min=400,float max=700]],
 int lens_flare=0,
 float flare_gain=1 [[float min=0,float max=40]],
 float focus_distance=2,
 float focus_preservation=0,
 float bokeh_texture_rings=0,
 float bokeh_texture_grain=0,
 float bokeh_texture_scale=6,
 float bokeh_texture_rotation=0,
 float texture_normalization=1,
 float swirl=0,
 float squeeze=1,
 float cat_eye=0,
 float crop_bokeh=0,
 float astigmatism=0,
 float coma=0,
 float edge_brightness=0,
 float vignette=0,
 float mm_to_scene=.001,
 output point position=0,
 output vector direction=vector(0,0,1),
 output color throughput=1)
{
''' + arrays + r'''
 vector size;getattribute("cam:sensor_size",size);
 point uv=camera_shader_raster_position();vector rng=camera_shader_random_sample();
 int channel=1;float lensU=rng.x;
 color sensor_response=1;float wave=.5875618;
 if(dispersion>0){
  int count=spectral_bokeh!=0?12:3;
  channel=min(count-1,(int)floor(lensU*count));lensU=lensU*count-channel;
  if(spectral_bokeh!=0){wave=WAVE[channel];sensor_response=color(SRED[channel],SGREEN[channel],SBLUE[channel]);}
  else{wave=channel==0?.6562725:channel==1?.5875618:.4861327;sensor_response=channel==0?color(3,0,0):channel==1?color(0,3,0):color(0,0,3);}
 }
 float rr=sqrt(lensU)*A['''+str(len(rows)-1)+r''']*.5,theta=6.28318530718*rng.y;
 point p=point(-(uv.x-.5)*size.x,-(uv.y-.5)*size.y,sensor_z);
 point rear=point(X['''+str(len(rows)-1)+r''']+rr*cos(theta),Y['''+str(len(rows)-1)+r''']+rr*sin(theta),Z['''+str(len(rows)-1)+r''']);
 vector d=normalize(rear-p);float energy=1;float pupil_x=0,pupil_y=0;
 // Importance sample either the primary path or a uniformly chosen two-reflection pair.
 // Hash of continuous lens samples supplies a reproducible independent dimension.
 int last='''+str(len(rows)-1)+r''',pairs=(last+1)*last/2;
 int first=-1,second=-1,reflections=0,travel=-1,i=last;
 if(lens_flare!=0&&flare_gain>0&&pairs>0){
  float choice=noise("hash",point(rng.x*1048576,rng.y*1048576,uv.x+uv.y*17));
  if(choice<.5){energy*=2;}
  else{
   int pair=min(pairs-1,(int)floor((choice-.5)*2*pairs)),index=0;
   for(int a=0;a<last;a++)for(int b=a+1;b<=last;b++){if(index==pair){first=a;second=b;}index++;}
   energy*=2*pairs*flare_gain;
  }
 }
 for(int visit=0;visit<3*(last+1);visit++){
  if(i<0||i>last)break;
  point vertex=point(X[i],Y[i],Z[i]);vector ax=vector(AX[i],AY[i],AZ[i]);
  point q;normal normal_surface;float t=-1;
  if(abs(R[i])<1e-8){float den=dot(d,ax);if(abs(den)<1e-8){throughput=0;return;}t=dot(vertex-p,ax)/den;q=p+max(t,0)*d;normal_surface=normal(ax);}
  else{
   point center=vertex+ax*R[i];vector oc=p-center;float b=dot(oc,d),discr=b*b-dot(oc,oc)+R[i]*R[i];
   if(discr<0){throughput=0;return;}
   float ts[2]={-b-sqrt(discr),-b+sqrt(discr)};
   for(int k=0;k<2;k++){point test=p+max(ts[k],0)*d;if(ts[k]>=-1e-5&&dot(test-center,ax)*R[i]<=1e-5){t=ts[k];q=test;break;}}
   if(t< -1e-5){throughput=0;return;}normal_surface=normal(normalize(q-center));
  }
  if(t< -1e-5){throughput=0;return;}
  vector delta=q-vertex;float radial=sqrt(max(0,dot(delta,delta)-pow(dot(delta,ax),2)));
  if(radial>A[i]*.5){throughput=0;return;}
  if(STOP[i]>.5){
   float limit=iris_radius;
   if(first<0){pupil_x=delta.x/max(1e-8,iris_radius);pupil_y=delta.y/max(1e-8,iris_radius);}
   if(blades>=3){vector ex=normalize(vector(ax.z,0,-ax.x));vector ey=cross(ax,ex);float angle=atan2(dot(delta,ey),dot(delta,ex))-iris_rotation*.01745329252;float sector=6.28318530718/blades;float local=angle-sector*floor((angle+sector*.5)/sector);limit*=cos(3.14159265359/blades)/cos(local);}
   if(radial>limit){throughput=0;return;}
   // Creative aperture occlusion in field coordinates, separate from real glass clipping.
   if(cat_eye>0||crop_bokeh>0){
    float fx=uv.x-.5,fy=uv.y-.5,field=min(1,sqrt(fx*fx+fy*fy)*1.41421356);
    float az=atan2(fy,fx),radial_x=delta.x*cos(az)+delta.y*sin(az),tangent=-delta.x*sin(az)+delta.y*cos(az);
    float shift=cat_eye*field*limit*.85;
    if(pow(radial_x+shift,2)+tangent*tangent>limit*limit||radial_x>limit*(1-crop_bokeh*field)){throughput=0;return;}
   }
  }
  if(dot(d,normal_surface)>0)normal_surface=-normal_surface;
  float left=i>0?glass_index(ND[i-1],V[i-1],wave,dispersion):1,right=glass_index(ND[i],V[i],wave,dispersion);
  float ni=travel<0?right:left,nt=travel<0?left:right;
  float eta=ni/nt,ci=-dot(d,normal_surface),k=1-eta*eta*(1-ci*ci);
  int bounce=(reflections==0&&i==first)||(reflections==1&&i==second);
  if(k<0&&!bounce){throughput=0;return;}float ct=sqrt(max(0,k));
  float rs=(ni*ci-nt*ct)/max(1e-8,ni*ci+nt*ct),rp=(nt*ci-ni*ct)/max(1e-8,nt*ci+ni*ct);
  float reflectance=k<0?1:.5*(rs*rs+rp*rp);
  if(coating_strength>0&&k>=0)reflectance=mix(reflectance,thin_reflectance(ni,nt,ci,ct,wave,coating_nm),coating_strength);
  if(bounce){energy*=reflectance;d=normalize(d+2*ci*vector(normal_surface));travel=-travel;reflections++;}
  else{energy*=1-reflectance;d=normalize(eta*d+(eta*ci-ct)*vector(normal_surface));}
  p=q;i+=travel;
 }
 if(i>=0||travel!=-1||(first>=0&&reflections!=2)){throughput=0;return;}
 // The physical sensor is mirrored; outgoing scene rays restore upright framing.
 position=point(p.x,p.y,sensor_z-p.z)*mm_to_scene;
 direction=normalize(vector(d.x,d.y,-d.z));
 // Artistic pupil deformation. Anchor the outgoing primary ray at the focus plane:
 // changing blur shape does not add an opacity transition or blur the chosen plane.
 if(first<0&&(swirl!=0||squeeze!=1||astigmatism!=0||coma!=0)){
  float focal=focus_distance*1000+sensor_z;
  float travel_to_focus=(focal-position.z/mm_to_scene)/max(1e-6,direction.z);
  point target=position/mm_to_scene+direction*travel_to_focus;
  vector offset=vector(position.x/mm_to_scene,position.y/mm_to_scene,0);
  float fx=uv.x-.5,fy=uv.y-.5,field=min(1,sqrt(fx*fx+fy*fy)*1.41421356),az=atan2(fy,fx);
  float radial_x=offset.x*cos(az)+offset.y*sin(az),tangent=-offset.x*sin(az)+offset.y*cos(az);
  radial_x*=max(.12,1-abs(swirl)*field*.85);tangent*=1+abs(swirl)*field*.2;
  float twist=swirl*field*.5;
  float rx=radial_x*cos(twist)-tangent*sin(twist),ry=radial_x*sin(twist)+tangent*cos(twist);
  offset=vector((rx*cos(az)-ry*sin(az))/max(.1,squeeze),rx*sin(az)+ry*cos(az),0);
  offset+=vector(fx,fy,0)*coma*dot(offset,offset)*.02;
  offset.x*=1+astigmatism*field*.3;offset.y*=max(.1,1-astigmatism*field*.3);
  position=point(offset.x,offset.y,position.z/mm_to_scene)*mm_to_scene;
  direction=normalize(target-position/mm_to_scene);
 }
 if(first<0&&focus_preservation>0){
  float focal=focus_distance*1000+sensor_z;
  point hit=position/mm_to_scene+direction*((focal-position.z/mm_to_scene)/max(1e-6,direction.z));
  // Trace a green chief ray for a stable focal target, retaining breathing and distortion.
  point cp=point(-(uv.x-.5)*size.x,-(uv.y-.5)*size.y,sensor_z);
  vector cd=normalize(point(X[last],Y[last],Z[last])-cp);int chief_ok=1;
  for(int j=last;j>=0;j--){
   point v=point(X[j],Y[j],Z[j]);vector ax=vector(AX[j],AY[j],AZ[j]);point cq;normal cn;float tt=-1;
   if(abs(R[j])<1e-8){float den=dot(cd,ax);if(abs(den)<1e-8){chief_ok=0;break;}tt=dot(v-cp,ax)/den;cq=cp+max(tt,0)*cd;cn=normal(ax);}
   else{
    point ctr=v+ax*R[j];vector oc=cp-ctr;float b=dot(oc,cd),disc=b*b-dot(oc,oc)+R[j]*R[j];if(disc<0){chief_ok=0;break;}
    float t1=-b-sqrt(disc),t2=-b+sqrt(disc);
    point q1=cp+max(t1,0)*cd,q2=cp+max(t2,0)*cd;
    if(t1>=-1e-7&&dot(q1-ctr,ax)*R[j]<=1e-6){tt=t1;cq=q1;}
    else if(t2>=-1e-7&&dot(q2-ctr,ax)*R[j]<=1e-6){tt=t2;cq=q2;}
    else{chief_ok=0;break;}cn=normal((cq-ctr)/abs(R[j]));
   }
   if(tt< -1e-5){chief_ok=0;break;}if(dot(cd,cn)>0)cn=-cn;
   float ni=ND[j],nt=j>0?ND[j-1]:1,eta=ni/nt,ci=-dot(cd,cn),k=1-eta*eta*(1-ci*ci);
   if(k<0){chief_ok=0;break;}cd=normalize(eta*cd+(eta*ci-sqrt(k))*vector(cn));cp=cq;
  }
  if(chief_ok!=0){
   cp=point(cp.x,cp.y,sensor_z-cp.z);cd=normalize(vector(cd.x,cd.y,-cd.z));
   point ideal=cp+cd*((focal-cp.z)/max(1e-6,cd.z));
   direction=normalize(mix(hit,ideal,clamp(focus_preservation,0,1))-position/mm_to_scene);
  }
 }
 float field2=min(1,4*(pow(uv.x-.5,2)+pow(uv.y-.5,2)));
 if(first<0&&(bokeh_texture_rings>0||bokeh_texture_grain>0)){
  float a=bokeh_texture_rotation*.017453292519943295,c=cos(a),sn=sin(a);
  float x=(pupil_x*c+pupil_y*sn)*bokeh_texture_scale,y=(-pupil_x*sn+pupil_y*c)*bokeh_texture_scale;
  float radial=.5+.5*cos(6.28318530718*sqrt(x*x+y*y));
  float grain=.5+.25*sin(2.17*x+.7)*sin(1.73*y+1.3)+.25*sin(4.31*x+1.9)*sin(3.11*y-.4);
  energy*=(1-bokeh_texture_rings*.8*(1-radial))*(1-bokeh_texture_grain*.7*(1-grain))/max(1e-8,texture_normalization);
 }
 float attenuation=energy*pow(2,exposure+edge_brightness*field2)*(1-vignette*field2);
 throughput=sensor_response*attenuation;
}
'''
