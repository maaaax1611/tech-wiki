---
title: Vektoranalysis und Optimierung
category: grundlagen
eyebrow: Grundlagen · Mathematik
tags: [Mathematik, Gradient, Jacobi, Hesse, Backpropagation, Optimierung]
footer: Alle Abbildungen rechnen live im Browser, Ableitungen dort numerisch über kleine Differenzen. In der Praxis übernimmt das automatische Differenzieren, etwa in PyTorch oder JAX.
---

Ableitungen von Funktionen mehrerer Variablen und wie man damit Minima findet. Das ist die Mathematik hinter dem Training jedes neuronalen Netzes und hinter iterativer Rekonstruktion: eine Verlustfunktion aufstellen, ihren Gradienten berechnen und bergab gehen.

## Ableitung und Taylor-Reihe {#taylor group="Ableiten"}

Die **Ableitung** $f'(x_0)$ ist die Steigung der Tangente. Sie liefert die beste lineare Näherung in der Nähe von $x_0$:

$$
f(x_0 + h) \approx f(x_0) + f'(x_0)\,h
$$

Nimmt man höhere Ableitungen dazu, wird daraus die **Taylor-Reihe**. Das Polynom vom Grad $n$ stimmt am Punkt $x_0$ in Wert und den ersten $n$ Ableitungen mit $f$ überein:

$$
T_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(x_0)}{k!}\,(x - x_0)^k = f(x_0) + f'(x_0)(x - x_0) + \tfrac12 f''(x_0)(x - x_0)^2 + \dots
$$

Fast alle Verfahren dieser Seite benutzen nur die ersten beiden Glieder (Gradientenabstieg, Fehlerfortpflanzung) oder die ersten drei (Newton-Verfahren). Wichtig ist deshalb weniger die ganze Reihe als die Idee: Im Kleinen ist eine glatte Funktion fast linear, und ein Stück weiter fast quadratisch.

Zwei Regeln braucht man ständig. Die **Produktregel** $(fg)' = f'g + fg'$ und die **Kettenregel** für verschachtelte Funktionen:

$$
\frac{\mathrm d}{\mathrm dx} f\big(g(x)\big) = f'\big(g(x)\big)\cdot g'(x)
$$

::: widget va-01-taylor

## Partielle Ableitungen und Gradient {#gradient}

Hängt $f$ von mehreren Variablen ab, $f: \mathbb R^n \to \mathbb R$, dann hält die **partielle Ableitung** $\partial f/\partial x_i$ alle anderen Variablen fest und leitet nur nach $x_i$ ab. Alle zusammen bilden den **Gradienten**:

$$
\nabla f(\mathbf x) = \begin{pmatrix} \partial f/\partial x_1 \\ \vdots \\ \partial f/\partial x_n \end{pmatrix}, \qquad f(\mathbf x + \mathbf h) \approx f(\mathbf x) + \nabla f(\mathbf x)^\top\mathbf h
$$

Die Steigung in eine beliebige Richtung $\mathbf u$ (mit $\|\mathbf u\| = 1$) ist die **Richtungsableitung** $\nabla f^\top\mathbf u = \|\nabla f\|\cos\theta$. Daraus folgen die beiden Eigenschaften, die man sich merken sollte:

- Der Gradient zeigt in die Richtung des **steilsten Anstiegs** ($\theta = 0$), seine Länge ist diese Steigung. $-\nabla f$ ist die Richtung des steilsten Abstiegs.
- Er steht **senkrecht auf den Höhenlinien**, denn entlang einer Höhenlinie ändert sich $f$ nicht ($\theta = 90°$).

