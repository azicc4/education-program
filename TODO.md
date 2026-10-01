# Running To-Do List

Where to work next. Add items as gaps appear, and check them off as they are resolved. The detailed research log
from each agent pass is under **Research gaps log** below.

## Status (2026-09-28)
35 tracks, about 460 units, 34 exams and 23 founding-era lists. Site views: Curriculum table, Skill Tree (with
Snapshot Bookshelf), Radial Tree, Founding-Era Reading, Exams planner and Family (progress, next assignments,
Bookshelf of Knowledge, Look Ahead, demo family). Every text is marked by who reads it (teacher / together / student)
and has a page count where one is known.

## Pending input from Adam
- [ ] **John Jay Institute curriculum.** Adam will attach it. Fold it into the college rows (philosophy-15/16,
  civics-law-19/20, history-31, theology) and add a `data/founding/john-jay-institute.yaml` reference entry.
- [x] **GitHub Pages:** live at https://azicc4.github.io/education-program/, deployed by `.github/workflows/pages.yml` on every push to `main`.

## Open decisions for Adam
- [x] **Workload fitted to yearly hour budgets** (`data/budget.yaml`, School Hours page). Weekday academics: regular
  school hours × 2 through grade 6, × 2.5 for grades 7–10, × 1.5 for grades 11–12; Saturdays 8 h of activities; Sundays
  1 h (age 9–12¾) or 2 h (12¾–18) of Scripture and spiritual reading. 104 units are now elective (Hebrew, Chinese, Old
  English and the AP tracks whole; competitions, second AP sciences, college seminars that repeat earlier work, and
  duplicated readings), 98 core units were shortened with the cut reading kept as elective, and 22 units were re-timed.
  The science sequence is now one lab science a year (biology 12, chemistry 13, physics 14, AP Physics C 16).
- [ ] Check the choices made in the shortening: Spanish as the core modern language (Chinese elective) and wrestling as
  the core combat sport (fencing elective) are defaults a family may swap.
- [ ] Add a non-Western world-history unit to the main history track? For now AP World is covered only in the side track.
- [ ] Bioethics companion (biology-03): keep it at 13.5, or move it to 15–16? It touches end-of-life questions and gender ideology.

## Next up
- [ ] **Lesson counts still to confirm** (231 books and programs have one; these use a "Lesson #" box until filled):
  Henle Latin Years 1–4 and their Seton/Kolbe plans, Latin Primer 1–3 (Canon), MODG Beginning Latin I–III, Latin Alive!,
  Challenge II–IV, Lingua Angelica, Scanlon's Second Latin and Missal grammar, Hey Andrew! Greek, Basics of Biblical
  Hebrew and Weingreen; Dimensions Math, RightStart, Beast Academy, Math Mammoth, Stewart and Larson calculus, the Kolbe
  and Khan Academy online courses, Miller & Levine, Princeton Review AP prep books; Madrigal's Magic Key, ¡Avancemos! 2,
  Seton Spanish, Better Chinese; Language of God, Well-Ordered Language, Shurley, Voyages, Lost Tools of Writing,
  They Say / I Say, Art of Argument, Writing Road to Reading, First Start Reading, All About Reading 2 and 4; Berry,
  Linklater, Rodenburg, Skinner, Knight, Blumenfeld, The Ode Less Travelled, Rhyme's Reason, Laux. The agents' lists
  with unit ids are in the PR description.
- [ ] Two workload notes disagree with the confirmed counts: logic-03 says Traditional Logic I has 17 chapters (the 3rd
  edition has 14), and spanish-03 assumes 32 weeks for Spanish for Children Primer A (37 chapters).
- [x] **Workload checked against precedent** (founding-era schools and colleges, AP college equivalents): grades 7–10
  already exceed the Latin grammar schools (Boston Latin about 31–37 h a week), so they are not raised; grades 11–12 rise
  from ×1.5 to ×2 to match the college years; Xenophon, Livy and Sallust, Latin Composition II, Attic tragedy, College
  Latin I and College Greek are core again and the four Gospels are read in Greek (core Latin and Greek by 18: about
  2,800 h, was about 1,880); AP Calculus BC rises to 300 h and AP Statistics to 135 h.
