---
title: Wahrscheinlichkeit und Statistik
category: grundlagen
eyebrow: Grundlagen · Mathematik
tags: [Mathematik, Verteilungen, Kovarianz, Bayes, Schätzen]
footer: Alle Abbildungen ziehen ihre Stichproben live im Browser, mit festem Startwert, damit sie reproduzierbar sind. Für echte Auswertungen nimmt man NumPy und <code>scipy.stats</code>.
---

Zufallsvariablen, Verteilungen und wie man mit ihnen rechnet, bis zum Schätzen von Parametern aus Messdaten. Mit Blick auf das, was in der Bildgebung und im Machine Learning ständig vorkommt: Poisson-Rauschen, Kovarianzmatrizen, Fehlerfortpflanzung und Likelihood.

## Zufall und Wahrscheinlichkeit {#zufall group="Grundbegriffe"}

Ein **Zufallsexperiment** hat mehrere mögliche Ausgänge, etwa die Zahl der Photonen, die in einer Millisekunde in einem Detektorpixel ankommen. Die Menge aller Ausgänge heißt **Ergebnisraum** $\Omega$, eine Teilmenge davon **Ereignis**. Eine **Wahrscheinlichkeit** $P$ ordnet jedem Ereignis eine Zahl zu, nach drei Regeln:

$$
P(A) \ge 0, \qquad P(\Omega) = 1, \qquad P(A \cup B) = P(A) + P(B) \ \text{ falls } A \cap B = \emptyset
$$

Alles Weitere folgt daraus, zum Beispiel $P(\bar A) = 1 - P(A)$ und $P(A \cup B) = P(A) + P(B) - P(A \cap B)$.

Die **bedingte Wahrscheinlichkeit** von $A$, wenn man schon weiß, dass $B$ eingetreten ist, ist

$$
P(A \mid B) = \frac{P(A \cap B)}{P(B)}
$$

Man schränkt die Welt auf $B$ ein und fragt, welcher Anteil davon auch zu $A$ gehört. Zwei Ereignisse sind **unabhängig**, wenn das Wissen über das eine nichts am anderen ändert: $P(A \mid B) = P(A)$, gleichbedeutend $P(A \cap B) = P(A)\,P(B)$.

## Zufallsvariablen und Verteilungen {#verteilungen}

Eine **Zufallsvariable** $X$ ordnet jedem Ausgang eine Zahl zu. Ihre **Verteilung** sagt, mit welcher Wahrscheinlichkeit welche Werte vorkommen.

- **Diskret** (abzählbar viele Werte, z. B. Photonenzahlen): Die **Wahrscheinlichkeitsfunktion** $p(k) = P(X = k)$ gibt die Wahrscheinlichkeit jedes Werts. Alle $p(k)$ summieren sich zu 1.
- **Stetig** (z. B. eine Spannung): Ein einzelner Wert hat Wahrscheinlichkeit 0. Stattdessen gibt es eine **Dichte** $p(x)$, und Wahrscheinlichkeiten sind Flächen darunter: $P(a \le X \le b) = \int_a^b p(x)\,\mathrm dx$. Die Dichte selbst kann größer als 1 sein, nur ihre Gesamtfläche ist 1.

Für beide Fälle gibt es die **Verteilungsfunktion** $F(x) = P(X \le x)$. Sie steigt von 0 auf 1 und ist bei stetigen Variablen das Integral der Dichte.

Eine **Stichprobe** sind $N$ unabhängige Ziehungen aus derselben Verteilung (englisch *i.i.d.*). Ein Histogramm der Stichprobe, auf Fläche 1 normiert, nähert die Dichte an, umso besser, je größer $N$ ist.

::: widget ws-01-stichprobe-und-dichte

## Erwartungswert und Varianz {#momente}

Der **Erwartungswert** ist der Schwerpunkt der Verteilung, die **Varianz** die mittlere quadratische Abweichung davon:

