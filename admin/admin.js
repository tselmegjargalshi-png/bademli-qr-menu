(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  const slug = (s) => String(s).replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
  const norm = (s) => String(s || '').replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR[c]).toLowerCase();
  const SETTINGS = [
    ['name', 'İşletme adı'], ['tagline', 'Slogan'], ['city', 'Şehir / ilçe'], ['address', 'Adres', 'full'],
    ['orderPhone', 'Sipariş telefonu'], ['feedbackPhone', 'İstek-öneri (WhatsApp) telefonu'], ['instagram', 'Instagram kullanıcı adı'],
    ['website', 'Web sitesi'], ['mapsUrl', 'Google Haritalar bağlantısı', 'full'], ['notice', 'Menü alt notu', 'full'],
  ];

  let menu = null, dirty = false, editing = null, pendingImg = undefined;

  function toast(msg, bad) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = 'toast'), 2600);
  }
  async function api(path, opts = {}) {
    const r = await fetch(path, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    let data = null; try { data = await r.json(); } catch {}
    if (r.status === 401 && path !== '/api/login') { showLogin(); throw new Error('Oturum süresi doldu, tekrar giriş yapın.'); }
    if (!r.ok) throw new Error((data && data.error) || 'Hata ' + r.status);
    return data;
  }
  function setDirty(v) { dirty = v; $('#dirty').hidden = !v; $('#save').disabled = !v; }
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- auth
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#login-form [name=user]').focus(); }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, btn = f.querySelector('button'); $('#login-err').textContent = ''; btn.disabled = true;
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ user: f.user.value, password: f.password.value }) });
      f.password.value = ''; await boot();
    } catch (err) { $('#login-err').textContent = err.message; }
    btn.disabled = false;
  });
  $('#logout').addEventListener('click', async () => {
    if (dirty && !confirm('Kaydedilmemiş değişiklikler silinecek. Çıkılsın mı?')) return;
    setDirty(false); try { await api('/api/logout', { method: 'POST' }); } catch {} showLogin();
  });

  async function boot() {
    try { await api('/api/me'); } catch { showLogin(); return; }
    let data;
    try { data = await api('/api/menu?fresh=1'); } catch (e) { if (e.message.startsWith('Hata 204') || true) data = null; }
    if (!data || !data.items) data = await (await fetch('/data/menu.json')).json();
    menu = data; $('#login').hidden = true; $('#app').hidden = false;
    renderAll(); setDirty(false);
  }

  // ---------- tabs
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    for (const t of ['items', 'cats', 'settings']) $('#tab-' + t).hidden = t !== b.dataset.tab;
  }));

  function renderAll() { renderFilter(); renderItems(); renderCats(); renderSettings(); }

  // ---------- items
  function renderFilter() {
    const cur = $('#f-cat').value;
    $('#f-cat').innerHTML = '<option value="">Tüm kategoriler</option>' + menu.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    $('#f-cat').value = menu.categories.some((c) => c.id === cur) ? cur : '';
  }
  function renderItems() {
    const q = norm($('#f-q').value), cat = $('#f-cat').value;
    const catName = Object.fromEntries(menu.categories.map((c) => [c.id, c.name]));
    const order = Object.fromEntries(menu.categories.map((c, i) => [c.id, i]));
    const list = menu.items.filter((i) => (!cat || i.cat === cat) && (!q || norm(i.name).includes(q))).sort((a, b) => order[a.cat] - order[b.cat]);
    $('#item-list').innerHTML = list.map((it) => `
      <div class="row${it.available === false ? ' off' : ''}" data-id="${esc(it.id)}">
        <div class="th" style="${it.img ? `background-image:url('${esc(it.img)}')` : ''}">${it.img ? '' : 'Görsel yok'}</div>
        <div class="nm"><b>${esc(it.name)}</b><span>${esc(catName[it.cat] || '?')}${it.featured ? ' · ★ Öne çıkan' : ''}${it.available === false ? ' · Tükendi' : ''}</span></div>
        <div class="pr"><input inputmode="decimal" value="${it.price ?? ''}" aria-label="${esc(it.name)} fiyatı" data-price></div>
        <button class="btn edit">Düzenle</button>
      </div>`).join('') || '<p class="hint">Ürün bulunamadı.</p>';
  }
  $('#f-q').addEventListener('input', renderItems);
  $('#f-cat').addEventListener('change', renderItems);
  $('#item-list').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row || e.target.closest('[data-price]')) return;
    openItem(menu.items.find((i) => i.id === row.dataset.id));
  });
  $('#item-list').addEventListener('change', (e) => {
    if (!e.target.matches('[data-price]')) return;
    const it = menu.items.find((i) => i.id === e.target.closest('.row').dataset.id);
    const v = e.target.value.replace(',', '.').trim();
    if (v !== '' && !(Number(v) >= 0)) { toast('Geçersiz fiyat', true); e.target.value = it.price ?? ''; return; }
    it.price = v === '' ? null : Number(v); setDirty(true); toast('Fiyat güncellendi — Kaydet\'e basmayı unutmayın');
  });
  $('#add-item').addEventListener('click', () => openItem(null));

  // ---------- item dialog
  const dlg = $('#dlg'), form = $('#item-form');
  function setPrev(url) {
    const p = $('#img-prev'); p.style.backgroundImage = url ? `url('${url}')` : ''; p.textContent = url ? '' : 'Görsel yok';
  }
  function openItem(it) {
    editing = it; pendingImg = undefined;
    $('#dlg-title').textContent = it ? 'Ürünü Düzenle' : 'Yeni Ürün';
    form.cat.innerHTML = menu.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const d = it || { cat: $('#f-cat').value || menu.categories[0]?.id, available: true };
    for (const k of ['name', 'desc', 'price', 'price2', 'unit1', 'unit2', 'badge']) form[k].value = d[k] ?? '';
    form.cat.value = d.cat; form.featured.checked = !!d.featured; form.available.checked = d.available !== false;
    $('#alt-price').open = d.price2 != null; $('#item-del').hidden = !it;
    setPrev(d.img || ''); $('#img-hint').textContent = 'Görsel otomatik küçültülüp yüklenir.';
    dlg.showModal();
  }
  const closeDlg = () => dlg.close();
  $('#dlg-x').addEventListener('click', closeDlg); $('#dlg-cancel').addEventListener('click', closeDlg);

  $('#img-file').addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    $('#img-hint').textContent = 'Yükleniyor…';
    try {
      const blob = await resize(file, 1000);
      const data = await toB64(blob);
      const r = await api('/api/upload', { method: 'POST', body: JSON.stringify({ name: slug(form.name.value || 'urun'), type: blob.type, data }) });
      pendingImg = r.url; setPrev(r.url); $('#img-hint').textContent = 'Görsel yüklendi ✓';
    } catch (err) { $('#img-hint').textContent = err.message; toast(err.message, true); }
  });
  $('#img-del').addEventListener('click', () => { pendingImg = ''; setPrev(''); });
  function resize(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob((b) => b ? res(b) : rej(new Error('Görsel işlenemedi')), 'image/webp', 0.84);
      };
      img.onerror = () => rej(new Error('Görsel okunamadı')); img.src = u;
    });
  }
  const toB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(blob); });

  const numOrNull = (v) => { v = String(v).replace(',', '.').trim(); return v === '' ? null : Number(v); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = numOrNull(form.price.value), p2 = numOrNull(form.price2.value);
    if ((p !== null && !(p >= 0)) || (p2 !== null && !(p2 >= 0))) return toast('Geçersiz fiyat', true);
    const img = pendingImg !== undefined ? pendingImg : editing?.img || '';
    const out = { name: form.name.value.trim(), desc: form.desc.value.trim(), price: p, price2: p2, unit1: form.unit1.value.trim(), unit2: form.unit2.value.trim(),
      cat: form.cat.value, badge: form.badge.value.trim(), featured: form.featured.checked, available: form.available.checked, img };
    if (!out.name) return toast('Ürün adı gerekli', true);
    if (out.featured && !out.img) toast('Not: Öne çıkanlarda yalnızca görselli ürünler görünür');
    if (editing) Object.assign(editing, out);
    else {
      let id = slug(out.name); const ids = new Set(menu.items.map((i) => i.id)); for (let n = 2; ids.has(id); n++) id = slug(out.name) + '-' + n;
      menu.items.push({ id, ...out });
    }
    setDirty(true); closeDlg(); renderItems(); toast('Değişiklik hazır — Kaydet\'e basın');
  });
  $('#item-del').addEventListener('click', () => {
    if (!editing || !confirm(`"${editing.name}" silinsin mi?`)) return;
    menu.items = menu.items.filter((i) => i !== editing); setDirty(true); closeDlg(); renderItems();
  });

  // ---------- categories
  function renderCats() {
    const counts = {}; menu.items.forEach((i) => (counts[i.cat] = (counts[i.cat] || 0) + 1));
    $('#cat-list').innerHTML = menu.categories.map((c, i) => `
      <div class="row cat-row" data-i="${i}">
        <div class="mv"><button data-mv="-1" ${i === 0 ? 'disabled' : ''} aria-label="Yukarı">▲</button><button data-mv="1" ${i === menu.categories.length - 1 ? 'disabled' : ''} aria-label="Aşağı">▼</button></div>
        <div class="nm"><input value="${esc(c.name)}" data-f="name" aria-label="Kategori adı" maxlength="80"><input value="${esc(c.note || '')}" data-f="note" placeholder="Kısa açıklama (isteğe bağlı)" aria-label="Açıklama" maxlength="200" style="margin-top:6px;font-size:14px"></div>
        <span class="hint">${counts[c.id] || 0} ürün</span>
        <button class="btn danger" data-del>Sil</button>
      </div>`).join('');
  }
  $('#cat-list').addEventListener('change', (e) => {
    const f = e.target.dataset.f; if (!f) return;
    const c = menu.categories[+e.target.closest('.row').dataset.i];
    if (f === 'name' && !e.target.value.trim()) { e.target.value = c.name; return; }
    c[f] = e.target.value.trim(); setDirty(true); renderFilter();
  });
  $('#cat-list').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return; const i = +row.dataset.i;
    if (e.target.dataset.mv) {
      const j = i + +e.target.dataset.mv; [menu.categories[i], menu.categories[j]] = [menu.categories[j], menu.categories[i]];
      setDirty(true); renderAll();
    } else if (e.target.matches('[data-del]')) {
      const c = menu.categories[i], n = menu.items.filter((x) => x.cat === c.id).length;
      if (n) return toast(`"${c.name}" içinde ${n} ürün var. Önce ürünleri taşıyın veya silin.`, true);
      if (!confirm(`"${c.name}" kategorisi silinsin mi?`)) return;
      menu.categories.splice(i, 1); setDirty(true); renderAll();
    }
  });
  $('#add-cat').addEventListener('click', () => {
    const name = prompt('Yeni kategori adı:'); if (!name || !name.trim()) return;
    let id = slug(name); const ids = new Set(menu.categories.map((c) => c.id)); for (let n = 2; ids.has(id); n++) id = slug(name) + '-' + n;
    menu.categories.push({ id, name: name.trim(), note: '' }); setDirty(true); renderAll();
  });

  // ---------- settings
  function renderSettings() {
    const s = menu.settings || {};
    $('#settings-form').innerHTML = SETTINGS.map(([k, label, full]) => `<label class="${full || ''}">${label}<input data-k="${k}" value="${esc(s[k] || '')}" maxlength="400"></label>`).join('');
  }
  $('#settings-form').addEventListener('input', (e) => { menu.settings[e.target.dataset.k] = e.target.value; setDirty(true); });

  // ---------- save
  $('#save').addEventListener('click', async () => {
    const b = $('#save'); b.disabled = true; b.textContent = 'Kaydediliyor…';
    try {
      await api('/api/menu', { method: 'PUT', body: JSON.stringify(menu) });
      setDirty(false); toast('Kaydedildi ✓ Menü güncellendi (en geç 1 dk içinde herkese görünür)');
    } catch (e) { b.disabled = false; toast(e.message, true); }
    b.textContent = 'Kaydet';
  });

  boot();
})();
