---
title: Vom Sinogramm zum Schnittbild
eyebrow: CT-Rekonstruktion · Vertiefung zu Baustein 7
toc_intro: Überblick
footer: Alle Abbildungen rechnen live im Browser mit einem vereinfachten Phantom und Parallelstrahlgeometrie (128 × 128 Pixel, 128 Detektorkanäle). Sie zeigen Prinzipien, nicht die Bildqualität realer Scanner.
---

Wie ein CT aus vielen Projektionen ein Schnittbild berechnet: Radon-Transformation, Fourier-Slice-Theorem, gefilterte Rückprojektion und iterative Verfahren, Schritt für Schritt hergeleitet und zum Ausprobieren.

::: widget rk-00-ablauf

<p class="muted" style="font-size:15px">Voraussetzung ist Baustein 7 der Seite <a href="roentgen.html">„Vom Photon zum Bild“</a>: Ein Detektorpixel misst das Linienintegral \(p = -\ln(I/I_0) = \int \mu\,\mathrm dl\).</p>

## Fourier-Transformation und Faltung {#fourier eyebrow="Auffrischung" toc="Auffrischung: Fourier & Faltung"}

Für die Rekonstruktion braucht man zwei Werkzeuge aus der Signalverarbeitung. Wer sie sicher kennt, kann diesen Abschnitt überspringen. Ausführlicher steht beides auf der Seite [Fourier und Signale](../grundlagen/fourier.html).

### Jedes Signal ist eine Summe von Wellen

Die Grundidee von Fourier: Jedes (vernünftige) Signal lässt sich als Summe von Sinus- und Kosinuswellen verschiedener Frequenz schreiben. Die **Fourier-Transformation** sagt, wie viel von jeder Frequenz im Signal steckt:

$$
F(u) = \int_{-\infty}^{\infty} f(x)\,e^{-2\pi i u x}\,\mathrm dx \qquad\qquad f(x) = \int_{-\infty}^{\infty} F(u)\,e^{2\pi i u x}\,\mathrm du
$$

<dl class="sym">
<dt>f(x)</dt><dd>das Signal, z. B. ein Projektionsprofil über der Detektorposition</dd>
<dt>u</dt><dd>Frequenz (Schwingungen pro Längeneinheit, z. B. pro cm)</dd>
<dt>F(u)</dt><dd>komplexe Amplitude dieser Frequenz: Betrag = Stärke, Phase = Verschiebung</dd>
</dl>

Die rechte Formel ist die Rücktransformation: Aus dem Spektrum bekommt man das Signal exakt zurück. Grobe Strukturen stecken in den niedrigen Frequenzen, scharfe Kanten und feine Details in den hohen.

::: widget rk-01-fourier-reihe

In zwei Dimensionen funktioniert es genauso. Ein Bild wird zur Summe ebener Wellen, jede mit einer Frequenz $u$ in x-Richtung und $v$ in y-Richtung:

$$
F(u,v) = \iint f(x,y)\,e^{-2\pi i (u x + v y)}\,\mathrm dx\,\mathrm dy
$$

### Faltung

Eine **Faltung** ersetzt jeden Punkt eines Signals durch eine verschobene, gewichtete Kopie eines Kerns $g$ und summiert alles auf:

$$
(f * g)(x) = \int f(x')\,g(x - x')\,\mathrm dx'
$$

Beispiel: Ist $g$ eine schmale Glockenkurve, wird $f$ weichgezeichnet. Jedes unscharfe Abbildungssystem lässt sich so beschreiben, $g$ ist dann die Punktbildfunktion.

Der wichtigste Satz dazu ist der **Faltungssatz**: Im Frequenzraum wird aus der Faltung eine einfache Multiplikation.

$$
\mathcal F\{f * g\} = F \cdot G
$$

