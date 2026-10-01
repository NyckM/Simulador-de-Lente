import * as O from './optics.js';

// ---------------------------------------------------------------------------
// Laboratório interativo de lentes
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const SCENE_W = 720, SCENE_H = 480, SCENE_PXMM = SCENE_W / 36;
const FAR_COL = [[1, 0.66, 0.32], [1, 0.84, 0.6], [0.5, 0.85, 1], [1, 0.5, 0.62]];
const NEAR_COL = [[0.5, 1, 0.82], [0.55, 0.8, 1]];

const state = {
  key: 'dgauss', lens: null, base: null, info: null, zS: 0, e: 0,
  fstop: 2, focus: 800, bg: 6000, near: 380, field: 14,
  blades: 7, round: 0.25, disp: 1, src: 'focus', sel: 0,
};

let view = null; // transformação do desenho
let dpr = 1;
let xsec, xctx, scene, sctx;
let pending = 0, quality = 'hi';
let lastSpot = null;

const lerp = (a, b, t) => a + (b - a) * t;
const logMap = (t, a, b) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const invLog = (v, a, b) => (Math.log(v) - Math.log(a)) / (Math.log(b) - Math.log(a));
const fmtDist = (mm) => !isFinite(mm) || mm >= 5e8 ? '∞' : mm >= 10000 ? (mm / 1000).toFixed(0) + ' m' : (mm / 1000).toFixed(2).replace('.', ',') + ' m';

function stopRfromF(f) {
  const s = state.info.stop;
  if (!s) return Infinity;
  return Math.min(s.sd, (state.info.efl / (2 * f)) * Math.abs(state.info.yStop));
}
function st() {
  return {
    shift: -state.e, zSensor: state.zS, stopR: stopRfromF(state.fstop),
    blades: state.blades, bladeRot: 0.3, round: state.round, disp: state.disp,
  };
}

function loadPreset(key) {
  state.key = key;
  state.base = O.buildLens(key);
  state.lens = O.cloneLens(state.base);
  state.info = O.lensInfo(state.lens);
  state.zS = state.lens.S[state.lens.S.length - 1].z + state.info.bfdInf;
  state.blades = state.base.blades;
  state.fstop = Math.max(state.info.fMin, state.fstop);
  state.sel = 0;
  state.e = O.solveExtension(state.lens, state.zS, state.focus) ?? 0;
  view = null;
  $('lens-note').textContent = O.PRESETS[key].note;
  syncControls(); fillSurfaceSelect(); fillEditor();
  update(true);
}

// ---------------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------------
function setRangeFill(inp) {
  const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
  inp.style.setProperty('--p', p + '%');
}
function syncControls() {
  const fmin = state.info.fMin;
  $('c-fstop').value = invLog(state.fstop, fmin, 22);
  $('o-fstop').textContent = 'f/' + state.fstop.toFixed(1);
  $('c-focus').value = invLog(state.focus, 300, 50000);
  $('o-focus').textContent = fmtDist(state.focus);
  $('c-bg').value = invLog(state.bg, 1500, 100000);
  $('o-bg').textContent = fmtDist(state.bg);
  $('c-field').value = state.field; $('o-field').textContent = state.field.toFixed(1) + ' mm';
  $('c-blades').value = state.blades; $('o-blades').textContent = state.blades < 3 ? 'circular' : state.blades;
  $('c-round').value = state.round; $('o-round').textContent = Math.round(state.round * 100) + '%';
  $('c-disp').value = state.disp; $('o-disp').textContent = state.disp.toFixed(1) + '×';
  document.querySelectorAll('.controls input[type=range]').forEach(setRangeFill);
}

function bindControls() {
  const on = (id, fn) => $(id).addEventListener('input', (e) => { fn(+e.target.value); syncControls(); quality = 'lo'; update(); hiSoon(); });
  on('c-fstop', (v) => { state.fstop = logMap(v, state.info.fMin, 22); });
  on('c-focus', (v) => {
    state.focus = logMap(v, 300, 50000);
    const e = O.solveExtension(state.lens, state.zS, state.focus);
    if (e != null) state.e = e;
  });
  on('c-bg', (v) => { state.bg = logMap(v, 1500, 100000); });
  on('c-field', (v) => { state.field = v; });
  on('c-blades', (v) => { state.blades = v; });
  on('c-round', (v) => { state.round = v; });
  on('c-disp', (v) => { state.disp = v; });
  $('c-src').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    state.src = b.dataset.v;
    $('c-src').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    drawXsec();
  });
  const pre = $('lab-presets');
  for (const k of Object.keys(O.PRESETS)) {
    const b = document.createElement('button');
    b.textContent = O.PRESETS[k].name; b.dataset.k = k;
    b.onclick = () => { pre.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); loadPreset(k); };
    if (k === state.key) b.classList.add('on');
    pre.appendChild(b);
  }
  $('e-surf').addEventListener('change', (e) => { state.sel = +e.target.value; fillEditor(); drawXsec(); });
  for (const id of ['e-R', 'e-t', 'e-d', 'e-n', 'e-V']) $(id).addEventListener('change', applyEditor);
  $('e-autofocus').onclick = () => {
    const e = O.solveExtension(state.lens, state.zS, state.focus);
    if (e != null && Math.abs(e) < 60) state.e = e;
    update(true);
  };
  $('e-reset').onclick = () => { state.lens = O.cloneLens(state.base); recompute(); state.e = O.solveExtension(state.lens, state.zS, state.focus) ?? 0; fillSurfaceSelect(); fillEditor(); update(true); };
}

