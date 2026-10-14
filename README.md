# 🧬 TestoTavan — Doğal Testosteron Optimizasyonu

**TestoTavan**, erkek sağlığı ve doğal testosteron desteği hakkındaki verilere dayalı, kişiselleştirilmiş öneriler sunan web tabanlı bir analiz platformudur. Kullanıcılar belirtilerini ve (isteğe bağlı) kan testi değerlerini girerek anlık bir "hormon analiz raporu" alır ve doğal optimizasyon yollarını öğrenir.

## 🚀 Mission

We offer natural, safe, and alternative solutions to address the decline in testosterone levels observed in modern life.

---
![Linux](https://img.shields.io/badge/platform-Linux-FCC624?logo=linux&logoColor=black) ![Windows](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows&logoColor=white) ![macOS](https://img.shields.io/badge/platform-macOS-111111?logo=apple) ![Android](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white) ![iOS](https://img.shields.io/badge/platform-iOS-111111?logo=apple) ![Kurulum gerekmez](https://img.shields.io/badge/platform-web%20browser-00E676)

![Dil](https://img.shields.io/badge/dil-T%C3%BCrk%C3%A7e-red)
![Dil](https://img.shields.io/badge/dil-English-blue)
![Dil](https://img.shields.io/badge/dil-Germany-yellow)
![Dil](https://img.shields.io/badge/dil-Japanese-red)

![Mobil](https://img.shields.io/badge/mobil-uyumlu-9C27B0)
![Tema](https://img.shields.io/badge/tema-koyu-111111)
![Ücretsiz](https://img.shields.io/badge/%C3%BCcretsiz-evet-00E676)
![Kayıt](https://img.shields.io/badge/kay%C4%B1t-gerekmez-00E676)
![Testler](https://img.shields.io/badge/testler-87%20ge%C3%A7ti-brightgreen)
![Sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-v1.0.0-blue)
## ✨ Features

- **Üç adımlı tek akış: Semptom → Tahmin → Doğrulama** (adım göstergesi + ilerleme yüzdesi)
  - **Semptom Analizi** — yaş, boy, kilo, uyku, stres ve semptom seçimlerinden **nokta tahmin + %68 güven aralığı**
    (ör. “Tahmini 340 ng/dL”), seçilen semptomun adını taşıyan kartlar, her kartta laboratuvar referans aralığı,
    Kritik/Düşük/Sınırda/Normal rozetiyle önceliklendirme ve tek cümlelik açıklama
  - **Kan Testi ile Doğrulama** — 12 parametre (total/serbest testosteron, SHBG, LH, FSH, estradiol, kortizol,
    ferritin, D vitamini, B12, çinko, magnezyum); yalnızca Total T zorunlu, diğerleri opsiyonel
- **Tahlil yükleme** — PDF’teki değerler tarayıcı içinde okunup forma yazılır (dosya sunucuya gönderilmez);
  metin yapıştırma ve elle giriş alternatif yollardır
- **Birim desteği** — her satırda birim kolonu ve nmol/L ↔ ng/dL gibi anında dönüşüm
- **Gerçek laboratuvar aralıkları** — geçerli sonuçlar reddedilmez; alışılmadık değer reddedilmek yerine
  “emin misiniz?” uyarısı ve hekim yönlendirmesiyle kabul edilir
- **Şeffaf Genel Değerlendirme skoru** — ağırlıkların ve kapsama oranının açıklandığı tooltip
- **KVKK açık rızası** — sağlık verisi için ayrı, boş başlangıçlı onay kutusu
- **Numune koşulları ve lojistik** — sabah 07:00–10:00, açlık, biotin kesme; nerede/kaça/kaç günde bilgisi
- **Anlık sonuç raporu** ve doğal destek önerileri
- **Blog & Tarifler** — admin panelinden yönetilen içerikler (blog yazıları ve tarifler; kategori, malzeme listesi, kapak görseli)
- **Dört dilde içerik (TR/EN/DE/JA)** — admin panelinde başlık, özet, içerik ve kategorinin yanı sıra
  **süre ve malzeme listesi** de her dil için ayrı girilir; süre alanı boş bırakılırsa Türkçeden otomatik
  çevrilir (`20 dk` → `20 min` / `20 Min.` / `20分`), malzeme çevirisi yoksa Türkçesi gösterilir
- **Admin paneli** (`/admin`) — şifreli giriş, içerik CRUD, görsel yükleme
- **AI Haberden Otomatik Blog Üretici** — admin paneline girilen haber/makale bağlantısından başlık, özet, gövde, kategori, okuma süresi ve kapak görselini çekip 4 dilde (TR/EN/DE/JA) blog taslağına dönüştürür (Gemini, OpenAI, Groq + anahtarsız yerleşik akıllı mod)
- **Pinterest Rich Pin köprüsü** — blog yayınlandığı anda (veritabanı commit'i sonrası) başlık, özet,
  canlı bağlantı ve kapak görseli Pinterest API v5'e kurumsal JSON gövdesi olarak gönderilir
  (panelden kapatılabilir; ayrıntı: [Pinterest köprüsü](#-pinterest-rich-pin-köprüsü))
- **Sayfa görüntüleme istatistikleri** — Neon Postgres üzerinde sayaç
- **Mobil öncelikli, tek sayfa arayüz** — koyu tema, alt navigasyon, SEO + Open Graph meta etiketleri, sitemap
- **Güvenlik başlıkları** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (bkz. `vercel.json`)

## 🛠 Tech Stack

| Katman | Teknoloji |
| --- | --- |
| Frontend | Vanilla HTML/CSS/JS (tek sayfa, mobil öncelikli) |
| Backend | Vercel Serverless Functions (Node.js) |
| Veritabanı | Neon Postgres (`@neondatabase/serverless`) |
| Test | Node.js built-in test runner (`node --test`) |
| Hosting | Vercel |

## 📁 Project Structure

> ⚠️ `index.html` ve `js/*.js` **üretilmiş** dosyalardır. Düzenleme her zaman `src/` altında yapılır,
> ardından `npm run build:assets` çalıştırılır (`npm test` güncel olup olmadığını denetler).

```
├── src/                  # KAYNAKLAR (burayı düzenleyin)
│   ├── index.html        #   Ana SPA (analiz, blog, tarifler, hakkında) — okunabilir CSS ile
│   └── js/
│       ├── validation.js #   Laboratuvar çekirdeği: referans aralıkları, birimler,
│       │                 #     doğrulama/uyarı, tahmin motoru, tahlil metni okuma
│       ├── app.js        #   Analiz ekranlarının arayüzü (adım göstergesi, kartlar, rapor)
│       └── content.js    #   Blog + çeviri; yalnızca ihtiyaç halinde yüklenir
├── index.html            # ÜRETİLMİŞ: stil bloğu küçültülmüş, script yolları hash'li
├── js/                   # ÜRETİLMİŞ: küçültülmüş + içerik hash'li paketler
├── assets/
│   ├── logo.webp         # Arayüzde kullanılan logo (256 px, ~6 KB)
│   ├── logo.png          # Favicon / apple-touch-icon ve WebP desteklemeyen tarayıcı yedeği (192 px)
│   └── logo-source.png   # 1024 px kaynak görsel (yayına gönderilmez, yeni boyut üretmek için)
├── admin/index.html      # Yönetim paneli (görsel yükleme + kategori)
├── api/                  # Vercel serverless functions
│   ├── _auth.js          #   Ortak: oturum cookie'si, şifre doğrulama (private)
│   ├── _media.js         #   Ortak: görsel yükleme / URL doğrulama (private)
│   ├── _content-shape.js #   Ortak: içerik/çeviri alan temizleme, süre yerelleştirme (private)
│   ├── _pinterest.js     #   Ortak: Pinterest pin gövdesi + gönderim boru hattı (private)
│   ├── _ai-blog.js       #   Ortak: haber URL'sinden içerik çıkarma ve 4 dilde AI blog üretimi (private)
│   ├── ai-blog.js        #   POST /api/ai-blog — haber linkinden otomatik blog taslağı üretir
│   ├── login.js          #   POST /api/login — admin girişi (IP bazlı rate limit)
│   ├── session.js        #   GET  /api/session — oturum durumu
│   ├── stats.js          #   GET|POST /api/stats — sayfa görüntüleme sayacı
│   ├── content.js        #   Blog & tarif içerik yönetimi (CRUD) — yayında Pinterest tetikleyicisi
│   └── media/            #   Görsel yükleme ve sunma (/api/media/<id>)
├── tools/
│   ├── build.mjs                     # src/ → yayın dosyaları (CSS/JS küçültme + hash)
│   ├── analysis-pages.template.html  # Semptom + kan testi ekranlarının şablonu
│   └── build-analysis-pages.mjs      # Form satırlarını referans aralıklarından üretir
├── tests/                # node --test testleri (validation, content, media, build)
├── vercel.json           # Güvenlik başlıkları + önbellek politikası
├── .vercelignore         # Kaynak/test dosyaları yayına gönderilmez
├── sitemap.xml           # SEO site haritası
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bir [Neon](https://neon.tech) Postgres bağlantı adresi

### Install

```bash
npm install
```

### Build (yayın dosyalarını üret)

`src/index.html` veya `src/js/*.js` değiştiğinde:

```bash
npm run build:assets   # index.html + js/<ad>.<hash>.js dosyalarını yeniden üretir
npm run check:assets   # üretilmiş dosyalar güncel mi? (CI/test için)
```

Derleme yalnızca iki şey yapar: `<style>` bloğunu küçültür ve JS paketlerini
(değişken adlarını **koruyarak**) küçültüp içerik hash'iyle adlandırır. HTML gövdesi
karakteri karakterine aynı kalır — `npm test` bunu da denetler.

### Environment Variables

Vercel projesi ayarlarında (veya yerelde `.env`) şu değişkenler tanımlanmalıdır:

| Değişken | Açıklama |
| --- | --- |
| `DATABASE_URL` | Neon Postgres bağlantı adresi |
| `ADMIN_USERNAME` | Admin paneli kullanıcı adı (opsiyonel; varsayılan `admin`) |
| `ADMIN_PASSWORD` | Admin paneli şifresi |
| `SESSION_SECRET` | Oturum cookie ve doğrulama kodu (Captcha) imzası için gizli anahtar |
| `PINTEREST_ACCESS_TOKEN` | Pinterest API v5 erişim tokenı (opsiyonel; yoksa pin gönderilmez) |
| `PINTEREST_BOARD_ID` | Pinin ekleneceği board kimliği (opsiyonel; yoksa pin gönderilmez) |
| `SITE_URL` | Yayındaki kök adres, ör. `https://testotavan.vercel.app` (opsiyonel) |
| `GEMINI_API_KEY` | Google Gemini API anahtarı — haberden otomatik blog üretimi için (opsiyonel) |
| `OPENAI_API_KEY` | OpenAI API anahtarı — alternatif AI sağlayıcısı (opsiyonel) |
| `GROQ_API_KEY` | Groq API anahtarı — alternatif AI sağlayıcısı (opsiyonel) |

> Not: `ADMIN_PASSWORD` / `SESSION_SECRET` tanımlı değilse giriş API'si `503` döner; `DATABASE_URL` yoksa istatistik ve içerik servisleri devre dışı kalır (site çalışmaya devam eder).
> Pinterest değişkenleri tanımlı değilse site ve yayın akışı normal çalışır; yalnızca pin adımı atlanır.
> `SITE_URL` boşsa Vercel'in `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` değerleri, o da yoksa istek başlıkları kullanılır.

### Run Locally

Statik sayfaları doğrudan açabilirsiniz; API'ler için [Vercel CLI](https://vercel.com/docs/cli) önerilir:

```bash
npx vercel dev
```

### Test

```bash
npm test
```


## ⚡ PageSpeed yaklaşımı

- **Logo 1,73 MB → 6 KB.** Arayüzdeki logo 256 px WebP (`assets/logo.webp`), favicon/apple-touch-icon
  192 px PNG (`assets/logo.png`). WebP desteklemeyen tarayıcılar `onerror` ile PNG'ye düşer.
  1024 px kaynak `assets/logo-source.png` olarak durur; yeni boyut üretmek için:
  `convert assets/logo-source.png -resize 256x256 -strip -quality 92 assets/logo.webp`
- İlk ekranda üçüncü taraf font veya ikon paketi çağrılmaz; sistem fontları ve satır içi SVG ikonlar kullanılır.
- CSS satır içi kalır (ek istek yok) ve derlemede küçültülür; JS paketleri yorum/boşluk temizlenerek küçültülür.
- Blog, içerik API çağrıları ve çeviri verisi yalnızca Blog sekmesi veya dil seçici kullanıldığında yüklenir.
- `js/` altındaki hash'li paketler Vercel'de bir yıl `immutable`, `assets/` bir gün + `stale-while-revalidate`
  önbelleklenir. Hash'li adlar `npm run build:assets` tarafından otomatik üretilir; elle güncellemek gerekmez.
- `npm test`, doğrulama mantığını, laboratuvar aralıklarını, tahmin motorunu, kritik istemci giriş noktalarını
  ve **üretilmiş dosyaların kaynaklarla güncelliğini** denetler.
- Kan testi formundaki satırlar elle yazılmaz; referans aralıkları değişince `node tools/build-analysis-pages.mjs`
  komutu `src/index.html` içindeki `ANALYSIS-PAGES` bloğunu yeniden üretir (sonrasında `npm run build:assets`).

| İlk yükleme (gzip) | Önce | Sonra |
| --- | --- | --- |
| index.html | 19,9 KB | 18,4 KB |
| validation + app | 22,7 KB | 18,3 KB |
| logo | 1.731 KB | 6 KB (+14 KB favicon) |
| **Toplam** | **~1.774 KB** | **~57 KB** |

## 📌 Pinterest Rich Pin köprüsü

Blog yazısı admin panelinden yayınlandığı anda akış şu sırayla çalışır (Python'daki
`pinterest_rich_pin_firlat(blog_data)` çağrısının bu projedeki karşılığı `api/_pinterest.js`
içindeki `pinterestRichPinFire(created, ...)` fonksiyonudur):

```
Admin paneli (Herkese açık yayınla)
        │  POST /api/content  { title, summary, body, cover_url, pinterest: true }
        ▼
1. Doğrulama + Neon Postgres'e kayıt (INSERT … commit)
        ▼
2. pinterestRichPinFire() — pin gövdesi kurulur
   board_id · title · description · link · alt_text · media_source
        ▼
3. POST https://api.pinterest.com/v5/pins   (Authorization: Bearer …)
        ▼
4. Sonuç, 201 yanıtındaki `pinterest` alanıyla panele raporlanır
```

Gönderilen kurumsal gövde:

```json
{
  "board_id": "987654321",
  "title": "Sabah Rutininin Testosterona Etkisi",
  "description": "Gün ışığı, uyku düzeni ve kahvaltı tercihlerinin hormon dengesine etkisi.\n\n#HormonSagligi #TestoTavan #ErkekSagligi",
  "link": "https://testotavan.vercel.app/?icerik=content-1760000000000-ab12cd34",
  "alt_text": "Sabah Rutininin Testosterona Etkisi — Hormon Sağlığı",
  "media_source": {
    "source_type": "image_url",
    "url": "https://testotavan.vercel.app/api/media/media-1760000000000-ab12cd34"
  }
}
```

- **`link`** Vercel'deki canlı yazıya derin bağlantıdır: `?icerik=<id>` adresini açan ziyaretçi
  doğrudan Blog sekmesine yönlendirilir ve ilgili yazı veritabanı yanıtı gelir gelmez açılır.
- **`media_source.url`** yalnızca HTTPS olabilir; panelden yüklenen `/api/media/...` görselleri
  sitenin kök adresiyle mutlaklaştırılır (görseli Pinterest kendi indirir).
- **`description`** blog özetinin sonuna kategori hashtag'i eklenerek üretilir; başlık 100,
  açıklama ve alt metin 500 karakter sınırına kırpılır (`Hormon Sağlığı` → `#HormonSagligi`).

Davranış kuralları:

| Durum | Sonuç |
| --- | --- |
| Pin başarılı | Yanıtta `{ ok: true, pin_id }`; panelde "Pinterest pin gönderildi" bildirimi |
| 429 / 5xx | Bir kez daha denenir (300 ms bekleme); yine olmazsa `{ ok: false, reason: 'api_error' }` |
| 4xx (yetki, board hatası) | Tekrar denenmez; hata mesajı panele yazılır |
| Ağ hatası / zaman aşımı | `AbortController` ile 3 sn'de kesilir; blog yayını **her durumda** başarılı kalır |
| Kapak görseli yok ya da token/board tanımsız | Pin atlanır (`skipped`), blog normal yayınlanır |
| Tarif yayını | Pinterest adımı çalışmaz (yalnızca blog yazıları) |
| Panelde onay kutusu kaldırıldı | Gövdede `pinterest: false` iletilir, hiç istek atılmaz (tercih tarayıcıda hatırlanır) |

> **Serverless notu:** Vercel fonksiyon örneği yanıtla birlikte dondurulabildiği için istek
> "ateşle-unut" biçiminde bırakılmaz; sert zaman aşımıyla sınırlandırılmış şekilde beklenir ve
> sonucu panele bildirilir. En kötü durumda yayın yanıtı ~6 sn gecikir (2 deneme × 3 sn) ve
> pin hatası yayını hiçbir koşulda düşürmez.

## 📡 API Overview

| Endpoint | Metod | Açıklama |
| --- | --- | --- |
| `/api/login` | `GET` / `POST` | Admin doğrulama kodu (Captcha) üretimi ve kullanıcı adı + şifre + kod ile giriş; 15 dk içinde IP başına en fazla 10 deneme |
| `/api/session` | `GET` | Oturumun doğrulanmış mı olduğunu döner |
| `/api/stats` | `GET` / `POST` | Sayfa görüntüleme sayacını okur / artırır |
| `/api/content` | `GET` / `POST` / … | Blog ve tarif içerikleri (yazma işlemleri admin yetkisi ister); `POST` yanıtı `pinterest` alanında pin sonucunu döner |
| `/api/ai-blog` | `POST` | Haber bağlantısından (URL) veri çekip 4 dilde (TR/EN/DE/JA) blog taslağı üretir (admin yetkisi ister) |
| `/api/media` | `POST` | Base64 görsel yükleme (admin yetkisi ister) |
| `/api/media/:id` | `GET` / `DELETE` | Yüklenen görseli sunar / siler |

## ⚠️ Disclaimer

TestoTavan is not a medical device or diagnostic tool. The results are for informational purposes only and do not replace professional medical advice. You should always consult a physician regarding health-related products.

---

© TestoTavan

## Topluluk forumu

- `/forum/`: ziyaretçiler rumuzla konu açabilir ve açık konulara yanıt verebilir.
  Bu sürümde üyelik/kimlik doğrulaması yoktur; rumuzlar benzersiz veya doğrulanmış değildir.
- Admin panelindeki **Forum yönetimini aç** bağlantısı `/forum/?manage=1` sayfasını açar.
  Mevcut admin oturumu zorunludur. Bekleyen konuları/yanıtları onaylama, konu
  kilitleme/kilidi açma ve kalıcı silme desteklenir. Konu silinince yanıtları da silinir.
  Konu kartlarında bekleyen yanıt sayısı gösterilir; yanıtları incelemek için konuyu açın.
- Tüm yeni gönderiler onay bekler; ziyaretçiler bekleyen içerikleri göremez.
  Sayfalar 30 konu / 50 yanıtla sınırlıdır ve önceki/sonraki kontrolleri vardır.
- Mevcut `DATABASE_URL` (Neon PostgreSQL), `SESSION_SECRET` ve admin girişi için
  `ADMIN_PASSWORD` ortam değişkenlerini kullanır. İlk API isteği `forum_threads`,
  `forum_replies`, `forum_limits` tablolarını ve yanıt indeksini otomatik oluşturur;
  DB kullanıcısının CREATE yetkisi gerekir. Ek servis veya paket gerekmez.
- IP'nin HMAC özetiyle DB üzerinde 30 saniyede bir gönderi sınırı uygulanır;
  ham IP saklanmaz. Eski hız sınırı kayıtları sonraki gönderimlerde 24 saat sonra temizlenir.
  Ters proxy `x-forwarded-for` başlığını güvenilir şekilde sağlamalıdır (Vercel dağıtımı).
  Yoğun trafik için ayrıca platform/WAF hız sınırı önerilir.
- Paylaşımlar düz metin olarak kaçışlanarak gösterilir. JSON yazma istekleri ve
  cross-site istek kontrolü kullanılır; moderasyon sunucuda admin yetkisi gerektirir.
- Yerelde `npm test` ve `npm run check:assets` çalıştırın. Gerçek ortamda iki ayrı
  tarayıcı oturumuyla konu gönder → adminde onayla → ziyaretçide görüntüle → yanıt
  gönder/onayla → kilitle (yanıt gönderilememeli) → sil akışını doğrulayın.
