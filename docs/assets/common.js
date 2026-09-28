// Shared helpers for all pages: data indexes, URL-hash state, filters, detail panel, theme.
(function () {
  const DATA = window.CURRICULUM || { levels: [], groups: [], tracks: [], rows: [] };
  const trackOrder = DATA.groups.flatMap((g) => g.tracks);
  const trackById = Object.fromEntries(DATA.tracks.map((t) => [t.id, t]));
  const rowById = Object.fromEntries(DATA.rows.map((r) => [r.id, r]));
  const levelById = Object.fromEntries(DATA.levels.map((l) => [l.id, l]));
  const levelOrder = DATA.levels.map((l) => l.id);

  // rows that list this row as a prerequisite
  const unlocks = {};
  for (const r of DATA.rows) for (const p of r.prerequisites || []) (unlocks[p] ||= []).push(r.id);

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const fmtAge = (n) => {
    if (n < 1 && n > 0) return `${Math.round(n * 12)} mo`;
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
  };
  const ageLabel = (r) => (r.ageStart === r.ageEnd ? fmtAge(r.ageStart) : `${fmtAge(r.ageStart)}–${fmtAge(r.ageEnd)}`);
  const levelBadge = (id) => `<span class="badge lvl-${esc(id)}">${esc(levelById[id]?.label ?? id)}</span>`;
  const trackTitle = (id) => trackById[id]?.title ?? id;

  // ---------- state in URL hash ----------
  const defaults = { level: [], group: '', track: '', q: '', sort: 'age', dir: 'asc', row: '' };
  function readState() {
    const p = new URLSearchParams(location.hash.slice(1));
    return {
      level: (p.get('level') || '').split(',').filter(Boolean),
      group: p.get('group') || '',
      track: p.get('track') || '',
      q: p.get('q') || '',
      sort: p.get('sort') || defaults.sort,
      dir: p.get('dir') || defaults.dir,
      row: p.get('row') || '',
    };
  }
  function writeState(state) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) {
      const val = Array.isArray(v) ? v.join(',') : v;
      if (val && val !== defaults[k]) p.set(k, val);
    }
    const hash = p.toString();
    history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
  }

  function matches(r, s) {
    if (s.level.length && !s.level.includes(r.level)) return false;
    if (s.group && r.trackGroup !== s.group) return false;
    if (s.track && r.track !== s.track) return false;
    if (s.q) {
      const hay = [
        r.title, r.summary, r.notes, r.historicalPrecedent, trackTitle(r.track), r.trackGroup,
        ...(r.objectives || []),
        ...(r.coreTexts || []).flatMap((t) => [t.title, t.author]),
        ...(r.curriculumOptions || []).flatMap((c) => [c.name, c.publisher]),
      ].join(' ').toLowerCase();
      if (!s.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  // ---------- filter bar ----------
  function renderFilters(el, state, onChange, { search = true } = {}) {
    const groupOpts = DATA.groups
      .map((g) => `<option value="${esc(g.name)}"${g.name === state.group ? ' selected' : ''}>${esc(g.name)}</option>`)
      .join('');
    const tracks = DATA.tracks.filter((t) => !state.group || t.group === state.group);
    const trackOpts = tracks
      .map((t) => `<option value="${esc(t.id)}"${t.id === state.track ? ' selected' : ''}>${esc(t.title)}</option>`)
      .join('');
    el.innerHTML = `
      <div class="chips" role="group" aria-label="School level">
        ${DATA.levels
          .map((l) => `<button type="button" class="chip" data-level="${esc(l.id)}" aria-pressed="${state.level.includes(l.id)}">${esc(l.label)}</button>`)
          .join('')}
      </div>
      <label>Subject <select data-f="group"><option value="">All subjects</option>${groupOpts}</select></label>
      <label>Track <select data-f="track"><option value="">All tracks</option>${trackOpts}</select></label>
      ${search ? `<input type="search" data-f="q" placeholder="Search titles, authors, texts…" value="${esc(state.q)}" aria-label="Search">` : ''}
      ${childSelect()}
      <button type="button" class="linkish" data-f="reset">Reset</button>
      <span class="count" aria-live="polite"></span>`;
    el.querySelector('[data-f="child"]')?.addEventListener('change', (e) => {
      window.Store.setActive(e.target.value);
      onChange(false);
    });

    el.querySelectorAll('[data-level]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.dataset.level;
        state.level = state.level.includes(id) ? state.level.filter((x) => x !== id) : [...state.level, id];
        onChange(true);
      }),
    );
    el.querySelector('[data-f="group"]').addEventListener('change', (e) => {
      state.group = e.target.value;
      if (state.track && trackById[state.track]?.group !== state.group && state.group) state.track = '';
      onChange(true);
    });
    el.querySelector('[data-f="track"]').addEventListener('change', (e) => {
      state.track = e.target.value;
      onChange(false);
    });
    const q = el.querySelector('[data-f="q"]');
    if (q) {
      let t;
      q.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          state.q = q.value.trim();
          onChange(false);
        }, 150);
      });
    }
    el.querySelector('[data-f="reset"]').addEventListener('click', () => {
      Object.assign(state, { level: [], group: '', track: '', q: '' });
      onChange(true);
    });
  }

  function childSelect() {
    const kids = window.Store?.children() || [];
    if (!kids.length) return '';
    const active = window.Store.activeChild;
    return `<label>Progress for <select data-f="child"><option value="">(none)</option>${kids
      .map((c) => `<option value="${esc(c.id)}"${c.id === active ? ' selected' : ''}>${esc(c.name)}</option>`)
      .join('')}</select></label>`;
  }

  const STATUS_LABEL = { '': 'Not started', active: 'In progress', done: 'Completed' };
  const statusBadge = (st) => (st ? `<span class="badge st-${st}">${st === 'done' ? '✓ Completed' : '● In progress'}</span>` : '');

  // per-child progress controls inside the detail panel
  function progressSection(r) {
    const S = window.Store;
    const kids = S?.children() || [];
    if (!kids.length) return `<h3>Progress</h3><p class="desc">Add your children on the <a href="family.html">Family</a> page to track progress and build each child's Bookshelf of Knowledge.</p>`;
    const texts = r.coreTexts || [];
    return `<h3>Progress</h3>${kids
      .map((c) => {
        const st = S.status(c.id, r.id);
        const rec = S.record(c.id, r.id);
        const btns = ['', 'active', 'done']
          .map((v) => `<button type="button" class="chip" data-status="${esc(c.id)}|${v}" aria-pressed="${st === v}">${STATUS_LABEL[v]}</button>`)
          .join('');
        const when = rec?.completed ? ` · completed ${esc(rec.completed)}` : rec?.started ? ` · started ${esc(rec.started)}` : '';
        const shelf = st && texts.length
          ? `<div class="shelf-picks">${texts
              .map((t, i) => {
                const on = S.onShelf(c.id, S.textKey(t));
                return `<label><input type="checkbox" data-shelf="${esc(c.id)}|${i}"${on ? ' checked' : ''}> ${esc(S.cleanTitle(t))}${S.isElective(t) ? ' <small>(elective)</small>' : ''}</label>`;
              })
              .join('')}<small class="desc">Checked texts are on ${esc(c.name)}'s Bookshelf of Knowledge.</small></div>`
          : '';
        return `<div class="child-progress"><div class="head"><strong>${esc(c.name)}</strong><small>${when}</small></div><div class="chips">${btns}</div>${shelf}</div>`;
      })
      .join('')}`;
  }

  // ---------- detail panel ----------
  let panel, backdrop, onNavigate, lastFocus, currentRow;
  function ensurePanel() {
    if (panel) return;
    backdrop = document.createElement('div');
    backdrop.className = 'detail-backdrop';
    backdrop.hidden = true;
    panel = document.createElement('aside');
    panel.className = 'detail';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'detail-title');
    document.body.append(backdrop, panel);
    backdrop.addEventListener('click', () => onNavigate(''));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) onNavigate('');
    });
    panel.addEventListener('change', (e) => {
      const cb = e.target.closest('[data-shelf]');
      if (!cb) return;
      const [cid, i] = cb.dataset.shelf.split('|');
      const r = rowById[currentRow];
      const t = r.coreTexts[+i];
      if (cb.checked) window.Store.addBook(cid, { ...t, rowId: r.id, track: r.track });
      else window.Store.removeBook(cid, window.Store.textKey(t));
    });
    panel.addEventListener('click', (e) => {
      const sb = e.target.closest('[data-status]');
      if (sb) {
        const [cid, st] = sb.dataset.status.split('|');
        const r = rowById[currentRow];
        window.Store.setStatus(cid, r.id, st);
        // completing a unit shelves its required (non-elective) texts
        if (st === 'done') for (const t of r.coreTexts || []) if (!window.Store.isElective(t)) window.Store.addBook(cid, { ...t, rowId: r.id, track: r.track });
        const top = panel.scrollTop;
        showDetail(r.id, onNavigate);
        panel.scrollTop = top;
        return;
      }
      const b = e.target.closest('[data-goto]');
      if (b) onNavigate(b.dataset.goto);
      if (e.target.closest('.close')) onNavigate('');
    });
  }

  const linkList = (links) =>
    links?.length ? `<div class="links">${links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || 'Link')} ↗</a>`).join('')}</div>` : '';
  const rowButtons = (ids) =>
    `<div class="navlinks">${ids
      .filter((id) => rowById[id])
      .map((id) => `<button type="button" data-goto="${esc(id)}">${esc(rowById[id].title)} <small>(${esc(trackTitle(rowById[id].track))}, age ${esc(ageLabel(rowById[id]))})</small></button>`)
      .join('')}</div>`;

  function showDetail(id, navigate) {
    ensurePanel();
    onNavigate = navigate;
    const r = rowById[id];
    if (!r) {
      if (!panel.hidden) lastFocus?.focus?.();
      panel.hidden = backdrop.hidden = true;
      return;
    }
    if (panel.hidden) lastFocus = document.activeElement;
    currentRow = r.id;
    const t = trackById[r.track];
    const texts = r.coreTexts || [];
    const opts = r.curriculumOptions || [];
    panel.innerHTML = `
      <button type="button" class="close" aria-label="Close">×</button>
      <div class="meta">${levelBadge(r.level)} <span>Age ${esc(ageLabel(r))}</span> · <span>${esc(r.trackGroup)} › ${esc(t?.title)}</span> · <span>${esc(r.type)}</span></div>
      <h2 id="detail-title">${esc(r.title)}</h2>
      <p>${esc(r.summary)}</p>
      ${progressSection(r)}
      ${r.objectives?.length ? `<h3>Objectives</h3><ul>${r.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
      ${
        texts.length
          ? `<h3>Core texts</h3>${texts
              .map(
                (x) => `<div class="text-item"><strong>${esc(x.title.replace(/\s*\(elective\)\s*$/i, ''))}</strong>${/\(elective\)\s*$/i.test(x.title) ? ' <span class="badge elective">elective</span>' : ''}${x.author ? ` <span class="by">— ${esc(x.author)}</span>` : ''}${x.date ? ` <span class="by">(${esc(x.date)})</span>` : ''} ${x.publicDomain ? '<span class="badge pd">Free / public domain</span>' : ''}${linkList(x.links)}</div>`,
              )
              .join('')}`
          : ''
      }
      ${
        opts.length
          ? `<h3>Curriculum options</h3>${opts
              .map(
                (c) => `<div class="option"><div class="head"><strong>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)} ↗</a>` : esc(c.name)}</strong>${c.publisher ? `<span class="by">${esc(c.publisher)}</span>` : ''}${c.tradition ? `<span class="badge trad-${esc(c.tradition)}">${esc(c.tradition)}</span>` : ''}</div>${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}</div>`,
              )
              .join('')}`
          : ''
      }
      ${r.historicalPrecedent ? `<h3>Historical precedent</h3><p class="precedent">${esc(r.historicalPrecedent)}</p>` : ''}
      ${r.notes ? `<h3>Notes</h3><p>${esc(r.notes)}</p>` : ''}
      ${r.sources?.length ? `<h3>Sources</h3>${linkList(r.sources)}` : ''}
      ${r.prerequisites?.length ? `<h3>Prerequisites</h3>${rowButtons(r.prerequisites)}` : ''}
      ${unlocks[r.id]?.length ? `<h3>Leads to</h3>${rowButtons(unlocks[r.id])}` : ''}
      ${r.related?.filter((x) => rowById[x]).length ? `<h3>Related in other tracks</h3>${rowButtons(r.related)}` : ''}
      ${t?.description ? `<h3>About the ${esc(t.title)} track</h3><p class="desc">${esc(t.description)}</p>` : ''}
    `;
    panel.hidden = backdrop.hidden = false;
    panel.scrollTop = 0;
    panel.querySelector('.close').focus();
  }

  // ---------- theme toggle ----------
  function initTheme() {
    const btn = document.querySelector('.theme-toggle');
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch {}
    if (saved) document.documentElement.dataset.theme = saved;
    if (!btn) return;
    const current = () =>
      document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const label = () => (btn.textContent = current() === 'dark' ? '☀ Light' : '☾ Dark');
    label();
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch {}
      label();
    });
  }
  initTheme();

  window.App = {
    DATA, trackOrder, trackById, rowById, levelById, levelOrder, unlocks,
    esc, ageLabel, fmtAge, levelBadge, trackTitle, statusBadge,
    readState, writeState, matches, renderFilters, showDetail,
  };
})();
