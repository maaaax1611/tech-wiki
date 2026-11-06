---
title: Lineare Algebra
category: grundlagen
eyebrow: Grundlagen · Mathematik
tags: [Mathematik, Matrizen, Gleichungssysteme, Eigenwerte, SVD]
footer: Alle Abbildungen rechnen live im Browser mit kleinen Beispielen. Für echte Probleme nimmt man LAPACK-basierte Bibliotheken wie NumPy oder PyTorch.
---

Vektoren, Matrizen und Gleichungssysteme, bis zu Eigenwerten und Singulärwertzerlegung. Mit dem Blick, den man für Rekonstruktion, Bildverarbeitung und Machine Learning braucht: Eine Matrix ist eine Abbildung, und fast jedes Verfahren ist eine geschickte Zerlegung davon.

## Vektoren {#vektoren group="Grundbegriffe"}

Ein **Vektor** $\mathbf x \in \mathbb R^n$ ist eine Liste von $n$ Zahlen. Man kann ihn als Pfeil im Raum lesen, als Punkt oder einfach als Datensatz: ein Pixelbild mit 512 × 512 Pixeln ist ein Vektor mit 262 144 Einträgen, ein Embedding eines Netzes einer mit 768. Vektoren werden in diesem Text als Spalten geschrieben.

$$
\mathbf x = \begin{pmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{pmatrix}, \qquad \mathbf x + \mathbf y = \begin{pmatrix} x_1 + y_1 \\ \vdots \\ x_n + y_n \end{pmatrix}, \qquad \alpha\mathbf x = \begin{pmatrix} \alpha x_1 \\ \vdots \\ \alpha x_n \end{pmatrix}
$$

Addition und Skalierung sind die beiden Operationen, aus denen alles Weitere gebaut ist. Eine Summe $\alpha_1\mathbf v_1 + \dots + \alpha_k\mathbf v_k$ heißt **Linearkombination**.

> [!info] Vektorraum
> Ein **Vektorraum** ist eine Menge, in der man Elemente addieren und mit Zahlen multiplizieren kann und dabei immer wieder in der Menge landet. Deshalb sind nicht nur Zahlenlisten Vektoren, sondern auch Bilder, Signale oder Funktionen: Zwei Bilder kann man pixelweise addieren, und heraus kommt wieder ein Bild.
>
> Ein **Unterraum** ist ein Teil davon, aus dem Addieren und Skalieren nicht herausführen, zum Beispiel eine Ebene durch den Ursprung. Eine verschobene Ebene ist keiner, weil sie die Null nicht enthält (mehr dazu in Abschnitt 5).

### Skalarprodukt, Länge, Winkel

Das **Skalarprodukt** multipliziert zwei Vektoren eintragsweise und summiert. Es misst, wie stark zwei Vektoren in dieselbe Richtung zeigen:

$$
\mathbf x^\top\mathbf y = \sum_{i=1}^n x_i y_i = \|\mathbf x\|\,\|\mathbf y\|\cos\theta, \qquad \|\mathbf x\| = \sqrt{\mathbf x^\top\mathbf x}
$$

- Positiv: gleiche Richtung (spitzer Winkel). Null: **orthogonal**. Negativ: entgegengesetzt.
- Teilt man durch die Längen, bleibt $\cos\theta$, die **Kosinus-Ähnlichkeit**. Mit ihr vergleicht man z. B. Embeddings, unabhängig von ihrer Länge.
- Die **Projektion** von $\mathbf y$ auf die Richtung von $\mathbf x$ ist $\dfrac{\mathbf x^\top\mathbf y}{\mathbf x^\top\mathbf x}\,\mathbf x$. Der Rest $\mathbf y - \text{Projektion}$ steht senkrecht auf $\mathbf x$. Diese Zerlegung taucht in Abschnitt 7 und 10 wieder auf.

::: widget la-01-vektoren

### Normen

Die Länge $\|\mathbf x\|$ oben ist die euklidische oder **L2-Norm**. Je nach Anwendung misst man Größe auch anders:

| Norm | Formel | Typische Verwendung |
|---|---|---|
| L1 | $\Vert \mathbf x\Vert _1 = \sum_i \vert x_i\vert$ | robuste Fehlermaße, Sparsity-Regularisierung (Lasso) |
| L2 | $\Vert \mathbf x\Vert _2 = \sqrt{\sum_i x_i^2}$ | Abstand, kleinste Quadrate, Energie eines Signals |
| L∞ | $\Vert \mathbf x\Vert _\infty = \max_i \vert x_i\vert$ | größte Einzelabweichung, Toleranzen |

### Allgemeine Skalarprodukte

Das Standard-Skalarprodukt $\mathbf x^\top\mathbf y$ ist nur eine Möglichkeit. Allgemein ist ein **Skalarprodukt** $\langle\mathbf x, \mathbf y\rangle$ jede Abbildung, die linear in jedem Argument, symmetrisch und positiv definit ist ($\langle\mathbf x, \mathbf x\rangle > 0$ für $\mathbf x \neq \mathbf 0$). Im $\mathbb R^n$ sind das genau die Ausdrücke

$$
\langle\mathbf x, \mathbf y\rangle_M = \mathbf x^\top M\mathbf y, \qquad M \text{ symmetrisch positiv definit}
$$

Jedes Skalarprodukt bringt seine eigene Länge $\|\mathbf x\| = \sqrt{\langle\mathbf x, \mathbf x\rangle}$ und seinen eigenen Begriff von „senkrecht“ mit. Ein Beispiel ist die Mahalanobis-Distanz $\sqrt{(\mathbf x - \boldsymbol\mu)^\top C^{-1}(\mathbf x - \boldsymbol\mu)}$, die Abstände relativ zur Streuung einer Verteilung misst (Kovarianz $C$). Ein anderes ist das gewichtete Residuum, wenn Messwerte unterschiedlich genau sind.

### Funktionen als Vektoren

Lässt man den Index $i$ kontinuierlich werden, wird aus der Summe ein Integral. Das ist das Skalarprodukt zweier Funktionen auf einem Intervall:

$$
\langle f, g\rangle = \int_a^b f(x)\,g(x)\,\mathrm dx
$$

Damit gibt es auch für Funktionen Längen, Winkel und Orthogonalität. Zum Beispiel sind $\sin(kx)$ und $\cos(lx)$ auf $[-\pi, \pi]$ für alle ganzen $k, l$ paarweise orthogonal. Die Fourier-Reihe ist dann nichts anderes als die Koordinatendarstellung einer Funktion in dieser Orthogonalbasis (Abschnitt 10), und die Fourier-Koeffizienten sind Projektionen.

> [!abstract] Merke
> - $\mathbf x^\top\mathbf y = \|\mathbf x\|\|\mathbf y\|\cos\theta$. Null heißt orthogonal.
> - Projektion auf $\mathbf x$: $\frac{\mathbf x^\top\mathbf y}{\mathbf x^\top\mathbf x}\mathbf x$, der Rest steht senkrecht.
> - Skalarprodukte allgemein: $\mathbf x^\top M\mathbf y$ mit SPD-Matrix $M$, für Funktionen $\int fg$.

## Matrizen als Abbildungen {#matrizen}

Eine $m\times n$-Matrix $A$ ist eine Tabelle mit $m$ Zeilen und $n$ Spalten. Wichtiger als die Tabelle ist, was sie *tut*: Sie bildet einen Vektor $\mathbf x \in \mathbb R^n$ auf einen Vektor $A\mathbf x \in \mathbb R^m$ ab, und zwar **linear**:

$$
A(\alpha\mathbf x + \beta\mathbf y) = \alpha A\mathbf x + \beta A\mathbf y
$$

Gitterlinien bleiben dabei Geraden und parallel, der Ursprung bleibt fest. Umgekehrt lässt sich jede lineare Abbildung als Matrix schreiben.

### Die Spalten sind die Bilder der Basisvektoren

Der wichtigste Satz zum Lesen einer Matrix: Die erste Spalte ist das, worauf $\mathbf e_1 = (1, 0, \dots)^\top$ abgebildet wird, die zweite Spalte das Bild von $\mathbf e_2$, und so weiter. Weil jeder Vektor eine Linearkombination der $\mathbf e_i$ ist, ist $A\mathbf x$ dieselbe Linearkombination der Spalten:

$$
A\mathbf x = \begin{pmatrix} | & | & \\ \mathbf a_1 & \mathbf a_2 & \cdots \\ | & | & \end{pmatrix}\begin{pmatrix} x_1 \\ x_2 \\ \vdots\end{pmatrix} = x_1\mathbf a_1 + x_2\mathbf a_2 + \dots
$$

Die zweite Lesart, die man zum Rechnen braucht: Eintrag $i$ von $A\mathbf x$ ist das Skalarprodukt der Zeile $i$ mit $\mathbf x$. Beide Lesarten liefern dasselbe, die Spaltensicht ist die geometrische, die Zeilensicht die rechnerische.

::: widget la-02-matrix-als-abbildung

### Rechenregeln

- **Matrixprodukt** $AB$ ist die Hintereinanderausführung: erst $B$, dann $A$. Es gilt $(AB)\mathbf x = A(B\mathbf x)$. Dafür muss die Spaltenzahl von $A$ gleich der Zeilenzahl von $B$ sein. Eintrag $(i,j)$ ist Zeile $i$ von $A$ mal Spalte $j$ von $B$.
- Die Reihenfolge zählt: im Allgemeinen ist $AB \neq BA$. Erst drehen, dann scheren ergibt etwas anderes als umgekehrt.
- **Transponierte** $A^\top$: Zeilen und Spalten vertauscht. $(AB)^\top = B^\top A^\top$. Ist $A = A^\top$, heißt $A$ **symmetrisch**.
- **Inverse** $A^{-1}$: macht die Abbildung rückgängig, $A^{-1}A = I$. Sie existiert nur für quadratische Matrizen, die nichts „plattdrücken“ (Abschnitt 4). $(AB)^{-1} = B^{-1}A^{-1}$. Für 2×2:

$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}
$$

