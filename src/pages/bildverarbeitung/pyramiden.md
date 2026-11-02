---
title: Skalenraum und Pyramiden
category: bildverarbeitung
eyebrow: Bildverarbeitung · Multiskalen
footer: Alle Abbildungen rechnen im Browser auf künstlichen Testbildern mit 128 × 128 Pixeln. Code-Beispiele in NumPy/SciPy, darunter jeweils die übliche OpenCV-Variante.
---

Wie man ein Bild in Strukturen verschiedener Größe zerlegt. Vom Gauß-Skalenraum über das Verkleinern ohne Aliasing zur Gaußschen und Laplace-Pyramide, weiter zu Blob-Erkennung mit Difference of Gaussians und zu den Anwendungen: Multiskalen-Kontrastanhebung, nahtloses Überblenden und Wavelets.

## Strukturen haben eine Größe {#groesse group="Grundidee"}

Ein Röntgenbild enthält feine Kalkablagerungen, Gefäße, Organe und den Umriss des ganzen Körpers. Ein Filter mit fester Größe kann nicht alle gleichzeitig richtig behandeln: Ein Kantendetektor mit kleinem σ findet feine Kanten, aber auch jedes Rauschkorn; mit großem σ sieht er nur noch die groben Umrisse. Welche Größe richtig ist, weiß man vorher meist nicht.

Die Lösung ist, das Bild auf **vielen Skalen** gleichzeitig zu betrachten. Das hat drei Vorteile:

- **Suchen:** Ein Objekt unbekannter Größe findet man, indem man auf allen Skalen sucht und die nimmt, auf der es am stärksten antwortet (Abschnitt 6).
- **Trennen:** Feine Details, mittlere Strukturen und grobe Helligkeitsverläufe lassen sich getrennt bearbeiten, etwa verstärken oder dämpfen (Abschnitt 7).
- **Rechenzeit:** Grobe Strukturen braucht man nicht in voller Auflösung zu verarbeiten. Auf einem halb so großen Bild ist jeder Schritt viermal schneller, und ein großer Filter wird zu einem kleinen.

## Gauß-Skalenraum {#skalenraum}

Der **Skalenraum** eines Bildes ist die Familie aller seiner Gauß-geglätteten Versionen, mit σ als zusätzlicher Koordinate:

$$
L(x, y, \sigma) = G_\sigma * f
$$

Für $\sigma = 0$ ist das das Original, mit wachsendem σ verschwinden immer größere Strukturen. Dass man dafür gerade den Gaußfilter nimmt, ist kein Zufall. Er ist der einzige lineare Filter mit einer Reihe von Eigenschaften, die man von „Herauszoomen“ erwartet:

- **Kaskade:** Zweimal hintereinander glätten ist wieder Gauß, $G_{\sigma_1} * G_{\sigma_2} = G_{\sqrt{\sigma_1^2 + \sigma_2^2}}$. Feinere Skalen lassen sich schrittweise in gröbere überführen.
- **Keine neuen Strukturen:** Beim Glätten verschwinden Strukturen nur, es entstehen keine neuen. In 1D nimmt die Zahl der lokalen Extrema und Nulldurchgänge mit σ nie zu. In 2D gilt das in etwas schwächerer Form.
- **Symmetrie:** Er ist rotationssymmetrisch und behandelt alle Orte gleich.

Physikalisch ist der Gauß-Skalenraum die Lösung der Wärmeleitungsgleichung $\partial L/\partial t = \tfrac12\nabla^2 L$ mit $t = \sigma^2$: Das Bild „zerfließt“ wie eine Temperaturverteilung.

::: widget py-01-skalenraum

> [!abstract] Merke
> - Skalenraum $L(x, y, \sigma) = G_\sigma * f$: das Bild auf allen Glättungsstufen.
> - Gauß: Kaskade $\sigma = \sqrt{\sigma_1^2 + \sigma_2^2}$, keine neuen Strukturen beim Glätten.

## Verkleinern und Aliasing {#aliasing group="Pyramiden"}

Im Skalenraum hat jede Ebene die volle Auflösung. Das ist verschwenderisch, denn nach dem Glätten mit großem σ enthält das Bild keine feinen Details mehr, die man mit vielen Pixeln darstellen müsste. Man kann es verkleinern.

