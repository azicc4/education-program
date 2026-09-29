// Sources page: curricula/programs vs primary sources (and secondary / instructional texts), organized by track.
(function () {
  const { DATA, esc, ageLabel, trackOrder, readerBadge, lengthLabel, showDetail } = window.App;
  const filtersEl = document.getElementById('src-filters');
  const mixEl = document.getElementById('mix');
  const tracksEl = document.getElementById('src-tracks');

  const KINDS = {
    curricula: { label: 'Curricula & programs', short: 'Curricula' },
    primary: { label: 'Primary sources', short: 'Primary' },
    secondary: { label: 'Secondary works', short: 'Secondary' },
    instructional: { label: 'Instructional texts', short: 'Instructional' },
  };
  const TRADITIONS = ['catholic', 'protestant', 'classical', 'secular'];
  const ELECTIVE = /\s*\(elective\)\s*$/i;

  // fallback until every text carries an explicit `kind`
  const INSTRUCTIONAL = /\b(grammar|primer|readers?|course|textbook|workbook|guide|handbook|manual|lessons?|exercises?|prep|review|introduction to|level [0-9ivx]+|for young catholics|course and exam|syllabus|method|drills?|flashcards?|practice)\b/i;
  const SECONDARY = /\b(history of|story of|tales from|for boys and girls|retold|life of|lives of the saints|famous men|our island story|a child's history|companion|commentary)\b/i;
  const kindOf = (t) => t.kind || (INSTRUCTIONAL.test(t.title) ? 'instructional' : SECONDARY.test(t.title) ? 'secondary' : 'primary');

  const norm = (s) => String(s || '').toLowerCase().replace(ELECTIVE, '').replace(/[^a-z0-9]+/g, ' ').trim();

  // ---------- aggregate once ----------
  const byTrack = {};
  for (const t of DATA.tracks) byTrack[t.id] = { track: t, curricula: new Map(), primary: new Map(), secondary: new Map(), instructional: new Map() };
  for (const r of DATA.rows) {
    const b = byTrack[r.track];
    if (!b) continue;
    for (const c of r.curriculumOptions || []) {
      const key = `${norm(c.name)}|${norm(c.publisher)}`;
      const e = b.curricula.get(key) || { item: c, units: [] };
      e.units.push(r);
      b.curricula.set(key, e);
    }
    for (const t of r.coreTexts || []) {
      const k = kindOf(t);
      const key = `${norm(t.title)}|${norm(t.author)}`;
      const e = b[k].get(key) || { item: t, units: [], elective: true };
      e.units.push(r);
      e.elective = e.elective && ELECTIVE.test(t.title);
      b[k].set(key, e);
    }
  }
  const firstAge = (e) => Math.min(...e.units.map((u) => u.ageStart));
  const sorted = (m) => [...m.values()].sort((a, b) => firstAge(a) - firstAge(b) || (a.item.title || a.item.name).localeCompare(b.item.title || b.item.name));

  // ---------- state ----------
  const state = { group: '', track: '', kinds: new Set(Object.keys(KINDS)), tradition: '', q: '' };

  const matchesQ = (e) => {
    if (!state.q) return true;
    const i = e.item;
    const hay = [i.title, i.name, i.author, i.publisher, i.notes, ...e.units.map((u) => u.title)].join(' ').toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  };
  const visible = (kind, e) => state.kinds.has(kind) && matchesQ(e) && (kind !== 'curricula' || !state.tradition || e.item.tradition === state.tradition);

  function renderFilters() {
    const tracks = DATA.tracks.filter((t) => !state.group || t.group === state.group);
    filtersEl.innerHTML = `
      <label>Subject <select id="s-group"><option value="">All subjects</option>${DATA.groups.map((g) => `<option${g.name === state.group ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label>Track <select id="s-track"><option value="">All tracks</option>${tracks.map((t) => `<option value="${esc(t.id)}"${t.id === state.track ? ' selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label>
      <div class="chips" role="group" aria-label="Show">${Object.entries(KINDS).map(([k, v]) => `<button type="button" class="chip kind-${k}" data-kind="${k}" aria-pressed="${state.kinds.has(k)}">${esc(v.short)}</button>`).join('')}</div>
      <label>Tradition <select id="s-trad"><option value="">Any</option>${TRADITIONS.map((t) => `<option${t === state.tradition ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <input type="search" id="s-q" placeholder="Search titles, authors, publishers…" value="${esc(state.q)}" aria-label="Search sources">`;
  }

  function unitChips(units) {
    const uniq = [...new Map(units.map((u) => [u.id, u])).values()].sort((a, b) => a.ageStart - b.ageStart);
    return `<div class="unit-links">${uniq.map((u) => `<button type="button" class="unit-chip" data-open="${esc(u.id)}" title="${esc(u.title)}">${esc(u.title.length > 42 ? u.title.slice(0, 41) + '…' : u.title)} <small>${esc(ageLabel(u))}</small></button>`).join('')}</div>`;
  }

  function itemHtml(kind, e) {
    const i = e.item;
    if (kind === 'curricula')
      return `<li><div class="src-head">${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)} ↗</a>` : esc(i.name)}${i.tradition ? ` <span class="badge trad-${esc(i.tradition)}">${esc(i.tradition)}</span>` : ''}</div>
        ${i.publisher ? `<div class="by">${esc(i.publisher)}</div>` : ''}${unitChips(e.units)}</li>`;
    const link = i.links?.[0];
    const title = esc(i.title.replace(ELECTIVE, ''));
    return `<li class="${e.elective ? 'elective' : ''}"><div class="src-head">${link ? `<a href="${esc(link.url)}" target="_blank" rel="noopener">${title} ↗</a>` : title}</div>
      <div class="src-meta">${i.author ? `<span class="by">${esc(i.author)}${i.date ? `, ${esc(i.date)}` : ''}</span>` : ''} ${readerBadge(i)} ${lengthLabel(i) ? `<span class="by">${lengthLabel(i)}</span>` : ''}${i.publicDomain ? ' <span class="badge pd">Free</span>' : ''}${e.elective ? ' <span class="badge elective">elective</span>' : ''}</div>
      ${unitChips(e.units)}</li>`;
  }

  function counts(b) {
    const c = {};
    for (const k of Object.keys(KINDS)) c[k] = [...b[k].values()].filter((e) => visible(k, e)).length;
    return c;
  }

  function render() {
    renderFilters();
    const tracks = DATA.tracks
      .filter((t) => (!state.group || t.group === state.group) && (!state.track || t.id === state.track))
      .sort((a, b) => trackOrder.indexOf(a.id) - trackOrder.indexOf(b.id));

    // mix overview: one stacked bar per track
    const rows = tracks.map((t) => ({ t, c: counts(byTrack[t.id]) }));
    const totals = rows.reduce((acc, { c }) => { for (const k in c) acc[k] = (acc[k] || 0) + c[k]; return acc; }, {});
    const max = Math.max(1, ...rows.map(({ c }) => Object.values(c).reduce((a, b) => a + b, 0)));
    mixEl.innerHTML = `
      <h2>The mix by track</h2>
      <div class="mix-legend">${Object.entries(KINDS).map(([k, v]) => `<span><i class="sw kind-${k}"></i>${esc(v.label)} <strong>${totals[k] || 0}</strong></span>`).join('')}</div>
      <div class="mix-rows">${rows
        .map(({ t, c }) => {
          const total = Object.values(c).reduce((a, b) => a + b, 0);
          const pctPrimary = total - c.curricula ? Math.round((100 * c.primary) / (total - c.curricula)) : 0;
          return `<a class="mix-row" href="#src-${esc(t.id)}">
            <span class="mix-name">${esc(t.title)}</span>
            <span class="mix-bar" style="width:${(100 * total) / max}%">${Object.keys(KINDS).map((k) => (c[k] ? `<i class="kind-${k}" style="flex:${c[k]}" title="${esc(KINDS[k].label)}: ${c[k]}"></i>` : '')).join('')}</span>
            <span class="mix-num">${c.curricula} · ${c.primary} · ${c.secondary} · ${c.instructional}${total - c.curricula ? ` <small>(${pctPrimary}% of texts primary)</small>` : ''}</span>
          </a>`;
        })
        .join('')}</div>
      <p class="by">Numbers are curricula · primary · secondary · instructional.</p>`;

    // one section per track
    let lastGroup = '';
    tracksEl.innerHTML = rows
      .map(({ t, c }) => {
        const b = byTrack[t.id];
        const head = t.group !== lastGroup && !state.track ? `<h2 class="src-group">${esc(t.group)}</h2>` : '';
        lastGroup = t.group;
        const cols = Object.keys(KINDS)
          .filter((k) => state.kinds.has(k))
          .map((k) => {
            const list = sorted(b[k]).filter((e) => visible(k, e));
            return `<div class="src-col"><h4 class="kind-title kind-${k}">${esc(KINDS[k].label)} <small>(${list.length})</small></h4>
              ${list.length ? `<ul class="src-list">${list.map((e) => itemHtml(k, e)).join('')}</ul>` : '<p class="by">None.</p>'}</div>`;
          })
          .join('');
        const any = Object.values(c).some(Boolean);
        return `${head}<section class="src-track" id="src-${esc(t.id)}">
          <h3>${esc(t.title)} <small>${c.curricula} curricula · ${c.primary} primary · ${c.secondary} secondary · ${c.instructional} instructional</small></h3>
          ${any ? `<div class="src-cols">${cols}</div>` : '<p class="by">Nothing matches the filters.</p>'}
        </section>`;
      })
      .join('');
  }

  filtersEl.addEventListener('change', (e) => {
    if (e.target.id === 's-group') { state.group = e.target.value; state.track = ''; }
    if (e.target.id === 's-track') state.track = e.target.value;
    if (e.target.id === 's-trad') state.tradition = e.target.value;
    render();
  });
  filtersEl.addEventListener('click', (e) => {
    const k = e.target.closest('[data-kind]');
    if (!k) return;
    const kind = k.dataset.kind;
    if (state.kinds.has(kind) && state.kinds.size > 1) state.kinds.delete(kind);
    else state.kinds.add(kind);
    render();
  });
  let qTimer;
  filtersEl.addEventListener('input', (e) => {
    if (e.target.id !== 's-q') return;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      state.q = e.target.value.trim();
      render();
      const q = document.getElementById('s-q');
      q.focus();
      q.setSelectionRange(q.value.length, q.value.length);
    }, 200);
  });
  const nav = (id) => showDetail(id, nav);
  tracksEl.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) nav(o.dataset.open);
  });
  render();
})();
