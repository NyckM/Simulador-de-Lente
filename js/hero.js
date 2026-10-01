import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as O from './optics.js';

// Hero 3D: os vidros reais da Double-Gauss, raios traçados pelo mesmo motor
// e um campo de bokeh cujo foco acompanha o mouse/scroll.
export function initHero(canvas, onFocus) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const small = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  renderer.setClearColor(0x0a0c0b, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(0, 0.5, 11);
  camera.lookAt(0, 0, 0);

  const SC = 0.075; // mm → unidades
  const lens = O.buildLens('dgauss');
  const info = O.lensInfo(lens);
  const S = lens.S;
  const zLast = S[S.length - 1].z;
  const zSensor = zLast + info.bfdInf;
  const zMid = (S[0].z + zSensor) / 2;

  const root = new THREE.Group();
  scene.add(root);
  const lensGroup = new THREE.Group();
  root.add(lensGroup);

  const sag = (s, y) => (s.R ? s.R - Math.sign(s.R) * Math.sqrt(Math.max(0, s.R * s.R - y * y)) : 0);

  // ---- vidros (LatheGeometry a partir da prescrição) ----
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.6,
    ior: 1.62, envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.04,
    attenuationColor: new THREE.Color(0xc9ffe8), attenuationDistance: 3.5,
    side: THREE.DoubleSide, specularIntensity: 1, iridescence: 0.25, iridescenceIOR: 1.3,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x9ff0c8, transparent: true, opacity: 0.35 });
  const parts = [];
  for (let i = 0; i < S.length - 1; i++) {
    const A = S[i], B = S[i + 1];
    if (A.stop || A.n <= 1) continue;
    const r = Math.min(A.sd, B.sd);
    const pts = [];
    const N = 28;
    for (let k = 0; k <= N; k++) { const y = (r * k) / N; pts.push(new THREE.Vector2(y * SC, (A.z + sag(A, y) - zMid) * SC)); }
    for (let k = N; k >= 0; k--) { const y = (r * k) / N; pts.push(new THREE.Vector2(y * SC, (B.z + sag(B, y) - zMid) * SC)); }
    const geo = new THREE.LatheGeometry(pts, 96);
    geo.rotateZ(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, glassMat);
    const g = new THREE.Group(); g.add(mesh);
    // contorno de aro
    const ringGeo = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 96 }, (_, k) => { const a = (k / 96) * Math.PI * 2; return new THREE.Vector3((A.z + sag(A, r) - zMid) * SC, Math.cos(a) * r * SC, Math.sin(a) * r * SC); })
    );
    const ring = new THREE.LineLoop(ringGeo, edgeMat);
    g.add(ring);
    lensGroup.add(g);
    parts.push({ g, idx: parts.length });
  }

  // ---- diafragma (7 lâminas) ----
  const stop = info.stop;
  const irisShape = new THREE.Shape();
  irisShape.absarc(0, 0, stop.sd * 1.55 * SC, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const rIris = stop.sd * 0.78 * SC;
  for (let k = 0; k <= 7; k++) { const a = (k / 7) * Math.PI * 2 + 0.3; const x = Math.cos(a) * rIris, y = Math.sin(a) * rIris; k ? hole.lineTo(x, y) : hole.moveTo(x, y); }
  irisShape.holes.push(hole);
  const iris = new THREE.Mesh(new THREE.ShapeGeometry(irisShape, 48), new THREE.MeshStandardMaterial({ color: 0x15181a, metalness: 0.85, roughness: 0.38, side: THREE.DoubleSide }));
  iris.rotation.y = Math.PI / 2;
  iris.position.x = (stop.z - zMid) * SC;
  const irisG = new THREE.Group(); irisG.add(iris); lensGroup.add(irisG);
  parts.push({ g: irisG, idx: parts.length, iris: true });

  // ---- sensor ----
  const sensor = new THREE.Mesh(new THREE.PlaneGeometry(24 * SC * 0.5, 36 * SC * 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
  sensor.rotation.y = Math.PI / 2; sensor.position.x = (zSensor - zMid) * SC;
  const sensorEdge = new THREE.LineSegments(new THREE.EdgesGeometry(sensor.geometry), new THREE.LineBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.8 }));
  sensorEdge.rotation.copy(sensor.rotation); sensorEdge.position.copy(sensor.position);
  lensGroup.add(sensor, sensorEdge);

  // ---- raios traçados (meridionais, girados em 3D) ----
  const st = { shift: 0, zSensor, stopR: stop.sd * 0.98, blades: 0, bladeRot: 0, round: 1, disp: 1 };
  const rayPos = [], rayDist = [], rayCol = [];
  const out = new Float64Array(2);
  const fields = [[0, new THREE.Color(0x9ff0c8)], [0.32, new THREE.Color(0xf3a75c)]];
  for (const [ang, col] of fields) {
    for (let rot = 0; rot < 4; rot++) {
      const phi = (rot / 4) * Math.PI;
      for (let i = 0; i < 9; i++) {
        const h = -S[0].sd * 0.95 + (S[0].sd * 1.9 * (i + 0.5)) / 9;
        const z0 = -60;
        const dy = Math.tan(ang), dz = 1, L = Math.hypot(dy, dz);
        const oy = h - dy * (0 - z0); // chega ao plano frontal na altura h
        const p = [];
        if (!O.trace(lens, st, 0, oy, z0, 0, dy / L, dz / L, 1, out, p, zSensor + 6)) continue;
        // começa a entrada perto do primeiro vidro
        const tz = (-22 - p[0]) / (p[2] - p[0]);
        p[1] = p[1] + tz * (p[3] - p[1]); p[0] = -22;
        let acc = 0;
        for (let k = 0; k < p.length - 2; k += 2) {
          const a = [p[k], p[k + 1]], b = [p[k + 2], p[k + 3]];
          const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (const [P, d] of [[a, acc], [b, acc + seg]]) {
            rayPos.push((P[0] - zMid) * SC, P[1] * SC * Math.cos(phi), P[1] * SC * Math.sin(phi));
            rayDist.push(d); rayCol.push(col.r, col.g, col.b);
          }
          acc += seg;
        }
      }
    }
  }
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(rayPos, 3));
  rayGeo.setAttribute('dist', new THREE.Float32BufferAttribute(rayDist, 1));
  rayGeo.setAttribute('color', new THREE.Float32BufferAttribute(rayCol, 3));
  const rayMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
    vertexShader: `attribute float dist; attribute vec3 color; varying float vD; varying vec3 vC;
      void main(){ vD = dist; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float uTime; uniform float uAlpha; varying float vD; varying vec3 vC;
      void main(){ float p = fract(vD*0.018 - uTime*0.35); float pulse = smoothstep(0.0,0.06,p)*smoothstep(0.22,0.06,p);
        gl_FragColor = vec4(vC*(0.22 + pulse*1.4), 1.0) * uAlpha; }`,
  });
  const rays = new THREE.LineSegments(rayGeo, rayMat);
  lensGroup.add(rays);

  // ---- fundo opaco com bokeh (é o que o vidro refrata) ----
  const bg = document.createElement('canvas'); bg.width = 2048; bg.height = 1024;
  const b = bg.getContext('2d');
  const grd = b.createLinearGradient(0, 0, 0, 1024); grd.addColorStop(0, '#07090b'); grd.addColorStop(1, '#0c0a0d');
  b.fillStyle = grd; b.fillRect(0, 0, 2048, 1024);
  const R = O.rng(5);
  b.globalCompositeOperation = 'lighter';
  const pal = ['243,167,92', '127,214,255', '159,240,200', '255,120,150'];
  for (let i = 0; i < 70; i++) {
    const x = R() * 2048, y = 150 + R() * 724, r = 10 + R() * 40, c = pal[Math.floor(R() * pal.length)];
    const a = 0.025 + R() * 0.06;
    b.beginPath();
    for (let k = 0; k <= 7; k++) { const t = (k / 7) * Math.PI * 2 + 0.3; const px = x + Math.cos(t) * r, py = y + Math.sin(t) * r; k ? b.lineTo(px, py) : b.moveTo(px, py); }
    const rg = b.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(${c},${a * 0.7})`); rg.addColorStop(0.85, `rgba(${c},${a})`); rg.addColorStop(1, `rgba(${c},${a * 1.6})`);
    b.fillStyle = rg; b.fill();
  }
  const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: bgTex }));
  backdrop.position.set(0, 0, -16);
  scene.add(backdrop);

  // ---- partículas de bokeh (foco variável) ----
  const COUNT = small ? 350 : 700;
  const pPos = new Float32Array(COUNT * 3), pCol = new Float32Array(COUNT * 3), pSeed = new Float32Array(COUNT);
  const colors = [0xf3a75c, 0x7fd6ff, 0x9ff0c8, 0xff7896, 0xffd7a0].map((c) => new THREE.Color(c));
  for (let i = 0; i < COUNT; i++) {
    pPos[i * 3] = (R() - 0.5) * 26; pPos[i * 3 + 1] = (R() - 0.5) * 13; pPos[i * 3 + 2] = -12 + R() * 17;
    const c = colors[Math.floor(R() * colors.length)]; pCol.set([c.r, c.g, c.b], i * 3); pSeed[i] = R();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('seed', new THREE.BufferAttribute(pSeed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFocus: { value: 9 }, uAp: { value: 9 }, uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uH: { value: 800 }, uAlpha: { value: 0 } },
    vertexShader: `attribute vec3 color; attribute float seed; uniform float uFocus, uAp, uTime, uPR, uH; varying vec3 vC; varying float vE; varying float vRot;
      void main(){ vec3 p = position; p.y += sin(uTime*0.25 + seed*20.)*0.15; p.x += cos(uTime*0.2 + seed*13.)*0.12;
        vec4 mv = modelViewMatrix * vec4(p,1.); float d = -mv.z;
        float coc = abs(1./d - 1./uFocus) * uAp;
        float size = (2.0 + coc * uH * 0.07) * uPR;
        gl_PointSize = clamp(size, 2., 140.);
        vE = clamp(2.6 / (1. + coc*uH*0.04), 0.03, 1.0) * (0.35 + seed*0.65);
        vC = color; vRot = seed*6.28;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uAlpha; varying vec3 vC; varying float vE; varying float vRot;
      void main(){ vec2 q = gl_PointCoord*2.-1.; float r = length(q);
        float a = atan(q.y,q.x)+vRot; float n = 7.; float seg = 6.2831853/n;
        float m = mod(a, seg) - seg*0.5; float poly = cos(3.14159/n)/cos(m);
        float rr = r/mix(poly,1.,0.55);
        if (rr>1.) discard;
        float body = 0.55 + 0.45*smoothstep(0.55,0.96,rr);
        float edge = smoothstep(1.0,0.9,rr);
        vec3 c = vC*body*edge*vE;
        gl_FragColor = vec4(c, 1.)*uAlpha; }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // ---- luzes ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.PointLight(0x9ff0c8, 30, 30); rim.position.set(-4, 2, -2); scene.add(rim);
  const warm = new THREE.PointLight(0xf3a75c, 25, 30); warm.position.set(5, -3, 2); scene.add(warm);

  // ---- layout / animação ----
  const anim = { explode: 1.6, rays: 0, particles: 0, rotY: -1.2 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollT = 0;
  window.addEventListener('pointermove', (e) => { mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5; });
  window.addEventListener('scroll', () => { scrollT = Math.min(1, window.scrollY / window.innerHeight); }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    pMat.uniforms.uH.value = h;
    // em telas largas, a lente fica à direita do texto
    const wide = w / h > 1.2;
    root.position.set(wide ? 2.9 : 0, wide ? 0.6 : 1.6, 0);
    root.scale.setScalar(wide ? 0.7 : 0.5);
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  let lastFocus = -1;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    lensGroup.rotation.y = anim.rotY + mouse.x * 0.5 + Math.sin(t * 0.2) * 0.08;
    lensGroup.rotation.x = 0.12 + mouse.y * 0.25;
    lensGroup.rotation.z = Math.sin(t * 0.15) * 0.04;
    const ex = anim.explode + scrollT * 1.2;
    parts.forEach((p, i) => { p.g.position.x = (i - parts.length / 2) * ex * 0.35; });
    sensor.position.x = sensorEdge.position.x = (zSensor - zMid) * SC + ex * 1.2;
    rays.visible = ex < 0.25;
    rayMat.uniforms.uTime.value = t;
    rayMat.uniforms.uAlpha.value = anim.rays * Math.max(0, 1 - ex * 5);
    // foco do campo de bokeh: oscila e responde ao mouse
    const focus = 6.5 + Math.sin(t * 0.35) * 2.2 + mouse.y * -3 + scrollT * 4;
    pMat.uniforms.uFocus.value = focus;
    pMat.uniforms.uTime.value = t;
    pMat.uniforms.uAlpha.value = anim.particles;
    if (onFocus && Math.abs(focus - lastFocus) > 0.05) { lastFocus = focus; onFocus(focus); }
    renderer.render(scene, camera);
  }
  frame();

  return { anim };
}
