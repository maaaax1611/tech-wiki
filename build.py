#!/usr/bin/env python3
"""Baut die Wiki-Seiten aus Markdown.

    python build.py

Quellen:
  src/pages/<gebiet>/<seite>.md   Seiteninhalt (Markdown mit Formeln)
  src/figures/<slug>.html         Abbildung: Markup + optional <script>, eingebunden mit "::: widget <slug>"
  src/lib/                        page.css (alle Seiten), ui.js (Bedienung), <lib>.js/.css je Seitenfamilie
  src/template.html               HTML-Gerüst

Ergebnis (wird mit eingecheckt, GitHub Pages liefert es direkt aus):
  <gebiet>/<seite>.html, widgets/<slug>.html, assets/*, manifest.json (Widget-Liste)

Markdown:
  Frontmatter     title, eyebrow, footer (HTML erlaubt), toc_intro (Eintrag „0“ fürs Inhaltsverzeichnis)
  ## Titel {#id}  Abschnitt. Weitere Attribute, alle optional:
                    group="…"     Zwischenüberschrift im Inhaltsverzeichnis ab hier
                    eyebrow="…"   kleine Überschrift über dem Titel (Standard: aktuelle Gruppe)
                    toc="…"       kürzerer Titel fürs Inhaltsverzeichnis
                    n="…"         eigene Nummer statt der automatischen (z. B. "→" oder "01")
                    level="3"     Tiefenanzeige mit 5 Punkten statt Nummer
                    appendix="A"  Anhang: ohne Nummer, Eyebrow „Anhang A“
  > [!abstract] Merke             Kasten mit Überschrift (Obsidian-Callout-Syntax)
  > [!note]                       Randnotiz
  ::: widget <slug>               Abbildung an dieser Stelle
  ::: widget <slug> part=2        nur die 2. <figure> einer Abbildungsdatei mit mehreren Teilen
  $…$, $$…$$                      Formeln (MathJax)
"""
import html, json, re, shutil, sys
from pathlib import Path

import markdown
import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
TEMPLATE = (SRC / 'template.html').read_text()
THEME_BTNS = ('<div class="theme" role="group" aria-label="Darstellung"><button type="button" data-t="light">Hell</button>'
              '<button type="button" data-t="dark">Dunkel</button><button type="button" data-t="system">System</button></div>')


def esc(s):
    return html.escape(str(s), quote=True)


# ---------- Abbildungen ----------
def load_figure(slug):
    path = SRC / 'figures' / f'{slug}.html'
    if not path.exists():
        sys.exit(f'Abbildung nicht gefunden: {path.relative_to(ROOT)}')
    text = path.read_text()
    meta = {}
    m = re.match(r'<!--(.*?)-->\s*', text, re.S)
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.strip().partition(':')
            meta[k.strip()] = v.strip()
        text = text[m.end():]
    m = re.search(r'<script>(.*)</script>\s*$', text, re.S)
    markup, code = (text[:m.start()].strip(), m.group(1).strip()) if m else (text.strip(), '')
    libs = [l.strip() for l in meta.get('lib', '').split(',') if l.strip()]
    return {'slug': slug, 'title': meta.get('title', slug), 'markup': markup, 'code': code, 'libs': libs,
            'interactive': bool(re.search(r'<input|<select|<button|tabindex', markup))}


def number_captions(markup, start):
    """Nummeriert jede <figure> fortlaufend; "Abb." ohne Zahl wird ersetzt, feste Nummern bleiben."""
    n = start
    def cap(m):
        nonlocal n
        n += 1
        return f'<b>Abb. {n}</b>' if m.group(1).strip() == '' else m.group(0)
    out = re.sub(r'<b>Abb\.([^<]*)</b>', cap, markup)
    return out, start + max(1, markup.count('<figure'))


def head_assets(root, libs):
    css = [f'<link rel="stylesheet" href="{root}assets/{l}.css">' for l in libs if (SRC / 'lib' / f'{l}.css').exists()]
    return '\n'.join(css)


def script_tags(root, libs, codes):
    tags = [f'<script src="{root}assets/ui.js"></script>']
    tags += [f'<script src="{root}assets/{l}.js"></script>' for l in libs if (SRC / 'lib' / f'{l}.js').exists()]
    tags += [f'<script>\n{c}\n</script>' for c in codes if c]
    return '\n'.join(tags)


