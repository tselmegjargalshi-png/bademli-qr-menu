import { currentUser } from './_lib/auth.js';
import { send } from './_lib/http.js';

export default function handler(req, res) {
  const user = currentUser(req);
  send(res, user ? 200 : 401, user ? { user } : { error: 'auth' }, { 'Cache-Control': 'no-store' });
}