$$
\mathbb E[X] = \mu = \sum_k k\,p(k) \ \text{ bzw. } \int x\,p(x)\,\mathrm dx, \qquad \operatorname{Var}[X] = \sigma^2 = \mathbb E\big[(X - \mu)^2\big] = \mathbb E[X^2] - \mu^2
$$

Die **Standardabweichung** $\sigma$ hat dieselbe Einheit wie $X$ und ist das übliche Maß für die Streuung. Die wichtigsten Rechenregeln:

$$
\mathbb E[aX + b] = a\,\mathbb E[X] + b, \qquad \operatorname{Var}[aX + b] = a^2 \operatorname{Var}[X], \qquad \mathbb E[X + Y] = \mathbb E[X] + \mathbb E[Y]
$$

Die Summenregel für Erwartungswerte gilt immer. Für Varianzen gilt $\operatorname{Var}[X + Y] = \operatorname{Var}[X] + \operatorname{Var}[Y]$ nur, wenn $X$ und $Y$ unkorreliert sind (Abschnitt 7). Daraus folgt eine der wichtigsten Regeln überhaupt: Der Mittelwert aus $N$ unabhängigen Messungen mit Streuung $\sigma$ streut nur noch mit $\sigma/\sqrt N$. Vierfache Messzeit halbiert das Rauschen.

Höhere **Momente** beschreiben die Form: Die **Schiefe** $\mathbb E[(X-\mu)^3]/\sigma^3$ misst die Asymmetrie, die **Kurtosis** $\mathbb E[(X-\mu)^4]/\sigma^4$, wie schwer die Ränder sind (Gauß: 0 bzw. 3).

> [!abstract] Merke
> - $\mathbb E$ ist linear, immer. $\operatorname{Var}[aX] = a^2\operatorname{Var}[X]$.
> - Varianzen unabhängiger Größen addieren sich, Standardabweichungen nicht.
> - Mittelwert aus $N$ Messungen: Streuung $\sigma/\sqrt N$.

## Binomial, Poisson und Gauß {#bpg group="Wichtige Verteilungen" toc="Binomial, Poisson, Gauß"}

Drei Verteilungen, die ineinander übergehen und in der Bildgebung überall auftauchen.

**Binomial.** $n$ unabhängige Versuche, jeder mit Erfolgswahrscheinlichkeit $p$. Die Zahl der Erfolge $K$ ist binomialverteilt:

$$
P(K = k) = \binom nk p^k (1-p)^{n-k}, \qquad \mathbb E[K] = np, \qquad \operatorname{Var}[K] = np(1-p)
$$

Beispiel: Von $n$ Photonen, die auf ein Pixel treffen, wird jedes mit Wahrscheinlichkeit $p$ absorbiert.

**Poisson.** Lässt man $n \to \infty$ und $p \to 0$ bei festem $\lambda = np$, wird daraus die Poisson-Verteilung. Sie beschreibt seltene, unabhängige Ereignisse in einem Zeitraum, etwa Photonen pro Pixel und Belichtung:

$$
P(K = k) = \frac{\lambda^k e^{-\lambda}}{k!}, \qquad \mathbb E[K] = \operatorname{Var}[K] = \lambda
$$

Varianz gleich Mittelwert hat eine direkte Folge: Das Signal-Rausch-Verhältnis ist $\lambda/\sqrt\lambda = \sqrt\lambda$. Viermal so viele Photonen, also viermal so viel Dosis, verdoppeln das SNR. Diese Grenze heißt **Quantenrauschen**, kein Detektor kann sie unterbieten.

**Gauß.** Für großes $\lambda$ (ab etwa 20) sieht die Poisson-Verteilung aus wie eine Normalverteilung mit $\mu = \sigma^2 = \lambda$. Allgemein:

$$
\mathcal N(x \mid \mu, \sigma^2) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)
$$

Rund 68 % der Werte liegen innerhalb $\pm 1\sigma$, 95 % innerhalb $\pm 1{,}96\sigma$, 99,7 % innerhalb $\pm 3\sigma$. Warum die Gaußverteilung so oft auftaucht, erklärt der zentrale Grenzwertsatz (Abschnitt 9).