> [!abstract] Merke
> - Spalte $j$ von $A$ ist $A\mathbf e_j$. $A\mathbf x$ ist die Linearkombination der Spalten mit den Gewichten $x_j$.
> - $AB$ = erst $B$, dann $A$. Nicht kommutativ. $(AB)^\top = B^\top A^\top$, $(AB)^{-1} = B^{-1}A^{-1}$.

## Lineare Unabhängigkeit, Basis und Rang {#basis toc="Basis, Rang, Basiswechsel"}

Vektoren $\mathbf v_1, \dots, \mathbf v_k$ sind **linear unabhängig**, wenn keiner sich als Linearkombination der anderen schreiben lässt. Gleichwertig: Die einzige Lösung von $\alpha_1\mathbf v_1 + \dots + \alpha_k\mathbf v_k = \mathbf 0$ ist $\alpha_1 = \dots = \alpha_k = 0$. Jeder abhängige Vektor ist überflüssig, er fügt keine neue Richtung hinzu.

- Der **Span** einer Menge von Vektoren ist alles, was man aus ihnen kombinieren kann. Zwei unabhängige Vektoren im $\mathbb R^3$ spannen eine Ebene auf, drei unabhängige den ganzen Raum.
- Eine **Basis** ist eine minimale Menge, die den ganzen Raum aufspannt: unabhängig und vollständig. Jeder Vektor hat in ihr genau eine Darstellung, seine **Koordinaten**. Die Anzahl der Basisvektoren ist die **Dimension**.
- Basen sind nicht eindeutig. Die Standardbasis $\mathbf e_1, \dots, \mathbf e_n$ ist nur eine Wahl. Eigenvektoren (Abschnitt 9), Fourier-Moden oder Hauptkomponenten (Abschnitt 11) sind andere, oft besser zum Problem passende.

### Die vier Unterräume einer Matrix

Zu jeder $m\times n$-Matrix gehören vier Räume. Zwei davon braucht man ständig:

| Raum | Definition | Bedeutung |
|---|---|---|
| Spaltenraum (Bild) | $\{A\mathbf x\}$, Span der Spalten, in $\mathbb R^m$ | alle $\mathbf b$, für die $A\mathbf x = \mathbf b$ lösbar ist |
| Nullraum (Kern) | $\{\mathbf x : A\mathbf x = \mathbf 0\}$, in $\mathbb R^n$ | Richtungen, die $A$ „nicht sieht“; Mehrdeutigkeit der Lösung |
| Zeilenraum | Span der Zeilen, in $\mathbb R^n$ | steht senkrecht auf dem Nullraum |
| Linker Nullraum | $\{\mathbf y : A^\top\mathbf y = \mathbf 0\}$, in $\mathbb R^m$ | steht senkrecht auf dem Spaltenraum; hier liegt das Residuum bei kleinsten Quadraten |

Der **Rang** $r = \operatorname{rang}(A)$ ist die Dimension des Spaltenraums. Er ist gleich der Anzahl unabhängiger Spalten und, nicht offensichtlich, auch gleich der Anzahl unabhängiger Zeilen. Die **Dimensionsformel** verbindet Rang und Nullraum:

$$
\operatorname{rang}(A) + \dim\ker(A) = n
$$

Jede Spalte, die keine neue Richtung bringt, erzeugt eine Dimension im Nullraum. Eine Matrix mit $r = \min(m, n)$ hat **vollen Rang**. In der Praxis ist eine Matrix selten exakt rangdefizient, aber oft *fast*. Wie man das misst, zeigen Kondition (Abschnitt 6) und Singulärwerte (Abschnitt 11).

> [!abstract] Merke
> - Rang = Anzahl unabhängiger Spalten = Anzahl unabhängiger Zeilen = $\dim$ Spaltenraum.
> - $A\mathbf x = \mathbf b$ ist lösbar genau dann, wenn $\mathbf b$ im Spaltenraum liegt. Eindeutig genau dann, wenn der Nullraum nur $\mathbf 0$ enthält.

### Basiswechsel