Für die Rekonstruktion heißt das: Einen Filter kann man entweder als Faltung im Ortsraum anwenden oder als Multiplikation im Frequenzraum. Das Ergebnis ist dasselbe. Und eine Unschärfe, die eine bekannte Faltung ist, lässt sich im Frequenzraum durch Teilen rückgängig machen.

> [!abstract] Merke
> - Die Fourier-Transformation zerlegt ein Signal in Frequenzen. Kanten und Details liegen bei hohen Frequenzen.
> - Faltung im Ortsraum = Multiplikation im Frequenzraum.

## Die Radon-Transformation {#radon eyebrow="Messung"}

Das Objekt ist ein Schnittbild $f(x,y)$, die Verteilung des Schwächungskoeffizienten μ in einer Ebene. Ein Strahl ist eine Gerade durch dieses Bild. Man beschreibt sie durch zwei Zahlen:

- den **Winkel θ** der Senkrechten auf der Geraden (die Richtung, in der die Projektion „aufgereiht“ wird),
- den **Abstand s** der Geraden vom Mittelpunkt (die Position auf dem Detektor).

Alle Punkte auf der Geraden erfüllen $x\cos\theta + y\sin\theta = s$. Das Linienintegral entlang dieser Geraden ist die **Radon-Transformation**:

$$
p(\theta, s) = \iint f(x,y)\;\delta(x\cos\theta + y\sin\theta - s)\;\mathrm dx\,\mathrm dy
$$

Die Delta-Funktion δ wirkt wie ein Sieb: Sie lässt vom Doppelintegral nur die Punkte auf der Geraden übrig. Für feste θ ist $p(\theta, \cdot)$ ein Projektionsprofil. Alle Profile für $\theta \in [0°, 180°)$ zusammen bilden das **Sinogramm**. 180° reichen, weil ein Strahl aus der Gegenrichtung dasselbe misst: $p(\theta + \pi, s) = p(\theta, -s)$.

### Warum es „Sinogramm“ heißt

Ein einzelner Punkt bei $(x_0, y_0)$ liegt bei jedem Winkel auf genau einem Strahl. Für dessen Position gilt

$$
s(\theta) = x_0\cos\theta + y_0\sin\theta = r_0 \cos(\theta - \varphi_0)
$$

mit dem Abstand $r_0$ und dem Polarwinkel $\varphi_0$ des Punktes. Im Sinogramm zeichnet er also eine Sinuskurve. Ihre Amplitude verrät, wie weit der Punkt vom Drehzentrum entfernt ist, ihre Phase, in welcher Richtung er liegt. Ein Punkt im Zentrum ergibt eine gerade Linie bei $s = 0$.

::: widget rk-02-radon-sinogramm

Weil die Radon-Transformation **linear** ist, ist das Sinogramm eines beliebigen Bildes einfach die Überlagerung der Sinuskurven aller seiner Punkte, gewichtet mit ihrem μ. Das ist das Muster, das man im Sinogramm aus Baustein 7 gesehen hat.

> [!abstract] Merke
> - Ein Strahl ist durch (θ, s) festgelegt. Die Radon-Transformation liefert für jeden Strahl das Linienintegral.
> - Ein Punkt erzeugt im Sinogramm eine Sinuskurve. Ein Bild erzeugt die Summe vieler solcher Kurven.
> - Rekonstruktion ist die Frage: Welches $f(x,y)$ hat dieses Sinogramm erzeugt?

## Warum reine Rückprojektion verschmiert {#rueck eyebrow="Erster Versuch" toc="Warum Rückprojektion verschmiert"}

Die naheliegende Idee: Jeder Messwert $p(\theta, s)$ wird gleichmäßig zurück auf alle Punkte seines Strahls verteilt, und das für alle Winkel. Ein Punkt $(x,y)$ sammelt dabei von jedem Winkel genau den Wert des Strahls, auf dem er liegt:

$$
b(x,y) = \int_0^{\pi} p(\theta,\; x\cos\theta + y\sin\theta)\;\mathrm d\theta
$$

