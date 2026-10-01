// Family Progress page: children, next assignments, Bookshelf of Knowledge, Look Ahead, placement, backup.
(function () {
  const { DATA, esc, ageLabel, levelBadge, trackById, rowById, showDetail, readerBadge, lengthLabel } = window.App;
  const S = window.Store;
  const P = S.plan(DATA);
  const groupOf = Object.fromEntries(DATA.tracks.map((t) => [t.id, t.group]));
  const groupIndex = Object.fromEntries(DATA.groups.map((g, i) => [g.name, i]));

  const childrenEl = document.getElementById('children');
  const view = document.getElementById('view');
  const addForm = document.getElementById('add-child');
  let tab = new URLSearchParams(location.hash.slice(1)).get('tab') || 'next';
  let months = 6;
  // Look Ahead filters: acquired / still missing, free / to buy
  const hide = { acquired: false, missing: false, free: false, paid: false };
  let shelfSort = 'subject';
  window.Demo.topUp(DATA, S); // demo children loaded before bookshelves were seeded get their books now

  const fmtYears = (a) => (a == null ? '' : `${Math.floor(a)} y ${Math.floor((a % 1) * 12)} m`);
  const trackTitle = (id) => trackById[id]?.title || id;
  const required = (r) => S.requiredTexts(r);
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
  document.getElementById('load-demo').addEventListener('click', () => {
    const n = window.Demo.loadIntoStore(DATA, S);
    addForm.hidden = true;
    if (!n) alert('The demo children are already loaded, and their bookshelves are filled in.');
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

  // ---------- weekly load: the hours a week of the units a child is on now, by part of the week ----------
  const B = DATA.budget;
  const WEEKS = B?.saturday?.weeks || 48;
  const DAYS = [['weekday', 'Weekday academics', 'Monday to Friday'], ['saturday', 'Saturday', 'activities'], ['sunday', 'Sunday', 'Bible and theology']];
  // Saturdays and weekdays follow the 48-week school year; Sundays run all 52 weeks
  const weeksFor = (day) => (day === 'sunday' ? B?.sunday?.weeks || 52 : WEEKS);
  const perWeek = (r) => (window.App.workloadTotal(r) || 0) / Math.max(r.ageEnd - r.ageStart, 0.25) / weeksFor(window.App.dayOf(r));
  const hw = (h) => `${h < 10 ? h.toFixed(1) : Math.round(h)} h`;
  function budgetFor(age) {
    const y = B?.years?.find((x) => x.grade === Math.floor(age) - B.gradeAgeOffset);
    const band = (B?.sunday?.bands || []).find((b) => age >= b.ageStart && age < b.ageEnd);
    return {
      label: y ? y.label : '',
      weekday: y ? y.weekday / WEEKS : 0,
      saturday: y ? B.saturday.hoursPerDay : 0,
      sunday: band ? band.hoursPerWeek : 0,
    };
  }
  // the units a child is on now in every track: in progress, or due at their age (the first unfinished one if behind)
  function weeklyLoad(c) {
    const who = window.App.childFor(`store:${c.id}`);
    const units = [];
    for (const t of DATA.tracks) {
      const rows = DATA.rows.filter((r) => r.track === t.id);
      for (const r of window.App.nowUnits(rows, who)) {
        if (!r.workload) continue;
        const st = S.status(c.id, r.id);
        units.push({ r, st: st === 'active' ? 'active' : r.ageEnd <= who.age ? 'overdue' : 'due', day: window.App.dayOf(r), h: perWeek(r) });
      }
    }
    const totals = Object.fromEntries(DAYS.map(([d]) => [d, units.filter((u) => u.day === d).reduce((n, u) => n + u.h, 0)]));
    return { age: who.age, units, totals, budget: budgetFor(who.age) };
  }
  const meter = (h, b) => {
    const max = Math.max(h, b, 0.1) * 1.15;
    const pct = (x) => `${Math.min(100, (100 * x) / max).toFixed(1)}%`;
    return `<span class="wl-track"><i class="wl-bar" style="width:${pct(h)}"></i>${b ? `<b class="wl-bud" style="left:${pct(b)}"></b>` : ''}</span>`;
  };
  const loadLine = (L) =>
    DAYS.map(([d, label]) => `${label.split(' ')[0]} ${hw(L.totals[d])}${L.budget[d] ? ` of ${hw(L.budget[d])}` : ''}`).join(' · ');

  function renderLoad(c) {
    if (!c.birthdate) return '<p class="empty">Add a birthdate to see the weekly load.</p>';
    const L = weeklyLoad(c);
    const ST = { active: 'In progress', due: 'Due now', overdue: 'Behind' };
    const tiles = DAYS.map(([d, label, sub]) => {
      const h = L.totals[d], b = L.budget[d];
      const pct = b ? Math.round((100 * h) / b) : null;
      const perDay = d === 'weekday' ? ` · about ${hw(h / 5)} a day` : '';
      return `<div class="wl-tile"><div class="wl-head"><strong>${label}</strong> <span class="by">${sub}</span></div>
        <div class="wl-num">${hw(h)} <small>a week${perDay}</small></div>
        ${meter(h, b)}
        <div class="by">${b ? `Budget ${hw(b)} a week${pct != null ? ` · ${pct}%` : ''}${pct > 110 ? ' · above budget' : ''}` : 'No budget at this age'}</div></div>`;
    }).join('');
    const sections = DAYS.map(([d, label]) => {
      const us = L.units.filter((u) => u.day === d).sort((a, b) => b.h - a.h);
      if (!us.length) return '';
      return `<h3>${label}</h3><div class="table-wrap"><table class="wl-table"><thead><tr><th>Unit</th><th>Track</th><th>Status</th><th class="num">h a week</th></tr></thead><tbody>${us
        .map((u) => `<tr><td><button type="button" class="linkish" data-open="${esc(u.r.id)}">${esc(u.r.title)}</button>${u.r.elective ? ' <span class="badge unit-elective">Elective</span>' : ''}</td><td>${esc(trackTitle(u.r.track))}</td><td><span class="badge wl-${u.st}">${ST[u.st]}</span></td><td class="num">${hw(u.h)}</td></tr>`)
        .join('')}</tbody></table></div>`;
    }).join('');
    const kids = S.children().filter((k) => k.birthdate);
    const family = kids.length > 1
      ? `<h3>The whole family</h3><div class="table-wrap"><table class="wl-table"><thead><tr><th>Child</th>${DAYS.map(([, l]) => `<th class="num">${l.split(' ')[0]}</th>`).join('')}</tr></thead><tbody>${kids
          .map((k) => { const K = weeklyLoad(k); return `<tr${k.id === c.id ? ' class="on"' : ''}><td>${esc(k.name)} <small class="by">${esc(fmtYears(S.age(k)))}</small></td>${DAYS.map(([d]) => `<td class="num">${hw(K.totals[d])}${K.budget[d] ? ` <small class="by">/ ${hw(K.budget[d])}</small>` : ''}</td>`).join('')}</tr>`; })
          .join('')}</tbody></table></div>`
      : '';
    return `<div class="weekly-load">
      <p class="desc">${esc(c.name)}'s units this week, age ${esc(fmtYears(L.age))}${L.budget.label ? ` (${esc(L.budget.label)})` : ''}: every unit in progress, and each track's unit due at this age (the first unfinished one if behind). Hours a week are each unit's estimated core work spread evenly over its ages: ${WEEKS} school weeks a year, and ${weeksFor('sunday')} Sundays. See <a href="hours.html">School Hours</a> for the yearly budgets.</p>
      <div class="wl-tiles">${tiles}</div>
      ${sections || '<p class="empty">No units with an estimate are due now.</p>'}
      ${family}
    </div>`;
  }

  // ---------- mastery: objectives mastered and examinations passed, with what needs review ----------
  function renderMastery(c) {
    const A = window.App;
    const rows = DATA.rows.filter((r) => (r.objectives || []).length && S.status(c.id, r.id));
    const done = rows.filter((r) => S.status(c.id, r.id) === 'done');
    const active = rows.filter((r) => S.status(c.id, r.id) === 'active');
    const m = (r) => A.masteryOf(c.id, r);
    const objTotal = done.reduce((n, r) => n + m(r).total, 0);
    const objDone = done.reduce((n, r) => n + m(r).done, 0);
    const review = done.filter((r) => !m(r).full);
    const ready = active.filter((r) => m(r).done === m(r).total && !m(r).exam);
    const pct = objTotal ? Math.round((100 * objDone) / objTotal) : 0;
    const table = (list, extra) => `<div class="table-wrap"><table class="wl-table"><thead><tr><th>Unit</th><th>Track</th><th class="num">Objectives</th><th>Examination</th>${extra ? '<th>How it is examined</th>' : ''}</tr></thead><tbody>${list
      .map((r) => { const x = m(r), mode = A.examMode(r); return `<tr><td><button type="button" class="linkish" data-open="${esc(r.id)}">${esc(r.title)}</button></td><td>${esc(trackTitle(r.track))}</td><td class="num">${x.done} / ${x.total}</td><td>${x.exam ? `✓ ${esc(x.exam)}` : '<span class="badge wl-overdue">Not yet</span>'}</td>${extra ? `<td class="by">${esc(mode?.label || '')}</td>` : ''}</tr>`; })
      .join('')}</tbody></table></div>`;
    const modes = (DATA.assessment?.modes || []).map((md) => `<li><strong>${esc(md.label)}</strong>${md.tracks ? ` <span class="by">(${esc(md.tracks.map(trackTitle).join(', '))})</span>` : ' <span class="by">(every other track)</span>'}: ${esc(md.how)}${md.precedent ? ` <span class="by">${esc(md.precedent)}${(md.sources || []).map((x) => ` <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a>`).join('')}</span>` : ''}</li>`).join('');
    return `<div class="weekly-load">
      <p class="desc">A unit is mastered when ${esc(c.name)} has shown every objective and passed the unit examination. Tick objectives and record examinations in each unit's panel. Units marked complete with gaps stay on the review list until they are closed.</p>
      <div class="wl-tiles">
        <div class="wl-tile"><div class="wl-head"><strong>Objectives mastered</strong></div><div class="wl-num">${pct}% <small>of ${objTotal.toLocaleString()} in completed units</small></div><span class="wl-track"><i class="wl-bar" style="width:${pct}%"></i></span></div>
        <div class="wl-tile"><div class="wl-head"><strong>Units fully mastered</strong></div><div class="wl-num">${done.length - review.length} <small>of ${done.length} completed</small></div><div class="by">${review.length} on the review list</div></div>
        <div class="wl-tile"><div class="wl-head"><strong>Ready to examine</strong></div><div class="wl-num">${ready.length} <small>unit${ready.length === 1 ? '' : 's'}</small></div><div class="by">every objective shown, examination not yet recorded</div></div>
      </div>
      <h3>Ready for examination</h3>${ready.length ? table(ready, true) : '<p class="empty">No unit in progress has all its objectives ticked yet.</p>'}
      <h3>Review list</h3>${review.length ? table(review) : '<p class="empty">Nothing to review: every completed unit is mastered and examined.</p>'}
      <h3>In progress</h3>${active.length ? table(active.sort((a, b) => m(b).done / m(b).total - m(a).done / m(a).total), true) : '<p class="empty">No units in progress.</p>'}
      <h3>How units are examined</h3><ul class="trules">${modes}</ul>
    </div>`;
  }

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
      <h3><button type="button" class="linkish" data-open="${esc(r.id)}">${esc(r.title)}</button> ${window.App.unitBadges(r)}${item.status === 'active' && (r.objectives || []).length ? (() => { const x = window.App.masteryOf(cid, r); return ` <span class="badge pace-on" title="Objectives mastered">${x.done}/${x.total} objectives${x.exam ? ' · examined' : ''}</span>`; })() : ''}</h3>
      <p class="desc">${esc(r.summary)}</p>
      ${texts.length ? `<div class="texts"><strong>Texts:</strong> ${window.App.readingPlan(r).texts.filter((t) => texts.includes(t)).map((t) => `${esc(S.cleanTitle(t))}${t.author ? ` <span class="by">(${esc(t.author)})</span>` : ''} ${window.App.planBadges(t, window.App.readingPlan(r))} ${readerBadge(t)}${lengthLabel(t) ? ` <span class="by">${lengthLabel(t)}</span>` : ''}`).join('; ')}</div>${window.App.loadText(window.App.readingPlan(r)) ? `<p class="load">${esc(window.App.loadText(window.App.readingPlan(r)))}</p>` : ''}` : ''}
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
      ${c.birthdate && B ? `<p class="desc wl-line"><strong>This week:</strong> ${esc(loadLine(weeklyLoad(c)))}. <button type="button" class="linkish" data-goto-tab="load">Weekly load →</button></p>` : ''}
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
  // shelf order: grouped by subject (group, then track), or one list by date finished, title or author
  const SORTS = { subject: 'Subject', date: 'Date finished (newest first)', title: 'Title', author: 'Author' };
  const byText = (k) => (a, b) => (a[k] || '').localeCompare(b[k] || '', undefined, { sensitivity: 'base' });
  function shelfGroups(books) {
    if (shelfSort === 'subject') {
      const order = (b) => [groupIndex[groupOf[b.track]] ?? 99, DATA.tracks.findIndex((t) => t.id === b.track)];
      const sorted = books.slice().sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1] || a.date.localeCompare(b.date));
      const groups = new Map();
      for (const b of sorted) {
        const g = groupOf[b.track] || 'Other reading';
        const key = b.track ? `${g} › ${trackTitle(b.track)}` : g;
        if (!groups.has(key)) groups.set(key, { g, list: [] });
        groups.get(key).list.push(b);
      }
      return [...groups.entries()].map(([label, v]) => ({ label, g: v.g, list: v.list }));
    }
    // authors sort by surname (the last word of the first name listed); books with no author go last
    const surname = (a) => (a || '').replace(/\([^)]*\)/g, '').split(/,|&| and |;/)[0].trim().split(/\s+/).pop() || '';
    const byAuthor = (a, b) => !a.author - !b.author || surname(a.author).localeCompare(surname(b.author), undefined, { sensitivity: 'base' }) || byText('title')(a, b);
    const cmp = shelfSort === 'date' ? (a, b) => b.date.localeCompare(a.date) : shelfSort === 'author' ? byAuthor : byText(shelfSort);
    return [{ label: '', g: '', list: books.slice().sort(cmp) }];
  }

  function addBookDialog(c) {
    const trackOpts = DATA.tracks.map((t) => `<option value="${esc(t.id)}">${esc(t.group)} › ${esc(t.title)}</option>`).join('');
    const d = window.App.modal(
      `<h2>Add a book to ${esc(c.name)}'s shelf</h2>
      <form id="add-book">
        <div class="form-row">
          <label>Title <input name="title" required autocomplete="off"></label>
          <label>Author <input name="author" autocomplete="off"></label>
        </div>
        <div class="form-row">
          <label>Finished <input name="date" type="date" value="${S.today()}"></label>
          <label>Pages <input name="pages" type="number" min="1" inputmode="numeric" placeholder="optional"></label>
        </div>
        <label>Subject <select name="track"><option value="">Other reading</option>${trackOpts}</select></label>
        <label>Notes <input name="notes" autocomplete="off" placeholder="Optional: narration, favorite passage, who recommended it…"></label>
        <p class="desc" id="add-book-msg" hidden></p>
        <div class="form-actions"><button type="submit" class="btn">Add to shelf</button> <button type="button" class="btn secondary" data-close>Cancel</button></div>
      </form>`,
      { label: 'Add a book' },
    );
    d.querySelector('input[name="title"]').focus();
    d.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const added = S.addBook(c.id, { title: f.title.value, author: f.author.value, finished: f.date.value, pages: f.pages.value, track: f.track.value, notes: f.notes.value, custom: true });
      if (added) return d.close();
      const msg = d.querySelector('#add-book-msg');
      msg.textContent = 'That book is already on the shelf.';
      msg.hidden = false;
    });
  }

  function renderShelf(c) {
    const books = S.shelf(c.id);
    const groups = shelfGroups(books);
    return `
      <div class="shelf-head">
        <h2>${esc(c.name)}'s Bookshelf of Knowledge <small>(${books.length} ${books.length === 1 ? 'book' : 'books'}${books.some((b) => b.pages) ? ` · ${books.reduce((n, b) => n + (b.pages || 0), 0).toLocaleString()} pages` : ''})</small></h2>
        <div class="shelf-actions">
          <label>Sort by <select id="shelf-sort">${Object.entries(SORTS).map(([k, l]) => `<option value="${k}"${k === shelfSort ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <button type="button" class="btn" id="add-book-open">+ Add a book</button>
          <button type="button" class="linkish" onclick="window.print()">Print</button>
        </div>
      </div>
      <p class="desc">Books are added automatically when a unit is marked completed (its required texts), and from the checkboxes in any unit's detail panel. Use “Add a book” for anything else ${esc(c.name)} has read.</p>
      ${
        books.length
          ? groups
              .map(
                ({ label, g, list }) => `${label ? `<h3 class="shelf-group">${esc(label)} <small>(${list.length})</small></h3>` : ''}<div class="shelf">${list
                  .map(
                    (b) => `<div class="book g${groupIndex[groupOf[b.track]] ?? 9}">
                      <div class="book-title">${esc(b.title)}</div>
                      ${b.author ? `<div class="book-author">${esc(b.author)}</div>` : ''}
                      <div class="book-meta">${b.pages ? `${b.pages.toLocaleString()} pp · ` : ''}Finished ${esc(b.date)}${b.published ? ` · pub. ${esc(b.published)}` : ''}${b.track ? ` · ${esc(trackTitle(b.track))}` : ''}${b.custom ? ' · added by hand' : ''}</div>
                      ${b.notes ? `<div class="book-notes">${esc(b.notes)}</div>` : ''}
                      ${b.rowId && rowById[b.rowId] ? `<button type="button" class="linkish" data-open="${esc(b.rowId)}">${esc(rowById[b.rowId].title)}</button>` : ''}
                      <button type="button" class="remove" data-remove-book="${esc(b.id)}" aria-label="Remove ${esc(b.title)}">×</button>
                    </div>`,
                  )
                  .join('')}</div>`,
              )
              .join('')
          : '<p class="empty">The shelf is empty. Complete a unit or use “Add a book”.</p>'
      }`;
  }

  // ---------- look ahead ----------
  function renderAhead() {
    const kids = S.children().filter((c) => c.birthdate);
    const needs = new Map(); // text key -> { text, uses: [{child, row}] }
    for (const c of kids) {
      for (const r of P.lookAhead(c.id, months)) {
        const plan = window.App.readingPlan(r);
        for (const t of r.coreTexts || []) {
          if (t.role === 'review') continue; // already read in an earlier unit
          const key = S.textKey(t);
          if (S.onShelf(c.id, key)) continue;
          const entry = needs.get(key) || { text: t, elective: true, uses: [] };
          entry.elective = entry.elective && (S.isElective(t) || !!r.elective);
          entry.uses.push({ child: c, row: r, badges: window.App.planBadges(t, plan), choice: t.role === 'choice' });
          needs.set(key, entry);
        }
      }
    }
    let list = [...needs.entries()].map(([key, v]) => ({ key, ...v, acquired: S.acquired(key) }));
    const totals = { all: list.length, free: list.filter((x) => x.text.publicDomain).length, acquired: list.filter((x) => x.acquired).length };
    if (hide.acquired) list = list.filter((x) => !x.acquired);
    if (hide.missing) list = list.filter((x) => x.acquired);
    if (hide.free) list = list.filter((x) => !x.text.publicDomain);
    if (hide.paid) list = list.filter((x) => x.text.publicDomain);
    list.sort((a, b) => a.elective - b.elective || !!a.text.publicDomain - !!b.text.publicDomain || Math.min(...a.uses.map((u) => u.row.ageStart)) - Math.min(...b.uses.map((u) => u.row.ageStart)));
    const monthOpts = [3, 6, 12].map((m) => `<option value="${m}"${m === months ? ' selected' : ''}>${m} months</option>`).join('');
    return `
      <div class="shelf-head">
        <h2>Look Ahead: texts needed in the next <select id="months" aria-label="Look-ahead window">${monthOpts}</select></h2>
        <button type="button" class="linkish" onclick="window.print()">Print shopping list</button>
      </div>
      <p class="desc">Texts to buy are listed first, then free texts to print or download, then electives. This list covers every child with a birthdate. It includes the units in progress plus the units each child is expected to reach in this window, following prerequisites and typical ages. Texts already on a child's shelf, and re-reads of earlier texts, are left out. “One of a choice” marks alternatives, where one text of the group is enough.
      ${totals.all} texts: ${totals.free} free (public domain), ${totals.acquired} marked acquired.</p>
      <div class="filters">
        <label class="check"><input type="checkbox" data-hide="acquired"${hide.acquired ? ' checked' : ''}> Hide acquired</label>
        <label class="check"><input type="checkbox" data-hide="missing"${hide.missing ? ' checked' : ''}> Hide missing (not yet acquired)</label>
        <label class="check"><input type="checkbox" data-hide="free"${hide.free ? ' checked' : ''}> Hide free texts</label>
        <label class="check"><input type="checkbox" data-hide="paid"${hide.paid ? ' checked' : ''}> Hide paid texts</label>
      </div>
      ${
        list.length
          ? `<div class="table-wrap"><table class="curriculum ahead"><thead><tr><th style="padding:10px 12px">Have it</th><th style="padding:10px 12px">Text</th><th style="padding:10px 12px">Needed for</th><th style="padding:10px 12px">Get it</th></tr></thead><tbody>${list
              .map(
                (x) => `<tr class="${x.acquired ? 'acquired' : ''}">
                  <td><input type="checkbox" data-acq="${esc(x.key)}"${x.acquired ? ' checked' : ''} aria-label="Acquired ${esc(S.cleanTitle(x.text))}"></td>
                  <td><div class="title">${esc(S.cleanTitle(x.text))}</div>${x.text.author ? `<div class="by">${esc(x.text.author)}</div>` : ''}${x.elective ? ' <span class="badge elective">elective</span>' : ''} ${readerBadge(x.text)}${lengthLabel(x.text) ? ` <span class="by">${lengthLabel(x.text)}</span>` : ''}</td>
                  <td>${x.uses.map((u) => `<div><strong>${esc(u.child.name)}</strong>: <a href="index.html#row=${esc(u.row.id)}" data-open="${esc(u.row.id)}">${esc(u.row.title)}</a> <small>(${S.status(u.child.id, u.row.id) === 'active' ? 'in progress' : `typical age ${esc(ageLabel(u.row))}`})</small>${u.choice ? ' <span class="badge plan-sel choice-mark" title="Any one text of this group will do">One of a choice</span>' : ''}${u.badges ? ` ${u.badges}` : ''}</div>`).join('')}</td>
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
    else view.innerHTML = tab === 'shelf' ? renderShelf(c) : tab === 'place' ? renderPlace(c) : tab === 'load' ? renderLoad(c) : tab === 'mastery' ? renderMastery(c) : renderNext(c);
    if (!S.children().length) addForm.hidden = false;
  }

  view.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto-tab]');
    if (go) {
      tab = go.dataset.gotoTab;
      history.replaceState(null, '', `#tab=${tab}`);
      return render();
    }
    const c = S.child(S.activeChild);
    const open = e.target.closest('[data-open]');
    if (open) {
      e.preventDefault();
      return openRow(open.dataset.open);
    }
    const act = e.target.closest('[data-act]');
    if (act && c) {
      const r = rowById[act.dataset.id];
      S.setStatus(c.id, r.id, act.dataset.act);
      if (act.dataset.act === 'done') for (const t of required(r)) S.addBook(c.id, { ...t, rowId: r.id, track: r.track });
      return;
    }
    if (e.target.id === 'add-book-open' && c) return addBookDialog(c);
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
    if (e.target.dataset.hide) { hide[e.target.dataset.hide] = e.target.checked; render(); }
    if (e.target.id === 'shelf-sort') { shelfSort = e.target.value; render(); }
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
