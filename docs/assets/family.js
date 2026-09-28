// Family page: children, next assignments, Bookshelf of Knowledge, Look Ahead, placement, backup.
(function () {
  const { DATA, esc, ageLabel, levelBadge, trackById, rowById, showDetail } = window.App;
  const S = window.Store;
  const P = S.plan(DATA);
  const groupOf = Object.fromEntries(DATA.tracks.map((t) => [t.id, t.group]));
  const groupIndex = Object.fromEntries(DATA.groups.map((g, i) => [g.name, i]));

  const childrenEl = document.getElementById('children');
  const view = document.getElementById('view');
  const addForm = document.getElementById('add-child');
  let tab = new URLSearchParams(location.hash.slice(1)).get('tab') || 'next';
  let months = 6;
  let hideAcquired = false;
  let hideFree = false;

  const fmtYears = (a) => (a == null ? '' : `${Math.floor(a)} y ${Math.floor((a % 1) * 12)} m`);
  const trackTitle = (id) => trackById[id]?.title || id;
  const required = (r) => (r.coreTexts || []).filter((t) => !S.isElective(t));
  const linkList = (links) =>
    (links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || 'Link')} ↗</a>`).join(' ');

  function openRow(id) {
    showDetail(id, openRow);
  }

  // ---------- children bar ----------
  function renderChildren() {
    const kids = S.children();
    childrenEl.innerHTML = kids
      .map(
        (c) => `<button type="button" class="chip" role="tab" data-child="${esc(c.id)}" aria-pressed="${c.id === S.activeChild}" aria-selected="${c.id === S.activeChild}">${esc(c.name)} <small>${esc(fmtYears(S.age(c)))}</small></button>`,
      )
      .join('');
    document.getElementById('storage-warning').hidden = !S.memoryOnly;
  }
  childrenEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-child]');
    if (b) S.setActive(b.dataset.child);
  });
  document.getElementById('add-child-toggle').addEventListener('click', () => {
    addForm.hidden = !addForm.hidden;
    if (!addForm.hidden) addForm.elements.name.focus();
  });
  document.getElementById('add-child-cancel').addEventListener('click', () => (addForm.hidden = true));
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const el = addForm.elements;
    const c = S.addChild(el.name.value, el.birthdate.value);
    if (el.place.checked) P.placeByAge(c.id);
    S.setActive(c.id);
    addForm.reset();
    addForm.hidden = true;
  });

  // ---------- tabs ----------
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.tab;
      history.replaceState(null, '', `#tab=${tab}`);
      render();
    }),
  );

  // ---------- next assignments ----------
  function unitCard(item, cid) {
    const r = item.row;
    const pace = { behind: 'Behind the typical age', ahead: 'Ahead of the typical age', on: 'On pace' }[item.pace];
    const texts = required(r);
    const actions =
      item.status === 'active'
        ? `<button type="button" class="btn" data-act="done" data-id="${esc(r.id)}">Mark completed</button>`
        : `<button type="button" class="btn" data-act="active" data-id="${esc(r.id)}">Start</button>`;
    return `<article class="unit-card">
      <div class="meta">${levelBadge(r.level)} <span>${esc(r.trackGroup)} › ${esc(trackTitle(r.track))}</span> · <span>typical age ${esc(ageLabel(r))}</span> <span class="badge pace-${item.pace}">${esc(pace)}</span>${S.inSeason(r) ? ' <span class="badge pace-on">In season now</span>' : ''}</div>
      <h3><button type="button" class="linkish" data-open="${esc(r.id)}">${esc(r.title)}</button></h3>
      <p class="desc">${esc(r.summary)}</p>
      ${texts.length ? `<div class="texts"><strong>Texts:</strong> ${texts.map((t) => `${esc(S.cleanTitle(t))}${t.author ? ` <span class="by">(${esc(t.author)})</span>` : ''}`).join('; ')}</div>` : ''}
      <div class="form-actions">${actions} <button type="button" class="linkish" data-open="${esc(r.id)}">Details, objectives &amp; resources</button></div>
    </article>`;
  }

  function renderNext(c) {
    const all = P.next(c.id);
    const isExtra = (i) => i.row.trackGroup === 'Extracurriculars';
    const items = all.filter((i) => !isExtra(i));
    const extras = all.filter(isExtra);
    const active = items.filter((i) => i.status === 'active');
    const ready = items.filter((i) => i.status !== 'active');
    return `
      <p class="desc"><a href="exams.html">Exam planner →</a> projected dates for every exam ${esc(c.name)} is preparing for.</p>
      <p class="desc">Age ${esc(fmtYears(S.age(c)))} · ${countStatus(c.id, 'done')} units completed · ${countStatus(c.id, 'active')} in progress · ${S.shelf(c.id).length} books on the shelf.
      Ready units are the next unit in each track whose prerequisites are complete and whose typical age is within a year of ${esc(c.name)}'s age.</p>
      <h2>In progress <small>(${active.length})</small></h2>
      ${active.length ? `<div class="cards">${active.map((i) => unitCard(i, c.id)).join('')}</div>` : '<p class="desc">Nothing in progress yet. Start one of the units below.</p>'}
      <h2>Ready to start <small>(${ready.length})</small></h2>
      ${ready.length ? `<div class="cards">${ready.map((i) => unitCard(i, c.id)).join('')}</div>` : '<p class="desc">No new units are ready. Complete the units in progress, or check the placement tab.</p>'}
      ${extras.length ? `<h2>Extracurriculars <small>(${esc(S.season())} season)</small></h2><div class="cards">${extras.map((i) => unitCard(i, c.id)).join('')}</div>` : ''}`;
  }
  const countStatus = (cid, st) => DATA.rows.filter((r) => S.status(cid, r.id) === st).length;

  // ---------- bookshelf ----------
  function renderShelf(c) {
    const books = S.shelf(c.id).slice().sort((a, b) => (groupIndex[groupOf[a.track]] ?? 99) - (groupIndex[groupOf[b.track]] ?? 99) || a.date.localeCompare(b.date));
    const byGroup = {};
    for (const b of books) (byGroup[groupOf[b.track] || 'Other reading'] ||= []).push(b);
    const trackOpts = DATA.tracks.map((t) => `<option value="${esc(t.id)}">${esc(t.group)} › ${esc(t.title)}</option>`).join('');
    return `
      <div class="shelf-head">
        <h2>${esc(c.name)}'s Bookshelf of Knowledge <small>(${books.length} ${books.length === 1 ? 'book' : 'books'})</small></h2>
        <button type="button" class="linkish" onclick="window.print()">Print</button>
      </div>
      <p class="desc">Books are added automatically when a unit is marked completed (its required texts), and from the checkboxes in any unit's detail panel. Add anything else ${esc(c.name)} has read below.</p>
      <form class="panel-card" id="add-book">
        <h3>Add a book</h3>
        <div class="form-row">
          <label>Title <input name="title" required autocomplete="off"></label>
          <label>Author <input name="author" autocomplete="off"></label>
          <label>Finished <input name="date" type="date" value="${S.today()}"></label>
          <label>Subject <select name="track"><option value="">Other reading</option>${trackOpts}</select></label>
        </div>
        <label>Notes <input name="notes" autocomplete="off" placeholder="Optional: narration, favorite passage, who recommended it…"></label>
        <div class="form-actions"><button type="submit" class="btn">Add to shelf</button></div>
      </form>
      ${
        books.length
          ? Object.entries(byGroup)
              .map(
                ([g, list]) => `<h3 class="shelf-group">${esc(g)}</h3><div class="shelf">${list
                  .map(
                    (b) => `<div class="book g${groupIndex[g] ?? 9}">
                      <div class="book-title">${esc(b.title)}</div>
                      ${b.author ? `<div class="book-author">${esc(b.author)}</div>` : ''}
                      <div class="book-meta">Finished ${esc(b.date)}${b.published ? ` · pub. ${esc(b.published)}` : ''}${b.track ? ` · ${esc(trackTitle(b.track))}` : ''}${b.custom ? ' · added by hand' : ''}</div>
                      ${b.notes ? `<div class="book-notes">${esc(b.notes)}</div>` : ''}
                      ${b.rowId && rowById[b.rowId] ? `<button type="button" class="linkish" data-open="${esc(b.rowId)}">${esc(rowById[b.rowId].title)}</button>` : ''}
                      <button type="button" class="remove" data-remove-book="${esc(b.id)}" aria-label="Remove ${esc(b.title)}">×</button>
                    </div>`,
                  )
                  .join('')}</div>`,
              )
              .join('')
          : '<p class="empty">The shelf is empty. Complete a unit or add a book above.</p>'
      }`;
  }

  // ---------- look ahead ----------
  function renderAhead() {
    const kids = S.children().filter((c) => c.birthdate);
    const needs = new Map(); // text key -> { text, uses: [{child, row}] }
    for (const c of kids) {
      for (const r of P.lookAhead(c.id, months)) {
        for (const t of r.coreTexts || []) {
          const key = S.textKey(t);
          if (S.onShelf(c.id, key)) continue;
          const entry = needs.get(key) || { text: t, elective: true, uses: [] };
          entry.elective = entry.elective && S.isElective(t);
          entry.uses.push({ child: c, row: r });
          needs.set(key, entry);
        }
      }
    }
    let list = [...needs.entries()].map(([key, v]) => ({ key, ...v, acquired: S.acquired(key) }));
    const totals = { all: list.length, free: list.filter((x) => x.text.publicDomain).length, acquired: list.filter((x) => x.acquired).length };
    if (hideAcquired) list = list.filter((x) => !x.acquired);
    if (hideFree) list = list.filter((x) => !x.text.publicDomain);
    list.sort((a, b) => a.elective - b.elective || !!a.text.publicDomain - !!b.text.publicDomain || Math.min(...a.uses.map((u) => u.row.ageStart)) - Math.min(...b.uses.map((u) => u.row.ageStart)));
    const monthOpts = [3, 6, 12].map((m) => `<option value="${m}"${m === months ? ' selected' : ''}>${m} months</option>`).join('');
    return `
      <div class="shelf-head">
        <h2>Look Ahead: texts needed in the next <select id="months" aria-label="Look-ahead window">${monthOpts}</select></h2>
        <button type="button" class="linkish" onclick="window.print()">Print shopping list</button>
      </div>
      <p class="desc">Texts to buy are listed first, then free texts to print or download, then electives. This list covers every child with a birthdate. It includes the units in progress plus the units each child is expected to reach in this window, following prerequisites and typical ages. Texts already on a child's shelf are left out.
      ${totals.all} texts: ${totals.free} free (public domain), ${totals.acquired} marked acquired.</p>
      <div class="filters">
        <label class="check"><input type="checkbox" id="hide-acq"${hideAcquired ? ' checked' : ''}> Hide acquired</label>
        <label class="check"><input type="checkbox" id="hide-free"${hideFree ? ' checked' : ''}> Hide free texts</label>
      </div>
      ${
        list.length
          ? `<div class="table-wrap"><table class="curriculum ahead"><thead><tr><th style="padding:10px 12px">Have it</th><th style="padding:10px 12px">Text</th><th style="padding:10px 12px">Needed for</th><th style="padding:10px 12px">Get it</th></tr></thead><tbody>${list
              .map(
                (x) => `<tr class="${x.acquired ? 'acquired' : ''}">
                  <td><input type="checkbox" data-acq="${esc(x.key)}"${x.acquired ? ' checked' : ''} aria-label="Acquired ${esc(S.cleanTitle(x.text))}"></td>
                  <td><div class="title">${esc(S.cleanTitle(x.text))}</div>${x.text.author ? `<div class="by">${esc(x.text.author)}</div>` : ''}${x.elective ? ' <span class="badge elective">elective</span>' : ''}</td>
                  <td>${x.uses.map((u) => `<div><strong>${esc(u.child.name)}</strong>: <button type="button" class="linkish" data-open="${esc(u.row.id)}">${esc(u.row.title)}</button> <small>(${S.status(u.child.id, u.row.id) === 'active' ? 'in progress' : `typical age ${esc(ageLabel(u.row))}`})</small></div>`).join('')}</td>
                  <td>${x.text.publicDomain ? '<span class="badge pd">Free</span> ' : ''}${linkList(x.text.links)}</td>
                </tr>`,
              )
              .join('')}</tbody></table></div>`
          : `<p class="empty">${kids.length ? 'Nothing to acquire in this window.' : 'Add a child with a birthdate to see upcoming texts.'}</p>`
      }`;
  }

  // ---------- placement ----------
  function renderPlace(c) {
    const rows = DATA.tracks.map((t) => {
      const units = DATA.rows.filter((r) => r.track === t.id).sort((a, b) => a.order - b.order);
      const firstOpen = units.find((r) => S.status(c.id, r.id) !== 'done');
      const opts = units.map((r) => `<option value="${esc(r.id)}"${r === firstOpen ? ' selected' : ''}>${esc(r.title)} (age ${esc(ageLabel(r))})</option>`).join('');
      const done = units.filter((r) => S.status(c.id, r.id) === 'done').length;
      return `<tr><td class="track">${esc(t.title)}<small>${esc(t.group)}</small></td><td>${done} / ${units.length}</td>
        <td><select data-place="${esc(t.id)}" aria-label="${esc(t.title)} placement"><option value="">(all completed)</option>${opts}</select></td></tr>`;
    });
    return `
      <h2>Placement for ${esc(c.name)}</h2>
      <p class="desc">Choose the unit ${esc(c.name)} is working on now in each track. Every earlier unit in that track (and its prerequisites) is marked completed. This does not add books to the shelf. Use it once when you start, and again if a child tests ahead.</p>
      <div class="table-wrap"><table class="curriculum place"><thead><tr><th style="padding:10px 12px">Track</th><th style="padding:10px 12px">Completed</th><th style="padding:10px 12px">Currently at</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <form class="panel-card" id="edit-child">
        <h3>Child details</h3>
        <div class="form-row">
          <label>Name <input name="name" value="${esc(c.name)}" required></label>
          <label>Birthdate <input name="birthdate" type="date" value="${esc(c.birthdate || '')}"></label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn">Save</button>
          <button type="button" class="btn secondary" id="place-age">Place by age again</button>
          <button type="button" class="btn danger" id="remove-child">Remove ${esc(c.name)}</button>
        </div>
      </form>`;
  }

  // ---------- render & events ----------
  function render() {
    renderChildren();
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
    const c = S.child(S.activeChild);
    if (tab === 'ahead') view.innerHTML = renderAhead();
    else if (!c)
      view.innerHTML = `<div class="panel-card"><h2>Welcome</h2><p>Add each of your children to track their progress through every track. You'll then see each child's next assignments, keep their Bookshelf of Knowledge, and get a Look Ahead list of the books to acquire.</p><button type="button" class="btn" onclick="document.getElementById('add-child-toggle').click()">+ Add your first child</button></div>`;
    else view.innerHTML = tab === 'shelf' ? renderShelf(c) : tab === 'place' ? renderPlace(c) : renderNext(c);
    if (!S.children().length) addForm.hidden = false;
  }

  view.addEventListener('click', (e) => {
    const c = S.child(S.activeChild);
    const open = e.target.closest('[data-open]');
    if (open) return openRow(open.dataset.open);
    const act = e.target.closest('[data-act]');
    if (act && c) {
      const r = rowById[act.dataset.id];
      S.setStatus(c.id, r.id, act.dataset.act);
      if (act.dataset.act === 'done') for (const t of required(r)) S.addBook(c.id, { ...t, rowId: r.id, track: r.track });
      return;
    }
    const rm = e.target.closest('[data-remove-book]');
    if (rm && c) return S.removeBook(c.id, rm.dataset.removeBook);
    if (e.target.id === 'place-age' && c) {
      const n = P.placeByAge(c.id);
      alert(`${n} units marked completed for ${c.name}.`);
    }
    if (e.target.id === 'remove-child' && c && confirm(`Remove ${c.name} and all of their progress and bookshelf? This cannot be undone (unless you have a backup).`)) S.removeChild(c.id);
  });
  view.addEventListener('change', (e) => {
    const c = S.child(S.activeChild);
    if (e.target.id === 'months') { months = +e.target.value; render(); }
    if (e.target.id === 'hide-acq') { hideAcquired = e.target.checked; render(); }
    if (e.target.id === 'hide-free') { hideFree = e.target.checked; render(); }
    if (e.target.dataset.acq) S.setAcquired(e.target.dataset.acq, e.target.checked);
    if (e.target.dataset.place !== undefined && c) {
      const trackId = e.target.dataset.place;
      if (e.target.value) P.placeAt(c.id, trackId, e.target.value);
      else S.markDone(c.id, DATA.rows.filter((r) => r.track === trackId).map((r) => r.id));
    }
  });
  view.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = S.child(S.activeChild);
    const f = e.target.elements;
    const id = e.target.id;
    if (id === 'add-book' && c) {
      const added = S.addBook(c.id, { title: f.title.value, author: f.author.value, finished: f.date.value, track: f.track.value, notes: f.notes.value, custom: true });
      if (!added) alert('That book is already on the shelf.');
    }
    if (id === 'edit-child' && c) S.updateChild(c.id, { name: f.name.value.trim(), birthdate: f.birthdate.value });
  });

  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([S.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `formation-family-backup-${S.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!S.children().length || confirm('Replace the family data in this browser with the backup file?')) S.importJSON(await file.text());
    } catch (err) {
      alert(`Could not import: ${err.message}`);
    }
    e.target.value = '';
  });

  S.onChange(render);
  render();
})();
