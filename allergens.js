/* Alerjen simgeleri — mevcut app.js'e dokunmadan, DOM'u zenginleştirir.
   Ürün kimliği (data-id) ile eşleşir. */
(() => {
  'use strict';

  // Yönetim panelinde alerjeni girilmemiş (yalnızca örnek tahmini olan) ürün varsa true.
  let NEEDS_REVIEW = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { list: A, defaults } = window.ALG_DATA;
  const MAP = { ...defaults }; // yönetim panelinden gelen değerler bunun üzerine yazılır
  const BY = Object.fromEntries(A.map((a) => [a.id, a]));

  const badge = (id) => {
    const a = BY[id];
    return `<span class="alg-i" role="img" aria-label="${esc(a.n)}" title="${esc(a.n)}" style="--c:${a.c}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.g}</svg></span>`;
  };
  const row = (ids) => (ids && ids.length ? `<div class="alg" aria-label="Alerjenler">${ids.map(badge).join('')}</div>` : '');

  // ---------- kartlara rozet ekle ----------
  function decorate() {
    $$('.item').forEach((b) => {
      if ($('.alg', b)) return;
      const html = row(MAP[b.dataset.id]);
      if (!html) return;
      const price = $('.price', b);
      if (price) price.insertAdjacentHTML('beforebegin', html); else $('.body', b)?.insertAdjacentHTML('beforeend', html);
    });
    $$('.f-card .f-info').forEach((info) => {
      if ($('.alg', info)) return;
      info.insertAdjacentHTML('beforeend', row(MAP[info.parentElement.dataset.id]));
    });
    applyFilter();
  }

  // ---------- filtre ----------
  const excluded = new Set();
  function applyFilter() {
    const on = excluded.size > 0;
    const known = (id) => Object.prototype.hasOwnProperty.call(MAP, id);
    const hide = (id) => on && (!known(id) || MAP[id].some((a) => excluded.has(a)));
    $$('.item, .f-card').forEach((b) => b.classList.toggle('alg-off', hide(b.dataset.id)));
    $$('.cat').forEach((s) => { s.classList.toggle('alg-off', on && !$$('.item', s).some((b) => !b.classList.contains('alg-off'))); });
    const feat = $('#featured');
    if (feat) feat.classList.toggle('alg-off', on && !$$('.f-card', feat).some((b) => !b.classList.contains('alg-off')));
    const none = $('#alg-none');
    if (none) none.hidden = !(on && !$$('.item').some((b) => !b.classList.contains('alg-off')) && $$('.item').length > 0);
    const n = $('#alg-n'); if (n) { n.textContent = excluded.size; n.hidden = !on; }
    $('#alg-btn')?.classList.toggle('on', on);
    $$('#alg-panel .alg-opt').forEach((o) => o.setAttribute('aria-pressed', String(excluded.has(o.dataset.id))));
    $('#alg-clear')?.toggleAttribute('hidden', !on);
  }

  // ---------- filtre çubuğu ----------
  function buildBar() {
    const bar = $('#bar'); if (!bar || $('#alg-btn')) return;
    const wrap = document.createElement('div');
    wrap.className = 'alg-bar';
    wrap.innerHTML =
      `<button id="alg-btn" class="alg-btn" type="button" aria-expanded="false" aria-controls="alg-panel">` +
      `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z"/></svg>Alerjen filtresi<b id="alg-n" hidden>0</b></button>` +
      `<div id="alg-panel" class="alg-panel" hidden><p class="alg-help">İçermesini istemediğiniz alerjenleri seçin. Bilgisi girilmemiş ürünler gösterilmez.</p>` +
      `<div class="alg-opts">${A.map((a) => `<button type="button" class="alg-opt" data-id="${a.id}" aria-pressed="false">${badge(a.id)}${esc(a.n)}</button>`).join('')}</div>` +
      `<button id="alg-clear" class="alg-clear" type="button" hidden>Temizle</button></div>`;
    const chips = $('#chips');
    bar.insertBefore(wrap, chips);
    const none = document.createElement('p');
    none.id = 'alg-none'; none.className = 'empty'; none.hidden = true;
    none.textContent = 'Seçtiğiniz kriterlere uygun ürün bulunamadı.';
    $('#main')?.appendChild(none);

    $('#alg-btn').addEventListener('click', () => {
      const p = $('#alg-panel'); p.hidden = !p.hidden;
      $('#alg-btn').setAttribute('aria-expanded', String(!p.hidden));
    });
    $('#alg-panel').addEventListener('click', (e) => {
      const o = e.target.closest('.alg-opt');
      if (o) { excluded.has(o.dataset.id) ? excluded.delete(o.dataset.id) : excluded.add(o.dataset.id); applyFilter(); return; }
      if (e.target.closest('#alg-clear')) { excluded.clear(); applyFilter(); }
    });
  }

  // ---------- bilgi bölümü ----------
  function buildLegend() {
    const foot = $('.foot'); if (!foot || $('#alerjenler')) return;
    const s = document.createElement('section');
    s.id = 'alerjenler'; s.className = 'alg-legend'; s.setAttribute('aria-labelledby', 'alg-title');
    s.innerHTML =
      `<p class="alg-kicker">Alerjen Bilgisi</p><h2 id="alg-title">Gıda alerjiniz veya hassasiyetiniz varsa</h2>` +
      `<p class="alg-lead">Ürünlerin altındaki simgeler içerdiği alerjenleri gösterir. Sipariş vermeden önce lütfen personelimize danışın.` +
      `${NEEDS_REVIEW ? ' Alerjen bilgileri doğrulama aşamasındadır.' : ''}</p>` +
      `<ul class="alg-grid">${A.map((a) => `<li>${badge(a.id).replace('class="alg-i"', 'class="alg-i lg"')}<span>${esc(a.n)}</span></li>`).join('')}</ul>`;
    foot.parentNode.insertBefore(s, foot);
  }

  // ---------- detay penceresi ----------
  let lastId = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.item, .f-card'); if (!b) return;
    lastId = b.dataset.id;
    setTimeout(() => {
      const body = $('#sheet .s-body'); if (!body) return;
      $('.s-alg', body)?.remove();
      const ids = MAP[lastId];
      if (!ids || !ids.length) return;
      body.querySelector('.s-desc')?.insertAdjacentHTML('afterend',
        `<div class="s-alg"><p>Alerjenler</p><ul>${ids.map((id) => `<li>${badge(id)}<span>${esc(BY[id].n)}</span></li>`).join('')}</ul></div>`);
    }, 0);
  }, true);

  // ---------- başlat ----------
  // Menü verisi (yönetim panelinin kaydettiği) — varsa alerjen alanı örnek tahminlerin yerine geçer.
  async function loadMenu() {
    let data = null;
    try { const r = await fetch('/api/menu', { cache: 'no-cache' }); if (r.status === 200) data = await r.json(); } catch {}
    if (!data || !Array.isArray(data.items)) { try { data = await (await fetch('/data/menu.json')).json(); } catch {} }
    if (!data || !Array.isArray(data.items)) return;
    let pending = 0;
    data.items.forEach((it) => {
      if (Array.isArray(it.allergens)) MAP[it.id] = it.allergens.filter((id) => BY[id]);
      else pending++;
    });
    NEEDS_REVIEW = pending > 0;
  }

  async function init() {
    await loadMenu();
    buildBar(); buildLegend(); decorate();
    const mo = new MutationObserver(decorate);
    ['#menu', '#f-track'].forEach((sel) => { const el = $(sel); if (el) mo.observe(el, { childList: true }); });
  }
  init();
})();
