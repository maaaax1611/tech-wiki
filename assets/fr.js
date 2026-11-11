'use strict';
/* Hilfsfunktionen der Seite Fourier und Signale: Canvas, Achsen, Farben, Animationsschleife, Zufallszahlen, FFT, Bilder. */
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

/* ---------- Ebene mit Koordinatengitter ---------- */
// R: halbe Breite des sichtbaren Bereichs in Einheiten der kürzeren Seite
function plane(c, R = 3, cx0 = 0, cy0 = 0) {
  const { ctx, w, h } = fit(c);
  const s = Math.min(w, h) / (2 * R), cx = w / 2 - cx0 * s, cy = h / 2 + cy0 * s;
  const S = (x, y) => [cx + x * s, cy - y * s], inv = (px, py) => [(px - cx) / s, (cy - py) / s];
  const xr = [inv(0, 0)[0], inv(w, 0)[0]], yr = [inv(0, h)[1], inv(0, 0)[1]];
  return { ctx, w, h, s, S, inv, xr, yr };
}
function grid(p, step = 1) {
  const { ctx, S, xr, yr, w, h } = p;
  ctx.lineWidth = 1; ctx.strokeStyle = tok('--grid');
  ctx.beginPath();
  for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1]; x += step) { const [px] = S(x, 0); ctx.moveTo(px, 0); ctx.lineTo(px, h); }
  for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1]; y += step) { const [, py] = S(0, y); ctx.moveTo(0, py); ctx.lineTo(w, py); }
  ctx.stroke();
  ctx.strokeStyle = tok('--rule'); ctx.lineWidth = 1.4; ctx.beginPath();
  const [ox, oy] = S(0, 0); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
}
function arrow(p, x0, y0, x1, y1, col, lw = 2.4, dash) {
  const { ctx, S } = p; const [a, b] = S(x0, y0), [c, d] = S(x1, y1);
  const L = Math.hypot(c - a, d - b); if (L < 1) return;
  const ux = (c - a) / L, uy = (d - b) / L, hl = Math.min(11, L * 0.45);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
  ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c - ux * hl * 0.8, d - uy * hl * 0.8); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(c, d); ctx.lineTo(c - ux * hl - uy * hl * 0.45, d - uy * hl + ux * hl * 0.45); ctx.lineTo(c - ux * hl + uy * hl * 0.45, d - uy * hl - ux * hl * 0.45); ctx.closePath(); ctx.fill();
}
function line(p, x0, y0, x1, y1, col, lw = 1.5, dash) { const { ctx, S } = p; const [a, b] = S(x0, y0), [c, d] = S(x1, y1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); ctx.setLineDash([]); }
function label(p, x, y, txt, col, dx = 8, dy = -8, font = `600 14px ${DISP}`) { const { ctx, S } = p; const [a, b] = S(x, y); ctx.font = font; ctx.fillStyle = col; ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.fillText(txt, a + dx, b + dy); }
function dot(p, x, y, col, r = 4) { const { ctx, S } = p; const [a, b] = S(x, y); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a, b, r, 0, 2 * Math.PI); ctx.fill(); }
function handle(p, x, y, col) { const { ctx, S } = p; const [a, b] = S(x, y); ctx.fillStyle = tok('--surface'); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a, b, 6.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
function poly(p, pts, close) { const { ctx, S } = p; ctx.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = S(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); if (close) ctx.closePath(); }

// Ziehbare Punkte: hs = [{get, set}], view() liefert die aktuelle Ebene
function draggable(c, hs, view, onchange, onClickEmpty) {
  let act = null;
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.style.touchAction = 'none';
  c.addEventListener('pointerdown', e => {
    const p = view(); if (!p) return; const [mx, my] = pos(e);
    let best = null, bd = 22;
    hs.forEach(h => { const [x, y] = h.get(); const [a, b] = p.S(x, y); const d = Math.hypot(a - mx, b - my); if (d < bd) { bd = d; best = h; } });
    if (best) { act = best; c.setPointerCapture(e.pointerId); e.preventDefault(); }
    else if (onClickEmpty) { onClickEmpty(...p.inv(mx, my)); }
  });
  c.addEventListener('pointermove', e => {
    const p = view(); if (!p) return; const [mx, my] = pos(e);
    if (act) { let [x, y] = p.inv(mx, my); x = Math.max(p.xr[0] + 0.1, Math.min(p.xr[1] - 0.1, x)); y = Math.max(p.yr[0] + 0.1, Math.min(p.yr[1] - 0.1, y)); act.set(Math.round(x * 10) / 10, Math.round(y * 10) / 10); onchange(); }
    else c.style.cursor = hs.some(h => { const [x, y] = h.get(); const [a, b] = p.S(x, y); return Math.hypot(a - mx, b - my) < 22; }) ? 'grab' : (onClickEmpty ? 'crosshair' : 'default');
  });
  const up = () => { act = null; }; c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
}

function mouse(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
const setSeed = s => { seed = s; };
function curve(ctx, f, X, Y, x0, x1, n = 200) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke(); }
function legend(ctx, x, y, items, o = {}) {
  ctx.font = `12px ${DISP}`; ctx.textAlign = 'left';
  const ws = items.map(([t]) => 16 + ctx.measureText(t).width + 16), tot = ws.reduce((a, v) => a + v, 0) - 16;
  let px = o.right ? x - tot : x, py = y; const x0 = px;
  items.forEach(([txt, col], i) => { if (o.maxW && px > x0 && px - x0 + ws[i] - 16 > o.maxW) { px = x0; py += 16; }
    ctx.fillStyle = col; ctx.fillRect(px, py - 8, 12, 3); ctx.fillStyle = tok('--muted'); ctx.fillText(txt, px + 16, py - 3); px += ws[i]; });
  return py;
}
function title(ctx, t, x, y) { ctx.font = `600 13px ${DISP}`; ctx.fillStyle = tok('--fg'); ctx.textAlign = 'left'; ctx.fillText(t, x, y); }
const sinc = x => Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);