Verkleinern heißt **Unterabtasten**: Man behält nur jedes zweite Pixel. Ein Bild mit Pixelabstand 1 kann Frequenzen bis 0,5 Perioden pro Pixel darstellen (Nyquist-Grenze). Nach dem Halbieren liegt die Grenze bei 0,25 Perioden pro Originalpixel. Alles, was darüber liegt, verschwindet nicht einfach, sondern wird auf eine falsche, tiefere Frequenz gefaltet: **Aliasing**. Feine Gitter erscheinen als grobe Moiré-Muster, schräge Kanten als Treppen.

Deshalb gilt: **erst glätten, dann unterabtasten.** Der Tiefpass soll alles oberhalb der neuen Nyquist-Grenze entfernen und darunter möglichst viel stehen lassen. Ein idealer Tiefpass ist nicht realisierbar, ein Gaußfilter mit $\sigma \approx 1$ Pixel ist für das Halbieren ein guter Kompromiss.

::: widget py-02-aliasing

## Gaußsche Pyramide {#gausspyramide toc="Gaußsche Pyramide"}

Die **Gaußsche Pyramide** wiederholt „glätten und halbieren“ mehrmals. Aus dem Original $G_0$ entsteht jede weitere Ebene mit der Operation **REDUCE**:

$$
G_{k+1} = \operatorname{REDUCE}(G_k) = \big(w * G_k\big)\!\downarrow_2, \qquad w = \tfrac1{16}\,[1,\ 4,\ 6,\ 4,\ 1]
$$

$\downarrow_2$ heißt: jedes zweite Pixel in jeder Richtung. Der Kern $w$ ist eine Binomialnäherung an einen Gauß mit $\sigma = 1$, separierbar in Zeilen und Spalten. Weil jede Ebene im Maßstab der vorigen geglättet wird, entspricht Ebene $k$ ungefähr dem Skalenraum bei $\sigma \approx 2^k$ Originalpixeln.

Ein 512 × 512-Bild ergibt Ebenen mit 256, 128, 64, … Pixeln Kantenlänge. Jede Ebene hat ein Viertel der Pixel der vorigen, alle zusammen also

$$
N\left(1 + \tfrac14 + \tfrac1{16} + \dots\right) = \tfrac43\,N
$$

Die ganze Pyramide braucht nur ein Drittel mehr Speicher als das Original.

::: widget py-03-gauss-pyramide

```python
import numpy as np, cv2
from scipy import ndimage

def reduce(f):
    w = np.array([1, 4, 6, 4, 1]) / 16
    g = ndimage.correlate1d(ndimage.correlate1d(f, w, axis=0), w, axis=1)
    return g[::2, ::2]

G = [f]
for _ in range(4):
    G.append(reduce(G[-1]))          # oder: G.append(cv2.pyrDown(G[-1]))
```

## Laplace-Pyramide {#laplacepyramide toc="Laplace-Pyramide"}

Die Gaußsche Pyramide sagt, wie das Bild auf jeder Skala aussieht. Oft interessiert aber, was auf jeder Skala **dazukommt**: die Details, die beim Verkleinern verloren gehen. Dafür braucht man die Gegenoperation **EXPAND**: Zwischen die Pixel Nullen einfügen und mit demselben Kern glätten, mal 4, weil nur ein Viertel der Werte nicht null ist:

$$
\operatorname{EXPAND}(G_{k+1}) = 4\,w * \big(G_{k+1}\!\uparrow_2\big)
$$

Die **Laplace-Pyramide** (Burt und Adelson, 1983) speichert in jeder Ebene die Differenz zwischen einer Gauß-Ebene und der vergrößerten nächsten:

$$
L_k = G_k - \operatorname{EXPAND}(G_{k+1}), \qquad k = 0, \dots, K - 1, \qquad L_K = G_K
$$

Jede Ebene ist ein **Bandpass**: Sie enthält die Strukturen, die zu groß für die vorige und zu klein für die nächste Ebene sind. Der Name kommt daher, dass die Differenz zweier Gaußfilter dem Laplacian of Gaussian ähnelt (Abschnitt 6). Weil jede Ebene genau die fehlenden Details enthält, lässt sich das Original **exakt** zurückgewinnen, von oben nach unten:

$$
G_k = L_k + \operatorname{EXPAND}(G_{k+1})
$$

Das gilt unabhängig davon, wie gut REDUCE und EXPAND sind, denn jeder Fehler beim Vergrößern steckt ja in $L_k$. Die Laplace-Pyramide ist **übervollständig**, sie hat wie die Gaußsche $\tfrac43 N$ Werte. Dafür sind die meisten Detailwerte nahe null, was sie gut komprimierbar macht. Das war die ursprüngliche Motivation der Erfinder.

