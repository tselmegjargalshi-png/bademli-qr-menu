// Menu + image storage. Production uses Vercel Blob; without a token (local dev) it uses ./.local/.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MENU_KEY = 'menu.json';
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const LOCAL = path.join(process.cwd(), '.local');

let menuUrl = null; // remembered between warm invocations to skip head()

export async function readMenu({ fresh = false } = {}) {
  if (!useBlob()) {
    try {
      return JSON.parse(await fs.readFile(path.join(LOCAL, MENU_KEY), 'utf8'));
    } catch {
      return null;
    }
  }
  const { head, BlobNotFoundError } = await import('@vercel/blob');
  try {
    if (!menuUrl || fresh) menuUrl = (await head(MENU_KEY)).url;
  } catch (e) {
    if (e instanceof BlobNotFoundError || e?.name === 'BlobNotFoundError') return null;
    throw e;
  }
  const url = fresh ? `${menuUrl}?t=${Date.now()}` : menuUrl;
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`blob read ${r.status}`);
  return r.json();
}

export async function writeMenu(menu) {
  const body = JSON.stringify(menu);
  if (!useBlob()) {
    await fs.mkdir(LOCAL, { recursive: true });
    await fs.writeFile(path.join(LOCAL, MENU_KEY), body);
    return;
  }
  const { put } = await import('@vercel/blob');
  const r = await put(MENU_KEY, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 60,
  });
  menuUrl = r.url;
}

export async function saveImage(name, buffer, contentType) {
  const ext = contentType === 'image/webp' ? 'webp' : contentType === 'image/png' ? 'png' : 'jpg';
  const key = `img/${name}-${Date.now().toString(36)}.${ext}`;
  if (!useBlob()) {
    const file = path.join(LOCAL, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
    return `/.local/${key}`;
  }
  const { put } = await import('@vercel/blob');
  const r = await put(key, buffer, { access: 'public', contentType, addRandomSuffix: true });
  return r.url;
}
