import * as O from './optics.js';
import { t as tr } from './i18n.js';

// ---------------------------------------------------------------------------
// Componente de divisória (wipe) genérico
// ---------------------------------------------------------------------------
export function bindWipe(el, onMove) {
  let dragging = false;
  const set = (clientX) => {
    const r = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    el.style.setProperty('--x', x + '%');
    el._x = x;
    onMove && onMove(x);
  };
  el.addEventListener('pointerdown', (e) => { dragging = true; el.setPointerCapture(e.pointerId); set(e.clientX); });
  el.addEventListener('pointermove', (e) => { if (dragging) set(e.clientX); });
  el.addEventListener('pointerup', () => { dragging = false; });
  el.addEventListener('pointercancel', () => { dragging = false; });
  el._setX = (x) => { el.style.setProperty('--x', x + '%'); el._x = x; onMove && onMove(x); };
  el._setX(50);
  if (!el.querySelector('.wipe-handle')) {
    const h = document.createElement('div');
    h.className = 'wipe-handle'; h.innerHTML = '<span>↔</span>';
    el.appendChild(h);
  }
}

// Wipes com renders reais (imagem com painéis lado a lado)
export function initImageWipes() {
  document.querySelectorAll('.wipe.img').forEach((el) => {
    const src = el.dataset.src, tiles = +el.dataset.tiles, a = +el.dataset.a, b = +el.dataset.b;
    const crop = +(el.dataset.crop || 0); // px de cabeçalho a manter (rótulos)
    const img = new Image();
    img.onload = () => {
      const pw = img.naturalWidth / tiles, ph = img.naturalHeight;
      el.style.aspectRatio = `${pw} / ${ph}`;
      for (const [cls, idx] of [['a', a], ['b', b]]) {
        const d = document.createElement('div');
        d.className = 'layer ' + cls;
        d.style.backgroundImage = `url(${src})`;
        d.style.backgroundSize = `${tiles * 100}% 100%`;
        d.style.backgroundPosition = `${tiles > 1 ? (idx / (tiles - 1)) * 100 : 0}% 0`;
        el.prepend(d);
      }
      // a camada b precisa ficar por cima
      el.appendChild(el.querySelector('.layer.b'));
      el.appendChild(el.querySelector('.wipe-handle'));
      void crop;
    };
    img.src = src;
    bindWipe(el);
  });
}

// ---------------------------------------------------------------------------
// Cena principal: blur gaussiano × desfoque óptico calculado
// ---------------------------------------------------------------------------
const W = 1280, H = 720;
const SENSOR_W = 36;
const PXMM = W / SENSOR_W;
const COLORS = {
  amber: [1.0, 0.62, 0.28],
  warm: [1.0, 0.82, 0.55],
  cyan: [0.45, 0.85, 1.0],
  teal: [0.45, 1.0, 0.8],
  rose: [1.0, 0.45, 0.6],
};

function makeLights() {
  const R = O.rng(7);
  const L = [];
  const keys = Object.keys(COLORS);
  // fios de luz (curvas) + luzes soltas, em duas profundidades
  for (let s = 0; s < 3; s++) {
    const y0 = H * (0.18 + R() * 0.5), amp = 40 + R() * 90, ph = R() * 6;
    const col = keys[Math.floor(R() * keys.length)];
    const layer = s % 2;
    for (let i = 0; i < 13; i++) {
      const x = (i / 12) * W * 1.05 - 20 + R() * 20;
      L.push({ x, y: y0 + Math.sin(x / 220 + ph) * amp + R() * 10, layer, col, I: 0.35 + R() * 0.55 });
    }
  }
  for (let i = 0; i < 24; i++) {
    L.push({ x: R() * W, y: R() * H * 0.95, layer: R() < 0.5 ? 0 : 1, col: keys[Math.floor(R() * keys.length)], I: 0.35 + R() * R() * 1.6 });
  }
  // alguns highlights muito fortes (HDR)
  L.push({ x: W * 0.38, y: H * 0.3, layer: 0, col: 'warm', I: 2.6, hero: 'hdr' });
  L.push({ x: W * 0.95, y: H * 0.08, layer: 0, col: 'cyan', I: 1.8, hero: 'cat' });
  L.push({ x: W * 0.07, y: H * 0.86, layer: 1, col: 'amber', I: 1.8, hero: 'cat2' });
  L.push({ x: W * 0.66, y: H * 0.56, layer: 0, col: 'teal', I: 1.6, hero: 'blade' });
  return L;
}

