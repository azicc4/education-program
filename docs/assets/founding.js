// Founding-era and 19th-century reading lists, cross-linked into the curriculum table.
(function () {
  const { DATA, esc, trackById } = window.App;
  const lists = (window.FOUNDING?.lists || []).slice();
  const CATEGORIES = {
    'british-university': 'British & Irish universities',
    'colonial-college': 'Colonial colleges',
    treatise: 'Treatises on education',
    'founder-letter': "Founders' letters",
    '19th-century-school': '19th-century schooling',
  };
  const catOrder = Object.keys(CATEGORIES);
  lists.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || String(a.date).localeCompare(String(b.date)));

  // how many curriculum rows mention a search term (so we only link terms that land somewhere)
  const hay = DATA.rows.map((r) =>
    [r.title, r.summary, r.historicalPrecedent, ...(r.coreTexts || []).flatMap((t) => [t.title, t.author])].join(' ').toLowerCase(),
  );
  const hits = (term) => (term ? hay.filter((h) => h.includes(term.toLowerCase())).length : 0);
  const tableLink = (term) => `index.html#q=${encodeURIComponent(term)}`;

  let active = '';
  const chipsEl = document.getElementById('categories');
  const listsEl = document.getElementById('lists');
  const canonEl = document.getElementById('canon');

  // the "shared canon": search terms that recur across several lists
  const freq = {};
  for (const l of lists) for (const t of new Set((l.entries || []).map((e) => e.search).filter(Boolean))) freq[t] = (freq[t] || 0) + 1;
  const canon = Object.entries(freq).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  canonEl.innerHTML = canon.length
    ? `<h2>The shared canon</h2><p class="intro" style="margin:0 0 8px">Authors, works and exercises that recur in four or more of the lists below. Click one to see where it appears in the curriculum.</p>
       <div class="chips">${canon.map(([t, n]) => `<a class="chip" href="${tableLink(t)}">${esc(t)} <small>×${n}</small></a>`).join('')}</div>`
    : '';

  function render() {
    chipsEl.innerHTML = [['', 'All'], ...Object.entries(CATEGORIES)]
      .map(([id, label]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="${active === id}">${esc(label)}</button>`)
      .join('');
    const shown = lists.filter((l) => !active || l.category === active);
    listsEl.innerHTML = shown.length
      ? shown
          .map(
            (l) => `<article class="list-card" id="${esc(l.id)}">
        <div class="meta"><span>${esc(CATEGORIES[l.category] || l.category)}</span>${l.date ? `<span>${esc(l.date)}</span>` : ''}${l.people?.length ? `<span>${esc(l.people.join(', '))}</span>` : ''}</div>
        <h2>${esc(l.title)}</h2>
        <p class="summary">${esc(l.summary)}</p>
        ${
          l.entries?.length
            ? `<details${l.entries.length <= 8 ? ' open' : ''}><summary>${l.entries.length} item${l.entries.length === 1 ? "" : "s"} on the list</summary><ol>${l.entries
                .map((e) => {
                  const n = hits(e.search);
                  const tracks = (e.tracks || []).map((t) => trackById[t]?.title || t).join(', ');
                  return `<li>${esc(e.text)}${n ? `<a href="${tableLink(e.search)}" title="${esc(tracks)}">→ ${n} unit${n > 1 ? 's' : ''}</a>` : ''}</li>`;
                })
                .join('')}</ol></details>`
            : ''
        }
        ${l.primarySources?.length ? `<div class="sources"><strong>Primary sources:</strong> ${l.primarySources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join(' · ')}</div>` : ''}
        ${l.notes ? `<p class="summary" style="color:var(--ink-2)">${esc(l.notes)}</p>` : ''}
      </article>`,
          )
          .join('')
      : '<p class="empty">No reading lists yet. Add YAML files to <code>data/founding/</code> and rebuild.</p>';
  }

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    active = b.dataset.cat;
    render();
  });
  render();
})();
