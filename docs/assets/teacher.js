// Teacher Plan: what the teacher reads, studies and prepares, and when, built from the curriculum and each child's
// progress with the lead times in data/teacher.yaml. Nothing here is stored except the "prepared" marks.
(function () {
  const { DATA, esc, rowById, showDetail, teacherCategory, teacherHours, quarterAge } = window.App;
  const S = window.Store;
  const $ = (id) => document.getElementById(id);
  const CATS = DATA.teacher?.categories || [];
  const H = 2; // years shown ahead
  const now = new Date();
  const YEAR = 365.25 * 864e5;
  const toDate = (t) => new Date(now.getTime() + t * YEAR);
  const monthLabel = (t) => toDate(t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  const span = (r) => Math.max(r.ageEnd - r.ageStart, 0.25);
  const hw = (h) => (h >= 10 ? `${Math.round(h)} h` : `${h.toFixed(1)} h`);
  let pick = new URLSearchParams(location.hash.slice(1)).get('child') || 'all';

  // the children the plan covers: the family, or the demo family when no child has been added
  function children() {
    const kids = S.children().filter((c) => c.birthdate);
    if (kids.length) {
      return kids.map((c) => {
        const who = window.App.childFor(`store:${c.id}`);
        return { key: c.id, name: c.name, age: who.age, status: who.status, started: (id) => S.record(c.id, id)?.started };
      });
    }
    return (window.Demo?.profiles(DATA) || []).map((d) => ({ key: d.id, name: d.name, age: d.age, demo: true, status: (id) => d.progress[id] || '', started: () => '' }));
  }

  // each child's units on the calendar, in years from today
  function studentUnits(k) {
    const out = [];
    for (const r of DATA.rows) {
      if (!r.workload || !teacherHours(r)) continue;
      const st = k.status(r.id);
      if (st === 'done' || (r.elective && !st)) continue;
      let a, b;
      if (st === 'active') {
        const s0 = k.started(r.id);
        a = s0 ? (new Date(`${s0}T00:00:00`) - now) / YEAR : Math.min(0, r.ageStart - k.age);
        b = Math.max(a + span(r), 1 / 12);
      } else {
        a = Math.max(0, r.ageStart - k.age);
        b = a + span(r);
      }
      if (a > H + 1) continue;
      out.push({ r, a, b, child: k });
    }
    return out;
  }

  // the teacher's tasks: one per unit (shared by children), shifted earlier by the unit's lead time
  function plan(kids) {
    const byUnit = new Map();
    for (const k of kids) for (const u of studentUnits(k)) {
      const prev = byUnit.get(u.r.id);
      if (!prev) byUnit.set(u.r.id, { ...u, kids: [k.name] });
      else { prev.kids.push(k.name); if (u.a < prev.a) Object.assign(prev, { a: u.a, b: u.b }); }
    }
    const tasks = [];
    for (const u of byUnit.values()) {
      const c = teacherCategory(u.r);
      const L = c.leadMonths / 12;
      const hours = teacherHours(u.r);
      let ta = u.a - L, tb = Math.max(u.b - L, ta + 1 / 12);
      const prepared = S.teacherPrepared(u.r.id);
      let state = ta > 0.5 ? 'later' : ta > 0 ? 'soon' : 'now';
      let need = hours;
      if (ta < 0) {
        if (u.a >= 0) state = 'late'; // the student has not begun, but the teacher's window has
        else need = tb > 0 ? (hours * tb) / (tb - ta) : 0; // the student is under way: only the part still ahead
        ta = 0;
        tb = Math.max(tb, 1 / 12);
      }
      if (tb <= 0 || (need <= 0 && state !== 'late')) state = 'past';
      tasks.push({ ...u, c, hours, need: prepared ? 0 : need, ta, tb, state: prepared ? 'prepared' : state, perWeek: prepared ? 0 : need / ((tb - ta) * 52) });
    }
    return tasks.filter((t) => t.state !== 'past' || S.teacherPrepared(t.r.id));
  }

  const loadAt = (tasks, t0, t1) => {
    const out = Object.fromEntries(CATS.map((c) => [c.id, 0]));
    for (const t of tasks) {
      const ov = Math.max(0, Math.min(t.tb, t1) - Math.max(t.ta, t0));
      if (ov) out[t.c.id] += (t.perWeek * ov) / (t1 - t0);
    }
    return out;
  };
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  function render() {
    const kids = children();
    const shown = pick === 'all' ? kids : kids.filter((k) => k.key === pick);
    const tasks = plan(shown.length ? shown : kids);
    const demo = kids.some((k) => k.demo);

    $('teacher-controls').innerHTML = `<div class="chips" role="group" aria-label="Children">
      <button type="button" class="chip" data-pick="all" aria-pressed="${pick === 'all'}">Whole family</button>
      ${kids.map((k) => `<button type="button" class="chip" data-pick="${esc(k.key)}" aria-pressed="${pick === k.key}">${esc(k.name)} <small>${esc(quarterAge(k.age))}</small></button>`).join('')}
      </div>${demo ? '<span class="by">Showing the demo family. Add your children on <a href="family.html">Family Progress</a>.</span>' : ''}`;

    // months: average teacher hours a week in each of the next 24 months, by kind of preparation
    const months = Array.from({ length: H * 12 }, (_, m) => ({ m, t0: m / 12, t1: (m + 1) / 12, by: loadAt(tasks, m / 12, (m + 1) / 12) }));
    const thisWeek = sum(loadAt(tasks, 0, 1 / 52));
    const catchUp = sum(loadAt(tasks.filter((t) => t.state === 'late'), 0, 1 / 52));
    const next3 = months.slice(0, 3).reduce((a, x) => a + sum(x.by), 0) / 3;
    const peak = months.reduce((p, x) => (sum(x.by) > sum(p.by) ? x : p), months[0]);
    const nowTasks = tasks.filter((t) => t.state === 'now' || t.state === 'late');
    $('teacher-summary').innerHTML = `<div class="wl-tiles teacher-tiles">
      <div class="wl-tile"><div class="wl-head"><strong>This week</strong></div><div class="wl-num">${hw(thisWeek)} <small>of preparation</small></div><div class="by">${catchUp >= 0.5 ? `${hw(catchUp)} of it catching up late starts · ` : ''}about ${hw(thisWeek / 6)} a day over six days</div></div>
      <div class="wl-tile"><div class="wl-head"><strong>Next three months</strong></div><div class="wl-num">${hw(next3)} <small>a week on average</small></div><div class="by">${nowTasks.length} unit${nowTasks.length === 1 ? '' : 's'} to prepare now</div></div>
      <div class="wl-tile"><div class="wl-head"><strong>Busiest month ahead</strong></div><div class="wl-num">${hw(sum(peak.by))} <small>a week</small></div><div class="by">${esc(monthLabel(peak.t0))}</div></div>
    </div>`;

    const max = Math.max(1, ...months.map((x) => sum(x.by))) * 1.1;
    const cols = months
      .map((x) => {
        const total = sum(x.by);
        const tip = `${monthLabel(x.t0)}: ${hw(total)} a week (${CATS.map((c) => `${c.label} ${hw(x.by[c.id])}`).join(', ')})`;
        return `<div class="tcol" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><div class="tstack" style="height:${((100 * total) / max).toFixed(1)}%">${CATS.map((c) => (x.by[c.id] > 0.05 ? `<i class="tseg tc-${esc(c.id)}" style="flex:${x.by[c.id]}"></i>` : '')).join('')}</div><span class="tlab">${x.m % 3 === 0 ? esc(toDate(x.t0).toLocaleDateString(undefined, { month: 'short' })) : ''}</span></div>`;
      })
      .join('');
    $('teacher-chart').innerHTML = `<section class="panel-card">
      <h2>Teacher preparation, month by month <small>average hours a week, next two years</small></h2>
      <div class="hlegend">${CATS.map((c) => `<span><i class="tc-${esc(c.id)}"></i>${esc(c.label)}</span>`).join('')}</div>
      <div class="tchart">${cols}</div>
      <details class="ttable"><summary>Show as a table</summary><div class="table-wrap"><table class="wl-table"><thead><tr><th>Month</th>${CATS.map((c) => `<th class="num">${esc(c.label)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${months
        .map((x) => `<tr><td>${esc(monthLabel(x.t0))}</td>${CATS.map((c) => `<td class="num">${hw(x.by[c.id])}</td>`).join('')}<td class="num"><strong>${hw(sum(x.by))}</strong></td></tr>`)
        .join('')}</tbody></table></div></details>
    </section>`;

    const row = (t) => `<tr class="ts-${t.state}"><td><button type="button" class="linkish" data-open="${esc(t.r.id)}">${esc(t.r.title)}</button>${t.r.elective ? ' <span class="badge unit-elective">Elective</span>' : ''}</td>
      <td>${esc(t.kids.join(', '))}</td><td><span class="badge tk-${esc(t.c.id)}">${esc(t.c.label)}</span></td>
      <td>${esc(monthLabel(t.ta))} – ${esc(monthLabel(t.tb))}${t.state === 'late' ? ' <span class="badge ts-late">Late start</span>' : ''}</td>
      <td>${t.a <= 0 ? 'under way' : esc(monthLabel(t.a))}</td><td class="num">${hw(t.perWeek)}</td>
      <td><button type="button" class="chip" data-prep="${esc(t.r.id)}" aria-pressed="${t.state === 'prepared'}">${t.state === 'prepared' ? '✓ Prepared' : 'Mark prepared'}</button></td></tr>`;
    const table = (list) => `<div class="table-wrap"><table class="wl-table tt"><thead><tr><th>Unit</th><th>For</th><th>Kind</th><th>Teacher works</th><th>Student starts</th><th class="num">h a week</th><th></th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`;
    const order = { late: 0, now: 1 };
    const nowList = nowTasks.sort((x, y) => order[x.state] - order[y.state] || x.a - y.a);
    $('teacher-now').innerHTML = `<section class="panel-card"><h2>Prepare now <small>${nowList.length} unit${nowList.length === 1 ? '' : 's'}</small></h2>
      <p class="by">Units whose preparation window is open today. "Late start" means the window opened before today and the student has not begun, so the teacher starts now.</p>
      ${nowList.length ? table(nowList) : '<p class="empty">Nothing to prepare this week.</p>'}</section>`;

    const soon = tasks.filter((t) => t.state === 'soon').sort((x, y) => x.ta - y.ta);
    const prepared = tasks.filter((t) => t.state === 'prepared');
    $('teacher-next').innerHTML = `<section class="panel-card"><h2>Coming up <small>preparation that begins in the next six months</small></h2>
      ${soon.length ? table(soon) : '<p class="empty">Nothing begins in the next six months.</p>'}
      ${prepared.length ? `<details><summary>Prepared (${prepared.length})</summary>${table(prepared)}</details>` : ''}</section>`;

    // the steady load for one child who follows the curriculum at its ages, grade by grade (no catching up)
    const B = DATA.budget;
    const core = DATA.rows.filter((r) => !r.elective && r.workload && teacherHours(r));
    const grades = (B?.years || []).map((y) => {
      const by = Object.fromEntries(CATS.map((c) => [c.id, 0]));
      for (const r of core) {
        const c = teacherCategory(r), L = c.leadMonths / 12, a = r.ageStart - L, b = r.ageEnd - L;
        const ov = Math.max(0, Math.min(b, y.ageEnd) - Math.max(a, y.ageStart));
        if (ov) by[c.id] += (teacherHours(r) * ov) / Math.max(b - a, 0.25) / 52;
      }
      return { y, by };
    });
    $('teacher-grades').innerHTML = `<section class="panel-card"><h2>For one child, grade by grade <small>teacher hours a week, when every unit is prepared on time</small></h2>
      <p class="by">The teacher's steady load for a single child who keeps to the curriculum's ages. With several children, preparation done for an older child is not repeated for a younger one once it is marked prepared.</p>
      <div class="table-wrap"><table class="wl-table"><thead><tr><th>Student's grade</th>${CATS.map((c) => `<th class="num">${esc(c.label)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${grades
        .map(({ y, by }) => `<tr><td>${esc(y.label)} <small class="by">ages ${y.ageStart}–${y.ageEnd}</small></td>${CATS.map((c) => `<td class="num">${hw(by[c.id])}</td>`).join('')}<td class="num"><strong>${hw(sum(by))}</strong></td></tr>`)
        .join('')}</tbody></table></div></section>`;

    $('teacher-rules').innerHTML = `<section class="panel-card"><h2>How the plan is worked out</h2><ul class="trules">${CATS.map(
      (c) => `<li><span class="badge tk-${esc(c.id)}">${esc(c.label)}</span> <strong>${c.leadMonths} month${c.leadMonths === 1 ? '' : 's'} ahead.</strong> ${esc(c.rule)} <span class="by">${esc(c.basis || '')}</span></li>`,
    ).join('')}</ul><p class="by">Student dates come from each child's progress: units in progress from the day they were started, the rest from the child's age and the unit's ages. Hours are the teacher's estimated time to read, study or prepare, spread evenly over the teacher's window. A unit taken by more than one child is prepared once, for the first of them.</p></section>`;
  }

  // tooltip for the month columns
  const tip = document.createElement('div');
  tip.className = 'htip';
  tip.hidden = true;
  document.body.append(tip);
  const showTip = (el, x, y) => {
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, x - w / 2))}px`;
    tip.style.top = `${y - tip.offsetHeight - 10 + scrollY}px`;
  };
  const chart = $('teacher-chart');
  chart.addEventListener('pointermove', (e) => { const el = e.target.closest('.tcol'); if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  chart.addEventListener('pointerleave', () => (tip.hidden = true));
  chart.addEventListener('focusin', (e) => { const el = e.target.closest('.tcol'); if (el) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top); } });
  chart.addEventListener('focusout', () => (tip.hidden = true));

  document.querySelector('main.teacher').addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) { pick = p.dataset.pick; history.replaceState(null, '', pick === 'all' ? location.pathname : `#child=${pick}`); return render(); }
    const prep = e.target.closest('[data-prep]');
    if (prep) return S.setTeacherPrepared(prep.dataset.prep, !S.teacherPrepared(prep.dataset.prep));
    const o = e.target.closest('[data-open]');
    if (o && rowById[o.dataset.open]) showDetail(o.dataset.open);
  });
  S.onChange(render);
  render();
})();