- [ ] AP Chemistry and AP Biology (electives) are at about 0.5–0.8 of their college hours; raise them if a family
  takes them for credit. AP World's core units reach college hours only for a one-semester credit.
- [x] **Units sequenced by term** (ages 10–18): daily subjects one unit at a time, the rest in one- or two-term
  blocks, one unit per track at a time; each term has about 8–11 main subjects (was 44–53 units open at once), and every
  grade from 6 to 12 sits at 92–102% of its weekday budget with no gap (the old dip to 19 h a week at 16½ is gone).
  Sciences run one a year: biology 12½, chemistry 13½, physics 14½, AP Physics C 16½.
- [ ] Check the new term order where it matters in practice: AP courses should end by May of the exam year (ages are
  by birthday, not the calendar); a lab practice unit sometimes follows its course by a term rather than running with it
  (chemistry-02 after chemistry-01); some Latin and mathematics units now come later than before (Virgil at 14¾–15½,
  AP Calculus BC at 15–16, proof writing at 16–17) because their units no longer overlap.
- [x] Each child's weekly load in Family Progress (Weekly load tab, and a line on Next assignments).
- [ ] Show the weekly load in the trees too (e.g. beside the child selector with Current Age on).
- [ ] Saturdays use 45–83% of their 8 hours in grades 5–12 (lightest at 15–17); room for more outdoor or craft units.
- [ ] Check the page counts and portions the shortening assigned from memory rather than a specific edition: the Stones
  of Venice selection in fine-arts-11 (and its objective on "The Nature of Gothic", which is in Vol. II), and the Berry
  and Tucker portions in drama-05, which name content rather than chapter numbers; the Andria act boundaries (latin-14),
  the De Officiis sections (latin-11), the Franklin letters to Collinson (natural-science-10) and the Maxwell Part IV
  chapters (natural-science-19). Also: greek-03's notes say Machen has 45 lessons, its `lessons` field says 33.
- [ ] A few shortened units keep whole novels an objective asks for, so their cut fell on seminars: literature-23 (12
  seminars, 8 h left for its research essay), literature-25 and literature-30. Consider making Hardy or 1984 elective
  instead and rewording the objective.
- [ ] social-science-02 (Introduction to Psychology) now has 59 core hours, thin for a full AP/CLEP course; 70–80 h
  would suit its "master the content" objective if grade 9 can take it (weekday load there is at 99%).
- [x] Link check rerun (2,395 URLs: 2,294 OK, 34 flagged, 67 bot-blocked). Fixed: the AASM sleep paper (now on PMC), the Tracker tool (new site), and the dead Cambiata link (removed). The other flags were transient or bot walls (Green Lion, Cengage, IMSLP, ABRSM, Archive.org timeouts, vatican.va), all rechecked OK.
- [x] Cross-track links wired: 73 pairs total; 372 of 462 units link to related units.
- [x] Thin curriculum options filled on 36 rows: Catholic Latin (MODG, Kolbe, OLVS, Seton Henle, CLAA, Homeschool Connections, TAN Scanlon), Catholic math and civics, product-level Veritas and CC links, the Adoremus hymnal and Liturgy of the Hours for poetry-06, and the Catholic Literary Arts youth contest for poetry-13. All Seton links load.
- [ ] Still thin: no Catholic option for civics-law-13 (common law) or economics-04 to -06; no MODG elementary math page; the Homeschool Connections and Alleluia contest URLs change yearly, so recheck annually.
- [ ] Verify the soft historical facts: Founders Online letters, and precedent claims that rest on general knowledge.
- [ ] Longer-term: sync family progress across devices; let hand-added Bookshelf books be proposed for the curriculum.

## Done
- [x] Sources page: curricula vs primary, secondary and instructional texts by track. Every text is classified by kind (916 primary, 156 secondary, 215 instructional).
- [x] Research pass for every track; founding-era, 19th-century and British/Irish university lists
- [x] Site: table and detail panel, skill tree, snapshot bookshelf, radial tree, founding page, exams page, family tools
- [x] First link check (1,961 URLs) and fixes
- [x] AP/STEM restructure, AP side tracks, test prep, exam catalog and exam tags
- [x] Reader and page-count pass for every text
- [x] History Cycle 3 consolidated (14 → 10 seminars)
- [x] Founding-era entries marked by use (reference / teacher / student) and linked to units

