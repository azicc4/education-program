// Founding-era and 19th-century reading lists, each entry marked by use (reference / teacher / student)
// and linked to the exact curriculum units that teach it.
(function () {
  const { DATA, esc, rowById, trackTitle, ageLabel } = window.App;
  const lists = (window.FOUNDING?.lists || []).slice();
  const CATEGORIES = {
    'british-university': 'British & Irish universities',
    'colonial-college': 'Colonial colleges',
    treatise: 'Treatises on education',
    'founder-letter': "Founders' letters",
    '19th-century-school': '19th-century schooling',
  };
  const USES = {
    student: { label: 'Student reading', hint: 'assigned to the child in the curriculum' },
    teacher: { label: 'Teacher reading', hint: 'for parents and teachers running the program' },
    reference: { label: 'Curriculum reference', hint: 'a historical requirement or practice that shaped the design' },
  };
  const catOrder = Object.keys(CATEGORIES);
  lists.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || String(a.date).localeCompare(String(b.date)));

  // keyword fallback for entries not yet mapped to units
  const hay = DATA.rows.map((r) => [r.title, r.summary, ...(r.coreTexts || []).flatMap((t) => [t.title, t.author])].join(' ').toLowerCase());
  const hits = (term) => (term ? hay.filter((h) => h.includes(term.toLowerCase())).length : 0);
  const tableLink = (term) => `index.html#q=${encodeURIComponent(term)}`;

  let category = '';
  let use = '';
  const chipsEl = document.getElementById('categories');
  const listsEl = document.getElementById('lists');
  const canonEl = document.getElementById('canon');

  // the shared canon: search terms that recur across several lists
  const freq = {};
  for (const l of lists) for (const t of new Set((l.entries || []).map((e) => e.search).filter(Boolean))) freq[t] = (freq[t] || 0) + 1;
  const canon = Object.entries(freq).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  canonEl.innerHTML = `
    <h2>How to read these lists</h2>
    <p class="intro" style="margin:0 0 8px">Each item is marked by how the program uses it, and linked to the units that teach it:</p>
    <div class="use-legend">${Object.entries(USES).map(([k, u]) => `<span><span class="badge use-${k}">${u.label}</span> ${esc(u.hint)}</span>`).join('')}<span><span class="badge gap">Not yet in the curriculum</span> a student text the founders read that no unit assigns yet</span></div>
    ${canon.length ? `<h2 style="margin-top:14px">The shared canon</h2><p class="intro" style="margin:0 0 8px">Authors, works and exercises that recur in four or more of the lists below.</p>
    <div class="chips">${canon.map(([t, n]) => `<a class="chip" href="${tableLink(t)}">${esc(t)} <small>×${n}</small></a>`).join('')}</div>` : ''}`;

  const matchesUse = (e) => !use || (use === 'gap' ? e.gap : (e.use || []).includes(use));

  function entryHtml(e) {
    const badges = (e.use || []).map((k) => `<span class="badge use-${esc(k)}" title="${esc(USES[k]?.hint || '')}">${esc(USES[k]?.label || k)}</span>`).join(' ');
    const units = (e.units || []).map((id) => rowById[id]).filter(Boolean);
    let links = '';
    if (units.length)
      links = `<div class="unit-links">${units
        .map((r) => `<a class="unit-chip" href="index.html#row=${esc(r.id)}" title="${esc(trackTitle(r.track))}, age ${esc(ageLabel(r))}">${esc(r.title)} <small>${esc(trackTitle(r.track))} · ${esc(ageLabel(r))}</small></a>`)
        .join('')}</div>`;
    else if (e.gap) links = '<span class="badge gap">Not yet in the curriculum</span>';
    else if (!e.use && hits(e.search)) links = `<a class="unit-chip" href="${tableLink(e.search)}">Search the curriculum for “${esc(e.search)}”</a>`;
    return `<li><div class="entry-text">${esc(e.text)}</div>${badges || links ? `<div class="entry-meta">${badges}${links}</div>` : ''}</li>`;
  }

  function render() {
    const counts = { student: 0, teacher: 0, reference: 0, gap: 0 };
    for (const l of lists) if (!category || l.category === category) for (const e of l.entries || []) { for (const k of e.use || []) counts[k]++; if (e.gap) counts.gap++; }
    chipsEl.innerHTML = `${[['', 'All lists'], ...Object.entries(CATEGORIES)]
      .map(([id, label]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="${category === id}">${esc(label)}</button>`)
      .join('')}
      <span class="chip-sep"></span>
      ${[['', 'All items'], ['student', `Student readings (${counts.student})`], ['teacher', `Teacher readings (${counts.teacher})`], ['reference', `Curriculum references (${counts.reference})`], ['gap', `Gaps (${counts.gap})`]]
        .map(([id, label]) => `<button type="button" class="chip" data-use="${id}" aria-pressed="${use === id}">${esc(label)}</button>`)
        .join('')}`;
    const shown = lists
      .filter((l) => !category || l.category === category)
      .map((l) => ({ l, entries: (l.entries || []).filter(matchesUse) }))
      .filter((x) => !use || x.entries.length);
    listsEl.innerHTML = shown.length
      ? shown
          .map(({ l, entries }) => {
            const s = { student: 0, teacher: 0, reference: 0 };
            for (const e of l.entries || []) for (const k of e.use || []) s[k]++;
            return `<article class="list-card" id="${esc(l.id)}">
        <div class="meta"><span>${esc(CATEGORIES[l.category] || l.category)}</span>${l.date ? `<span>${esc(l.date)}</span>` : ''}${l.people?.length ? `<span>${esc(l.people.join(', '))}</span>` : ''}</div>
        <h2>${esc(l.title)}</h2>
        <p class="summary">${esc(l.summary)}</p>
        ${s.student + s.teacher + s.reference ? `<p class="list-counts">${s.student} student · ${s.teacher} teacher · ${s.reference} reference</p>` : ''}
        ${entries.length ? `<details${use || entries.length <= 8 ? ' open' : ''}><summary>${entries.length} item${entries.length === 1 ? '' : 's'}${use ? ' shown' : ' on the list'}</summary><ol class="entries">${entries.map(entryHtml).join('')}</ol></details>` : ''}
        ${l.primarySources?.length ? `<div class="sources"><strong>Primary sources:</strong> ${l.primarySources.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.label)} ↗</a>`).join(' · ')}</div>` : ''}
        ${l.notes ? `<p class="summary" style="color:var(--ink-2)">${esc(l.notes)}</p>` : ''}
      </article>`;
          })
          .join('')
      : '<p class="empty">No items match.</p>';
  }

  chipsEl.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    const u = e.target.closest('[data-use]');
    if (c) category = c.dataset.cat;
    if (u) use = u.dataset.use;
    if (c || u) render();
  });
  render();
})();
