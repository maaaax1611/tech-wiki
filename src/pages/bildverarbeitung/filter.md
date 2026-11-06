---
title: Filter und Faltung
category: bildverarbeitung
eyebrow: Bildverarbeitung · Ortsraum
footer: Alle Abbildungen rechnen im Browser auf einem künstlichen Testbild mit 128 × 128 Pixeln und Helligkeiten von 0 bis 1. Code-Beispiele in NumPy/SciPy, darunter jeweils die übliche OpenCV-Variante.
---

Wie man ein Bild glättet, Kanten findet und schärft. Fast alles davon ist dieselbe Operation: Jedes Pixel wird aus seiner Umgebung neu berechnet, meist als gewichtete Summe. Von der Faltung und der Behandlung der Ränder über Gauß- und Medianfilter bis zu Kantendetektoren, Unsharp Masking und kantenerhaltender Glättung.

## Nachbarschaftsoperationen {#nachbarschaft group="Grundlagen"}

Eine **Punktoperation** berechnet jedes Ausgabepixel nur aus dem Eingabepixel an derselben Stelle, etwa Helligkeit, Kontrast oder Gamma. Ein **Filter** dagegen bezieht die Umgebung mit ein: Das neue Pixel $g(x, y)$ hängt von den Pixeln $f$ in einem kleinen Fenster um $(x, y)$ ab.

- **Lineare Filter** bilden eine gewichtete Summe der Nachbarn. Die Gewichte stehen in einer kleinen Matrix, dem **Kernel** (auch Maske oder Filterkern). Glätten, Ableiten und Schärfen sind lineare Filter.
- **Nichtlineare Filter** rechnen anders, zum Beispiel sortieren (Median), Maximum und Minimum suchen (Morphologie) oder die Gewichte vom Bildinhalt abhängig machen (Bilateralfilter).

Lineare Filter haben zwei Eigenschaften, die sie besonders handlich machen. Sie sind **linear**: Das Filtern einer Summe von Bildern ist die Summe der gefilterten Bilder. Und sie sind **verschiebungsinvariant**: Überall im Bild wird derselbe Kernel verwendet, ein verschobenes Bild ergibt ein verschobenes Ergebnis. Jede Operation mit diesen beiden Eigenschaften ist eine Faltung.

## Faltung und Korrelation {#faltung}

Bei der **Korrelation** legt man den Kernel $h$ mit seiner Mitte auf das Pixel, multipliziert die überlappenden Werte und summiert:

$$
g(x, y) = \sum_{i=-r}^{r}\sum_{j=-r}^{r} h(i, j)\, f(x + i,\, y + j)
$$

Die **Faltung** ist dasselbe mit gespiegeltem Kernel, $f(x - i, y - j)$ statt $f(x + i, y + j)$:

$$
g = f * h, \qquad g(x, y) = \sum_{i}\sum_{j} h(i, j)\, f(x - i,\, y - j)
$$

Für symmetrische Kernel wie Box, Gauß oder Laplace ist beides identisch. Bei Ableitungskernen wie Sobel kehrt sich durch die Spiegelung das Vorzeichen um. In der Praxis wird fast immer die Korrelation berechnet, auch wenn man „Faltung“ sagt: `cv2.filter2D` rechnet eine Korrelation, `scipy.ndimage.convolve` eine echte Faltung. In der Theorie ist die Faltung praktischer, weil sie kommutativ und assoziativ ist: Zwei Filter nacheinander sind dasselbe wie ein Filter mit dem gefalteten Kernel, $(f * h_1) * h_2 = f * (h_1 * h_2)$.

::: widget bv-01-faltung

Im Frequenzraum wird die Faltung zur Multiplikation: $\mathcal F\{f * h\} = \mathcal F\{f\}\cdot\mathcal F\{h\}$. Die Fourier-Transformierte des Kernels heißt **Frequenzgang** und sagt, wie stark jede Ortsfrequenz durchgelassen wird. Große Kernel faltet man deshalb oft über die FFT, das kostet $O(N\log N)$ statt $O(N k^2)$ für ein Bild mit $N$ Pixeln und einen $k\times k$-Kernel.

