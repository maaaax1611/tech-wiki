'use strict';
/* Hilfsfunktionen der Seite Vektoranalysis und Optimierung: Canvas, Achsen, Farben, Animationsschleife, Ebenen, ziehbare Punkte, Höhenlinien, Testfunktionen, numerische Ableitungen. */
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
    if (act) { let [x, y] = p.inv(mx, my); x = Math.max(p.xr[0] + 0.1, Math.min(p.xr[1] - 0.1, x)); y = Math.max(p.yr[0] + 0.1, Math.min(p.yr[1] - 0.1, y)); act.set(Math.round(x * 100) / 100, Math.round(y * 100) / 100); onchange(); }
    else c.style.cursor = hs.some(h => { const [x, y] = h.get(); const [a, b] = p.S(x, y); return Math.hypot(a - mx, b - my) < 22; }) ? 'grab' : (onClickEmpty ? 'crosshair' : 'default');
  });
  const up = () => { act = null; }; c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
}

function mouse(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

/* ---------- Ebene in einem Teilbereich des Canvas ---------- */
// x0,y0,w,h: Pixelbereich; R: halbe Breite der kürzeren Seite in Einheiten; (cx0, cy0): Mitte in Einheiten
function view(ctx, x0, y0, w, h, R, cx0 = 0, cy0 = 0) {
  const s = Math.min(w, h) / (2 * R), cx = x0 + w / 2 - cx0 * s, cy = y0 + h / 2 + cy0 * s;
  const S = (x, y) => [cx + x * s, cy - y * s], inv = (px, py) => [(px - cx) / s, (cy - py) / s];
  const xr = [inv(x0, 0)[0], inv(x0 + w, 0)[0]], yr = [inv(0, y0 + h)[1], inv(0, y0)[1]];
  return { ctx, w, h, x0, y0, s, S, inv, xr, yr, clip() { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); }, unclip() { ctx.restore(); } };
}

/* ---------- Höhenlinien und Schattierung ---------- */
// Feld auf Raster auswerten (in Pixeln, Schrittweite st)
function sample(P, f, st = 4) {
  const nx = Math.ceil(P.w / st) + 1, ny = Math.ceil(P.h / st) + 1, V = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const [x, y] = P.inv(P.x0 + i * st, P.y0 + j * st); V[j * nx + i] = f(x, y); }
  return { nx, ny, V, st };
}
// leichte Schattierung: niedrige Werte dunkler (Akzentfarbe), als kleines Bild gerechnet und weich skaliert
function shade(P, G, lo, hi, col, amax = 0.35) {
  const { ctx } = P, [r, g, b] = rgb(col), off = document.createElement('canvas'); off.width = G.nx; off.height = G.ny;
  const oc = off.getContext('2d'), id = oc.createImageData(G.nx, G.ny);
  for (let k = 0; k < G.nx * G.ny; k++) { const t = Math.max(0, Math.min(1, (G.V[k] - lo) / (hi - lo))); id.data[4 * k] = r; id.data[4 * k + 1] = g; id.data[4 * k + 2] = b; id.data[4 * k + 3] = Math.round(255 * amax * (1 - t)); }
  oc.putImageData(id, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, P.x0, P.y0, (G.nx - 1) * G.st, (G.ny - 1) * G.st);
}
// Höhenlinien mit Marching Squares
function contours(P, G, levels, col, lw = 1) {
  const { ctx } = P, { nx, ny, V, st } = G; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
  for (const L of levels) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = V[j * nx + i] - L, b = V[j * nx + i + 1] - L, c = V[(j + 1) * nx + i + 1] - L, d = V[(j + 1) * nx + i] - L;
    const pts = [], X = P.x0 + i * st, Y = P.y0 + j * st;
    if ((a > 0) !== (b > 0)) pts.push([X + st * a / (a - b), Y]);
    if ((b > 0) !== (c > 0)) pts.push([X + st, Y + st * b / (b - c)]);
    if ((d > 0) !== (c > 0)) pts.push([X + st * d / (d - c), Y + st]);
    if ((a > 0) !== (d > 0)) pts.push([X, Y + st * a / (a - d)]);
    if (pts.length >= 2) { ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); }
    if (pts.length === 4) { ctx.moveTo(...pts[2]); ctx.lineTo(...pts[3]); }
  }
  ctx.stroke();
}
const linLevels = (lo, hi, n) => Array.from({ length: n }, (_, k) => lo + (hi - lo) * (k + 0.5) / n);