let hiTimer = 0;
function hiSoon() { clearTimeout(hiTimer); hiTimer = setTimeout(() => { quality = 'hi'; update(); }, 180); }

function fillSurfaceSelect() {
  const sel = $('e-surf'); sel.innerHTML = '';
  state.lens.S.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = s.stop ? `${i + 1} · diafragma` : `${i + 1} · R ${s.R ? s.R.toFixed(2) : '∞'} mm`;
    sel.appendChild(o);
  });
  sel.value = state.sel;
}
function fillEditor() {
  const S = state.lens.S, s = S[state.sel];
  const next = S[state.sel + 1];
  $('e-R').value = s.stop ? '' : +s.R.toFixed(4);
  $('e-R').disabled = s.stop;
  $('e-t').value = next ? +(next.z - s.z).toFixed(4) : '';
  $('e-t').disabled = !next;
  $('e-d').value = +(s.sd * 2).toFixed(3);
  $('e-n').value = s.stop ? '' : s.n; $('e-n').disabled = s.stop;
  $('e-V').value = s.n > 1 ? s.V : ''; $('e-V').disabled = s.stop || s.n <= 1;
  $('e-surf').value = state.sel;
}
function applyEditor() {
  const S = state.lens.S, i = state.sel, s = S[i];
  const backup = state.lens.S.map((q) => ({ ...q }));
  if (!s.stop) {
    const R = parseFloat($('e-R').value); if (isFinite(R)) s.R = Math.abs(R) < 1e-3 ? 0 : R;
    const n = parseFloat($('e-n').value); if (isFinite(n) && n >= 1 && n < 2.5) s.n = n;
    const V = parseFloat($('e-V').value); if (isFinite(V) && V > 5) s.V = V;
    if (s.n > 1 && !s.V) s.V = 50;
  }
  const d = parseFloat($('e-d').value); if (isFinite(d) && d > 1) s.sd = d / 2;
  const t = parseFloat($('e-t').value);
  if (isFinite(t) && S[i + 1]) {
    const dz = t - (S[i + 1].z - s.z);
    for (let k = i + 1; k < S.length; k++) S[k].z += dz;
  }
  if (!valid(state.lens)) { state.lens.S = backup; flash('Geometria inválida: superfícies se cruzariam.'); }
  recompute(); fillSurfaceSelect(); fillEditor(); update(true);
}

function recompute() {
  const stopOld = state.info?.stop;
  state.info = O.lensInfo(state.lens);
  if (state.fstop < state.info.fMin) state.fstop = state.info.fMin;
  void stopOld;
  syncControls();
}

let flashT = 0;
function flash(msg) { $('xsec-msg').textContent = msg; clearTimeout(flashT); flashT = setTimeout(() => updateMsg(), 2200); }

// ---------------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------------
function sag(s, y) {
  if (!s.R) return 0;
  const R = s.R, q = R * R - y * y;
  if (q < 0) return NaN;
  return R - Math.sign(R) * Math.sqrt(q);
}
function valid(lens) {
  const S = lens.S;
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i], b = S[i + 1];
    const ym = Math.min(a.sd, b.sd);
    if (a.R && Math.abs(a.R) < a.sd * 1.01) return false;
    const glass = !a.stop && a.n > 1;
    for (const f of [0, 0.5, 0.85, 1]) {
      const y = ym * f;
      const za = a.z + (a.stop ? 0 : sag(a, y)), zb = b.z + (b.stop ? 0 : sag(b, y));
      if (!isFinite(za) || !isFinite(zb)) return false;
      if (zb - za < (glass ? 0.25 : 0.02)) return false;
    }
  }
  const L = S[S.length - 1];
  if (L.R && Math.abs(L.R) < L.sd * 1.01) return false;
  return true;
}

