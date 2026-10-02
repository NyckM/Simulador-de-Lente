import { initLab } from './lab.js';
import { initMainWipe, initImageWipes } from './wipe.js';
import { LENSES as LENSES_PT } from './lenses.js';
import { t as tr, num, lensRow } from './i18n.js';
const LENSES = LENSES_PT.map(lensRow);
import anime from 'animejs/lib/anime.es.js';

const A = anime;
window.anime = anime;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (A && !reduce) document.documentElement.classList.add('js');
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- nav ----------
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ---------- marquee ----------
const mq = document.getElementById('marquee');
const names = LENSES.map((l) => l[0]);
mq.innerHTML = [...names, ...names].map((n) => `<span>${n}</span>`).join('');

// ---------- hero 3D (carregado à parte para não bloquear a página) ----------
const roFocus = document.getElementById('ro-focus');
import('./hero.js').then(({ initHero }) => {
  try {
    const hero = initHero(document.getElementById('hero-canvas'), (f) => { roFocus.textContent = num(f * 0.38, 2) + ' m'; });
    if (A && !reduce) {
      A.timeline({ easing: 'easeOutExpo' })
        .add({ targets: hero.anim, particles: [0, 1], duration: 2200 }, 0)
        .add({ targets: hero.anim, explode: [1.6, 0], rotY: [-1.9, -0.55], duration: 2600, easing: 'easeInOutQuart' }, 200)
        .add({ targets: hero.anim, rays: [0, 1], duration: 1600 }, 2300);
    } else { hero.anim.particles = 1; hero.anim.explode = 0; hero.anim.rotY = -0.55; hero.anim.rays = 1; }
  } catch (e) { console.warn('Hero 3D indisponível:', e); }
}).catch((e) => console.warn('three.js não carregou:', e));

// ---------- entrada do hero ----------
if (A && !reduce) {
  A.timeline({ easing: 'easeOutExpo' })
    .add({ targets: '.hero-title .w', translateY: ['110%', '0%'], duration: 1400, delay: A.stagger(90) }, 300)
    .add({ targets: '.reveal-hero', opacity: [0, 1], translateY: [24, 0], duration: 1200, delay: A.stagger(110) }, 700)
    .add({ targets: '.hero-title em', color: ['#ffffff', '#9ff0c8'], duration: 1600, easing: 'easeOutQuad' }, 900);
}

// ---------- revelar no scroll ----------
function onView(els, cb, opts = { threshold: 0.18 }) {
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), opts);
  els.forEach((el) => io.observe(el));
}
if (A && !reduce) {
  // agrupa elementos que entram juntos para fazer stagger
  let batch = [], t = 0;
  onView(document.querySelectorAll('.reveal'), (el) => {
    batch.push(el); clearTimeout(t);
    t = setTimeout(() => {
      A({ targets: batch, opacity: [0, 1], translateY: [36, 0], duration: 1100, delay: A.stagger(80), easing: 'easeOutExpo' });
      batch = [];
    }, 30);
  }, { threshold: 0.12 });

  // desenhar os ícones das diferenças
  onView(document.querySelectorAll('.diff .draw'), (svg) => {
    A({ targets: svg.querySelectorAll('path,circle,polygon,rect'), strokeDashoffset: [A.setDashoffset, 0], duration: 1600, delay: A.stagger(220, { start: 200 }), easing: 'easeInOutSine' });
  });

  // pipeline
  onView([document.querySelector('.pipeline')], (el) => {
    A({ targets: el.querySelectorAll('.step'), opacity: [0, 1], translateX: [-20, 0], delay: A.stagger(120, { start: 200 }), duration: 900, easing: 'easeOutExpo' });
  });
}

// ---------- contadores ----------
onView(document.querySelectorAll('.count'), (el) => {
  const to = +el.dataset.to, dec = +(el.dataset.dec || 0);
  const o = { v: 0 };
  const fmt = (v) => num(v, dec);
  if (!A || reduce) { el.textContent = fmt(to); return; }
  A({ targets: o, v: to, duration: 2000, easing: 'easeOutExpo', update: () => (el.textContent = fmt(o.v)) });
});

