// Shared helpers for all pages: data indexes, URL-hash state, filters, detail panel, theme.
(function () {
  const DATA = window.CURRICULUM || { levels: [], groups: [], tracks: [], rows: [] };
  const trackOrder = DATA.groups.flatMap((g) => g.tracks);
  const trackById = Object.fromEntries(DATA.tracks.map((t) => [t.id, t]));
  const rowById = Object.fromEntries(DATA.rows.map((r) => [r.id, r]));
  const levelById = Object.fromEntries(DATA.levels.map((l) => [l.id, l]));
  const examById = Object.fromEntries((DATA.exams || []).map((x) => [x.id, x]));
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
  // who reads a text, and how long it is
  const READER = { teacher: 'Teacher reads', together: 'Read together', student: 'Student reads' };
  const KIND = { primary: 'Primary source', secondary: 'Secondary', instructional: 'Instructional' };
  const kindBadge = (t) => (t?.kind ? `<span class="badge kind-badge kind-${esc(t.kind)}">${KIND[t.kind] || esc(t.kind)}</span>` : '');
  const readerBadge = (t) => (t?.reader ? `<span class="badge reader-${esc(t.reader)}">${READER[t.reader] || esc(t.reader)}</span>` : '');
  const lengthLabel = (t) => (t?.pages ? `${Number(t.pages).toLocaleString()} pp` : t?.words ? `${Math.round(t.words / 1000).toLocaleString()}k words` : '');
  const levelBadge = (id) => `<span class="badge lvl-${esc(id)}">${esc(levelById[id]?.label ?? id)}</span>`;
  const trackTitle = (id) => trackById[id]?.title ?? id;

  // ---------- state in URL hash ----------
  const defaults = { level: [], group: '', track: '', exam: '', q: '', sort: 'age', dir: 'asc', row: '', at: '', child: '', now: 'on', view: 'table', lt: '' };
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
      at: p.get('at') || '',
      exam: p.get('exam') || '',
      child: p.get('child') || '',
      now: p.get('now') || defaults.now,
      view: p.get('view') || defaults.view,
      lt: p.get('lt') || '',
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
    if (s.exam && !(r.exams || []).includes(s.exam)) return false;
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
  function renderFilters(el, state, onChange, { search = true, child = true } = {}) {
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
      ${(DATA.exams || []).length ? `<label>Prepares for <select data-f="exam"><option value="">Any exam</option>${DATA.exams
        .map((x) => `<option value="${esc(x.id)}"${x.id === state.exam ? ' selected' : ''}>${esc(x.name)}</option>`)
        .join('')}</select></label>` : ''}
      ${search ? `<input type="search" data-f="q" placeholder="Search titles, authors, texts…" value="${esc(state.q)}" aria-label="Search">` : ''}
      ${child ? childSelect() : ''}
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
    el.querySelector('[data-f="exam"]')?.addEventListener('change', (e) => {
      state.exam = e.target.value;
      onChange(false);
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
      Object.assign(state, { level: [], group: '', track: '', exam: '', q: '' });
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
    if (!kids.length) return `<h3>Progress</h3><p class="desc">Add your children on the <a href="family.html">Family Progress</a> page to track progress and build each child's Bookshelf of Knowledge.</p>`;
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


  // ---------- reading plan: order within a unit, alternatives, and the weekly load ----------
  const SCHOOL_WEEKS = 36; // weeks of lessons in a school year
  const isElective = (t) => /\(elective[^)]*\)\s*$/i.test(t?.title || '');
  const cleanTitle = (t) => (t?.title || '').replace(/\s*\(elective[^)]*\)\s*$/i, '');
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

  function readingPlan(r) {
    const all = r.coreTexts || [];
    // reading order first; texts without one keep their place after the ordered ones
    const texts = all.map((t, i) => [t, i]).sort((a, b) => (a[0].order ?? 1e9) - (b[0].order ?? 1e9) || a[1] - b[1]).map(([t]) => t);
    const counted = window.Store ? window.Store.requiredTexts(r) : all.filter((t) => !isElective(t));
    const defaults = new Set(counted.filter((t) => t.role === 'choice'));
    let student = 0, aloud = 0, estimated = false, unknown = 0;
    for (const t of counted) {
      let p = t.readPages ?? t.pages;
      if (t.role === 'selections' && !t.readPages) p = t.pages ? ((estimated = true), Math.round(t.pages / 3)) : null;
      if (!p) { unknown++; continue; }
      if (t.reader === 'student' || !t.reader) student += p;
      else aloud += p;
    }
    const weeks = Math.max(0.25, r.ageEnd - r.ageStart) * SCHOOL_WEEKS;
    return { texts, counted, defaults, student, aloud, weeks, estimated, unknown };
  }

  function loadText(plan) {
    if (!plan.student && !plan.aloud) return '';
    const wk = (p) => Math.max(1, Math.round(p / plan.weeks));
    const pp = (n) => `${n} page${n === 1 ? '' : 's'}`;
    const parts = [plan.student && `${pp(wk(plan.student))} a week read by the student`, plan.aloud && (plan.student ? `${wk(plan.aloud)} read aloud or together` : `${pp(wk(plan.aloud))} a week read aloud or together`)].filter(Boolean);
    const extra = [plan.estimated && 'selections estimated', plan.unknown && `${plan.unknown} text${plan.unknown > 1 ? 's' : ''} without a page count`].filter(Boolean);
    return `About ${parts.join(' and ')}, over ${Math.round(plan.weeks)} school weeks (${(plan.student + plan.aloud).toLocaleString()} pages in all${extra.length ? `; ${extra.join('; ')}` : ''}).`;
  }
  const loadHtml = (plan) => {
    const t = loadText(plan);
    return t ? `<p class="load"><strong>Reading load:</strong> ${esc(t)} <span class="by">Counts core texts and one pick per “choose one” group; leaves out electives, reference works and re-reads.</span></p>` : '';
  };

  function planBadges(t, plan) {
    const b = [];
    if (t.order) b.push(`<span class="badge plan-order" title="Reading order within this unit">${ordinal(t.order)}</span>`);
    if (t.pace === 'long') b.push('<span class="badge plan-long" title="Worked through slowly across the whole unit">Read over the unit</span>');
    if (t.role === 'selections') b.push(`<span class="badge plan-sel" title="Only part of the book is assigned">Selections${t.portion ? `: ${esc(t.portion)}` : ''}</span>`);
    if (t.role === 'reference') b.push('<span class="badge plan-ref" title="Consulted as needed, not read through">Reference</span>');
    if (t.role === 'review') b.push(`<span class="badge plan-review" title="Already read in an earlier unit">Re-read${t.reviewOf && rowById[t.reviewOf] ? `: first read in ${esc(rowById[t.reviewOf].title)}` : ''}</span>`);
    if (t.role === 'choice' && t.portion) b.push(`<span class="badge plan-sel">Read: ${esc(t.portion)}</span>`);
    if (t.role === 'choice' && plan?.defaults.has(t)) b.push('<span class="badge plan-default" title="The first option; any one of the group will do">Suggested pick</span>');
    return b.join(' ');
  }

  // a unit's texts in reading order, with each "choose one" group boxed where its first member falls
  const choiceBox = (items) => `<div class="text-choice"><div class="choice-head">Choose one</div>${items}</div>`;
  function textsHtml(r, item, wrap = choiceBox) {
    const plan = readingPlan(r);
    const placed = new Set();
    return plan.texts
      .map((t) => {
        if (placed.has(t)) return '';
        if (t.role !== 'choice') return placed.add(t), item(t, plan);
        const group = plan.texts.filter((x) => x.role === 'choice' && x.group === t.group);
        group.forEach((x) => placed.add(x));
        return wrap(group.map((x) => item(x, plan)).join(''));
      })
      .join('');
  }


  // ---------- workload estimates: total reading and work hours for a whole unit ----------
  const WORK_LABEL = { exercises: 'exercises & lessons', writing: 'writing', translation: 'translation', memorization: 'memorization', recitation: 'recitation', discussion: 'discussion', lab: 'labs', practice: 'practice', project: 'projects', 'exam-prep': 'exam prep' };
  const workHours = (r) => (r.workload?.work || []).reduce((n, w) => n + (w.hours || 0), 0);
  const workloadTotal = (r) => (r.workload ? (r.workload.readingHours || 0) + workHours(r) : null);
  const hrs = (n) => `${Math.round(n).toLocaleString()} h`;
  function workloadHtml(r) {
    const w = r.workload;
    if (!w) return '';
    const total = workloadTotal(r);
    const work = (w.work || []).slice().sort((a, b) => b.hours - a.hours);
    const bar = total
      ? `<div class="effort-bar" aria-hidden="true">${w.readingHours ? `<i class="k-reading" style="flex:${w.readingHours}"></i>` : ''}${work.map((x) => `<i class="k-${esc(x.kind)}" style="flex:${x.hours}" title="${esc(WORK_LABEL[x.kind] || x.kind)}: ${hrs(x.hours)}"></i>`).join('')}</div>`
      : '';
    return `<h3>Estimated effort</h3>
      <div class="effort"><p class="effort-total"><strong>About ${hrs(total)}</strong> for the whole unit: ${hrs(w.readingHours || 0)} reading and ${hrs(workHours(r))} of work.</p>${bar}
      <ul class="effort-list">${w.readingHours ? `<li><span class="sw k-reading"></span><strong>Reading, ${hrs(w.readingHours)}</strong>${w.readingBasis ? ` <span class="by">${esc(w.readingBasis)}</span>` : ''}</li>` : ''}${work
        .map((x) => `<li><span class="sw k-${esc(x.kind)}"></span><strong>${esc(WORK_LABEL[x.kind] || x.kind)}, ${hrs(x.hours)}</strong>${x.note ? ` <span class="by">${esc(x.note)}</span>` : ''}</li>`)
        .join('')}</ul>
      <p class="by">Estimates for a typical student, as totals for the whole unit (${esc(ageLabel(r))}); how they spread across the school year is set separately.</p></div>`;
  }


  // ---------- time spent: logged per child, per text or program, and per lesson for textbooks and language books ----------
  const LANGUAGE_TRACKS = new Set(['latin', 'greek', 'hebrew', 'spanish', 'chinese', 'old-english']);
  const ACTIVITIES = {
    book: [['reading', 'Reading'], ['discussion', 'Discussing'], ['writing', 'Writing']],
    textbook: [['reading', 'Reading'], ['exercises', 'Exercises']],
    language: [['learning', 'Learning'], ['practice', 'Practicing'], ['study', 'Studying']],
  };
  const TYPE_LABEL = { book: 'Book', textbook: 'Textbook', language: 'Language book' };
  const fmtMin = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let timeChild = '';

  function timeItems(r, cid) {
    const S = window.Store;
    const bundle = LANGUAGE_TRACKS.has(r.track) ? 'language' : 'textbook';
    const items = (r.coreTexts || []).map((t) => ({
      key: `t:${S.textKey(t)}`, title: cleanTitle(t), by: t.author, type: t.kind === 'instructional' ? bundle : 'book', lessons: t.lessons, label: t.lessonLabel || 'lesson',
    }));
    for (const name of S.programs(cid, r.id)) {
      const o = (r.curriculumOptions || []).find((x) => x.name === name);
      if (o) items.push({ key: `p:${name}`, title: name, by: o.publisher, type: bundle, lessons: o.lessons, label: o.lessonLabel || 'lesson', program: true });
    }
    return items;
  }

  function timeItemHtml(r, cid, it) {
    const S = window.Store;
    const log = S.timeLog(cid, r.id, it.key);
    const acts = ACTIVITIES[it.type];
    const total = log.reduce((n, e) => n + e.m, 0);
    const byAct = acts.map(([k, l]) => [l, log.filter((e) => e.a === k).reduce((n, e) => n + e.m, 0)]).filter(([, m]) => m);
    const isBundle = it.type !== 'book';
    const lessonsLogged = isBundle ? [...new Set(log.filter((e) => e.l).map((e) => e.l))].sort((a, b) => a - b) : [];
    const kind = `${TYPE_LABEL[it.type]}${isBundle && it.lessons ? ` · ${it.lessons} ${it.label}s` : ''}${it.program ? ' · program' : ''}`;
    const lessonField = !isBundle
      ? ''
      : it.lessons
        ? `<select name="l" aria-label="${esc(cap(it.label))}">${Array.from({ length: it.lessons }, (_, i) => `<option value="${i + 1}">${esc(cap(it.label))} ${i + 1}${lessonsLogged.includes(i + 1) ? ' ✓' : ''}</option>`).join('')}</select>`
        : `<input name="l" type="number" min="1" inputmode="numeric" placeholder="${esc(cap(it.label))} #" aria-label="${esc(cap(it.label))} number" class="ti-lnum">`;
    const byLesson = isBundle && lessonsLogged.length
      ? `<details class="ti-by"><summary>By ${esc(it.label)} (${lessonsLogged.length}${it.lessons ? ` of ${it.lessons}` : ''})</summary><table><thead><tr><th>${esc(cap(it.label))}</th>${acts.map(([, l]) => `<th>${esc(l)}</th>`).join('')}<th>Total</th></tr></thead><tbody>${lessonsLogged
          .map((n) => {
            const es = log.filter((e) => e.l === n);
            return `<tr><td>${n}</td>${acts.map(([k]) => `<td>${(() => { const m = es.filter((e) => e.a === k).reduce((x, e) => x + e.m, 0); return m ? fmtMin(m) : ''; })()}</td>`).join('')}<td>${fmtMin(es.reduce((x, e) => x + e.m, 0))}</td></tr>`;
          })
          .join('')}</tbody></table></details>`
      : '';
    return `<div class="time-item">
      <div class="ti-head"><span class="ti-title"><strong>${esc(it.title)}</strong>${it.by ? ` <span class="by">— ${esc(it.by)}</span>` : ''}</span><span class="ti-total">${total ? fmtMin(total) : '—'}</span></div>
      <div class="ti-meta"><span class="badge ti-kind">${esc(kind)}</span>${byAct.length ? byAct.map(([l, m]) => `<span>${esc(l)} ${fmtMin(m)}</span>`).join('') : '<span class="by">No time logged yet</span>'}${isBundle && it.lessons ? `<span>${lessonsLogged.length} of ${it.lessons} ${esc(it.label)}s logged</span>` : ''}${it.program ? `<button type="button" class="linkish" data-untrack="${esc(it.title)}">Stop tracking</button>` : ''}</div>
      <form class="ti-add" data-add="${esc(it.key)}" data-type="${it.type}">
        ${lessonField}
        <select name="a" aria-label="Activity">${acts.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select>
        <input name="m" type="number" min="1" max="1440" inputmode="numeric" placeholder="minutes" aria-label="Minutes spent" required>
        <button type="submit" class="chip">Add</button>
      </form>
      ${byLesson}
      ${log.length ? `<details class="ti-log"><summary>Entries (${log.length})</summary><ul>${log
        .map((e, i) => ({ e, i }))
        .reverse()
        .map(({ e, i }) => `<li>${esc(e.d)} · ${e.l ? `${esc(cap(it.label))} ${e.l} · ` : ''}${esc((acts.find(([k]) => k === e.a) || [, e.a])[1])} · ${fmtMin(e.m)} <button type="button" class="ti-del" data-del="${esc(it.key)}|${i}" aria-label="Remove this entry">×</button></li>`)
        .join('')}</ul></details>` : ''}
    </div>`;
  }

  function timeSection(r) {
    const S = window.Store;
    const kids = S?.children() || [];
    if (!kids.length) return '';
    if (!kids.some((c) => c.id === timeChild)) timeChild = kids.some((c) => c.id === S.activeChild) ? S.activeChild : kids[0].id;
    const c = S.child(timeChild);
    const items = timeItems(r, c.id);
    const all = Object.values(S.timeItems(c.id, r.id)).flat();
    const total = all.reduce((n, e) => n + e.m, 0);
    const est = workloadTotal(r);
    const tracked = new Set(S.programs(c.id, r.id));
    const untracked = (r.curriculumOptions || []).filter((o) => !tracked.has(o.name));
    return `<h3>Time spent</h3>
      <div class="time-sec">
        ${kids.length > 1 ? `<div class="chips" role="group" aria-label="Child">${kids.map((k) => `<button type="button" class="chip" data-time-child="${esc(k.id)}" aria-pressed="${k.id === c.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
        <p class="time-sum"><strong>${esc(c.name)}: ${total ? fmtMin(total) : 'nothing'} logged</strong> in this unit${est ? `, of about ${Math.round(est)} h estimated` : ''}. Type the minutes spent and choose the activity; each entry is dated today.</p>
        ${items.length ? items.map((it) => timeItemHtml(r, c.id, it)).join('') : '<p class="desc">This unit has no listed texts. Track the curriculum program you use below.</p>'}
        ${untracked.length ? `<label class="time-prog">Track a curriculum program <select data-track-program><option value="">Choose…</option>${untracked.map((o) => `<option value="${esc(o.name)}">${esc(o.name)}${o.lessons ? ` (${o.lessons} ${esc(o.lessonLabel || 'lesson')}s)` : ''}</option>`).join('')}</select></label>` : ''}
      </div>`;
  }

  // ---------- whose progress a view shows: family children, then demo children not loaded into the family ----------
  const quarterAge = (a) => (Math.floor(a * 4) / 4).toFixed(2);
  function childOptions() {
    const S = window.Store;
    const kids = S?.children() || [];
    const demos = window.Demo && S ? window.Demo.notInStore(DATA, S) : [];
    return [...kids.map((c) => [`store:${c.id}`, c.name]), ...demos.map((d) => [`demo:${d.id}`, `${d.name} · age ${quarterAge(d.age)}`])];
  }
  // resolve a child choice to { key, name, age, status }; a demo already loaded into the family resolves to that child
  function childFor(key) {
    const S = window.Store;
    const kids = S?.children() || [];
    const demos = window.Demo ? window.Demo.profiles(DATA) : [];
    const fromStore = (c) => ({ key: `store:${c.id}`, id: c.id, name: c.name, age: S.age(c) ?? 0, status: (id) => S.status(c.id, id) });
    if (key?.startsWith('store:')) {
      const c = S?.child(key.slice(6));
      if (c) return fromStore(c);
    }
    if (key?.startsWith('demo:')) {
      const d = demos.find((x) => `demo:${x.id}` === key);
      const loaded = d && kids.find((c) => c.name === d.name);
      if (loaded) return fromStore(loaded);
      if (d) return { key, name: d.name, age: d.age, status: (id) => d.progress[id] || '' };
    }
    return null;
  }
  function defaultChild() {
    const S = window.Store;
    return (S?.activeChild && S.child(S.activeChild) && `store:${S.activeChild}`) || (S?.children()[0] && `store:${S.children()[0].id}`) || 'demo:demo-thomas';
  }

  // the units a child should be on now in one track: in progress or running at their age; when behind, the first
  // unfinished unit whose age has already come. Empty when the track is finished or not yet begun.
  function nowUnits(rows, who) {
    const open = [...rows].sort((a, b) => a.order - b.order || a.ageStart - b.ageStart).filter((r) => who.status(r.id) !== 'done');
    const now = open.filter((r) => who.status(r.id) === 'active' || (r.ageStart <= who.age && who.age < r.ageEnd));
    if (now.length) return now;
    return open[0] && open[0].ageStart <= who.age ? [open[0]] : [];
  }
  // the next step after `current` in a track: units unlocked by it, else the next unfinished unit in order
  function nextUnits(rows, current, who) {
    const used = new Set(current.map((r) => r.id));
    const pool = rows.filter((r) => !used.has(r.id) && who.status(r.id) !== 'done').sort((a, b) => a.order - b.order);
    const ids = new Set(current.map((r) => r.id));
    const unlocked = pool.filter((r) => (r.prerequisites || []).some((p) => ids.has(p)));
    if (unlocked.length) return unlocked.slice(0, 2);
    const after = current.length ? Math.max(...current.map((r) => r.order)) : -Infinity;
    return pool.filter((r) => r.order > after).slice(0, 1);
  }

  // ---------- modal dialogs and the printable booklist ----------
  function modal(html, { label, onClose } = {}) {
    const d = document.createElement('dialog');
    d.className = 'modal';
    if (label) d.setAttribute('aria-label', label);
    d.innerHTML = `<button type="button" class="close" aria-label="Close" data-close>×</button>${html}`;
    // the radial tree's fullscreen shell only paints its own subtree
    (document.fullscreenElement || document.webkitFullscreenElement || document.body).append(d);
    const close = () => d.close();
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) close();
    });
    d.addEventListener('close', () => {
      d.remove();
      onClose?.();
    });
    if (d.showModal) d.showModal();
    else d.setAttribute('open', '');
    return d;
  }

  const readerShort = { teacher: 'teacher reads', together: 'read together', student: 'student reads' };
  function booklistUnitHtml(r, label) {
    const plan = readingPlan(r);
    const item = (t) => {
      const bits = [t.author, readerShort[t.reader], lengthLabel(t), t.publicDomain ? 'free' : 'to buy'].filter(Boolean).map(esc).join(' · ');
      const marks = [
        t.order && ordinal(t.order),
        t.pace === 'long' && 'read over the unit',
        t.role === 'selections' && `selections${t.portion ? `: ${t.portion}` : ''}`,
        t.role === 'reference' && 'reference',
        t.role === 'review' && 're-read',
        t.role === 'choice' && plan.defaults.has(t) && 'suggested pick',
        isElective(t) && 'elective',
      ].filter(Boolean);
      return `<li><span class="bl-title">${esc(cleanTitle(t))}</span>${marks.length ? ` <span class="bl-marks">[${esc(marks.join(', '))}]</span>` : ''}${bits ? `<div class="bl-meta">${bits}</div>` : ''}</li>`;
    };
    const texts = r.coreTexts?.length
      ? `<ul>${textsHtml(r, item, (items) => `<li class="bl-choice">Choose one:<ul>${items}</ul></li>`)}</ul>`
      : '<p class="bl-meta">No listed texts (a practice or skills unit).</p>';
    const load = loadText(plan);
    return `<div class="bl-unit"><h4>${esc(r.title)} <span class="bl-meta">age ${esc(ageLabel(r))}${label ? ` · ${esc(label)}` : ''}</span></h4>${load ? `<p class="bl-meta">${esc(load)}</p>` : ''}${texts}</div>`;
  }

  // ask which lists to print (current units, next units or both), then print just that booklist
  function printBooklist({ who, current, next }) {
    const counts = { current: current.length, next: next.length };
    const d = modal(
      `<h2>Print booklist</h2>
      <p class="desc">For ${esc(who.name)}, age ${esc(quarterAge(who.age))}. Texts are grouped by track, in reading order, with who reads them, their length, and whether they are free.</p>
      <form method="dialog" class="bl-form">
        <label class="check"><input type="radio" name="which" value="current" checked> The units shown now <small>(${counts.current})</small></label>
        <label class="check"><input type="radio" name="which" value="next"${counts.next ? '' : ' disabled'}> The next units <small>(${counts.next})</small></label>
        <label class="check"><input type="radio" name="which" value="both"${counts.next ? '' : ' disabled'}> Both</label>
        <div class="form-actions"><button type="submit" class="btn" value="print">Print</button> <button type="button" class="btn secondary" data-close>Cancel</button></div>
      </form>`,
      { label: 'Print booklist' },
    );
    d.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const which = new FormData(e.target).get('which');
      d.close();
      const byTrack = (rows, label) => {
        const tracks = trackOrder.filter((id) => rows.some((r) => r.track === id));
        return tracks
          .map((id) => `<section class="bl-track"><h3>${esc(trackTitle(id))} <span class="bl-meta">${esc(trackById[id]?.group || '')}</span></h3>${rows.filter((r) => r.track === id).map((r) => booklistUnitHtml(r, label)).join('')}</section>`)
          .join('');
      };
      const parts = [];
      if (which !== 'next') parts.push(`<h2>Now</h2>${byTrack(current, 'now') || '<p>No units.</p>'}`);
      if (which !== 'current') parts.push(`<h2>Next</h2>${byTrack(next, 'next') || '<p>No units.</p>'}`);
      const el = document.createElement('section');
      el.id = 'print-booklist';
      el.innerHTML = `<h1>${esc(who.name)}'s booklist</h1><p class="bl-meta">Age ${esc(quarterAge(who.age))} · printed ${esc(new Date().toLocaleDateString())} · Formation Program</p>${parts.join('')}`;
      document.getElementById('print-booklist')?.remove();
      document.body.append(el);
      document.documentElement.classList.add('printing-booklist');
      const done = () => {
        document.documentElement.classList.remove('printing-booklist');
        el.remove();
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      setTimeout(() => window.print(), 50);
    });
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
    const rerender = (focusSel) => {
      const top = panel.scrollTop;
      showDetail(currentRow, onNavigate);
      panel.scrollTop = top;
      if (focusSel) panel.querySelector(focusSel)?.focus();
    };
    panel.addEventListener('submit', (e) => {
      const f = e.target.closest('form[data-add]');
      if (!f) return;
      e.preventDefault();
      const d = new FormData(f);
      const ok = window.Store.logTime(timeChild, currentRow, f.dataset.add, { activity: d.get('a'), minutes: d.get('m'), lesson: d.get('l') || null });
      if (ok) rerender(`form[data-add="${CSS.escape(f.dataset.add)}"] input[name="m"]`);
    });
    panel.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-track-program]');
      if (!sel || !sel.value) return;
      window.Store.setProgram(timeChild, currentRow, sel.value, true);
      rerender();
    });
    panel.addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const i = del.dataset.del.lastIndexOf('|');
        window.Store.removeTime(timeChild, currentRow, del.dataset.del.slice(0, i), +del.dataset.del.slice(i + 1));
        return rerender();
      }
      const tc = e.target.closest('[data-time-child]');
      if (tc) {
        timeChild = tc.dataset.timeChild;
        return rerender();
      }
      const un = e.target.closest('[data-untrack]');
      if (un) {
        window.Store.setProgram(timeChild, currentRow, un.dataset.untrack, false);
        return rerender();
      }
      const sb = e.target.closest('[data-status]');
      if (sb) {
        const [cid, st] = sb.dataset.status.split('|');
        const r = rowById[currentRow];
        window.Store.setStatus(cid, r.id, st);
        // completing a unit shelves its required (non-elective) texts
        if (st === 'done') window.Store.addBooks(cid, window.Store.requiredTexts(r).map((t) => ({ ...t, rowId: r.id, track: r.track })));
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
      ${timeSection(r)}
      ${r.objectives?.length ? `<h3>Objectives</h3><ul>${r.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
      ${workloadHtml(r)}
      ${
        texts.length
          ? `<h3>Core texts</h3>${loadHtml(readingPlan(r))}${textsHtml(
              r,
              (x, plan) => `<div class="text-item"><strong>${esc(cleanTitle(x))}</strong>${isElective(x) ? ' <span class="badge elective">elective</span>' : ''}${x.author ? ` <span class="by">— ${esc(x.author)}</span>` : ''}${x.date ? ` <span class="by">(${esc(x.date)})</span>` : ''} ${planBadges(x, plan)} ${x.publicDomain ? '<span class="badge pd">Free / public domain</span>' : ''} ${kindBadge(x)} ${readerBadge(x)} ${lengthLabel(x) ? `<span class="by">· ${lengthLabel(x)}</span>` : ''}${linkList(x.links)}</div>`,
            )}`
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
      ${r.exams?.length ? `<h3>Prepares for</h3><div class="navlinks">${r.exams
        .map((id) => examById[id])
        .filter(Boolean)
        .map((x) => `<a class="badge exam-badge" href="exams.html#${esc(x.id)}">${esc(x.name)}</a>`)
        .join(' ')}</div>` : ''}
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
    DATA, trackOrder, trackById, rowById, levelById, levelOrder, unlocks, examById,
    esc, ageLabel, fmtAge, levelBadge, trackTitle, statusBadge, readerBadge, lengthLabel,
    readState, writeState, matches, renderFilters, showDetail,
    isElective, cleanTitle, readingPlan, loadText, planBadges, textsHtml, workloadTotal, workloadHtml, workHours,
    quarterAge, childOptions, childFor, defaultChild, nowUnits, nextUnits, modal, printBooklist,
  };
})();