// elementos de vidro: sequências contíguas de superfícies com vidro entre elas
function elements(lens) {
  const S = lens.S, els = [];
  let i = 0;
  while (i < S.length) {
    if (S[i].stop) { els.push({ a: i, b: i, stop: true }); i++; continue; }
    if (S[i].n > 1) {
      let j = i; while (j < S.length - 1 && S[j].n > 1) j++;
      els.push({ a: i, b: j });
      i = j + 1;
    } else i++;
  }
  return els;
}

// ---------------------------------------------------------------------------
// Desenho do corte (cross-section)
// ---------------------------------------------------------------------------
function makeView() {
  const S = state.lens.S;
  const ymax = Math.max(...S.map((s) => s.sd)) * 1.35;
  const z0 = -state.e - 14, z1 = state.zS + 8;
  const W = xsec.width / dpr, H = xsec.height / dpr;
  const plotH = H - 70; // espaço para a barra de foco e a lupa
  const k = Math.min((W - 30) / (z1 - z0), plotH / (2 * ymax));
  view = { k, ox: 15 - z0 * k + ((W - 30) - (z1 - z0) * k) / 2, oy: 18 + plotH / 2, z0, z1, ymax, W, H };
}
const sx = (z) => view.ox + z * view.k;
const sy = (y) => view.oy - y * view.k;

function surfPts(s, shift, ymax) {
  const pts = [];
  const lim = ymax ?? s.sd;
  for (let i = 0; i <= 32; i++) {
    const y = -lim + (2 * lim * i) / 32;
    pts.push([s.z + shift + sag(s, y), y]);
  }
  return pts;
}

let fansCache = null;
function computeFans() {
  const S = state.lens.S, s = st();
  const out = new Float64Array(2);
  const res = [];
  const D = state.src === 'focus' ? state.focus : state.src === 'bg' ? state.bg : 1e9;
  const z0 = state.zS - D;
  const zf = -state.e;
  const zEnd = view.z1;
  for (const [field, color] of [[0, 'mint'], [state.field, 'amber']]) {
    const tanT = field / state.info.efl;
    const oy = (D - state.zS) * tanT;
    const R0 = S[0].sd * 1.15;
    // varredura: quais alturas no plano frontal passam?
    const ok = [];
    for (let i = 0; i <= 240; i++) {
      const ty = -R0 + (2 * R0 * i) / 240;
      let dy = ty - oy, dz = zf - z0; const L = Math.hypot(dy, dz); dy /= L; dz /= L;
      if (O.trace(state.lens, s, 0, oy, z0, 0, dy, dz, 1, out)) ok.push(ty);
    }
    if (!ok.length) { res.push({ color, paths: [] }); continue; }
    const lo = ok[0], hi = ok[ok.length - 1];
    const n = 13, paths = [];
    for (let i = 0; i < n; i++) {
      const ty = lerp(lo, hi, (i + 0.5) / n);
      let dy = ty - oy, dz = zf - z0; const L = Math.hypot(dy, dz); dy /= L; dz /= L;
      const p = [];
      if (O.trace(state.lens, s, 0, oy, z0, 0, dy, dz, 1, out, p, zEnd)) {
        // começa na borda esquerda da vista
        if (p[0] < view.z0) {
          const t = (view.z0 - p[0]) / (p[2] - p[0]);
          p[0] = view.z0; p[1] = p[1] + t * (p[3] - p[1]);
        }
        paths.push(p);
      }
    }
    res.push({ color, paths });
  }
  fansCache = res;
  return res;
}

