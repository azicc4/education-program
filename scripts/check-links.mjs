// Checks every URL in the built data and reports the ones that fail.
//   node scripts/check-links.mjs            (run `npm run build` first)
//   node scripts/check-links.mjs --json out.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'docs/data/curriculum.json'), 'utf8'));
const founding = JSON.parse(fs.readFileSync(path.join(root, 'docs/data/founding.json'), 'utf8'));

// url -> list of places it is used
const uses = new Map();
const add = (url, where) => url && (uses.get(url) || uses.set(url, []).get(url)).push(where);
for (const r of curriculum.rows) {
  for (const t of r.coreTexts || []) for (const l of t.links || []) add(l.url, `${r.id} text "${t.title}"`);
  for (const c of r.curriculumOptions || []) add(c.url, `${r.id} option "${c.name}"`);
  for (const s of r.sources || []) add(s.url, `${r.id} source`);
}
for (const l of founding.lists) {
  for (const s of l.primarySources || []) add(s.url, `founding/${l.id}`);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { ok: true, status: res.status };
      // many sites reject HEAD or bots; only trust a GET failure
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (e) {
      if (method === 'GET') return { ok: false, status: e.name === 'TimeoutError' ? 'timeout' : e.cause?.code || e.message };
    }
  }
}

const urls = [...uses.keys()];
const results = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    results.push({ url, ...(await check(url)), uses: uses.get(url) });
  }
}
console.log(`Checking ${urls.length} unique URLs…`);
await Promise.all(Array.from({ length: 12 }, worker));

// 401/403/429 usually mean bot protection, not a dead link
const blocked = (s) => [401, 403, 405, 429, 999].includes(s);
const bad = results.filter((r) => !r.ok && !blocked(r.status));
const unsure = results.filter((r) => !r.ok && blocked(r.status));
for (const r of bad) console.log(`DEAD   ${r.status}  ${r.url}\n         used by: ${r.uses.join('; ')}`);
for (const r of unsure) console.log(`BLOCKED ${r.status} ${r.url}`);
console.log(`\n${results.length - bad.length - unsure.length} ok, ${bad.length} dead, ${unsure.length} blocked (verify by hand)`);

const jsonIdx = process.argv.indexOf('--json');
if (jsonIdx > -1) fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify({ bad, unsure }, null, 2));
process.exitCode = bad.length ? 1 : 0;
