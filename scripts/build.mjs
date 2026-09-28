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
const outDir = path.join(root, 'docs', 'data');

export const LEVELS = [
  { id: 'early-5', label: 'Early Dev – 5', min: 0, max: 10 },
  { id: '6-8', label: 'Grades 6–8', min: 9.5, max: 12.5 },
  { id: '9-12', label: 'Grades 9–12', min: 12, max: 16.5 },
  { id: 'college', label: 'College (17+)', min: 16, max: 99 },
];

export const GROUPS = [
  { name: 'Early Formation', tracks: ['early-development'] },
  { name: 'English', tracks: ['reading-phonics', 'grammar-composition', 'literature', 'poetry'] },
  { name: 'Languages', tracks: ['latin', 'greek', 'hebrew', 'spanish', 'chinese', 'old-english'] },
  { name: 'Trivium', tracks: ['logic', 'rhetoric'] },
  { name: 'History', tracks: ['history'] },
  { name: 'Faith & Philosophy', tracks: ['theology', 'philosophy'] },
  { name: 'Math & Science', tracks: ['mathematics', 'natural-science'] },
  { name: 'Founder Skills', tracks: ['civics-law', 'economics', 'social-science', 'practical-arts'] },
  { name: 'Arts & Body', tracks: ['music', 'fine-arts', 'character-virtue', 'physical-training'] },
];

const TRACK_ORDER = GROUPS.flatMap((g) => g.tracks);
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.tracks.map((t) => [t, g.name])));
const TYPES = ['course', 'unit', 'practice'];
const STAGES = ['early-development', 'formal'];
const TRADITIONS = ['catholic', 'protestant', 'secular', 'classical'];
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

  for (const [i, r] of doc.rows.entries()) {
    const where = `row ${r?.id ?? i}`;
    for (const k of REQUIRED) if (r[k] === undefined || r[k] === null || r[k] === '') err(rel, `${where}: missing ${k}`);
    if (r.id && !r.id.startsWith(`${trackId}-`)) err(rel, `${where}: id must start with "${trackId}-"`);
    if (r.type && !TYPES.includes(r.type)) err(rel, `${where}: bad type ${r.type}`);
    if (r.stage && !STAGES.includes(r.stage)) err(rel, `${where}: bad stage ${r.stage}`);
    const lvl = LEVELS.find((l) => l.id === r.level);
    if (!lvl) err(rel, `${where}: bad level ${r.level}`);
    if (typeof r.ageStart !== 'number' || typeof r.ageEnd !== 'number') err(rel, `${where}: ages must be numbers`);
    else {
      if (r.ageEnd < r.ageStart) err(rel, `${where}: ageEnd < ageStart`);
      if (lvl && (r.ageStart < lvl.min || r.ageStart > lvl.max))
        err(rel, `${where}: ageStart ${r.ageStart} outside level ${r.level} (${lvl.min}–${lvl.max})`);
    }
    for (const t of r.coreTexts || []) {
      if (!t.title) err(rel, `${where}: coreText missing title`);
      checkLinks(rel, `${where} "${t.title}"`, t.links);
    }
    for (const c of r.curriculumOptions || []) {
      if (!c.name) err(rel, `${where}: curriculumOption missing name`);
      if (c.tradition && !TRADITIONS.includes(c.tradition)) err(rel, `${where}: bad tradition ${c.tradition}`);
      if (c.url) checkLinks(rel, `${where} option "${c.name}"`, [c]);
    }
    checkLinks(rel, `${where} sources`, r.sources);
  }
  return doc;
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
  }
  return doc;
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
  tracks.push({ id: doc.track, title: doc.title, group: doc.trackGroup, description: doc.description || '' });
  for (const r of doc.rows) rows.push({ ...r, track: doc.track, trackGroup: doc.trackGroup, _file: path.relative(root, f) });
}
validateGraph(rows);
const founding = foundingFiles.map((f) => validateFounding(f, load(f))).filter(Boolean);

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`${tracks.length} tracks, ${rows.length} rows, ${founding.length} founding lists — ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exit(1);

if (!checkOnly) {
  tracks.sort((a, b) => TRACK_ORDER.indexOf(a.id) - TRACK_ORDER.indexOf(b.id));
  const out = rows.map(({ _file, ...r }) => ({ prerequisites: [], related: [], ...r }));
  const curriculum = JSON.stringify({ generated: new Date().toISOString(), levels: LEVELS, groups: GROUPS, tracks, rows: out });
  const foundingJson = JSON.stringify({ lists: founding });
  fs.mkdirSync(outDir, { recursive: true });
  // .json for reuse elsewhere; .js so the pages also work opened straight from disk (file://)
  fs.writeFileSync(path.join(outDir, 'curriculum.json'), curriculum);
  fs.writeFileSync(path.join(outDir, 'founding.json'), foundingJson);
  fs.writeFileSync(path.join(outDir, 'curriculum.js'), `window.CURRICULUM = ${curriculum};\n`);
  fs.writeFileSync(path.join(outDir, 'founding.js'), `window.FOUNDING = ${foundingJson};\n`);
  console.log(`wrote ${path.relative(root, outDir)}/curriculum.{json,js} and founding.{json,js}`);
}
