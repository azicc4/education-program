// Master table: sortable, filterable, with a detail panel.
(function () {
  const { DATA, trackOrder, levelOrder, esc, ageLabel, levelBadge, trackTitle, statusBadge, readState, writeState, matches, renderFilters, showDetail } = window.App;

  const state = readState();
  const filtersEl = document.getElementById('filters');
  const tbody = document.querySelector('#table tbody');
  const headers = document.querySelectorAll('#table th[data-sort]');

  const byAge = (a, b) => a.ageStart - b.ageStart || a.ageEnd - b.ageEnd;
  const byTrack = (a, b) => trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track);
  const byOrder = (a, b) => a.order - b.order;
  const comparators = {
    age: (a, b) => byAge(a, b) || byTrack(a, b) || byOrder(a, b),
    level: (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level) || byAge(a, b) || byTrack(a, b),
    track: (a, b) => byTrack(a, b) || byOrder(a, b) || byAge(a, b),
    title: (a, b) => a.title.localeCompare(b.title),
  };

  function sorted(rows) {
    const cmp = comparators[state.sort] || comparators.age;
    const out = [...rows].sort(cmp);
    return state.dir === 'desc' ? out.reverse() : out;
  }

  // section breaks make the "skill tree" order legible when sorted by track or level
  function breakKey(r) {
    if (state.sort === 'track') return `${r.trackGroup} › ${trackTitle(r.track)}`;
    if (state.sort === 'level') return App.levelById[r.level]?.label;
    return null;
  }

  function renderRows() {
    const rows = sorted(DATA.rows.filter((r) => matches(r, state)));
    filtersEl.querySelector('.count').textContent = `${rows.length} of ${DATA.rows.length} units`;
    headers.forEach((th) => th.setAttribute('aria-sort', th.dataset.sort === state.sort ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none'));
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No units match these filters.</td></tr>`;
      return;
    }
    let lastBreak = null;
    tbody.innerHTML = rows
      .map((r) => {
        const key = breakKey(r);
        const brk = key && key !== lastBreak ? `<tr class="group-break"><td colspan="5">${esc(key)}</td></tr>` : '';
        lastBreak = key;
        const texts = (r.coreTexts || []).slice(0, 3).map((t) => App.cleanTitle(t)).join('; ');
        return `${brk}<tr data-id="${esc(r.id)}" tabindex="0"${r.id === state.row ? ' class="selected"' : ''}>
          <td class="age">${esc(ageLabel(r))}</td>
          <td class="level">${levelBadge(r.level)}</td>
          <td class="track">${esc(trackTitle(r.track))}<small>${esc(r.trackGroup)}</small></td>
          <td><div class="title">${esc(r.title)} ${statusBadge(window.Store?.status(window.Store.activeChild, r.id))}</div><div class="summary">${esc(r.summary)}</div></td>
          <td class="texts">${esc(texts)}${(r.coreTexts || []).length > 3 ? ' …' : ''}</td>
        </tr>`;
      })
      .join('');
  }

  function openRow(id) {
    state.row = id;
    writeState(state);
    tbody.querySelectorAll('tr.selected').forEach((tr) => tr.classList.remove('selected'));
    if (id) tbody.querySelector(`tr[data-id="${CSS.escape(id)}"]`)?.classList.add('selected');
    showDetail(id, openRow);
  }

  function update(rebuildFilters) {
    writeState(state);
    if (rebuildFilters) renderFilters(filtersEl, state, update);
    renderRows();
  }

  headers.forEach((th) =>
    th.querySelector('button').addEventListener('click', () => {
      const key = th.dataset.sort;
      state.dir = state.sort === key && state.dir === 'asc' ? 'desc' : 'asc';
      state.sort = key;
      update(false);
    }),
  );
  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) openRow(tr.dataset.id);
  });
  tbody.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openRow(tr.dataset.id);
    }
  });

  document.getElementById('updated').textContent = DATA.generated ? new Date(DATA.generated).toLocaleDateString() : '—';
  renderFilters(filtersEl, state, update);
  renderRows();
  window.Store?.onChange(renderRows);
  if (state.row) openRow(state.row);
})();
