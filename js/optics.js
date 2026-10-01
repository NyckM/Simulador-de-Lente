// Traçador sequencial de superfícies esféricas — usado pela landing page.
// Unidades em mm. Eixo óptico = z, luz viaja em +z. Sensor 36 × 24 mm.
// É um modelo didático e leve; o app usa o motor completo (Vulkan / atlas GPU).

export const PRESETS = {
  dgauss: {
    name: 'Double-Gauss 50 mm',
    note: 'Prescrição pública (LensSim / PBRT, MIT). Base clássica de 50 mm normais.',
    blades: 7,
    // R, espessura seguinte, nd, Abbe, diâmetro    ('stop' = diafragma)
    rows: [
      [29.475, 3.76, 1.670, 47.1, 25.2],
      [84.83, 0.12, 1, 0, 25.2],
      [19.275, 4.025, 1.670, 47.1, 23],
      [40.77, 3.275, 1.699, 30.1, 23],
      [12.75, 5.705, 1, 0, 18],
      ['stop', 4.5, 1, 0, 17.1],
      [-14.495, 1.18, 1.603, 38.0, 17],
      [40.77, 6.065, 1.658, 50.9, 20],
      [-20.385, 0.19, 1, 0, 20],
      [437.065, 3.22, 1.717, 48.0, 20],
      [-39.73, 0, 1, 0, 20],
    ],
  },
  triplet: {
    name: 'Cooke Triplet 50 mm',
    note: 'Família de três elementos (1893). Estudo didático escalado.',
    blades: 6,
    rows: [
      [19.787, 2.0, 1.6116, 58.8, 15],
      [-112.035, 2.2, 1, 0, 15],
      [-20.651, 1.0, 1.6200, 36.3, 11],
      [21.56, 1.3, 1, 0, 11],
      ['stop', 3.45, 1, 0, 10.4],
      [327.716, 2.0, 1.6116, 58.8, 13],
      [-16.7, 0, 1, 0, 13],
    ],
    scaleTo: 50,
  },
  petzval: {
    name: 'Petzval 85 mm',
    note: 'Retrato do séc. XIX: centro nítido, campo curvo e swirl. Estudo didático.',
    blades: 12,
    rows: [
      [49.706, 5.8, 1.5168, 64.2, 32],
      [-46.57, 1.5, 1.6490, 33.8, 32],
      [470.353, 12, 1, 0, 32],
      ['stop', 12, 1, 0, 27],
      [96.265, 1.5, 1.6490, 33.8, 26],
      [38.992, 0.8, 1, 0, 26],
      [43.225, 4.5, 1.5168, 64.2, 26],
      [-114.571, 0, 1, 0, 26],
    ],
    scaleTo: 85,
  },
  singlet: {
    name: 'Lente simples 50 mm',
    note: 'Um único vidro plano-convexo: aberração esférica e cromática sem correção.',
    blades: 5,
    rows: [
      ['stop', 4, 1, 0, 16],
      [26.0, 5.5, 1.5168, 64.2, 26],
      [0, 0, 1, 0, 26],
    ],
  },
};

export function buildLens(key) {
  const p = PRESETS[key];
  let z = 0;
  let S = p.rows.map((r) => {
    const s = {
      R: r[0] === 'stop' ? 0 : r[0], stop: r[0] === 'stop', z,
      n: r[2], V: r[3], sd: r[4] / 2,
    };
    z += r[1];
    return s;
  });
  const lens = { key, name: p.name, note: p.note, blades: p.blades, S };
  if (p.scaleTo) {
    const f = paraxial(lens).efl;
    const k = p.scaleTo / f;
    S.forEach((s) => { s.R *= k; s.z *= k; s.sd *= k; });
  }
  return lens;
}

export function cloneLens(l) {
  return { ...l, S: l.S.map((s) => ({ ...s })) };
}

const CH_K = [-0.31, 0, 0.69]; // C, d, F relativos a nd
export function nAt(n, V, ch, disp) {
  if (n === 1 || !V) return n;
  return n + ((n - 1) / V) * CH_K[ch] * disp;
}

