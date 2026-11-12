---
title: Iterative Rekonstruktion
category: physik
eyebrow: Physik · Computertomographie
tags: [CT, Rekonstruktion, Inverses Problem, Regularisierung, Statistik]
footer: Alle Abbildungen rechnen live im Browser mit kleinen Bildern (16 × 16 bzw. 64 × 64 Pixel) und Parallelstrahlgeometrie. Echte Rekonstruktionen nutzen GPU-Bibliotheken wie ASTRA oder TIGRE.
---

Die [CT-Rekonstruktion](rekonstruktion.html#iterativ) endet mit dem Gleichungssystem $A\mathbf x = \mathbf p$ und den einfachsten iterativen Verfahren ART und SART. Diese Seite macht dort weiter: warum das System so schwierig ist, wie man Rauschen richtig gewichtet, wie Vorwissen über Bilder hilft und wie neuronale Netze ins Spiel kommen. Vorausgesetzt werden [lineare Algebra](../grundlagen/lineare-algebra.html), [Optimierung](../grundlagen/vektoranalysis.html#gd) und [Wahrscheinlichkeit](../grundlagen/wahrscheinlichkeit.html#ml).

## Rekonstruktion als inverses Problem {#invers group="Das Problem" toc="Inverses Problem"}

Die Messung ist eine lineare Abbildung vom Bild $\mathbf x$ auf die Linienintegrale $\mathbf p = A\mathbf x$ (Systemmatrix $A$, siehe [Gleichungssystem](rekonstruktion.html#iterativ)). Rekonstruieren heißt, diese Abbildung umzukehren. Das ist ein **inverses Problem**, und zwar ein **schlecht gestelltes**: Kleine Fehler in den Daten können große Fehler im Bild erzeugen.

Am klarsten sieht man das mit der [Singulärwertzerlegung](../grundlagen/lineare-algebra.html#svd) $A = U\Sigma V^\top$. Die Lösung im Sinne der kleinsten Quadrate ist

$$
\hat{\mathbf x} = \sum_i \frac{\mathbf u_i^\top\mathbf p}{\sigma_i}\,\mathbf v_i
$$

Die Bildmuster $\mathbf v_i$ zu großen Singulärwerten sind glatt, die zu kleinen fein und oszillierend. Gerade diese feinen Muster werden durch die Projektion stark abgeschwächt, ihr $\sigma_i$ ist klein. Beim Zurückrechnen teilt man durch $\sigma_i$ und verstärkt damit auch das Rauschen in dieser Komponente um $1/\sigma_i$. Die Singulärwerte fallen über viele Größenordnungen, die Kondition ist entsprechend riesig.

Jede brauchbare Rekonstruktion muss deshalb die kleinsten Singulärwerte dämpfen. Das ist der Kern von **Regularisierung**, in welcher Form auch immer: Filter bei der FBP, frühes Abbrechen von Iterationen, Strafterme in der Zielfunktion. Immer tauscht man ein wenig Schärfe gegen deutlich weniger Rauschen.

::: widget ir-01-svd

## Kleinste Quadrate und Semikonvergenz {#lsq toc="Kleinste Quadrate, SIRT"}

Statt $A$ zu invertieren, minimiert man den Datenfehler

$$
f(\mathbf x) = \tfrac12\,\Vert A\mathbf x - \mathbf p\Vert^2, \qquad \nabla f = A^\top(A\mathbf x - \mathbf p)
$$

mit [Gradientenabstieg](../grundlagen/vektoranalysis.html#gd). $A\mathbf x$ ist eine Vorwärtsprojektion, $A^\top$ eine Rückprojektion. Jede Iteration projiziert also das aktuelle Bild, vergleicht mit den Messdaten und projiziert den Unterschied zurück. Mit geschickter Normierung nach Strahllängen und Pixelgewichten heißt das Verfahren **SIRT**. SART ist dieselbe Idee, nur Winkel für Winkel. Die Nebenbedingung $\mathbf x \ge 0$ setzt man nach jedem Schritt einfach durch.

Bei verrauschten Daten zeigen diese Verfahren **Semikonvergenz**: Der Fehler zum wahren Bild sinkt erst und steigt dann wieder. Gradientenabstieg lernt zuerst die Komponenten mit großen Singulärwerten, die feinen und verrauschten erst spät. Wenige Iterationen wirken deshalb wie eine abgeschnittene SVD, und **frühes Abbrechen** ist selbst eine Form von Regularisierung. Die Zahl der Iterationen wird so zu einem Parameter, den man festlegen muss.

::: widget ir-02-semikonvergenz

## Statistisches Modell und Gewichtung {#statistik group="Besser modellieren" toc="Gewichtung, Likelihood"}

Ungewichtete kleinste Quadrate behandeln alle Strahlen gleich. Sie sind aber nicht gleich genau. Ein Strahl, der mit $N_i$ Photonen ankommt, liefert einen Messwert $p_i = -\ln(N_i/I_0)$ mit [Varianz](../grundlagen/wahrscheinlichkeit.html#fehler) ungefähr $1/N_i$. Hinter dichten Objekten sind das wenige Photonen und sehr unsichere Werte. Die passende Zielfunktion gewichtet jeden Strahl mit seiner Genauigkeit, **gewichtete kleinste Quadrate** (WLS):

$$
f(\mathbf x) = \tfrac12\sum_i w_i\,(\mathbf a_i^\top\mathbf x - p_i)^2, \qquad w_i \approx N_i
$$

Noch genauer ist es, direkt die **Poisson-Likelihood** der gezählten Photonen zu maximieren, mit erwarteter Zählrate $\bar N_i = I_0\,e^{-\mathbf a_i^\top\mathbf x}$:

$$
\hat{\mathbf x} = \arg\max_{\mathbf x} \sum_i \big(N_i \ln\bar N_i(\mathbf x) - \bar N_i(\mathbf x)\big)
$$

WLS ist die quadratische Näherung davon und für die meisten Strahlen gut genug. Die volle Poisson-Form hilft bei sehr wenigen Photonen und erlaubt, auch weitere Effekte wie Streustrahlung oder Elektronikrauschen in $\bar N_i$ einzubauen. Das ist der Ausgangspunkt der **modellbasierten** Rekonstruktion (MBIR).

::: widget ir-03-gewichtung

## Regularisierung {#regularisierung}

Statt die Lösung nur über die Iterationszahl zu steuern, schreibt man das Vorwissen über Bilder direkt in die Zielfunktion:

$$
\hat{\mathbf x} = \arg\min_{\mathbf x}\ \tfrac12\sum_i w_i\,(\mathbf a_i^\top\mathbf x - p_i)^2 + \beta\,R(\mathbf x), \qquad R(\mathbf x) = \sum_{j \sim k} \psi(x_j - x_k)
$$

$R$ bestraft Unterschiede zwischen benachbarten Pixeln $j \sim k$, $\beta$ regelt die Stärke. Entscheidend ist die Strafe $\psi$ für eine Differenz $d$:

| Regularisierer | $\psi(d)$ | Wirkung |
|---|---|---|
| quadratisch (Tikhonov) | $d^2$ | glättet alles, auch Kanten |
| Huber | $d^2$ für kleine $\vert d\vert$, linear für große | glättet Rauschen, lässt Kanten weitgehend stehen |
| Total Variation (TV) | $\vert d\vert$ | bevorzugt stückweise konstante Bilder, bei zu großem β Treppenstufen |

Die quadratische Strafe macht große Sprünge sehr teuer und verwischt deshalb Kanten. Huber und TV wachsen für große Sprünge nur linear, eine scharfe Kante kostet daher kaum mehr als ein weicher Übergang. In der Sprache der [Wahrscheinlichkeit](../grundlagen/wahrscheinlichkeit.html#ml) ist $R$ ein Log-Prior, und das Ganze eine MAP-Schätzung.

Besonders wertvoll ist Regularisierung bei **wenigen Projektionen** (Sparse View) oder **fehlenden Winkeln** (Limited Angle, etwa bei Tomosynthese). Dann hat $A$ einen großen Nullraum, und viele Bilder passen gleich gut zu den Daten. Erst das Vorwissen entscheidet, welches man nimmt. TV ist hier besonders wirksam, weil medizinische Bilder sich gut durch wenige Kanten beschreiben lassen. Das ist die Idee hinter Compressed Sensing.

Alle Verfahren mit $R$ sind nichtlinear. Auflösung und Rauschtextur hängen dann vom Kontrast und von der Umgebung ab. Bei Bildqualitätsmessungen muss man das berücksichtigen, die MTF eines Systems ist dann keine feste Größe mehr.

::: widget ir-04-regularisierung

## Schneller rechnen {#schnell group="Praxis"}

Jede Iteration kostet eine Vorwärts- und eine Rückprojektion des ganzen Volumens. Damit klinische Rekonstruktionen in Sekunden fertig werden, braucht man wenige Iterationen und schnelle Projektoren.

- **Ordered Subsets (OS):** Die Projektionen werden in Teilmengen aufgeteilt, etwa jeder zehnte Winkel. Jede Teilmenge liefert eine Näherung des vollen Gradienten, und man macht nach jeder einen Schritt. Mit $M$ Teilmengen läuft der Anfang etwa $M$-mal schneller, wie bei stochastischem Gradientenabstieg.
- **Momentum und Nesterov-Beschleunigung:** wie beim [Training neuronaler Netze](../grundlagen/vektoranalysis.html#optimierer), oft kombiniert mit OS.
- **Vorkonditionierung:** Skalierung der Schritte pro Pixel, damit alle Bildbereiche ähnlich schnell konvergieren. SIRT und die sogenannten separierbaren Surrogate sind Beispiele.
- **Guter Startwert:** Man beginnt mit dem FBP-Bild statt mit null.

Die Projektoren selbst laufen auf GPUs. Die Systemmatrix wird dabei nie gespeichert, sondern bei jeder Projektion aus der Geometrie neu berechnet.

## Lernbasierte Verfahren {#lernen}

Neuronale Netze kommen an drei Stellen hinzu:

- **Nachverarbeitung:** Ein Netz entrauscht oder entstreift das FBP- oder iterative Bild. Einfach und schnell, aber das Netz kennt die Messdaten nicht mehr.
- **Entrollte Iterationen** (unrolled): Eine feste Zahl von Iterationen wird als Netz geschrieben, mit echten Vor- und Rückprojektionen dazwischen. Gelernt werden Schrittweiten, Regularisierer oder ganze Korrekturschritte (z. B. Learned Primal-Dual).
- **Gelernter Regularisierer:** Ein Netz ersetzt $R(\mathbf x)$ oder seinen Gradienten in einer klassischen Iteration, etwa als Entrauscher (Plug-and-Play) oder als Diffusionsmodell, das den Prior über Bilder liefert.

Bei allen bleibt die **Datenkonsistenz** der Anker: Das Ergebnis muss die Messung erklären, $A\mathbf x \approx \mathbf p$. Sonst kann ein Netz plausibel aussehende, aber falsche Strukturen erzeugen oder echte entfernen. Verfahren, die die Projektionen in jedem Schritt einbeziehen, sind dafür robuster als reine Nachverarbeitung.

## Formeln {#formeln appendix="A"}

| Thema | Formel |
|---|---|
| Modell | $\mathbf p = A\mathbf x$, $p_i = -\ln(N_i/I_0)$, $\operatorname{Var}[p_i] \approx 1/N_i$ |
| SVD-Lösung | $\hat{\mathbf x} = \sum_i \frac{\mathbf u_i^\top\mathbf p}{\sigma_i}\mathbf v_i$, Rauschverstärkung $1/\sigma_i$ |
| Gradient | $\nabla\tfrac12\Vert A\mathbf x - \mathbf p\Vert^2 = A^\top(A\mathbf x - \mathbf p)$ |
| SIRT | $\mathbf x \leftarrow \mathbf x + \lambda\,C A^\top R(\mathbf p - A\mathbf x)$, $R$, $C$: Kehrwerte der Zeilen- und Spaltensummen |
| WLS | $\min \tfrac12\sum_i w_i(\mathbf a_i^\top\mathbf x - p_i)^2$, $w_i \approx N_i$ |
| Poisson | $\max \sum_i N_i\ln\bar N_i - \bar N_i$, $\bar N_i = I_0 e^{-\mathbf a_i^\top\mathbf x}$ |
| Regularisiert | $\min$ Datenterm $+ \beta\sum_{j\sim k}\psi(x_j - x_k)$, $\psi$: $d^2$, Huber, $\vert d\vert$ |

## Befehle {#befehle appendix="B"}

```python
from skimage.transform import radon, iradon, iradon_sart
import numpy as np

theta = np.linspace(0, 180, 60, endpoint=False)
sino = radon(img, theta=theta)                       # Vorwärtsprojektion
rec = iradon_sart(sino, theta=theta)                  # eine SART-Iteration
for _ in range(9):
    rec = iradon_sart(sino, theta=theta, image=rec)   # weitere Iterationen

# GPU, Kegelstrahl, große Volumen: ASTRA Toolbox oder TIGRE
import astra
vol = astra.create_vol_geom(512, 512)
proj = astra.create_proj_geom("parallel", 1.0, 736, np.deg2rad(theta))
pid = astra.create_projector("cuda", proj, vol)
# Algorithmen: "SIRT_CUDA", "SART_CUDA", "CGLS_CUDA", "FBP_CUDA"
```
