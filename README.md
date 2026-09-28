# education-program

A repo full of my current research surrounding historical classical education curricula, childhood development and nutrition, and formation for an outstanding generation.

## The Formation Program

A track-based classical education and formation program from birth to early college. The aim is to form a *modern-day founding father*: a person of character, practical skill, broad knowledge, and poetic competence.

- **Classical core** modeled on Hillsdale (K-12 Program Guide, Barney Charter School Initiative), Memoria Press, Classical Academic Press and similar programs.
- **Catholic theological spine** (TAN, Ignatius, Baltimore Catechism, Aquinas) with **Protestant classics as readings** (Lewis, Bunyan, and others).
- **History from primary sources**, and **old literature** in English from Shakespeare through the 20th century.
- **Five languages to reading proficiency** (Latin, Greek, Hebrew, Spanish, Chinese) plus units in Old English.
- **The founders' own canon**: what the colonial colleges, Jefferson, Adams and Franklin, and 19th-century US/UK schools actually had students read.

### Structure

| Level | Ages | What it is |
|---|---|---|
| Early Dev – 5 | 0–10 | Best practices by age; gentle formal lessons from 5, full formal grammar-stage schooling from 6–7 |
| Grades 6–8 | 10–12 | Logic stage; languages and primary sources deepen |
| Grades 9–12 | 12–16 | Rhetoric stage; high-school material mastered by 16 |
| College (17+) | 17–18 | General-education college work (Hillsdale core, Great Books colleges, colonial colleges) |

Every subject is a **track** (26 of them across 9 subject groups). A track is a chain of units ordered from simple to complex, with prerequisites.

### Viewing it

The website is in `docs/` and has three views:

- **Curriculum**: the master table. You can sort it by age, level, track or title, and filter it by level, subject and track or by search. Click a row to see its texts, curriculum options, and historical precedent.
- **Skill Tree**: each track as a lane on an age axis, with prerequisite arrows.
- **Founding-Era Reading**: the historical reading lists, cross-linked into the curriculum.
- **Family**: tools for parents running the program.
  - Add each child, with a birthdate, and place them in each track.
  - See each child's **next assignments** (units whose prerequisites are done and whose typical age is near).
  - Mark units started or completed. This also works from any unit's detail panel.
  - Keep **"Name's Bookshelf of Knowledge"**: completed units add their texts automatically, and any other book can be added by hand.
  - Use **Look Ahead** to get a combined shopping list of the texts every child will need in the next 3, 6 or 12 months, with an "acquired" checklist.

  Progress is saved in the browser you use. Use **Export backup** and **Import backup** to keep a copy or move to another device.

To view it, either open `docs/index.html` directly in a browser, or run:

```bash
npm install
npm run build
npm run serve
```

and open http://localhost:8080. To publish on GitHub Pages, go to Settings → Pages and set the source to `main` / `docs`.

### Editing the content

All content lives in YAML:

- `data/tracks/<track>.yaml`: one file per track. See [data/schema.md](data/schema.md) for the fields.
- `data/founding/<list>.yaml`: historical reading lists.

After editing, run `npm run build`, which validates the data and regenerates `docs/data/`. The build checks for:

- missing fields
- duplicate ids
- broken or cyclic prerequisites
- ages inconsistent with a unit's level

Run `npm run check-links` to find dead URLs.

Upcoming work is tracked in [TODO.md](TODO.md).
