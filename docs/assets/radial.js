// Radial skill tree as a force-directed graph on a canvas: the child at the hub, one cluster per track,
// current units nearest the hub and at most two steps outward per branch, with forks for concurrent units.
(function () {
  const { DATA, esc, ageLabel, showDetail, trackOrder, quarterAge: quarter } = window.App;
  const S = window.Store;
  const shell = document.getElementById('radial-shell');
  const stage = document.getElementById('radial-stage');
  const canvas = document.getElementById('radial');
  const ctx = canvas.getContext('2d');
  const captionEl = document.getElementById('radial-caption');
  const listEl = document.getElementById('radial-nodes');
  const filtersEl = document.getElementById('radial-filters');
  const legendEl = document.getElementById('radial-legend');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const MAX_PER_RING = 2;
  const RADII = [0, 130, 235, 330, 420]; // hub, track, now, next, then
  // tuned for the dark graph canvas, which stays dark in both themes
  const GROUP_COLORS = ['#e6a04f', '#5aa9e6', '#a98be8', '#4fc3b0', '#e8736b', '#e9d36b', '#7ccf6b', '#d98bc8', '#9aa7bd', '#c79b72', '#62d4e3'];
  const INK = { bg: '#1b1916', link: '220, 210, 190', label: '#ddd5c6', hub: '#d27a6a', active: '#f2c14e', done: '#8cc084', focus: '#fff3c4' };
  const groupIndex = Object.fromEntries(DATA.groups.map((g, i) => [g.name, i]));
  const colorOf = (g) => GROUP_COLORS[groupIndex[g] % GROUP_COLORS.length];

  window.Demo.topUp(DATA, S); // demo children loaded before bookshelves were seeded get their books now
  let selected = window.App.defaultChild();
  let group = '';
  let nowOnly = true; // "Current Age": only the tracks that fit the child's age now

  // ---------- who are we looking at ----------
  function subject() {
    const who = window.App.childFor(selected);
    if (who) return (selected = who.key), who;
    selected = window.App.defaultChild();
    return window.App.childFor(selected) || window.App.childFor('demo:demo-thomas');
  }

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

  // ---------- graph: nodes seeded on the old radial layout ----------
  let G = { nodes: [], links: [], byId: new Map(), adj: new Map(), who: null, tracks: [] };
  const STEP_NAME = ['now', 'next', 'then'];

  function build(fresh) {
    const who = subject();
    const prev = fresh ? new Map() : G.byId;
    const inGroup = DATA.tracks.filter((t) => !group || t.group === group).sort((a, b) => trackOrder.indexOf(a.id) - trackOrder.indexOf(b.id));
    const fits = (t) => window.App.nowUnits(DATA.rows.filter((r) => r.track === t.id), who).length > 0;
    const tracks = nowOnly ? inGroup.filter(fits) : inGroup;
    const branches = [];
    const span = (2 * Math.PI) / Math.max(1, tracks.length);
    const fork = Math.min(span * 0.42, 0.3);
    const nodes = [], links = [], byId = new Map();
    const add = (n, a, depth) => {
      n.depth = depth;
      n.sx = RADII[depth] * Math.cos(a);
      n.sy = RADII[depth] * Math.sin(a);
      const old = prev.get(n.id);
      Object.assign(n, old ? { x: old.x, y: old.y, vx: old.vx, vy: old.vy } : { x: n.sx, y: n.sy, vx: 0, vy: 0 }, { fx: null, fy: null, deg: 0, tdeg: 0 });
      nodes.push(n);
      byId.set(n.id, n);
      return n;
    };
    const link = (s, t, kind) => links.push({ s, t, kind });

    const hub = add({ id: 'hub', kind: 'hub', label: `${who.name} · Age ${quarter(who.age)}` }, 0, 0);
    tracks.forEach((t, i) => {
      const mid = -Math.PI / 2 + (i + 0.5) * span;
      const color = colorOf(t.group);
      const tn = add({ id: `track:${t.id}`, kind: 'track', label: t.title, color, track: t }, mid, 1);
      link(hub, tn, 'tree');
      const b = branch(t.id, who);
      if (!b) return;
      branches.push(b);
      tn.complete = b.complete;
      b.rings.forEach((ring, k) =>
        ring.forEach((r, j) => {
          const a = mid + (ring.length > 1 ? (j - (ring.length - 1) / 2) * fork : 0);
          const n = add({ id: r.id, kind: 'unit', label: r.title, color, track: t, row: r, step: k, status: who.status(r.id) }, a, k + 2);
          // from the track node, or from a prerequisite (else the nearest node) on the previous ring
          let parent = tn;
          if (k > 0) {
            const before = b.rings[k - 1];
            parent = byId.get((before.find((p) => (r.prerequisites || []).includes(p.id)) || before[Math.min(j, before.length - 1)]).id);
          }
          link(parent, n, 'tree');
        }),
      );
    });
    // faint links between units shown in different tracks that list each other as related
    const seen = new Set();
    for (const n of nodes) {
      if (!n.row) continue;
      for (const id of n.row.related || []) {
        const m = byId.get(id);
        const key = n.id < id ? `${n.id}|${id}` : `${id}|${n.id}`;
        if (!m || !m.row || m.track === n.track || seen.has(key)) continue;
        seen.add(key);
        link(n, m, 'related');
      }
    }
    const adj = new Map(nodes.map((n) => [n.id, new Set()]));
    for (const l of links) {
      l.s.deg++;
      l.t.deg++;
      if (l.kind === 'tree') (l.s.tdeg++, l.t.tdeg++);
      adj.get(l.s.id).add(l.t.id);
      adj.get(l.t.id).add(l.s.id);
    }
    for (const n of nodes) n.r = 3 + 1.6 * Math.sqrt(n.deg); // sized by connection count
    for (const l of links) l.dist = RADII[l.t.depth] - RADII[l.s.depth];
    G = { nodes, links, byId, adj, who, tracks, hub, branches, hidden: inGroup.length - tracks.length };
    wraps = new Map();
  }

  // ---------- force simulation (d3-force style: velocity Verlet with decaying alpha) ----------
  const sim = { alpha: 1, alphaTarget: 0, alphaMin: 0.001, alphaDecay: 1 - Math.pow(0.001, 1 / 300), velocityDecay: 0.4 };
  const F = { link: 0.5, charge: -60, chargeMax2: 260 * 260, radial: 0.06, anchor: 0.01, collide: 0.7 };

  function tick() {
    const a = (sim.alpha += (sim.alphaTarget - sim.alpha) * sim.alphaDecay);
    const { nodes, links, hub } = G;
    for (const l of links) {
      if (l.kind !== 'tree') continue;
      const { s, t } = l;
      let x = t.x + t.vx - s.x - s.vx, y = t.y + t.vy - s.y - s.vy;
      const d = Math.hypot(x, y) || 1e-6;
      const k = ((d - l.dist) / d) * a * F.link;
      const bias = s.tdeg / (s.tdeg + t.tdeg);
      x *= k;
      y *= k;
      t.vx -= x * bias;
      t.vy -= y * bias;
      s.vx += x * (1 - bias);
      s.vy += y * (1 - bias);
    }
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      const p = nodes[i];
      for (let j = i + 1; j < N; j++) {
        const q = nodes[j];
        let dx = q.x - p.x, dy = q.y - p.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > F.chargeMax2) continue;
        if (d2 < 1e-6) {
          dx = (Math.random() - 0.5) * 1e-3;
          dy = (Math.random() - 0.5) * 1e-3;
          d2 = dx * dx + dy * dy;
        }
        const w = (F.charge * a) / Math.max(d2, 1);
        p.vx += dx * w;
        p.vy += dy * w;
        q.vx -= dx * w;
        q.vy -= dy * w;
        const min = p.r + q.r + 3;
        if (d2 < min * min) {
          const d = Math.sqrt(d2);
          const push = ((min - d) / d) * 0.5 * F.collide;
          p.vx -= dx * push;
          p.vy -= dy * push;
          q.vx += dx * push;
          q.vy += dy * push;
        }
      }
    }
    for (const n of nodes) {
      if (n === hub) {
        // the hub springs back to the center after a drag
        n.vx -= n.x * 0.1;
        n.vy -= n.y * 0.1;
      } else {
        const r = Math.hypot(n.x, n.y) || 1e-6;
        const k = ((RADII[n.depth] - r) * F.radial * a) / r;
        n.vx += n.x * k + (n.sx - n.x) * F.anchor * a;
        n.vy += n.y * k + (n.sy - n.y) * F.anchor * a;
      }
      if (n.fx != null) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = n.vy = 0;
      } else {
        n.x += n.vx *= 1 - sim.velocityDecay;
        n.y += n.vy *= 1 - sim.velocityDecay;
      }
    }
  }
  const simRunning = () => sim.alpha >= sim.alphaMin || sim.alphaTarget > 0 || Math.hypot(G.hub?.x || 0, G.hub?.y || 0) > 0.3;
  function heat(alpha) {
    sim.alpha = Math.max(sim.alpha, alpha);
    // with reduced motion, settle at once (a drag still moves the graph live)
    if (reduceMotion.matches && !sim.alphaTarget) while (sim.alpha >= sim.alphaMin) tick();
    kick();
  }

  // ---------- camera ----------
  let W = 0, H = 0, dpr = 1;
  const cam = { k: 1, x: 0, y: 0 };
  let camTarget = null; // eased toward each frame
  let autoFit = true; // follow the settling graph until the user zooms or pans
  const toWorld = (px, py) => [(px - cam.x) / cam.k, (py - cam.y) / cam.k];
  const kLimits = () => {
    const f = fitView().k;
    return [Math.min(f * 0.5, 0.2), Math.max(6, f * 4)];
  };
  const clampK = (k) => {
    const [lo, hi] = kLimits();
    return Math.min(hi, Math.max(lo, k));
  };
  function fitView() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of G.nodes) {
      x0 = Math.min(x0, n.x - n.r);
      y0 = Math.min(y0, n.y - n.r);
      x1 = Math.max(x1, n.x + n.r);
      y1 = Math.max(y1, n.y + n.r);
    }
    if (!G.nodes.length) return { k: 1, x: W / 2, y: H / 2 };
    const pad = Math.min(40, Math.max(12, Math.min(W, H) * 0.05));
    const k = Math.min(3, (W - 2 * pad) / Math.max(1, x1 - x0), (H - 2 * pad - 16) / Math.max(1, y1 - y0));
    return { k, x: W / 2 - ((x0 + x1) / 2) * k, y: H / 2 - ((y0 + y1) / 2) * k - 8 };
  }
  function zoomAt(px, py, k) {
    k = clampK(k);
    const [wx, wy] = toWorld(px, py);
    return { k, x: px - wx * k, y: py - wy * k };
  }
  function setCam(next, animate) {
    autoFit = false;
    if (animate && !reduceMotion.matches) camTarget = next;
    else {
      camTarget = null;
      Object.assign(cam, next);
    }
    kick();
  }
  function fit() {
    autoFit = true;
    camTarget = fitView();
    if (reduceMotion.matches) Object.assign(cam, camTarget);
    kick();
  }
  function easeCam() {
    if (!camTarget) return false;
    const e = 0.18;
    // interpolate the scale geometrically and keep the screen center moving in step with it
    const k = cam.k * Math.pow(camTarget.k / cam.k, e);
    const cx = (W / 2 - cam.x) / cam.k, cy = (H / 2 - cam.y) / cam.k;
    const tx = (W / 2 - camTarget.x) / camTarget.k, ty = (H / 2 - camTarget.y) / camTarget.k;
    const wx = cx + (tx - cx) * e, wy = cy + (ty - cy) * e;
    Object.assign(cam, { k, x: W / 2 - wx * k, y: H / 2 - wy * k });
    const done = Math.abs(Math.log(camTarget.k / cam.k)) < 0.002 && Math.hypot(tx - wx, ty - wy) * k < 0.5;
    if (done) {
      Object.assign(cam, camTarget);
      if (!autoFit) camTarget = null;
    }
    return !done;
  }

  // ---------- interaction state ----------
  let hover = null, dragNode = null, kbdFocus = null, openId = '';
  let hl = 0, hlNode = null; // highlight strength (eased) and the node it is about
  const focusNode = () => dragNode || hover || (kbdFocus && G.byId.get(kbdFocus)) || null;

  // ---------- render loop ----------
  let raf = 0;
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame() {
    raf = 0;
    let busy = false;
    if (G.nodes.length && simRunning()) {
      tick();
      busy = true;
    }
    if (autoFit && !dragNode) camTarget = fitView();
    if (easeCam()) busy = true;
    const f = focusNode();
    if (f) hlNode = f;
    const target = f ? 1 : 0;
    if (Math.abs(target - hl) > 0.01 && !reduceMotion.matches) {
      hl += (target - hl) * 0.22;
      busy = true;
    } else hl = target;
    draw();
    if (busy) kick();
  }

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const drawR = (n) => Math.max(n.r, (n.kind === 'hub' ? 7 : 2.4) / cam.k);

  function draw() {
    const { k } = cam;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!G.nodes.length) return;
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * cam.x, dpr * cam.y);
    const set = hlNode && hl > 0 ? G.adj.get(hlNode.id) : null;
    const lit = (n) => !set || n === hlNode || set.has(n.id);
    const dim = 1 - 0.85 * hl;

    // links: thin, constant on screen; batched into one path per kind unless something is highlighted
    if (!set) {
      for (const rel of [false, true]) {
        ctx.globalAlpha = rel ? 0.1 : 0.24;
        ctx.strokeStyle = `rgb(${INK.link})`;
        ctx.lineWidth = 1 / k;
        ctx.setLineDash(rel ? [3 / k, 3 / k] : []);
        ctx.beginPath();
        for (const l of G.links) {
          if ((l.kind === 'related') !== rel) continue;
          ctx.moveTo(l.s.x, l.s.y);
          ctx.lineTo(l.t.x, l.t.y);
        }
        ctx.stroke();
      }
    } else for (const l of G.links) {
      const on = set && (l.s === hlNode || l.t === hlNode);
      const rel = l.kind === 'related';
      const base = rel ? 0.1 : 0.24;
      ctx.globalAlpha = on ? base + (0.85 - base) * hl : set ? base * dim : base;
      ctx.strokeStyle = on ? hlNode.color || INK.hub : `rgb(${INK.link})`;
      ctx.lineWidth = (on ? 1.5 : 1) / k;
      ctx.setLineDash(rel ? [3 / k, 3 / k] : []);
      ctx.beginPath();
      ctx.moveTo(l.s.x, l.s.y);
      ctx.lineTo(l.t.x, l.t.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // nodes
    for (const n of G.nodes) {
      const r = drawR(n);
      const fade = n.kind === 'unit' ? [1, 0.78, 0.6][n.step] : 1;
      ctx.globalAlpha = (lit(n) ? 1 : dim) * fade;
      ctx.fillStyle = n.kind === 'hub' ? INK.hub : n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fill();
      const ring = n.status === 'active' ? INK.active : n.complete ? INK.done : '';
      if (ring) {
        ctx.globalAlpha = lit(n) ? 1 : dim;
        ctx.strokeStyle = ring;
        ctx.lineWidth = 1.6 / k;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 2.2 / k, 0, 2 * Math.PI);
        ctx.stroke();
      }
      if (n.id === kbdFocus || n.id === openId) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = INK.focus;
        ctx.lineWidth = 2 / k;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 5 / k, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // labels: drawn in screen space, fading in with zoom or when highlighted
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fewer tracks (a subject filter) means more room, so labels appear at lower zoom
    const z = k / Math.min(1, Math.max(0.45, Math.sqrt(G.tracks.length / 35)));
    const zoomIn = { hub: 1, track: smooth(0.9, 1.25, z), unit: [smooth(1.3, 1.7, z), smooth(1.6, 2.1, z), smooth(1.6, 2.1, z)] };
    const items = [], dots = [];
    for (const n of G.nodes) {
      const dx = n.x * k + cam.x, dy = n.y * k + cam.y;
      if (dx > -20 && dx < W + 20 && dy > -20 && dy < H + 20) dots.push({ n, sx: dx, sy: dy, rs: drawR(n) * k });
      const base = n.kind === 'unit' ? zoomIn.unit[n.step] : zoomIn[n.kind];
      const a = lit(n) && set ? Math.max(base, hl) : base * (set ? dim : 1);
      if (a < 0.02) continue;
      const sx = n.x * k + cam.x, sy = n.y * k + cam.y;
      if (sx < -200 || sx > W + 200 || sy < -100 || sy > H + 100) continue;
      items.push({ n, a, sx, sy, rs: drawR(n) * k, prio: labelPriority(n, set) });
    }
    for (const it of placeLabels(items, dots)) drawLabel(it);
    ctx.globalAlpha = 1;
    caption(focusNode());
  }

  // ---------- labels: wrapped in semi-opaque boxes, placed so that none overlap ----------
  const LABEL = {
    hub: { font: '600 13px Inter, system-ui, sans-serif', line: 16, maxW: 220 },
    track: { font: '600 11px Inter, system-ui, sans-serif', line: 14, maxW: 140 },
    unit: { font: '11px Inter, system-ui, sans-serif', line: 14, maxW: 150 },
  };
  const PAD_X = 5, PAD_Y = 3, GAP = 4;
  let wraps = new Map(); // node id -> { lines, w, h }, measured once per build (and again once fonts load)
  function wrapLabel(n) {
    let c = wraps.get(n.id);
    if (c) return c;
    const { font, line: lh, maxW } = LABEL[n.kind];
    ctx.font = font;
    const width = (t) => ctx.measureText(t).width;
    const text = n.kind === 'track' && n.complete ? `✓ ${n.label}` : n.label;
    const lines = [];
    let line = '';
    // break after spaces, hyphens, dashes and slashes; a word wider than the box breaks between characters
    for (const token of text.match(/[^\s\-–—/]*[\s\-–—/]*/g).filter(Boolean)) {
      if (width((line + token).trimEnd()) <= maxW) {
        line += token;
        continue;
      }
      if (line.trim()) lines.push(line.trimEnd());
      line = '';
      if (width(token.trimEnd()) <= maxW) line = token;
      else
        for (const ch of token) {
          if (line && width((line + ch).trimEnd()) > maxW) {
            lines.push(line.trimEnd());
            line = '';
          }
          line += ch;
        }
    }
    if (line.trim()) lines.push(line.trimEnd());
    const w = Math.max(...lines.map(width));
    c = { lines, w: w + 2 * PAD_X, h: lines.length * lh + 2 * PAD_Y, lh };
    wraps.set(n.id, c);
    return c;
  }
  // lower is placed first: the hub, the highlighted node and its neighbors, then tracks, then units by step
  function labelPriority(n, set) {
    if (n.kind === 'hub') return 0;
    if (set && n === hlNode) return 1;
    if (set && set.has(n.id)) return 2;
    if (n.id === kbdFocus || n.id === openId) return 2;
    return n.kind === 'track' ? 3 : 4 + n.step;
  }
  let lastPlaced = new Map(); // node id -> candidate side used last frame, so labels do not jump around
  function placeLabels(items, dots) {
    items.sort((p, q) => p.prio - q.prio || lastPlaced.has(q.n.id) - lastPlaced.has(p.n.id));
    // the hover caption sits over the canvas, so its area is taken
    const boxes = captionEl.hidden ? [] : [{ x: captionEl.offsetLeft - GAP, y: captionEl.offsetTop - GAP, w: captionEl.offsetWidth + 2 * GAP, h: captionEl.offsetHeight + 2 * GAP }];
    const hits = (b) => boxes.some((o) => b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h);
    // nodes a label would rather not cover
    const covers = (b, self) =>
      dots.some((c) => c.n !== self && c.sx + c.rs > b.x && c.sx - c.rs < b.x + b.w && c.sy + c.rs > b.y && c.sy - c.rs < b.y + b.h);
    const placed = new Map();
    const out = [];
    for (const it of items) {
      const { w, h } = wrapLabel(it.n);
      const { sx, sy, rs } = it;
      const sides = {
        below: { x: sx - w / 2, y: sy + rs + GAP },
        above: { x: sx - w / 2, y: sy - rs - GAP - h },
        right: { x: sx + rs + GAP, y: sy - h / 2 },
        left: { x: sx - rs - GAP - w, y: sy - h / 2 },
      };
      const prev = lastPlaced.get(it.n.id);
      const order = prev ? [prev, ...Object.keys(sides).filter((s) => s !== prev)] : Object.keys(sides);
      // a side must be wholly inside the view and clear of other labels; prefer one that leaves other nodes
      // uncovered. A label that fits nowhere waits for more zoom, a pan or a hover, rather than being cut off.
      const inside = (b) => b.x >= 2 && b.y >= 2 && b.x + w <= W - 2 && b.y + h <= H - 2;
      let side = null, best = Infinity;
      for (const s of order) {
        const b = { ...sides[s], w, h };
        if (!inside(b) || hits(b)) continue;
        const score = covers(b, it.n) ? 1 : 0;
        if (score < best) (side = s), (best = score);
      }
      if (!side) continue;
      const box = { ...sides[side], w, h };
      boxes.push(box);
      placed.set(it.n.id, side);
      out.push({ ...it, box });
    }
    lastPlaced = placed;
    return out;
  }
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  };
  function drawLabel({ n, a, box }) {
    const { lines, lh } = wrapLabel(n);
    ctx.globalAlpha = a;
    roundRect(box.x, box.y, box.w, box.h, 4);
    ctx.fillStyle = 'rgba(22, 20, 17, 0.78)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = n.color || INK.hub;
    if (n.kind === 'unit' && n !== hlNode) ctx.globalAlpha = a * 0.45;
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.font = LABEL[n.kind].font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = n.kind === 'track' ? n.color : n.kind === 'hub' ? '#fff' : INK.label;
    lines.forEach((t, i) => ctx.fillText(t, box.x + box.w / 2, box.y + PAD_Y + lh * (i + 0.5)));
  }

  // ---------- caption, legend, accessible node list ----------
  const stepLabel = (n) => ['Now', 'Next', 'Then'][n.step];
  const statusText = (st) => (st === 'active' ? 'in progress' : st === 'done' ? 'completed' : '');
  let captionFor;
  function caption(n) {
    if (n === captionFor) return;
    captionFor = n;
    captionEl.hidden = !n;
    if (!n) return;
    if (n.kind === 'hub') captionEl.innerHTML = `<strong>${esc(n.label)}</strong>`;
    else if (n.kind === 'track') {
      const units = [...G.adj.get(n.id)].filter((id) => id !== 'hub').length;
      captionEl.innerHTML = `<strong>${esc(n.label)}</strong> · ${esc(n.track.group)} · ${n.complete ? 'track complete ✓' : `${units} current unit${units === 1 ? '' : 's'}`}`;
    } else
      captionEl.innerHTML = `<strong>${esc(n.label)}</strong> · ${esc(n.track.title)} · age ${esc(ageLabel(n.row))} · ${stepLabel(n)}${n.status ? ` · ${statusText(n.status)}` : ''}`;
  }

  function renderList() {
    stage.setAttribute('aria-label', `Radial skill tree for ${G.who.name}`);
    listEl.setAttribute('aria-label', `Units for ${G.who.name}, by track`);
    listEl.innerHTML = G.tracks
      .map((t) => {
        const tn = G.byId.get(`track:${t.id}`);
        const units = G.nodes.filter((n) => n.kind === 'unit' && n.track === t);
        const items = units
          .map((n) => {
            const label = `${n.label}: ${stepLabel(n).toLowerCase()}, ${t.title}, age ${ageLabel(n.row)}${n.status ? `, ${statusText(n.status)}` : ''}`;
            return `<li><button type="button" data-id="${esc(n.id)}" aria-label="${esc(label)}">${esc(n.label)}</button></li>`;
          })
          .join('');
        return `<li>${esc(t.title)}${tn?.complete ? ' (track complete)' : ''}${items ? `<ul>${items}</ul>` : ''}</li>`;
      })
      .join('');
  }

  function renderLegend() {
    const groups = DATA.groups.filter((g) => G.tracks.some((t) => t.group === g.name));
    legendEl.innerHTML = `
      ${groups.map((g) => `<span class="graph-key"><i style="--c:${colorOf(g.name)}"></i>${esc(g.name)}</span>`).join('')}
      <span class="graph-key"><i class="ring" style="--c:${INK.active}"></i>In progress</span>
      <span class="graph-key"><i class="ring" style="--c:${INK.done}"></i>Track complete</span>
      <span class="graph-hint">Nearest the center: now · then next · then after. Scroll or pinch to zoom, drag to pan or move nodes.</span>`;
  }

  // ---------- toolbar (built once, so focus survives updates) ----------
  filtersEl.innerHTML = `
    <label>Child <select id="radial-child"></select></label>
    <label>Subject <select id="radial-group"><option value="">All subjects</option>${DATA.groups.map((g) => `<option>${esc(g.name)}</option>`).join('')}</select></label>
    <span class="zoom" role="group" aria-label="Zoom"><button type="button" class="chip" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" class="chip" data-zoom="0" aria-label="Fit the whole tree">Fit</button><button type="button" class="chip" data-zoom="1" aria-label="Zoom in">+</button></span>
    <button type="button" class="chip now-toggle" id="radial-now" aria-pressed="true" title="Show only the tracks that fit the child's age now; hide finished tracks and tracks not begun yet">Current Age</button>
    <button type="button" class="chip" id="radial-print">Print booklist</button>
    <button type="button" class="chip" id="radial-fs" aria-pressed="false">⛶ Fullscreen</button>
    <span class="by" id="radial-note"></span>`;
  const childSel = document.getElementById('radial-child');
  const groupSel = document.getElementById('radial-group');
  const fsBtn = document.getElementById('radial-fs');
  const nowBtn = document.getElementById('radial-now');
  function syncToolbar() {
    const kids = S.children();
    childSel.innerHTML = window.App.childOptions().map(([v, l]) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(l)}</option>`).join('');
    groupSel.value = group;
    nowBtn.setAttribute('aria-pressed', String(nowOnly));
    const notes = [];
    if (nowOnly && G.hidden) notes.push(`Current Age hides ${G.hidden} track${G.hidden === 1 ? '' : 's'} that ${G.who.name} has finished or not begun.`);
    if (!kids.length) notes.push('Showing a demo child. <a href="family.html">Add your children</a>, or load the demo family there.');
    document.getElementById('radial-note').innerHTML = notes.join(' ');
  }

  function render(fresh) {
    build(fresh);
    syncToolbar();
    renderList();
    renderLegend();
    captionFor = undefined;
    hover = (hover && G.byId.get(hover.id)) || null;
    hlNode = (hlNode && G.byId.get(hlNode.id)) || null;
    if (fresh) {
      sim.alpha = 0.8;
      for (let i = 0; i < 40; i++) tick(); // most of the settling happens before the first paint
      autoFit = true;
    }
    heat(fresh ? 0.5 : 0.25);
  }

  nowBtn.addEventListener('click', () => {
    nowOnly = !nowOnly;
    render(true);
  });
  document.getElementById('radial-print').addEventListener('click', () =>
    window.App.printBooklist({ who: G.who, current: G.branches.flatMap((b) => b.rings[0]), next: G.branches.flatMap((b) => b.rings[1]) }),
  );
  filtersEl.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (!z) return;
    if (+z.dataset.zoom === 0) fit();
    else setCam(zoomAt(W / 2, H / 2, (camTarget && !autoFit ? camTarget.k : cam.k) * 1.5 ** +z.dataset.zoom), true);
  });
  filtersEl.addEventListener('change', (e) => {
    if (e.target === childSel) {
      selected = childSel.value;
      if (selected.startsWith('store:')) S.setActive(selected.slice(6));
    }
    if (e.target === groupSel) group = groupSel.value;
    render(true);
  });
  S.onChange(() => render(false));

  // ---------- detail panel ----------
  let openedFromList = false, lastOpened = '';
  function openDetail(id) {
    openId = id;
    showDetail(id, openDetail);
    adoptDetail();
    if (!id && openedFromList && (!document.activeElement || document.activeElement === document.body)) {
      // the list may have been rebuilt while the panel was open (a status change), so refocus by id
      listEl.querySelector(`button[data-id="${CSS.escape(lastOpened)}"]`)?.focus();
    }
    if (id) lastOpened = id;
    kick();
  }
  // in native fullscreen only the fullscreen element is painted, so the panel moves inside it
  function adoptDetail() {
    const host = fsElement() === shell ? shell : document.body;
    let moved = false;
    for (const el of document.querySelectorAll('body > .detail, body > .detail-backdrop, #radial-shell > .detail, #radial-shell > .detail-backdrop')) {
      if (el.parentNode !== host) {
        host.append(el);
        moved = true;
      }
    }
    const panel = document.querySelector('.detail');
    if (moved && panel && !panel.hidden) panel.querySelector('.close')?.focus();
  }
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    openedFromList = true;
    openDetail(b.dataset.id);
  });
  listEl.addEventListener('focusin', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    kbdFocus = b.dataset.id;
    const n = G.byId.get(kbdFocus);
    if (n) {
      // bring the focused node into view
      const sx = n.x * cam.k + cam.x, sy = n.y * cam.k + cam.y, m = 60;
      if (sx < m || sx > W - m || sy < m || sy > H - m) setCam({ k: cam.k, x: W / 2 - n.x * cam.k, y: H / 2 - n.y * cam.k }, true);
    }
    kick();
  });
  listEl.addEventListener('focusout', () => {
    kbdFocus = null;
    kick();
  });

  // ---------- pointer: hover, drag nodes, pan, pinch; wheel zoom ----------
  const pointers = new Map();
  let gesture = null;
  const local = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  function nodeAt(px, py) {
    let best = null, bd = Infinity;
    for (const n of G.nodes) {
      const d = Math.hypot(n.x * cam.k + cam.x - px, n.y * cam.k + cam.y - py);
      if (d < Math.max(drawR(n) * cam.k, 4) + 5 && d < bd) (best = n), (bd = d);
    }
    return best;
  }
  function startPinch() {
    const [a, b] = [...pointers.values()];
    gesture = { type: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], cam0: { ...cam } };
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    canvas.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 2) {
      releaseNode();
      startPinch();
      return;
    }
    if (pointers.size > 2) return;
    const n = nodeAt(...p);
    gesture = { type: n ? 'node' : 'pan', node: n, p0: p, cam0: { ...cam }, moved: false };
    if (n) {
      dragNode = n;
      [n.fx, n.fy] = toWorld(...p);
      sim.alphaTarget = 0.3;
      heat(0.3);
    }
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (!pointers.has(e.pointerId)) {
      // plain hover
      const n = nodeAt(...p);
      canvas.style.cursor = n ? 'pointer' : 'grab';
      if (n !== hover) {
        hover = n;
        kick();
      }
      return;
    }
    pointers.set(e.pointerId, p);
    if (!gesture) return;
    if (gesture.type === 'pinch') {
      const [a, b] = [...pointers.values()];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const k = clampK((gesture.cam0.k * Math.hypot(a[0] - b[0], a[1] - b[1])) / gesture.d0);
      const wx = (gesture.m0[0] - gesture.cam0.x) / gesture.cam0.k, wy = (gesture.m0[1] - gesture.cam0.y) / gesture.cam0.k;
      setCam({ k, x: m[0] - wx * k, y: m[1] - wy * k });
      return;
    }
    if (Math.hypot(p[0] - gesture.p0[0], p[1] - gesture.p0[1]) > 4) gesture.moved = true;
    if (gesture.type === 'node') {
      [gesture.node.fx, gesture.node.fy] = toWorld(...p);
      kick();
    } else if (gesture.moved) setCam({ k: cam.k, x: gesture.cam0.x + p[0] - gesture.p0[0], y: gesture.cam0.y + p[1] - gesture.p0[1] });
  });
  function releaseNode() {
    if (!dragNode) return;
    dragNode.fx = dragNode.fy = null;
    dragNode = null;
    sim.alphaTarget = 0;
    kick();
  }
  function endPointer(e, cancelled) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const g = gesture;
    if (g?.type === 'node') {
      releaseNode();
      if (!g.moved && !cancelled) clickNode(g.node);
    }
    gesture = null;
    if (pointers.size === 1) {
      // one finger left after a pinch: carry on panning
      const p = [...pointers.values()][0];
      gesture = { type: 'pan', p0: p, cam0: { ...cam }, moved: true };
    }
    if (e.pointerType !== 'mouse') hover = null;
    canvas.style.cursor = 'grab';
    kick();
  }
  canvas.addEventListener('pointerup', (e) => endPointer(e, false));
  canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !pointers.size && hover) {
      hover = null;
      kick();
    }
  });
  function clickNode(n) {
    if (n.kind === 'unit') {
      openedFromList = false;
      openDetail(n.id);
    } else if (n.kind === 'hub') fit();
    else {
      // a track node zooms to its cluster
      const ids = [n.id, ...G.adj.get(n.id)].filter((id) => id !== 'hub');
      const more = G.nodes.filter((m) => m.track === n.track);
      const pts = [...new Set([...ids.map((id) => G.byId.get(id)), ...more])];
      const cx = pts.reduce((s, m) => s + m.x, 0) / pts.length, cy = pts.reduce((s, m) => s + m.y, 0) / pts.length;
      const k = clampK(Math.max(cam.k, 1.8));
      setCam({ k, x: W / 2 - cx * k, y: H / 2 - cy * k }, true);
    }
  }
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015));
      const base = camTarget && !autoFit ? camTarget : cam;
      const [px, py] = local(e);
      const [wx, wy] = [(px - base.x) / base.k, (py - base.y) / base.k];
      const k = clampK(base.k * factor);
      setCam({ k, x: px - wx * k, y: py - wy * k }, false);
    },
    { passive: false },
  );

  // ---------- keyboard on the graph ----------
  stage.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const pan = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (pan) setCam({ k: cam.k, x: cam.x + pan[0] * 60, y: cam.y + pan[1] * 60 }, true);
    else if (e.key === '+' || e.key === '=') setCam(zoomAt(W / 2, H / 2, cam.k * 1.5), true);
    else if (e.key === '-' || e.key === '_') setCam(zoomAt(W / 2, H / 2, cam.k / 1.5), true);
    else if (e.key === '0') fit();
    else if (e.key === 'f' || e.key === 'F') toggleFs();
    else return;
    e.preventDefault();
  });

  // ---------- fullscreen: the Fullscreen API on the whole shell, or a fixed overlay where it is missing ----------
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsSupported = () =>
    !!(shell.requestFullscreen || shell.webkitRequestFullscreen) && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  let pseudo = false;
  const isFs = () => pseudo || fsElement() === shell;
  async function enterFs() {
    if (fsSupported()) {
      try {
        await (shell.requestFullscreen ? shell.requestFullscreen() : shell.webkitRequestFullscreen());
        return;
      } catch {
        // fall through to the overlay
      }
    }
    pseudo = true;
    syncFs();
  }
  function exitFs() {
    if (pseudo) {
      pseudo = false;
      syncFs();
    } else if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
  const toggleFs = () => (isFs() ? exitFs() : enterFs());
  function syncFs() {
    const on = isFs();
    shell.classList.toggle('is-fullscreen', on);
    shell.classList.toggle('is-overlay', pseudo);
    document.documentElement.classList.toggle('radial-locked', pseudo);
    fsBtn.setAttribute('aria-pressed', String(on));
    fsBtn.textContent = on ? '✕ Exit fullscreen' : '⛶ Fullscreen';
    adoptDetail();
    autoFit = true;
    kick();
  }
  fsBtn.addEventListener('click', toggleFs);
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);
  document.addEventListener('keydown', (e) => {
    // the overlay has no browser Esc handling; an open detail panel closes first
    if (e.key !== 'Escape' || !pseudo) return;
    const panel = document.querySelector('.detail');
    if (panel && !panel.hidden) return;
    exitFs();
    fsBtn.focus();
  });

  // ---------- sizing ----------
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const d = window.devicePixelRatio || 1;
    if (w === W && h === H && d === dpr) return;
    // keep the world point at the center where it was
    cam.x += (w - W) / 2;
    cam.y += (h - H) / 2;
    [W, H, dpr] = [w, h, d];
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (autoFit) Object.assign(cam, fitView());
    kick();
  }
  new ResizeObserver(resize).observe(stage);
  document.fonts?.ready.then(() => {
    wraps = new Map();
    captionFor = undefined;
    kick();
  });

  resize();
  render(true);
  Object.assign(cam, fitView());
})();
