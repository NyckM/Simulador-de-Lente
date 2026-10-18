// WebGL2 sparse convolution of the ray atlas. No per-frame HTTP or Python render.
'use strict';
// 1.2.11 · Textura procedural de sujeira do elemento frontal (gerada no navegador, determinística por seed).
// Canais: R digitais/óleo · G poeira/fiapos · B riscos/marcas de limpeza · A fungos. Nítida: o desfoque é da abertura.
const LensDirtTexture=(()=>{
 const S=1024;
 function rng(seed){let a=(seed*2654435761)>>>0||1;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const uni=(r,a,b)=>a+(b-a)*r(),normal=r=>{let u=0,v=0;while(!u)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307*v);};
 function noise(r,cells){const n=cells+2,g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=r();const out=new Float32Array(S*S),k=cells/S;
  for(let y=0;y<S;y++){const fy=(y+.5)*k,iy=Math.floor(fy);let ty=fy-iy;ty=ty*ty*(3-2*ty);for(let x=0;x<S;x++){const fx=(x+.5)*k,ix=Math.floor(fx);let tx=fx-ix;tx=tx*tx*(3-2*tx);const i=iy*n+ix;
   out[y*S+x]=(g[i]*(1-tx)+g[i+1]*tx)*(1-ty)+(g[i+n]*(1-tx)+g[i+n+1]*tx)*ty;}}return out;}
 function fbm(r,base,oct){const out=new Float32Array(S*S);let amp=1,tot=0;for(let o=0;o<oct;o++){const n=noise(r,base*2**o);for(let i=0;i<out.length;i++)out[i]+=amp*n[i];tot+=amp;amp*=.5;}for(let i=0;i<out.length;i++)out[i]/=tot;return out;}
 function boxBlur(a,W,H,rx,ry){// três passadas de caixa ≈ gaussiana, eixos x/y, numa região W×H
  const tmp=new Float32Array(a.length);for(let pass=0;pass<3;pass++){
   const r=Math.max(0,Math.round(rx));if(r){for(let y=0;y<H;y++){let acc=0;const row=y*W;for(let x=-r;x<=r;x++)acc+=a[row+Math.min(W-1,Math.max(0,x))];for(let x=0;x<W;x++){tmp[row+x]=acc/(2*r+1);acc+=a[row+Math.min(W-1,x+r+1)]-a[row+Math.max(0,x-r)];}}a.set(tmp);}
   const q=Math.max(0,Math.round(ry));if(q){for(let x=0;x<W;x++){let acc=0;for(let y=-q;y<=q;y++)acc+=a[Math.min(H-1,Math.max(0,y))*W+x];for(let y=0;y<H;y++){tmp[y*W+x]=acc/(2*q+1);acc+=a[Math.min(H-1,y+q+1)*W+x]-a[Math.max(0,y-q)*W+x];}}a.set(tmp);}}
  return a;}
 function fingerprints(r){const out=new Float32Array(S*S),wx=fbm(r,5,3),wy=fbm(r,5,3),flow=fbm(r,7,3),press=noise(r,9),breaks=noise(r,60),n=3+Math.floor(r()*3);
  for(let k=0;k<n;k++){const cx=uni(r,.08,.92),cy=uni(r,.08,.92),a=uni(r,.07,.14),b=a*uni(r,.62,.8),th=uni(r,0,Math.PI),c=Math.cos(th),s=Math.sin(th),freq=uni(r,26,34),whorl=r()<.5?0:.9,ca=uni(r,0,6.283),cb=uni(r,.2,.9);
   const bx=uni(r,1,5)*.9,by=uni(r,4,14)*.9,pad=Math.ceil(Math.max(bx,by)*3),x0=Math.max(0,Math.floor((cx-a*1.4)*S)-pad),x1=Math.min(S,Math.ceil((cx+a*1.4)*S)+pad),y0=Math.max(0,Math.floor((cy-a*1.4)*S)-pad),y1=Math.min(S,Math.ceil((cy+a*1.4)*S)+pad),W=x1-x0,H=y1-y0;if(W<=0||H<=0)continue;
   const pr=new Float32Array(W*H);
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*S+x,dx=(x+.5)/S-cx+(wx[i]-.5)*.03,dy=(y+.5)/S-cy+(wy[i]-.5)*.03,u=(c*dx+s*dy)/a,v=(-s*dx+c*dy)/b,rr=Math.hypot(u,v);if(rr>1.25)continue;
    const phase=rr*freq+whorl*Math.atan2(v,u+.35)+(wx[i]-.5)*6+(flow[i]-.5)*5.5+(u*.8)**2*3;let ridge=Math.pow(.5+.5*Math.cos(6.283185307*phase),2.2)*Math.min(1,Math.max(0,(breaks[i]-.18)*3));
    const pressure=Math.pow(Math.max(0,1.2-rr),.8)*(.55+.45*press[i]),cut=1/(1+Math.exp(-(u*Math.cos(ca)+v*Math.sin(ca)+cb)*6));pr[(y-y0)*W+x-x0]=pressure*cut*(.35+.65*ridge);}
   const sm=boxBlur(pr.slice(),W,H,bx,by);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const j=(y-y0)*W+x-x0,i=y*S+x;out[i]=Math.max(out[i],.7*pr[j]+.45*sm[j]);}}
  const haze=fbm(r,3,4);for(let i=0;i<out.length;i++)out[i]=Math.min(1,out[i]+Math.pow(Math.min(1,Math.max(0,(haze[i]-.55)*2.4)),1.5)*.35);return out;}
 function canvasLayer(draw){const big=document.createElement('canvas');big.width=big.height=S*2;const g=big.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,S*2,S*2);g.strokeStyle=g.fillStyle='#fff';g.lineCap='round';draw(g);
  const small=document.createElement('canvas');small.width=small.height=S;const h=small.getContext('2d');h.imageSmoothingEnabled=true;h.imageSmoothingQuality='high';h.drawImage(big,0,0,S,S);const px=h.getImageData(0,0,S,S).data,out=new Float32Array(S*S);for(let i=0;i<out.length;i++)out[i]=px[i*4]/255;return out;}
 const grey=v=>`rgb(${v|0},${v|0},${v|0})`;
 function dust(r){return canvasLayer(g=>{const up=2;for(const [count,rmin,rmax,lo,hi]of [[900,.5,1.6,110,255],[140,1.6,4.5,90,230],[18,4.5,11,60,170]])for(let i=0;i<count;i++){const x=r()*S*up,y=r()*S*up,rad=uni(r,rmin,rmax)*up;g.fillStyle=grey(uni(r,lo,hi));g.beginPath();g.ellipse(x,y,rad*uni(r,.7,1.3),rad*uni(r,.7,1.3),r()*3.14,0,6.283);g.fill();}
  for(let i=0;i<14;i++){let x=r()*S*up,y=r()*S*up,a=r()*6.283;g.strokeStyle=grey(uni(r,90,200));g.lineWidth=Math.max(1,up*uni(r,.6,1.4));g.beginPath();g.moveTo(x,y);const n=20+Math.floor(r()*40);for(let k=0;k<n;k++){a+=normal(r)*.25;x+=Math.cos(a)*3*up;y+=Math.sin(a)*3*up;g.lineTo(x,y);}g.stroke();}});}
 function scratches(r){const vary=noise(r,12);const a=canvasLayer(g=>{const up=2,n=5+Math.floor(r()*7);for(let i=0;i<n;i++){const x=r()*S*up,y=r()*S*up,L=uni(r,.1,.5)*S*up;let a=r()*6.283;g.strokeStyle=grey(uni(r,120,255));g.lineWidth=Math.max(1,up*uni(r,.5,1.3));g.beginPath();g.moveTo(x,y);for(let t=1;t<40;t++){a+=normal(r)*.01;g.lineTo(x+Math.cos(a)*L*t/39,y+Math.sin(a)*L*t/39);}g.stroke();}
  const cx=S*up/2+normal(r)*S*up*.05,cy=S*up/2+normal(r)*S*up*.05,m=20+Math.floor(r()*25);g.lineWidth=1;for(let i=0;i<m;i++){const rad=uni(r,.08,.7)*S*up,a0=r()*6.283,span=uni(r,.15,1.1);g.strokeStyle=grey(uni(r,40,140));g.beginPath();g.arc(cx,cy,rad,a0,a0+span);g.stroke();}});
  for(let i=0;i<a.length;i++)a[i]*=.45+.55*vary[i];return a;}
 function fungus(r){const cores=[];const a=canvasLayer(g=>{const up=2,colonies=2+Math.floor(r()*2);for(let c=0;c<colonies;c++){const ang=r()*6.283,rad=uni(r,.25,.46),cx=(.5+Math.cos(ang)*rad)*S*up,cy=(.5+Math.sin(ang)*rad)*S*up;cores.push([cx/up,cy/up,uni(r,6,14)]);
   const stack=[];const roots=5+Math.floor(r()*4);for(let k=0;k<roots;k++)stack.push([cx,cy,r()*6.283,uni(r,60,120)*up,2.2*up]);let steps=0;
   while(stack.length&&steps<4000){let [x,y,a,L,w]=stack.pop();const n=Math.max(2,Math.floor(L/(3*up)));g.strokeStyle=grey(uni(r,150,255));g.lineWidth=Math.max(1,w);g.beginPath();g.moveTo(x,y);
    for(let k=0;k<n;k++){a+=normal(r)*.22;x+=Math.cos(a)*3*up;y+=Math.sin(a)*3*up;g.lineTo(x,y);steps++;if(r()<.07&&L>12*up)stack.push([x,y,a+(r()<.5?-1:1)*uni(r,.4,1.1),L*uni(r,.4,.7),Math.max(1,w*.75)]);}g.stroke();}}});
  for(const [cx,cy,sg]of cores){const R=Math.ceil(sg*4);for(let y=Math.max(0,Math.floor(cy-R));y<Math.min(S,cy+R);y++)for(let x=Math.max(0,Math.floor(cx-R));x<Math.min(S,cx+R);x++){const i=y*S+x;a[i]=Math.max(a[i],.75*Math.exp(-((x-cx)**2+(y-cy)**2)/(2*sg*sg)));}}return a;}
 const cache=new Map();
 function generate(seed){seed=Math.max(1,Math.min(1000,Math.round(seed||1)));if(cache.has(seed))return cache.get(seed);const base=rng(seed*7919+17),sub=()=>rng(Math.floor(base()*2**31)+1);
  const R=fingerprints(sub()),G=dust(sub()),B=scratches(sub()),A=fungus(sub()),out=new Uint8Array(S*S*4);
  for(let i=0;i<S*S;i++){out[i*4]=Math.round(Math.min(1,Math.max(0,R[i]))*255);out[i*4+1]=Math.round(Math.min(1,G[i])*255);out[i*4+2]=Math.round(Math.min(1,B[i])*255);out[i*4+3]=Math.round(Math.min(1,A[i])*255);}
  if(cache.size>3)cache.delete(cache.keys().next().value);cache.set(seed,out);return out;}
 return {size:S,generate};
})();
window.LensDirtTexture=LensDirtTexture;

const VERT=`#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const FRAG=`#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 uv;out vec4 outColor;
uniform sampler2D sourceImage, depthImage, originalImage;
uniform sampler2DArray rayAtlas, pupilAtlas;
uniform vec2 imageSize;
uniform vec4 matrix;
uniform float lastZ,referenceZ,sourceM,sensorZ,sensorMM,sourceFocus,focusShift;
uniform float impression,bokehDistortion,bokehDistortionColor;
uniform float bokehGain,highlightGain,exposure,swirl,astigmatismMM,coma,squeeze,diffusion,spherical3,spherical5;
uniform float focusAnchor,focusPreservation,focusWidth,focusDistance,foregroundBlur,backgroundBlur;
uniform float nearM,farM,k1,k2,p1,p2,footprint,masterBlend,apodization,rimGain,irisMM,atlasIrisMM,irisMaxMM;
uniform float caRed,caBlue,caAxial,gridSize;
uniform float textureRings,textureGrain,textureScale,textureRotation;
uniform vec4 ghostPairs[3];
uniform float ghostGain,diffractionGain,diffractionScale,irisRotation,airyRadius;
uniform int irisBlades;
float sampleLod;
uniform int sampleCount,tapCount,depthChannel,highlightCount,partMode;
uniform sampler2D highlightImage,fullLightImage;
uniform float ditherAmount,highlightThreshold,globalRayRadius,globalRaySlope;
uniform bool bokehDither,coverageProbe;
uniform float depthGain,depthBias,sliceDepth;
uniform bool scalarDepth,sliceMode,sliceBackground,compositeMode,eclipseBokeh,eclipseCutMode;
uniform int sliceChannel,eclipseSlices;
uniform float eclipseCut,eclipseFeather;
uniform float shimmerAmount,shimmerDepth,shimmerSize,shimmerDensity,shimmerSeed,shimmerThreshold;
uniform float shimmerPrism;uniform bool shimmerNormalize;
uniform sampler2D compositeImage;
uniform bool linearInput,hasDepth,invertDepth,softenInternalCutoff,externalLayer,externalGlitter;
uniform sampler2D occluder0,occluder1,occluder2,glitterImage,glitterPlane,glitterMatte;
uniform int occluderCount;uniform bool hasGlitterMatte,glitterLinear;
uniform vec3 occluderOpacity;uniform float glitterMean;
vec4 occult(int i,vec2 q,float lod){if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec4(1.,0.,0.,0.);return i==0?textureLod(occluder0,q,lod):i==1?textureLod(occluder1,q,lod):textureLod(occluder2,q,lod);}