```python
import numpy as np
from scipy import ndimage
import cv2

k = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]], dtype=np.float32) / 16
g = ndimage.correlate(f, k, mode="reflect")   # oder ndimage.convolve(f, k)
g = cv2.filter2D(f, -1, k, borderType=cv2.BORDER_REFLECT_101)  # Korrelation
```

> [!abstract] Merke
> - Lineare, verschiebungsinvariante Filter sind Faltungen mit einem Kernel.
> - Korrelation = Faltung mit gespiegeltem Kernel. Bei symmetrischen Kerneln gleich, bei Ableitungen Vorzeichen beachten.
> - Faltung im Ortsraum = Multiplikation der Spektren.

## Ränder {#raender}

Am Bildrand ragt der Kernel über das Bild hinaus. Die fehlenden Werte muss man erfinden, und jede Wahl hinterlässt Spuren:

| Methode | Fortsetzung von `a b c d` | Wirkung | SciPy `mode` | OpenCV |
|---|---|---|---|---|
| Null | `0 0 │ a b c d │ 0 0` | Rand wird dunkel | `constant` | `BORDER_CONSTANT` |
| Wiederholen | `a a │ a b c d │ d d` | Randpixel ziehen sich in die Länge | `nearest` | `BORDER_REPLICATE` |
| Spiegeln mit Rand | `b a │ a b c d │ d c` | meist unauffällig | `reflect` (Standard) | `BORDER_REFLECT` |
| Spiegeln ohne Rand | `c b │ a b c d │ c b` | meist unauffällig | `mirror` | `BORDER_REFLECT_101` (Standard) |
| Periodisch | `c d │ a b c d │ a b` | gegenüberliegender Rand mischt sich ein | `wrap` | `BORDER_WRAP` |

Gespiegelte Ränder sind fast immer die beste Wahl, weil sie keine künstliche Kante erzeugen. Periodische Ränder entsprechen genau dem, was eine Faltung über die FFT stillschweigend annimmt. Will man Randeffekte ganz vermeiden, schneidet man das Ergebnis um den Kernelradius kleiner (`valid` statt `same`).

## Box- und Gaußfilter {#glaetten group="Glätten"}

Der einfachste Glättungsfilter ist der **Boxfilter**: der Mittelwert über ein $k\times k$-Fenster, alle Gewichte $1/k^2$. Er ist schnell, hat aber einen ungünstigen Frequenzgang. Sein Spektrum ist eine sinc-Funktion mit Nebenkeulen, die teilweise negativ sind. Bestimmte feine Muster werden deshalb nicht nur gedämpft, sondern mit umgekehrtem Kontrast durchgelassen, und an Kanten entstehen leichte Treppen.

Der **Gaußfilter** gewichtet die Nachbarn nach einer Glockenkurve:

$$
G_\sigma(x, y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}
$$

Die Fourier-Transformierte einer Gaußfunktion ist wieder eine Gaußfunktion, mit Breite $1/(2\pi\sigma)$. Der Gaußfilter dämpft hohe Frequenzen also glatt und ohne Vorzeichenwechsel. $\sigma$ legt fest, wie stark geglättet wird. Weil die Glocke nach $3\sigma$ praktisch null ist, schneidet man den Kernel dort ab, er hat dann $2\lceil 3\sigma\rceil + 1$ Gewichte pro Richtung. Die Gewichte werden auf Summe 1 normiert, damit die mittlere Helligkeit erhalten bleibt.

### Separierbarkeit

Der 2D-Gauß ist ein Produkt zweier 1D-Gaußfunktionen, $G_\sigma(x, y) = g_\sigma(x)\,g_\sigma(y)$. Statt mit einem $k\times k$-Kernel zu falten, faltet man erst alle Zeilen mit $g_\sigma$ und danach alle Spalten. Das kostet $2k$ statt $k^2$ Multiplikationen pro Pixel, bei $\sigma = 5$ ($k = 31$) also 62 statt 961. Der Boxfilter ist ebenfalls separierbar und lässt sich mit laufenden Summen sogar unabhängig von $k$ berechnen.