Derselbe Vektor hat in verschiedenen Basen verschiedene Koordinaten. Schreibt man die neuen Basisvektoren $\mathbf b_1, \dots, \mathbf b_n$ (in Standardkoordinaten) als Spalten in eine Matrix $B$, dann gilt für die neuen Koordinaten $\mathbf c$ eines Vektors $\mathbf x$:

$$
\mathbf x = B\mathbf c \qquad\Longleftrightarrow\qquad \mathbf c = B^{-1}\mathbf x
$$

$B$ übersetzt also von den neuen in die alten Koordinaten, $B^{-1}$ zurück. Bei einer Orthonormalbasis ist $B^{-1} = B^\top$, und die neuen Koordinaten sind einfach Skalarprodukte $c_i = \mathbf b_i^\top\mathbf x$.

::: widget la-03-basiswechsel

Auch eine lineare Abbildung sieht in einer anderen Basis anders aus. Wirkt $A$ in Standardkoordinaten, dann wirkt sie in der neuen Basis als

$$
\tilde A = B^{-1}AB
$$

Lesen von rechts: neue Koordinaten in alte übersetzen, $A$ anwenden, zurückübersetzen. Matrizen, die so zusammenhängen, heißen **ähnlich**. Sie beschreiben dieselbe Abbildung und haben deshalb dieselbe Determinante, Spur und dieselben Eigenwerte. Für Abbildungen zwischen verschiedenen Räumen ($\mathbb R^n \to \mathbb R^m$) wechselt man in beiden Räumen getrennt die Basis, $\tilde A = T^{-1}AS$. Der Kern von Abschnitt 9 und 11 ist genau diese Frage: Gibt es eine Basis, in der $\tilde A$ diagonal ist? Bei der Eigenzerlegung ist $B = V$, bei der SVD sind $S = V$ und $T = U$.

## Determinante {#determinante}

Die **Determinante** einer quadratischen Matrix ist der Faktor, um den die Abbildung Flächen (in 2D) oder Volumina (in 3D und höher) ändert. Das Einheitsquadrat wird auf das Parallelogramm aus den beiden Spalten abgebildet, und dessen vorzeichenbehaftete Fläche ist $\det A$:

$$
\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc
$$

- **Vorzeichen:** Negativ heißt, die Abbildung spiegelt, die Orientierung kehrt sich um (im Uhrzeigersinn wird gegen den Uhrzeigersinn).
- **Null:** Der Raum wird auf eine niedrigere Dimension plattgedrückt, die Spalten sind abhängig. Dann gibt es keine Inverse, denn verlorene Information lässt sich nicht zurückholen.
- **Produkt:** $\det(AB) = \det A\,\det B$, Flächenfaktoren multiplizieren sich. Daraus folgt $\det A^{-1} = 1/\det A$.
- $\det A$ ist das Produkt der Eigenwerte (Abschnitt 9), $\det A^\top = \det A$.

::: widget la-04-determinante

Für größere Matrizen berechnet man die Determinante nie über die Formel mit $n!$ Summanden, sondern über die LU-Zerlegung (Abschnitt 5): $\det A$ ist dann das Produkt der Diagonalelemente von $U$, mal $\pm 1$ für Zeilenvertauschungen. Als Maß dafür, ob eine Matrix „fast singulär“ ist, taugt die Determinante übrigens nicht: $\det(0{,}1\cdot I_{10}) = 10^{-10}$, obwohl diese Matrix perfekt gutartig ist. Dafür gibt es die Konditionszahl.

### Spur

Die **Spur** einer quadratischen Matrix ist die Summe ihrer Diagonalelemente, $\operatorname{tr}A = \sum_i a_{ii}$. Sie ist linear und hat drei Eigenschaften, die in Herleitungen ständig gebraucht werden:

$$
\operatorname{tr}(AB) = \operatorname{tr}(BA), \qquad \operatorname{tr}A = \sum_i\lambda_i, \qquad \|A\|_F^2 = \sum_{i,j}a_{ij}^2 = \operatorname{tr}(A^\top A)
$$

Die erste Regel heißt Zyklizität: Produkte darf man in der Spur zyklisch verschieben, $\operatorname{tr}(ABC) = \operatorname{tr}(CAB)$, aber nicht beliebig vertauschen. Ein Skalar ist seine eigene Spur, deshalb gilt der Trick $\mathbf x^\top A\mathbf x = \operatorname{tr}(\mathbf x^\top A\mathbf x) = \operatorname{tr}(A\mathbf x\mathbf x^\top)$. So bekommt man z. B. den Erwartungswert einer quadratischen Form, $\mathbb E[\mathbf x^\top A\mathbf x] = \operatorname{tr}(A C) + \boldsymbol\mu^\top A\boldsymbol\mu$. Weil die Spur die Summe der Eigenwerte ist, ändert sie sich bei einem Basiswechsel nicht. Für $\operatorname{tr}A$ gilt dasselbe wie für $\det A$: Beide sind Invarianten der Abbildung, nicht der Matrixdarstellung.

> [!abstract] Merke
> - $\det A$ = vorzeichenbehafteter Volumenfaktor. $\det A = 0$ ⇔ Spalten abhängig ⇔ nicht invertierbar.
> - $\det(AB) = \det A\det B$. Kleine Determinante heißt nicht schlecht konditioniert.
> - $\operatorname{tr}A = \sum\lambda_i$, $\operatorname{tr}(AB) = \operatorname{tr}(BA)$, $\|A\|_F^2 = \operatorname{tr}(A^\top A)$.

## Lineare Gleichungssysteme lösen {#lgs group="Gleichungssysteme" toc="Ax = b lösen"}

Ein lineares Gleichungssystem mit $m$ Gleichungen und $n$ Unbekannten schreibt man kompakt als $A\mathbf x = \mathbf b$. Die Zeilensicht: Jede Gleichung ist eine Gerade (2D), Ebene (3D) oder Hyperebene, und die Lösung ist ihr gemeinsamer Schnitt. Die Spaltensicht: Gesucht sind die Gewichte, mit denen die Spalten von $A$ zusammen $\mathbf b$ ergeben.

| Fall | Bedingung | Geometrisch (2D) |
|---|---|---|
| genau eine Lösung | $A$ quadratisch, $\det A \neq 0$ | zwei Geraden schneiden sich in einem Punkt |
| keine Lösung | $\mathbf b$ nicht im Spaltenraum | parallele Geraden; bei mehr Gleichungen als Unbekannten der Normalfall |
| unendlich viele | $\mathbf b$ im Spaltenraum, Nullraum nicht trivial | beide Gleichungen beschreiben dieselbe Gerade |

### Struktur der Lösungsmenge

Ist das System lösbar, aber nicht eindeutig, dann haben alle Lösungen dieselbe Form: eine beliebige **spezielle Lösung** $\mathbf x_p$ plus irgendein Element des Nullraums.

$$
\{\mathbf x : A\mathbf x = \mathbf b\} = \mathbf x_p + \ker A = \{\mathbf x_p + \mathbf z : A\mathbf z = \mathbf 0\}
$$