vec3 decode(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 encode(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec4 inputSample(vec2 q,float lod){
 // Account for the source area covered by a raster pixel, including the local
 // distortion and spatially varying ray offset. Bokeh footprint alone aliases
 // when reducing footage or strongly deforming the corners.
 vec2 dx=dFdx(q)*imageSize,dy=dFdy(q)*imageSize;
 float rasterLod=.5*log2(max(1.,max(dot(dx,dx),dot(dy,dy))));
 if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec4(0.);
 return textureLod(sourceImage,q,max(lod,rasterLod));
}
vec3 inputLight(vec2 q,float lod){return inputSample(q,lod).rgb;}
vec4 glitterSample(vec2 q,float lod){if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec4(0.);vec2 dx=dFdx(q)*imageSize,dy=dFdy(q)*imageSize;float rasterLod=.5*log2(max(1.,max(dot(dx,dx),dot(dy,dy))));return textureLod(fullLightImage,q,max(lod,rasterLod));}
vec3 fullLight(vec2 q,float lod){if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec3(0.);vec2 dx=dFdx(q)*imageSize,dy=dFdy(q)*imageSize;float rasterLod=.5*log2(max(1.,max(dot(dx,dx),dot(dy,dy))));return textureLod(fullLightImage,q,max(lod,rasterLod)).rgb;}
uint hashBits(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;return x^(x>>16);}
float bokehTexture(vec2 p){
 float c=cos(textureRotation),s=sin(textureRotation);
 vec2 q=vec2(c*p.x-s*p.y,s*p.x+c*p.y)*textureScale;
 float radial=.5+.5*cos(6.28318530718*length(q));
 float noise=.5+.25*sin(2.17*q.x+.7)*sin(1.73*q.y+1.3)+.25*sin(4.31*q.x+1.9)*sin(3.11*q.y-.4);
 return (1.-textureRings*.8*(1.-radial))*(1.-textureGrain*.7*(1.-noise));
}
// Conditional ray moments: empty cells contribute no position or direction.
void fieldSample(vec2 q,int channel,int tap,out vec4 ray,out vec4 pupil){
 vec2 at=clamp(vec2(q.x,1.-q.y),0.,1.)*(gridSize-1.);
 ivec2 lo=ivec2(floor(at));vec2 f=fract(at);int n=int(gridSize);
 ray=vec4(0.);pupil=vec4(0.);
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){
   ivec2 pixel=min(lo+ivec2(i,j),ivec2(n-1));pixel.x+=channel*n;
   float b=(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);
   vec4 p=texelFetch(pupilAtlas,ivec3(pixel,tap),0);
   ray+=texelFetch(rayAtlas,ivec3(pixel,tap),0)*(b*p.z);
   pupil.xy+=p.xy*(b*p.z);pupil.z+=b*p.z;pupil.w+=b*p.w;
 }
 if(pupil.z>0.){ray/=pupil.z;pupil.xy/=pupil.z;}
}
vec2 pupilDither(int index){uvec2 p=uvec2(floor(uv*imageSize));uint seed=hashBits(p.x^hashBits(p.y)^hashBits(uint(index)+17u));float a=float(seed)/4294967296.*6.2831853;float r=sqrt(float(hashBits(seed))/4294967296.);return vec2(cos(a),sin(a))*r;}
vec3 originalPart(vec3 c){float peak=max(c.r,max(c.g,c.b));vec3 high=c*max(0.,peak-highlightThreshold)/max(peak,.00001);return partMode==1?c-high:partMode==2?high:c;}

float plane(float z){float inv=1./(z*1000.);return lastZ-(matrix.x+matrix.y*inv)/(matrix.z+matrix.w*inv);}
float depthValue(vec2 q){vec4 d=texture(depthImage,q);float t=scalarDepth?d.r:depthChannel==0?d.r:depthChannel==1?d.g:depthChannel==2?d.b:depthChannel==3?d.a:dot(d.rgb,vec3(.2126,.7152,.0722));t=clamp(t*depthGain+depthBias,0.,1.);return invertDepth?1.-t:t;}
float shimmerHash(ivec2 cell,uint salt){return float(hashBits(uint(cell.x)^hashBits(uint(cell.y))^hashBits(uint(shimmerSeed)*31u+salt)))/4294967296.;}
vec3 shimmerField(vec2 q,float layerBlur){
 vec2 p=q*vec2(1080.,1080.*imageSize.y/imageSize.x)/shimmerSize;
 // Sparse points in a fixed plane. Gaussian footprints integrate subpixel
 // glints instead of interpolating RGB noise into faceted patches.
 float raster=1080./(imageSize.x*shimmerSize),blur=min(layerBlur,.8)*.3,variance=.0324+raster*raster*.08+blur*blur;
 ivec2 cell=ivec2(floor(p));vec3 sparkle=vec3(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   ivec2 key=cell+ivec2(x,y);if(shimmerHash(key,1u)>shimmerDensity)continue;
   vec2 center=vec2(key)+.2+.6*vec2(shimmerHash(key,2u),shimmerHash(key,3u));vec2 delta=p-center;
   float angle=shimmerHash(key,4u)*6.2831853;vec2 shift=vec2(cos(angle),sin(angle))*.10;
   float white=exp(-dot(delta,delta)/(2.*variance));
   vec3 spectral=vec3(exp(-dot(delta-shift,delta-shift)/(2.*variance)),white,exp(-dot(delta+shift,delta+shift)/(2.*variance)));
   sparkle+=mix(vec3(white),spectral,shimmerPrism)*(.5+.5*shimmerHash(key,5u))*.0324/variance;
 }
 // The glitter plane has its own focus response. Far from that plane the
 // unresolved points integrate to their mean instead of remaining sharp noise.
 return mix(sparkle,vec3(shimmerDensity*.75*6.2831853*.0324),smoothstep(.4,1.2,layerBlur));
}
vec2 warp(vec2 q){vec2 p=(q-.5)*vec2(2.,2.*imageSize.y/imageSize.x);float r=dot(p,p);vec2 delta=vec2(2.*p1*p.x*p.y+p2*(r+2.*p.x*p.x),p1*(r+2.*p.y*p.y)+2.*p2*p.x*p.y);p=p*(1.+k1*r+k2*r*r)+delta;return p/vec2(2.,2.*imageSize.y/imageSize.x)+.5;}

float focusPartition(float x,bool inverse){
 if(focusAnchor<=0.)return x;
 float a=clamp(floor(focusAnchor*float(eclipseSlices-1)+.5),1.,float(eclipseSlices-2))/float(eclipseSlices-1);
 return inverse?(x<=a?x*focusAnchor/a:focusAnchor+(x-a)*(1.-focusAnchor)/(1.-a)):(x<=focusAnchor?x*a/focusAnchor:a+(x-focusAnchor)*(1.-a)/(1.-focusAnchor));
}
void main(){
 vec2 q=warp(uv);vec2 field=vec2(q.x-.5,(.5-q.y)*imageSize.y/imageSize.x)*2.;
 float fr=length(field);vec2 radial=field/max(fr,.0001),tangent=vec2(-radial.y,radial.x);
 vec2 gridUV=(clamp(vec2(q.x,1.-q.y),0.,1.)*(gridSize-1.)+.5)/gridSize;
 float centerDepth=sliceMode?focusPartition(sliceDepth,true):hasDepth?depthValue(q):0.;
 float objectM=hasDepth?1./mix(1./farM,1./nearM,centerDepth):sourceM;
 float focusT=clamp(abs(1./objectM-1./focusDistance)/max(focusWidth,.000001),0.,1.);
 float focusRamp=focusT*focusT*(3.-2.*focusT);
 float sideGain=(objectM<focusDistance?foregroundBlur:backgroundBlur)/100.;
 float focusKeep=(1.-focusPreservation*(1.-focusRamp))*(1.+(sideGain-1.)*focusRamp);
 // A provisional paraxial scale responds while the new traced aperture atlas loads.
 float apertureScale=irisMM/max(.0001,atlasIrisMM),pupilScale=irisMM/irisMaxMM;
 float sphericalExtent=.35*(abs(spherical3)*pow(pupilScale,3.)+abs(spherical5)*pow(pupilScale,5.));
 float astigSplit=astigmatismMM*fr*fr;
 float radius=(abs(sensorZ-focusShift-plane(objectM))+abs(astigSplit))*irisMM/max(1.,plane(objectM)-lastZ)+sphericalExtent;
 int activeCount=partMode==2?highlightCount:sampleCount;
 float samplingFootprint=footprint*sqrt(float(sampleCount)/float(max(1,activeCount)));
 sampleLod=max(0.,log2(max(1.,radius*samplingFootprint)));
 float dz=sensorZ-referenceZ+sourceFocus-plane(objectM);
 float boundDz=hasDepth?max(abs(sensorZ-referenceZ+sourceFocus-plane(nearM)),abs(sensorZ-referenceZ+sourceFocus-plane(farM))):abs(dz);
 float bound=(globalRayRadius+(boundDz+abs(astigSplit))*globalRaySlope)*apertureScale+sphericalExtent;
 bound*=exp(1.4*abs(impression));
 bound*=1.+1.5*bokehDistortion*(.65+.35*min(fr,1.5))*(1.+.2*bokehDistortionColor);
 bound*=1.+abs(swirl)*fr;bound+=abs(coma)*bound*bound*.3;
 float boundPixels=bound*abs(bokehGain)*imageSize.x/sensorMM+length(q-.5)*max(abs(caRed),abs(caBlue))*.01*imageSize.x+abs(caAxial)*globalRaySlope*apertureScale*abs(bokehGain)*imageSize.x/sensorMM;
 // A deliberately broad Gaussian mask bounds both ray offsets and reconstruction support.
 float maskLod=log2(max(1.,2.*boundPixels+4.));
 bool highlightActive=textureLod(highlightImage,q,maskLod).a>1e-8;
 if(coverageProbe){outColor=vec4(vec3(highlightActive?1.:0.),1.);return;}
 vec3 sum=vec3(0.),norm=vec3(0.),coverage=vec3(0.),transmitted=vec3(0.);
 for(int i=0;i<1024;i++){
   if(compositeMode||i>=activeCount||(partMode==2&&!highlightActive))break;
   int idx=int((float(i)+.5)*float(tapCount)/float(activeCount));
   vec3 glitter=vec3(0.);
   if(shimmerAmount>0.){
     // Every colour uses the SAME pupil and glitter plane. Dispersion is a
     // small shift inside individual glints, never separate RGB noise fields.
     vec4 greenRay=texture(rayAtlas,vec3(vec2((gridUV.x+1.)/3.,gridUV.y),float(idx)));
     vec2 layerOffset=(greenRay.xy+(sensorZ-referenceZ+sourceFocus-plane(shimmerDepth))*greenRay.zw)*apertureScale;
     layerOffset.x/=squeeze;layerOffset*=bokehGain;
     vec2 layerUV=q-vec2(layerOffset.x,-layerOffset.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);
     float layerRadius=abs(sensorZ-focusShift-plane(shimmerDepth))*irisMM/max(1.,plane(shimmerDepth)-lastZ);
     float layerBlur=layerRadius*abs(bokehGain)*1080./(sensorMM*shimmerSize);
     if(externalGlitter){
       float gm=texture(glitterPlane,q).r;
       for(int j=0;j<2;j++){vec2 go=(greenRay.xy+(sensorZ-referenceZ+sourceFocus-plane(max(gm,.001)))*greenRay.zw)*apertureScale;go.x/=squeeze;go*=bokehGain;layerUV=q-vec2(go.x,-go.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);gm=texture(glitterPlane,clamp(layerUV,0.,1.)).r;}
       float gr=abs(sensorZ-focusShift-plane(max(gm,.001)))*irisMM/max(1.,plane(max(gm,.001))-lastZ);
       float lod=log2(max(1.,gr*samplingFootprint));vec4 g=vec4(0.);
       if(all(greaterThanEqual(layerUV,vec2(0.)))&&all(lessThanEqual(layerUV,vec2(1.))))g=textureLod(glitterImage,layerUV,lod);
       glitter=(glitterLinear?g.rgb:decode(g.rgb))*g.a;
     }else glitter=shimmerField(layerUV,layerBlur);
   }
   for(int c=0;c<3;c++){
     if(sliceMode&&!sliceBackground&&sliceChannel>=0&&c!=sliceChannel)continue;
     float layer=float(idx);vec2 channelUV=vec2((gridUV.x+float(c))/3.,gridUV.y);
     vec4 ray,pupil;fieldSample(q,c,idx,ray,pupil);
     float chroma=c==0?1.:c==2?-1.:0.;
     vec2 offset=(ray.xy+(dz+chroma*caAxial)*ray.zw)*apertureScale;
     offset+=astigSplit*(dot(ray.zw,radial)*radial-dot(ray.zw,tangent)*tangent)*apertureScale;
     float rho2=dot(pupil.xy,pupil.xy);
     // Signed creative pupil-to-sensor mapping. It acts on defocus only:
     // negative behind focus folds rays into a ring; crossing focus reverses it.
     float focusDelta=sensorZ-focusShift-plane(objectM);
     float character=2.8*impression*focusDelta/sqrt(focusDelta*focusDelta+.0001);
     float characterScale=exp(character*(rho2-.5));
     offset*=characterScale;
     // Creative smooth pupil mapping: gradient of trefoil/quatrefoil terms.
     // A non-injective mapping folds a defocused footprint into caustic-like
     // lobes. Energy is still summed per pupil in linear HDR, never stamped.
     // Defocus amplitude is zero on the focus plane, including colour shift.
     float distortionJacobian=1.;
     if(bokehDistortion>0.){
       float angle=.35+.9*field.x+.7*field.y,co=cos(angle),si=sin(angle);
       vec2 p=vec2(co*pupil.x+si*pupil.y,-si*pupil.x+co*pupil.y);
       vec2 fold=.9*vec2(p.x*p.x-p.y*p.y,-2.*p.x*p.y)+.3*vec2(p.x*(p.x*p.x-3.*p.y*p.y),p.y*(p.y*p.y-3.*p.x*p.x))+.15*p*rho2;
       float strength=bokehDistortion*(.65+.35*min(fr,1.5))*(1.+chroma*.2*bokehDistortionColor);
       float signedRadius=focusDelta*irisMM/max(1.,plane(objectM)-lastZ);
       offset+=signedRadius*strength*vec2(co*fold.x-si*fold.y,si*fold.x+co*fold.y);
       float jx=1.8*p.x+.9*(p.x*p.x-p.y*p.y)+.15*(rho2+2.*p.x*p.x);
       float jy=-1.8*p.x+.9*(p.y*p.y-p.x*p.x)+.15*(rho2+2.*p.y*p.y);
       float jxy=-1.8*p.y-1.5*p.x*p.y;
       distortionJacobian=1.+strength*sqrt(jx*jx+jy*jy+2.*jxy*jxy);
     }
     // Transverse spherical terms follow third/fifth powers of pupil radius.
     float sphericalThird=spherical3*pow(pupilScale,3.),sphericalFifth=spherical5*pow(pupilScale,5.);
     offset+=.35*pupil.xy*(sphericalThird*rho2+sphericalFifth*rho2*rho2);
     // Bound the pupil-to-image Jacobian so moving highlights cannot fall
     // between widely separated samples after spherical, swirl or coma edits.
     float cellRadius=max(radius,.35*(3.*abs(sphericalThird)*rho2+5.*abs(sphericalFifth)*rho2*rho2));
     cellRadius=max(cellRadius,length(offset));
     cellRadius*=max(1.,characterScale*abs(1.+2.*character*rho2));
     cellRadius=max(cellRadius,radius*distortionJacobian);
     float stretch=1.+swirl*fr;
     cellRadius*=stretch*(1.+.6*coma*length(offset)*stretch);
     // The sparse pupil atlas leaves discrete rings under strong spherical
     // aberration. Integrate each cell over its projected footprint in the
     // source mip pyramid; keep the kernel fixed for temporal stability.
     // Smooth reconstruction integrates the footprint of sparse pupil cells.
     // Aperture boundary coverage itself is traced into the atlas weights.
     // No frame-dependent noise or post-blur of the composed image is added.
     float cellFilter=(softenInternalCutoff?1.6:1.)+.8*(abs(sphericalThird)+abs(sphericalFifth));
     float rayLod=(focusPreservation>0.||foregroundBlur!=100.||backgroundBlur!=100.)?max(0.,log2(max(1.,max(radius,cellRadius*cellFilter)*samplingFootprint*focusKeep))):max(sampleLod,log2(max(1.,cellRadius*samplingFootprint*cellFilter)));
     if(fr>.0001){offset=dot(offset,radial)*radial/(1.+swirl*fr)+dot(offset,tangent)*tangent*(1.+swirl*fr);offset+=coma*radial*dot(offset,offset)*.3;}
     offset.x/=squeeze;offset*=bokehGain;
     if(bokehDither){float blurPx=radius*abs(bokehGain)*imageSize.x/sensorMM;float fade=smoothstep(.5,2.,blurPx);offset+=pupilDither(idx)*cellRadius*abs(bokehGain)*2.2/sqrt(float(activeCount))*ditherAmount*fade;}
     offset*=focusKeep;
     vec2 sampleUV=q-vec2(offset.x,-offset.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);
     sampleUV+=(q-.5)*(c==0?caRed:c==2?caBlue:0.)*.01*focusKeep;
     float weight=pupil.z*exp(-apodization*rho2*4.)*(1.+rimGain*smoothstep(.25,.85,rho2));
     if(textureRings>0.||textureGrain>0.)weight*=bokehTexture(pupil.xy);
     if(hasDepth&&!sliceMode){float other=depthValue(clamp(sampleUV,0.,1.));weight*=1.-smoothstep(.035,.18,abs(other-centerDepth));}
     vec4 incidentSample=inputSample(sampleUV,rayLod);
     float visibility=1.;
     if(eclipseBokeh&&sliceMode&&eclipseCutMode&&sliceBackground){
       // The SAME pupil cell crosses the nearer plane at a different position.
       vec2 stepMM=(plane(objectM)-plane(nearM))*ray.zw*apertureScale*bokehGain;
       stepMM.x/=squeeze;
       vec2 occluderUV=sampleUV-vec2(stepMM.x,-stepMM.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);
       if(all(greaterThanEqual(occluderUV,vec2(0.)))&&all(lessThanEqual(occluderUV,vec2(1.)))){
         float front=depthValue(occluderUV);float softness=max(eclipseFeather,max(fwidth(front),.0001));
         visibility=1.-smoothstep(eclipseCut-softness,eclipseCut+softness,front);
       }
     }
     if(eclipseBokeh&&sliceMode&&!eclipseCutMode&&incidentSample.a>1e-5){
       float width=1./float(eclipseSlices-1);
       // A filtered slice can extend past its visible silhouette. Cap the
       // source depth to this slice instead of assigning it the occluder's Z.
       float sourceDepth=min(focusPartition(depthValue(clamp(sampleUV,0.,1.)),false),sliceDepth+width*.999);
       for(int j=1;j<32;j++){
         if(j>=eclipseSlices||visibility<=0.)break;
         float frontPlane=float(j)*width;if(frontPlane<=sliceDepth)continue;
         float frontM=1./mix(1./farM,1./nearM,focusPartition(frontPlane,true));
         vec2 travel=(plane(objectM)-plane(frontM))*ray.zw*apertureScale*bokehGain;
         travel.x/=squeeze;
         vec2 atFront=sampleUV-vec2(travel.x,-travel.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);
         if(any(lessThan(atFront,vec2(0.)))||any(greaterThan(atFront,vec2(1.))))continue;
         float front=focusPartition(depthValue(atFront),false);
         // Each surface is tested once, at its nearest depth slice. Comparing
         // against source Z avoids eclipsing a surface with its own interpolation.
         if(abs(front-frontPlane)<=width*.5){
           float softness=max(eclipseFeather,.0001);
           visibility*=1.-smoothstep(sourceDepth+softness,sourceDepth+2.*softness,front);
         }
       }
     }
     for(int j=0;j<3;j++){
       if(j>=occluderCount)break;
       vec4 occ=occult(j,q,0.);vec2 atFront=sampleUV;float frontM=max(occ.r,.001);
       for(int k=0;k<2;k++){vec2 travel=(plane(objectM)-plane(frontM))*ray.zw*apertureScale*bokehGain;travel.x/=squeeze;atFront=sampleUV-vec2(travel.x,-travel.y)/vec2(sensorMM,sensorMM*imageSize.y/imageSize.x);occ=occult(j,atFront,0.);frontM=max(occ.r,.001);}
       float frontRadius=abs(sensorZ-focusShift-plane(frontM))*irisMM/max(1.,plane(frontM)-lastZ);
       float frontCell=max(frontRadius,length((q-atFront)*vec2(sensorMM,sensorMM*imageSize.y/imageSize.x))/max(abs(bokehGain),.00001));
       float frontLod=log2(max(1.,frontCell*samplingFootprint*(softenInternalCutoff?1.6:1.)));
       visibility*=1.-clamp(occult(j,atFront,frontLod).a*occluderOpacity[j],0.,1.);
     }
     // Only the farthest opaque depth layer receives estimated hidden color.
     // Foreground mattes and externally supplied transparent layers stay intact.
     if(sliceMode&&sliceBackground&&!eclipseBokeh&&!externalLayer&&incidentSample.a<.99999&&all(greaterThanEqual(sampleUV,vec2(0.)))&&all(lessThanEqual(sampleUV,vec2(1.)))){
       vec4 donor=incidentSample;
       float top=floor(log2(max(imageSize.x,imageSize.y)));
       for(int j=1;j<16;j++){
         if(donor.a>=.2)break;
         float level=min(top,floor(rayLod)+float(j));
         donor=textureLod(sourceImage,sampleUV,level);
         if(level>=top)break;
       }
       if(donor.a>.00001){
         vec3 fill=donor.rgb/max(donor.a,.00001);
         fill=mix(fill,incidentSample.rgb/max(incidentSample.a,.00001),smoothstep(.005,.2,incidentSample.a));
         incidentSample=vec4(fill,1.);
       }
     }
     vec3 radiance=incidentSample.rgb;
     if(shimmerAmount>0.){
       // Select source highlights before the bokeh reconstruction dilutes them.
       vec4 incident=glitterSample(sampleUV,rayLod);
       float luminance=dot(incident.rgb,vec3(.2126,.7152,.0722));
       float gate=externalGlitter?(hasGlitterMatte?texture(glitterMatte,clamp(sampleUV,0.,1.)).r:clamp((max(max(incident.r,incident.g),incident.b)-shimmerThreshold)/max(max(max(incident.r,incident.g),incident.b),.00001),0.,1.)):clamp(incident.a/max(luminance,.00001),0.,1.);
       float added=shimmerAmount*gate;
       radiance+=dot(incidentSample.rgb,vec3(.2126,.7152,.0722))*added*glitter;
       if(shimmerNormalize)radiance/=1.+added*(externalGlitter?glitterMean:shimmerDensity*.75*6.2831853*.0324);
     }
     sum[c]+=radiance[c]*weight*pupil.w*visibility;norm[c]+=weight;transmitted[c]+=weight*pupil.w*visibility;
     if(sliceMode||externalLayer){coverage[c]+=incidentSample.a*weight*(externalLayer?visibility:1.);}
   }
 }
 vec3 color=sum/max(norm,vec3(.0001));
 if(externalLayer){
   if(sliceMode){outColor=vec4(color,clamp(coverage.g/max(norm.g,.0001),0.,1.));return;}
   vec4 base=texture(originalImage,uv);float alpha=clamp(coverage.g/max(norm.g,.0001),0.,1.);
   if(compositeMode){vec4 c=texture(compositeImage,uv);color=c.rgb;alpha=c.a;}
   outColor=vec4(mix(base.rgb,color,masterBlend)*exp2(exposure),mix(base.a,alpha,masterBlend));return;
 }
 if(sliceMode){
   if(eclipseBokeh){outColor=vec4(color,1.);return;}
   vec3 alpha=clamp(coverage/max(norm,vec3(.0001)),0.,1.);
   vec3 straight=color/max(alpha,vec3(.00001));
   if(sliceBackground){
     if(eclipseBokeh){outColor=vec4(color,1.);return;}
     // Background radiance was extended at each ray sample, before filtering.
     outColor=vec4(color,alpha.g);return;
   }
   // Premultiplied radiance and matching wavelength coverage: never divide
   // red/blue by their own coverage then clip them with the green matte.
   outColor=vec4(color,sliceChannel>=0?alpha[sliceChannel]:alpha.g);return;
 }
 if(compositeMode){vec4 composited=texture(compositeImage,uv);color=eclipseBokeh?composited.rgb:composited.rgb/max(composited.a,.00001);}

 vec3 base=originalPart(texture(originalImage,uv).rgb);
 color=mix(base,color,masterBlend);
 outColor=vec4(color*exp2(exposure),partMode==2?(highlightActive?1.:0.):1.);
}`;
// A separate refractive plane, sampled through the pupil at its own distance.
// Procedural cap shapes and screen-space refraction are an approximation.
const DROPS=`#version 300 es
precision highp float;precision highp sampler2DArray;
in vec2 uv;out vec4 outColor;
uniform sampler2D plate,depthMap;uniform sampler2DArray rays,pupils;
uniform vec2 imageSize;uniform vec4 focusMatrix;
uniform float lastZ,referenceZ,sourceFocus,sensorZ,sensorMM,gridSize,apertureScale;
uniform float amount,dropDepth,dropSize,density,strength,seed,nearM,farM,depthGain,depthBias,sourceM;
uniform int taps,channel;uniform bool hasDepth,invertDepth,scalarDepth;
float plane(float z){float inv=1./(z*1000.);return lastZ-(focusMatrix.x+focusMatrix.y*inv)/(focusMatrix.z+focusMatrix.w*inv);}
vec2 random2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)))+seed*17.31)*43758.5453);}
vec2 dropNormal(vec2 q){
 vec2 p=q*vec2(1080.,1080.*imageSize.y/imageSize.x),cell=floor(p/(dropSize*3.));vec2 normal=vec2(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 id=cell+vec2(x,y),r=random2(id);if(r.x>density)continue;
  vec2 center=(id+.15+.7*random2(id+4.7))*dropSize*3.;
  float radius=dropSize*(.4+.6*r.y);vec2 axis=vec2(1.,.75+.5*random2(id+8.1).y);
  vec2 d=(p-center)/axis;float t=length(d)/radius;
  // Rounded cap slope with an antialiased contact boundary, no moving noise.
  float edge=1.-smoothstep(1.-max(.025,1080./imageSize.x/radius),1.,t);
  if(t<1.)normal+=d/radius/axis*edge*(.45+.55*t*t);
 }
 return normal;
}
float sceneDepth(vec2 q){vec4 d=texture(depthMap,q);float v=scalarDepth?d.r:channel==0?d.r:channel==1?d.g:channel==2?d.b:channel==3?d.a:dot(d.rgb,vec3(.2126,.7152,.0722));v=clamp(v*depthGain+depthBias,0.,1.);if(invertDepth)v=1.-v;return 1./mix(1./farM,1./nearM,v);}
void main(){
 vec3 original=texture(plate,uv).rgb;if(amount<=0.){outColor=vec4(original,1.);return;}
 vec2 gridUV=(clamp(vec2(uv.x,1.-uv.y),0.,1.)*(gridSize-1.)+.5)/gridSize;
 float dz=sensorZ-referenceZ+sourceFocus-plane(dropDepth);vec3 sum=vec3(0.);float norm=0.;
 for(int i=0;i<32;i++){
  int index=int((float(i)+.5)*float(taps)/32.);vec3 at=vec3((gridUV.x+1.)/3.,gridUV.y,float(index));
  vec4 ray=texture(rays,at),pupil=texture(pupils,at);
  vec2 offset=(ray.xy+dz*ray.zw)*apertureScale/vec2(sensorMM,-sensorMM*imageSize.y/imageSize.x);
  vec2 normal=dropNormal(uv-offset);
  vec2 bent=uv+normal*strength/vec2(1080.,1080.*imageSize.y/imageSize.x);
  // When a depth map exists, surfaces in front of the water plane stay untouched.
  float behind=hasDepth?smoothstep(dropDepth*.99,dropDepth*1.01,sceneDepth(uv)):smoothstep(dropDepth*.99,dropDepth*1.01,sourceM);
  vec3 color=texture(plate,clamp(bent,vec2(0.),vec2(1.))).rgb;
  sum+=mix(original,color,amount*behind)*pupil.z;norm+=pupil.z;
 }
 outColor=vec4(norm>1e-6?sum/norm:original,1.);
}`;
const DIFFUSION=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;
uniform sampler2D plate;uniform vec2 imageSize;uniform float amount,reach,regionRotation;uniform bool regionEnabled;uniform vec2 regionPosition,regionScale,regionPivot;
float regionMask(){if(!regionEnabled)return 1.;float radius=min(imageSize.x,imageSize.y)*.25;vec2 q=vec2(uv.x,1.-uv.y)*imageSize-regionPosition*imageSize-regionPivot*radius;float c=cos(regionRotation),sn=sin(regionRotation);q=mat2(c,-sn,sn,c)*q/regionScale+regionPivot*radius;return 1.-smoothstep(.8,1.,length(q)/radius);}
void main(){vec3 base=texture(plate,uv).rgb;vec3 halo=vec3(0.);float mass=0.;
 for(int i=0;i<24;i++){float t=float(i)+.5;float a=t*2.39996323;float r=sqrt(t/24.);float weight=exp(-2.*r*r);vec2 offset=vec2(cos(a),sin(a))*r*.04*reach*vec2(1.,imageSize.x/imageSize.y);halo+=texture(plate,clamp(uv+offset,vec2(0.),vec2(1.))).rgb*weight;mass+=weight;}
 outColor=vec4(mix(base,halo/mass,amount*regionMask()),1.);
}`;
const DIRTEXTRACT=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D plate;uniform float threshold;
void main(){vec3 c=max(texture(plate,uv).rgb,vec3(0.));float peak=max(c.r,max(c.g,c.b));outColor=vec4(c*max(0.,peak-threshold)/max(peak,.00001),1.);}`;
const LENSDIRT=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;
uniform sampler2D plate,highlights,dirtMask,dirtProc;uniform vec2 imageSize;
uniform float amount,blockAmount,scatterAmount,radius,scale,seed,rotation,lod,defocusLod;uniform bool customMask,hasProc;uniform vec4 dirtMix;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed*17.31)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
float dirt(vec2 q){
 float c=cos(rotation),s=sin(rotation);vec2 v=q-.5;v=mat2(c,s,-s,c)*v+.5;
 if(customMask){if(any(lessThan(v,vec2(0.)))||any(greaterThan(v,vec2(1.))))return 0.;return texture(dirtMask,vec2(v.x,1.-v.y)).r;}
 vec2 p=(v-.5)*vec2(1.,imageSize.y/imageSize.x)*scale*5.;
 float n=.57*noise(p)+.28*noise(p*2.13+9.7)+.15*noise(p*4.37+21.);
 float smudge=smoothstep(.25,.78,n);
 vec2 cell=floor(p*5.),local=fract(p*5.)-.5;float speck=exp(-dot(local,local)*90.)*step(.89,hash21(cell+51.));
 return clamp(.10+.65*smudge+.45*speck,0.,1.);
}
vec3 light(vec2 q,float level){if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec3(0.);return textureLod(highlights,q,level).rgb;}
// 1.2.11: textura real de sujeira (R digitais, G poeira, B riscos, A fungos) no elemento frontal.
// Fora de foco: o desfoque acompanha a abertura (defocusLod); só aparece onde a luz das altas a atinge.
vec4 layersAt(vec2 q){float c=cos(rotation),s=sin(rotation);vec2 v=q-.5;v=mat2(c,s,-s,c)*v+.5;
 vec2 t=(v-.5)*vec2(1.,imageSize.y/imageSize.x)*scale+.5;float spread=exp2(defocusLod)/1024.;vec4 acc=vec4(0.);
 for(int i=0;i<12;i++){float a=float(i)*2.39996323+.7,r=sqrt((float(i)+.5)/12.);acc+=textureLod(dirtProc,t+vec2(cos(a),sin(a))*r*spread,max(defocusLod-1.,0.));}
 return acc/12.;}
void main(){vec3 base=texture(plate,uv).rgb;vec2 q=vec2(uv.x,1.-uv.y);vec3 halo=vec3(0.);float mass=0.;
 if(scatterAmount>0.){for(int i=0;i<32;i++){float t=float(i)+.5,a=t*2.39996323,r=sqrt(t/32.),weight=exp(-3.*r*r);vec2 offset=vec2(cos(a),sin(a))*r*radius*vec2(1.,imageSize.x/imageSize.y);halo+=light(uv+offset,lod)*weight;mass+=weight;}halo=halo/max(mass,.00001);}
 vec4 L,W;if(customMask||!hasProc){L=vec4(dirt(q),0.,0.,0.);W=vec4(1.,0.,0.,0.);}else{L=layersAt(q);W=dirtMix;}
 vec4 LW=L*W;float scatterD=dot(LW,vec4(1.,1.,1.25,1.)),blockD=dot(LW,vec4(.35,1.,.15,1.));
 vec3 tint=(LW.r*vec3(1.)+LW.g*vec3(1.)+LW.b*1.25*vec3(1.04,1.,.96)+LW.a*vec3(1.,.86,.68))/max(scatterD,1e-4);
 float transmission=1.-amount*blockAmount*min(blockD,1.);
 vec3 color=base*transmission+halo*amount*scatterAmount*(.06+4.*scatterD*tint);
 outColor=vec4(max(color,vec3(0.)),1.);
}`;
// These effects consume highlights that have already crossed the scene PSF.
const WAVECOMBINE=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;
uniform sampler2D plate,blurredHighlights;uniform vec2 imageSize;
uniform float ghostGain,diffractionGain,diffractionScale,irisRotation,airyRadius,energy;
uniform int irisBlades;uniform vec4 ghostPairs[3];
vec3 high(vec2 q,float lod){if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return vec3(0.);return textureLod(blurredHighlights,q,lod).rgb;}
void main(){vec3 color=texture(plate,uv).rgb,effect=vec3(0.);
 if(diffractionGain>0.){vec3 spike=vec3(0.);float norm=0.;for(int i=0;i<64;i++){
  float t=(float(i/8)+.5)/8.,spoke=float(i%8),angle=irisBlades>=3?irisRotation+3.14159265/float(irisBlades)+spoke*6.2831853/8.:spoke*2.39996323;
  vec2 d=vec2(cos(angle),sin(angle))*airyRadius*diffractionScale*(1.+14.*t*t)/imageSize;
  float lod=log2(1.+airyRadius*diffractionScale*(.5+2.*t)),weight=1./(1.+30.*t*t);
  spike+=high(uv+d,lod)*weight;norm+=weight;
 }effect+=diffractionGain*spike/max(norm,1.);}
 if(ghostGain>0.)for(int i=0;i<3;i++){vec4 pair=ghostPairs[i];if(pair.x<=0.)continue;vec2 mirrored=.5-(uv-.5)/pair.x;vec3 sum=vec3(0.);
  for(int j=0;j<4;j++){float a=float(j)*1.57079633;vec2 d=vec2(cos(a),sin(a))*max(1.,airyRadius*diffractionScale*3.)/imageSize;sum+=high(mirrored+d,log2(1.+airyRadius*diffractionScale*12.));}
  effect+=sum*.25*pair.yzw*ghostGain;
 }
 outColor=vec4(max(color+effect*energy,vec3(0.)),1.);
}`;
const RESOLVE=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D rendered,illuminationMap;uniform float vignetteAmount,imageAspect,edgeCompensation,edgeCompensationLimit,illuminationGrid;
void main(){float r=length((uv-.5)*vec2(2.,2.*imageAspect));
float t=texture(illuminationMap,(vec2(uv.x,1.-uv.y)*(illuminationGrid-1.)+.5)/illuminationGrid).r;
float confidence=smoothstep(0.,.01,t);
float gain=1.+confidence*(exp2(min(-log2(max(t,1e-12)),edgeCompensationLimit)*edgeCompensation)-1.);
vec3 c=clamp(texture(rendered,uv).rgb*gain*(1.-vignetteAmount*smoothstep(.45,1.1,r)),0.,1.);
vec3 encoded=mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));
// Fixed spatial dither breaks 8-bit contour bands without randomizing each frame.
float noise=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;
outColor=vec4(clamp(encoded+noise/255.,0.,1.),1.);}`;
const PREFILTER=`#version 300 es
precision highp float;in vec2 uv;layout(location=0) out vec4 outColor;layout(location=1) out vec4 baseColor;layout(location=2) out vec4 highColor;layout(location=3) out vec4 lowColor;
uniform sampler2D rawImage;uniform bool linearInput,externalLayer;uniform float highlightGain,highlightThreshold,shimmerThreshold,highlightRecovery;
vec3 decode(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
void main(){vec4 raw=texture(rawImage,uv);vec3 c=(linearInput?raw.rgb:decode(raw.rgb))*raw.a;
 // 1.2.14: recupera energia das altas luzes recortadas (só em imagens LDR, só perto do branco): o bokeh fora de foco
 // ganha o brilho real das fontes; em foco o pixel continua branco na tela.
 if(!linearInput&&highlightRecovery>0.){float m=max(raw.r,max(raw.g,raw.b));c*=exp2(highlightRecovery*smoothstep(.9,1.,m));}baseColor=vec4(c,externalLayer?raw.a:1.);
float lum=dot(c,vec3(.2126,.7152,.0722));vec3 light=c*(1.+highlightGain*smoothstep(.45,1.,lum));float lightPeak=max(light.r,max(light.g,light.b));float gate=max(0.,lightPeak-shimmerThreshold)/max(lightPeak,.00001);outColor=vec4(light,externalLayer?raw.a:dot(light,vec3(.2126,.7152,.0722))*gate);
float peak=max(c.r,max(c.g,c.b)),fraction=max(0.,peak-highlightThreshold)/max(peak,.00001);vec3 high=light*fraction;
highColor=vec4(high,peak>highlightThreshold?1.:0.);lowColor=vec4(light-high,1.);}`;
const PYRAMID=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;
uniform sampler2D previous;uniform float previousLevel;uniform vec2 previousTexel;
void main(){vec4 sum=vec4(0.);for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){
 float wx=x==0?6.:abs(x)==1?4.:1.;float wy=y==0?6.:abs(y)==1?4.:1.;
 float weight=wx*wy;
 sum+=textureLod(previous,uv+vec2(float(x),float(y))*previousTexel,previousLevel)*weight;
}outColor=sum/256.;}`;

// Depth layers are masked BEFORE filtering, so RGB and coverage use the same PSF.
// Refine only a depth transition between two locally flat, color-separated
// surfaces. Continuous depth gradients and ambiguous RGB edges are untouched.
const DEPTHMASK=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;
uniform sampler2D lightImage,depthImage,guideImage;uniform bool externalLayer;uniform int depthChannel;
uniform float depthGain,depthBias,sliceDepth,sliceWidth,cutPosition,cutFeather,focusAnchor;
uniform int eclipseSlices;
float focusPartition(float x,bool inverse){
 if(focusAnchor<=0.)return x;
 float a=clamp(floor(focusAnchor*float(eclipseSlices-1)+.5),1.,float(eclipseSlices-2))/float(eclipseSlices-1);
 return inverse?(x<=a?x*focusAnchor/a:focusAnchor+(x-a)*(1.-focusAnchor)/(1.-a)):(x<=focusAnchor?x*a/focusAnchor:a+(x-focusAnchor)*(1.-a)/(1.-focusAnchor));
}

uniform bool invertDepth,scalarDepth,cutMode,eclipseBokeh;
float rawDepth(vec2 q){vec4 d=texture(depthImage,q);return scalarDepth?d.r:depthChannel==0?d.r:depthChannel==1?d.g:depthChannel==2?d.b:depthChannel==3?d.a:dot(d.rgb,vec3(.2126,.7152,.0722));}
float refinedDepth(){
 vec2 texel=1./vec2(textureSize(guideImage,0));float center=rawDepth(uv),lo=center,hi=center;vec2 loUV=uv,hiUV=uv;
 if(center<=.001||center>=.999)return center;
 float radius=clamp(float(textureSize(guideImage,0).x)*.0375,6.,32.);
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){vec2 q=clamp(uv+vec2(x,y)*radius*.5*texel,texel*.5,1.-texel*.5);float d=rawDepth(q);if(d<lo){lo=d;loUV=q;}if(d>hi){hi=d;hiUV=q;}}
 if(hi-lo<.15||center<=lo+.001||center>=hi-.001)return center;
 float variation=0.;for(int i=0;i<4;i++){vec2 t=i==0?vec2(texel.x,0.):i==1?vec2(-texel.x,0.):i==2?vec2(0.,texel.y):vec2(0.,-texel.y);variation=max(variation,abs(rawDepth(loUV+t)-lo));variation=max(variation,abs(rawDepth(hiUV+t)-hi));}
 if(variation>.002)return center;
 vec3 centerColor=textureLod(guideImage,uv,0.).rgb,low=vec3(0.),high=vec3(0.);float lc=0.,hc=0.,ld=1e30,hd=1e30;
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){vec2 q=clamp(uv+vec2(x,y)*radius*.5*texel,texel*.5,1.-texel*.5);float d=rawDepth(q);vec3 c=textureLod(guideImage,q,0.).rgb;float dist=dot(c-centerColor,c-centerColor);if(d<=lo+.025){lc++;if(dist<ld){low=c;ld=dist;}}if(d>=hi-.025){hc++;if(dist<hd){high=c;hd=dist;}}}
 if(lc<3.||hc<3.)return center;vec3 delta=high-low;float contrast=dot(delta,delta);if(contrast<.005)return center;
 vec3 c=centerColor;float t=clamp(dot(c-low,delta)/contrast,0.,1.);vec3 fit=mix(low,high,t);
 // A third material/texture is not evidence for reassigning its depth.
 if(dot(c-fit,c-fit)>contrast*.12+.0004)return center;
 return mix(lo,hi,t);
}
float depthValue(){float t=clamp(refinedDepth()*depthGain+depthBias,0.,1.);return invertDepth?1.-t:t;}
void main(){float d=depthValue();if(!cutMode)d=focusPartition(d,false);float mask;
 if(cutMode){float front=smoothstep(cutPosition-cutFeather,cutPosition+cutFeather,d);mask=sliceDepth>.5?front:1.-front;}
 else {
  // Hat weights partition depth, but OVER needs conditional opacity.
  // Convert against cumulative far-to-near coverage before filtering so
  // an opaque surface cannot reveal the filled background between bins.
  float weight=max(0.,1.-abs(d-sliceDepth)/sliceWidth);
  float cumulative=clamp(1.+(sliceDepth-d)/sliceWidth,0.,1.);
  mask=(eclipseBokeh||externalLayer)?weight:weight/max(cumulative,.00001);
 }
 vec4 incident=texture(lightImage,uv);outColor=vec4(incident.rgb*mask,mask*(externalLayer?incident.a:1.));}`;