Das ist die **Rückprojektion**. Sie ist nicht die Umkehrung der Radon-Transformation, sondern nur ihr „Spiegelbild“ (mathematisch die adjungierte Operation). Was dabei herauskommt, sieht man am besten an einem einzelnen Punkt.

::: widget rk-03-rueckprojektion-punkt

### Die 1/r-Unschärfe

Mit vielen Winkeln überlagern sich die Strahlen zu einem Stern mit sehr vielen Zacken. Dicht am Punkt kreuzen sich alle Strahlen, weiter außen verteilen sie sich auf einen größeren Umfang. Ein Kreis mit Radius $r$ hat den Umfang $2\pi r$, die Strahldichte und damit der Grauwert fallen also wie $1/r$.

Weil Rückprojektion und Radon-Transformation linear sind und das für jeden Punkt gleich passiert, gilt für jedes Bild:

$$
b(x,y) = f(x,y) \;*\; \frac{1}{r}, \qquad r = \sqrt{x^2+y^2}
$$

Das rückprojizierte Bild ist das echte Bild, gefaltet mit $1/r$. Das erklärt das verwaschene Ergebnis in Baustein 7. Die gute Nachricht: Eine bekannte Faltung lässt sich rückgängig machen. Die 2D-Fourier-Transformierte von $1/r$ ist $1/\rho$, wobei $\rho = \sqrt{u^2+v^2}$ der Betrag der Frequenz ist. Nach dem Faltungssatz gilt also

$$
B(u,v) = \frac{F(u,v)}{\rho} \qquad\Rightarrow\qquad F(u,v) = \rho \cdot B(u,v)
$$

Man muss das Bild im Frequenzraum mit $\rho$ multiplizieren, also hohe Frequenzen verstärken. Das ist der Kern des Rampenfilters. Statt das fertige verschmierte Bild zu korrigieren, filtert man in der Praxis vorher jede einzelne Projektion. Warum das gleichwertig ist, zeigt der nächste Abschnitt.

> [!abstract] Merke
> - Rückprojektion verteilt jeden Messwert gleichmäßig auf seinen Strahl zurück.
> - Das Ergebnis ist das echte Bild, gefaltet mit $1/r$: verschmiert.
> - Die Korrektur ist ein Filter, der hohe Frequenzen proportional zur Frequenz verstärkt.

## Das Fourier-Slice-Theorem {#slice eyebrow="Der Schlüssel"}

Das Fourier-Slice-Theorem (auch Zentralschnitt-Theorem) verbindet die Messung mit dem Bild auf überraschend einfache Weise:

<div class="merke" style="background:var(--surface);border:1px solid var(--rule)">
<p style="margin:0.2em 0">Die 1D-Fourier-Transformierte einer Projektion unter dem Winkel θ ist gleich der 2D-Fourier-Transformierten des Bildes entlang einer Linie durch den Ursprung unter demselben Winkel θ.</p>
</div>

$$
P_\theta(\omega) = \int p(\theta, s)\,e^{-2\pi i \omega s}\,\mathrm ds \;=\; F(\omega\cos\theta,\; \omega\sin\theta)
$$

### Warum das stimmt

Man prüft es am einfachsten für θ = 0. Dann laufen die Strahlen in y-Richtung, und die Projektion ist $p(0, s) = \int f(s, y)\,\mathrm dy$. Ihre Fourier-Transformierte ist

$$
P_0(\omega) = \int\!\!\int f(s,y)\,\mathrm dy\; e^{-2\pi i \omega s}\,\mathrm ds = \iint f(x,y)\, e^{-2\pi i (\omega x + 0\cdot y)}\,\mathrm dx\,\mathrm dy = F(\omega, 0)
$$

Das ist genau die 2D-Transformierte entlang der u-Achse. Für jeden anderen Winkel dreht man das Koordinatensystem mit. Da eine Drehung des Bildes das Spektrum um denselben Winkel dreht, gilt die Aussage für alle θ.

::: widget rk-04-fourier-slice