function drawXsec() {
  if (!view) makeView();
  const c = xctx, W = view.W, H = view.H;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  // eixo
  c.strokeStyle = 'rgba(220,255,235,.12)'; c.setLineDash([3, 5]);
  c.beginPath(); c.moveTo(0, sy(0)); c.lineTo(W, sy(0)); c.stroke(); c.setLineDash([]);

  const S = state.lens.S, shift = -state.e;
  const els = elements(state.lens);

  // raios
  const fans = computeFans();
  c.globalCompositeOperation = 'lighter';
  for (const f of fans) {
    c.strokeStyle = f.color === 'mint' ? 'rgba(159,240,200,.55)' : 'rgba(243,167,92,.5)';
    c.lineWidth = 1;
    for (const p of f.paths) {
      c.beginPath(); c.moveTo(sx(p[0]), sy(p[1]));
      for (let i = 2; i < p.length; i += 2) c.lineTo(sx(p[i]), sy(p[i + 1]));
      c.stroke();
    }
  }
  c.globalCompositeOperation = 'source-over';

  // vidros
  for (const el of els) {
    if (el.stop) continue;
    for (let i = el.a; i < el.b; i++) {
      const A = S[i], B = S[i + 1];
      const ym = Math.min(A.sd, B.sd);
      const pa = surfPts(A, shift, ym), pb = surfPts(B, shift, ym).reverse();
      c.beginPath();
      [...pa, ...pb].forEach(([z, y], k) => (k ? c.lineTo(sx(z), sy(y)) : c.moveTo(sx(z), sy(y))));
      c.closePath();
      const selEl = state.sel >= el.a && state.sel <= el.b;
      const hue = Math.min(1, (A.n - 1.45) / 0.35);
      c.fillStyle = `rgba(${Math.round(lerp(140, 120, hue))},${Math.round(lerp(230, 180, hue))},${Math.round(lerp(200, 255, hue))},${selEl ? 0.2 : 0.1})`;
      c.fill();
    }
    // bordas e contornos
    for (let i = el.a; i <= el.b; i++) {
      const s = S[i];
      const isSel = i === state.sel;
      c.strokeStyle = isSel ? '#ffffff' : 'rgba(200,245,225,.75)';
      c.lineWidth = isSel ? 1.8 : 1.1;
      const pts = surfPts(s, shift);
      c.beginPath(); pts.forEach(([z, y], k) => (k ? c.lineTo(sx(z), sy(y)) : c.moveTo(sx(z), sy(y)))); c.stroke();
    }
    for (let i = el.a; i < el.b; i++) {
      const A = S[i], B = S[i + 1];
      for (const sg of [1, -1]) {
        const ya = A.sd * sg, yb = B.sd * sg, ym = Math.min(A.sd, B.sd) * sg;
        c.strokeStyle = 'rgba(200,245,225,.5)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(A.z + shift + sag(A, ya)), sy(ya));
        c.lineTo(sx(A.z + shift + sag(A, ym)), sy(ym));
        c.lineTo(sx(B.z + shift + sag(B, ym)), sy(ym));
        c.lineTo(sx(B.z + shift + sag(B, yb)), sy(yb));
        c.stroke();
      }
    }
  }
  // diafragma
  const stop = state.info.stop;
  if (stop) {
    const r = stopRfromF(state.fstop);
    const z = sx(stop.z + shift);
    c.strokeStyle = '#ff8a3d'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(z, sy(r)); c.lineTo(z, sy(stop.sd * 1.25)); c.moveTo(z, sy(-r)); c.lineTo(z, sy(-stop.sd * 1.25)); c.stroke();
    for (const y of [r, -r]) handle(z, sy(y), '#ff8a3d');
  }
  // alças de curvatura
  S.forEach((s, i) => {
    if (s.stop) return;
    const z = s.z + shift + sag(s, s.sd);
    handle(sx(z), sy(s.sd), i === state.sel ? '#ffffff' : '#6fb9ff', 4.5);
  });
  // sensor
  const zs = sx(state.zS);
  c.strokeStyle = '#ff8a3d'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(zs, sy(view.ymax * 0.85)); c.lineTo(zs, sy(-view.ymax * 0.85)); c.stroke();
  c.fillStyle = '#ff8a3d'; c.font = '10px JetBrains Mono, monospace'; c.fillText('SENSOR', zs - 18, sy(-view.ymax * 0.85) + 14);
  // foco paraxial
  const D = state.src === 'focus' ? state.focus : state.src === 'bg' ? state.bg : 1e9;
  const pz = paraxialImageZ(D);
  if (isFinite(pz) && pz > view.z0 && pz < view.z1 + 20) {
    c.strokeStyle = 'rgba(111,185,255,.8)'; c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(sx(pz), sy(view.ymax * 0.45)); c.lineTo(sx(pz), sy(-view.ymax * 0.45)); c.stroke(); c.setLineDash([]);
  }
  // barra de foco
  const zfirst = S[0].z + shift, zlast = S[S.length - 1].z + shift;
  const by = view.H - 36;
  view.bar = { x0: sx(zfirst), x1: sx(zlast), y: by };
  c.fillStyle = 'rgba(159,240,200,.1)'; c.strokeStyle = 'rgba(159,240,200,.5)'; c.lineWidth = 1;
  roundRect(c, sx(zfirst), by - 11, sx(zlast) - sx(zfirst), 22, 6); c.fill(); c.stroke();
  c.fillStyle = '#9ff0c8'; c.font = '11px Inter Tight, sans-serif'; c.textAlign = 'center';
  c.fillText('↔ arraste para focar', (sx(zfirst) + sx(zlast)) / 2, by + 4); c.textAlign = 'left';
  // escala
  c.fillStyle = 'rgba(220,255,235,.35)'; c.font = '10px JetBrains Mono, monospace';
  c.fillRect(W - 80, H - 12, 10 * view.k, 1.5); c.fillText('10 mm', W - 80, H - 16);

  drawLoupe(fans);
  updateMsg();
}