Zwei weitere nützliche Eigenschaften: Zwei Gaußfilter nacheinander ergeben einen Gaußfilter mit $\sigma = \sqrt{\sigma_1^2 + \sigma_2^2}$. Und mehrere Boxfilter nacheinander nähern einen Gaußfilter immer besser an (zentraler Grenzwertsatz). Dreimal Box ist eine gängige schnelle Näherung.

::: widget bv-02-glaetten

```python
g = ndimage.gaussian_filter(f, sigma=2.0)          # schneidet bei 4 σ ab (truncate=4.0)
g = ndimage.uniform_filter(f, size=5)              # Box
g = cv2.GaussianBlur(f, (0, 0), sigmaX=2.0)        # ksize=(0,0): Größe aus σ
g = cv2.blur(f, (5, 5))
```

> [!abstract] Merke
> - Box: einfach, aber Nebenkeulen im Spektrum. Gauß: glatter Frequenzgang, Standard zum Glätten.
> - Kernel bis $3\sigma$, auf Summe 1 normiert. Separierbar: $2k$ statt $k^2$ Operationen.

## Median und Rangfilter {#median}

Der **Medianfilter** sortiert die Werte im Fenster und nimmt den mittleren. Er ist nichtlinear und hat zwei Eigenschaften, die kein linearer Filter erreicht:

- **Ausreißer verschwinden ganz.** Ein einzelnes schwarzes oder weißes Pixel landet beim Sortieren am Rand und hat keinen Einfluss auf den Median. Gegen Salz-und-Pfeffer-Rauschen, tote Pixel oder einzelne Treffer auf einem Detektor ist der Median deshalb das Mittel der Wahl.
- **Kanten bleiben scharf.** An einer Stufe liegt die Mehrheit der Werte im Fenster auf einer Seite, der Median springt mit, statt einen Zwischenwert zu liefern.

Dafür entfernt er auch echte Strukturen, die schmaler als das halbe Fenster sind (feine Linien, kleine Punkte), rundet Ecken ab und ist bei großem Fenster langsamer, weil sortiert werden muss. Median ist ein Spezialfall der **Rangfilter**: Nimmt man statt des mittleren den größten oder kleinsten Wert, erhält man Maximum- und Minimumfilter, die Grundbausteine der Morphologie.

::: widget bv-03-median

```python
g = ndimage.median_filter(f, size=5)
g = cv2.medianBlur(f, 5)       # float32 nur mit Fenster 3 oder 5, uint8 beliebig
```

## Ableitungen und Gradient {#gradient group="Kanten und Schärfe" toc="Ableitungen, Sobel"}

Eine **Kante** ist eine Stelle, an der sich die Helligkeit schnell ändert. Die Änderung misst die Ableitung. Im diskreten Bild nähert man sie durch Differenzen benachbarter Pixel, etwa die zentrale Differenz:

$$
\frac{\partial f}{\partial x} \approx \frac{f(x+1, y) - f(x-1, y)}{2} \qquad\Longleftrightarrow\qquad \text{Kernel } \tfrac12\,[-1,\ 0,\ 1]
$$

Ableiten verstärkt hohe Frequenzen, und damit auch Rauschen. Der **Sobel-Operator** kombiniert deshalb die Ableitung in einer Richtung mit einer leichten Glättung quer dazu. Er ist separierbar, als äußeres Produkt aus Glättung $[1, 2, 1]^\top$ und Ableitung $[-1, 0, 1]$ (als Korrelation geschrieben):