::: widget ws-02-binomial-poisson-gauss

## Weitere Verteilungen {#weitere}

| Verteilung | Wahrscheinlichkeit bzw. Dichte | $\mathbb E$ | $\operatorname{Var}$ | typisch für |
|---|---|---|---|---|
| Bernoulli | $P(1) = p$, $P(0) = 1 - p$ | $p$ | $p(1-p)$ | ein einzelner Ja/Nein-Versuch |
| kategorial | $P(k) = \pi_k$, $\sum_k \pi_k = 1$ | | | Klassifikation, nächstes Token |
| gleichverteilt | $\frac1{b-a}$ auf $[a, b]$ | $\frac{a+b}2$ | $\frac{(b-a)^2}{12}$ | Rundungsfehler, Quantisierung |
| exponentiell | $\lambda e^{-\lambda x}$, $x \ge 0$ | $\frac1\lambda$ | $\frac1{\lambda^2}$ | Wartezeit bis zum nächsten Photon |
| Gamma | $\propto x^{\alpha-1}e^{-\beta x}$ | $\frac\alpha\beta$ | $\frac\alpha{\beta^2}$ | Prior für Poisson-Raten |
| Beta | $\propto x^{\alpha-1}(1-x)^{\beta-1}$ auf $[0,1]$ | $\frac\alpha{\alpha+\beta}$ | | Prior für Wahrscheinlichkeiten |

Die **kategoriale** Verteilung ist das, was ein Klassifikator oder Sprachmodell am Ende ausgibt. Die Softmax macht aus beliebigen Zahlen $z_k$ gültige Wahrscheinlichkeiten $\pi_k = e^{z_k} / \sum_j e^{z_j}$. Die Varianz der Gleichverteilung erklärt das Quantisierungsrauschen: Ein Analog-Digital-Wandler mit Stufenhöhe $\Delta$ fügt ein Rauschen von $\Delta/\sqrt{12}$ hinzu.

## Gemeinsame Verteilungen {#gemeinsam group="Mehrere Variablen"}

Für zwei Zufallsvariablen beschreibt die **gemeinsame Verteilung** $p(x, y)$ alle Kombinationen. Daraus gewinnt man zwei andere Verteilungen:

- **Randverteilung:** über die andere Variable summieren oder integrieren, $p(x) = \int p(x, y)\,\mathrm dy$.
- **Bedingte Verteilung:** einen Schnitt bei festem $x$ nehmen und auf Fläche 1 normieren, $p(y \mid x) = p(x, y) / p(x)$.

Umgestellt ergeben sich die beiden Regeln, auf denen die ganze Wahrscheinlichkeitsrechnung aufbaut:

$$
\text{Summenregel: } p(x) = \int p(x, y)\,\mathrm dy, \qquad \text{Produktregel: } p(x, y) = p(y \mid x)\,p(x)
$$

$X$ und $Y$ sind **unabhängig**, wenn $p(x, y) = p(x)\,p(y)$, also wenn jeder Schnitt $p(y \mid x)$ gleich aussieht.

## Kovarianz und Korrelation {#kovarianz}

Die **Kovarianz** misst, ob zwei Größen gemeinsam schwanken:

$$
\operatorname{Cov}[X, Y] = \mathbb E\big[(X - \mu_X)(Y - \mu_Y)\big], \qquad \rho = \frac{\operatorname{Cov}[X, Y]}{\sigma_X\,\sigma_Y} \in [-1, 1]
$$

Der **Korrelationskoeffizient** $\rho$ ist die auf Einheiten bereinigte Version. $\rho = 0$ heißt unkorreliert, das ist schwächer als unabhängig: $Y = X^2$ mit symmetrischem $X$ ist unkorreliert, aber völlig abhängig. Korrelation misst nur lineare Zusammenhänge.

Für einen Zufallsvektor $\mathbf x \in \mathbb R^d$ fasst die **Kovarianzmatrix** alle Paare zusammen:

