/* Sürümle birlikte gelen, kaynakları açık rehberler. Veritabanına yazılmaz.
 * Tarih içerik gözden geçirme tarihidir; kaynakların yayın tarihi ayrıca belirtilir.
 * Yeni rehber eklerken TR/EN metin, kaynak URL'si ve gözden geçirme tarihini güncelleyin.
 */
const EAU = 'https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-hypogonadism';
const FDA = 'https://www.fda.gov/drugs/drug-alerts-and-statements/fda-issues-class-wide-labeling-changes-testosterone-products';
export const REVIEWED_AT = '2026-10-23';

export const EDITORIAL_POSTS = [
  {
    slug: 'testosteron-testi-2026-dogru-olcum', category: 'Test ve tanı', emoji: '🔬',
    title: 'Testosteron testi: 2026 rehberinde doğru ölçüm ve tekrar test',
    summary: 'Tek sonuç veya semptom puanı tanı değildir. Sabah ölçümü, tekrar test ve hekim değerlendirmesinin neden birlikte gerektiğini öğrenin.',
    body: `## Belirtiler tek başına tanı koydurmaz
Yorgunluk, cinsel istekte azalma veya performans değişikliği farklı nedenlerle ortaya çıkabilir. EAU rehberi, erişkin erkeklerde hipogonadizm tanısını uyumlu belirti ve bulgular ile tekrarlanan düşük testosteron sonuçlarının birlikte değerlendirilmesine dayandırır. Çevrim içi bir anket kan testosteron düzeyini ölçemez; bu sitedeki tahminler de laboratuvar sonucu ya da tanı değildir.

## Kan ne zaman alınmalı?
EAU 2026 önerileri total testosteronun güvenilir bir laboratuvar yöntemiyle, sabah 07.00–10.00 arasında ve açlıkta ölçülmesini belirtir. Akut hastalık döneminde ölçüm yanıltıcı olabilir. Vardiyalı çalışıyorsanız veya uyku düzeniniz farklıysa örnekleme zamanını hekiminizle planlayın; laboratuvarın hazırlık talimatını izleyin.

## Düşük sonuç neden tekrarlanır?
Rehber, total testosteron 12 nmol/L altında olduğunda ve tedavi başlamadan önce ölçümün en az iki ayrı zamanda yapılmasını önerir. Bu eşik geç başlangıçlı hipogonadizm değerlendirmesi içindir; tek başına tedavi kararı veya herkes için evrensel bir normal aralık değildir. Birim, laboratuvar yöntemi ve belirtiler birlikte yorumlanır.

## Randevuya hazırlık
- Sonuç belgenizi, örnek alınma saatini ve laboratuvar referans aralığını saklayın.
- Kullandığınız ilaç ve takviyeleri hekime bildirin; kendiliğinizden bırakmayın.
- Gerekli görülürse SHBG, hesaplanmış serbest testosteron, LH ve FSH ile değerlendirme genişletilebilir.
- Bu erişkin rehberindeki eşikleri çocuklara ve ergenlere uygulamayın; çocuk endokrinolojisi değerlendirmesi gerekir.`,
    sources: [{ title: 'EAU — Male Hypogonadism, 2026 rehberi (3.3–3.3.5)', titleEn: 'EAU — Male Hypogonadism, 2026 guideline', url: EAU }],
    translations: { en: {
      category: 'Testing and diagnosis', title: 'Testosterone testing: timing and repeat measurements in the 2026 guideline',
      summary: 'A single result or symptom score is not a diagnosis. Learn why morning sampling, repeat testing and clinical assessment belong together.',
      body: `## Symptoms are not a diagnosis
Fatigue, reduced desire and changes in performance have many possible causes. The EAU guideline bases adult male hypogonadism diagnosis on compatible signs and symptoms together with consistently low testosterone results. An online questionnaire cannot measure blood testosterone; this site's estimates are not laboratory results or diagnoses.

## When to take the sample
The 2026 EAU recommendations specify fasting total testosterone measurement between 07:00 and 10:00 using a reliable assay. Acute illness can affect interpretation. Discuss sample timing with your clinician if you work shifts, and follow your laboratory's preparation instructions.

## Why repeat a low result?
EAU recommends measurements on at least two separate occasions when total testosterone is below 12 nmol/L and before treatment. This threshold relates to late-onset hypogonadism assessment, not an automatic treatment decision or a universal normal range. Units, assay and symptoms matter.

## Prepare for your appointment
- Keep the report, sampling time and laboratory reference range.
- Tell your clinician about medicines and supplements; do not stop them on your own.
- SHBG, calculated free testosterone, LH and FSH may be considered when indicated.
- Do not apply adult thresholds to children or adolescents; seek paediatric endocrine assessment.`
    } }
  },
  {
    slug: 'testosteron-tedavisi-fda-tansiyon-uyarisi', category: 'Tedavi güvenliği', emoji: '🫀',
    title: 'Testosteron tedavisi: FDA uyarısında ne değişti, ne değişmedi?',
    summary: '28 Şubat 2025 tarihli FDA değişikliğinde kalp-damar uyarısı yeniden düzenlendi; kan basıncı artışı uyarısı önemini koruyor.',
    body: `## Haber tarihi ile gözden geçirme tarihi farklıdır
Bu yazı 23 Ekim 2026 tarihinde gözden geçirildi. Konusu FDA'nın 28 Şubat 2025 tarihli duyurusudur; yeni bir 2026 ilaç onayı değildir. FDA ABD düzenleyicisidir; Türkiye'deki kullanım koşulları için hekiminize ve güncel ürün bilgisine başvurun.

## Ne değişti?
FDA, TRAVERSE çalışmasının ardından testosteron ürünlerinin etiketlerine çalışma sonuçlarının eklenmesini ve ciddi kardiyovasküler sonuç riskine ilişkin kutulu uyarı dilinin kaldırılmasını önerdi. Bu, testosteronun herkes için risksiz olduğu veya performans artırmak amacıyla kullanılabileceği anlamına gelmez.

## Tansiyon uyarısı neden önemli?
FDA'nın değerlendirdiği ambulatuvar kan basıncı çalışmalarında testosteron ürünleriyle kan basıncı artışı doğrulandı. Kurum, mevcut ürün bilgilerine uygun kan basıncı verilerinin ve henüz bulunmayan ürünlere bu konuda yeni uyarının eklenmesini istedi. Tedavi öncesi tansiyon ve kalp-damar riskinizi hekiminizle görüşün; takip planını birlikte belirleyin.

## Ne değişmedi?
Yaşa bağlı testosteron düşüşüne ilişkin kullanım sınırlaması korundu. Duyuru, yalnızca yaşlanma veya spor performansı için kendi kendine hormon kullanımına onay vermez. Tedavinizi bu yazıya bakarak başlatmayın, kesmeyin veya dozunu değiştirmeyin.`,
    sources: [{ title: 'FDA — Class-wide labeling changes for testosterone products, 28 Şubat 2025', titleEn: 'FDA — Testosterone labeling changes, February 28, 2025', url: FDA }],
    translations: { en: {
      category: 'Treatment safety', title: 'Testosterone therapy: what changed in the FDA warning?',
      summary: 'The FDA announcement of February 28, 2025 revised cardiovascular warning language while requiring warnings about increased blood pressure.',
      body: `## Review date is not the announcement date
Reviewed on October 23, 2026, this article covers the FDA announcement of February 28, 2025. It is not a new 2026 drug approval. FDA is the US regulator; local prescribing conditions may differ.

## What changed?
Following TRAVERSE, FDA recommended adding trial findings to product labels and removing boxed-warning language about an increased risk of adverse cardiovascular outcomes. This does not mean testosterone is risk-free for everyone or suitable for performance enhancement.

## Why blood pressure still matters
Ambulatory blood pressure studies reviewed by FDA confirmed blood pressure increases with testosterone products. FDA required product-specific information and new blood pressure warnings where absent. Discuss your blood pressure, cardiovascular risk and monitoring plan with your clinician.

## What did not change?
The limitation of use for age-related hypogonadism was retained. The announcement does not approve self-medication for ageing or sporting performance. Do not start, stop or change treatment based on this article.`
    } }
  },
  {
    slug: 'testosteron-ve-cocuk-sahibi-olma-plani', category: 'Üreme sağlığı', emoji: '🌱',
    title: 'Çocuk sahibi olmayı planlıyorsanız testosteron hakkında bilinmesi gerekenler',
    summary: 'Dışarıdan testosteron almak sperm üretimini baskılayabilir. Tedavi görüşmesinde çocuk sahibi olma planınızı mutlaka paylaşın.',
    body: `## Testosteron düzeyi ile sperm üretimi aynı şey değildir
Kanda testosteronun yükselmesi, sperm üretiminin de arttığı anlamına gelmez. EAU rehberi dışarıdan testosteron tedavisinin gonadotropinleri, vücudun kendi testosteron salgısını ve sperm üretimini baskıladığını belirtir.

## Çocuk planı tedavi kararını değiştirir
EAU, aktif olarak çocuk sahibi olmak isteyen erkeklerde testosteron tedavisini kontrendike olarak tanımlar. Bu nedenle düşük testosteron değerlendirmesinde üreme planı baştan konuşulmalıdır. Spor amacıyla kullanılan hormonlar ve anabolik ürünler de görüşmede açıkça bildirilmelidir.

## Hangi adımı atmalısınız?
Üroloji veya endokrinoloji uzmanına mevcut tedavinizi, daha önce kullandığınız hormonları ve çocuk sahibi olma planınızı anlatın. Nedene göre değerlendirme ve farklı tedavi seçenekleri gündeme gelebilir; bunlar kişiye özel uzmanlık gerektirir. Kendi kendinize hormon, gonadotropin veya internetten alınan bir kür başlamayın.

## Bu yazının sınırı
Bu bir fertilite testi, tedavi şeması veya iyileşme süresi vaadi değildir. Mevcut ilacınızı hekiminizle konuşmadan değiştirmeyin. Yazı erişkinler için genel bilgilendirme sağlar.`,
    sources: [{ title: 'EAU — Male Hypogonadism, 2026 rehberi (3.4.1, kontrendikasyonlar)', titleEn: 'EAU — Male Hypogonadism, 2026 guideline', url: EAU }],
    translations: { en: {
      category: 'Reproductive health', title: 'Planning to have children? What to know about testosterone',
      summary: 'External testosterone can suppress sperm production. Discuss fertility plans before a treatment decision.',
      body: `## Blood testosterone and sperm production are different
Higher blood testosterone does not mean higher sperm production. The EAU guideline states that external testosterone therapy suppresses gonadotropins, endogenous testosterone secretion and spermatogenesis.

## Fertility plans change the decision
EAU lists an active desire to have children as a contraindication to testosterone therapy. Fertility should be discussed at the start of an assessment. Disclose hormones and anabolic products used for sport as well.

## Your next step
Discuss current and previous hormone treatment and fertility plans with a urologist or endocrinologist. Assessment and alternative treatments depend on the cause and require specialist care. Do not self-prescribe hormones, gonadotropins or an online cycle.

## Limits of this article
This is not a fertility test, a treatment regimen or a promise of recovery time. Do not change prescribed medicines without discussing them with your clinician. This guide provides general information for adults.`
    } }
  }
].map((post, index) => ({
  ...post, id: `editorial-${post.slug}`, type: 'blog', time: '3 dk', ingredients: [], cover_url: '',
  date: REVIEWED_AT, published_at: `${REVIEWED_AT}T06:0${2 - index}:00Z`,
  updated_at: `${REVIEWED_AT}T06:10:00Z`, reviewed_at: REVIEWED_AT,
  url: `/blog/${post.slug}/`, read_only: true
}));

/** Yönetici kayıtları aynı slug/kimlik için önceliklidir; tekrar kart üretme. */
export function mergeEditorial(rows = []) {
  const slugs = new Set(rows.map(item => item.slug));
  const ids = new Set(rows.map(item => item.id));
  return [...rows, ...EDITORIAL_POSTS.filter(item => !slugs.has(item.slug) && !ids.has(item.id))]
    .sort((a, b) => String(b.published_at || b.date || '').localeCompare(String(a.published_at || a.date || '')));
}

export function findEditorial(slug) {
  return EDITORIAL_POSTS.find(item => item.slug === slug) || null;
}

/** Yalnızca denetlenmiş rehberlerin kaynak alanı; gövde ayıklayıcısından bağımsız. */
export function editorialSources(item) {
  const guide = findEditorial(item?.slug);
  return item?.read_only && item?.id === guide?.id ? guide.sources : [];
}
