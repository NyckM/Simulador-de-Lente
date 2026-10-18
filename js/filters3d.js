'use strict';
// GERADO por tools/build-filters3d.py a partir de app/web/filter-stack.js (Simulador de Desfoque 1.2.17).
// Não edite à mão: mude o app ou tools/filters3d-runner.js e rode o script.
{
const GlassViewer=(()=>{
 const V3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}};
 const M4={
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;},
  look(e,c,u){const z=V3.norm(V3.sub(e,c)),x=V3.norm(V3.cross(u,z)),y=V3.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);},
  rz(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
  rx(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
  id(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
 };

 /* ---------- malhas ---------- */
 function mesh(){return {p:[],n:[],e:[]};}
 function tri(m,a,b,c,na,nb,nc){if(!na){na=nb=nc=V3.norm(V3.cross(V3.sub(b,a),V3.sub(c,a)));}m.p.push(...a,...b,...c);m.n.push(...na,...nb,...nc);}
 function quad(m,a,b,c,d){tri(m,a,b,c);tri(m,a,c,d);}
 function edge(m,a,b){m.e.push(...a,...b);}
 // Placa com face frontal em heightfield: outline 'circle' ou 'square'.
 function slab(m,{outline='circle',r=.95,t=.08,f=()=>0,nu=128,nv=28,sharp=false,z0=0}){
  const h=1e-3,front=(x,y)=>t/2+f(x,y)+z0,back=-t/2+z0;
  const P=(u,v)=>outline==='circle'?[Math.cos(u*2*Math.PI)*r*v,Math.sin(u*2*Math.PI)*r*v]:[(u*2-1)*r,(v*2-1)*r];
  const nrm=(x,y)=>V3.norm([-(f(x+h,y)-f(x-h,y))/(2*h),-(f(x,y+h)-f(x,y-h))/(2*h),1]);
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
   const q=[[i/nu,j/nv],[(i+1)/nu,j/nv],[(i+1)/nu,(j+1)/nv],[i/nu,(j+1)/nv]].map(([u,v])=>P(u,v));
   const F=q.map(([x,y])=>[x,y,front(x,y)]),B=q.map(([x,y])=>[x,y,back]);
   if(sharp){quad(m,F[0],F[1],F[2],F[3]);}else{const N=q.map(([x,y])=>nrm(x,y));tri(m,F[0],F[1],F[2],N[0],N[1],N[2]);tri(m,F[0],F[2],F[3],N[0],N[2],N[3]);}
   const dn=[0,0,-1];tri(m,B[0],B[2],B[1],dn,dn,dn);tri(m,B[0],B[3],B[2],dn,dn,dn);
  }
  // paredes laterais e contornos
  const rim=[];if(outline==='circle'){for(let i=0;i<=nu;i++)rim.push(P(i/nu,1));}else{const s=48;for(const [a,b] of [[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[0,1]],[[0,1],[0,0]]])for(let k=0;k<s;k++){const w=k/s;rim.push(P(a[0]+(b[0]-a[0])*w,a[1]+(b[1]-a[1])*w));}rim.push(P(0,0));}
  for(let k=0;k<rim.length-1;k++){const [x0,y0]=rim[k],[x1,y1]=rim[k+1];const a=[x0,y0,front(x0,y0)],b=[x1,y1,front(x1,y1)],c=[x1,y1,back],d=[x0,y0,back];quad(m,d,c,b,a);edge(m,a,b);edge(m,d,c);}
  if(outline==='square')for(const [x,y] of [[-r,-r],[r,-r],[r,r],[-r,r]])edge(m,[x,y,front(x,y)],[x,y,back]);
 }
 function triBar(m,len=1.9,s=.62){const h=s*Math.sqrt(3)/2,pts=[[0,h*2/3],[-s/2,-h/3],[s/2,-h/3]].map(([y,z])=>[y,z]);
  const A=pts.map(([y,z])=>[-len/2,y,z]),B=pts.map(([y,z])=>[len/2,y,z]);
  for(let k=0;k<3;k++){const k2=(k+1)%3;quad(m,A[k],A[k2],B[k2],B[k]);edge(m,A[k],B[k]);edge(m,A[k],A[k2]);edge(m,B[k],B[k2]);}
  tri(m,A[0],A[2],A[1]);tri(m,B[0],B[1],B[2]);}
 function pyramid(m,n=3,r=.95,hgt=1.1){const base=[];for(let k=0;k<n;k++){const a=Math.PI/2+k*2*Math.PI/n;base.push([Math.cos(a)*r,Math.sin(a)*r,-hgt*.3]);}const apex=[0,0,hgt*.7];
  for(let k=0;k<n;k++){const a=base[k],b=base[(k+1)%n];tri(m,a,b,apex);edge(m,a,b);edge(m,a,apex);}
  for(let k=1;k<n-1;k++)tri(m,base[0],base[k+1],base[k]);}
 function cylinder(m,r,z0,z1,seg=96,cap=false,edges=false){for(let i=0;i<seg;i++){const a0=i/seg*2*Math.PI,a1=(i+1)/seg*2*Math.PI;const n0=[Math.cos(a0),Math.sin(a0),0],n1=[Math.cos(a1),Math.sin(a1),0];
  const p=(n,z)=>[n[0]*r,n[1]*r,z];tri(m,p(n0,z0),p(n1,z0),p(n1,z1),n0,n1,n1);tri(m,p(n0,z0),p(n1,z1),p(n0,z1),n0,n1,n0);
  if(cap){const c=[0,0,z1],up=[0,0,1];tri(m,c,p(n0,z1),p(n1,z1),up,up,up);}if(edges){edge(m,p(n0,z0),p(n1,z0));edge(m,p(n0,z1),p(n1,z1));}}}
 function annulus(m,r0,r1,z,seg=96,dir=1){const nn=[0,0,dir];for(let i=0;i<seg;i++){const a0=i/seg*2*Math.PI,a1=(i+1)/seg*2*Math.PI;const p=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r,z];if(dir>0){tri(m,p(r0,a0),p(r1,a0),p(r1,a1),nn,nn,nn);tri(m,p(r0,a0),p(r1,a1),p(r0,a1),nn,nn,nn);}else{tri(m,p(r0,a0),p(r1,a1),p(r1,a0),nn,nn,nn);tri(m,p(r0,a0),p(r0,a1),p(r1,a1),nn,nn,nn);}}}
 function cap(m,r,z,sag,seg=64,rings=12){// calota esférica convexa para +z
  const R=(r*r+sag*sag)/(2*sag),zc=z+sag-R;const P=(u,v)=>{const a=u*2*Math.PI,rr=v*r,zz=zc+Math.sqrt(R*R-rr*rr);return [Math.cos(a)*rr,Math.sin(a)*rr,zz];};const N=p=>V3.norm([p[0],p[1],p[2]-zc]);
  for(let i=0;i<seg;i++)for(let j=0;j<rings;j++){const a=P(i/seg,j/rings),b=P((i+1)/seg,j/rings),c=P((i+1)/seg,(j+1)/rings),d=P(i/seg,(j+1)/rings);tri(m,a,b,c,N(a),N(b),N(c));tri(m,a,c,d,N(a),N(c),N(d));}}

 /* ---------- aspecto por filtro ---------- */
 const DISC={r:.92,t:.07};
 function look(f){
  const k=f.kind,t=f.prism_type|0,n=Math.max(2,f.count|0),L={shape:'disc',frost:0,frostMode:0,inner:f.inner??.65,lines:0,lineCount:1,tint:[1,1,1],tintAmt:0,ring:true,ior:1.52,disp:.035,tiltable:false};
  const set=o=>Object.assign(L,o);
  switch(k){
   case 'black_mist':set({frost:.32,speck:1});break;
   case 'white_mist':set({frost:.62});break;
   case 'detail':set({frost:.22});break;
   case 'halation':set({frost:.3,tint:[1,.45,.25],tintAmt:.35});break;
   case 'streak':set({lines:1,lineCount:1,tint:f.tint?[f.red,f.green,f.blue]:[1,1,1],tintAmt:f.tint?.3:0});break;
   case 'star':set({lines:2,lineCount:n,tint:f.tint?[f.red,f.green,f.blue]:[1,1,1],tintAmt:f.tint?.3:0});break;
   case 'veil':set({frost:.75,frostMode:1,tiltable:true});break;
   case 'window':set({frost:.75,frostMode:2,tiltable:true});break;
   case 'halo':set({frost:.6,frostMode:2,shape:'halo',tiltable:true});break;
   case 'replicate':set({shape:'saw',count:n,ring:false,tiltable:true});break;
   case 'kaleidoscope':set({shape:'facet',count:n,tiltable:true});break;
   case 'split':set({shape:'split',tiltable:true});break;
   case 'fringing':set({tint:[.7,.9,1.2],tintAmt:.25,disp:.08});break;
   case 'directional':set({lines:3,lineCount:1});break;
   case 'prism':set({disp:.09,ring:false,tiltable:t>0,shape:['bar','pyramid3','wedge','facet','saw','pyramidN','biprism','axicon'][t]||'bar',count:n});break;
  }
  return L;
 }
 function shapeKey(L){return [L.shape,L.count||0,L.ring?1:0].join(':');}
 function buildGlass(L){const m=mesh();const n=L.count||6;
  switch(L.shape){
   case 'bar':triBar(m);break;
   case 'pyramid3':pyramid(m,3,1.0,1.15);break;
   case 'pyramidN':pyramid(m,n,.95,.9);break;
   case 'wedge':slab(m,{outline:'square',r:.82,t:.06,f:(x)=>.42*(x/.82+1)/2,nu:24,nv:24,sharp:true});break;
   case 'saw':slab(m,{outline:'square',r:.82,t:.06,f:(x)=>{const u=((x/.82+1)/2)*n;return .16*(u-Math.floor(u));},nu:Math.max(48,n*24),nv:8,sharp:true});break;
   case 'biprism':slab(m,{outline:'square',r:.82,t:.06,f:(x)=>.32*(1-Math.abs(x)/.82),nu:32,nv:8,sharp:true});break;
   case 'facet':slab(m,{r:.92,t:.06,f:(x,y)=>{const rr=Math.hypot(x,y)/.92,a=Math.atan2(y,x),s=2*Math.PI/n,c=(Math.floor(a/s)+.5)*s;return .3*Math.max(0,1-rr*Math.cos(a-c)/Math.cos(Math.PI/n));},nu:Math.max(96,n*24),nv:20,sharp:true});break;
   case 'axicon':slab(m,{r:.92,t:.06,f:(x,y)=>{const rr=Math.hypot(x,y)/.92;return .22*Math.min(1,Math.max(0,(1-rr)/.55));},nu:128,nv:28});break;
   case 'split':slab(m,{r:.92,t:.06,f:(x,y)=>x>0?.26*Math.max(0,1-(x*x+y*y)/(.92*.92)):0,nu:160,nv:28});break;
   case 'halo':slab(m,{r:.92,t:.07,f:(x,y)=>{const rr=Math.hypot(x,y)/.92;return -.025*Math.exp(-(((rr-.78)/.07)**2));},nu:128,nv:28});break;
   default:slab(m,{...DISC,nu:96,nv:6});
  }
  return m;}
 function buildRing(){const m=mesh();cylinder(m,1.0,-.07,.07,128);cylinder(m,.93,-.07,.07,128);annulus(m,.93,1.0,.07,128,1);annulus(m,.93,1.0,-.07,128,-1);return m;}
 function buildLens(){const metal=mesh(),dark=mesh(),glass=mesh();
  // barril
  cylinder(metal,1.12,-1.35,-1.0,128);annulus(metal,.9,1.12,-1.0,128,1);// aro frontal
  cylinder(metal,1.06,-2.0,-1.35,128);
  cylinder(metal,1.13,-3.1,-2.0,160);// anel de foco serrilhado
  cylinder(metal,1.04,-4.3,-3.1,128);cylinder(metal,.86,-4.6,-4.3,96);annulus(metal,0,.86,-4.6,96,-1);
  annulus(metal,1.06,1.12,-1.35,128,-1);annulus(metal,1.06,1.13,-2.0,160,1);annulus(metal,1.04,1.13,-3.1,160,-1);annulus(metal,.86,1.04,-4.3,128,-1);
  cylinder(dark,.9,-1.6,-1.0,96);annulus(dark,0,.9,-1.62,96,1);
  cap(glass,.86,-1.18,.2);cap(glass,.7,-1.5,.12);
  return {metal,dark,glass};}
 function buildGrid(){const m=mesh();for(let i=-12;i<=12;i++){const v=i*.5;edge(m,[v,-1.45,-9],[v,-1.45,4]);}for(let i=-18;i<=8;i++){const v=i*.5;edge(m,[-6,-1.45,v],[6,-1.45,v]);}return m;}

 /* ---------- shaders ---------- */
 const ENV=`vec3 env(vec3 d){float y=d.y;vec3 c=mix(vec3(.03,.035,.04),vec3(.11,.13,.14),smoothstep(-.3,.8,y));
  c+=vec3(.7,.8,.85)*smoothstep(.55,.95,dot(d,normalize(vec3(.9,.5,.4))))*.9;
  c+=vec3(.8,.85,.9)*smoothstep(.9,.99,dot(d,normalize(vec3(-.55,.45,.7))))*.5;
  c+=vec3(1.)*smoothstep(.8,.97,y)*1.6;
  c+=vec3(1.,.96,.9)*smoothstep(.965,.99,dot(d,normalize(vec3(-.75,.4,.5))))*2.4;
  c+=vec3(.55,.75,1.)*smoothstep(.965,.99,dot(d,normalize(vec3(.85,.25,-.25))))*1.8;
  return c;}`;
 const VS=`#version 300 es
 in vec3 aP,aN;uniform mat4 uM,uVP;out vec3 vW,vN,vL;
 void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=mat3(uM)*aN;vL=aP;gl_Position=uVP*w;}`;
 const FS=`#version 300 es
 precision highp float;in vec3 vW,vN,vL;out vec4 o;
 uniform vec3 uEye,uTint;uniform int uMat,uLines,uLineCount,uFrostMode,uRefr;uniform float uFrost,uInner,uTintAmt,uIor,uDisp,uSpeck;uniform sampler2D uScene;uniform vec2 uSize;uniform mat4 uV;
 ${ENV}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vW);float nv=max(dot(N,V),0.);
  if(uMat==1||uMat==3){// metal anodizado / interior
   float a=atan(vL.y,vL.x);if(uMat==1&&vL.z<-2.02&&vL.z>-3.08&&length(vL.xy)>1.1){N=normalize(N+vec3(-sin(a),cos(a),0.)*sin(a*140.)*.35);}
   vec3 R=reflect(-V,N);vec3 spec=(env(R)*.55+env(normalize(R+vec3(.15,.1,0.)))*.25+env(normalize(R-vec3(.1,.15,0.)))*.2);
   float F=.05+.95*pow(1.-nv,5.);vec3 base=uMat==1?vec3(.055,.058,.062):vec3(.008);
   vec3 c=base*(.3+.7*max(dot(N,normalize(vec3(-.5,.6,.6))),0.))+spec*(uMat==1?.42+F*.5:.05);
   o=vec4(c,1.);return;}
  float F0=.04,F=F0+(1.-F0)*pow(1.-nv,5.);
  vec3 R=reflect(-V,N),refl=env(R);
  float eta=gl_FrontFacing?1./uIor:uIor;
  vec3 tr=vec3(env(refract(-V,N,eta*(1.-uDisp))).r,env(refract(-V,N,eta)).g,env(refract(-V,N,eta*(1.+uDisp))).b);
  float rr=length(vL.xy)/.92,fm=uFrost;
  if(uFrostMode==1)fm*=smoothstep(-.15,.15,vL.x);
  else if(uFrostMode==2)fm*=smoothstep(uInner*.45,uInner*.45+.25,rr);
  float lines=0.;
  if(uLines==1)lines=pow(abs(sin(vL.y*95.)),60.)*.8;
  else if(uLines==2){for(int k=0;k<8;k++){if(k>=uLineCount)break;float a=float(k)*3.14159265/float(uLineCount);lines+=pow(abs(sin(dot(vL.xy,vec2(-sin(a),cos(a)))*75.)),70.)*.5;}}
  else if(uLines==3)lines=hash(floor(vL.xy*vec2(6.,260.)))*.25;
  float speck=uSpeck*step(.985,hash(floor(vL.xy*140.)));
  vec3 tint=mix(vec3(1.),uTint,uTintAmt);
  vec3 c=refl*F*1.4+tr*(1.-F)*mix(.32,.08,fm)*tint+vec3(.035,.045,.05)*(.6+.4*dot(N,normalize(vec3(-.4,.7,.6))));
  c+=vec3(.75,.78,.8)*fm*(.05+.25*env(N).g)*tint;
  c+=vec3(.9,.95,1.)*lines*(.15+env(R).g*.4);
  c*=1.-speck*.8;
  if(uMat==2){c+=vec3(.1,.06,.16)*pow(1.-nv,2.)*.5+vec3(.03,.09,.05)*pow(nv,4.)*.25;}
   if(uRefr==1){// refração em espaço de tela: o vidro desvia e dispersa o que está atrás dele
    vec2 suv=gl_FragCoord.xy/uSize;vec3 vn=normalize(mat3(uV)*N);float k=(uIor-1.)*.14*(1.+.6*(1.-nv));vec2 off=vn.xy*k;off*=min(1.,.07/max(length(off),1e-4));
    vec3 sc=vec3(0.);float blur=fm*.03+.0015;
    for(int i=0;i<10;i++){float aa=float(i)*2.39996323,r2=sqrt((float(i)+.5)/10.)*blur;vec2 j=vec2(cos(aa),sin(aa))*r2;
     sc+=vec3(texture(uScene,suv-off*(1.-uDisp*5.)+j).r,texture(uScene,suv-off+j).g,texture(uScene,suv-off*(1.+uDisp*5.)+j).b);}
    sc/=10.;
    vec3 body=sc*(1.-F)*tint*vec3(.94,.985,.965);
    vec3 haze=vec3(.62,.66,.68)*fm*(.08+.22*env(N).g)*tint;
    float rim=pow(1.-nv,3.);
    vec3 H1=normalize(normalize(vec3(-.6,.7,.5))+V),H2=normalize(normalize(vec3(.8,.35,.3))+V);
    float sp=pow(max(dot(N,H1),0.),140.)*2.2+pow(max(dot(N,H2),0.),60.)*.7;
    vec3 hue=clamp(abs(fract(nv*2.2+vec3(0.,.33,.67))*6.-3.)-1.,0.,1.);
    vec3 cr=body*(1.-fm*.45)+min(refl,vec3(1.6))*F*1.5+haze+vec3(.9,.95,1.)*lines*(.2+env(R).g*.5)+vec3(.55,.62,.7)*rim*.25+hue*pow(1.-nv,7.)*uDisp*2.5+vec3(1.,.98,.95)*sp*(1.-fm*.6);
    cr*=1.-speck*.8;cr=1.-exp(-cr*1.15);o=vec4(cr,1.);return;}
  float a=clamp(.16+F*.8+fm*.5+lines*.25+speck*.6,0.,1.);
  o=vec4(c,a);}`;
 const CVS=`#version 300 es
  out vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const CFS=`#version 300 es
  precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uTex;void main(){o=texture(uTex,uv);}`;
  const BFS=`#version 300 es
  precision highp float;in vec2 uv;out vec4 o;void main(){vec2 d=uv-vec2(.62,.62);float g=exp(-dot(d,d)*3.2);o=vec4(mix(vec3(.022,.026,.028),vec3(.11,.125,.13),g)+vec3(.015)*uv.y,1.);}`;
 const LVS=`#version 300 es
 in vec3 aP;uniform mat4 uM,uVP;out vec3 vW;void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;gl_Position=uVP*w;}`;
 const LFS=`#version 300 es
 precision highp float;in vec3 vW;out vec4 o;uniform vec4 uC;uniform int uMode;uniform vec3 uEye;
 void main(){float a=uC.a;if(uMode==1)a*=exp(-length(vW.xz-vec2(0.,-1.5))*.28);if(uMode==2){if(fract(vW.z*3.)>.55)discard;a*=smoothstep(-9.,-6.,vW.z)*smoothstep(4.,2.,vW.z);}o=vec4(uC.rgb*a,a);}`;

 /* ---------- renderer ---------- */
 let gl=null,canvas=null,overlay=null,prog,lprog,cprog,bprog,targets=null,buffers=new Map(),state=null,cam={yaw:58,pitch:16,dist:5.9},raf=0,ready=false,failed='';
 function compile(vs,fs){const p=gl.createProgram();for(const [t,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.bindAttribLocation(p,0,'aP');gl.bindAttribLocation(p,1,'aN');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const info=gl.getActiveUniform(p,i);u[info.name]=gl.getUniformLocation(p,info.name);}return {p,u};}
 function release(key){const old=buffers.get(key);if(!old)return;gl.deleteVertexArray(old.vao);gl.deleteVertexArray(old.evao);for(const b of old.bufs)gl.deleteBuffer(b);buffers.delete(key);}
 function upload(key,m){release(key);
  const vao=gl.createVertexArray(),bufs=[];gl.bindVertexArray(vao);const put=(data,loc)=>{const b=gl.createBuffer();bufs.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);};
  put(m.p,0);put(m.n.length?m.n:m.p,1);const evao=gl.createVertexArray();gl.bindVertexArray(evao);if(m.e.length)put(m.e,0);gl.bindVertexArray(null);
  const rec={vao,evao,bufs,count:m.p.length/3,ecount:m.e.length/3};buffers.set(key,rec);return rec;}
 function init(){if(gl||failed)return !!gl;canvas=document.createElement('canvas');canvas.className='glass-viewer-canvas';canvas.setAttribute('aria-label','Visor 3D do vidro na frente da lente');
  gl=canvas.getContext('webgl2',{antialias:true,alpha:false,premultipliedAlpha:true,powerPreference:'low-power'});
  if(!gl){failed='WebGL2 indisponível para o visor 3D.';return false;}
  try{prog=compile(VS,FS);lprog=compile(LVS,LFS);cprog=compile(CVS,CFS);bprog=compile(CVS,BFS);}catch(e){failed=e.message;gl=null;return false;}
  const lens=buildLens();upload('lens.metal',lens.metal);upload('lens.dark',lens.dark);upload('lens.glass',lens.glass);upload('ring',buildRing());upload('grid',buildGrid());
  const axis=mesh();edge(axis,[0,0,4],[0,0,-9]);upload('axis',axis);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;});
  canvas.addEventListener('webglcontextrestored',()=>{buffers=new Map();targets=null;gl=null;failed='';init();schedule();});
  bindInput();ready=true;return true;}
 function eye(){const y=cam.yaw*Math.PI/180,p=cam.pitch*Math.PI/180,t=[0,-.05,-1.45];return [t[0]+cam.dist*Math.sin(y)*Math.cos(p),t[1]+cam.dist*Math.sin(p),t[2]+cam.dist*Math.cos(y)*Math.cos(p)];}
 function glassModel(f,L){const tilt=L.tiltable?Math.max(-.6,Math.min(.6,(f.shift||0)*3)):0;return M4.mul(M4.rz((f.rotation||0)*Math.PI/180),M4.rx(-tilt));}
   // Alvos: cena opaca -> textura; vidro refrata essa textura; supersample e redução linear no canvas.
  function ensureTargets(w,h){if(targets&&targets.w===w&&targets.h===h)return targets;if(targets){for(const t of targets.tex)gl.deleteTexture(t);for(const f of targets.fb)gl.deleteFramebuffer(f);gl.deleteRenderbuffer(targets.depth);}
   const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
   const tex=[],fb=[];for(let i=0;i<2;i++){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,w,h);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
    const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);tex.push(t);fb.push(f);}
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);targets={w,h,tex,fb,depth};return targets;}
  function copy(tex){gl.useProgram(cprog.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(cprog.u.uTex,0);gl.bindVertexArray(null);gl.drawArrays(gl.TRIANGLES,0,3);}
  function draw(){raf=0;if(!ready||!state||!canvas.isConnected)return;const f=state.f,L=look(f);
   const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   const ss=dpr<1.5?2:1.5,W=Math.min(2048,Math.round(w*ss)),H=Math.min(2048,Math.round(h*ss)),T=ensureTargets(W,H);
   const e=eye(),V=M4.look(e,[0,-.05,-1.45],[0,1,0]),VP=M4.mul(M4.persp(.62,w/h,.1,60),V),I=M4.id();
   const lines=(key,c,mode,M=I)=>{const b=buffers.get(key);if(!b||!b.ecount)return;gl.useProgram(lprog.p);gl.uniformMatrix4fv(lprog.u.uVP,false,VP);gl.uniformMatrix4fv(lprog.u.uM,false,M);gl.uniform4fv(lprog.u.uC,c);gl.uniform1i(lprog.u.uMode,mode);gl.uniform3fv(lprog.u.uEye,e);gl.bindVertexArray(b.evao);gl.drawArrays(gl.LINES,0,b.ecount);};
   const meshUniforms=()=>{gl.useProgram(prog.p);gl.uniformMatrix4fv(prog.u.uVP,false,VP);gl.uniformMatrix4fv(prog.u.uV,false,V);gl.uniform3fv(prog.u.uEye,e);gl.uniform2f(prog.u.uSize,W,H);gl.uniform1i(prog.u.uScene,1);};
   const solid=(key,mat,M=I)=>{const b=buffers.get(key);meshUniforms();gl.uniform1i(prog.u.uRefr,0);gl.uniformMatrix4fv(prog.u.uM,false,M);gl.uniform1i(prog.u.uMat,mat);gl.bindVertexArray(b.vao);gl.drawArrays(gl.TRIANGLES,0,b.count);};
   const glassUniforms=(M,params)=>{gl.uniformMatrix4fv(prog.u.uM,false,M);gl.uniform1i(prog.u.uMat,params.mat);gl.uniform1f(prog.u.uFrost,params.frost||0);gl.uniform1i(prog.u.uFrostMode,params.frostMode||0);gl.uniform1f(prog.u.uInner,params.inner??.65);gl.uniform1i(prog.u.uLines,params.lines||0);gl.uniform1i(prog.u.uLineCount,params.lineCount||1);gl.uniform3fv(prog.u.uTint,params.tint||[1,1,1]);gl.uniform1f(prog.u.uTintAmt,params.tintAmt||0);gl.uniform1f(prog.u.uIor,params.ior||1.52);gl.uniform1f(prog.u.uDisp,params.disp||.03);gl.uniform1f(prog.u.uSpeck,params.speck||0);};
   // 1) cena opaca
   gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb[0]);gl.viewport(0,0,W,H);gl.clearColor(.03,.036,.038,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(bprog.p);gl.bindVertexArray(null);gl.drawArrays(gl.TRIANGLES,0,3);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);lines('grid',[.55,.7,.65,.35],1);
   gl.depthMask(true);gl.disable(gl.BLEND);solid('lens.metal',1);solid('lens.dark',3);if(L.ring)solid('ring',1,M4.rz((f.rotation||0)*Math.PI/180));
   // elementos da objetiva: vidro com coating, mistura simples
   gl.enable(gl.BLEND);gl.depthMask(false);meshUniforms();gl.uniform1i(prog.u.uRefr,0);glassUniforms(I,{mat:2,disp:.02});const lg=buffers.get('lens.glass');gl.bindVertexArray(lg.vao);gl.drawArrays(gl.TRIANGLES,0,lg.count);
   lines('axis',[.35,.85,1,.9],2);
   // 2) cópia da cena + vidro do filtro refratando a cena
   gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb[1]);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);copy(T.tex[0]);
   const key='glass:'+shapeKey(L);if(!buffers.has(key)){if(buffers.size>40)for(const k of [...buffers.keys()])if(k.startsWith('glass:'))release(k);upload(key,buildGlass(L));}
   const GM=glassModel(f,L),gb=buffers.get(key);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,T.tex[0]);meshUniforms();gl.uniform1i(prog.u.uRefr,1);glassUniforms(GM,{mat:0,...L});gl.bindVertexArray(gb.vao);gl.drawArrays(gl.TRIANGLES,0,gb.count);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);
   // arestas do vidro, levemente iluminadas
   gl.depthMask(false);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);lines(key,[.9,.95,1,.6],0,GM);gl.depthFunc(gl.LESS);
   // 3) redução para o canvas
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);copy(T.tex[1]);
   gl.depthMask(true);gl.bindVertexArray(null);
   drawOverlay(VP);}
 function drawOverlay(VP){const c=overlay,dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(c.clientWidth*dpr),h=Math.round(c.clientHeight*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const g=c.getContext('2d');g.clearRect(0,0,w,h);
  const o=[30*dpr,h-26*dpr],len=18*dpr,axes=[[[1,0,0],'#ff5b5b','X'],[[0,1,0],'#7dff8a','Y'],[[0,0,1],'#5ba8ff','Z']];
  for(const [v,col,label] of axes){const sx=VP[0]*v[0]+VP[4]*v[1]+VP[8]*v[2],sy=VP[1]*v[0]+VP[5]*v[1]+VP[9]*v[2],l=Math.hypot(sx,sy)||1;const x=o[0]+sx/l*len*Math.min(1,l),y=o[1]-sy/l*len*Math.min(1,l);g.strokeStyle=col;g.lineWidth=1.5*dpr;g.beginPath();g.moveTo(...o);g.lineTo(x,y);g.stroke();g.fillStyle=col;g.font=`${9*dpr}px Segoe UI,sans-serif`;g.fillText(label,x+2*dpr,y+3*dpr);}}
 function schedule(){if(!raf)raf=requestAnimationFrame(draw);}
 let drag=null;
 function bindInput(){canvas.style.touchAction='none';
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{if(!state)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,orbit:e.button===2||e.shiftKey||e.altKey,start:{rotation:state.f.rotation,shift:state.f.shift},cam:{...cam}};});
  canvas.addEventListener('pointermove',e=>{if(!drag||!state)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(drag.orbit){cam.yaw=drag.cam.yaw-dx*.45;cam.pitch=Math.max(-80,Math.min(80,drag.cam.pitch+dy*.35));schedule();return;}
   const f=state.f,L=look(f);f.rotation=Math.max(-360,Math.min(360,drag.start.rotation+dx*.6));if(L.tiltable)f.shift=Math.max(-.5,Math.min(.5,drag.start.shift-dy*.0015));state.onEdit?.(f,false);schedule();});
  const end=e=>{if(!drag)return;const wasOrbit=drag.orbit;drag=null;if(!wasOrbit)state?.onEdit?.(state.f,true);};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dist=Math.max(3.5,Math.min(14,cam.dist*Math.exp(e.deltaY*.0012)));schedule();},{passive:false});
  canvas.addEventListener('dblclick',()=>{setView('persp');});
  new ResizeObserver(schedule).observe(canvas);}
 const VIEWS={front:{yaw:0,pitch:3,dist:5.2},side:{yaw:90,pitch:4,dist:6.6},persp:{yaw:58,pitch:16,dist:5.9}};
 function setView(name){Object.assign(cam,VIEWS[name]||VIEWS.persp);host?.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));schedule();}
 let host=null;
 /* Monta o visor dentro de `container` para o filtro `f`. onEdit(f, final) recebe mudanças de rotação/inclinação. */
 function attach(container,f,onEdit){
  if(!host){host=document.createElement('div');host.className='glass-viewer';const head=document.createElement('div');head.className='glass-viewer-head';head.innerHTML='<span>Visor do vidro</span>';host.append(head);
   const stage=document.createElement('div');stage.className='glass-viewer-stage';host.append(stage);
   const bar=document.createElement('div');bar.className='glass-viewer-bar';for(const [v,label] of [['front','Frontal'],['side','Lateral'],['persp','Perspectiva']]){const b=document.createElement('button');b.type='button';b.dataset.view=v;b.textContent=label;b.onclick=()=>setView(v);bar.append(b);}const hint=document.createElement('small');hint.textContent='Arraste para girar o vidro · Shift/botão direito orbita';bar.append(hint);host.append(bar);
   if(init()){stage.append(canvas);overlay=document.createElement('canvas');overlay.className='glass-viewer-gizmo';stage.append(overlay);}else{const p=document.createElement('p');p.className='note';p.textContent=failed;stage.append(p);}
   setView('persp');}
  state={f,onEdit};container.prepend(host);schedule();window.BruxosI18n?.refresh?.();return host;}
 function refresh(f){if(state&&(!f||f===state.f))schedule();}
 function detach(){state=null;host?.remove();}
 return {attach,refresh,detach,setView,look,_buildGlass:buildGlass};
})();
window.GlassViewer=GlassViewer;

'use strict';
const ArtisticFilters=(()=>{
 const kinds=['black_mist','white_mist','detail','streak','star','veil','window','replicate','halo','kaleidoscope','split','fringing','halation','prism','directional'];
 const labels=['Black Mist · artístico','White Mist · artístico','Suavização de detalhe','Streak','Estrelas','Véu lateral','Janela central','Replicações / Linear','Halo FX','Kaleidoscope FX','Split Diopter FX','Fringing','Halation · artístico','Prisma cromático','Blur direcional'];
 const prismTypes=['Cromático (dispersão)','Triangular','Cunha','Facetado','Replicação linear','Caleidoscópio','Split','Anel radial'];
 const defaults={enabled:true,amount:.35,x:.5,y:.5,scale:1,scale_x:1,scale_y:1,rotation:0,pivot_x:0,pivot_y:0,radius:.04,threshold:.7,softness:.2,inner:.65,feather:.25,shift:.04,count:4,tint:false,red:.25,green:.6,blue:1,region:false,prism_amount:0,prism_shift:.015,prism_angle:0,prism_type:0,edge_blur:.06,blur_amount:0,blur_radius:.04,blur_angle:0};
 function create(kind,type=0){const f={...defaults,kind};if(kind==='prism'){type=Math.max(0,Math.min(7,Math.round(Number(type)||0)));f.prism_type=type;f.prism_shift=.02;f.shift=.06;if(type===3||type===5)f.count=6;if(type===4)f.count=4;if(type===2||type===6){f.inner=0;f.feather=.08;}if(type===3||type===5||type===7){f.inner=.35;f.feather=.3;}}if(kind==='fringing')Object.assign(f,{threshold:.05,softness:.1,shift:.003});if(kind==='replicate')f.shift=.12;if(kind==='split')f.inner=0;return f;}
 const limits={amount:[0,1],x:[-1,2],y:[-1,2],scale:[.05,4],scale_x:[.05,4],scale_y:[.05,4],rotation:[-360,360],pivot_x:[-2,2],pivot_y:[-2,2],radius:[.001,.3],threshold:[0,20],softness:[.001,5],inner:[0,2],feather:[.01,1],shift:[-.5,.5],count:[2,8],red:[0,2],green:[0,2],blue:[0,2],prism_amount:[0,1],prism_shift:[0,.1],prism_angle:[-360,360],prism_type:[0,7],edge_blur:[0,.3],blur_amount:[0,1],blur_radius:[0,.3],blur_angle:[-360,360]};
 function validate(raw){if(!Array.isArray(raw)||raw.length>16)throw Error('Filtros: use uma pilha de até 16 módulos.');return raw.map(f=>{if(!f||!kinds.includes(f.kind))throw Error('Filtro desconhecido.');const result={...defaults,kind:f.kind};for(const key of ['enabled','tint','region']){const v=f[key]??result[key];if(typeof v!=='boolean')throw Error('Filtro: opção booleana inválida.');result[key]=v;}for(const [key,[lo,hi]]of Object.entries(limits)){const v=f[key]??result[key];if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi||(key==='count'||key==='prism_type')&&!Number.isInteger(v))throw Error('Filtro: '+key+' fora do intervalo.');result[key]=v;}return result;});}
 const shader=`#version 300 es
 precision highp float;in vec2 uv;out vec4 outColor;
 uniform sampler2D plate,blurSrc;uniform bool useMip;uniform float shortPx;uniform vec2 blurScale;uniform vec2 size,position,scales,pivot;uniform int mode,count,maskMode;uniform bool tinted,regional;
 uniform int prismType;uniform float edgeBlur,amount,radius,threshold,softness,inner,feather,shift,angle,prismShift,prismAngle,prismOffset,blurRadius,blurAngle;uniform vec3 tint;
 vec2 units;mat2 rotation;
 float smoothRange(float lo,float hi,float v){return smoothstep(lo,hi,v);}
 vec2 local(vec2 p){return transpose(rotation)*((p-position)*units-pivot)/scales+pivot;}
 vec2 world(vec2 p){return (rotation*((p-pivot)*scales)+pivot)/units+position;}
 // 1.2.16: espelha numa linha 4 px para dentro da borda; as bordas do quadro renderizado tendem a ser mais escuras e,
 // espelhadas, viravam linhas escuras dentro do Kaleidoscope/prisma.
 vec2 mirrorIn(vec2 p){vec2 e=min(vec2(6.)/size,vec2(.1)),q=(p-e)/(1.-2.*e);q=1.-abs(1.-mod(q,2.));return e+q*(1.-2.*e);}
 vec2 inside(vec2 p){vec2 e=min(vec2(6.)/size,vec2(.1));return all(greaterThanEqual(p,e))&&all(lessThanEqual(p,1.-e))?p:mirrorIn(p);}
 vec3 sampleAt(vec2 p){vec2 m=inside(p);return texture(plate,vec2(m.x,1.-m.y)).rgb;}
 float edgeStep(float x,float w){float e=max(sqrt(w*w+edgeBlur*edgeBlur),1e-5);return smoothstep(-e,e,x);}
 vec3 selected(vec3 v){float l=dot(v,vec3(.2126,.7152,.0722));return v*smoothstep(threshold,threshold+softness,l)*max(0.,1.-threshold/max(l,1e-5));}
 vec3 mipAt(vec2 p,float lod){vec2 m=inside(p);return textureLod(blurSrc,vec2(m.x,1.-m.y)*blurScale,min(lod,7.5)).rgb;}
 // 1.2.11: com useMip, a fonte já vem selecionada e pré-filtrada em mipmap; cada amostra lê a média da sua área,
 // então a difusão é contínua (sem cópias pontuais dos highlights).
 vec3 blurAt(vec2 p,float r,bool selectLight){if(useMip){float lod=log2(max(r*shortPx*.42,1.))+.75;vec3 acc=vec3(0.);float m=0.;float rot=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))*6.2831853;for(int i=0;i<32;i++){float t=float(i)+.5,a=t*2.39996323+rot,rr=sqrt(t/32.),w=exp(-2.*rr*rr);acc+=mipAt(p+vec2(cos(a),sin(a))*rr*r/units,lod)*w;m+=w;}return acc/m;}vec3 result=vec3(0.);float mass=0.;for(int i=0;i<24;i++){float t=float(i)+.5,a=t*2.39996323,rr=sqrt(t/24.),weight=exp(-2.*rr*rr);vec3 v=sampleAt(p+vec2(cos(a),sin(a))*rr*r/units);result+=(selectLight?selected(v):v)*weight;mass+=weight;}return result/mass;}
 vec2 dirAt(float a){return vec2(cos(a),sin(a))/units;}
 vec3 specTable(int i){return i==0?vec3(.2,.02,.8):i==1?vec3(.05,.2,1.):i==2?vec3(0.,.8,.3):i==3?vec3(.2,1.,.02):i==4?vec3(1.,.7,0.):i==5?vec3(1.,.15,0.):vec3(.7,0.,0.);}
 // 1.2.16: 13 comprimentos de onda e amostras pré-filtradas pelo espaçamento entre elas: espectro contínuo, sem traços.
 vec3 spectral(vec2 p,vec2 d){vec3 sum=vec3(0.),mass=vec3(0.);float lod=log2(max(1.,.25*length(d*size)))+.5;for(int i=0;i<13;i++){float wavelength=430.+20.*float(i),offset=(pow(550./wavelength,2.)-1.)/.63600757,t=float(i)*.5;int a=int(floor(t));vec3 weight=mix(specTable(a),specTable(min(a+1,6)),fract(t));vec2 q=p+d*offset;sum+=(useMip?mipAt(q,lod):sampleAt(q))*weight;mass+=weight;}return sum/mass;}
 vec3 prismAt(vec2 p){return spectral(p,dirAt(prismAngle+angle)*prismShift);}
 vec3 prismTyped(vec2 p,vec2 q,float dist,float peripheral,inout float mask){float A=prismAngle+angle;vec2 d=dirAt(A);
  if(prismType==1){vec3 t=vec3(0.);for(int k=0;k<3;k++){vec2 e=dirAt(A+float(k)*2.09439510239);t+=spectral(p+e*prismOffset,e*prismShift);}return t/3.;}
  if(prismType==2){mask*=edgeStep(q.x-inner*.25,feather);return spectral(p+d*prismOffset,d*prismShift);}
  if(prismType==3){float sector=6.28318530718/float(count),u=atan(q.y,q.x)/sector,i0=floor(u),fr=u-i0,side=fr<.5?-1.:1.,dEdge=length(q)*sin(min(fr,1.-fr)*sector),wn=.5-.5*smoothstep(0.,max(edgeBlur,1e-5),dEdge);vec2 e0=dirAt((i0+.5)*sector+A),e1=dirAt((i0+side+.5)*sector+A);mask*=peripheral;vec3 c0=spectral(p+e0*prismOffset,e0*prismShift);if(wn<.002)return c0;return mix(c0,spectral(p+e1*prismOffset,e1*prismShift),wn);}
  if(prismType==4){vec3 t=vec3(0.);float m=0.;for(int i=0;i<8;i++){if(i>=count)break;float w=pow(.62,float(i));t+=spectral(p+d*prismOffset*float(i),d*prismShift*(1.+float(i)))*w;m+=w;}return t/m;}
  if(prismType==5){float sector=6.28318530718/float(count),th=atan(q.y,q.x),a=abs(mod(th+sector*.5,sector)-sector*.5);mask*=peripheral;return spectral(world(vec2(cos(a),sin(a))*length(q)),dirAt(th+angle)*prismShift);}
  if(prismType==6){float side=edgeStep(q.x-inner*.25,feather);return mix(spectral(p-d*prismOffset,-d*prismShift),spectral(p+d*prismOffset,d*prismShift),side);}
  if(prismType==7){vec2 e=dirAt(atan(q.y,q.x)+angle);float r=min(dist,2.);mask*=peripheral;return spectral(p-e*prismOffset*r,e*prismShift*r);}
  return spectral(p,d*prismShift);}
 vec3 directionalAt(vec2 p){vec2 axis=vec2(cos(blurAngle+angle),sin(blurAngle+angle))/units;vec3 sum=vec3(0.);float mass=0.;for(int i=0;i<33;i++){float t=float(i-16)/16.,weight=exp(-4.*t*t);sum+=sampleAt(p+axis*t*blurRadius)*weight;mass+=weight;}return sum/mass;}
 void main(){units=size/min(size.x,size.y);float c=cos(angle),s=sin(angle);rotation=mat2(c,s,-s,c);vec2 p=vec2(uv.x,1.-uv.y),q=local(p);float dist=length(q)/.25;float pe=edgeBlur*2.;float peripheral=smoothstep(inner-pe,inner+feather+pe,dist);float mask=regional?1.-smoothstep(.8-pe,1.+pe,dist):1.;vec3 base=texture(plate,uv).rgb,target=base,chosen=selected(base);
 if(mode==0)target=base-chosen+blurAt(p,radius,true);
 else if(mode==1)target=blurAt(p,radius,false);
 else if(mode==2)target=blurAt(p,radius*.2,false);
 else if(mode==12)target=base-chosen+blurAt(p,radius,true)*vec3(1.,.3,.06);
 else if(mode==3||mode==4){target=vec3(0.);float mass=0.;int dirs=mode==4?count:1;for(int j=0;j<8;j++){if(j>=dirs)break;float a=angle+float(j)*3.14159265359/float(dirs);vec2 axis=vec2(cos(a),sin(a));for(int i=0;i<33;i++){float t=float(i-16)/16.,weight=exp(-4.*t*t);target+=(useMip?mipAt(p+axis*t*radius/units,log2(max(radius*shortPx/16.,1.))+.5):selected(sampleAt(p+axis*t*radius/units)))*weight;mass+=weight;}}target=base-chosen+target/mass*(tinted?tint:vec3(1.));}
 else if(mode==7){target=vec3(0.);for(int i=0;i<8;i++){if(i>=count)break;vec2 v=q;v.x+=(float(i)-float(count-1)*.5)*shift;target+=sampleAt(world(v))/float(count);}}
 else if(mode==9){float sector=6.28318530718/float(count),a=abs(mod(atan(q.y,q.x)+sector*.5,sector)-sector*.5);target=sampleAt(world(vec2(cos(a),sin(a))*length(q)));mask*=peripheral;}
 else if(mode==8){target=blurAt(world(q*(1.+shift*dist)),radius*.2,false);mask*=peripheral;}
 else if(mode==5||mode==6||mode==10){vec2 v=q;v.x+=shift;target=blurAt(world(v),radius,false);mask*=mode==6?peripheral:mode==10?edgeStep(q.x-inner*.25,feather):edgeStep(q.x,feather);}
 else if(mode==13)target=prismTyped(p,q,dist,peripheral,mask);
 else if(mode==14)target=directionalAt(p);
 else {vec2 axis=vec2(cos(angle),sin(angle))/units;float contrast=abs(dot(sampleAt(p+axis*.002)-sampleAt(p-axis*.002),vec3(.2126,.7152,.0722)));vec2 delta=axis*shift;target=vec3(sampleAt(p+delta).r,base.g,sampleAt(p-delta).b);mask*=smoothstep(threshold,threshold+softness,contrast);}
 if(mode>=13){if(maskMode==8||maskMode==9||maskMode==6)mask*=peripheral;else if(maskMode==10)mask*=edgeStep(q.x-inner*.25,feather);else if(maskMode==5)mask*=edgeStep(q.x,feather);}
 outColor=vec4(mix(base,max(target,vec3(0.)),amount*mask),texture(plate,uv).a);}
 `;
 const prepShader=`#version 300 es
 precision highp float;in vec2 uv;out vec4 o;uniform sampler2D plate;uniform bool selectLight;uniform float threshold,softness;uniform vec2 srcSize;
 void main(){vec2 t=gl_FragCoord.xy/srcSize;t=1.-abs(1.-mod(t,2.));vec3 v=texture(plate,t).rgb;if(selectLight){float l=dot(v,vec3(.2126,.7152,.0722));v*=smoothstep(threshold,threshold+softness,l)*max(0.,1.-threshold/max(l,1e-5));}o=vec4(max(v,vec3(0.)),1.);}`;
 // Filtros que usam desfoque largo: fonte pré-filtrada (mipmap) para difusão contínua.
 const blurKinds={prism:false,black_mist:true,halation:true,streak:true,star:true,white_mist:false,detail:false,veil:false,window:false,split:false,halo:false};
 function passes(filters){const result=[];for(const f of filters||[]){if(!f.enabled||!f.amount)continue;const mask_kind=f.kind;if(!((f.kind==='prism'&&!f.prism_shift&&!(f.prism_type>0&&f.shift))||(f.kind==='directional'&&!f.blur_radius)))result.push(f);if(f.kind!=='prism'&&f.prism_amount>0&&f.prism_shift>0)result.push({...f,kind:'prism',mask_kind,prism_type:0,amount:f.amount*f.prism_amount});if(f.kind!=='directional'&&f.blur_amount>0&&f.blur_radius>0)result.push({...f,kind:'directional',mask_kind,amount:f.amount*f.blur_amount});}return result;}
 function apertureScale(){const iris=typeof settings!=='undefined'&&settings?.iris_mm;return Number.isFinite(iris)&&iris>0?Math.max(.25,Math.min(4,iris/8.55)):1;}
 function label(f){return f.kind==='prism'?'Prisma · '+prismTypes[f.prism_type|0]:labels[kinds.indexOf(f.kind)];}
 return {prepShader,blurKinds,kinds,labels,prismTypes,label,apertureScale,defaults,create,validate,shader,passes};
})();
class ArtisticFilterPass{
 constructor(gl,makeProgram){this.gl=gl;this.program=makeProgram(ArtisticFilters.shader);this.prep=makeProgram(ArtisticFilters.prepShader);this.prepLoc={};for(const k of ['plate','selectLight','threshold','softness','srcSize'])this.prepLoc[k]=gl.getUniformLocation(this.prep,k);this.blurTex=null;this.blurSize='';this.blurFbo=gl.createFramebuffer();this.textures=[gl.createTexture(),gl.createTexture()];this.fbo=gl.createFramebuffer();this.dimensions='';this.sizes=new Map();this.loc={};
  const n=gl.getProgramParameter(this.program,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const info=gl.getActiveUniform(this.program,i);this.loc[info.name]=gl.getUniformLocation(this.program,info.name);}
  for(const tex of this.textures){gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}gl.bindTexture(gl.TEXTURE_2D,null);}
 // Fonte do desfoque largo: luz selecionada (ou imagem) em textura com mipmaps, na unidade 10.
 prepareBlur(f,rw,rh,plateUnit){const g=this.gl,size=rw+','+rh;
  if(this.blurSize!==size){if(this.blurTex)g.deleteTexture(this.blurTex);this.blurTex=g.createTexture();g.activeTexture(g.TEXTURE10);g.bindTexture(g.TEXTURE_2D,this.blurTex);/* múltiplo de 256: os 8 primeiros níveis de mipmap ficam com 2x2 exatos, sem descartar linhas */const TW=Math.ceil(rw/256)*256,TH=Math.ceil(rh/256)*256;this.blurDims=[TW,TH];const levels=Math.floor(Math.log2(Math.max(TW,TH)))+1;g.texStorage2D(g.TEXTURE_2D,levels,g.RGBA16F,TW,TH);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.MIRRORED_REPEAT);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.MIRRORED_REPEAT);this.blurSize=size;this.blurChecked=false;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.blurFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.blurTex,0);if(!this.blurChecked){g.drawBuffers([g.COLOR_ATTACHMENT0]);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)return false;this.blurChecked=true;}
  g.viewport(0,0,this.blurDims[0],this.blurDims[1]);g.useProgram(this.prep);const P=this.prepLoc;g.uniform2f(P.srcSize,rw,rh);g.uniform1i(P.plate,plateUnit);g.uniform1i(P.selectLight,ArtisticFilters.blurKinds[f.kind]?1:0);g.uniform1f(P.threshold,f.threshold);g.uniform1f(P.softness,f.softness);g.drawArrays(g.TRIANGLES,0,3);
  g.activeTexture(g.TEXTURE10);g.bindTexture(g.TEXTURE_2D,this.blurTex);g.generateMipmap(g.TEXTURE_2D);return true;}
 draw(filters,{rw,rh,plateUnit,blend=1}){const g=this.gl,L=this.loc,size=rw+','+rh,apScale=ArtisticFilters.apertureScale();let index=0;const list=ArtisticFilters.passes(filters);if(!list.length||!blend)return plateUnit;
  g.useProgram(this.program);g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,rw,rh);
  g.activeTexture(g.TEXTURE10);const savedUnit10=g.getParameter(g.TEXTURE_BINDING_2D);
  for(const f of list){if(!f.enabled||!f.amount)continue;const mip=(!f.mask_kind||f.kind==='prism')&&f.kind in ArtisticFilters.blurKinds&&this.prepareBlur(f,rw,rh,plateUnit);g.useProgram(this.program);g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,rw,rh);g.uniform1i(L.useMip,mip?1:0);if(mip)g.uniform2f(L.blurScale,rw/this.blurDims[0],rh/this.blurDims[1]);g.uniform1i(L.blurSrc,10);g.uniform1f(L.shortPx,Math.min(rw,rh));const unit=plateUnit===0?6:0,tex=this.textures[index++%2];g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);
   let fresh=false;if(this.sizes.get(tex)!==size){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.sizes.set(tex,size);fresh=true;}
   g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);if(fresh){g.drawBuffers([g.COLOR_ATTACHMENT0]);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer de filtros indisponível.');}
   const num=(k,v)=>g.uniform1f(L[k],v);g.uniform1i(L.plate,plateUnit);g.uniform2f(L.size,rw,rh);g.uniform2f(L.position,f.x,f.y);g.uniform2f(L.scales,f.scale*f.scale_x,f.scale*f.scale_y);g.uniform2f(L.pivot,f.pivot_x*.25,f.pivot_y*.25);g.uniform1i(L.mode,ArtisticFilters.kinds.indexOf(f.kind));g.uniform1i(L.count,f.count);g.uniform1i(L.maskMode,ArtisticFilters.kinds.indexOf(f.mask_kind||f.kind));g.uniform1i(L.tinted,f.tint?1:0);g.uniform1i(L.regional,f.region?1:0);g.uniform3f(L.tint,f.red,f.green,f.blue);
   num('amount',f.amount*blend);for(const k of ['threshold','softness','inner','feather','shift'])num(k,f[k]);num('angle',f.rotation*Math.PI/180);num('radius',f.radius*f.scale);num('prismShift',(f.prism_shift??.015)*f.scale);num('prismAngle',(f.prism_angle||0)*Math.PI/180);num('prismOffset',(f.shift??.04)*f.scale);num('edgeBlur',(f.edge_blur??.04)*f.scale*apScale);g.uniform1i(L.prismType,f.kind==='prism'&&!f.mask_kind?(f.prism_type|0):0);num('blurRadius',(f.blur_radius??.04)*f.scale);num('blurAngle',(f.blur_angle||0)*Math.PI/180);
   g.drawArrays(g.TRIANGLES,0,3);plateUnit=unit;}
  g.activeTexture(g.TEXTURE10);g.bindTexture(g.TEXTURE_2D,savedUnit10);
  this.dimensions=size;return plateUnit;}
}
// ---------- Demonstração online: filtros do app 1.2.17 em WebGL2, com o visor 3D do vidro ----------
const Filters3D=(()=>{
 const lang=(document.documentElement.lang||'pt').slice(0,2);
 const TXT={
  pt:{filter:'Filtro',type:'Tipo de prisma',amount:'Intensidade',radius:'Alcance',threshold:'Limiar das luzes',rotation:'Rotação',shift:'Deslocamento',count:'Facetas / cópias',edge:'Borda do vidro',photo:'Usar minha foto',reset:'Restaurar',compare:'Arraste para comparar',before:'Original',after:'Com filtro',glass:'Vidro na frente da lente',front:'Frontal',side:'Lateral',persp:'Perspectiva',hint:'Arraste para girar o vidro · Shift ou botão direito orbita a câmera',nogl:'Seu navegador não tem WebGL2 com float. A demonstração precisa de uma GPU com WebGL2.',local:'Sua foto fica só no seu navegador: nada é enviado.'},
  en:{filter:'Filter',type:'Prism type',amount:'Amount',radius:'Reach',threshold:'Light threshold',rotation:'Rotation',shift:'Offset',count:'Facets / copies',edge:'Glass edge',photo:'Use my photo',reset:'Reset',compare:'Drag to compare',before:'Original',after:'Filtered',glass:'Glass in front of the lens',front:'Front',side:'Side',persp:'Perspective',hint:'Drag to rotate the glass · Shift or right button orbits the camera',nogl:'Your browser lacks WebGL2 with float targets. The demo needs a WebGL2 GPU.',local:'Your photo stays in your browser: nothing is uploaded.'},
  zh:{filter:'滤镜',type:'棱镜类型',amount:'强度',radius:'范围',threshold:'高光阈值',rotation:'旋转',shift:'偏移',count:'棱面 / 复制数',edge:'玻璃边缘',photo:'使用我的照片',reset:'重置',compare:'拖动对比',before:'原图',after:'滤镜后',glass:'镜头前的玻璃',front:'正面',side:'侧面',persp:'透视',hint:'拖动旋转玻璃 · Shift 或右键环绕相机',nogl:'你的浏览器不支持带浮点的 WebGL2，演示需要支持 WebGL2 的 GPU。',local:'照片只在你的浏览器中处理，不会上传。'}}[lang]||null;
 const t=TXT||{};
 const NAMES={
  pt:['Black Mist','White Mist','Suavização de detalhe','Streak','Estrelas','Véu lateral','Janela central','Replicação linear','Halo FX','Kaleidoscope','Split Diopter','Fringing','Halation','Prisma','Blur direcional'],
  en:['Black Mist','White Mist','Detail softening','Streak','Star','Side veil','Center window','Linear replication','Halo FX','Kaleidoscope','Split diopter','Fringing','Halation','Prism','Directional blur'],
  zh:['黑柔','白柔','细节柔化','拉丝','星芒','侧面纱幕','中心窗口','线性复制','光晕 FX','万花筒','分焦镜','色边','光晕扩散','棱镜','方向模糊']}[lang]||[];
 const PRISMS={pt:['Cromático (dispersão)','Triangular','Cunha','Facetado','Replicação linear','Caleidoscópio','Split','Anel radial'],en:['Chromatic (dispersion)','Triangular','Wedge','Faceted','Linear replication','Kaleidoscope','Split','Radial ring'],zh:['色散','三角','楔形','多面','线性复制','万花筒','分割','径向环']}[lang]||[];
 const VERT=`#version 300 es