/* ---------- FFT (Radix 2, in place) ---------- */
function fft(re, im, inv = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
// 2D-FFT eines n×n-Bildes (Zeilen, dann Spalten)
function fft2(re, im, n, inv = false) {
  const r = new Float64Array(n), i_ = new Float64Array(n);
  for (let y = 0; y < n; y++) { for (let x = 0; x < n; x++) { r[x] = re[y * n + x]; i_[x] = im[y * n + x]; } fft(r, i_, inv); for (let x = 0; x < n; x++) { re[y * n + x] = r[x]; im[y * n + x] = i_[x]; } }
  for (let x = 0; x < n; x++) { for (let y = 0; y < n; y++) { r[y] = re[y * n + x]; i_[y] = im[y * n + x]; } fft(r, i_, inv); for (let y = 0; y < n; y++) { re[y * n + x] = r[y]; im[y * n + x] = i_[y]; } }
}
// Frequenzindex mit Nullpunkt in der Mitte
const fshift = (k, n) => (k + n / 2) % n;

/* ---------- Bilder ---------- */
function drawImg(ctx, I, n, x, y, size, o = {}) {
  const off = document.createElement('canvas'); off.width = n; off.height = n; const oc = off.getContext('2d'), id = oc.createImageData(n, n);
  const lo = o.lo ?? 0, hi = o.hi ?? 1, A = rgb(tok('--accent')), H = rgb(tok('--hole')), S = rgb(tok('--surface'));
  for (let k = 0; k < n * n; k++) { let r, g, b;
    if (o.sym) { const v = Math.max(-1, Math.min(1, I[k] / hi)), C = v >= 0 ? A : H, t = Math.abs(v); r = S[0] + (C[0] - S[0]) * t; g = S[1] + (C[1] - S[1]) * t; b = S[2] + (C[2] - S[2]) * t; }
    else { const t = Math.max(0, Math.min(1, (I[k] - lo) / (hi - lo))) * 255; r = g = b = t; }
    id.data[4 * k] = r; id.data[4 * k + 1] = g; id.data[4 * k + 2] = b; id.data[4 * k + 3] = 255; }
  oc.putImageData(id, 0, 0); ctx.imageSmoothingEnabled = !!o.smooth; ctx.drawImage(off, x, y, size, size);
  ctx.strokeStyle = tok('--rule'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  if (o.title) { ctx.fillStyle = tok('--fg'); ctx.font = `600 13px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText(o.title, x, y - 6); }
}
function imgLayout(w, h, k, top = 22, gap = 14) {
  const cols = w < 520 && k > 2 ? 2 : k, rows = Math.ceil(k / cols);
  const size = Math.floor(Math.min((w - gap * (cols - 1)) / cols, (h - top - (rows - 1) * (top + gap)) / rows));
  return Array.from({ length: k }, (_, i) => ({ x: (i % cols) * (size + gap), y: top + Math.floor(i / cols) * (size + top + gap), size }));
}
// Testbild 128×128: Flächen, Kreis, Linien, Gitter
function testImage(n) {
  const I = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let v = 0.18;
    if (x > 14 && x < 54 && y > 16 && y < 50) v = 0.75;
    if ((x - 92) ** 2 + (y - 34) ** 2 < 19 ** 2) v = 0.55 + 0.35 * Math.exp(-((x - 92) ** 2 + (y - 34) ** 2) / 70);
    if (y > 70 && y < 112 && x > 66 && x < 116) v = ((x >> 2) % 2) ? 0.85 : 0.25;
    if (y > 64 && y < 68 && x > 8 && x < 120) v = 0.95;
    if (Math.abs((x - 12) - (y - 74)) < 1.6 && x > 12 && x < 52) v = 0.9;
    I[y * n + x] = v; }
  return I;
}
