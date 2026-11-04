'use strict';
/* Hilfsfunktionen der Seite Filter und Faltung: Canvas, Farben, Animationsschleife, Testbild, Faltung, Filter, Bilddarstellung. */
const $ = s => document.querySelector(s);
const root = document.documentElement;
const tok = n => getComputedStyle(root).getPropertyValue(n).trim();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const DISP = '"IBM Plex Sans Condensed", "Arial Narrow", system-ui, sans-serif';
const nf = (v, d = 0) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const ex = (v, d = 1) => { if (!isFinite(v)) return '∞'; if (v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))); if (e >= -2 && e < 4) return nf(v, e < 0 ? d - e : Math.max(0, d + 1 - e)); return `${nf(v / Math.pow(10, e), d)}·10${String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };
function rgb(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const v = parseInt(c, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
function rgba(c, a) { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; }
let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
function gauss() { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, r.width), h = Math.max(1, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
function frame(ctx, x0px, y0px, w, h, o) {
  const L = o.l ?? 48, R = o.r ?? 12, T = o.t ?? 12, B = o.b ?? 36;
  const bx = x0px + L, by = y0px + T, bw = Math.max(10, w - L - R), bh = Math.max(10, h - T - B);
  const ty = v => o.ylog ? Math.log10(v) : v;
  const X = v => bx + (v - o.x0) / (o.x1 - o.x0) * bw, Y = v => by + bh - (ty(v) - ty(o.y0)) / (ty(o.y1) - ty(o.y0)) * bh;
  ctx.font = `11px ${MONO}`; ctx.lineWidth = 1;
  const grid = tok('--grid'), muted = tok('--muted');
  for (const v of (o.xt || [])) { const x = X(v); ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by + bh); ctx.stroke(); ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText(o.xf ? o.xf(v) : String(v), x, by + bh + 15); }
  for (const v of (o.yt || [])) { const y = Y(v); ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); ctx.fillStyle = muted; ctx.textAlign = 'right'; ctx.fillText(o.yf ? o.yf(v) : String(v), bx - 6, y + 4); }
  ctx.strokeStyle = tok('--rule'); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
  ctx.fillStyle = muted; ctx.font = `12px ${DISP}`;
  if (o.xl) { ctx.textAlign = 'center'; ctx.fillText(o.xl, bx + bw / 2, by + bh + 31); }
  if (o.yl) { ctx.save(); ctx.translate(x0px + 12, by + bh / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(o.yl, 0, 0); ctx.restore(); }
  return { X, Y, bx, by, bw, bh };
}
const mods = [];
const io = new IntersectionObserver(es => es.forEach(e => { if (e.target._mod) e.target._mod.visible = e.isIntersecting; }), { rootMargin: '100px' });
function reg(m) { m.visible = true; m.el._mod = m; io.observe(m.el); mods.push(m); new ResizeObserver(() => m.draw()).observe(m.el); return m; }
const redrawAll = () => mods.forEach(m => m.draw());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawAll);
new MutationObserver(redrawAll).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (const m of mods) if (m.anim && m.playing && m.visible) { m.step(dt); m.draw(); } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
function rafDebounce(fn) { let p = false; return () => { if (p) return; p = true; requestAnimationFrame(() => { p = false; fn(); }); }; }

function heat(v, col = tok('--accent')) { const [r, g, b] = rgb(col), [r0, g0, b0] = rgb(tok('--surface')); v = Math.max(0, Math.min(1, v)); return `rgb(${Math.round(r0 + (r - r0) * v)},${Math.round(g0 + (g - g0) * v)},${Math.round(b0 + (b - b0) * v)})`; }
// Divergierend: negativ = --hole, positiv = --accent
function div(v) { return v >= 0 ? heat(v, tok('--accent')) : heat(-v, tok('--hole')); }
function textOn(v) { return v > 0.55 ? tok('--surface') : tok('--fg'); }
function mouse(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function arrowPx(ctx, x1, y1, x2, y2, col, lw = 1.4) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7 * Math.cos(a - 0.4), y2 - 7 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 7 * Math.cos(a + 0.4), y2 - 7 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}

/* ---------- Testbild ---------- */
// Phantom n×n mit Werten 0…1: Verlauf, Rechteck, Kreis, feine Linien, Schräge, Punkte, Gitter mit steigender Frequenz
function phantom(n = 128) {
  const I = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / (n - 1), v = y / (n - 1);
    let p = 0.18 + 0.22 * u;                                                     // Verlauf
    if (u > 0.08 && u < 0.42 && v > 0.08 && v < 0.36) p = 0.78;                  // Rechteck
    if ((u - 0.72) ** 2 + (v - 0.24) ** 2 < 0.16 ** 2) p = 0.6;                  // Kreis
    if ((u - 0.72) ** 2 + (v - 0.24) ** 2 < 0.07 ** 2) p = 0.9;                  // innerer Kreis
    if (v > 0.46 && v < 0.5 && u > 0.06 && u < 0.94) p = 0.95;                   // waagrechter Strich
    if (Math.abs((u - 0.1) - (v - 0.56) * 0.9) < 0.02 && v > 0.56 && v < 0.94) p = 0.85; // Schräge
    if (u > 0.5 && u < 0.94 && v > 0.58 && v < 0.94) {                           // Gitter, Frequenz steigt nach rechts
      const f = 3 + 22 * (u - 0.5) / 0.44; p = 0.35 + 0.35 * (Math.sin(2 * Math.PI * f * (u - 0.5)) > 0 ? 1 : 0); }
    for (const [cx, cy] of [[0.25, 0.68], [0.32, 0.74], [0.38, 0.82], [0.27, 0.86]]) if ((u - cx) ** 2 + (v - cy) ** 2 < 0.012 ** 2) p = 1;
    I[y * n + x] = p;
  }
  return I;
}
function addNoise(I, sigma, sp = 0, s = 7) {
  const s0 = seed; seed = s; const O = new Float32Array(I.length);
  for (let k = 0; k < I.length; k++) { let v = I[k] + sigma * gauss(); if (sp > 0) { const u = rnd(); if (u < sp / 2) v = 0; else if (u < sp) v = 1; } O[k] = v; }
  seed = s0; return O;
}

/* ---------- Ränder und Faltung ---------- */
// Index an der Bildgrenze: 'zero' (−1 = Null), 'replicate', 'reflect' (…cba|abc…), 'wrap'
function bidx(i, n, mode) {
  if (i >= 0 && i < n) return i;
  if (mode === 'zero') return -1;
  if (mode === 'replicate') return i < 0 ? 0 : n - 1;
  if (mode === 'wrap') return ((i % n) + n) % n;
  const p = 2 * n; i = ((i % p) + p) % p; return i < n ? i : p - 1 - i; // reflect
}
// Korrelation mit Kernel K (kh×kw, Mittelpunkt in der Mitte)
function correlate(I, n, K, kw, kh, mode = 'reflect') {
  const O = new Float32Array(n * n), rx = kw >> 1, ry = kh >> 1;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let s = 0;
    for (let j = 0; j < kh; j++) { const yy = bidx(y + j - ry, n, mode); if (yy < 0) continue;
      for (let i = 0; i < kw; i++) { const xx = bidx(x + i - rx, n, mode); if (xx < 0) continue; s += K[j * kw + i] * I[yy * n + xx]; } }
    O[y * n + x] = s;
  }
  return O;
}
// Separierbar: erst Zeilen mit k, dann Spalten mit k
function sepFilter(I, n, k, mode = 'reflect') { return correlate(correlate(I, n, k, k.length, 1, mode), n, k, 1, k.length, mode); }
function gaussK(sigma) { const r = Math.max(1, Math.ceil(3 * sigma)), k = []; for (let i = -r; i <= r; i++) k.push(Math.exp(-i * i / (2 * sigma * sigma))); const s = k.reduce((a, b) => a + b, 0); return k.map(v => v / s); }
function boxK(w) { return Array(w).fill(1 / w); }
const gaussBlur = (I, n, sigma, mode = 'reflect') => sigma <= 0 ? Float32Array.from(I) : sepFilter(I, n, gaussK(sigma), mode);
function sobel(I, n, mode = 'reflect') {
  const gx = correlate(I, n, [-1, 0, 1, -2, 0, 2, -1, 0, 1], 3, 3, mode), gy = correlate(I, n, [-1, -2, -1, 0, 0, 0, 1, 2, 1], 3, 3, mode);
  return { gx, gy };
}
function medianFilter(I, n, size, mode = 'reflect') {
  const O = new Float32Array(n * n), r = size >> 1, buf = new Float32Array(size * size);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let m = 0; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) buf[m++] = I[bidx(y + j, n, mode) * n + bidx(x + i, n, mode)];
    O[y * n + x] = buf.slice(0, m).sort()[m >> 1];
  }
  return O;
}

/* ---------- Darstellung ---------- */
// Bild als Graustufen (lo…hi) oder vorzeichenbehaftet (sym = true) in Kasten x,y,size zeichnen
// Bild als kleines Offscreen-Canvas (ein Pixel pro Bildpixel), Farbgebung wie drawImg
function imgCanvas(I, n, o = {}) {
  const off = document.createElement('canvas'); off.width = n; off.height = n;
  const oc = off.getContext('2d'), id = oc.createImageData(n, n);
  const lo = o.lo ?? 0, hi = o.hi ?? 1, A = rgb(tok('--accent')), H = rgb(tok('--hole')), S = rgb(tok('--surface'));
  for (let k = 0; k < n * n; k++) {
    let r, g, b;
    if (o.sym) { const v = Math.max(-1, Math.min(1, I[k] / hi)), C = v >= 0 ? A : H, t = Math.abs(v); r = S[0] + (C[0] - S[0]) * t; g = S[1] + (C[1] - S[1]) * t; b = S[2] + (C[2] - S[2]) * t; }
    else if (o.mask) { const t = I[k] > 0 ? 1 : 0; r = g = b = t ? 255 : 0; if (t && o.maskCol) [r, g, b] = o.maskCol; }
    else { const t = Math.max(0, Math.min(1, (I[k] - lo) / (hi - lo))) * 255; r = g = b = t; }
    id.data[4 * k] = r; id.data[4 * k + 1] = g; id.data[4 * k + 2] = b; id.data[4 * k + 3] = 255;
  }
  oc.putImageData(id, 0, 0); return off;
}
function drawImg(ctx, I, n, x, y, size, o = {}) {
  ctx.imageSmoothingEnabled = false; ctx.drawImage(imgCanvas(I, n, o), x, y, size, size);
  ctx.strokeStyle = tok('--rule'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  if (o.title) { ctx.fillStyle = tok('--fg'); ctx.font = `600 13px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText(o.title, x, y - 6); }
}
// Bilder nebeneinander anordnen: liefert Größe und Positionen für k Bilder (umbrechen auf schmalen Schirmen)
function imgLayout(w, h, k, top = 22, gap = 14) {
  const cols = w < 520 && k > 2 ? 2 : k, rows = Math.ceil(k / cols);
  const size = Math.floor(Math.min((w - gap * (cols - 1)) / cols, (h - top - (rows - 1) * (top + gap)) / rows));
  return Array.from({ length: k }, (_, i) => ({ x: (i % cols) * (size + gap), y: top + Math.floor(i / cols) * (size + top + gap), size }));
}
// Profil entlang einer Bildzeile
const rowProfile = (I, n, y) => Array.from(I.subarray(y * n, y * n + n));
const BV_N = 128, BV_PH = phantom(BV_N);
