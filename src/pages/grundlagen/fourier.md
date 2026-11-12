---
title: Fourier und Signale
category: grundlagen
eyebrow: Grundlagen · Mathematik
tags: [Mathematik, Fourier, Faltung, Abtastung, Rauschen]
footer: Alle Abbildungen rechnen live im Browser, die Spektren mit einer einfachen FFT. In Python übernimmt das <code>numpy.fft</code>.
---

Signale und Bilder als Summe von Schwingungen. Diese Sicht macht Faltung zur Multiplikation, erklärt, wie fein man abtasten muss, und liefert die Sprache, in der man über Schärfe und Rauschen spricht: Übertragungsfunktion, Grenzfrequenz, Leistungsspektrum.

## Signale als Summe von Schwingungen {#reihe group="Grundidee" toc="Fourier-Reihe"}

Ein periodisches Signal mit Periode $T$ lässt sich als Summe von Sinus- und Kosinusschwingungen schreiben, deren Frequenzen Vielfache der Grundfrequenz $1/T$ sind. Kürzer geht es mit komplexen Exponentialfunktionen, denn $e^{i\varphi} = \cos\varphi + i\sin\varphi$:

$$
f(x) = \sum_{k=-\infty}^{\infty} c_k\,e^{2\pi i k x / T}, \qquad c_k = \frac1T\int_0^T f(x)\,e^{-2\pi i k x / T}\,\mathrm dx
$$

