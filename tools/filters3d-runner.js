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