## Research gaps log

### Founding lists: Catholic & treatises (georgetown-1789, ratio-studiorum-1599, franklin-proposals-1749, locke-thoughts-1693, newman-idea-of-university)
- [ ] Carroll's Georgetown proposals are dated 1787 (land bought 1789). The file is named georgetown-1789 for the founding year, so it is not wrong, but note the discrepancy.
- [ ] No 1790s Georgetown list of set texts found; no St. Omer reading list for Charles Carroll found.
- [ ] Founders Online blocked automated fetches. Hand-verify the Franklin *Proposals* ID and the English School link (01-04-02-0030).
- [ ] No verified free online copies yet: Fitzpatrick 1933 *St. Ignatius and the Ratio Studiorum*; Pachtler's Latin Ratio text; Gutenberg English editions of Locke's *Thoughts* and Newman's *Idea*.
- [ ] Not yet checked whether Jefferson or Adams owned Locke's *Thoughts*.
- [ ] Franklin credits the "Dialogues on Education" to Hutcheson; they are actually Fordyce's (flagged in the file).
- [ ] Newman's matriculation reading list comes from a fictional father's letter (flagged in the file).

### Founding lists: founders' letters (jefferson-reading-lists, adams-to-john-quincy, washington-education, madison-congress-list-1783)
- [ ] Founders Online blocks automated fetching, so its URLs were accepted only where search results showed the exact title. Spot-check them by hand.
- [ ] Washington, not verified: letter to Hamilton (1 Sept 1796), Farewell Address drafts, letters to Bushrod Washington. The library list uses the 1897 Boston Athenaeum catalogue because Mount Vernon's site returned 403. The *Cato* link rests only on the 1778 Valley Forge performance. No primary text for the surveying copybooks.
- [ ] Madison, not verified: the Founders Online URL for the 1783 Report on Books, the Commonplace Book, and details of Witherspoon's teaching or Hebrew study.
- [ ] Adams: go through John Quincy Adams's St. Petersburg diary titles in detail.
- [ ] Jefferson: the Skipwith "fiction teaches virtue" (King Lear) passage was left out because it was unconfirmed. Find a mirror and add it.

### Founding lists: colonial colleges (harvard, yale, william-and-mary, kings-college, princeton)
- [ ] Not verified that Madison stayed on at Princeton to study Hebrew with Witherspoon; sources confirm only the extra year of study.
- [ ] Jefferson's 1779 Bill for Amending the Constitution of the College of William and Mary is described from his Autobiography with no link, because Founders Online blocked access. Add the link by hand.
- [ ] Harvard's 1734 and 1790 laws were not verified and are not yet used.
- [ ] No formal vote found making Hebrew required under Stiles at Yale; the diary shows him teaching it to whole classes.
- [ ] The Flynt 1726 Harvard course and the Revolutionary-era Harvard textbook list are second-hand (Hall 1894; Colonial Society). Find primary copies if possible.
- Note on accuracy: Harvard's 1643 admission rule names only Tully (Cicero); Virgil first appears in 1655. Keep curriculum `historicalPrecedent` text consistent with this.

### Founding lists: 19th-century schooling (boston-latin-school, mcguffey-readers, js-mill-autobiography, eton-and-rugby, noah-webster, lincoln-self-education)
- [ ] Holmes (1935) on HathiTrust: the link was seen in search results but blocked for automated fetching. Check it by hand.
- [ ] No links found yet for Barnard's *American Journal of Education* or the Boston School Committee reports.
- [ ] Boston Latin: Jacobs' Greek Reader is not confirmed. The sources show Graeca Minora in the 1820s and Felton's reader by 1860.
- [ ] Webster: no scan found of the 1783 first-edition speller. The "Federal Catechism" is not in the 1809 edition checked; look for an edition that has it.
- [ ] Lincoln: four books are marked "traditional" because they weren't confirmed in his own accounts: Dilworth's speller, Scott's *Lessons in Elocution*, Grimshaw's history, and Franklin's *Autobiography*. The University of Michigan edition of his Collected Works blocks automated access.
- [ ] No online copy found of Arnold's *Sermons* or of the original 1836-era McGuffey Readers. The 1879 edition is used instead.

