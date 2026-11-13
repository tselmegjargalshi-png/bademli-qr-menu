/* Alerjen listesi (ikon + ad + renk) ve ÖRNEK varsayılanlar. Menü sitesi ve yönetim paneli ortak kullanır. */
(() => {

  // Delikler/detaylar currentColor (= rozet rengi), gövde beyaz.
  const st = 'fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"';
  const A = [
    { id: 'yer-fistigi', n: 'Yer fıstığı', c: '#D99A2B', g: '<circle cx="12" cy="8" r="3.6"/><circle cx="12" cy="15.5" r="4.4"/>' },
    { id: 'kabuklu-yemis', n: 'Kabuklu yemiş', c: '#C9722A', g: '<path d="M5.5 10.5h13c0-3-2.6-5-6.5-5s-6.5 2-6.5 5Z"/><path d="M7 12.5h10c-.4 4-2.2 6.5-5 7.5-2.8-1-4.6-3.5-5-7.5Z"/>' },
    { id: 'kabuklu-deniz', n: 'Kabuklular', c: '#2F6FB5', g: `<ellipse cx="12" cy="13.5" rx="4.5" ry="3.5"/><path ${st} stroke-width="1.7" d="M7.5 12 4.5 8.5M16.5 12l3-3.5M8.5 16.5 6 19.5M15.5 16.5l2.5 3M10 10.5 9 6.5M14 10.5l1-4"/>` },
    { id: 'yumusakcalar', n: 'Yumuşakçalar', c: '#2E9C94', g: '<path d="M12 20 4.5 10a8.5 8.5 0 0 1 15 0L12 20Z"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M12 19V8.5M8.2 17 7.5 9.5M15.8 17l.7-7.5"/>' },
    { id: 'balik', n: 'Balık', c: '#2A92CF', g: '<path d="M3.5 12c2.5-4 7-5.5 11-3.5l3-2.5v12l-3-2.5c-4 2-8.5.5-11-3.5Z"/><circle cx="8" cy="11.3" r="1" fill="currentColor"/>' },
    { id: 'yumurta', n: 'Yumurta', c: '#D4B106', g: '<path d="M12 4.5c3 0 4.5 1.5 6 3.5s2 4.5.5 7-4.5 4-7 3.5-6-2-6.5-6S6.5 5 9 4.8c1-.2 2-.3 3-.3Z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>' },
    { id: 'sut', n: 'Süt', c: '#B77AA6', g: '<path d="M5 9.5 7 7h3l2 2.5V20H5V9.5Z"/><path d="M14 11h6l-.8 9H14.8L14 11Z"/><rect x="6" y="3.5" width="3" height="2.3" rx=".6"/>' },
    { id: 'gluten', n: 'Gluten', c: '#8A4A2D', g: `<path ${st} stroke-width="1.7" d="M12 21V6"/><path d="M12 10c-3 0-4.5-1.5-4.5-4 2.5 0 4.5 1.5 4.5 4Zm0 0c3 0 4.5-1.5 4.5-4-2.5 0-4.5 1.5-4.5 4Zm0 5c-3 0-4.5-1.5-4.5-4 2.5 0 4.5 1.5 4.5 4Zm0 0c3 0 4.5-1.5 4.5-4-2.5 0-4.5 1.5-4.5 4Z"/><path d="M12 6c-1.2-1-1.2-2.2 0-3 1.2.8 1.2 2 0 3Z"/>` },
    { id: 'soya', n: 'Soya', c: '#3E9B4F', g: '<path d="M5 17.5C3.5 11 8 5 17 4.5c2 0 3 1 2.5 3C19 15 12.5 20 5 17.5Z"/><circle cx="9.5" cy="14" r="1.2" fill="currentColor"/><circle cx="12.5" cy="11" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8" r="1.1" fill="currentColor"/>' },
    { id: 'susam', n: 'Susam', c: '#D9742A', g: [0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="7.5" rx="2" ry="3.2" transform="rotate(${a} 12 12)"/>`).join('') + '<circle cx="12" cy="12" r="1.5" fill="currentColor"/>' },
    { id: 'kereviz', n: 'Kereviz', c: '#7FB069', g: `<path ${st} stroke-width="2.2" d="M8 20 7 8M12 20V6M16 20l1-12"/><path d="M7 8c-1.5-1-2-2.5-1-4 1.5.5 2 2 1 4Zm10 0c1.5-1 2-2.5 1-4-1.5.5-2 2-1 4ZM12 6c-1.5-1-1.5-2.5 0-3.5 1.5 1 1.5 2.5 0 3.5Z"/>` },
    { id: 'hardal', n: 'Hardal', c: '#B8893A', g: `<rect x="8" y="9" width="8" height="11" rx="2"/><path d="M10.5 9V6.5h3V9"/><path ${st} stroke-width="2" d="M12 3.5v3"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M10 13.5h4"/>` },
    { id: 'lupin', n: 'Lupin', c: '#7B63B5', g: `<path ${st} stroke-width="2" d="M12 21v-6"/><circle cx="12" cy="4.5" r="1.4"/><circle cx="9.8" cy="7.5" r="1.5"/><circle cx="14.2" cy="7.5" r="1.5"/><circle cx="8.6" cy="11" r="1.6"/><circle cx="15.4" cy="11" r="1.6"/><circle cx="12" cy="10.5" r="1.5"/>` },
    { id: 'sulfit', n: 'Sülfitler', c: '#8F1D24', g: `<path d="M7 3.5h10c.5 5-.5 9-5 9.5-4.5-.5-5.5-4.5-5-9.5Z"/><path ${st} stroke-width="2" d="M12 13v6.5M8.5 20.5h7"/>` },
  ];
  const BY = Object.fromEntries(A.map((a) => [a.id, a]));

  // ÖRNEK VERİ: tipik tariflere göre tahmin. Mutfak onaylamadan yayına alınmamalı.
  // [] = alerjen içermediği varsayılan; listede OLMAYAN ürün = bilgi yok.
  const S = 'sut', G = 'gluten', Y = 'yumurta', K = 'kabuklu-yemis', F = 'yer-fistigi', So = 'soya', Su = 'susam';
  const MAP = {
    'cilekli-magnolya': [S, G], 'cilek-muz-magnolya': [S, G], 'frambuazli-magnolya': [S, G], 'orman-meyveli-magnolya': [S, G],
    'oreolu-magnolya': [S, G, So], 'antep-fistikli-magnolya': [S, G, K], 'dubai-magnolya': [S, G, K, Su],
    'bademli-cikolatali-magnolya': [S, G, K], 'lotus-muz-magnolya': [S, G, So],
    'damla-sakizli-muhallebi': [S], 'lotuslu-muhallebi': [S, G, So], 'tel-kadayifli-muhallebi': [S, G, K],
    'antep-fistikli-muhallebi': [S, K], 'oreolu-muhallebi': [S, G, So],
    'limonlu-cheesecake': [S, G, Y], 'frambuazli-cheesecake': [S, G, Y], 'lotuslu-cheesecake': [S, G, Y, So], 'san-sebastian': [S, Y],
    'malaga': [S, G, Y, K, So], 'snickers': [S, G, Y, F, So], 'snickers-pasta': [S, G, Y, F, So], 'bella-vista': [S, G, Y, K],
    'klasik-ekler': [S, G, Y], 'lotus-limon-antep-ekler': [S, G, Y, K], 'cilekli-cup': [S, G, Y], 'incir-uyutmasi': [S],
    'firin-sutlac': [S], 'muska-pasta-cikolatali': [S, G, Y], 'muska-pasta-lotuslu': [S, G, Y, So], 'trilece': [S, G, Y],
    'tiramisu': [S, G, Y], 'makaron': [Y, K], 'profiterol': [S, G, Y], 'aile-boyu-profiterol': [S, G, Y], 'supangle': [S, Y, So],
    'brownie': [S, G, Y, K, So], 'lotuslu-rulo-pasta': [S, G, Y, So], 'cikolatali-rulo-pasta': [S, G, Y, So], 'mousse-pasta-cesitleri': [S, G, Y, So],
    'soguk-baklava': [S, G, K], 'antep-fistikli-baklava': [S, G, K], 'cevizli-baklava': [S, G, K],
    'kahvalti-tabagi': [S, G, Su], 'milas-boregi': [S, G, Y], 'izmir-bomba': [S, G, Y], 'pogaca-cesitleri': [S, G, Y], 'simit': [G, Su],
    '4-6-kisilik-yas-pasta': [S, G, Y], '8-10-kisilik-yas-pasta': [S, G, Y], 'kuru-pasta-cesitleri': [S, G, Y, K],
    'espresso': [], 'americano': [], 'latte': [S], 'cappuccino': [S], 'macchiato': [S], 'mocha': [S, So], 'flat-white': [S],
    'turk-kahvesi': [], 'damla-sakizli-turk-kahvesi': [], 'siyah-cay': [], 'bitki-caylari': [], 'sicak-cikolata': [S, So],
    'ice-latte': [S], 'ice-caramel-latte': [S], 'ice-filtre': [], 'ice-americano': [], 'ice-spanish-latte': [S], 'ice-mocha': [S, So], 'affogato': [S],
    'limonata': [], 'churchill': [], 'sade-soda': [], 'ayran': [S], 'milkshake': [S],
  };
  window.ALG_DATA = { list: A, defaults: MAP };
})();
