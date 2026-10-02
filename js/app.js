(()=>{var dd=Object.defineProperty;var zs=(n,t,e)=>()=>{if(e)throw e[0];try{return n&&(t=n(n=0)),t}catch(i){throw e=[i],i}};var fd=(n,t)=>{for(var e in t)dd(n,e,{get:t[e],enumerable:!0})};function xi(n){let t=ss[n],e=0,i=t.rows.map(r=>{let a={R:r[0]==="stop"?0:r[0],stop:r[0]==="stop",z:e,n:r[2],V:r[3],sd:r[4]/2};return e+=r[1],a}),s={key:n,name:t.name,note:t.note,blades:t.blades,S:i};if(t.scaleTo){let r=yi(s).efl,a=t.scaleTo/r;i.forEach(o=>{o.R*=a,o.z*=a,o.sd*=a})}return s}function To(n){return{...n,S:n.S.map(t=>({...t}))}}function Kc(n,t,e,i){return n===1||!t?n:n+(n-1)/t*pd[e]*i}function yi(n,t=1/0,e=1,i=1){let s=n.S,r=1,a=isFinite(t)?1/t:0,o=1,c=1;for(let u=0;u<s.length;u++){let d=s[u];d.stop&&(c=r);let p=d.stop?o:Kc(d.n,d.V,e,i),g=d.R?1/d.R:0;a=(o*a-r*g*(p-o))/p,o=p,u<s.length-1&&(r+=a*(s[u+1].z-d.z))}let l=-r/a,h=isFinite(t)?NaN:-1/a;return{bfd:l,efl:h,yStop:c,u:a}}function jn(n){let t=yi(n),e=n.S.find(s=>s.stop),i=e?2*e.sd/Math.abs(t.yStop):2*n.S[0].sd;return{efl:t.efl,bfdInf:t.bfd,fMin:t.efl/i,yStop:t.yStop,stop:e}}function md(n,t,e,i,s,r){let a=n*n+t*t;if(a>e*e)return!1;if(i<3||r>=1||e>=Qc*.995)return!0;let o=2*Math.PI/i,c=Math.atan2(t,n)-s;c=(c%o+o)%o-o/2;let l=e*Math.cos(Math.PI/i)/Math.cos(c);return Math.sqrt(a)<=l+(e-l)*r}function Qn(n,t,e,i,s,r,a,o,c,l,h,u){let d=n.S,p=1;h&&h.push(s,i);for(let _=0;_<d.length;_++){let f=d[_],m=f.z+t.shift,x,v,M,R,A=0,T=0,k=-1;if(f.R===0){if(x=(m-s)/o,x<0)return!1;v=e+x*r,M=i+x*a,R=m}else{let S=m+f.R,w=s-S,I=e*r+i*a+w*o,q=e*e+i*i+w*w-f.R*f.R,Q=I*I-q;if(Q<0)return!1;let L=Math.sqrt(Q);if(x=f.R>0?-I-L:-I+L,x<0)return!1;v=e+x*r,M=i+x*a,R=s+x*o,A=v/f.R,T=M/f.R,k=(R-S)/f.R}if(h&&h.push(R,M),f.stop){if(Qc=f.sd,!md(v,M,t.stopR,t.blades,t.bladeRot,t.round))return!1}else if(v*v+M*M>f.sd*f.sd)return!1;if(!f.stop){let S=Kc(f.n,f.V,c,t.disp);if(S!==p){let w=-(A*r+T*a+k*o),I=p/S,q=1-I*I*(1-w*w);if(q<0)return!1;let Q=I*w-Math.sqrt(q);r=I*r+Q*A,a=I*a+Q*T,o=I*o+Q*k,p=S}}e=v,i=M,s=R}if(o<=0)return!1;let g=(t.zSensor-s)/o;if(l[0]=e+g*r,l[1]=i+g*a,h){let _=u!=null?u:t.zSensor,f=(_-s)/o;h.push(_,i+f*a)}return!0}function jc(n,t){return yi(n,t).bfd}function ti(n,t,e){let i=n.S[n.S.length-1].z,s=0;for(let r=0;r<8;r++){let a=e-t-s;if(a<=1)return null;s=i+jc(n,a)-t}return s}function tl(n,t,e){let i=n.S[n.S.length-1].z,s=h=>i-e+jc(n,h-t-e)-t,r=yi(n).efl,a=t+e+Math.abs(r)*1.05+5,o=1e8,c=s(a);if(s(o)>0)return 1/0;if(c<0||!isFinite(c))return NaN;for(let h=0;h<70;h++){let u=Math.sqrt(a*o);s(u)>0?a=u:o=u}return Math.sqrt(a*o)}function rs(n,t,e,i,s,r,a=[0,1,2]){let o=-t.shift,c=t.zSensor-i,l=s/e.efl,h=(i-t.zSensor)*l,u=t.shift,d=new Float64Array(2),p=n.S[0].sd*1.12,g=0,_=0,f=0,m=[],x=420;for(let w=0;w<x;w++){let I=p*Math.sqrt((w+.5)/x),q=w*Jc,Q=I*Math.cos(q),L=I*Math.sin(q),N=Q,W=L-h,$=u-c,G=Math.hypot(N,W,$);N/=G,W/=G,$/=G,Qn(n,t,0,h,c,N,W,$,1,d)&&(m.push(Q,L),g+=Q,_+=L,f++)}let v={hits:[[],[],[]],w:0,cx:0,cy:0,count:0};if(!f)return v;let M=g/f,R=_/f,A=0;for(let w=0;w<m.length;w+=2)A=Math.max(A,Math.hypot(m[w]-M,m[w+1]-R));A=A+p*.09+.05,v.w=Math.PI*A*A/r;let T=0,k=0,S=0;for(let w of a){let I=v.hits[w];for(let q=0;q<r;q++){let Q=A*Math.sqrt((q+.5)/r),L=q*Jc,N=M+Q*Math.cos(L),W=R+Q*Math.sin(L),$=N,G=W-h,X=u-c,K=Math.hypot($,G,X);$/=K,G/=K,X/=K,Qn(n,t,0,h,c,$,G,X,w,d)&&(I.push(d[0],d[1]),w===1&&(T+=d[0],k+=d[1],S++))}}if(!S)for(let w of a){let I=v.hits[w];for(let q=0;q<I.length;q+=2)T+=I[q],k+=I[q+1],S++}return v.count=S,v.cx=S?T/S:0,v.cy=S?k/S:0,v}function ks(n,t,e=260){let i=n.cy<-1e-6?-1:1,s=0;for(let h=0;h<3;h++){let u=n.hits[h];for(let d=0;d<u.length;d+=2)s=Math.max(s,Math.abs(u[d]-n.cx),Math.abs(u[d+1]-n.cy))}let r=t,a=Math.ceil(s*r)+3;2*a+1>e&&(r=(e/2-3)/s,a=Math.floor(e/2));let o=2*a+1,c=[new Float32Array(o*o),new Float32Array(o*o),new Float32Array(o*o)];for(let h=0;h<3;h++){let u=n.hits[h],d=c[h];for(let p=0;p<u.length;p+=2){let g=(u[p]-n.cx)*r+a,_=(u[p+1]-n.cy)*i*r+a,f=Math.floor(g),m=Math.floor(_),x=g-f,v=_-m;if(f<0||m<0||f>=o-1||m>=o-1)continue;let M=m*o+f;d[M]+=(1-x)*(1-v),d[M+1]+=x*(1-v),d[M+o]+=(1-x)*v,d[M+o+1]+=x*v}}let l=r<t?1:2;for(let h=0;h<3;h++)for(let u=0;u<l;u++)c[h]=gd(c[h],o);return{A:c,size:o,half:a,scale:r,upscale:t/r}}function gd(n,t){let e=new Float32Array(n.length);for(let i=1;i<t-1;i++)for(let s=1;s<t-1;s++){let r=i*t+s;e[r]=(n[r]*4+n[r-1]*2+n[r+1]*2+n[r-t]*2+n[r+t]*2+n[r-t-1]+n[r-t+1]+n[r+t-1]+n[r+t+1])/16}return e}function Hs(n,t,e,i){let s=i||document.createElement("canvas");s.width=s.height=n.size;let r=s.getContext("2d"),a=r.createImageData(n.size,n.size),o=a.data,c=e*n.upscale*n.upscale;for(let l=0,h=0;l<n.A[0].length;l++,h+=4)o[h]=Math.min(255,n.A[0][l]*c*t[0]),o[h+1]=Math.min(255,n.A[1][l]*c*t[1]),o[h+2]=Math.min(255,n.A[2][l]*c*t[2]),o[h+3]=255;return r.putImageData(a,0,0),s}function Pn(n){let t=n>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var ss,pd,Qc,Jc,Vs=zs(()=>{ss={dgauss:{name:"Double-Gauss 50 mm",note:"Prescri\xE7\xE3o p\xFAblica (LensSim / PBRT, MIT). Base cl\xE1ssica de 50 mm normais.",blades:7,rows:[[29.475,3.76,1.67,47.1,25.2],[84.83,.12,1,0,25.2],[19.275,4.025,1.67,47.1,23],[40.77,3.275,1.699,30.1,23],[12.75,5.705,1,0,18],["stop",4.5,1,0,17.1],[-14.495,1.18,1.603,38,17],[40.77,6.065,1.658,50.9,20],[-20.385,.19,1,0,20],[437.065,3.22,1.717,48,20],[-39.73,0,1,0,20]]},triplet:{name:"Cooke Triplet 50 mm",note:"Fam\xEDlia de tr\xEAs elementos (1893). Estudo did\xE1tico escalado.",blades:6,rows:[[19.787,2,1.6116,58.8,15],[-112.035,2.2,1,0,15],[-20.651,1,1.62,36.3,11],[21.56,1.3,1,0,11],["stop",3.45,1,0,10.4],[327.716,2,1.6116,58.8,13],[-16.7,0,1,0,13]],scaleTo:50},petzval:{name:"Petzval 85 mm",note:"Retrato do s\xE9c. XIX: centro n\xEDtido, campo curvo e swirl. Estudo did\xE1tico.",blades:12,rows:[[49.706,5.8,1.5168,64.2,32],[-46.57,1.5,1.649,33.8,32],[470.353,12,1,0,32],["stop",12,1,0,27],[96.265,1.5,1.649,33.8,26],[38.992,.8,1,0,26],[43.225,4.5,1.5168,64.2,26],[-114.571,0,1,0,26]],scaleTo:85},singlet:{name:"Lente simples 50 mm",note:"Um \xFAnico vidro plano-convexo: aberra\xE7\xE3o esf\xE9rica e crom\xE1tica sem corre\xE7\xE3o.",blades:5,rows:[["stop",4,1,0,16],[26,5.5,1.5168,64.2,26],[0,0,1,0,26]]}};pd=[-.31,0,.69];Qc=1/0;Jc=Math.PI*(3-Math.sqrt(5))});function ts(){let n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ae[n&255]+Ae[n>>8&255]+Ae[n>>16&255]+Ae[n>>24&255]+"-"+Ae[t&255]+Ae[t>>8&255]+"-"+Ae[t>>16&15|64]+Ae[t>>24&255]+"-"+Ae[e&63|128]+Ae[e>>8&255]+"-"+Ae[e>>16&255]+Ae[e>>24&255]+Ae[i&255]+Ae[i>>8&255]+Ae[i>>16&255]+Ae[i>>24&255]).toLowerCase()}function we(n,t,e){return Math.max(t,Math.min(e,n))}function fp(n,t){return(n%t+t)%t}function ua(n,t,e){return(1-e)*n+e*t}function Rh(n){return(n&n-1)===0&&n!==0}function $a(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function hs(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function ze(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}function Hu(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Fr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function pp(){let n=Fr("canvas");return n.style.display="block",n}function gs(n){n in Ch||(Ch[n]=!0,console.warn(n))}function Vi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function fa(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}function pa(n){return typeof HTMLImageElement!="undefined"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&n instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&n instanceof ImageBitmap?Br.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}function ga(n,t,e,i,s){for(let r=0,a=n.length-3;r<=a;r+=3){ni.fromArray(n,r);let o=s.x*Math.abs(ni.x)+s.y*Math.abs(ni.y)+s.z*Math.abs(ni.z),c=t.dot(ni),l=e.dot(ni),h=i.dot(ni);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}function wa(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}function Rp(n,t,e,i,s,r,a,o){let c;if(t.side===Pe?c=i.intersectTriangle(a,r,s,!0,o):c=i.intersectTriangle(s,r,a,t.side===Wn,o),c===null)return null;pr.copy(o),pr.applyMatrix4(n.matrixWorld);let l=e.ray.origin.distanceTo(pr);return l<e.near||l>e.far?null:{distance:l,point:pr.clone(),object:n}}function mr(n,t,e,i,s,r,a,o,c,l){n.getVertexPosition(o,Ii),n.getVertexPosition(c,Di),n.getVertexPosition(l,Ui);let h=Rp(n,t,e,i,Ii,Di,Ui,fr);if(h){s&&(hr.fromBufferAttribute(s,o),ur.fromBufferAttribute(s,c),dr.fromBufferAttribute(s,l),h.uv=ci.getInterpolation(fr,Ii,Di,Ui,hr,ur,dr,new ft)),r&&(hr.fromBufferAttribute(r,o),ur.fromBufferAttribute(r,c),dr.fromBufferAttribute(r,l),h.uv1=ci.getInterpolation(fr,Ii,Di,Ui,hr,ur,dr,new ft),h.uv2=h.uv1),a&&(Vh.fromBufferAttribute(a,o),Gh.fromBufferAttribute(a,c),Wh.fromBufferAttribute(a,l),h.normal=ci.getInterpolation(fr,Ii,Di,Ui,Vh,Gh,Wh,new P),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:c,c:l,normal:new P,materialIndex:0};ci.getNormal(Ii,Di,Ui,u.normal),h.face=u}return h}function Yi(n){let t={};for(let e in n){t[e]={};for(let i in n[e]){let s=n[e][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=s.clone():Array.isArray(s)?t[e][i]=s.slice():t[e][i]=s}}return t}function Oe(n){let t={};for(let e=0;e<n.length;e++){let i=Yi(n[e]);for(let s in i)t[s]=i[s]}return t}function Cp(n){let t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Gu(n){return n.getRenderTarget()===null?n.outputColorSpace:Kt.workingColorSpace}function Wu(){let n=null,t=!1,e=null,i=null;function s(r,a){e(r,a),i=n.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(s),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){n=r}}}function Np(n,t){let e=t.isWebGL2,i=new WeakMap;function s(l,h){let u=l.array,d=l.usage,p=u.byteLength,g=n.createBuffer();n.bindBuffer(h,g),n.bufferData(h,u,d),l.onUploadCallback();let _;if(u instanceof Float32Array)_=n.FLOAT;else if(u instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(e)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(u instanceof Int16Array)_=n.SHORT;else if(u instanceof Uint32Array)_=n.UNSIGNED_INT;else if(u instanceof Int32Array)_=n.INT;else if(u instanceof Int8Array)_=n.BYTE;else if(u instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:_,bytesPerElement:u.BYTES_PER_ELEMENT,version:l.version,size:p}}function r(l,h,u){let d=h.array,p=h._updateRange,g=h.updateRanges;if(n.bindBuffer(u,l),p.count===-1&&g.length===0&&n.bufferSubData(u,0,d),g.length!==0){for(let _=0,f=g.length;_<f;_++){let m=g[_];e?n.bufferSubData(u,m.start*d.BYTES_PER_ELEMENT,d,m.start,m.count):n.bufferSubData(u,m.start*d.BYTES_PER_ELEMENT,d.subarray(m.start,m.start+m.count))}h.clearUpdateRanges()}p.count!==-1&&(e?n.bufferSubData(u,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):n.bufferSubData(u,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),h.onUploadCallback()}function a(l){return l.isInterleavedBufferAttribute&&(l=l.data),i.get(l)}function o(l){l.isInterleavedBufferAttribute&&(l=l.data);let h=i.get(l);h&&(n.deleteBuffer(h.buffer),i.delete(l))}function c(l,h){if(l.isGLBufferAttribute){let d=i.get(l);(!d||d.version<l.version)&&i.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);let u=i.get(l);if(u===void 0)i.set(l,s(l,h));else if(u.version<l.version){if(u.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,l,h),u.version=l.version}}return{get:a,remove:o,update:c}}function m0(n,t,e,i,s,r,a){let o=new Ft(0),c=r===!0?0:1,l,h,u=null,d=0,p=null;function g(f,m){let x=!1,v=m.isScene===!0?m.background:null;v&&v.isTexture&&(v=(m.backgroundBlurriness>0?e:t).get(v)),v===null?_(o,c):v&&v.isColor&&(_(v,1),x=!0);let M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,a):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||x)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),v&&(v.isCubeTexture||v.mapping===uo)?(h===void 0&&(h=new $t(new pi(1,1,1),new Je({name:"BackgroundCubeMaterial",uniforms:Yi(fn.backgroundCube.uniforms),vertexShader:fn.backgroundCube.vertexShader,fragmentShader:fn.backgroundCube.fragmentShader,side:Pe,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),h.material.uniforms.envMap.value=v,h.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,h.material.toneMapped=Kt.getTransfer(v.colorSpace)!==se,(u!==v||d!==v.version||p!==n.toneMapping)&&(h.material.needsUpdate=!0,u=v,d=v.version,p=n.toneMapping),h.layers.enableAll(),f.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new $t(new Zi(2,2),new Je({name:"BackgroundMaterial",uniforms:Yi(fn.background.uniforms),vertexShader:fn.background.vertexShader,fragmentShader:fn.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,l.material.toneMapped=Kt.getTransfer(v.colorSpace)!==se,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||p!==n.toneMapping)&&(l.material.needsUpdate=!0,u=v,d=v.version,p=n.toneMapping),l.layers.enableAll(),f.unshift(l,l.geometry,l.material,0,0,null))}function _(f,m){f.getRGB(_r,Gu(n)),i.buffers.color.setClear(_r.r,_r.g,_r.b,m,a)}return{getClearColor:function(){return o},setClearColor:function(f,m=1){o.set(f),c=m,_(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(f){c=f,_(o,c)},render:g}}function g0(n,t,e,i){let s=n.getParameter(n.MAX_VERTEX_ATTRIBS),r=i.isWebGL2?null:t.get("OES_vertex_array_object"),a=i.isWebGL2||r!==null,o={},c=f(null),l=c,h=!1;function u(L,N,W,$,G){let X=!1;if(a){let K=_($,W,N);l!==K&&(l=K,p(l.object)),X=m(L,$,W,G),X&&x(L,$,W,G)}else{let K=N.wireframe===!0;(l.geometry!==$.id||l.program!==W.id||l.wireframe!==K)&&(l.geometry=$.id,l.program=W.id,l.wireframe=K,X=!0)}G!==null&&e.update(G,n.ELEMENT_ARRAY_BUFFER),(X||h)&&(h=!1,k(L,N,W,$),G!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function d(){return i.isWebGL2?n.createVertexArray():r.createVertexArrayOES()}function p(L){return i.isWebGL2?n.bindVertexArray(L):r.bindVertexArrayOES(L)}function g(L){return i.isWebGL2?n.deleteVertexArray(L):r.deleteVertexArrayOES(L)}function _(L,N,W){let $=W.wireframe===!0,G=o[L.id];G===void 0&&(G={},o[L.id]=G);let X=G[N.id];X===void 0&&(X={},G[N.id]=X);let K=X[$];return K===void 0&&(K=f(d()),X[$]=K),K}function f(L){let N=[],W=[],$=[];for(let G=0;G<s;G++)N[G]=0,W[G]=0,$[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:W,attributeDivisors:$,object:L,attributes:{},index:null}}function m(L,N,W,$){let G=l.attributes,X=N.attributes,K=0,tt=W.getAttributes();for(let rt in tt)if(tt[rt].location>=0){let Y=G[rt],ht=X[rt];if(ht===void 0&&(rt==="instanceMatrix"&&L.instanceMatrix&&(ht=L.instanceMatrix),rt==="instanceColor"&&L.instanceColor&&(ht=L.instanceColor)),Y===void 0||Y.attribute!==ht||ht&&Y.data!==ht.data)return!0;K++}return l.attributesNum!==K||l.index!==$}function x(L,N,W,$){let G={},X=N.attributes,K=0,tt=W.getAttributes();for(let rt in tt)if(tt[rt].location>=0){let Y=X[rt];Y===void 0&&(rt==="instanceMatrix"&&L.instanceMatrix&&(Y=L.instanceMatrix),rt==="instanceColor"&&L.instanceColor&&(Y=L.instanceColor));let ht={};ht.attribute=Y,Y&&Y.data&&(ht.data=Y.data),G[rt]=ht,K++}l.attributes=G,l.attributesNum=K,l.index=$}function v(){let L=l.newAttributes;for(let N=0,W=L.length;N<W;N++)L[N]=0}function M(L){R(L,0)}function R(L,N){let W=l.newAttributes,$=l.enabledAttributes,G=l.attributeDivisors;W[L]=1,$[L]===0&&(n.enableVertexAttribArray(L),$[L]=1),G[L]!==N&&((i.isWebGL2?n:t.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](L,N),G[L]=N)}function A(){let L=l.newAttributes,N=l.enabledAttributes;for(let W=0,$=N.length;W<$;W++)N[W]!==L[W]&&(n.disableVertexAttribArray(W),N[W]=0)}function T(L,N,W,$,G,X,K){K===!0?n.vertexAttribIPointer(L,N,W,G,X):n.vertexAttribPointer(L,N,W,$,G,X)}function k(L,N,W,$){if(i.isWebGL2===!1&&(L.isInstancedMesh||$.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;v();let G=$.attributes,X=W.getAttributes(),K=N.defaultAttributeValues;for(let tt in X){let rt=X[tt];if(rt.location>=0){let V=G[tt];if(V===void 0&&(tt==="instanceMatrix"&&L.instanceMatrix&&(V=L.instanceMatrix),tt==="instanceColor"&&L.instanceColor&&(V=L.instanceColor)),V!==void 0){let Y=V.normalized,ht=V.itemSize,_t=e.get(V);if(_t===void 0)continue;let gt=_t.buffer,Rt=_t.type,Ut=_t.bytesPerElement,Tt=i.isWebGL2===!0&&(Rt===n.INT||Rt===n.UNSIGNED_INT||V.gpuType===Lu);if(V.isInterleavedBufferAttribute){let Yt=V.data,O=Yt.stride,me=V.offset;if(Yt.isInstancedInterleavedBuffer){for(let yt=0;yt<rt.locationSize;yt++)R(rt.location+yt,Yt.meshPerAttribute);L.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=Yt.meshPerAttribute*Yt.count)}else for(let yt=0;yt<rt.locationSize;yt++)M(rt.location+yt);n.bindBuffer(n.ARRAY_BUFFER,gt);for(let yt=0;yt<rt.locationSize;yt++)T(rt.location+yt,ht/rt.locationSize,Rt,Y,O*Ut,(me+ht/rt.locationSize*yt)*Ut,Tt)}else{if(V.isInstancedBufferAttribute){for(let Yt=0;Yt<rt.locationSize;Yt++)R(rt.location+Yt,V.meshPerAttribute);L.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=V.meshPerAttribute*V.count)}else for(let Yt=0;Yt<rt.locationSize;Yt++)M(rt.location+Yt);n.bindBuffer(n.ARRAY_BUFFER,gt);for(let Yt=0;Yt<rt.locationSize;Yt++)T(rt.location+Yt,ht/rt.locationSize,Rt,Y,ht*Ut,ht/rt.locationSize*Yt*Ut,Tt)}}else if(K!==void 0){let Y=K[tt];if(Y!==void 0)switch(Y.length){case 2:n.vertexAttrib2fv(rt.location,Y);break;case 3:n.vertexAttrib3fv(rt.location,Y);break;case 4:n.vertexAttrib4fv(rt.location,Y);break;default:n.vertexAttrib1fv(rt.location,Y)}}}}A()}function S(){q();for(let L in o){let N=o[L];for(let W in N){let $=N[W];for(let G in $)g($[G].object),delete $[G];delete N[W]}delete o[L]}}function w(L){if(o[L.id]===void 0)return;let N=o[L.id];for(let W in N){let $=N[W];for(let G in $)g($[G].object),delete $[G];delete N[W]}delete o[L.id]}function I(L){for(let N in o){let W=o[N];if(W[L.id]===void 0)continue;let $=W[L.id];for(let G in $)g($[G].object),delete $[G];delete W[L.id]}}function q(){Q(),h=!0,l!==c&&(l=c,p(l.object))}function Q(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:u,reset:q,resetDefaultState:Q,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfProgram:I,initAttributes:v,enableAttribute:M,disableUnusedAttributes:A}}function _0(n,t,e,i){let s=i.isWebGL2,r;function a(h){r=h}function o(h,u){n.drawArrays(r,h,u),e.update(u,r,1)}function c(h,u,d){if(d===0)return;let p,g;if(s)p=n,g="drawArraysInstanced";else if(p=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](r,h,u,d),e.update(u,r,d)}function l(h,u,d){if(d===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d;g++)this.render(h[g],u[g]);else{p.multiDrawArraysWEBGL(r,h,0,u,0,d);let g=0;for(let _=0;_<d;_++)g+=u[_];e.update(g,r,1)}}this.setMode=a,this.render=o,this.renderInstances=c,this.renderMultiDraw=l}function v0(n,t,e){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){let T=t.get("EXT_texture_filter_anisotropic");i=n.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(T){if(T==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let a=typeof WebGL2RenderingContext!="undefined"&&n.constructor.name==="WebGL2RenderingContext",o=e.precision!==void 0?e.precision:"highp",c=r(o);c!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",c,"instead."),o=c);let l=a||t.has("WEBGL_draw_buffers"),h=e.logarithmicDepthBuffer===!0,u=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),f=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),m=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),v=d>0,M=a||t.has("OES_texture_float"),R=v&&M,A=a?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:l,getMaxAnisotropy:s,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:f,maxVaryings:m,maxFragmentUniforms:x,vertexTextures:v,floatFragmentTextures:M,floatVertexTextures:R,maxSamples:A}}function x0(n){let t=this,e=null,i=0,s=!1,r=!1,a=new En,o=new qt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let p=u.length!==0||d||i!==0||s;return s=d,i=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,p){let g=u.clippingPlanes,_=u.clipIntersection,f=u.clipShadows,m=n.get(u);if(!s||g===null||g.length===0||r&&!f)r?h(null):l();else{let x=r?0:i,v=x*4,M=m.clippingState||null;c.value=M,M=h(g,d,v,p);for(let R=0;R!==v;++R)M[R]=e[R];m.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(u,d,p,g){let _=u!==null?u.length:0,f=null;if(_!==0){if(f=c.value,g!==!0||f===null){let m=p+_*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(f===null||f.length<m)&&(f=new Float32Array(m));for(let v=0,M=p;v!==_;++v,M+=4)a.copy(u[v]).applyMatrix4(x,o),a.normal.toArray(f,M),f[M+3]=a.constant}c.value=f,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,f}}function y0(n){let t=new WeakMap;function e(a,o){return o===Ga?a.mapping=Wi:o===Wa&&(a.mapping=Xi),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===Ga||o===Wa)if(t.has(a)){let c=t.get(a).texture;return e(c,a.mapping)}else{let c=a.image;if(c&&c.height>0){let l=new ja(c.height/2);return l.fromEquirectangularTexture(n,a),t.set(a,l),a.addEventListener("dispose",s),e(l.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let c=t.get(o);c!==void 0&&(t.delete(o),c.dispose())}function r(){t=new WeakMap}return{get:i,dispose:r}}function M0(n){let t=[],e=[],i=[],s=n,r=n-Bi+1+Xh.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let c=1/o;a>n-Bi?c=Xh[a-n+Bi-1]:a===0&&(c=0),i.push(c);let l=1/(o-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,g=6,_=3,f=2,m=1,x=new Float32Array(_*g*p),v=new Float32Array(f*g*p),M=new Float32Array(m*g*p);for(let A=0;A<p;A++){let T=A%3*2/3-1,k=A>2?0:-1,S=[T,k,0,T+2/3,k,0,T+2/3,k+1,0,T,k,0,T+2/3,k+1,0,T,k+1,0];x.set(S,_*g*A),v.set(d,f*g*A);let w=[A,A,A,A,A,A];M.set(w,m*g*A)}let R=new De;R.setAttribute("position",new Le(x,_)),R.setAttribute("uv",new Le(v,f)),R.setAttribute("faceIndex",new Le(M,m)),t.push(R),s>Bi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Zh(n,t,e){let i=new An(n,t,e);return i.texture.mapping=uo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function vr(n,t,e,i,s){n.viewport.set(t,e,i,s),n.scissor.set(t,e,i,s)}function S0(n,t,e){let i=new Float32Array(ai),s=new P(0,1,0);return new Je({name:"SphericalGaussianBlur",defines:{n:ai,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Hn,depthTest:!1,depthWrite:!1})}function $h(){return new Je({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Hn,depthTest:!1,depthWrite:!1})}function Jh(){return new Je({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Hn,depthTest:!1,depthWrite:!1})}function Oc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function b0(n){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){let c=o.mapping,l=c===Ga||c===Wa,h=c===Wi||c===Xi;if(l||h)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let u=t.get(o);return e===null&&(e=new $i(n)),u=l?e.fromEquirectangular(o,u):e.fromCubemap(o,u),t.set(o,u),u.texture}else{if(t.has(o))return t.get(o).texture;{let u=o.image;if(l&&u&&u.height>0||h&&u&&s(u)){e===null&&(e=new $i(n));let d=l?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,d),o.addEventListener("dispose",r),d.texture}else return null}}}return o}function s(o){let c=0,l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function r(o){let c=o.target;c.removeEventListener("dispose",r);let l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:a}}function E0(n){let t={};function e(i){if(t[i]!==void 0)return t[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return t[i]=s,s}return{has:function(i){return e(i)!==null},init:function(i){i.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(i){let s=e(i);return s===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function w0(n,t,e,i){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&t.remove(d.index);for(let g in d.attributes)t.remove(d.attributes[g]);for(let g in d.morphAttributes){let _=d.morphAttributes[g];for(let f=0,m=_.length;f<m;f++)t.remove(_[f])}d.removeEventListener("dispose",a),delete s[d.id];let p=r.get(d);p&&(t.remove(p),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,e.memory.geometries++),d}function c(u){let d=u.attributes;for(let g in d)t.update(d[g],n.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let _=p[g];for(let f=0,m=_.length;f<m;f++)t.update(_[f],n.ARRAY_BUFFER)}}function l(u){let d=[],p=u.index,g=u.attributes.position,_=0;if(p!==null){let x=p.array;_=p.version;for(let v=0,M=x.length;v<M;v+=3){let R=x[v+0],A=x[v+1],T=x[v+2];d.push(R,A,A,T,T,R)}}else if(g!==void 0){let x=g.array;_=g.version;for(let v=0,M=x.length/3-1;v<M;v+=3){let R=v+0,A=v+1,T=v+2;d.push(R,A,A,T,T,R)}}else return;let f=new(Hu(d)?Wr:Gr)(d,1);f.version=_;let m=r.get(u);m&&t.remove(m),r.set(u,f)}function h(u){let d=r.get(u);if(d){let p=u.index;p!==null&&d.version<p.version&&l(u)}else l(u);return r.get(u)}return{get:o,update:c,getWireframeAttribute:h}}function T0(n,t,e,i){let s=i.isWebGL2,r;function a(p){r=p}let o,c;function l(p){o=p.type,c=p.bytesPerElement}function h(p,g){n.drawElements(r,g,o,p*c),e.update(g,r,1)}function u(p,g,_){if(_===0)return;let f,m;if(s)f=n,m="drawElementsInstanced";else if(f=t.get("ANGLE_instanced_arrays"),m="drawElementsInstancedANGLE",f===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[m](r,g,o,p*c,_),e.update(g,r,_)}function d(p,g,_){if(_===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<_;m++)this.render(p[m]/c,g[m]);else{f.multiDrawElementsWEBGL(r,g,0,o,p,0,_);let m=0;for(let x=0;x<_;x++)m+=g[x];e.update(m,r,1)}}this.setMode=a,this.setIndex=l,this.render=h,this.renderInstances=u,this.renderMultiDraw=d}function A0(n){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(e.calls++,a){case n.TRIANGLES:e.triangles+=o*(r/3);break;case n.LINES:e.lines+=o*(r/2);break;case n.LINE_STRIP:e.lines+=o*(r-1);break;case n.LINE_LOOP:e.lines+=o*r;break;case n.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:i}}function R0(n,t){return n[0]-t[0]}function C0(n,t){return Math.abs(t[1])-Math.abs(n[1])}function P0(n,t,e){let i={},s=new Float32Array(8),r=new WeakMap,a=new oe,o=[];for(let l=0;l<8;l++)o[l]=[l,0];function c(l,h,u){let d=l.morphTargetInfluences;if(t.isWebGL2===!0){let p=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=p!==void 0?p.length:0,_=r.get(h);if(_===void 0||_.count!==g){let L=function(){q.dispose(),r.delete(h),h.removeEventListener("dispose",L)};_!==void 0&&_.texture.dispose();let x=h.morphAttributes.position!==void 0,v=h.morphAttributes.normal!==void 0,M=h.morphAttributes.color!==void 0,R=h.morphAttributes.position||[],A=h.morphAttributes.normal||[],T=h.morphAttributes.color||[],k=0;x===!0&&(k=1),v===!0&&(k=2),M===!0&&(k=3);let S=h.attributes.position.count*k,w=1;S>t.maxTextureSize&&(w=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);let I=new Float32Array(S*w*4*g),q=new kr(I,S,w,g);q.type=kn,q.needsUpdate=!0;let Q=k*4;for(let N=0;N<g;N++){let W=R[N],$=A[N],G=T[N],X=S*w*4*N;for(let K=0;K<W.count;K++){let tt=K*Q;x===!0&&(a.fromBufferAttribute(W,K),I[X+tt+0]=a.x,I[X+tt+1]=a.y,I[X+tt+2]=a.z,I[X+tt+3]=0),v===!0&&(a.fromBufferAttribute($,K),I[X+tt+4]=a.x,I[X+tt+5]=a.y,I[X+tt+6]=a.z,I[X+tt+7]=0),M===!0&&(a.fromBufferAttribute(G,K),I[X+tt+8]=a.x,I[X+tt+9]=a.y,I[X+tt+10]=a.z,I[X+tt+11]=G.itemSize===4?a.w:1)}}_={count:g,texture:q,size:new ft(S,w)},r.set(h,_),h.addEventListener("dispose",L)}let f=0;for(let x=0;x<d.length;x++)f+=d[x];let m=h.morphTargetsRelative?1:1-f;u.getUniforms().setValue(n,"morphTargetBaseInfluence",m),u.getUniforms().setValue(n,"morphTargetInfluences",d),u.getUniforms().setValue(n,"morphTargetsTexture",_.texture,e),u.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{let p=d===void 0?0:d.length,g=i[h.id];if(g===void 0||g.length!==p){g=[];for(let v=0;v<p;v++)g[v]=[v,0];i[h.id]=g}for(let v=0;v<p;v++){let M=g[v];M[0]=v,M[1]=d[v]}g.sort(C0);for(let v=0;v<8;v++)v<p&&g[v][1]?(o[v][0]=g[v][0],o[v][1]=g[v][1]):(o[v][0]=Number.MAX_SAFE_INTEGER,o[v][1]=0);o.sort(R0);let _=h.morphAttributes.position,f=h.morphAttributes.normal,m=0;for(let v=0;v<8;v++){let M=o[v],R=M[0],A=M[1];R!==Number.MAX_SAFE_INTEGER&&A?(_&&h.getAttribute("morphTarget"+v)!==_[R]&&h.setAttribute("morphTarget"+v,_[R]),f&&h.getAttribute("morphNormal"+v)!==f[R]&&h.setAttribute("morphNormal"+v,f[R]),s[v]=A,m+=A):(_&&h.hasAttribute("morphTarget"+v)===!0&&h.deleteAttribute("morphTarget"+v),f&&h.hasAttribute("morphNormal"+v)===!0&&h.deleteAttribute("morphNormal"+v),s[v]=0)}let x=h.morphTargetsRelative?1:1-m;u.getUniforms().setValue(n,"morphTargetBaseInfluence",x),u.getUniforms().setValue(n,"morphTargetInfluences",s)}}return{update:c}}function L0(n,t,e,i){let s=new WeakMap;function r(c){let l=i.render.frame,h=c.geometry,u=t.get(c,h);if(s.get(u)!==l&&(t.update(u),s.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),s.get(c)!==l&&(e.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){let d=c.skeleton;s.get(d)!==l&&(d.update(),s.set(d,l))}return u}function a(){s=new WeakMap}function o(c){let l=c.target;l.removeEventListener("dispose",o),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:a}}function es(n,t,e){let i=n[0];if(i<=0||i>0)return n;let s=t*e,r=Kh[s];if(r===void 0&&(r=new Float32Array(s),Kh[s]=r),t!==0){i.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,n[a].toArray(r,o)}return r}function ye(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Me(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function po(n,t){let e=Qh[t];e===void 0&&(e=new Int32Array(t),Qh[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function I0(n,t){let e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function D0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ye(e,t))return;n.uniform2fv(this.addr,t),Me(e,t)}}function U0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ye(e,t))return;n.uniform3fv(this.addr,t),Me(e,t)}}function N0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ye(e,t))return;n.uniform4fv(this.addr,t),Me(e,t)}}function O0(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(ye(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Me(e,t)}else{if(ye(e,i))return;eu.set(i),n.uniformMatrix2fv(this.addr,!1,eu),Me(e,i)}}function F0(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(ye(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Me(e,t)}else{if(ye(e,i))return;tu.set(i),n.uniformMatrix3fv(this.addr,!1,tu),Me(e,i)}}function B0(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(ye(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Me(e,t)}else{if(ye(e,i))return;jh.set(i),n.uniformMatrix4fv(this.addr,!1,jh),Me(e,i)}}function z0(n,t){let e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function k0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ye(e,t))return;n.uniform2iv(this.addr,t),Me(e,t)}}function H0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ye(e,t))return;n.uniform3iv(this.addr,t),Me(e,t)}}function V0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ye(e,t))return;n.uniform4iv(this.addr,t),Me(e,t)}}function G0(n,t){let e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function W0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ye(e,t))return;n.uniform2uiv(this.addr,t),Me(e,t)}}function X0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ye(e,t))return;n.uniform3uiv(this.addr,t),Me(e,t)}}function q0(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ye(e,t))return;n.uniform4uiv(this.addr,t),Me(e,t)}}function Y0(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r=this.type===n.SAMPLER_2D_SHADOW?qu:Xu;e.setTexture2D(t||r,s)}function Z0(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture3D(t||Zu,s)}function $0(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTextureCube(t||$u,s)}function J0(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture2DArray(t||Yu,s)}function K0(n){switch(n){case 5126:return I0;case 35664:return D0;case 35665:return U0;case 35666:return N0;case 35674:return O0;case 35675:return F0;case 35676:return B0;case 5124:case 35670:return z0;case 35667:case 35671:return k0;case 35668:case 35672:return H0;case 35669:case 35673:return V0;case 5125:return G0;case 36294:return W0;case 36295:return X0;case 36296:return q0;case 35678:case 36198:case 36298:case 36306:case 35682:return Y0;case 35679:case 36299:case 36307:return Z0;case 35680:case 36300:case 36308:case 36293:return $0;case 36289:case 36303:case 36311:case 36292:return J0}}function Q0(n,t){n.uniform1fv(this.addr,t)}function j0(n,t){let e=es(t,this.size,2);n.uniform2fv(this.addr,e)}function t_(n,t){let e=es(t,this.size,3);n.uniform3fv(this.addr,e)}function e_(n,t){let e=es(t,this.size,4);n.uniform4fv(this.addr,e)}function n_(n,t){let e=es(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function i_(n,t){let e=es(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function s_(n,t){let e=es(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function r_(n,t){n.uniform1iv(this.addr,t)}function o_(n,t){n.uniform2iv(this.addr,t)}function a_(n,t){n.uniform3iv(this.addr,t)}function c_(n,t){n.uniform4iv(this.addr,t)}function l_(n,t){n.uniform1uiv(this.addr,t)}function h_(n,t){n.uniform2uiv(this.addr,t)}function u_(n,t){n.uniform3uiv(this.addr,t)}function d_(n,t){n.uniform4uiv(this.addr,t)}function f_(n,t,e){let i=this.cache,s=t.length,r=po(e,s);ye(i,r)||(n.uniform1iv(this.addr,r),Me(i,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||Xu,r[a])}function p_(n,t,e){let i=this.cache,s=t.length,r=po(e,s);ye(i,r)||(n.uniform1iv(this.addr,r),Me(i,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Zu,r[a])}function m_(n,t,e){let i=this.cache,s=t.length,r=po(e,s);ye(i,r)||(n.uniform1iv(this.addr,r),Me(i,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||$u,r[a])}function g_(n,t,e){let i=this.cache,s=t.length,r=po(e,s);ye(i,r)||(n.uniform1iv(this.addr,r),Me(i,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Yu,r[a])}function __(n){switch(n){case 5126:return Q0;case 35664:return j0;case 35665:return t_;case 35666:return e_;case 35674:return n_;case 35675:return i_;case 35676:return s_;case 5124:case 35670:return r_;case 35667:case 35671:return o_;case 35668:case 35672:return a_;case 35669:case 35673:return c_;case 5125:return l_;case 36294:return h_;case 36295:return u_;case 36296:return d_;case 35678:case 36198:case 36298:case 36306:case 35682:return f_;case 35679:case 36299:case 36307:return p_;case 35680:case 36300:case 36308:case 36293:return m_;case 36289:case 36303:case 36311:case 36292:return g_}}function nu(n,t){n.seq.push(t),n.map[t.id]=t}function v_(n,t,e){let i=n.name,s=i.length;for(Da.lastIndex=0;;){let r=Da.exec(i),a=Da.lastIndex,o=r[1],c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){nu(e,l===void 0?new tc(o,n,t):new ec(o,n,t));break}else{let u=e.map[o];u===void 0&&(u=new nc(o),nu(e,u)),e=u}}}function iu(n,t,e){let i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}function M_(n,t){let e=n.split(`
`),i=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;i.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return i.join(`
`)}function S_(n){let t=Kt.getPrimaries(Kt.workingColorSpace),e=Kt.getPrimaries(n),i;switch(t===e?i="":t===Nr&&e===Ur?i="LinearDisplayP3ToLinearSRGB":t===Ur&&e===Nr&&(i="LinearSRGBToLinearDisplayP3"),n){case Tn:case fo:return[i,"LinearTransferOETF"];case xe:case Nc:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function su(n,t,e){let i=n.getShaderParameter(t,n.COMPILE_STATUS),s=n.getShaderInfoLog(t).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+M_(n.getShaderSource(t),a)}else return s}function b_(n,t){let e=S_(t);return`vec4 ${n}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function E_(n,t){let e;switch(t){case Gf:e="Linear";break;case Wf:e="Reinhard";break;case Xf:e="OptimizedCineon";break;case Dc:e="ACESFilmic";break;case Yf:e="AgX";break;case qf:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function w_(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(zi).join(`
`)}function T_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(zi).join(`
`)}function A_(n){let t=[];for(let e in n){let i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function R_(n,t){let e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(t,s),a=r.name,o=1;r.type===n.FLOAT_MAT2&&(o=2),r.type===n.FLOAT_MAT3&&(o=3),r.type===n.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:n.getAttribLocation(t,a),locationSize:o}}return e}function zi(n){return n!==""}function ru(n,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ou(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}function ic(n){return n.replace(C_,L_)}function L_(n,t){let e=Vt[t];if(e===void 0){let i=P_.get(t);if(i!==void 0)e=Vt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return ic(e)}function au(n){return n.replace(I_,D_)}function D_(n,t,e,i){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function cu(n){let t="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function U_(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Ru?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===_f?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===bn&&(t="SHADOWMAP_TYPE_VSM"),t}function N_(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Wi:case Xi:t="ENVMAP_TYPE_CUBE";break;case uo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function O_(n){let t="ENVMAP_MODE_REFLECTION";return n.envMap&&n.envMapMode===Xi&&(t="ENVMAP_MODE_REFRACTION"),t}function F_(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Cu:t="ENVMAP_BLENDING_MULTIPLY";break;case Hf:t="ENVMAP_BLENDING_MIX";break;case Vf:t="ENVMAP_BLENDING_ADD";break}return t}function B_(n){let t=n.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function z_(n,t,e,i){let s=n.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,c=U_(e),l=N_(e),h=O_(e),u=F_(e),d=B_(e),p=e.isWebGL2?"":w_(e),g=T_(e),_=A_(r),f=s.createProgram(),m,x,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(zi).join(`
`),m.length>0&&(m+=`
`),x=[p,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(zi).join(`
`),x.length>0&&(x+=`
`)):(m=[cu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(zi).join(`
`),x=[p,cu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Vn?"#define TONE_MAPPING":"",e.toneMapping!==Vn?Vt.tonemapping_pars_fragment:"",e.toneMapping!==Vn?E_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Vt.colorspace_pars_fragment,b_("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(zi).join(`
`)),a=ic(a),a=ru(a,e),a=ou(a,e),o=ic(o),o=ru(o,e),o=ou(o,e),a=au(a),o=au(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,m=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,x=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===Ah?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ah?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);let M=v+m+a,R=v+x+o,A=iu(s,s.VERTEX_SHADER,M),T=iu(s,s.FRAGMENT_SHADER,R);s.attachShader(f,A),s.attachShader(f,T),e.index0AttributeName!==void 0?s.bindAttribLocation(f,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(f,0,"position"),s.linkProgram(f);function k(q){if(n.debug.checkShaderErrors){let Q=s.getProgramInfoLog(f).trim(),L=s.getShaderInfoLog(A).trim(),N=s.getShaderInfoLog(T).trim(),W=!0,$=!0;if(s.getProgramParameter(f,s.LINK_STATUS)===!1)if(W=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,f,A,T);else{let G=su(s,A,"vertex"),X=su(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(f,s.VALIDATE_STATUS)+`

Program Info Log: `+Q+`
`+G+`
`+X)}else Q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Q):(L===""||N==="")&&($=!1);$&&(q.diagnostics={runnable:W,programLog:Q,vertexShader:{log:L,prefix:m},fragmentShader:{log:N,prefix:x}})}s.deleteShader(A),s.deleteShader(T),S=new Gi(s,f),w=R_(s,f)}let S;this.getUniforms=function(){return S===void 0&&k(this),S};let w;this.getAttributes=function(){return w===void 0&&k(this),w};let I=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=s.getProgramParameter(f,x_)),I},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(f),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=y_++,this.cacheKey=t,this.usedTimes=1,this.program=f,this.vertexShader=A,this.fragmentShader=T,this}function H_(n,t,e,i,s,r,a){let o=new Vr,c=new sc,l=[],h=s.isWebGL2,u=s.logarithmicDepthBuffer,d=s.vertexTextures,p=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function f(S,w,I,q,Q){let L=q.fog,N=Q.geometry,W=S.isMeshStandardMaterial?q.environment:null,$=(S.isMeshStandardMaterial?e:t).get(S.envMap||W),G=$&&$.mapping===uo?$.image.height:null,X=g[S.type];S.precision!==null&&(p=s.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));let K=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,tt=K!==void 0?K.length:0,rt=0;N.morphAttributes.position!==void 0&&(rt=1),N.morphAttributes.normal!==void 0&&(rt=2),N.morphAttributes.color!==void 0&&(rt=3);let V,Y,ht,_t;if(X){let Ue=fn[X];V=Ue.vertexShader,Y=Ue.fragmentShader}else V=S.vertexShader,Y=S.fragmentShader,c.update(S),ht=c.getVertexShaderID(S),_t=c.getFragmentShaderID(S);let gt=n.getRenderTarget(),Rt=Q.isInstancedMesh===!0,Ut=Q.isBatchedMesh===!0,Tt=!!S.map,Yt=!!S.matcap,O=!!$,me=!!S.aoMap,yt=!!S.lightMap,Ot=!!S.bumpMap,vt=!!S.normalMap,Qt=!!S.displacementMap,Bt=!!S.emissiveMap,E=!!S.metalnessMap,y=!!S.roughnessMap,F=S.anisotropy>0,et=S.clearcoat>0,j=S.iridescence>0,nt=S.sheen>0,xt=S.transmission>0,lt=F&&!!S.anisotropyMap,J=et&&!!S.clearcoatMap,st=et&&!!S.clearcoatNormalMap,pt=et&&!!S.clearcoatRoughnessMap,Z=j&&!!S.iridescenceMap,zt=j&&!!S.iridescenceThicknessMap,Ct=nt&&!!S.sheenColorMap,bt=nt&&!!S.sheenRoughnessMap,mt=!!S.specularMap,ut=!!S.specularColorMap,Pt=!!S.specularIntensityMap,Zt=xt&&!!S.transmissionMap,Dt=xt&&!!S.thicknessMap,Lt=!!S.gradientMap,it=!!S.alphaMap,C=S.alphaTest>0,at=!!S.alphaHash,ct=!!S.extensions,At=!!N.attributes.uv1,Et=!!N.attributes.uv2,Jt=!!N.attributes.uv3,jt=Vn;return S.toneMapped&&(gt===null||gt.isXRRenderTarget===!0)&&(jt=n.toneMapping),{isWebGL2:h,shaderID:X,shaderType:S.type,shaderName:S.name,vertexShader:V,fragmentShader:Y,defines:S.defines,customVertexShaderID:ht,customFragmentShaderID:_t,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:Ut,instancing:Rt,instancingColor:Rt&&Q.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:gt===null?n.outputColorSpace:gt.isXRRenderTarget===!0?gt.texture.colorSpace:Tn,map:Tt,matcap:Yt,envMap:O,envMapMode:O&&$.mapping,envMapCubeUVHeight:G,aoMap:me,lightMap:yt,bumpMap:Ot,normalMap:vt,displacementMap:d&&Qt,emissiveMap:Bt,normalMapObjectSpace:vt&&S.normalMapType===rp,normalMapTangentSpace:vt&&S.normalMapType===zu,metalnessMap:E,roughnessMap:y,anisotropy:F,anisotropyMap:lt,clearcoat:et,clearcoatMap:J,clearcoatNormalMap:st,clearcoatRoughnessMap:pt,iridescence:j,iridescenceMap:Z,iridescenceThicknessMap:zt,sheen:nt,sheenColorMap:Ct,sheenRoughnessMap:bt,specularMap:mt,specularColorMap:ut,specularIntensityMap:Pt,transmission:xt,transmissionMap:Zt,thicknessMap:Dt,gradientMap:Lt,opaque:S.transparent===!1&&S.blending===Hi,alphaMap:it,alphaTest:C,alphaHash:at,combine:S.combine,mapUv:Tt&&_(S.map.channel),aoMapUv:me&&_(S.aoMap.channel),lightMapUv:yt&&_(S.lightMap.channel),bumpMapUv:Ot&&_(S.bumpMap.channel),normalMapUv:vt&&_(S.normalMap.channel),displacementMapUv:Qt&&_(S.displacementMap.channel),emissiveMapUv:Bt&&_(S.emissiveMap.channel),metalnessMapUv:E&&_(S.metalnessMap.channel),roughnessMapUv:y&&_(S.roughnessMap.channel),anisotropyMapUv:lt&&_(S.anisotropyMap.channel),clearcoatMapUv:J&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:st&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:pt&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:Z&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:zt&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Ct&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:bt&&_(S.sheenRoughnessMap.channel),specularMapUv:mt&&_(S.specularMap.channel),specularColorMapUv:ut&&_(S.specularColorMap.channel),specularIntensityMapUv:Pt&&_(S.specularIntensityMap.channel),transmissionMapUv:Zt&&_(S.transmissionMap.channel),thicknessMapUv:Dt&&_(S.thicknessMap.channel),alphaMapUv:it&&_(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(vt||F),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:At,vertexUv2s:Et,vertexUv3s:Jt,pointsUvs:Q.isPoints===!0&&!!N.attributes.uv&&(Tt||it),fog:!!L,useFog:S.fog===!0,fogExp2:L&&L.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:Q.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:tt,morphTextureStride:rt,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:jt,useLegacyLights:n._useLegacyLights,decodeVideoTexture:Tt&&S.map.isVideoTexture===!0&&Kt.getTransfer(S.map.colorSpace)===se,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Ge,flipSided:S.side===Pe,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:ct&&S.extensions.derivatives===!0,extensionFragDepth:ct&&S.extensions.fragDepth===!0,extensionDrawBuffers:ct&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:ct&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ct&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function m(S){let w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(let I in S.defines)w.push(I),w.push(S.defines[I]);return S.isRawShaderMaterial===!1&&(x(w,S),v(w,S),w.push(n.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function x(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function v(S,w){o.disableAll(),w.isWebGL2&&o.enable(0),w.supportsVertexTextures&&o.enable(1),w.instancing&&o.enable(2),w.instancingColor&&o.enable(3),w.matcap&&o.enable(4),w.envMap&&o.enable(5),w.normalMapObjectSpace&&o.enable(6),w.normalMapTangentSpace&&o.enable(7),w.clearcoat&&o.enable(8),w.iridescence&&o.enable(9),w.alphaTest&&o.enable(10),w.vertexColors&&o.enable(11),w.vertexAlphas&&o.enable(12),w.vertexUv1s&&o.enable(13),w.vertexUv2s&&o.enable(14),w.vertexUv3s&&o.enable(15),w.vertexTangents&&o.enable(16),w.anisotropy&&o.enable(17),w.alphaHash&&o.enable(18),w.batching&&o.enable(19),S.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.skinning&&o.enable(4),w.morphTargets&&o.enable(5),w.morphNormals&&o.enable(6),w.morphColors&&o.enable(7),w.premultipliedAlpha&&o.enable(8),w.shadowMapEnabled&&o.enable(9),w.useLegacyLights&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),S.push(o.mask)}function M(S){let w=g[S.type],I;if(w){let q=fn[w];I=Pp.clone(q.uniforms)}else I=S.uniforms;return I}function R(S,w){let I;for(let q=0,Q=l.length;q<Q;q++){let L=l[q];if(L.cacheKey===w){I=L,++I.usedTimes;break}}return I===void 0&&(I=new z_(n,w,S,r),l.push(I)),I}function A(S){if(--S.usedTimes===0){let w=l.indexOf(S);l[w]=l[l.length-1],l.pop(),S.destroy()}}function T(S){c.remove(S)}function k(){c.dispose()}return{getParameters:f,getProgramCacheKey:m,getUniforms:M,acquireProgram:R,releaseProgram:A,releaseShaderCache:T,programs:l,dispose:k}}function V_(){let n=new WeakMap;function t(r){let a=n.get(r);return a===void 0&&(a={},n.set(r,a)),a}function e(r){n.delete(r)}function i(r,a,o){n.get(r)[a]=o}function s(){n=new WeakMap}return{get:t,remove:e,update:i,dispose:s}}function G_(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function lu(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function hu(){let n=[],t=0,e=[],i=[],s=[];function r(){t=0,e.length=0,i.length=0,s.length=0}function a(u,d,p,g,_,f){let m=n[t];return m===void 0?(m={id:u.id,object:u,geometry:d,material:p,groupOrder:g,renderOrder:u.renderOrder,z:_,group:f},n[t]=m):(m.id=u.id,m.object=u,m.geometry=d,m.material=p,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=_,m.group=f),t++,m}function o(u,d,p,g,_,f){let m=a(u,d,p,g,_,f);p.transmission>0?i.push(m):p.transparent===!0?s.push(m):e.push(m)}function c(u,d,p,g,_,f){let m=a(u,d,p,g,_,f);p.transmission>0?i.unshift(m):p.transparent===!0?s.unshift(m):e.unshift(m)}function l(u,d){e.length>1&&e.sort(u||G_),i.length>1&&i.sort(d||lu),s.length>1&&s.sort(d||lu)}function h(){for(let u=t,d=n.length;u<d;u++){let p=n[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:i,transparent:s,init:r,push:o,unshift:c,finish:h,sort:l}}function W_(){let n=new WeakMap;function t(i,s){let r=n.get(i),a;return r===void 0?(a=new hu,n.set(i,[a])):s>=r.length?(a=new hu,r.push(a)):a=r[s],a}function e(){n=new WeakMap}return{get:t,dispose:e}}function X_(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new Ft};break;case"SpotLight":e={position:new P,direction:new P,color:new Ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new Ft,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new Ft,groundColor:new Ft};break;case"RectAreaLight":e={color:new Ft,position:new P,halfWidth:new P,halfHeight:new P};break}return n[t.id]=e,e}}}function q_(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}function Z_(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function $_(n,t){let e=new X_,i=q_(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new P);let r=new P,a=new de,o=new de;function c(h,u){let d=0,p=0,g=0;for(let q=0;q<9;q++)s.probe[q].set(0,0,0);let _=0,f=0,m=0,x=0,v=0,M=0,R=0,A=0,T=0,k=0,S=0;h.sort(Z_);let w=u===!0?Math.PI:1;for(let q=0,Q=h.length;q<Q;q++){let L=h[q],N=L.color,W=L.intensity,$=L.distance,G=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)d+=N.r*W*w,p+=N.g*W*w,g+=N.b*W*w;else if(L.isLightProbe){for(let X=0;X<9;X++)s.probe[X].addScaledVector(L.sh.coefficients[X],W);S++}else if(L.isDirectionalLight){let X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity*w),L.castShadow){let K=L.shadow,tt=i.get(L);tt.shadowBias=K.bias,tt.shadowNormalBias=K.normalBias,tt.shadowRadius=K.radius,tt.shadowMapSize=K.mapSize,s.directionalShadow[_]=tt,s.directionalShadowMap[_]=G,s.directionalShadowMatrix[_]=L.shadow.matrix,M++}s.directional[_]=X,_++}else if(L.isSpotLight){let X=e.get(L);X.position.setFromMatrixPosition(L.matrixWorld),X.color.copy(N).multiplyScalar(W*w),X.distance=$,X.coneCos=Math.cos(L.angle),X.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),X.decay=L.decay,s.spot[m]=X;let K=L.shadow;if(L.map&&(s.spotLightMap[T]=L.map,T++,K.updateMatrices(L),L.castShadow&&k++),s.spotLightMatrix[m]=K.matrix,L.castShadow){let tt=i.get(L);tt.shadowBias=K.bias,tt.shadowNormalBias=K.normalBias,tt.shadowRadius=K.radius,tt.shadowMapSize=K.mapSize,s.spotShadow[m]=tt,s.spotShadowMap[m]=G,A++}m++}else if(L.isRectAreaLight){let X=e.get(L);X.color.copy(N).multiplyScalar(W),X.halfWidth.set(L.width*.5,0,0),X.halfHeight.set(0,L.height*.5,0),s.rectArea[x]=X,x++}else if(L.isPointLight){let X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity*w),X.distance=L.distance,X.decay=L.decay,L.castShadow){let K=L.shadow,tt=i.get(L);tt.shadowBias=K.bias,tt.shadowNormalBias=K.normalBias,tt.shadowRadius=K.radius,tt.shadowMapSize=K.mapSize,tt.shadowCameraNear=K.camera.near,tt.shadowCameraFar=K.camera.far,s.pointShadow[f]=tt,s.pointShadowMap[f]=G,s.pointShadowMatrix[f]=L.shadow.matrix,R++}s.point[f]=X,f++}else if(L.isHemisphereLight){let X=e.get(L);X.skyColor.copy(L.color).multiplyScalar(W*w),X.groundColor.copy(L.groundColor).multiplyScalar(W*w),s.hemi[v]=X,v++}}x>0&&(t.isWebGL2?n.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ot.LTC_FLOAT_1,s.rectAreaLTC2=ot.LTC_FLOAT_2):(s.rectAreaLTC1=ot.LTC_HALF_1,s.rectAreaLTC2=ot.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ot.LTC_FLOAT_1,s.rectAreaLTC2=ot.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=ot.LTC_HALF_1,s.rectAreaLTC2=ot.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=d,s.ambient[1]=p,s.ambient[2]=g;let I=s.hash;(I.directionalLength!==_||I.pointLength!==f||I.spotLength!==m||I.rectAreaLength!==x||I.hemiLength!==v||I.numDirectionalShadows!==M||I.numPointShadows!==R||I.numSpotShadows!==A||I.numSpotMaps!==T||I.numLightProbes!==S)&&(s.directional.length=_,s.spot.length=m,s.rectArea.length=x,s.point.length=f,s.hemi.length=v,s.directionalShadow.length=M,s.directionalShadowMap.length=M,s.pointShadow.length=R,s.pointShadowMap.length=R,s.spotShadow.length=A,s.spotShadowMap.length=A,s.directionalShadowMatrix.length=M,s.pointShadowMatrix.length=R,s.spotLightMatrix.length=A+T-k,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=k,s.numLightProbes=S,I.directionalLength=_,I.pointLength=f,I.spotLength=m,I.rectAreaLength=x,I.hemiLength=v,I.numDirectionalShadows=M,I.numPointShadows=R,I.numSpotShadows=A,I.numSpotMaps=T,I.numLightProbes=S,s.version=Y_++)}function l(h,u){let d=0,p=0,g=0,_=0,f=0,m=u.matrixWorldInverse;for(let x=0,v=h.length;x<v;x++){let M=h[x];if(M.isDirectionalLight){let R=s.directional[d];R.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(m),d++}else if(M.isSpotLight){let R=s.spot[g];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(m),R.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(m),g++}else if(M.isRectAreaLight){let R=s.rectArea[_];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(m),o.identity(),a.copy(M.matrixWorld),a.premultiply(m),o.extractRotation(a),R.halfWidth.set(M.width*.5,0,0),R.halfHeight.set(0,M.height*.5,0),R.halfWidth.applyMatrix4(o),R.halfHeight.applyMatrix4(o),_++}else if(M.isPointLight){let R=s.point[p];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(m),p++}else if(M.isHemisphereLight){let R=s.hemi[f];R.direction.setFromMatrixPosition(M.matrixWorld),R.direction.transformDirection(m),f++}}}return{setup:c,setupView:l,state:s}}function uu(n,t){let e=new $_(n,t),i=[],s=[];function r(){i.length=0,s.length=0}function a(u){i.push(u)}function o(u){s.push(u)}function c(u){e.setup(i,u)}function l(u){e.setupView(i,u)}return{init:r,state:{lightsArray:i,shadowsArray:s,lights:e},setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function J_(n,t){let e=new WeakMap;function i(r,a=0){let o=e.get(r),c;return o===void 0?(c=new uu(n,t),e.set(r,[c])):a>=o.length?(c=new uu(n,t),o.push(c)):c=o[a],c}function s(){e=new WeakMap}return{get:i,dispose:s}}function j_(n,t,e){let i=new ws,s=new ft,r=new ft,a=new oe,o=new oc({depthPacking:sp}),c=new ac,l={},h=e.maxTextureSize,u={[Wn]:Pe,[Pe]:Wn,[Ge]:Ge},d=new Je({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:K_,fragmentShader:Q_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let g=new De;g.setAttribute("position",new Le(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new $t(g,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ru;let m=this.type;this.render=function(A,T,k){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||A.length===0)return;let S=n.getRenderTarget(),w=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),q=n.state;q.setBlending(Hn),q.buffers.color.setClear(1,1,1,1),q.buffers.depth.setTest(!0),q.setScissorTest(!1);let Q=m!==bn&&this.type===bn,L=m===bn&&this.type!==bn;for(let N=0,W=A.length;N<W;N++){let $=A[N],G=$.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let X=G.getFrameExtents();if(s.multiply(X),r.copy(G.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/X.x),s.x=r.x*X.x,G.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/X.y),s.y=r.y*X.y,G.mapSize.y=r.y)),G.map===null||Q===!0||L===!0){let tt=this.type!==bn?{minFilter:Fe,magFilter:Fe}:{};G.map!==null&&G.map.dispose(),G.map=new An(s.x,s.y,tt),G.map.texture.name=$.name+".shadowMap",G.camera.updateProjectionMatrix()}n.setRenderTarget(G.map),n.clear();let K=G.getViewportCount();for(let tt=0;tt<K;tt++){let rt=G.getViewport(tt);a.set(r.x*rt.x,r.y*rt.y,r.x*rt.z,r.y*rt.w),q.viewport(a),G.updateMatrices($,tt),i=G.getFrustum(),M(T,k,G.camera,$,this.type)}G.isPointLightShadow!==!0&&this.type===bn&&x(G,k),G.needsUpdate=!1}m=this.type,f.needsUpdate=!1,n.setRenderTarget(S,w,I)};function x(A,T){let k=t.update(_);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new An(s.x,s.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,n.setRenderTarget(A.mapPass),n.clear(),n.renderBufferDirect(T,null,k,d,_,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value=A.mapSize,p.uniforms.radius.value=A.radius,n.setRenderTarget(A.map),n.clear(),n.renderBufferDirect(T,null,k,p,_,null)}function v(A,T,k,S){let w=null,I=k.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(I!==void 0)w=I;else if(w=k.isPointLight===!0?c:o,n.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let q=w.uuid,Q=T.uuid,L=l[q];L===void 0&&(L={},l[q]=L);let N=L[Q];N===void 0&&(N=w.clone(),L[Q]=N,T.addEventListener("dispose",R)),w=N}if(w.visible=T.visible,w.wireframe=T.wireframe,S===bn?w.side=T.shadowSide!==null?T.shadowSide:T.side:w.side=T.shadowSide!==null?T.shadowSide:u[T.side],w.alphaMap=T.alphaMap,w.alphaTest=T.alphaTest,w.map=T.map,w.clipShadows=T.clipShadows,w.clippingPlanes=T.clippingPlanes,w.clipIntersection=T.clipIntersection,w.displacementMap=T.displacementMap,w.displacementScale=T.displacementScale,w.displacementBias=T.displacementBias,w.wireframeLinewidth=T.wireframeLinewidth,w.linewidth=T.linewidth,k.isPointLight===!0&&w.isMeshDistanceMaterial===!0){let q=n.properties.get(w);q.light=k}return w}function M(A,T,k,S,w){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&w===bn)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,A.matrixWorld);let Q=t.update(A),L=A.material;if(Array.isArray(L)){let N=Q.groups;for(let W=0,$=N.length;W<$;W++){let G=N[W],X=L[G.materialIndex];if(X&&X.visible){let K=v(A,X,S,w);A.onBeforeShadow(n,A,T,k,Q,K,G),n.renderBufferDirect(k,null,Q,K,A,G),A.onAfterShadow(n,A,T,k,Q,K,G)}}}else if(L.visible){let N=v(A,L,S,w);A.onBeforeShadow(n,A,T,k,Q,N,null),n.renderBufferDirect(k,null,Q,N,A,null),A.onAfterShadow(n,A,T,k,Q,N,null)}}let q=A.children;for(let Q=0,L=q.length;Q<L;Q++)M(q[Q],T,k,S,w)}function R(A){A.target.removeEventListener("dispose",R);for(let k in l){let S=l[k],w=A.target.uuid;w in S&&(S[w].dispose(),delete S[w])}}}function tv(n,t,e){let i=e.isWebGL2;function s(){let C=!1,at=new oe,ct=null,At=new oe(0,0,0,0);return{setMask:function(Et){ct!==Et&&!C&&(n.colorMask(Et,Et,Et,Et),ct=Et)},setLocked:function(Et){C=Et},setClear:function(Et,Jt,jt,Se,Ue){Ue===!0&&(Et*=Se,Jt*=Se,jt*=Se),at.set(Et,Jt,jt,Se),At.equals(at)===!1&&(n.clearColor(Et,Jt,jt,Se),At.copy(at))},reset:function(){C=!1,ct=null,At.set(-1,0,0,0)}}}function r(){let C=!1,at=null,ct=null,At=null;return{setTest:function(Et){Et?Ut(n.DEPTH_TEST):Tt(n.DEPTH_TEST)},setMask:function(Et){at!==Et&&!C&&(n.depthMask(Et),at=Et)},setFunc:function(Et){if(ct!==Et){switch(Et){case Uf:n.depthFunc(n.NEVER);break;case Nf:n.depthFunc(n.ALWAYS);break;case Of:n.depthFunc(n.LESS);break;case Pr:n.depthFunc(n.LEQUAL);break;case Ff:n.depthFunc(n.EQUAL);break;case Bf:n.depthFunc(n.GEQUAL);break;case zf:n.depthFunc(n.GREATER);break;case kf:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ct=Et}},setLocked:function(Et){C=Et},setClear:function(Et){At!==Et&&(n.clearDepth(Et),At=Et)},reset:function(){C=!1,at=null,ct=null,At=null}}}function a(){let C=!1,at=null,ct=null,At=null,Et=null,Jt=null,jt=null,Se=null,Ue=null;return{setTest:function(te){C||(te?Ut(n.STENCIL_TEST):Tt(n.STENCIL_TEST))},setMask:function(te){at!==te&&!C&&(n.stencilMask(te),at=te)},setFunc:function(te,Ne,cn){(ct!==te||At!==Ne||Et!==cn)&&(n.stencilFunc(te,Ne,cn),ct=te,At=Ne,Et=cn)},setOp:function(te,Ne,cn){(Jt!==te||jt!==Ne||Se!==cn)&&(n.stencilOp(te,Ne,cn),Jt=te,jt=Ne,Se=cn)},setLocked:function(te){C=te},setClear:function(te){Ue!==te&&(n.clearStencil(te),Ue=te)},reset:function(){C=!1,at=null,ct=null,At=null,Et=null,Jt=null,jt=null,Se=null,Ue=null}}}let o=new s,c=new r,l=new a,h=new WeakMap,u=new WeakMap,d={},p={},g=new WeakMap,_=[],f=null,m=!1,x=null,v=null,M=null,R=null,A=null,T=null,k=null,S=new Ft(0,0,0),w=0,I=!1,q=null,Q=null,L=null,N=null,W=null,$=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,X=0,K=n.getParameter(n.VERSION);K.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec(K)[1]),G=X>=1):K.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),G=X>=2);let tt=null,rt={},V=n.getParameter(n.SCISSOR_BOX),Y=n.getParameter(n.VIEWPORT),ht=new oe().fromArray(V),_t=new oe().fromArray(Y);function gt(C,at,ct,At){let Et=new Uint8Array(4),Jt=n.createTexture();n.bindTexture(C,Jt),n.texParameteri(C,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(C,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let jt=0;jt<ct;jt++)i&&(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)?n.texImage3D(at,0,n.RGBA,1,1,At,0,n.RGBA,n.UNSIGNED_BYTE,Et):n.texImage2D(at+jt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Et);return Jt}let Rt={};Rt[n.TEXTURE_2D]=gt(n.TEXTURE_2D,n.TEXTURE_2D,1),Rt[n.TEXTURE_CUBE_MAP]=gt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(Rt[n.TEXTURE_2D_ARRAY]=gt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Rt[n.TEXTURE_3D]=gt(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),c.setClear(1),l.setClear(0),Ut(n.DEPTH_TEST),c.setFunc(Pr),Bt(!1),E(Xl),Ut(n.CULL_FACE),vt(Hn);function Ut(C){d[C]!==!0&&(n.enable(C),d[C]=!0)}function Tt(C){d[C]!==!1&&(n.disable(C),d[C]=!1)}function Yt(C,at){return p[C]!==at?(n.bindFramebuffer(C,at),p[C]=at,i&&(C===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=at),C===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=at)),!0):!1}function O(C,at){let ct=_,At=!1;if(C)if(ct=g.get(at),ct===void 0&&(ct=[],g.set(at,ct)),C.isWebGLMultipleRenderTargets){let Et=C.texture;if(ct.length!==Et.length||ct[0]!==n.COLOR_ATTACHMENT0){for(let Jt=0,jt=Et.length;Jt<jt;Jt++)ct[Jt]=n.COLOR_ATTACHMENT0+Jt;ct.length=Et.length,At=!0}}else ct[0]!==n.COLOR_ATTACHMENT0&&(ct[0]=n.COLOR_ATTACHMENT0,At=!0);else ct[0]!==n.BACK&&(ct[0]=n.BACK,At=!0);At&&(e.isWebGL2?n.drawBuffers(ct):t.get("WEBGL_draw_buffers").drawBuffersWEBGL(ct))}function me(C){return f!==C?(n.useProgram(C),f=C,!0):!1}let yt={[oi]:n.FUNC_ADD,[xf]:n.FUNC_SUBTRACT,[yf]:n.FUNC_REVERSE_SUBTRACT};if(i)yt[Zl]=n.MIN,yt[$l]=n.MAX;else{let C=t.get("EXT_blend_minmax");C!==null&&(yt[Zl]=C.MIN_EXT,yt[$l]=C.MAX_EXT)}let Ot={[Mf]:n.ZERO,[Sf]:n.ONE,[bf]:n.SRC_COLOR,[Ha]:n.SRC_ALPHA,[Cf]:n.SRC_ALPHA_SATURATE,[Af]:n.DST_COLOR,[wf]:n.DST_ALPHA,[Ef]:n.ONE_MINUS_SRC_COLOR,[Va]:n.ONE_MINUS_SRC_ALPHA,[Rf]:n.ONE_MINUS_DST_COLOR,[Tf]:n.ONE_MINUS_DST_ALPHA,[Pf]:n.CONSTANT_COLOR,[Lf]:n.ONE_MINUS_CONSTANT_COLOR,[If]:n.CONSTANT_ALPHA,[Df]:n.ONE_MINUS_CONSTANT_ALPHA};function vt(C,at,ct,At,Et,Jt,jt,Se,Ue,te){if(C===Hn){m===!0&&(Tt(n.BLEND),m=!1);return}if(m===!1&&(Ut(n.BLEND),m=!0),C!==vf){if(C!==x||te!==I){if((v!==oi||A!==oi)&&(n.blendEquation(n.FUNC_ADD),v=oi,A=oi),te)switch(C){case Hi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ms:n.blendFunc(n.ONE,n.ONE);break;case ql:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Yl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case Hi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ms:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case ql:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Yl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}M=null,R=null,T=null,k=null,S.set(0,0,0),w=0,x=C,I=te}return}Et=Et||at,Jt=Jt||ct,jt=jt||At,(at!==v||Et!==A)&&(n.blendEquationSeparate(yt[at],yt[Et]),v=at,A=Et),(ct!==M||At!==R||Jt!==T||jt!==k)&&(n.blendFuncSeparate(Ot[ct],Ot[At],Ot[Jt],Ot[jt]),M=ct,R=At,T=Jt,k=jt),(Se.equals(S)===!1||Ue!==w)&&(n.blendColor(Se.r,Se.g,Se.b,Ue),S.copy(Se),w=Ue),x=C,I=!1}function Qt(C,at){C.side===Ge?Tt(n.CULL_FACE):Ut(n.CULL_FACE);let ct=C.side===Pe;at&&(ct=!ct),Bt(ct),C.blending===Hi&&C.transparent===!1?vt(Hn):vt(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),c.setFunc(C.depthFunc),c.setTest(C.depthTest),c.setMask(C.depthWrite),o.setMask(C.colorWrite);let At=C.stencilWrite;l.setTest(At),At&&(l.setMask(C.stencilWriteMask),l.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),l.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),F(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?Ut(n.SAMPLE_ALPHA_TO_COVERAGE):Tt(n.SAMPLE_ALPHA_TO_COVERAGE)}function Bt(C){q!==C&&(C?n.frontFace(n.CW):n.frontFace(n.CCW),q=C)}function E(C){C!==mf?(Ut(n.CULL_FACE),C!==Q&&(C===Xl?n.cullFace(n.BACK):C===gf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Tt(n.CULL_FACE),Q=C}function y(C){C!==L&&(G&&n.lineWidth(C),L=C)}function F(C,at,ct){C?(Ut(n.POLYGON_OFFSET_FILL),(N!==at||W!==ct)&&(n.polygonOffset(at,ct),N=at,W=ct)):Tt(n.POLYGON_OFFSET_FILL)}function et(C){C?Ut(n.SCISSOR_TEST):Tt(n.SCISSOR_TEST)}function j(C){C===void 0&&(C=n.TEXTURE0+$-1),tt!==C&&(n.activeTexture(C),tt=C)}function nt(C,at,ct){ct===void 0&&(tt===null?ct=n.TEXTURE0+$-1:ct=tt);let At=rt[ct];At===void 0&&(At={type:void 0,texture:void 0},rt[ct]=At),(At.type!==C||At.texture!==at)&&(tt!==ct&&(n.activeTexture(ct),tt=ct),n.bindTexture(C,at||Rt[C]),At.type=C,At.texture=at)}function xt(){let C=rt[tt];C!==void 0&&C.type!==void 0&&(n.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function lt(){try{n.compressedTexImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function J(){try{n.compressedTexImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function st(){try{n.texSubImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function pt(){try{n.texSubImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Z(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function zt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ct(){try{n.texStorage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function bt(){try{n.texStorage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function mt(){try{n.texImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ut(){try{n.texImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Pt(C){ht.equals(C)===!1&&(n.scissor(C.x,C.y,C.z,C.w),ht.copy(C))}function Zt(C){_t.equals(C)===!1&&(n.viewport(C.x,C.y,C.z,C.w),_t.copy(C))}function Dt(C,at){let ct=u.get(at);ct===void 0&&(ct=new WeakMap,u.set(at,ct));let At=ct.get(C);At===void 0&&(At=n.getUniformBlockIndex(at,C.name),ct.set(C,At))}function Lt(C,at){let At=u.get(at).get(C);h.get(at)!==At&&(n.uniformBlockBinding(at,At,C.__bindingPointIndex),h.set(at,At))}function it(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},tt=null,rt={},p={},g=new WeakMap,_=[],f=null,m=!1,x=null,v=null,M=null,R=null,A=null,T=null,k=null,S=new Ft(0,0,0),w=0,I=!1,q=null,Q=null,L=null,N=null,W=null,ht.set(0,0,n.canvas.width,n.canvas.height),_t.set(0,0,n.canvas.width,n.canvas.height),o.reset(),c.reset(),l.reset()}return{buffers:{color:o,depth:c,stencil:l},enable:Ut,disable:Tt,bindFramebuffer:Yt,drawBuffers:O,useProgram:me,setBlending:vt,setMaterial:Qt,setFlipSided:Bt,setCullFace:E,setLineWidth:y,setPolygonOffset:F,setScissorTest:et,activeTexture:j,bindTexture:nt,unbindTexture:xt,compressedTexImage2D:lt,compressedTexImage3D:J,texImage2D:mt,texImage3D:ut,updateUBOMapping:Dt,uniformBlockBinding:Lt,texStorage2D:Ct,texStorage3D:bt,texSubImage2D:st,texSubImage3D:pt,compressedTexSubImage2D:Z,compressedTexSubImage3D:zt,scissor:Pt,viewport:Zt,reset:it}}function ev(n,t,e,i,s,r,a){let o=s.isWebGL2,c=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,y){return p?new OffscreenCanvas(E,y):Fr("canvas")}function _(E,y,F,et){let j=1;if((E.width>et||E.height>et)&&(j=et/Math.max(E.width,E.height)),j<1||y===!0)if(typeof HTMLImageElement!="undefined"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&E instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&E instanceof ImageBitmap){let nt=y?$a:Math.floor,xt=nt(j*E.width),lt=nt(j*E.height);u===void 0&&(u=g(xt,lt));let J=F?g(xt,lt):u;return J.width=xt,J.height=lt,J.getContext("2d").drawImage(E,0,0,xt,lt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+E.width+"x"+E.height+") to ("+xt+"x"+lt+")."),J}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+E.width+"x"+E.height+")."),E;return E}function f(E){return Rh(E.width)&&Rh(E.height)}function m(E){return o?!1:E.wrapS!==sn||E.wrapT!==sn||E.minFilter!==Fe&&E.minFilter!==Ye}function x(E,y){return E.generateMipmaps&&y&&E.minFilter!==Fe&&E.minFilter!==Ye}function v(E){n.generateMipmap(E)}function M(E,y,F,et,j=!1){if(o===!1)return y;if(E!==null){if(n[E]!==void 0)return n[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let nt=y;if(y===n.RED&&(F===n.FLOAT&&(nt=n.R32F),F===n.HALF_FLOAT&&(nt=n.R16F),F===n.UNSIGNED_BYTE&&(nt=n.R8)),y===n.RED_INTEGER&&(F===n.UNSIGNED_BYTE&&(nt=n.R8UI),F===n.UNSIGNED_SHORT&&(nt=n.R16UI),F===n.UNSIGNED_INT&&(nt=n.R32UI),F===n.BYTE&&(nt=n.R8I),F===n.SHORT&&(nt=n.R16I),F===n.INT&&(nt=n.R32I)),y===n.RG&&(F===n.FLOAT&&(nt=n.RG32F),F===n.HALF_FLOAT&&(nt=n.RG16F),F===n.UNSIGNED_BYTE&&(nt=n.RG8)),y===n.RGBA){let xt=j?Dr:Kt.getTransfer(et);F===n.FLOAT&&(nt=n.RGBA32F),F===n.HALF_FLOAT&&(nt=n.RGBA16F),F===n.UNSIGNED_BYTE&&(nt=xt===se?n.SRGB8_ALPHA8:n.RGBA8),F===n.UNSIGNED_SHORT_4_4_4_4&&(nt=n.RGBA4),F===n.UNSIGNED_SHORT_5_5_5_1&&(nt=n.RGB5_A1)}return(nt===n.R16F||nt===n.R32F||nt===n.RG16F||nt===n.RG32F||nt===n.RGBA16F||nt===n.RGBA32F)&&t.get("EXT_color_buffer_float"),nt}function R(E,y,F){return x(E,F)===!0||E.isFramebufferTexture&&E.minFilter!==Fe&&E.minFilter!==Ye?Math.log2(Math.max(y.width,y.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?y.mipmaps.length:1}function A(E){return E===Fe||E===Jl||E===sa?n.NEAREST:n.LINEAR}function T(E){let y=E.target;y.removeEventListener("dispose",T),S(y),y.isVideoTexture&&h.delete(y)}function k(E){let y=E.target;y.removeEventListener("dispose",k),I(y)}function S(E){let y=i.get(E);if(y.__webglInit===void 0)return;let F=E.source,et=d.get(F);if(et){let j=et[y.__cacheKey];j.usedTimes--,j.usedTimes===0&&w(E),Object.keys(et).length===0&&d.delete(F)}i.remove(E)}function w(E){let y=i.get(E);n.deleteTexture(y.__webglTexture);let F=E.source,et=d.get(F);delete et[y.__cacheKey],a.memory.textures--}function I(E){let y=E.texture,F=i.get(E),et=i.get(y);if(et.__webglTexture!==void 0&&(n.deleteTexture(et.__webglTexture),a.memory.textures--),E.depthTexture&&E.depthTexture.dispose(),E.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(F.__webglFramebuffer[j]))for(let nt=0;nt<F.__webglFramebuffer[j].length;nt++)n.deleteFramebuffer(F.__webglFramebuffer[j][nt]);else n.deleteFramebuffer(F.__webglFramebuffer[j]);F.__webglDepthbuffer&&n.deleteRenderbuffer(F.__webglDepthbuffer[j])}else{if(Array.isArray(F.__webglFramebuffer))for(let j=0;j<F.__webglFramebuffer.length;j++)n.deleteFramebuffer(F.__webglFramebuffer[j]);else n.deleteFramebuffer(F.__webglFramebuffer);if(F.__webglDepthbuffer&&n.deleteRenderbuffer(F.__webglDepthbuffer),F.__webglMultisampledFramebuffer&&n.deleteFramebuffer(F.__webglMultisampledFramebuffer),F.__webglColorRenderbuffer)for(let j=0;j<F.__webglColorRenderbuffer.length;j++)F.__webglColorRenderbuffer[j]&&n.deleteRenderbuffer(F.__webglColorRenderbuffer[j]);F.__webglDepthRenderbuffer&&n.deleteRenderbuffer(F.__webglDepthRenderbuffer)}if(E.isWebGLMultipleRenderTargets)for(let j=0,nt=y.length;j<nt;j++){let xt=i.get(y[j]);xt.__webglTexture&&(n.deleteTexture(xt.__webglTexture),a.memory.textures--),i.remove(y[j])}i.remove(y),i.remove(E)}let q=0;function Q(){q=0}function L(){let E=q;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),q+=1,E}function N(E){let y=[];return y.push(E.wrapS),y.push(E.wrapT),y.push(E.wrapR||0),y.push(E.magFilter),y.push(E.minFilter),y.push(E.anisotropy),y.push(E.internalFormat),y.push(E.format),y.push(E.type),y.push(E.generateMipmaps),y.push(E.premultiplyAlpha),y.push(E.flipY),y.push(E.unpackAlignment),y.push(E.colorSpace),y.join()}function W(E,y){let F=i.get(E);if(E.isVideoTexture&&Qt(E),E.isRenderTargetTexture===!1&&E.version>0&&F.__version!==E.version){let et=E.image;if(et===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(et.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ht(F,E,y);return}}e.bindTexture(n.TEXTURE_2D,F.__webglTexture,n.TEXTURE0+y)}function $(E,y){let F=i.get(E);if(E.version>0&&F.__version!==E.version){ht(F,E,y);return}e.bindTexture(n.TEXTURE_2D_ARRAY,F.__webglTexture,n.TEXTURE0+y)}function G(E,y){let F=i.get(E);if(E.version>0&&F.__version!==E.version){ht(F,E,y);return}e.bindTexture(n.TEXTURE_3D,F.__webglTexture,n.TEXTURE0+y)}function X(E,y){let F=i.get(E);if(E.version>0&&F.__version!==E.version){_t(F,E,y);return}e.bindTexture(n.TEXTURE_CUBE_MAP,F.__webglTexture,n.TEXTURE0+y)}let K={[Xa]:n.REPEAT,[sn]:n.CLAMP_TO_EDGE,[qa]:n.MIRRORED_REPEAT},tt={[Fe]:n.NEAREST,[Jl]:n.NEAREST_MIPMAP_NEAREST,[sa]:n.NEAREST_MIPMAP_LINEAR,[Ye]:n.LINEAR,[Zf]:n.LINEAR_MIPMAP_NEAREST,[Ss]:n.LINEAR_MIPMAP_LINEAR},rt={[op]:n.NEVER,[dp]:n.ALWAYS,[ap]:n.LESS,[ku]:n.LEQUAL,[cp]:n.EQUAL,[up]:n.GEQUAL,[lp]:n.GREATER,[hp]:n.NOTEQUAL};function V(E,y,F){if(F?(n.texParameteri(E,n.TEXTURE_WRAP_S,K[y.wrapS]),n.texParameteri(E,n.TEXTURE_WRAP_T,K[y.wrapT]),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,K[y.wrapR]),n.texParameteri(E,n.TEXTURE_MAG_FILTER,tt[y.magFilter]),n.texParameteri(E,n.TEXTURE_MIN_FILTER,tt[y.minFilter])):(n.texParameteri(E,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(E,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(y.wrapS!==sn||y.wrapT!==sn)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(E,n.TEXTURE_MAG_FILTER,A(y.magFilter)),n.texParameteri(E,n.TEXTURE_MIN_FILTER,A(y.minFilter)),y.minFilter!==Fe&&y.minFilter!==Ye&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),y.compareFunction&&(n.texParameteri(E,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(E,n.TEXTURE_COMPARE_FUNC,rt[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){let et=t.get("EXT_texture_filter_anisotropic");if(y.magFilter===Fe||y.minFilter!==sa&&y.minFilter!==Ss||y.type===kn&&t.has("OES_texture_float_linear")===!1||o===!1&&y.type===bs&&t.has("OES_texture_half_float_linear")===!1)return;(y.anisotropy>1||i.get(y).__currentAnisotropy)&&(n.texParameterf(E,et.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy)}}function Y(E,y){let F=!1;E.__webglInit===void 0&&(E.__webglInit=!0,y.addEventListener("dispose",T));let et=y.source,j=d.get(et);j===void 0&&(j={},d.set(et,j));let nt=N(y);if(nt!==E.__cacheKey){j[nt]===void 0&&(j[nt]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,F=!0),j[nt].usedTimes++;let xt=j[E.__cacheKey];xt!==void 0&&(j[E.__cacheKey].usedTimes--,xt.usedTimes===0&&w(y)),E.__cacheKey=nt,E.__webglTexture=j[nt].texture}return F}function ht(E,y,F){let et=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(et=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(et=n.TEXTURE_3D);let j=Y(E,y),nt=y.source;e.bindTexture(et,E.__webglTexture,n.TEXTURE0+F);let xt=i.get(nt);if(nt.version!==xt.__version||j===!0){e.activeTexture(n.TEXTURE0+F);let lt=Kt.getPrimaries(Kt.workingColorSpace),J=y.colorSpace===Ze?null:Kt.getPrimaries(y.colorSpace),st=y.colorSpace===Ze||lt===J?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,st);let pt=m(y)&&f(y.image)===!1,Z=_(y.image,pt,!1,s.maxTextureSize);Z=Bt(y,Z);let zt=f(Z)||o,Ct=r.convert(y.format,y.colorSpace),bt=r.convert(y.type),mt=M(y.internalFormat,Ct,bt,y.colorSpace,y.isVideoTexture);V(et,y,zt);let ut,Pt=y.mipmaps,Zt=o&&y.isVideoTexture!==!0&&mt!==Fu,Dt=xt.__version===void 0||j===!0,Lt=R(y,Z,zt);if(y.isDepthTexture)mt=n.DEPTH_COMPONENT,o?y.type===kn?mt=n.DEPTH_COMPONENT32F:y.type===zn?mt=n.DEPTH_COMPONENT24:y.type===li?mt=n.DEPTH24_STENCIL8:mt=n.DEPTH_COMPONENT16:y.type===kn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),y.format===hi&&mt===n.DEPTH_COMPONENT&&y.type!==Uc&&y.type!==zn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),y.type=zn,bt=r.convert(y.type)),y.format===qi&&mt===n.DEPTH_COMPONENT&&(mt=n.DEPTH_STENCIL,y.type!==li&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),y.type=li,bt=r.convert(y.type))),Dt&&(Zt?e.texStorage2D(n.TEXTURE_2D,1,mt,Z.width,Z.height):e.texImage2D(n.TEXTURE_2D,0,mt,Z.width,Z.height,0,Ct,bt,null));else if(y.isDataTexture)if(Pt.length>0&&zt){Zt&&Dt&&e.texStorage2D(n.TEXTURE_2D,Lt,mt,Pt[0].width,Pt[0].height);for(let it=0,C=Pt.length;it<C;it++)ut=Pt[it],Zt?e.texSubImage2D(n.TEXTURE_2D,it,0,0,ut.width,ut.height,Ct,bt,ut.data):e.texImage2D(n.TEXTURE_2D,it,mt,ut.width,ut.height,0,Ct,bt,ut.data);y.generateMipmaps=!1}else Zt?(Dt&&e.texStorage2D(n.TEXTURE_2D,Lt,mt,Z.width,Z.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Z.width,Z.height,Ct,bt,Z.data)):e.texImage2D(n.TEXTURE_2D,0,mt,Z.width,Z.height,0,Ct,bt,Z.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Zt&&Dt&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Lt,mt,Pt[0].width,Pt[0].height,Z.depth);for(let it=0,C=Pt.length;it<C;it++)ut=Pt[it],y.format!==rn?Ct!==null?Zt?e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,it,0,0,0,ut.width,ut.height,Z.depth,Ct,ut.data,0,0):e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,it,mt,ut.width,ut.height,Z.depth,0,ut.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Zt?e.texSubImage3D(n.TEXTURE_2D_ARRAY,it,0,0,0,ut.width,ut.height,Z.depth,Ct,bt,ut.data):e.texImage3D(n.TEXTURE_2D_ARRAY,it,mt,ut.width,ut.height,Z.depth,0,Ct,bt,ut.data)}else{Zt&&Dt&&e.texStorage2D(n.TEXTURE_2D,Lt,mt,Pt[0].width,Pt[0].height);for(let it=0,C=Pt.length;it<C;it++)ut=Pt[it],y.format!==rn?Ct!==null?Zt?e.compressedTexSubImage2D(n.TEXTURE_2D,it,0,0,ut.width,ut.height,Ct,ut.data):e.compressedTexImage2D(n.TEXTURE_2D,it,mt,ut.width,ut.height,0,ut.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Zt?e.texSubImage2D(n.TEXTURE_2D,it,0,0,ut.width,ut.height,Ct,bt,ut.data):e.texImage2D(n.TEXTURE_2D,it,mt,ut.width,ut.height,0,Ct,bt,ut.data)}else if(y.isDataArrayTexture)Zt?(Dt&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Lt,mt,Z.width,Z.height,Z.depth),e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,Z.width,Z.height,Z.depth,Ct,bt,Z.data)):e.texImage3D(n.TEXTURE_2D_ARRAY,0,mt,Z.width,Z.height,Z.depth,0,Ct,bt,Z.data);else if(y.isData3DTexture)Zt?(Dt&&e.texStorage3D(n.TEXTURE_3D,Lt,mt,Z.width,Z.height,Z.depth),e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,Z.width,Z.height,Z.depth,Ct,bt,Z.data)):e.texImage3D(n.TEXTURE_3D,0,mt,Z.width,Z.height,Z.depth,0,Ct,bt,Z.data);else if(y.isFramebufferTexture){if(Dt)if(Zt)e.texStorage2D(n.TEXTURE_2D,Lt,mt,Z.width,Z.height);else{let it=Z.width,C=Z.height;for(let at=0;at<Lt;at++)e.texImage2D(n.TEXTURE_2D,at,mt,it,C,0,Ct,bt,null),it>>=1,C>>=1}}else if(Pt.length>0&&zt){Zt&&Dt&&e.texStorage2D(n.TEXTURE_2D,Lt,mt,Pt[0].width,Pt[0].height);for(let it=0,C=Pt.length;it<C;it++)ut=Pt[it],Zt?e.texSubImage2D(n.TEXTURE_2D,it,0,0,Ct,bt,ut):e.texImage2D(n.TEXTURE_2D,it,mt,Ct,bt,ut);y.generateMipmaps=!1}else Zt?(Dt&&e.texStorage2D(n.TEXTURE_2D,Lt,mt,Z.width,Z.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Ct,bt,Z)):e.texImage2D(n.TEXTURE_2D,0,mt,Ct,bt,Z);x(y,zt)&&v(et),xt.__version=nt.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function _t(E,y,F){if(y.image.length!==6)return;let et=Y(E,y),j=y.source;e.bindTexture(n.TEXTURE_CUBE_MAP,E.__webglTexture,n.TEXTURE0+F);let nt=i.get(j);if(j.version!==nt.__version||et===!0){e.activeTexture(n.TEXTURE0+F);let xt=Kt.getPrimaries(Kt.workingColorSpace),lt=y.colorSpace===Ze?null:Kt.getPrimaries(y.colorSpace),J=y.colorSpace===Ze||xt===lt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);let st=y.isCompressedTexture||y.image[0].isCompressedTexture,pt=y.image[0]&&y.image[0].isDataTexture,Z=[];for(let it=0;it<6;it++)!st&&!pt?Z[it]=_(y.image[it],!1,!0,s.maxCubemapSize):Z[it]=pt?y.image[it].image:y.image[it],Z[it]=Bt(y,Z[it]);let zt=Z[0],Ct=f(zt)||o,bt=r.convert(y.format,y.colorSpace),mt=r.convert(y.type),ut=M(y.internalFormat,bt,mt,y.colorSpace),Pt=o&&y.isVideoTexture!==!0,Zt=nt.__version===void 0||et===!0,Dt=R(y,zt,Ct);V(n.TEXTURE_CUBE_MAP,y,Ct);let Lt;if(st){Pt&&Zt&&e.texStorage2D(n.TEXTURE_CUBE_MAP,Dt,ut,zt.width,zt.height);for(let it=0;it<6;it++){Lt=Z[it].mipmaps;for(let C=0;C<Lt.length;C++){let at=Lt[C];y.format!==rn?bt!==null?Pt?e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C,0,0,at.width,at.height,bt,at.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C,ut,at.width,at.height,0,at.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C,0,0,at.width,at.height,bt,mt,at.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C,ut,at.width,at.height,0,bt,mt,at.data)}}}else{Lt=y.mipmaps,Pt&&Zt&&(Lt.length>0&&Dt++,e.texStorage2D(n.TEXTURE_CUBE_MAP,Dt,ut,Z[0].width,Z[0].height));for(let it=0;it<6;it++)if(pt){Pt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,Z[it].width,Z[it].height,bt,mt,Z[it].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,ut,Z[it].width,Z[it].height,0,bt,mt,Z[it].data);for(let C=0;C<Lt.length;C++){let ct=Lt[C].image[it].image;Pt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C+1,0,0,ct.width,ct.height,bt,mt,ct.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C+1,ut,ct.width,ct.height,0,bt,mt,ct.data)}}else{Pt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,bt,mt,Z[it]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,ut,bt,mt,Z[it]);for(let C=0;C<Lt.length;C++){let at=Lt[C];Pt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C+1,0,0,bt,mt,at.image[it]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,C+1,ut,bt,mt,at.image[it])}}}x(y,Ct)&&v(n.TEXTURE_CUBE_MAP),nt.__version=j.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function gt(E,y,F,et,j,nt){let xt=r.convert(F.format,F.colorSpace),lt=r.convert(F.type),J=M(F.internalFormat,xt,lt,F.colorSpace);if(!i.get(y).__hasExternalTextures){let pt=Math.max(1,y.width>>nt),Z=Math.max(1,y.height>>nt);j===n.TEXTURE_3D||j===n.TEXTURE_2D_ARRAY?e.texImage3D(j,nt,J,pt,Z,y.depth,0,xt,lt,null):e.texImage2D(j,nt,J,pt,Z,0,xt,lt,null)}e.bindFramebuffer(n.FRAMEBUFFER,E),vt(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,et,j,i.get(F).__webglTexture,0,Ot(y)):(j===n.TEXTURE_2D||j>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,et,j,i.get(F).__webglTexture,nt),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Rt(E,y,F){if(n.bindRenderbuffer(n.RENDERBUFFER,E),y.depthBuffer&&!y.stencilBuffer){let et=o===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(F||vt(y)){let j=y.depthTexture;j&&j.isDepthTexture&&(j.type===kn?et=n.DEPTH_COMPONENT32F:j.type===zn&&(et=n.DEPTH_COMPONENT24));let nt=Ot(y);vt(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,nt,et,y.width,y.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,nt,et,y.width,y.height)}else n.renderbufferStorage(n.RENDERBUFFER,et,y.width,y.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,E)}else if(y.depthBuffer&&y.stencilBuffer){let et=Ot(y);F&&vt(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,et,n.DEPTH24_STENCIL8,y.width,y.height):vt(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,et,n.DEPTH24_STENCIL8,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,E)}else{let et=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let j=0;j<et.length;j++){let nt=et[j],xt=r.convert(nt.format,nt.colorSpace),lt=r.convert(nt.type),J=M(nt.internalFormat,xt,lt,nt.colorSpace),st=Ot(y);F&&vt(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,st,J,y.width,y.height):vt(y)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,st,J,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,J,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ut(E,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,E),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),W(y.depthTexture,0);let et=i.get(y.depthTexture).__webglTexture,j=Ot(y);if(y.depthTexture.format===hi)vt(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0);else if(y.depthTexture.format===qi)vt(y)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0);else throw new Error("Unknown depthTexture format")}function Tt(E){let y=i.get(E),F=E.isWebGLCubeRenderTarget===!0;if(E.depthTexture&&!y.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");Ut(y.__webglFramebuffer,E)}else if(F){y.__webglDepthbuffer=[];for(let et=0;et<6;et++)e.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[et]),y.__webglDepthbuffer[et]=n.createRenderbuffer(),Rt(y.__webglDepthbuffer[et],E,!1)}else e.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer=n.createRenderbuffer(),Rt(y.__webglDepthbuffer,E,!1);e.bindFramebuffer(n.FRAMEBUFFER,null)}function Yt(E,y,F){let et=i.get(E);y!==void 0&&gt(et.__webglFramebuffer,E,E.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),F!==void 0&&Tt(E)}function O(E){let y=E.texture,F=i.get(E),et=i.get(y);E.addEventListener("dispose",k),E.isWebGLMultipleRenderTargets!==!0&&(et.__webglTexture===void 0&&(et.__webglTexture=n.createTexture()),et.__version=y.version,a.memory.textures++);let j=E.isWebGLCubeRenderTarget===!0,nt=E.isWebGLMultipleRenderTargets===!0,xt=f(E)||o;if(j){F.__webglFramebuffer=[];for(let lt=0;lt<6;lt++)if(o&&y.mipmaps&&y.mipmaps.length>0){F.__webglFramebuffer[lt]=[];for(let J=0;J<y.mipmaps.length;J++)F.__webglFramebuffer[lt][J]=n.createFramebuffer()}else F.__webglFramebuffer[lt]=n.createFramebuffer()}else{if(o&&y.mipmaps&&y.mipmaps.length>0){F.__webglFramebuffer=[];for(let lt=0;lt<y.mipmaps.length;lt++)F.__webglFramebuffer[lt]=n.createFramebuffer()}else F.__webglFramebuffer=n.createFramebuffer();if(nt)if(s.drawBuffers){let lt=E.texture;for(let J=0,st=lt.length;J<st;J++){let pt=i.get(lt[J]);pt.__webglTexture===void 0&&(pt.__webglTexture=n.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&E.samples>0&&vt(E)===!1){let lt=nt?y:[y];F.__webglMultisampledFramebuffer=n.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let J=0;J<lt.length;J++){let st=lt[J];F.__webglColorRenderbuffer[J]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,F.__webglColorRenderbuffer[J]);let pt=r.convert(st.format,st.colorSpace),Z=r.convert(st.type),zt=M(st.internalFormat,pt,Z,st.colorSpace,E.isXRRenderTarget===!0),Ct=Ot(E);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ct,zt,E.width,E.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+J,n.RENDERBUFFER,F.__webglColorRenderbuffer[J])}n.bindRenderbuffer(n.RENDERBUFFER,null),E.depthBuffer&&(F.__webglDepthRenderbuffer=n.createRenderbuffer(),Rt(F.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(j){e.bindTexture(n.TEXTURE_CUBE_MAP,et.__webglTexture),V(n.TEXTURE_CUBE_MAP,y,xt);for(let lt=0;lt<6;lt++)if(o&&y.mipmaps&&y.mipmaps.length>0)for(let J=0;J<y.mipmaps.length;J++)gt(F.__webglFramebuffer[lt][J],E,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,J);else gt(F.__webglFramebuffer[lt],E,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0);x(y,xt)&&v(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(nt){let lt=E.texture;for(let J=0,st=lt.length;J<st;J++){let pt=lt[J],Z=i.get(pt);e.bindTexture(n.TEXTURE_2D,Z.__webglTexture),V(n.TEXTURE_2D,pt,xt),gt(F.__webglFramebuffer,E,pt,n.COLOR_ATTACHMENT0+J,n.TEXTURE_2D,0),x(pt,xt)&&v(n.TEXTURE_2D)}e.unbindTexture()}else{let lt=n.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(o?lt=E.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(lt,et.__webglTexture),V(lt,y,xt),o&&y.mipmaps&&y.mipmaps.length>0)for(let J=0;J<y.mipmaps.length;J++)gt(F.__webglFramebuffer[J],E,y,n.COLOR_ATTACHMENT0,lt,J);else gt(F.__webglFramebuffer,E,y,n.COLOR_ATTACHMENT0,lt,0);x(y,xt)&&v(lt),e.unbindTexture()}E.depthBuffer&&Tt(E)}function me(E){let y=f(E)||o,F=E.isWebGLMultipleRenderTargets===!0?E.texture:[E.texture];for(let et=0,j=F.length;et<j;et++){let nt=F[et];if(x(nt,y)){let xt=E.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,lt=i.get(nt).__webglTexture;e.bindTexture(xt,lt),v(xt),e.unbindTexture()}}}function yt(E){if(o&&E.samples>0&&vt(E)===!1){let y=E.isWebGLMultipleRenderTargets?E.texture:[E.texture],F=E.width,et=E.height,j=n.COLOR_BUFFER_BIT,nt=[],xt=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,lt=i.get(E),J=E.isWebGLMultipleRenderTargets===!0;if(J)for(let st=0;st<y.length;st++)e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+st,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+st,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,lt.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,lt.__webglFramebuffer);for(let st=0;st<y.length;st++){nt.push(n.COLOR_ATTACHMENT0+st),E.depthBuffer&&nt.push(xt);let pt=lt.__ignoreDepthValues!==void 0?lt.__ignoreDepthValues:!1;if(pt===!1&&(E.depthBuffer&&(j|=n.DEPTH_BUFFER_BIT),E.stencilBuffer&&(j|=n.STENCIL_BUFFER_BIT)),J&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,lt.__webglColorRenderbuffer[st]),pt===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[xt]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[xt])),J){let Z=i.get(y[st]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Z,0)}n.blitFramebuffer(0,0,F,et,0,0,F,et,j,n.NEAREST),l&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,nt)}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),J)for(let st=0;st<y.length;st++){e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+st,n.RENDERBUFFER,lt.__webglColorRenderbuffer[st]);let pt=i.get(y[st]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+st,n.TEXTURE_2D,pt,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,lt.__webglMultisampledFramebuffer)}}function Ot(E){return Math.min(s.maxSamples,E.samples)}function vt(E){let y=i.get(E);return o&&E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Qt(E){let y=a.render.frame;h.get(E)!==y&&(h.set(E,y),E.update())}function Bt(E,y){let F=E.colorSpace,et=E.format,j=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||E.format===Ya||F!==Tn&&F!==Ze&&(Kt.getTransfer(F)===se?o===!1?t.has("EXT_sRGB")===!0&&et===rn?(E.format=Ya,E.minFilter=Ye,E.generateMipmaps=!1):y=Br.sRGBToLinear(y):(et!==rn||j!==Gn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),y}this.allocateTextureUnit=L,this.resetTextureUnits=Q,this.setTexture2D=W,this.setTexture2DArray=$,this.setTexture3D=G,this.setTextureCube=X,this.rebindTextures=Yt,this.setupRenderTarget=O,this.updateRenderTargetMipmap=me,this.updateMultisampleRenderTarget=yt,this.setupDepthRenderbuffer=Tt,this.setupFrameBufferTexture=gt,this.useMultisampledRTT=vt}function nv(n,t,e){let i=e.isWebGL2;function s(r,a=Ze){let o,c=Kt.getTransfer(a);if(r===Gn)return n.UNSIGNED_BYTE;if(r===Iu)return n.UNSIGNED_SHORT_4_4_4_4;if(r===Du)return n.UNSIGNED_SHORT_5_5_5_1;if(r===$f)return n.BYTE;if(r===Jf)return n.SHORT;if(r===Uc)return n.UNSIGNED_SHORT;if(r===Lu)return n.INT;if(r===zn)return n.UNSIGNED_INT;if(r===kn)return n.FLOAT;if(r===bs)return i?n.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===Kf)return n.ALPHA;if(r===rn)return n.RGBA;if(r===Qf)return n.LUMINANCE;if(r===jf)return n.LUMINANCE_ALPHA;if(r===hi)return n.DEPTH_COMPONENT;if(r===qi)return n.DEPTH_STENCIL;if(r===Ya)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===tp)return n.RED;if(r===Uu)return n.RED_INTEGER;if(r===ep)return n.RG;if(r===Nu)return n.RG_INTEGER;if(r===Ou)return n.RGBA_INTEGER;if(r===ra||r===oa||r===aa||r===ca)if(c===se)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===ra)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===oa)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===aa)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===ca)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===ra)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===oa)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===aa)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===ca)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Kl||r===Ql||r===jl||r===th)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===Kl)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Ql)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===jl)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===th)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Fu)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===eh||r===nh)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(r===eh)return c===se?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===nh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===ih||r===sh||r===rh||r===oh||r===ah||r===ch||r===lh||r===hh||r===uh||r===dh||r===fh||r===ph||r===mh||r===gh)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(r===ih)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===sh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===rh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===oh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===ah)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===ch)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===lh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===hh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===uh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===dh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===fh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ph)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===mh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===gh)return c===se?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===la||r===_h||r===vh)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(r===la)return c===se?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===_h)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===vh)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===np||r===xh||r===yh||r===Mh)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(r===la)return o.COMPRESSED_RED_RGTC1_EXT;if(r===xh)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===yh)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===Mh)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===li?i?n.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):n[r]!==void 0?n[r]:null}return{convert:s}}function sv(n,t){function e(f,m){f.matrixAutoUpdate===!0&&f.updateMatrix(),m.value.copy(f.matrix)}function i(f,m){m.color.getRGB(f.fogColor.value,Gu(n)),m.isFog?(f.fogNear.value=m.near,f.fogFar.value=m.far):m.isFogExp2&&(f.fogDensity.value=m.density)}function s(f,m,x,v,M){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(f,m):m.isMeshToonMaterial?(r(f,m),u(f,m)):m.isMeshPhongMaterial?(r(f,m),h(f,m)):m.isMeshStandardMaterial?(r(f,m),d(f,m),m.isMeshPhysicalMaterial&&p(f,m,M)):m.isMeshMatcapMaterial?(r(f,m),g(f,m)):m.isMeshDepthMaterial?r(f,m):m.isMeshDistanceMaterial?(r(f,m),_(f,m)):m.isMeshNormalMaterial?r(f,m):m.isLineBasicMaterial?(a(f,m),m.isLineDashedMaterial&&o(f,m)):m.isPointsMaterial?c(f,m,x,v):m.isSpriteMaterial?l(f,m):m.isShadowMaterial?(f.color.value.copy(m.color),f.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(f,m){f.opacity.value=m.opacity,m.color&&f.diffuse.value.copy(m.color),m.emissive&&f.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(f.map.value=m.map,e(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.bumpMap&&(f.bumpMap.value=m.bumpMap,e(m.bumpMap,f.bumpMapTransform),f.bumpScale.value=m.bumpScale,m.side===Pe&&(f.bumpScale.value*=-1)),m.normalMap&&(f.normalMap.value=m.normalMap,e(m.normalMap,f.normalMapTransform),f.normalScale.value.copy(m.normalScale),m.side===Pe&&f.normalScale.value.negate()),m.displacementMap&&(f.displacementMap.value=m.displacementMap,e(m.displacementMap,f.displacementMapTransform),f.displacementScale.value=m.displacementScale,f.displacementBias.value=m.displacementBias),m.emissiveMap&&(f.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,f.emissiveMapTransform)),m.specularMap&&(f.specularMap.value=m.specularMap,e(m.specularMap,f.specularMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest);let x=t.get(m).envMap;if(x&&(f.envMap.value=x,f.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=m.reflectivity,f.ior.value=m.ior,f.refractionRatio.value=m.refractionRatio),m.lightMap){f.lightMap.value=m.lightMap;let v=n._useLegacyLights===!0?Math.PI:1;f.lightMapIntensity.value=m.lightMapIntensity*v,e(m.lightMap,f.lightMapTransform)}m.aoMap&&(f.aoMap.value=m.aoMap,f.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,f.aoMapTransform))}function a(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,m.map&&(f.map.value=m.map,e(m.map,f.mapTransform))}function o(f,m){f.dashSize.value=m.dashSize,f.totalSize.value=m.dashSize+m.gapSize,f.scale.value=m.scale}function c(f,m,x,v){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.size.value=m.size*x,f.scale.value=v*.5,m.map&&(f.map.value=m.map,e(m.map,f.uvTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function l(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.rotation.value=m.rotation,m.map&&(f.map.value=m.map,e(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function h(f,m){f.specular.value.copy(m.specular),f.shininess.value=Math.max(m.shininess,1e-4)}function u(f,m){m.gradientMap&&(f.gradientMap.value=m.gradientMap)}function d(f,m){f.metalness.value=m.metalness,m.metalnessMap&&(f.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,f.metalnessMapTransform)),f.roughness.value=m.roughness,m.roughnessMap&&(f.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,f.roughnessMapTransform)),t.get(m).envMap&&(f.envMapIntensity.value=m.envMapIntensity)}function p(f,m,x){f.ior.value=m.ior,m.sheen>0&&(f.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),f.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(f.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,f.sheenColorMapTransform)),m.sheenRoughnessMap&&(f.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,f.sheenRoughnessMapTransform))),m.clearcoat>0&&(f.clearcoat.value=m.clearcoat,f.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(f.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,f.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(f.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Pe&&f.clearcoatNormalScale.value.negate())),m.iridescence>0&&(f.iridescence.value=m.iridescence,f.iridescenceIOR.value=m.iridescenceIOR,f.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(f.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,f.iridescenceMapTransform)),m.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),m.transmission>0&&(f.transmission.value=m.transmission,f.transmissionSamplerMap.value=x.texture,f.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(f.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,f.transmissionMapTransform)),f.thickness.value=m.thickness,m.thicknessMap&&(f.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=m.attenuationDistance,f.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(f.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(f.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=m.specularIntensity,f.specularColor.value.copy(m.specularColor),m.specularColorMap&&(f.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,f.specularColorMapTransform)),m.specularIntensityMap&&(f.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,m){m.matcap&&(f.matcap.value=m.matcap)}function _(f,m){let x=t.get(m).light;f.referencePosition.value.setFromMatrixPosition(x.matrixWorld),f.nearDistance.value=x.shadow.camera.near,f.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function rv(n,t,e,i){let s={},r={},a=[],o=e.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function c(x,v){let M=v.program;i.uniformBlockBinding(x,M)}function l(x,v){let M=s[x.id];M===void 0&&(g(x),M=h(x),s[x.id]=M,x.addEventListener("dispose",f));let R=v.program;i.updateUBOMapping(x,R);let A=t.render.frame;r[x.id]!==A&&(d(x),r[x.id]=A)}function h(x){let v=u();x.__bindingPointIndex=v;let M=n.createBuffer(),R=x.__size,A=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,R,A),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,v,M),M}function u(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){let v=s[x.id],M=x.uniforms,R=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,v);for(let A=0,T=M.length;A<T;A++){let k=Array.isArray(M[A])?M[A]:[M[A]];for(let S=0,w=k.length;S<w;S++){let I=k[S];if(p(I,A,S,R)===!0){let q=I.__offset,Q=Array.isArray(I.value)?I.value:[I.value],L=0;for(let N=0;N<Q.length;N++){let W=Q[N],$=_(W);typeof W=="number"||typeof W=="boolean"?(I.__data[0]=W,n.bufferSubData(n.UNIFORM_BUFFER,q+L,I.__data)):W.isMatrix3?(I.__data[0]=W.elements[0],I.__data[1]=W.elements[1],I.__data[2]=W.elements[2],I.__data[3]=0,I.__data[4]=W.elements[3],I.__data[5]=W.elements[4],I.__data[6]=W.elements[5],I.__data[7]=0,I.__data[8]=W.elements[6],I.__data[9]=W.elements[7],I.__data[10]=W.elements[8],I.__data[11]=0):(W.toArray(I.__data,L),L+=$.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,q,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(x,v,M,R){let A=x.value,T=v+"_"+M;if(R[T]===void 0)return typeof A=="number"||typeof A=="boolean"?R[T]=A:R[T]=A.clone(),!0;{let k=R[T];if(typeof A=="number"||typeof A=="boolean"){if(k!==A)return R[T]=A,!0}else if(k.equals(A)===!1)return k.copy(A),!0}return!1}function g(x){let v=x.uniforms,M=0,R=16;for(let T=0,k=v.length;T<k;T++){let S=Array.isArray(v[T])?v[T]:[v[T]];for(let w=0,I=S.length;w<I;w++){let q=S[w],Q=Array.isArray(q.value)?q.value:[q.value];for(let L=0,N=Q.length;L<N;L++){let W=Q[L],$=_(W),G=M%R;G!==0&&R-G<$.boundary&&(M+=R-G),q.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),q.__offset=M,M+=$.storage}}}let A=M%R;return A>0&&(M+=R-A),x.__size=M,x.__cache={},this}function _(x){let v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function f(x){let v=x.target;v.removeEventListener("dispose",f);let M=a.indexOf(v.__bindingPointIndex);a.splice(M,1),n.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function m(){for(let x in s)n.deleteBuffer(s[x]);a=[],s={},r={}}return{bind:c,update:l,dispose:m}}function vu(n,t,e,i,s,r,a){let o=dc.distanceSqToPoint(n);if(o<e){let c=new P;dc.closestPointToPoint(n,c),c.applyMatrix4(i);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:t,face:null,object:a})}}function Fc(){let n=0,t=0,e=0,i=0;function s(r,a,o,c){n=r,t=o,e=-3*r+3*a-2*o-c,i=2*r-2*a+o+c}return{initCatmullRom:function(r,a,o,c,l){s(a,o,l*(o-r),l*(c-a))},initNonuniformCatmullRom:function(r,a,o,c,l,h,u){let d=(a-r)/l-(o-r)/(l+h)+(o-a)/h,p=(o-a)/h-(c-a)/(h+u)+(c-o)/u;d*=h,p*=h,s(a,o,d,p)},calc:function(r){let a=r*r,o=a*r;return n+t*r+e*a+i*o}}}function xu(n,t,e,i,s){let r=(i-t)*.5,a=(s-e)*.5,o=n*n,c=n*o;return(2*e-2*i+r+a)*c+(-3*e+3*i-2*r-a)*o+r*n+e}function ov(n,t){let e=1-n;return e*e*t}function av(n,t){return 2*(1-n)*n*t}function cv(n,t){return n*n*t}function vs(n,t,e,i){return ov(n,t)+av(n,e)+cv(n,i)}function lv(n,t){let e=1-n;return e*e*e*t}function hv(n,t){let e=1-n;return 3*e*e*n*t}function uv(n,t){return 3*(1-n)*n*n*t}function dv(n,t){return n*n*n*t}function xs(n,t,e,i,s){return lv(n,t)+hv(n,e)+uv(n,i)+dv(n,s)}function Ju(n,t,e,i,s){let r,a;if(s===Cv(n,t,e,i)>0)for(r=t;r<e;r+=i)a=Mu(r,n[r],n[r+1],a);else for(r=e-i;r>=t;r-=i)a=Mu(r,n[r],n[r+1],a);return a&&mo(a,a.next)&&(Is(a),a=a.next),a}function mi(n,t){if(!n)return n;t||(t=n);let e=n,i;do if(i=!1,!e.steiner&&(mo(e,e.next)||le(e.prev,e,e.next)===0)){if(Is(e),e=t=e.prev,e===e.next)break;i=!0}else e=e.next;while(i||e!==t);return t}function Ps(n,t,e,i,s,r,a){if(!n)return;!a&&r&&bv(n,i,s,r);let o=n,c,l;for(;n.prev!==n.next;){if(c=n.prev,l=n.next,r?mv(n,i,s,r):pv(n)){t.push(c.i/e|0),t.push(n.i/e|0),t.push(l.i/e|0),Is(n),n=l.next,o=l.next;continue}if(n=l,n===o){a?a===1?(n=gv(mi(n),t,e),Ps(n,t,e,i,s,r,2)):a===2&&_v(n,t,e,i,s,r):Ps(mi(n),t,e,i,s,r,1);break}}}function pv(n){let t=n.prev,e=n,i=n.next;if(le(t,e,i)>=0)return!1;let s=t.x,r=e.x,a=i.x,o=t.y,c=e.y,l=i.y,h=s<r?s<a?s:a:r<a?r:a,u=o<c?o<l?o:l:c<l?c:l,d=s>r?s>a?s:a:r>a?r:a,p=o>c?o>l?o:l:c>l?c:l,g=i.next;for(;g!==t;){if(g.x>=h&&g.x<=d&&g.y>=u&&g.y<=p&&ki(s,o,r,c,a,l,g.x,g.y)&&le(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function mv(n,t,e,i){let s=n.prev,r=n,a=n.next;if(le(s,r,a)>=0)return!1;let o=s.x,c=r.x,l=a.x,h=s.y,u=r.y,d=a.y,p=o<c?o<l?o:l:c<l?c:l,g=h<u?h<d?h:d:u<d?u:d,_=o>c?o>l?o:l:c>l?c:l,f=h>u?h>d?h:d:u>d?u:d,m=xc(p,g,t,e,i),x=xc(_,f,t,e,i),v=n.prevZ,M=n.nextZ;for(;v&&v.z>=m&&M&&M.z<=x;){if(v.x>=p&&v.x<=_&&v.y>=g&&v.y<=f&&v!==s&&v!==a&&ki(o,h,c,u,l,d,v.x,v.y)&&le(v.prev,v,v.next)>=0||(v=v.prevZ,M.x>=p&&M.x<=_&&M.y>=g&&M.y<=f&&M!==s&&M!==a&&ki(o,h,c,u,l,d,M.x,M.y)&&le(M.prev,M,M.next)>=0))return!1;M=M.nextZ}for(;v&&v.z>=m;){if(v.x>=p&&v.x<=_&&v.y>=g&&v.y<=f&&v!==s&&v!==a&&ki(o,h,c,u,l,d,v.x,v.y)&&le(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;M&&M.z<=x;){if(M.x>=p&&M.x<=_&&M.y>=g&&M.y<=f&&M!==s&&M!==a&&ki(o,h,c,u,l,d,M.x,M.y)&&le(M.prev,M,M.next)>=0)return!1;M=M.nextZ}return!0}function gv(n,t,e){let i=n;do{let s=i.prev,r=i.next.next;!mo(s,r)&&Ku(s,i,i.next,r)&&Ls(s,r)&&Ls(r,s)&&(t.push(s.i/e|0),t.push(i.i/e|0),t.push(r.i/e|0),Is(i),Is(i.next),i=n=r),i=i.next}while(i!==n);return mi(i)}function _v(n,t,e,i,s,r){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Tv(a,o)){let c=Qu(a,o);a=mi(a,a.next),c=mi(c,c.next),Ps(a,t,e,i,s,r,0),Ps(c,t,e,i,s,r,0);return}o=o.next}a=a.next}while(a!==n)}function vv(n,t,e,i){let s=[],r,a,o,c,l;for(r=0,a=t.length;r<a;r++)o=t[r]*i,c=r<a-1?t[r+1]*i:n.length,l=Ju(n,o,c,i,!1),l===l.next&&(l.steiner=!0),s.push(wv(l));for(s.sort(xv),r=0;r<s.length;r++)e=yv(s[r],e);return e}function xv(n,t){return n.x-t.x}function yv(n,t){let e=Mv(n,t);if(!e)return t;let i=Qu(e,n);return mi(i,i.next),mi(e,e.next)}function Mv(n,t){let e=t,i=-1/0,s,r=n.x,a=n.y;do{if(a<=e.y&&a>=e.next.y&&e.next.y!==e.y){let d=e.x+(a-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>i&&(i=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;let o=s,c=s.x,l=s.y,h=1/0,u;e=s;do r>=e.x&&e.x>=c&&r!==e.x&&ki(a<l?r:i,a,c,l,a<l?i:r,a,e.x,e.y)&&(u=Math.abs(a-e.y)/(r-e.x),Ls(e,n)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&Sv(s,e)))&&(s=e,h=u)),e=e.next;while(e!==o);return s}function Sv(n,t){return le(n.prev,n,t.prev)<0&&le(t.next,n,n.next)<0}function bv(n,t,e,i){let s=n;do s.z===0&&(s.z=xc(s.x,s.y,t,e,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,Ev(s)}function Ev(n){let t,e,i,s,r,a,o,c,l=1;do{for(e=n,n=null,r=null,a=0;e;){for(a++,i=e,o=0,t=0;t<l&&(o++,i=i.nextZ,!!i);t++);for(c=l;o>0||c>0&&i;)o!==0&&(c===0||!i||e.z<=i.z)?(s=e,e=e.nextZ,o--):(s=i,i=i.nextZ,c--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;e=i}r.nextZ=null,l*=2}while(a>1);return n}function xc(n,t,e,i,s){return n=(n-e)*s|0,t=(t-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,n|t<<1}function wv(n){let t=n,e=n;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==n);return e}function ki(n,t,e,i,s,r,a,o){return(s-a)*(t-o)>=(n-a)*(r-o)&&(n-a)*(i-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(i-o)}function Tv(n,t){return n.next.i!==t.i&&n.prev.i!==t.i&&!Av(n,t)&&(Ls(n,t)&&Ls(t,n)&&Rv(n,t)&&(le(n.prev,n,t.prev)||le(n,t.prev,t))||mo(n,t)&&le(n.prev,n,n.next)>0&&le(t.prev,t,t.next)>0)}function le(n,t,e){return(t.y-n.y)*(e.x-t.x)-(t.x-n.x)*(e.y-t.y)}function mo(n,t){return n.x===t.x&&n.y===t.y}function Ku(n,t,e,i){let s=Ar(le(n,t,e)),r=Ar(le(n,t,i)),a=Ar(le(e,i,n)),o=Ar(le(e,i,t));return!!(s!==r&&a!==o||s===0&&Tr(n,e,t)||r===0&&Tr(n,i,t)||a===0&&Tr(e,n,i)||o===0&&Tr(e,t,i))}function Tr(n,t,e){return t.x<=Math.max(n.x,e.x)&&t.x>=Math.min(n.x,e.x)&&t.y<=Math.max(n.y,e.y)&&t.y>=Math.min(n.y,e.y)}function Ar(n){return n>0?1:n<0?-1:0}function Av(n,t){let e=n;do{if(e.i!==n.i&&e.next.i!==n.i&&e.i!==t.i&&e.next.i!==t.i&&Ku(e,e.next,n,t))return!0;e=e.next}while(e!==n);return!1}function Ls(n,t){return le(n.prev,n,n.next)<0?le(n,t,n.next)>=0&&le(n,n.prev,t)>=0:le(n,t,n.prev)<0||le(n,n.next,t)<0}function Rv(n,t){let e=n,i=!1,s=(n.x+t.x)/2,r=(n.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(i=!i),e=e.next;while(e!==n);return i}function Qu(n,t){let e=new yc(n.i,n.x,n.y),i=new yc(t.i,t.x,t.y),s=n.next,r=t.prev;return n.next=t,t.prev=n,e.next=s,s.prev=e,i.next=e,e.prev=i,r.next=i,i.prev=r,i}function Mu(n,t,e,i){let s=new yc(n,t,e);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function Is(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function yc(n,t,e){this.i=n,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Cv(n,t,e,i){let s=0;for(let r=t,a=e-i;r<e;r+=i)s+=(n[a]-n[r])*(n[r+1]+n[a+1]),a=r;return s}function Su(n){let t=n.length;t>2&&n[t-1].equals(n[0])&&n.pop()}function bu(n,t){for(let e=0;e<t.length;e++)n.push(t[e].x),n.push(t[e].y)}function Pv(n,t){if(t.shapes=[],Array.isArray(n))for(let e=0,i=n.length;e<i;e++){let s=n[e];t.shapes.push(s.uuid)}else t.shapes.push(n.uuid);return t}function Rr(n,t,e){return!n||!e&&n.constructor===t?n:typeof t.BYTES_PER_ELEMENT=="number"?new t(n):Array.prototype.slice.call(n)}function Lv(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function Au(){return(typeof performance=="undefined"?Date:performance).now()}var mf,Xl,gf,Ru,_f,bn,Wn,Pe,Ge,Hn,Hi,Ms,ql,Yl,vf,oi,xf,yf,Zl,$l,Mf,Sf,bf,Ef,Ha,Va,wf,Tf,Af,Rf,Cf,Pf,Lf,If,Df,Uf,Nf,Of,Pr,Ff,Bf,zf,kf,Cu,Hf,Vf,Vn,Gf,Wf,Xf,Dc,qf,Yf,Pu,Wi,Xi,Ga,Wa,uo,Xa,sn,qa,Fe,Jl,sa,Ye,Zf,Ss,Gn,$f,Jf,Uc,Lu,zn,kn,bs,Iu,Du,li,Kf,rn,Qf,jf,hi,qi,tp,Uu,ep,Nu,Ou,ra,oa,aa,ca,Kl,Ql,jl,th,Fu,eh,nh,ih,sh,rh,oh,ah,ch,lh,hh,uh,dh,fh,ph,mh,gh,la,_h,vh,np,xh,yh,Mh,Lr,Ir,ha,Sh,bh,Eh,Bu,ui,ip,sp,zu,rp,Ze,xe,Tn,Nc,fo,Dr,se,Ur,Nr,Si,wh,op,ap,cp,ku,lp,hp,up,dp,Th,Ah,Ya,wn,Or,Xn,Ae,Cr,Za,ft,qt,da,Ch,Ph,Lh,Ks,mp,Kt,bi,Br,gp,zr,_p,$e,oe,Ja,An,kr,Ka,qn,P,ma,Ih,di,vn,tn,Qs,Ei,wi,Ti,Un,Nn,ei,us,js,tr,ni,vp,ds,_a,fi,xn,va,er,On,xa,nr,ya,Es,de,Ai,en,xp,yp,Fn,ir,He,Dh,Uh,Hr,Vr,Mp,Nh,Ri,yn,sr,fs,Sp,bp,Oh,Fh,Bh,Ep,wp,Ie,nn,Mn,Ma,Sn,Ci,Pi,zh,Sa,ba,Ea,rr,ci,Vu,Bn,or,Ft,Re,Tp,Rn,Cn,ge,ar,Le,Gr,Wr,fe,Ap,qe,Ta,Li,Ve,ps,Ee,De,kh,ii,cr,Hh,Ii,Di,Ui,Aa,lr,hr,ur,dr,Vh,Gh,Wh,fr,pr,$t,pi,Pp,Lp,Ip,Je,Xr,Ce,Ni,Oi,Qa,qr,ja,Ra,Dp,Up,En,si,gr,ws,Zi,Op,Fp,Bp,zp,kp,Hp,Vp,Gp,Wp,Xp,qp,Yp,Zp,$p,Jp,Kp,Qp,jp,tm,em,nm,im,sm,rm,om,am,cm,lm,hm,um,dm,fm,pm,mm,gm,_m,vm,xm,ym,Mm,Sm,bm,Em,wm,Tm,Am,Rm,Cm,Pm,Lm,Im,Dm,Um,Nm,Om,Fm,Bm,zm,km,Hm,Vm,Gm,Wm,Xm,qm,Ym,Zm,$m,Jm,Km,Qm,jm,tg,eg,ng,ig,sg,rg,og,ag,cg,lg,hg,ug,dg,fg,pg,mg,gg,_g,vg,xg,yg,Mg,Sg,bg,Eg,wg,Tg,Ag,Rg,Cg,Pg,Lg,Ig,Dg,Ug,Ng,Og,Fg,Bg,zg,kg,Hg,Vg,Gg,Wg,Xg,qg,Yg,Zg,$g,Jg,Kg,Qg,jg,t0,e0,n0,i0,s0,r0,o0,a0,c0,l0,h0,u0,d0,f0,p0,Vt,ot,fn,_r,Yr,Bi,Xh,ai,Ca,qh,Pa,La,Ia,ri,Fi,Yh,$i,Zr,Xu,qu,Yu,Zu,$u,Kh,Qh,jh,tu,eu,tc,ec,nc,Da,Gi,x_,y_,C_,P_,I_,k_,sc,rc,Y_,oc,ac,K_,Q_,cc,on,iv,_s,lc,Ts,hc,Ji,Ki,du,fu,pu,Ua,xr,$r,mu,gu,As,Jr,uc,_u,dc,yr,Mr,Kr,Qr,Ke,Rs,fc,Sr,Na,Oa,Fa,pc,jr,mc,to,gc,eo,_c,no,yu,vc,Qi,io,br,Er,Ba,wr,so,Cs,fv,ys,ro,Yn,oo,ji,Mc,Sc,bc,an,gi,Ec,wc,Tc,Ds,_i,Ac,Rc,Iv,Cc,Us,za,Eu,wu,ao,Tu,ms,ka,Pc,vi,Lc,co,lo,ho,Bc,Dv,zc,Uv,Nv,Ov,Fv,Bv,zv,kv,Ic,re,nx,kc=zs(()=>{mf=0,Xl=1,gf=2,Ru=1,_f=2,bn=3,Wn=0,Pe=1,Ge=2,Hn=0,Hi=1,Ms=2,ql=3,Yl=4,vf=5,oi=100,xf=101,yf=102,Zl=103,$l=104,Mf=200,Sf=201,bf=202,Ef=203,Ha=204,Va=205,wf=206,Tf=207,Af=208,Rf=209,Cf=210,Pf=211,Lf=212,If=213,Df=214,Uf=0,Nf=1,Of=2,Pr=3,Ff=4,Bf=5,zf=6,kf=7,Cu=0,Hf=1,Vf=2,Vn=0,Gf=1,Wf=2,Xf=3,Dc=4,qf=5,Yf=6,Pu=300,Wi=301,Xi=302,Ga=303,Wa=304,uo=306,Xa=1e3,sn=1001,qa=1002,Fe=1003,Jl=1004,sa=1005,Ye=1006,Zf=1007,Ss=1008,Gn=1009,$f=1010,Jf=1011,Uc=1012,Lu=1013,zn=1014,kn=1015,bs=1016,Iu=1017,Du=1018,li=1020,Kf=1021,rn=1023,Qf=1024,jf=1025,hi=1026,qi=1027,tp=1028,Uu=1029,ep=1030,Nu=1031,Ou=1033,ra=33776,oa=33777,aa=33778,ca=33779,Kl=35840,Ql=35841,jl=35842,th=35843,Fu=36196,eh=37492,nh=37496,ih=37808,sh=37809,rh=37810,oh=37811,ah=37812,ch=37813,lh=37814,hh=37815,uh=37816,dh=37817,fh=37818,ph=37819,mh=37820,gh=37821,la=36492,_h=36494,vh=36495,np=36283,xh=36284,yh=36285,Mh=36286,Lr=2300,Ir=2301,ha=2302,Sh=2400,bh=2401,Eh=2402,Bu=3e3,ui=3001,ip=3200,sp=3201,zu=0,rp=1,Ze="",xe="srgb",Tn="srgb-linear",Nc="display-p3",fo="display-p3-linear",Dr="linear",se="srgb",Ur="rec709",Nr="p3",Si=7680,wh=519,op=512,ap=513,cp=514,ku=515,lp=516,hp=517,up=518,dp=519,Th=35044,Ah="300 es",Ya=1035,wn=2e3,Or=2001,Xn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let i=this._listeners[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Ae=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Cr=Math.PI/180,Za=180/Math.PI;ft=class n{constructor(t=0,e=0){n.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6],this.y=s[1]*e+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(we(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*i-a*s+t.x,this.y=r*s+a*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},qt=class n{constructor(t,e,i,s,r,a,o,c,l){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,a,o,c,l)}set(t,e,i,s,r,a,o,c,l){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=c,h[6]=i,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,a=i[0],o=i[3],c=i[6],l=i[1],h=i[4],u=i[7],d=i[2],p=i[5],g=i[8],_=s[0],f=s[3],m=s[6],x=s[1],v=s[4],M=s[7],R=s[2],A=s[5],T=s[8];return r[0]=a*_+o*x+c*R,r[3]=a*f+o*v+c*A,r[6]=a*m+o*M+c*T,r[1]=l*_+h*x+u*R,r[4]=l*f+h*v+u*A,r[7]=l*m+h*M+u*T,r[2]=d*_+p*x+g*R,r[5]=d*f+p*v+g*A,r[8]=d*m+p*M+g*T,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8];return e*a*h-e*o*l-i*r*h+i*o*c+s*r*l-s*a*c}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],u=h*a-o*l,d=o*c-h*r,p=l*r-a*c,g=e*u+i*d+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/g;return t[0]=u*_,t[1]=(s*l-h*i)*_,t[2]=(o*i-s*a)*_,t[3]=d*_,t[4]=(h*e-s*c)*_,t[5]=(s*r-o*e)*_,t[6]=p*_,t[7]=(i*c-l*e)*_,t[8]=(a*e-i*r)*_,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,s,r,a,o){let c=Math.cos(r),l=Math.sin(r);return this.set(i*c,i*l,-i*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(da.makeScale(t,e)),this}rotate(t){return this.premultiply(da.makeRotation(-t)),this}translate(t,e){return this.premultiply(da.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<9;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},da=new qt;Ch={};Ph=new qt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Lh=new qt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ks={[Tn]:{transfer:Dr,primaries:Ur,toReference:n=>n,fromReference:n=>n},[xe]:{transfer:se,primaries:Ur,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[fo]:{transfer:Dr,primaries:Nr,toReference:n=>n.applyMatrix3(Lh),fromReference:n=>n.applyMatrix3(Ph)},[Nc]:{transfer:se,primaries:Nr,toReference:n=>n.convertSRGBToLinear().applyMatrix3(Lh),fromReference:n=>n.applyMatrix3(Ph).convertLinearToSRGB()}},mp=new Set([Tn,fo]),Kt={enabled:!0,_workingColorSpace:Tn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!mp.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,t,e){if(this.enabled===!1||t===e||!t||!e)return n;let i=Ks[t].toReference,s=Ks[e].fromReference;return s(i(n))},fromWorkingColorSpace:function(n,t){return this.convert(n,this._workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this._workingColorSpace)},getPrimaries:function(n){return Ks[n].primaries},getTransfer:function(n){return n===Ze?Dr:Ks[n].transfer}};Br=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement=="undefined")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{bi===void 0&&(bi=Fr("canvas")),bi.width=t.width,bi.height=t.height;let i=bi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=bi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement!="undefined"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&t instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&t instanceof ImageBitmap){let e=Fr("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Vi(r[a]/255)*255;return i.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Vi(e[i]/255)*255):e[i]=Vi(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},gp=0,zr=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:gp++}),this.uuid=ts(),this.data=t,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(pa(s[a].image)):r.push(pa(s[a]))}else r=pa(s);i.url=r}return e||(t.images[this.uuid]=i),i}};_p=0,$e=class n extends Xn{constructor(t=n.DEFAULT_IMAGE,e=n.DEFAULT_MAPPING,i=sn,s=sn,r=Ye,a=Ss,o=rn,c=Gn,l=n.DEFAULT_ANISOTROPY,h=Ze){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:_p++}),this.uuid=ts(),this.name="",this.source=new zr(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(gs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===ui?xe:Ze),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Pu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Xa:t.x=t.x-Math.floor(t.x);break;case sn:t.x=t.x<0?0:1;break;case qa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Xa:t.y=t.y-Math.floor(t.y);break;case sn:t.y=t.y<0?0:1;break;case qa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return gs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===xe?ui:Bu}set encoding(t){gs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=t===ui?xe:Ze}};$e.DEFAULT_IMAGE=null;$e.DEFAULT_MAPPING=Pu;$e.DEFAULT_ANISOTROPY=1;oe=class n{constructor(t=0,e=0,i=0,s=1){n.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*i+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*i+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*i+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,s,r,c=t.elements,l=c[0],h=c[4],u=c[8],d=c[1],p=c[5],g=c[9],_=c[2],f=c[6],m=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(g-f)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(g+f)<.1&&Math.abs(l+p+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let v=(l+1)/2,M=(p+1)/2,R=(m+1)/2,A=(h+d)/4,T=(u+_)/4,k=(g+f)/4;return v>M&&v>R?v<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(v),s=A/i,r=T/i):M>R?M<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),i=A/s,r=k/s):R<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),i=T/r,s=k/r),this.set(i,s,r,e),this}let x=Math.sqrt((f-g)*(f-g)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(f-g)/x,this.y=(u-_)/x,this.z=(d-h)/x,this.w=Math.acos((l+p+m-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ja=class extends Xn{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new oe(0,0,t,e),this.scissorTest=!1,this.viewport=new oe(0,0,t,e);let s={width:t,height:e,depth:1};i.encoding!==void 0&&(gs("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===ui?xe:Ze),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ye,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new $e(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(t,e,i=1){(this.width!==t||this.height!==e||this.depth!==i)&&(this.width=t,this.height=e,this.depth=i,this.texture.image.width=t,this.texture.image.height=e,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.texture.isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new zr(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},An=class extends Ja{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},kr=class extends $e{constructor(t=null,e=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=sn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ka=class extends $e{constructor(t=null,e=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=sn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},qn=class{constructor(t=0,e=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=s}static slerpFlat(t,e,i,s,r,a,o){let c=i[s+0],l=i[s+1],h=i[s+2],u=i[s+3],d=r[a+0],p=r[a+1],g=r[a+2],_=r[a+3];if(o===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=_;return}if(u!==_||c!==d||l!==p||h!==g){let f=1-o,m=c*d+l*p+h*g+u*_,x=m>=0?1:-1,v=1-m*m;if(v>Number.EPSILON){let R=Math.sqrt(v),A=Math.atan2(R,m*x);f=Math.sin(f*A)/R,o=Math.sin(o*A)/R}let M=o*x;if(c=c*f+d*M,l=l*f+p*M,h=h*f+g*M,u=u*f+_*M,f===1-o){let R=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=R,l*=R,h*=R,u*=R}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,i,s,r,a){let o=i[s],c=i[s+1],l=i[s+2],h=i[s+3],u=r[a],d=r[a+1],p=r[a+2],g=r[a+3];return t[e]=o*g+h*u+c*p-l*d,t[e+1]=c*g+h*d+l*u-o*p,t[e+2]=l*g+h*p+o*d-c*u,t[e+3]=h*g-o*u-c*d-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(i/2),h=o(s/2),u=o(r/2),d=c(i/2),p=c(s/2),g=c(r/2);switch(a){case"XYZ":this._x=d*h*u+l*p*g,this._y=l*p*u-d*h*g,this._z=l*h*g+d*p*u,this._w=l*h*u-d*p*g;break;case"YXZ":this._x=d*h*u+l*p*g,this._y=l*p*u-d*h*g,this._z=l*h*g-d*p*u,this._w=l*h*u+d*p*g;break;case"ZXY":this._x=d*h*u-l*p*g,this._y=l*p*u+d*h*g,this._z=l*h*g+d*p*u,this._w=l*h*u-d*p*g;break;case"ZYX":this._x=d*h*u-l*p*g,this._y=l*p*u+d*h*g,this._z=l*h*g-d*p*u,this._w=l*h*u+d*p*g;break;case"YZX":this._x=d*h*u+l*p*g,this._y=l*p*u+d*h*g,this._z=l*h*g-d*p*u,this._w=l*h*u-d*p*g;break;case"XZY":this._x=d*h*u-l*p*g,this._y=l*p*u-d*h*g,this._z=l*h*g+d*p*u,this._w=l*h*u+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],h=e[6],u=e[10],d=i+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-c)*p,this._y=(r-l)*p,this._z=(a-s)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(h-c)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+l)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(r-l)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(c+h)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-s)/p,this._x=(r+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(we(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,e/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,h=e._w;return this._x=i*h+a*o+s*l-r*c,this._y=s*h+a*c+r*o-i*l,this._z=r*h+a*l+i*c-s*o,this._w=a*h-i*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let i=this._x,s=this._y,r=this._z,a=this._w,o=a*t._w+i*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=i,this._y=s,this._z=r,this;let c=1-o*o;if(c<=Number.EPSILON){let p=1-e;return this._w=p*a+e*this._w,this._x=p*i+e*this._x,this._y=p*s+e*this._y,this._z=p*r+e*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,o),u=Math.sin((1-e)*h)/l,d=Math.sin(e*h)/l;return this._w=a*u+this._w*d,this._x=i*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=Math.random(),e=Math.sqrt(1-t),i=Math.sqrt(t),s=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(e*Math.cos(s),i*Math.sin(r),i*Math.cos(r),e*Math.sin(s))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class n{constructor(t=0,e=0,i=0){n.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Ih.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Ih.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*s,this.y=r[1]*e+r[4]*i+r[7]*s,this.z=r[2]*e+r[5]*i+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*i+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*i+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,i=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*i),h=2*(o*e-r*s),u=2*(r*i-a*e);return this.x=e+c*l+a*u-o*h,this.y=i+c*h+o*l-r*u,this.z=s+c*u+r*h-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*s,this.y=r[1]*e+r[5]*i+r[9]*s,this.z=r[2]*e+r[6]*i+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-i*c,this.z=i*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return ma.copy(this).projectOnVector(t),this.sub(ma)}reflect(t){return this.sub(ma.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(we(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let s=Math.sin(e)*t;return this.x=s*Math.sin(i),this.y=Math.cos(e)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=(Math.random()-.5)*2,e=Math.random()*Math.PI*2,i=Math.sqrt(1-t**2);return this.x=i*Math.cos(e),this.y=i*Math.sin(e),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ma=new P,Ih=new qn,di=class{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(tn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(tn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=tn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,tn):tn.fromBufferAttribute(r,a),tn.applyMatrix4(t.matrixWorld),this.expandByPoint(tn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Qs.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Qs.copy(i.boundingBox)),Qs.applyMatrix4(t.matrixWorld),this.union(Qs)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,tn),tn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(us),js.subVectors(this.max,us),Ei.subVectors(t.a,us),wi.subVectors(t.b,us),Ti.subVectors(t.c,us),Un.subVectors(wi,Ei),Nn.subVectors(Ti,wi),ei.subVectors(Ei,Ti);let e=[0,-Un.z,Un.y,0,-Nn.z,Nn.y,0,-ei.z,ei.y,Un.z,0,-Un.x,Nn.z,0,-Nn.x,ei.z,0,-ei.x,-Un.y,Un.x,0,-Nn.y,Nn.x,0,-ei.y,ei.x,0];return!ga(e,Ei,wi,Ti,js)||(e=[1,0,0,0,1,0,0,0,1],!ga(e,Ei,wi,Ti,js))?!1:(tr.crossVectors(Un,Nn),e=[tr.x,tr.y,tr.z],ga(e,Ei,wi,Ti,js))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,tn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(tn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(vn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),vn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),vn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),vn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),vn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),vn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),vn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),vn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(vn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},vn=[new P,new P,new P,new P,new P,new P,new P,new P],tn=new P,Qs=new di,Ei=new P,wi=new P,Ti=new P,Un=new P,Nn=new P,ei=new P,us=new P,js=new P,tr=new P,ni=new P;vp=new di,ds=new P,_a=new P,fi=class{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):vp.setFromPoints(t).getCenter(i);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ds.subVectors(t,this.center);let e=ds.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),s=(i-this.radius)*.5;this.center.addScaledVector(ds,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(_a.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ds.copy(t.center).add(_a)),this.expandByPoint(ds.copy(t.center).sub(_a))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},xn=new P,va=new P,er=new P,On=new P,xa=new P,nr=new P,ya=new P,Es=class{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,xn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=xn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(xn.copy(this.origin).addScaledVector(this.direction,e),xn.distanceToSquared(t))}distanceSqToSegment(t,e,i,s){va.copy(t).add(e).multiplyScalar(.5),er.copy(e).sub(t).normalize(),On.copy(this.origin).sub(va);let r=t.distanceTo(e)*.5,a=-this.direction.dot(er),o=On.dot(this.direction),c=-On.dot(er),l=On.lengthSq(),h=Math.abs(1-a*a),u,d,p,g;if(h>0)if(u=a*c-o,d=a*o-c,g=r*h,u>=0)if(d>=-g)if(d<=g){let _=1/h;u*=_,d*=_,p=u*(u+a*d+2*o)+d*(a*u+d+2*c)+l}else d=r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*c)+l;else d=-r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*c)+l;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-c),r),p=-u*u+d*(d+2*c)+l):d<=g?(u=0,d=Math.min(Math.max(-r,-c),r),p=d*(d+2*c)+l):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-c),r),p=-u*u+d*(d+2*c)+l);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(va).addScaledVector(er,d),p}intersectSphere(t,e){xn.subVectors(t.center,this.origin);let i=xn.dot(this.direction),s=xn.dot(xn)-i*i,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=i-a,c=i+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,s,r,a,o,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(i=(t.min.x-d.x)*l,s=(t.max.x-d.x)*l):(i=(t.max.x-d.x)*l,s=(t.min.x-d.x)*l),h>=0?(r=(t.min.y-d.y)*h,a=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,a=(t.min.y-d.y)*h),i>a||r>s||((r>i||isNaN(i))&&(i=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(t.min.z-d.z)*u,c=(t.max.z-d.z)*u):(o=(t.max.z-d.z)*u,c=(t.min.z-d.z)*u),i>c||o>s)||((o>i||i!==i)&&(i=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,e)}intersectsBox(t){return this.intersectBox(t,xn)!==null}intersectTriangle(t,e,i,s,r){xa.subVectors(e,t),nr.subVectors(i,t),ya.crossVectors(xa,nr);let a=this.direction.dot(ya),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;On.subVectors(this.origin,t);let c=o*this.direction.dot(nr.crossVectors(On,nr));if(c<0)return null;let l=o*this.direction.dot(xa.cross(On));if(l<0||c+l>a)return null;let h=-o*On.dot(ya);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},de=class n{constructor(t,e,i,s,r,a,o,c,l,h,u,d,p,g,_,f){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,a,o,c,l,h,u,d,p,g,_,f)}set(t,e,i,s,r,a,o,c,l,h,u,d,p,g,_,f){let m=this.elements;return m[0]=t,m[4]=e,m[8]=i,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=c,m[2]=l,m[6]=h,m[10]=u,m[14]=d,m[3]=p,m[7]=g,m[11]=_,m[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,i=t.elements,s=1/Ai.setFromMatrixColumn(t,0).length(),r=1/Ai.setFromMatrixColumn(t,1).length(),a=1/Ai.setFromMatrixColumn(t,2).length();return e[0]=i[0]*s,e[1]=i[1]*s,e[2]=i[2]*s,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*a,e[9]=i[9]*a,e[10]=i[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,s=t.y,r=t.z,a=Math.cos(i),o=Math.sin(i),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let d=a*h,p=a*u,g=o*h,_=o*u;e[0]=c*h,e[4]=-c*u,e[8]=l,e[1]=p+g*l,e[5]=d-_*l,e[9]=-o*c,e[2]=_-d*l,e[6]=g+p*l,e[10]=a*c}else if(t.order==="YXZ"){let d=c*h,p=c*u,g=l*h,_=l*u;e[0]=d+_*o,e[4]=g*o-p,e[8]=a*l,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=p*o-g,e[6]=_+d*o,e[10]=a*c}else if(t.order==="ZXY"){let d=c*h,p=c*u,g=l*h,_=l*u;e[0]=d-_*o,e[4]=-a*u,e[8]=g+p*o,e[1]=p+g*o,e[5]=a*h,e[9]=_-d*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){let d=a*h,p=a*u,g=o*h,_=o*u;e[0]=c*h,e[4]=g*l-p,e[8]=d*l+_,e[1]=c*u,e[5]=_*l+d,e[9]=p*l-g,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){let d=a*c,p=a*l,g=o*c,_=o*l;e[0]=c*h,e[4]=_-d*u,e[8]=g*u+p,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-l*h,e[6]=p*u+g,e[10]=d-_*u}else if(t.order==="XZY"){let d=a*c,p=a*l,g=o*c,_=o*l;e[0]=c*h,e[4]=-u,e[8]=l*h,e[1]=d*u+_,e[5]=a*h,e[9]=p*u-g,e[2]=g*u-p,e[6]=o*h,e[10]=_*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(xp,t,yp)}lookAt(t,e,i){let s=this.elements;return He.subVectors(t,e),He.lengthSq()===0&&(He.z=1),He.normalize(),Fn.crossVectors(i,He),Fn.lengthSq()===0&&(Math.abs(i.z)===1?He.x+=1e-4:He.z+=1e-4,He.normalize(),Fn.crossVectors(i,He)),Fn.normalize(),ir.crossVectors(He,Fn),s[0]=Fn.x,s[4]=ir.x,s[8]=He.x,s[1]=Fn.y,s[5]=ir.y,s[9]=He.y,s[2]=Fn.z,s[6]=ir.z,s[10]=He.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,a=i[0],o=i[4],c=i[8],l=i[12],h=i[1],u=i[5],d=i[9],p=i[13],g=i[2],_=i[6],f=i[10],m=i[14],x=i[3],v=i[7],M=i[11],R=i[15],A=s[0],T=s[4],k=s[8],S=s[12],w=s[1],I=s[5],q=s[9],Q=s[13],L=s[2],N=s[6],W=s[10],$=s[14],G=s[3],X=s[7],K=s[11],tt=s[15];return r[0]=a*A+o*w+c*L+l*G,r[4]=a*T+o*I+c*N+l*X,r[8]=a*k+o*q+c*W+l*K,r[12]=a*S+o*Q+c*$+l*tt,r[1]=h*A+u*w+d*L+p*G,r[5]=h*T+u*I+d*N+p*X,r[9]=h*k+u*q+d*W+p*K,r[13]=h*S+u*Q+d*$+p*tt,r[2]=g*A+_*w+f*L+m*G,r[6]=g*T+_*I+f*N+m*X,r[10]=g*k+_*q+f*W+m*K,r[14]=g*S+_*Q+f*$+m*tt,r[3]=x*A+v*w+M*L+R*G,r[7]=x*T+v*I+M*N+R*X,r[11]=x*k+v*q+M*W+R*K,r[15]=x*S+v*Q+M*$+R*tt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],h=t[2],u=t[6],d=t[10],p=t[14],g=t[3],_=t[7],f=t[11],m=t[15];return g*(+r*c*u-s*l*u-r*o*d+i*l*d+s*o*p-i*c*p)+_*(+e*c*p-e*l*d+r*a*d-s*a*p+s*l*h-r*c*h)+f*(+e*l*u-e*o*p-r*a*u+i*a*p+r*o*h-i*l*h)+m*(-s*o*h-e*c*u+e*o*d+s*a*u-i*a*d+i*c*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],u=t[9],d=t[10],p=t[11],g=t[12],_=t[13],f=t[14],m=t[15],x=u*f*l-_*d*l+_*c*p-o*f*p-u*c*m+o*d*m,v=g*d*l-h*f*l-g*c*p+a*f*p+h*c*m-a*d*m,M=h*_*l-g*u*l+g*o*p-a*_*p-h*o*m+a*u*m,R=g*u*c-h*_*c-g*o*d+a*_*d+h*o*f-a*u*f,A=e*x+i*v+s*M+r*R;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/A;return t[0]=x*T,t[1]=(_*d*r-u*f*r-_*s*p+i*f*p+u*s*m-i*d*m)*T,t[2]=(o*f*r-_*c*r+_*s*l-i*f*l-o*s*m+i*c*m)*T,t[3]=(u*c*r-o*d*r-u*s*l+i*d*l+o*s*p-i*c*p)*T,t[4]=v*T,t[5]=(h*f*r-g*d*r+g*s*p-e*f*p-h*s*m+e*d*m)*T,t[6]=(g*c*r-a*f*r-g*s*l+e*f*l+a*s*m-e*c*m)*T,t[7]=(a*d*r-h*c*r+h*s*l-e*d*l-a*s*p+e*c*p)*T,t[8]=M*T,t[9]=(g*u*r-h*_*r-g*i*p+e*_*p+h*i*m-e*u*m)*T,t[10]=(a*_*r-g*o*r+g*i*l-e*_*l-a*i*m+e*o*m)*T,t[11]=(h*o*r-a*u*r-h*i*l+e*u*l+a*i*p-e*o*p)*T,t[12]=R*T,t[13]=(h*_*s-g*u*s+g*i*d-e*_*d-h*i*f+e*u*f)*T,t[14]=(g*o*s-a*_*s-g*i*c+e*_*c+a*i*f-e*o*f)*T,t[15]=(a*u*s-h*o*s+h*i*c-e*u*c-a*i*d+e*o*d)*T,this}scale(t){let e=this.elements,i=t.x,s=t.y,r=t.z;return e[0]*=i,e[4]*=s,e[8]*=r,e[1]*=i,e[5]*=s,e[9]*=r,e[2]*=i,e[6]*=s,e[10]*=r,e[3]*=i,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,s))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),s=Math.sin(e),r=1-i,a=t.x,o=t.y,c=t.z,l=r*a,h=r*o;return this.set(l*a+i,l*o-s*c,l*c+s*o,0,l*o+s*c,h*o+i,h*c-s*a,0,l*c-s*o,h*c+s*a,r*c*c+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,s,r,a){return this.set(1,i,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,i){let s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,h=a+a,u=o+o,d=r*l,p=r*h,g=r*u,_=a*h,f=a*u,m=o*u,x=c*l,v=c*h,M=c*u,R=i.x,A=i.y,T=i.z;return s[0]=(1-(_+m))*R,s[1]=(p+M)*R,s[2]=(g-v)*R,s[3]=0,s[4]=(p-M)*A,s[5]=(1-(d+m))*A,s[6]=(f+x)*A,s[7]=0,s[8]=(g+v)*T,s[9]=(f-x)*T,s[10]=(1-(d+_))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,i){let s=this.elements,r=Ai.set(s[0],s[1],s[2]).length(),a=Ai.set(s[4],s[5],s[6]).length(),o=Ai.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],en.copy(this);let l=1/r,h=1/a,u=1/o;return en.elements[0]*=l,en.elements[1]*=l,en.elements[2]*=l,en.elements[4]*=h,en.elements[5]*=h,en.elements[6]*=h,en.elements[8]*=u,en.elements[9]*=u,en.elements[10]*=u,e.setFromRotationMatrix(en),i.x=r,i.y=a,i.z=o,this}makePerspective(t,e,i,s,r,a,o=wn){let c=this.elements,l=2*r/(e-t),h=2*r/(i-s),u=(e+t)/(e-t),d=(i+s)/(i-s),p,g;if(o===wn)p=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Or)p=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,i,s,r,a,o=wn){let c=this.elements,l=1/(e-t),h=1/(i-s),u=1/(a-r),d=(e+t)*l,p=(i+s)*h,g,_;if(o===wn)g=(a+r)*u,_=-2*u;else if(o===Or)g=r*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=_,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<16;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},Ai=new P,en=new de,xp=new P(0,0,0),yp=new P(1,1,1),Fn=new P,ir=new P,He=new P,Dh=new de,Uh=new qn,Hr=class n{constructor(t=0,e=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,s=this._order){return this._x=t,this._y=e,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],h=s[9],u=s[2],d=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(we(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-we(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(we(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-we(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(we(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-we(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Dh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Dh,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Uh.setFromEuler(this),this.setFromQuaternion(Uh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Hr.DEFAULT_ORDER="XYZ";Vr=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Mp=0,Nh=new P,Ri=new qn,yn=new de,sr=new P,fs=new P,Sp=new P,bp=new qn,Oh=new P(1,0,0),Fh=new P(0,1,0),Bh=new P(0,0,1),Ep={type:"added"},wp={type:"removed"},Ie=class n extends Xn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mp++}),this.uuid=ts(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let t=new P,e=new Hr,i=new qn,s=new P(1,1,1);function r(){i.setFromEuler(e,!1)}function a(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new de},normalMatrix:{value:new qt}}),this.matrix=new de,this.matrixWorld=new de,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Vr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.multiply(Ri),this}rotateOnWorldAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.premultiply(Ri),this}rotateX(t){return this.rotateOnAxis(Oh,t)}rotateY(t){return this.rotateOnAxis(Fh,t)}rotateZ(t){return this.rotateOnAxis(Bh,t)}translateOnAxis(t,e){return Nh.copy(t).applyQuaternion(this.quaternion),this.position.add(Nh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Oh,t)}translateY(t){return this.translateOnAxis(Fh,t)}translateZ(t){return this.translateOnAxis(Bh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(yn.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?sr.copy(t):sr.set(t,e,i);let s=this.parent;this.updateWorldMatrix(!0,!1),fs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?yn.lookAt(fs,sr,this.up):yn.lookAt(sr,fs,this.up),this.quaternion.setFromRotationMatrix(yn),s&&(yn.extractRotation(s.matrixWorld),Ri.setFromRotationMatrix(yn),this.quaternion.premultiply(Ri.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Ep)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(wp)),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),yn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),yn.multiply(t.parent.matrixWorld)),t.applyMatrix4(yn),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,s=this.children.length;i<s;i++){let a=this.children[i].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fs,t,Sp),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fs,bp,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,s=e.length;i<s;i++){let r=e[i];(r.matrixWorldAutoUpdate===!0||t===!0)&&r.updateMatrixWorld(t)}}updateWorldMatrix(t,e){let i=this.parent;if(t===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++){let o=s[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(t.shapes,u)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){let o=a(t.geometries),c=a(t.materials),l=a(t.textures),h=a(t.images),u=a(t.shapes),d=a(t.skeletons),p=a(t.animations),g=a(t.nodes);o.length>0&&(i.geometries=o),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=s,i;function a(o){let c=[];for(let l in o){let h=o[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}};Ie.DEFAULT_UP=new P(0,1,0);Ie.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ie.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;nn=new P,Mn=new P,Ma=new P,Sn=new P,Ci=new P,Pi=new P,zh=new P,Sa=new P,ba=new P,Ea=new P,rr=!1,ci=class n{constructor(t=new P,e=new P,i=new P){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,s){s.subVectors(i,e),nn.subVectors(t,e),s.cross(nn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,i,s,r){nn.subVectors(s,e),Mn.subVectors(i,e),Ma.subVectors(t,e);let a=nn.dot(nn),o=nn.dot(Mn),c=nn.dot(Ma),l=Mn.dot(Mn),h=Mn.dot(Ma),u=a*l-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,p=(l*c-o*h)*d,g=(a*h-o*c)*d;return r.set(1-p-g,g,p)}static containsPoint(t,e,i,s){return this.getBarycoord(t,e,i,s,Sn)===null?!1:Sn.x>=0&&Sn.y>=0&&Sn.x+Sn.y<=1}static getUV(t,e,i,s,r,a,o,c){return rr===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),rr=!0),this.getInterpolation(t,e,i,s,r,a,o,c)}static getInterpolation(t,e,i,s,r,a,o,c){return this.getBarycoord(t,e,i,s,Sn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Sn.x),c.addScaledVector(a,Sn.y),c.addScaledVector(o,Sn.z),c)}static isFrontFacing(t,e,i,s){return nn.subVectors(i,e),Mn.subVectors(t,e),nn.cross(Mn).dot(s)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,s){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,i,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return nn.subVectors(this.c,this.b),Mn.subVectors(this.a,this.b),nn.cross(Mn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return n.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return n.getBarycoord(t,this.a,this.b,this.c,e)}getUV(t,e,i,s,r){return rr===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),rr=!0),n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}getInterpolation(t,e,i,s,r){return n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}containsPoint(t){return n.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return n.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,s=this.b,r=this.c,a,o;Ci.subVectors(s,i),Pi.subVectors(r,i),Sa.subVectors(t,i);let c=Ci.dot(Sa),l=Pi.dot(Sa);if(c<=0&&l<=0)return e.copy(i);ba.subVectors(t,s);let h=Ci.dot(ba),u=Pi.dot(ba);if(h>=0&&u<=h)return e.copy(s);let d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return a=c/(c-h),e.copy(i).addScaledVector(Ci,a);Ea.subVectors(t,r);let p=Ci.dot(Ea),g=Pi.dot(Ea);if(g>=0&&p<=g)return e.copy(r);let _=p*l-c*g;if(_<=0&&l>=0&&g<=0)return o=l/(l-g),e.copy(i).addScaledVector(Pi,o);let f=h*g-p*u;if(f<=0&&u-h>=0&&p-g>=0)return zh.subVectors(r,s),o=(u-h)/(u-h+(p-g)),e.copy(s).addScaledVector(zh,o);let m=1/(f+_+d);return a=_*m,o=d*m,e.copy(i).addScaledVector(Ci,a).addScaledVector(Pi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Vu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Bn={h:0,s:0,l:0},or={h:0,s:0,l:0};Ft=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=xe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.toWorkingColorSpace(this,e),this}setRGB(t,e,i,s=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=i,Kt.toWorkingColorSpace(this,s),this}setHSL(t,e,i,s=Kt.workingColorSpace){if(t=fp(t,1),e=we(e,0,1),i=we(i,0,1),e===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+e):i+e-i*e,a=2*i-r;this.r=wa(a,r,t+1/3),this.g=wa(a,r,t),this.b=wa(a,r,t-1/3)}return Kt.toWorkingColorSpace(this,s),this}setStyle(t,e=xe){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=xe){let i=Vu[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Vi(t.r),this.g=Vi(t.g),this.b=Vi(t.b),this}copyLinearToSRGB(t){return this.r=fa(t.r),this.g=fa(t.g),this.b=fa(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=xe){return Kt.fromWorkingColorSpace(Re.copy(this),t),Math.round(we(Re.r*255,0,255))*65536+Math.round(we(Re.g*255,0,255))*256+Math.round(we(Re.b*255,0,255))}getHexString(t=xe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.fromWorkingColorSpace(Re.copy(this),e);let i=Re.r,s=Re.g,r=Re.b,a=Math.max(i,s,r),o=Math.min(i,s,r),c,l,h=(o+a)/2;if(o===a)c=0,l=0;else{let u=a-o;switch(l=h<=.5?u/(a+o):u/(2-a-o),a){case i:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-i)/u+2;break;case r:c=(i-s)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=Kt.workingColorSpace){return Kt.fromWorkingColorSpace(Re.copy(this),e),t.r=Re.r,t.g=Re.g,t.b=Re.b,t}getStyle(t=xe){Kt.fromWorkingColorSpace(Re.copy(this),t);let e=Re.r,i=Re.g,s=Re.b;return t!==xe?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,e,i){return this.getHSL(Bn),this.setHSL(Bn.h+t,Bn.s+e,Bn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Bn),t.getHSL(or);let i=ua(Bn.h,or.h,e),s=ua(Bn.s,or.s,e),r=ua(Bn.l,or.l,e);return this.setHSL(i,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*s,this.g=r[1]*e+r[4]*i+r[7]*s,this.b=r[2]*e+r[5]*i+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Re=new Ft;Ft.NAMES=Vu;Tp=0,Rn=class extends Xn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Tp++}),this.uuid=ts(),this.name="",this.type="Material",this.blending=Hi,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ha,this.blendDst=Va,this.blendEquation=oi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ft(0,0,0),this.blendAlpha=0,this.depthFunc=Pr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=wh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Si,this.stencilZFail=Si,this.stencilZPass=Si,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Hi&&(i.blending=this.blending),this.side!==Wn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Ha&&(i.blendSrc=this.blendSrc),this.blendDst!==Va&&(i.blendDst=this.blendDst),this.blendEquation!==oi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Pr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==wh&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Si&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Si&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Si&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let a=[];for(let o in r){let c=r[o];delete c.metadata,a.push(c)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let s=e.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Cn=class extends Rn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Cu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},ge=new P,ar=new ft,Le=class{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Th,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=kn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)ar.fromBufferAttribute(this,e),ar.applyMatrix3(t),this.setXY(e,ar.x,ar.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix3(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix4(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)ge.fromBufferAttribute(this,e),ge.applyNormalMatrix(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)ge.fromBufferAttribute(this,e),ge.transformDirection(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=hs(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=ze(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=hs(e,this.array)),e}setX(t,e){return this.normalized&&(e=ze(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=hs(e,this.array)),e}setY(t,e){return this.normalized&&(e=ze(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=hs(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ze(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=hs(e,this.array)),e}setW(t,e){return this.normalized&&(e=ze(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=ze(e,this.array),i=ze(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,s){return t*=this.itemSize,this.normalized&&(e=ze(e,this.array),i=ze(i,this.array),s=ze(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,e,i,s,r){return t*=this.itemSize,this.normalized&&(e=ze(e,this.array),i=ze(i,this.array),s=ze(s,this.array),r=ze(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Th&&(t.usage=this.usage),t}},Gr=class extends Le{constructor(t,e,i){super(new Uint16Array(t),e,i)}},Wr=class extends Le{constructor(t,e,i){super(new Uint32Array(t),e,i)}},fe=class extends Le{constructor(t,e,i){super(new Float32Array(t),e,i)}},Ap=0,qe=new de,Ta=new Ie,Li=new P,Ve=new di,ps=new di,Ee=new P,De=class n extends Xn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ap++}),this.uuid=ts(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Hu(t)?Wr:Gr)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new qt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return qe.makeRotationFromQuaternion(t),this.applyMatrix4(qe),this}rotateX(t){return qe.makeRotationX(t),this.applyMatrix4(qe),this}rotateY(t){return qe.makeRotationY(t),this.applyMatrix4(qe),this}rotateZ(t){return qe.makeRotationZ(t),this.applyMatrix4(qe),this}translate(t,e,i){return qe.makeTranslation(t,e,i),this.applyMatrix4(qe),this}scale(t,e,i){return qe.makeScale(t,e,i),this.applyMatrix4(qe),this}lookAt(t){return Ta.lookAt(t),Ta.updateMatrix(),this.applyMatrix4(Ta.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Li).negate(),this.translate(Li.x,Li.y,Li.z),this}setFromPoints(t){let e=[];for(let i=0,s=t.length;i<s;i++){let r=t[i];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new fe(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new di);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,s=e.length;i<s;i++){let r=e[i];Ve.setFromBufferAttribute(r),this.morphTargetsRelative?(Ee.addVectors(this.boundingBox.min,Ve.min),this.boundingBox.expandByPoint(Ee),Ee.addVectors(this.boundingBox.max,Ve.max),this.boundingBox.expandByPoint(Ee)):(this.boundingBox.expandByPoint(Ve.min),this.boundingBox.expandByPoint(Ve.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new fi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new P,1/0);return}if(t){let i=this.boundingSphere.center;if(Ve.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];ps.setFromBufferAttribute(o),this.morphTargetsRelative?(Ee.addVectors(Ve.min,ps.min),Ve.expandByPoint(Ee),Ee.addVectors(Ve.max,ps.max),Ve.expandByPoint(Ee)):(Ve.expandByPoint(ps.min),Ve.expandByPoint(ps.max))}Ve.getCenter(i);let s=0;for(let r=0,a=t.count;r<a;r++)Ee.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(Ee));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Ee.fromBufferAttribute(o,l),c&&(Li.fromBufferAttribute(t,l),Ee.add(Li)),s=Math.max(s,i.distanceToSquared(Ee))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.array,s=e.position.array,r=e.normal.array,a=e.uv.array,o=s.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Le(new Float32Array(4*o),4));let c=this.getAttribute("tangent").array,l=[],h=[];for(let w=0;w<o;w++)l[w]=new P,h[w]=new P;let u=new P,d=new P,p=new P,g=new ft,_=new ft,f=new ft,m=new P,x=new P;function v(w,I,q){u.fromArray(s,w*3),d.fromArray(s,I*3),p.fromArray(s,q*3),g.fromArray(a,w*2),_.fromArray(a,I*2),f.fromArray(a,q*2),d.sub(u),p.sub(u),_.sub(g),f.sub(g);let Q=1/(_.x*f.y-f.x*_.y);isFinite(Q)&&(m.copy(d).multiplyScalar(f.y).addScaledVector(p,-_.y).multiplyScalar(Q),x.copy(p).multiplyScalar(_.x).addScaledVector(d,-f.x).multiplyScalar(Q),l[w].add(m),l[I].add(m),l[q].add(m),h[w].add(x),h[I].add(x),h[q].add(x))}let M=this.groups;M.length===0&&(M=[{start:0,count:i.length}]);for(let w=0,I=M.length;w<I;++w){let q=M[w],Q=q.start,L=q.count;for(let N=Q,W=Q+L;N<W;N+=3)v(i[N+0],i[N+1],i[N+2])}let R=new P,A=new P,T=new P,k=new P;function S(w){T.fromArray(r,w*3),k.copy(T);let I=l[w];R.copy(I),R.sub(T.multiplyScalar(T.dot(I))).normalize(),A.crossVectors(k,I);let Q=A.dot(h[w])<0?-1:1;c[w*4]=R.x,c[w*4+1]=R.y,c[w*4+2]=R.z,c[w*4+3]=Q}for(let w=0,I=M.length;w<I;++w){let q=M[w],Q=q.start,L=q.count;for(let N=Q,W=Q+L;N<W;N+=3)S(i[N+0]),S(i[N+1]),S(i[N+2])}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Le(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);let s=new P,r=new P,a=new P,o=new P,c=new P,l=new P,h=new P,u=new P;if(t)for(let d=0,p=t.count;d<p;d+=3){let g=t.getX(d+0),_=t.getX(d+1),f=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,_),a.fromBufferAttribute(e,f),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(i,g),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,f),o.add(h),c.add(h),l.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(f,l.x,l.y,l.z)}else for(let d=0,p=e.count;d<p;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),a.fromBufferAttribute(e,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ee.fromBufferAttribute(t,e),Ee.normalize(),t.setXYZ(e,Ee.x,Ee.y,Ee.z)}toNonIndexed(){function t(o,c){let l=o.array,h=o.itemSize,u=o.normalized,d=new l.constructor(c.length*h),p=0,g=0;for(let _=0,f=c.length;_<f;_++){o.isInterleavedBufferAttribute?p=c[_]*o.data.stride+o.offset:p=c[_]*h;for(let m=0;m<h;m++)d[g++]=l[p++]}return new Le(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new n,i=this.index.array,s=this.attributes;for(let o in s){let c=s[o],l=t(c,i);e.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let c=[],l=r[o];for(let h=0,u=l.length;h<u;h++){let d=l[h],p=t(d,i);c.push(p)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let c in i){let l=i[c];t.data.attributes[c]=l.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){let p=l[u];h.push(p.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone(e));let s=t.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(e))}let r=t.morphAttributes;for(let l in r){let h=[],u=r[l];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let l=0,h=a.length;l<h;l++){let u=a[l];this.addGroup(u.start,u.count,u.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},kh=new de,ii=new Es,cr=new fi,Hh=new P,Ii=new P,Di=new P,Ui=new P,Aa=new P,lr=new P,hr=new ft,ur=new ft,dr=new ft,Vh=new P,Gh=new P,Wh=new P,fr=new P,pr=new P,$t=class extends Ie{constructor(t=new De,e=new Cn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){lr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=o[c],u=r[c];h!==0&&(Aa.fromBufferAttribute(u,t),a?lr.addScaledVector(Aa,h):lr.addScaledVector(Aa.sub(e),h))}e.add(lr)}return e}raycast(t,e){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),cr.copy(i.boundingSphere),cr.applyMatrix4(r),ii.copy(t.ray).recast(t.near),!(cr.containsPoint(ii.origin)===!1&&(ii.intersectSphere(cr,Hh)===null||ii.origin.distanceToSquared(Hh)>(t.far-t.near)**2))&&(kh.copy(r).invert(),ii.copy(t.ray).applyMatrix4(kh),!(i.boundingBox!==null&&ii.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,ii)))}_computeIntersections(t,e,i){let s,r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){let f=d[g],m=a[f.materialIndex],x=Math.max(f.start,p.start),v=Math.min(o.count,Math.min(f.start+f.count,p.start+p.count));for(let M=x,R=v;M<R;M+=3){let A=o.getX(M),T=o.getX(M+1),k=o.getX(M+2);s=mr(this,m,t,i,l,h,u,A,T,k),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let f=g,m=_;f<m;f+=3){let x=o.getX(f),v=o.getX(f+1),M=o.getX(f+2);s=mr(this,a,t,i,l,h,u,x,v,M),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){let f=d[g],m=a[f.materialIndex],x=Math.max(f.start,p.start),v=Math.min(c.count,Math.min(f.start+f.count,p.start+p.count));for(let M=x,R=v;M<R;M+=3){let A=M,T=M+1,k=M+2;s=mr(this,m,t,i,l,h,u,A,T,k),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),_=Math.min(c.count,p.start+p.count);for(let f=g,m=_;f<m;f+=3){let x=f,v=f+1,M=f+2;s=mr(this,a,t,i,l,h,u,x,v,M),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}}};pi=class n extends De{constructor(t=1,e=1,i=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let c=[],l=[],h=[],u=[],d=0,p=0;g("z","y","x",-1,-1,i,e,t,a,r,0),g("z","y","x",1,-1,i,e,-t,a,r,1),g("x","z","y",1,1,t,i,e,s,a,2),g("x","z","y",1,-1,t,i,-e,s,a,3),g("x","y","z",1,-1,t,e,i,s,r,4),g("x","y","z",-1,-1,t,e,-i,s,r,5),this.setIndex(c),this.setAttribute("position",new fe(l,3)),this.setAttribute("normal",new fe(h,3)),this.setAttribute("uv",new fe(u,2));function g(_,f,m,x,v,M,R,A,T,k,S){let w=M/T,I=R/k,q=M/2,Q=R/2,L=A/2,N=T+1,W=k+1,$=0,G=0,X=new P;for(let K=0;K<W;K++){let tt=K*I-Q;for(let rt=0;rt<N;rt++){let V=rt*w-q;X[_]=V*x,X[f]=tt*v,X[m]=L,l.push(X.x,X.y,X.z),X[_]=0,X[f]=0,X[m]=A>0?1:-1,h.push(X.x,X.y,X.z),u.push(rt/T),u.push(1-K/k),$+=1}}for(let K=0;K<k;K++)for(let tt=0;tt<T;tt++){let rt=d+tt+N*K,V=d+tt+N*(K+1),Y=d+(tt+1)+N*(K+1),ht=d+(tt+1)+N*K;c.push(rt,V,ht),c.push(V,Y,ht),G+=6}o.addGroup(p,G,S),p+=G,d+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};Pp={clone:Yi,merge:Oe},Lp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ip=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Je=class extends Rn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Lp,this.fragmentShader=Ip,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Yi(t.uniforms),this.uniformsGroups=Cp(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}},Xr=class extends Ie{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new de,this.projectionMatrix=new de,this.projectionMatrixInverse=new de,this.coordinateSystem=wn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ce=class extends Xr{constructor(t=50,e=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Za*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Cr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Za*2*Math.atan(Math.tan(Cr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(t,e,i,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Cr*.5*this.fov)/this.zoom,i=2*e,s=this.aspect*i,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*i/l,s*=a.width/c,i*=a.height/l}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Ni=-90,Oi=1,Qa=class extends Ie{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ce(Ni,Oi,t,e);s.layers=this.layers,this.add(s);let r=new Ce(Ni,Oi,t,e);r.layers=this.layers,this.add(r);let a=new Ce(Ni,Oi,t,e);a.layers=this.layers,this.add(a);let o=new Ce(Ni,Oi,t,e);o.layers=this.layers,this.add(o);let c=new Ce(Ni,Oi,t,e);c.layers=this.layers,this.add(c);let l=new Ce(Ni,Oi,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,s,r,a,o,c]=e;for(let l of e)this.remove(l);if(t===wn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Or)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,c,l,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,s),t.render(e,r),t.setRenderTarget(i,1,s),t.render(e,a),t.setRenderTarget(i,2,s),t.render(e,o),t.setRenderTarget(i,3,s),t.render(e,c),t.setRenderTarget(i,4,s),t.render(e,l),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,s),t.render(e,h),t.setRenderTarget(u,d,p),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},qr=class extends $e{constructor(t,e,i,s,r,a,o,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:Wi,super(t,e,i,s,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},ja=class extends An{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];e.encoding!==void 0&&(gs("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===ui?xe:Ze),this.texture=new qr(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ye}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new pi(5,5,5),r=new Je({name:"CubemapFromEquirect",uniforms:Yi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Pe,blending:Hn});r.uniforms.tEquirect.value=e;let a=new $t(s,r),o=e.minFilter;return e.minFilter===Ss&&(e.minFilter=Ye),new Qa(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,i,s){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,i,s);t.setRenderTarget(r)}},Ra=new P,Dp=new P,Up=new qt,En=class{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let s=Ra.subVectors(i,e).cross(Dp.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let i=t.delta(Ra),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||Up.getNormalMatrix(t),s=this.coplanarPoint(Ra).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},si=new fi,gr=new P,ws=class{constructor(t=new En,e=new En,i=new En,s=new En,r=new En,a=new En){this.planes=[t,e,i,s,r,a]}set(t,e,i,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=wn){let i=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],c=s[3],l=s[4],h=s[5],u=s[6],d=s[7],p=s[8],g=s[9],_=s[10],f=s[11],m=s[12],x=s[13],v=s[14],M=s[15];if(i[0].setComponents(c-r,d-l,f-p,M-m).normalize(),i[1].setComponents(c+r,d+l,f+p,M+m).normalize(),i[2].setComponents(c+a,d+h,f+g,M+x).normalize(),i[3].setComponents(c-a,d-h,f-g,M-x).normalize(),i[4].setComponents(c-o,d-u,f-_,M-v).normalize(),e===wn)i[5].setComponents(c+o,d+u,f+_,M+v).normalize();else if(e===Or)i[5].setComponents(o,u,_,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),si.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),si.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(si)}intersectsSprite(t){return si.center.set(0,0,0),si.radius=.7071067811865476,si.applyMatrix4(t.matrixWorld),this.intersectsSphere(si)}intersectsSphere(t){let e=this.planes,i=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let s=e[i];if(gr.x=s.normal.x>0?t.max.x:t.min.x,gr.y=s.normal.y>0?t.max.y:t.min.y,gr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(gr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};Zi=class n extends De{constructor(t=1,e=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(i),c=Math.floor(s),l=o+1,h=c+1,u=t/o,d=e/c,p=[],g=[],_=[],f=[];for(let m=0;m<h;m++){let x=m*d-a;for(let v=0;v<l;v++){let M=v*u-r;g.push(M,-x,0),_.push(0,0,1),f.push(v/o),f.push(1-m/c)}}for(let m=0;m<c;m++)for(let x=0;x<o;x++){let v=x+l*m,M=x+l*(m+1),R=x+1+l*(m+1),A=x+1+l*m;p.push(v,M,A),p.push(M,R,A)}this.setIndex(p),this.setAttribute("position",new fe(g,3)),this.setAttribute("normal",new fe(_,3)),this.setAttribute("uv",new fe(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.widthSegments,t.heightSegments)}},Op=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Fp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Bp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,kp=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Hp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Vp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Gp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wp=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Xp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,qp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Yp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Zp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,$p=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Jp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Kp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Qp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,jp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,tm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,em=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,nm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,im=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,sm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,rm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,om=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,am=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,cm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,lm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,hm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,um=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,dm="gl_FragColor = linearToOutputTexel( gl_FragColor );",fm=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,pm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,mm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,gm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,_m=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,vm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,xm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ym=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Mm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Sm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,bm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Em=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,wm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Tm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Am=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Rm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Cm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Pm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Lm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Im=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Dm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Um=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Nm=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Om=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Fm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Bm=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,zm=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,km=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Hm=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Vm=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Gm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Wm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Xm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,qm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ym=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,$m=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Jm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,Km=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Qm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,jm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,tg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,eg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ng=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ig=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,sg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,rg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,og=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ag=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,cg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,lg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,hg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,ug=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,dg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,fg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,pg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,mg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,gg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,_g=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,vg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,xg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,yg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Mg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Sg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,bg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Eg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,wg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Tg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Ag=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Rg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Cg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Pg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Lg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ig=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Dg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Ug=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ng=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Og=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Bg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Vg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Gg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Wg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Xg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,qg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Zg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$g=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Jg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,t0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,e0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,n0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,i0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,s0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,r0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,o0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,a0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,c0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,l0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,h0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,u0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,d0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,f0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,p0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Vt={alphahash_fragment:Op,alphahash_pars_fragment:Fp,alphamap_fragment:Bp,alphamap_pars_fragment:zp,alphatest_fragment:kp,alphatest_pars_fragment:Hp,aomap_fragment:Vp,aomap_pars_fragment:Gp,batching_pars_vertex:Wp,batching_vertex:Xp,begin_vertex:qp,beginnormal_vertex:Yp,bsdfs:Zp,iridescence_fragment:$p,bumpmap_pars_fragment:Jp,clipping_planes_fragment:Kp,clipping_planes_pars_fragment:Qp,clipping_planes_pars_vertex:jp,clipping_planes_vertex:tm,color_fragment:em,color_pars_fragment:nm,color_pars_vertex:im,color_vertex:sm,common:rm,cube_uv_reflection_fragment:om,defaultnormal_vertex:am,displacementmap_pars_vertex:cm,displacementmap_vertex:lm,emissivemap_fragment:hm,emissivemap_pars_fragment:um,colorspace_fragment:dm,colorspace_pars_fragment:fm,envmap_fragment:pm,envmap_common_pars_fragment:mm,envmap_pars_fragment:gm,envmap_pars_vertex:_m,envmap_physical_pars_fragment:Cm,envmap_vertex:vm,fog_vertex:xm,fog_pars_vertex:ym,fog_fragment:Mm,fog_pars_fragment:Sm,gradientmap_pars_fragment:bm,lightmap_fragment:Em,lightmap_pars_fragment:wm,lights_lambert_fragment:Tm,lights_lambert_pars_fragment:Am,lights_pars_begin:Rm,lights_toon_fragment:Pm,lights_toon_pars_fragment:Lm,lights_phong_fragment:Im,lights_phong_pars_fragment:Dm,lights_physical_fragment:Um,lights_physical_pars_fragment:Nm,lights_fragment_begin:Om,lights_fragment_maps:Fm,lights_fragment_end:Bm,logdepthbuf_fragment:zm,logdepthbuf_pars_fragment:km,logdepthbuf_pars_vertex:Hm,logdepthbuf_vertex:Vm,map_fragment:Gm,map_pars_fragment:Wm,map_particle_fragment:Xm,map_particle_pars_fragment:qm,metalnessmap_fragment:Ym,metalnessmap_pars_fragment:Zm,morphcolor_vertex:$m,morphnormal_vertex:Jm,morphtarget_pars_vertex:Km,morphtarget_vertex:Qm,normal_fragment_begin:jm,normal_fragment_maps:tg,normal_pars_fragment:eg,normal_pars_vertex:ng,normal_vertex:ig,normalmap_pars_fragment:sg,clearcoat_normal_fragment_begin:rg,clearcoat_normal_fragment_maps:og,clearcoat_pars_fragment:ag,iridescence_pars_fragment:cg,opaque_fragment:lg,packing:hg,premultiplied_alpha_fragment:ug,project_vertex:dg,dithering_fragment:fg,dithering_pars_fragment:pg,roughnessmap_fragment:mg,roughnessmap_pars_fragment:gg,shadowmap_pars_fragment:_g,shadowmap_pars_vertex:vg,shadowmap_vertex:xg,shadowmask_pars_fragment:yg,skinbase_vertex:Mg,skinning_pars_vertex:Sg,skinning_vertex:bg,skinnormal_vertex:Eg,specularmap_fragment:wg,specularmap_pars_fragment:Tg,tonemapping_fragment:Ag,tonemapping_pars_fragment:Rg,transmission_fragment:Cg,transmission_pars_fragment:Pg,uv_pars_fragment:Lg,uv_pars_vertex:Ig,uv_vertex:Dg,worldpos_vertex:Ug,background_vert:Ng,background_frag:Og,backgroundCube_vert:Fg,backgroundCube_frag:Bg,cube_vert:zg,cube_frag:kg,depth_vert:Hg,depth_frag:Vg,distanceRGBA_vert:Gg,distanceRGBA_frag:Wg,equirect_vert:Xg,equirect_frag:qg,linedashed_vert:Yg,linedashed_frag:Zg,meshbasic_vert:$g,meshbasic_frag:Jg,meshlambert_vert:Kg,meshlambert_frag:Qg,meshmatcap_vert:jg,meshmatcap_frag:t0,meshnormal_vert:e0,meshnormal_frag:n0,meshphong_vert:i0,meshphong_frag:s0,meshphysical_vert:r0,meshphysical_frag:o0,meshtoon_vert:a0,meshtoon_frag:c0,points_vert:l0,points_frag:h0,shadow_vert:u0,shadow_frag:d0,sprite_vert:f0,sprite_frag:p0},ot={common:{diffuse:{value:new Ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qt},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0},uvTransform:{value:new qt}},sprite:{diffuse:{value:new Ft(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}}},fn={basic:{uniforms:Oe([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.fog]),vertexShader:Vt.meshbasic_vert,fragmentShader:Vt.meshbasic_frag},lambert:{uniforms:Oe([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new Ft(0)}}]),vertexShader:Vt.meshlambert_vert,fragmentShader:Vt.meshlambert_frag},phong:{uniforms:Oe([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new Ft(0)},specular:{value:new Ft(1118481)},shininess:{value:30}}]),vertexShader:Vt.meshphong_vert,fragmentShader:Vt.meshphong_frag},standard:{uniforms:Oe([ot.common,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.roughnessmap,ot.metalnessmap,ot.fog,ot.lights,{emissive:{value:new Ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag},toon:{uniforms:Oe([ot.common,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.gradientmap,ot.fog,ot.lights,{emissive:{value:new Ft(0)}}]),vertexShader:Vt.meshtoon_vert,fragmentShader:Vt.meshtoon_frag},matcap:{uniforms:Oe([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,{matcap:{value:null}}]),vertexShader:Vt.meshmatcap_vert,fragmentShader:Vt.meshmatcap_frag},points:{uniforms:Oe([ot.points,ot.fog]),vertexShader:Vt.points_vert,fragmentShader:Vt.points_frag},dashed:{uniforms:Oe([ot.common,ot.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Vt.linedashed_vert,fragmentShader:Vt.linedashed_frag},depth:{uniforms:Oe([ot.common,ot.displacementmap]),vertexShader:Vt.depth_vert,fragmentShader:Vt.depth_frag},normal:{uniforms:Oe([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,{opacity:{value:1}}]),vertexShader:Vt.meshnormal_vert,fragmentShader:Vt.meshnormal_frag},sprite:{uniforms:Oe([ot.sprite,ot.fog]),vertexShader:Vt.sprite_vert,fragmentShader:Vt.sprite_frag},background:{uniforms:{uvTransform:{value:new qt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Vt.background_vert,fragmentShader:Vt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Vt.backgroundCube_vert,fragmentShader:Vt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Vt.cube_vert,fragmentShader:Vt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Vt.equirect_vert,fragmentShader:Vt.equirect_frag},distanceRGBA:{uniforms:Oe([ot.common,ot.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Vt.distanceRGBA_vert,fragmentShader:Vt.distanceRGBA_frag},shadow:{uniforms:Oe([ot.lights,ot.fog,{color:{value:new Ft(0)},opacity:{value:1}}]),vertexShader:Vt.shadow_vert,fragmentShader:Vt.shadow_frag}};fn.physical={uniforms:Oe([fn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qt},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qt},sheen:{value:0},sheenColor:{value:new Ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qt},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qt},attenuationDistance:{value:0},attenuationColor:{value:new Ft(0)},specularColor:{value:new Ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qt},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qt}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag};_r={r:0,b:0,g:0};Yr=class extends Xr{constructor(t=-1,e=1,i=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-t,a=i+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Bi=4,Xh=[.125,.215,.35,.446,.526,.582],ai=20,Ca=new Yr,qh=new Ft,Pa=null,La=0,Ia=0,ri=(1+Math.sqrt(5))/2,Fi=1/ri,Yh=[new P(1,1,1),new P(-1,1,1),new P(1,1,-1),new P(-1,1,-1),new P(0,ri,Fi),new P(0,ri,-Fi),new P(Fi,0,ri),new P(-Fi,0,ri),new P(ri,Fi,0),new P(-ri,Fi,0)],$i=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,s=100){Pa=this._renderer.getRenderTarget(),La=this._renderer.getActiveCubeFace(),Ia=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,i,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Jh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=$h(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Pa,La,Ia),t.scissorTest=!1,vr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Wi||t.mapping===Xi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Pa=this._renderer.getRenderTarget(),La=this._renderer.getActiveCubeFace(),Ia=this._renderer.getActiveMipmapLevel();let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:Ye,minFilter:Ye,generateMipmaps:!1,type:bs,format:rn,colorSpace:Tn,depthBuffer:!1},s=Zh(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Zh(t,e,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=M0(r)),this._blurMaterial=S0(r,t,e)}return s}_compileMaterial(t){let e=new $t(this._lodPlanes[0],t);this._renderer.compile(e,Ca)}_sceneToCubeUV(t,e,i,s){let o=new Ce(90,1,e,i),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(qh),h.toneMapping=Vn,h.autoClear=!1;let p=new Cn({name:"PMREM.Background",side:Pe,depthWrite:!1,depthTest:!1}),g=new $t(new pi,p),_=!1,f=t.background;f?f.isColor&&(p.color.copy(f),t.background=null,_=!0):(p.color.copy(qh),_=!0);for(let m=0;m<6;m++){let x=m%3;x===0?(o.up.set(0,c[m],0),o.lookAt(l[m],0,0)):x===1?(o.up.set(0,0,c[m]),o.lookAt(0,l[m],0)):(o.up.set(0,c[m],0),o.lookAt(0,0,l[m]));let v=this._cubeSize;vr(s,x*v,m>2?v:0,v,v),h.setRenderTarget(s),_&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=f}_textureToCubeUV(t,e){let i=this._renderer,s=t.mapping===Wi||t.mapping===Xi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Jh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=$h());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new $t(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;let c=this._cubeSize;vr(e,0,0,3*c,2*c),i.setRenderTarget(e),i.render(a,Ca)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){let r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=Yh[(s-1)%Yh.length];this._blur(t,s-1,s,r,a)}e.autoClear=i}_blur(t,e,i,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,i,s,"latitudinal",r),this._halfBlur(a,t,i,i,s,"longitudinal",r)}_halfBlur(t,e,i,s,r,a,o){let c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new $t(this._lodPlanes[s],l),d=l.uniforms,p=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*ai-1),_=r/g,f=isFinite(r)?1+Math.floor(h*_):ai;f>ai&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${ai}`);let m=[],x=0;for(let T=0;T<ai;++T){let k=T/_,S=Math.exp(-k*k/2);m.push(S),T===0?x+=S:T<f&&(x+=2*S)}for(let T=0;T<m.length;T++)m[T]=m[T]/x;d.envMap.value=t.texture,d.samples.value=f,d.weights.value=m,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:v}=this;d.dTheta.value=g,d.mipInt.value=v-i;let M=this._sizeLods[s],R=3*M*(s>v-Bi?s-v+Bi:0),A=4*(this._cubeSize-M);vr(e,R,A,3*M,2*M),c.setRenderTarget(e),c.render(u,Ca)}};Zr=class extends $e{constructor(t,e,i,s,r,a,o,c,l,h){if(h=h!==void 0?h:hi,h!==hi&&h!==qi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===hi&&(i=zn),i===void 0&&h===qi&&(i=li),super(null,s,r,a,o,c,h,i,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Fe,this.minFilter=c!==void 0?c:Fe,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Xu=new $e,qu=new Zr(1,1);qu.compareFunction=ku;Yu=new kr,Zu=new Ka,$u=new qr,Kh=[],Qh=[],jh=new Float32Array(16),tu=new Float32Array(9),eu=new Float32Array(4);tc=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=K0(e.type)}},ec=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=__(e.type)}},nc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],i)}}},Da=/(\w+)(\])?(\[|\.)?/g;Gi=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);v_(r,a,this)}}setValue(t,e,i,s){let r=this.map[e];r!==void 0&&r.setValue(t,i,s)}setOptional(t,e,i){let s=e[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,e,i,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],c=i[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){let i=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&i.push(a)}return i}};x_=37297,y_=0;C_=/^[ \t]*#include +<([\w\d./]+)>/gm;P_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);I_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;k_=0,sc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,i=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(i),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new rc(t),e.set(t,i)),i}},rc=class{constructor(t){this.id=k_++,this.code=t,this.usedTimes=0}};Y_=0;oc=class extends Rn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ip,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},ac=class extends Rn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},K_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Q_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;cc=class extends Ce{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},on=class extends Ie{constructor(){super(),this.isGroup=!0,this.type="Group"}},iv={type:"move"},_s=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new on,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new on,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new on,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let s=null,r=null,a=null,o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(let _ of t.hand.values()){let f=e.getJointPose(_,i),m=this._getHandJoint(l,_);f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=f.radius),m.visible=f!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,g=.005;l.inputState.pinching&&d>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&d<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(iv)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new on;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},lc=class extends Xn{constructor(t,e){super();let i=this,s=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,u=null,d=null,p=null,g=null,_=e.getContextAttributes(),f=null,m=null,x=[],v=[],M=new ft,R=null,A=new Ce;A.layers.enable(1),A.viewport=new oe;let T=new Ce;T.layers.enable(2),T.viewport=new oe;let k=[A,T],S=new cc;S.layers.enable(1),S.layers.enable(2);let w=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(V){let Y=x[V];return Y===void 0&&(Y=new _s,x[V]=Y),Y.getTargetRaySpace()},this.getControllerGrip=function(V){let Y=x[V];return Y===void 0&&(Y=new _s,x[V]=Y),Y.getGripSpace()},this.getHand=function(V){let Y=x[V];return Y===void 0&&(Y=new _s,x[V]=Y),Y.getHandSpace()};function q(V){let Y=v.indexOf(V.inputSource);if(Y===-1)return;let ht=x[Y];ht!==void 0&&(ht.update(V.inputSource,V.frame,l||a),ht.dispatchEvent({type:V.type,data:V.inputSource}))}function Q(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",Q),s.removeEventListener("inputsourceschange",L);for(let V=0;V<x.length;V++){let Y=v[V];Y!==null&&(v[V]=null,x[V].disconnect(Y))}w=null,I=null,t.setRenderTarget(f),p=null,d=null,u=null,s=null,m=null,rt.stop(),i.isPresenting=!1,t.setPixelRatio(R),t.setSize(M.width,M.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(V){r=V,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(V){o=V,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(V){l=V},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(V){if(s=V,s!==null){if(f=t.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",Q),s.addEventListener("inputsourceschange",L),_.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(M),s.renderState.layers===void 0||t.capabilities.isWebGL2===!1){let Y={antialias:s.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,Y),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),m=new An(p.framebufferWidth,p.framebufferHeight,{format:rn,type:Gn,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil})}else{let Y=null,ht=null,_t=null;_.depth&&(_t=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Y=_.stencil?qi:hi,ht=_.stencil?li:zn);let gt={colorFormat:e.RGBA8,depthFormat:_t,scaleFactor:r};u=new XRWebGLBinding(s,e),d=u.createProjectionLayer(gt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),m=new An(d.textureWidth,d.textureHeight,{format:rn,type:Gn,depthTexture:new Zr(d.textureWidth,d.textureHeight,ht,void 0,void 0,void 0,void 0,void 0,void 0,Y),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0});let Rt=t.properties.get(m);Rt.__ignoreDepthValues=d.ignoreDepthValues}m.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),rt.setContext(s),rt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function L(V){for(let Y=0;Y<V.removed.length;Y++){let ht=V.removed[Y],_t=v.indexOf(ht);_t>=0&&(v[_t]=null,x[_t].disconnect(ht))}for(let Y=0;Y<V.added.length;Y++){let ht=V.added[Y],_t=v.indexOf(ht);if(_t===-1){for(let Rt=0;Rt<x.length;Rt++)if(Rt>=v.length){v.push(ht),_t=Rt;break}else if(v[Rt]===null){v[Rt]=ht,_t=Rt;break}if(_t===-1)break}let gt=x[_t];gt&&gt.connect(ht)}}let N=new P,W=new P;function $(V,Y,ht){N.setFromMatrixPosition(Y.matrixWorld),W.setFromMatrixPosition(ht.matrixWorld);let _t=N.distanceTo(W),gt=Y.projectionMatrix.elements,Rt=ht.projectionMatrix.elements,Ut=gt[14]/(gt[10]-1),Tt=gt[14]/(gt[10]+1),Yt=(gt[9]+1)/gt[5],O=(gt[9]-1)/gt[5],me=(gt[8]-1)/gt[0],yt=(Rt[8]+1)/Rt[0],Ot=Ut*me,vt=Ut*yt,Qt=_t/(-me+yt),Bt=Qt*-me;Y.matrixWorld.decompose(V.position,V.quaternion,V.scale),V.translateX(Bt),V.translateZ(Qt),V.matrixWorld.compose(V.position,V.quaternion,V.scale),V.matrixWorldInverse.copy(V.matrixWorld).invert();let E=Ut+Qt,y=Tt+Qt,F=Ot-Bt,et=vt+(_t-Bt),j=Yt*Tt/y*E,nt=O*Tt/y*E;V.projectionMatrix.makePerspective(F,et,j,nt,E,y),V.projectionMatrixInverse.copy(V.projectionMatrix).invert()}function G(V,Y){Y===null?V.matrixWorld.copy(V.matrix):V.matrixWorld.multiplyMatrices(Y.matrixWorld,V.matrix),V.matrixWorldInverse.copy(V.matrixWorld).invert()}this.updateCamera=function(V){if(s===null)return;S.near=T.near=A.near=V.near,S.far=T.far=A.far=V.far,(w!==S.near||I!==S.far)&&(s.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,I=S.far);let Y=V.parent,ht=S.cameras;G(S,Y);for(let _t=0;_t<ht.length;_t++)G(ht[_t],Y);ht.length===2?$(S,A,T):S.projectionMatrix.copy(A.projectionMatrix),X(V,S,Y)};function X(V,Y,ht){ht===null?V.matrix.copy(Y.matrixWorld):(V.matrix.copy(ht.matrixWorld),V.matrix.invert(),V.matrix.multiply(Y.matrixWorld)),V.matrix.decompose(V.position,V.quaternion,V.scale),V.updateMatrixWorld(!0),V.projectionMatrix.copy(Y.projectionMatrix),V.projectionMatrixInverse.copy(Y.projectionMatrixInverse),V.isPerspectiveCamera&&(V.fov=Za*2*Math.atan(1/V.projectionMatrix.elements[5]),V.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&p===null))return c},this.setFoveation=function(V){c=V,d!==null&&(d.fixedFoveation=V),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=V)};let K=null;function tt(V,Y){if(h=Y.getViewerPose(l||a),g=Y,h!==null){let ht=h.views;p!==null&&(t.setRenderTargetFramebuffer(m,p.framebuffer),t.setRenderTarget(m));let _t=!1;ht.length!==S.cameras.length&&(S.cameras.length=0,_t=!0);for(let gt=0;gt<ht.length;gt++){let Rt=ht[gt],Ut=null;if(p!==null)Ut=p.getViewport(Rt);else{let Yt=u.getViewSubImage(d,Rt);Ut=Yt.viewport,gt===0&&(t.setRenderTargetTextures(m,Yt.colorTexture,d.ignoreDepthValues?void 0:Yt.depthStencilTexture),t.setRenderTarget(m))}let Tt=k[gt];Tt===void 0&&(Tt=new Ce,Tt.layers.enable(gt),Tt.viewport=new oe,k[gt]=Tt),Tt.matrix.fromArray(Rt.transform.matrix),Tt.matrix.decompose(Tt.position,Tt.quaternion,Tt.scale),Tt.projectionMatrix.fromArray(Rt.projectionMatrix),Tt.projectionMatrixInverse.copy(Tt.projectionMatrix).invert(),Tt.viewport.set(Ut.x,Ut.y,Ut.width,Ut.height),gt===0&&(S.matrix.copy(Tt.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),_t===!0&&S.cameras.push(Tt)}}for(let ht=0;ht<x.length;ht++){let _t=v[ht],gt=x[ht];_t!==null&&gt!==void 0&&gt.update(_t,Y,l||a)}K&&K(V,Y),Y.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Y}),g=null}let rt=new Wu;rt.setAnimationLoop(tt),this.setAnimationLoop=function(V){K=V},this.dispose=function(){}}};Ts=class{constructor(t={}){let{canvas:e=pp(),context:i=null,depth:s=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let d;i!==null?d=i.getContextAttributes().alpha:d=a;let p=new Uint32Array(4),g=new Int32Array(4),_=null,f=null,m=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=xe,this._useLegacyLights=!1,this.toneMapping=Vn,this.toneMappingExposure=1;let v=this,M=!1,R=0,A=0,T=null,k=-1,S=null,w=new oe,I=new oe,q=null,Q=new Ft(0),L=0,N=e.width,W=e.height,$=1,G=null,X=null,K=new oe(0,0,N,W),tt=new oe(0,0,N,W),rt=!1,V=new ws,Y=!1,ht=!1,_t=null,gt=new de,Rt=new ft,Ut=new P,Tt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Yt(){return T===null?$:1}let O=i;function me(b,U){for(let z=0;z<b.length;z++){let H=b[z],B=e.getContext(H,U);if(B!==null)return B}return null}try{let b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r160"),e.addEventListener("webglcontextlost",it,!1),e.addEventListener("webglcontextrestored",C,!1),e.addEventListener("webglcontextcreationerror",at,!1),O===null){let U=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&U.shift(),O=me(U,b),O===null)throw me(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext!="undefined"&&O instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),O.getShaderPrecisionFormat===void 0&&(O.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let yt,Ot,vt,Qt,Bt,E,y,F,et,j,nt,xt,lt,J,st,pt,Z,zt,Ct,bt,mt,ut,Pt,Zt;function Dt(){yt=new E0(O),Ot=new v0(O,yt,t),yt.init(Ot),ut=new nv(O,yt,Ot),vt=new tv(O,yt,Ot),Qt=new A0(O),Bt=new V_,E=new ev(O,yt,vt,Bt,Ot,ut,Qt),y=new y0(v),F=new b0(v),et=new Np(O,Ot),Pt=new g0(O,yt,et,Ot),j=new w0(O,et,Qt,Pt),nt=new L0(O,j,et,Qt),Ct=new P0(O,Ot,E),pt=new x0(Bt),xt=new H_(v,y,F,yt,Ot,Pt,pt),lt=new sv(v,Bt),J=new W_,st=new J_(yt,Ot),zt=new m0(v,y,F,vt,nt,d,c),Z=new j_(v,nt,Ot),Zt=new rv(O,Qt,Ot,vt),bt=new _0(O,yt,Qt,Ot),mt=new T0(O,yt,Qt,Ot),Qt.programs=xt.programs,v.capabilities=Ot,v.extensions=yt,v.properties=Bt,v.renderLists=J,v.shadowMap=Z,v.state=vt,v.info=Qt}Dt();let Lt=new lc(v,O);this.xr=Lt,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let b=yt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=yt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(b){b!==void 0&&($=b,this.setSize(N,W,!1))},this.getSize=function(b){return b.set(N,W)},this.setSize=function(b,U,z=!0){if(Lt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=b,W=U,e.width=Math.floor(b*$),e.height=Math.floor(U*$),z===!0&&(e.style.width=b+"px",e.style.height=U+"px"),this.setViewport(0,0,b,U)},this.getDrawingBufferSize=function(b){return b.set(N*$,W*$).floor()},this.setDrawingBufferSize=function(b,U,z){N=b,W=U,$=z,e.width=Math.floor(b*z),e.height=Math.floor(U*z),this.setViewport(0,0,b,U)},this.getCurrentViewport=function(b){return b.copy(w)},this.getViewport=function(b){return b.copy(K)},this.setViewport=function(b,U,z,H){b.isVector4?K.set(b.x,b.y,b.z,b.w):K.set(b,U,z,H),vt.viewport(w.copy(K).multiplyScalar($).floor())},this.getScissor=function(b){return b.copy(tt)},this.setScissor=function(b,U,z,H){b.isVector4?tt.set(b.x,b.y,b.z,b.w):tt.set(b,U,z,H),vt.scissor(I.copy(tt).multiplyScalar($).floor())},this.getScissorTest=function(){return rt},this.setScissorTest=function(b){vt.setScissorTest(rt=b)},this.setOpaqueSort=function(b){G=b},this.setTransparentSort=function(b){X=b},this.getClearColor=function(b){return b.copy(zt.getClearColor())},this.setClearColor=function(){zt.setClearColor.apply(zt,arguments)},this.getClearAlpha=function(){return zt.getClearAlpha()},this.setClearAlpha=function(){zt.setClearAlpha.apply(zt,arguments)},this.clear=function(b=!0,U=!0,z=!0){let H=0;if(b){let B=!1;if(T!==null){let dt=T.texture.format;B=dt===Ou||dt===Nu||dt===Uu}if(B){let dt=T.texture.type,Mt=dt===Gn||dt===zn||dt===Uc||dt===li||dt===Iu||dt===Du,It=zt.getClearColor(),Nt=zt.getClearAlpha(),Gt=It.r,kt=It.g,Ht=It.b;Mt?(p[0]=Gt,p[1]=kt,p[2]=Ht,p[3]=Nt,O.clearBufferuiv(O.COLOR,0,p)):(g[0]=Gt,g[1]=kt,g[2]=Ht,g[3]=Nt,O.clearBufferiv(O.COLOR,0,g))}else H|=O.COLOR_BUFFER_BIT}U&&(H|=O.DEPTH_BUFFER_BIT),z&&(H|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",it,!1),e.removeEventListener("webglcontextrestored",C,!1),e.removeEventListener("webglcontextcreationerror",at,!1),J.dispose(),st.dispose(),Bt.dispose(),y.dispose(),F.dispose(),nt.dispose(),Pt.dispose(),Zt.dispose(),xt.dispose(),Lt.dispose(),Lt.removeEventListener("sessionstart",Ue),Lt.removeEventListener("sessionend",te),_t&&(_t.dispose(),_t=null),Ne.stop()};function it(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function C(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;let b=Qt.autoReset,U=Z.enabled,z=Z.autoUpdate,H=Z.needsUpdate,B=Z.type;Dt(),Qt.autoReset=b,Z.enabled=U,Z.autoUpdate=z,Z.needsUpdate=H,Z.type=B}function at(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function ct(b){let U=b.target;U.removeEventListener("dispose",ct),At(U)}function At(b){Et(b),Bt.remove(b)}function Et(b){let U=Bt.get(b).programs;U!==void 0&&(U.forEach(function(z){xt.releaseProgram(z)}),b.isShaderMaterial&&xt.releaseShaderCache(b))}this.renderBufferDirect=function(b,U,z,H,B,dt){U===null&&(U=Tt);let Mt=B.isMesh&&B.matrixWorld.determinant()<0,It=cd(b,U,z,H,B);vt.setMaterial(H,Mt);let Nt=z.index,Gt=1;if(H.wireframe===!0){if(Nt=j.getWireframeAttribute(z),Nt===void 0)return;Gt=2}let kt=z.drawRange,Ht=z.attributes.position,pe=kt.start*Gt,ke=(kt.start+kt.count)*Gt;dt!==null&&(pe=Math.max(pe,dt.start*Gt),ke=Math.min(ke,(dt.start+dt.count)*Gt)),Nt!==null?(pe=Math.max(pe,0),ke=Math.min(ke,Nt.count)):Ht!=null&&(pe=Math.max(pe,0),ke=Math.min(ke,Ht.count));let be=ke-pe;if(be<0||be===1/0)return;Pt.setup(B,H,It,z,Nt);let pn,ae=bt;if(Nt!==null&&(pn=et.get(Nt),ae=mt,ae.setIndex(pn)),B.isMesh)H.wireframe===!0?(vt.setLineWidth(H.wireframeLinewidth*Yt()),ae.setMode(O.LINES)):ae.setMode(O.TRIANGLES);else if(B.isLine){let Wt=H.linewidth;Wt===void 0&&(Wt=1),vt.setLineWidth(Wt*Yt()),B.isLineSegments?ae.setMode(O.LINES):B.isLineLoop?ae.setMode(O.LINE_LOOP):ae.setMode(O.LINE_STRIP)}else B.isPoints?ae.setMode(O.POINTS):B.isSprite&&ae.setMode(O.TRIANGLES);if(B.isBatchedMesh)ae.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)ae.renderInstances(pe,be,B.count);else if(z.isInstancedBufferGeometry){let Wt=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,So=Math.min(z.instanceCount,Wt);ae.renderInstances(pe,be,So)}else ae.render(pe,be)};function Jt(b,U,z){b.transparent===!0&&b.side===Ge&&b.forceSinglePass===!1?(b.side=Pe,b.needsUpdate=!0,Bs(b,U,z),b.side=Wn,b.needsUpdate=!0,Bs(b,U,z),b.side=Ge):Bs(b,U,z)}this.compile=function(b,U,z=null){z===null&&(z=b),f=st.get(z),f.init(),x.push(f),z.traverseVisible(function(B){B.isLight&&B.layers.test(U.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),b!==z&&b.traverseVisible(function(B){B.isLight&&B.layers.test(U.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),f.setupLights(v._useLegacyLights);let H=new Set;return b.traverse(function(B){let dt=B.material;if(dt)if(Array.isArray(dt))for(let Mt=0;Mt<dt.length;Mt++){let It=dt[Mt];Jt(It,z,B),H.add(It)}else Jt(dt,z,B),H.add(dt)}),x.pop(),f=null,H},this.compileAsync=function(b,U,z=null){let H=this.compile(b,U,z);return new Promise(B=>{function dt(){if(H.forEach(function(Mt){Bt.get(Mt).currentProgram.isReady()&&H.delete(Mt)}),H.size===0){B(b);return}setTimeout(dt,10)}yt.get("KHR_parallel_shader_compile")!==null?dt():setTimeout(dt,10)})};let jt=null;function Se(b){jt&&jt(b)}function Ue(){Ne.stop()}function te(){Ne.start()}let Ne=new Wu;Ne.setAnimationLoop(Se),typeof self!="undefined"&&Ne.setContext(self),this.setAnimationLoop=function(b){jt=b,Lt.setAnimationLoop(b),b===null?Ne.stop():Ne.start()},Lt.addEventListener("sessionstart",Ue),Lt.addEventListener("sessionend",te),this.render=function(b,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Lt.enabled===!0&&Lt.isPresenting===!0&&(Lt.cameraAutoUpdate===!0&&Lt.updateCamera(U),U=Lt.getCamera()),b.isScene===!0&&b.onBeforeRender(v,b,U,T),f=st.get(b,x.length),f.init(),x.push(f),gt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),V.setFromProjectionMatrix(gt),ht=this.localClippingEnabled,Y=pt.init(this.clippingPlanes,ht),_=J.get(b,m.length),_.init(),m.push(_),cn(b,U,0,v.sortObjects),_.finish(),v.sortObjects===!0&&_.sort(G,X),this.info.render.frame++,Y===!0&&pt.beginShadows();let z=f.state.shadowsArray;if(Z.render(z,b,U),Y===!0&&pt.endShadows(),this.info.autoReset===!0&&this.info.reset(),zt.render(_,b),f.setupLights(v._useLegacyLights),U.isArrayCamera){let H=U.cameras;for(let B=0,dt=H.length;B<dt;B++){let Mt=H[B];Wc(_,b,Mt,Mt.viewport)}}else Wc(_,b,U);T!==null&&(E.updateMultisampleRenderTarget(T),E.updateRenderTargetMipmap(T)),b.isScene===!0&&b.onAfterRender(v,b,U),Pt.resetDefaultState(),k=-1,S=null,x.pop(),x.length>0?f=x[x.length-1]:f=null,m.pop(),m.length>0?_=m[m.length-1]:_=null};function cn(b,U,z,H){if(b.visible===!1)return;if(b.layers.test(U.layers)){if(b.isGroup)z=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(U);else if(b.isLight)f.pushLight(b),b.castShadow&&f.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||V.intersectsSprite(b)){H&&Ut.setFromMatrixPosition(b.matrixWorld).applyMatrix4(gt);let Mt=nt.update(b),It=b.material;It.visible&&_.push(b,Mt,It,z,Ut.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||V.intersectsObject(b))){let Mt=nt.update(b),It=b.material;if(H&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ut.copy(b.boundingSphere.center)):(Mt.boundingSphere===null&&Mt.computeBoundingSphere(),Ut.copy(Mt.boundingSphere.center)),Ut.applyMatrix4(b.matrixWorld).applyMatrix4(gt)),Array.isArray(It)){let Nt=Mt.groups;for(let Gt=0,kt=Nt.length;Gt<kt;Gt++){let Ht=Nt[Gt],pe=It[Ht.materialIndex];pe&&pe.visible&&_.push(b,Mt,pe,z,Ut.z,Ht)}}else It.visible&&_.push(b,Mt,It,z,Ut.z,null)}}let dt=b.children;for(let Mt=0,It=dt.length;Mt<It;Mt++)cn(dt[Mt],U,z,H)}function Wc(b,U,z,H){let B=b.opaque,dt=b.transmissive,Mt=b.transparent;f.setupLightsView(z),Y===!0&&pt.setGlobalState(v.clippingPlanes,z),dt.length>0&&ad(B,dt,U,z),H&&vt.viewport(w.copy(H)),B.length>0&&Fs(B,U,z),dt.length>0&&Fs(dt,U,z),Mt.length>0&&Fs(Mt,U,z),vt.buffers.depth.setTest(!0),vt.buffers.depth.setMask(!0),vt.buffers.color.setMask(!0),vt.setPolygonOffset(!1)}function ad(b,U,z,H){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;let dt=Ot.isWebGL2;_t===null&&(_t=new An(1,1,{generateMipmaps:!0,type:yt.has("EXT_color_buffer_half_float")?bs:Gn,minFilter:Ss,samples:dt?4:0})),v.getDrawingBufferSize(Rt),dt?_t.setSize(Rt.x,Rt.y):_t.setSize($a(Rt.x),$a(Rt.y));let Mt=v.getRenderTarget();v.setRenderTarget(_t),v.getClearColor(Q),L=v.getClearAlpha(),L<1&&v.setClearColor(16777215,.5),v.clear();let It=v.toneMapping;v.toneMapping=Vn,Fs(b,z,H),E.updateMultisampleRenderTarget(_t),E.updateRenderTargetMipmap(_t);let Nt=!1;for(let Gt=0,kt=U.length;Gt<kt;Gt++){let Ht=U[Gt],pe=Ht.object,ke=Ht.geometry,be=Ht.material,pn=Ht.group;if(be.side===Ge&&pe.layers.test(H.layers)){let ae=be.side;be.side=Pe,be.needsUpdate=!0,Xc(pe,z,H,ke,be,pn),be.side=ae,be.needsUpdate=!0,Nt=!0}}Nt===!0&&(E.updateMultisampleRenderTarget(_t),E.updateRenderTargetMipmap(_t)),v.setRenderTarget(Mt),v.setClearColor(Q,L),v.toneMapping=It}function Fs(b,U,z){let H=U.isScene===!0?U.overrideMaterial:null;for(let B=0,dt=b.length;B<dt;B++){let Mt=b[B],It=Mt.object,Nt=Mt.geometry,Gt=H===null?Mt.material:H,kt=Mt.group;It.layers.test(z.layers)&&Xc(It,U,z,Nt,Gt,kt)}}function Xc(b,U,z,H,B,dt){b.onBeforeRender(v,U,z,H,B,dt),b.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(v,U,z,H,b,dt),B.transparent===!0&&B.side===Ge&&B.forceSinglePass===!1?(B.side=Pe,B.needsUpdate=!0,v.renderBufferDirect(z,U,H,B,b,dt),B.side=Wn,B.needsUpdate=!0,v.renderBufferDirect(z,U,H,B,b,dt),B.side=Ge):v.renderBufferDirect(z,U,H,B,b,dt),b.onAfterRender(v,U,z,H,B,dt)}function Bs(b,U,z){U.isScene!==!0&&(U=Tt);let H=Bt.get(b),B=f.state.lights,dt=f.state.shadowsArray,Mt=B.state.version,It=xt.getParameters(b,B.state,dt,U,z),Nt=xt.getProgramCacheKey(It),Gt=H.programs;H.environment=b.isMeshStandardMaterial?U.environment:null,H.fog=U.fog,H.envMap=(b.isMeshStandardMaterial?F:y).get(b.envMap||H.environment),Gt===void 0&&(b.addEventListener("dispose",ct),Gt=new Map,H.programs=Gt);let kt=Gt.get(Nt);if(kt!==void 0){if(H.currentProgram===kt&&H.lightsStateVersion===Mt)return Yc(b,It),kt}else It.uniforms=xt.getUniforms(b),b.onBuild(z,It,v),b.onBeforeCompile(It,v),kt=xt.acquireProgram(It,Nt),Gt.set(Nt,kt),H.uniforms=It.uniforms;let Ht=H.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Ht.clippingPlanes=pt.uniform),Yc(b,It),H.needsLights=hd(b),H.lightsStateVersion=Mt,H.needsLights&&(Ht.ambientLightColor.value=B.state.ambient,Ht.lightProbe.value=B.state.probe,Ht.directionalLights.value=B.state.directional,Ht.directionalLightShadows.value=B.state.directionalShadow,Ht.spotLights.value=B.state.spot,Ht.spotLightShadows.value=B.state.spotShadow,Ht.rectAreaLights.value=B.state.rectArea,Ht.ltc_1.value=B.state.rectAreaLTC1,Ht.ltc_2.value=B.state.rectAreaLTC2,Ht.pointLights.value=B.state.point,Ht.pointLightShadows.value=B.state.pointShadow,Ht.hemisphereLights.value=B.state.hemi,Ht.directionalShadowMap.value=B.state.directionalShadowMap,Ht.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ht.spotShadowMap.value=B.state.spotShadowMap,Ht.spotLightMatrix.value=B.state.spotLightMatrix,Ht.spotLightMap.value=B.state.spotLightMap,Ht.pointShadowMap.value=B.state.pointShadowMap,Ht.pointShadowMatrix.value=B.state.pointShadowMatrix),H.currentProgram=kt,H.uniformsList=null,kt}function qc(b){if(b.uniformsList===null){let U=b.currentProgram.getUniforms();b.uniformsList=Gi.seqWithValue(U.seq,b.uniforms)}return b.uniformsList}function Yc(b,U){let z=Bt.get(b);z.outputColorSpace=U.outputColorSpace,z.batching=U.batching,z.instancing=U.instancing,z.instancingColor=U.instancingColor,z.skinning=U.skinning,z.morphTargets=U.morphTargets,z.morphNormals=U.morphNormals,z.morphColors=U.morphColors,z.morphTargetsCount=U.morphTargetsCount,z.numClippingPlanes=U.numClippingPlanes,z.numIntersection=U.numClipIntersection,z.vertexAlphas=U.vertexAlphas,z.vertexTangents=U.vertexTangents,z.toneMapping=U.toneMapping}function cd(b,U,z,H,B){U.isScene!==!0&&(U=Tt),E.resetTextureUnits();let dt=U.fog,Mt=H.isMeshStandardMaterial?U.environment:null,It=T===null?v.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:Tn,Nt=(H.isMeshStandardMaterial?F:y).get(H.envMap||Mt),Gt=H.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,kt=!!z.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ht=!!z.morphAttributes.position,pe=!!z.morphAttributes.normal,ke=!!z.morphAttributes.color,be=Vn;H.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(be=v.toneMapping);let pn=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ae=pn!==void 0?pn.length:0,Wt=Bt.get(H),So=f.state.lights;if(Y===!0&&(ht===!0||b!==S)){let We=b===S&&H.id===k;pt.setState(H,b,We)}let he=!1;H.version===Wt.__version?(Wt.needsLights&&Wt.lightsStateVersion!==So.state.version||Wt.outputColorSpace!==It||B.isBatchedMesh&&Wt.batching===!1||!B.isBatchedMesh&&Wt.batching===!0||B.isInstancedMesh&&Wt.instancing===!1||!B.isInstancedMesh&&Wt.instancing===!0||B.isSkinnedMesh&&Wt.skinning===!1||!B.isSkinnedMesh&&Wt.skinning===!0||B.isInstancedMesh&&Wt.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Wt.instancingColor===!1&&B.instanceColor!==null||Wt.envMap!==Nt||H.fog===!0&&Wt.fog!==dt||Wt.numClippingPlanes!==void 0&&(Wt.numClippingPlanes!==pt.numPlanes||Wt.numIntersection!==pt.numIntersection)||Wt.vertexAlphas!==Gt||Wt.vertexTangents!==kt||Wt.morphTargets!==Ht||Wt.morphNormals!==pe||Wt.morphColors!==ke||Wt.toneMapping!==be||Ot.isWebGL2===!0&&Wt.morphTargetsCount!==ae)&&(he=!0):(he=!0,Wt.__version=H.version);let Jn=Wt.currentProgram;he===!0&&(Jn=Bs(H,U,B));let Zc=!1,is=!1,bo=!1,Te=Jn.getUniforms(),Kn=Wt.uniforms;if(vt.useProgram(Jn.program)&&(Zc=!0,is=!0,bo=!0),H.id!==k&&(k=H.id,is=!0),Zc||S!==b){Te.setValue(O,"projectionMatrix",b.projectionMatrix),Te.setValue(O,"viewMatrix",b.matrixWorldInverse);let We=Te.map.cameraPosition;We!==void 0&&We.setValue(O,Ut.setFromMatrixPosition(b.matrixWorld)),Ot.logarithmicDepthBuffer&&Te.setValue(O,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&Te.setValue(O,"isOrthographic",b.isOrthographicCamera===!0),S!==b&&(S=b,is=!0,bo=!0)}if(B.isSkinnedMesh){Te.setOptional(O,B,"bindMatrix"),Te.setOptional(O,B,"bindMatrixInverse");let We=B.skeleton;We&&(Ot.floatVertexTextures?(We.boneTexture===null&&We.computeBoneTexture(),Te.setValue(O,"boneTexture",We.boneTexture,E)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}B.isBatchedMesh&&(Te.setOptional(O,B,"batchingTexture"),Te.setValue(O,"batchingTexture",B._matricesTexture,E));let Eo=z.morphAttributes;if((Eo.position!==void 0||Eo.normal!==void 0||Eo.color!==void 0&&Ot.isWebGL2===!0)&&Ct.update(B,z,Jn),(is||Wt.receiveShadow!==B.receiveShadow)&&(Wt.receiveShadow=B.receiveShadow,Te.setValue(O,"receiveShadow",B.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(Kn.envMap.value=Nt,Kn.flipEnvMap.value=Nt.isCubeTexture&&Nt.isRenderTargetTexture===!1?-1:1),is&&(Te.setValue(O,"toneMappingExposure",v.toneMappingExposure),Wt.needsLights&&ld(Kn,bo),dt&&H.fog===!0&&lt.refreshFogUniforms(Kn,dt),lt.refreshMaterialUniforms(Kn,H,$,W,_t),Gi.upload(O,qc(Wt),Kn,E)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(Gi.upload(O,qc(Wt),Kn,E),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&Te.setValue(O,"center",B.center),Te.setValue(O,"modelViewMatrix",B.modelViewMatrix),Te.setValue(O,"normalMatrix",B.normalMatrix),Te.setValue(O,"modelMatrix",B.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){let We=H.uniformsGroups;for(let wo=0,ud=We.length;wo<ud;wo++)if(Ot.isWebGL2){let $c=We[wo];Zt.update($c,Jn),Zt.bind($c,Jn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Jn}function ld(b,U){b.ambientLightColor.needsUpdate=U,b.lightProbe.needsUpdate=U,b.directionalLights.needsUpdate=U,b.directionalLightShadows.needsUpdate=U,b.pointLights.needsUpdate=U,b.pointLightShadows.needsUpdate=U,b.spotLights.needsUpdate=U,b.spotLightShadows.needsUpdate=U,b.rectAreaLights.needsUpdate=U,b.hemisphereLights.needsUpdate=U}function hd(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(b,U,z){Bt.get(b.texture).__webglTexture=U,Bt.get(b.depthTexture).__webglTexture=z;let H=Bt.get(b);H.__hasExternalTextures=!0,H.__hasExternalTextures&&(H.__autoAllocateDepthBuffer=z===void 0,H.__autoAllocateDepthBuffer||yt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(b,U){let z=Bt.get(b);z.__webglFramebuffer=U,z.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(b,U=0,z=0){T=b,R=U,A=z;let H=!0,B=null,dt=!1,Mt=!1;if(b){let Nt=Bt.get(b);Nt.__useDefaultFramebuffer!==void 0?(vt.bindFramebuffer(O.FRAMEBUFFER,null),H=!1):Nt.__webglFramebuffer===void 0?E.setupRenderTarget(b):Nt.__hasExternalTextures&&E.rebindTextures(b,Bt.get(b.texture).__webglTexture,Bt.get(b.depthTexture).__webglTexture);let Gt=b.texture;(Gt.isData3DTexture||Gt.isDataArrayTexture||Gt.isCompressedArrayTexture)&&(Mt=!0);let kt=Bt.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(kt[U])?B=kt[U][z]:B=kt[U],dt=!0):Ot.isWebGL2&&b.samples>0&&E.useMultisampledRTT(b)===!1?B=Bt.get(b).__webglMultisampledFramebuffer:Array.isArray(kt)?B=kt[z]:B=kt,w.copy(b.viewport),I.copy(b.scissor),q=b.scissorTest}else w.copy(K).multiplyScalar($).floor(),I.copy(tt).multiplyScalar($).floor(),q=rt;if(vt.bindFramebuffer(O.FRAMEBUFFER,B)&&Ot.drawBuffers&&H&&vt.drawBuffers(b,B),vt.viewport(w),vt.scissor(I),vt.setScissorTest(q),dt){let Nt=Bt.get(b.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+U,Nt.__webglTexture,z)}else if(Mt){let Nt=Bt.get(b.texture),Gt=U||0;O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,Nt.__webglTexture,z||0,Gt)}k=-1},this.readRenderTargetPixels=function(b,U,z,H,B,dt,Mt){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let It=Bt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Mt!==void 0&&(It=It[Mt]),It){vt.bindFramebuffer(O.FRAMEBUFFER,It);try{let Nt=b.texture,Gt=Nt.format,kt=Nt.type;if(Gt!==rn&&ut.convert(Gt)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let Ht=kt===bs&&(yt.has("EXT_color_buffer_half_float")||Ot.isWebGL2&&yt.has("EXT_color_buffer_float"));if(kt!==Gn&&ut.convert(kt)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_TYPE)&&!(kt===kn&&(Ot.isWebGL2||yt.has("OES_texture_float")||yt.has("WEBGL_color_buffer_float")))&&!Ht){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=b.width-H&&z>=0&&z<=b.height-B&&O.readPixels(U,z,H,B,ut.convert(Gt),ut.convert(kt),dt)}finally{let Nt=T!==null?Bt.get(T).__webglFramebuffer:null;vt.bindFramebuffer(O.FRAMEBUFFER,Nt)}}},this.copyFramebufferToTexture=function(b,U,z=0){let H=Math.pow(2,-z),B=Math.floor(U.image.width*H),dt=Math.floor(U.image.height*H);E.setTexture2D(U,0),O.copyTexSubImage2D(O.TEXTURE_2D,z,0,0,b.x,b.y,B,dt),vt.unbindTexture()},this.copyTextureToTexture=function(b,U,z,H=0){let B=U.image.width,dt=U.image.height,Mt=ut.convert(z.format),It=ut.convert(z.type);E.setTexture2D(z,0),O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,z.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,z.unpackAlignment),U.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,H,b.x,b.y,B,dt,Mt,It,U.image.data):U.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,H,b.x,b.y,U.mipmaps[0].width,U.mipmaps[0].height,Mt,U.mipmaps[0].data):O.texSubImage2D(O.TEXTURE_2D,H,b.x,b.y,Mt,It,U.image),H===0&&z.generateMipmaps&&O.generateMipmap(O.TEXTURE_2D),vt.unbindTexture()},this.copyTextureToTexture3D=function(b,U,z,H,B=0){if(v.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let dt=b.max.x-b.min.x+1,Mt=b.max.y-b.min.y+1,It=b.max.z-b.min.z+1,Nt=ut.convert(H.format),Gt=ut.convert(H.type),kt;if(H.isData3DTexture)E.setTexture3D(H,0),kt=O.TEXTURE_3D;else if(H.isDataArrayTexture||H.isCompressedArrayTexture)E.setTexture2DArray(H,0),kt=O.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,H.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,H.unpackAlignment);let Ht=O.getParameter(O.UNPACK_ROW_LENGTH),pe=O.getParameter(O.UNPACK_IMAGE_HEIGHT),ke=O.getParameter(O.UNPACK_SKIP_PIXELS),be=O.getParameter(O.UNPACK_SKIP_ROWS),pn=O.getParameter(O.UNPACK_SKIP_IMAGES),ae=z.isCompressedTexture?z.mipmaps[B]:z.image;O.pixelStorei(O.UNPACK_ROW_LENGTH,ae.width),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,ae.height),O.pixelStorei(O.UNPACK_SKIP_PIXELS,b.min.x),O.pixelStorei(O.UNPACK_SKIP_ROWS,b.min.y),O.pixelStorei(O.UNPACK_SKIP_IMAGES,b.min.z),z.isDataTexture||z.isData3DTexture?O.texSubImage3D(kt,B,U.x,U.y,U.z,dt,Mt,It,Nt,Gt,ae.data):z.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),O.compressedTexSubImage3D(kt,B,U.x,U.y,U.z,dt,Mt,It,Nt,ae.data)):O.texSubImage3D(kt,B,U.x,U.y,U.z,dt,Mt,It,Nt,Gt,ae),O.pixelStorei(O.UNPACK_ROW_LENGTH,Ht),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,pe),O.pixelStorei(O.UNPACK_SKIP_PIXELS,ke),O.pixelStorei(O.UNPACK_SKIP_ROWS,be),O.pixelStorei(O.UNPACK_SKIP_IMAGES,pn),B===0&&H.generateMipmaps&&O.generateMipmap(kt),vt.unbindTexture()},this.initTexture=function(b){b.isCubeTexture?E.setTextureCube(b,0):b.isData3DTexture?E.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?E.setTexture2DArray(b,0):E.setTexture2D(b,0),vt.unbindTexture()},this.resetState=function(){R=0,A=0,T=null,vt.reset(),Pt.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=t===Nc?"display-p3":"srgb",e.unpackColorSpace=Kt.workingColorSpace===fo?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===xe?ui:Bu}set outputEncoding(t){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=t===ui?xe:Tn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}},hc=class extends Ts{};hc.prototype.isWebGL1Renderer=!0;Ji=class extends Ie{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e}},Ki=class extends Rn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ft(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},du=new P,fu=new P,pu=new de,Ua=new Es,xr=new fi,$r=class extends Ie{constructor(t=new De,e=new Ki){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[0];for(let s=1,r=e.count;s<r;s++)du.fromBufferAttribute(e,s-1),fu.fromBufferAttribute(e,s),i[s]=i[s-1],i[s]+=du.distanceTo(fu);t.setAttribute("lineDistance",new fe(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),xr.copy(i.boundingSphere),xr.applyMatrix4(s),xr.radius+=r,t.ray.intersectsSphere(xr)===!1)return;pu.copy(s).invert(),Ua.copy(t.ray).applyMatrix4(pu);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=new P,h=new P,u=new P,d=new P,p=this.isLineSegments?2:1,g=i.index,f=i.attributes.position;if(g!==null){let m=Math.max(0,a.start),x=Math.min(g.count,a.start+a.count);for(let v=m,M=x-1;v<M;v+=p){let R=g.getX(v),A=g.getX(v+1);if(l.fromBufferAttribute(f,R),h.fromBufferAttribute(f,A),Ua.distanceSqToSegment(l,h,d,u)>c)continue;d.applyMatrix4(this.matrixWorld);let k=t.ray.origin.distanceTo(d);k<t.near||k>t.far||e.push({distance:k,point:u.clone().applyMatrix4(this.matrixWorld),index:v,face:null,faceIndex:null,object:this})}}else{let m=Math.max(0,a.start),x=Math.min(f.count,a.start+a.count);for(let v=m,M=x-1;v<M;v+=p){if(l.fromBufferAttribute(f,v),h.fromBufferAttribute(f,v+1),Ua.distanceSqToSegment(l,h,d,u)>c)continue;d.applyMatrix4(this.matrixWorld);let A=t.ray.origin.distanceTo(d);A<t.near||A>t.far||e.push({distance:A,point:u.clone().applyMatrix4(this.matrixWorld),index:v,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}},mu=new P,gu=new P,As=class extends $r{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[];for(let s=0,r=e.count;s<r;s+=2)mu.fromBufferAttribute(e,s),gu.fromBufferAttribute(e,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+mu.distanceTo(gu);t.setAttribute("lineDistance",new fe(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Jr=class extends $r{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}},uc=class extends Rn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ft(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},_u=new de,dc=new Es,yr=new fi,Mr=new P,Kr=class extends Ie{constructor(t=new De,e=new uc){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),yr.copy(i.boundingSphere),yr.applyMatrix4(s),yr.radius+=r,t.ray.intersectsSphere(yr)===!1)return;_u.copy(s).invert(),dc.copy(t.ray).applyMatrix4(_u);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=i.index,u=i.attributes.position;if(l!==null){let d=Math.max(0,a.start),p=Math.min(l.count,a.start+a.count);for(let g=d,_=p;g<_;g++){let f=l.getX(g);Mr.fromBufferAttribute(u,f),vu(Mr,f,c,s,t,e,this)}}else{let d=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=d,_=p;g<_;g++)Mr.fromBufferAttribute(u,g),vu(Mr,g,c,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};Qr=class extends $e{constructor(t,e,i,s,r,a,o,c,l){super(t,e,i,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},Ke=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],i,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)i=this.getPoint(a/t),r+=i.distanceTo(s),e.push(r),s=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let i=this.getLengths(),s=0,r=i.length,a;e?a=e:a=t*i[r-1];let o=0,c=r-1,l;for(;o<=c;)if(s=Math.floor(o+(c-o)/2),l=i[s]-a,l<0)o=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,i[s]===a)return s/(r-1);let h=i[s],d=i[s+1]-h,p=(a-h)/d;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),c=e||(a.isVector2?new ft:new P);return c.copy(o).sub(a).normalize(),c}getTangentAt(t,e){let i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){let i=new P,s=[],r=[],a=[],o=new P,c=new de;for(let p=0;p<=t;p++){let g=p/t;s[p]=this.getTangentAt(g,new P)}r[0]=new P,a[0]=new P;let l=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=l&&(l=h,i.set(1,0,0)),u<=l&&(l=u,i.set(0,1,0)),d<=l&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(s[p-1],s[p]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(we(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(c.makeRotationAxis(o,g))}a[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos(we(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(p=-p);for(let g=1;g<=t;g++)r[g].applyMatrix4(c.makeRotationAxis(s[g],p*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},Rs=class extends Ke{constructor(t=0,e=0,i=1,s=1,r=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(t,e){let i=e||new ft,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+t*r,c=this.aX+this.xRadius*Math.cos(o),l=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=c-this.aX,p=l-this.aY;c=d*h-p*u+this.aX,l=d*u+p*h+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},fc=class extends Rs{constructor(t,e,i,s,r,a){super(t,e,i,i,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};Sr=new P,Na=new Fc,Oa=new Fc,Fa=new Fc,pc=class extends Ke{constructor(t=[],e=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=s}getPoint(t,e=new P){let i=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:c===0&&o===r-1&&(o=r-2,c=1);let l,h;this.closed||o>0?l=s[(o-1)%r]:(Sr.subVectors(s[0],s[1]).add(s[0]),l=Sr);let u=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(Sr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Sr),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,g=Math.pow(l.distanceToSquared(u),p),_=Math.pow(u.distanceToSquared(d),p),f=Math.pow(d.distanceToSquared(h),p);_<1e-4&&(_=1),g<1e-4&&(g=_),f<1e-4&&(f=_),Na.initNonuniformCatmullRom(l.x,u.x,d.x,h.x,g,_,f),Oa.initNonuniformCatmullRom(l.y,u.y,d.y,h.y,g,_,f),Fa.initNonuniformCatmullRom(l.z,u.z,d.z,h.z,g,_,f)}else this.curveType==="catmullrom"&&(Na.initCatmullRom(l.x,u.x,d.x,h.x,this.tension),Oa.initCatmullRom(l.y,u.y,d.y,h.y,this.tension),Fa.initCatmullRom(l.z,u.z,d.z,h.z,this.tension));return i.set(Na.calc(c),Oa.calc(c),Fa.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new P().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};jr=class extends Ke{constructor(t=new ft,e=new ft,i=new ft,s=new ft){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new ft){let i=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(xs(t,s.x,r.x,a.x,o.x),xs(t,s.y,r.y,a.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},mc=class extends Ke{constructor(t=new P,e=new P,i=new P,s=new P){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new P){let i=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(xs(t,s.x,r.x,a.x,o.x),xs(t,s.y,r.y,a.y,o.y),xs(t,s.z,r.z,a.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},to=class extends Ke{constructor(t=new ft,e=new ft){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ft){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ft){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},gc=class extends Ke{constructor(t=new P,e=new P){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new P){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new P){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},eo=class extends Ke{constructor(t=new ft,e=new ft,i=new ft){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new ft){let i=e,s=this.v0,r=this.v1,a=this.v2;return i.set(vs(t,s.x,r.x,a.x),vs(t,s.y,r.y,a.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},_c=class extends Ke{constructor(t=new P,e=new P,i=new P){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new P){let i=e,s=this.v0,r=this.v1,a=this.v2;return i.set(vs(t,s.x,r.x,a.x),vs(t,s.y,r.y,a.y),vs(t,s.z,r.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},no=class extends Ke{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ft){let i=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,c=s[a===0?a:a-1],l=s[a],h=s[a>s.length-2?s.length-1:a+1],u=s[a>s.length-3?s.length-1:a+2];return i.set(xu(o,c.x,l.x,h.x,u.x),xu(o,c.y,l.y,h.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new ft().fromArray(s))}return this}},yu=Object.freeze({__proto__:null,ArcCurve:fc,CatmullRomCurve3:pc,CubicBezierCurve:jr,CubicBezierCurve3:mc,EllipseCurve:Rs,LineCurve:to,LineCurve3:gc,QuadraticBezierCurve:eo,QuadraticBezierCurve3:_c,SplineCurve:no}),vc=class extends Ke{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new yu[i](e,t))}return this}getPoint(t,e){let i=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let a=s[r]-i,o=this.curves[r],c=o.getLength(),l=c===0?0:1-a/c;return o.getPointAt(l,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let i=0,s=this.curves.length;i<s;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],i;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,c=a.getPoints(o);for(let l=0;l<c.length;l++){let h=c[l];i&&i.equals(h)||(e.push(h),i=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(new yu[s.type]().fromJSON(s))}return this}},Qi=class extends vc{constructor(t){super(),this.type="Path",this.currentPoint=new ft,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let i=new to(this.currentPoint.clone(),new ft(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,s){let r=new eo(this.currentPoint.clone(),new ft(t,e),new ft(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(t,e,i,s,r,a){let o=new jr(this.currentPoint.clone(),new ft(t,e),new ft(i,s),new ft(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),i=new no(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,s,r,a){let o=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+o,e+c,i,s,r,a),this}absarc(t,e,i,s,r,a){return this.absellipse(t,e,i,i,s,r,a),this}ellipse(t,e,i,s,r,a,o,c){let l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,i,s,r,a,o,c),this}absellipse(t,e,i,s,r,a,o,c){let l=new Rs(t,e,i,s,r,a,o,c);if(this.curves.length>0){let u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);let h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},io=class n extends De{constructor(t=[new ft(0,-.5),new ft(.5,0),new ft(0,.5)],e=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:i,phiLength:s},e=Math.floor(e),s=we(s,0,Math.PI*2);let r=[],a=[],o=[],c=[],l=[],h=1/e,u=new P,d=new ft,p=new P,g=new P,_=new P,f=0,m=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:f=t[x+1].x-t[x].x,m=t[x+1].y-t[x].y,p.x=m*1,p.y=-f,p.z=m*0,_.copy(p),p.normalize(),c.push(p.x,p.y,p.z);break;case t.length-1:c.push(_.x,_.y,_.z);break;default:f=t[x+1].x-t[x].x,m=t[x+1].y-t[x].y,p.x=m*1,p.y=-f,p.z=m*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),c.push(p.x,p.y,p.z),_.copy(g)}for(let x=0;x<=e;x++){let v=i+x*h*s,M=Math.sin(v),R=Math.cos(v);for(let A=0;A<=t.length-1;A++){u.x=t[A].x*M,u.y=t[A].y,u.z=t[A].x*R,a.push(u.x,u.y,u.z),d.x=x/e,d.y=A/(t.length-1),o.push(d.x,d.y);let T=c[3*A+0]*M,k=c[3*A+1],S=c[3*A+0]*R;l.push(T,k,S)}}for(let x=0;x<e;x++)for(let v=0;v<t.length-1;v++){let M=v+x*t.length,R=M,A=M+t.length,T=M+t.length+1,k=M+1;r.push(R,A,k),r.push(T,k,A)}this.setIndex(r),this.setAttribute("position",new fe(a,3)),this.setAttribute("uv",new fe(o,2)),this.setAttribute("normal",new fe(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.points,t.segments,t.phiStart,t.phiLength)}},br=new P,Er=new P,Ba=new P,wr=new ci,so=class extends De{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){let s=Math.pow(10,4),r=Math.cos(Cr*e),a=t.getIndex(),o=t.getAttribute("position"),c=a?a.count:o.count,l=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let g=0;g<c;g+=3){a?(l[0]=a.getX(g),l[1]=a.getX(g+1),l[2]=a.getX(g+2)):(l[0]=g,l[1]=g+1,l[2]=g+2);let{a:_,b:f,c:m}=wr;if(_.fromBufferAttribute(o,l[0]),f.fromBufferAttribute(o,l[1]),m.fromBufferAttribute(o,l[2]),wr.getNormal(Ba),u[0]=`${Math.round(_.x*s)},${Math.round(_.y*s)},${Math.round(_.z*s)}`,u[1]=`${Math.round(f.x*s)},${Math.round(f.y*s)},${Math.round(f.z*s)}`,u[2]=`${Math.round(m.x*s)},${Math.round(m.y*s)},${Math.round(m.z*s)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let x=0;x<3;x++){let v=(x+1)%3,M=u[x],R=u[v],A=wr[h[x]],T=wr[h[v]],k=`${M}_${R}`,S=`${R}_${M}`;S in d&&d[S]?(Ba.dot(d[S].normal)<=r&&(p.push(A.x,A.y,A.z),p.push(T.x,T.y,T.z)),d[S]=null):k in d||(d[k]={index0:l[x],index1:l[v],normal:Ba.clone()})}}for(let g in d)if(d[g]){let{index0:_,index1:f}=d[g];br.fromBufferAttribute(o,_),Er.fromBufferAttribute(o,f),p.push(br.x,br.y,br.z),p.push(Er.x,Er.y,Er.z)}this.setAttribute("position",new fe(p,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}},Cs=class extends Qi{constructor(t){super(t),this.uuid=ts(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let i=0,s=this.holes.length;i<s;i++)e[i]=this.holes[i].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,i=this.holes.length;e<i;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(new Qi().fromJSON(s))}return this}},fv={triangulate:function(n,t,e=2){let i=t&&t.length,s=i?t[0]*e:n.length,r=Ju(n,0,s,e,!0),a=[];if(!r||r.next===r.prev)return a;let o,c,l,h,u,d,p;if(i&&(r=vv(n,t,r,e)),n.length>80*e){o=l=n[0],c=h=n[1];for(let g=e;g<s;g+=e)u=n[g],d=n[g+1],u<o&&(o=u),d<c&&(c=d),u>l&&(l=u),d>h&&(h=d);p=Math.max(l-o,h-c),p=p!==0?32767/p:0}return Ps(r,a,e,o,c,p,0),a}};ys=class n{static area(t){let e=t.length,i=0;for(let s=e-1,r=0;r<e;s=r++)i+=t[s].x*t[r].y-t[r].x*t[s].y;return i*.5}static isClockWise(t){return n.area(t)<0}static triangulateShape(t,e){let i=[],s=[],r=[];Su(t),bu(i,t);let a=t.length;e.forEach(Su);for(let c=0;c<e.length;c++)s.push(a),a+=e[c].length,bu(i,e[c]);let o=fv.triangulate(i,s);for(let c=0;c<o.length;c+=3)r.push(o.slice(c,c+3));return r}};ro=class n extends De{constructor(t=new Cs([new ft(0,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};let i=[],s=[],r=[],a=[],o=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let h=0;h<t.length;h++)l(t[h]),this.addGroup(o,c,h),o+=c,c=0;this.setIndex(i),this.setAttribute("position",new fe(s,3)),this.setAttribute("normal",new fe(r,3)),this.setAttribute("uv",new fe(a,2));function l(h){let u=s.length/3,d=h.extractPoints(e),p=d.shape,g=d.holes;ys.isClockWise(p)===!1&&(p=p.reverse());for(let f=0,m=g.length;f<m;f++){let x=g[f];ys.isClockWise(x)===!0&&(g[f]=x.reverse())}let _=ys.triangulateShape(p,g);for(let f=0,m=g.length;f<m;f++){let x=g[f];p=p.concat(x)}for(let f=0,m=p.length;f<m;f++){let x=p[f];s.push(x.x,x.y,0),r.push(0,0,1),a.push(x.x,x.y)}for(let f=0,m=_.length;f<m;f++){let x=_[f],v=x[0]+u,M=x[1]+u,R=x[2]+u;i.push(v,M,R),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes;return Pv(e,t)}static fromJSON(t,e){let i=[];for(let s=0,r=t.shapes.length;s<r;s++){let a=e[t.shapes[s]];i.push(a)}return new n(i,t.curveSegments)}};Yn=class extends Rn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=zu,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},oo=class extends Yn{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ft(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return we(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ft(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ft(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ft(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};ji=class{constructor(t,e,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,s=e[i],r=e[i-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<r)break i;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(r=s,s=e[++i],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(i=2,r=o);for(let c=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(s=r,r=e[--i-1],t>=r)break t}a=i,i=0;break e}break n}for(;i<a;){let o=i+a>>>1;t<e[o]?a=o:i=o+1}if(s=e[i],r=e[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=i[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Mc=class extends ji{constructor(t,e,i,s){super(t,e,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Sh,endingEnd:Sh}}intervalChanged_(t,e,i){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],c=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case bh:r=t,o=2*e-i;break;case Eh:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=i}if(c===void 0)switch(this.getSettings_().endingEnd){case bh:a=t,c=2*i-e;break;case Eh:a=1,c=i+s[1]-s[0];break;default:a=t-1,c=e}let l=(i-e)*.5,h=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(c-i),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,g=(i-e)/(s-e),_=g*g,f=_*g,m=-d*f+2*d*_-d*g,x=(1+d)*f+(-1.5-2*d)*_+(-.5+d)*g+1,v=(-1-p)*f+(1.5+p)*_+.5*g,M=p*f-p*_;for(let R=0;R!==o;++R)r[R]=m*a[h+R]+x*a[l+R]+v*a[c+R]+M*a[u+R];return r}},Sc=class extends ji{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,h=(i-e)/(s-e),u=1-h;for(let d=0;d!==o;++d)r[d]=a[l+d]*u+a[c+d]*h;return r}},bc=class extends ji{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},an=class{constructor(t,e,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Rr(e,this.TimeBufferType),this.values=Rr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:Rr(t.times,Array),values:Rr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s)}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new bc(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Sc(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Mc(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Lr:e=this.InterpolantFactoryMethodDiscrete;break;case Ir:e=this.InterpolantFactoryMethodLinear;break;case ha:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Lr;case this.InterpolantFactoryMethodLinear:return Ir;case this.InterpolantFactoryMethodSmooth:return ha}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]*=t}return this}trim(t,e){let i=this.times,s=i.length,r=0,a=s-1;for(;r!==s&&i[r]<t;)++r;for(;a!==-1&&i[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=i.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let c=i[o];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,c),t=!1;break}if(a!==null&&a>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,c,a),t=!1;break}a=c}if(s!==void 0&&Lv(s))for(let o=0,c=s.length;o!==c;++o){let l=s[o];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===ha,r=t.length-1,a=1;for(let o=1;o<r;++o){let c=!1,l=t[o],h=t[o+1];if(l!==h&&(o!==1||l!==t[0]))if(s)c=!0;else{let u=o*i,d=u-i,p=u+i;for(let g=0;g!==i;++g){let _=e[u+g];if(_!==e[d+g]||_!==e[p+g]){c=!0;break}}}if(c){if(o!==a){t[a]=t[o];let u=o*i,d=a*i;for(let p=0;p!==i;++p)e[d+p]=e[u+p]}++a}}if(r>0){t[a]=t[r];for(let o=r*i,c=a*i,l=0;l!==i;++l)e[c+l]=e[o+l];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,s=new i(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};an.prototype.TimeBufferType=Float32Array;an.prototype.ValueBufferType=Float32Array;an.prototype.DefaultInterpolation=Ir;gi=class extends an{};gi.prototype.ValueTypeName="bool";gi.prototype.ValueBufferType=Array;gi.prototype.DefaultInterpolation=Lr;gi.prototype.InterpolantFactoryMethodLinear=void 0;gi.prototype.InterpolantFactoryMethodSmooth=void 0;Ec=class extends an{};Ec.prototype.ValueTypeName="color";wc=class extends an{};wc.prototype.ValueTypeName="number";Tc=class extends ji{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(i-e)/(s-e),l=t*o;for(let h=l+o;l!==h;l+=4)qn.slerpFlat(r,0,a,l-o,a,l,c);return r}},Ds=class extends an{InterpolantFactoryMethodLinear(t){return new Tc(this.times,this.values,this.getValueSize(),t)}};Ds.prototype.ValueTypeName="quaternion";Ds.prototype.DefaultInterpolation=Ir;Ds.prototype.InterpolantFactoryMethodSmooth=void 0;_i=class extends an{};_i.prototype.ValueTypeName="string";_i.prototype.ValueBufferType=Array;_i.prototype.DefaultInterpolation=Lr;_i.prototype.InterpolantFactoryMethodLinear=void 0;_i.prototype.InterpolantFactoryMethodSmooth=void 0;Ac=class extends an{};Ac.prototype.ValueTypeName="vector";Rc=class{constructor(t,e,i){let s=this,r=!1,a=0,o=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){let p=l[u],g=l[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return g}return null}}},Iv=new Rc,Cc=class{constructor(t){this.manager=t!==void 0?t:Iv,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let i=this;return new Promise(function(s,r){i.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};Cc.DEFAULT_MATERIAL_NAME="__DEFAULT";Us=class extends Ie{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ft(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}},za=new de,Eu=new P,wu=new P,ao=class{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.map=null,this.mapPass=null,this.matrix=new de,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ws,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new oe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,i=this.matrix;Eu.setFromMatrixPosition(t.matrixWorld),e.position.copy(Eu),wu.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(wu),e.updateMatrixWorld(),za.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(za),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(za)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Tu=new de,ms=new P,ka=new P,Pc=class extends ao{constructor(){super(new Ce(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ft(4,2),this._viewportCount=6,this._viewports=[new oe(2,1,1,1),new oe(0,1,1,1),new oe(3,1,1,1),new oe(1,1,1,1),new oe(3,0,1,1),new oe(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(t,e=0){let i=this.camera,s=this.matrix,r=t.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),ms.setFromMatrixPosition(t.matrixWorld),i.position.copy(ms),ka.copy(i.position),ka.add(this._cubeDirections[e]),i.up.copy(this._cubeUps[e]),i.lookAt(ka),i.updateMatrixWorld(),s.makeTranslation(-ms.x,-ms.y,-ms.z),Tu.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Tu)}},vi=class extends Us{constructor(t,e,i=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new Pc}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}},Lc=class extends ao{constructor(){super(new Yr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},co=class extends Us{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ie.DEFAULT_UP),this.updateMatrix(),this.target=new Ie,this.shadow=new Lc}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}},lo=class extends Us{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}},ho=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Au(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let e=Au();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}};Bc="\\[\\]\\.:\\/",Dv=new RegExp("["+Bc+"]","g"),zc="[^"+Bc+"]",Uv="[^"+Bc.replace("\\.","")+"]",Nv=/((?:WC+[\/:])*)/.source.replace("WC",zc),Ov=/(WCOD+)?/.source.replace("WCOD",Uv),Fv=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",zc),Bv=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",zc),zv=new RegExp("^"+Nv+Ov+Fv+Bv+"$"),kv=["material","materials","bones","map"],Ic=class{constructor(t,e,i){let s=i||re.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},re=class n{constructor(t,e,i){this.path=e,this.parsedPath=i||n.parseTrackName(e),this.node=n.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new n.Composite(t,e,i):new n(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Dv,"")}static parseTrackName(t){let e=zv.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);kv.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let c=i(o.children);if(c)return c}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)t[e++]=i[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=n.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=e.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===l){l=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(l!==void 0){if(t[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let a=t[s];if(a===void 0){let l=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};re.Composite=Ic;re.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};re.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};re.prototype.GetterByBindingType=[re.prototype._getValue_direct,re.prototype._getValue_array,re.prototype._getValue_arrayElement,re.prototype._getValue_toArray];re.prototype.SetterByBindingTypeAndVersioning=[[re.prototype._setValue_direct,re.prototype._setValue_direct_setNeedsUpdate,re.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[re.prototype._setValue_array,re.prototype._setValue_array_setNeedsUpdate,re.prototype._setValue_array_setMatrixWorldNeedsUpdate],[re.prototype._setValue_arrayElement,re.prototype._setValue_arrayElement_setNeedsUpdate,re.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[re.prototype._setValue_fromArray,re.prototype._setValue_fromArray_setNeedsUpdate,re.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];nx=new Float32Array(1);typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"160"}}));typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="160")});function ns(n){let t=new Cn;return t.color.setScalar(n),t}var go,ju=zs(()=>{kc();go=class extends Ji{constructor(t=null){super();let e=new pi;e.deleteAttribute("uv");let i=new Yn({side:Pe}),s=new Yn,r=5;t!==null&&t._useLegacyLights===!1&&(r=900);let a=new vi(16777215,r,28,2);a.position.set(.418,16.199,.3),this.add(a);let o=new $t(e,i);o.position.set(-.757,13.219,.717),o.scale.set(31.713,28.305,28.591),this.add(o);let c=new $t(e,s);c.position.set(-10.906,2.009,1.846),c.rotation.set(0,-.195,0),c.scale.set(2.328,7.905,4.651),this.add(c);let l=new $t(e,s);l.position.set(-5.607,-.754,-.758),l.rotation.set(0,.994,0),l.scale.set(1.97,1.534,3.955),this.add(l);let h=new $t(e,s);h.position.set(6.167,.857,7.803),h.rotation.set(0,.561,0),h.scale.set(3.927,6.285,3.687),this.add(h);let u=new $t(e,s);u.position.set(-2.017,.018,6.124),u.rotation.set(0,.333,0),u.scale.set(2.002,4.566,2.064),this.add(u);let d=new $t(e,s);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);let p=new $t(e,s);p.position.set(-2.193,-.369,-5.547),p.rotation.set(0,.516,0),p.scale.set(3.875,3.487,2.986),this.add(p);let g=new $t(e,ns(50));g.position.set(-16.116,14.37,8.208),g.scale.set(.1,2.428,2.739),this.add(g);let _=new $t(e,ns(50));_.position.set(-16.109,18.021,-8.207),_.scale.set(.1,2.425,2.751),this.add(_);let f=new $t(e,ns(17));f.position.set(14.904,12.198,-1.832),f.scale.set(.15,4.265,6.331),this.add(f);let m=new $t(e,ns(43));m.position.set(-.462,8.89,14.52),m.scale.set(4.38,5.441,.088),this.add(m);let x=new $t(e,ns(20));x.position.set(3.235,11.486,-12.541),x.scale.set(2.5,2,.1),this.add(x);let v=new $t(e,ns(100));v.position.set(0,20,0),v.scale.set(1,.1,1),this.add(v)}dispose(){let t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(let e of t)e.dispose()}}});var td={};fd(td,{initHero:()=>Vv});function Vv(n,t){let e=new Ts({canvas:n,antialias:!0,alpha:!1,powerPreference:"high-performance"}),i=window.innerWidth<760;e.setPixelRatio(Math.min(window.devicePixelRatio,i?1.5:2)),e.setClearColor(658443,1),e.toneMapping=Dc,e.toneMappingExposure=1.05;let s=new Ji,r=new $i(e);s.environment=r.fromScene(new go(e),.04).texture;let a=new Ce(32,1,.1,200);a.position.set(0,.5,11),a.lookAt(0,0,0);let o=.075,c=xi("dgauss"),l=jn(c),h=c.S,d=h[h.length-1].z+l.bfdInf,p=(h[0].z+d)/2,g=new on;s.add(g);let _=new on;g.add(_);let f=(J,st)=>J.R?J.R-Math.sign(J.R)*Math.sqrt(Math.max(0,J.R*J.R-st*st)):0,m=new oo({color:16777215,metalness:0,roughness:.04,transmission:1,thickness:.6,ior:1.62,envMapIntensity:1.4,clearcoat:1,clearcoatRoughness:.04,attenuationColor:new Ft(13238248),attenuationDistance:3.5,side:Ge,specularIntensity:1,iridescence:.25,iridescenceIOR:1.3}),x=new Ki({color:10481864,transparent:!0,opacity:.35}),v=[];for(let J=0;J<h.length-1;J++){let st=h[J],pt=h[J+1];if(st.stop||st.n<=1)continue;let Z=Math.min(st.sd,pt.sd),zt=[],Ct=28;for(let Dt=0;Dt<=Ct;Dt++){let Lt=Z*Dt/Ct;zt.push(new ft(Lt*o,(st.z+f(st,Lt)-p)*o))}for(let Dt=Ct;Dt>=0;Dt--){let Lt=Z*Dt/Ct;zt.push(new ft(Lt*o,(pt.z+f(pt,Lt)-p)*o))}let bt=new io(zt,96);bt.rotateZ(-Math.PI/2);let mt=new $t(bt,m),ut=new on;ut.add(mt);let Pt=new De().setFromPoints(Array.from({length:96},(Dt,Lt)=>{let it=Lt/96*Math.PI*2;return new P((st.z+f(st,Z)-p)*o,Math.cos(it)*Z*o,Math.sin(it)*Z*o)})),Zt=new Jr(Pt,x);ut.add(Zt),_.add(ut),v.push({g:ut,idx:v.length})}let M=l.stop,R=new Cs;R.absarc(0,0,M.sd*1.55*o,0,Math.PI*2,!1);let A=new Qi,T=M.sd*.78*o;for(let J=0;J<=7;J++){let st=J/7*Math.PI*2+.3,pt=Math.cos(st)*T,Z=Math.sin(st)*T;J?A.lineTo(pt,Z):A.moveTo(pt,Z)}R.holes.push(A);let k=new $t(new ro(R,48),new Yn({color:1382426,metalness:.85,roughness:.38,side:Ge}));k.rotation.y=Math.PI/2,k.position.x=(M.z-p)*o;let S=new on;S.add(k),_.add(S),v.push({g:S,idx:v.length,iris:!0});let w=new $t(new Zi(24*o*.5,36*o*.5),new Cn({color:16747069,transparent:!0,opacity:.12,side:Ge}));w.rotation.y=Math.PI/2,w.position.x=(d-p)*o;let I=new As(new so(w.geometry),new Ki({color:16747069,transparent:!0,opacity:.8}));I.rotation.copy(w.rotation),I.position.copy(w.position),_.add(w,I);let q={shift:0,zSensor:d,stopR:M.sd*.98,blades:0,bladeRot:0,round:1,disp:1},Q=[],L=[],N=[],W=new Float64Array(2),$=[[0,new Ft(10481864)],[.32,new Ft(15968092)]];for(let[J,st]of $)for(let pt=0;pt<4;pt++){let Z=pt/4*Math.PI;for(let zt=0;zt<9;zt++){let Ct=-h[0].sd*.95+h[0].sd*1.9*(zt+.5)/9,bt=-60,mt=Math.tan(J),ut=1,Pt=Math.hypot(mt,ut),Zt=Ct-mt*(0-bt),Dt=[];if(!Qn(c,q,0,Zt,bt,0,mt/Pt,ut/Pt,1,W,Dt,d+6))continue;let Lt=(-22-Dt[0])/(Dt[2]-Dt[0]);Dt[1]=Dt[1]+Lt*(Dt[3]-Dt[1]),Dt[0]=-22;let it=0;for(let C=0;C<Dt.length-2;C+=2){let at=[Dt[C],Dt[C+1]],ct=[Dt[C+2],Dt[C+3]],At=Math.hypot(ct[0]-at[0],ct[1]-at[1]);for(let[Et,Jt]of[[at,it],[ct,it+At]])Q.push((Et[0]-p)*o,Et[1]*o*Math.cos(Z),Et[1]*o*Math.sin(Z)),L.push(Jt),N.push(st.r,st.g,st.b);it+=At}}}let G=new De;G.setAttribute("position",new fe(Q,3)),G.setAttribute("dist",new fe(L,1)),G.setAttribute("color",new fe(N,3));let X=new Je({transparent:!0,depthWrite:!1,blending:Ms,uniforms:{uTime:{value:0},uAlpha:{value:0}},vertexShader:`attribute float dist; attribute vec3 color; varying float vD; varying vec3 vC;
      void main(){ vD = dist; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,fragmentShader:`uniform float uTime; uniform float uAlpha; varying float vD; varying vec3 vC;
      void main(){ float p = fract(vD*0.018 - uTime*0.35); float pulse = smoothstep(0.0,0.06,p)*smoothstep(0.22,0.06,p);
        gl_FragColor = vec4(vC*(0.22 + pulse*1.4), 1.0) * uAlpha; }`}),K=new As(G,X);_.add(K);let tt=document.createElement("canvas");tt.width=2048,tt.height=1024;let rt=tt.getContext("2d"),V=rt.createLinearGradient(0,0,0,1024);V.addColorStop(0,"#07090b"),V.addColorStop(1,"#0c0a0d"),rt.fillStyle=V,rt.fillRect(0,0,2048,1024);let Y=Pn(5);rt.globalCompositeOperation="lighter";let ht=["243,167,92","127,214,255","159,240,200","255,120,150"];for(let J=0;J<70;J++){let st=Y()*2048,pt=150+Y()*724,Z=10+Y()*40,zt=ht[Math.floor(Y()*ht.length)],Ct=.025+Y()*.06;rt.beginPath();for(let mt=0;mt<=7;mt++){let ut=mt/7*Math.PI*2+.3,Pt=st+Math.cos(ut)*Z,Zt=pt+Math.sin(ut)*Z;mt?rt.lineTo(Pt,Zt):rt.moveTo(Pt,Zt)}let bt=rt.createRadialGradient(st,pt,0,st,pt,Z);bt.addColorStop(0,`rgba(${zt},${Ct*.7})`),bt.addColorStop(.85,`rgba(${zt},${Ct})`),bt.addColorStop(1,`rgba(${zt},${Ct*1.6})`),rt.fillStyle=bt,rt.fill()}let _t=new Qr(tt);_t.colorSpace=xe;let gt=new $t(new Zi(60,30),new Cn({map:_t}));gt.position.set(0,0,-16),s.add(gt);let Rt=i?350:700,Ut=new Float32Array(Rt*3),Tt=new Float32Array(Rt*3),Yt=new Float32Array(Rt),O=[15968092,8378111,10481864,16742550,16766880].map(J=>new Ft(J));for(let J=0;J<Rt;J++){Ut[J*3]=(Y()-.5)*26,Ut[J*3+1]=(Y()-.5)*13,Ut[J*3+2]=-12+Y()*17;let st=O[Math.floor(Y()*O.length)];Tt.set([st.r,st.g,st.b],J*3),Yt[J]=Y()}let me=new De;me.setAttribute("position",new Le(Ut,3)),me.setAttribute("color",new Le(Tt,3)),me.setAttribute("seed",new Le(Yt,1));let yt=new Je({transparent:!0,depthWrite:!1,blending:Ms,uniforms:{uFocus:{value:9},uAp:{value:9},uTime:{value:0},uPR:{value:e.getPixelRatio()},uH:{value:800},uAlpha:{value:0}},vertexShader:`attribute vec3 color; attribute float seed; uniform float uFocus, uAp, uTime, uPR, uH; varying vec3 vC; varying float vE; varying float vRot;
      void main(){ vec3 p = position; p.y += sin(uTime*0.25 + seed*20.)*0.15; p.x += cos(uTime*0.2 + seed*13.)*0.12;
        vec4 mv = modelViewMatrix * vec4(p,1.); float d = -mv.z;
        float coc = abs(1./d - 1./uFocus) * uAp;
        float size = (2.0 + coc * uH * 0.07) * uPR;
        gl_PointSize = clamp(size, 2., 140.);
        vE = clamp(2.6 / (1. + coc*uH*0.04), 0.03, 1.0) * (0.35 + seed*0.65);
        vC = color; vRot = seed*6.28;
        gl_Position = projectionMatrix * mv; }`,fragmentShader:`uniform float uAlpha; varying vec3 vC; varying float vE; varying float vRot;
      void main(){ vec2 q = gl_PointCoord*2.-1.; float r = length(q);
        float a = atan(q.y,q.x)+vRot; float n = 7.; float seg = 6.2831853/n;
        float m = mod(a, seg) - seg*0.5; float poly = cos(3.14159/n)/cos(m);
        float rr = r/mix(poly,1.,0.55);
        if (rr>1.) discard;
        float body = 0.55 + 0.45*smoothstep(0.55,0.96,rr);
        float edge = smoothstep(1.0,0.9,rr);
        vec3 c = vC*body*edge*vE;
        gl_FragColor = vec4(c, 1.)*uAlpha; }`}),Ot=new Kr(me,yt);s.add(Ot),s.add(new lo(16777215,.15));let vt=new co(16777215,1.4);vt.position.set(4,6,6),s.add(vt);let Qt=new vi(10481864,30,30);Qt.position.set(-4,2,-2),s.add(Qt);let Bt=new vi(15968092,25,30);Bt.position.set(5,-3,2),s.add(Bt);let E={explode:1.6,rays:0,particles:0,rotY:-1.2},y={x:0,y:0,tx:0,ty:0},F=0;window.addEventListener("pointermove",J=>{y.tx=J.clientX/window.innerWidth-.5,y.ty=J.clientY/window.innerHeight-.5}),window.addEventListener("scroll",()=>{F=Math.min(1,window.scrollY/window.innerHeight)},{passive:!0});function et(){let J=n.clientWidth,st=n.clientHeight;e.setSize(J,st,!1),a.aspect=J/st,a.updateProjectionMatrix(),yt.uniforms.uH.value=st;let pt=J/st>1.2;g.position.set(pt?2.9:0,pt?.6:1.6,0),g.scale.setScalar(pt?.7:.5)}et(),window.addEventListener("resize",et);let j=!0;new IntersectionObserver(J=>{j=J[0].isIntersecting},{threshold:0}).observe(n);let nt=new ho,xt=-1;function lt(){if(requestAnimationFrame(lt),!j)return;let J=nt.getElapsedTime();y.x+=(y.tx-y.x)*.05,y.y+=(y.ty-y.y)*.05,_.rotation.y=E.rotY+y.x*.5+Math.sin(J*.2)*.08,_.rotation.x=.12+y.y*.25,_.rotation.z=Math.sin(J*.15)*.04;let st=E.explode+F*1.2;v.forEach((Z,zt)=>{Z.g.position.x=(zt-v.length/2)*st*.35}),w.position.x=I.position.x=(d-p)*o+st*1.2,K.visible=st<.25,X.uniforms.uTime.value=J,X.uniforms.uAlpha.value=E.rays*Math.max(0,1-st*5);let pt=6.5+Math.sin(J*.35)*2.2+y.y*-3+F*4;yt.uniforms.uFocus.value=pt,yt.uniforms.uTime.value=J,yt.uniforms.uAlpha.value=E.particles,t&&Math.abs(pt-xt)>.05&&(xt=pt,t(pt)),e.render(s,a)}return lt(),{anim:E}}var ed=zs(()=>{kc();ju();Vs()});Vs();var el=(document.documentElement.lang||"pt").toLowerCase(),Ln=el.startsWith("zh")?"zh":el.startsWith("en")?"en":"pt",_d={pt:{circular:"circular",stop:"diafragma",invalid:"Geometria inv\xE1lida: superf\xEDcies se cruzariam.",dragFocus:"\u2194 arraste para focar",nearSensor:"PERTO DO SENSOR \xB7 \xB13 mm",sensor:"SENSOR",noImage:"Sem imagem real: a lente n\xE3o converge esse ponto.",onSensor:"Foco paraxial no sensor.",focusMsg:(n,t,e)=>`Foco paraxial ${n} mm ${t?"antes":"depois"} do sensor \xB7 extens\xE3o ${e} mm`,noLight:"sem luz",gauss:"Blur gaussiano",input:"Entrada n\xEDtida",optical:"\xD3ptico",pinHdr:"Highlight HDR mant\xE9m a energia",pinCat:"Cat-eye: o vidro recorta o disco",pinBlade:"7 l\xE2minas desenham a forma",pinCA:"Franja crom\xE1tica na borda",pinFocus:"Plano de foco: n\xEDtido nos dois",all:"Todas",count:(n,t)=>`${n} de ${t} perfis listados nesta p\xE1gina.`},en:{circular:"circular",stop:"aperture stop",invalid:"Invalid geometry: surfaces would intersect.",dragFocus:"\u2194 drag to focus",nearSensor:"NEAR THE SENSOR \xB7 \xB13 mm",sensor:"SENSOR",noImage:"No real image: the lens does not converge this point.",onSensor:"Paraxial focus on the sensor.",focusMsg:(n,t,e)=>`Paraxial focus ${n} mm ${t?"in front of":"behind"} the sensor \xB7 extension ${e} mm`,noLight:"no light",gauss:"Gaussian blur",input:"Sharp input",optical:"Optical",pinHdr:"HDR highlight keeps its energy",pinCat:"Cat-eye: the glass clips the disc",pinBlade:"7 blades draw the shape",pinCA:"Chromatic fringe on the edge",pinFocus:"Focus plane: sharp on both sides",all:"All",count:(n,t)=>`${n} of ${t} profiles listed on this page.`},zh:{circular:"\u5706\u5F62",stop:"\u5149\u5708",invalid:"\u51E0\u4F55\u65E0\u6548\uFF1A\u955C\u9762\u4F1A\u76F8\u4EA4\u3002",dragFocus:"\u2194 \u62D6\u52A8\u5BF9\u7126",nearSensor:"\u4F20\u611F\u5668\u9644\u8FD1 \xB7 \xB13 mm",sensor:"\u4F20\u611F\u5668",noImage:"\u6CA1\u6709\u5B9E\u50CF\uFF1A\u955C\u5934\u65E0\u6CD5\u4F1A\u805A\u8FD9\u4E2A\u70B9\u3002",onSensor:"\u8FD1\u8F74\u7126\u70B9\u4F4D\u4E8E\u4F20\u611F\u5668\u4E0A\u3002",focusMsg:(n,t,e)=>`\u8FD1\u8F74\u7126\u70B9\u5728\u4F20\u611F\u5668${t?"\u524D":"\u540E"} ${n} mm \xB7 \u955C\u7EC4\u4F38\u51FA ${e} mm`,noLight:"\u65E0\u5149",gauss:"\u9AD8\u65AF\u6A21\u7CCA",input:"\u6E05\u6670\u539F\u56FE",optical:"\u5149\u5B66",pinHdr:"HDR \u9AD8\u5149\u4FDD\u7559\u80FD\u91CF",pinCat:"\u732B\u773C\uFF1A\u955C\u7247\u88C1\u5207\u5149\u6591",pinBlade:"7 \u7247\u5149\u5708\u53F6\u7247\u51B3\u5B9A\u5F62\u72B6",pinCA:"\u5149\u6591\u8FB9\u7F18\u7684\u8272\u6563",pinFocus:"\u5BF9\u7126\u5E73\u9762\uFF1A\u4E24\u4FA7\u90FD\u6E05\u6670",all:"\u5168\u90E8",count:(n,t)=>`\u672C\u9875\u5217\u51FA ${n} / ${t} \u4E2A\u955C\u5934\u914D\u7F6E\u3002`}},ce=n=>_d[Ln][n],ln=(n,t)=>{let e=n.toFixed(t);return Ln==="pt"?e.replace(".",","):e},vd={en:{dgauss:["Double-Gauss 50 mm","Public prescription (LensSim / PBRT, MIT). The classic base of 50 mm normal lenses."],triplet:["Cooke Triplet 50 mm","Three-element family (1893). Scaled teaching study."],petzval:["Petzval 85 mm","19th-century portrait lens: sharp center, curved field and swirl. Teaching study."],singlet:["Simple lens 50 mm","A single plano-convex glass: uncorrected spherical and chromatic aberration."]},zh:{dgauss:["\u53CC\u9AD8\u65AF 50 mm","\u516C\u5F00\u7684\u955C\u5934\u5904\u65B9\uFF08LensSim / PBRT\uFF0CMIT\uFF09\u3002\u7ECF\u5178 50 mm \u6807\u51C6\u955C\u5934\u7684\u57FA\u7840\u7ED3\u6784\u3002"],triplet:["\u5E93\u514B\u4E09\u7247\u5F0F 50 mm","\u4E09\u7247\u5F0F\u7ED3\u6784\uFF081893\uFF09\u3002\u6309\u6BD4\u4F8B\u7F29\u653E\u7684\u6559\u5B66\u793A\u4F8B\u3002"],petzval:["\u4F69\u5179\u4F10 85 mm","19 \u4E16\u7EAA\u4EBA\u50CF\u955C\u5934\uFF1A\u4E2D\u5FC3\u9510\u5229\u3001\u573A\u66F2\u548C\u65CB\u7126\u3002\u6559\u5B66\u793A\u4F8B\u3002"],singlet:["\u5355\u7247\u955C 50 mm","\u4E00\u7247\u5E73\u51F8\u900F\u955C\uFF1A\u672A\u6821\u6B63\u7684\u7403\u5DEE\u548C\u8272\u5DEE\u3002"]}};function Ro(n,t){var i;let e=(i=vd[Ln])==null?void 0:i[n];return e?{name:e[0],note:e[1]}:{name:t.name,note:t.note}}var xd={en:{Anam\u00F3rfica:"Anamorphic",Apodiza\u00E7\u00E3o:"Apodization","Grande-angular sim\xE9trica":"Symmetric wide-angle",Sim\u00E9trica:"Symmetric",Singleto:"Singlet","Tilt criativo":"Creative tilt","Zoom cine":"Cine zoom",Tele:"Telephoto"},zh:{Anam\u00F3rfica:"\u53D8\u5F62\u5BBD\u94F6\u5E55",Apodiza\u00E7\u00E3o:"\u5207\u8DBE",Cine:"\u7535\u5F71\u955C\u5934",Distagon:"Distagon","Double-Gauss":"\u53CC\u9AD8\u65AF","Grande-angular sim\xE9trica":"\u5BF9\u79F0\u5E7F\u89D2",Heliar:"Heliar",Macro:"\u5FAE\u8DDD",Petzval:"\u4F69\u5179\u4F10",Primoplan:"Primoplan",Retrofocus:"\u53CD\u8FDC\u6444",Sim\u00E9trica:"\u5BF9\u79F0\u5F0F",Singleto:"\u5355\u7247","Soft focus":"\u67D4\u7126",Sonnar:"\u677E\u7EB3",Tele:"\u957F\u7126",Tessar:"\u5929\u585E","Tilt criativo":"\u521B\u610F\u79FB\u8F74",Triplet:"\u4E09\u7247\u5F0F","Zoom cine":"\u7535\u5F71\u53D8\u7126"}},yd={en:{"(estudo)":"(study)","Lente simples plano-convexa 50 mm":"Simple plano-convex lens 50 mm","Menisco Wollaston 50 mm":"Wollaston meniscus 50 mm","(prescri\xE7\xE3o LensSim)":"(LensSim prescription)"},zh:{"(estudo)":"\uFF08\u7814\u7A76\uFF09","Lente simples plano-convexa 50 mm":"\u5E73\u51F8\u5355\u7247\u955C 50 mm","Menisco Wollaston 50 mm":"\u6C83\u62C9\u65AF\u987F\u5F2F\u6708\u955C 50 mm","(prescri\xE7\xE3o LensSim)":"\uFF08LensSim \u5904\u65B9\uFF09"}},Md={en:{"Cooke look moderno":"modern Cooke look","Heliar cl\xE1ssica":"classic Heliar","abertura extrema":"extreme aperture","adaptador 2\xD7":"2\xD7 adapter","alem\xE3 vintage":"German vintage","anam\xF3rfica acess\xEDvel":"affordable anamorphic","anam\xF3rfica moderna":"modern anamorphic",apocrom\u00E1tica:"apochromatic","apodiza\xE7\xE3o moderna":"modern apodization",asf\u00E9rica:"aspherical",a\u00E9rea:"aerial","bokeh bolha de sab\xE3o":"soap-bubble bokeh","bokeh cremoso":"creamy bokeh","bokeh limpo":"clean bokeh","bokeh perfeito":"perfect bokeh","bokeh redondo":"round bokeh","bokeh suave":"soft bokeh","borda borrada":"blurred edges","campo curvo":"curved field","campo raso extremo":"extremely shallow depth","cat-eye forte":"strong cat-eye","centro n\xEDtido":"sharp center",cl\u00EDnica:"clinical","coma no campo":"field coma",compacta:"compact","compacta 1.5\xD7":"compact 1.5\xD7","compacta luminosa":"compact and fast","compacta sovi\xE9tica":"compact Soviet",compress\u00E3o:"compression","compress\xE3o suave":"gentle compression",contraste:"contrast","contraste alto":"high contrast","contraste baixo":"low contrast","contraste suave":"soft contrast","cor quente":"warm color","corre\xE7\xE3o extrema":"extreme correction",corrigida:"corrected","c\xE2mera de caix\xE3o":"box camera",did\u00E1tico:"teaching","distor\xE7\xE3o baixa":"low distortion",equilibrada:"balanced","esf\xE9rica e crom\xE1tica puras":"pure spherical and chromatic aberration","esf\xE9rica intencional":"intentional spherical","filtro apodizador":"apodization filter","flare azul":"blue flare","flare azul cl\xE1ssico":"classic blue flare","flare caracter\xEDstico":"signature flare","flare e estrelas":"flare and sunstars","flare quente":"warm flare","flare \xE2mbar":"amber flare","foco com shift":"focus shift","glow em f/1.4":"glow at f/1.4","grande-angular luminosa":"fast wide-angle","hept\xE1gono fechado":"heptagon when stopped down",hex\u00E1gono:"hexagon",hist\u00F3rico:"historic","macro sonda":"probe macro","macro suave":"soft macro",microcontraste:"micro-contrast",moderna:"modern","m\xE9dio formato":"medium format","m\xE9dio formato luminoso":"fast medium format",neutra:"neutral","nitidez cl\xE1ssica":"classic sharpness",n\u00EDtida:"sharp","olho de \xE1guia":"eagle's eye",oval:"oval","oval 2\xD7":"2\xD7 oval","oval moderno":"modern oval",panqueca:"pancake","pele suave":"soft skin",pent\u00E1gono:"pentagon","ponto doce":"sweet spot","pontos de luz":"point lights","primeira retrofocus":"first retrofocus",quente:"warm","rangefinder vintage":"vintage rangefinder","refer\xEAncia documentada":"documented reference",retrato:"portrait","retrato APS-C":"APS-C portrait","retrato acess\xEDvel":"affordable portrait","retrato cl\xE1ssico":"classic portrait","retrato de est\xFAdio s\xE9c. XIX":"19th-century studio portrait","retrato moderno":"modern portrait","retrato vintage":"vintage portrait","sem breathing":"no breathing","sem distor\xE7\xE3o":"no distortion","sem onion-ring":"no onion rings","swirl acentuado":"pronounced swirl","swirl criativo":"creative swirl","swirl e anel":"swirl and ring","swirl extremo":"extreme swirl","swirl forte":"strong swirl","swirl leve":"subtle swirl","s\xE9c. XIX":"19th century","tele cl\xE1ssica":"classic telephoto","tele leve":"light telephoto","tele luminosa":"fast telephoto",t\u00F3rio:"thorium",veludo:"velvet","vintage cine":"vintage cine","zoom anam\xF3rfico":"anamorphic zoom","zoom de cinema":"cinema zoom"},zh:{"Cooke look":"Cooke \u98CE\u683C","Cooke look moderno":"\u73B0\u4EE3 Cooke \u98CE\u683C","Heliar cl\xE1ssica":"\u7ECF\u5178 Heliar",Rolleiflex:"\u7984\u6765",Waterhouse:"\u6C83\u7279\u8C6A\u65AF\u5149\u5708","abertura extrema":"\u6781\u5927\u5149\u5708","adaptador 2\xD7":"2\xD7 \u8F6C\u63A5\u955C","alem\xE3 vintage":"\u5FB7\u7CFB\u8001\u955C","anam\xF3rfica acess\xEDvel":"\u5E73\u4EF7\u53D8\u5F62\u955C","anam\xF3rfica moderna":"\u73B0\u4EE3\u53D8\u5F62\u955C",apocrom\u00E1tica:"\u590D\u6D88\u8272\u5DEE","apodiza\xE7\xE3o moderna":"\u73B0\u4EE3\u5207\u8DBE",asf\u00E9rica:"\u975E\u7403\u9762",a\u00E9rea:"\u822A\u7A7A\u955C\u5934","bokeh bolha de sab\xE3o":"\u80A5\u7682\u6CE1\u7126\u5916","bokeh cremoso":"\u5976\u6CB9\u7126\u5916","bokeh limpo":"\u5E72\u51C0\u7126\u5916","bokeh master":"\u7126\u5916\u5927\u5E08","bokeh perfeito":"\u5B8C\u7F8E\u7126\u5916","bokeh redondo":"\u5706\u5F62\u7126\u5916","bokeh suave":"\u67D4\u548C\u7126\u5916","borda borrada":"\u8FB9\u7F18\u6A21\u7CCA","campo curvo":"\u573A\u66F2","campo raso extremo":"\u6781\u6D45\u666F\u6DF1","cat-eye":"\u732B\u773C","cat-eye forte":"\u5F3A\u70C8\u732B\u773C","centro n\xEDtido":"\u4E2D\u5FC3\u9510\u5229","cine 16 mm":"16 mm \u7535\u5F71",cl\u00EDnica:"\u6781\u81F4\u9510\u5229","coating T*":"T* \u9540\u819C","coma no campo":"\u8FB9\u7F18\u5F57\u5DEE",compacta:"\u5C0F\u5DE7","compacta 1.5\xD7":"\u5C0F\u5DE7 1.5\xD7","compacta luminosa":"\u5C0F\u5DE7\u5927\u5149\u5708","compacta sovi\xE9tica":"\u82CF\u8054\u5C0F\u5DE7\u955C",compress\u00E3o:"\u7A7A\u95F4\u538B\u7F29","compress\xE3o suave":"\u67D4\u548C\u538B\u7F29",contraste:"\u9AD8\u53CD\u5DEE","contraste alto":"\u9AD8\u5BF9\u6BD4","contraste baixo":"\u4F4E\u5BF9\u6BD4","contraste suave":"\u67D4\u548C\u5BF9\u6BD4","cor quente":"\u6696\u8272\u8C03","corre\xE7\xE3o extrema":"\u6781\u81F4\u6821\u6B63",corrigida:"\u6821\u6B63\u826F\u597D","c\xE2mera de caix\xE3o":"\u7BB1\u5F0F\u76F8\u673A",did\u00E1tico:"\u6559\u5B66","distor\xE7\xE3o baixa":"\u4F4E\u7578\u53D8","dream lens":"\u68A6\u5E7B\u955C",equilibrada:"\u5747\u8861","esf\xE9rica e crom\xE1tica puras":"\u7EAF\u7403\u5DEE\u4E0E\u8272\u5DEE","esf\xE9rica intencional":"\u523B\u610F\u7403\u5DEE","filtro apodizador":"\u5207\u8DBE\u6EE4\u955C","flare azul":"\u84DD\u8272\u7729\u5149","flare azul cl\xE1ssico":"\u7ECF\u5178\u84DD\u8272\u7729\u5149","flare caracter\xEDstico":"\u6807\u5FD7\u6027\u7729\u5149","flare e estrelas":"\u7729\u5149\u4E0E\u661F\u8292","flare quente":"\u6696\u8272\u7729\u5149","flare \xE2mbar":"\u7425\u73C0\u8272\u7729\u5149","foco com shift":"\u7126\u70B9\u504F\u79FB","focus shift":"\u7126\u70B9\u504F\u79FB",glow:"\u67D4\u5149","glow em f/1.4":"f/1.4 \u67D4\u5149","grande-angular luminosa":"\u5927\u5149\u5708\u5E7F\u89D2",halo:"\u5149\u6655","hept\xE1gono fechado":"\u6536\u5149\u5708\u5448\u4E03\u8FB9\u5F62",hex\u00E1gono:"\u516D\u8FB9\u5F62",hist\u00F3rico:"\u5386\u53F2\u540D\u955C","macro sonda":"\u63A2\u9488\u5FAE\u8DDD","macro suave":"\u67D4\u548C\u5FAE\u8DDD",microcontraste:"\u5FAE\u53CD\u5DEE",moderna:"\u73B0\u4EE3","m\xE9dio formato":"\u4E2D\u753B\u5E45","m\xE9dio formato luminoso":"\u5927\u5149\u5708\u4E2D\u753B\u5E45",neutra:"\u4E2D\u6027","nitidez cl\xE1ssica":"\u7ECF\u5178\u9510\u5EA6",n\u00EDtida:"\u9510\u5229","olho de \xE1guia":"\u9E70\u773C",oval:"\u692D\u5706","oval 2\xD7":"2\xD7 \u692D\u5706","oval moderno":"\u73B0\u4EE3\u692D\u5706",panqueca:"\u997C\u5E72\u955C","pele suave":"\u67D4\u548C\u80A4\u8272",pent\u00E1gono:"\u4E94\u8FB9\u5F62","ponto doce":"\u751C\u70B9","pontos de luz":"\u70B9\u5149\u6E90","primeira retrofocus":"\u9996\u6B3E\u53CD\u8FDC\u6444",quente:"\u6696\u8C03","rangefinder vintage":"\u65C1\u8F74\u8001\u955C","refer\xEAncia documentada":"\u6709\u6587\u732E\u4F9D\u636E",retrato:"\u4EBA\u50CF","retrato APS-C":"APS-C \u4EBA\u50CF","retrato acess\xEDvel":"\u5E73\u4EF7\u4EBA\u50CF","retrato cl\xE1ssico":"\u7ECF\u5178\u4EBA\u50CF","retrato de est\xFAdio s\xE9c. XIX":"19 \u4E16\u7EAA\u5F71\u68DA\u4EBA\u50CF","retrato moderno":"\u73B0\u4EE3\u4EBA\u50CF","retrato vintage":"\u590D\u53E4\u4EBA\u50CF","sem breathing":"\u65E0\u547C\u5438\u6548\u5E94","sem distor\xE7\xE3o":"\u65E0\u7578\u53D8","sem onion-ring":"\u65E0\u6D0B\u8471\u5708",swirl:"\u65CB\u7126","swirl acentuado":"\u660E\u663E\u65CB\u7126","swirl criativo":"\u521B\u610F\u65CB\u7126","swirl e anel":"\u65CB\u7126\u4E0E\u5149\u73AF","swirl extremo":"\u6781\u81F4\u65CB\u7126","swirl forte":"\u5F3A\u70C8\u65CB\u7126","swirl leve":"\u8F7B\u5FAE\u65CB\u7126","s\xE9c. XIX":"19 \u4E16\u7EAA","tele cl\xE1ssica":"\u7ECF\u5178\u957F\u7126","tele leve":"\u8F7B\u4FBF\u957F\u7126","tele luminosa":"\u5927\u5149\u5708\u957F\u7126",t\u00F3rio:"\u948D\u73BB\u7483",veludo:"\u4E1D\u7ED2",vintage:"\u590D\u53E4","vintage EBC":"\u590D\u53E4 EBC \u9540\u819C","vintage cine":"\u590D\u53E4\u7535\u5F71\u955C","zoom anam\xF3rfico":"\u53D8\u5F62\u53D8\u7126","zoom de cinema":"\u7535\u5F71\u53D8\u7126"}};function nl(n){if(Ln==="pt")return n;let t=n[0];for(let[s,r]of Object.entries(yd[Ln]))t=t.replace(s,r);let e=xd[Ln][n[3]]||n[3],i=n[5].split(", ").map(s=>Md[Ln][s]||s).join(Ln==="zh"?"\uFF0C":", ");return[t,n[1],n[2],e,n[4],i]}var wt=n=>document.getElementById(n),Qe=720,mn=480,Uo=Qe/36,ll=[[1,.66,.32],[1,.84,.6],[.5,.85,1],[1,.5,.62]],hl=[[.5,1,.82],[.55,.8,1]],D={key:"dgauss",lens:null,base:null,info:null,zS:0,e:0,fstop:2,focus:800,bg:6e3,near:380,field:14,blades:7,round:.25,disp:1,src:"focus",sel:0},Xt=null,In=1,Be,hn,Gs,ul,Co=0,Mi="hi",Sd=null,os=(n,t,e)=>n+(t-n)*e,Po=(n,t,e)=>Math.exp(os(Math.log(t),Math.log(e),n)),Lo=(n,t,e)=>(Math.log(n)-Math.log(t))/(Math.log(e)-Math.log(t)),No=n=>!isFinite(n)||n>=5e8?"\u221E":n>=1e4?(n/1e3).toFixed(0)+" m":ln(n/1e3,2)+" m";function Ws(n){let t=D.info.stop;return t?Math.min(t.sd,D.info.efl/(2*n)*Math.abs(D.info.yStop)):1/0}function dl(){return{shift:-D.e,zSensor:D.zS,stopR:Ws(D.fstop),blades:D.blades,bladeRot:.3,round:D.round,disp:D.disp}}function fl(n){var t;D.key=n,D.base=xi(n),D.lens=To(D.base),D.info=jn(D.lens),D.zS=D.lens.S[D.lens.S.length-1].z+D.info.bfdInf,D.blades=D.base.blades,D.fstop=Math.max(D.info.fMin,D.fstop),D.sel=0,D.e=(t=ti(D.lens,D.zS,D.focus))!=null?t:0,Xt=null,wt("lens-note").textContent=Ro(n,ss[n]).note,as(),qs(),Dn(),gn(!0)}function bd(n){let t=(n.value-n.min)/(n.max-n.min)*100;n.style.setProperty("--p",t+"%")}function as(){let n=D.info.fMin;wt("c-fstop").value=Lo(D.fstop,n,22),wt("o-fstop").textContent="f/"+D.fstop.toFixed(1),wt("c-focus").value=Lo(D.focus,300,5e4),wt("o-focus").textContent=No(D.focus),wt("c-bg").value=Lo(D.bg,1500,1e5),wt("o-bg").textContent=No(D.bg),wt("c-field").value=D.field,wt("o-field").textContent=D.field.toFixed(1)+" mm",wt("c-blades").value=D.blades,wt("o-blades").textContent=D.blades<3?ce("circular"):D.blades,wt("c-round").value=D.round,wt("o-round").textContent=Math.round(D.round*100)+"%",wt("c-disp").value=D.disp,wt("o-disp").textContent=D.disp.toFixed(1)+"\xD7",document.querySelectorAll(".controls input[type=range]").forEach(bd)}function Ed(){let n=(e,i)=>wt(e).addEventListener("input",s=>{i(+s.target.value),as(),Mi="lo",gn(),wd()});n("c-fstop",e=>{D.fstop=Po(e,D.info.fMin,22)}),n("c-focus",e=>{D.focus=Po(e,300,5e4);let i=ti(D.lens,D.zS,D.focus);i!=null&&(D.e=i)}),n("c-bg",e=>{D.bg=Po(e,1500,1e5)}),n("c-field",e=>{D.field=e}),n("c-blades",e=>{D.blades=e}),n("c-round",e=>{D.round=e}),n("c-disp",e=>{D.disp=e}),wt("c-src").addEventListener("click",e=>{let i=e.target.closest("button");i&&(D.src=i.dataset.v,wt("c-src").querySelectorAll("button").forEach(s=>s.classList.toggle("on",s===i)),cs())});let t=wt("lab-presets");for(let e of Object.keys(ss)){let i=document.createElement("button");i.textContent=Ro(e,ss[e]).name,i.dataset.k=e,i.onclick=()=>{t.querySelectorAll("button").forEach(s=>s.classList.toggle("on",s===i)),fl(e)},e===D.key&&i.classList.add("on"),t.appendChild(i)}wt("e-surf").addEventListener("change",e=>{D.sel=+e.target.value,Dn(),cs()});for(let e of["e-R","e-t","e-d","e-n","e-V"])wt(e).addEventListener("change",Td);wt("e-autofocus").onclick=()=>{let e=ti(D.lens,D.zS,D.focus);e!=null&&Math.abs(e)<60&&(D.e=e),gn(!0)},wt("e-reset").onclick=()=>{var e;D.lens=To(D.base),Xs(),D.e=(e=ti(D.lens,D.zS,D.focus))!=null?e:0,qs(),Dn(),gn(!0)}}var il=0;function wd(){clearTimeout(il),il=setTimeout(()=>{Mi="hi",gn()},180)}function qs(){let n=wt("e-surf");n.innerHTML="",D.lens.S.forEach((t,e)=>{let i=document.createElement("option");i.value=e,i.textContent=t.stop?`${e+1} \xB7 ${ce("stop")}`:`${e+1} \xB7 R ${t.R?t.R.toFixed(2):"\u221E"} mm`,n.appendChild(i)}),n.value=D.sel}function Dn(){let n=D.lens.S,t=n[D.sel],e=n[D.sel+1];wt("e-R").value=t.stop?"":+t.R.toFixed(4),wt("e-R").disabled=t.stop,wt("e-t").value=e?+(e.z-t.z).toFixed(4):"",wt("e-t").disabled=!e,wt("e-d").value=+(t.sd*2).toFixed(3),wt("e-n").value=t.stop?"":t.n,wt("e-n").disabled=t.stop,wt("e-V").value=t.n>1?t.V:"",wt("e-V").disabled=t.stop||t.n<=1,wt("e-surf").value=D.sel}function Td(){let n=D.lens.S,t=D.sel,e=n[t],i=D.lens.S.map(a=>({...a}));if(!e.stop){let a=parseFloat(wt("e-R").value);isFinite(a)&&(e.R=Math.abs(a)<.001?0:a);let o=parseFloat(wt("e-n").value);isFinite(o)&&o>=1&&o<2.5&&(e.n=o);let c=parseFloat(wt("e-V").value);isFinite(c)&&c>5&&(e.V=c),e.n>1&&!e.V&&(e.V=50)}let s=parseFloat(wt("e-d").value);isFinite(s)&&s>1&&(e.sd=s/2);let r=parseFloat(wt("e-t").value);if(isFinite(r)&&n[t+1]){let a=r-(n[t+1].z-e.z);for(let o=t+1;o<n.length;o++)n[o].z+=a}Oo(D.lens)||(D.lens.S=i,Ad(ce("invalid"))),Xs(),qs(),Dn(),gn(!0)}function Xs(){var t;let n=(t=D.info)==null?void 0:t.stop;D.info=jn(D.lens),D.fstop<D.info.fMin&&(D.fstop=D.info.fMin),as()}var sl=0;function Ad(n){wt("xsec-msg").textContent=n,clearTimeout(sl),sl=setTimeout(()=>ml(),2200)}function Xe(n,t){if(!n.R)return 0;let e=n.R,i=e*e-t*t;return i<0?NaN:e-Math.sign(e)*Math.sqrt(i)}function Oo(n){let t=n.S;for(let i=0;i<t.length-1;i++){let s=t[i],r=t[i+1],a=Math.min(s.sd,r.sd);if(s.R&&Math.abs(s.R)<s.sd*1.01)return!1;let o=!s.stop&&s.n>1;for(let c of[0,.5,.85,1]){let l=a*c,h=s.z+(s.stop?0:Xe(s,l)),u=r.z+(r.stop?0:Xe(r,l));if(!isFinite(h)||!isFinite(u)||u-h<(o?.25:.02))return!1}}let e=t[t.length-1];return!(e.R&&Math.abs(e.R)<e.sd*1.01)}function pl(n){let t=n.S,e=[],i=0;for(;i<t.length;){if(t[i].stop){e.push({a:i,b:i,stop:!0}),i++;continue}if(t[i].n>1){let s=i;for(;s<t.length-1&&t[s].n>1;)s++;e.push({a:i,b:s}),i=s+1}else i++}return e}function Rd(){let n=D.lens.S,t=Math.max(...n.map(c=>c.sd))*1.35,e=-D.e-14,i=D.zS+8,s=Be.width/In,r=Be.height/In,a=r-70,o=Math.min((s-30)/(i-e),a/(2*t));Xt={k:o,ox:15-e*o+(s-30-(i-e)*o)/2,oy:18+a/2,z0:e,z1:i,ymax:t,W:s,H:r}}var ee=n=>Xt.ox+n*Xt.k,ie=n=>Xt.oy-n*Xt.k;function Io(n,t,e){let i=[],s=e!=null?e:n.sd;for(let r=0;r<=32;r++){let a=-s+2*s*r/32;i.push([n.z+t+Xe(n,a),a])}return i}var Cd=null;function Pd(){let n=D.lens.S,t=dl(),e=new Float64Array(2),i=[],s=D.src==="focus"?D.focus:D.src==="bg"?D.bg:1e9,r=D.zS-s,a=-D.e,o=Xt.z1;for(let[c,l]of[[0,"mint"],[D.field,"amber"]]){let h=c/D.info.efl,u=(s-D.zS)*h,d=n[0].sd*1.15,p=[];for(let x=0;x<=240;x++){let v=-d+2*d*x/240,M=v-u,R=a-r,A=Math.hypot(M,R);M/=A,R/=A,Qn(D.lens,t,0,u,r,0,M,R,1,e)&&p.push(v)}if(!p.length){i.push({color:l,paths:[]});continue}let g=p[0],_=p[p.length-1],f=13,m=[];for(let x=0;x<f;x++){let M=os(g,_,(x+.5)/f)-u,R=a-r,A=Math.hypot(M,R);M/=A,R/=A;let T=[];if(Qn(D.lens,t,0,u,r,0,M,R,1,e,T,o)){if(T[0]<Xt.z0){let k=(Xt.z0-T[0])/(T[2]-T[0]);T[0]=Xt.z0,T[1]=T[1]+k*(T[3]-T[1])}m.push(T)}}i.push({color:l,paths:m})}return Cd=i,i}function cs(){Xt||Rd();let n=hn,t=Xt.W,e=Xt.H;n.setTransform(In,0,0,In,0,0),n.clearRect(0,0,t,e),n.strokeStyle="rgba(220,255,235,.12)",n.setLineDash([3,5]),n.beginPath(),n.moveTo(0,ie(0)),n.lineTo(t,ie(0)),n.stroke(),n.setLineDash([]);let i=D.lens.S,s=-D.e,r=pl(D.lens),a=Pd();n.globalCompositeOperation="lighter";for(let g of a){n.strokeStyle=g.color==="mint"?"rgba(159,240,200,.55)":"rgba(243,167,92,.5)",n.lineWidth=1;for(let _ of g.paths){n.beginPath(),n.moveTo(ee(_[0]),ie(_[1]));for(let f=2;f<_.length;f+=2)n.lineTo(ee(_[f]),ie(_[f+1]));n.stroke()}}n.globalCompositeOperation="source-over";for(let g of r)if(!g.stop){for(let _=g.a;_<g.b;_++){let f=i[_],m=i[_+1],x=Math.min(f.sd,m.sd),v=Io(f,s,x),M=Io(m,s,x).reverse();n.beginPath(),[...v,...M].forEach(([T,k],S)=>S?n.lineTo(ee(T),ie(k)):n.moveTo(ee(T),ie(k))),n.closePath();let R=D.sel>=g.a&&D.sel<=g.b,A=Math.min(1,(f.n-1.45)/.35);n.fillStyle=`rgba(${Math.round(os(140,120,A))},${Math.round(os(230,180,A))},${Math.round(os(200,255,A))},${R?.2:.1})`,n.fill()}for(let _=g.a;_<=g.b;_++){let f=i[_],m=_===D.sel;n.strokeStyle=m?"#ffffff":"rgba(200,245,225,.75)",n.lineWidth=m?1.8:1.1;let x=Io(f,s);n.beginPath(),x.forEach(([v,M],R)=>R?n.lineTo(ee(v),ie(M)):n.moveTo(ee(v),ie(M))),n.stroke()}for(let _=g.a;_<g.b;_++){let f=i[_],m=i[_+1];for(let x of[1,-1]){let v=f.sd*x,M=m.sd*x,R=Math.min(f.sd,m.sd)*x;n.strokeStyle="rgba(200,245,225,.5)",n.lineWidth=1,n.beginPath(),n.moveTo(ee(f.z+s+Xe(f,v)),ie(v)),n.lineTo(ee(f.z+s+Xe(f,R)),ie(R)),n.lineTo(ee(m.z+s+Xe(m,R)),ie(R)),n.lineTo(ee(m.z+s+Xe(m,M)),ie(M)),n.stroke()}}}let o=D.info.stop;if(o){let g=Ws(D.fstop),_=ee(o.z+s);n.strokeStyle="#ff8a3d",n.lineWidth=2.4,n.beginPath(),n.moveTo(_,ie(g)),n.lineTo(_,ie(o.sd*1.25)),n.moveTo(_,ie(-g)),n.lineTo(_,ie(-o.sd*1.25)),n.stroke();for(let f of[g,-g])rl(_,ie(f),"#ff8a3d")}i.forEach((g,_)=>{if(g.stop)return;let f=g.z+s+Xe(g,g.sd);rl(ee(f),ie(g.sd),_===D.sel?"#ffffff":"#6fb9ff",4.5)});let c=ee(D.zS);n.strokeStyle="#ff8a3d",n.lineWidth=2,n.beginPath(),n.moveTo(c,ie(Xt.ymax*.85)),n.lineTo(c,ie(-Xt.ymax*.85)),n.stroke(),n.fillStyle="#ff8a3d",n.font="10px JetBrains Mono, monospace",n.fillText(ce("sensor"),c-18,ie(-Xt.ymax*.85)+14);let l=D.src==="focus"?D.focus:D.src==="bg"?D.bg:1e9,h=zo(l);isFinite(h)&&h>Xt.z0&&h<Xt.z1+20&&(n.strokeStyle="rgba(111,185,255,.8)",n.setLineDash([3,3]),n.beginPath(),n.moveTo(ee(h),ie(Xt.ymax*.45)),n.lineTo(ee(h),ie(-Xt.ymax*.45)),n.stroke(),n.setLineDash([]));let u=i[0].z+s,d=i[i.length-1].z+s,p=Xt.H-36;Xt.bar={x0:ee(u),x1:ee(d),y:p},n.fillStyle="rgba(159,240,200,.1)",n.strokeStyle="rgba(159,240,200,.5)",n.lineWidth=1,Fo(n,ee(u),p-11,ee(d)-ee(u),22,6),n.fill(),n.stroke(),n.fillStyle="#9ff0c8",n.font="11px Inter Tight, sans-serif",n.textAlign="center",n.fillText(ce("dragFocus"),(ee(u)+ee(d))/2,p+4),n.textAlign="left",n.fillStyle="rgba(220,255,235,.35)",n.font="10px JetBrains Mono, monospace",n.fillRect(t-80,e-12,10*Xt.k,1.5),n.fillText("10 mm",t-80,e-16),Ld(a),ml()}function zo(n){let t=D.lens.S[D.lens.S.length-1].z-D.e,e=n-D.zS-D.e,i=yi(D.lens,n>5e8?1/0:e);return t+i.bfd}function Ld(n){if(Xt.W<480)return;let t=hn,e=Math.min(190,Xt.W*.3),i=92,s=Xt.W-e-10,r=28;t.save(),t.fillStyle="rgba(5,7,6,.92)",t.strokeStyle="rgba(220,255,235,.15)",Fo(t,s,r,e,i,8),t.fill(),t.stroke(),t.beginPath(),Fo(t,s,r,e,i,8),t.clip();let a=D.zS,o=3,c=.02;for(let f of n)for(let m of f.paths){let x=m.length,v=m[x-4],M=m[x-3],R=m[x-2],A=m[x-1],T=(a-v)/(R-v),k=M+T*(A-M);(f.color==="mint"?0:null)!==null&&(c=Math.max(c,Math.abs(k)))}let l=e/(2*o),h=i*.42/Math.max(c*2.5,.05),u=f=>s+e/2+(f-a)*l,d=f=>r+i/2-f*h;t.globalCompositeOperation="lighter";let p=n[0];t.strokeStyle="rgba(159,240,200,.6)",t.lineWidth=1;for(let f of p.paths){let m=f.length,x=f[m-4],v=f[m-3],M=f[m-2],A=(f[m-1]-v)/(M-x),T=k=>v+(k-x)*A;t.beginPath(),t.moveTo(u(a-o),d(T(a-o))),t.lineTo(u(a+o),d(T(a+o))),t.stroke()}t.globalCompositeOperation="source-over",t.strokeStyle="#ff8a3d",t.lineWidth=1.5,t.beginPath(),t.moveTo(u(a),r+8),t.lineTo(u(a),r+i-8),t.stroke();let g=D.src==="focus"?D.focus:D.src==="bg"?D.bg:1e9,_=zo(g);isFinite(_)&&Math.abs(_-a)<o&&(t.strokeStyle="rgba(111,185,255,.9)",t.setLineDash([2,3]),t.beginPath(),t.moveTo(u(_),r+8),t.lineTo(u(_),r+i-8),t.stroke(),t.setLineDash([])),t.fillStyle="rgba(220,255,235,.45)",t.font="9px JetBrains Mono, monospace",t.fillText(ce("nearSensor"),s+8,r+12),t.restore()}function rl(n,t,e,i=5){hn.fillStyle=e,hn.strokeStyle="#070908",hn.lineWidth=2,hn.beginPath(),hn.arc(n,t,i,0,Math.PI*2),hn.fill(),hn.stroke()}function Fo(n,t,e,i,s,r){n.beginPath(),n.moveTo(t+r,e),n.arcTo(t+i,e,t+i,e+s,r),n.arcTo(t+i,e+s,t,e+s,r),n.arcTo(t,e+s,t,e,r),n.arcTo(t,e,t+i,e,r),n.closePath()}function ml(){let n=D.src==="focus"?D.focus:D.src==="bg"?D.bg:1e9,t=zo(n),e=t-D.zS,i="";isFinite(t)?Math.abs(e)<.02?i=ce("onSensor"):i=ce("focusMsg")(ln(Math.abs(e),2),e<0,ln(D.e,2)):i=ce("noImage"),wt("xsec-msg").textContent=i}function Id(){let n=null,t=s=>{let r=Be.getBoundingClientRect();return[(s.clientX-r.left)*(Xt.W/r.width),(s.clientY-r.top)*(Xt.H/r.height)]},e=(s,r)=>{let a=D.lens.S,o=-D.e,c=D.info.stop;if(c){let g=Ws(D.fstop),_=ee(c.z+o);for(let f of[g,-g])if(Math.hypot(s-_,r-ie(f))<11)return{type:"iris"}}for(let g=0;g<a.length;g++){let _=a[g];if(_.stop)continue;let f=ee(_.z+o+Xe(_,_.sd));if(Math.hypot(s-f,r-ie(_.sd))<10)return{type:"curv",i:g}}let l=Xt.bar;if(l&&s>l.x0-6&&s<l.x1+6&&Math.abs(r-l.y)<14)return{type:"focus"};let h=(s-Xt.ox)/Xt.k,u=(Xt.oy-r)/Xt.k;for(let g of pl(D.lens)){let _=a[g.a],f=a[g.b];if(g.stop){if(Math.abs(s-ee(_.z+o))<6&&Math.abs(u)>Ws(D.fstop)&&Math.abs(u)<_.sd*1.3)return{type:"move",el:g};continue}let m=Math.min(_.sd,f.sd);if(Math.abs(u)>m)continue;let x=_.z+o+Xe(_,u),v=f.z+o+Xe(f,u);if(h>=x-.3&&h<=v+.3)return{type:"move",el:g}}let d=null,p=8;return a.forEach((g,_)=>{if(Math.abs(u)>g.sd)return;let f=ee(g.z+o+(g.stop?0:Xe(g,u)));Math.abs(f-s)<p&&(p=Math.abs(f-s),d=_)}),d!==null?{type:"select",i:d}:null};Be.addEventListener("pointermove",s=>{let[r,a]=t(s);if(!n){let u=e(r,a);Be.style.cursor=u?u.type==="curv"||u.type==="iris"?"ns-resize":u.type==="select"?"pointer":"ew-resize":"default";return}let o=(r-n.x)/Xt.k,c=(a-n.y)/Xt.k,l=D.lens,h=l.S;if(n.type==="focus"){D.e=Math.max(-6,Math.min(40,n.e0-o));let u=tl(l,D.zS,D.e);isNaN(u)&&(u=300),D.focus=Math.max(300,Math.min(1e9,u)),as()}else if(n.type==="move"){let u=h.map(d=>d.z);for(let d=n.el.a;d<=n.el.b;d++)h[d].z=n.z0[d-n.el.a]+o;Oo(l)||h.forEach((d,p)=>d.z=u[p]),Xs()}else if(n.type==="curv"){let u=h[n.i],d=u.R,p=n.c0-c*.0035,g=1/(u.sd*1.03);p=Math.max(-g,Math.min(g,p)),u.R=Math.abs(p)<.0015?0:1/p,Oo(l)||(u.R=d),Xs()}else if(n.type==="iris"){let u=D.info.stop,d=Math.max(.3,Math.min(u.sd,Math.abs((Xt.oy-a)/Xt.k)));D.fstop=Math.max(D.info.fMin,D.info.efl*Math.abs(D.info.yStop)/(2*d)),as()}Mi="lo",gn()}),Be.addEventListener("pointerdown",s=>{let[r,a]=t(s),o=e(r,a);if(!o)return;Be.setPointerCapture(s.pointerId);let c=D.lens.S;if(o.type==="select"){D.sel=o.i,Dn(),cs();return}o.type==="curv"&&(D.sel=o.i,Dn()),o.type==="move"&&(D.sel=o.el.a,Dn()),n={...o,x:r,y:a,e0:D.e},o.type==="move"&&(n.z0=c.slice(o.el.a,o.el.b+1).map(l=>l.z)),o.type==="curv"&&(n.c0=c[o.i].R?1/c[o.i].R:0),cs()});let i=()=>{n&&(n=null,qs(),Dn(),Mi="hi",gn())};Be.addEventListener("pointerup",i),Be.addEventListener("pointercancel",i)}var Bo=[],gl=[];(function(){let t=Pn(21);for(let e=0;e<30;e++){let i=(t()-.5)*34,s=(t()-.5)*22;Bo.push({x:i,y:s,col:Math.floor(t()*ll.length),I:.6+t()*.8})}Bo.push({x:16.5,y:10.5,col:2,I:1.2},{x:-16.5,y:-10.5,col:0,I:1.2},{x:16.8,y:-10,col:1,I:1},{x:-16.6,y:10.3,col:3,I:1});for(let e=0;e<7;e++){let i=t()*Math.PI*2,s=4+t()*12;gl.push({x:Math.cos(i)*s*1.3,y:Math.sin(i)*s*.8,col:Math.floor(t()*hl.length),I:.7+t()*.5})}})();var Dd=[0,5,9,13,16.5,19.8];function ol(n,t,e){let i=[],s=0;for(let r of Dd){let a=rs(D.lens,e,D.info,n,r,t);r===0&&(s=Math.max(1e-9,a.w*a.count)),i.push({r,sp:a,K:a.count?ks(a,Uo,240):null,e:a.w*a.count/s,e0:a.w/s})}return i}function al(n,t,e,i){let s=new Map;for(let r of t){let a=Math.hypot(r.x,r.y),o=0;for(let _=1;_<e.length;_++)Math.abs(e[_].r-a)<Math.abs(e[o].r-a)&&(o=_);let c=e[o];if(!c.K)continue;let l=o+":"+r.col,h=s.get(l);h||(h=Hs(c.K,i[r.col],c.e0*255*420),s.set(l,h));let u=Qe/2+r.x*Uo,d=mn/2-r.y*Uo,p=Math.atan2(-r.y,r.x),g=c.K.upscale;n.save(),n.translate(u,d),n.rotate(a<.5?0:p-Math.PI/2),n.globalAlpha=Math.min(1,r.I),n.drawImage(h,-c.K.half*g,-c.K.half*g,c.K.size*g,c.K.size*g),n.restore()}}function Do(n,t,e){let i=n.getContext("2d"),s=n.width;if(i.fillStyle="#000",i.fillRect(0,0,s,s),!t||!t.K){i.fillStyle="#5d6a63",i.font="11px JetBrains Mono",i.fillText(ce("noLight"),10,20);return}let r=t.K,a=0;for(let d=0;d<3;d++)for(let p of r.A[d])p>a&&(a=p);let o=document.createElement("canvas");o.width=o.height=r.size;let c=o.getContext("2d"),l=c.createImageData(r.size,r.size);for(let d=0,p=0;d<r.A[0].length;d++,p+=4)l.data[p]=255*Math.pow(r.A[0][d]/a,.6),l.data[p+1]=255*Math.pow(r.A[1][d]/a,.6),l.data[p+2]=255*Math.pow(r.A[2][d]/a,.6),l.data[p+3]=255;c.putImageData(l,0,0),i.imageSmoothingEnabled=!0;let h=s*.08;i.drawImage(o,h,h,s-2*h,s-2*h);let u=r.size/r.scale;i.fillStyle="rgba(255,255,255,.55)",i.font=`${Math.round(s/16)}px JetBrains Mono, monospace`,i.fillText(`${ln(u,2)} mm`,8,s-8)}function Ud(n,t){let e=n.getContext("2d"),i=n.width;if(e.fillStyle="#000",e.fillRect(0,0,i,i),!t||!t.count)return 0;let s=0,r=0,a=0,o=t.hits[1];for(let u=0;u<o.length;u+=2){let d=Math.hypot(o[u]-t.cx,o[u+1]-t.cy);s=Math.max(s,d),r+=d*d,a++}r=Math.sqrt(r/a);for(let u=0;u<3;u++){let d=t.hits[u];for(let p=0;p<d.length;p+=2)s=Math.max(s,Math.abs(d[p]-t.cx),Math.abs(d[p+1]-t.cy))}let c=i*.42/Math.max(s,.004),l=["rgba(255,90,90,.5)","rgba(120,255,170,.5)","rgba(110,160,255,.5)"];e.globalCompositeOperation="lighter";for(let u=0;u<3;u++){e.fillStyle=l[u];let d=t.hits[u],p=Math.max(2,Math.floor(d.length/1600)*2);for(let g=0;g<d.length;g+=p)e.fillRect(i/2+(d[g]-t.cx)*c,i/2-(d[g+1]-t.cy)*c,1.3,1.3)}e.globalCompositeOperation="source-over";let h=s>.15?100:s>.03?20:5;return e.fillStyle="rgba(255,255,255,.6)",e.fillRect(8,i-10,h/1e3*c,2),e.font=`${Math.round(i/16)}px JetBrains Mono, monospace`,e.fillText(`${h} \xB5m`,8,i-14),r}function Nd(){let n=Mi==="hi"?2400:700,t=dl(),e=ol(D.bg,n,t),i=ol(D.near,Math.round(n*.7),t),s=ul;s.globalCompositeOperation="source-over";let r=s.createRadialGradient(Qe/2,mn/2,40,Qe/2,mn/2,Qe*.7);r.addColorStop(0,"#0d1018"),r.addColorStop(1,"#030405"),s.fillStyle=r,s.fillRect(0,0,Qe,mn),s.globalCompositeOperation="lighter",al(s,Bo,e,ll),al(s,gl,i,hl),s.globalCompositeOperation="source-over",s.strokeStyle="rgba(255,255,255,.18)",s.lineWidth=1,s.beginPath(),s.moveTo(Qe/2-10,mn/2),s.lineTo(Qe/2+10,mn/2),s.moveTo(Qe/2,mn/2-10),s.lineTo(Qe/2,mn/2+10),s.stroke(),Do(wt("psf-c"),e[0]),Do(wt("psf-e"),e[e.length-1]),Do(wt("psf-f"),i[0]);let a=rs(D.lens,t,D.info,D.focus,0,Mi==="hi"?2400:900);Sd=a;let o=Ud(wt("spot"),a);wt("st-rms").textContent=o?ln(o*1e3,1)+" \xB5m":"\u2014";let c=e[e.length-1].e;wt("st-vig").textContent=Math.round(Math.min(1,c)*100)+"%"}function gn(n){Co&&!n||(Co=requestAnimationFrame(()=>{Co=0;let t=D.info.efl;wt("st-efl").textContent=ln(t,1)+" mm",wt("st-f").textContent="f/"+D.fstop.toFixed(1),wt("st-focus").textContent=No(D.focus),cs(),Nd()}))}function cl(){In=Math.min(2,window.devicePixelRatio||1);let n=Be.getBoundingClientRect();Be.width=Math.round(n.width*In),Be.height=Math.round(n.height*In),Xt=null;for(let t of["psf-c","psf-e","psf-f","spot"]){let e=wt(t),i=Math.round(e.getBoundingClientRect().width*In)||160;e.width=e.height=i}gn(!0)}function _l(){Be=wt("xsec"),hn=Be.getContext("2d"),Gs=wt("scene"),Gs.width=Qe,Gs.height=mn,ul=Gs.getContext("2d"),Ed(),Id(),fl("dgauss"),cl();let n=0;return window.addEventListener("resize",()=>{clearTimeout(n),n=setTimeout(cl,120)}),D}Vs();function xl(n,t){let e=!1,i=s=>{let r=n.getBoundingClientRect(),a=Math.min(100,Math.max(0,(s-r.left)/r.width*100));n.style.setProperty("--x",a+"%"),n._x=a,t&&t(a)};if(n.addEventListener("pointerdown",s=>{e=!0,n.setPointerCapture(s.pointerId),i(s.clientX)}),n.addEventListener("pointermove",s=>{e&&i(s.clientX)}),n.addEventListener("pointerup",()=>{e=!1}),n.addEventListener("pointercancel",()=>{e=!1}),n._setX=s=>{n.style.setProperty("--x",s+"%"),n._x=s,t&&t(s)},n._setX(50),!n.querySelector(".wipe-handle")){let s=document.createElement("div");s.className="wipe-handle",s.innerHTML="<span>\u2194</span>",n.appendChild(s)}}function yl(){document.querySelectorAll(".wipe.img").forEach(n=>{let t=n.dataset.src,e=+n.dataset.tiles,i=+n.dataset.a,s=+n.dataset.b,r=+(n.dataset.crop||0),a=new Image;a.onload=()=>{let o=a.naturalWidth/e,c=a.naturalHeight;n.style.aspectRatio=`${o} / ${c}`;for(let[l,h]of[["a",i],["b",s]]){let u=document.createElement("div");u.className="layer "+l,u.style.backgroundImage=`url(${t})`,u.style.backgroundSize=`${e*100}% 100%`,u.style.backgroundPosition=`${e>1?h/(e-1)*100:0}% 0`,n.prepend(u)}n.appendChild(n.querySelector(".layer.b")),n.appendChild(n.querySelector(".wipe-handle"))},a.src=t,xl(n)})}var _e=1280,ve=720,Od=36,Vo=_e/Od,Go={amber:[1,.62,.28],warm:[1,.82,.55],cyan:[.45,.85,1],teal:[.45,1,.8],rose:[1,.45,.6]};function Fd(){let n=Pn(7),t=[],e=Object.keys(Go);for(let i=0;i<3;i++){let s=ve*(.18+n()*.5),r=40+n()*90,a=n()*6,o=e[Math.floor(n()*e.length)],c=i%2;for(let l=0;l<13;l++){let h=l/12*_e*1.05-20+n()*20;t.push({x:h,y:s+Math.sin(h/220+a)*r+n()*10,layer:c,col:o,I:.35+n()*.55})}}for(let i=0;i<24;i++)t.push({x:n()*_e,y:n()*ve*.95,layer:n()<.5?0:1,col:e[Math.floor(n()*e.length)],I:.35+n()*n()*1.6});return t.push({x:_e*.38,y:ve*.3,layer:0,col:"warm",I:2.6,hero:"hdr"}),t.push({x:_e*.95,y:ve*.08,layer:0,col:"cyan",I:1.8,hero:"cat"}),t.push({x:_e*.07,y:ve*.86,layer:1,col:"amber",I:1.8,hero:"cat2"}),t.push({x:_e*.66,y:ve*.56,layer:0,col:"teal",I:1.6,hero:"blade"}),t}function ko(n,t){let e=n.createLinearGradient(0,0,0,ve);e.addColorStop(0,"#0b1020"),e.addColorStop(.55,"#141026"),e.addColorStop(1,"#1d0f17"),n.fillStyle=e,n.fillRect(0,0,_e,ve),n.save(),t&&(n.filter=`blur(${t}px)`);let i=Pn(3);for(let s=0;s<12;s++){let r=i()*_e,a=i()*ve,o=120+i()*260,c=n.createRadialGradient(r,a,0,r,a,o),l=s%3===0?"60,120,170":s%3===1?"170,90,50":"90,60,140";c.addColorStop(0,`rgba(${l},.28)`),c.addColorStop(1,`rgba(${l},0)`),n.fillStyle=c,n.fillRect(0,0,_e,ve)}n.fillStyle="rgba(4,6,10,.75)";for(let s=0;s<9;s++){let r=i()*_e,a=60+i()*160,o=120+i()*280;n.fillRect(r,ve-o,a,o)}n.restore()}function vl(n,t){n.save(),n.globalCompositeOperation="lighter";for(let e of t){let i=Go[e.col],s=r=>Math.min(255,Math.round(255*i[r]*Math.min(1,e.I*1.4)));n.fillStyle=`rgb(${s(0)},${s(1)},${s(2)})`,n.beginPath(),n.arc(e.x,e.y,2.6,0,Math.PI*2),n.fill(),n.fillStyle=`rgba(${s(0)},${s(1)},${s(2)},.25)`,n.beginPath(),n.arc(e.x,e.y,5,0,Math.PI*2),n.fill()}n.restore()}function Ho(n){let t=Pn(11);n.save(),n.lineCap="round";let e=[];for(let i=0;i<=60;i++){let s=i/60;e.push([_e*(1.02-s*.62),ve*(.98-s*.38)+Math.sin(s*5)*30])}n.strokeStyle="#0a0806";for(let i=0;i<e.length-1;i++)n.lineWidth=16*(1-i/e.length)+3,n.beginPath(),n.moveTo(...e[i]),n.lineTo(...e[i+1]),n.stroke();n.strokeStyle="rgba(255,190,130,.35)",n.lineWidth=1.4,n.beginPath(),e.forEach((i,s)=>s?n.lineTo(i[0],i[1]-7*(1-s/60)):n.moveTo(i[0],i[1]-7)),n.stroke();for(let i=4;i<e.length;i+=3)for(let s of[-1,1]){let[r,a]=e[i],o=30+t()*34,c=-Math.PI/2+s*(.6+t()*.7)+(t()-.5)*.4;n.save(),n.translate(r,a),n.rotate(c);let l=n.createLinearGradient(0,-6,0,6);l.addColorStop(0,"#1d3a2a"),l.addColorStop(1,"#07120c"),n.fillStyle=l,n.beginPath(),n.moveTo(0,0),n.quadraticCurveTo(o*.5,-o*.32,o,0),n.quadraticCurveTo(o*.5,o*.32,0,0),n.fill(),n.strokeStyle="rgba(159,240,200,.35)",n.lineWidth=1,n.beginPath(),n.moveTo(0,0),n.quadraticCurveTo(o*.5,-o*.32,o,0),n.stroke(),n.restore()}n.globalCompositeOperation="lighter";for(let i=6;i<e.length;i+=7){let[s,r]=e[i],a=n.createRadialGradient(s,r-10,0,s,r-10,9);a.addColorStop(0,"rgba(255,240,210,1)"),a.addColorStop(.3,"rgba(255,190,120,.6)"),a.addColorStop(1,"rgba(255,160,80,0)"),n.fillStyle=a,n.beginPath(),n.arc(s,r-10,9,0,Math.PI*2),n.fill()}return n.restore(),e}function Bd(n){let t=xi("dgauss"),e=jn(t),i=t.S[t.S.length-1].z+e.bfdInf,r=ti(t,i,550),a=2.4,o=e.efl/(2*a)*Math.abs(e.yStop),c={shift:-r,zSensor:i,stopR:o,blades:7,bladeRot:.2,round:.35,disp:2.2},l=[5e3,15e3],h=[0,4,8,12,15,18,21],u=[];for(let d of l){let p=[],g=0;for(let _ of h){let f=rs(t,c,e,d,_,n);_===0&&(g=f.w*f.count);let m=ks(f,Vo,300);p.push({r:_,K:m,sp:f,e0:f.w/g})}u.push(p)}return{out:u,radii:h,fstop:a}}function zd(n,t,e){let i=new Map;n.save(),n.globalCompositeOperation="lighter";for(let s of t){let r=(s.x-_e/2)/Vo,a=(s.y-ve/2)/Vo,o=Math.hypot(r,a),c=e.out[s.layer],l=0;for(let f=1;f<c.length;f++)Math.abs(c[f].r-o)<Math.abs(c[l].r-o)&&(l=f);let h=s.layer+":"+l+":"+s.col,u=i.get(h);if(!u){let f=c[l];u=Hs(f.K,Go[s.col],f.e0*255*1700,null),u._k=f,i.set(h,u)}let d=Math.atan2(a,r),p=u._k,g=p.K.upscale,_=s.I;for(n.save(),n.translate(s.x,s.y),n.rotate(o<.5?0:d-Math.PI/2);_>.001;)n.globalAlpha=Math.min(1,_),n.drawImage(u,-p.K.half*g,-p.K.half*g,p.K.size*g,p.K.size*g),_-=1;n.restore()}n.restore()}function Ml(){let n=document.getElementById("wipe-main"),t=document.getElementById("wipe-left"),e=document.getElementById("wipe-right"),i=document.getElementById("wipe-tag-left"),s=document.getElementById("pins");for(let d of[t,e])d.width=_e,d.height=ve;let r=Fd(),a=[];xl(n,d=>a.forEach(p=>p.el.classList.toggle("hidden",p.x<d+1)));let o=document.createElement("canvas");o.width=_e,o.height=ve;let c=document.createElement("canvas");c.width=_e,c.height=ve;let l=()=>{let d=Bd(3600),p=e.getContext("2d");ko(p,38),zd(p,r,d),Ho(p);let g=o.getContext("2d"),_=document.createElement("canvas");_.width=_e,_.height=ve;let f=_.getContext("2d");ko(f,0),vl(f,r),g.filter="blur(26px)",g.drawImage(_,-40,-40,_e+80,ve+80),g.filter="none",Ho(g);let m=c.getContext("2d");ko(m,0),vl(m,r),Ho(m),h("gauss"),document.getElementById("wipe-loading").classList.add("done"),n.querySelector(".wipe-tag.right").textContent=`${ce("optical")} \xB7 Double-Gauss f/${d.fstop}`,a=[["hdr",ce("pinHdr")],["cat",ce("pinCat")],["blade",ce("pinBlade")],["cat2",ce("pinCA")]].map(([M,R])=>{let A=r.find(w=>w.hero===M),T=document.createElement("div"),k=A.x/_e*100,S=A.y/ve*100;return T.className="pin"+(k>70?" flip":""),T.style.left=Math.min(97,Math.max(3,k))+"%",T.style.top=Math.min(94,Math.max(6,S))+"%",T.innerHTML=`<i></i><span>${R}</span>`,s.appendChild(T),{el:T,x:k}});let v=document.createElement("div");v.className="pin",v.style.left="62%",v.style.top="78%",v.innerHTML=`<i></i><span>${ce("pinFocus")}</span>`,s.appendChild(v),a.push({el:v,x:62}),n._setX(n._x),n.dispatchEvent(new CustomEvent("ready"))};function h(d){t.getContext("2d").drawImage(d==="gauss"?o:c,0,0),i.textContent=d==="gauss"?ce("gauss"):ce("input")}document.querySelectorAll(".wipe-tabs .tab").forEach(d=>d.addEventListener("click",()=>{document.querySelectorAll(".wipe-tabs .tab").forEach(p=>p.classList.toggle("active",p===d)),h(d.dataset.mode)}));let u=new IntersectionObserver(d=>{d.some(p=>p.isIntersecting)&&(u.disconnect(),setTimeout(l,30))},{rootMargin:"600px"});return u.observe(n),n}var Sl=[["Leica Summilux-M 50 mm f/1.4",50,1.4,"Double-Gauss",11,"contraste alto, bokeh suave"],["Leica Summicron-M 50 mm f/2",50,2,"Double-Gauss",10,"nitidez cl\xE1ssica"],["Leica Noctilux-M 50 mm f/0.95",50,.95,"Double-Gauss",10,"campo raso extremo, cat-eye forte"],["Leica Summilux-M 35 mm f/1.4",35,1.4,"Double-Gauss",9,"glow em f/1.4"],["Leica Elmarit-M 28 mm f/2.8",28,2.8,"Retrofocus",8,"compacta, n\xEDtida"],["Leica APO-Summicron-M 90 mm f/2",90,2,"Tele",11,"apocrom\xE1tica"],["Leica Thambar-M 90 mm f/2.2",90,2.2,"Soft focus",20,"esf\xE9rica intencional, halo"],["ZEISS Planar T* 2/50 ZM",50,2,"Double-Gauss",10,"microcontraste, coating T*"],["ZEISS Planar 50 mm f/0.7",50,.7,"Double-Gauss",0,"abertura extrema, hist\xF3rico"],["ZEISS Sonnar T* 1.5/50 ZM",50,1.5,"Sonnar",10,"foco com shift, bokeh cremoso"],["ZEISS Biotar 58 mm f/2",58,2,"Double-Gauss",12,"swirl, vintage"],["ZEISS Biotar 75 mm f/1.5",75,1.5,"Double-Gauss",17,"swirl acentuado"],["ZEISS Tessar 50 mm f/2.8",50,2.8,"Tessar",10,"olho de \xE1guia, contraste"],["ZEISS Otus 55 mm f/1.4",55,1.4,"Distagon",9,"corre\xE7\xE3o extrema"],["ZEISS Distagon 35 mm f/1.4",35,1.4,"Retrofocus",9,"grande-angular luminosa"],["ZEISS Master Prime 50 mm T1.3",50,1.3,"Cine",9,"neutra, sem breathing"],["ZEISS Super Speed 50 mm T1.3",50,1.3,"Cine",7,"flare caracter\xEDstico"],["Helios-44-2 58 mm f/2",58,2,"Double-Gauss",8,"swirl, vintage"],["Helios-40-2 85 mm f/1.5",85,1.5,"Double-Gauss",10,"swirl forte, retrato"],["Jupiter-9 85 mm f/2",85,2,"Sonnar",15,"bokeh redondo, glow"],["Jupiter-8 50 mm f/2",50,2,"Sonnar",11,"compacta sovi\xE9tica"],["Industar-50-2 50 mm f/3.5",50,3.5,"Tessar",6,"panqueca, hex\xE1gono"],["Mir-1B 37 mm f/2.8",37,2.8,"Retrofocus",6,"flare e estrelas"],["Meyer-Optik Trioplan 100 mm f/2.8",100,2.8,"Triplet",15,"bokeh bolha de sab\xE3o"],["Meyer-Optik Primoplan 58 mm f/1.9",58,1.9,"Primoplan",12,"swirl e anel"],["Cooke Triplet 50 mm (estudo)",50,3.5,"Triplet",6,"did\xE1tico"],["Cooke Speed Panchro 50 mm T2",50,2,"Cine",8,"Cooke look, pele suave"],["Cooke S4/i 50 mm T2",50,2,"Cine",8,"Cooke look moderno"],["Cooke Panchro/i Classic 32 mm T2.2",32,2.2,"Cine",10,"vintage cine"],["Petzval 85 mm f/2.2 (estudo)",85,2.2,"Petzval",12,"swirl extremo, centro n\xEDtido"],["Petzval 58 mm f/1.9",58,1.9,"Petzval",0,"swirl, Waterhouse"],["Petzval 120 mm f/3.6",120,3.6,"Petzval",0,"retrato de est\xFAdio s\xE9c. XIX"],["Canon 50 mm f/0.95 TV",50,.95,"Double-Gauss",10,"dream lens, glow"],["Canon FD 55 mm f/1.2 S.S.C.",55,1.2,"Double-Gauss",8,"glow, contraste baixo"],["Canon EF 50 mm f/1.2L",50,1.2,"Double-Gauss",8,"bokeh suave, focus shift"],["Canon EF 85 mm f/1.2L II",85,1.2,"Double-Gauss",8,"retrato, cat-eye"],["Canon K35 24 mm T1.5",24,1.5,"Cine",9,"flare quente, vintage cine"],["Canon K35 55 mm T1.3",55,1.3,"Cine",9,"glow, contraste suave"],["Canon FD 135 mm f/2.5",135,2.5,"Tele",8,"tele cl\xE1ssica"],["Nikon Nikkor 50 mm f/1.4 Ai",50,1.4,"Double-Gauss",7,"hept\xE1gono fechado"],["Nikon Noct-Nikkor 58 mm f/1.2",58,1.2,"Double-Gauss",9,"asf\xE9rica, pontos de luz"],["Nikon Nikkor 105 mm f/2.5",105,2.5,"Sonnar",7,"retrato cl\xE1ssico"],["Nikon Nikkor-S 50 mm f/1.4 (Sonnar)",50,1.4,"Sonnar",10,"rangefinder vintage"],["Nikon Nikkor 35 mm f/1.4 Ai-s",35,1.4,"Retrofocus",9,"coma no campo"],["Nikon Nikkor 200 mm f/2 VR",200,2,"Tele",9,"compress\xE3o, bokeh limpo"],["Pentax Super-Takumar 50 mm f/1.4",50,1.4,"Double-Gauss",8,"t\xF3rio, quente"],["Pentax SMC Takumar 85 mm f/1.8",85,1.8,"Double-Gauss",6,"retrato vintage"],["Minolta Rokkor 58 mm f/1.2",58,1.2,"Double-Gauss",8,"glow, cor quente"],["Minolta STF 135 mm f/2.8 [T4.5]",135,2.8,"Apodiza\xE7\xE3o",10,"filtro apodizador, bokeh perfeito"],["Sony FE 100 mm f/2.8 STF GM",100,2.8,"Apodiza\xE7\xE3o",11,"apodiza\xE7\xE3o moderna"],["Sony FE 50 mm f/1.2 GM",50,1.2,"Double-Gauss",11,"moderna, corrigida"],["Sony FE 85 mm f/1.4 GM",85,1.4,"Double-Gauss",11,"retrato, sem onion-ring"],["Sony FE 135 mm f/1.8 GM",135,1.8,"Tele",11,"compress\xE3o suave"],["Sigma 35 mm f/1.4 DG HSM Art",35,1.4,"Retrofocus",9,"n\xEDtida, moderna"],["Sigma 50 mm f/1.4 DG HSM Art",50,1.4,"Retrofocus",9,"cl\xEDnica"],["Sigma 85 mm f/1.4 DG DN Art",85,1.4,"Double-Gauss",11,"retrato moderno"],["Sigma 105 mm f/1.4 DG HSM Art",105,1.4,"Tele",9,"bokeh master"],["Voigtl\xE4nder Nokton 50 mm f/1.1",50,1.1,"Double-Gauss",12,"glow, swirl leve"],["Voigtl\xE4nder Nokton 40 mm f/1.4",40,1.4,"Double-Gauss",10,"compacta luminosa"],["Voigtl\xE4nder Heliar 50 mm f/3.5",50,3.5,"Heliar",10,"Heliar cl\xE1ssica"],["Voigtl\xE4nder Ultron 35 mm f/1.7",35,1.7,"Double-Gauss",10,"equilibrada"],["Fujinon XF 56 mm f/1.2 R",56,1.2,"Double-Gauss",7,"retrato APS-C"],["Fujinon 50 mm f/1.4 EBC",50,1.4,"Double-Gauss",6,"vintage EBC"],["Olympus OM Zuiko 50 mm f/1.2",50,1.2,"Double-Gauss",8,"glow, compacta"],["Olympus OM Zuiko 100 mm f/2",100,2,"Tele",9,"tele leve"],["Kodak Ektar 101 mm f/4.5",101,4.5,"Tessar",6,"m\xE9dio formato"],["Kodak Aero Ektar 178 mm f/2.5",178,2.5,"Double-Gauss",0,"a\xE9rea, t\xF3rio"],["Rodenstock Heligon 50 mm f/1.9",50,1.9,"Double-Gauss",10,"alem\xE3 vintage"],["Schneider Xenon 50 mm f/1.9",50,1.9,"Double-Gauss",10,"swirl leve"],["Schneider Xenar 75 mm f/3.5",75,3.5,"Tessar",5,"Rolleiflex"],["Schneider Super-Angulon 21 mm f/3.4",21,3.4,"Grande-angular sim\xE9trica",8,"distor\xE7\xE3o baixa"],["Ang\xE9nieux 25 mm f/0.95 Type M1",25,.95,"Double-Gauss",10,"cine 16 mm"],["Ang\xE9nieux Type S21 28 mm f/3.5",28,3.5,"Retrofocus",6,"primeira retrofocus"],["Ang\xE9nieux Optimo 24\u2013290 mm T2.8",50,2.8,"Zoom cine",9,"zoom de cinema"],["Kowa Cine Prominar 40 mm",40,2.3,"Anam\xF3rfica",9,"flare azul, oval 2\xD7"],["Kowa Anamorphic 16-H",50,2.3,"Anam\xF3rfica",9,"adaptador 2\xD7, oval"],["Lomo Roundfront 35 mm",35,2.3,"Anam\xF3rfica",10,"oval, flare \xE2mbar"],["Lomo Squarefront 50 mm",50,2.4,"Anam\xF3rfica",10,"oval, campo curvo"],["Lomo Foton-A 37\u2013140 mm",50,4,"Anam\xF3rfica",10,"zoom anam\xF3rfico"],["Hawk V-Lite 50 mm T2.2 (estudo)",50,2.2,"Anam\xF3rfica",11,"oval moderno"],["Panavision C-Series 50 mm (estudo)",50,2.3,"Anam\xF3rfica",10,"flare azul cl\xE1ssico"],["Atlas Orion 40 mm T2 (estudo)",40,2,"Anam\xF3rfica",11,"anam\xF3rfica moderna"],["Sirui Venus 35 mm 1.6\xD7",35,1.8,"Anam\xF3rfica",11,"anam\xF3rfica acess\xEDvel"],["Laowa 24 mm f/14 Probe",24,14,"Macro",7,"macro sonda"],["Laowa Nanomorph 50 mm T2.4",50,2.4,"Anam\xF3rfica",9,"compacta 1.5\xD7"],["Lensbaby Twist 60 mm f/2.5",60,2.5,"Petzval",0,"swirl criativo"],["Lensbaby Velvet 56 mm f/1.6",56,1.6,"Soft focus",12,"veludo, halo"],["Lensbaby Sweet 35",35,2.5,"Tilt criativo",0,"ponto doce, borda borrada"],["Samyang 85 mm f/1.4",85,1.4,"Double-Gauss",8,"retrato acess\xEDvel"],["Samyang 135 mm f/2",135,2,"Tele",9,"tele luminosa"],["Tamron SP 90 mm f/2.8 Macro",90,2.8,"Macro",9,"macro suave"],["Hasselblad Planar 80 mm f/2.8",80,2.8,"Double-Gauss",5,"m\xE9dio formato, pent\xE1gono"],["Mamiya Sekor 110 mm f/2.8",110,2.8,"Double-Gauss",6,"m\xE9dio formato"],["Pentax 67 105 mm f/2.4",105,2.4,"Double-Gauss",8,"m\xE9dio formato luminoso"],["Double-Gauss 50 mm (prescri\xE7\xE3o LensSim)",50,2,"Double-Gauss",7,"refer\xEAncia documentada"],["Lente simples plano-convexa 50 mm",50,3,"Singleto",5,"esf\xE9rica e crom\xE1tica puras"],["Menisco Wollaston 50 mm",50,11,"Singleto",0,"c\xE2mera de caix\xE3o"],["Rapid Rectilinear 150 mm",150,8,"Sim\xE9trica",0,"s\xE9c. XIX, sem distor\xE7\xE3o"]];var Rl={update:null,begin:null,loopBegin:null,changeBegin:null,change:null,changeComplete:null,loopComplete:null,complete:null,loop:1,direction:"normal",autoplay:!0,timelineOffset:0},Yo={duration:1e3,delay:0,endDelay:0,easing:"easeOutElastic(1, .5)",round:0},kd=["translateX","translateY","translateZ","rotate","rotateX","rotateY","rotateZ","scale","scaleX","scaleY","scaleZ","skew","skewX","skewY","perspective","matrix","matrix3d"],Ys={CSS:{},springs:{}};function un(n,t,e){return Math.min(Math.max(n,t),e)}function ls(n,t){return n.indexOf(t)>-1}function Wo(n,t){return n.apply(null,t)}var St={arr:function(n){return Array.isArray(n)},obj:function(n){return ls(Object.prototype.toString.call(n),"Object")},pth:function(n){return St.obj(n)&&n.hasOwnProperty("totalLength")},svg:function(n){return n instanceof SVGElement},inp:function(n){return n instanceof HTMLInputElement},dom:function(n){return n.nodeType||St.svg(n)},str:function(n){return typeof n=="string"},fnc:function(n){return typeof n=="function"},und:function(n){return typeof n=="undefined"},nil:function(n){return St.und(n)||n===null},hex:function(n){return/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(n)},rgb:function(n){return/^rgb/.test(n)},hsl:function(n){return/^hsl/.test(n)},col:function(n){return St.hex(n)||St.rgb(n)||St.hsl(n)},key:function(n){return!Rl.hasOwnProperty(n)&&!Yo.hasOwnProperty(n)&&n!=="targets"&&n!=="keyframes"}};function Cl(n){var t=/\(([^)]+)\)/.exec(n);return t?t[1].split(",").map(function(e){return parseFloat(e)}):[]}function Pl(n,t){var e=Cl(n),i=un(St.und(e[0])?1:e[0],.1,100),s=un(St.und(e[1])?100:e[1],.1,100),r=un(St.und(e[2])?10:e[2],.1,100),a=un(St.und(e[3])?0:e[3],.1,100),o=Math.sqrt(s/i),c=r/(2*Math.sqrt(s*i)),l=c<1?o*Math.sqrt(1-c*c):0,h=1,u=c<1?(c*o+-a)/l:-a+o;function d(g){var _=t?t*g/1e3:g;return c<1?_=Math.exp(-_*c*o)*(h*Math.cos(l*_)+u*Math.sin(l*_)):_=(h+u*_)*Math.exp(-_*o),g===0||g===1?g:1-_}function p(){var g=Ys.springs[n];if(g)return g;for(var _=1/6,f=0,m=0;;)if(f+=_,d(f)===1){if(m++,m>=16)break}else m=0;var x=f*_*1e3;return Ys.springs[n]=x,x}return t?d:p}function Hd(n){return n===void 0&&(n=10),function(t){return Math.ceil(un(t,1e-6,1)*n)*(1/n)}}var Vd=(function(){var n=11,t=1/(n-1);function e(h,u){return 1-3*u+3*h}function i(h,u){return 3*u-6*h}function s(h){return 3*h}function r(h,u,d){return((e(u,d)*h+i(u,d))*h+s(u))*h}function a(h,u,d){return 3*e(u,d)*h*h+2*i(u,d)*h+s(u)}function o(h,u,d,p,g){var _,f,m=0;do f=u+(d-u)/2,_=r(f,p,g)-h,_>0?d=f:u=f;while(Math.abs(_)>1e-7&&++m<10);return f}function c(h,u,d,p){for(var g=0;g<4;++g){var _=a(u,d,p);if(_===0)return u;var f=r(u,d,p)-h;u-=f/_}return u}function l(h,u,d,p){if(!(0<=h&&h<=1&&0<=d&&d<=1))return;var g=new Float32Array(n);if(h!==u||d!==p)for(var _=0;_<n;++_)g[_]=r(_*t,h,d);function f(m){for(var x=0,v=1,M=n-1;v!==M&&g[v]<=m;++v)x+=t;--v;var R=(m-g[v])/(g[v+1]-g[v]),A=x+R*t,T=a(A,h,d);return T>=.001?c(m,A,h,d):T===0?A:o(m,x,x+t,h,d)}return function(m){return h===u&&d===p||m===0||m===1?m:r(f(m),u,p)}}return l})(),Ll=(function(){var n={linear:function(){return function(i){return i}}},t={Sine:function(){return function(i){return 1-Math.cos(i*Math.PI/2)}},Expo:function(){return function(i){return i?Math.pow(2,10*i-10):0}},Circ:function(){return function(i){return 1-Math.sqrt(1-i*i)}},Back:function(){return function(i){return i*i*(3*i-2)}},Bounce:function(){return function(i){for(var s,r=4;i<((s=Math.pow(2,--r))-1)/11;);return 1/Math.pow(4,3-r)-7.5625*Math.pow((s*3-2)/22-i,2)}},Elastic:function(i,s){i===void 0&&(i=1),s===void 0&&(s=.5);var r=un(i,1,10),a=un(s,.1,2);return function(o){return o===0||o===1?o:-r*Math.pow(2,10*(o-1))*Math.sin((o-1-a/(Math.PI*2)*Math.asin(1/r))*(Math.PI*2)/a)}}},e=["Quad","Cubic","Quart","Quint"];return e.forEach(function(i,s){t[i]=function(){return function(r){return Math.pow(r,s+2)}}}),Object.keys(t).forEach(function(i){var s=t[i];n["easeIn"+i]=s,n["easeOut"+i]=function(r,a){return function(o){return 1-s(r,a)(1-o)}},n["easeInOut"+i]=function(r,a){return function(o){return o<.5?s(r,a)(o*2)/2:1-s(r,a)(o*-2+2)/2}},n["easeOutIn"+i]=function(r,a){return function(o){return o<.5?(1-s(r,a)(1-o*2))/2:(s(r,a)(o*2-1)+1)/2}}}),n})();function Zo(n,t){if(St.fnc(n))return n;var e=n.split("(")[0],i=Ll[e],s=Cl(n);switch(e){case"spring":return Pl(n,t);case"cubicBezier":return Wo(Vd,s);case"steps":return Wo(Hd,s);default:return Wo(i,s)}}function Il(n){try{var t=document.querySelectorAll(n);return t}catch{return}}function Zs(n,t){for(var e=n.length,i=arguments.length>=2?arguments[1]:void 0,s=[],r=0;r<e;r++)if(r in n){var a=n[r];t.call(i,a,r,n)&&s.push(a)}return s}function $s(n){return n.reduce(function(t,e){return t.concat(St.arr(e)?$s(e):e)},[])}function bl(n){return St.arr(n)?n:(St.str(n)&&(n=Il(n)||n),n instanceof NodeList||n instanceof HTMLCollection?[].slice.call(n):[n])}function $o(n,t){return n.some(function(e){return e===t})}function Jo(n){var t={};for(var e in n)t[e]=n[e];return t}function Xo(n,t){var e=Jo(n);for(var i in n)e[i]=t.hasOwnProperty(i)?t[i]:n[i];return e}function Js(n,t){var e=Jo(n);for(var i in t)e[i]=St.und(n[i])?t[i]:n[i];return e}function Gd(n){var t=/rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(n);return t?"rgba("+t[1]+",1)":n}function Wd(n){var t=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,e=n.replace(t,function(o,c,l,h){return c+c+l+l+h+h}),i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e),s=parseInt(i[1],16),r=parseInt(i[2],16),a=parseInt(i[3],16);return"rgba("+s+","+r+","+a+",1)"}function Xd(n){var t=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(n)||/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(n),e=parseInt(t[1],10)/360,i=parseInt(t[2],10)/100,s=parseInt(t[3],10)/100,r=t[4]||1;function a(d,p,g){return g<0&&(g+=1),g>1&&(g-=1),g<1/6?d+(p-d)*6*g:g<1/2?p:g<2/3?d+(p-d)*(2/3-g)*6:d}var o,c,l;if(i==0)o=c=l=s;else{var h=s<.5?s*(1+i):s+i-s*i,u=2*s-h;o=a(u,h,e+1/3),c=a(u,h,e),l=a(u,h,e-1/3)}return"rgba("+o*255+","+c*255+","+l*255+","+r+")"}function qd(n){if(St.rgb(n))return Gd(n);if(St.hex(n))return Wd(n);if(St.hsl(n))return Xd(n)}function _n(n){var t=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(n);if(t)return t[1]}function Yd(n){if(ls(n,"translate")||n==="perspective")return"px";if(ls(n,"rotate")||ls(n,"skew"))return"deg"}function qo(n,t){return St.fnc(n)?n(t.target,t.id,t.total):n}function dn(n,t){return n.getAttribute(t)}function Ko(n,t,e){var i=_n(t);if($o([e,"deg","rad","turn"],i))return t;var s=Ys.CSS[t+e];if(!St.und(s))return s;var r=100,a=document.createElement(n.tagName),o=n.parentNode&&n.parentNode!==document?n.parentNode:document.body;o.appendChild(a),a.style.position="absolute",a.style.width=r+e;var c=r/a.offsetWidth;o.removeChild(a);var l=c*parseFloat(t);return Ys.CSS[t+e]=l,l}function Dl(n,t,e){if(t in n.style){var i=t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),s=n.style[t]||getComputedStyle(n).getPropertyValue(i)||"0";return e?Ko(n,s,e):s}}function Qo(n,t){if(St.dom(n)&&!St.inp(n)&&(!St.nil(dn(n,t))||St.svg(n)&&n[t]))return"attribute";if(St.dom(n)&&$o(kd,t))return"transform";if(St.dom(n)&&t!=="transform"&&Dl(n,t))return"css";if(n[t]!=null)return"object"}function Ul(n){if(St.dom(n)){for(var t=n.style.transform||"",e=/(\w+)\(([^)]*)\)/g,i=new Map,s;s=e.exec(t);)i.set(s[1],s[2]);return i}}function Zd(n,t,e,i){var s=ls(t,"scale")?1:0+Yd(t),r=Ul(n).get(t)||s;return e&&(e.transforms.list.set(t,r),e.transforms.last=t),i?Ko(n,r,i):r}function jo(n,t,e,i){switch(Qo(n,t)){case"transform":return Zd(n,t,i,e);case"css":return Dl(n,t,e);case"attribute":return dn(n,t);default:return n[t]||0}}function ta(n,t){var e=/^(\*=|\+=|-=)/.exec(n);if(!e)return n;var i=_n(n)||0,s=parseFloat(t),r=parseFloat(n.replace(e[0],""));switch(e[0][0]){case"+":return s+r+i;case"-":return s-r+i;case"*":return s*r+i}}function Nl(n,t){if(St.col(n))return qd(n);if(/\s/g.test(n))return n;var e=_n(n),i=e?n.substr(0,n.length-e.length):n;return t?i+t:i}function ea(n,t){return Math.sqrt(Math.pow(t.x-n.x,2)+Math.pow(t.y-n.y,2))}function $d(n){return Math.PI*2*dn(n,"r")}function Jd(n){return dn(n,"width")*2+dn(n,"height")*2}function Kd(n){return ea({x:dn(n,"x1"),y:dn(n,"y1")},{x:dn(n,"x2"),y:dn(n,"y2")})}function Ol(n){for(var t=n.points,e=0,i,s=0;s<t.numberOfItems;s++){var r=t.getItem(s);s>0&&(e+=ea(i,r)),i=r}return e}function Qd(n){var t=n.points;return Ol(n)+ea(t.getItem(t.numberOfItems-1),t.getItem(0))}function Fl(n){if(n.getTotalLength)return n.getTotalLength();switch(n.tagName.toLowerCase()){case"circle":return $d(n);case"rect":return Jd(n);case"line":return Kd(n);case"polyline":return Ol(n);case"polygon":return Qd(n)}}function jd(n){var t=Fl(n);return n.setAttribute("stroke-dasharray",t),t}function tf(n){for(var t=n.parentNode;St.svg(t)&&St.svg(t.parentNode);)t=t.parentNode;return t}function Bl(n,t){var e=t||{},i=e.el||tf(n),s=i.getBoundingClientRect(),r=dn(i,"viewBox"),a=s.width,o=s.height,c=e.viewBox||(r?r.split(" "):[0,0,a,o]);return{el:i,viewBox:c,x:c[0]/1,y:c[1]/1,w:a,h:o,vW:c[2],vH:c[3]}}function ef(n,t){var e=St.str(n)?Il(n)[0]:n,i=t||100;return function(s){return{property:s,el:e,svg:Bl(e),totalLength:Fl(e)*(i/100)}}}function nf(n,t,e){function i(h){h===void 0&&(h=0);var u=t+h>=1?t+h:0;return n.el.getPointAtLength(u)}var s=Bl(n.el,n.svg),r=i(),a=i(-1),o=i(1),c=e?1:s.w/s.vW,l=e?1:s.h/s.vH;switch(n.property){case"x":return(r.x-s.x)*c;case"y":return(r.y-s.y)*l;case"angle":return Math.atan2(o.y-a.y,o.x-a.x)*180/Math.PI}}function El(n,t){var e=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,i=Nl(St.pth(n)?n.totalLength:n,t)+"";return{original:i,numbers:i.match(e)?i.match(e).map(Number):[0],strings:St.str(n)||t?i.split(e):[]}}function na(n){var t=n?$s(St.arr(n)?n.map(bl):bl(n)):[];return Zs(t,function(e,i,s){return s.indexOf(e)===i})}function zl(n){var t=na(n);return t.map(function(e,i){return{target:e,id:i,total:t.length,transforms:{list:Ul(e)}}})}function sf(n,t){var e=Jo(t);if(/^spring/.test(e.easing)&&(e.duration=Pl(e.easing)),St.arr(n)){var i=n.length,s=i===2&&!St.obj(n[0]);s?n={value:n}:St.fnc(t.duration)||(e.duration=t.duration/i)}var r=St.arr(n)?n:[n];return r.map(function(a,o){var c=St.obj(a)&&!St.pth(a)?a:{value:a};return St.und(c.delay)&&(c.delay=o?0:t.delay),St.und(c.endDelay)&&(c.endDelay=o===r.length-1?t.endDelay:0),c}).map(function(a){return Js(a,e)})}function rf(n){for(var t=Zs($s(n.map(function(r){return Object.keys(r)})),function(r){return St.key(r)}).reduce(function(r,a){return r.indexOf(a)<0&&r.push(a),r},[]),e={},i=function(r){var a=t[r];e[a]=n.map(function(o){var c={};for(var l in o)St.key(l)?l==a&&(c.value=o[l]):c[l]=o[l];return c})},s=0;s<t.length;s++)i(s);return e}function of(n,t){var e=[],i=t.keyframes;i&&(t=Js(rf(i),t));for(var s in t)St.key(s)&&e.push({name:s,tweens:sf(t[s],n)});return e}function af(n,t){var e={};for(var i in n){var s=qo(n[i],t);St.arr(s)&&(s=s.map(function(r){return qo(r,t)}),s.length===1&&(s=s[0])),e[i]=s}return e.duration=parseFloat(e.duration),e.delay=parseFloat(e.delay),e}function cf(n,t){var e;return n.tweens.map(function(i){var s=af(i,t),r=s.value,a=St.arr(r)?r[1]:r,o=_n(a),c=jo(t.target,n.name,o,t),l=e?e.to.original:c,h=St.arr(r)?r[0]:l,u=_n(h)||_n(c),d=o||u;return St.und(a)&&(a=l),s.from=El(h,d),s.to=El(ta(a,h),d),s.start=e?e.end:0,s.end=s.start+s.delay+s.duration+s.endDelay,s.easing=Zo(s.easing,s.duration),s.isPath=St.pth(r),s.isPathTargetInsideSVG=s.isPath&&St.svg(t.target),s.isColor=St.col(s.from.original),s.isColor&&(s.round=1),e=s,s})}var kl={css:function(n,t,e){return n.style[t]=e},attribute:function(n,t,e){return n.setAttribute(t,e)},object:function(n,t,e){return n[t]=e},transform:function(n,t,e,i,s){if(i.list.set(t,e),t===i.last||s){var r="";i.list.forEach(function(a,o){r+=o+"("+a+") "}),n.style.transform=r}}};function Hl(n,t){var e=zl(n);e.forEach(function(i){for(var s in t){var r=qo(t[s],i),a=i.target,o=_n(r),c=jo(a,s,o,i),l=o||_n(c),h=ta(Nl(r,l),c),u=Qo(a,s);kl[u](a,s,h,i.transforms,!0)}})}function lf(n,t){var e=Qo(n.target,t.name);if(e){var i=cf(t,n),s=i[i.length-1];return{type:e,property:t.name,animatable:n,tweens:i,duration:s.end,delay:i[0].delay,endDelay:s.endDelay}}}function hf(n,t){return Zs($s(n.map(function(e){return t.map(function(i){return lf(e,i)})})),function(e){return!St.und(e)})}function Vl(n,t){var e=n.length,i=function(r){return r.timelineOffset?r.timelineOffset:0},s={};return s.duration=e?Math.max.apply(Math,n.map(function(r){return i(r)+r.duration})):t.duration,s.delay=e?Math.min.apply(Math,n.map(function(r){return i(r)+r.delay})):t.delay,s.endDelay=e?s.duration-Math.max.apply(Math,n.map(function(r){return i(r)+r.duration-r.endDelay})):t.endDelay,s}var wl=0;function uf(n){var t=Xo(Rl,n),e=Xo(Yo,n),i=of(e,n),s=zl(n.targets),r=hf(s,i),a=Vl(r,e),o=wl;return wl++,Js(t,{id:o,children:[],animatables:s,animations:r,duration:a.duration,delay:a.delay,endDelay:a.endDelay})}var je=[],Gl=(function(){var n;function t(){!n&&(!Tl()||!ue.suspendWhenDocumentHidden)&&je.length>0&&(n=requestAnimationFrame(e))}function e(s){for(var r=je.length,a=0;a<r;){var o=je[a];o.paused?(je.splice(a,1),r--):(o.tick(s),a++)}n=a>0?requestAnimationFrame(e):void 0}function i(){ue.suspendWhenDocumentHidden&&(Tl()?n=cancelAnimationFrame(n):(je.forEach(function(s){return s._onDocumentVisibility()}),Gl()))}return typeof document!="undefined"&&document.addEventListener("visibilitychange",i),t})();function Tl(){return!!document&&document.hidden}function ue(n){n===void 0&&(n={});var t=0,e=0,i=0,s,r=0,a=null;function o(v){var M=window.Promise&&new Promise(function(R){return a=R});return v.finished=M,M}var c=uf(n),l=o(c);function h(){var v=c.direction;v!=="alternate"&&(c.direction=v!=="normal"?"normal":"reverse"),c.reversed=!c.reversed,s.forEach(function(M){return M.reversed=c.reversed})}function u(v){return c.reversed?c.duration-v:v}function d(){t=0,e=u(c.currentTime)*(1/ue.speed)}function p(v,M){M&&M.seek(v-M.timelineOffset)}function g(v){if(c.reversePlayback)for(var R=r;R--;)p(v,s[R]);else for(var M=0;M<r;M++)p(v,s[M])}function _(v){for(var M=0,R=c.animations,A=R.length;M<A;){var T=R[M],k=T.animatable,S=T.tweens,w=S.length-1,I=S[w];w&&(I=Zs(S,function(Rt){return v<Rt.end})[0]||I);for(var q=un(v-I.start-I.delay,0,I.duration)/I.duration,Q=isNaN(q)?1:I.easing(q),L=I.to.strings,N=I.round,W=[],$=I.to.numbers.length,G=void 0,X=0;X<$;X++){var K=void 0,tt=I.to.numbers[X],rt=I.from.numbers[X]||0;I.isPath?K=nf(I.value,Q*tt,I.isPathTargetInsideSVG):K=rt+Q*(tt-rt),N&&(I.isColor&&X>2||(K=Math.round(K*N)/N)),W.push(K)}var V=L.length;if(!V)G=W[0];else{G=L[0];for(var Y=0;Y<V;Y++){var ht=L[Y],_t=L[Y+1],gt=W[Y];isNaN(gt)||(_t?G+=gt+_t:G+=gt+" ")}}kl[T.type](k.target,T.property,G,k.transforms),T.currentValue=G,M++}}function f(v){c[v]&&!c.passThrough&&c[v](c)}function m(){c.remaining&&c.remaining!==!0&&c.remaining--}function x(v){var M=c.duration,R=c.delay,A=M-c.endDelay,T=u(v);c.progress=un(T/M*100,0,100),c.reversePlayback=T<c.currentTime,s&&g(T),!c.began&&c.currentTime>0&&(c.began=!0,f("begin")),!c.loopBegan&&c.currentTime>0&&(c.loopBegan=!0,f("loopBegin")),T<=R&&c.currentTime!==0&&_(0),(T>=A&&c.currentTime!==M||!M)&&_(M),T>R&&T<A?(c.changeBegan||(c.changeBegan=!0,c.changeCompleted=!1,f("changeBegin")),f("change"),_(T)):c.changeBegan&&(c.changeCompleted=!0,c.changeBegan=!1,f("changeComplete")),c.currentTime=un(T,0,M),c.began&&f("update"),v>=M&&(e=0,m(),c.remaining?(t=i,f("loopComplete"),c.loopBegan=!1,c.direction==="alternate"&&h()):(c.paused=!0,c.completed||(c.completed=!0,f("loopComplete"),f("complete"),!c.passThrough&&"Promise"in window&&(a(),l=o(c)))))}return c.reset=function(){var v=c.direction;c.passThrough=!1,c.currentTime=0,c.progress=0,c.paused=!0,c.began=!1,c.loopBegan=!1,c.changeBegan=!1,c.completed=!1,c.changeCompleted=!1,c.reversePlayback=!1,c.reversed=v==="reverse",c.remaining=c.loop,s=c.children,r=s.length;for(var M=r;M--;)c.children[M].reset();(c.reversed&&c.loop!==!0||v==="alternate"&&c.loop===1)&&c.remaining++,_(c.reversed?c.duration:0)},c._onDocumentVisibility=d,c.set=function(v,M){return Hl(v,M),c},c.tick=function(v){i=v,t||(t=i),x((i+(e-t))*ue.speed)},c.seek=function(v){x(u(v))},c.pause=function(){c.paused=!0,d()},c.play=function(){c.paused&&(c.completed&&c.reset(),c.paused=!1,je.push(c),d(),Gl())},c.reverse=function(){h(),c.completed=!c.reversed,d()},c.restart=function(){c.reset(),c.play()},c.remove=function(v){var M=na(v);Wl(M,c)},c.reset(),c.autoplay&&c.play(),c}function Al(n,t){for(var e=t.length;e--;)$o(n,t[e].animatable.target)&&t.splice(e,1)}function Wl(n,t){var e=t.animations,i=t.children;Al(n,e);for(var s=i.length;s--;){var r=i[s],a=r.animations;Al(n,a),!a.length&&!r.children.length&&i.splice(s,1)}!e.length&&!i.length&&t.pause()}function df(n){for(var t=na(n),e=je.length;e--;){var i=je[e];Wl(t,i)}}function ff(n,t){t===void 0&&(t={});var e=t.direction||"normal",i=t.easing?Zo(t.easing):null,s=t.grid,r=t.axis,a=t.from||0,o=a==="first",c=a==="center",l=a==="last",h=St.arr(n),u=parseFloat(h?n[0]:n),d=h?parseFloat(n[1]):0,p=_n(h?n[1]:n)||0,g=t.start||0+(h?u:0),_=[],f=0;return function(m,x,v){if(o&&(a=0),c&&(a=(v-1)/2),l&&(a=v-1),!_.length){for(var M=0;M<v;M++){if(!s)_.push(Math.abs(a-M));else{var R=c?(s[0]-1)/2:a%s[0],A=c?(s[1]-1)/2:Math.floor(a/s[0]),T=M%s[0],k=Math.floor(M/s[0]),S=R-T,w=A-k,I=Math.sqrt(S*S+w*w);r==="x"&&(I=-S),r==="y"&&(I=-w),_.push(I)}f=Math.max.apply(Math,_)}i&&(_=_.map(function(Q){return i(Q/f)*f})),e==="reverse"&&(_=_.map(function(Q){return r?Q<0?Q*-1:-Q:Math.abs(f-Q)}))}var q=h?(d-u)/f:u;return g+q*(Math.round(_[x]*100)/100)+p}}function pf(n){n===void 0&&(n={});var t=ue(n);return t.duration=0,t.add=function(e,i){var s=je.indexOf(t),r=t.children;s>-1&&je.splice(s,1);function a(d){d.passThrough=!0}for(var o=0;o<r.length;o++)a(r[o]);var c=Js(e,Xo(Yo,n));c.targets=c.targets||n.targets;var l=t.duration;c.autoplay=!1,c.direction=t.direction,c.timelineOffset=St.und(i)?l:ta(i,l),a(t),t.seek(c.timelineOffset);var h=ue(c);a(h),r.push(h);var u=Vl(r,n);return t.delay=u.delay,t.endDelay=u.endDelay,t.duration=u.duration,t.seek(0),t.reset(),t.autoplay&&t.play(),t},t}ue.version="3.2.1";ue.speed=1;ue.suspendWhenDocumentHidden=!0;ue.running=je;ue.remove=df;ue.get=jo;ue.set=Hl;ue.convertPx=Ko;ue.path=ef;ue.setDashoffset=jd;ue.stagger=ff;ue.timeline=pf;ue.easing=Zo;ue.penner=Ll;ue.random=function(n,t){return Math.floor(Math.random()*(t-n+1))+n};var ia=ue;var vo=Sl.map(nl),ne=ia;window.anime=ia;var $n=window.matchMedia("(prefers-reduced-motion: reduce)").matches;ne&&!$n&&document.documentElement.classList.add("js");document.getElementById("year").textContent=new Date().getFullYear();var Gv=document.getElementById("nav"),rd=()=>Gv.classList.toggle("solid",window.scrollY>40);window.addEventListener("scroll",rd,{passive:!0});rd();var Wv=document.getElementById("marquee"),nd=vo.map(n=>n[0]);Wv.innerHTML=[...nd,...nd].map(n=>`<span>${n}</span>`).join("");var Xv=document.getElementById("ro-focus");Promise.resolve().then(()=>(ed(),td)).then(({initHero:n})=>{try{let t=n(document.getElementById("hero-canvas"),e=>{Xv.textContent=ln(e*.38,2)+" m"});ne&&!$n?ne.timeline({easing:"easeOutExpo"}).add({targets:t.anim,particles:[0,1],duration:2200},0).add({targets:t.anim,explode:[1.6,0],rotY:[-1.9,-.55],duration:2600,easing:"easeInOutQuart"},200).add({targets:t.anim,rays:[0,1],duration:1600},2300):(t.anim.particles=1,t.anim.explode=0,t.anim.rotY=-.55,t.anim.rays=1)}catch(t){console.warn("Hero 3D indispon\xEDvel:",t)}}).catch(n=>console.warn("three.js n\xE3o carregou:",n));ne&&!$n&&ne.timeline({easing:"easeOutExpo"}).add({targets:".hero-title .w",translateY:["110%","0%"],duration:1400,delay:ne.stagger(90)},300).add({targets:".reveal-hero",opacity:[0,1],translateY:[24,0],duration:1200,delay:ne.stagger(110)},700).add({targets:".hero-title em",color:["#ffffff","#9ff0c8"],duration:1600,easing:"easeOutQuad"},900);function Zn(n,t,e={threshold:.18}){let i=new IntersectionObserver(s=>s.forEach(r=>{r.isIntersecting&&(i.unobserve(r.target),t(r.target))}),e);n.forEach(s=>i.observe(s))}if(ne&&!$n){let n=[],t=0;Zn(document.querySelectorAll(".reveal"),e=>{n.push(e),clearTimeout(t),t=setTimeout(()=>{ne({targets:n,opacity:[0,1],translateY:[36,0],duration:1100,delay:ne.stagger(80),easing:"easeOutExpo"}),n=[]},30)},{threshold:.12}),Zn(document.querySelectorAll(".diff .draw"),e=>{ne({targets:e.querySelectorAll("path,circle,polygon,rect"),strokeDashoffset:[ne.setDashoffset,0],duration:1600,delay:ne.stagger(220,{start:200}),easing:"easeInOutSine"})}),Zn([document.querySelector(".pipeline")],e=>{ne({targets:e.querySelectorAll(".step"),opacity:[0,1],translateX:[-20,0],delay:ne.stagger(120,{start:200}),duration:900,easing:"easeOutExpo"})})}Zn(document.querySelectorAll(".count"),n=>{let t=+n.dataset.to,e=+(n.dataset.dec||0),i={v:0},s=r=>ln(r,e);if(!ne||$n){n.textContent=s(t);return}ne({targets:i,v:t,duration:2e3,easing:"easeOutExpo",update:()=>n.textContent=s(i.v)})});var _o=Ml();yl();ne&&!$n&&(_o.addEventListener("ready",()=>{Zn([_o],()=>{let n={x:88};ne.timeline({easing:"easeInOutQuart"}).add({targets:n,x:[88,18],duration:1500,update:()=>_o._setX(n.x)}).add({targets:n,x:50,duration:1100,update:()=>_o._setX(n.x)}).add({targets:"#pins .pin",scale:[0,1],opacity:[0,1],delay:ne.stagger(140),duration:700,easing:"easeOutBack"},"-=500")},{threshold:.4})}),Zn(document.querySelectorAll(".wipe.img"),n=>{let t={x:80};ne({targets:t,x:[80,50],duration:1400,delay:300,easing:"easeInOutQuart",update:()=>n._setX(t.x)})},{threshold:.5}));Zn([document.getElementById("lab")],()=>_l(),{rootMargin:"400px"});var Ns=document.getElementById("dot-grid"),Hc=14,Vc=10;for(let n=0;n<Hc*Vc;n++)Ns.appendChild(document.createElement("i"));if(ne&&!$n){let n=Ns.querySelectorAll("i"),t=e=>ne.timeline().add({targets:n,scale:[{value:1.9,easing:"easeOutSine",duration:450},{value:1,easing:"easeInOutQuad",duration:900}],opacity:[{value:.95,duration:450},{value:.18,duration:900}],backgroundColor:[{value:(i,s)=>["#f3a75c","#7fd6ff","#9ff0c8"][s%3],duration:450},{value:"#9ff0c8",duration:900}],delay:ne.stagger(60,{grid:[Hc,Vc],from:e})});Zn([Ns],()=>{t("center");let e=0;setInterval(()=>{document.hidden||(t(Math.floor(Math.random()*Hc*Vc)),e++)},3600)}),Ns.addEventListener("pointerdown",e=>{let i=[...Ns.children].indexOf(e.target);i>=0&&t(i)})}var id=document.querySelector("#lens-table tbody"),od=document.getElementById("lens-search"),sd=document.getElementById("lens-chips"),Gc=ce("all"),qv=[Gc,...new Set(vo.map(n=>n[3]))].slice(0,12),xo=Gc,Os="name",yo=!0;qv.forEach(n=>{let t=document.createElement("button");t.textContent=n,n===xo&&t.classList.add("on"),t.onclick=()=>{xo=n,sd.querySelectorAll("button").forEach(e=>e.classList.toggle("on",e===t)),Mo()},sd.appendChild(t)});var Yv={name:0,focal:1,f:2,family:3,blades:4,look:5};document.querySelectorAll("#lens-table th").forEach(n=>n.addEventListener("click",()=>{let t=n.dataset.k;yo=Os===t?!yo:!0,Os=t,Mo()}));function Mo(){let n=od.value.trim().toLowerCase(),t=vo.filter(i=>(xo===Gc||i[3]===xo)&&(!n||i.join(" ").toLowerCase().includes(n))),e=Yv[Os];t.sort((i,s)=>(typeof i[e]=="number"?i[e]-s[e]:String(i[e]).localeCompare(String(s[e]),document.documentElement.lang))*(yo?1:-1)),id.innerHTML=t.map(i=>`<tr><td>${i[0]}</td><td class="m">${i[1]} mm</td><td class="m">f/${i[2]}</td><td><span class="fam">${i[3]}</span></td><td class="m">${i[4]||"\u2014"}</td><td class="look">${i[5]}</td></tr>`).join(""),document.querySelectorAll("#lens-table th").forEach(i=>{i.classList.toggle("sort",i.dataset.k===Os),i.classList.toggle("asc",i.dataset.k===Os&&yo)}),document.getElementById("lens-count").textContent=ce("count")(t.length,vo.length),ne&&!$n&&ne({targets:id.querySelectorAll("tr"),opacity:[0,1],translateX:[-8,0],delay:(i,s)=>Math.min(s*12,300),duration:500,easing:"easeOutQuad"})}od.addEventListener("input",Mo);Mo();document.querySelectorAll(".lang a").forEach(n=>n.addEventListener("click",()=>{try{localStorage.setItem("lang",n.dataset.lang)}catch{}}));})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2023 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
