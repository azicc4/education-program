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

- **Curriculum**: the master table. You can sort it by age, level, track or title, and filter it by level, subject and track or by search. Click a row to see its texts, curriculum options, and historical precedent. Units marked **Elective** sit outside the core, and **Saturday** or **Sunday** units run on those days; the **Units** and **Day** filters (on every view) narrow to either. Each unit's texts are listed in reading order and marked "read over the unit", "selections", "reference", "re-read" or grouped as "choose one", with the weekly reading load that follows. Every formal unit also shows its **estimated effort**: total hours of reading and of work (exercises, writing, translation, memorization, discussion, labs, practice, projects, exam prep), with how each figure was reached.
- **Skill Tree**: each track as a lane on an age axis, with prerequisite arrows. **Current Age** (on by default) shows only a chosen child's current units and hides finished and not-yet-begun tracks; **Print booklist** prints the current units' texts, the next units', or both. **No child (curriculum only)** shows the tree without any child's progress. **One track** switches to a condensed view: one track as a simple path of unit cards, with every other track folded to its title.
- **Sources**: for each track, the curricula and programs it uses beside its primary sources, secondary works and instructional texts, with a mix bar showing the balance.
- **School Hours**: each grade's yearly hour budgets against the work the curriculum assigns. Weekday academics (Monday–Friday) get the regular school hours for the grade times a multiplier: ×2 through grade 6, ×2.5 for grades 7–10 and ×2 for grades 11–12 (raised from ×1.5 to match the founding-era college years). Saturdays (8 hours) hold outdoor skills, riding and shooting, sailing, handcrafts and home arts; Sundays hold Scripture and spiritual reading (1 hour a week from age 9, 2 hours from 12¾). The core units of every year fit these budgets. **Elective** units, and the elective parts of core units, are extra. Click a grade to see every track's share of it, and the year **term by term**: four 12-week terms, each with its main subjects and weekly hours. From grade 5 on, daily subjects (mathematics, the languages, writing, literature, music, physical training) run one unit at a time, and the rest are taken a term or two at a time, so each term has about 8–11 main subjects instead of every subject at once.
- **Teacher Plan**: what the teacher reads, studies and prepares, and when, built live from the curriculum and every child's progress (so it follows any change to either). The teacher reads every core text and prepares each unit one to two months ahead, studies each language a year ahead, and prepares art, outdoor and physical skills at least six months ahead; a unit taken by two children is prepared once. It shows the teacher's hours a week month by month for two years, what to prepare now (with "late start" flags and a **Mark prepared** button), what begins in the next six months, and the steady load for one child, grade by grade. The rules are in `data/teacher.yaml`, and each unit's detail panel says how it is prepared.
- **Radial Tree**: one child's current place in every track, drawn as a force-directed graph around the child, with fullscreen, zoom and hover highlighting (demo children included), plus the same **Current Age** toggle and **Print booklist**.
- **Founding-Era Reading**: the historical reading lists, cross-linked into the curriculum.
- **Family Progress**: tools for parents running the program.
  - Add each child, with a birthdate, and place them in each track.
  - See each child's **next assignments** (core units whose prerequisites are done and whose typical age is near; an elective unit joins a child's path once it is started).
  - Mark units started or completed. This also works from any unit's detail panel.
  - Log **time spent** per child in any unit's detail panel: minutes of reading, discussing and writing for each book; per lesson for textbooks (reading, exercises) and language books (learning, practicing, studying), with one total per book. Curriculum programs can be tracked the same way.
  - Keep **"Name's Bookshelf of Knowledge"**: completed units add the texts actually read (not electives, reference works, or the other options of a "choose one" group), any other book can be added with **+ Add a book**, and the shelf sorts by subject, date finished, title or author. The demo family comes with full shelves.
  - See each child's **Weekly load**: the hours a week of every unit they are on now (in progress, due at their age, or behind), split into weekday academics, Saturday and Sunday, each against the budget for their grade, with a family overview. Next assignments shows the same totals in one line.
  - Use **Look Ahead** to get a combined shopping list of the texts every child will need in the next 3, 6 or 12 months, with an "acquired" checklist and filters to hide acquired, missing, free or paid texts.

  Progress is saved in the browser you use. Use **Export backup** and **Import backup** to keep a copy or move to another device.

To view it, either open `docs/index.html` directly in a browser, or run:

```bash
npm install
npm run build
npm run serve
```

and open http://localhost:8080.

The site is published at **https://azicc4.github.io/education-program/**. The workflow in `.github/workflows/pages.yml` runs `npm run build` and deploys `docs/` on every push to `main` (it can also be run by hand from the Actions tab). It needs Settings → Pages → Build and deployment → Source set to **GitHub Actions**, once.

### Editing the content

All content lives in YAML:

- `data/tracks/<track>.yaml`: one file per track. See [data/schema.md](data/schema.md) for the fields.
- `data/founding/<list>.yaml`: historical reading lists.
- `data/budget.yaml`: the yearly hour budgets per grade, with their sources.
- `data/teacher.yaml`: how far ahead the teacher prepares each kind of unit, and how long it takes.

After editing, run `npm run build`, which validates the data and regenerates `docs/data/`. The build checks for:

- missing fields
- duplicate ids
- broken or cyclic prerequisites
- ages inconsistent with a unit's level
- a core unit that depends on an elective unit

Run `npm run check-links` to find dead URLs.

Upcoming work is tracked in [TODO.md](TODO.md).