/* ---------- numerische Ableitungen ---------- */
const H_ = 1e-4;
const grad2 = (f, x, y) => [(f(x + H_, y) - f(x - H_, y)) / (2 * H_), (f(x, y + H_) - f(x, y - H_)) / (2 * H_)];
function hess2(f, x, y) { const h = 1e-3, fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h), fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h), fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h); return [fxx, fxy, fxy, fyy]; }
function eigSym2([a, b, , d]) { const tr = a + d, s = Math.sqrt(Math.max(0, (a - d) ** 2 / 4 + b * b)), l1 = tr / 2 + s, l2 = tr / 2 - s; const phi = 0.5 * Math.atan2(2 * b, a - d); return { l: [l1, l2], v: [[Math.cos(phi), Math.sin(phi)], [-Math.sin(phi), Math.cos(phi)]] }; }

/* ---------- Testfunktionen ---------- */
const g2 = (x, y, mx, my, s) => Math.exp(-((x - mx) ** 2 + (y - my) ** 2) / (2 * s * s));
const LANDS = {
  schale: { name: 'Schale (quadratisch)', f: (x, y) => { const c = Math.cos(0.5), s = Math.sin(0.5), u = c * x + s * y, v = -s * x + c * y; return 0.5 * (0.6 * u * u + 2.2 * v * v); }, lo: 0, hi: 9 },
  mulden: { name: 'zwei Mulden', f: (x, y) => 2.2 - 2 * g2(x, y, -1.3, -0.4, 0.9) - 1.4 * g2(x, y, 1.4, 0.7, 0.8) + 0.06 * (x * x + y * y), lo: 0, hi: 2.8 },
  sattel: { name: 'Sattel', f: (x, y) => 0.35 * (x * x - y * y) + 0.04 * x * y * y, lo: -3, hi: 3 },
  gut: { name: 'gut konditioniert', f: (x, y) => 0.5 * (x * x + y * y), lo: 0, hi: 9, H: [1, 0, 0, 1] },
  schlecht: { name: 'schlecht konditioniert', f: (x, y) => 0.5 * (0.5 * x * x + 8 * y * y), lo: 0, hi: 16, H: [0.5, 0, 0, 8] },
  rosen: { name: 'Rosenbrock-Tal', f: (x, y) => 0.1 * ((1 - x) ** 2 + 10 * (y - x * x) ** 2), lo: 0, hi: 6 },
};
// Legende ab (x, y); maxW: Umbruch in neue Zeile; right: rechtsbündig bis x
function legend(ctx, x, y, items, o = {}) {
  ctx.font = `12px ${DISP}`; ctx.textAlign = 'left';
  const ws = items.map(([t]) => 16 + ctx.measureText(t).width + 16), tot = ws.reduce((a, v) => a + v, 0) - 16;
  let px = o.right ? x - tot : x, py = y; const x0 = px;
  items.forEach(([txt, col], i) => { if (o.maxW && px > x0 && px - x0 + ws[i] - 16 > o.maxW) { px = x0; py += 16; }
    ctx.fillStyle = col; ctx.fillRect(px, py - 8, 12, 3); ctx.fillStyle = tok('--muted'); ctx.fillText(txt, px + 16, py - 3); px += ws[i]; });
  return py;
}
function arrowPx(ctx, x1, y1, x2, y2, col, lw = 1.4) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7 * Math.cos(a - 0.4), y2 - 7 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 7 * Math.cos(a + 0.4), y2 - 7 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}
const setSeed = s => { seed = s; };
