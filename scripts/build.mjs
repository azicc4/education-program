// Validates the YAML curriculum data and writes JSON for the website.
//
//   node scripts/build.mjs                 validate everything, write docs/data/*.json
//   node scripts/build.mjs --check a.yaml  validate only the given files, write nothing
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tracksDir = path.join(root, 'data', 'tracks');
const foundingDir = path.join(root, 'data', 'founding');
const examsFile = path.join(root, 'data', 'exams.yaml');
const budgetFile = path.join(root, 'data', 'budget.yaml');
const outDir = path.join(root, 'docs', 'data');

export const LEVELS = [
  { id: 'early-5', label: 'Early Dev – 5', min: 0, max: 10 },
  { id: '6-8', label: 'Grades 6–8', min: 9.5, max: 12.5 },
  { id: '9-12', label: 'Grades 9–12', min: 12, max: 16.5 },
  { id: 'college', label: 'College (17+)', min: 16, max: 99 },
];

export const GROUPS = [
  { name: 'Early Formation', tracks: ['early-development'] },
  { name: 'English', tracks: ['reading-phonics', 'grammar-composition', 'literature', 'poetry', 'drama'] },
  { name: 'Languages', tracks: ['latin', 'greek', 'hebrew', 'spanish', 'chinese', 'old-english'] },
  { name: 'Trivium', tracks: ['logic', 'rhetoric'] },
  { name: 'History', tracks: ['history'] },
  { name: 'Faith & Philosophy', tracks: ['theology', 'philosophy'] },
  { name: 'Math & Science', tracks: ['mathematics', 'physics', 'chemistry', 'biology', 'natural-science'] },
  { name: 'Founder Skills', tracks: ['civics-law', 'economics', 'social-science', 'practical-arts'] },
  { name: 'Arts & Body', tracks: ['music', 'fine-arts', 'character-virtue', 'physical-training'] },
  { name: 'Extracurriculars', tracks: ['sports', 'music-lessons'] },
  { name: 'AP & Exams', tracks: ['ap-history', 'ap-humanities', 'test-prep'] },
];

const TRACK_ORDER = GROUPS.flatMap((g) => g.tracks);
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.tracks.map((t) => [t, g.name])));
const TYPES = ['course', 'unit', 'practice'];
const STAGES = ['early-development', 'formal'];
const TRADITIONS = ['catholic', 'protestant', 'secular', 'classical'];
const EXAM_CATEGORIES = ['ap-stem', 'ap-humanities', 'ap-language', 'clt', 'admissions', 'national-exam', 'olympiad'];
// how a core text is used within its unit (see data/schema.md)
const TEXT_ROLES = ['core', 'choice', 'selections', 'reference', 'review'];
const TEXT_PACES = ['long'];
// how a textbook or program divides its lessons (see data/schema.md)
const LESSON_LABELS = ['lesson', 'chapter', 'unit', 'week', 'section', 'day'];
function checkLessons(rel, where, o) {
  if (o.lessons === undefined) {
    if (o.lessonLabel !== undefined) warn(rel, `${where}: lessonLabel without lessons`);
    return;
  }
  if (!(Number.isInteger(o.lessons) && o.lessons > 0 && o.lessons <= 400)) err(rel, `${where}: lessons must be a whole number from 1 to 400`);
  if (o.lessonLabel !== undefined && !LESSON_LABELS.includes(o.lessonLabel)) err(rel, `${where}: bad lessonLabel ${o.lessonLabel} (${LESSON_LABELS.join(' | ')})`);
  if (!o.lessonsNote) warn(rel, `${where}: lessons should have a lessonsNote saying where the count comes from`);
}
// kinds of non-reading work in a unit's workload estimate (see data/schema.md)
const WORK_KINDS = ['exercises', 'writing', 'translation', 'memorization', 'recitation', 'discussion', 'lab', 'practice', 'project', 'exam-prep'];
// which part of the week a unit runs in (see data/schema.md); weekday is the default
const DAYS = ['weekday', 'saturday', 'sunday'];
const FOUNDING_USES = ['reference', 'teacher', 'student'];
const FOUNDING_CATEGORIES = ['british-university', 'colonial-college', 'founder-letter', '19th-century-school', 'treatise'];
const REQUIRED = ['id', 'title', 'type', 'level', 'stage', 'ageStart', 'ageEnd', 'order', 'summary'];

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