### Tracks: theology (23), philosophy (14), logic (8), rhetoric (12)
- [ ] Hand-check purchase links that appeared in search results but couldn't be fetched: Cengage (Hurley), OUP (Corbett), HarperOne (*Mere Christianity*), criticalthinking.com, academic.oup.com, eric.ed.gov.
- [ ] Left out because they couldn't be verified: Seton Home Study (site was down), Founders Online letters, the Loeb *Ad Herennium* purchase link.
- [ ] Several `historicalPrecedent` claims rest on the agent's own knowledge: Watts's *Logick* at Harvard, Yale and Oxford; Locke's *Essay* at Yale and Harvard; the "Tully ex tempore" rule. Cite them from `data/founding/`. Note that Harvard's 1643 rule names only Tully.
- [ ] Copyright check: Karl Adam's *Spirit of Catholicism* (1929 English edition) is marked public domain; the 1923 McHugh/Callan Roman Catechism is marked not. Confirm both.
- [ ] Veritas Press, Classical Conversations and Our Lady of Victory are not linked to product pages; only the OLVS homepage is linked.
- [x] **Decision for Adam:** keep John of the Cross at age 14 (Spiritual Classics) or move him to college? → **Decided:** moved to a new college seminar (theology-24); his poems stay in spanish-09.
- [x] **Decision for Adam:** add a Latin *Ratio Studiorum* text to the theology or Latin track? → **Decided:** no; it stays as a founding-era reference.
- [ ] Cross-track `related` links (Latin Cicero ↔ rhetoric, civics-law ↔ political philosophy, Boethius ↔ old-english) are not yet wired. Handle these in the cross-linking pass.

### Tracks: mathematics (21), natural-science (19)
- [ ] No verified links yet for: a free English Copernicus; the D'Ooge Nicomachus; Pike's and Greenwood's arithmetics (for the historical notes); Duhem's *To Save the Phenomena*; a specific Jaki title (the Real View Books homepage is linked instead).
- [ ] Foerster, Dolciani (out of print) and Campbell Biology are mentioned only in notes; OpenStax Biology stands in for Campbell.
- [x] Catholic math options: added Seton (mathematics-04, -06) and MODG Saxon syllabi (mathematics-09, -11, -13) as options. Math doesn't need to be Catholic. Seton's site did not load for the agent.
- [x] (Adam: nothing to change) Review the tone of the evolution note in natural-science-12 and the young-earth flags on the Apologia and Master Books options.
- [x] **Decision for Adam:** should competition math (mathematics-14) be a standard parallel track, or optional? → **Decided:** standard for every student (noted on mathematics-08/14).
- [x] **Decision for Adam:** add a third, college-level computer science row (e.g. SICP or theory of computation)? → **Decided:** added natural-science-20 (SICP + theory of computation).
- [ ] Cross-link: surveying and making ↔ practical-arts; the Humani Generis unit ↔ theology.

