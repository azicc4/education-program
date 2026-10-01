# Data Schema

All curriculum content lives in YAML under `data/`. `npm run build` validates it and writes JSON for the website in `docs/data/`.

## Program model

| Level id  | Label               | Typical ages | Notes |
|-----------|---------------------|--------------|-------|
| `early-5` | Early Dev – Grade 5 | 0 – 10       | Ages 0–6 are *early development* (best practices, not curriculum). Gentle formal lessons from 5; full formal schooling from 6–7. |
| `6-8`     | Grades 6 – 8        | 10 – 12      | Grammar stage → logic stage. |
| `9-12`    | Grades 9 – 12       | 12 – 16      | Accelerated: high-school material mastered by 16. |
| `college` | College (17+)       | 17 – 18      | General-education college work (Hillsdale core, St. John's, Thomas Aquinas College, colonial colleges). |

Validation rule for `level` vs `ageStart`: `early-5` ≤ 10, `6-8` 9.5–12.5, `9-12` 12–16.5, `college` ≥ 16.

## Tracks

Each track is one file: `data/tracks/<track-id>.yaml`.

| Group (`trackGroup`) | Track ids |
|---|---|
| Early Formation | `early-development` |
| English | `reading-phonics`, `grammar-composition`, `literature`, `poetry`, `drama` |
| Languages | `latin`, `greek`, `hebrew`, `spanish`, `chinese`, `old-english` |
| Trivium | `logic`, `rhetoric` |
| History | `history` |
| Faith & Philosophy | `theology`, `philosophy` |
| Math & Science | `mathematics`, `physics`, `chemistry`, `biology`, `natural-science` |
| Founder Skills | `civics-law`, `economics`, `social-science`, `practical-arts` |
| Arts & Body | `music`, `fine-arts`, `character-virtue`, `physical-training` |
| Extracurriculars | `sports`, `music-lessons` |
| AP & Exams | `ap-history`, `ap-humanities`, `test-prep` (side tracks: exam preparation that supplements, never replaces, the main tracks) |

## Track file format

```yaml
track: latin                 # must equal file name
title: Latin                 # display name
trackGroup: Languages        # one of the groups above
description: >-
  One paragraph: aims of the track, how it progresses, the end-state competency.
elective: true               # optional: the whole track is elective (every unit in it is outside the core)
electiveNote: >-             # with elective: why, shown on every unit that does not give its own reason
  Elective third sacred language; the core language load is Latin, Greek and Spanish.
rows:
  - id: latin-01             # <track-id>-NN, two digits, NN increases with order
    title: "Latin I: Song School & First Forms"
    type: course             # course | unit | practice   (practice = early-development best practice)
    level: early-5
    stage: formal            # early-development (ages 0–6/7) | formal
    day: saturday            # optional: weekday (default, Monday–Friday) | saturday | sunday — which budget the unit uses
    elective: true           # optional: the unit is outside the core; it is never assumed in a child's path
    electiveNote: >-         # with elective: why (e.g. what core unit already covers it)
      Plutarch's Lives are core in civics-law-08.
    ageStart: 7              # numbers; decimals allowed (e.g. 0.5)
    ageEnd: 8
    order: 1                 # position within track, simple → complex
    prerequisites: []        # ids from THIS SAME TRACK only
    related: []              # optional ids from OTHER tracks (soft links; warnings only if missing)
    exams: []                # optional exam ids from data/exams.yaml that this unit prepares for
    summary: >-
      2–4 sentences: what is studied and why.
    objectives:
      - Chant and recite first and second declension endings
      - Read short sentences aloud with correct pronunciation
    coreTexts:
      - title: Latin Grammar
        author: Charles Bennett
        date: "1895"
        publicDomain: true
        reader: student      # teacher | together | student — who reads it
        kind: instructional  # primary (original work read directly) | secondary (history, commentary, retelling) | instructional (textbook, grammar, workbook, prep)
        pages: 320           # standard complete edition, when known
        order: 1             # optional: reading sequence within this unit (1 = first); texts sharing a number run side by side
        role: core           # optional: core (default, read it) | choice (read ONE text of its group) | selections (read only the assigned part)
                             #           | reference (consulted, not read through) | review (already read in an earlier unit)
        group: A             # with role: choice — the alternatives that share a group letter; read one of them
        portion: "Books I–II"  # optional, with role: selections (or choice) — what to read
        readPages: 120       # optional, with role: selections — pages actually assigned
        pace: long           # optional: long = read slowly across the whole unit (textbooks, long treatises), not in one stretch
        reviewOf: spanish-07 # optional, with role: review — the unit where it was first read
        lessons: 30          # optional, textbooks, grammars and language books: number of lessons (or chapters…)
        lessonLabel: lesson  # optional: lesson (default) | chapter | unit | week | section | day
        lessonsNote: "publisher's table of contents"   # where the count comes from
        links:
          - { label: Archive.org, url: "https://archive.org/details/..." }
    workload:                # estimated total effort for the whole unit, for formal academic units
      readingHours: 45       # hours of reading the counted texts (student reading plus read-aloud/together time)
      readingBasis: "1,180 pp: novels at ~35 pp/h, Plutarch at ~20 pp/h"   # how the reading hours were reached
      work:                  # everything else, by kind: exercises | writing | translation | memorization | recitation
                             #   | discussion | lab | practice | project | exam-prep
        - { kind: writing, hours: 30, note: "six 2–3 page essays with revision" }
        - { kind: discussion, hours: 18, note: "weekly narration and Socratic discussion" }
      electiveHours: 24      # optional: hours of the unit that are elective (elective texts, extra essays or sessions)
      electiveBasis: "Kim and Gulliver's Travels (~700 pp, ~24 h)"   # what the elective part is
    curriculumOptions:       # 2–3 real, purchasable/available programs where they exist
      - name: Latina Christiana I
        publisher: Memoria Press
        tradition: classical  # catholic | protestant | secular | classical
        url: "https://www.memoriapress.com/..."
        notes: Short note on fit / tradeoffs.
        lessons: 25          # optional, as for texts: a program's lessons, with lessonLabel and lessonsNote
    historicalPrecedent: >-
      Optional: how this was done historically (e.g. "Boston Latin School, 1789: boys began
      Cheever's Accidence at age 7–8"). Cite a primary source in `sources` if possible.
    sources:                 # optional: research citations (esp. for practice rows)
      - { label: "AAP: Books Build Connections", url: "https://..." }
    notes: Optional free text (tips, Catholic/Protestant differences, cautions).
```

### Rules

- **Required**: `id, title, type, level, stage, ageStart, ageEnd, order, summary`. Everything else optional but strongly encouraged.
- `prerequisites` only reference rows in the same track. Cross-track links go in `related`.
- **Workload** (`workload`) is the estimated total effort for the whole unit, not a weekly figure; when in the year a
  unit runs is decided separately. Reading hours count the same texts as the reading load (core texts, one per choice
  group, `readPages` or about a third of `pages` for selections; no electives, reference works or re-reads) at these
  typical rates, adjusted for the text:

  | Pages per hour | Ages 6–9 | 10–12 | 13–15 | 16+ |
  |---|---|---|---|---|
  | Read aloud or together (children's books, novels) | 25–30 | 30 | 30 | 30 |
  | Student: stories, novels, narrative history | 20–25 | 30–35 | 35–40 | 40–45 |
  | Student: older English, poetry, dense primary sources, philosophy, theology | 10–15 | 15 | 15–20 | 20–25 |
  | Student: textbooks and grammars | (count the lessons as `exercises`, not reading) | | | |

  Reading in the target language of a language course is `translation` work at a few pages an hour, not reading.
  Work hours come from the unit's objectives: exercises and problem sets, compositions, memorization and recitation,
  discussion or narration, labs, practice, projects, and exam preparation.
- **Reading plan fields** (`order`, `role`, `group`, `portion`, `readPages`, `pace`, `reviewOf`) tell a family what must actually be read.
  Put the role in these fields, not in the title: no "(selections)", "(alternative …)" or "(already read in …)" in titles.
  `(elective)` stays in the title. The site's weekly reading load counts core texts, one text per choice group, and
  `readPages` (or a third of `pages`) for selections; it skips reference, review and elective texts.
- Prerequisites must start at or before the dependent row's `ageStart`. No cycles. A core unit may not require an
  elective unit: point it at the nearest core unit instead.
- **Core and elective.** The core is what every child is expected to do, and it fits the yearly hour budgets in
  `data/budget.yaml`. An elective unit (`elective: true`, or any unit in an elective track) is taken only by choice:
  the site leaves it out of placement by age, Next assignments and Look Ahead until a child starts it. Inside a core
  unit, a text is elective when its title ends in `(elective)`, and `workload` counts only the core; the elective part
  goes in `electiveHours` and `electiveBasis`. Nothing is removed from the curriculum to shorten it.
- **Ages are when the unit is studied.** A year is four 12-week terms (quarters of an age year). From age 10, daily
  tracks (mathematics, Latin, Greek, Spanish, grammar and composition, literature, music, physical training) run one
  unit at a time; the other tracks are taken in blocks of one or two terms, with no two units of a track at once.
  Weekly practices that run for years (service, debate, the commonplace book, reference grammars) keep long spans.
  Each term's weekday load should stay near its share of the year's budget; the School Hours page shows it term by term.
- **Day** (`day`) says which part of the week a unit uses. Weekday units are the Monday–Friday academics; Saturday
  units are outdoor skills, riding and shooting, sailing, handcrafts and home arts; Sunday units are Scripture, the
  lives of the saints and spiritual reading.
- Quote any string containing `:` `#` `'` or starting with a special char. Use `>-` for paragraphs.
- **Links**: public-domain works → free editions (Project Gutenberg, Archive.org, HathiTrust, Perseus, The Latin Library, Sefaria, CCEL, New Advent, Wikisource, Founders Online, Avalon Project). Copyrighted works → the publisher's (or a major bookseller's) purchase page. Only include URLs you have confirmed exist.
- `tradition` badges: `catholic` (TAN, Ignatius, Catholic Heritage Curricula, Seton, Our Lady of Victory…), `protestant` (Veritas, Classical Conversations, Canon Press…), `classical` (Memoria Press, Hillsdale, CAP…), `secular`.
- College (17+) rows use `level: college`, ages 17–18, and live in the track they belong to.

## Hour budgets (`data/budget.yaml`)

```yaml
gradeAgeOffset: 5            # grade g runs from age g+5 to g+6; kindergarten is grade 0
weekday:                     # Monday–Friday academics: regular school hours × a multiplier, by grade band
  - { grades: "1-6", regularHours: 1000, multiplier: 2, source: pew }
saturday: { hoursPerDay: 8, weeks: 48 }
sunday:
  weeks: 52
  bands: [{ ageStart: 9, ageEnd: 12.75, hoursPerWeek: 1 }, { ageStart: 12.75, ageEnd: 18, hoursPerWeek: 2 }]
notes: Where the regular hours come from.
sources:
  - { id: pew, title: "…", publisher: Pew Research Center, date: "2023", url: "https://…" }
```

The build turns this into a budget per grade (`budget.years` in `curriculum.json`). The School Hours page compares
each grade's core units, spread evenly over their ages, with the weekday, Saturday and Sunday budgets.

## Unit examinations (`data/assessment.yaml`)

Each unit's `objectives` are its mastery checklist. The examination that confirms them is chosen by track:

```yaml
modes:
  - id: translation
    label: Translation at sight and recitation
    tracks: [latin, greek, hebrew, spanish, chinese, old-english]   # each track in at most one mode
    how: What the student does in the examination.
    precedent: The historical model (optional).
    sources: [{ label: "…", url: "https://…" }]
  - id: oral
    default: true                                                   # every other track
```

## The teacher's plan (`data/teacher.yaml`)

The teacher's plan is not a second curriculum: the site builds it from the units and each child's progress. The file
sets, for each kind of unit, how far ahead the teacher works and how long preparation takes.

```yaml
categories:
  - id: language                     # matched by track (and optionally by day)
    label: Languages
    tracks: [latin, greek, hebrew, spanish, chinese, old-english]
    leadMonths: 12                   # the teacher's schedule is the student's, this many months earlier
    rule: The teacher studies each language unit a year before the student.
    teacherHoursPerStudentHour: 0.75
  - id: skill
    tracks: [fine-arts, physical-training, practical-arts, music, music-lessons, sports, drama]
    days: [saturday]
    leadMonths: 6
    teacherHoursPerStudentHour: 0.3
  - id: reading                      # everything else
    default: true
    leadMonths: 2
    minLeadMonths: 1
    readingFactor: 0.6               # teacher reading time per hour of student reading
    workFactor: 0.15                 # lesson preparation per hour of student work
```

## Exams

`data/exams.yaml` is the catalog of exams the program prepares for by 18 (AP, CLT, SAT/ACT, PSAT/NMSQT, national
exams, olympiads). Rows point at it with `exams: [id, ...]`; the build rejects unknown ids.

```yaml
exams:
  - id: ap-chemistry            # stable id used by rows
    name: AP Chemistry
    body: College Board
    category: ap-stem           # ap-stem | ap-humanities | ap-language | clt | admissions | national-exam | olympiad
    typicalAge: 15              # age a student on this program's pace normally sits it
    optional: false             # true = enrichment, not expected of every student
    month: May                  # when it is given
    url: "https://..."          # official exam page
    ced: "https://..."          # official course & exam description / framework (PDF or page)
    format: >-                  # sections, length, question types, scoring
    registration: >-            # how a homeschooled student registers (deadlines, finding a test site, fees)
    resources:                  # prep materials: official practice, review books, free courses
      - { label: "...", url: "https://..." }
    notes: >-
```

## Founding-era reading lists

`data/founding/<id>.yaml` — historical curricula and recommended reading lists.

```yaml
id: harvard-1760s
title: "Harvard College: Admission and Course of Study (c. 1640–1790)"
category: colonial-college   # british-university | colonial-college | founder-letter | 19th-century-school | treatise
people: [Henry Dunster]      # optional
date: "1642–1790"
summary: >-
  What was required, what it tells us, how this program adopts it.
primarySources:
  - { label: "New England's First Fruits (1643)", url: "https://..." }
entries:                     # the actual reading list / requirements
  - text: "Read Tully (Cicero) ex tempore"
    use: [reference, student]  # reference = historical requirement that shaped the curriculum;
                               # teacher = reading for parents/teachers; student = assigned to the child
    units: [latin-11]          # the exact curriculum rows that teach or apply this item
    search: Cicero             # fallback term for a keyword search of the curriculum table
    tracks: [latin, rhetoric]
notes: Optional.
```