function load(file) {
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(path.relative(root, file), `YAML parse error: ${e.message.split('\n')[0]}`);
    return null;
  }
}

function checkLinks(file, where, links) {
  for (const l of links || []) {
    if (!l || !l.url) err(file, `${where}: link missing url`);
    else if (!/^https?:\/\//.test(l.url)) err(file, `${where}: bad url ${l.url}`);
  }
}

function validateTrack(file, doc) {
  const rel = path.relative(root, file);
  const trackId = path.basename(file, '.yaml');
  if (!doc || typeof doc !== 'object') return err(rel, 'empty or invalid document'), null;
  if (doc.track !== trackId) err(rel, `track "${doc.track}" must equal file name "${trackId}"`);
  if (!TRACK_ORDER.includes(trackId)) err(rel, `unknown track id "${trackId}"`);
  if (doc.trackGroup !== GROUP_OF[trackId]) err(rel, `trackGroup should be "${GROUP_OF[trackId]}"`);
  if (!doc.title) err(rel, 'missing title');
  if (!Array.isArray(doc.rows) || !doc.rows.length) return err(rel, 'no rows'), null;
  if (doc.elective !== undefined && typeof doc.elective !== 'boolean') err(rel, 'elective must be true or false');
  if (doc.elective && !doc.electiveNote) warn(rel, 'an elective track should have an electiveNote saying why');

  for (const [i, r] of doc.rows.entries()) {
    const where = `row ${r?.id ?? i}`;
    for (const k of REQUIRED) if (r[k] === undefined || r[k] === null || r[k] === '') err(rel, `${where}: missing ${k}`);
    if (r.id && !r.id.startsWith(`${trackId}-`)) err(rel, `${where}: id must start with "${trackId}-"`);
    if (r.type && !TYPES.includes(r.type)) err(rel, `${where}: bad type ${r.type}`);
    if (r.stage && !STAGES.includes(r.stage)) err(rel, `${where}: bad stage ${r.stage}`);
    if (r.elective !== undefined && typeof r.elective !== 'boolean') err(rel, `${where}: elective must be true or false`);
    if (r.elective && !r.electiveNote && !doc.electiveNote) warn(rel, `${where}: an elective unit should have an electiveNote saying why`);
    if (r.electiveNote && !(r.elective || doc.elective)) warn(rel, `${where}: electiveNote without elective: true`);
    if (r.day !== undefined && !DAYS.includes(r.day)) err(rel, `${where}: bad day ${r.day} (${DAYS.join(' | ')})`);
    const lvl = LEVELS.find((l) => l.id === r.level);
    if (!lvl) err(rel, `${where}: bad level ${r.level}`);
    if (typeof r.ageStart !== 'number' || typeof r.ageEnd !== 'number') err(rel, `${where}: ages must be numbers`);
    else {
      if (r.ageEnd < r.ageStart) err(rel, `${where}: ageEnd < ageStart`);
      if (lvl && (r.ageStart < lvl.min || r.ageStart > lvl.max))
        err(rel, `${where}: ageStart ${r.ageStart} outside level ${r.level} (${lvl.min}–${lvl.max})`);
    }
    const groups = {};
    for (const t of r.coreTexts || []) {
      if (!t.title) err(rel, `${where}: coreText missing title`);
      checkLinks(rel, `${where} "${t.title}"`, t.links);
      const tw = `${where} "${t.title}"`;
      if (t.order !== undefined && !(Number.isInteger(t.order) && t.order > 0)) err(rel, `${tw}: order must be a positive integer`);
      if (t.role !== undefined && !TEXT_ROLES.includes(t.role)) err(rel, `${tw}: bad role ${t.role} (${TEXT_ROLES.join(' | ')})`);
      if (t.pace !== undefined && !TEXT_PACES.includes(t.pace)) err(rel, `${tw}: bad pace ${t.pace} (${TEXT_PACES.join(' | ')})`);
      if (t.role === 'choice') {
        if (!t.group) err(rel, `${tw}: role choice needs a group`);
        else groups[t.group] = (groups[t.group] || 0) + 1;
      } else if (t.group !== undefined) err(rel, `${tw}: group is only for role choice`);
      if (t.portion !== undefined && t.role !== 'selections' && t.role !== 'choice') warn(rel, `${tw}: portion is meant for role selections or choice`);
      if (t.readPages !== undefined) {
        if (!(typeof t.readPages === 'number' && t.readPages > 0)) err(rel, `${tw}: readPages must be a positive number`);
        else if (t.pages && t.readPages > t.pages) warn(rel, `${tw}: readPages ${t.readPages} > pages ${t.pages}`);
      }
      if (t.reviewOf !== undefined && t.role !== 'review') warn(rel, `${tw}: reviewOf is meant for role review`);
      checkLessons(rel, tw, t);
    }
    for (const [g, n] of Object.entries(groups)) if (n < 2) warn(rel, `${where}: choice group ${g} has only one text`);
    if (r.workload !== undefined) {
      const w = r.workload;
      const num = (v) => typeof v === 'number' && v >= 0 && Number.isFinite(v);
      if (!w || typeof w !== 'object') err(rel, `${where}: workload must be a mapping`);
      else {
        if (!num(w.readingHours)) err(rel, `${where}: workload.readingHours must be a number of hours (0 or more)`);
        if (w.readingHours > 0 && !w.readingBasis) warn(rel, `${where}: workload.readingBasis should say how the reading hours were reached`);
        if (!Array.isArray(w.work)) err(rel, `${where}: workload.work must be a list (it may be empty)`);
        else
          for (const item of w.work) {
            if (!WORK_KINDS.includes(item?.kind)) err(rel, `${where}: workload.work kind ${item?.kind} (${WORK_KINDS.join(' | ')})`);
            if (!(num(item?.hours) && item.hours > 0)) err(rel, `${where}: workload.work ${item?.kind} needs hours > 0`);
            if (!item?.note) warn(rel, `${where}: workload.work ${item?.kind} should have a note`);
          }
        if (w.electiveHours !== undefined && !(num(w.electiveHours) && w.electiveHours > 0)) err(rel, `${where}: workload.electiveHours must be a number of hours above 0`);
        if (w.electiveHours && !w.electiveBasis) warn(rel, `${where}: workload.electiveHours should have an electiveBasis saying what the elective part is`);
        if (w.electiveBasis && !w.electiveHours) warn(rel, `${where}: workload.electiveBasis without electiveHours`);
      }
    }
    for (const c of r.curriculumOptions || []) {
      if (!c.name) err(rel, `${where}: curriculumOption missing name`);
      if (c.tradition && !TRADITIONS.includes(c.tradition)) err(rel, `${where}: bad tradition ${c.tradition}`);
      if (c.url) checkLinks(rel, `${where} option "${c.name}"`, [c]);
      checkLessons(rel, `${where} option "${c.name}"`, c);
    }
    checkLinks(rel, `${where} sources`, r.sources);
  }
  return doc;
}

function validateExams(doc, rows) {
  const rel = 'data/exams.yaml';
  const list = doc?.exams;
  if (!Array.isArray(list)) return err(rel, 'missing exams list'), [];
  const ids = new Set();
  for (const e of list) {
    for (const k of ['id', 'name', 'body', 'category', 'typicalAge']) if (e[k] === undefined || e[k] === '') err(rel, `${e.id ?? '?'}: missing ${k}`);
    if (ids.has(e.id)) err(rel, `duplicate exam id ${e.id}`);
    ids.add(e.id);
    if (e.category && !EXAM_CATEGORIES.includes(e.category)) err(rel, `${e.id}: bad category ${e.category}`);
    for (const k of ['url', 'ced']) if (e[k]) checkLinks(rel, `${e.id} ${k}`, [{ url: e[k] }]);
    checkLinks(rel, `${e.id} resources`, e.resources);
  }
  for (const r of rows) for (const x of r.exams || []) if (!ids.has(x)) err(r._file, `${r.id}: unknown exam ${x} (add it to data/exams.yaml)`);
  return list;
}

function validateGraph(rows) {
  const byId = new Map();
  for (const r of rows) {
    if (byId.has(r.id)) err(r._file, `duplicate id ${r.id}`);
    byId.set(r.id, r);
  }
  for (const r of rows) {
    for (const p of r.prerequisites || []) {
      const pr = byId.get(p);
      if (!pr) err(r._file, `${r.id}: prerequisite ${p} not found`);
      else if (pr.track !== r.track) err(r._file, `${r.id}: prerequisite ${p} is in another track (use related)`);
      else if (pr.ageStart > r.ageStart) err(r._file, `${r.id}: prerequisite ${p} starts later (${pr.ageStart} > ${r.ageStart})`);
      else if (pr.elective && !r.elective) err(r._file, `${r.id}: core unit needs elective unit ${p} (point it at the nearest core unit instead)`);
    }
    for (const p of r.related || []) if (!byId.has(p)) warn(r._file, `${r.id}: related ${p} not found`);
  }
  // cycle detection
  const state = new Map();
  const visit = (id, stack) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) return err(byId.get(id)._file, `prerequisite cycle: ${[...stack, id].join(' → ')}`);
    state.set(id, 1);
    for (const p of byId.get(id)?.prerequisites || []) if (byId.has(p)) visit(p, [...stack, id]);
    state.set(id, 2);
  };
  for (const id of byId.keys()) visit(id, []);
}