def fill(title, root, source, libs, body, codes):
    out = TEMPLATE.replace('{{title}}', esc(title)).replace('{{root}}', root).replace('{{source}}', source)
    out = out.replace('{{head}}', head_assets(root, libs))
    return out.replace('{{body}}', body).replace('{{scripts}}', script_tags(root, libs, codes))


# ---------- Markdown ----------
CALLOUT = re.compile(r'^> \[!(\w+)\][ \t]*(.*)\n((?:>.*(?:\n|$))*)', re.M)
WIDGET = re.compile(r'^::: *widget +([\w-]+)(?: +part=(\d+))? *$', re.M)


def preprocess(md):
    def callout(m):
        kind, title = m.group(1).lower(), m.group(2).strip()
        inner = re.sub(r'^> ?', '', m.group(3), flags=re.M)
        if kind == 'note' and not title:
            return f'<div class="note" markdown="1">\n\n{inner}\n</div>\n'
        return f'<div class="merke" markdown="1">\n<div class="eyebrow">{esc(title or kind.capitalize())}</div>\n\n{inner}\n</div>\n'
    md = CALLOUT.sub(callout, md)
    return WIDGET.sub(lambda m: f'\n<div class="xw-widget-slot" data-slug="{m.group(1)}" data-part="{m.group(2) or ""}"></div>\n', md)


def render(md):
    return markdown.markdown(md, extensions=['tables', 'attr_list', 'md_in_html', 'fenced_code', 'pymdownx.arithmatex'],
                             extension_configs={'pymdownx.arithmatex': {'generic': True}})


def level_badge(level, eyebrow):
    dots = ''.join('<i class="f"></i>' if i < level else '<i></i>' for i in range(5))
    return f'<div class="level"><span class="depth">{dots}</span><span class="eyebrow">{esc(eyebrow)}</span></div>'


