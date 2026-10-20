(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = new Intl.NumberFormat('tr-TR');
  const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cupIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm13 1h1.5a2.5 2.5 0 0 1 0 5H17v-1.6h1.5a.9.9 0 0 0 0-1.8H17zM7 2h1.6v3H7zm3.4 0H12v3h-1.6zM3 20h16v1.6H3z"/></svg>';

  let menu = null;
  let query = '';

  async function load() {
    let data = null;
    try {
      const r = await fetch('/api/menu', { cache: 'no-cache' });
      if (r.status === 200) data = await r.json();
    } catch {}
    if (!data) {
      try { data = await (await fetch('/data/menu.json')).json(); } catch {}
    }
    if (!data) { $('#menu').innerHTML = '<p class="loading">Menü yüklenemedi. Lütfen sayfayı yenileyin.</p>'; return; }
    menu = data;
    applySettings();
    renderChips();
    render();
  }

  function applySettings() {
    const s = menu.settings || {};
    document.querySelectorAll('[data-s]').forEach((el) => { el.textContent = s[el.dataset.s] || ''; });
    const digits = (v) => String(v || '').replace(/\D/g, '').replace(/^0/, '90');
    if (s.orderPhone) { $('#act-call').href = 'tel:+' + digits(s.orderPhone); $('#f-order').href = 'tel:+' + digits(s.orderPhone); }
    if (s.feedbackPhone) $('#f-wa').href = 'https://wa.me/' + digits(s.feedbackPhone);
    if (s.instagram) $('#act-ig').href = 'https://instagram.com/' + s.instagram.replace(/^@/, '');
    const maps = s.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address || s.name);
    $('#act-map').href = maps; $('#f-addr').href = maps;
    if (s.website) $('#f-web').href = 'https://' + s.website.replace(/^https?:\/\//, '');
    if (s.name) document.title = s.name + ' · Menü';
  }

  const price = (n) => `${fmt.format(n)} ₺`;
  function priceHtml(it) {
    if (it.price == null && it.price2 == null) return '';
    const two = it.price != null && it.price2 != null;
    const a = it.price != null ? `<span>${two && it.unit1 ? `<small>${esc(it.unit1)}</small>` : ''}${price(it.price)}</span>` : '';
    const b = it.price2 != null ? `<span>${it.unit2 ? `<small>${esc(it.unit2)}</small>` : ''}${price(it.price2)}</span>` : '';
    return `<div class="price">${a}${b}</div>`;
  }
  const photo = (it, cls = '') => it.img
    ? `<div class="ph ${cls}"><img src="${esc(it.img)}" alt="${esc(it.name)}" loading="lazy" decoding="async">${it.badge ? `<span class="badge">${esc(it.badge)}</span>` : ''}</div>`
    : `<div class="ph none ${cls}">${cupIcon}</div>`;

  function hl(text) {
    const t = esc(text);
    if (!query) return t;
    const n = norm(text), q = norm(query), i = n.indexOf(q);
    if (i < 0 || n.length !== text.length) return t;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function renderChips() {
    $('#chips').innerHTML = menu.categories.map((c, i) => `<button class="chip" data-id="${esc(c.id)}" aria-current="${i === 0}">${esc(c.name)}</button>`).join('');
  }

  function render() {
    const q = norm(query);
    const match = (it) => !q || norm(it.name + ' ' + it.desc).includes(q);
    let html = '', total = 0;
    for (const c of menu.categories) {
      const items = menu.items.filter((it) => it.cat === c.id && match(it));
      if (!items.length) continue;
      total += items.length;
      html += `<section class="cat" id="cat-${esc(c.id)}" data-cat="${esc(c.id)}"><div class="sec-head"><h2>${esc(c.name)} <small>${items.length}</small></h2>${c.note && !q ? `<p>${esc(c.note)}</p>` : ''}</div><div class="list">` +
        items.map((it) => `<button class="item${it.available === false ? ' off' : ''}" data-id="${esc(it.id)}">${photo(it)}<div class="body"><h3>${hl(it.name)}${it.available === false ? '<span class="soldout">Tükendi</span>' : ''}</h3>${it.desc ? `<p class="desc">${hl(it.desc)}</p>` : ''}${priceHtml(it)}</div></button>`).join('') +
        '</div></section>';
    }
    $('#menu').innerHTML = html;
    $('#empty').hidden = total > 0;
    const feat = menu.items.filter((it) => it.featured && it.img && it.available !== false);
    $('#featured').hidden = !!q || !feat.length;
    $('#f-track').innerHTML = feat.map((it) => `<button class="f-card" data-id="${esc(it.id)}">${photo(it)}<div class="f-info"><h3>${esc(it.name)}</h3>${priceHtml(it)}</div></button>`).join('');
    $('#chips').hidden = !!q;
    const g = (menu.gallery || []).filter((x) => x.img);
    $('#gallery').hidden = !!q || !g.length;
    $('#g-track').innerHTML = g.map((x) => `<figure><img src="${esc(x.img)}" alt="${esc(x.caption || 'Bademli')}" loading="lazy" decoding="async">${x.caption ? `<figcaption>${esc(x.caption)}</figcaption>` : ''}</figure>`).join('');
  }

  // ---- search
  const qEl = $('#q'), clear = $('#q-clear');
  let t;
  qEl.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { query = qEl.value.trim(); clear.hidden = !query; if (menu) render(); }, 120);
  });
  clear.addEventListener('click', () => { qEl.value = ''; query = ''; clear.hidden = true; render(); qEl.focus(); });

  // ---- chips + scrollspy
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const sec = document.getElementById('cat-' + b.dataset.id);
    if (sec) sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  let ticking = false;
  function spy() {
    ticking = false;
    const bar = $('#bar'); bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= 0 && scrollY > 80);
    if (query) return;
    const y = bar.offsetHeight + 24;
    let cur = null;
    document.querySelectorAll('.cat').forEach((s) => { if (s.getBoundingClientRect().top <= y) cur = s.dataset.cat; });
    document.querySelectorAll('.chip').forEach((c) => {
      const on = c.dataset.id === cur; c.setAttribute('aria-current', String(on));
      if (on) { const box = $('#chips'); box.scrollTo({ left: c.offsetLeft - box.clientWidth / 2 + c.clientWidth / 2, behavior: 'auto' }); }
    });
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });

  // ---- detail sheet
  const sheet = $('#sheet');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.item, .f-card'); if (!b || !menu) return;
    const it = menu.items.find((x) => x.id === b.dataset.id); if (!it) return;
    const cat = menu.categories.find((c) => c.id === it.cat);
    const m = $('#s-media');
    m.className = 's-media' + (it.img ? '' : ' none');
    m.innerHTML = it.img ? `<img src="${esc(it.img)}" alt="${esc(it.name)}">` : `<div class="ph none" style="height:100%">${cupIcon}</div>`;
    $('#s-cat').textContent = cat ? cat.name : '';
    $('#s-name').textContent = it.name;
    $('#s-desc').textContent = it.desc || '';
    const two = it.price != null && it.price2 != null;
    $('#s-prices').innerHTML = (it.price != null ? `<span>${two && it.unit1 ? `<small>${esc(it.unit1)}</small>` : ''}${price(it.price)}</span>` : '') +
      (it.price2 != null ? `<span>${it.unit2 ? `<small>${esc(it.unit2)}</small>` : ''}${price(it.price2)}</span>` : '');
    sheet.showModal();
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

  load();
})();
