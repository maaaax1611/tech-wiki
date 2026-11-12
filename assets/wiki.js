// Startseite des Wikis: baut das Inhaltsverzeichnis (Themengebiete, Kapitel, Abschnitte), Suche und Widget-Liste aus manifest.json.
(async () => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let m;
  try { m = await (await fetch('manifest.json', { cache: 'no-cache' })).json(); }
  catch (e) { document.getElementById('cats').innerHTML = '<p class="empty">manifest.json konnte nicht geladen werden. Die Seite muss über einen Webserver laufen (z. B. GitHub Pages oder <code>python -m http.server</code>).</p>'; return; }

  // Themengebiete als Inhaltsverzeichnis: jede Seite ein nummeriertes Kapitel mit ihren Abschnitten
  let num = 0;
  const chapter = p => {
    const planned = p.status === 'geplant', k = planned ? '' : String(++num), secs = p.sections || [];
    const link = s => `<a href="${esc(p.path)}#${esc(s.id)}">${esc(s.a ? s.n : k + '.' + s.n)} ${esc(s.t)}</a>`;
    const main = secs.filter(s => !s.a), app = secs.filter(s => s.a);
    const q = [p.title, p.desc, ...(p.tags || []), ...secs.map(s => s.t)].join(' ').toLowerCase();
    return `<article class="chap${planned ? ' planned' : ''}" data-q="${esc(q)}">
      <div class="chap-n" aria-hidden="true">${planned ? '·' : k}</div>
      <div class="chap-b">
        ${planned ? `<h3><span>${esc(p.title)}</span> <span class="tag">geplant</span></h3>` : `<h3><a href="${esc(p.path)}">${esc(p.title)}</a></h3>`}
        <p>${esc(p.desc)}</p>
        ${main.length ? `<div class="chap-l">${main.map(link).join('')}</div>` : ''}
        ${app.length ? `<div class="chap-h">Anhang</div><div class="chap-l">${app.map(link).join('')}</div>` : ''}
      </div></article>`;
  };
  document.getElementById('cats').innerHTML = m.categories.map(c => {
    const pages = m.pages.filter(p => p.category === c.id);
    // Optional: Untergruppen innerhalb eines Themengebiets (c.groups = [{id, title}], Seite mit p.group)
    const body = c.groups
      ? c.groups.map(g => { const ps = pages.filter(p => p.group === g.id); return ps.length ? `<h3 class="grp">${esc(g.title)}</h3>${ps.map(chapter).join('')}` : ''; }).join('')
      : pages.map(chapter).join('');
    return `<section class="cat" id="${esc(c.id)}"><h2>${esc(c.title)}</h2><p>${esc(c.desc)}</p>
      ${body || '<p class="empty">Noch keine Seiten.</p>'}</section>`;
  }).join('');

  // Suche über Titel, Beschreibung und Tags
  const q = document.getElementById('q');
  q.addEventListener('input', () => {
    const terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    document.querySelectorAll('.cat').forEach(sec => {
      let any = false;
      sec.querySelectorAll('.chap').forEach(c => { const hit = terms.every(t => c.dataset.q.includes(t)); c.hidden = !hit; any = any || hit; });
      sec.hidden = terms.length > 0 && !any;
    });
  });

  // Widgets zum Einbetten
  const base = new URL('widgets/', location.href).href;
  const snip = w => `<iframe src="${base}${w.slug}.html" width="100%" height="${w.height}" style="border:0"></iframe>`;
  document.getElementById('ex').textContent = snip({ slug: 'rk-06-fbp-labor', height: 720 });
  const groups = m.pages.filter(p => m.widgets.some(w => w.page === p.id));
  document.getElementById('wlist').innerHTML = groups.map(p => `<h3>${esc(p.title)}</h3><div class="tbl"><table>
    <thead><tr><th>Widget</th><th>Einbettung in Obsidian</th><th></th></tr></thead><tbody>
    ${m.widgets.filter(w => w.page === p.id).map(w => `<tr><td><a href="widgets/${esc(w.slug)}.html">${esc(w.title)}</a><div class="meta">${w.interactive ? 'interaktiv' : 'Skizze'} · Höhe ${w.height} px</div></td>
      <td class="snip"><code>${esc(snip(w))}</code></td><td><button class="btn copy" type="button">Kopieren</button></td></tr>`).join('')}
    </tbody></table></div>`).join('');
  document.getElementById('wlist').addEventListener('click', e => {
    const b = e.target.closest('button.copy'); if (!b) return;
    const c = b.closest('tr').querySelector('code');
    const ok = () => { b.textContent = 'Kopiert'; setTimeout(() => b.textContent = 'Kopieren', 1500); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    (navigator.clipboard ? navigator.clipboard.writeText(c.textContent).then(ok, sel) : sel());
  });

  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
