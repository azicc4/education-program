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
rows:
  - id: latin-01             # <track-id>-NN, two digits, NN increases with order
    title: "Latin I: Song School & First Forms"
    type: course             # course | unit | practice   (practice = early-development best practice)
    level: early-5
    stage: formal            # early-development (ages 0–6/7) | formal
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
        links:
          - { label: Archive.org, url: "https://archive.org/details/..." }
    curriculumOptions:       # 2–3 real, purchasable/available programs where they exist
      - name: Latina Christiana I
        publisher: Memoria Press
        tradition: classical  # catholic | protestant | secular | classical
        url: "https://www.memoriapress.com/..."
        notes: Short note on fit / tradeoffs.
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
- Prerequisites must start at or before the dependent row's `ageStart`. No cycles.
- Quote any string containing `:` `#` `'` or starting with a special char. Use `>-` for paragraphs.
- **Links**: public-domain works → free editions (Project Gutenberg, Archive.org, HathiTrust, Perseus, The Latin Library, Sefaria, CCEL, New Advent, Wikisource, Founders Online, Avalon Project). Copyrighted works → the publisher's (or a major bookseller's) purchase page. Only include URLs you have confirmed exist.
- `tradition` badges: `catholic` (TAN, Ignatius, Catholic Heritage Curricula, Seton, Our Lady of Victory…), `protestant` (Veritas, Classical Conversations, Canon Press…), `classical` (Memoria Press, Hillsdale, CAP…), `secular`.
- College (17+) rows use `level: college`, ages 17–18, and live in the track they belong to.

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
