/* Hilfsfunktionen der Seite Skalenraum und Pyramiden (baut auf bv.js auf): REDUCE, EXPAND, Gauß- und Laplace-Pyramide, Haar-Wavelet, Testbilder. */
const PY_W = [1, 4, 6, 4, 1].map(v => v / 16);
// Glätten mit [1,4,6,4,1]/16 und jedes zweite Pixel nehmen: n → n/2
function reduce(I, n) {
  const B = sepFilter(I, n, PY_W, 'reflect'), m = n >> 1, O = new Float32Array(m * m);
  for (let y = 0; y < m; y++) for (let x = 0; x < m; x++) O[y * m + x] = B[2 * y * n + 2 * x];
  return O;
}
// Nullen einfügen und mit 2·[1,4,6,4,1]/16 je Richtung glätten: n → 2n
function expand(I, n) {
  const m = 2 * n, U = new Float32Array(m * m);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) U[2 * y * m + 2 * x] = I[y * n + x];
  return sepFilter(U, m, PY_W.map(v => 2 * v), 'reflect');
}
// Pyramiden als Listen {I, n}
function gaussPyr(I, n, levels) { const P = [{ I, n }]; for (let k = 1; k < levels; k++) { const p = P[k - 1]; P.push({ I: reduce(p.I, p.n), n: p.n >> 1 }); } return P; }
function lapPyr(I, n, levels) {
  const G = gaussPyr(I, n, levels), L = [];
  for (let k = 0; k < levels - 1; k++) { const E = expand(G[k + 1].I, G[k + 1].n), D = new Float32Array(G[k].n * G[k].n); for (let q = 0; q < D.length; q++) D[q] = G[k].I[q] - E[q]; L.push({ I: D, n: G[k].n }); }
  L.push(G[levels - 1]);
  return L;
}
// Rekonstruktion: von oben EXPAND und Ebene addieren; gains[k] skaliert Ebene k (Standard 1)
function lapRecon(L, gains) {
  const top = L.length - 1; let R = Float32Array.from(L[top].I).map(v => v * (gains ? gains[top] ?? 1 : 1)), n = L[top].n;
  for (let k = top - 1; k >= 0; k--) { const E = expand(R, n), g = gains ? gains[k] ?? 1 : 1; n = L[k].n; R = new Float32Array(n * n); for (let q = 0; q < R.length; q++) R[q] = E[q] + g * L[k].I[q]; }
  return R;
}
// Einfache Unterabtastung ohne Glättung
function decimate(I, n, f) { const m = Math.floor(n / f), O = new Float32Array(m * m); for (let y = 0; y < m; y++) for (let x = 0; x < m; x++) O[y * m + x] = I[y * f * n + x * f]; return { I: O, n: m }; }
// Eine Haar-Stufe: LL, LH (waagrechte Kanten), HL (senkrechte), HH (diagonal), orthonormal
function haar(I, n) {
  const m = n >> 1, LL = new Float32Array(m * m), LH = new Float32Array(m * m), HL = new Float32Array(m * m), HH = new Float32Array(m * m);
  for (let y = 0; y < m; y++) for (let x = 0; x < m; x++) {
    const a = I[2 * y * n + 2 * x], b = I[2 * y * n + 2 * x + 1], c = I[(2 * y + 1) * n + 2 * x], d = I[(2 * y + 1) * n + 2 * x + 1], q = y * m + x;
    LL[q] = (a + b + c + d) / 2; HL[q] = (a - b + c - d) / 2; LH[q] = (a + b - c - d) / 2; HH[q] = (a - b - c + d) / 2;
  }
  return { LL, LH, HL, HH, n: m };
}
// Zonenplatte: Ringe, deren Frequenz nach außen bis Nyquist steigt
function zonePlate(n) { const I = new Float32Array(n * n), c = n / 2; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const r2 = (x - c) ** 2 + (y - c) ** 2; I[y * n + x] = 0.5 + 0.5 * Math.cos(Math.PI * r2 / (2 * c)); } return I; }
// Gauß-Flecken verschiedener Größe auf dunklem Grund
const PY_BLOBS = [[22, 24, 2], [60, 22, 3.5], [102, 28, 6], [30, 82, 9], [86, 88, 14]];
function blobImage(n) { const I = new Float32Array(n * n).fill(0.1); for (const [bx, by, r] of PY_BLOBS) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x - bx) ** 2 + (y - by) ** 2 <= r * r) I[y * n + x] = 0.85; return I; }
// Bild einer Pyramidenebene vergrößert (nächster Nachbar) auf die Größe des Originals
function upNearest(I, n, N) { const O = new Float32Array(N * N), f = N / n; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) O[y * N + x] = I[Math.floor(y / f) * n + Math.floor(x / f)]; return O; }
const maxAbs = A => { let m = 0; for (const v of A) m = Math.max(m, Math.abs(v)); return m || 1; };
