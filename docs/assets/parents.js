// Parent Curriculum: plans by stage, the marriage track, the family program and the booklist (data/parents/).
(function () {
  const { esc, rowById } = window.App;
  const P = window.PARENTS || { items: [], plans: null };
  const plans = P.plans || {};
  const byId = Object.fromEntries(P.items.map((x) => [x.id, x]));
  const $ = (id) => document.getElementById(id);
  const view = $('parents-view');
  const params = new URLSearchParams(location.hash.slice(1));
  let tab = params.get('tab') || 'stages';
  const f = { q: '', stage: '', trait: '', evidence: '', audience: '', section: '' };

  const EVIDENCE = { research: 'Research', clinical: 'Clinical guide or program', 'popular-science': 'Popular science', popular: 'Popular', historic: 'Historic', faith: 'Faith tradition' };
  const STAGES = { pregnancy: 'Pregnancy', '0-1': 'Birth to 1', '1-3': '1 to 3', '3-6': '3 to 6', '6-12': '6 to 12', '12-18': '12 to 18', adult: 'Adult', all: 'All ages' };
  const SECTIONS = { 'child-development': 'Raising children: the research', family: 'Marriage, family and programs', historic: 'Historic and faith classics' };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
  const first = (x) => (x.links || [])[0];

  // a short reference with a link, used inside the plans
  const ref = (id) => {
    const x = byId[id];
    if (!x) return '';
    const l = first(x);
    return `<li><a href="${esc(l?.url || '#')}" target="_blank" rel="noopener"><strong>${esc(x.title)}</strong></a> <span class="by">${esc(x.author)}, ${esc(x.year)}</span> <span class="badge ev-${esc(x.evidence)}">${esc(EVIDENCE[x.evidence] || x.evidence)}</span> <button type="button" class="linkish" data-book="${esc(x.id)}">Summary</button></li>`;
  };
  const refs = (ids) => (ids?.length ? `<ul class="refs">${ids.map(ref).join('')}</ul>` : '');
  const units = (ids) => (ids?.length ? `<div class="unit-links">${ids.filter((id) => rowById[id]).map((id) => `<a class="unit-chip" href="index.html#row=${esc(id)}">${esc(rowById[id].title)} <small>age ${esc(window.App.ageLabel(rowById[id]))}</small></a>`).join('')}</div>` : '');
  const list = (xs) => (xs?.length ? `<ul class="plain">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');

  function card(x) {
    return `<article class="book-card" id="b-${esc(x.id)}">
      <div class="bk-head"><a href="${esc(first(x)?.url || '#')}" target="_blank" rel="noopener" class="bk-title">${esc(x.title)}</a> <span class="by">${esc(x.author)} · ${esc(x.year)}</span></div>
      <div class="bk-meta"><span class="badge ev-${esc(x.evidence)}">${esc(EVIDENCE[x.evidence] || x.evidence)}</span><span class="badge">${esc(cap(x.kind))}</span>${(x.stages || []).map((s) => `<span class="badge st">${esc(STAGES[s] || s)}</span>`).join('')}${(x.audience || []).map((a) => `<span class="badge au">${esc(cap(a))}</span>`).join('')}</div>
      <p>${esc(x.summary)}</p>
      ${x.caveats ? `<p class="bk-caveat"><strong>Caveats.</strong> ${esc(x.caveats)}</p>` : ''}
      <div class="bk-traits">${(x.traits || []).map((t) => `<span class="trait">${esc(cap(t))}</span>`).join('')}</div>
      <div class="links">${(x.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || 'Link')} ↗</a>`).join('')}</div>
      ${x.citation ? `<details><summary>Citation</summary><p class="by">${esc(x.citation)}</p></details>` : ''}
    </article>`;
  }

  function renderStages() {
    const core = plans.core;
    const stages = (plans.stages || [])
      .map(
        (s) => `<section class="panel-card stage" id="st-${esc(s.id)}">
        <h2>${esc(s.label)} <small>${esc(s.ages)}</small></h2>
        <p>${esc(s.focus)}</p>
        <div class="stage-grid">
          <div><h3>Aims</h3>${list(s.aims)}<h3>Practices</h3>${list(s.practices)}</div>
          <div><h3>Read, in this order</h3>${refs(s.read)}${s.further?.length ? `<details><summary>Further reading (${s.further.length})</summary>${refs(s.further)}</details>` : ''}</div>
        </div>
        <h3>When to seek help</h3><p class="desc">${esc(s.help)}</p>${refs(s.helpRead)}
        ${s.units?.length ? `<h3>The children's units at this stage</h3>${units(s.units)}` : ''}
      </section>`,
      )
      .join('');
    const jump = (plans.stages || []).map((s) => `<a class="chip" href="#st-${esc(s.id)}">${esc(s.label)}</a>`).join('');
    return `${core ? `<section class="panel-card"><h2>${esc(core.label)} <small>start here</small></h2><p class="desc">${esc(core.note)}</p><ol class="refs">${core.read.map(ref).join('')}</ol></section>` : ''}
      <nav class="chips stage-jump" aria-label="Stages">${jump}</nav>${stages}`;
  }

  function renderMarriage() {
    const m = plans.marriage || {};
    return `<section class="panel-card"><h2>${esc(m.label || 'Marriage')}</h2><p>${esc(m.note || '')}</p>
      <div class="stage-grid"><div><h3>Practices</h3>${list(m.practices)}</div><div><h3>Read</h3>${refs(m.read)}</div></div>
      <h3>The research behind it</h3>${refs(m.research)}
      <h3>Counseling</h3><p class="desc">${esc(m.help || '')}</p>${refs(m.helpRead)}</section>`;
  }

  function renderFamily() {
    const fm = plans.family || {};
    return `<section class="panel-card"><h2>${esc(fm.label || 'Family program')}</h2><p>${esc(fm.note || '')}</p>
      ${(fm.levels || []).map((l) => `<h3>${esc(l.label)}</h3>${list(l.parts)}`).join('')}
      <h3>The children's part</h3>
      <div class="table-wrap"><table class="wl-table"><thead><tr><th>Ages</th><th>Role in the family</th><th>Reading</th><th>Units in the children's curriculum</th></tr></thead><tbody>${(fm.children || [])
        .map((c) => `<tr><td>${esc(c.ages)}</td><td>${esc(c.role)}</td><td>${refs(c.read)}</td><td>${units(c.units)}</td></tr>`)
        .join('')}</tbody></table></div>
      <h3>Sources</h3>${refs(fm.sources)}</section>`;
  }

  function filtered() {
    const q = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    return P.items.filter((x) => {
      if (f.section && x.section !== f.section) return false;
      if (f.stage && !(x.stages || []).includes(f.stage) && !(x.stages || []).includes('all')) return false;
      if (f.trait && !(x.traits || []).includes(f.trait)) return false;
      if (f.evidence && x.evidence !== f.evidence) return false;
      if (f.audience && !(x.audience || []).includes(f.audience)) return false;
      if (q.length) {
        const hay = [x.title, x.author, x.summary, x.caveats, ...(x.traits || [])].join(' ').toLowerCase();
        if (!q.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }
  function renderBooks() {
    const opt = (k, o, label) => `<label>${label} <select data-pf="${k}"><option value="">Any</option>${Object.entries(o).map(([v, l]) => `<option value="${esc(v)}"${f[k] === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const traits = Object.fromEntries([...new Set(P.items.flatMap((x) => x.traits || []))].sort().map((t) => [t, cap(t)]));
    const audiences = Object.fromEntries([...new Set(P.items.flatMap((x) => x.audience || []))].map((a) => [a, cap(a)]));
    const items = filtered();
    const groups = Object.keys(SECTIONS).map((s) => [s, items.filter((x) => x.section === s).sort((a, b) => a.year - b.year)]).filter(([, xs]) => xs.length);
    return `<div class="filters">${opt('section', SECTIONS, 'Section')}${opt('stage', STAGES, 'Stage')}${opt('trait', traits, 'Trait')}${opt('evidence', EVIDENCE, 'Evidence')}${opt('audience', audiences, 'For')}
        <input type="search" data-pf="q" placeholder="Search titles, authors, summaries…" value="${esc(f.q)}" aria-label="Search the booklist">
        <span class="count">${items.length} of ${P.items.length}</span></div>
      ${groups.map(([s, xs]) => `<h2 class="bk-group">${esc(SECTIONS[s])} <small>${xs.length}</small></h2><div class="book-grid">${xs.map(card).join('')}</div>`).join('') || '<p class="empty">Nothing matches these filters.</p>'}`;
  }

  function render() {
    $('parents-intro').textContent = plans.intro || '';
    document.querySelectorAll('[data-ptab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ptab === tab)));
    view.innerHTML = tab === 'books' ? renderBooks() : tab === 'marriage' ? renderMarriage() : tab === 'family' ? renderFamily() : renderStages();
  }

  document.querySelectorAll('[data-ptab]').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.ptab;
      history.replaceState(null, '', `#tab=${tab}`);
      render();
    }),
  );
  view.addEventListener('change', (e) => {
    const s = e.target.closest('select[data-pf]');
    if (s) { f[s.dataset.pf] = s.value; render(); }
  });
  let t;
  view.addEventListener('input', (e) => {
    const s = e.target.closest('input[data-pf]');
    if (!s) return;
    clearTimeout(t);
    t = setTimeout(() => { f.q = s.value.trim(); render(); const i = view.querySelector('input[data-pf]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 150);
  });
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (b && byId[b.dataset.book]) window.App.modal(card(byId[b.dataset.book]), { label: byId[b.dataset.book].title });
  });
  render();
})();
