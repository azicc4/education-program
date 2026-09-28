// Family progress store: children, unit progress, bookshelves, acquired texts.
// Everything lives in this browser's localStorage; export/import moves it between devices.
(function () {
  const KEY = 'formation.family.v1';
  const empty = () => ({ version: 1, children: [], progress: {}, shelf: {}, acquired: {}, activeChild: '' });
  let memoryOnly = false;
  let state = load();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
    } catch {
      memoryOnly = true;
      return empty();
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      memoryOnly = true;
    }
    listeners.forEach((fn) => fn());
  }

  const uid = () => Math.random().toString(36).slice(2, 10);
  const today = () => new Date().toISOString().slice(0, 10);
  const textKey = (t) => `${(t.title || '').replace(/\s*\(elective\)\s*$/i, '').trim().toLowerCase()}|${(t.author || '').trim().toLowerCase()}`;
  const isElective = (t) => /\(elective\)\s*$/i.test(t.title || '');
  const cleanTitle = (t) => (t.title || '').replace(/\s*\(elective\)\s*$/i, '');

  const Store = {
    get memoryOnly() { return memoryOnly; },
    onChange(fn) { listeners.add(fn); },
    textKey, isElective, cleanTitle, today,

    // ---------- children ----------
    children: () => state.children,
    child: (id) => state.children.find((c) => c.id === id),
    addChild(name, birthdate) {
      const c = { id: uid(), name: name.trim(), birthdate };
      state.children.push(c);
      state.progress[c.id] = {};
      state.shelf[c.id] = [];
      if (!state.activeChild) state.activeChild = c.id;
      save();
      return c;
    },
    updateChild(id, patch) { Object.assign(Store.child(id), patch); save(); },
    removeChild(id) {
      state.children = state.children.filter((c) => c.id !== id);
      delete state.progress[id];
      delete state.shelf[id];
      if (state.activeChild === id) state.activeChild = state.children[0]?.id || '';
      save();
    },
    age(child, at = new Date()) {
      if (!child?.birthdate) return null;
      return (at - new Date(child.birthdate + 'T00:00:00')) / (365.25 * 864e5);
    },
    get activeChild() { return state.activeChild; },
    setActive(id) { state.activeChild = id; save(); },

    // ---------- progress ----------
    status: (childId, rowId) => state.progress[childId]?.[rowId]?.status || '',
    record: (childId, rowId) => state.progress[childId]?.[rowId],
    setStatus(childId, rowId, status, { quiet = false } = {}) {
      const p = (state.progress[childId] ||= {});
      if (!status) delete p[rowId];
      else {
        const prev = p[rowId] || {};
        p[rowId] = { ...prev, status };
        if (status === 'active' && !prev.started) p[rowId].started = today();
        if (status === 'done') p[rowId].completed = today();
      }
      if (!quiet) save();
    },
    // mark units done in bulk without adding their texts to the shelf (placement)
    markDone(childId, rowIds) {
      for (const id of rowIds) if (Store.status(childId, id) !== 'done') Store.setStatus(childId, id, 'done', { quiet: true });
      save();
    },

    // ---------- bookshelf ----------
    shelf: (childId) => state.shelf[childId] || [],
    onShelf: (childId, key) => (state.shelf[childId] || []).some((b) => b.key === key),
    addBook(childId, book) {
      const list = (state.shelf[childId] ||= []);
      const entry = {
        id: uid(),
        title: cleanTitle(book).trim(),
        author: (book.author || '').trim(),
        date: book.finished || today(), // date finished
        published: book.finished ? book.published || '' : book.date || '', // from curriculum texts
        rowId: book.rowId || '',
        track: book.track || '',
        notes: book.notes || '',
        custom: !!book.custom,
      };
      entry.key = textKey(entry);
      if (!entry.title || list.some((b) => b.key === entry.key)) return null;
      list.push(entry);
      save();
      return entry;
    },
    removeBook(childId, bookId) {
      state.shelf[childId] = (state.shelf[childId] || []).filter((b) => b.id !== bookId && b.key !== bookId);
      save();
    },

    // ---------- look-ahead acquisitions ----------
    acquired: (key) => !!state.acquired[key],
    setAcquired(key, v) { if (v) state.acquired[key] = today(); else delete state.acquired[key]; save(); },

    // ---------- backup ----------
    exportJSON: () => JSON.stringify(state, null, 2),
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.children)) throw new Error('Not a family backup file');
      state = { ...empty(), ...data };
      save();
    },
  };

  // ---------- seasons (for seasonal extracurriculars) ----------
  const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
  Store.season = (d = new Date()) => SEASONS[d.getMonth()];
  // a row is "seasonal" if its title names a season; in season if that season is now
  Store.rowSeason = (r) => (/(fall|autumn|winter|spring|summer)/i.exec(r.title)?.[1] || '').toLowerCase().replace('autumn', 'fall');
  Store.inSeason = (r) => Store.rowSeason(r) === Store.season();

  // ---------- pacing logic (needs curriculum data) ----------
  Store.plan = function (DATA) {
    const byId = Object.fromEntries(DATA.rows.map((r) => [r.id, r]));
    const done = (cid, id) => Store.status(cid, id) === 'done';
    const prereqsMet = (cid, r, extra) => (r.prerequisites || []).every((p) => done(cid, p) || extra?.has(p) || !byId[p]);

    // Next assignments: per track, the in-progress units plus the earliest unlocked unit within a year of the child's age.
    function next(cid) {
      const child = Store.child(cid);
      const age = Store.age(child) ?? 99;
      const out = [];
      for (const t of DATA.tracks) {
        const rows = DATA.rows.filter((r) => r.track === t.id).sort((a, b) => a.order - b.order);
        const active = rows.filter((r) => Store.status(cid, r.id) === 'active');
        const ready = rows
          .filter((r) => !Store.status(cid, r.id) && prereqsMet(cid, r) && r.ageStart <= age + 1)
          .filter((r) => !Store.rowSeason(r) || Store.inSeason(r)) // seasonal rows only surface in their season
          .sort((a, b) => Store.inSeason(b) - Store.inSeason(a));
        const pick = [...active, ...ready.slice(0, active.length ? 0 : 1)];
        for (const r of pick) {
          const pace = r.ageEnd < age ? 'behind' : r.ageStart > age ? 'ahead' : 'on';
          out.push({ row: r, status: Store.status(cid, r.id) || 'ready', pace });
        }
      }
      return out.sort((a, b) => (a.status === 'active' ? -1 : 0) - (b.status === 'active' ? -1 : 0) || a.row.ageStart - b.row.ageStart);
    }

    // Look ahead: units the child is likely to be in within `months`, following prerequisite chains.
    function lookAhead(cid, months = 6) {
      const child = Store.child(cid);
      const age = Store.age(child);
      if (age == null) return [];
      const horizon = age + months / 12;
      const set = new Set(DATA.rows.filter((r) => Store.status(cid, r.id) === 'active').map((r) => r.id));
      let grew = true;
      while (grew) {
        grew = false;
        for (const r of DATA.rows) {
          if (set.has(r.id) || Store.status(cid, r.id)) continue;
          if (r.ageStart <= horizon && prereqsMet(cid, r, set)) {
            set.add(r.id);
            grew = true;
          }
        }
      }
      return [...set].map((id) => byId[id]).sort((a, b) => a.ageStart - b.ageStart);
    }

    // Place a child in a track: mark every unit before `rowId` (and its prerequisite chain) done.
    function placeAt(cid, trackId, rowId) {
      const target = byId[rowId];
      const ids = new Set(DATA.rows.filter((r) => r.track === trackId && r.order < target.order).map((r) => r.id));
      const stack = [...(target.prerequisites || [])];
      while (stack.length) {
        const id = stack.pop();
        if (ids.has(id) || !byId[id]) continue;
        ids.add(id);
        stack.push(...(byId[id].prerequisites || []));
      }
      Store.markDone(cid, [...ids]);
    }

    // Initial placement by age: everything that ends before the child's current age.
    function placeByAge(cid) {
      const age = Store.age(Store.child(cid));
      if (age == null) return 0;
      const ids = DATA.rows.filter((r) => r.ageEnd <= age).map((r) => r.id);
      Store.markDone(cid, ids);
      return ids.length;
    }

    return { next, lookAhead, placeAt, placeByAge };
  };

  window.Store = Store;
})();
