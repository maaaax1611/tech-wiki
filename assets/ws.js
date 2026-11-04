'use strict';
/* Hilfsfunktionen der Seite Wahrscheinlichkeit und Statistik: Canvas, Achsen, Farben, Animationsschleife, Ebene, Zufallszahlen, Verteilungen. */
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

/* ---------- Zufallszahlen mit festem Startwert ---------- */
const setSeed = s => { seed = s; };
function rPois(lam) { // Knuth für kleine λ, sonst Normalnäherung mit Rundung
  if (lam > 60) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
  const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
}
const rExp = (rate = 1) => -Math.log(1 - rnd()) / rate;

/* ---------- Verteilungen ---------- */
function lgamma(x) { // Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
const lfact = k => lgamma(k + 1);
const binomPmf = (k, n, p) => k < 0 || k > n ? 0 : Math.exp(lfact(n) - lfact(k) - lfact(n - k) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0));
const poisPmf = (k, lam) => k < 0 ? 0 : Math.exp(k * Math.log(lam) - lam - lfact(k));
const normPdf = (x, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const normCdf = (x, mu = 0, s = 1) => 0.5 * (1 + erf((x - mu) / (s * Math.SQRT2)));
const mean = A => A.reduce((a, v) => a + v, 0) / A.length;
const variance = (A, ddof = 1) => { const m = mean(A); return A.reduce((a, v) => a + (v - m) ** 2, 0) / (A.length - ddof); };
// Histogramm: Zählungen in nb Klassen zwischen lo und hi
function hist(A, lo, hi, nb) { const H = new Array(nb).fill(0), w = (hi - lo) / nb; for (const v of A) { const i = Math.floor((v - lo) / w); if (i >= 0 && i < nb) H[i]++; } return { H, w }; }
// Kurve zeichnen
function curve(ctx, f, X, Y, x0, x1, n = 200) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke(); }
// Legende ab (x, y); maxW: Umbruch in neue Zeile; right: rechtsbündig bis x
function legend(ctx, x, y, items, o = {}) {
  ctx.font = `12px ${DISP}`; ctx.textAlign = 'left';
  const ws = items.map(([t]) => 16 + ctx.measureText(t).width + 16), tot = ws.reduce((a, v) => a + v, 0) - 16;
  let px = o.right ? x - tot : x, py = y; const x0 = px;
  items.forEach(([txt, col], i) => { if (o.maxW && px > x0 && px - x0 + ws[i] - 16 > o.maxW) { px = x0; py += 16; }
    ctx.fillStyle = col; ctx.fillRect(px, py - 8, 12, 3); ctx.fillStyle = tok('--muted'); ctx.fillText(txt, px + 16, py - 3); px += ws[i]; });
  return py;
}
function mouse(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
