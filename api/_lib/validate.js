// Normalises a menu document coming from the admin panel; throws on anything malformed.
const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1e7) throw bad('Geçersiz fiyat');
  return Math.round(n * 100) / 100;
};
const id = (v) => {
  const s = str(v, 80);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) throw bad(`Geçersiz kimlik: ${s}`);
  return s;
};
const url = (v) => {
  const s = str(v, 600);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (/^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  throw bad('Geçersiz görsel adresi');
};
function bad(message) {
  return Object.assign(new Error(message), { status: 400 });
}

export function validateMenu(m) {
  if (!m || typeof m !== 'object' || !Array.isArray(m.categories) || !Array.isArray(m.items)) throw bad('Menü biçimi hatalı');
  if (m.categories.length > 60 || m.items.length > 800) throw bad('Çok fazla kayıt');
  const s = m.settings || {};
  const settings = {};
  for (const k of ['name', 'tagline', 'city', 'address', 'orderPhone', 'feedbackPhone', 'instagram', 'website', 'currency', 'notice', 'hours'])
    settings[k] = str(s[k], k === 'address' || k === 'notice' ? 400 : 120);
  settings.mapsUrl = /^https:\/\//.test(str(s.mapsUrl, 600)) ? str(s.mapsUrl, 600) : '';
  const categories = m.categories.map((c) => ({ id: id(c.id), name: str(c.name, 80) || 'Kategori', note: str(c.note, 200) }));
  const catIds = new Set(categories.map((c) => c.id));
  if (catIds.size !== categories.length) throw bad('Tekrarlanan kategori');
  const seen = new Set();
  const items = m.items.map((it) => {
    const item = {
      id: id(it.id),
      cat: id(it.cat),
      name: str(it.name, 120),
      desc: str(it.desc, 500),
      price: num(it.price),
      unit1: str(it.unit1, 30),
      price2: num(it.price2),
      unit2: str(it.unit2, 30),
      img: url(it.img),
      badge: str(it.badge, 30),
      featured: Boolean(it.featured),
      available: it.available !== false,
    };
    if (!item.name) throw bad('Ürün adı boş olamaz');
    if (!catIds.has(item.cat)) throw bad(`"${item.name}" için kategori bulunamadı`);
    if (seen.has(item.id)) throw bad(`Tekrarlanan ürün: ${item.name}`);
    seen.add(item.id);
    return item;
  });
  return { version: 1, settings, categories, items };
}
