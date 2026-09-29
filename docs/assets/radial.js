// Radial skill tree: one wedge per track around the child; current units innermost, up to two steps outward.
(function () {
  const { DATA, esc, ageLabel, showDetail, trackOrder } = window.App;
  const S = window.Store;
  const svg = document.getElementById('radial');
  const filtersEl = document.getElementById('radial-filters');
  const legendEl = document.getElementById('radial-legend');
  const demos = window.Demo.profiles(DATA);

  const SIZE = 2400;
  const C = SIZE / 2;
  const R_CENTER = 125;
  const RINGS = [400, 690, 960]; // current, next, after-next
  const MAX_PER_RING = 2;
  const GROUP_COLORS = ['#8a6f3a', '#1f5a7a', '#6b3f8a', '#3f6e3a', '#7a1f1f', '#b8860b', '#2f6f6f', '#4a4a7a', '#8a3f5f', '#5a6b2f', '#777'];
  const groupIndex = Object.fromEntries(DATA.groups.map((g, i) => [g.name, i]));

  let selected = S.activeChild ? `store:${S.activeChild}` : `demo:${demos[1].id}`;
  let group = '';

  // ---------- who are we looking at ----------
  function subject() {
    if (selected.startsWith('demo:')) {
      const d = demos.find((x) => `demo:${x.id}` === selected) || demos[0];
      return { name: d.name, age: d.age, status: (id) => d.progress[id] || '' };
    }
    const c = S.child(selected.slice(6));
    if (!c) return subjectFallback();
    return { name: c.name, age: S.age(c) ?? 0, status: (id) => S.status(c.id, id) };
  }
  function subjectFallback() {
    selected = `demo:${demos[1].id}`;
    return subject();
  }
  const quarter = (a) => (Math.floor(a * 4) / 4).toFixed(2);

  // ---------- which units sit on each ring ----------
  function branch(trackId, who) {
    const rows = DATA.rows.filter((r) => r.track === trackId).sort((a, b) => a.order - b.order || a.ageStart - b.ageStart);
    if (!rows.length) return null;
    const st = (r) => who.status(r.id);
    const hasProgress = rows.some((r) => st(r));
    let current = rows.filter((r) => st(r) === 'active');
    if (!current.length && !hasProgress) current = rows.filter((r) => r.ageStart <= who.age && who.age < r.ageEnd);
    if (!current.length) {
      // nothing at this age: show the next unit in order that is not done
      const next = rows.find((r) => st(r) !== 'done' && (hasProgress || r.ageStart > who.age));
      current = next ? [next] : [];
    }
    current = current.slice(0, MAX_PER_RING);
    const used = new Set(current.map((r) => r.id));
    const step = (prev) => {
      const prevIds = new Set(prev.map((r) => r.id));
      const pool = rows.filter((r) => !used.has(r.id) && st(r) !== 'done');
      let next = pool.filter((r) => (r.prerequisites || []).some((p) => prevIds.has(p)));
      if (!next.length) next = pool.filter((r) => r.order > Math.max(...prev.map((p) => p.order))).slice(0, 1);
      next = next.slice(0, MAX_PER_RING);
      next.forEach((r) => used.add(r.id));
      return next;
    };
    const ring2 = current.length ? step(current) : [];
    const ring3 = ring2.length ? step(ring2) : [];
    return { rings: [current, ring2, ring3], complete: !current.length };
  }

  // ---------- geometry ----------
  const polar = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const deg = (a) => (a * 180) / Math.PI;
  function wedgePath(a0, a1, r0, r1) {
    const [x0, y0] = polar(r0, a0), [x1, y1] = polar(r1, a0), [x2, y2] = polar(r1, a1), [x3, y3] = polar(r0, a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x0},${y0} L${x1},${y1} A${r1},${r1} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 ${large} 0 ${x0},${y0} Z`;
  }
  const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  // text along the spoke, flipped on the left half so it never reads upside down
  function spokeText(x, y, a, text, cls, anchorOut = true) {
    const left = Math.cos(a) < 0;
    const rot = deg(a) + (left ? 180 : 0);
    const anchor = anchorOut ? (left ? 'end' : 'start') : left ? 'start' : 'end';
    return `<text class="${cls}" x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" text-anchor="${anchor}" dominant-baseline="middle">${esc(text)}</text>`;
  }

  function render() {
    const who = subject();
    const tracks = DATA.tracks.filter((t) => !group || t.group === group).sort((a, b) => trackOrder.indexOf(a.id) - trackOrder.indexOf(b.id));
    const n = tracks.length;
    const span = (2 * Math.PI) / n;
    const start = -Math.PI / 2;
    let wedges = '', edges = '', nodes = '', labels = '';

    tracks.forEach((t, i) => {
      const a0 = start + i * span, a1 = a0 + span, mid = a0 + span / 2;
      const color = GROUP_COLORS[groupIndex[t.group] % GROUP_COLORS.length];
      wedges += `<path class="wedge ${i % 2 ? 'odd' : ''}" d="${wedgePath(a0, a1, R_CENTER + 8, SIZE / 2 - 10)}" style="--wedge:${color}"/>`;
      // track name at the inner end of its spoke, beside the hub
      const [lx, ly] = polar(R_CENTER + 22, mid);
      labels += spokeText(lx, ly, mid, trunc(t.title, 19), 'track-label');

      const b = branch(t.id, who);
      if (!b) return;
      if (b.complete) {
        const [x, y] = polar(RINGS[0], mid);
        nodes += `<g class="rnode complete"><circle cx="${x}" cy="${y}" r="12"/></g>`;
        labels += spokeText(...polar(RINGS[0] + 20, mid), mid, 'Track complete ✓', 'rlabel muted');
        return;
      }
      const placed = {};
      b.rings.forEach((ring, k) => {
        ring.forEach((r, j) => {
          const spread = ring.length > 1 ? (j - (ring.length - 1) / 2) * (span * 0.42) : 0;
          const a = mid + spread;
          const [x, y] = polar(RINGS[k], a);
          placed[r.id] = { x, y, a, k };
          // edge from the center, or from a prerequisite (else the nearest node) on the previous ring
          let from;
          if (k === 0) from = polar(R_CENTER, a);
          else {
            const prev = b.rings[k - 1];
            const parent = prev.find((p) => (r.prerequisites || []).includes(p.id)) || prev[Math.min(j, prev.length - 1)];
            from = [placed[parent.id].x, placed[parent.id].y];
          }
          edges += `<line class="redge ring${k}" x1="${from[0]}" y1="${from[1]}" x2="${x}" y2="${y}" style="--wedge:${color}"/>`;
          const st = who.status(r.id);
          const cls = ['rnode', `lvl-${r.level}`, k === 0 ? 'current' : 'ahead', st ? `st-${st}` : ''].join(' ');
          nodes += `<g class="${cls}" data-id="${esc(r.id)}" tabindex="0" role="button" aria-label="${esc(r.title)}, ${esc(t.title)}, age ${esc(ageLabel(r))}">
            <title>${esc(r.title)} (${esc(t.title)}, age ${esc(ageLabel(r))})</title>
            <circle cx="${x}" cy="${y}" r="${k === 0 ? 17 : 12}"/></g>`;
          const [tx, ty] = polar(RINGS[k] + (k === 0 ? 26 : 20), a);
          labels += spokeText(tx, ty, a, trunc(r.title, [20, 21, 18][k]), `rlabel ${k === 0 ? 'strong' : ''}`);
        });
      });
    });

    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    svg.innerHTML = `<title id="radial-title">Radial skill tree for ${esc(who.name)}</title>
      <g class="wedges">${wedges}</g>
      ${RINGS.map((r, k) => `<circle class="ring-guide" cx="${C}" cy="${C}" r="${r}"/><text class="ring-name" x="${C + 4}" y="${C - r - 6}">${['now', 'next', 'then'][k]}</text>`).join('')}
      <g class="edges">${edges}</g>
      <g class="nodes">${nodes}</g>
      <g class="labels">${labels}</g>
      <circle class="hub" cx="${C}" cy="${C}" r="${R_CENTER}"/>
      <text class="hub-name" x="${C}" y="${C - 14}" text-anchor="middle">${esc(trunc(who.name, 18))}</text>
      <text class="hub-age" x="${C}" y="${C + 34}" text-anchor="middle">Age ${quarter(who.age)}</text>`;

    renderFilters();
    legendEl.innerHTML = `
      <span class="badge lvl-early-5">Early Dev – 5</span><span class="badge lvl-6-8">Grades 6–8</span><span class="badge lvl-9-12">Grades 9–12</span><span class="badge lvl-college">College</span>
      <span>· Inner ring: now · middle: next · outer: then</span>`;
  }

  function renderFilters() {
    const kids = S.children();
    const opts = [
      ...kids.map((c) => [`store:${c.id}`, c.name]),
      ...demos.map((d) => [`demo:${d.id}`, `${d.name} · age ${quarter(d.age)}`]),
    ];
    filtersEl.innerHTML = `
      <label>Child <select id="radial-child">${opts.map(([v, l]) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label>Subject <select id="radial-group"><option value="">All subjects</option>${DATA.groups.map((g) => `<option${g.name === group ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <span class="zoom"><button type="button" class="chip" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" class="chip" data-zoom="0">Fit</button><button type="button" class="chip" data-zoom="1" aria-label="Zoom in">+</button></span>
      ${kids.length ? '' : '<span class="by">Showing a demo child. <a href="family.html">Add your children</a>, or load the demo family there.</span>'}`;
  }

  // zoom: fit to the container, or enlarge and scroll
  let zoom = 0;
  const applyZoom = () => {
    svg.style.width = zoom ? `${Math.round(100 * 1.5 ** zoom)}%` : '';
    svg.style.maxWidth = zoom ? 'none' : '';
  };
  filtersEl.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (!z) return;
    zoom = +z.dataset.zoom === 0 ? 0 : Math.max(0, Math.min(4, zoom + +z.dataset.zoom));
    applyZoom();
  });
  filtersEl.addEventListener('change', (e) => {
    if (e.target.id === 'radial-child') {
      selected = e.target.value;
      if (selected.startsWith('store:')) S.setActive(selected.slice(6));
    }
    if (e.target.id === 'radial-group') group = e.target.value;
    render();
  });
  const open = (el) => el && showDetail(el.dataset.id, (id) => showDetail(id, () => showDetail('', () => {})));
  svg.addEventListener('click', (e) => open(e.target.closest('.rnode[data-id]')));
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(e.target.closest('.rnode[data-id]'));
    }
  });
  S.onChange(render);
  render();
})();