const HIGHLIGHTCOMBINE=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform sampler2D basePass,highlightPass;uniform int viewMode;
void main(){vec4 base=texture(basePass,uv),high=texture(highlightPass,uv);vec3 color=viewMode==1?high.rgb:viewMode==2?base.rgb:viewMode==3?vec3(high.a):base.rgb+high.rgb;outColor=vec4(color,1.);}`;

class LensGPU {
 constructor(canvas){
  this.canvas=canvas;const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL2 indisponível. Abra no Chrome/Edge com aceleração gráfica habilitada.');this.gl=gl;LensGPU.cacheState(gl);
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  this.depthFloatLinear=!!gl.getExtension('OES_texture_float_linear');
  if(!gl.getExtension('EXT_color_buffer_float'))throw Error('GPU sem framebuffer float: a prévia linear requer EXT_color_buffer_float.');
  this.prefilter=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,PREFILTER]]){const sh=compile(type,src);gl.attachShader(this.prefilter,sh);gl.deleteShader(sh);}gl.linkProgram(this.prefilter);if(!gl.getProgramParameter(this.prefilter,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.prefilter));
  this.preUniforms=Object.fromEntries(['rawImage','linearInput','externalLayer','highlightGain','highlightThreshold','shimmerThreshold','highlightRecovery'].map(k=>[k,gl.getUniformLocation(this.prefilter,k)]));
  this.pyramid=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,PYRAMID]]){const sh=compile(type,src);gl.attachShader(this.pyramid,sh);gl.deleteShader(sh);}gl.linkProgram(this.pyramid);if(!gl.getProgramParameter(this.pyramid,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.pyramid));
  this.pyramidUniforms=Object.fromEntries(['previous','previousLevel','previousTexel'].map(k=>[k,gl.getUniformLocation(this.pyramid,k)]));
  const makeProgram=src=>{const p=gl.createProgram();for(const [type,code]of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,src]]){const sh=compile(type,code);gl.attachShader(p,sh);gl.deleteShader(sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
  this.physicalPass=new PhysicalDistortion.Pass(this,VERT);
  this.reflectedPass=new ReflectedGhosts.Pass(this);
  this.depthMask=makeProgram(DEPTHMASK);this.highlightCombine=makeProgram(HIGHLIGHTCOMBINE);
  this.maskUniforms=Object.fromEntries(['focusAnchor','eclipseSlices','externalLayer','lightImage','depthImage','guideImage','depthChannel','depthGain','depthBias','sliceDepth','sliceWidth','cutPosition','cutFeather','invertDepth','scalarDepth','cutMode','eclipseBokeh'].map(k=>[k,gl.getUniformLocation(this.depthMask,k)]));
  this.layerTexture=this.texture2D(8);this.layerFbo=gl.createFramebuffer();this.layerSize='';this.compositeTexture=this.texture2D(9);this.compositeFbo=gl.createFramebuffer();this.compositeSize='';this.scalarDepth=false;
  this.highTexture=this.texture2D(10);this.lowTexture=this.texture2D(11);this.highPass=this.texture2D(13);this.lowPass=this.texture2D(12);this.highFbo=gl.createFramebuffer();this.lowFbo=gl.createFramebuffer();this.splitSize='';this.passSize='';this.coverageTexture=this.texture2D(14);this.coverageFbo=gl.createFramebuffer();this.coverageReady=false;this.coveragePixel=new Float32Array(4);
  this.artisticFilters=new ArtisticFilterPass(gl,makeProgram);
  this.diffusionProgram=makeProgram(DIFFUSION);this.diffusionTexture=this.texture2D(0);this.diffusionFbo=gl.createFramebuffer();this.diffusionSize="";
  this.dropsProgram=makeProgram(DROPS);this.dropsTexture=this.texture2D(15);this.dropsFbo=gl.createFramebuffer();this.dropsSize="";
  this.dirtProgram=makeProgram(LENSDIRT);this.dirtExtractProgram=makeProgram(DIRTEXTRACT);this.dirtOutput=this.texture2D(12);this.dirtMask=this.texture2D(13);this.dirtHigh=this.texture2D(14);this.dirtFbo=gl.createFramebuffer();this.dirtHighFbo=gl.createFramebuffer();this.dirtSize='';this.dirtKey='';this.dirtRequest=0;
  this.waveProgram=makeProgram(WAVECOMBINE);this.waveSource=this.texture2D(11);this.waveBlur=this.texture2D(12);this.waveMerged=this.texture2D(5);this.waveSourceFbo=gl.createFramebuffer();this.waveBlurFbo=gl.createFramebuffer();this.waveMergedFbo=gl.createFramebuffer();this.waveSourceSize='';this.waveSize='';
  this.resolve=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,RESOLVE]]){const sh=compile(type,src);gl.attachShader(this.resolve,sh);gl.deleteShader(sh);}gl.linkProgram(this.resolve);if(!gl.getProgramParameter(this.resolve,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.resolve));this.resolveInput=gl.getUniformLocation(this.resolve,'rendered');
  this.illuminationTexture=gl.createTexture();
  this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,VERT),fs=compile(gl.FRAGMENT_SHADER,FRAG);gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  this.uniforms={};for(let i=0;i<gl.getProgramParameter(this.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(this.program,i);this.uniforms[u.name]=gl.getUniformLocation(this.program,u.name);}
  this.sourceTexture=this.texture2D(0);this.depthTexture=this.texture2D(1);this.rayTexture=gl.createTexture();this.pupilTexture=gl.createTexture();
  this.lightTexture=this.texture2D(4);this.lightFbo=gl.createFramebuffer();this.sourceDirty=true;this.lightSize='';
  this.baseTexture=this.texture2D(5);this.renderTexture=this.texture2D(6);this.renderFbo=gl.createFramebuffer();this.renderSize='';
  this.pyramidTemp=this.texture2D(7);this.pyramidFbo=gl.createFramebuffer();this.pyramidSize='';
  gl.uniform1i(this.uniforms.sourceImage,0);gl.uniform1i(this.uniforms.originalImage,5);gl.uniform1i(this.uniforms.depthImage,1);gl.uniform1i(this.uniforms.rayAtlas,2);gl.uniform1i(this.uniforms.pupilAtlas,3);
  this.timerExt=gl.getExtension('EXT_disjoint_timer_query_webgl2');this.query=null;this.gpuMs=null;this.draws=0;this.ready=false;this.inputSize=[768,480];
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;canvas.dispatchEvent(new CustomEvent('rendererror',{detail:'Contexto GPU perdido. Recarregue o aplicativo.'}));});
 }
 texture2D(unit){const g=this.gl;const t=g.createTexture();g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));return t;}
 depthRaw(channel='r'){
  const key=this.depthRevision+':'+channel;if(this.rawDepthCache?.key===key)return this.rawDepthCache;
  const native=this.nativeDepth;if(!native)return null;let values,width,height;
  if(native.values){({values,width,height}=native)}else{const image=native.image;width=image.naturalWidth||image.width;height=image.naturalHeight||image.height;const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,width,height).data;values=new Float32Array(width*height);const channelIndex=['r','g','b','a'].indexOf(channel);for(let i=0;i<values.length;i++)values[i]=channel==='luma'?(rgba[i*4]*.2126+rgba[i*4+1]*.7152+rgba[i*4+2]*.0722)/255:rgba[i*4+Math.max(0,channelIndex)]/255;}
  return this.rawDepthCache={key,values,width,height};
 }
 prepareDepth(s,{near=s.near_m,far=s.far_m,invert=s.invert_depth}={}){
  const raw=this.depthRaw(s.depth_channel||'r');if(!raw)return null;const key=raw.key+DepthUtils.key(s,near,far,invert);
  if(this.preparedDepth?.key===key)return this.preparedDepth;
  return this.preparedDepth={...DepthUtils.prepare(raw.values,s,{near,far,invert}),key,width:raw.width,height:raw.height,raw:raw.values};
 }
 depthParameters(s,{near,far,invert,depth}){
  if(!depth||!this.nativeDepth)return {s,invert};
  const transition=s.depth_mode==='cut'&&s.depth_feather>0;
  if(DepthUtils.advanced(s)||this.depthHasInvalid||transition){
   let prepared=this.prepareDepth(s,{near,far,invert});
   if(transition)prepared={...prepared,nearness:DepthUtils.blurTransition(prepared.nearness,s),key:prepared.key+JSON.stringify([s.depth_cut,s.depth_feather]),statistics:{...prepared.statistics,binary:false}};
   if(this.depthTextureKey!==prepared.key){const g=this.gl;g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depthTexture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);const flipped=new Float32Array(prepared.nearness.length);for(let y=0;y<prepared.height;y++)flipped.set(prepared.nearness.subarray(y*prepared.width,(y+1)*prepared.width),(prepared.height-1-y)*prepared.width);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,this.depthFloatLinear?g.LINEAR:g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,this.depthFloatLinear?g.LINEAR:g.NEAREST);g.texImage2D(g.TEXTURE_2D,0,g.R32F,prepared.width,prepared.height,0,g.RED,g.FLOAT,flipped);this.depthTextureKey=prepared.key;this.scalarDepth=true;this.depthBinary={r:prepared.statistics.binary};}
   return {s:{...s,depth_gain:1,depth_bias:0,...(transition?{depth_mode:'slicing'}:{})},invert:false};
  }
  if(this.depthTextureKey){const native=this.nativeDepth,revision=this.depthRevision;if(native.values)this.uploadDepthFloat(native.values,native.width,native.height);else this.uploadDepth(native.image);this.depthRevision=revision;this.depthTextureKey=null;}
  return {s,invert};
 }
 uploadSource(source,width,height,linear=null){this.nativeSource={image:source,linear};this.sourceRevision=(this.sourceRevision||0)+1;const g=this.gl;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.sourceTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);if(linear){
    // Typed-array upload does not honor UNPACK_FLIP_Y_WEBGL consistently. Flip rows explicitly.
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
    const flipped=this.sourceUploadBuffer?.length===linear.length?this.sourceUploadBuffer:(this.sourceUploadBuffer=new Float32Array(linear.length)),row=width*4;for(let y=0;y<height;y++)flipped.set(linear.subarray(y*row,(y+1)*row),(height-1-y)*row);
    if(this.sourceStorage===width+','+height+',float')g.texSubImage2D(g.TEXTURE_2D,0,0,0,width,height,g.RGBA,g.FLOAT,flipped);else g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,width,height,0,g.RGBA,g.FLOAT,flipped);
  }else{if(this.sourceStorage===width+','+height+',byte')g.texSubImage2D(g.TEXTURE_2D,0,0,0,g.RGBA,g.UNSIGNED_BYTE,source);else g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);}this.sourceStorage=width+','+height+','+(linear?'float':'byte');this.linear=!!linear;this.inputSize=[width,height];this.sourceDirty=true;}
 prepareLight(gain,threshold=.8,split=false,shimmerThreshold=.6){const g=this.gl,[w,h]=this.inputSize;if(!this.sourceDirty&&this.lastRecovery===(this.recoveryEV||0)&&this.lastGain===gain&&this.lastThreshold===threshold&&this.lastSplit===split&&this.lastShimmerThreshold===shimmerThreshold)return;
  g.activeTexture(g.TEXTURE4);g.bindTexture(g.TEXTURE_2D,this.lightTexture);
  if(this.lightSize!==w+','+h){for(const [unit,tex] of [[4,this.lightTexture],[5,this.baseTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,w,h,0,g.RGBA,g.HALF_FLOAT,null);}this.lightSize=w+','+h;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.lightFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.lightTexture,0);
  g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT1,g.TEXTURE_2D,this.baseTexture,0);if(split&&this.splitSize!==w+','+h){for(const [unit,tex]of [[10,this.highTexture],[11,this.lowTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,w,h,0,g.RGBA,g.HALF_FLOAT,null);}this.splitSize=w+','+h;}
  g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT2,g.TEXTURE_2D,split?this.highTexture:null,0);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT3,g.TEXTURE_2D,split?this.lowTexture:null,0);g.drawBuffers(split?[g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1,g.COLOR_ATTACHMENT2,g.COLOR_ATTACHMENT3]:[g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer linear indisponível.');
  g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.sourceTexture);g.useProgram(this.prefilter);g.uniform1i(this.preUniforms.rawImage,0);g.uniform1i(this.preUniforms.linearInput,this.linear?1:0);g.uniform1i(this.preUniforms.externalLayer,this.externalLayer?1:0);g.uniform1f(this.preUniforms.highlightGain,gain);g.uniform1f(this.preUniforms.highlightRecovery,this.recoveryEV||0);g.uniform1f(this.preUniforms.highlightThreshold,threshold);g.uniform1f(this.preUniforms.shimmerThreshold,shimmerThreshold);g.viewport(0,0,w,h);g.drawArrays(g.TRIANGLES,0,3);
  g.bindFramebuffer(g.FRAMEBUFFER,null);for(const [unit,tex] of [[4,this.lightTexture],[5,this.baseTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);}
  this.buildGaussianPyramid(w,h);if(split)for(const [unit,tex]of [[10,this.highTexture],[11,this.lowTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);this.buildGaussianPyramid(w,h,tex,unit);}this.sourceDirty=false;this.lastRecovery=this.recoveryEV||0;this.lastGain=gain;this.lastThreshold=threshold;this.lastSplit=split;this.lastShimmerThreshold=shimmerThreshold;
 }
 buildGaussianPyramid(width,height,texture=this.lightTexture,unit=4,format=null){
  const g=this.gl,tw=Math.max(1,Math.floor(width/2)),th=Math.max(1,Math.floor(height/2));format??=g.RGBA16F;
  // 1.2.12: preserva o que estava na unidade 7 (ex.: saída do Lens Flare) — antes era sobrescrito.
  g.activeTexture(g.TEXTURE7);const savedUnit7=g.getParameter(g.TEXTURE_BINDING_2D);g.bindTexture(g.TEXTURE_2D,this.pyramidTemp);
  if(this.pyramidSize!==tw+','+th+','+format){g.texImage2D(g.TEXTURE_2D,0,format,tw,th,0,g.RGBA,format===g.RGBA32F?g.FLOAT:g.HALF_FLOAT,null);this.pyramidSize=tw+','+th+','+format;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.pyramidFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.pyramidTemp,0);g.drawBuffers([g.COLOR_ATTACHMENT0]);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer da pirâmide gaussiana indisponível.');
  g.useProgram(this.pyramid);g.uniform1i(this.pyramidUniforms.previous,unit);
  // Scratch target and sampled texture are distinct: no feedback loop.
  let w=width,h=height,level=0;g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,texture);
  while(w>1||h>1){const nw=Math.max(1,Math.floor(w/2)),nh=Math.max(1,Math.floor(h/2));
   g.viewport(0,0,nw,nh);g.uniform1f(this.pyramidUniforms.previousLevel,level);g.uniform2f(this.pyramidUniforms.previousTexel,1/w,1/h);g.drawArrays(g.TRIANGLES,0,3);
   g.copyTexSubImage2D(g.TEXTURE_2D,level+1,0,0,0,0,nw,nh);w=nw;h=nh;level++;
  }
  g.bindFramebuffer(g.FRAMEBUFFER,null);if(unit!==7){g.activeTexture(g.TEXTURE7);g.bindTexture(g.TEXTURE_2D,savedUnit7);}
 }
 uploadDepthFloat(values,width,height){this.depthHasInvalid=values.some(v=>!Number.isFinite(v));this.depthTextureKey=null;this.nativeDepth={values,width,height};this.depthRevision=(this.depthRevision||0)+1;this.scalarDepth=true;this.depthBinary={r:DepthUtils.binary(values)};const g=this.gl;g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depthTexture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);const flipped=new Float32Array(values.length);for(let y=0;y<height;y++)flipped.set(values.subarray(y*width,(y+1)*width),(height-1-y)*width);g.texImage2D(g.TEXTURE_2D,0,g.R16F,width,height,0,g.RED,g.FLOAT,flipped);}
 uploadDepth(source){this.depthHasInvalid=false;this.depthTextureKey=null;this.nativeDepth={image:source};this.depthRevision=(this.depthRevision||0)+1;this.scalarDepth=false;this.depthBinary={};try{const c=document.createElement('canvas');c.width=source.naturalWidth||source.width;c.height=source.naturalHeight||source.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);this.depthBinary=DepthUtils.rgbaBinary(ctx.getImageData(0,0,c.width,c.height).data);}catch{}const g=this.gl;g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depthTexture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);}
 setKernel(data){if(!data._physicalPrepared)this.baseData=data;const g=this.gl,grid=data.grid,layers=data.taps;if(![3,5,9].includes(grid)||![32,64,128,256,512,1024].includes(data.taps)||data.atlas.length!==grid*grid*layers*12||data.pupils.length!==grid*grid*layers*12)throw Error('Atlas de raios inválido.');if(layers>g.getParameter(g.MAX_ARRAY_TEXTURE_LAYERS))throw Error('Atlas acima do limite de camadas desta GPU.');const unchanged=this.ready&&this.data?.atlas_id&&this.data.atlas_id===data.atlas_id&&this.data.grid===grid&&this.data.taps===layers;this.data=data;if(unchanged){this.atlasUploadSkipped=true;return;}this.atlasUploadSkipped=false;g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);for(const [unit,tex,values]of [[2,this.rayTexture,data.atlas],[3,this.pupilTexture,data.pupils]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D_ARRAY,tex);g.texParameteri(g.TEXTURE_2D_ARRAY,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D_ARRAY,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D_ARRAY,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D_ARRAY,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage3D(g.TEXTURE_2D_ARRAY,0,g.RGBA16F,grid*3,grid,layers,0,g.RGBA,g.FLOAT,data.atlas_layout==='webgl-packed-f32'?values:LensQuality.pack(values,grid,data.taps));}const error=g.getError();if(error!==g.NO_ERROR)throw Error('Falha ao carregar atlas GPU: '+error);this.ready=true;}
 drawDiffusion(s,{rw,rh,plateUnit=6}){
  const g=this.gl;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.diffusionTexture);
  if(this.diffusionSize!==rw+","+rh){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.diffusionSize=rw+","+rh;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.diffusionFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.diffusionTexture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error("Framebuffer de difusão indisponível.");
  g.viewport(0,0,rw,rh);g.useProgram(this.diffusionProgram);g.uniform1i(g.getUniformLocation(this.diffusionProgram,"plate"),plateUnit);g.uniform2f(g.getUniformLocation(this.diffusionProgram,"imageSize"),...this.inputSize);g.uniform1f(g.getUniformLocation(this.diffusionProgram,"amount"),(s.diffusion||0)*(s.master_blend??1));const loc=k=>g.getUniformLocation(this.diffusionProgram,k);g.uniform1f(loc('reach'),s.diffusion_reach??1);g.uniform1i(loc('regionEnabled'),s.diffusion_region?1:0);g.uniform1f(loc('regionRotation'),(s.diffusion_rotation||0)*Math.PI/180);g.uniform2f(loc('regionPosition'),s.diffusion_x??.5,s.diffusion_y??.5);g.uniform2f(loc('regionScale'),(s.diffusion_scale??1)*(s.diffusion_scale_x??1),(s.diffusion_scale??1)*(s.diffusion_scale_y??1));g.uniform2f(loc('regionPivot'),s.diffusion_pivot_x||0,s.diffusion_pivot_y||0);g.drawArrays(g.TRIANGLES,0,3);return 0;
 }
 drawDrops(s,{rw,rh,depth,invert,near,far,plateUnit=6}){
  const g=this.gl;g.activeTexture(g.TEXTURE15);g.bindTexture(g.TEXTURE_2D,this.dropsTexture);
  if(this.dropsSize!==rw+','+rh){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.dropsSize=rw+','+rh;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.dropsFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.dropsTexture,0);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer da camada de gotas indisponível.');
  g.viewport(0,0,rw,rh);g.useProgram(this.dropsProgram);const loc=k=>g.getUniformLocation(this.dropsProgram,k);
  for(const [k,v]of Object.entries({plate:plateUnit,depthMap:1,rays:2,pupils:3,taps:this.data.taps,channel:['r','g','b','a','luma'].indexOf(s.depth_channel||'r'),hasDepth:depth?1:0,invertDepth:invert?1:0,scalarDepth:this.scalarDepth?1:0}))g.uniform1i(loc(k),v);
  g.uniform2f(loc('imageSize'),...this.inputSize);g.uniform4fv(loc('focusMatrix'),this.data.matrix);
  const values={lastZ:this.data.last_z,referenceZ:this.data.reference_z,sourceFocus:this.plane(this.data.source_m),focusShift:s.ray_focus?this.data.focus_calibration?.shift_mm||0:0,sensorZ:this.plane(s.focus_m)+s.filmback_mm+(s.ray_focus?this.data.focus_calibration?.shift_mm||0:0),sensorMM:s.sensor_mm,gridSize:this.data.grid,apertureScale:s.iris_mm/(this.data.iris_mm||s.iris_mm),amount:(s.drops_amount||0)*(s.master_blend??1),sourceM:s.source_m,dropDepth:s.drops_depth??1,dropSize:s.drops_size??30,density:s.drops_density??.5,strength:s.drops_refraction??20,seed:s.drops_seed??1,nearM:near,farM:far,depthGain:s.depth_gain??1,depthBias:s.depth_bias??0};
  for(const [k,v]of Object.entries(values))g.uniform1f(loc(k),v);g.drawArrays(g.TRIANGLES,0,3);return 15;
 }
 estimateHighlightCoverage(){
  const g=this.gl;if(this.coverageSupported===false)return 0;g.activeTexture(g.TEXTURE14);g.bindTexture(g.TEXTURE_2D,this.coverageTexture);
  if(!this.coverageReady){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,32,32,0,g.RGBA,g.HALF_FLOAT,null);this.coverageReady=true;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.coverageFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.coverageTexture,0);g.viewport(0,0,32,32);g.useProgram(this.program);g.uniform1i(this.uniforms.coverageProbe,1);g.drawArrays(g.TRIANGLES,0,3);g.uniform1i(this.uniforms.coverageProbe,0);
  g.bindFramebuffer(g.FRAMEBUFFER,null);g.generateMipmap(g.TEXTURE_2D);g.bindFramebuffer(g.FRAMEBUFFER,this.coverageFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.coverageTexture,5);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Leitura da cobertura de highlights indisponível.');g.readPixels(0,0,1,1,g.RGBA,g.FLOAT,this.coveragePixel);if(g.getError()!==g.NO_ERROR){this.coverageSupported=false;this.coveragePixel[0]=0;}g.bindFramebuffer(g.FRAMEBUFFER,this.renderFbo);return Math.max(0,Math.min(1,this.coveragePixel[0]));
 }

 drawDepthLayers(s,{w,h,rw,rh,invert,near,far,sourceUnit=4,outputFbo=this.renderFbo}){
  const g=this.gl,count=s.depth_mode==='cut'?2:Math.round(s.depth_slices||12),key=w+','+h;
  g.activeTexture(g.TEXTURE8);g.bindTexture(g.TEXTURE_2D,this.layerTexture);
  if(this.layerSize!==key){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,w,h,0,g.RGBA,g.HALF_FLOAT,null);this.layerSize=key;}
  g.activeTexture(g.TEXTURE9);g.bindTexture(g.TEXTURE_2D,this.compositeTexture);
  if(this.compositeSize!==rw+','+rh){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.compositeSize=rw+','+rh;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.compositeFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.compositeTexture,0);g.drawBuffers([g.COLOR_ATTACHMENT0]);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Composição depth indisponível.');g.viewport(0,0,rw,rh);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);
  g.useProgram(this.program);g.uniform1i(this.uniforms.compositeImage,5);
  // Far-to-near source layers; the color is never filtered together with another depth.
  for(let i=0;i<count;i++){
   const d=i/(count-1);g.disable(g.BLEND);g.bindFramebuffer(g.FRAMEBUFFER,this.layerFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.layerTexture,0);g.drawBuffers([g.COLOR_ATTACHMENT0]);
   if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Camada depth indisponível.');g.viewport(0,0,w,h);g.useProgram(this.depthMask);
   const u=this.maskUniforms;g.uniform1f(u.focusAnchor,DepthUtils.focusAnchor(s,near,far));g.uniform1i(u.eclipseSlices,count);g.uniform1i(u.externalLayer,this.externalLayer?1:0);g.uniform1i(u.lightImage,sourceUnit);g.uniform1i(u.depthImage,1);g.uniform1i(u.guideImage,4);g.uniform1i(u.depthChannel,['r','g','b','a','luma'].indexOf(s.depth_channel||'r'));g.uniform1i(u.scalarDepth,this.scalarDepth?1:0);g.uniform1i(u.invertDepth,invert?1:0);g.uniform1i(u.cutMode,s.depth_mode==='cut'?1:0);g.uniform1i(u.eclipseBokeh,s.eclipse_bokeh?1:0);
   g.uniform1f(u.depthGain,s.depth_gain??1);g.uniform1f(u.depthBias,s.depth_bias??0);g.uniform1f(u.sliceDepth,d);g.uniform1f(u.sliceWidth,1/(count-1));g.uniform1f(u.cutPosition,s.depth_cut??.5);g.uniform1f(u.cutFeather,Math.max(.00001,s.depth_feather??.02));g.drawArrays(g.TRIANGLES,0,3);
   g.bindFramebuffer(g.FRAMEBUFFER,null);g.activeTexture(g.TEXTURE8);g.bindTexture(g.TEXTURE_2D,this.layerTexture);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);this.buildGaussianPyramid(w,h,this.layerTexture,8);
   g.bindFramebuffer(g.FRAMEBUFFER,this.compositeFbo);g.viewport(0,0,rw,rh);g.useProgram(this.program);g.uniform1i(this.uniforms.sourceImage,8);g.uniform1i(this.uniforms.sliceMode,1);g.uniform1i(this.uniforms.sliceBackground,i===0?1:0);g.uniform1f(this.uniforms.sliceDepth,d);
   this.stackBindings?.bind();g.enable(g.BLEND);g.blendEquation(g.FUNC_ADD);const eclipsed=s.eclipse_bokeh;g.blendFunc(g.ONE,(eclipsed||this.externalLayer)?g.ONE:g.ONE_MINUS_SRC_ALPHA);
   g.uniform1i(this.uniforms.sliceChannel,-1);
   if(i===0||eclipsed||this.externalLayer){g.drawArrays(g.TRIANGLES,0,3);}else{
    // Scalar framebuffer alpha cannot describe three chromatic silhouettes.
    // Blend each color with its own coverage; the shader traces only that color.
    for(let channel=0;channel<3;channel++){g.uniform1i(this.uniforms.sliceChannel,channel);g.colorMask(channel===0,channel===1,channel===2,channel===1);g.drawArrays(g.TRIANGLES,0,3);}
    g.colorMask(true,true,true,true);g.uniform1i(this.uniforms.sliceChannel,-1);
   }
  }
  g.disable(g.BLEND);g.useProgram(this.program);g.uniform1i(this.uniforms.sliceMode,0);g.uniform1i(this.uniforms.compositeMode,0);g.uniform1i(this.uniforms.sourceImage,sourceUnit);
  g.bindFramebuffer(g.FRAMEBUFFER,outputFbo);g.viewport(0,0,rw,rh);g.useProgram(this.program);g.uniform1i(this.uniforms.compositeImage,9);g.uniform1i(this.uniforms.compositeMode,1);g.drawArrays(g.TRIANGLES,0,3);g.uniform1i(this.uniforms.compositeMode,0);
 }

 presentCUDA(pixels,s,{width,height,depth=false,invert=false,near=.8,far=10,precision='float32'}){
  ({s,invert}=this.depthParameters(s,{near,far,invert,depth}));
  this.preparePhysical(s);
  const g=this.gl;this.canvas.width=width;this.canvas.height=height;g.disable(g.BLEND);g.colorMask(true,true,true,true);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
  g.activeTexture(g.TEXTURE6);g.bindTexture(g.TEXTURE_2D,this.renderTexture);if(this.cudaPixels!==pixels||this.renderSize!==width+','+height){if(this.renderSize===width+','+height)g.texSubImage2D(g.TEXTURE_2D,0,0,0,width,height,g.RGBA,precision==='float16'?g.HALF_FLOAT:g.FLOAT,pixels);else g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,width,height,0,g.RGBA,precision==='float16'?g.HALF_FLOAT:g.FLOAT,pixels);}this.cudaPixels=pixels;this.renderSize=width+','+height;
  const diffused=(s.diffusion||0)>0?this.drawDiffusion(s,{rw:width,rh:height}):6;
  let plateUnit=this.physicalPass.draw(s,{rw:width,rh:height,plateUnit:diffused});
  plateUnit=this.reflectedPass.draw(s,{rw:width,rh:height,plateUnit});
  const dropsUnit=(s.drops_amount||0)>0?this.drawDrops(s,{rw:width,rh:height,depth,invert,near,far,plateUnit}):plateUnit;
  const unit=this.drawDirt(s,{rw:width,rh:height,plateUnit:dropsUnit});
  this.resolveFrame(s,this.artisticFilters.draw(s.filters,{rw:width,rh:height,plateUnit:unit,blend:s.master_blend??1}),width,height);g.flush();
 }
 drawWave(s,{w,h,rw,rh,depthSettings,renderPass,samples}){
  const ghostGain=s.physical_ghosts?0:s.ghost_gain;
  if(!(ghostGain>0||s.diffraction_gain>0)||(s.master_blend??1)<=0||['base','coverage'].includes(s.highlight_view))return 6;
  const g=this.gl;
  const allocate=(unit,texture,fbo,width,height)=>{g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,texture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,width,height,0,g.RGBA,g.HALF_FLOAT,null);g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,texture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer de altas luzes desfocadas indisponível.');};
  if(this.waveSourceSize!==w+','+h){allocate(11,this.waveSource,this.waveSourceFbo,w,h);this.waveSourceSize=w+','+h;}
  g.activeTexture(g.TEXTURE11);g.bindTexture(g.TEXTURE_2D,this.waveSource);g.bindFramebuffer(g.FRAMEBUFFER,this.waveSourceFbo);g.viewport(0,0,w,h);g.useProgram(this.dirtExtractProgram);g.uniform1i(g.getUniformLocation(this.dirtExtractProgram,'plate'),4);g.uniform1f(g.getUniformLocation(this.dirtExtractProgram,'threshold'),.3);g.drawArrays(g.TRIANGLES,0,3);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);this.buildGaussianPyramid(w,h,this.waveSource,11);
  if(this.waveSize!==rw+','+rh){allocate(12,this.waveBlur,this.waveBlurFbo,rw,rh);allocate(5,this.waveMerged,this.waveMergedFbo,rw,rh);this.waveSize=rw+','+rh;}
  // Reuse the scene's exact pupil, creative modifiers, depth masks and occlusion.
  g.activeTexture(g.TEXTURE5);g.bindTexture(g.TEXTURE_2D,this.baseTexture);g.activeTexture(g.TEXTURE11);g.bindTexture(g.TEXTURE_2D,this.waveSource);g.useProgram(this.program);g.uniform1f(this.uniforms.masterBlend,1);g.uniform1f(this.uniforms.exposure,0);g.uniform1i(this.uniforms.sampleCount,samples);g.uniform1f(this.uniforms.footprint,s.bokeh_gain*w/s.sensor_mm*2.2/Math.sqrt(samples));
  renderPass(11,0,this.waveBlurFbo);
  g.activeTexture(g.TEXTURE12);g.bindTexture(g.TEXTURE_2D,this.waveBlur);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);this.buildGaussianPyramid(rw,rh,this.waveBlur,12);
  for(const [unit,tex]of [[6,this.renderTexture],[12,this.waveBlur],[5,this.waveMerged]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);}
  g.bindFramebuffer(g.FRAMEBUFFER,this.waveMergedFbo);g.viewport(0,0,rw,rh);g.useProgram(this.waveProgram);const loc=k=>g.getUniformLocation(this.waveProgram,k);
  g.uniform1i(loc('plate'),6);g.uniform1i(loc('blurredHighlights'),12);g.uniform2f(loc('imageSize'),rw,rh);g.uniform1i(loc('irisBlades'),s.blades);
  const airy=1.22*.00055*this.data.efl_mm/(2*s.iris_mm)*rw/s.sensor_mm;
  for(const [k,v]of Object.entries({ghostGain:ghostGain||0,diffractionGain:s.diffraction_gain||0,diffractionScale:s.diffraction_scale||1,irisRotation:(s.rotation||0)*Math.PI/180,airyRadius:airy,energy:(s.master_blend??1)*2**s.exposure}))g.uniform1f(loc(k),v);
  g.uniform4fv(loc('ghostPairs[0]'),new Float32Array([...(this.data.ghost_pairs||[]),[0,0,0,0],[0,0,0,0],[0,0,0,0]].slice(0,3).flat()));g.drawArrays(g.TRIANGLES,0,3);return 5;
 }
 resolveFrame(s,unit,width,height){
  const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,width,height);g.useProgram(this.resolve);g.uniform1i(this.resolveInput,unit);
  g.uniform1f(g.getUniformLocation(this.resolve,'vignetteAmount'),s.highlight_view==='coverage'?0:(s.vignette_amount||0)*(s.master_blend??1));
  const grid=this.data.grid,map=this.data.distortion?.throughput,center=Math.floor(grid/2);
  g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.illuminationTexture);
  if(this.illuminationData!==this.data){
   const at=(y,x)=>Array.isArray(map?.[1])?map[1][y][x]:map?.[grid*grid+y*grid+x];
   const pixels=new Float32Array(grid*grid*4),reference=at(center,center)||0;
   for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){const t=reference>0?Math.min(1,Math.max(0,(at(y,x)??reference)/reference)):1;pixels.set([t,t,t,1],(y*grid+x)*4);}
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,grid,grid,0,g.RGBA,g.FLOAT,pixels);this.illuminationData=this.data;
  }
  g.uniform1i(g.getUniformLocation(this.resolve,'illuminationMap'),1);g.uniform1f(g.getUniformLocation(this.resolve,'illuminationGrid'),grid);
  g.uniform1f(g.getUniformLocation(this.resolve,'edgeCompensationLimit'),s.edge_compensation_limit??3);
  g.uniform1f(g.getUniformLocation(this.resolve,'edgeCompensation'),s.highlight_view==='coverage'?0:(s.edge_compensation||0)/100*(s.master_blend??1));
  g.uniform1f(g.getUniformLocation(this.resolve,'imageAspect'),height/width);g.drawArrays(g.TRIANGLES,0,3);
  g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depthTexture);
 }
 async prepareDirtTexture(seed){seed=Math.max(1,Math.min(1000,Math.round(seed||1)));if(this.dirtProcSeed===seed)return;if(this.dirtProcLoading?.seed===seed)return this.dirtProcLoading.promise;
  const promise=(async()=>{await new Promise(r=>setTimeout(r,0));const bytes=LensDirtTexture.generate(seed);
   const g=this.gl;this.dirtProc??=g.createTexture();g.activeTexture(g.TEXTURE10);const saved=g.getParameter(g.TEXTURE_BINDING_2D);g.bindTexture(g.TEXTURE_2D,this.dirtProc);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);g.texImage2D(g.TEXTURE_2D,0,g.RGBA8,1024,1024,0,g.RGBA,g.UNSIGNED_BYTE,bytes);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.MIRRORED_REPEAT);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.MIRRORED_REPEAT);g.bindTexture(g.TEXTURE_2D,saved);this.dirtProcSeed=seed;})();
  this.dirtProcLoading={seed,promise};try{await promise;}finally{if(this.dirtProcLoading?.seed===seed)this.dirtProcLoading=null;}}
 async prepareDirt(data='',s=null){
  if(s&&(s.lens_dirt_amount||0)>0&&!data)try{await this.prepareDirtTexture(s.lens_dirt_seed);}catch(e){console.warn(e.message);}
  if(data===this.dirtKey)return;if(data===this.dirtLoadingKey&&this.dirtLoading)return this.dirtLoading;
  const revision=++this.dirtRequest;if(!data){this.dirtKey='';return;}
  this.dirtLoadingKey=data;this.dirtLoading=(async()=>{const image=new Image();image.src=data;await image.decode();if(image.width>512||image.height>512)throw Error('Textura Lens Dirt acima de 512 px.');if(revision!==this.dirtRequest)return;
   const g=this.gl;g.activeTexture(g.TEXTURE13);g.bindTexture(g.TEXTURE_2D,this.dirtMask);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,image);this.dirtKey=data;
  })();try{await this.dirtLoading;}finally{if(revision===this.dirtRequest){this.dirtLoading=null;this.dirtLoadingKey=null;}}
 }
 drawDirt(s,{rw,rh,plateUnit}){
  const strength=(s.lens_dirt_amount||0)*(s.master_blend??1);if(strength<=0||(s.highlight_view||'final')==='coverage')return plateUnit;
  const g=this.gl;g.activeTexture(g.TEXTURE0+plateUnit);const plate=g.getParameter(g.TEXTURE_BINDING_2D);
  // Highlight extraction precedes downsampling, preserving small bright lights.
  if(this.dirtSize!==rw+','+rh){for(const [unit,tex,fbo]of [[12,this.dirtOutput,this.dirtFbo],[14,this.dirtHigh,this.dirtHighFbo]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer Lens Dirt indisponível.');}this.dirtSize=rw+','+rh;}
  g.activeTexture(g.TEXTURE0+plateUnit);g.bindTexture(g.TEXTURE_2D,plate);
  if((s.lens_dirt_scatter??2)>0){g.bindFramebuffer(g.FRAMEBUFFER,this.dirtHighFbo);g.viewport(0,0,rw,rh);g.useProgram(this.dirtExtractProgram);g.uniform1i(g.getUniformLocation(this.dirtExtractProgram,'plate'),plateUnit);g.uniform1f(g.getUniformLocation(this.dirtExtractProgram,'threshold'),s.lens_dirt_threshold??.8);g.drawArrays(g.TRIANGLES,0,3);
   g.activeTexture(g.TEXTURE14);g.bindTexture(g.TEXTURE_2D,this.dirtHigh);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);this.buildGaussianPyramid(rw,rh,this.dirtHigh,14);}
  g.activeTexture(g.TEXTURE12);g.bindTexture(g.TEXTURE_2D,this.dirtOutput);g.activeTexture(g.TEXTURE13);g.bindTexture(g.TEXTURE_2D,this.dirtMask);g.activeTexture(g.TEXTURE14);g.bindTexture(g.TEXTURE_2D,this.dirtHigh);
  g.bindFramebuffer(g.FRAMEBUFFER,this.dirtFbo);g.viewport(0,0,rw,rh);g.useProgram(this.dirtProgram);const loc=k=>g.getUniformLocation(this.dirtProgram,k);
  g.uniform1i(loc('plate'),plateUnit);g.uniform1i(loc('highlights'),14);g.uniform1i(loc('dirtMask'),13);const procReady=!!this.dirtProc&&this.dirtProcSeed===Math.max(1,Math.min(1000,Math.round(s.lens_dirt_seed||1)));g.activeTexture(g.TEXTURE10);const savedUnit10=g.getParameter(g.TEXTURE_BINDING_2D);if(procReady)g.bindTexture(g.TEXTURE_2D,this.dirtProc);g.uniform1i(loc('dirtProc'),10);g.uniform1i(loc('hasProc'),procReady?1:0);g.uniform4f(loc('dirtMix'),s.lens_dirt_fingerprints??.7,s.lens_dirt_dust??.6,s.lens_dirt_scratches??.35,s.lens_dirt_fungus??0);{const iris=Number.isFinite(s.iris_mm)?s.iris_mm:8.55,frac=.0035*iris*(s.lens_dirt_defocus??1);g.uniform1f(loc('defocusLod'),Math.max(0,Math.log2(Math.max(1,frac*1024*(s.lens_dirt_scale??1)))));}g.uniform1i(loc('customMask'),!!s.lens_dirt_texture&&this.dirtKey===s.lens_dirt_texture?1:0);g.uniform2f(loc('imageSize'),...this.inputSize);
  const r=(s.lens_dirt_radius??120)/1080;for(const [k,v]of Object.entries({amount:strength,blockAmount:s.lens_dirt_block??.2,scatterAmount:s.lens_dirt_scatter??2,radius:r,scale:s.lens_dirt_scale??1,seed:s.lens_dirt_seed??1,rotation:(s.lens_dirt_rotation||0)*Math.PI/180,lod:Math.max(0,Math.log2(Math.max(1,r*rw*2.2/Math.sqrt(32))))}))g.uniform1f(loc(k),v);
  g.drawArrays(g.TRIANGLES,0,3);g.activeTexture(g.TEXTURE10);g.bindTexture(g.TEXTURE_2D,savedUnit10);return 12;
 }
 plane(m){const [a,b,c,d]=this.data.matrix;return this.data.last_z-(a+b/(m*1000))/(c+d/(m*1000));}
 preparePhysical(s){if(!this.baseData)return;const data=PhysicalDistortion.prepare(this.baseData,s);if(data!==this.data)this.setKernel(data);this.canvas.dispatchEvent(new CustomEvent('physicalmap',{detail:{data:this.baseData,settings:s,width:this.inputSize[0]}}));}
 draw(s,{limit=768,samples=32,aa=1,upscale=false,depth=false,invert=false,near=.8,far=10,linearOnly=false,external=false,stackBindings=null}={}){
  ({s,invert}=this.depthParameters(s,{near,far,invert,depth}));
  this.preparePhysical(s);
  this.cudaPixels=null;
  if(this.externalLayer!==external){this.externalLayer=external;this.sourceDirty=true;}
  if(!this.ready)return;samples=Math.max(1,Math.min(samples,this.data.taps));const g=this.gl;const [w,h]=this.inputSize;const scale=upscale?limit/Math.max(w,h):Math.min(1,limit/Math.max(w,h));const cw=Math.max(16,Math.round(w*scale)),ch=Math.max(16,Math.round(h*scale));const lim=this.glLimits??={tex:g.getParameter(g.MAX_TEXTURE_SIZE),vp:Array.from(g.getParameter(g.MAX_VIEWPORT_DIMS))};if(cw>lim.tex||ch>lim.tex||cw>lim.vp[0]||ch>lim.vp[1])throw Error('Resolução acima do limite desta GPU.');if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch;}g.viewport(0,0,cw,ch);g.useProgram(this.program);
  const split=(!!s.highlight_detail&&Math.min(s.highlight_quality||128,this.data.taps)>samples)||(s.highlight_view||'final')!=='final';this.recoveryEV=Math.max(0,Math.min(8,s.highlight_recovery||0));this.prepareLight(s.highlight_gain,s.highlight_threshold??.8,split,s.shimmer_threshold??.6);for(const [unit,tex]of [[4,this.lightTexture],[5,this.baseTexture],[10,this.highTexture],[11,this.lowTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);}g.viewport(0,0,cw,ch);g.useProgram(this.program);g.uniform1i(this.uniforms.sourceImage,4);
  for(const [unit,texture]of [[0,this.sourceTexture],[1,this.depthTexture],[2,this.rayTexture],[3,this.pupilTexture]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(unit===2||unit===3?g.TEXTURE_2D_ARRAY:g.TEXTURE_2D,texture);}
  g.uniform1i(this.uniforms.externalLayer,external?1:0);g.uniform1i(this.uniforms.occluderCount,stackBindings?.occluders.length||0);g.uniform1i(this.uniforms.externalGlitter,stackBindings?.glitter?1:0);
  const factor=aa===2?2:1,rw=cw*factor,rh=ch*factor;if(rw>lim.tex||rh>lim.tex||rw>lim.vp[0]||rh>lim.vp[1])throw Error('Resolução com antialiasing acima do limite desta GPU.');
  g.activeTexture(g.TEXTURE6);g.bindTexture(g.TEXTURE_2D,this.renderTexture);
  if(this.renderSize!==rw+','+rh){g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);this.renderSize=rw+','+rh;}
  g.bindFramebuffer(g.FRAMEBUFFER,this.renderFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.renderTexture,0);
  if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer de antialiasing indisponível.');g.viewport(0,0,rw,rh);
  const set=(k,v)=>g.uniform1f(this.uniforms[k]??null,v);g.uniform2f(this.uniforms.imageSize,w,h);g.uniform4fv(this.uniforms.matrix,this.data.matrix);set('gridSize',this.data.grid);
  set('footprint',s.bokeh_gain*w/s.sensor_mm*2.2/Math.sqrt(samples));set('irisMM',s.iris_mm);set('atlasIrisMM',this.data.iris_mm??s.iris_mm);set('irisMaxMM',this.data.max_iris_mm||8.55);
  set('shimmerAmount',s.shimmer_amount||0);set('shimmerDepth',s.shimmer_depth??1);set('shimmerSize',s.shimmer_size??8);set('shimmerDensity',s.shimmer_density??.3);set('shimmerSeed',s.shimmer_seed??1);set('shimmerThreshold',s.shimmer_threshold??.6);set('shimmerPrism',s.shimmer_prism??.25);g.uniform1i(this.uniforms.shimmerNormalize,s.shimmer_normalize===false?0:1);
  set('bokehDistortion',s.bokeh_distortion??0);set('bokehDistortionColor',s.bokeh_distortion_color??.25);
  set('textureRings',s.bokeh_texture_rings??0);set('textureGrain',s.bokeh_texture_grain??0);set('textureScale',s.bokeh_texture_scale??6);set('textureRotation',(s.bokeh_texture_rotation??0)*Math.PI/180);
  set('impression',s.impression??0);set('masterBlend',s.master_blend??1);set('apodization',s.apodization??0);set('rimGain',s.rim_gain??0);
  const values={foregroundBlur:s.foreground_blur??100,backgroundBlur:s.background_blur??100,focusPreservation:s.focus_preservation||0,focusWidth:s.focus_width??.1,focusDistance:s.focus_m,focusAnchor:0,lastZ:this.data.last_z,referenceZ:this.data.reference_z,sourceM:external?s.source_m:this.data.source_m,sourceFocus:this.plane(this.data.source_m),focusShift:s.ray_focus?this.data.focus_calibration?.shift_mm||0:0,sensorZ:this.plane(s.focus_m)+s.filmback_mm+(s.ray_focus?this.data.focus_calibration?.shift_mm||0:0),sensorMM:s.sensor_mm,bokehGain:s.bokeh_gain,highlightGain:s.highlight_gain,exposure:s.exposure,swirl:s.swirl,astigmatismMM:s.astigmatism_mm||0,coma:s.coma,squeeze:s.squeeze,diffusion:s.diffusion,spherical3:s.spherical3,spherical5:s.spherical5,nearM:near,farM:far,caRed:s.ca_red||0,caBlue:s.ca_blue||0,caAxial:s.ca_axial||0,k1:s.k1??0,k2:s.k2??0,p1:s.p1??0,p2:s.p2??0,ghostGain:s.physical_ghosts?0:s.ghost_gain||0,diffractionGain:s.diffraction_gain||0,diffractionScale:s.diffraction_scale||1,irisRotation:(s.rotation||0)*Math.PI/180,airyRadius:1.22*.00055*this.data.efl_mm/(2*s.iris_mm)*w/s.sensor_mm};for(const [k,v]of Object.entries(values))set(k,v);
  g.uniform1i(this.uniforms.irisBlades,s.blades);g.uniform4fv(this.uniforms['ghostPairs[0]'],new Float32Array(Array.from({length:3},(_,i)=>this.data.ghost_pairs[i]||[0,0,0,0]).flat()));
  g.uniform1i(this.uniforms.tapCount,this.data.taps);g.uniform1i(this.uniforms.sampleCount,samples);g.uniform1i(this.uniforms.hasDepth,depth?1:0);g.uniform1i(this.uniforms.invertDepth,invert?1:0);
  g.uniform1i(this.uniforms.softenInternalCutoff,s.soften_internal_cutoff===false?0:1);
  g.uniform1i(this.uniforms.depthChannel,['r','g','b','a','luma'].indexOf(s.depth_channel||'r'));g.uniform1i(this.uniforms.scalarDepth,this.scalarDepth?1:0);set('highlightThreshold',s.highlight_threshold??.8);set('ditherAmount',s.dither_amount??1);set('globalRayRadius',this.data.radius_mm);set('globalRaySlope',this.data.max_slope||0);g.uniform1i(this.uniforms.bokehDither,s.bokeh_dither?1:0);g.uniform1i(this.uniforms.highlightImage,10);g.uniform1i(this.uniforms.fullLightImage,4);g.uniform1i(this.uniforms.highlightCount,Math.min(this.data.taps,s.highlight_detail?Math.max(samples,s.highlight_quality||128):samples));g.uniform1i(this.uniforms.partMode,0);set('depthGain',s.depth_gain??1);set('depthBias',s.depth_bias??0);g.uniform1i(this.uniforms.sliceMode,0);g.uniform1i(this.uniforms.compositeMode,0);
  const ext=this.timerExt;if(ext&&this.query){const available=g.getQueryParameter(this.query,g.QUERY_RESULT_AVAILABLE);if(available){if(!g.getParameter(ext.GPU_DISJOINT_EXT))this.gpuMs=g.getQueryParameter(this.query,g.QUERY_RESULT)/1e6;g.deleteQuery(this.query);this.query=null;}}
  const measuring=!!(ext&&!this.query);if(measuring){this.query=g.createQuery();g.beginQuery(ext.TIME_ELAPSED_EXT,this.query);}const highCount=Math.min(this.data.taps,s.highlight_detail?Math.max(samples,s.highlight_quality||128):samples);
  const coverageFraction=split&&s.highlight_detail&&highCount>samples?this.estimateHighlightCoverage():0,denseHighlights=coverageFraction>=.65;
  if(denseHighlights){g.uniform1i(this.uniforms.sampleCount,highCount);set('footprint',s.bokeh_gain*w/s.sensor_mm*2.2/Math.sqrt(highCount));}
  const depthMode=DepthUtils.mode(s,this.depthBinary?.[this.scalarDepth?'r':s.depth_channel||'r']);const depthSettings={...s,depth_mode:depthMode};if(!['cut','slicing'].includes(s.depth_mode)&&depthMode==='cut'){depthSettings.depth_cut=.5;depthSettings.depth_feather=0;}
  set('focusAnchor',depthMode==='cut'?0:DepthUtils.focusAnchor(s,near,far));g.uniform1i(this.uniforms.eclipseBokeh,depth&&s.eclipse_bokeh?1:0);g.uniform1i(this.uniforms.eclipseCutMode,depthMode==='cut'?1:0);g.uniform1i(this.uniforms.eclipseSlices,Math.round(s.depth_slices||12));set('eclipseCut',depthSettings.depth_cut??.5);set('eclipseFeather',depthSettings.depth_feather??0);
  const renderPass=(unit,part,target)=>{stackBindings?.bind();g.bindFramebuffer(g.FRAMEBUFFER,target);g.viewport(0,0,rw,rh);g.useProgram(this.program);g.uniform1i(this.uniforms.sourceImage,unit);g.uniform1i(this.uniforms.partMode,part);if(depth)this.drawDepthLayers(depthSettings,{w,h,rw,rh,invert,near,far,sourceUnit:unit,outputFbo:target});else g.drawArrays(g.TRIANGLES,0,3);};
  if(split&&!(denseHighlights&&(s.highlight_view||'final')==='final')){if(this.passSize!==rw+','+rh){for(const [unit,tex,fbo]of [[12,this.lowPass,this.lowFbo],[13,this.highPass,this.highFbo]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA16F,rw,rh,0,g.RGBA,g.HALF_FLOAT,null);g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer de highlights indisponível.');}this.passSize=rw+','+rh;}renderPass(11,1,this.lowFbo);renderPass(10,2,this.highFbo);g.bindFramebuffer(g.FRAMEBUFFER,this.renderFbo);g.viewport(0,0,rw,rh);g.useProgram(this.highlightCombine);for(const [unit,tex]of [[12,this.lowPass],[13,this.highPass]]){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);}g.uniform1i(g.getUniformLocation(this.highlightCombine,'basePass'),12);g.uniform1i(g.getUniformLocation(this.highlightCombine,'highlightPass'),13);g.uniform1i(g.getUniformLocation(this.highlightCombine,'viewMode'),['final','highlights','base','coverage'].indexOf(s.highlight_view||'final'));g.drawArrays(g.TRIANGLES,0,3);}else renderPass(4,0,this.renderFbo);
  if(linearOnly){if(measuring)g.endQuery(ext.TIME_ELAPSED_EXT);g.flush();this.draws++;return {width:cw,height:ch,rw,rh,unit:6,samples,draws:this.draws,gpuMs:this.gpuMs,backend:'webgl-layers'};}
  const waveUnit=this.drawWave(s,{w,h,rw,rh,depth,invert,near,far,depthSettings,renderPass,samples:highCount});
  const diffused=(s.diffusion||0)>0?this.drawDiffusion(s,{rw,rh,plateUnit:waveUnit}):waveUnit;let plateUnit=this.physicalPass.draw(s,{rw,rh,plateUnit:diffused});plateUnit=this.reflectedPass.draw(s,{rw,rh,plateUnit});
  const dropsUnit=(s.drops_amount||0)>0?this.drawDrops(s,{rw,rh,depth,invert,near,far,plateUnit}):plateUnit;
  const resolveUnit=this.drawDirt(s,{rw,rh,plateUnit:dropsUnit});
  // Bilinear resolve averages the four subpixels in linear HDR before sRGB.
  this.resolveFrame(s,this.artisticFilters.draw(s.filters,{rw,rh,plateUnit:resolveUnit,blend:s.master_blend??1}),cw,ch);
  if(measuring)g.endQuery(ext.TIME_ELAPSED_EXT);g.flush();this.draws++;
  return {width:cw,height:ch,gpuMs:this.gpuMs,draws:this.draws,samples:denseHighlights?highCount:samples,highlightSamples:split?highCount:samples,highlightCoverage:coverageFraction,highlightFallback:denseHighlights,depthMode:depth?depthMode:null,taps:this.data.taps};
 }
}
window.LensGPU=LensGPU;

// 1.2.9: evita chamadas síncronas repetidas ao processo da GPU a cada quadro.
// Locais de uniform são estáveis após o link; a completude de um framebuffer só muda
// quando seus anexos ou o armazenamento da textura anexada mudam.
LensGPU.cacheState=function(g){if(g.__opticaCached)return;g.__opticaCached=true;
 const gul=g.getUniformLocation.bind(g),link=g.linkProgram.bind(g),locs=new WeakMap();
 g.getUniformLocation=(p,n)=>{let m=locs.get(p);if(!m){m=new Map();locs.set(p,m);}if(!m.has(n))m.set(n,gul(p,n));return m.get(n);};
 g.linkProgram=p=>{locs.delete(p);link(p);};
 const cfs=g.checkFramebufferStatus.bind(g),bft=g.framebufferTexture2D.bind(g),bfr=g.framebufferRenderbuffer.bind(g),bfb=g.bindFramebuffer.bind(g),bt=g.bindTexture.bind(g),at=g.activeTexture.bind(g),ti=g.texImage2D.bind(g),ts=g.texStorage2D.bind(g);
 let fbo=null,unit=g.TEXTURE0;const bound=new Map(),ver=new WeakMap(),att=new WeakMap(),ok=new WeakMap(),opaque=new WeakSet();
 g.activeTexture=u=>{unit=u;at(u);};
 g.bindTexture=(t,tex)=>{if(t===g.TEXTURE_2D)bound.set(unit,tex);bt(t,tex);};
 const bump=t=>{if(t===g.TEXTURE_2D){const tex=bound.get(unit);if(tex)ver.set(tex,(ver.get(tex)||0)+1);}};
 g.texImage2D=(...a)=>{bump(a[0]);return ti(...a);};
 g.texStorage2D=(...a)=>{bump(a[0]);return ts(...a);};
 g.bindFramebuffer=(t,f)=>{if(t===g.FRAMEBUFFER||t===g.DRAW_FRAMEBUFFER)fbo=f;bfb(t,f);};
 g.framebufferTexture2D=(t,a,tt,tex,level)=>{if(fbo){if(a===g.COLOR_ATTACHMENT0&&tt===g.TEXTURE_2D)att.set(fbo,tex?[tex,level]:null);else opaque.add(fbo);}bft(t,a,tt,tex,level);};
 g.framebufferRenderbuffer=(...a)=>{if(fbo)opaque.add(fbo);bfr(...a);};
 g.checkFramebufferStatus=t=>{const a=fbo&&!opaque.has(fbo)&&att.get(fbo);if(!a)return cfs(t);const sig=(ver.get(a[0])||0)+':'+a[1];let m=ok.get(fbo);if(m&&m.get(a[0])===sig)return g.FRAMEBUFFER_COMPLETE;const status=cfs(t);if(status===g.FRAMEBUFFER_COMPLETE){if(!m){m=new WeakMap();ok.set(fbo,m);}m.set(a[0],sig);}return status;};
};