// ---- Paraxial (y-u) ----------------------------------------------------
// objDist: distância do objeto ao primeiro vértice (mm); Infinity = paralelo
export function paraxial(lens, objDist = Infinity, ch = 1, disp = 1) {
  const S = lens.S;
  let y = 1, u = isFinite(objDist) ? 1 / objDist : 0, n1 = 1;
  let yStop = 1;
  for (let i = 0; i < S.length; i++) {
    const s = S[i];
    if (s.stop) yStop = y;
    const n2 = s.stop ? n1 : nAt(s.n, s.V, ch, disp);
    const c = s.R ? 1 / s.R : 0;
    u = (n1 * u - y * c * (n2 - n1)) / n2;
    n1 = n2;
    if (i < S.length - 1) y += u * (S[i + 1].z - s.z);
  }
  const bfd = -y / u;
  const efl = isFinite(objDist) ? NaN : -1 / u;
  return { bfd, efl, yStop, u };
}

export function lensInfo(lens) {
  const p = paraxial(lens);
  const stop = lens.S.find((s) => s.stop);
  const epdMax = stop ? (2 * stop.sd) / Math.abs(p.yStop) : 2 * lens.S[0].sd;
  return { efl: p.efl, bfdInf: p.bfd, fMin: p.efl / epdMax, yStop: p.yStop, stop };
}

// ---- Íris ---------------------------------------------------------------
let maxR = Infinity;
function inIris(x, y, R, nb, rot, round) {
  const r2 = x * x + y * y;
  if (r2 > R * R) return false;
  if (nb < 3 || round >= 1) return true;
  if (R >= maxR * 0.995) return true; // totalmente aberta: lâminas recolhidas, pupila circular
  const seg = (2 * Math.PI) / nb;
  let a = Math.atan2(y, x) - rot;
  a = ((a % seg) + seg) % seg - seg / 2;
  const rp = (R * Math.cos(Math.PI / nb)) / Math.cos(a);
  return Math.sqrt(r2) <= rp + (R - rp) * round;
}

// ---- Traçado real 3D ------------------------------------------------------
// st: { shift, zSensor, stopR, blades, bladeRot, round, disp }
// out: Float64Array(2) para o ponto no sensor; path: array opcional [z,y,...]
export function trace(lens, st, ox, oy, oz, dx, dy, dz, ch, out, path, zEnd) {
  const S = lens.S;
  let n1 = 1;
  if (path) path.push(oz, oy);
  for (let i = 0; i < S.length; i++) {
    const s = S[i];
    const zv = s.z + st.shift;
    let t, px, py, pz, nx = 0, ny = 0, nz = -1;
    if (s.R === 0) {
      t = (zv - oz) / dz;
      if (t < 0) return false;
      px = ox + t * dx; py = oy + t * dy; pz = zv;
    } else {
      const cz = zv + s.R;
      const ocz = oz - cz;
      const b = ox * dx + oy * dy + ocz * dz;
      const c = ox * ox + oy * oy + ocz * ocz - s.R * s.R;
      const disc = b * b - c;
      if (disc < 0) return false;
      const sq = Math.sqrt(disc);
      t = s.R > 0 ? -b - sq : -b + sq;
      if (t < 0) return false;
      px = ox + t * dx; py = oy + t * dy; pz = oz + t * dz;
      nx = px / s.R; ny = py / s.R; nz = (pz - cz) / s.R;
    }
    if (path) path.push(pz, py);
    if (s.stop) {
      maxR = s.sd;
      if (!inIris(px, py, st.stopR, st.blades, st.bladeRot, st.round)) return false;
    } else if (px * px + py * py > s.sd * s.sd) return false;
    if (!s.stop) {
      const n2 = nAt(s.n, s.V, ch, st.disp);
      if (n2 !== n1) {
        const cosi = -(nx * dx + ny * dy + nz * dz);
        const eta = n1 / n2;
        const k = 1 - eta * eta * (1 - cosi * cosi);
        if (k < 0) return false;
        const f = eta * cosi - Math.sqrt(k);
        dx = eta * dx + f * nx; dy = eta * dy + f * ny; dz = eta * dz + f * nz;
        n1 = n2;
      }
    }
    ox = px; oy = py; oz = pz;
  }
  if (dz <= 0) return false;
  const ts = (st.zSensor - oz) / dz;
  out[0] = ox + ts * dx; out[1] = oy + ts * dy;
  if (path) {
    const ze = zEnd ?? st.zSensor;
    const te = (ze - oz) / dz;
    path.push(ze, oy + te * dy);
  }
  return true;
}