### Was daraus folgt

Jede Projektion liefert eine Linie durch das 2D-Spektrum des Bildes. Misst man Projektionen unter allen Winkeln von 0° bis 180°, hat man das komplette Spektrum, nur eben in Polarkoordinaten statt auf einem rechtwinkligen Gitter. Ein inverse 2D-Fourier-Transformation liefert dann das Bild. Das ist der Beweis, dass Rekonstruktion grundsätzlich möglich ist. Der nächste Abschnitt macht daraus ein praktisches Verfahren.

> [!abstract] Merke
> - Projektion unter θ → 1D-Fourier → Linie unter θ im 2D-Spektrum des Bildes.
> - Alle Winkel zusammen füllen das 2D-Spektrum vollständig, in Polarkoordinaten.

## Gefilterte Rückprojektion {#fbp eyebrow="Das Standardverfahren"}

### Herleitung in drei Schritten

<ol class="steps">
<li><strong>Inverse 2D-Fourier-Transformation:</strong> Das Bild ergibt sich aus seinem Spektrum durch
          <div class="eq">$$f(x,y) = \iint F(u,v)\,e^{2\pi i (u x + v y)}\,\mathrm du\,\mathrm dv$$</div></li>
<li><strong>Polarkoordinaten:</strong> Mit \(u = \omega\cos\theta\), \(v = \omega\sin\theta\) und \(\omega \in (-\infty, \infty)\), \(\theta \in [0, \pi)\) wird das Flächenelement zu \(\mathrm du\,\mathrm dv = |\omega|\,\mathrm d\omega\,\mathrm d\theta\). Mit \(s = x\cos\theta + y\sin\theta\) gilt \(ux + vy = \omega s\):
          <div class="eq">$$f(x,y) = \int_0^\pi \int_{-\infty}^{\infty} F(\omega\cos\theta, \omega\sin\theta)\;|\omega|\;e^{2\pi i \omega s}\,\mathrm d\omega\,\mathrm d\theta$$</div></li>
<li><strong>Fourier-Slice einsetzen:</strong> \(F(\omega\cos\theta, \omega\sin\theta) = P_\theta(\omega)\). Das innere Integral hängt dann nur noch von einer einzigen Projektion ab:
          <div class="eq">$$f(x,y) = \int_0^\pi q(\theta,\; x\cos\theta + y\sin\theta)\;\mathrm d\theta, \qquad q(\theta, s) = \int P_\theta(\omega)\,|\omega|\,e^{2\pi i \omega s}\,\mathrm d\omega$$</div></li>
</ol>

Das ist die **gefilterte Rückprojektion** (FBP, filtered back projection). Man liest sie von innen nach außen:

1. Jede Projektion $p(\theta, s)$ Fourier-transformieren.
2. Mit dem **Rampenfilter** $|\omega|$ multiplizieren.
3. Zurücktransformieren. Ergebnis: die gefilterte Projektion $q(\theta, s)$.
4. $q$ wie in Abschnitt 3 zurückprojizieren.

Schritte 1–3 sind nach dem Faltungssatz nichts anderes als eine Faltung der Projektion mit einem Kern $h(s)$, der Fourier-Rücktransformierten von $|\omega|$. Das ist der Weg, den die Gleichung zum Rampenfilter in Abschnitt 3 schon angedeutet hat, nur jetzt pro Projektion statt am fertigen Bild.

### Woher das |ω| anschaulich kommt

Der Faktor $|\omega|$ ist das Flächenelement der Polarkoordinaten. Anschaulich: Die radialen Linien, auf denen jede Projektion das Spektrum abtastet, liegen im Zentrum dicht beieinander und laufen nach außen auseinander. Niedrige Frequenzen werden dadurch von allen Projektionen mehrfach erfasst und sind überrepräsentiert, hohe nur dünn. Das Gewicht $|\omega|$ gleicht die Dichte aus. Ohne dieses Gewicht sind tiefe Frequenzen um den Faktor $1/|\omega|$ zu stark, und genau das ist die $1/r$-Unschärfe aus Abschnitt 3.