Der Grund ist die Linearität: Sind $\mathbf x_1$ und $\mathbf x_2$ Lösungen, dann ist $A(\mathbf x_1 - \mathbf x_2) = \mathbf b - \mathbf b = \mathbf 0$, ihre Differenz liegt also im Nullraum. Beispiel: $x_1 + x_2 = 2$ hat die spezielle Lösung $(1, 1)$ und den Nullraum $\{t(1, -1)\}$, die Lösungsmenge ist die Gerade $(1, 1) + t(1, -1)$.

Eine solche verschobene Kopie eines Unterraums heißt **affiner Unterraum**. Er ist selbst kein Unterraum, weil er die Null nicht enthält (außer bei $\mathbf b = \mathbf 0$). Affine Unterräume sind die natürlichen Objekte der Geometrie: Geraden und Ebenen, die nicht durch den Ursprung gehen, Hyperebenen $\{\mathbf x : \mathbf w^\top\mathbf x = c\}$ als Entscheidungsgrenzen eines linearen Klassifikators. Eine **affine Abbildung** $\mathbf x \mapsto A\mathbf x + \mathbf t$ ist eine lineare Abbildung mit anschließender Verschiebung, genau das, was eine Schicht eines neuronalen Netzes vor der Aktivierungsfunktion tut.

### Gauß-Elimination und LU-Zerlegung

Das Standardverfahren für quadratische Systeme: Man zieht Vielfache einer Zeile von den darunterliegenden ab, bis unter der Diagonale nur Nullen stehen. Das obere Dreieckssystem löst man dann von unten nach oben (Rückwärtseinsetzen).

$$
\left(\begin{array}{ccc|c} 2 & 1 & 1 & 5 \\ 4 & 3 & 3 & 13 \\ 2 & 3 & 4 & 13 \end{array}\right) \;\to\; \left(\begin{array}{ccc|c} 2 & 1 & 1 & 5 \\ 0 & 1 & 1 & 3 \\ 0 & 2 & 3 & 8 \end{array}\right) \;\to\; \left(\begin{array}{ccc|c} 2 & 1 & 1 & 5 \\ 0 & 1 & 1 & 3 \\ 0 & 0 & 1 & 2 \end{array}\right)
$$

Rückwärts: $x_3 = 2$, $x_2 = 3 - 2 = 1$, $x_1 = (5 - 1 - 2)/2 = 1$.

Merkt man sich die Faktoren der Eliminationsschritte in einer unteren Dreiecksmatrix $L$, erhält man die **LU-Zerlegung** $A = LU$ (mit Zeilenvertauschungen $PA = LU$). Der Vorteil: Die teure Zerlegung kostet etwa $\tfrac23 n^3$ Operationen und wird einmal gemacht. Danach kostet jede neue rechte Seite $\mathbf b$ nur noch $\sim n^2$ (Vorwärts- und Rückwärtseinsetzen).

Für symmetrisch positiv definite Matrizen gibt es die **Cholesky-Zerlegung** $A = LL^\top$ mit einer unteren Dreiecksmatrix $L$ mit positiver Diagonale. Sie braucht nur halb so viele Operationen wie LU, kommt ohne Pivotisierung aus und ist der schnellste Test, ob eine Matrix positiv definit ist: Die Zerlegung bricht genau dann ab, wenn sie es nicht ist. Für 2×2 sieht man die Konstruktion direkt:

$$
\begin{pmatrix} a & b \\ b & c \end{pmatrix} = \begin{pmatrix} \ell_{11} & 0 \\ \ell_{21} & \ell_{22} \end{pmatrix}\begin{pmatrix} \ell_{11} & \ell_{21} \\ 0 & \ell_{22} \end{pmatrix}, \qquad \ell_{11} = \sqrt a, \quad \ell_{21} = \frac{b}{\ell_{11}}, \quad \ell_{22} = \sqrt{c - \ell_{21}^2}
$$

Cholesky ist das Standardwerkzeug für Normalengleichungen, Kovarianzmatrizen und Gauß-Prozesse. Will man Stichproben aus einer Normalverteilung mit Kovarianz $C$ ziehen, nimmt man $\mathbf x = \boldsymbol\mu + L\mathbf z$ mit $C = LL^\top$ und standardnormalverteiltem $\mathbf z$, denn dann ist $\operatorname{Cov}(\mathbf x) = L\,I\,L^\top = C$.

Die Inverse berechnet man dafür praktisch nie: $\mathbf x = A^{-1}\mathbf b$ ist eine Schreibweise, gerechnet wird mit einer Zerlegung. In NumPy heißt das `np.linalg.solve(A, b)` statt `np.linalg.inv(A) @ b`, das ist schneller und genauer.

> [!abstract] Merke
> - Lösungsmenge = spezielle Lösung + Nullraum, ein affiner Unterraum.
> - Lösen = Zerlegen + Einsetzen. LU kostet $O(n^3)$ einmal, jede rechte Seite dann $O(n^2)$. SPD: Cholesky.
> - Nie explizit invertieren, wenn man nur $A\mathbf x = \mathbf b$ lösen will.

## Kondition: Wie empfindlich ist die Lösung? {#kondition toc="Kondition"}

In der Praxis ist $\mathbf b$ gemessen und damit verrauscht. Die Frage ist, wie stark sich ein kleiner Fehler in $\mathbf b$ auf $\mathbf x$ auswirkt. Die Antwort gibt die **Konditionszahl**:

$$
\frac{\|\delta\mathbf x\|}{\|\mathbf x\|} \;\le\; \kappa(A)\,\frac{\|\delta\mathbf b\|}{\|\mathbf b\|}, \qquad \kappa(A) = \|A\|\,\|A^{-1}\| = \frac{\sigma_{\max}}{\sigma_{\min}}
$$

$\sigma_{\max}$ und $\sigma_{\min}$ sind der größte und kleinste Singulärwert (Abschnitt 11): die stärkste und schwächste Streckung, die $A$ auf irgendeinen Vektor anwendet. Ist $\kappa = 10^6$, kann ein relativer Messfehler von $10^{-4}$ die Lösung um bis zu 100 % verfälschen. Als Faustregel verliert man etwa $\log_{10}\kappa$ gültige Stellen.

::: widget la-05-gleichungssystem-und-kondition

Schlechte Kondition ist kein Rechenfehler, sondern eine Eigenschaft des Problems. Bessere Algorithmen helfen nur gegen Rundungsfehler, nicht gegen fehlende Information. Gegenmittel sind bessere Messungen (eine steilere zweite Gerade) oder **Regularisierung**, die Vorwissen über die Lösung einbringt (Abschnitt 7). Typische schlecht konditionierte Probleme sind Entfaltung (Deblurring), Rekonstruktion aus wenigen Projektionen und Polynomfits hohen Grades.

> [!abstract] Merke
> - $\kappa(A) = \sigma_{\max}/\sigma_{\min}$ verstärkt relative Fehler. $\kappa \approx 1$: gutartig. $\kappa \gg 1$: fast singulär.
> - Gegen schlechte Kondition hilft Information (Messung, Vorwissen), nicht Rechengenauigkeit.

## Überbestimmte Systeme: kleinste Quadrate {#kq toc="Kleinste Quadrate"}