def build_page(path, manifest):
    raw = path.read_text()
    fm, md = {}, raw
    m = re.match(r'^---\n(.*?)\n---\n', raw, re.S)
    if m:
        fm, md = yaml.safe_load(m.group(1)) or {}, raw[m.end():]
    rel = path.relative_to(SRC / 'pages').with_suffix('.html')
    root = '../' * (len(rel.parts) - 1)
    soup = BeautifulSoup(render(preprocess(md)), 'html.parser')

    for d in soup.select('div.arithmatex'):
        d['class'] = ['eq']
    for c in soup.find_all(['td', 'th'], style=True):
        if 'text-align: right' in c['style']:
            del c['style']
            c['class'] = ['num']
    for t in soup.find_all('table'):
        if not (t.parent and 'tbl' in (t.parent.get('class') or [])):
            t.wrap(soup.new_tag('div', attrs={'class': 'tbl'}))
    for ul in soup.find_all('ul'):
        if not ul.find_parent(class_=['merke', 'note']) and not ul.get('class'):
            ul['class'] = ['tight']
    for ol in soup.find_all('ol'):
        if not ol.get('class'):
            ol['class'] = ['steps']

    figs, seen, counter = [], {}, 0
    for slot in soup.select('div.xw-widget-slot'):
        slug, part = slot['data-slug'], slot.get('data-part')
        if slug not in seen:
            f = load_figure(slug)
            f['start'] = counter
            seen[slug] = f
            figs.append(f)
        f = seen[slug]
        markup = f['markup']
        if part:  # nur die n-te <figure> der Abbildungsdatei
            parts = [str(x) for x in BeautifulSoup(markup, 'html.parser').find_all('figure', recursive=False)]
            markup = parts[int(part) - 1]
        markup, counter = number_captions(markup, counter)
        slot.replace_with(BeautifulSoup(markup, 'html.parser'))

    intro, sections, cur = [], [], None
    for node in list(soup.children):
        if getattr(node, 'name', None) == 'h2':
            cur = {'h2': node, 'nodes': []}
            sections.append(cur)
        elif cur is None:
            intro.append(node)
        else:
            cur['nodes'].append(node)

    toc, toc_m, secs, num, group = [], [], [], 0, None
    if fm.get('toc_intro'):
        toc.append(f'<li><a href="#ueberblick"><span class="n">0</span><span>{esc(fm["toc_intro"])}</span></a></li>')
        toc_m.append(f'<li><a href="#ueberblick">{esc(fm["toc_intro"])}</a></li>')
    for s in sections:
        h = s['h2']
        a = {k: h.attrs.pop(k) for k in ['id', 'group', 'eyebrow', 'toc', 'n', 'level', 'appendix'] if k in h.attrs}
        sid = a.get('id') or re.sub(r'\W+', '-', h.get_text().lower()).strip('-')
        if a.get('appendix'):
            if group != 'Anhang' and 'group' not in a:
                a['group'] = 'Anhang'
            mark = a.get('n', a['appendix'])
            badge = f'<div class="eyebrow">{esc(a.get("eyebrow", "Anhang " + a["appendix"]))}</div>'
        else:
            num += 1
            mark = a.get('n', str(num))
        if a.get('group') and a['group'] != group:
            group = a['group']
            toc.append(f'<li class="lv">{esc(group)}</li>')
        if not a.get('appendix'):
            eb = a.get('eyebrow', group or '')
            badge = level_badge(int(a['level']), eb) if a.get('level') else f'<div class="step"><b>{esc(mark)}</b><span class="eyebrow">{esc(eb)}</span></div>'
        short = a.get('toc') or h.get_text().strip()
        toc.append(f'<li><a href="#{sid}"><span class="n">{esc(mark)}</span><span>{esc(short)}</span></a></li>')
        toc_m.append(f'<li><a href="#{sid}"><span class="n">{esc(mark)}</span><span>{esc(short)}</span></a></li>')
        secs.append(f'<section id="{sid}">\n{badge}\n{h}\n{"".join(str(x) for x in s["nodes"]).strip()}\n</section>')

    intro_html = ''.join(str(x) for x in intro).strip()
    intro_html = re.sub(r'^<p>', '<p class="lede">', intro_html, count=1)
    cat = fm.get('category', rel.parts[0] if len(rel.parts) > 1 else '')
    cat_title = {c['id']: c['title'] for c in manifest.get('categories', [])}.get(cat, cat)
    back = f'<p class="backlink"><a href="{root}index.html">← Wiki</a>' + (f' · <a href="{root}index.html#{cat}">{esc(cat_title)}</a>' if cat else '') + '</p>'
    body = f'''<div class="wrap">
  <nav class="toc" aria-label="Inhalt">
    <div class="eyebrow">Inhalt</div>
    <ol>
      {(chr(10) + '      ').join(toc)}
    </ol>
  </nav>
  <main>
    <header id="ueberblick">
      {back}
      <div class="topbar"><div class="eyebrow">{esc(fm.get('eyebrow', cat_title))}</div>
        {THEME_BTNS}</div>
      <h1>{esc(fm['title'])}</h1>
      {intro_html}
    </header>
    <details class="toc-mobile"><summary><span class="lab">Inhalt</span><span class="cur"></span></summary><ol>{''.join(toc_m)}</ol></details>
{chr(10).join(secs)}
    {f'<footer>{fm["footer"]}</footer>' if fm.get('footer') else ''}
  </main>
</div>'''
    libs = list(dict.fromkeys(l for f in figs for l in f['libs']))
    libs = list(dict.fromkeys(fm.get('libs', []) + libs))
    out = fill(fm['title'], root, str(path.relative_to(ROOT)), libs, body, [f['code'] for f in figs])
    dest = ROOT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(out)
    return {'id': fm.get('id', path.stem), 'path': str(rel), 'figs': figs}


def build_widget(f):
    markup, _ = number_captions(f['markup'], f['start'])
    body = f'<main class="widget">\n{markup}\n</main>'
    (ROOT / 'widgets' / f'{f["slug"]}.html').write_text(fill(f['title'], '../', f'src/figures/{f["slug"]}.html', f['libs'], body, [f['code']]))


def main():
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    (ROOT / 'assets').mkdir(exist_ok=True)
    for p in (SRC / 'lib').iterdir():
        if p.suffix in ('.css', '.js'):
            shutil.copyfile(p, ROOT / 'assets' / p.name)
    old = {w['slug']: w for w in manifest.get('widgets', [])}
    for p in sorted((SRC / 'pages').rglob('*.md')):
        info = build_page(p, manifest)
        for f in info['figs']:
            build_widget(f)
        manifest['widgets'] = [w for w in manifest['widgets'] if w['page'] != info['id']] + [
            {'slug': f['slug'], 'page': info['id'], 'title': f['title'], 'interactive': f['interactive'],
             'height': old.get(f['slug'], {}).get('height') or 640} for f in info['figs']]
        print(f'{info["path"]}: {len(info["figs"])} Abbildungen')
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main()
