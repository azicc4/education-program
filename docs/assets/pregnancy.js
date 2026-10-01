// Gestation plan: nutrition and exercise by stage, from before conception to the baby's first year (data/parents/pregnancy.yaml).
(function () {
  const { esc } = window.App;
  const G = window.PARENTS?.pregnancy;
  const el = document.getElementById('preg-view');
  if (!G) { el.innerHTML = '<p class="empty">The gestation plan is not available.</p>'; return; }
  const srcs = G.sources || [];
  const num = Object.fromEntries(srcs.map((s, i) => [s.id, i + 1]));
  const cite = (ids) => {
    const ok = [].concat(ids || []).filter((id) => num[id]);
    return ok.length ? `<sup>${ok.map((id) => `<a href="#src-${esc(id)}" title="${esc(srcs[num[id] - 1].title)}">${num[id]}</a>`).join(', ')}</sup>` : '';
  };
  // "(acog-804, who-2020-pa)" inside a sentence becomes numbered links
  const text = (s) => esc(s).replace(/\(([a-z0-9][a-z0-9-]*(?:,\s*[a-z0-9][a-z0-9-]*)*)\)/g, (m, inner) => {
    const ids = inner.split(/,\s*/);
    return ids.every((id) => num[id]) ? cite(ids) : m;
  });
  const ev = (e) => (e ? `<span class="badge evd-${esc(e)}" title="${esc(G.evidenceLevels?.[e] || '')}">${e === 'established' ? 'Guideline' : 'Emerging'}</span>` : '');
  const ul = (xs) => (xs?.length ? `<ul class="plain">${xs.map((x) => `<li>${text(x)}</li>`).join('')}</ul>` : '');
  const table = (head, rows) => `<div class="table-wrap"><table class="wl-table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

  const stage = (s) => `<section class="panel-card stage" id="g-${esc(s.id)}">
    <h2>${esc(s.label)} <small>${esc(s.weeks || '')}</small></h2>
    <p>${text(s.focus || '')}</p>
    ${s.energy ? `<p class="desc"><strong>Energy and weight.</strong> ${text(s.energy)}</p>` : ''}
    ${s.nutrients?.length ? `<h3>Nutrients</h3>${table(['Nutrient', 'How much', 'Why', 'Foods', ''], s.nutrients.map((n) => `<tr><td><strong>${esc(n.name)}</strong></td><td>${text(n.amount || '')}</td><td>${text(n.why || '')}</td><td>${text(n.foods || '')}</td><td>${ev(n.evidence)}${cite(n.source || n.sources)}</td></tr>`))}` : ''}
    <div class="stage-grid">
      <div>${s.eat?.length ? `<h3>Eat</h3>${ul(s.eat)}` : ''}${s.limit?.length ? `<h3>Limit or avoid</h3>${ul(s.limit)}` : ''}</div>
      <div>${s.exampleDay ? `<h3>An example day</h3>${table(['Meal', 'What'], Object.entries(s.exampleDay).map(([k, v]) => `<tr><td>${esc(k.replace(/\d+$/, '').replace(/^\w/, (c) => c.toUpperCase()))}</td><td>${text(v)}</td></tr>`))}` : ''}</div>
    </div>
    ${s.exercise?.length ? `<h3>Exercise</h3>${table(['Activity', 'Dose', 'Notes', ''], s.exercise.map((x) => `<tr><td><strong>${esc(x.activity)}</strong></td><td>${text(x.dose || '')}</td><td>${text(x.notes || '')}</td><td>${ev(x.evidence)}${cite(x.source || x.sources)}</td></tr>`))}` : ''}
    ${s.returnToExercise?.length ? `<h3>Returning to exercise</h3>${table(['Phase', 'Activities', 'When', ''], s.returnToExercise.map((x) => `<tr><td><strong>${esc(x.phase)}</strong></td><td>${text(x.activities || '')}</td><td>${text(x.criteria || '')}</td><td>${ev(x.evidence)}${cite(x.sources || x.source)}</td></tr>`))}` : ''}
    ${s.weeklyPlan?.length ? `<details><summary>A week of exercise</summary>${table(['Day', 'Session'], s.weeklyPlan.map((d) => `<tr><td>${esc(d.day)}</td><td>${text(d.session)}</td></tr>`))}</details>` : ''}
    ${s.warnings?.length ? `<div class="preg-warn"><h3>Stop and call the provider</h3>${ul(s.warnings)}</div>` : ''}
  </section>`;

  const brain = G.brainDevelopment;
  const wg = G.weightGain;
  el.innerHTML = `
    <h1 class="preg-title">${esc(G.title || 'Gestation plan')}</h1>
    <p class="intro">${text(G.scope || '')}</p>
    <div class="preg-disclaimer"><strong>Not medical advice.</strong> ${text(G.disclaimer || '')}${G.lastReviewed ? ` <span class="by">Last reviewed ${esc(G.lastReviewed)}.</span>` : ''}</div>
    <p class="by">${ev('established')} ${esc(G.evidenceLevels?.established || '')} ${ev('emerging')} ${esc(G.evidenceLevels?.emerging || '')}</p>
    <nav class="chips stage-jump" aria-label="Stages">${(G.stages || []).map((s) => `<a class="chip" href="#g-${esc(s.id)}">${esc(s.label)}</a>`).join('')}<a class="chip" href="#g-brain">Brain</a><a class="chip" href="#g-targets">Daily targets</a></nav>
    ${brain ? `<section class="panel-card" id="g-brain"><h2>Nourishing the baby's brain</h2><p>${text(brain.summary || '')}</p>${brain.windows?.length ? table(['Nutrient', 'When', 'What it does', ''], brain.windows.map((w) => `<tr><td><strong>${esc(w.nutrient)}</strong></td><td>${text(w.when || '')}</td><td>${text(w.role || '')}</td><td>${ev(w.evidence)}${cite(w.sources || w.source)}</td></tr>`)) : ''}</section>` : ''}
    ${(G.stages || []).map(stage).join('')}
    ${wg ? `<section class="panel-card"><h2>Weight gain by pre-pregnancy BMI ${cite(wg.sources)}</h2><p class="desc">${text(wg.note || '')}</p>${['singleton', 'twins'].filter((k) => wg[k]?.length).map((k) => `<h3>${k === 'twins' ? 'Twins' : 'One baby'}</h3>${table(Object.keys(wg[k][0]).map((h) => ({ bmi: 'BMI', total: 'Total gain', weeklyAfterFirstTrimester: 'Per week after the first trimester' })[h] || h), wg[k].map((r) => `<tr>${Object.values(r).map((v) => `<td>${text(String(v))}</td>`).join('')}</tr>`))}`).join('')}</section>` : ''}
    ${G.dailyTargets?.length ? `<section class="panel-card" id="g-targets"><h2>Daily targets</h2>${table(['Nutrient', 'Not pregnant', 'Pregnant', 'Breastfeeding', ''], G.dailyTargets.map((d) => `<tr><td><strong>${esc(d.nutrient)}</strong></td><td>${text(d.nonPregnant || '')}</td><td>${text(d.pregnancy || '')}</td><td>${text(d.lactation || '')}</td><td>${cite(d.sources || d.source)}</td></tr>`))}</section>` : ''}
    <section class="panel-card"><h2>Sources</h2><ol class="hsrc">${srcs.map((s) => `<li id="src-${esc(s.id)}">${esc(s.publisher || '')}${s.year ? ` (${esc(s.year)})` : ''}, <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ol></section>`;
})();
