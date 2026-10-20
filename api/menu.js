import { currentUser } from './_lib/auth.js';
import { send, readJson, sameOrigin } from './_lib/http.js';
import { readMenu, writeMenu } from './_lib/store.js';
import { validateMenu } from './_lib/validate.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const fresh = 'fresh' in (req.query || {}) || /[?&]fresh/.test(req.url || '');
    if (fresh && !currentUser(req)) return send(res, 401, { error: 'auth' });
    try {
      const menu = await readMenu({ fresh });
      // 204 = nothing saved yet; clients fall back to the bundled /data/menu.json
      if (!menu) return send(res, 204, undefined, { 'Cache-Control': 'public, s-maxage=30' });
      return send(res, 200, menu, {
        'Cache-Control': fresh ? 'no-store' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=600',
      });
    } catch (e) {
      console.error(e);
      return send(res, 502, { error: 'store' }, { 'Cache-Control': 'no-store' });
    }
  }

  if (req.method === 'PUT') {
    if (!sameOrigin(req)) return send(res, 403, { error: 'origin' });
    if (!currentUser(req)) return send(res, 401, { error: 'auth' });
    let menu;
    try {
      menu = validateMenu(await readJson(req, 1_000_000));
    } catch (e) {
      return send(res, e.status || 400, { error: e.message || 'invalid' });
    }
    menu.updatedAt = new Date().toISOString();
    try {
      await writeMenu(menu);
    } catch (e) {
      console.error(e);
      return send(res, 502, { error: 'Kaydedilemedi, depolama hatası.' });
    }
    return send(res, 200, { ok: true, updatedAt: menu.updatedAt }, { 'Cache-Control': 'no-store' });
  }

  send(res, 405, { error: 'method' });
}
