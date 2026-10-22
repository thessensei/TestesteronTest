// Hakkımızda editörünün izin verilen alanları ve ilk açılış değerleri.
import { SOURCE_LANG, TARGET_LANGS } from './_langs.js';

export const ABOUT_LANGUAGES = [SOURCE_LANG, ...TARGET_LANGS];
export const ABOUT_FIELDS = [
  {
    "key": "title",
    "label": "Sayfa başlığı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "intro",
    "label": "Sayfa alt açıklaması",
    "maxLength": 1000,
    "multiline": true
  },
  {
    "key": "brand",
    "label": "Proje adı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "description",
    "label": "Proje tanıtımı",
    "maxLength": 5000,
    "multiline": true
  },
  {
    "key": "missionTitle",
    "label": "Misyon başlığı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "missionSubtitle",
    "label": "Misyon alt başlığı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "mission",
    "label": "Misyon metni",
    "maxLength": 10000,
    "multiline": true
  },
  {
    "key": "sourcesIntro",
    "label": "Bilimsel kaynaklar açıklaması",
    "maxLength": 3000,
    "multiline": true
  },
  {
    "key": "teamTitle",
    "label": "Ekip başlığı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "teamSubtitle",
    "label": "Ekip alt başlığı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "name",
    "label": "Geliştirici adı",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "role",
    "label": "Görev / unvan",
    "maxLength": 200,
    "multiline": false
  },
  {
    "key": "disclaimer",
    "label": "Tıbbi sorumluluk reddi metni",
    "maxLength": 10000,
    "multiline": true
  },
  {
    "key": "privacy",
    "label": "Gizlilik ve veri güvenliği metni",
    "maxLength": 10000,
    "multiline": true
  }
];
export const ABOUT_DEFAULTS = {
  "title": "Hakkımızda",
  "intro": "TestoTavan projesi, yaklaşımımız ve bilimsel kaynaklar",
  "brand": "TestoTavan",
  "description": "Doğal testosteron optimizasyonu için bilimsel veriye dayalı, kişiselleştirilmiş takviye ve beslenme rehberi.",
  "missionTitle": "Misyonumuz",
  "missionSubtitle": "Ne yapıyoruz?",
  "mission": "Erkek sağlığı alanında doğru bilgiye ulaşmak her geçen gün zorlaşıyor. TestoTavan, bilimsel araştırmalara dayalı olarak kişiselleştirilmiş doğal takviye ve beslenme önerileri sunar.",
  "sourcesIntro": "Tüm takviye önerilerimiz peer-reviewed (hakemli) bilimsel makalelere dayanmaktadır.",
  "teamTitle": "Ekip",
  "teamSubtitle": "Geliştirici",
  "name": "The Sensei",
  "role": "Kurucu & Geliştirici",
  "disclaimer": "TestoTavan bir tıbbi cihaz, teşhis aracı veya tedavi yöntemi değildir. Herhangi bir takviyeye başlamadan önce mutlaka bir sağlık profesyoneline danışın. Bu platform sadece bilgilendirme amaçlıdır.",
  "privacy": "Girdiğiniz hiçbir veri kaydedilmez veya sunucuya gönderilmez. Tüm hesaplamalar tarayıcınızda anlık olarak yapılır. Verileriniz sadece sizde kalır."
};

export function normalizeAbout(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçerli bir içerik gönderin.');
  const content = {};
  for (const lang of ABOUT_LANGUAGES) {
    content[lang] = {};
    for (const field of ABOUT_FIELDS) {
      const value = input[lang]?.[field.key] ?? '';
      if (typeof value !== 'string') throw new Error(`${field.label}: metin girin.`);
      const text = value.trim();
      if (lang === 'tr' && !text) throw new Error(`${field.label}: Türkçe alanı zorunludur.`);
      if (text.length > field.maxLength) throw new Error(`${field.label}: en fazla ${field.maxLength} karakter girin.`);
      content[lang][field.key] = text;
    }
  }
  return content;
}
