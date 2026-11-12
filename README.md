# tech wiki

Persönliches Nachschlagewerk mit interaktiven Seiten, nach Themengebieten geordnet. Jede Abbildung gibt es zusätzlich als einzelnes Widget zum Einbetten, z. B. in Obsidian.

## Struktur

```
src/                     Quellen (hier wird bearbeitet)
  pages/<gebiet>/*.md      Seiteninhalt in Markdown
  figures/*.html           Abbildungen: Markup + Skript, je eine Datei
  lib/                     page.css, core.js, gemeinsame Bibliotheken (la.js)
  template.html            HTML-Gerüst
build.py                 baut aus src/ die fertigen Seiten
index.html, assets/      Startseite (liest manifest.json)
grundlagen/, physik/     fertige Seiten (von build.py erzeugt, nicht von Hand bearbeiten)
widgets/                 Abbildungen einzeln zum Einbetten (Pfade bleiben stabil)
manifest.json            Themengebiete, Seiten, Widgets
```

### Seite bearbeiten

1. Markdown in `src/pages/` ändern.
2. `pip install -r requirements.txt` (einmalig), dann `python build.py`.
3. Quellen und erzeugte Dateien zusammen committen. Eine GitHub Action prüft, ob beides zusammenpasst.

In Markdown stehen Formeln in `$…$` und `$$…$$`. Kästen schreibt man wie Obsidian-Callouts (`> [!abstract] Merke`), Abbildungen mit `::: widget la-04-determinante`. Abschnitte bekommen Attribute für das Inhaltsverzeichnis: `## Titel {#id group="Gruppe" toc="Kurztitel"}`, Anhänge `{#id appendix="A"}`. Details stehen oben in `build.py`.

### Neue Seite hinzufügen

1. Markdown-Datei unter `src/pages/<gebiet>/` anlegen und `python build.py` ausführen.
2. Eintrag in `manifest.json` unter `pages` ergänzen (`id`, `category`, `path`, `title`, `desc`, `tags`). Mit `"status": "geplant"` erscheint die Seite ausgegraut.
3. Neues Themengebiet: Eintrag unter `categories` und gleichnamigen Ordner anlegen.

Die alten Adressen `grundlagen.html`, `rekonstruktion.html` und `photon-counting.html` im Root leiten auf die neuen Pfade weiter.

Die Startseite lädt `manifest.json` per `fetch`. Lokal deshalb über einen Webserver öffnen, z. B. `python -m http.server`.

## Veröffentlichen mit GitHub Pages

1. Neues Repository anlegen (z. B. `xray-wiki`) und den Inhalt dieses Ordners hochladen.
2. *Settings → Pages → Build and deployment*: Source **Deploy from a branch**, Branch **main**, Ordner **/ (root)**.
3. Nach ca. einer Minute ist die Seite unter `https://<user>.github.io/xray-wiki/` erreichbar.

Die Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.

## In Obsidian einbetten

```html
<iframe src="https://<user>.github.io/xray-wiki/widgets/rk-06-fbp-labor.html" width="100%" height="720" style="border:0"></iframe>
```

Optionen: `?theme=dark` / `?theme=light` (Farbschema erzwingen), `?frame=0` (ohne Rahmen). Auf der Startseite gibt es für jedes Widget einen fertigen Schnipsel zum Kopieren.

Formeln und Schriften werden von cdnjs bzw. Google Fonts geladen; ohne Internet fehlen die Formeln in Bildunterschriften, die Animationen laufen trotzdem.

## Widgets

Jede Abbildung liegt zusätzlich einzeln unter `widgets/<slug>.html`. Die vollständige Liste mit fertigen Einbettungs-Schnipseln steht auf der Startseite; `manifest.json` enthält dieselben Daten. Präfixe: `et-` E-Technik, `la-` Lineare Algebra, `gl-` Vom Photon zum Bild, `rk-` Rekonstruktion, `pc-` Photon Counting.

## Abbildungen ändern

Jede Abbildung ist eine Datei in `src/figures/`: oben ein Kommentar mit Titel und Bibliothek, dann das Markup der `<figure>`, dann das Skript. `python build.py` setzt sie in die Seite ein und erzeugt daraus auch das Einzel-Widget. Gemeinsame Hilfsfunktionen einer Seite stehen in `src/lib/<lib>.js`, Zusatzstile in `src/lib/<lib>.css`.
