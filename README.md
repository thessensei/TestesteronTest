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
![Testler](https://img.shields.io/badge/testler-187%20ge%C3%A7ti-brightgreen)
![Sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-v1.0.0-blue)
## ✨ Features

- **Üç adımlı tek akış: Semptom → Tahmin → Doğrulama** (adım göstergesi + ilerleme yüzdesi)
  - **Semptom Analizi** — 7 yaş ve üzeri için yaş, boy, kilo, uyku, stres ve semptom seçimlerinden
    **nokta tahmin + belirsizlik aralığı** üretir. 7–17 yaşta erişkin tabanı/BMI eşikleri yerine yaşa özgü
    gelişim modeli ve geniş karşılaştırma aralığı kullanılır; düşük güven açıkça belirtilir. Seçilen semptomun
    adını taşıyan kartlar Kritik/Düşük/Sınırda/Normal rozetiyle önceliklendirilir
  - **Kilitli önizleme yok:** Bulanık/kilitli plan kartı kaldırıldı; erişkin kişisel planı (uyku, stres, hareket,
    kilo adımları + takviye dozları) sonuçla birlikte **doğrudan ve tam** gösterilir. 18 yaş altında otomatik
    takviye/hormon dozu verilmez; güvenli alışkanlıklar ve çocuk endokrinolojisi yönlendirmesi gösterilir
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
  - **Her yazı kendi kalıcı sayfasında:** `/blog/<slug>/` — sunucu tarafında üretilen HTML, canonical,
    hreflang ve `BlogPosting`/`Recipe`/`FAQPage` JSON-LD. Arşiv `/blog/`, RSS `/blog/rss.xml`.
    Yayın gövdesindeki kaynakça/atıf satırları **hem üretimde hem kayıtta** ayıklanır; yazı kendi başına ayakta durur
  - **Ayrı keşif kanalı:** `/sitemap.xml` yazıları, tarifleri ve onaylı forum konularını tek haritada toplar
- **Dört dilde içerik (TR/EN/DE/JA)** — admin panelinde başlık, özet, içerik ve kategorinin yanı sıra
  **süre ve malzeme listesi** de her dil için ayrı girilir; süre alanı boş bırakılırsa Türkçeden otomatik
  çevrilir (`20 dk` → `20 min` / `20 Min.` / `20分`), malzeme çevirisi yoksa Türkçesi gösterilir
- **Admin paneli** (`/admin`) — şifreli giriş, içerik CRUD, görsel yükleme
- **4 Dilli AI İçerik Stüdyosu** — admin paneline girilen haber/makale/tarif bağlantısından önce güvenilir Türkçe ana taslağı çıkarır; EN, DE ve JA çevirilerini tek karma yanıt yerine **üç bağımsız AI turunda** üretir. Her dil; hedef dil, eksiksiz başlık/özet/gövde, sayı ve URL koruması, paragraf/liste yapısı, süre, malzeme sayısı-sırası ve miktarlar açısından kalite kapısından geçer. Başarısız çeviri sorun listesiyle otomatik yeniden denenir; sonuçlar panelde dil başına kalite puanı ve durum kartıyla gösterilir. Gemini, OpenAI, Groq, Claude, Kimi ve DeepSeek desteklenir; AI yoksa yedek makine/yerel çeviri zinciri kullanılır (`ENABLE_MACHINE_TRANSLATION=0` ile ağ çevirisi kapatılabilir)
- **Pinterest Rich Pin köprüsü** — blog yayınlandığı anda (veritabanı commit'i sonrası) başlık, özet,
  canlı bağlantı ve kapak görseli Pinterest API v5'e kurumsal JSON gövdesi olarak gönderilir
  (panelden kapatılabilir; ayrıntı: [Pinterest köprüsü](#-pinterest-rich-pin-köprüsü))
- **Sağ/sol sponsor alanları** — Masaüstü ve TV ekranlarında içeriğin **soluna ve sağına** yerleşen,
  kaydırmada sabit kalan sponsor sütunları; telefon ve tablette ise içerikten önce/sonra görünen
  kaydırılabilir sponsor şeridi. Başlık, metin ve bağlantı `src/js/app.js` içindeki tek `SPONSORS`
  listesinden yönetilir (`window.TESTOTAVAN_SPONSORS` ile API'den de beslenebilir); boş liste o sütunu gizler.
  Sponsorluk/iletişim CTA'ları (`Sponsor ol`, `İletişime geç`, `Detaylar`) ve Hakkımızda alt bilgisindeki
  adres `CONTACT_EMAIL` sabitinden yönetilir; tıklanınca **testotavan@gmail.com** alıcılı, konusu dolu
  **yeni e-posta ekranı doğrudan açılır** — telefon/tablette `mailto:` ile Gmail/Mail uygulaması,
  masaüstünde Gmail'in "Yeni ileti" penceresi (yeni sekmede). Masaüstünde `mailto:` çoğu zaman tanımlı
  bir posta uygulaması olmadığı için hiçbir şey açmaz; Gmail'in web yazma bağlantısı ise mobilde gelen
  kutusuna düştüğünden bağlantı cihaza göre seçilir (`contactLink()` / `enhanceContactLinks()`)
- **Sayfa görüntüleme istatistikleri** — Neon Postgres üzerinde sayaç
- **Mobil öncelikli, tek sayfa arayüz** — koyu tema, alt navigasyon, canonical URL, Open Graph + WebApplication yapılandırılmış verisi, `robots.txt` ve geçerli sitemap
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
│   ├── _seo.js           #   Ortak: slug, kaynak temizleme, zengin metin, JSON-LD, SSR iskeleti (private)
│   ├── _content-db.js    #   Ortak: içerik tablosu, slug tamamlama, yayın listeleme (private)
│   ├── _pinterest.js     #   Ortak: Pinterest pin gövdesi + gönderim boru hattı (private)
│   ├── _ai-blog.js       #   Ortak: haber URL'sinden içerik çıkarma ve 4 dilde AI blog üretimi (private)
│   ├── ai-blog.js        #   POST /api/ai-blog — haber linkinden otomatik blog taslağı üretir
│   ├── login.js          #   POST /api/login — admin girişi (IP bazlı rate limit)
│   ├── session.js        #   GET  /api/session — oturum durumu
│   ├── stats.js          #   GET|POST /api/stats — sayfa görüntüleme sayacı
│   ├── content.js        #   Blog & tarif içerik yönetimi (CRUD) — slug üretir, kaynakça temizler, Pinterest tetikler
│   ├── seo.js            #   /blog/, /blog/<slug>/, /blog/rss.xml, /sitemap.xml, /forum/t/<id>/ yönlendiricisi
│   ├── _blog-page.js      #   Blog arşivi + yazı üreticisi (private)
│   ├── _sitemap.js        #   Dinamik site haritası (private)
│   ├── _blog-rss.js       #   RSS 2.0 akışı (private)
│   ├── _forum-page.js     #   Konuların kalıcı, aranabilir sayfası (private)
│   ├── _forum-stats.js    #   Topluluk nabzı toplayıcısı (private; /api/forum?stats=1)
│   └── media/            #   Görsel yükleme ve sunma (/api/media/<id>)
├── tools/
│   ├── build.mjs                     # src/ → yayın dosyaları (CSS/JS küçültme + hash)
│   ├── analysis-pages.template.html  # Semptom + kan testi ekranlarının şablonu
│   └── build-analysis-pages.mjs      # Form satırlarını referans aralıklarından üretir
├── forum/                # Etkileşimli topluluk (Meydan): index.html, style.css, forum.js, forum-core.js
├── tests/                # node --test testleri (validation, content, media, build, SEO)
├── vercel.json           # Güvenlik başlıkları + önbellek politikası + SEO yönlendirmeleri
├── .vercelignore         # Kaynak/test dosyaları yayına gönderilmez
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
| `SITE_URL` | Yayındaki kök adres, ör. `https://testosteron-test.vercel.app` (opsiyonel) |
| `BLOG_SITE_URL` | Blog ayrı bir alt alan adında yayınlanacaksa kök adres, ör. `https://blog.testotavan.com` (opsiyonel) |
| `FORUM_SITE_URL` | Forum ayrı bir alt alan adında yayınlanacaksa kök adres, ör. `https://forum.testotavan.com` (opsiyonel) |
| `ENABLE_MACHINE_TRANSLATION` | `0` ise AI çevirisi eksik kaldığında yedek çeviri servisi çağrılmaz (opsiyonel) |
| `GEMINI_API_KEY` | Google Gemini API anahtarı — haberden otomatik blog üretimi ve tam çeviri için (opsiyonel) |
| `GEMINI_MODEL` | Gemini model kimliği (opsiyonel; varsayılan `gemini-3.8-flash`; kapatılmış 1.x/2.0 modelleri otomatik güncel modele taşınır) |
| `OPENAI_API_KEY` | OpenAI API anahtarı — alternatif AI sağlayıcısı (opsiyonel) |
| `OPENAI_MODEL` | OpenAI model kimliği (opsiyonel; varsayılan `gpt-4o-mini`) |
| `GROQ_API_KEY` | Groq API anahtarı — alternatif AI sağlayıcısı (opsiyonel) |
| `GROQ_MODEL` | Groq model kimliği (opsiyonel; varsayılan `openai/gpt-oss-120b`; kapatılmış eski model ayarları otomatik güncel modele taşınır) |
| `ANTHROPIC_API_KEY` (`CLAUDE_API_KEY`) | Claude API anahtarı (opsiyonel) |
| `CLAUDE_MODEL` (`ANTHROPIC_MODEL`) | Claude model kimliği (opsiyonel; varsayılan `claude-sonnet-4-5`) |
| `MOONSHOT_API_KEY` (`KIMI_API_KEY`) | Kimi / Moonshot API anahtarı (opsiyonel) |
| `KIMI_MODEL` (`MOONSHOT_MODEL`) | Kimi model kimliği (opsiyonel; varsayılan `moonshot-v1-8k`) |
| `DEEPSEEK_API_KEY` | DeepSeek API anahtarı (opsiyonel) |
| `DEEPSEEK_MODEL` | DeepSeek model kimliği (opsiyonel; varsayılan `deepseek-chat`) |
| `AI_API_KEY` / `AI_MODEL` | Sağlayıcıya özel anahtar yoksa genel yedek anahtar/model (opsiyonel) |

> Not: `ADMIN_PASSWORD` / `SESSION_SECRET` tanımlı değilse giriş API'si `503` döner; `DATABASE_URL` yoksa istatistik ve içerik servisleri devre dışı kalır (site çalışmaya devam eder).
> Pinterest değişkenleri tanımlı değilse site ve yayın akışı normal çalışır; yalnızca pin adımı atlanır.
> `SITE_URL` boşsa Vercel'in `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` değerleri, o da yoksa istek başlıkları kullanılır.

### Google'da dizine ekleme

Site haritası `/sitemap.xml` ve tarama kuralları `/robots.txt` adreslerinde yayınlanır; harita her istekte
veritabanından üretilir (yazılar, tarifler ve onaylı forum konuları). Canonical, Open Graph ve yapılandırılmış
veri Vercel'deki canlı adres `https://testosteron-test.vercel.app` ile eşleştirilmiştir (`tests/seo.test.mjs`
denetler). Başka bir özel alan adı kullanıyorsanız `SITE_URL` değişkenini, `robots.txt` içindeki sitemap
adresini ve statik HTML dosyalarındaki canonical/OG adreslerini yeni alan adına göre güncelleyin.

**Blog/forum alt alan adı (opsiyonel):** `BLOG_SITE_URL` ve/veya `FORUM_SITE_URL` tanımlandığında sunucu
tarafında üretilen sayfalar canonical ve site haritası bağlantılarını bu köklere taşır (blog yazıları
`https://blog.<alan>/<slug>/`, konular `https://forum.<alan>/t/<id>/`). Alt alan adlarını Vercel'e ekleyip
gerekli yeniden yazma kurallarını tanımladıktan sonra bu değişkenleri açın; tanımlanmazsa her şey
`/blog/` ve `/forum/` yolları altında, aynı SEO gücüyle çalışır.

**Search Console mülkü:** Mülk türü olarak **URL öneki** seçin ve `https://testosteron-test.vercel.app/` girin. İki doğrulama yöntemi zaten yayında:

- **HTML etiketi** — `src/index.html` `<head>` bölümündeki `google-site-verification` meta etiketleri
- **HTML dosyası** — kök dizindeki `google5ef2fba9d6d13dcc.html`

Doğrulamadan sonra bu etiketleri ve dosyayı silmeyin; Google sahipliği belirli aralıklarla yeniden denetler (`npm test` silinmelerini engeller). **Alan adı** mülkü yalnızca DNS TXT kaydıyla (`google-site-verification=...`) doğrulanır. `*.vercel.app` alt alan adlarının DNS'i Vercel'e ait olduğundan bu yöntem ancak kendi alan adınızı bağladığınızda kullanılabilir.

Doğrulamadan sonra `/sitemap.xml` haritasını gönderin ve URL Denetimi'nden ana sayfa için dizine ekleme isteyin. Kod tarafındaki ayarlar Google'ın taramasını kolaylaştırır; Google'ın dizine ekleme ve sonuçlarda gösterme kararı/zamanı garanti edilemez.

### Run Locally

Statik sayfaları doğrudan açabilirsiniz; API'ler için [Vercel CLI](https://vercel.com/docs/cli) önerilir:

```bash
npx vercel dev
```

### Test

```bash
npm test
```

`tests/sponsors.test.mjs`; sağ/sol sponsor raylarının sayfa gövdesinde olduğunu (dar ekranda şerit,
geniş ekranda yan sütun), sponsor kartlarının tek listeden üretildiğini, harici sponsor bağlantılarının
`rel="noopener nofollow sponsored"` taşıdığını, iletişim bağlantılarının cihaza göre yazma ekranını
(mobilde `mailto:`, masaüstünde Gmail "Yeni ileti") testotavan@gmail.com alıcısıyla açtığını ve
kilitli/bulanık plan önizlemesinin kaldırılıp kişisel planın doğrudan gösterildiğini denetler.


## ⚡ PageSpeed yaklaşımı

- **Logo 1,73 MB → 6 KB.** Arayüzdeki logo 256 px WebP (`assets/logo.webp`), favicon/apple-touch-icon
  192 px PNG (`assets/logo.png`). WebP desteklemeyen tarayıcılar `onerror` ile PNG'ye düşer.
  1024 px kaynak `assets/logo-source.png` olarak durur; yeni boyut üretmek için:
  `convert assets/logo-source.png -resize 256x256 -strip -quality 92 assets/logo.webp`
- İlk ekranda üçüncü taraf font veya ikon paketi çağrılmaz; sistem fontları ve satır içi SVG ikonlar kullanılır.
- CSS satır içi kalır (ek istek yok) ve derlemede küçültülür; JS paketleri yorum/boşluk temizlenerek küçültülür.
- Blog, içerik API çağrıları ve çeviri verisi yalnızca Blog sekmesi veya dil seçici kullanıldığında yüklenir.
- Sponsor alanları ek istek yapmaz: içerik sayfayla birlikte gelir, kartlar `app` paketi içinde üretilir;
  geniş ekranda yan sütunlar CSS `sticky` ile sabitlenir, mobilde yatay kaydırılır (JS çalıştırılmaz).
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
  "link": "https://testosteron-test.vercel.app/?icerik=content-1760000000000-ab12cd34",
  "alt_text": "Sabah Rutininin Testosterona Etkisi — Hormon Sağlığı",
  "media_source": {
    "source_type": "image_url",
    "url": "https://testosteron-test.vercel.app/api/media/media-1760000000000-ab12cd34"
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
| `/api/ai-blog` | `POST` | Haber bağlantısından (URL) veri çekip 4 dilde (TR/EN/DE/JA) blog taslağı üretir; `mode: "translate"` ile mevcut Türkçe alanları eksiksiz çevirir (admin yetkisi ister) |
| `/api/forum` | `GET` / `POST` / `PATCH` / `DELETE` | Topluluk forumu. Okuma herkese açık; konu, yanıt, alıntı, beğeni ve 30 dakikalık düzenleme forum hesabı ister. Moderasyon (onay, kilit, sabitleme, silme) admin oturumu ister. Detay görüntülemesi `?view=1` ile sayılır |
| `/api/forum-auth` | `GET` / `POST` | Forum kaydı, girişi, oturumu ve çıkışı. Şifre scrypt ile saklanır; oturum çerezi 14 gün |
| `/api/media` | `POST` | Base64 görsel yükleme (admin yetkisi ister) |
| `/api/forum-stats` | `GET` | Meydan nabzı: konu, yanıt, üye ve görüntülenme toplamları; kategori dağılımı, öne çıkan konular, en aktif yazarlar, son konular (`recent`, başlık + tarih + yanıt sayısı). `/api/forum?stats=1` adresine yönlenir (60 sn CDN önbelleği) |
| `/api/media/:id` | `GET` / `DELETE` | Yüklenen görseli sunar / siler |
| `/blog/`, `/blog/<slug>/` | `GET` | Blog arşivi ve her yazının kalıcı SEO sayfası (sunucu tarafında HTML) |
| `/forum/t/<id>/` | `GET` | Forum konusunun kalıcı, JavaScript'siz okunabilen sayfası |
| `/sitemap.xml` | `GET` | Dinamik site haritası (yazılar + tarifler + onaylı konular) |
| `/blog/rss.xml` | `GET` | RSS 2.0 akışı |

## ⚠️ Disclaimer

TestoTavan is not a medical device or diagnostic tool. The results are for informational purposes only and do not replace professional medical advice. You should always consult a physician regarding health-related products.

---

© TestoTavan

## 📰 Blog ve Meydan mimarisi

Blog ve forum, ana SPA'nın içinde kaybolan sekmeler değil; **kendi keşif yüzeyi olan iki ayrı bölüm**:

| Yüzey | Adres | Üretim | SEO çıktısı |
| --- | --- | --- | --- |
| Arşiv | `/blog/` | `api/_blog-page.js` → `renderBlogHub` | canonical, kategori filtreleri, `ItemList` + `Blog` JSON-LD, RSS bağlantısı |
| Yazı | `/blog/<slug>/` | `api/_blog-page.js` → `renderBlogPost` | canonical, TR/EN/DE/JA hreflang, `BlogPosting` + `BreadcrumbList` + `FAQPage`, Open Graph/Twitter, içindekiler, ilgili yazılar, paylaşım |
| Tarif | `/blog/<slug>/` | aynı | `Recipe` JSON-LD (malzeme, adım, süre) |
| Forum | `/forum/` | `forum/index.html` + `/api/forum` + `/api/forum-stats` | canonical, `Organization` + `DiscussionForumPosting`, canlı istatistik şeridi, arama/kategori/sıralama |
| Konu | `/forum/t/<id>/` | `api/_forum-page.js` | canonical, `DiscussionForumPosting` + `BreadcrumbList`, yazar rütbesi, benzer konular |

**Kaynakça kuralı:** yazı ister AI ile ister elle üretilsin, `Kaynak:`, `Kaynakça`, `Referanslar`,
çıplak URL ve atıf listesi satırları `api/_seo.js → stripSourceReferences` ile hem kayıt sırasında
(`api/content.js`) hem sayfa üretiminde ayıklanır. Dört dilde de aynı kural geçerlidir; AI istemi
kaynak yazmayı açıkça yasaklar ve kalite kapısı ihlali "kaynakça/atıf satırı içeriyor" olarak işaretler.

**Slug yaşam döngüsü:** `content.slug` ilk yayında üretilir ve bir daha değişmez. Eski kayıtlar ilk
istekte tamamlanır; `/blog/content-<id>` gibi kimlik tabanlı eski bağlantılar da çalışmaya devam eder.
Yeni bir yazı yayınlandığında admin paneli doğrudan canlı adresi gösterir.

**Blog üretim hattı:** `api/_ai-blog.js`
1. Kaynak URL güvenli biçimde okunur (`validateNewsUrl`, SSRF/özel ağ koruması).
2. Türkçe ana taslak üretilir; `assessBlogDraft` kelime sayısı, başlık/özet sınırı, bölüm yapısı,
   SSS varlığı, kaynak/URL ihlali ve başlık uzunluğunu puanlar. Düşük puanda **ikinci bir yazım turu**
   aynı sorun listesiyle çalışır (`qualityRetry`, varsayılan açık).
3. Yedek modda (AI yokken) gövdeye `## Günlük Hayata Çeviri`, `## Sık Sorulan Sorular`,
   `TestoTavan Değerlendirmesi` bölümleri eklenir; SSS dört dilde yerelleştirilir.
4. EN/DE/JA bağımsız çeviri turlarından geçer; her dil kalite kapısıyla denetlenir.

**Testler:** `tests/blog-pages.test.mjs` üreticileri, `tests/blog-routing.test.mjs` HTTP davranışını,
`tests/seo.test.mjs` site haritası/RSS/robots/`vercel.json` sözleşmesini, `tests/forum-stats.test.mjs`
nabız ucunu doğrular.

## Topluluk forumu

- `/forum/`: konular herkese açıktır. Konu açmak ve yanıt yazmak için **Giriş yap** veya **Kayıt ol**
  gerekir. Kullanıcı adı paylaşımlarda görünür; istemcinin gönderdiği yazar adı yok sayılır.
  Şifreler düz metin saklanmaz (scrypt). Oturum `HttpOnly` çerezle 14 gün sürer.
- Admin panelindeki **Forum yönetimini aç** bağlantısı `/forum/?manage=1` sayfasını açar.
  Mevcut admin oturumu zorunludur. Bekleyen konuları/yanıtları onaylama, konu
  kilitleme/kilidi açma, konu sabitleme (pin) ve kalıcı silme desteklenir. Konu silinince
  yanıtları ve beğenileri de silinir. Konu kartlarında bekleyen yanıt sayısı gösterilir;
  yanıtları incelemek için konuyu açın.
- Tüm yeni gönderiler onay bekler; ziyaretçiler bekleyen içerikleri göremez.
  Sayfalar 30 konu / 50 yanıtla sınırlıdır ve önceki/sonraki kontrolleri vardır.
- **Beğeni:** Konu ve yanıtlar beğenilebilir. Tek kişi–tek mesaj kaydı `forum_likes`
  tablosunda benzersiz indeksle korunur; aynı uç nokta aç/kapa olarak çalışır ve güncel
  sayıyı döner. Okuma herkese açıktır, beğenmek için forum hesabı gerekir
  (`POST /api/forum` + `{ action: "like", kind, id }`). Hızlı tıklamaya karşı kullanıcı
  başına saniyede bir istek sınırı vardır.
- **Alıntı:** Yanıt, aynı konudaki **onaylı** bir yanıtı alıntılayabilir (`quoteId`).
  Alıntı; kaynak kimliği, gönderim anındaki yazar adı ve 240 karakterlik tek satır özet
  (`quote_id`, `quote_author`, `quote_excerpt`) olarak saklanır. Böylece kaynak mesaj
  silinse veya düzenlense bile alıntı okunur kalır; alıntı bloğu kaynak mesaja atlar.
- **Görüntülenme:** Konu detayı istemci tarafından `?view=1` ile yalnızca tarayıcı oturumu
  başına bir kez sayılır. Onaysız konular ve yönetim görünümü sayacı değiştirmez.
  Liste ve detay yanıtları `view_count`, `likes`, `liked`, `mine` alanlarını içerir.
- **Düzenleme:** Yazar kendi konusunu veya yanıtını ilk **30 dakika** içinde düzenleyebilir
  (`POST /api/forum` + `{ action: "edit", kind, id, body }`). Sahiplik ve süre tek SQL
  ifadesinde doğrulanır (`user_id` + `created_at > NOW() - make_interval(...)`); süre
  dolduğunda 403 döner ve `edited_at` işaretlenir. Düzenleme yeni bir onay turu başlatmaz,
  bu yüzden pencere 30 dakikayla sınırlıdır. Saniyede bir düzenleme sınırı uygulanır.
- **Üye rütbeleri:** Yazar panelinde onaylı mesaj sayısına göre rütbe (Yeni üye / Üye /
  Aktif üye / Kıdemli üye), mesaj sayısı ve yanıtlarda **Konu sahibi** rozeti gösterilir.
  Sayım tek sorguda, konudaki yazarlar için yapılır; kullanıcı kimliği (UUID) yanıtlarda
  paylaşılmaz, yalnızca `mine` alanı döner.
- **Kalıcı bağlantı:** Her konunun JavaScript'siz okunabilen bir sayfası vardır:
  `/forum/t/<uuid>/` (canonical, `DiscussionForumPosting`). Uygulama içinde konular
  `/forum/#thread=<uuid>&reply=<uuid>` ile de açılır ve `?thread=<uuid>` okunur; kopyala
  düğmesi her zaman `/forum/t/<uuid>/` adresini (yanıtta `#reply-<uuid>` çapasıyla) panoya
  yazar. Konu başlıkları gerçek `<a href="/forum/t/...">` bağlantısıdır; JavaScript açıkken
  sayfa içinde açılır, kapalıyken kalıcı sayfaya gider.
- **Meydan nabzı ve filtreler:** `/api/forum-stats` konu/yanıt/üye/görüntülenme toplamlarını,
  kategori dağılımını, öne çıkan konuları, en aktif yazarları ve son altı konuyu (`recent`)
  60 saniyelik CDN önbelleğiyle döner. Arayüzde arama (debounce'lu, `q`, üst çubukta),
  kategori çipleri ve `new | top | active | unanswered` sıralaması sunucu tarafında uygulanır;
  sayfalama 30 konudur.
- **Tahta düzeni:** Konu listesi kart değil, Donanım Arşivi mantığında sabit kolonlu bir tahtadır:
  `# · Konu · Forum · Cevap · Hit · Gönderim · Son yazan`. Bölüm sekmeleri (Yeni mesajlar /
  Sıcak konular / En çok yanıt / Yanıtsız) ve kolon başlıkları aynı sıralama durumunu paylaşır;
  seçili sekme altı çizili turkuaz vurgu alır. `Son yazan` kolonu listenin SQL'inde
  `LEFT JOIN LATERAL` ile çözülen en güncel onaylı yanıtı gösterir. Sağ rayda **Yeni Konu Aç**
  düğmesi, **En Son İçerikler** paneli (`recent`, başlık + `YYYY-AA-GG ss:dd`), topluluk nabzı,
  öne çıkan yazarlar ve kurallar bulunur. 700 px altında satırlar yatay kaydırma yerine
  iki kolona (konu + mobil özet) iner.
- Mevcut `DATABASE_URL` (Neon PostgreSQL), `SESSION_SECRET` ve admin girişi için
  `ADMIN_PASSWORD` ortam değişkenlerini kullanır. İlk API isteği `forum_threads`,
  `forum_replies`, `forum_limits`, `forum_users`, `forum_sessions` ve `forum_likes`
  tablolarını otomatik oluşturur; yeni alanlar (`view_count`, `pinned`, `edited_at`,
  `quote_id`, `quote_author`, `quote_excerpt`) `ALTER TABLE ... IF NOT EXISTS` ile eklenir.
  Elle migrasyon veya ek paket gerekmez; DB kullanıcısının CREATE/ALTER yetkisi gerekir.
- Hesabın HMAC özetiyle DB üzerinde 30 saniyede bir gönderi sınırı uygulanır;
  ham IP saklanmaz. Giriş denemeleri 15 dakikada IP başına 10, kayıt denemeleri saatte 8 ile sınırlıdır.
  Eski hız sınırı kayıtları sonraki gönderimlerde 24 saat sonra temizlenir.
  Ters proxy `x-forwarded-for` başlığını güvenilir şekilde sağlamalıdır (Vercel dağıtımı).
  Yoğun trafik için ayrıca platform/WAF hız sınırı önerilir.
- Paylaşımlar düz metin olarak kaçışlanarak gösterilir. JSON yazma istekleri ve
  cross-site istek kontrolü kullanılır; moderasyon sunucuda admin yetkisi gerektirir.
- Yerelde `npm test` ve `npm run check:assets` çalıştırın. `tests/forum-features.test.mjs`
  beğeni, alıntı, düzenleme, sabitleme, görüntülenme ve rütbe kurallarını; `tests/forum.test.mjs`
  mevcut akışları sahte SQL bağdaştırıcısıyla sınar. `forum/forum-core.js` DOM'suz saf
  yardımcıları ve dört dilli sözlüğü taşıdığı için doğrudan Node ile test edilir; tarayıcı
  tarafı `tests/forum-features.test.mjs` içinde dosya düzeyinde doğrulanır.
  Gerçek ortamda iki ayrı tarayıcı oturumuyla konu gönder → adminde onayla → ziyaretçide
  görüntüle → yanıt gönder/onayla → alıntıla → beğen → kilitle (yanıt gönderilememeli) →
  sil akışını doğrulayın.

### Çerez onayı ve sıfırdan başlayan tekil ziyaret sayacı

- Ana sayfada **Çerezleri kabul et / Reddet** tercihi sunulur. Alt kısımdaki **Çerez tercihleri** düğmesiyle tercih değiştirilebilir.
- Onay öncesinde ve reddedildiğinde `/api/stats` yalnızca `GET` ile okunur; ziyaretçi kaydı oluşturulmaz. Ret tercihi de hatırlanır.
- Onay sonrasında rastgele UUID içeren `testotavan_visitor_v1` çerezi kullanılır. Tercih ve kimlik çerezleri 1 yıl geçerlidir (`Path=/`, `SameSite=Lax`, HTTPS üzerinde `Secure`). Çerezler engelliyse veya kimlik üretilemiyorsa ziyaret kaydı yapılmaz.
- Sunucu kimliği `site_unique_visitors_v1` tablosuna birincil anahtar olarak ekler. `ON CONFLICT DO NOTHING` sayesinde aynı kimlikle yenileme, yeniden giriş, blog geçişi ve paralel istekler sayacı artırmaz. IP adresi veya tarayıcı parmak izi kaydedilmez.
- **Sıfırlama dağıtımda devreye girer:** Eski `site_stats.page_views` toplamı artık okunmaz; yeni boş tekil ziyaretçi tablosuyla sayaç sıfırdan başlar. Eski veriler silinmez. Sonraki dağıtımlarda veya uygulama yeniden başlatıldığında yeni sayaç korunur. İlk onaylı ziyaretçiyle sayı 1 olur.
- Bu değişiklik yerel kodu hazırlar; canlı veritabanında doğrudan bir işlem yapmaz. Yeni sürüm yayınlandığında, mevcut `DATABASE_URL` ile tablo otomatik oluşturulur. Servis hataları 0 gibi gösterilmez.
- Bu bir kişi sayacı değil, **onay veren tarayıcı kimliği sayacıdır**. Çerezlerin silinmesi/süresinin dolması, gizli pencere, farklı cihaz veya tercihin geri çekilip yeniden onaylanması yeni kimlikle tekrar sayılmaya neden olabilir.


## Hakkımda / Hakkımızda yönetimi

`/admin/` panelinde **Hakkımda / Hakkımızda → Hakkımızda bilgilerini düzenle** alanı bulunur.
Sayfa başlığı ve tanıtımı, misyon, bilimsel kaynaklar açıklaması, ekip adı/unvanı,
tıbbi sorumluluk reddi ve gizlilik metni buradan düzenlenebilir. Bilimsel referans
kartları bu editör kapsamında değildir.

- Türkçe alanlar zorunludur. EN, DE ve JA çevirileri isteğe bağlıdır; boş çeviride
  mevcut arayüz çevirisi veya Türkçe metin gösterilir.
- `GET /api/about` mevcut metinleri ve alan tanımlarını döndürür.
- `PUT /api/about` mevcut admin oturumunu, JSON içerik türünü ve
  `X-Testotavan-About: 1` başlığını gerektirir; çapraz site yazmaları reddedilir.
- Mevcut `DATABASE_URL` kullanılır. `site_about` tablosu ilk istekte otomatik
  oluşturulur; sonraki dağıtımlarda kaydedilen metinler korunur. Yeni ortam
  değişkeni veya elle veri taşıma işlemi gerekmez.
- İlk kayda kadar mevcut sayfa metinleri kullanılır. API erişilemezse sitedeki
  mevcut metin korunur, admin paneli yükleme/kayıt hatasını gösterir.
- İçerik düz metindir; HTML/JavaScript çalıştırılmaz, satır sonları korunur.

Kontroller: `npm test`, `npm run build:assets`, `npm run check:assets`.
