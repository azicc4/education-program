// Exams page: the exam catalog, the units that prepare for each, and a per-child planner.
(function () {
  const { DATA, esc, ageLabel, trackTitle } = window.App;
  const S = window.Store;
  const exams = (DATA.exams || []).slice().sort((a, b) => a.typicalAge - b.typicalAge || a.name.localeCompare(b.name));
  const CATEGORIES = {
    'ap-stem': 'AP: Math & Science',
    'ap-humanities': 'AP: Humanities',
    'ap-language': 'AP: Languages',
    clt: 'Classic Learning Test',
    admissions: 'Admissions & Credit',
    'national-exam': 'National Exams',
    olympiad: 'Olympiads',
  };
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const filtersEl = document.getElementById('exam-filters');
  const listEl = document.getElementById('exam-list');
  let category = '';
  let showOptional = true;

  const unitsFor = (id) => DATA.rows.filter((r) => (r.exams || []).includes(id)).sort((a, b) => a.ageStart - b.ageStart);

  // projected sitting: the first time the exam month comes round once the child is within half a year of the typical age
  function projected(child, exam) {
    if (!child?.birthdate) return null;
    const born = new Date(child.birthdate + 'T00:00:00');
    const from = new Date(born);
    from.setMonth(from.getMonth() + Math.round((exam.typicalAge - 0.5) * 12));
    const m = MONTHS.findIndex((x) => String(exam.month || 'may').toLowerCase().startsWith(x.slice(0, 3)));
    const d = new Date(from.getFullYear(), m < 0 ? 4 : m, 1);
    if (d < from) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  function renderFilters() {
    const kids = S.children();
    const active = S.activeChild;
    filtersEl.innerHTML = `
      <div class="chips" role="group" aria-label="Category">${[['', 'All'], ...Object.entries(CATEGORIES)]
        .map(([id, label]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="${category === id}">${esc(label)}</button>`)
        .join('')}</div>
      <label class="check"><input type="checkbox" id="show-optional"${showOptional ? ' checked' : ''}> Show optional exams</label>
      ${kids.length ? `<label>Plan for <select id="exam-child"><option value="">(no child)</option>${kids.map((c) => `<option value="${esc(c.id)}"${c.id === active ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>` : '<a href="family.html">Add a child</a> to see projected dates'}`;
  }

  function render() {
    renderFilters();
    const child = S.child(S.activeChild);
    const shown = exams.filter((x) => (!category || x.category === category) && (showOptional || !x.optional));
    listEl.innerHTML = shown.length
      ? shown
          .map((x) => {
            const units = unitsFor(x.id);
            const when = projected(child, x);
            const done = child ? units.filter((r) => S.status(child.id, r.id) === 'done').length : 0;
            const links = [x.url && `<a href="${esc(x.url)}" target="_blank" rel="noopener">Official page ↗</a>`, x.ced && `<a href="${esc(x.ced)}" target="_blank" rel="noopener">Course & exam description ↗</a>`].filter(Boolean).join(' · ');
            return `<article class="list-card exam-card" id="${esc(x.id)}">
              <div class="meta"><span>${esc(CATEGORIES[x.category] || x.category)}</span><span>${esc(x.body)}</span><span>typical age ${esc(x.typicalAge)}</span>${x.month ? `<span>${esc(x.month)}</span>` : ''}${x.optional ? '<span class="badge elective">optional</span>' : ''}</div>
              <h2>${esc(x.name)}</h2>
              ${child ? `<p class="plan">${when ? `<strong>${esc(child.name)}</strong>: ${when < new Date() ? 'first sitting was due' : 'projected'} ${esc(when.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))}` : `<strong>${esc(child.name)}</strong>: add a birthdate to project a date`}${units.length ? ` · ${done} of ${units.length} preparing units completed` : ''}</p>` : ''}
              ${links ? `<p class="sources">${links}</p>` : ''}
              ${x.format ? `<details><summary>Format</summary><p>${esc(x.format)}</p></details>` : ''}
              ${x.registration ? `<details${child ? ' open' : ''}><summary>Registering as a homeschooler</summary><p>${esc(x.registration)}</p></details>` : ''}
              ${x.resources?.length ? `<details><summary>Prep resources (${x.resources.length})</summary><ul>${x.resources.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`).join('')}</ul></details>` : ''}
              ${units.length ? `<details open><summary>Units that prepare (${units.length})</summary><ul>${units
                .map((r) => {
                  const st = child ? S.status(child.id, r.id) : '';
                  return `<li><a href="index.html#row=${esc(r.id)}">${esc(r.title)}</a> <small>${esc(trackTitle(r.track))} · age ${esc(ageLabel(r))}${st === 'done' ? ' · ✓ completed' : st === 'active' ? ' · in progress' : ''}</small></li>`;
                })
                .join('')}</ul></details>` : ''}
              ${x.notes ? `<p class="desc">${esc(x.notes)}</p>` : ''}
            </article>`;
          })
          .join('')
      : '<p class="empty">No exams in this category.</p>';
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }

  filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (b) { category = b.dataset.cat; render(); }
  });
  filtersEl.addEventListener('change', (e) => {
    if (e.target.id === 'show-optional') { showOptional = e.target.checked; render(); }
    if (e.target.id === 'exam-child') S.setActive(e.target.value);
  });
  S.onChange(render);
  render();
})();
