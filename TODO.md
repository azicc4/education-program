# Running To-Do List

Where to work next. Add items as gaps appear; check them off as they are resolved.

## Pending input from Adam
- [ ] **John Jay Institute curriculum.** Adam will attach it later. Once it arrives, fold it into the College (17+) rows (civics-law, philosophy, theology, history) and add a `data/founding/john-jay-institute.yaml` reference entry.

## Content
- [ ] Initial research pass for all 25 tracks (parallel agents)
- [ ] Founding-era and 1800s reading lists (`data/founding/`)
- [ ] Review research-agent gap reports (logged below)

## Site
- [x] Table view + detail panel
- [x] Skill-tree view
- [x] Founding-era reading list page
- [ ] Link check pass

## Research gaps (from agents)

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
- [ ] **Decision for Adam:** Cycle 3 is heavy (about 14 seminars at ages 12.5–16.5). Merge some pairs, e.g. history-19 with -20, or -25 with -26?
- [ ] history-31 (American Heritage) has a placeholder note for the John Jay Institute curriculum.

### Literature/poetry revision pass
- [x] Chaucer split, mature-text notes, core/elective split for literature-19 to 30, Great Books note, and competitions added (Poetry Out Loud, Scholastic, Dappled Things).
- [ ] *Dappled Things* has no youth contest: poems submitted are considered for its adult Jane Greer prize. Find a Catholic youth poetry outlet.
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

## In progress (as of the 2026-09-28 push)
- [ ] AP science restructure: math (AP Calc BC, AP Stats), physics (Honors, then Physics C: Mechanics and E&M), chemistry (Honors, then AP Chem), biology (Honors, then AP Bio). Olympiads are standard.
- [ ] AP side tracks: ap-history (APUSH I–II, AP Euro, AP World Modern), ap-humanities (AP Eng Lang/Lit, Latin, Spanish, Chinese, Music Theory), test-prep (CLT10/CLT, CLT Classical Baccalaureate, CLT Civics, SAT/ACT, PSAT/NMSQT, national exams, olympiads, CLEP). Also complete data/exams.yaml.
- [ ] Tag existing main-track rows with `exams:`, using the AP agents' coverage lists.
- [ ] Exams page and exam filter in the table; exam planner on the Family page.
- [ ] Drama, Voice & Accents track; Seasonal Sports and Music Lessons tracks (Extracurriculars).
- [ ] **Reader and length pass for every text:** add `reader: teacher | together | student`, plus `pages` (Open Library lookup) or `words`. The Snapshot Bookshelf and Look Ahead already display these fields.
- [ ] Turn on GitHub Pages (Settings → Pages → Deploy from branch: `main` / `docs`) to publish the site.