Jeder Koeffizient $c_k$ ist eine komplexe Zahl. Ihr Betrag sagt, wie stark die Frequenz $k/T$ vertreten ist, ihre Phase, wie die Schwingung verschoben ist. Berechnet wird $c_k$ als Skalarprodukt von $f$ mit der jeweiligen Schwingung: Die Schwingungen bilden eine Orthogonalbasis, und die Fourier-Reihe ist die Darstellung von $f$ in dieser Basis (vgl. [lineare Algebra](lineare-algebra.html#vektoren)).

Wie schnell die Koeffizienten abfallen, hängt an der Glattheit des Signals. Sprünge brauchen viele hohe Frequenzen. Bricht man die Summe ab, bleibt an jedem Sprung ein Überschwinger von etwa 9 % stehen, das **Gibbs-Phänomen**. Dasselbe erzeugt im Bild Ringe neben scharfen Kanten, wenn hohe Frequenzen fehlen.

### Beispiel: Rechteckwelle

Für reelle Signale ist die Form mit Sinus und Kosinus oft praktischer. Mit Periode $T = 1$:

$$
f(x) = \frac{a_0}{2} + \sum_{k\ge1}\big(a_k\cos(2\pi k x) + b_k\sin(2\pi k x)\big)
$$

$$
a_k = 2\int_0^1 f(x)\cos(2\pi k x)\,\mathrm dx, \qquad b_k = 2\int_0^1 f(x)\sin(2\pi k x)\,\mathrm dx
$$

Die Rechteckwelle ist $f(x) = +1$ für $0 < x < \tfrac12$ und $-1$ für $\tfrac12 < x < 1$, periodisch fortgesetzt.

1. $f$ ist ungerade, $f(-x) = -f(x)$. Alle Kosinusterme und der Mittelwert $a_0$ fallen weg, es bleiben nur Sinusterme.
2. Auch $f(x)\sin(2\pi k x)$ ist dann gerade, beide Halbperioden liefern denselben Beitrag:
$$
b_k = 4\int_0^{1/2}\sin(2\pi k x)\,\mathrm dx = 4\left[-\frac{\cos(2\pi k x)}{2\pi k}\right]_0^{1/2} = \frac{2}{\pi k}\big(1 - \cos(\pi k)\big)
$$
3. $\cos(\pi k)$ ist $+1$ für gerades und $-1$ für ungerades $k$. Damit ist $b_k = 4/(\pi k)$ für ungerades $k$ und $0$ für gerades.

Zusammen:

$$
f(x) = \frac{4}{\pi}\sum_{k = 1, 3, 5, \dots} \frac{\sin(2\pi k x)}{k} = \frac4\pi\left(\sin 2\pi x + \frac13\sin 6\pi x + \frac15\sin 10\pi x + \dots\right)
$$

Die Rechteckwelle besteht also nur aus ungeraden Vielfachen der Grundfrequenz, und ihre Amplituden fallen nur wie $1/k$. Für die steilen Kanten braucht man deshalb viele hohe Frequenzen mit noch merklichem Gewicht. Umgekehrt heißt das: Ein Filter, der hohe Frequenzen anhebt, macht Kanten schärfer, einer, der sie dämpft, macht sie weicher. Genau das tun Hoch- und Tiefpass, und der Rampenfilter der [gefilterten Rückprojektion](../physik/rekonstruktion.html#fbp) hebt hohe Frequenzen an, damit die Kanten im CT-Bild scharf werden. Die Abbildung baut die Rechteckwelle aus diesen Gliedern auf (dort mit Periode $2\pi$, also $\sin(kx)$ statt $\sin(2\pi k x)$).

::: widget fr-01-fourier-reihe

## Fourier-Transformation {#transformation}

Lässt man die Periode gegen unendlich gehen, rücken die Frequenzen beliebig dicht zusammen. Aus der Summe wird ein Integral, und jedes (vernünftige) Signal bekommt ein kontinuierliches Spektrum:

$$
F(u) = \int_{-\infty}^{\infty} f(x)\,e^{-2\pi i u x}\,\mathrm dx, \qquad f(x) = \int_{-\infty}^{\infty} F(u)\,e^{2\pi i u x}\,\mathrm du
$$

$u$ ist die Frequenz in Schwingungen pro Längeneinheit, etwa Linienpaare pro Millimeter. Die wichtigsten Eigenschaften:

| Ortsraum | Frequenzraum | Bedeutung |
|---|---|---|
| $f(x - x_0)$ | $e^{-2\pi i u x_0}F(u)$ | Verschiebung ändert nur die Phase, nicht den Betrag |
| $f(x/a)$ | $\vert a\vert\,F(a u)$ | breit im Ort heißt schmal im Spektrum |
| $f * g$ | $F\cdot G$ | Faltung wird Multiplikation (Abschnitt 3) |
| $f\cdot g$ | $F * G$ | und umgekehrt |
| $f$ reell | $F(-u) = \overline{F(u)}$ | Betrag symmetrisch, man zeigt oft nur $u \ge 0$ |
| $\int\vert f\vert^2\,\mathrm dx$ | $\int\vert F\vert^2\,\mathrm du$ | Energie bleibt gleich (Parseval) |

Ein paar Paare, die man kennen sollte: Ein Rechteck der Breite $a$ wird zu $a\,\mathrm{sinc}(a u)$ mit $\mathrm{sinc}(x) = \sin(\pi x)/(\pi x)$. Ein Gauß bleibt ein Gauß. Ein einzelner Impuls (Delta) hat ein flaches Spektrum, enthält also alle Frequenzen gleich stark, und eine Konstante ist umgekehrt nur die Frequenz null.

::: widget fr-02-transformation

## Faltung und Faltungssatz {#faltung}

Ein lineares, verschiebungsinvariantes System, etwa eine Optik, ein Detektor oder ein Filter, ist vollständig durch seine **Impulsantwort** $h$ beschrieben: das Ausgangssignal, wenn man einen einzelnen Punkt hineinschickt. In der Bildgebung heißt sie **Punktbildfunktion** (PSF). Jedes andere Eingangssignal ist eine Summe verschobener Punkte, also ist der Ausgang die entsprechende Summe verschobener Impulsantworten, die **Faltung**:

$$
(f * h)(x) = \int f(\tau)\,h(x - \tau)\,\mathrm d\tau
$$

Der **Faltungssatz** macht daraus im Frequenzraum eine Multiplikation:

$$
\mathcal F\{f * h\} = F\cdot H
$$

$H(u)$ heißt **Übertragungsfunktion**. Sie sagt für jede Frequenz, wie stark sie das System durchlässt. Ihr Betrag, normiert auf $H(0) = 1$, ist die **Modulationsübertragungsfunktion** (MTF), das übliche Maß für die Schärfe eines Bildgebungssystems. Eine breite PSF heißt eine schmale MTF, also Unschärfe.

Praktisch folgen daraus zwei Dinge. Große Faltungen rechnet man schneller über die FFT als direkt. Und eine bekannte Faltung lässt sich im Prinzip durch Division durch $H$ rückgängig machen. Wo $H$ fast null ist, verstärkt das aber vor allem das Rauschen, deshalb braucht man dabei Regularisierung.

::: widget fr-03-faltung

## Abtastung und Aliasing {#abtastung group="Diskrete Signale"}

Ein digitales Signal ist an Punkten im Abstand $\Delta x$ abgetastet, mit der Abtastrate $f_s = 1/\Delta x$. Das **Abtasttheorem** (Nyquist-Shannon) sagt: Enthält das Signal keine Frequenzen oberhalb von $f_s/2$, bestimmen die Abtastwerte es exakt. Diese Grenze heißt **Nyquist-Frequenz**.

$$
f_{\max} < \frac{f_s}{2} \qquad\Longleftrightarrow\qquad \text{mindestens zwei Abtastwerte pro Periode}
$$

Höhere Frequenzen gehen nicht einfach verloren, sie tauchen als falsche, niedrigere Frequenzen wieder auf (**Aliasing**). Im Frequenzraum sieht man warum: Abtasten wiederholt das Spektrum im Abstand $f_s$, und Anteile über $f_s/2$ überlappen mit der Kopie daneben. Hinterher lässt sich das nicht mehr trennen. Man muss vor dem Abtasten tiefpassfiltern. Bei einem Bilddetektor tut das die Pixelapertur zum Teil von selbst, beim Verkleinern von Bildern muss man es selbst tun (siehe [Pyramiden](../bildverarbeitung/pyramiden.html#aliasing)).

::: widget fr-04-abtastung

## DFT und FFT {#dft}

Für $N$ Abtastwerte $x_0, \dots, x_{N-1}$ ist die **diskrete Fourier-Transformation**

$$
X_j = \sum_{n=0}^{N-1} x_n\,e^{-2\pi i j n / N}, \qquad j = 0, \dots, N - 1
$$

Der Index $j$ zählt, wie viele Perioden in den Ausschnitt passen. Die zugehörige Frequenz ist $j\,f_s/N$, der Abstand zweier Frequenzlinien also $f_s/N$. Die Indizes über $N/2$ stehen für negative Frequenzen, deshalb verschiebt man die Nullfrequenz zur Anzeige in die Mitte (`fftshift`). Die **FFT** berechnet dasselbe in $O(N\log N)$ statt $O(N^2)$ Schritten.

Zwei Eigenheiten muss man kennen:

- Die DFT behandelt den Ausschnitt so, als würde er sich periodisch wiederholen. Passt keine ganze Zahl von Perioden hinein, entsteht an der Nahtstelle ein Sprung, und die Energie einer Frequenz verschmiert über das ganze Spektrum (**Leckeffekt**). Ein **Fenster** wie Hann blendet die Ränder weich aus und unterdrückt das, auf Kosten einer etwas breiteren Spitze.
- Auch eine Faltung über die FFT ist periodisch: Was rechts hinausläuft, kommt links wieder herein. Will man das nicht, füllt man vorher mit Nullen auf (Zero Padding).

::: widget fr-05-dft-leckeffekt

## Bilder im Frequenzraum {#bilder group="Bilder und Rauschen" toc="2D-Fourier-Transformation"}

In zwei Dimensionen wird ein Bild in ebene Wellen zerlegt, jede mit einer Frequenz $u$ in x- und $v$ in y-Richtung:

$$
F(u, v) = \iint f(x, y)\,e^{-2\pi i (u x + v y)}\,\mathrm dx\,\mathrm dy
$$

Der Punkt $(u, v)$ im Spektrum steht für Streifen senkrecht zur Richtung $(u, v)$, mit Abstand $1/\sqrt{u^2 + v^2}$. Nah an der Mitte liegen grobe Strukturen, außen feine. Eine Kante erzeugt im Spektrum einen Streifen senkrecht zur Kante, ein periodisches Muster einzelne Spitzen. Die 2D-Transformation ist separierbar: erst alle Zeilen, dann alle Spalten eindimensional transformieren.

Filtern heißt im Frequenzraum: Spektrum mit einer Maske multiplizieren. Ein Tiefpass glättet, ein Hochpass betont Kanten. Eine harte Maskenkante erzeugt Ringe (Gibbs), eine weiche Gauß-Maske nicht. Für kleine Filterkerne ist die direkte Faltung schneller, für große die FFT.

::: widget fr-06-fourier-2d

## Rauschen und Leistungsspektrum {#rauschen toc="Leistungsspektrum"}

Bei Rauschen interessiert nicht die Phase, sondern wie viel Leistung auf welche Frequenz fällt. Das **Leistungsspektrum** ist der Erwartungswert von $|F|^2$, in der Praxis gemittelt über viele Rauschbilder oder Bildausschnitte. Für Detektorbilder heißt es **Rauschleistungsspektrum** (NPS).

- **Weißes Rauschen**, bei dem jedes Pixel unabhängig ist, hat ein flaches Spektrum. Quantenrauschen hinter einem idealen Detektor wäre weiß.
- **Korreliertes Rauschen**, etwa nach Unschärfe im Detektor oder einem Glättungsfilter, verliert Leistung bei hohen Frequenzen. Läuft weißes Rauschen durch ein System mit Übertragungsfunktion $H$, ist sein Leistungsspektrum $|H|^2$ mal das Eingangsspektrum.

Das Leistungsspektrum ist die Fourier-Transformierte der Autokorrelation, also der [Kovarianz](wahrscheinlichkeit.html#kovarianz) zwischen Pixeln in einem gegebenen Abstand (Satz von Wiener-Chintschin). Das Integral über das ganze Spektrum ist die Varianz eines einzelnen Pixels. Zwei Bilder mit derselben Pixelvarianz können deshalb ganz verschieden aussehen: feinkörnig oder grobkörnig. Erst das Spektrum unterscheidet sie, und zusammen mit der MTF beschreibt es, wie gut ein Detektor kleine Strukturen im Rauschen sichtbar macht.

::: widget fr-07-leistungsspektrum

## Formeln {#formeln appendix="A"}

| Thema | Formel |
|---|---|
| Fourier-Reihe | $f(x) = \sum_k c_k e^{2\pi i k x/T}$, $c_k = \frac1T\int_0^T f\,e^{-2\pi i k x/T}\,\mathrm dx$ |
| Transformation | $F(u) = \int f(x)e^{-2\pi i u x}\,\mathrm dx$, $f(x) = \int F(u)e^{2\pi i u x}\,\mathrm du$ |
| Paare | Rechteck der Breite $a$ ↔ $a\,\mathrm{sinc}(a u)$, $e^{-\pi x^2}$ ↔ $e^{-\pi u^2}$, $\delta(x)$ ↔ $1$ |
| Verschiebung, Skalierung | $f(x - x_0)$ ↔ $e^{-2\pi i u x_0}F(u)$, $f(x/a)$ ↔ $\vert a\vert F(a u)$ |
| Faltungssatz | $f * g$ ↔ $F\cdot G$ |
| Parseval | $\int\vert f\vert^2 = \int\vert F\vert^2$ |
| Abtastung | $f_{\max} < f_s/2$, Frequenzauflösung der DFT $f_s/N$ |
| DFT | $X_j = \sum_n x_n e^{-2\pi i j n/N}$ |
| Leistungsspektrum | $S(u) = \mathbb E\,\vert F(u)\vert^2$, nach einem System $S_\text{aus} = \vert H\vert^2 S_\text{ein}$ |

## Befehle {#befehle appendix="B"}

```python
import numpy as np
from scipy import signal

X = np.fft.fft(x)                         # DFT, Index 0 = Nullfrequenz
f = np.fft.fftfreq(len(x), d=dx)          # zugehörige Frequenzen (inkl. negativer)
X = np.fft.rfft(x)                        # nur nichtnegative Frequenzen (reelles Signal)
x = np.fft.ifft(X).real                   # zurück

F = np.fft.fftshift(np.fft.fft2(img))     # 2D, Nullfrequenz in der Mitte
mag = np.log1p(np.abs(F))                 # zur Anzeige

w = signal.windows.hann(len(x))           # Fenster gegen Leckeffekt
y = signal.fftconvolve(x, h, mode="same") # Faltung über die FFT

f, S = signal.welch(x, fs=fs, nperseg=256)  # gemitteltes Leistungsspektrum
```