### Tracks: spanish (13), chinese (13), reading-phonics (7), grammar-composition (14)
- [ ] spanish-06: the claim that Jefferson learned Spanish from *Don Quixote* (per John Quincy Adams's diary) is cited without a link. Find a verified source.
- [ ] Links that bot walls blocked and that were confirmed only in search results: AAP, PNAS, Cervantes Virtual, ctext.org, Reading Rockets, LOC, Sagebooks. Check them by hand.
- [x] The "Ma Ma Jiao Zhong Wen" name came from the research brief, not from Adam. It has been removed; Ma Liping's series stays as an option.
- [ ] Some curriculum options link to a series page or level 1 instead of the specific level: HSK Standard Course, CHC Language of God, All About Reading.
- [ ] Hillsdale Literacy Essentials is described only from its subtitle. Confirm how it is built.
- [ ] Early-development overlap: reading-phonics-01 and spanish/chinese-01–02 cover the same ground as early-development rows 04, 05, 08, 15 and 18. Plan: keep both (track rows are domain detail, early-development rows are the overview) and link them with `related` in the cross-link pass.
- [x] Chesterfield and Neruda: keep both, read critically.

### Tracks: latin (18), greek (15), hebrew (10), old-english (5)
- [ ] Bot-protected links, seen only in search results: the Cambridge Latin Course page and both OUP Athenaze pages.
- [ ] No verified link yet for Lambdin's Hebrew grammar, a free Old English text of *The Seafarer*, or a Greek text of Chrysostom. Tolkien titles link to Tolkien Estate pages.
- [ ] No Hillsdale or Barney-specific Latin/Greek sequence was found; only the "Why Learn Latin" lecture is linked.
- [ ] Veritas and Classical Conversations options are unconfirmed and not listed.
- [ ] Catholic-tagged options are thin: only Henle and Collins. Consider adding more.
- [ ] Some copyrighted books link to Christianbook instead of the publisher. Swap in publisher links where possible.
- [x] **Decision for Adam:** classical or ecclesiastical Latin pronunciation? → **Decided:** ecclesiastical first, classical introduced with Virgil (latin-12).
- [x] **Decision for Adam:** start Greek with Attic or Koine? → **Decided:** Koine first, then Attic.
- [x] **Decision for Adam:** how should Chaucer be split between the old-english and literature tracks? → **Decided:** Middle English selections in old-english-05; fuller reading in literature-18.
- [x] **Decision for Adam:** can a composition tutor be arranged? The Latin and Greek composition rows really need one. → **Decided:** yes, tutors available (noted on latin-08/15 and greek-06; Scholé Academy listed).

### Tracks: early-development (20), character-virtue (14), physical-training (12), music (14), fine-arts (11)
- [ ] No verified link yet for USA Wrestling, USA Boxing, YMCA swim, Getty-Dubay italic, the Bargue ACR product page, *Spirit of the Liturgy*, Trapp's *Around the Year*, CPDL, Smarthistory, Pueri Cantores, or a Mandarin early-childhood curriculum.
- [ ] Overlaps to cross-link: early-development-06/16 ↔ theology-01/02/05 (family prayer, liturgical year, CGS); character-virtue-12/14 ↔ philosophy-07/13 (Ethics, Aquinas).
- [x] **Decision for Adam:** start formal lessons at 5 (Quintilian, Memoria Press) or 6 (Charlotte Mason)? → **Decided:** gentle formal lessons at 5, full formal schooling at 6–7.
- [x] **Decision for Adam:** keep firearms safety, marksmanship and hunting at ages 8–15? → **Decided:** safety and marksmanship standard; hunting optional.
- [x] **Decision for Adam:** keep boxing, alongside wrestling? → **Decided:** no boxing; physical-training-10 is now Wrestling and Grappling.
- Dropped: Columbian Squires (the Knights of Columbus no longer charters new circles).

### Tracks: literature (32), poetry (14)
- [ ] Links: 4 Seton pages time out when fetched directly; they were confirmed only in search results.
- [ ] Options to add: no Veritas Omnibus or Center for Lit on specific rows yet, and no Catholic curriculum option for poetry-06 (Psalms & Hymnody).
- [ ] Founders Online letters (Jefferson to Skipwith, Jefferson to Carr) are described in historicalPrecedent but not linked. Link them from the founding lists.
- [ ] Some Gutenberg texts are public domain in the U.S. only: Fitzgerald, Hemingway and Faulkner (1925–29). This is noted in the files.
- [x] **Decision for Adam:** should Great Books I (literature-31) keep Plato, Aristotle and Scripture, or leave them to the philosophy and theology tracks? → **Decided:** keep, with cross-references.
- [x] **Decision for Adam:** mature texts (*Brideshead*, *1984*, *The Sun Also Rises*, *The Sound and the Fury*) are placed at 15.5–16. Is that OK? → **Decided:** yes, with parent-reads-first notes.
- [x] **Decision for Adam:** the poetry-13 verse capstone needs a mentor and a named competition. → **Decided:** mentor available; Scholastic, Dappled Things, Foyle and Poetry Out Loud added.
- [x] **Decision for Adam:** the reading load at 15–16 is heavy (literature-22 to 30). Mark some units "choose 4 of 8"? → **Decided:** core and elective split applied.

### Tracks: civics-law (18), economics (10), practical-arts (18)
- [ ] The Online Library of Liberty now redirects most titles to a 403 page. The Sidney and Montesquieu links resolved but may break.
- [ ] Unverified, so left out: the LOC copy of Elliot's Debates (Archive.org used instead), Seton and CHC product pages, America's Test Kitchen Kids, *Be Expert with Map and Compass*, Ramsey's Foundations in Personal Finance.
- [ ] Catholic options are thin: only TAN's *Declaration Statesmanship* and TAN Academy economics. Kolbe's course pages are placeholder templates, so they were excluded.
- [ ] The Bowditch link goes to the NGA publications page, not directly to a PDF.
- [ ] Reconcile overlaps: penmanship and letters (practical-arts-07 ↔ grammar-composition-01/08, fine-arts-03); Palladio (practical-arts-15 ↔ fine-arts-09); firearms (practical-arts-16 ↔ physical-training-07).
- Notes already in the files: Chesterfield's letters are marked "read selectively"; the Monticello Farm Book row notes that it also records enslaved people.

### Tracks: history (32)
- [ ] The *Famous Men* books are by Haaren & Poland, not Guerber; the file credits them correctly.
- [ ] Seton's history pages are linked through setonbooks.com, because setonhome.org would not load.
- [ ] Veritas is only partly linked: New Testament, Greece & Rome has flashcards only, and Explorers to 1815 has no product page.
- [ ] No verified purchase links yet for Warren Carroll's *History of Christendom*, the Canon Press history titles, or Kolbe's specific history courses (the Kolbe catalog is linked instead).
- [ ] Precedent claims with no citation yet: the Adams family reading Rollin; Jefferson calling Tacitus "the first writer in the world"; Thomas Arnold teaching Thucydides at Rugby; the Churchill, Webster and Lincoln reading notes. Cite them from `data/founding/`.
- [x] **Decision for Adam:** Cycle 3 was heavy → **Decided: merge.** Now 10 seminars: 16+17, 19+20, 23+24 and 26+27 merged; the 20th-century seminar runs 16–17.
- [ ] history-31 (American Heritage) has a placeholder note for the John Jay Institute curriculum.

### Literature/poetry revision pass
- [x] Chaucer split, mature-text notes, core/elective split for literature-19 to 30, Great Books note, and competitions added (Poetry Out Loud, Scholastic, Dappled Things).
- [x] (Catholic Literary Arts Alleluia Contest added for youth) *Dappled Things* has no youth contest: poems submitted are considered for its adult Jane Greer prize. Find a Catholic youth poetry outlet.
- [ ] Poetry Out Loud is for grades 9–12 only (about ages 12–13+ in this program's pacing), so it is noted on poetry-05.

## Family tools (built)
- [x] Family page: multiple children, placement by age and by track, next assignments, Bookshelf of Knowledge (with hand-added books), Look Ahead (3/6/12 months) with an "acquired" checklist, and backup export/import.
- [ ] Progress is saved in the browser (localStorage). If the family wants it synced across devices without export/import, move storage to a hosted backend (e.g. a claude.ai artifact with a shared database, or a small server).
- [ ] Idea: let books added by hand to a Bookshelf be proposed for inclusion in the curriculum.

### Natural law & Christian legal philosophy (philosophy-15/16, civics-law-19/20)
- [ ] All four rows say "to be revised when the John Jay Institute curriculum is attached." The JJI site is now johnjayfellows.com; its five modules are Christian Worldview, Natural Law, Christianity & Politics (Patristic to Reformation), American Founding & Constitution, and Modern Political Theory & Christian Thought.
- [ ] No current JJI syllabus is public, and no JJI course is titled "Christian Legal Philosophy". Adam's attachment will settle this.
- [ ] James Madison Program (Princeton) links were blocked (403); none has been added yet.

### Founding lists: Oxford, Cambridge, Trinity College Dublin (new category, "British & Irish universities")
- [ ] Cambridge: not checked against the 1852 Commission report on HathiTrust. Waterland's 1730 scheme comes from Wordsworth's reprint.
- [ ] Dublin: textbook names are interpreted from Stubbs (Smiglecius, Le Clerc, Eustachius). "Wall's Astronomy" has not been identified.
- [ ] Oxford "Greats" list: it follows the 1852 Commission's description, not an official list.
- [ ] Facts from general knowledge only (Middleton, Dunster, Shepard, Pitt; minutes of Burke's Club): verify.

### Track: social-science (11), "Psychology & Social Science"
- [ ] Hillsdale has no psychology or sociology courses; its Tocqueville course is used instead.
- [ ] Catholic course providers are thin. The Homeschool Connections course page couldn't be reached; the Thomistic Institute (Aquinas 101), Divine Mercy University and the Baars Institute are listed instead.
- [ ] social-science-11 has no course option; run it as a seminar on the primary texts.
- [ ] Hand-check publisher pages that were seen only in search results: Simon & Schuster, Wipf & Stock, Harvard Book Store, Mises, OUP.
- [ ] Confirm the date of the 1255 Paris statute naming *De Anima*, the German original date of the Pieper title, and which AP Psychology framework is current.

### books.txt integration (all 24 titles placed; see the Book List below)
- [ ] *Ossa Latinitatis Sola*: the only courses found are at the Liturgy Institute (London), for adults only. The suggestion is that a parent learns it ahead of the child. No Paideia Institute course was found.
- [ ] No free editions of the O'Sullivan or Chicken Soup books; they link to TAN, Amazon and Simon & Schuster. TAN's actual title is *The Holy Ghost, Our Greatest Friend*.
- Notes: "The Golden Thread" is *The Golden Thread: A History of the Western Tradition* (Encounter Books; Vol. I by James Hankins, Vol. II by Allen C. Guelzo), placed in history-29 and -30. "Franz List" is Friedrich List, placed in economics-08 and tied to Hamilton's *Report on Manufactures*.

## Link check (1,901 OK / 24 flagged / 36 bot-blocked, out of 1,961 URLs)
- [x] Fixed: RightStart Level A (the store moved to rightstartmath.com/shop) and *Mere Christianity* (now a HarperCollins product page).
- [x] Not dead, just bot-protected: Green Lion Press (11 links, confirmed in a browser), Critical Thinking Co., Cengage, ABRSM. Archive.org timeouts recovered on retry.
- [ ] setonhome.org would not connect from here, by curl or by browser (6 literature/Spanish options). Check from a normal US connection; if the site has moved, relink.
- [ ] jcsm.aasm.org (AASM sleep guidelines) returned "Site Currently Unavailable" (503). Recheck later.
- [ ] 36 bot-blocked URLs are listed by `npm run check-links`. Spot-check them in a browser.

### Track: drama (11), "Drama, Voice & Accents"
- [ ] No Catholic or Protestant curriculum options were found, so every option is secular. The Catholic link comes through the historical precedents: Jesuit school drama, Wojtyła's Rhapsodic Theatre.
- [ ] No RSC youth program suits a US family. The Globe programs are in London; BADA Oxford costs about $7,100. No free accent or voice video course has been verified.
- [ ] Paul Meier's textbook links to his site; no publisher page was found. Granville-Barker's *Prefaces* are left out until their copyright status is clear.

### Extracurriculars: sports (9), music-lessons (10)
- [x] Fixed: the season check matched "Fall" inside "Fallacies"; it now applies only to Extracurriculars, with word boundaries. Parallel extracurricular strands now all show as ready.
- [ ] NAfME's All-National Honor Ensembles are suspended, so the rows point to state All-State programs. Whether homeschoolers can enter varies by state.
- [ ] No verified precedent for fencing or riding at Eton or Oxbridge (only rowing is cited). The Winter and Summer rows have no historicalPrecedent.
- [ ] Deep links are missing for USA Shooting juniors and USA Fencing youth events (homepages are used).

### AP humanities side track (ap-humanities-01 to -06)
- Note: **AP Latin was revised for May 2026. Caesar is dropped; Vergil (Books 1, 2, 4, 6, 7, 11, 12) and Pliny's Letters are now required.** latin-12 already covers Books 1, 2, 4 and 6. The extra work is about 160 lines from Books 7, 11 and 12 plus ten Pliny letters, and it is covered in ap-humanities-03.
- Note: **AP Spanish and AP Chinese are revised for May 2027**, adding a course project (recorded presentation and Q&A, with a Personalized Project Reference due April 30).
- [ ] Homeschool access: AP Classroom, the Digital Portfolio and the project checkpoints all need an AP provider or school.
- [ ] Spanish and Chinese could take their AP exams earlier (about 13–14). Consider this once real progress is known.

### AP chemistry (4) & biology (4)
- [ ] USABO: the Open Exam is for grades 9–12 only, so the student must be registered as a 9th-grader by about 13.5. A registered host school is required. The exam month is not listed on the official page.
- [ ] Workload at 13–14 is heavy: Honors Chemistry, AP Biology, Honors Physics and precalculus at once. Review against real progress; AP Biology could slide to 14–15.
- [ ] No classical or Catholic AP Chemistry text exists. Novare Advanced Biology covers the AP Biology syllabus. Khan Academy's AP Chemistry course is still in beta (units 1–7).
- [ ] Bioethics companion (biology-03): the NCBC course also covers end-of-life questions and gender ideology, so parents may prefer it at 15–16.
- [ ] Kolbe's specific course pages load by script and are unverified. The Lavoisier guided edition now links to Simon & Schuster.

### AP history side track (ap-history-01 to -06)
- Note: the APUSH, AP Euro and AP World exams change in May 2027 (three required source-based SAQs, one broad LEQ). The rows use the CEDs effective fall 2026.
- [ ] APUSH content not in the main track: the West and Native policy, immigration, Gilded Age labor, Populism and Progressivism, the New Deal as economics, 1980 to the present. These are covered only in the side track.
- [ ] AP Euro content not in the main track: absolutism, the Commercial and Agricultural Revolutions, the Enlightenment as social history, the Russian Revolution, post-1945 Europe.
- [ ] **AP World is the largest gap:** Islam, Africa, India, the Mongols, pre-Columbian states, colonialism seen from the colonized side, Meiji Japan, China from the Opium Wars to Mao, decolonization. For now this is side-track only. Decide whether the main history track should gain a world-history unit.
- [ ] No free link found for Tokugawa's 1635 edict.

### AP math & physics
- [x] Math gap after proof writing (15.5 to 17) closed: Linear Algebra moved to 15.5–16.5 and Multivariable/Real Analysis to 16.5–17.5.
- [ ] AP Statistics was revised for 2026–27 (5 units, 4 practices). *The Practice of Statistics* 7e still follows the old 9 units.
- [ ] Calc BC and Physics C multiple-choice counts and timing change in May 2027. Check that exams.yaml reflects this.
- [ ] No verified Catholic or classical calculus-based physics option (Novare's physics text is algebra-based and sits in Honors). Kolbe offers AP Calc AB, not BC. No Khan Academy course for Physics C: E&M.
- [ ] F=ma is online from 2026. Homeschoolers need a proctor who isn't a parent or relative.

### Founders' texts not yet in the curriculum (from the founding-list classification)
- Marked as gaps (student texts with no unit): Justinian's *Institutes* (Vinnius); Aristotle's *Sophistical Refutations* and Cicero's *Topics*; Paley's *Principles of Moral and Political Philosophy*; Wollebius, Ames's *Medulla*, More's ethics; Arrian, Quintus Curtius, Diodorus, Justin.
- Mentioned but unassigned: Terence, Plautus, Isocrates, Lysias, Aeschines, Theocritus, Anacreon, Lucan, Persius; Paley's *Evidences*; Butler's *Analogy*; Kames; Burke's *Sublime and Beautiful*; Hutcheson; Grotius's *De Veritate*; Chillingworth; Burns; Byron; Hobbes's Thucydides.
- [x] **Decided: yes (pass in progress).** Add a pass that places these founders' texts into existing units, as electives or core? Recommendation: yes for Terence, Isocrates, Butler's *Analogy*, Paley's *Evidences* and *Principles*, Grotius's *De Veritate*, Arrian and Curtius (Alexander), and Burns. Leave the rest as references.
- Batch B gaps: Madison's list (the natural-law writers Wolff, Cumberland, Cudworth, Hutcheson, Ferguson, Rutherforth; universal history from Raleigh, Voltaire, Bayle, Mosheim; the modern republics of Guicciardini, Sarpi, De Witt; Hakluyt, Purchas, Champlain, Cotton Mather, Colden; and Madison's own *Of Ancient and Modern Confederacies*, the source of Federalist 18–20); Webster's 1828 *American Dictionary*; Butler's *Analogy* and *Sermons*; Robertson's histories; Sully's *Memoirs*; Washington's letters to G. W. P. Custis.
- [ ] Easy wins: add *Of Ancient and Modern Confederacies* to civics-law-11; add Webster's 1828 Dictionary as a reference text in grammar-composition; add Butler's *Analogy* to philosophy or theology.

