// Local preview: static files + /api routes, storage in ./.local (no Vercel Blob needed).
// Usage: ADMIN_USER=x ADMIN_PASSWORD_HASH=... SESSION_SECRET=... node dev/server.mjs
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (u.pathname.startsWith('/api/')) {
    req.query = Object.fromEntries(u.searchParams);
    try {
      const mod = await import(path.join(root, 'api', `${u.pathname.slice(5)}.js`));
      return await mod.default(req, res);
    } catch (e) {
      console.error(e);
      res.statusCode = 404;
      return res.end('not found');
    }
  }
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  for (const cand of [file, `${file}.html`, path.join(file, 'index.html')]) {
    try {
      const st = await fs.stat(cand);
      if (!st.isFile()) continue;
      res.setHeader('Content-Type', types[path.extname(cand)] || 'application/octet-stream');
      return res.end(await fs.readFile(cand));
    } catch {}
  }
  res.statusCode = 404;
  res.end('not found');
}).listen(port, () => console.log(`http://localhost:${port}`));