function paraxialImageZ(D) {
  const zl = state.lens.S[state.lens.S.length - 1].z - state.e;
  const Dfirst = D - state.zS - state.e;
  const p = O.paraxial(state.lens, D > 5e8 ? Infinity : Dfirst);
  return zl + p.bfd;
}

// lupa: região perto do sensor ampliada
function drawLoupe(fans) {
  if (view.W < 480) return;
  const c = xctx;
  const w = Math.min(190, view.W * 0.3), h = 92;
  const x0 = view.W - w - 10, y0 = 28;
  c.save();
  c.fillStyle = 'rgba(5,7,6,.92)'; c.strokeStyle = 'rgba(220,255,235,.15)';
  roundRect(c, x0, y0, w, h, 8); c.fill(); c.stroke();
  c.beginPath(); roundRect(c, x0, y0, w, h, 8); c.clip();
  const zc = state.zS, span = 3.0; // ±3 mm
  let ys = 0.02;
  for (const f of fans) for (const p of f.paths) {
    const n = p.length; const za = p[n - 4], ya = p[n - 3], zb = p[n - 2], yb = p[n - 1];
    const t = (zc - za) / (zb - za); const yy = ya + t * (yb - ya);
    const yc = f.color === 'mint' ? 0 : null;
    if (yc !== null) ys = Math.max(ys, Math.abs(yy));
  }
  const kz = w / (2 * span), ky = (h * 0.42) / Math.max(ys * 2.5, 0.05);
  const LX = (z) => x0 + w / 2 + (z - zc) * kz, LY = (y) => y0 + h / 2 - y * ky;
  c.globalCompositeOperation = 'lighter';
  const f = fans[0];
  c.strokeStyle = 'rgba(159,240,200,.6)'; c.lineWidth = 1;
  for (const p of f.paths) {
    const n = p.length; const za = p[n - 4], ya = p[n - 3], zb = p[n - 2], yb = p[n - 1];
    const sl = (yb - ya) / (zb - za);
    const yAt = (z) => ya + (z - za) * sl;
    c.beginPath(); c.moveTo(LX(zc - span), LY(yAt(zc - span))); c.lineTo(LX(zc + span), LY(yAt(zc + span))); c.stroke();
  }
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = '#ff8a3d'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(LX(zc), y0 + 8); c.lineTo(LX(zc), y0 + h - 8); c.stroke();
  const D = state.src === 'focus' ? state.focus : state.src === 'bg' ? state.bg : 1e9;
  const pz = paraxialImageZ(D);
  if (isFinite(pz) && Math.abs(pz - zc) < span) {
    c.strokeStyle = 'rgba(111,185,255,.9)'; c.setLineDash([2, 3]);
    c.beginPath(); c.moveTo(LX(pz), y0 + 8); c.lineTo(LX(pz), y0 + h - 8); c.stroke(); c.setLineDash([]);
  }
  c.fillStyle = 'rgba(220,255,235,.45)'; c.font = '9px JetBrains Mono, monospace';
  c.fillText('PERTO DO SENSOR · ±3 mm', x0 + 8, y0 + 12);
  c.restore();
}

