// School Hours: each grade's yearly budgets (weekday, Saturday, Sunday) against the core and elective work assigned.
(function () {
  const { DATA, esc, trackById, showDetail, dayOf, workloadTotal } = window.App;
  const B = DATA.budget;
  const $ = (id) => document.getElementById(id);
  if (!B || !B.years?.length) {
    $('hours-budget').innerHTML = '<p class="empty">No hour budget is defined (data/budget.yaml).</p>';
    return;
  }
  const years = B.years;
  // ages in quarters read as fractions: 12.75 → 12¾
  const age = (a) => `${Math.floor(a) || ''}${{ 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }[a % 1] ?? String(a % 1).slice(1)}` || '0';
  const DAYS = [
    { id: 'weekday', title: 'Weekday academics', sub: 'Monday to Friday' },
    { id: 'saturday', title: 'Saturday activities', sub: `${B.saturday.hoursPerDay} hours a day, ${B.saturday.weeks} Saturdays a year` },
    { id: 'sunday', title: 'Sunday Bible and theology', sub: `${(B.sunday.bands || []).map((b) => `${b.hoursPerWeek} h a week from ${age(b.ageStart)} to ${age(b.ageEnd)}`).join(', ')}; ${B.sunday.weeks} Sundays a year` },
  ];
  const n = (h) => Math.round(h).toLocaleString();
  const gradeShort = (y) => (y.grade ? `G${y.grade}` : 'K');
  const srcIndex = Object.fromEntries((B.sources || []).map((s, i) => [s.id, i + 1]));
  const cite = (id) => (srcIndex[id] ? `<sup><a href="#src-${esc(id)}">${srcIndex[id]}</a></sup>` : '');

  // spread each unit's hours evenly over its ages, then sum the share that falls in each grade's year
  const overlap = (r, y) => Math.max(0, Math.min(r.ageEnd, y.ageEnd) - Math.max(r.ageStart, y.ageStart));
  const span = (r) => Math.max(r.ageEnd - r.ageStart, 0.25);
  const load = years.map((y) => {
    const out = Object.fromEntries(DAYS.map((d) => [d.id, { core: 0, elective: 0, tracks: {} }]));
    for (const r of DATA.rows) {
      if (!r.workload) continue;
      const f = overlap(r, y) / span(r);
      if (!f) continue;
      const total = workloadTotal(r) || 0;
      const core = r.elective ? 0 : total;
      const el = r.elective ? total : r.workload.electiveHours || 0;
      const d = out[dayOf(r)];
      d.core += core * f;
      d.elective += el * f;
      const t = (d.tracks[r.track] ||= { core: 0, elective: 0, units: [] });
      t.core += core * f;
      t.elective += el * f;
      t.units.push(r);
    }
    return out;
  });
  const budgetOf = (y, day) => y[day] || 0;

  // ---------- the budgets ----------
  const bands = (B.weekday || [])
    .map((b) => `<tr><td>${esc(b.grades === 'K' ? 'Kindergarten' : `Grades ${b.grades}`)}</td><td>${n(b.regularHours)} h${cite(b.source)}</td><td>× ${b.multiplier}${b.precedent ? cite(b.precedent) : ''}</td><td><strong>${n(b.regularHours * b.multiplier)} h</strong></td></tr>`)
    .join('');
  $('hours-budget').innerHTML = `
    <section class="panel-card hours-budget">
      <h2>The yearly budgets</h2>
      <div class="hb-grid">
        <div><h3>Weekday academics</h3>
          <div class="table-wrap"><table class="hb-table"><thead><tr><th>Grades</th><th>Regular hours</th><th>Multiplier</th><th>Budget a year</th></tr></thead><tbody>${bands}</tbody></table></div></div>
        <div><h3>Weekends</h3>
          <p><strong>Saturday:</strong> ${B.saturday.hoursPerDay} h × ${B.saturday.weeks} Saturdays = <strong>${n(B.saturday.hoursPerDay * B.saturday.weeks)} h a year</strong>, for every grade.</p>
          <p><strong>Sunday:</strong> ${(B.sunday.bands || []).map((b) => `${b.hoursPerWeek} h a week from age ${age(b.ageStart)} to ${age(b.ageEnd)} (${n(b.hoursPerWeek * B.sunday.weeks)} h a year)`).join('; ')}.</p>
          <p class="by">Grade <em>g</em> runs from age <em>g</em>+${B.gradeAgeOffset} to <em>g</em>+${B.gradeAgeOffset + 1}; kindergarten is ages ${B.gradeAgeOffset}–${B.gradeAgeOffset + 1}.</p>
        </div>
      </div>
      ${B.notes ? `<p class="by">${esc(B.notes)}${cite('oecd')}</p>` : ''}
    </section>`;

  // ---------- one bar chart per part of the week ----------
  function panel(day) {
    const rows = years.map((y, i) => ({ y, b: budgetOf(y, day.id), ...load[i][day.id] }));
    const max = Math.max(1, ...rows.map((r) => Math.max(r.b, r.core))) * 1.3;
    const pct = (h) => `${Math.min(100, (100 * h) / max).toFixed(2)}%`;
    const bars = rows
      .map((r, i) => {
        const shown = Math.min(r.elective, Math.max(0, max - r.core));
        const clipped = shown < r.elective - 0.5;
        const ratio = r.b ? Math.round((100 * r.core) / r.b) : null;
        const over = r.b && r.core > r.b * 1.05;
        const val = r.b || r.core ? `${n(r.core)}${r.b ? ` / ${n(r.b)} h` : ' h'}${ratio != null ? ` · ${ratio}%` : ''}${over ? ' ▲' : ''}` : '—';
        const tip = `${r.y.label} (ages ${r.y.ageStart}–${r.y.ageEnd}): core ${n(r.core)} h${r.b ? ` of a ${n(r.b)} h budget` : ', no budget'}; elective ${n(r.elective)} h more`;
        return `<button type="button" class="hrow${String(r.y.grade) === selected ? ' on' : ''}" data-g="${r.y.grade}" aria-label="${esc(tip)}" data-tip="${esc(tip)}">
          <span class="hlab">${gradeShort(r.y)}</span>
          <span class="htrack">${r.core ? `<i class="hcore${shown ? '' : ' end'}" style="width:${pct(r.core)}"></i>` : ''}${shown > 0.5 ? `<i class="hel${clipped ? ' clipped' : ''}" style="width:${pct(shown)}"></i>` : ''}${r.b ? `<b class="hbud" style="left:${pct(r.b)}"></b>` : ''}</span>
          <span class="hval${over ? ' over' : ''}">${val}</span>
        </button>`;
      })
      .join('');
    return `<section class="panel-card hours-panel" aria-label="${esc(day.title)}">
      <h2>${esc(day.title)} <small>${esc(day.sub)}</small></h2>
      <div class="hlegend"><span><i class="sw-core"></i>Core units</span><span><i class="sw-el"></i>Elective (extra)</span><span><i class="sw-bud"></i>Yearly budget</span></div>
      <div class="hbars">${bars}</div>
    </section>`;
  }

  // ---------- one grade in detail: every track's share, with its units ----------
  let selected = new URLSearchParams(location.hash.slice(1)).get('g') || String(years.find((y) => y.grade === 6)?.grade ?? years[0].grade);
  function gradeDetail() {
    const i = years.findIndex((y) => String(y.grade) === selected);
    const y = years[i >= 0 ? i : 0];
    const L = load[i >= 0 ? i : 0];
    const chips = years.map((g) => `<button type="button" class="chip" data-g="${g.grade}" aria-pressed="${g === y}">${gradeShort(g)}</button>`).join('');
    const order = DATA.groups.flatMap((g) => g.tracks);
    const sections = DAYS.map((d) => {
      const tr = Object.entries(L[d.id].tracks).filter(([, v]) => v.core >= 0.5 || v.elective >= 0.5).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
      if (!tr.length) return '';
      const body = tr
        .map(([id, v]) => {
          const units = v.units.map((r) => `<button type="button" class="unit-chip${r.elective ? ' is-el' : ''}" data-open="${esc(r.id)}" title="${esc(r.title)}${r.elective ? ' (elective)' : ''}">${esc(r.title.length > 42 ? `${r.title.slice(0, 40)}…` : r.title)}</button>`).join('');
          return `<tr><td class="track">${esc(trackById[id]?.title || id)}</td><td class="num">${v.core >= 0.5 ? n(v.core) : '—'}</td><td class="num">${v.elective >= 0.5 ? n(v.elective) : '—'}</td><td><div class="unit-links">${units}</div></td></tr>`;
        })
        .join('');
      const b = budgetOf(y, d.id);
      return `<h3>${esc(d.title)}</h3><div class="table-wrap"><table class="hg-table"><thead><tr><th>Track</th><th class="num">Core h</th><th class="num">Elective h</th><th>Units in this year</th></tr></thead><tbody>${body}</tbody>
        <tfoot><tr><td>Total</td><td class="num"><strong>${n(L[d.id].core)}</strong>${b ? ` of ${n(b)}` : ''}</td><td class="num">${n(L[d.id].elective)}</td><td></td></tr></tfoot></table></div>`;
    }).join('');
    $('hours-grade').innerHTML = `<section class="panel-card hours-grade">
      <h2>${esc(y.label)} in detail <small>ages ${y.ageStart}–${y.ageEnd}</small></h2>
      <div class="chips" role="group" aria-label="Grade">${chips}</div>
      ${termsHtml(y)}
      <p class="by">Each unit's hours are spread evenly over its ages, so a unit running over two years counts half in each. Select a unit to open it.</p>
      ${sections}
    </section>`;
  }

  // the year as four 12-week terms: the weekday units studied in each, heaviest first; light weekly practices are counted, not listed
  const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
  const perWeek = (r) => (workloadTotal(r) || 0) / Math.max(r.ageEnd - r.ageStart, 0.25) / (B.saturday.weeks || 48);
  function termsHtml(y) {
    const wk = DATA.rows.filter((r) => !r.elective && dayOf(r) === 'weekday' && r.workload);
    const cols = TERMS.map((label, i) => {
      const a = y.ageStart + i / 4;
      const on = wk.filter((r) => r.ageStart <= a + 1e-9 && a < r.ageEnd - 1e-9).sort((p, q) => perWeek(q) - perWeek(p));
      const main = on.filter((r) => perWeek(r) >= 1.5);
      const light = on.length - main.length;
      const h = on.reduce((s, r) => s + perWeek(r), 0);
      return `<div class="term"><h4>${label} <small>ages ${age(a)}–${age(a + 0.25)} · ${Math.round(h)} h a week</small></h4><ul>${main
        .map((r) => `<li><button type="button" class="linkish" data-open="${esc(r.id)}">${esc(r.title)}</button> <span class="by">${esc(trackById[r.track]?.title || r.track)} · ${perWeek(r).toFixed(1)} h/wk</span></li>`)
        .join('')}</ul>${light ? `<p class="by">plus ${light} light weekly practice${light === 1 ? '' : 's'} (under 1½ h a week each)</p>` : ''}</div>`;
    });
    return `<h3>Term by term (weekday academics)</h3><p class="by">Daily subjects run one unit at a time through the year; the others are taken a term or two at a time, so each term has a handful of main subjects.</p><div class="terms">${cols.join('')}</div>`;
  }

  function render() {
    $('hours-charts').innerHTML = DAYS.map(panel).join('');
    gradeDetail();
  }

  $('hours-notes').innerHTML = `<section class="panel-card hours-notes">
    <h2>How the figures are reached</h2>
    <ul>
      <li>Core hours are each core unit's estimated reading and work. Elective hours are whole elective units plus the elective parts of core units.</li>
      <li>Units without an estimate are not counted: the early-development units before school age, and the extracurricular Sports and Music Lessons tracks, which run alongside the school week.</li>
      <li>Kindergarten and the early grades sit well under their weekday budget; the room is left for play, reading aloud and time outdoors rather than more formal work.</li>
    </ul>
    <h3>Sources</h3>
    <ol class="hsrc">${(B.sources || []).map((s) => `<li id="src-${esc(s.id)}">${esc(s.publisher)}, <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> (${esc(s.date)}).</li>`).join('')}</ol>
  </section>`;

  // tooltip for the bars (the same text is each bar's accessible label)
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
  $('hours-charts').addEventListener('pointermove', (e) => {
    const el = e.target.closest('.hrow');
    if (el) showTip(el, e.clientX, e.clientY);
    else tip.hidden = true;
  });
  $('hours-charts').addEventListener('pointerleave', () => (tip.hidden = true));
  $('hours-charts').addEventListener('focusin', (e) => {
    const el = e.target.closest('.hrow');
    if (!el) return;
    const r = el.getBoundingClientRect();
    showTip(el, r.left + r.width / 2, r.top);
  });
  $('hours-charts').addEventListener('focusout', () => (tip.hidden = true));

  const pick = (g) => {
    selected = String(g);
    history.replaceState(null, '', `#g=${selected}`);
    render();
  };
  $('hours-charts').addEventListener('click', (e) => {
    const el = e.target.closest('.hrow');
    if (!el) return;
    pick(el.dataset.g);
    $('hours-grade').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('hours-grade').addEventListener('click', (e) => {
    const g = e.target.closest('[data-g]');
    if (g) return pick(g.dataset.g);
    const u = e.target.closest('[data-open]');
    if (u) showDetail(u.dataset.open);
  });
  render();
})();
