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

- **İki analiz yöntemi**
  - **Fiziksel Analiz** — yaş, boy, kilo ve semptom bazlı değerlendirme
  - **Kan Testi Analizi** — total/serbest testosteron, kortizol, SHBG, D vitamini, B12, çinko ve magnezyum değerleriyle (opsiyonel alanlar)
- **Anlık sonuç raporu** ve doğal artırma önerileri
- **Blog & Tarifler** — admin panelinden yönetilen içerikler (blog yazıları ve tarifler; kategori, malzeme listesi, kapak görseli)
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

```
├── index.html            # Ana SPA (analiz, blog, tarifler, hakkında)
├── admin/index.html      # Yönetim paneli (v2: görsel yükleme + kategori)
├── js/
│   └── validation.js     # Ortak girdi doğrulama (tarayıcı + Node testleri)
├── api/                  # Vercel serverless functions
│   ├── _auth.js          #   Ortak: oturum cookie'si, şifre doğrulama (private)
│   ├── _media.js         #   Ortak: görsel yükleme / URL doğrulama (private)
│   ├── login.js          #   POST /api/login — admin girişi (IP bazlı rate limit)
│   ├── session.js        #   GET  /api/session — oturum durumu
│   ├── stats.js          #   GET|POST /api/stats — sayfa görüntüleme sayacı
│   ├── content.js        #   Blog & tarif içerik yönetimi (CRUD)
│   └── media/            #   Görsel yükleme ve sunma (/api/media/<id>)
├── tests/                # node --test testleri (validation, media)
├── vercel.json           # Güvenlik başlıkları
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