::: widget py-04-laplace-pyramide

```python
def expand(g, shape):
    w = np.array([1, 4, 6, 4, 1]) / 16
    u = np.zeros(shape); u[::2, ::2] = g
    return 4 * ndimage.correlate1d(ndimage.correlate1d(u, w, axis=0), w, axis=1)

L = [G[k] - expand(G[k + 1], G[k].shape) for k in range(len(G) - 1)] + [G[-1]]
# OpenCV: L_k = G[k] - cv2.pyrUp(G[k + 1], dstsize=G[k].shape[::-1])

r = L[-1]                                  # Rekonstruktion
for k in reversed(range(len(L) - 1)):
    r = L[k] + expand(r, L[k].shape)
```

> [!abstract] Merke
> - REDUCE: mit $\tfrac1{16}[1, 4, 6, 4, 1]$ glätten, jedes zweite Pixel. EXPAND: Nullen einfügen, mit $4w$ glätten.
> - $L_k = G_k - \operatorname{EXPAND}(G_{k+1})$: Bandpass-Details. Rekonstruktion exakt, $\tfrac43 N$ Werte.

## Difference of Gaussians und Blobs {#dog toc="DoG und Blobs"}

Die Differenz zweier Gauß-geglätteter Bilder mit benachbartem σ, die **Difference of Gaussians** (DoG), ist eine gute Näherung an den skalierten Laplacian of Gaussian:

$$
G_{k\sigma} * f - G_\sigma * f \;\approx\; (k - 1)\,\sigma^2\,\nabla^2 G_\sigma * f
$$

Sie folgt aus der Wärmeleitungsgleichung, denn $\partial G/\partial\sigma = \sigma\nabla^2 G$. Die Laplace-Pyramide ist im Kern eine DoG-Pyramide mit $k = 2$.

Der LoG antwortet am stärksten auf runde Flecken, **Blobs**, und zwar auf der Skala, die zu ihrer Größe passt: Eine Scheibe mit Radius $r$ liefert die stärkste Antwort bei $\sigma = r/\sqrt2$. Damit man Antworten verschiedener Skalen vergleichen kann, muss man sie **skalennormieren**, also mit $\sigma^2$ multiplizieren. Sonst wird jede Antwort mit wachsendem σ kleiner, weil stärker geglättete Bilder flachere Krümmungen haben. Blobs sind dann die Punkte, an denen $|\sigma^2\nabla^2 L|$ größer ist als bei allen 26 Nachbarn in Ort und Skala.

::: widget py-05-blobs

Genau so findet **SIFT** (Lowe, 2004) seine Merkmalspunkte. Es baut den Skalenraum in **Oktaven** auf: Innerhalb einer Oktave wird σ in $s$ Schritten um den Faktor $k = 2^{1/s}$ erhöht (Lowe verwendet $s = 3$ und $\sigma_0 = 1{,}6$), dann wird das Bild halbiert und die nächste Oktave beginnt. Die DoG zwischen benachbarten Stufen liefert die Kandidaten. Mehr dazu auf der Seite *Merkmale und Matching*.

```python
from skimage.feature import blob_log, blob_dog
blobs = blob_log(f, min_sigma=1, max_sigma=16, num_sigma=14, threshold=0.1)   # Zeilen: y, x, σ
dog = ndimage.gaussian_filter(f, 1.6 * s) - ndimage.gaussian_filter(f, s)
```

> [!abstract] Merke
> - DoG ≈ skalierter LoG. Skalennormierte Antwort $\sigma^2\nabla^2 L$ ist über die Skalen vergleichbar.
> - Blob mit Radius $r$ antwortet am stärksten bei $\sigma = r/\sqrt2$. Grundlage von SIFT.

## Multiskalen-Kontrastanhebung {#kontrast group="Anwendungen" toc="Multiskalen-Kontrast"}

Die Laplace-Pyramide trennt ein Bild in Bänder, die man einzeln bearbeiten kann. Gewichtet man jede Detailebene mit einem eigenen Faktor $g_k$ und setzt das Bild wieder zusammen, erhält man eine **frequenzabhängige Kontrastanhebung**:

