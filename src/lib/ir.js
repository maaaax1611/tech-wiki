'use strict';
/* Hilfsfunktionen der Seite Iterative Rekonstruktion: Canvas, Achsen, Farben, Zufallszahlen, Bilder, Phantom, dünne Systemmatrix und Löser. */
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

/* ---------- Phantom ---------- */
// Vereinfachtes Shepp-Logan-Phantom auf n×n, Werte etwa 0 … 1 (relative Schwächung)
const PH_ELL = [[0, 0, 0.69, 0.92, 0, 0.8], [0, -0.0184, 0.6624, 0.874, 0, -0.6], [0.22, 0, 0.11, 0.31, -18, -0.12], [-0.22, 0, 0.16, 0.41, 18, -0.12],
  [0, 0.35, 0.21, 0.25, 0, 0.12], [0, 0.1, 0.046, 0.046, 0, 0.15], [0, -0.1, 0.046, 0.046, 0, 0.15], [-0.08, -0.605, 0.046, 0.023, 0, 0.15], [0.06, -0.605, 0.023, 0.046, 0, 0.15]];
function phantom(n, extra = []) {
  const I = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const u = (2 * x + 1) / n - 1, v = 1 - (2 * y + 1) / n; let s = 0;
    for (const [cx, cy, a, b, th, val] of [...PH_ELL, ...extra]) { const t = th * Math.PI / 180, dx = u - cx, dy = v - cy, X = dx * Math.cos(t) + dy * Math.sin(t), Y = -dx * Math.sin(t) + dy * Math.cos(t); if ((X / a) ** 2 + (Y / b) ** 2 <= 1) s += val; }
    I[y * n + x] = s; }
  return I;
}

/* ---------- dünne Systemmatrix ---------- */
// Parallelstrahl, nAng Winkel über 180°, nDet Strahlen; Gewicht = Weglänge (Abtastung im halben Pixelabstand, nächstes Pixel)
function buildA(n, nAng, nDet) {
  const idx = [], val = [], ptr = [0], step = 0.5, R = n / 2, ds = n * Math.SQRT2 / nDet;
  for (let a = 0; a < nAng; a++) { const th = Math.PI * a / nAng, c = Math.cos(th), s = Math.sin(th);
    for (let d = 0; d < nDet; d++) { const t = (d - (nDet - 1) / 2) * ds, row = new Map();
      for (let l = -R * 1.5; l <= R * 1.5; l += step) { const x = t * c - l * s + R, y = t * s + l * c + R, ix = Math.floor(x), iy = Math.floor(y);
        if (ix >= 0 && ix < n && iy >= 0 && iy < n) { const k = (n - 1 - iy) * n + ix; row.set(k, (row.get(k) || 0) + step); } }
      for (const [k, w] of row) { idx.push(k); val.push(w * 2 / n); } ptr.push(idx.length); } }
  const A = { n, m: nAng * nDet, nAng, nDet, idx: Int32Array.from(idx), val: Float32Array.from(val), ptr: Int32Array.from(ptr) };
  A.rs = new Float64Array(A.m); A.cs = new Float64Array(n * n);
  for (let i = 0; i < A.m; i++) for (let q = A.ptr[i]; q < A.ptr[i + 1]; q++) { A.rs[i] += A.val[q]; A.cs[A.idx[q]] += A.val[q]; }
  return A;
}
function fwd(A, x) { const p = new Float64Array(A.m); for (let i = 0; i < A.m; i++) { let s = 0; for (let q = A.ptr[i]; q < A.ptr[i + 1]; q++) s += A.val[q] * x[A.idx[q]]; p[i] = s; } return p; }
function back(A, r) { const x = new Float64Array(A.n * A.n); for (let i = 0; i < A.m; i++) { const v = r[i]; if (!v) continue; for (let q = A.ptr[i]; q < A.ptr[i + 1]; q++) x[A.idx[q]] += A.val[q] * v; } return x; }
function poisson(l) { if (l < 30) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; } return Math.max(0, Math.round(l + Math.sqrt(l) * gauss())); }
// Messung mit Poisson-Rauschen bei I0 Photonen pro Strahl: liefert Linienintegrale und Zählwerte
// S skaliert die Schwächung (größer = dichteres Objekt, weniger Photonen kommen durch)
function measure(A, x, I0, S = 1) { const p = fwd(A, x), N = new Float64Array(A.m), q = new Float64Array(A.m);
  for (let i = 0; i < A.m; i++) { N[i] = I0 ? poisson(I0 * Math.exp(-S * p[i])) : 0; q[i] = I0 ? -Math.log(Math.max(N[i], 1) / I0) / S : p[i]; } return { p: q, N }; }