function drawBase(ctx, blurPx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b1020'); g.addColorStop(0.55, '#141026'); g.addColorStop(1, '#1d0f17');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (blurPx) ctx.filter = `blur(${blurPx}px)`;
  const R = O.rng(3);
  for (let i = 0; i < 12; i++) {
    const x = R() * W, y = R() * H, r = 120 + R() * 260;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = i % 3 === 0 ? '60,120,170' : i % 3 === 1 ? '170,90,50' : '90,60,140';
    rg.addColorStop(0, `rgba(${c},.28)`); rg.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  // silhuetas distantes (prédios/árvores) para dar estrutura ao fundo
  ctx.fillStyle = 'rgba(4,6,10,.75)';
  for (let i = 0; i < 9; i++) {
    const x = R() * W, w = 60 + R() * 160, h = 120 + R() * 280;
    ctx.fillRect(x, H - h, w, h);
  }
  ctx.restore();
}

function drawDots(ctx, lights) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const c = COLORS[l.col];
    const v = (k) => Math.min(255, Math.round(255 * c[k] * Math.min(1, l.I * 1.4)));
    ctx.fillStyle = `rgb(${v(0)},${v(1)},${v(2)})`;
    ctx.beginPath(); ctx.arc(l.x, l.y, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${v(0)},${v(1)},${v(2)},.25)`;
    ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Galho em foco, nítido nos dois lados
function drawBranch(ctx) {
  const R = O.rng(11);
  ctx.save();
  ctx.lineCap = 'round';
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    pts.push([W * (1.02 - t * 0.62), H * (0.98 - t * 0.38) + Math.sin(t * 5) * 30]);
  }
  ctx.strokeStyle = '#0a0806';
  for (let i = 0; i < pts.length - 1; i++) {
    ctx.lineWidth = 16 * (1 - i / pts.length) + 3;
    ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke();
  }
  // borda iluminada
  ctx.strokeStyle = 'rgba(255,190,130,.35)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 7 * (1 - i / 60)) : ctx.moveTo(p[0], p[1] - 7)));
  ctx.stroke();
  // folhas
  for (let i = 4; i < pts.length; i += 3) {
    for (const side of [-1, 1]) {
      const [x, y] = pts[i];
      const len = 30 + R() * 34, ang = -Math.PI / 2 + side * (0.6 + R() * 0.7) + (R() - 0.5) * 0.4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, -6, 0, 6);
      g.addColorStop(0, '#1d3a2a'); g.addColorStop(1, '#07120c');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
      ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(159,240,200,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); ctx.stroke();
      ctx.restore();
    }
  }
  // pequenas luzes no galho (em foco = pontos nítidos)
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 6; i < pts.length; i += 7) {
    const [x, y] = pts[i];
    const rg = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 9);
    rg.addColorStop(0, 'rgba(255,240,210,1)'); rg.addColorStop(0.3, 'rgba(255,190,120,.6)'); rg.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y - 10, 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return pts;
}

function buildKernels(N) {
  const lens = O.buildLens('dgauss');
  const info = O.lensInfo(lens);
  const zS = lens.S[lens.S.length - 1].z + info.bfdInf;
  const focus = 550;
  const e = O.solveExtension(lens, zS, focus);
  const fstop = 2.4;
  const stopR = (info.efl / (2 * fstop)) * Math.abs(info.yStop);
  const st = { shift: -e, zSensor: zS, stopR, blades: 7, bladeRot: 0.2, round: 0.35, disp: 2.2 };
  const layersD = [5000, 15000];
  const radii = [0, 4, 8, 12, 15, 18, 21];
  const out = [];
  for (const D of layersD) {
    const row = [];
    let ref = 0;
    for (const r of radii) {
      const sp = O.spot(lens, st, info, D, r, N);
      if (r === 0) ref = sp.w * sp.count;
      const K = O.rasterKernel(sp, PXMM, 300);
      row.push({ r, K, sp, e0: sp.w / ref });
    }
    out.push(row);
  }
  return { out, radii, fstop };
}

function drawOptical(ctx, lights, kern) {
  const cache = new Map();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const dx = (l.x - W / 2) / PXMM, dy = (l.y - H / 2) / PXMM;
    const r = Math.hypot(dx, dy);
    const row = kern.out[l.layer];
    let bi = 0; for (let i = 1; i < row.length; i++) if (Math.abs(row[i].r - r) < Math.abs(row[bi].r - r)) bi = i;
    const key = l.layer + ':' + bi + ':' + l.col;
    let cv = cache.get(key);
    if (!cv) {
      const k = row[bi];
      cv = O.kernelCanvas(k.K, COLORS[l.col], k.e0 * 255 * 1700, null);
      cv._k = k; cache.set(key, cv);
    }
    const phi = Math.atan2(dy, dx);
    const k = cv._k;
    const s = k.K.upscale;
    let a = l.I;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(r < 0.5 ? 0 : phi - Math.PI / 2);
    while (a > 0.001) {
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(cv, -k.K.half * s, -k.K.half * s, k.K.size * s, k.K.size * s);
      a -= 1;
    }
    ctx.restore();
  }
  ctx.restore();
}

export function initMainWipe() {
  const el = document.getElementById('wipe-main');
  const cl = document.getElementById('wipe-left');
  const cr = document.getElementById('wipe-right');
  const tagL = document.getElementById('wipe-tag-left');
  const pinsEl = document.getElementById('pins');
  for (const c of [cl, cr]) { c.width = W; c.height = H; }
  const lights = makeLights();
  let pins = [];
  bindWipe(el, (x) => pins.forEach((p) => p.el.classList.toggle('hidden', p.x < x + 1)));

  const offGauss = document.createElement('canvas'); offGauss.width = W; offGauss.height = H;
  const offInput = document.createElement('canvas'); offInput.width = W; offInput.height = H;

  const run = () => {
    const kern = buildKernels(3600);
    // óptico
    const c = cr.getContext('2d');
    drawBase(c, 38);
    drawOptical(c, lights, kern);
    drawBranch(c);
    // gaussiano: imagem LDR (já clipada) borrada depois
    const g = offGauss.getContext('2d');
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const t = tmp.getContext('2d');
    drawBase(t, 0); drawDots(t, lights);
    g.filter = 'blur(26px)'; g.drawImage(tmp, -40, -40, W + 80, H + 80); g.filter = 'none';
    drawBranch(g);
    // entrada nítida
    const i = offInput.getContext('2d');
    drawBase(i, 0); drawDots(i, lights); drawBranch(i);
    setMode('gauss');
    document.getElementById('wipe-loading').classList.add('done');
    el.querySelector('.wipe-tag.right').textContent = `${tr('optical')} · Double-Gauss f/${kern.fstop}`;

    // pinos explicativos
    const defs = [
      ['hdr', tr('pinHdr')],
      ['cat', tr('pinCat')],
      ['blade', tr('pinBlade')],
      ['cat2', tr('pinCA')],
    ];
    pins = defs.map(([id, txt]) => {
      const l = lights.find((q) => q.hero === id);
      const p = document.createElement('div');
      const x = (l.x / W) * 100, y = (l.y / H) * 100;
      p.className = 'pin' + (x > 70 ? ' flip' : '');
      p.style.left = Math.min(97, Math.max(3, x)) + '%'; p.style.top = Math.min(94, Math.max(6, y)) + '%';
      p.innerHTML = `<i></i><span>${txt}</span>`;
      pinsEl.appendChild(p);
      return { el: p, x };
    });
    const fp = document.createElement('div');
    fp.className = 'pin'; fp.style.left = '62%'; fp.style.top = '78%';
    fp.innerHTML = `<i></i><span>${tr('pinFocus')}</span>`;
    pinsEl.appendChild(fp); pins.push({ el: fp, x: 62 });
    el._setX(el._x);
    el.dispatchEvent(new CustomEvent('ready'));
  };

  function setMode(m) {
    const ctx = cl.getContext('2d');
    ctx.drawImage(m === 'gauss' ? offGauss : offInput, 0, 0);
    tagL.textContent = m === 'gauss' ? tr('gauss') : tr('input');
  }
  document.querySelectorAll('.wipe-tabs .tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.wipe-tabs .tab').forEach((x) => x.classList.toggle('active', x === b));
    setMode(b.dataset.mode);
  }));

  // calcula quando a seção se aproxima da tela
  const io = new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(run, 30); }
  }, { rootMargin: '600px' });
  io.observe(el);
  return el;
}
