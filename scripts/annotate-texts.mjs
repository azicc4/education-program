// Bulk annotation of coreTexts with `reader` (teacher | together | student), `kind` (primary | secondary | instructional)
// and length (`pages` / `words`).
//
//   node scripts/annotate-texts.mjs export texts.json            list every coreText as { key: "rowId#i", ... }
//   node scripts/annotate-texts.mjs pages texts.json pages.json   look up page counts on Open Library (cached, resumable)
//   node scripts/annotate-texts.mjs apply mapping.json           write { "rowId#i": { reader, kind, pages, words } } into the YAML
//                                                                (only the fields present in each mapping entry are replaced)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tracksDir = path.join(root, 'data', 'tracks');
const trackFiles = () => fs.readdirSync(tracksDir).filter((f) => f.endsWith('.yaml')).map((f) => path.join(tracksDir, f));
const [cmd, a, b] = process.argv.slice(2);

function exportTexts(out) {
  const list = [];
  for (const f of trackFiles()) {
    const doc = yaml.load(fs.readFileSync(f, 'utf8'));
    for (const r of doc.rows || []) {
      (r.coreTexts || []).forEach((t, i) =>
        list.push({
          key: `${r.id}#${i}`, rowId: r.id, track: doc.track, rowTitle: r.title, type: r.type, ageStart: r.ageStart, ageEnd: r.ageEnd,
          title: t.title, author: t.author || '', date: t.date || '', publicDomain: !!t.publicDomain,
          reader: t.reader || '', kind: t.kind || '', pages: t.pages || null, words: t.words || null,
        }),
      );
    }
  }
  fs.writeFileSync(out, JSON.stringify(list, null, 1));
  console.log(`exported ${list.length} texts to ${out}`);
}

// ---------- Open Library page counts ----------
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const cleanTitle = (t) =>
  t.replace(/\s*\((elective|trans\.[^)]*|[^)]*edition[^)]*|[^)]*ed\.[^)]*|[^)]*vols?\.[^)]*)\)\s*/gi, ' ')
    .replace(/\s*[:;].*$/, '') // drop subtitles
    .trim();
const firstAuthor = (au) => (au || '').split(/,| and | & |\(|;/)[0].replace(/^(st\.|saint|fr\.|rev\.)\s+/i, '').trim();

async function lookup(item) {
  const title = cleanTitle(item.title);
  if (!title || /^(selections?|excerpts?|various|selected)\b/i.test(title)) return null;
  const params = new URLSearchParams({ title, fields: 'title,author_name,number_of_pages_median,edition_count', limit: '5' });
  const au = firstAuthor(item.author);
  if (au && !/various|anonymous|unknown/i.test(au)) params.set('author', au.split(' ').pop());
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
    headers: { 'user-agent': 'education-program page-count lookup (github.com/azicc4/education-program)' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const want = norm(title).split(' ').slice(0, 4).join(' ');
  const hit = (data.docs || []).find((d) => d.number_of_pages_median && norm(d.title).startsWith(want));
  if (!hit) return null;
  const pages = hit.number_of_pages_median;
  return pages >= 8 && pages <= 4000 ? { pages, matched: hit.title, editions: hit.edition_count } : null;
}

async function pages(inFile, outFile) {
  const items = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  const cache = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  const uniq = new Map();
  for (const it of items) {
    const k = `${norm(cleanTitle(it.title))}|${norm(firstAuthor(it.author))}`;
    if (!it.pages && !(k in cache)) uniq.set(k, it);
  }
  console.log(`${uniq.size} titles to look up (${Object.keys(cache).length} cached)`);
  const todo = [...uniq.entries()];
  let i = 0, found = 0;
  const worker = async () => {
    while (i < todo.length) {
      const [k, it] = todo[i++];
      try {
        cache[k] = await lookup(it);
        if (cache[k]) found++;
      } catch (e) {
        console.warn(`  failed: ${it.title} (${e.message})`);
      }
      if (i % 25 === 0) fs.writeFileSync(outFile, JSON.stringify(cache, null, 1));
      await new Promise((r) => setTimeout(r, 250));
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  fs.writeFileSync(outFile, JSON.stringify(cache, null, 1));
  console.log(`found page counts for ${found} of ${todo.length} new lookups; cache written to ${outFile}`);
}

// ---------- write fields back into YAML, preserving formatting ----------
function apply(mappingFile) {
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const byRow = {};
  for (const [key, v] of Object.entries(mapping)) {
    const [rowId, i] = key.split('#');
    (byRow[rowId] ||= {})[+i] = v;
  }
  let changed = 0;
  for (const f of trackFiles()) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    let rowId = null, inTexts = false, idx = -1, dirty = false;
    const out = [];
    const flush = () => {};
    for (let n = 0; n < lines.length; n++) {
      const line = lines[n];
      const idm = /^  - id: (\S+)\s*$/.exec(line);
      if (idm) { rowId = idm[1]; inTexts = false; idx = -1; }
      else if (/^    coreTexts:\s*$/.test(line)) { inTexts = true; idx = -1; }
      else if (inTexts && /^    \S/.test(line)) inTexts = false;
      // drop existing values only for the fields this mapping entry rewrites
      const fm = inTexts && /^        (reader|kind|pages|words):/.exec(line);
      if (fm && byRow[rowId]?.[idx] && fm[1] in byRow[rowId][idx]) continue;
      out.push(line);
      if (inTexts && /^      - title:/.test(line)) {
        idx++;
        const v = byRow[rowId]?.[idx];
        if (v) {
          if (v.reader) out.push(`        reader: ${v.reader}`);
          if (v.kind) out.push(`        kind: ${v.kind}`);
          if (v.pages) out.push(`        pages: ${Math.round(v.pages)}`);
          if (v.words) out.push(`        words: ${Math.round(v.words)}`);
          changed++;
          dirty = true;
        }
      }
    }
    flush();
    if (dirty) fs.writeFileSync(f, out.join('\n'));
  }
  console.log(`annotated ${changed} texts`);
}

if (cmd === 'export') exportTexts(a || 'texts.json');
else if (cmd === 'pages') await pages(a, b);
else if (cmd === 'apply') apply(a);
else console.log('usage: annotate-texts.mjs export <out.json> | pages <texts.json> <pages.json> | apply <mapping.json>');