// ---- Estado de foco ------------------------------------------------------
// O sensor fica fixo em zSensor; o conjunto de vidros anda (extensão e).
export function imageDist(lens, Dfirst) { return paraxial(lens, Dfirst).bfd; }

export function solveExtension(lens, zSensor, Dfocus) {
  const zl = lens.S[lens.S.length - 1].z;
  let e = 0;
  for (let k = 0; k < 8; k++) {
    const D = Dfocus - zSensor - e;
    if (D <= 1) return null;
    e = zl + imageDist(lens, D) - zSensor;
  }
  return e;
}

export function focusFromExtension(lens, zSensor, e) {
  const zl = lens.S[lens.S.length - 1].z;
  const f = (Df) => zl - e + imageDist(lens, Df - zSensor - e) - zSensor;
  const efl = paraxial(lens).efl;
  let lo = zSensor + e + Math.abs(efl) * 1.05 + 5, hi = 1e8;
  const flo = f(lo), fhi = f(hi);
  if (fhi > 0) return Infinity; // além do infinito
  if (flo < 0 || !isFinite(flo)) return NaN;
  for (let i = 0; i < 70; i++) {
    const mid = Math.sqrt(lo * hi);
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// Fibonacci: amostragem determinística e uniforme da pupila
const GA = Math.PI * (3 - Math.sqrt(5));

// Dispara raios de um ponto-objeto e devolve os impactos no sensor por canal.
// D: distância do objeto ao sensor (mm). rImg: altura desejada na imagem (mm).
export function spot(lens, st, info, D, rImg, N, channels = [0, 1, 2]) {
  const ext = -st.shift;
  const z0 = st.zSensor - D;
  const tanT = rImg / info.efl;
  const oy = (D - st.zSensor) * tanT; // altura do objeto
  const zf = st.shift; // plano do 1º vértice
  const out = new Float64Array(2);
  const R0 = lens.S[0].sd * 1.12;
  // 1) sondagem: onde o feixe realmente passa no plano frontal
  let sx = 0, sy = 0, cnt = 0;
  const pass = [];
  const NP = 420;
  for (let i = 0; i < NP; i++) {
    const r = R0 * Math.sqrt((i + 0.5) / NP), a = i * GA;
    const tx = r * Math.cos(a), ty = r * Math.sin(a);
    let dx = tx, dy = ty - oy, dz = zf - z0;
    const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
    if (trace(lens, st, 0, oy, z0, dx, dy, dz, 1, out)) { pass.push(tx, ty); sx += tx; sy += ty; cnt++; }
  }
  const res = { hits: [[], [], []], w: 0, cx: 0, cy: 0, count: 0 };
  if (!cnt) return res;
  const mx = sx / cnt, my = sy / cnt;
  let rr = 0;
  for (let i = 0; i < pass.length; i += 2) rr = Math.max(rr, Math.hypot(pass[i] - mx, pass[i + 1] - my));
  rr = rr + R0 * 0.09 + 0.05;
  // 2) amostragem densa no círculo útil
  res.w = (Math.PI * rr * rr) / N; // área de pupila por raio
  let gx = 0, gy = 0, gc = 0;
  for (const ch of channels) {
    const H = res.hits[ch];
    for (let i = 0; i < N; i++) {
      const r = rr * Math.sqrt((i + 0.5) / N), a = i * GA;
      const tx = mx + r * Math.cos(a), ty = my + r * Math.sin(a);
      let dx = tx, dy = ty - oy, dz = zf - z0;
      const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
      if (trace(lens, st, 0, oy, z0, dx, dy, dz, ch, out)) {
        H.push(out[0], out[1]);
        if (ch === 1) { gx += out[0]; gy += out[1]; gc++; }
      }
    }
  }
  if (!gc) { // sem verde: usa qualquer canal
    for (const ch of channels) { const H = res.hits[ch]; for (let i = 0; i < H.length; i += 2) { gx += H[i]; gy += H[i + 1]; gc++; } }
  }
  res.count = gc;
  res.cx = gc ? gx / gc : 0; res.cy = gc ? gy / gc : 0;
  return res;
}

// Rasteriza os impactos num kernel (canais em Float32) na escala pxmm.
// Orientação: eixo v aponta para fora do centro do quadro.
export function rasterKernel(sp, pxmm, maxSize = 260) {
  const sgn = sp.cy < -1e-6 ? -1 : 1;
  let m = 0;
  for (let c = 0; c < 3; c++) {
    const H = sp.hits[c];
    for (let i = 0; i < H.length; i += 2) {
      m = Math.max(m, Math.abs(H[i] - sp.cx), Math.abs(H[i + 1] - sp.cy));
    }
  }
  let scale = pxmm;
  let half = Math.ceil(m * scale) + 3;
  if (2 * half + 1 > maxSize) { scale = (maxSize / 2 - 3) / m; half = Math.floor(maxSize / 2); }
  const size = 2 * half + 1;
  const A = [new Float32Array(size * size), new Float32Array(size * size), new Float32Array(size * size)];
  for (let c = 0; c < 3; c++) {
    const H = sp.hits[c], a = A[c];
    for (let i = 0; i < H.length; i += 2) {
      const u = (H[i] - sp.cx) * scale + half;
      const v = (H[i + 1] - sp.cy) * sgn * scale + half;
      const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
      if (x0 < 0 || y0 < 0 || x0 >= size - 1 || y0 >= size - 1) continue;
      const k = y0 * size + x0;
      a[k] += (1 - fx) * (1 - fy); a[k + 1] += fx * (1 - fy);
      a[k + size] += (1 - fx) * fy; a[k + size + 1] += fx * fy;
    }
  }
  // desfoque leve 3×3 (duas passadas) para remover o padrão de amostragem
  const blurPasses = scale < pxmm ? 1 : 2;
  for (let c = 0; c < 3; c++) for (let p = 0; p < blurPasses; p++) A[c] = box3(A[c], size);
  return { A, size, half, scale, upscale: pxmm / scale };
}

function box3(a, s) {
  const b = new Float32Array(a.length);
  for (let y = 1; y < s - 1; y++) for (let x = 1; x < s - 1; x++) {
    const k = y * s + x;
    b[k] = (a[k] * 4 + a[k - 1] * 2 + a[k + 1] * 2 + a[k - s] * 2 + a[k + s] * 2 + a[k - s - 1] + a[k - s + 1] + a[k + s - 1] + a[k + s + 1]) / 16;
  }
  return b;
}

// Converte kernel em canvas colorido. gain = energia por raio × intensidade
export function kernelCanvas(K, rgb, gain, canvas) {
  const c = canvas || document.createElement('canvas');
  c.width = c.height = K.size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(K.size, K.size);
  const d = img.data;
  const g = gain * K.upscale * K.upscale;
  for (let i = 0, j = 0; i < K.A[0].length; i++, j += 4) {
    d[j] = Math.min(255, K.A[0][i] * g * rgb[0]);
    d[j + 1] = Math.min(255, K.A[1][i] * g * rgb[1]);
    d[j + 2] = Math.min(255, K.A[2][i] * g * rgb[2]);
    d[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Seeded RNG para cenas determinísticas
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
