# Bademli Fırın & Cafe · Dijital Menü

Türkçe, mobil öncelikli dijital menü + şifreli yönetim paneli. Derleme gerektirmez (statik site + Vercel serverless API).

| Yol | Ne |
|---|---|
| `/` | Herkese açık menü (kategori, arama, öne çıkanlar, ürün detayı) |
| `/admin` | Yönetim paneli: ürün ekle/sil/düzenle, fiyat, görsel yükle, kategori, işletme bilgileri |
| `/api/*` | login, logout, me, menu (GET/PUT), upload |

## Veri nerede?
- Menü (`menu.json`) ve yüklenen görseller **Vercel Blob** deposunda tutulur (ücretsiz Hobby kotası menü için fazlasıyla yeter).
- Blob'da henüz kayıt yoksa site, repodaki `data/menu.json` (başlangıç menüsü) ile açılır. Panelden ilk "Kaydet"ten sonra Blob kullanılır.

## Ortam değişkenleri (Vercel → Settings → Environment Variables)
| Ad | Açıklama |
|---|---|
| `ADMIN_USER` | Panel kullanıcı adı |
| `ADMIN_PASSWORD_HASH` | scrypt özeti. Üretmek için: `npm run hash-password -- "yeni şifre"` |
| `SESSION_SECRET` | En az 32 karakter rastgele metin (oturum çerezi imzası) |
| `BLOB_READ_WRITE_TOKEN` | Blob deposu bağlanınca Vercel otomatik ekler |

Şifre değiştirmek: yeni hash üretin, `ADMIN_PASSWORD_HASH` değerini güncelleyip yeniden deploy edin. Şifre düz metin olarak hiçbir yerde saklanmaz.

## Yerelde çalıştırma
```
npm install
ADMIN_USER=admin ADMIN_PASSWORD_HASH="$(npm run -s hash-password -- 'deneme')" SESSION_SECRET="$(openssl rand -base64 36)" npm run dev
```
Yerelde veriler `./.local/` altına yazılır. (Not: yerelde çerez `Secure` olduğundan Chrome/Firefox `localhost` üzerinde kabul eder.)