function handle(x, y, col, r = 5) {
  xctx.fillStyle = col; xctx.strokeStyle = '#070908'; xctx.lineWidth = 2;
  xctx.beginPath(); xctx.arc(x, y, r, 0, Math.PI * 2); xctx.fill(); xctx.stroke();
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function updateMsg() {
  const D = state.src === 'focus' ? state.focus : state.src === 'bg' ? state.bg : 1e9;
  const pz = paraxialImageZ(D);
  const d = pz - state.zS;
  let txt = '';
  if (!isFinite(pz)) txt = 'Sem imagem real: a lente não converge esse ponto.';
  else if (Math.abs(d) < 0.02) txt = 'Foco paraxial no sensor.';
  else txt = `Foco paraxial ${Math.abs(d).toFixed(2).replace('.', ',')} mm ${d < 0 ? 'antes' : 'depois'} do sensor · extensão ${state.e.toFixed(2).replace('.', ',')} mm`;
  $('xsec-msg').textContent = txt;
}

// ---------------------------------------------------------------------------
// Interação com o desenho
// ---------------------------------------------------------------------------
function bindXsec() {
  let drag = null;
  const pos = (e) => { const r = xsec.getBoundingClientRect(); return [(e.clientX - r.left) * (view.W / r.width), (e.clientY - r.top) * (view.H / r.height)]; };
  const hit = (x, y) => {
    const S = state.lens.S, shift = -state.e;
    const stop = state.info.stop;
    if (stop) {
      const r = stopRfromF(state.fstop), z = sx(stop.z + shift);
      for (const yy of [r, -r]) if (Math.hypot(x - z, y - sy(yy)) < 11) return { type: 'iris' };
    }
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (s.stop) continue;
      const z = sx(s.z + shift + sag(s, s.sd));
      if (Math.hypot(x - z, y - sy(s.sd)) < 10) return { type: 'curv', i };
    }
    const b = view.bar;
    if (b && x > b.x0 - 6 && x < b.x1 + 6 && Math.abs(y - b.y) < 14) return { type: 'focus' };
    // corpo de um elemento (ou o diafragma)
    const zw = (x - view.ox) / view.k, yw = (view.oy - y) / view.k;
    for (const el of elements(state.lens)) {
      const A = S[el.a], B = S[el.b];
      if (el.stop) {
        if (Math.abs(x - sx(A.z + shift)) < 6 && Math.abs(yw) > stopRfromF(state.fstop) && Math.abs(yw) < A.sd * 1.3) return { type: 'move', el };
        continue;
      }
      const ym = Math.min(A.sd, B.sd);
      if (Math.abs(yw) > ym) continue;
      const za = A.z + shift + sag(A, yw), zb = B.z + shift + sag(B, yw);
      if (zw >= za - 0.3 && zw <= zb + 0.3) return { type: 'move', el };
    }
    // seleção de superfície por proximidade
    let best = null, bd = 8;
    S.forEach((s, i) => {
      if (Math.abs(yw) > s.sd) return;
      const z = sx(s.z + shift + (s.stop ? 0 : sag(s, yw)));
      if (Math.abs(z - x) < bd) { bd = Math.abs(z - x); best = i; }
    });
    if (best !== null) return { type: 'select', i: best };
    return null;
  };
  xsec.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (!drag) {
      const h = hit(x, y);
      xsec.style.cursor = !h ? 'default' : h.type === 'curv' || h.type === 'iris' ? 'ns-resize' : h.type === 'select' ? 'pointer' : 'ew-resize';
      return;
    }
    const dx = (x - drag.x) / view.k, dy = (y - drag.y) / view.k;
    const L = state.lens, S = L.S;
    if (drag.type === 'focus') {
      state.e = Math.max(-6, Math.min(40, drag.e0 - dx));
      let f = O.focusFromExtension(L, state.zS, state.e);
      if (isNaN(f)) f = 300;
      state.focus = Math.max(300, Math.min(1e9, f));
      syncControls();
    } else if (drag.type === 'move') {
      const prev = S.map((s) => s.z);
      for (let i = drag.el.a; i <= drag.el.b; i++) S[i].z = drag.z0[i - drag.el.a] + dx;
      if (!valid(L)) S.forEach((s, i) => (s.z = prev[i]));
      recompute();
    } else if (drag.type === 'curv') {
      const s = S[drag.i];
      const prevR = s.R;
      let cv = drag.c0 - dy * 0.0035; // arrastar para cima = mais curvo para a esquerda
      const lim = 1 / (s.sd * 1.03);
      cv = Math.max(-lim, Math.min(lim, cv));
      s.R = Math.abs(cv) < 0.0015 ? 0 : 1 / cv;
      if (!valid(L)) s.R = prevR;
      recompute();
    } else if (drag.type === 'iris') {
      const stop = state.info.stop;
      const r = Math.max(0.3, Math.min(stop.sd, Math.abs((view.oy - y) / view.k)));
      state.fstop = Math.max(state.info.fMin, (state.info.efl * Math.abs(state.info.yStop)) / (2 * r));
      syncControls();
    }
    quality = 'lo';
    update();
  });
  xsec.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e);
    const h = hit(x, y);
    if (!h) return;
    xsec.setPointerCapture(e.pointerId);
    const S = state.lens.S;
    if (h.type === 'select') { state.sel = h.i; fillEditor(); drawXsec(); return; }
    if (h.type === 'curv') { state.sel = h.i; fillEditor(); }
    if (h.type === 'move') { state.sel = h.el.a; fillEditor(); }
    drag = { ...h, x, y, e0: state.e };
    if (h.type === 'move') drag.z0 = S.slice(h.el.a, h.el.b + 1).map((s) => s.z);
    if (h.type === 'curv') drag.c0 = S[h.i].R ? 1 / S[h.i].R : 0;
    drawXsec();
  });
  const end = () => { if (drag) { drag = null; fillSurfaceSelect(); fillEditor(); quality = 'hi'; update(); } };
  xsec.addEventListener('pointerup', end);
  xsec.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------------------------