$$
\Sigma = \mathbb E\big[(\mathbf x - \boldsymbol\mu)(\mathbf x - \boldsymbol\mu)^\top\big], \qquad \Sigma_{ij} = \operatorname{Cov}[x_i, x_j]
$$

Auf der Diagonale stehen die Varianzen. $\Sigma$ ist symmetrisch und positiv semidefinit. Ihre Eigenvektoren sind die Hauptachsen der Streuung, die Eigenwerte die Varianzen entlang dieser Achsen. Das ist genau die PCA aus der [linearen Algebra](lineare-algebra.html#svd). Für eine lineare Abbildung $\mathbf y = A\mathbf x$ gilt $\Sigma_y = A\,\Sigma_x A^\top$. In einem Detektorbild sagt die Kovarianz benachbarter Pixel, ob das Rauschen weiß oder korreliert ist; das Rauschleistungsspektrum (NPS) ist ihre Fourier-Transformierte.

Die **mehrdimensionale Gaußverteilung** hat Höhenlinien in Form von Ellipsen, deren Form $\Sigma$ festlegt:

$$
\mathcal N(\mathbf x \mid \boldsymbol\mu, \Sigma) = \frac{1}{\sqrt{(2\pi)^d \det\Sigma}} \exp\!\left(-\tfrac12 (\mathbf x - \boldsymbol\mu)^\top \Sigma^{-1} (\mathbf x - \boldsymbol\mu)\right)
$$

Der Ausdruck im Exponenten ist die quadrierte Mahalanobis-Distanz. Bei der Gaußverteilung sind Rand- und bedingte Verteilungen wieder gaußsch. Der bedingte Mittelwert $\mathbb E[y \mid x] = \mu_y + \rho\,\frac{\sigma_y}{\sigma_x}(x - \mu_x)$ ist eine Gerade, die Regressionsgerade.

::: widget ws-03-gauss-2d

## Satz von Bayes {#bayes}

Die Produktregel lässt sich auf zwei Arten schreiben, $p(x, y) = p(y \mid x)\,p(x) = p(x \mid y)\,p(y)$. Gleichsetzen ergibt den **Satz von Bayes**. Mit $\theta$ für das Unbekannte und $\mathcal D$ für die Daten:

$$
\underbrace{p(\theta \mid \mathcal D)}_{\text{Posterior}} = \frac{\overbrace{p(\mathcal D \mid \theta)}^{\text{Likelihood}}\ \overbrace{p(\theta)}^{\text{Prior}}}{\underbrace{p(\mathcal D)}_{\text{Evidenz}}}
$$

Der **Prior** ist das Wissen vor der Messung, die **Likelihood** sagt, wie gut ein Wert von $\theta$ die Daten erklärt, der **Posterior** ist das Wissen danach. Die Evidenz sorgt nur dafür, dass sich der Posterior zu 1 normiert.

Das klassische Beispiel ist ein Test für eine seltene Krankheit. Selbst ein guter Test liefert dann überwiegend falsch positive Ergebnisse, weil es so viel mehr Gesunde als Kranke gibt. Wie wahrscheinlich ein positiver Befund wirklich krank bedeutet, hängt stark von der Häufigkeit der Krankheit ab, der **Basisrate**. Wer sie ignoriert, verwechselt $P(\text{positiv} \mid \text{krank})$ mit $P(\text{krank} \mid \text{positiv})$.

::: widget ws-04-bayes

## Gesetz der großen Zahlen und zentraler Grenzwertsatz {#zgs group="Grenzwertsätze" toc="Grenzwertsätze"}

Das **Gesetz der großen Zahlen** sagt: Der Mittelwert $\bar X_N$ von $N$ unabhängigen Ziehungen läuft gegen den Erwartungswert $\mu$. Deshalb lassen sich Erwartungswerte durch Mittelwerte schätzen und Integrale durch Zufallsstichproben berechnen (Monte-Carlo).

Der **zentrale Grenzwertsatz** sagt zusätzlich, wie der Mittelwert um $\mu$ streut: Für großes $N$ ist er normalverteilt, egal wie die einzelnen $X_i$ verteilt sind, solange ihre Varianz endlich ist:

$$
\bar X_N \approx \mathcal N\!\left(\mu, \frac{\sigma^2}{N}\right) \qquad \text{bzw.} \qquad \frac{\bar X_N - \mu}{\sigma/\sqrt N} \to \mathcal N(0, 1)
$$

Deshalb ist Gauß-Rauschen so verbreitet: Viele kleine, unabhängige Störungen addieren sich zu einer Normalverteilung. Und deshalb wird die Poisson-Verteilung für großes $\lambda$ gaußförmig, denn eine Poisson-Zahl mit $\lambda$ ist die Summe von $\lambda$ Poisson-Zahlen mit Rate 1.

::: widget ws-05-grenzwertsatz

## Fehlerfortpflanzung {#fehler}

Gemessen wird $x$ mit Streuung $\sigma_x$, gebraucht wird $y = f(x)$. Wie stark streut $y$? Für eine lineare Funktion folgt das direkt aus den Rechenregeln. Für eine nichtlineare Funktion linearisiert man um den Mittelwert, $f(x) \approx f(\mu) + f'(\mu)(x - \mu)$, und erhält

$$
\sigma_y \approx |f'(\mu)|\,\sigma_x
$$

Mehrere Eingänge mit Kovarianzmatrix $\Sigma_x$ und mehrere Ausgänge gehen genauso, mit der [Jacobi-Matrix](lineare-algebra.html#kalkuel) $J$ statt der Ableitung:

$$
\Sigma_y \approx J\,\Sigma_x\,J^\top, \qquad J_{ij} = \frac{\partial f_i}{\partial x_j}
$$

Sind die Eingänge unkorreliert, wird daraus die bekannte Formel $\sigma_y^2 = \sum_j \big(\tfrac{\partial f}{\partial x_j}\big)^2 \sigma_j^2$.

Das Beispiel aus der [CT](../physik/rekonstruktion.html): Gemessen wird die Intensität $I$ mit Poisson-Rauschen, $\sigma_I = \sqrt I$. Rekonstruiert wird mit dem Linienintegral $p = -\ln(I / I_0)$. Die Ableitung ist $-1/I$, also

$$
\sigma_p \approx \frac{\sqrt I}{I} = \frac{1}{\sqrt I}
$$

Hinter dicken Objekten kommen wenige Photonen an, und genau dort wird $p$ am stärksten verrauscht. Die Linearisierung gilt, solange die Funktion über die Breite der Streuung fast gerade ist. Sonst wird die Ausgangsverteilung schief, und auch ihr Mittelwert verschiebt sich gegenüber $f(\mu)$.

::: widget ws-06-fehlerfortpflanzung

## Schätzer {#schaetzer group="Schätzen"}

Ein **Schätzer** ist eine Rechenvorschrift, die aus einer Stichprobe einen Wert für eine unbekannte Größe macht. Die üblichen für Mittelwert und Varianz:

$$
\bar x = \frac1N \sum_{i=1}^N x_i, \qquad s^2 = \frac{1}{N - 1}\sum_{i=1}^N (x_i - \bar x)^2
$$

Ein Schätzer ist selbst eine Zufallsvariable, denn eine andere Stichprobe gibt einen anderen Wert. Zwei Kenngrößen beschreiben seine Güte:

- **Bias** $\mathbb E[\hat\theta] - \theta$: Liegt der Schätzer im Mittel richtig?
- **Varianz** $\operatorname{Var}[\hat\theta]$: Wie stark schwankt er von Stichprobe zu Stichprobe? Für $\bar x$ ist das $\sigma^2/N$, ihre Wurzel heißt **Standardfehler**.

Der mittlere quadratische Fehler ist beides zusammen: $\mathbb E[(\hat\theta - \theta)^2] = \text{Bias}^2 + \text{Varianz}$. Ein kleiner Bias kann sich lohnen, wenn er die Varianz deutlich senkt. Das ist die Idee hinter Regularisierung.

Das $N - 1$ in $s^2$ heißt **Bessel-Korrektur**. Die Abweichungen werden vom geschätzten Mittelwert $\bar x$ gemessen, nicht vom wahren $\mu$. Da $\bar x$ aus denselben Daten stammt, liegt er näher an ihnen als $\mu$, und die Summe der Quadrate fällt im Mittel um genau ein $\sigma^2$ zu klein aus. Mit $1/N$ wäre $s^2$ also systematisch zu klein. Bei großem $N$ spielt das keine Rolle.

## Maximum Likelihood und MAP {#ml}

Die meisten Schätzer folgen einem Prinzip: Wähle den Parameter, unter dem die beobachteten Daten am wahrscheinlichsten sind. Die **Likelihood** ist die Wahrscheinlichkeit der Daten als Funktion des Parameters. Bei unabhängigen Daten ist sie ein Produkt, deshalb arbeitet man mit ihrem Logarithmus:

$$
\hat\theta_\text{ML} = \arg\max_\theta \sum_{i=1}^N \log p(x_i \mid \theta)
$$

Zwei Fälle, die man kennen sollte:

- **Gauß-Rauschen** mit fester Varianz: $-\log p = \frac{(x_i - f_\theta)^2}{2\sigma^2} + \text{const}$. Maximum Likelihood ist hier dasselbe wie **kleinste Quadrate**. Mit unterschiedlichen $\sigma_i$ wird es gewichtete kleinste Quadrate.
- **Poisson-Zählung** mit Rate $\lambda$: $\log p = k_i \log\lambda - \lambda + \text{const}$. Ableiten und null setzen ergibt $\hat\lambda = \bar k$. Diese Poisson-Likelihood maximieren statistische CT-Rekonstruktion und die Materialzerlegung beim Photon Counting.

Auch die **Cross-Entropy**, mit der Klassifikatoren und Sprachmodelle trainiert werden, ist eine negative Log-Likelihood: die der kategorialen Verteilung für die richtige Klasse.

Wie genau der Schätzer ist, sieht man an der Krümmung der Log-Likelihood am Maximum: Ist sie spitz, legen die Daten den Parameter eng fest. Für viele Daten gilt $\operatorname{Var}[\hat\theta] \approx 1/\big(-\ell''(\hat\theta)\big)$. Dieser Wert ist zugleich die kleinstmögliche Varianz eines erwartungstreuen Schätzers (**Cramér-Rao-Schranke**).

Nimmt man einen Prior dazu, maximiert man den Posterior statt der Likelihood. Das heißt **MAP-Schätzung** (maximum a posteriori):

$$
\hat\theta_\text{MAP} = \arg\max_\theta \big[\log p(\mathcal D \mid \theta) + \log p(\theta)\big]
$$

Der Log-Prior wirkt wie ein Regularisierungsterm. Ein Gauß-Prior auf die Gewichte gibt genau die L2-Regularisierung (Ridge, Weight Decay). Mit vielen Daten dominiert die Likelihood, und MAP und ML fallen zusammen.

::: widget ws-07-likelihood

## Konfidenzintervalle und Tests {#ki}

Ein Schätzwert allein sagt nicht, wie sicher er ist. Ein **95-%-Konfidenzintervall** ist eine Vorschrift, die aus den Daten ein Intervall macht, das in 95 % aller Wiederholungen des Experiments den wahren Wert enthält. Für den Mittelwert mit bekanntem $\sigma$:

$$
\bar x \pm 1{,}96\,\frac{\sigma}{\sqrt N}
$$

Mit geschätztem $s$ statt $\sigma$ und kleinem $N$ nimmt man statt 1,96 den etwas größeren Wert der $t$-Verteilung.

Wichtig ist, was die 95 % bedeuten: Sie sind eine Eigenschaft des Verfahrens, nicht des einen berechneten Intervalls. Der wahre Wert ist fest, das Intervall ist zufällig. Ein konkretes Intervall enthält ihn oder nicht.

Ein **Hypothesentest** stellt die Frage umgekehrt. Man nimmt eine Nullhypothese an, etwa „kein Unterschied zwischen zwei Detektoren“, und berechnet den **p-Wert**: die Wahrscheinlichkeit, unter dieser Annahme ein mindestens so extremes Ergebnis zu sehen. Ein kleiner p-Wert spricht gegen die Nullhypothese. Er ist aber nicht die Wahrscheinlichkeit, dass die Nullhypothese stimmt, und er sagt nichts darüber, wie groß ein Effekt ist. Bei sehr vielen Daten wird auch ein winziger, praktisch bedeutungsloser Unterschied signifikant.

::: widget ws-08-konfidenzintervalle

## Formeln {#formeln appendix="A"}

| Thema | Formel |
|---|---|
| bedingte Wahrscheinlichkeit | $P(A \mid B) = P(A \cap B) / P(B)$ |
| Summen- und Produktregel | $p(x) = \int p(x, y)\,\mathrm dy$, $p(x, y) = p(y \mid x)\,p(x)$ |
| Bayes | $p(\theta \mid \mathcal D) = p(\mathcal D \mid \theta)\,p(\theta) / p(\mathcal D)$ |
| Varianz | $\operatorname{Var}[X] = \mathbb E[X^2] - \mu^2$, $\operatorname{Var}[aX + b] = a^2\operatorname{Var}[X]$ |
| Summe | $\operatorname{Var}[X + Y] = \operatorname{Var}[X] + \operatorname{Var}[Y] + 2\operatorname{Cov}[X, Y]$ |
| Mittelwert aus $N$ | $\operatorname{Var}[\bar X] = \sigma^2 / N$ |
| lineare Abbildung | $\mathbb E[A\mathbf x] = A\boldsymbol\mu$, $\Sigma_{A\mathbf x} = A\Sigma A^\top$ |
| Fehlerfortpflanzung | $\Sigma_y \approx J\Sigma_x J^\top$, eindimensional $\sigma_y \approx \vert f'(\mu)\vert\,\sigma_x$ |
| Poisson | $\mathbb E = \operatorname{Var} = \lambda$, SNR $= \sqrt\lambda$ |
| Stichprobenvarianz | $s^2 = \frac1{N-1}\sum (x_i - \bar x)^2$ |
| MSE | $\mathbb E[(\hat\theta - \theta)^2] = \text{Bias}^2 + \text{Varianz}$ |
| ML, MAP | $\arg\max \sum\log p(x_i \mid \theta)$, plus $\log p(\theta)$ |
| Konfidenzintervall | $\bar x \pm 1{,}96\,\sigma/\sqrt N$ |

## Befehle {#befehle appendix="B"}

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(0)
k = rng.poisson(lam=50, size=10_000)          # Photonenzahlen
x = rng.normal(loc=0, scale=1, size=(1000, 2))
X = rng.multivariate_normal(mean=[0, 0], cov=[[1, 0.8], [0.8, 1]], size=1000)

k.mean(), k.var(ddof=1)                       # Mittelwert, Stichprobenvarianz (N−1)
np.cov(X, rowvar=False)                       # Kovarianzmatrix (Spalten = Variablen)
np.corrcoef(X, rowvar=False)                  # Korrelationsmatrix

stats.norm.pdf(1.0), stats.norm.cdf(1.96)     # Dichte, Verteilungsfunktion
stats.norm.ppf(0.975)                         # Quantil: 1,96
stats.poisson.pmf(3, mu=4)                    # P(K = 3) bei λ = 4
stats.norm.fit(x[:, 0])                       # ML-Schätzung von μ und σ

stats.ttest_ind(a, b)                         # t-Test zweier Stichproben
stats.t.interval(0.95, df=len(a) - 1, loc=a.mean(), scale=stats.sem(a))  # 95-%-Intervall
```
