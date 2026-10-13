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
![Testler](https://img.shields.io/badge/testler-27%20ge%C3%A7ti-brightgreen)
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
│   ├── login.js          #   POST /api/login — admin girişi (IP bazlı rate limit)
│   ├── session.js        #   GET  /api/session — oturum durumu
│   ├── stats.js          #   GET|POST /api/stats — sayfa görüntüleme sayacı
│   ├── content.js        #   Blog & tarif içerik yönetimi (CRUD)
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
| `ADMIN_PASSWORD` | Admin paneli şifresi |
| `SESSION_SECRET` | Oturum cookie imzası için gizli anahtar |

> Not: `ADMIN_PASSWORD` / `SESSION_SECRET` tanımlı değilse giriş API'si `503` döner; `DATABASE_URL` yoksa istatistik ve içerik servisleri devre dışı kalır (site çalışmaya devam eder).

### Run Locally

Statik sayfaları doğrudan açabilirsiniz; API'ler için [Vercel CLI](https://vercel.com/docs/cli) önerilir:

```bash
npx vercel dev
```

### Test

```bash
npm test
```
%% Generated by https://gitdiagram.com/thessensei/testesterontest
flowchart TD

subgraph group_analysis["Health Analysis"]
  node_site["Analysis Interface<br/>[index.html]"]
  node_app["Analysis Flow<br/>[app.js]"]
  node_validation["Lab Validation<br/>[validation.js]"]
  node_pdf["Report Reader<br/>[app.js]"]
  node_report["Results &amp; Guidance<br/>[app.js]"]
end

subgraph group_content["Content Experience"]
  node_contentui["Blog &amp; Recipes<br/>[content.js]"]
  node_translations["Language Support<br/>[content.js]"]
end

subgraph group_admin["Administration"]
  node_adminui["Admin Panel<br/>[index.html]"]
end

subgraph group_services["Backend Services"]
  node_login["Admin Login<br/>[login.js]"]
  node_session["Session Check<br/>[session.js]"]
  node_auth["Session &amp; Auth<br/>[_auth.js]"]
  node_contentapi["Content API<br/>[content.js]"]
  node_shaping["Content Shaping<br/>[_content-shape.js]"]
  node_mediaapi["Media Upload API<br/>[index.js]"]
  node_mediaread["Media Serving<br/>[&#91;id&#93;.js]"]
  node_mediahelpers["Media Validation<br/>[_media.js]"]
  node_stats["View Statistics<br/>[stats.js]"]
end

node_visitor(("Visitor"))
node_database[("Neon Postgres")]

node_visitor -->|"opens"| node_site
node_site -->|"hosts"| node_app
node_app -->|"validates with"| node_validation
node_app -->|"reads locally"| node_pdf
node_pdf -->|"fills form"| node_app
node_app -->|"renders"| node_report
node_visitor -->|"opens"| node_adminui
node_adminui -.->|"authenticates via"| node_login
node_adminui -.->|"checks session"| node_session
node_login -->|"creates session"| node_auth
node_session -->|"checks session"| node_auth
node_adminui -.->|"manages content"| node_contentapi
node_contentapi -->|"checks admin"| node_auth
node_contentapi -->|"cleans fields"| node_shaping
node_contentapi -->|"validates cover"| node_mediahelpers
node_contentapi -->|"reads and writes"| node_database
node_adminui -.->|"uploads images"| node_mediaapi
node_mediaapi -->|"checks admin"| node_auth
node_mediaapi -->|"validates upload"| node_mediahelpers
node_mediaapi -->|"stores image"| node_database
node_mediaread -.->|"serves image"| node_database
node_visitor -->|"browses"| node_contentui
node_contentui -->|"translates interface"| node_translations
node_contentui -.->|"loads content"| node_contentapi
node_visitor -.->|"generates views"| node_stats
node_stats -.->|"updates counter"| node_database

click node_site "https://github.com/thessensei/testesterontest/blob/main/src/index.html"
click node_app "https://github.com/thessensei/testesterontest/blob/main/src/js/app.js"
click node_validation "https://github.com/thessensei/testesterontest/blob/main/src/js/validation.js"
click node_pdf "https://github.com/thessensei/testesterontest/blob/main/src/js/app.js"
click node_report "https://github.com/thessensei/testesterontest/blob/main/src/js/app.js"
click node_contentui "https://github.com/thessensei/testesterontest/blob/main/src/js/content.js"
click node_translations "https://github.com/thessensei/testesterontest/blob/main/src/js/content.js"
click node_adminui "https://github.com/thessensei/testesterontest/blob/main/admin/index.html"
click node_login "https://github.com/thessensei/testesterontest/blob/main/api/login.js"
click node_session "https://github.com/thessensei/testesterontest/blob/main/api/session.js"
click node_auth "https://github.com/thessensei/testesterontest/blob/main/api/_auth.js"
click node_contentapi "https://github.com/thessensei/testesterontest/blob/main/api/content.js"
click node_shaping "https://github.com/thessensei/testesterontest/blob/main/api/_content-shape.js"
click node_mediaapi "https://github.com/thessensei/testesterontest/blob/main/api/media/index.js"
click node_mediaread "https://github.com/thessensei/testesterontest/blob/main/api/media/%5Bid%5D.js"
click node_mediahelpers "https://github.com/thessensei/testesterontest/blob/main/api/_media.js"
click node_stats "https://github.com/thessensei/testesterontest/blob/main/api/stats.js"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_site,node_app,node_validation,node_pdf,node_report toneBlue
class node_contentui,node_translations,node_database toneAmber
class node_adminui toneMint
class node_login,node_session,node_auth,node_contentapi,node_shaping,node_mediaapi,node_mediaread,node_mediahelpers,node_stats toneRose
class node_visitor toneIndigo

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

## 📡 API Overview

| Endpoint | Metod | Açıklama |
| --- | --- | --- |
| `/api/login` | `POST` | Admin girişi; 15 dk içinde IP başına en fazla 10 deneme |
| `/api/session` | `GET` | Oturumun doğrulanmış mı olduğunu döner |
| `/api/stats` | `GET` / `POST` | Sayfa görüntüleme sayacını okur / artırır |
| `/api/content` | `GET` / `POST` / … | Blog ve tarif içerikleri (yazma işlemleri admin yetkisi ister) |
| `/api/media` | `POST` | Base64 görsel yükleme (admin yetkisi ister) |
| `/api/media/:id` | `GET` / `DELETE` | Yüklenen görseli sunar / siler |

## ⚠️ Disclaimer

TestoTavan is not a medical device or diagnostic tool. The results are for informational purposes only and do not replace professional medical advice. You should always consult a physician regarding health-related products.

---

© TestoTavan
