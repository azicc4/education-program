// Demo children for proof of concept: fixed ages (birthdates computed from today), progress generated from age.
(function () {
  const PROFILES = [
    { id: 'demo-clara', name: 'Clara (demo)', age: 6.5 },
    { id: 'demo-thomas', name: 'Thomas (demo)', age: 11.25 },
    { id: 'demo-john', name: 'John (demo)', age: 15.75 },
  ];
  const NAMES = new Set(PROFILES.map((p) => p.name));

  const birthdateFor = (age) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.round(age * 365.25));
    return d.toISOString().slice(0, 10);
  };

  // units that have ended are done; units spanning the child's age are in progress
  function progressFor(DATA, age) {
    const status = {};
    for (const r of DATA.rows) {
      if (r.ageEnd <= age) status[r.id] = 'done';
      else if (r.ageStart <= age) status[r.id] = 'active';
    }
    return status;
  }

  // every text read in the child's completed units, finished on the date the child reached the unit's end age
  function shelfFor(DATA, Store, child) {
    const born = new Date(`${child.birthdate}T00:00:00`);
    const today = Store.today();
    const books = [];
    for (const r of DATA.rows) {
      if (Store.status(child.id, r.id) !== 'done') continue;
      const d = new Date(born.getTime() + r.ageEnd * 365.25 * 864e5).toISOString().slice(0, 10);
      for (const t of Store.requiredTexts(r))
        books.push({ ...t, rowId: r.id, track: r.track, finished: d < today ? d : today, published: t.date || '' });
    }
    return books;
  }

  window.Demo = {
    names: NAMES,
    profiles: (DATA) =>
      PROFILES.map((p) => ({ ...p, birthdate: birthdateFor(p.age), demo: true, progress: progressFor(DATA, p.age) })),

    // built-in demo profiles that are not already loaded into the family store (so a selector never lists a child twice)
    notInStore: (DATA, Store) => window.Demo.profiles(DATA).filter((p) => !Store.children().some((c) => c.name === p.name)),

    // fill each loaded demo child's Bookshelf of Knowledge from their completed units, once per child
    topUp(DATA, Store) {
      let added = 0;
      for (const c of Store.children().filter((x) => NAMES.has(x.name) && !x.shelfSeeded)) {
        // set the flag first so the single save in addBooks stores it; save it directly when nothing was new
        Store.updateChild(c.id, { shelfSeeded: true }, { quiet: true });
        const n = Store.addBooks(c.id, shelfFor(DATA, Store, c));
        if (!n) Store.updateChild(c.id, { shelfSeeded: true });
        added += n;
      }
      return added;
    },

    // copy the demo children into the family store (with progress and their bookshelves); returns children added
    loadIntoStore(DATA, Store) {
      let added = 0;
      for (const p of window.Demo.profiles(DATA)) {
        if (Store.children().some((c) => c.name === p.name)) continue;
        const c = Store.addChild(p.name, p.birthdate);
        for (const [rowId, st] of Object.entries(p.progress)) Store.setStatus(c.id, rowId, st, { quiet: true });
        added++;
      }
      window.Demo.topUp(DATA, Store);
      Store.setActive(Store.children().find((c) => c.name === PROFILES[1].name)?.id || Store.activeChild);
      return added;
    },
  };
})();
