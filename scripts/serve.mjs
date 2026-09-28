// Minimal static file server for previewing docs/ locally: node scripts/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const port = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(docs, url.endsWith('/') ? `${url}index.html` : url);
    if (!file.startsWith(docs)) return res.writeHead(403).end();
    fs.readFile(file, (e, body) => {
      if (e) return res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      res.writeHead(200, { 'content-type': `${TYPES[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'cache-control': 'no-store' });
      res.end(body);
    });
  })
  .listen(port, () => console.log(`Serving docs/ at http://localhost:${port}`));
