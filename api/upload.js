import { currentUser } from './_lib/auth.js';
import { send, readJson, sameOrigin } from './_lib/http.js';
import { saveImage } from './_lib/store.js';

const TYPES = new Set(['image/webp', 'image/jpeg', 'image/png']);

// Body: { name, type, data: <base64> }. The admin panel resizes images before sending.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  if (!sameOrigin(req)) return send(res, 403, { error: 'origin' });
  if (!currentUser(req)) return send(res, 401, { error: 'auth' });
  let body;
  try {
    body = await readJson(req, 4_200_000);
  } catch (e) {
    return send(res, e.status || 400, { error: e.status === 413 ? 'Görsel çok büyük' : 'bad_request' });
  }
  if (!TYPES.has(body.type) || typeof body.data !== 'string') return send(res, 400, { error: 'Desteklenmeyen görsel türü' });
  const buf = Buffer.from(body.data, 'base64');
  if (!buf.length || buf.length > 3_000_000) return send(res, 413, { error: 'Görsel çok büyük' });
  const name = String(body.name || 'urun').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || 'urun';
  try {
    const url = await saveImage(name, buf, body.type);
    send(res, 200, { url });
  } catch (e) {
    console.error(e);
    send(res, 502, { error: 'Görsel yüklenemedi' });
  }
}