// Cena de bokeh + PSFs
// ---------------------------------------------------------------------------
const FAR = [], NEAR = [];
(function makeScene() {
  const R = O.rng(21);
  for (let i = 0; i < 30; i++) {
    const x = (R() - 0.5) * 34, y = (R() - 0.5) * 22;
    FAR.push({ x, y, col: Math.floor(R() * FAR_COL.length), I: 0.6 + R() * 0.8 });
  }
  // canto: garante luzes nas bordas para o cat-eye
  FAR.push({ x: 16.5, y: 10.5, col: 2, I: 1.2 }, { x: -16.5, y: -10.5, col: 0, I: 1.2 }, { x: 16.8, y: -10, col: 1, I: 1 }, { x: -16.6, y: 10.3, col: 3, I: 1 });
  for (let i = 0; i < 7; i++) {
    const a = R() * Math.PI * 2, r = 4 + R() * 12;
    NEAR.push({ x: Math.cos(a) * r * 1.3, y: Math.sin(a) * r * 0.8, col: Math.floor(R() * NEAR_COL.length), I: 0.7 + R() * 0.5 });
  }
})();

const RADII = [0, 5, 9, 13, 16.5, 19.8];

function buildLayer(D, N, s) {
  const out = [];
  let ref = 0;
  for (const r of RADII) {
    const sp = O.spot(state.lens, s, state.info, D, r, N);
    if (r === 0) ref = Math.max(1e-9, sp.w * sp.count);
    out.push({ r, sp, K: sp.count ? O.rasterKernel(sp, SCENE_PXMM, 240) : null, e: sp.w * sp.count / ref, e0: sp.w / ref });
  }
  return out;
}

function drawLights(ctx, list, layer, cols) {
  const cache = new Map();
  for (const l of list) {
    const r = Math.hypot(l.x, l.y);
    let bi = 0; for (let i = 1; i < layer.length; i++) if (Math.abs(layer[i].r - r) < Math.abs(layer[bi].r - r)) bi = i;
    const k = layer[bi];
    if (!k.K) continue;
    const key = bi + ':' + l.col;
    let cv = cache.get(key);
    if (!cv) { cv = O.kernelCanvas(k.K, cols[l.col], k.e0 * 255 * 420); cache.set(key, cv); }
    const px = SCENE_W / 2 + l.x * SCENE_PXMM, py = SCENE_H / 2 - l.y * SCENE_PXMM;
    const phi = Math.atan2(-l.y, l.x);
    const s = k.K.upscale;
    ctx.save(); ctx.translate(px, py); ctx.rotate(r < 0.5 ? 0 : phi - Math.PI / 2);
    ctx.globalAlpha = Math.min(1, l.I);
    ctx.drawImage(cv, -k.K.half * s, -k.K.half * s, k.K.size * s, k.K.size * s);
    ctx.restore();
  }
}

function drawPSF(canvas, k, label) {
  const c = canvas.getContext('2d');
  const W = canvas.width;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, W);
  if (!k || !k.K) { c.fillStyle = '#5d6a63'; c.font = '11px JetBrains Mono'; c.fillText('sem luz', 10, 20); return; }
  const K = k.K;
  let m = 0;
  for (let ch = 0; ch < 3; ch++) for (const v of K.A[ch]) if (v > m) m = v;
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = K.size;
  const t = tmp.getContext('2d'); const img = t.createImageData(K.size, K.size);
  for (let i = 0, j = 0; i < K.A[0].length; i++, j += 4) {
    img.data[j] = 255 * Math.pow(K.A[0][i] / m, 0.6);
    img.data[j + 1] = 255 * Math.pow(K.A[1][i] / m, 0.6);
    img.data[j + 2] = 255 * Math.pow(K.A[2][i] / m, 0.6);
    img.data[j + 3] = 255;
  }
  t.putImageData(img, 0, 0);
  c.imageSmoothingEnabled = true;
  const pad = W * 0.08;
  c.drawImage(tmp, pad, pad, W - 2 * pad, W - 2 * pad);
  // tamanho real
  const mm = (K.size / K.scale);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.font = `${Math.round(W / 16)}px JetBrains Mono, monospace`;
  c.fillText(`${mm.toFixed(2).replace('.', ',')} mm`, 8, W - 8);
  void label;
}