// Yearly hour budgets per grade: weekday academics, Saturday activities, Sunday theology (data/budget.yaml)
function buildBudget(doc) {
  const rel = 'data/budget.yaml';
  if (!doc) return err(rel, 'missing or empty'), null;
  const off = doc.gradeAgeOffset;
  if (typeof off !== 'number') err(rel, 'gradeAgeOffset must be a number');
  const sources = Object.fromEntries((doc.sources || []).map((s) => [s.id, s]));
  checkLinks(rel, 'sources', doc.sources);
  const gradeNo = (g) => (String(g).toUpperCase() === 'K' ? 0 : Number(g));
  const years = [];
  for (const b of doc.weekday || []) {
    const [a, z = a] = String(b.grades).split('-').map(gradeNo);
    if (!Number.isInteger(a) || !Number.isInteger(z) || z < a) { err(rel, `weekday: bad grades ${b.grades}`); continue; }
    if (!(b.regularHours > 0 && b.multiplier > 0)) err(rel, `weekday ${b.grades}: regularHours and multiplier must be above 0`);
    if (b.source && !sources[b.source]) err(rel, `weekday ${b.grades}: unknown source ${b.source}`);
    for (let g = a; g <= z; g++) years.push({ grade: g, label: g ? `Grade ${g}` : 'Kindergarten', ageStart: g + off, ageEnd: g + off + 1, regularHours: b.regularHours, multiplier: b.multiplier, weekday: Math.round(b.regularHours * b.multiplier), source: b.source || '' });
  }
  years.sort((x, y) => x.grade - y.grade);
  years.forEach((y, i) => i && y.grade !== years[i - 1].grade + 1 && err(rel, `weekday: grades must be continuous (gap before ${y.label})`));
  const sat = doc.saturday || {};
  const sun = doc.sunday || {};
  const overlap = (y, a, z) => Math.max(0, Math.min(y.ageEnd, z) - Math.max(y.ageStart, a));
  for (const y of years) {
    y.saturday = Math.round((sat.hoursPerDay || 0) * (sat.weeks || 0));
    y.sunday = Math.round((sun.bands || []).reduce((s, b) => s + b.hoursPerWeek * (sun.weeks || 0) * overlap(y, b.ageStart, b.ageEnd), 0));
  }
  return { gradeAgeOffset: off, saturday: sat, sunday: sun, weekday: doc.weekday, notes: doc.notes || '', sources: doc.sources || [], years };
}