::: widget rk-05-polare-abtastung

### Der diskrete Filter und Fensterfunktionen

Im Rechner ist die Projektion mit Abstand $\Delta s$ abgetastet. Die höchste darstellbare Frequenz ist dann die Nyquist-Frequenz $\omega_N = 1/(2\Delta s)$. Ein auf diesen Bereich begrenzter Rampenfilter hat im Ortsraum den bekannten **Ram-Lak-Kern**:

$$
h[n] = \begin{cases} \dfrac{1}{4\Delta s^2} & n = 0 \\[4pt] 0 & n \text{ gerade} \\[4pt] -\dfrac{1}{\pi^2 n^2 \Delta s^2} & n \text{ ungerade} \end{cases}
$$

Die Spitze in der Mitte und die negativen Nachbarwerte schärfen. In Abb. 3 sieht man ihre Wirkung: Die negativen Ausläufer jedes gefilterten Strahls heben die Überlagerung außerhalb des Punktes gerade auf.

Das Problem des reinen Rampenfilters: Er verstärkt die höchsten Frequenzen am stärksten, und dort steckt vor allem **Rauschen**. Deshalb multipliziert man ihn in der Praxis mit einer **Fensterfunktion**, die zum Rand hin abfällt. Das ist ein Kompromiss zwischen Schärfe und Rauschen, den Radiologen über die Wahl des „Rekonstruktionskerns“ steuern (weich für Weichteile, scharf für Knochen und Lunge).

| Filter | Fenster $W(\omega)$, mit $x = \omega / \omega_N$ | Charakter |
|---|---|---|
| Ram-Lak | $1$ | maximal scharf, maximal verrauscht |
| Shepp-Logan | $\mathrm{sinc}(x/2) = \dfrac{\sin(\pi x/2)}{\pi x/2}$ | leicht gedämpft, häufiger Standard |
| Kosinus | $\cos(\pi x/2)$ | mittel |
| Hann | $\tfrac12\,(1 + \cos\pi x)$ | weich, rauscharm, weniger Details |

::: widget rk-06-fbp-labor

> [!abstract] Merke
> - FBP: jede Projektion mit $|\omega|$ filtern, dann zurückprojizieren.
> - $|\omega|$ gleicht aus, dass die Projektionen das Spektrum innen dicht und außen dünn abtasten.
> - Fensterfunktionen dämpfen hohe Frequenzen: weniger Rauschen, weniger Schärfe.

## Winkel, Rauschen, Geometrie {#praxis eyebrow="Praxis" toc="Praxis: Winkel, Rauschen, Geometrie"}

### Wie viele Winkel braucht man?

Hat der Detektor $N_s$ Kanäle, tastet jede Projektion das Spektrum radial mit $N_s$ Punkten ab. Damit auch am Rand des Spektrums der Abstand zwischen benachbarten radialen Linien nicht größer ist als der Abstand der Punkte auf einer Linie, braucht man etwa

$$
N_\theta \approx \frac{\pi}{2}\,N_s
$$

Projektionen über 180°. Bei 128 Kanälen sind das rund 200. Zu wenige Winkel erzeugen **Streifenartefakte**: Die einzelnen Rückprojektionsstrahlen löschen sich außerhalb von Objekten nicht mehr vollständig aus. In Abb. 6 sieht man sie unterhalb von etwa 60 Winkeln deutlich, zuerst am Rand des Bildes. Klinische Scanner nehmen 1000 bis über 2000 Projektionen pro Umdrehung auf.

### Rauschen

Die Zahl der Photonen pro Detektorpixel ist Poisson-verteilt. Nach dem Logarithmieren ist die Varianz eines Messwerts ungefähr

$$
\sigma_p^2 \approx \frac{1}{N} = \frac{1}{I_0\,e^{-p}}
$$