Hat man mehr Gleichungen als Unbekannte, $m > n$, gibt es wegen Messrauschen fast nie eine exakte Lösung: $\mathbf b$ liegt nicht im Spaltenraum. Man sucht dann das $\mathbf x$, dessen **Residuum** $\mathbf r = \mathbf b - A\mathbf x$ möglichst klein ist:

$$
\hat{\mathbf x} = \arg\min_{\mathbf x}\,\|A\mathbf x - \mathbf b\|_2^2
$$

Geometrisch ist $A\hat{\mathbf x}$ die **Projektion** von $\mathbf b$ auf den Spaltenraum. Das Residuum steht dann senkrecht auf allen Spalten, also $A^\top(\mathbf b - A\hat{\mathbf x}) = \mathbf 0$. Umgestellt ergibt das die **Normalengleichung**:

$$
A^\top A\,\hat{\mathbf x} = A^\top\mathbf b \qquad\Longrightarrow\qquad \hat{\mathbf x} = (A^\top A)^{-1}A^\top\mathbf b
$$

Dasselbe Ergebnis bekommt man, wenn man den Gradienten von $\|A\mathbf x - \mathbf b\|^2$ null setzt (Anhang A). $(A^\top A)^{-1}A^\top$ heißt **Pseudoinverse** $A^+$ (für Spalten mit vollem Rang). Numerisch löst man nicht über $A^\top A$, weil dabei die Kondition quadriert wird, $\kappa(A^\top A) = \kappa(A)^2$, sondern über QR (Abschnitt 10) oder SVD.

### Beispiel: Kurvenanpassung

Ein Polynom $y = c_0 + c_1 x + \dots + c_d x^d$ durch $m$ Messpunkte ist ein lineares Problem in den Koeffizienten, auch wenn die Kurve gekrümmt ist. Jede Zeile von $A$ ist $(1, x_i, x_i^2, \dots, x_i^d)$, $\mathbf b$ enthält die $y_i$. Linear heißt hier: linear in den Unbekannten.

::: widget la-06-kleinste-quadrate

### Regularisierung

Ist $A^\top A$ schlecht konditioniert, addiert man einen Strafterm, der große Lösungen bestraft. Das ist die **Tikhonov-Regularisierung**, in der Statistik **Ridge-Regression**, im Deep Learning Weight Decay:

$$
\hat{\mathbf x}_\lambda = \arg\min_{\mathbf x}\,\|A\mathbf x - \mathbf b\|^2 + \lambda\|\mathbf x\|^2 = (A^\top A + \lambda I)^{-1}A^\top\mathbf b
$$

Das $\lambda I$ hebt alle Eigenwerte von $A^\top A$ um $\lambda$ an, die Kondition verbessert sich drastisch. Der Preis ist ein kleiner systematischer Fehler (Bias). Welches λ richtig ist, entscheidet man über Validierung oder das Rauschniveau.

> [!abstract] Merke
> - Kleinste Quadrate = Projektion von $\mathbf b$ auf den Spaltenraum. Normalengleichung $A^\top A\hat{\mathbf x} = A^\top\mathbf b$.
> - Numerisch über QR oder SVD lösen, nicht über $A^\top A$. Ridge: $+\lambda I$ stabilisiert.

## Iterative Verfahren {#iterativ}

LU und QR brauchen $O(n^3)$ Operationen und die ganze Matrix im Speicher. Für eine CT-Rekonstruktion mit $512^2$ Unbekannten und Millionen Messungen ist das unmöglich, die Systemmatrix ist aber **dünn besetzt** (jeder Strahl trifft nur wenige Pixel). Iterative Verfahren brauchen nur Matrix-Vektor-Produkte $A\mathbf x$ und $A^\top\mathbf y$ und nähern sich der Lösung schrittweise.