function validateFounding(file, doc) {
  const rel = path.relative(root, file);
  if (!doc) return null;
  for (const k of ['id', 'title', 'category', 'summary']) if (!doc[k]) err(rel, `missing ${k}`);
  if (doc.id && doc.id !== path.basename(file, '.yaml')) err(rel, `id must equal file name`);
  if (doc.category && !FOUNDING_CATEGORIES.includes(doc.category)) err(rel, `bad category ${doc.category}`);
  checkLinks(rel, 'primarySources', doc.primarySources);
  for (const e of doc.entries || []) {
    if (!e.text) err(rel, 'entry missing text');
    for (const t of e.tracks || []) if (!TRACK_ORDER.includes(t)) warn(rel, `entry "${e.text}": unknown track ${t}`);
    for (const u of e.use || []) if (!FOUNDING_USES.includes(u)) err(rel, `entry "${e.text}": bad use ${u}`);
  }
  return doc;
}

// founding entries point at real curriculum units; checked once all rows are loaded
function validateFoundingUnits(lists, rows) {
  const ids = new Set(rows.map((r) => r.id));
  for (const l of lists) for (const e of l.entries || []) for (const u of e.units || []) if (!ids.has(u)) warn(`data/founding/${l.id}.yaml`, `entry "${e.text}": unit ${u} not found`);
}

const yamlFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).map((f) => path.join(dir, f)) : [];

const args = process.argv.slice(2);
const checkOnly = args[0] === '--check';
const trackFiles = checkOnly ? args.slice(1).filter((f) => path.resolve(f).startsWith(tracksDir)).map((f) => path.resolve(f)) : yamlFiles(tracksDir);
const foundingFiles = checkOnly ? args.slice(1).filter((f) => path.resolve(f).startsWith(foundingDir)).map((f) => path.resolve(f)) : yamlFiles(foundingDir);

const tracks = [];
const rows = [];
for (const f of trackFiles) {
  const doc = validateTrack(f, load(f));
  if (!doc) continue;
  tracks.push({ id: doc.track, title: doc.title, group: doc.trackGroup, description: doc.description || '', ...(doc.elective ? { elective: true, electiveNote: doc.electiveNote || '' } : {}) });
  // an elective track makes every unit in it elective, with the track's reason unless the unit gives its own
  for (const r of doc.rows) {
    const el = doc.elective ? { elective: true, electiveNote: r.electiveNote || doc.electiveNote || '' } : {};
    rows.push({ ...r, ...el, track: doc.track, trackGroup: doc.trackGroup, _file: path.relative(root, f) });
  }
}
validateGraph(rows);
const exams = checkOnly ? (fs.existsSync(examsFile) && rows.some((r) => r.exams?.length) ? validateExams(load(examsFile), rows) : []) : validateExams(load(examsFile), rows);
const founding = foundingFiles.map((f) => validateFounding(f, load(f))).filter(Boolean);
const budget = checkOnly ? null : buildBudget(load(budgetFile));
if (!checkOnly) validateFoundingUnits(founding, rows);

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`${tracks.length} tracks, ${rows.length} rows, ${exams.length} exams, ${founding.length} founding lists — ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exit(1);

if (!checkOnly) {
  tracks.sort((a, b) => TRACK_ORDER.indexOf(a.id) - TRACK_ORDER.indexOf(b.id));
  const out = rows.map(({ _file, ...r }) => ({ prerequisites: [], related: [], exams: [], ...r }));
  const curriculum = JSON.stringify({ generated: new Date().toISOString(), levels: LEVELS, groups: GROUPS, tracks, rows: out, exams, budget });
  const foundingJson = JSON.stringify({ lists: founding });
  fs.mkdirSync(outDir, { recursive: true });
  // .json for reuse elsewhere; .js so the pages also work opened straight from disk (file://)
  fs.writeFileSync(path.join(outDir, 'curriculum.json'), curriculum);
  fs.writeFileSync(path.join(outDir, 'founding.json'), foundingJson);
  fs.writeFileSync(path.join(outDir, 'curriculum.js'), `window.CURRICULUM = ${curriculum};\n`);
  fs.writeFileSync(path.join(outDir, 'founding.js'), `window.FOUNDING = ${foundingJson};\n`);
  console.log(`wrote ${path.relative(root, outDir)}/curriculum.{json,js} and founding.{json,js}`);
}