Strahlen durch dicke oder dichte Bereiche (großes $p$) sind also viel stärker verrauscht. Bei der FBP wird jeder Messwert gleich behandelt, das starke Rauschen einzelner Strahlen läuft ungebremst ins Bild und erzeugt Streifen zwischen dichten Strukturen. Das Bildrauschen sinkt ungefähr wie $1/\sqrt{\text{Dosis}}$: Für halbes Rauschen braucht man die vierfache Dosis. Genau hier setzen iterative Verfahren an (Abschnitt 7).

### Interpolation

Bei der Rückprojektion trifft die Gerade durch ein Bildpixel den Detektor fast nie genau in einer Kanalmitte. Man interpoliert, meist linear zwischen zwei Kanälen. Das wirkt wie ein leichter zusätzlicher Tiefpass. Ähnlich wird bei der Rekonstruktion im Frequenzraum (direkte Fourier-Methode) von Polar- auf kartesisches Gitter interpoliert. Das ist fehleranfälliger, weshalb sich FBP durchgesetzt hat.

### Vom Parallelstrahl zum Fächer und Kegel

::: widget rk-07-geometrien

- **Fächerstrahl:** Man kann die Messwerte umsortieren, sodass Strahlen mit gleicher Richtung aus verschiedenen Projektionen zusammenkommen (*Rebinning* auf parallele Strahlen), oder eine angepasste FBP mit zusätzlichen Gewichten verwenden. Für eine vollständige Messung braucht man 180° plus den Öffnungswinkel des Fächers (*Short Scan*), Doppelmessungen werden dann gewichtet (z. B. Parker-Gewichtung).
- **Kegelstrahl:** Mit mehreren Detektorzeilen oder einem Flachdetektor laufen die Strahlen auch schräg zur Schnittebene. Der Standard ist der näherungsweise **FDK-Algorithmus** (Feldkamp, Davis, Kress, 1984): FBP mit Gewichtung nach Kegelwinkel und dreidimensionaler Rückprojektion. Bei großen Kegelwinkeln entstehen Artefakte, weil eine Kreisbahn die Daten nicht vollständig erfasst.
- **Spirale (Helix):** Der Patient wird während der Drehung durch die Gantry gefahren. Klinische Mehrzeilen-CTs rekonstruieren dafür mit speziellen gewichteten FBP-Varianten oder iterativ.

> [!abstract] Merke
> - Zu wenige Winkel → Streifen. Faustregel $N_\theta \approx \tfrac{\pi}{2} N_s$.
> - Rauschen eines Strahls wächst mit seiner Schwächung, FBP behandelt alle Strahlen gleich.
> - Reale Geometrien (Fächer, Kegel, Spirale) brauchen angepasste Gewichte, das FBP-Prinzip bleibt.

## Iterative Rekonstruktion {#iterativ eyebrow="Moderne Verfahren"}

FBP ist schnell und exakt, wenn die Daten ideal sind: viele Winkel, wenig Rauschen, perfekte Geometrie. Iterative Verfahren betrachten die Rekonstruktion stattdessen als großes Gleichungssystem und lösen es schrittweise. Dadurch kann man Physik, Statistik und Vorwissen über das Bild direkt einbauen.

### Rekonstruktion als Gleichungssystem

Das Bild wird in Pixel zerlegt, die unbekannten μ-Werte bilden einen Vektor $\mathbf x$. Jeder Messwert $p_i$ ist eine gewichtete Summe der Pixel, die der Strahl $i$ durchquert:

$$
p_i = \sum_j a_{ij}\,x_j \qquad\Longleftrightarrow\qquad \mathbf p = A\,\mathbf x
$$

Das Gewicht $a_{ij}$ ist die Weglänge von Strahl $i$ in Pixel $j$. Die **Systemmatrix** $A$ ist riesig (für ein 512 × 512-Bild 262 144 Unbekannte und Millionen von Messwerten), aber dünn besetzt: Jeder Strahl trifft nur wenige hundert Pixel.