function drawSpot(canvas, sp) {
  const c = canvas.getContext('2d'); const W = canvas.width;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, W);
  if (!sp || !sp.count) return 0;
  let m = 0, rms = 0, n = 0;
  const G = sp.hits[1];
  for (let i = 0; i < G.length; i += 2) { const d = Math.hypot(G[i] - sp.cx, G[i + 1] - sp.cy); m = Math.max(m, d); rms += d * d; n++; }
  rms = Math.sqrt(rms / n);
  for (let ch = 0; ch < 3; ch++) {
    const H = sp.hits[ch];
    for (let i = 0; i < H.length; i += 2) { m = Math.max(m, Math.abs(H[i] - sp.cx), Math.abs(H[i + 1] - sp.cy)); }
  }
  const scale = (W * 0.42) / Math.max(m, 0.004);
  const cols = ['rgba(255,90,90,.5)', 'rgba(120,255,170,.5)', 'rgba(110,160,255,.5)'];
  c.globalCompositeOperation = 'lighter';
  for (let ch = 0; ch < 3; ch++) {
    c.fillStyle = cols[ch];
    const H = sp.hits[ch];
    const step = Math.max(2, Math.floor(H.length / 1600) * 2);
    for (let i = 0; i < H.length; i += step) c.fillRect(W / 2 + (H[i] - sp.cx) * scale, W / 2 - (H[i + 1] - sp.cy) * scale, 1.3, 1.3);
  }
  c.globalCompositeOperation = 'source-over';
  // barra de escala de 10 µm/50 µm
  const um = m > 0.15 ? 100 : m > 0.03 ? 20 : 5;
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(8, W - 10, um / 1000 * scale, 2);
  c.font = `${Math.round(W / 16)}px JetBrains Mono, monospace`; c.fillText(`${um} µm`, 8, W - 14);
  return rms;
}

function renderScene() {
  const N = quality === 'hi' ? 2400 : 700;
  const s = st();
  const far = buildLayer(state.bg, N, s);
  const near = buildLayer(state.near, Math.round(N * 0.7), s);
  const c = sctx;
  c.globalCompositeOperation = 'source-over';
  const g = c.createRadialGradient(SCENE_W / 2, SCENE_H / 2, 40, SCENE_W / 2, SCENE_H / 2, SCENE_W * 0.7);
  g.addColorStop(0, '#0d1018'); g.addColorStop(1, '#030405');
  c.fillStyle = g; c.fillRect(0, 0, SCENE_W, SCENE_H);
  c.globalCompositeOperation = 'lighter';
  drawLights(c, FAR, far, FAR_COL);
  drawLights(c, NEAR, near, NEAR_COL);
  c.globalCompositeOperation = 'source-over';
  // retícula de foco
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(SCENE_W / 2 - 10, SCENE_H / 2); c.lineTo(SCENE_W / 2 + 10, SCENE_H / 2); c.moveTo(SCENE_W / 2, SCENE_H / 2 - 10); c.lineTo(SCENE_W / 2, SCENE_H / 2 + 10); c.stroke();

  drawPSF($('psf-c'), far[0]);
  drawPSF($('psf-e'), far[far.length - 1]);
  drawPSF($('psf-f'), near[0]);
  const sp = O.spot(state.lens, s, state.info, state.focus, 0, quality === 'hi' ? 2400 : 900);
  lastSpot = sp;
  const rms = drawSpot($('spot'), sp);
  $('st-rms').textContent = rms ? (rms * 1000).toFixed(1).replace('.', ',') + ' µm' : '—';
  const vig = far[far.length - 1].e;
  $('st-vig').textContent = Math.round(Math.min(1, vig) * 100) + '%';
}

function update(force) {
  if (pending && !force) return;
  pending = requestAnimationFrame(() => {
    pending = 0;
    const efl = state.info.efl;
    $('st-efl').textContent = efl.toFixed(1).replace('.', ',') + ' mm';
    $('st-f').textContent = 'f/' + state.fstop.toFixed(1);
    $('st-focus').textContent = fmtDist(state.focus);
    drawXsec();
    renderScene();
  });
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = xsec.getBoundingClientRect();
  xsec.width = Math.round(r.width * dpr); xsec.height = Math.round(r.height * dpr);
  view = null;
  for (const id of ['psf-c', 'psf-e', 'psf-f', 'spot']) { const cv = $(id); const w = Math.round(cv.getBoundingClientRect().width * dpr) || 160; cv.width = cv.height = w; }
  update(true);
}

export function initLab() {
  xsec = $('xsec'); xctx = xsec.getContext('2d');
  scene = $('scene'); scene.width = SCENE_W; scene.height = SCENE_H; sctx = scene.getContext('2d');
  bindControls(); bindXsec();
  loadPreset('dgauss');
  resize();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  // expõe estado para o hero (leitura)
  return state;
}
