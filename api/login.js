import { checkCredentials, sessionCookie } from './_lib/auth.js';
import { send, readJson, sameOrigin } from './_lib/http.js';

// Best-effort throttle per warm instance; scrypt + delay already make guessing slow.
const attempts = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  if (!sameOrigin(req)) return send(res, 403, { error: 'origin' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
  const a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 15 * 60 * 1000) Object.assign(a, { n: 0, t: Date.now() });
  if (a.n >= 8) return send(res, 429, { error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' });

  let body;
  try {
    body = await readJson(req, 10_000);
  } catch {
    return send(res, 400, { error: 'bad_request' });
  }
  if (!checkCredentials(body.user, body.password)) {
    a.n += 1;
    attempts.set(ip, a);
    await new Promise((r) => setTimeout(r, 700));
    return send(res, 401, { error: 'Kullanıcı adı veya şifre hatalı.' });
  }
  attempts.delete(ip);
  send(res, 200, { ok: true, user: process.env.ADMIN_USER }, { 'Set-Cookie': sessionCookie(process.env.ADMIN_USER) });
}