::: widget rk-08-gleichungssystem

### Kaczmarz und ART

Das Gleichungssystem ist zu groß für eine direkte Lösung. Die älteste iterative Methode, die **algebraische Rekonstruktionstechnik (ART)**, geht auf Kaczmarz (1937) zurück und war tatsächlich das Verfahren im ersten CT von Hounsfield. Sie nimmt sich eine Gleichung nach der anderen vor und korrigiert die aktuelle Schätzung gerade so weit, dass diese eine Gleichung erfüllt ist:

$$
\mathbf x \;\leftarrow\; \mathbf x + \lambda\,\frac{p_i - \mathbf a_i \cdot \mathbf x}{\lVert \mathbf a_i \rVert^2}\;\mathbf a_i
$$

In Worten: Projektion der aktuellen Schätzung berechnen, mit der Messung vergleichen, den Fehler gleichmäßig entlang des Strahls zurückverteilen. Geometrisch ist jede Gleichung eine Hyperebene, und jeder Schritt ist eine senkrechte Projektion auf die nächste Ebene. In zwei Dimensionen kann man das zeichnen:

::: widget rk-09-kaczmarz

### SART und das Verhalten bei Rauschen

**SART** (simultaneous ART) korrigiert nicht Strahl für Strahl, sondern eine ganze Projektion auf einmal: alle Strahlen eines Winkels vorwärtsprojizieren, die relativen Fehler bilden, gemeinsam zurückprojizieren und normiert auf das Bild addieren. Das ist robuster gegenüber Rauschen und gut parallelisierbar. Man kann zudem jederzeit Nebenbedingungen erzwingen, zum Beispiel, dass μ nicht negativ werden darf.

::: widget rk-10-sart

### Statistische und modellbasierte Verfahren

Moderne Verfahren formulieren die Rekonstruktion als Optimierungsproblem (ausführlich auf der Seite [Iterative Rekonstruktion](iterative-rekonstruktion.html)). Ein typisches Ziel ist

$$
\hat{\mathbf x} = \arg\min_{\mathbf x}\;\; \sum_i w_i\,\big(p_i - \mathbf a_i\cdot\mathbf x\big)^2 \;+\; \beta\,R(\mathbf x)
$$

<dl class="sym">
<dt>w_i</dt><dd>Gewicht jedes Messwerts, proportional zu seiner Photonenzahl. Verrauschte Strahlen (wenige Photonen) zählen weniger. Das löst das Problem aus Abschnitt 6.</dd>
<dt>R(x)</dt><dd>Regularisierung, also Vorwissen über Bilder, z. B. „benachbarte Pixel sind meist ähnlich, außer an Kanten“ (Total Variation, kantenerhaltende Glättung).</dd>
<dt>β</dt><dd>regelt, wie stark das Vorwissen gegenüber den Daten gewichtet wird.</dd>
</dl>

Statt der gewichteten Quadratsumme kann man auch direkt die Poisson-Likelihood der Photonenzählung maximieren. **Modellbasierte** Verfahren (MBIR) gehen weiter und bilden zusätzlich Brennfleckgröße, Detektorantwort, Streustrahlung und das polychromatische Spektrum in $A$ ab. Der Preis ist Rechenzeit: Jede Iteration braucht eine Vorwärts- und eine Rückprojektion des gesamten Volumens.

In klinischen Scannern sind iterative Verfahren heute Standard und ermöglichen deutliche Dosisreduktion bei gleicher Bildqualität. Hinzu kommen Verfahren mit neuronalen Netzen: als Nachverarbeitung, die das FBP-Bild entrauscht, als Netz, das Schritte eines iterativen Verfahrens lernt („unrolled“), oder als gelernter Regularisierer. Bei allen bleibt die Datenkonsistenz, also $A\mathbf x \approx \mathbf p$, der Anker, der verhindert, dass das Netz Strukturen erfindet.