precision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
 // Resolve: original × filtrado lado a lado, ombro suave para as luzes recuperadas e sRGB.
 const OUT=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D plate,orig;uniform float split;
vec3 shoulder(vec3 c){return mix(c,.8+.2*tanh((c-.8)/.2),step(.8,c));}
vec3 enc(vec3 c){c=clamp(shoulder(max(c,0.)),0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
void main(){vec3 c=uv.x<split?texture(orig,uv).rgb:texture(plate,uv).rgb;c=enc(c);float l=1.-smoothstep(0.,1.5/1200.,abs(uv.x-split));o=vec4(mix(c,vec3(.62,.94,.78),l*.9),1.);}`;
 let root,gl,pass,outProg,src,canvas,w=0,h=0,split=.5,f=null,pending=false,img=null;
 function program(fs){const p=gl.createProgram();for(const [type,code]of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 // Foto sRGB 8-bit → luz linear; as luzes estouradas (luminância alta) recuperam energia (como "Recuperar luzes recortadas" do app).
 function upload(image){const max=1280,k=Math.min(1,max/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));w=Math.max(16,Math.round((image.naturalWidth||image.width)*k));h=Math.max(16,Math.round((image.naturalHeight||image.height)*k));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0,w,h);const px=x.getImageData(0,0,w,h).data,lin=new Float32Array(w*h*4),lut=new Float32Array(256);for(let i=0;i<256;i++){const v=i/255;lut[i]=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const s=(y*w+xx)*4,d=((h-1-y)*w+xx)*4,m=(px[s]*.2126+px[s+1]*.7152+px[s+2]*.0722)/255,tt=Math.min(1,Math.max(0,(m-.8)/.2)),boost=Math.pow(2,2.5*tt*tt*(3-2*tt));for(let ch=0;ch<3;ch++)lin[d+ch]=lut[px[s+ch]]*boost;lin[d+3]=1;}
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,src);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.FLOAT,lin);
  for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  canvas.width=w;canvas.height=h;canvas.style.aspectRatio=w+'/'+h;schedule();}
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(draw);}
 function draw(){pending=false;if(!gl||!w)return;const unit=pass.draw([f],{rw:w,rh:h,plateUnit:1,blend:1});gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.useProgram(outProg);gl.uniform1i(gl.getUniformLocation(outProg,'plate'),unit);gl.uniform1i(gl.getUniformLocation(outProg,'orig'),1);gl.uniform1f(gl.getUniformLocation(outProg,'split'),split);gl.drawArrays(gl.TRIANGLES,0,3);}
 const PRESET={black_mist:{amount:.9,radius:.09,threshold:.2,softness:.3},white_mist:{amount:.5,radius:.05},detail:{amount:.6,radius:.05},streak:{amount:1,radius:.22,threshold:.35,softness:.3},star:{amount:1,radius:.14,threshold:.35,softness:.3,count:4},veil:{amount:.7,radius:.04,shift:.1},window:{amount:.8,radius:.05},replicate:{amount:.6,shift:.1,count:3},halo:{amount:.7,shift:.08},kaleidoscope:{amount:1,count:6},split:{amount:.9,radius:.06,shift:.06},fringing:{amount:.9,shift:.004},halation:{amount:1,radius:.07,threshold:.25,softness:.3},prism:{amount:.8},directional:{amount:.7,blur_amount:1,blur_radius:.06}};
 function make(kind,type=0){const n=kind==='prism'?ArtisticFilters.create('prism',type):ArtisticFilters.create(kind);Object.assign(n,PRESET[kind]||{});if(kind==='directional'){n.blur_amount=1;n.blur_radius=n.blur_radius||.06;}return n;}
 const SLIDERS=[['amount',0,1,.01],['radius',.005,.3,.005],['threshold',0,3,.05],['rotation',-180,180,1],['shift',-.3,.3,.005],['count',2,8,1],['edge_blur',0,.3,.005]];
 const USES={amount:()=>true,radius:k=>!['kaleidoscope','replicate','fringing','prism'].includes(k),threshold:k=>['black_mist','streak','star','halation','fringing'].includes(k),rotation:()=>true,shift:k=>['veil','split','replicate','halo','fringing','prism'].includes(k),count:k=>['star','replicate','kaleidoscope','prism'].includes(k),edge_blur:k=>k==='prism'};
 function sync(){for(const [k]of SLIDERS){const row=root.querySelector(`[data-k="${k}"]`);row.hidden=!USES[k](f.kind);const input=row.querySelector('input');input.value=f[k];row.querySelector('output').textContent=k==='rotation'?Math.round(f[k])+'°':k==='count'?f[k]:Number(f[k]).toFixed(k==='shift'?3:2);}root.querySelector('.f3d-type').hidden=f.kind!=='prism';window.GlassViewer?.refresh(f);schedule();}
 function translateViewer(){const host=root.querySelector('.glass-viewer');if(!host||!TXT)return;const head=host.querySelector('.glass-viewer-head span');if(head)head.textContent=t.glass;for(const b of host.querySelectorAll('[data-view]'))b.textContent=t[b.dataset.view]||b.textContent;const s=host.querySelector('.glass-viewer-bar small');if(s)s.textContent=t.hint;}
 function mountViewer(){if(!window.GlassViewer)return;GlassViewer.attach(root.querySelector('.f3d-glass'),f,(ff,final)=>{sync();});translateViewer();}
 function init(el){root=el;if(!TXT)return;
  canvas=root.querySelector('.f3d-photo canvas');gl=canvas.getContext('webgl2',{antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false});
  if(!gl||!gl.getExtension('EXT_color_buffer_float')){root.querySelector('.f3d-photo').insertAdjacentHTML('beforeend',`<p class="f3d-nogl">${t.nogl}</p>`);gl=null;}
  else{gl.getExtension('OES_texture_float_linear');pass=new ArtisticFilterPass(gl,program);{const gen=gl.generateMipmap.bind(gl);gl.generateMipmap=t=>{const fb=gl.getParameter(gl.FRAMEBUFFER_BINDING);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gen(t);gl.bindFramebuffer(gl.FRAMEBUFFER,fb);};}outProg=program(OUT);src=gl.createTexture();}
  const kind=root.querySelector('.f3d-kind');ArtisticFilters.kinds.forEach((k,i)=>kind.add(new Option(NAMES[i]||k,k)));
  const type=root.querySelector('.f3d-type select');PRISMS.forEach((p,i)=>type.add(new Option(p,i)));
  const box=root.querySelector('.f3d-sliders');for(const [k,lo,hi,step]of SLIDERS){const row=document.createElement('label');row.dataset.k=k;row.innerHTML=`<span>${t[k==='edge_blur'?'edge':k]}</span><input type="range" min="${lo}" max="${hi}" step="${step}"><output></output>`;row.querySelector('input').oninput=e=>{f[k]=k==='count'?Math.round(+e.target.value):+e.target.value;sync();};box.append(row);}
  kind.onchange=()=>{f=make(kind.value,+type.value);mountViewer();sync();};type.onchange=()=>{f=make('prism',+type.value);mountViewer();sync();};
  root.querySelector('.f3d-reset').onclick=()=>{f=make(f.kind,f.prism_type|0);mountViewer();sync();};
  root.querySelector('.f3d-file').onchange=e=>{const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{if(gl)upload(im);URL.revokeObjectURL(url);};im.src=url;};
  // comparação: arrastar a linha divide original × filtrado
  const stage=root.querySelector('.f3d-photo');let drag=false;const move=e=>{const r=canvas.getBoundingClientRect();split=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));schedule();};
  stage.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;drag=true;canvas.setPointerCapture(e.pointerId);move(e);});stage.addEventListener('pointermove',e=>{if(drag)move(e);});stage.addEventListener('pointerup',()=>{drag=false;});
  kind.value='prism';type.value='3';f=make('prism',3);
  const io=new IntersectionObserver(es=>{if(!es.some(x=>x.isIntersecting))return;io.disconnect();mountViewer();sync();if(gl){img=new Image();img.onload=()=>upload(img);img.src=root.dataset.photo;}},{rootMargin:'300px'});io.observe(root);
 }
 return {init,setSplit(v){split=v;schedule();}};
})();
window.Filters3D=Filters3D;
document.addEventListener('DOMContentLoaded',()=>{const el=document.getElementById('f3d');if(el)Filters3D.init(el);});

}