$$
S_x = \begin{pmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \\ 1 \end{pmatrix}\begin{pmatrix} -1 & 0 & 1 \end{pmatrix}, \qquad S_y = S_x^\top
$$

Der **Prewitt-Operator** ist dasselbe mit $[1, 1, 1]$ statt $[1, 2, 1]$. Aus den beiden Ableitungen $G_x = S_x \star f$ und $G_y = S_y \star f$ setzt sich der **Gradient** zusammen, ein Vektor, der in Richtung des steilsten Anstiegs zeigt (siehe [Gradient](../grundlagen/vektoranalysis.html#gradient)):

$$
\|\nabla f\| = \sqrt{G_x^2 + G_y^2}, \qquad \theta = \operatorname{atan2}(G_y, G_x)
$$

Der Betrag ist groß an Kanten, unabhängig von ihrer Richtung. Die Richtung $\theta$ steht senkrecht auf der Kante. Für eine glattere, weniger rauschempfindliche Ableitung leitet man eine Gaußfunktion ab (Derivative of Gaussian): Glätten und Ableiten in einem Kernel, mit $\sigma$ als Skala, auf der man Kanten sucht.

::: widget bv-04-gradient

```python
gx = ndimage.sobel(f, axis=1)            # Ableitung entlang x (Spalten)
gy = ndimage.sobel(f, axis=0)
mag, ang = np.hypot(gx, gy), np.arctan2(gy, gx)
gx = cv2.Sobel(f, cv2.CV_32F, 1, 0, ksize=3)
gy = cv2.Sobel(f, cv2.CV_32F, 0, 1, ksize=3)
```

## Laplace und LoG {#laplace toc="Laplace, LoG"}

Die zweite Ableitung findet Kanten anders: Wo die erste Ableitung ein Maximum hat, hat die zweite einen **Nulldurchgang**. Der **Laplace-Operator** summiert die zweiten Ableitungen in beiden Richtungen und hängt nicht von der Kantenrichtung ab:

$$
\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} \qquad\approx\qquad \begin{pmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{pmatrix}
$$

Die zweite Ableitung ist noch rauschempfindlicher als die erste. Man glättet deshalb vorher mit einem Gaußfilter. Weil beides linear ist, lässt es sich zu einem einzigen Kernel zusammenfassen, dem **Laplacian of Gaussian** (LoG): $\nabla^2(G_\sigma * f) = (\nabla^2 G_\sigma) * f$. Sein Profil sieht aus wie ein umgedrehter Sombrero. Das Verfahren von Marr und Hildreth sucht die Nulldurchgänge des LoG und verwirft schwache.

Der LoG ist auch ein **Blob-Detektor**: Er antwortet am stärksten auf runde Flecken mit Radius $\sqrt2\,\sigma$. Er lässt sich gut durch die **Difference of Gaussians** annähern, die Differenz zweier Gaußfilter mit $\sigma$ und $k\sigma$ ($k \approx 1{,}6$). Das ist die Grundlage von Laplace-Pyramide und SIFT (Seiten *Skalenraum und Pyramiden* und *Merkmale und Matching*).

::: widget bv-05-log

```python
log = ndimage.gaussian_laplace(f, sigma=1.5)
lap = cv2.Laplacian(f, cv2.CV_32F, ksize=1)    # ksize=1: der 3×3-Kernel oben
```

## Canny-Kantendetektor {#canny}

Canny (1986) hat Kantendetektion als Optimierungsproblem formuliert: Kanten sollen zuverlässig gefunden, genau lokalisiert und nur einmal gemeldet werden. Das Ergebnis ist bis heute der Standard und besteht aus vier Schritten:

1. **Glätten** mit einem Gaußfilter, $\sigma$ bestimmt die Skala der gesuchten Kanten.
2. **Gradient** mit Betrag und Richtung, meist über Sobel.
3. **Non-Maximum Suppression:** Ein Pixel bleibt nur Kante, wenn sein Gradientenbetrag größer ist als bei den beiden Nachbarn in Gradientenrichtung, also quer zur Kante. Die Richtung wird dazu auf 0°, 45°, 90° und 135° gerundet. Aus breiten Kantenbändern werden ein Pixel dünne Linien.
4. **Hysterese mit zwei Schwellen:** Pixel über der oberen Schwelle sind sichere Kanten. Pixel zwischen unterer und oberer Schwelle werden nur übernommen, wenn sie mit einer sicheren Kante verbunden sind. Das verhindert, dass eine Kante bei schwankendem Kontrast in Stücke zerfällt, ohne einzelne Rauschpixel mitzunehmen. Canny empfahl ein Verhältnis von oberer zu unterer Schwelle zwischen 2 : 1 und 3 : 1.

::: widget bv-06-canny

```python
from skimage import feature
edges = feature.canny(f, sigma=1.25, low_threshold=0.05, high_threshold=0.15)
edges = cv2.Canny((255 * f).astype(np.uint8), 40, 100)  # Schwellen auf den Gradientenbetrag, ohne Vorglättung
```

> [!abstract] Merke
> - Erste Ableitung: Kante = Maximum des Gradientenbetrags. Zweite Ableitung: Kante = Nulldurchgang.
> - Vor dem Ableiten glätten. $\sigma$ wählt die Skala der Kanten.
> - Canny: Glätten, Gradient, Non-Maximum Suppression, Hysterese.

## Unsharp Masking {#unsharp}

Der Name kommt aus der Dunkelkammer: Man belichtete ein unscharfes Negativ zusammen mit dem Original, um Kanten zu betonen. Digital zieht man vom Bild eine geglättete Kopie ab. Übrig bleibt die **Detailschicht**, die man verstärkt wieder addiert:

$$
g = f + k\,\big(f - G_\sigma * f\big) = (1 + k)\,f - k\,(G_\sigma * f)
$$

Das ist wieder eine lineare Faltung mit dem Kernel $(1 + k)\,\delta - k\,G_\sigma$. Der Schärfekernel $[0, -1, 0;\ -1, 5, -1;\ 0, -1, 0]$ aus Abbildung 1 ist eine kleine Version davon. $\sigma$ legt fest, welche Strukturgröße betont wird, $k$ wie stark.

Der Preis sind **Halos**: Neben jeder Kante entsteht auf der hellen Seite ein hellerer, auf der dunklen ein dunklerer Saum. Bei kleinem $\sigma$ wirkt das als Schärfe, bei großem als sichtbarer Lichthof. Unsharp Masking verstärkt außerdem Rauschen, weil Rauschen ebenfalls in der Detailschicht steckt. Viele Bildketten wenden es deshalb nicht auf einer, sondern auf mehreren Skalen gleichzeitig an (Seite *Skalenraum und Pyramiden*).

::: widget bv-07-unsharp

```python
blur = ndimage.gaussian_filter(f, sigma=2.0)
g = f + 1.0 * (f - blur)
g = cv2.addWeighted(f, 1 + 1.0, cv2.GaussianBlur(f, (0, 0), 2.0), -1.0, 0)
```

## Bilateralfilter {#bilateral group="Kantenerhaltend"}

Lineare Filter glätten Kanten genauso wie Flächen, denn das Gewicht eines Nachbarn hängt nur von seiner Lage ab. Der **Bilateralfilter** (Tomasi und Manduchi, 1998) macht das Gewicht zusätzlich davon abhängig, wie ähnlich die Helligkeit ist:

$$
g(\mathbf p) = \frac{1}{W_\mathbf p}\sum_{\mathbf q} G_{\sigma_s}\!\big(\|\mathbf p - \mathbf q\|\big)\; G_{\sigma_r}\!\big(|f(\mathbf p) - f(\mathbf q)|\big)\; f(\mathbf q)
$$

$W_\mathbf p$ ist die Summe der Gewichte. $\sigma_s$ ist die räumliche Reichweite wie beim Gaußfilter, $\sigma_r$ die Toleranz in der Helligkeit. Nachbarn jenseits einer Kante unterscheiden sich stark und bekommen fast kein Gewicht. Flächen werden geglättet, Kanten bleiben stehen. Ist $\sigma_r$ viel größer als die Kontraste im Bild, wird daraus ein gewöhnlicher Gaußfilter.

Der Bilateralfilter ist nichtlinear und nicht verschiebungsinvariant, an jeder Stelle gilt ein anderer Kernel. Er ist deshalb deutlich langsamer, es gibt aber schnelle Näherungen. Bei starkem Rauschen hilft er weniger, weil dann auch Pixel derselben Fläche verschieden hell sind. Bei zu kleinem $\sigma_r$ entstehen Treppen und Comic-artige Flächen. Die Idee „Gewicht nach Ähnlichkeit“ führen **Non-Local Means** und BM3D weiter: Sie vergleichen nicht einzelne Pixel, sondern ganze Bildausschnitte (Seite *Rauschen und Entrauschen*).

::: widget bv-08-bilateral

```python
from skimage.restoration import denoise_bilateral
g = denoise_bilateral(f, sigma_color=0.12, sigma_spatial=2.0)
g = cv2.bilateralFilter(f, d=9, sigmaColor=0.12, sigmaSpace=2.0)   # float32-Bild in 0…1
```

> [!abstract] Merke
> - Bilateral: Gewicht = räumliche Nähe × Helligkeitsähnlichkeit. Glättet Flächen, erhält Kanten.
> - $\sigma_r$ klein: stark kantenerhaltend, aber Treppen. $\sigma_r$ groß: wie Gauß.

## Kernel-Sammlung {#kernel appendix="A"}

Alle als Korrelation geschrieben, Mittelpunkt in der Mitte.

| Kernel | Werte | Summe | Zweck |
|---|---|---:|---|
| Box 3 × 3 | $\frac19\begin{pmatrix}1&1&1\\1&1&1\\1&1&1\end{pmatrix}$ | 1 | Mittelwert |
| Gauß 3 × 3 | $\frac1{16}\begin{pmatrix}1&2&1\\2&4&2\\1&2&1\end{pmatrix}$ | 1 | Glätten, $\sigma \approx 0{,}7$ |
| Gauß 1D, 5 Gewichte | $\frac1{16}\,[1,\ 4,\ 6,\ 4,\ 1]$ | 1 | Binomial, $\sigma = 1$, Pyramiden |
| zentrale Differenz | $\frac12\,[-1,\ 0,\ 1]$ | 0 | erste Ableitung |
| Sobel x | $\begin{pmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{pmatrix}$ | 0 | Ableitung + Glättung |
| Prewitt x | $\begin{pmatrix}-1&0&1\\-1&0&1\\-1&0&1\end{pmatrix}$ | 0 | Ableitung + Mittelung |
| Laplace (4er) | $\begin{pmatrix}0&1&0\\1&-4&1\\0&1&0\end{pmatrix}$ | 0 | zweite Ableitung |
| Laplace (8er) | $\begin{pmatrix}1&1&1\\1&-8&1\\1&1&1\end{pmatrix}$ | 0 | zweite Ableitung, auch diagonal |
| Schärfen | $\begin{pmatrix}0&-1&0\\-1&5&-1\\0&-1&0\end{pmatrix}$ | 1 | Bild − Laplace |

## Befehle {#befehle appendix="B"}

| Aufgabe | NumPy / SciPy / scikit-image | OpenCV |
|---|---|---|
| beliebiger Kernel | `ndimage.correlate(f, k)`, `ndimage.convolve(f, k)` | `cv2.filter2D(f, -1, k)` (Korrelation) |
| Gauß | `ndimage.gaussian_filter(f, sigma)` | `cv2.GaussianBlur(f, (0, 0), sigma)` |
| Box | `ndimage.uniform_filter(f, size)` | `cv2.blur(f, (k, k))` |
| separierbar | `ndimage.correlate1d(f, k, axis)` | `cv2.sepFilter2D(f, -1, kx, ky)` |
| Median | `ndimage.median_filter(f, size)` | `cv2.medianBlur(f, k)` |
| Sobel | `ndimage.sobel(f, axis)` | `cv2.Sobel(f, cv2.CV_32F, dx, dy)` |
| Laplace, LoG | `ndimage.laplace(f)`, `ndimage.gaussian_laplace(f, sigma)` | `cv2.Laplacian(f, cv2.CV_32F)` |
| Canny | `skimage.feature.canny(f, sigma)` | `cv2.Canny(f8, lo, hi)` (uint8) |
| Bilateral | `skimage.restoration.denoise_bilateral(f)` | `cv2.bilateralFilter(f, d, sc, ss)` |
| Rand | Argument `mode=…` | Argument `borderType=…` |