|  | FBP | Iterativ |
|---|---|---|
| Rechenaufwand | gering, eine Rückprojektion | hoch, viele Vor- und Rückprojektionen |
| Rauschmodell | alle Strahlen gleich | Gewichtung nach Photonenstatistik |
| Wenige Winkel, fehlende Daten | Streifenartefakte | deutlich robuster, besonders mit Regularisierung |
| Physikmodell | ideale Linienintegrale | beliebig erweiterbar (Spektrum, Streuung, Detektor) |
| Vorhersagbarkeit | linear, Bildeigenschaften gut bekannt | nichtlinear, Auflösung und Rauschtextur können vom Kontrast abhängen |

> [!abstract] Merke
> - Iterativ: Bild schätzen, vorwärts projizieren, mit Messung vergleichen, Fehler zurückprojizieren, wiederholen.
> - ART/SART korrigieren Strahl für Strahl bzw. Projektion für Projektion.
> - Statistische Verfahren gewichten Messwerte nach ihrer Zuverlässigkeit und bringen Vorwissen über Regularisierung ein.
> - Ohne Regularisierung bilden Iterationen irgendwann das Rauschen nach: früh stoppen oder regularisieren.

## Formeln auf einen Blick {#formeln appendix="A" eyebrow="Anhang"}

<div class="tbl"><table>
<tbody>
<tr><td>Messung</td><td>\(p = -\ln(I/I_0) = \int \mu\,\mathrm dl\)</td></tr>
<tr><td>Radon-Transformation</td><td>\(p(\theta,s) = \iint f(x,y)\,\delta(x\cos\theta + y\sin\theta - s)\,\mathrm dx\,\mathrm dy\)</td></tr>
<tr><td>Sinuskurve eines Punktes</td><td>\(s(\theta) = x_0\cos\theta + y_0\sin\theta\)</td></tr>
<tr><td>Rückprojektion</td><td>\(b(x,y) = \int_0^\pi p(\theta, x\cos\theta + y\sin\theta)\,\mathrm d\theta = f * \tfrac{1}{r}\)</td></tr>
<tr><td>Fourier-Slice-Theorem</td><td>\(P_\theta(\omega) = F(\omega\cos\theta, \omega\sin\theta)\)</td></tr>
<tr><td>Gefilterte Rückprojektion</td><td>\(f(x,y) = \int_0^\pi q(\theta, x\cos\theta + y\sin\theta)\,\mathrm d\theta\), \(\;q = \mathcal F^{-1}\{|\omega|\,P_\theta\}\)</td></tr>
<tr><td>Ram-Lak-Kern</td><td>\(h[0] = \tfrac{1}{4\Delta s^2}\), \(h[n_{\text{ungerade}}] = -\tfrac{1}{\pi^2 n^2 \Delta s^2}\), sonst 0</td></tr>
<tr><td>Winkelzahl</td><td>\(N_\theta \approx \tfrac{\pi}{2} N_s\)</td></tr>
<tr><td>Rauschen eines Messwerts</td><td>\(\sigma_p^2 \approx 1/(I_0 e^{-p})\)</td></tr>
<tr><td>ART (Kaczmarz)</td><td>\(\mathbf x \leftarrow \mathbf x + \lambda\,\frac{p_i - \mathbf a_i\cdot\mathbf x}{\lVert\mathbf a_i\rVert^2}\,\mathbf a_i\)</td></tr>
<tr><td>Penalisierte WLS</td><td>\(\hat{\mathbf x} = \arg\min \sum_i w_i (p_i - \mathbf a_i\cdot\mathbf x)^2 + \beta R(\mathbf x)\)</td></tr>
</tbody>
</table></div>

Weiterlesen: Kak &amp; Slaney, *Principles of Computerized Tomographic Imaging* (frei verfügbar, Kapitel 3 und 7), sowie Buzug, *Computed Tomography*.

Zurück zu [„Vom Photon zum Bild“](roentgen.html) · [„Photonen zählen“](photon-counting.html)