- **Jacobi und Gauß-Seidel:** Gleichung $i$ wird nach $x_i$ aufgelöst, mit den aktuellen Werten der anderen Unbekannten. Gauß-Seidel verwendet neue Werte sofort. Konvergiert sicher für diagonaldominante Matrizen.
- **Kaczmarz / ART:** Der Schätzwert wird reihum auf die Hyperebene jeder einzelnen Gleichung projiziert. Das ist die klassische algebraische CT-Rekonstruktion, interaktiv auf der Seite [„Vom Sinogramm zum Schnittbild“](../physik/rekonstruktion.html#iterativ).
- **Gradientenabstieg** auf $f(\mathbf x) = \tfrac12\|A\mathbf x - \mathbf b\|^2$: Der Gradient ist $A^\top(A\mathbf x - \mathbf b)$, also geht man schrittweise bergab.
- **Konjugierte Gradienten (CG):** für symmetrisch positiv definite Systeme. Wählt die Suchrichtungen so, dass keine frühere Richtung „verdorben“ wird, und ist in exakter Arithmetik nach höchstens $n$ Schritten fertig. Der Standard für große, dünne Systeme.

$$
\mathbf x_{k+1} = \mathbf x_k - \eta\,A^\top(A\mathbf x_k - \mathbf b), \qquad \text{konvergent für } 0 < \eta < \frac{2}{\sigma_{\max}^2}
$$

::: widget la-07-gradientenabstieg

> [!abstract] Merke
> - Iterative Verfahren brauchen nur $A\mathbf x$ und $A^\top\mathbf y$: ideal für große, dünn besetzte Systeme.
> - Die Konvergenzgeschwindigkeit hängt an der Kondition. Vorkonditionierung formt das Problem so um, dass κ kleiner wird.

## Eigenwerte und Eigenvektoren {#eigen group="Zerlegungen" toc="Eigenwerte"}

Die meisten Vektoren werden von einer Matrix gedreht und gestreckt. Einige wenige Richtungen werden nur gestreckt, ihre Richtung bleibt erhalten. Das sind die **Eigenvektoren**, und der Streckfaktor ist der **Eigenwert** λ:

$$
A\mathbf v = \lambda\mathbf v, \qquad \mathbf v \neq \mathbf 0
$$

Die Eigenwerte sind die Nullstellen des charakteristischen Polynoms $\det(A - \lambda I) = 0$. Für 2×2-Matrizen mit Spur $\operatorname{tr}A = a + d$:

$$
\lambda_{1,2} = \frac{\operatorname{tr}A}{2} \pm \sqrt{\left(\frac{\operatorname{tr}A}{2}\right)^2 - \det A}, \qquad \lambda_1 + \lambda_2 = \operatorname{tr}A, \quad \lambda_1\lambda_2 = \det A
$$

Eine reine Drehung hat keine reellen Eigenvektoren, keine Richtung bleibt erhalten, die Eigenwerte sind komplex. Eine Scherung hat nur einen, eine Spiegelung zwei mit λ = +1 und −1.

::: widget la-08-eigenvektoren

### Vielfachheiten

Ein Eigenwert kann mehrfach auftreten. Seine **algebraische Vielfachheit** ist, wie oft er Nullstelle des charakteristischen Polynoms ist. Seine **geometrische Vielfachheit** ist die Dimension des zugehörigen Eigenraums $\ker(A - \lambda I)$, also wie viele unabhängige Eigenvektoren es dazu gibt. Es gilt immer: geometrisch ≤ algebraisch.

- $I$ hat den Eigenwert 1 doppelt, und jeder Vektor ist Eigenvektor: geometrisch = algebraisch = 2.
- Die Scherung $\begin{pmatrix} 1 & 1 \\ 0 & 1\end{pmatrix}$ hat ebenfalls den Eigenwert 1 doppelt, aber nur eine Eigenrichtung $(1, 0)$: geometrisch 1 < algebraisch 2. Probier es in Abbildung 8 aus.

Matrizen, bei denen für irgendeinen Eigenwert die geometrische Vielfachheit kleiner ist, heißen **defekt**. Ihnen fehlen Eigenvektoren für eine vollständige Basis, sie sind nicht diagonalisierbar. Für sie gibt es die Jordan-Normalform, die numerisch aber kaum eine Rolle spielt. Sind alle $n$ Eigenwerte verschieden, ist die Matrix immer diagonalisierbar.

### Diagonalisierung

Hat eine $n\times n$-Matrix $n$ unabhängige Eigenvektoren, schreibt man sie in die Spalten von $V$ und die Eigenwerte auf die Diagonale von $\Lambda$:

$$
A = V\Lambda V^{-1} \qquad\Longrightarrow\qquad A^k = V\Lambda^k V^{-1}
$$

In der Eigenbasis wirkt $A$ wie eine reine Streckung entlang der Achsen. Potenzen, Matrixexponential und Stabilitätsanalyse werden dadurch einfach: $A^k\mathbf x$ wird für große $k$ vom betragsgrößten Eigenwert dominiert. Das nutzt die **Potenzmethode**, die einfachste Art, den größten Eigenwert zu finden (und die Idee hinter PageRank).

### Symmetrische Matrizen

Für symmetrische Matrizen $A = A^\top$ gilt der **Spektralsatz**: Alle Eigenwerte sind reell, und es gibt eine Orthonormalbasis aus Eigenvektoren. Dann ist $V$ orthogonal, $V^{-1} = V^\top$:

$$
A = Q\Lambda Q^\top = \sum_{i=1}^n \lambda_i\,\mathbf q_i\mathbf q_i^\top
$$

Kovarianzmatrizen, $A^\top A$, Hesse-Matrizen und Graph-Laplace-Matrizen sind alle symmetrisch. Sind zusätzlich alle $\lambda_i > 0$, heißt $A$ **positiv definit**: $\mathbf x^\top A\mathbf x > 0$ für alle $\mathbf x \neq \mathbf 0$. Die Höhenlinien von $\mathbf x^\top A\mathbf x$ sind dann Ellipsen mit Halbachsen entlang der Eigenvektoren, genau die Ellipsen aus Abbildung 7. $A^\top A$ ist immer positiv semidefinit.

> [!abstract] Merke
> - Diagonalisierbar ⇔ $n$ unabhängige Eigenvektoren ⇔ für jeden Eigenwert geometrische = algebraische Vielfachheit.
> - $A\mathbf v = \lambda\mathbf v$: Richtung bleibt, Länge ändert sich um λ. $\sum\lambda_i = \operatorname{tr}A$, $\prod\lambda_i = \det A$.
> - Symmetrisch ⇒ reelle Eigenwerte, orthogonale Eigenvektoren, $A = Q\Lambda Q^\top$.

## Orthogonalität, Projektionen und QR {#orthogonal toc="Orthogonalität, QR"}

Vektoren $\mathbf q_1, \dots, \mathbf q_k$ sind **orthonormal**, wenn sie paarweise senkrecht stehen und Länge 1 haben: $\mathbf q_i^\top\mathbf q_j = 0$ für $i \neq j$, $\mathbf q_i^\top\mathbf q_i = 1$. In einer Orthonormalbasis sind Koordinaten einfach Skalarprodukte, es gibt kein Gleichungssystem zu lösen: $\mathbf x = \sum_i (\mathbf q_i^\top\mathbf x)\,\mathbf q_i$. Die Fourier-Zerlegung ist genau das, mit Sinus- und Kosinusfunktionen als Basis.

Eine quadratische Matrix $Q$ mit orthonormalen Spalten heißt **orthogonal**. Sie ist eine Drehung oder Spiegelung und erhält Längen und Winkel:

$$
Q^\top Q = I, \qquad Q^{-1} = Q^\top, \qquad \|Q\mathbf x\| = \|\mathbf x\|, \qquad \kappa(Q) = 1, \qquad \det Q = \pm 1
$$

Weil sie perfekt konditioniert sind, verstärken orthogonale Matrizen keine Fehler. Deshalb bauen stabile Algorithmen auf ihnen auf.

### Drehungen

Orthogonale Matrizen mit $\det Q = +1$ sind **Drehungen**, mit $\det Q = -1$ enthalten sie eine Spiegelung. In 2D dreht

$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}, \qquad R(\alpha)R(\beta) = R(\alpha + \beta), \qquad R(\theta)^{-1} = R(-\theta) = R(\theta)^\top
$$

gegen den Uhrzeigersinn um $\theta$. Die Spalten sind die gedrehten Basisvektoren, wie in Abschnitt 2. In 3D gibt es die Drehungen um die drei Koordinatenachsen, z. B. um die $z$-Achse