$$
f' = \operatorname{Rekonstruktion}\big(g_0 L_0,\ g_1 L_1,\ \dots,\ g_{K-1} L_{K-1},\ L_K\big)
$$

Mit allen $g_k = 1$ kommt das Original heraus. Typische Einstellungen: Die feinste Ebene, die vor allem Rauschen enthält, wird leicht gedämpft ($g_0 < 1$). Mittlere Ebenen mit den diagnostisch interessanten Strukturen werden verstärkt. Die grobe Restebene bleibt, sie trägt die Gesamthelligkeit.

Lineare Faktoren verstärken schwache und starke Details gleich. An starken Kanten entstehen dann Überschwinger, ähnlich wie beim Unsharp Masking (Seite [Filter und Faltung](filter.html#unsharp)). Deshalb wendet man meist eine **nichtlineare** Kennlinie auf die Detailwerte an, die kleine Amplituden stärker anhebt als große, etwa $v \mapsto \operatorname{sign}(v)\,|v|^{p}$ mit $p < 1$. So werden schwache Strukturen sichtbar, ohne dass kräftige Kanten überschießen. Ganz kleine Amplituden in der Größe des Rauschens lässt man dabei linear, sonst würde die Kennlinie gerade das Rauschen am stärksten verstärken. Auf diesem Prinzip beruhen viele Bildverarbeitungsketten in der digitalen Radiographie, bekannt geworden etwa als MUSICA (Multiscale Image Contrast Amplification, Vuylsteke und Schoeters, 1994).

::: widget py-06-kontrast

```python
gains = [0.6, 1.8, 1.5, 1.0]
p = 0.6                                       # < 1: kleine Details stärker anheben
Lw = [g * np.sign(l) * np.abs(l / np.abs(l).max()) ** p * np.abs(l).max()
      for g, l in zip(gains, L[:-1])] + [L[-1]]
r = Lw[-1]
for k in reversed(range(len(Lw) - 1)):
    r = Lw[k] + expand(r, Lw[k].shape)
```

## Blending {#blending}

Zwei Bilder entlang einer Maske zusammenzusetzen, hinterlässt eine sichtbare Naht, wenn sich Helligkeit oder Textur unterscheiden. Ein weicher Übergang hilft nur bedingt: Ist er schmal, bleibt die Naht sichtbar. Ist er breit, überlagern sich feine Details beider Bilder zu Geisterbildern.

**Pyramiden-Blending** (Burt und Adelson, 1983) mischt jedes Frequenzband mit einer passend breiten Übergangszone. Man zerlegt beide Bilder $A$ und $B$ in Laplace-Pyramiden, die Maske $M$ in eine Gaußsche Pyramide, und mischt Ebene für Ebene:

$$
L_k^{\text{neu}} = G_k(M)\cdot L_k(A) + \big(1 - G_k(M)\big)\cdot L_k(B)
$$

Auf groben Ebenen ist die verkleinerte Maske sehr weich, Helligkeitsunterschiede gehen dort über eine breite Zone ineinander über. Auf feinen Ebenen ist sie scharf, Details wechseln abrupt und überlagern sich nicht. Nach der Rekonstruktion ist keine Naht mehr zu sehen. Das berühmte Beispiel der Autoren ist ein halber Apfel, nahtlos an eine halbe Orange gesetzt. Dasselbe Verfahren steckt in Panorama-Programmen und im Belichtungsverschmelzen (Exposure Fusion).

::: widget py-07-blending

## Wavelets (Ausblick) {#wavelets}

Die Laplace-Pyramide hat zwei Schwächen: Sie ist übervollständig ($\tfrac43 N$ Werte), und ihre Ebenen unterscheiden nicht nach Richtung. Die **Wavelet-Zerlegung** behebt beides. Die einfachste ist die **Haar-Zerlegung**: Je 2 × 2 Pixel $\begin{smallmatrix} a & b \\ c & d \end{smallmatrix}$ werden zu einem Mittelwert und drei Differenzen:

$$
LL = \tfrac{a + b + c + d}{2}, \quad HL = \tfrac{a - b + c - d}{2}, \quad LH = \tfrac{a + b - c - d}{2}, \quad HH = \tfrac{a - b - c + d}{2}
$$

Das ist eine orthogonale Transformation (siehe [Orthogonalität](../grundlagen/lineare-algebra.html#orthogonal)): vier Werte rein, vier Werte raus, Energie bleibt erhalten, die Umkehrung ist die Transponierte. Die Zerlegung ist damit **kritisch abgetastet**, sie hat genau $N$ Werte. $LL$ ist ein halb so großes Tiefpassbild, das man in der nächsten Stufe weiter zerlegt. Die drei Detailbänder reagieren auf waagrechte, senkrechte und diagonale Strukturen.

::: widget py-08-haar

Haar ist die einfachste Wavelet-Familie, aber ihre Filter sind kurz und kantig, was Blockartefakte begünstigt. Glattere Wavelets (Daubechies, biorthogonale CDF-Wavelets) nutzen längere Filter. JPEG 2000 verwendet CDF 9/7 für verlustbehaftete und CDF 5/3 für verlustfreie Kompression. Beim **Wavelet-Entrauschen** setzt man kleine Detailkoeffizienten auf null oder zieht sie Richtung null (Thresholding), weil Rauschen sich auf viele kleine Koeffizienten verteilt, Strukturen auf wenige große.

```python
import pywt
cA, (cH, cV, cD) = pywt.dwt2(f, "haar")      # eine Stufe
coeffs = pywt.wavedec2(f, "db2", level=3)    # mehrere Stufen
f_rec = pywt.waverec2(coeffs, "db2")
```

> [!abstract] Merke
> - Laplace-Pyramide: übervollständig, richtungsunabhängig. Wavelets: kritisch abgetastet, drei Richtungsbänder.
> - Haar: orthogonal, Energie bleibt erhalten. Anwendungen: Kompression (JPEG 2000), Entrauschen durch Schwellwerte.

## Formeln {#formeln appendix="A"}

| Thema | Formel |
|---|---|
| Skalenraum | $L(x, y, \sigma) = G_\sigma * f$, $\ G_{\sigma_1} * G_{\sigma_2} = G_{\sqrt{\sigma_1^2 + \sigma_2^2}}$ |
| Aliasing | nach $\downarrow_2$ Nyquist bei 0,25 Perioden pro Originalpixel, vorher Tiefpass |
| Gauß-Übertragung | $H(f) = e^{-2\pi^2\sigma^2 f^2}$ |
| REDUCE | $G_{k+1} = (w * G_k)\downarrow_2$, $w = \tfrac1{16}[1, 4, 6, 4, 1]$ |
| EXPAND | $4\,w * (G\uparrow_2)$ |
| Laplace-Pyramide | $L_k = G_k - \operatorname{EXPAND}(G_{k+1})$, $\ G_k = L_k + \operatorname{EXPAND}(G_{k+1})$ |
| Speicher | $N(1 + \tfrac14 + \tfrac1{16} + \dots) = \tfrac43 N$ |
| Skala von Ebene $k$ | $\sigma \approx 2^k$ Originalpixel |
| DoG | $G_{k\sigma} - G_\sigma \approx (k - 1)\,\sigma^2\nabla^2 G_\sigma$ |
| Blob | Maximum von $\lvert\sigma^2\nabla^2 L\rvert$ bei $\sigma = r/\sqrt2$ |
| Blending | $L_k^\text{neu} = G_k(M)\,L_k(A) + (1 - G_k(M))\,L_k(B)$ |
| Haar | $LL, HL, LH, HH = \tfrac12(a \pm b \pm c \pm d)$, orthogonal |

## Befehle {#befehle appendix="B"}

| Aufgabe | NumPy / SciPy / scikit-image / PyWavelets | OpenCV |
|---|---|---|
| eine Ebene verkleinern | `reduce(f)` (oben) | `cv2.pyrDown(f)` |
| eine Ebene vergrößern | `expand(g, shape)` (oben) | `cv2.pyrUp(g, dstsize=(w, h))` |
| Gaußsche Pyramide | `skimage.transform.pyramid_gaussian(f, max_layer=4)` | Schleife über `cv2.pyrDown` |
| Laplace-Pyramide | `skimage.transform.pyramid_laplacian(f)` | `G[k] - cv2.pyrUp(G[k+1])` |
| Verkleinern mit Glättung | `skimage.transform.rescale(f, 0.5, anti_aliasing=True)` | `cv2.resize(f, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)` |
| Blobs | `skimage.feature.blob_log`, `blob_dog` | kein LoG-Detektor (`SimpleBlobDetector` arbeitet mit Schwellwerten) |
| Wavelets | `pywt.dwt2`, `pywt.wavedec2`, `pywt.waverec2` | nicht enthalten |