In der Bildverarbeitung ist der Bildgradient genau das: $f$ ist die Helligkeit, und $\nabla f$ zeigt quer zur Kante (siehe [Filter](../bildverarbeitung/filter.html#gradient)).

::: widget va-02-gradient

## Jacobi-Matrix und Kettenregel {#jacobi}

Hat die Funktion selbst mehrere Ausgänge, $\mathbf f: \mathbb R^n \to \mathbb R^m$, dann gibt es für jeden Ausgang einen Gradienten. Als Zeilen untereinander geschrieben ergeben sie die **Jacobi-Matrix**:

$$
J = \frac{\partial\mathbf f}{\partial\mathbf x} = \begin{pmatrix} \dfrac{\partial f_1}{\partial x_1} & \cdots & \dfrac{\partial f_1}{\partial x_n} \\[1ex] \vdots & \ddots & \vdots \\[1ex] \dfrac{\partial f_m}{\partial x_1} & \cdots & \dfrac{\partial f_m}{\partial x_n} \end{pmatrix} \in \mathbb R^{m\times n}, \qquad \mathbf f(\mathbf x + \mathbf h) \approx \mathbf f(\mathbf x) + J\mathbf h
$$

Zeile $i$ gehört zum Ausgang $f_i$, Spalte $j$ zur Eingabe $x_j$. Lokal verhält sich jede glatte Abbildung wie die Matrix $J$. Deshalb gilt alles aus der [linearen Algebra](lineare-algebra.html#matrizen) im Kleinen auch für nichtlineare Abbildungen. Zum Beispiel misst $|\det J|$, wie stark Flächen oder Volumina an dieser Stelle vergrößert werden. Für skalares $f$ ist $J$ eine einzige Zeile, nämlich $\nabla f^\top$.

Die **Kettenregel** wird zum Matrixprodukt. Für $\mathbf y = \mathbf g(\mathbf x)$ und $\mathbf z = \mathbf f(\mathbf y)$:

$$
\frac{\partial\mathbf z}{\partial\mathbf x} = \frac{\partial\mathbf z}{\partial\mathbf y}\,\frac{\partial\mathbf y}{\partial\mathbf x} = J_{\mathbf f}\,J_{\mathbf g}
$$

Die Dimensionen passen automatisch: $(m\times k)(k\times n) = m\times n$. Ein Netz mit vielen Schichten ist eine lange Verkettung, seine Ableitung ein langes Produkt von Jacobi-Matrizen.

::: widget va-03-jacobi

## Ableiten nach Vektoren und Matrizen {#regeln toc="Ableitungsregeln"}

Viele Verlustfunktionen bestehen aus Matrix-Vektor-Ausdrücken. Statt jedes Mal komponentenweise abzuleiten, merkt man sich ein paar Regeln. Konvention hier: Der Gradient ist ein Spaltenvektor mit derselben Form wie $\mathbf x$.

| Funktion $f(\mathbf x)$ | Gradient $\nabla_{\mathbf x} f$ | Bemerkung |
|---|---|---|
| $\mathbf a^\top\mathbf x$ | $\mathbf a$ | wie $ax$ im Eindimensionalen |
| $\mathbf x^\top\mathbf x = \Vert\mathbf x\Vert^2$ | $2\mathbf x$ | |
| $\mathbf x^\top A\mathbf x$ | $(A + A^\top)\mathbf x$ | $= 2A\mathbf x$ für symmetrisches $A$ |
| $\Vert A\mathbf x - \mathbf b\Vert^2$ | $2A^\top(A\mathbf x - \mathbf b)$ | null setzen ergibt die Normalengleichung |
| $\Vert A\mathbf x - \mathbf b\Vert^2 + \lambda\Vert\mathbf x\Vert^2$ | $2A^\top(A\mathbf x - \mathbf b) + 2\lambda\mathbf x$ | Ridge-Regression |
| $g(A\mathbf x)$ | $A^\top\nabla g(A\mathbf x)$ | Kettenregel durch eine lineare Schicht |
| $\sum_i \log\big(1 + e^{-y_i\,\mathbf a_i^\top\mathbf x}\big)$ | $-\sum_i \sigma(-y_i\mathbf a_i^\top\mathbf x)\,y_i\,\mathbf a_i$ | logistische Regression |

Für eine lineare Schicht $\mathbf y = W\mathbf x$ in einem Netz braucht man auch die Ableitung nach der Gewichtsmatrix. Kommt von oben der Gradient $\bar{\mathbf y} = \partial L/\partial\mathbf y$ an, dann ist

$$
\frac{\partial L}{\partial W} = \bar{\mathbf y}\,\mathbf x^\top, \qquad \frac{\partial L}{\partial\mathbf x} = W^\top\bar{\mathbf y}
$$

Der Gradient nach $W$ hat dieselbe Form wie $W$, ein äußeres Produkt. Der nach $\mathbf x$ läuft mit der transponierten Matrix zurück.

Zum Prüfen hilft eine Faustregel: Die Dimensionen müssen passen. Bei $\|A\mathbf x - \mathbf b\|^2$ mit $A \in \mathbb R^{m\times n}$ liegt $A\mathbf x - \mathbf b$ in $\mathbb R^m$, und erst $A^\top$ bringt es zurück nach $\mathbb R^n$, wo der Gradient leben muss.

## Backpropagation und automatisches Differenzieren {#backprop group="Rechnen lassen" toc="Backpropagation"}

Für ein Netz mit Millionen Parametern schreibt niemand den Gradienten von Hand aus. Stattdessen zerlegt man die Rechnung in einen **Rechengraphen** aus Elementarschritten (Multiplikation, Addition, Aktivierung …), deren Ableitungen bekannt sind, und wendet die Kettenregel mechanisch an. Das heißt **automatisches Differenzieren**.

- **Vorwärts:** Jeder Knoten wird aus seinen Eingängen berechnet. Die Zwischenwerte werden gespeichert.
- **Rückwärts:** Man startet am Verlust mit $\partial L/\partial L = 1$. Jeder Knoten gibt seinen Gradienten an seine Eingänge weiter, multipliziert mit der lokalen Ableitung. Hat ein Knoten mehrere Nachfolger, werden deren Beiträge addiert.

$$
\frac{\partial L}{\partial \text{Eingang}} = \frac{\partial L}{\partial \text{Ausgang}} \cdot \frac{\partial\,\text{Ausgang}}{\partial\,\text{Eingang}}
$$

Rückwärts heißt **Backpropagation** (Reverse Mode). Ihr Vorteil: Bei einer einzigen skalaren Ausgabe, dem Verlust, liefert ein Rückwärtsdurchlauf die Ableitungen nach *allen* Parametern auf einmal, und das für etwa den doppelten Aufwand eines Vorwärtsdurchlaufs. Die Gegenrichtung (Forward Mode) bräuchte einen Durchlauf pro Parameter. Der Preis ist Speicher: Alle Zwischenwerte des Vorwärtsdurchlaufs müssen bis zum Rückwärtsdurchlauf aufgehoben werden.

In Matrixform multipliziert Backpropagation die Jacobi-Matrizen aus Abschnitt 3 von hinten nach vorn, und zwar immer Vektor mal Matrix. Die riesigen Jacobi-Matrizen selbst werden nie aufgestellt.

::: widget va-04-backprop

## Hesse-Matrix {#hesse}

Die zweiten Ableitungen einer skalaren Funktion bilden die **Hesse-Matrix**. Sie beschreibt die Krümmung und ist symmetrisch:

$$
H = \nabla^2 f = \begin{pmatrix} \dfrac{\partial^2 f}{\partial x_1^2} & \cdots & \dfrac{\partial^2 f}{\partial x_1\,\partial x_n} \\[1ex] \vdots & \ddots & \vdots \\[1ex] \dfrac{\partial^2 f}{\partial x_n\,\partial x_1} & \cdots & \dfrac{\partial^2 f}{\partial x_n^2} \end{pmatrix}, \qquad f(\mathbf x + \mathbf d) \approx f(\mathbf x) + \nabla f^\top\mathbf d + \tfrac12\,\mathbf d^\top H\mathbf d
$$

Die rechte Formel ist die Taylor-Näherung zweiter Ordnung in mehreren Dimensionen. Ihre Form lesen die Eigenwerte von $H$ ab: In Richtung eines Eigenvektors ist die Krümmung gleich dem Eigenwert. An einem **kritischen Punkt** mit $\nabla f = \mathbf 0$ heißt das:

- alle Eigenwerte positiv: **Minimum**
- alle negativ: **Maximum**
- gemischte Vorzeichen: **Sattelpunkt**

Setzt man die Ableitung der quadratischen Näherung null, erhält man den **Newton-Schritt** $\mathbf d = -H^{-1}\nabla f$. Er springt direkt in den Mittelpunkt der Näherung und konvergiert in der Nähe eines Minimums sehr schnell. Für große Netze ist $H$ aber viel zu groß, um sie aufzustellen oder zu invertieren. Außerdem zieht Newton ebenso zu Sattelpunkten wie zu Minima.

::: widget va-05-hesse

## Gradientenabstieg {#gd group="Optimieren"}

Das einfachste Verfahren, ein Minimum zu finden: kleine Schritte in Richtung des steilsten Abstiegs.

$$
\mathbf x_{k+1} = \mathbf x_k - \eta\,\nabla f(\mathbf x_k)
$$

Die **Schrittweite** $\eta$ (im ML: Lernrate) entscheidet alles. Zu klein, und es dauert ewig. Zu groß, und das Verfahren springt über das Minimum hinweg und schaukelt sich auf. Für eine quadratische Funktion mit Hesse-Matrix $H$ lässt sich das genau angeben: stabil für $\eta < 2/\lambda_{\max}$, und die langsamste Richtung schrumpft pro Schritt nur um den Faktor $1 - \eta\lambda_{\min}$.

Das Verhältnis $\kappa = \lambda_{\max}/\lambda_{\min}$, die **Kondition** (vgl. [lineare Algebra](lineare-algebra.html#kondition)), bestimmt also, wie viele Schritte nötig sind, grob proportional zu $\kappa$. Bildlich: In einem langgezogenen Tal zeigt der Gradient fast quer zum Tal statt entlang, und der Pfad läuft im Zickzack. Gegenmittel sind gute Skalierung der Eingangsdaten (Normalisierung), Vorkonditionierung und die Verfahren aus dem nächsten Abschnitt.

::: widget va-06-gradientenabstieg

## Momentum, SGD und Adam {#optimierer}

Drei Erweiterungen, die beim Training neuronaler Netze Standard sind:

**Stochastischer Gradientenabstieg (SGD).** Der Verlust ist eine Summe über alle Trainingsbeispiele. Statt den vollen Gradienten zu berechnen, nimmt man ihn auf einem kleinen zufälligen Datenpaket (Mini-Batch). Der Gradient ist dann verrauscht, aber im Mittel richtig und viel billiger. Das Rauschen schadet weniger als gedacht und hilft sogar, flache Bereiche und Sattelpunkte zu verlassen.

**Momentum.** Man merkt sich eine laufende Summe der vergangenen Gradienten, eine Art Geschwindigkeit:

$$
\mathbf v_{k+1} = \beta\,\mathbf v_k + \nabla f(\mathbf x_k), \qquad \mathbf x_{k+1} = \mathbf x_k - \eta\,\mathbf v_{k+1}, \qquad \beta \approx 0{,}9
$$

Komponenten, die ihr Vorzeichen ständig wechseln (das Zickzack quer zum Tal), heben sich auf. Komponenten, die immer in dieselbe Richtung zeigen (entlang des Tals), summieren sich auf bis zum $1/(1-\beta)$-fachen.

**Adam.** Kombiniert Momentum mit einer Skalierung pro Koordinate. Neben dem gleitenden Mittel $\mathbf m$ der Gradienten führt es ein gleitendes Mittel $\mathbf s$ ihrer Quadrate und teilt dadurch:

$$
\mathbf x_{k+1} = \mathbf x_k - \eta\,\frac{\hat{\mathbf m}_k}{\sqrt{\hat{\mathbf s}_k} + \varepsilon}
$$

(elementweise, $\hat{\ }$ bezeichnet eine Korrektur für die ersten Schritte). Jede Koordinate macht so Schritte der Größenordnung $\eta$, egal wie steil oder flach sie ist. Das gleicht schlechte Kondition entlang der Achsen weitgehend aus. Adam ist der übliche Startpunkt, wenn man nicht weiß, was man nehmen soll. **AdamW** trennt zusätzlich den Weight Decay sauber davon ab.

::: widget va-07-optimierer

## Nebenbedingungen und Lagrange-Multiplikatoren {#lagrange toc="Lagrange-Multiplikatoren"}

Oft ist das Minimum nicht überall gesucht, sondern nur auf einer Menge, die eine Gleichung $g(\mathbf x) = 0$ festlegt. Etwa: kleinster Fehler bei fester Gesamtdosis, oder ein Vektor mit Länge 1.

Am gesuchten Punkt darf $f$ entlang der Nebenbedingung weder steigen noch fallen. Also darf $\nabla f$ keinen Anteil in Richtung der Nebenbedingung haben, er muss senkrecht auf ihr stehen, genau wie $\nabla g$. Die beiden Gradienten sind dort parallel:

$$
\nabla f(\mathbf x) + \lambda\,\nabla g(\mathbf x) = \mathbf 0, \qquad g(\mathbf x) = 0
$$

Die Zahl $\lambda$ heißt **Lagrange-Multiplikator**. Man kann beide Gleichungen bequem als Nullstelle des Gradienten einer einzigen Funktion schreiben, der **Lagrange-Funktion** $\mathcal L(\mathbf x, \lambda) = f(\mathbf x) + \lambda\,g(\mathbf x)$. Der Multiplikator hat auch eine Bedeutung: Er gibt an, wie stark sich der optimale Wert von $f$ ändert, wenn man die Nebenbedingung ein wenig lockert.

Ein bekanntes Ergebnis auf diesem Weg: Maximiert man $\mathbf x^\top C\mathbf x$ unter $\|\mathbf x\| = 1$, ergibt sich $C\mathbf x = \lambda\mathbf x$. Die beste Richtung ist ein Eigenvektor, und genau so begründet man die [Hauptkomponentenanalyse](lineare-algebra.html#svd).

Für Ungleichungen $g(\mathbf x) \le 0$ gibt es eine Erweiterung (Karush-Kuhn-Tucker-Bedingungen). In der Praxis behilft man sich oft einfacher: Strafterme zur Verlustfunktion addieren oder nach jedem Schritt zurück auf die erlaubte Menge projizieren, etwa negative Werte auf null setzen.

::: widget va-08-lagrange

## Konvexität {#konvex}

Eine Funktion ist **konvex**, wenn die Sehne zwischen zwei Punkten ihres Graphen nie unter dem Graphen liegt:

$$
f\big(\theta\mathbf x + (1 - \theta)\mathbf y\big) \le \theta f(\mathbf x) + (1 - \theta) f(\mathbf y) \qquad \text{für alle } \mathbf x, \mathbf y \text{ und } \theta \in [0, 1]
$$

Für glatte Funktionen ist das gleichbedeutend mit: Jede Tangente liegt unter dem Graphen, $f(\mathbf y) \ge f(\mathbf x) + \nabla f(\mathbf x)^\top(\mathbf y - \mathbf x)$. Oder: Die Hesse-Matrix ist überall positiv semidefinit, in einer Dimension $f'' \ge 0$.

::: widget va-09-konvex-sehne

Wichtig ist das wegen des Tangententests: Ist irgendwo $\nabla f = \mathbf 0$, dann liegt die ganze Funktion über diesem Wert. Bei einer konvexen Funktion ist also **jedes lokale Minimum auch das globale**, es gibt keine Sattelpunkte, und der Startpunkt bestimmt nur den Weg, nicht das Ergebnis. Bei nicht konvexen Funktionen hängt dagegen vom Start ab, in welcher Mulde man landet.

::: widget va-10-konvex-starts

Konvex sind zum Beispiel kleinste Quadrate (auch mit Ridge- oder L1-Term), logistische Regression und die Poisson-Likelihood der statistischen [CT-Rekonstruktion](../physik/rekonstruktion.html) bei linearem Messmodell. Summen konvexer Funktionen bleiben konvex, deshalb ändert ein konvexer Regularisierungsterm daran nichts. Neuronale Netze sind nicht konvex. Dass Gradientenverfahren dort trotzdem gut funktionieren, ist eher Erfahrung als Garantie.

## Formeln {#formeln appendix="A"}

| Thema | Formel |
|---|---|
| Taylor | $f(x_0 + h) \approx f(x_0) + f'(x_0)h + \tfrac12 f''(x_0)h^2$ |
| Kettenregel | $(f\circ g)' = f'(g)\,g'$, mehrdimensional $J_{f\circ g} = J_f\,J_g$ |
| Gradient | $f(\mathbf x + \mathbf h) \approx f(\mathbf x) + \nabla f^\top\mathbf h$, Richtungsableitung $\nabla f^\top\mathbf u$ |
| Jacobi | $J_{ij} = \partial f_i/\partial x_j \in \mathbb R^{m\times n}$, $\mathbf f(\mathbf x + \mathbf h) \approx \mathbf f(\mathbf x) + J\mathbf h$ |
| lineare Schicht | $\mathbf y = W\mathbf x$: $\partial L/\partial W = \bar{\mathbf y}\mathbf x^\top$, $\partial L/\partial\mathbf x = W^\top\bar{\mathbf y}$ |
| Hesse | $f(\mathbf x + \mathbf d) \approx f + \nabla f^\top\mathbf d + \tfrac12\mathbf d^\top H\mathbf d$ |
| Newton | $\mathbf x_{k+1} = \mathbf x_k - H^{-1}\nabla f(\mathbf x_k)$ |
| Gradientenabstieg | $\mathbf x_{k+1} = \mathbf x_k - \eta\nabla f$, stabil für $\eta < 2/\lambda_{\max}$ |
| Momentum | $\mathbf v \leftarrow \beta\mathbf v + \nabla f$, $\mathbf x \leftarrow \mathbf x - \eta\mathbf v$ |
| Adam | $\mathbf x \leftarrow \mathbf x - \eta\,\hat{\mathbf m}/(\sqrt{\hat{\mathbf s}} + \varepsilon)$ |
| Lagrange | $\nabla f + \lambda\nabla g = \mathbf 0$, $g(\mathbf x) = 0$ |
| Konvexität | $f(\theta\mathbf x + (1-\theta)\mathbf y) \le \theta f(\mathbf x) + (1-\theta)f(\mathbf y)$ ⇔ $f(\mathbf y) \ge f(\mathbf x) + \nabla f^\top(\mathbf y - \mathbf x)$ ⇔ $H \succeq 0$ |

## Befehle {#befehle appendix="B"}

```python
import torch
from scipy import optimize

# Automatisches Differenzieren
x = torch.tensor([1.0, 2.0], requires_grad=True)
f = (x ** 2).sum() + torch.sin(x[0])
f.backward()
x.grad                                          # ∇f an der Stelle x

torch.autograd.functional.jacobian(fn, x)       # Jacobi-Matrix
torch.autograd.functional.hessian(fn, x)        # Hesse-Matrix

# Optimierer beim Training
opt = torch.optim.Adam(model.parameters(), lr=1e-3)   # oder SGD(..., momentum=0.9), AdamW
loss.backward(); opt.step(); opt.zero_grad()

# Klassische Optimierung
optimize.minimize(fun, x0, jac=grad, method="L-BFGS-B")             # mit Gradient, Schranken möglich
optimize.minimize(fun, x0, constraints={"type": "eq", "fun": g})     # Nebenbedingung g(x) = 0
```