$$
R_z(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{pmatrix}
$$

und entsprechend $R_x$, $R_y$. Jede 3D-Drehung lässt sich als Produkt solcher Achsendrehungen schreiben (Euler-Winkel). Weil Matrizen nicht kommutieren, kommt es dabei auf die Reihenfolge an. Jede 3D-Drehung hat außerdem eine Achse, die fest bleibt: einen Eigenvektor mit Eigenwert 1. In höheren Dimensionen dreht eine **Givens-Rotation** nur in der Ebene zweier Koordinaten $i$ und $j$ und lässt alle anderen fest. Mit ihr kann man gezielt einzelne Einträge einer Matrix zu null machen, eine Alternative zu Householder für QR. Auch das Jacobi-Verfahren, mit dem Abbildung 11 die Singulärwerte des Testbilds berechnet, besteht aus solchen Drehungen.

### Projektionen

Die orthogonale Projektion auf den Spaltenraum einer Matrix $A$ (mit vollem Spaltenrang) ist selbst eine Matrix:

$$
P = A(A^\top A)^{-1}A^\top, \qquad\text{bei orthonormalen Spalten } Q:\; P = QQ^\top
$$

Sie ist symmetrisch und idempotent, $P^2 = P$: Was schon projiziert ist, bleibt, wo es ist. $I - P$ projiziert auf das orthogonale Komplement. Kleinste Quadrate aus Abschnitt 7 sind genau $A\hat{\mathbf x} = P\mathbf b$.

### Gram-Schmidt und QR-Zerlegung

Aus beliebigen unabhängigen Vektoren $\mathbf a_1, \mathbf a_2, \dots$ macht **Gram-Schmidt** eine Orthonormalbasis desselben Raums: Man nimmt jeden Vektor, zieht seine Projektionen auf alle bisherigen $\mathbf q$ ab und normiert den Rest.

$$
\mathbf u_k = \mathbf a_k - \sum_{j<k}(\mathbf q_j^\top\mathbf a_k)\,\mathbf q_j, \qquad \mathbf q_k = \frac{\mathbf u_k}{\|\mathbf u_k\|}
$$

::: widget la-09-gram-schmidt

Schreibt man die Koeffizienten mit, ergibt sich die **QR-Zerlegung** $A = QR$ mit orthonormalen Spalten in $Q$ und oberer Dreiecksmatrix $R$. Damit wird kleinste Quadrate stabil: $A^\top A\hat{\mathbf x} = A^\top\mathbf b$ vereinfacht sich zu $R\hat{\mathbf x} = Q^\top\mathbf b$, ohne die Kondition zu quadrieren. In der Praxis rechnet man QR nicht mit klassischem Gram-Schmidt (das verliert bei fast abhängigen Spalten die Orthogonalität), sondern mit Householder-Spiegelungen. Dasselbe Prinzip steckt im QR-Algorithmus, mit dem Bibliotheken Eigenwerte berechnen.

> [!abstract] Merke
> - Drehung $R(\theta)$: orthogonal mit $\det = 1$, $R^{-1} = R^\top$. In 3D nicht kommutativ.
> - Orthogonal: $Q^\top Q = I$, erhält Längen, $\kappa = 1$. Koordinaten in Orthonormalbasis = Skalarprodukte.
> - Projektion $P = QQ^\top$, $P^2 = P$. QR: $A = QR$, kleinste Quadrate über $R\hat{\mathbf x} = Q^\top\mathbf b$.

## Singulärwertzerlegung (SVD) {#svd toc="Singulärwertzerlegung"}

Eigenwerte gibt es nur für quadratische Matrizen, und reelle orthogonale Eigenvektoren nur für symmetrische. Die **Singulärwertzerlegung** funktioniert für *jede* $m\times n$-Matrix:

$$
A = U\Sigma V^\top = \sum_{i=1}^{r}\sigma_i\,\mathbf u_i\mathbf v_i^\top, \qquad \sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_r > 0
$$

$U$ ($m\times m$) und $V$ ($n\times n$) sind orthogonal, $\Sigma$ ist diagonal mit den **Singulärwerten** $\sigma_i$. Geometrisch zerlegt die SVD jede lineare Abbildung in drei einfache Schritte: drehen ($V^\top$), entlang der Achsen strecken ($\Sigma$), drehen ($U$). Der Einheitskreis wird dabei zu einer Ellipse mit den Halbachsen $\sigma_i\mathbf u_i$.

::: widget la-10-svd-in-drei-schritten

### Zusammenhang mit Eigenwerten

Die Singulärwerte sind die Wurzeln der Eigenwerte von $A^\top A$, die Spalten von $V$ dessen Eigenvektoren, die von $U$ die Eigenvektoren von $AA^\top$:

$$
A^\top A = V\Sigma^\top\Sigma V^\top, \qquad AA^\top = U\Sigma\Sigma^\top U^\top
$$

Für symmetrisch positiv semidefinite Matrizen fallen SVD und Eigenzerlegung zusammen. Die SVD liefert auf einen Schlag fast alles aus den vorigen Abschnitten: den Rang (Anzahl der $\sigma_i > 0$), die Konditionszahl $\sigma_1/\sigma_r$, Orthonormalbasen aller vier Unterräume, die Norm $\|A\|_2 = \sigma_1$ und die Pseudoinverse:

$$
A^+ = V\Sigma^+U^\top, \qquad \Sigma^+ = \operatorname{diag}(1/\sigma_1, \dots, 1/\sigma_r, 0, \dots)
$$

$A^+\mathbf b$ ist die Lösung der kleinsten Quadrate mit der kleinsten Norm, auch wenn $A$ keinen vollen Rang hat. Bei schlechter Kondition sind es die kleinen $\sigma_i$, deren Kehrwert das Rauschen verstärkt. Lässt man sie weg (**abgeschnittene SVD**) oder dämpft sie (Tikhonov ersetzt $1/\sigma_i$ durch $\sigma_i/(\sigma_i^2 + \lambda)$), ist das Regularisierung.

### Niedrigrang-Approximation

Bricht man die Summe nach $k$ Termen ab, erhält man die beste Approximation vom Rang $k$ (Satz von Eckart-Young):

$$
A_k = \sum_{i=1}^{k}\sigma_i\,\mathbf u_i\mathbf v_i^\top, \qquad \|A - A_k\|_F^2 = \sum_{i>k}\sigma_i^2
$$

Ein Bild ist eine Matrix. Fallen die Singulärwerte schnell ab, reichen wenige Terme für fast das ganze Bild. Statt $mn$ Zahlen speichert man $k(m + n + 1)$.

::: widget la-11-bildkompression-mit-svd

### Hauptkomponentenanalyse (PCA)

Stehen $N$ Datenpunkte mit $d$ Merkmalen als Zeilen in einer Matrix $X$ und zieht man von jeder Spalte ihren Mittelwert ab, dann ist $C = \frac{1}{N-1}X^\top X$ die Kovarianzmatrix. Ihre Eigenvektoren sind die **Hauptkomponenten**: die Richtungen größter Varianz, paarweise orthogonal. Die Eigenwerte sind die Varianzen entlang dieser Richtungen. Gerechnet wird über die SVD von $X$ direkt, denn $C = V\frac{\Sigma^2}{N-1}V^\top$.

::: widget la-12-pca

> [!abstract] Merke
> - Jede Matrix: $A = U\Sigma V^\top$, drehen, strecken, drehen. $\sigma_i = \sqrt{\lambda_i(A^\top A)}$.
> - Rang, Kondition, Norm, Pseudoinverse und beste Rang-k-Näherung stehen alle in der SVD. PCA ist die SVD der zentrierten Daten.

## Matrix-Kalkül {#kalkuel appendix="A"}

Für Optimierung braucht man Ableitungen nach Vektoren. Der **Gradient** $\nabla f(\mathbf x)$ einer skalaren Funktion ist der Vektor der partiellen Ableitungen, er zeigt in Richtung des steilsten Anstiegs. Die wichtigsten Regeln (Konvention: Gradient als Spaltenvektor):

| Funktion $f(\mathbf x)$ | Gradient $\nabla_{\mathbf x} f$ | Bemerkung |
|---|---|---|
| $\mathbf a^\top\mathbf x$ | $\mathbf a$ | wie $ax$ im Eindimensionalen |
| $\mathbf x^\top\mathbf x = \Vert \mathbf x\Vert ^2$ | $2\mathbf x$ |  |
| $\mathbf x^\top A\mathbf x$ | $(A + A^\top)\mathbf x$ | $= 2A\mathbf x$ für symmetrisches $A$ |
| $\Vert A\mathbf x - \mathbf b\Vert ^2$ | $2A^\top(A\mathbf x - \mathbf b)$ | null setzen ⇒ Normalengleichung |
| $\Vert A\mathbf x - \mathbf b\Vert ^2 + \lambda\Vert \mathbf x\Vert ^2$ | $2A^\top(A\mathbf x - \mathbf b) + 2\lambda\mathbf x$ | ⇒ Ridge-Lösung |
| $g(A\mathbf x)$ | $A^\top\nabla g$ | Kettenregel: Backpropagation durch eine lineare Schicht |

Jacobi- und Hesse-Matrix, Kettenregel, Backpropagation und Optimierungsverfahren stehen ausführlich auf der Seite [Vektoranalysis und Optimierung](vektoranalysis.html).

Eine Faustregel zum Prüfen: Die Dimensionen müssen passen. Ist $\mathbf x \in \mathbb R^n$, muss der Gradient auch in $\mathbb R^n$ liegen. Bei $\|A\mathbf x - \mathbf b\|^2$ mit $A \in \mathbb R^{m\times n}$ ist $A\mathbf x - \mathbf b \in \mathbb R^m$, und erst $A^\top$ bringt es zurück nach $\mathbb R^n$.

## Formeln und Notation {#formeln appendix="B"}

### Matrixklassen und ihre Zerlegungen

Welche Zerlegung existiert, hängt davon ab, was man über die Matrix weiß. Die Tabelle geht grob vom Allgemeinen zum Speziellen, ist aber keine strenge Kette: Symmetrisch heißt z. B. diagonalisierbar, aber nicht invertierbar. Erst positiv definit ist beides. Die Sonderzweige liegen quer dazu.

| Klasse | Definition | Eigenschaften | Zerlegung |
|---|---|---|---|
| beliebig $m\times n$ |  | Rang $r \le \min(m, n)$ | SVD $U\Sigma V^\top$, QR |
| quadratisch | $m = n$ | $\det$, $\operatorname{tr}$, Eigenwerte (evtl. komplex) | $PA = LU$, Schur |
| invertierbar | $\det A \neq 0$ | $\operatorname{rang} = n$, $\ker A = \{\mathbf 0\}$, alle $\sigma_i > 0$ | LU ohne Nullpivot (mit $P$) |
| diagonalisierbar | $n$ unabhängige Eigenvektoren | geom. = alg. Vielfachheit | $V\Lambda V^{-1}$ |
| symmetrisch | $A = A^\top$ | reelle Eigenwerte, orthogonale Eigenvektoren | $Q\Lambda Q^\top$ |
| positiv semidefinit | symmetrisch, $\mathbf x^\top A\mathbf x \ge 0$ | $\lambda_i \ge 0$, z. B. $A^\top A$, Kovarianzen | $Q\Lambda Q^\top$ = SVD |
| positiv definit | symmetrisch, $\mathbf x^\top A\mathbf x > 0$ | $\lambda_i > 0$, invertierbar | Cholesky $LL^\top$ |
| diagonal (Sonderzweig) | $a_{ij} = 0$ für $i \neq j$ | Eigenwerte = Diagonale | ist schon zerlegt |
| orthogonal (Sonderzweig) | $Q^\top Q = I$ | $\vert \lambda_i\vert = 1$, $\sigma_i = 1$, $\det = \pm 1$ | Drehung (ggf. mit Spiegelung) |
| Projektion (Sonderzweig) | $P^2 = P$, orthogonal: $P = P^\top$ | $\lambda_i \in \{0, 1\}$ | $QQ^\top$ |

| Symbol | Bedeutung |
|---|---|
| $\mathbf x, \mathbf b$ | Spaltenvektoren (fett, klein) |
| $A \in \mathbb R^{m\times n}$ | Matrix mit $m$ Zeilen, $n$ Spalten |
| $\mathbf a_j$, $a_{ij}$ | Spalte $j$, Eintrag in Zeile $i$, Spalte $j$ |
| $I$, $\mathbf e_j$ | Einheitsmatrix, $j$-ter Standardbasisvektor |
| $A^\top$, $A^{-1}$, $A^+$ | Transponierte, Inverse, Pseudoinverse |
| $\Vert \cdot\Vert _2$, $\Vert \cdot\Vert _F$ | euklidische bzw. Spektralnorm, Frobeniusnorm $\sqrt{\sum a_{ij}^2}$ |
| $\lambda_i$, $\sigma_i$ | Eigenwerte, Singulärwerte (absteigend sortiert) |
| $\kappa(A)$ | Konditionszahl $\sigma_{\max}/\sigma_{\min}$ |

| Thema | Formel |
|---|---|
| Skalarprodukt, Winkel | $\mathbf x^\top\mathbf y = \Vert \mathbf x\Vert \Vert \mathbf y\Vert \cos\theta$ |
| Projektion auf $\mathbf a$ | $\frac{\mathbf a^\top\mathbf y}{\mathbf a^\top\mathbf a}\mathbf a$ |
| Rechenregeln | $(AB)^\top = B^\top A^\top$, $(AB)^{-1} = B^{-1}A^{-1}$, $\det(AB) = \det A\det B$ |
| 2×2 | $\det = ad - bc$, $A^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b\\ -c & a\end{pmatrix}$ |
| Dimensionsformel | $\operatorname{rang}A + \dim\ker A = n$ |
| Kondition | $\kappa = \sigma_{\max}/\sigma_{\min}$, relativer Fehler $\le \kappa\cdot$ relativer Datenfehler |
| Kleinste Quadrate | $A^\top A\hat{\mathbf x} = A^\top\mathbf b$, Ridge: $(A^\top A + \lambda I)\hat{\mathbf x} = A^\top\mathbf b$ |
| Projektionsmatrix | $P = A(A^\top A)^{-1}A^\top = QQ^\top$, $P^2 = P$ |
| Eigenwerte | $A\mathbf v = \lambda\mathbf v$, $\det(A - \lambda I) = 0$, $\sum\lambda = \operatorname{tr}A$, $\prod\lambda = \det A$ |
| Zerlegungen | $PA = LU$, $A = LL^\top$ (SPD), $A = QR$, $A = Q\Lambda Q^\top$ (sym.), $A = U\Sigma V^\top$ |
| SVD | $\sigma_i = \sqrt{\lambda_i(A^\top A)}$, $\Vert A\Vert _2 = \sigma_1$, $A^+ = V\Sigma^+U^\top$, $\Vert A - A_k\Vert _F^2 = \sum_{i>k}\sigma_i^2$ |
| Gradientenabstieg | $\mathbf x_{k+1} = \mathbf x_k - \eta A^\top(A\mathbf x_k - \mathbf b)$, $0 < \eta < 2/\sigma_{\max}^2$ |

| Aufgabe | NumPy |
|---|---|
| $A\mathbf x = \mathbf b$ lösen | `np.linalg.solve(A, b)` |
| Kleinste Quadrate | `np.linalg.lstsq(A, b, rcond=None)` |
| Eigenwerte (symmetrisch) | `np.linalg.eigh(A)` (aufsteigend sortiert) |
| SVD | `U, s, Vt = np.linalg.svd(A, full_matrices=False)` |
| QR, Kondition, Rang | `np.linalg.qr(A)`, `np.linalg.cond(A)`, `np.linalg.matrix_rank(A)` |
| Pseudoinverse | `np.linalg.pinv(A)` |
