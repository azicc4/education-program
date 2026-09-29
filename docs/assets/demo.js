// Demo children for proof of concept: fixed ages (birthdates computed from today), progress generated from age.
(function () {
  const PROFILES = [
    { id: 'demo-clara', name: 'Clara (demo)', age: 6.5 },
    { id: 'demo-thomas', name: 'Thomas (demo)', age: 11.25 },
    { id: 'demo-john', name: 'John (demo)', age: 15.75 },
  ];

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

  window.Demo = {
    profiles: (DATA) =>
      PROFILES.map((p) => ({ ...p, birthdate: birthdateFor(p.age), demo: true, progress: progressFor(DATA, p.age) })),

    // copy the demo children into the family store (with progress and a starter bookshelf)
    loadIntoStore(DATA, Store) {
      let added = 0;
      for (const p of window.Demo.profiles(DATA)) {
        if (Store.children().some((c) => c.name === p.name)) continue;
        const c = Store.addChild(p.name, p.birthdate);
        for (const [rowId, st] of Object.entries(p.progress)) Store.setStatus(c.id, rowId, st, { quiet: true });
        for (const r of DATA.rows.filter((row) => p.progress[row.id] === 'done').slice(-12))
          for (const t of (r.coreTexts || []).filter((x) => !Store.isElective(x)).slice(0, 1)) Store.addBook(c.id, { ...t, rowId: r.id, track: r.track });
        added++;
      }
      Store.setActive(Store.children().find((c) => c.name === PROFILES[1].name)?.id || Store.activeChild);
      return added;
    },
  };
})();
