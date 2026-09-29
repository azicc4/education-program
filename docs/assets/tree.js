// Skill tree: one swimlane per track on a shared age axis, with prerequisite arrows.
(function () {
  const { DATA, esc, ageLabel, fmtAge, readState, writeState, matches, renderFilters, showDetail, readerBadge, lengthLabel, trackById } = window.App;

  const LABEL_W = 150;
  const PX_PER_YEAR = 110;
  const MAX_AGE = 19;
  const NODE_H = 44;
  const GAP = 6;
  const MIN_W = 128;
  const BANDS = [
    { age: 0, label: 'Early development', cls: 'lvl-early-5' },
    { age: 6.5, label: 'Grades 1–5', cls: 'lvl-early-5' },
    { age: 10, label: 'Grades 6–8', cls: 'lvl-6-8' },
    { age: 12.5, label: 'Grades 9–12', cls: 'lvl-9-12' },
    { age: 16.75, label: 'College', cls: 'lvl-college' },
  ];

  const state = readState();
  const S = window.Store;
  window.Demo.topUp(DATA, S); // demo children loaded before bookshelves were seeded get their books now
  const filtersEl = document.getElementById('filters');
  const childSel = document.getElementById('tree-child');
  const nowBtn = document.getElementById('now-toggle');
  // whose progress the lanes show; "Current Age" (on unless turned off) keeps only the units that fit that child now
  const who = () => {
    const w = window.App.childFor(state.child || window.App.defaultChild()) || window.App.childFor('demo:demo-thomas');
    state.child = w.key === window.App.defaultChild() ? '' : w.key;
    return w;
  };
  const nowOn = () => state.now !== 'off';
  let shown = { current: [], next: [], who: null };
  const tree = document.getElementById('tree');
  const x = (age) => LABEL_W + age * PX_PER_YEAR;
  const width = LABEL_W + MAX_AGE * PX_PER_YEAR;

  // ---------- snapshot bookshelf: a draggable age cursor snapping to quarter-years ----------
  const layout = document.getElementById('tree-layout');
  const snapEl = document.getElementById('snapshot');
  const snapToggle = document.getElementById('snap-toggle');
  const scroller = document.querySelector('.tree-scroll');
  let snapAge = state.at !== '' && !isNaN(+state.at) ? +state.at : null;
  let visibleTracks = [];
  const ELECTIVE = /\s*\(elective[^)]*\)\s*$/i;
  const snapTo = (a) => Math.min(MAX_AGE - 0.25, Math.max(0, Math.round(a * 4) / 4));
  const quarterLabel = (a) => {
    const whole = Math.floor(a);
    const q = Math.round((a - whole) * 4);
    return `Age ${whole}${['', '¼', '½', '¾'][q]} · Q${q + 1} of year ${whole}`;
  };
  const atCursor = (r, a) => !!r && r.ageStart <= a && (a < r.ageEnd || (r.ageStart === r.ageEnd && a === r.ageStart));
  const READERS = [['teacher', 'Teacher reads'], ['together', 'Read together'], ['student', 'Student reads'], ['', 'Reader not yet marked']];

  function renderSnapshot() {
    if (snapAge == null) return;
    const trackIds = new Set(visibleTracks.map((t) => t.id));
    const order = (r) => visibleTracks.findIndex((t) => t.id === r.track);
    const rows = DATA.rows.filter((r) => trackIds.has(r.track) && atCursor(r, snapAge)).sort((a, b) => order(a) - order(b) || a.order - b.order);
    const texts = rows.flatMap((r) => (r.coreTexts || []).map((t) => ({ t, r })));
    const pages = (list) => list.reduce((n, it) => n + (+it.t.pages || 0), 0);
    const totals = READERS.map(([k, label]) => {
      const list = texts.filter((it) => (it.t.reader || '') === k);
      return list.length ? `<li><strong>${list.length}</strong> ${esc(label.toLowerCase())}${pages(list) ? ` · ${pages(list).toLocaleString()} pp` : ''}</li>` : '';
    }).join('');
    let lastTrack = '';
    const body = rows
      .map((r) => {
        const head = r.track !== lastTrack ? `<h3>${esc(trackById[r.track]?.title || r.track)}</h3>` : '';
        lastTrack = r.track;
        const items = window.App.textsHtml(
          r,
          (t, plan) => {
            const elective = ELECTIVE.test(t.title);
            const len = lengthLabel(t);
            return `<li class="${elective ? 'elective' : ''}"><span class="t">${esc(t.title.replace(ELECTIVE, ''))}</span>${t.author ? ` <span class="by">${esc(t.author)}</span>` : ''}
              <div class="meta">${window.App.planBadges(t, plan)} ${readerBadge(t)}${len ? ` <span class="by">${len}</span>` : ''}${elective ? ' <span class="badge elective">elective</span>' : ''}${t.publicDomain ? ' <span class="badge pd">Free</span>' : ''}</div></li>`;
          },
          (group) => `<li class="snap-choice"><span class="choice-head">Choose one</span><ul>${group}</ul></li>`,
        );
        const load = window.App.loadText(window.App.readingPlan(r));
        return `${head}<div class="snap-unit"><button type="button" class="linkish" data-open="${esc(r.id)}">${esc(r.title)}</button> <small>(${esc(ageLabel(r))})</small>${load ? `<p class="load">${esc(load)}</p>` : ''}${items ? `<ul>${items}</ul>` : '<p class="by">No listed texts (practice or skills unit).</p>'}</div>`;
      })
      .join('');
    snapEl.innerHTML = `
      <div class="snap-head">
        <h2>Snapshot Bookshelf</h2>
        <div class="snap-age">${esc(quarterLabel(snapAge))}</div>
        <div class="snap-nav"><button type="button" class="chip" data-step="-0.25" aria-label="Back one quarter">◀ quarter</button><button type="button" class="chip" data-step="0.25" aria-label="Forward one quarter">quarter ▶</button></div>
        <p class="by">${rows.length} units in progress across ${new Set(rows.map((r) => r.track)).size} tracks · ${texts.length} texts${pages(texts) ? ` · ${pages(texts).toLocaleString()} pp` : ''}</p>
        ${totals ? `<ul class="snap-totals">${totals}</ul>` : ''}
      </div>
      ${body || '<p class="empty">No units at this point in the visible tracks.</p>'}`;
  }

  function placeCursor() {
    const c = tree.querySelector('.snap-cursor');
    if (!c || snapAge == null) return;
    c.style.left = `${x(snapAge)}px`;
    const h = c.querySelector('.snap-handle');
    h.textContent = quarterLabel(snapAge).split(' · ')[0];
    h.setAttribute('aria-valuenow', snapAge);
    h.setAttribute('aria-valuetext', quarterLabel(snapAge));
    tree.querySelectorAll('.node').forEach((n) => n.classList.toggle('at-cursor', atCursor(rowIndex[n.dataset.id], snapAge)));
  }
  const rowIndex = Object.fromEntries(DATA.rows.map((r) => [r.id, r]));

  function setSnap(a, { persist = true } = {}) {
    snapAge = a == null ? null : snapTo(a);
    state.at = snapAge == null ? '' : String(snapAge);
    if (persist) writeState(state);
    placeCursor();
    renderSnapshot();
  }

  function toggleSnapshot(on) {
    layout.classList.toggle('snap-on', on);
    snapEl.hidden = !on;
    snapToggle.setAttribute('aria-pressed', on);
    if (on && snapAge == null) snapAge = 10;
    if (!on) snapAge = null;
    state.at = snapAge == null ? '' : String(snapAge);
    writeState(state);
    render();
    if (on) scroller.scrollLeft = Math.max(0, x(snapAge) - scroller.clientWidth / 2);
  }

  snapToggle.addEventListener('click', () => toggleSnapshot(snapAge == null));
  snapEl.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) return openRow(o.dataset.open);
    const st = e.target.closest('[data-step]');
    if (st) setSnap(snapAge + +st.dataset.step);
  });

  // drag the cursor (or press anywhere on the age axis) to move it
  let dragging = false;
  const ageFromEvent = (e) => (e.clientX - tree.getBoundingClientRect().left - LABEL_W) / PX_PER_YEAR;
  tree.addEventListener('pointerdown', (e) => {
    if (snapAge == null || !e.target.closest('.snap-handle, .snap-cursor, .tree-axis')) return;
    dragging = true;
    tree.setPointerCapture?.(e.pointerId);
    setSnap(ageFromEvent(e), { persist: false });
    e.preventDefault();
  });
  tree.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const a = snapTo(ageFromEvent(e));
    if (a !== snapAge) setSnap(a, { persist: false });
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    writeState(state);
  };
  tree.addEventListener('pointerup', endDrag);
  tree.addEventListener('pointercancel', endDrag);
  tree.addEventListener('keydown', (e) => {
    if (!e.target.closest('.snap-handle')) return;
    const step = { ArrowLeft: -0.25, ArrowRight: 0.25, PageDown: -1, PageUp: 1 }[e.key];
    if (step) {
      e.preventDefault();
      setSnap(snapAge + step);
    }
  });

  // greedy interval packing so overlapping units in a track stack instead of colliding
  function layoutTrack(rows) {
    const lanesEnd = [];
    const pos = {};
    for (const r of [...rows].sort((a, b) => a.ageStart - b.ageStart || a.order - b.order)) {
      const left = x(r.ageStart) + 2;
      const w = Math.max((r.ageEnd - r.ageStart) * PX_PER_YEAR - 4, MIN_W);
      let lane = lanesEnd.findIndex((end) => end + GAP <= left);
      if (lane === -1) lane = lanesEnd.push(0) - 1;
      lanesEnd[lane] = left + w;
      pos[r.id] = { left, w, top: GAP + lane * (NODE_H + GAP) };
    }
    return { pos, height: Math.max(1, lanesEnd.length) * (NODE_H + GAP) + GAP };
  }

  function arrow(a, b) {
    const ay = a.top + NODE_H / 2;
    const by = b.top + NODE_H / 2;
    const ax = a.left + a.w;
    if (ax <= b.left - 8) {
      const mid = (ax + b.left) / 2;
      return `<path d="M${ax},${ay} C${mid},${ay} ${mid},${by} ${b.left},${by}" marker-end="url(#arrowhead)"/>`;
    }
    // overlapping in time: drop from the bottom of the prerequisite into the dependent's left edge
    const sx = Math.min(a.left + 16, b.left - 6);
    const sy = a.top + (b.top > a.top ? NODE_H : 0);
    return `<path d="M${sx},${sy} C${sx},${by} ${sx},${by} ${b.left},${by}" marker-end="url(#arrowhead)"/>`;
  }

  function syncChild(w) {
    childSel.innerHTML = window.App.childOptions().map(([v, l]) => `<option value="${esc(v)}"${v === w.key ? ' selected' : ''}>${esc(l)}</option>`).join('');
    nowBtn.setAttribute('aria-pressed', String(nowOn()));
  }

  function render() {
    const w = who();
    syncChild(w);
    const inFilter = DATA.tracks.filter((t) => (!state.group || t.group === state.group) && (!state.track || t.id === state.track));
    // with Current Age on, each lane keeps only its current units, and lanes with none (finished or not begun) go
    const laneRows = new Map();
    const current = [], next = [];
    for (const t of inFilter) {
      const rows = DATA.rows.filter((r) => r.track === t.id);
      const now = window.App.nowUnits(rows, w);
      if (nowOn() && !now.length) continue;
      laneRows.set(t.id, nowOn() ? now : rows);
      current.push(...(nowOn() ? now : rows));
      next.push(...window.App.nextUnits(rows, now, w));
    }
    const tracks = inFilter.filter((t) => laneRows.has(t.id));
    shown = { current, next, who: w };
    visibleTracks = tracks;
    const shown_ = new Set(DATA.rows.filter((r) => matches(r, { ...state, group: '', track: '' })).map((r) => r.id));
    const count = current.filter((r) => shown_.has(r.id)).length;
    const hidden = inFilter.length - tracks.length;
    filtersEl.querySelector('.count').textContent = `${count} ${nowOn() ? `current unit${count === 1 ? '' : 's'} for ${w.name}` : `unit${count === 1 ? '' : 's'} highlighted`} in ${tracks.length} track${tracks.length === 1 ? '' : 's'}${nowOn() && hidden ? ` · ${hidden} finished or not begun hidden` : ''}`;

    const axis = Array.from({ length: MAX_AGE }, (_, a) => `<span style="left:${x(a)}px">${a === 0 ? 'Birth' : fmtAge(a)}</span>`).join('');
    const bandLabels = BANDS.map((b) => `<b class="${b.cls}" style="left:${x(b.age)}px">${esc(b.label)}</b>`).join('');
    const bands = BANDS.map((b) => `<div class="tree-level-band" style="left:${x(b.age)}px"></div>`).join('');

    const lanes = tracks
      .map((t) => {
        const rows = laneRows.get(t.id);
        const { pos, height } = layoutTrack(rows);
        const arrows = rows.flatMap((r) => (r.prerequisites || []).filter((p) => pos[p]).map((p) => arrow(pos[p], pos[r.id]))).join('');
        const nodes = rows
          .map((r) => {
            const p = pos[r.id];
            const st = w.status(r.id);
            const cls = ['node', `lvl-${r.level}`, shown_.has(r.id) ? '' : 'dim', r.id === state.row ? 'selected' : '', st ? `st-${st}` : ''].join(' ');
            return `<button type="button" class="${cls}" data-id="${esc(r.id)}" style="left:${p.left}px;top:${p.top}px;width:${p.w}px" title="${esc(r.title)} (age ${esc(ageLabel(r))})"><span>${st === 'done' ? '✓ ' : st === 'active' ? '● ' : ''}${esc(r.title)}</span></button>`;
          })
          .join('');
        return `<section class="lane" style="height:${height}px" aria-label="${esc(t.title)} track">
          <div class="lane-label">${esc(t.title)}<small>${esc(t.group)} · ${rows.length} unit${rows.length === 1 ? '' : 's'}${nowOn() ? ' now' : ''}</small></div>
          <svg width="${width}" height="${height}" aria-hidden="true">${arrows}</svg>
          ${nodes}
        </section>`;
      })
      .join('');

    tree.style.width = `${width}px`;
    tree.innerHTML = `
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--ink-2);stroke:none;opacity:.7"/></marker></defs></svg>
      <div class="tree-axis">${bandLabels}${axis}</div>
      ${bands}
      <div class="tree-now" style="left:${x(w.age)}px" aria-hidden="true"><span>${esc(w.name)} · ${esc(window.App.quarterAge(w.age))}</span></div>
      ${lanes || '<p class="empty">No tracks match these filters.</p>'}
      ${snapAge != null ? `<div class="snap-cursor"><span class="snap-handle" role="slider" tabindex="0" aria-label="Snapshot age" aria-valuemin="0" aria-valuemax="${MAX_AGE - 0.25}"></span></div>` : ''}`;
    placeCursor();
    renderSnapshot();
    // with Current Age on, open the lanes at the child's age instead of at birth (once per child)
    if (nowOn() && snapAge == null && scrolledFor !== w.key) {
      scrolledFor = w.key;
      scroller.scrollLeft = Math.max(0, x(w.age) - scroller.clientWidth / 3);
    }
  }
  let scrolledFor = '';

  function openRow(id) {
    state.row = id;
    writeState(state);
    tree.querySelectorAll('.node.selected').forEach((n) => n.classList.remove('selected'));
    if (id) tree.querySelector(`.node[data-id="${CSS.escape(id)}"]`)?.classList.add('selected');
    showDetail(id, openRow);
  }

  function update(rebuildFilters) {
    writeState(state);
    if (rebuildFilters) renderFilters(filtersEl, state, update);
    render();
  }

  tree.addEventListener('click', (e) => {
    const n = e.target.closest('.node');
    if (n) openRow(n.dataset.id);
  });

  childSel.addEventListener('change', () => {
    state.child = childSel.value;
    if (state.child.startsWith('store:')) S.setActive(state.child.slice(6));
    update(false);
  });
  nowBtn.addEventListener('click', () => {
    state.now = nowOn() ? 'off' : 'on';
    update(false);
  });
  document.getElementById('tree-print').addEventListener('click', () => window.App.printBooklist(shown));

  renderFilters(filtersEl, state, update, { child: false });
  if (snapAge != null) {
    layout.classList.add('snap-on');
    snapEl.hidden = false;
    snapToggle.setAttribute('aria-pressed', 'true');
  }
  render();
  if (snapAge != null) scroller.scrollLeft = Math.max(0, x(snapAge) - scroller.clientWidth / 2);
  window.Store?.onChange(render);
  if (state.row) openRow(state.row);
})();
