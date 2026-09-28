// Skill tree: one swimlane per track on a shared age axis, with prerequisite arrows.
(function () {
  const { DATA, esc, ageLabel, fmtAge, readState, writeState, matches, renderFilters, showDetail } = window.App;

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
  const filtersEl = document.getElementById('filters');
  const tree = document.getElementById('tree');
  const x = (age) => LABEL_W + age * PX_PER_YEAR;
  const width = LABEL_W + MAX_AGE * PX_PER_YEAR;

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

  function render() {
    const tracks = DATA.tracks.filter((t) => (!state.group || t.group === state.group) && (!state.track || t.id === state.track));
    const shown = new Set(DATA.rows.filter((r) => matches(r, { ...state, group: '', track: '' })).map((r) => r.id));
    const count = DATA.rows.filter((r) => shown.has(r.id) && tracks.some((t) => t.id === r.track)).length;
    filtersEl.querySelector('.count').textContent = `${count} units highlighted in ${tracks.length} track${tracks.length === 1 ? "" : "s"}`;

    const axis = Array.from({ length: MAX_AGE }, (_, a) => `<span style="left:${x(a)}px">${a === 0 ? 'Birth' : fmtAge(a)}</span>`).join('');
    const bandLabels = BANDS.map((b) => `<b class="${b.cls}" style="left:${x(b.age)}px">${esc(b.label)}</b>`).join('');
    const bands = BANDS.map((b) => `<div class="tree-level-band" style="left:${x(b.age)}px"></div>`).join('');

    const lanes = tracks
      .map((t) => {
        const rows = DATA.rows.filter((r) => r.track === t.id);
        const { pos, height } = layoutTrack(rows);
        const arrows = rows.flatMap((r) => (r.prerequisites || []).filter((p) => pos[p]).map((p) => arrow(pos[p], pos[r.id]))).join('');
        const nodes = rows
          .map((r) => {
            const p = pos[r.id];
            const st = window.Store?.status(window.Store.activeChild, r.id);
            const cls = ['node', `lvl-${r.level}`, shown.has(r.id) ? '' : 'dim', r.id === state.row ? 'selected' : '', st ? `st-${st}` : ''].join(' ');
            return `<button type="button" class="${cls}" data-id="${esc(r.id)}" style="left:${p.left}px;top:${p.top}px;width:${p.w}px" title="${esc(r.title)} (age ${esc(ageLabel(r))})"><span>${st === 'done' ? '✓ ' : st === 'active' ? '● ' : ''}${esc(r.title)}</span></button>`;
          })
          .join('');
        return `<section class="lane" style="height:${height}px" aria-label="${esc(t.title)} track">
          <div class="lane-label">${esc(t.title)}<small>${esc(t.group)} · ${rows.length} units</small></div>
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
      ${lanes || '<p class="empty">No tracks match these filters.</p>'}`;
  }

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

  renderFilters(filtersEl, state, update);
  render();
  window.Store?.onChange(render);
  if (state.row) openRow(state.row);
})();