// Gewichteter, vorkonditionierter Gradientenabstieg (SIRT-Form) mit optionaler Regularisierung
// minimiert ½ Σ wᵢ (aᵢx − pᵢ)² + β R(x); grad(x) liefert ∇R
function solve(A, p, o = {}) {
  const n = A.n, N2 = n * n, w = o.w || null, it = o.iter || 100, beta = o.beta || 0, lam = o.lam ?? 1;
  const D = new Float64Array(A.m); for (let i = 0; i < A.m; i++) D[i] = (w ? w[i] : 1) / (A.rs[i] || 1);
  const C = back(A, w || new Float64Array(A.m).fill(1)); for (let j = 0; j < N2; j++) C[j] = C[j] > 1e-9 ? 1 / C[j] : 0;
  let x = o.x0 ? Float64Array.from(o.x0) : new Float64Array(N2); const hist = [];
  for (let k = 0; k < it; k++) { const r = fwd(A, x); for (let i = 0; i < A.m; i++) r[i] = (p[i] - r[i]) * D[i]; const g = back(A, r);
    const gr = beta && o.grad ? o.grad(x) : null;
    for (let j = 0; j < N2; j++) { x[j] += lam * C[j] * (g[j] - (gr ? beta * gr[j] : 0)); if (o.pos && x[j] < 0) x[j] = 0; }
    if (o.each) o.each(k, x); }
  return x;
}
// Gradienten der Regularisierer über Nachbarn rechts und unten, alle auf ähnliche Größenordnung skaliert
// quad: 0,05·d (Tikhonov auf Differenzen), huber: wie quad bis δ = 0,02, dann konstant, tv: ε·d/√(d² + ε²) mit ε = 0,01
function regGrad(type, n) {
  return x => { const g = new Float64Array(n * n);
    const add = (a, b) => { const d = x[a] - x[b]; const v = type === 'quad' ? 0.05 * d : type === 'huber' ? Math.max(-0.02, Math.min(0.02, d)) : 0.01 * d / Math.sqrt(d * d + 1e-4); g[a] += v; g[b] -= v; };
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) { const k = y * n + xx; if (xx + 1 < n) add(k, k + 1); if (y + 1 < n) add(k, k + n); }
    return g; };
}
const rmse = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s / a.length); };

// Eigenzerlegung symmetrischer Matrizen (Jacobi), Float64Array n*n; Eigenwerte absteigend, Eigenvektoren als Spalten von V (n*n)
function jacobiEig(Sin, n) {
  const S = Float64Array.from(Sin), V = new Float64Array(n * n); for (let i = 0; i < n; i++) V[i * n + i] = 1;
  for (let sweep = 0; sweep < 40; sweep++) { let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += S[p * n + q] ** 2; if (off < 1e-20) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) { const apq = S[p * n + q]; if (Math.abs(apq) < 1e-15) continue;
      const tau = (S[q * n + q] - S[p * n + p]) / (2 * apq), t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau)), cs = 1 / Math.sqrt(1 + t * t), sn = t * cs;
      for (let k = 0; k < n; k++) { const a = S[k * n + p], b = S[k * n + q]; S[k * n + p] = cs * a - sn * b; S[k * n + q] = sn * a + cs * b; }
      for (let k = 0; k < n; k++) { const a = S[p * n + k], b = S[q * n + k]; S[p * n + k] = cs * a - sn * b; S[q * n + k] = sn * a + cs * b; }
      for (let k = 0; k < n; k++) { const a = V[k * n + p], b = V[k * n + q]; V[k * n + p] = cs * a - sn * b; V[k * n + q] = sn * a + cs * b; } } }
  const ord = [...Array(n).keys()].sort((i, j) => S[j * n + j] - S[i * n + i]);
  return { val: ord.map(i => S[i * n + i]), vec: ord.map(i => Float64Array.from({ length: n }, (_, k) => V[k * n + i])) };
}