// ---------- wipes ----------
const mainWipe = initMainWipe();
initImageWipes();
if (A && !reduce) {
  mainWipe.addEventListener('ready', () => {
    onView([mainWipe], () => {
      const o = { x: 88 };
      A.timeline({ easing: 'easeInOutQuart' })
        .add({ targets: o, x: [88, 18], duration: 1500, update: () => mainWipe._setX(o.x) })
        .add({ targets: o, x: 50, duration: 1100, update: () => mainWipe._setX(o.x) })
        .add({ targets: '#pins .pin', scale: [0, 1], opacity: [0, 1], delay: A.stagger(140), duration: 700, easing: 'easeOutBack' }, '-=500');
    }, { threshold: 0.4 });
  });
  onView(document.querySelectorAll('.wipe.img'), (el) => {
    const o = { x: 80 };
    A({ targets: o, x: [80, 50], duration: 1400, delay: 300, easing: 'easeInOutQuart', update: () => el._setX(o.x) });
  }, { threshold: 0.5 });
}

// ---------- laboratório ----------
onView([document.getElementById('lab')], () => initLab(), { rootMargin: '400px' });

// ---------- grade de pontos (bokeh) ----------
const grid = document.getElementById('dot-grid');
const COLS = 14, ROWS = 10;
for (let i = 0; i < COLS * ROWS; i++) grid.appendChild(document.createElement('i'));
if (A && !reduce) {
  const dots = grid.querySelectorAll('i');
  const wave = (from) => A.timeline()
    .add({ targets: dots, scale: [{ value: 1.9, easing: 'easeOutSine', duration: 450 }, { value: 1, easing: 'easeInOutQuad', duration: 900 }],
      opacity: [{ value: 0.95, duration: 450 }, { value: 0.18, duration: 900 }],
      backgroundColor: [{ value: (el, i) => ['#f3a75c', '#7fd6ff', '#9ff0c8'][i % 3], duration: 450 }, { value: '#9ff0c8', duration: 900 }],
      delay: A.stagger(60, { grid: [COLS, ROWS], from }) });
  onView([grid], () => {
    wave('center');
    let k = 0;
    setInterval(() => { if (document.hidden) return; wave(Math.floor(Math.random() * COLS * ROWS)); k++; }, 3600);
  });
  grid.addEventListener('pointerdown', (e) => {
    const i = [...grid.children].indexOf(e.target); if (i >= 0) wave(i);
  });
}

// ---------- tabela de lentes ----------
const tbody = document.querySelector('#lens-table tbody');
const search = document.getElementById('lens-search');
const chips = document.getElementById('lens-chips');
const ALL = tr('all');
const fams = [ALL, ...new Set(LENSES.map((l) => l[3]))].slice(0, 12);
let fam = ALL, sortK = 'name', asc = true;
fams.forEach((f) => {
  const b = document.createElement('button'); b.textContent = f; if (f === fam) b.classList.add('on');
  b.onclick = () => { fam = f; chips.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); };
  chips.appendChild(b);
});
const KEYS = { name: 0, focal: 1, f: 2, family: 3, blades: 4, look: 5 };
document.querySelectorAll('#lens-table th').forEach((th) => th.addEventListener('click', () => {
  const k = th.dataset.k; asc = sortK === k ? !asc : true; sortK = k; render();
}));
function render() {
  const q = search.value.trim().toLowerCase();
  const rows = LENSES.filter((l) => (fam === ALL || l[3] === fam) && (!q || l.join(' ').toLowerCase().includes(q)));
  const k = KEYS[sortK];
  rows.sort((a, b) => (typeof a[k] === 'number' ? a[k] - b[k] : String(a[k]).localeCompare(String(b[k]), document.documentElement.lang)) * (asc ? 1 : -1));
  tbody.innerHTML = rows.map((l) => `<tr><td>${l[0]}</td><td class="m">${l[1]} mm</td><td class="m">f/${l[2]}</td><td><span class="fam">${l[3]}</span></td><td class="m">${l[4] || '—'}</td><td class="look">${l[5]}</td></tr>`).join('');
  document.querySelectorAll('#lens-table th').forEach((th) => { th.classList.toggle('sort', th.dataset.k === sortK); th.classList.toggle('asc', th.dataset.k === sortK && asc); });
  document.getElementById('lens-count').textContent = tr('count')(rows.length, LENSES.length);
  if (A && !reduce) A({ targets: tbody.querySelectorAll('tr'), opacity: [0, 1], translateX: [-8, 0], delay: (el, i) => Math.min(i * 12, 300), duration: 500, easing: 'easeOutQuad' });
}
search.addEventListener('input', render);
render();

// ---------- links de download (preencha em data-href) ----------
// Troque href="#" no HTML pelos links reais dos releases do GitHub.

// ---------- seletor de idioma: lembra a escolha ----------
document.querySelectorAll('.lang a').forEach((a) => a.addEventListener('click', () => {
  try { localStorage.setItem('lang', a.dataset.lang); } catch (e) { /* sem storage */ }
}));
