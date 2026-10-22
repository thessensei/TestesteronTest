#!/usr/bin/env node
/*
 * Yayındaki yazı ve tarifleri 10 dile taşıyan toplu geri doldurma aracı.
 *
 * Paneldeki "Eksik dilleri çevir" düğmesiyle aynı işi sunucudan yapar; farkı,
 * aynı anda onlarca kaydı tek komutla işleyebilmesidir.
 *
 * Kullanım:
 *   DATABASE_URL=postgres://... AI_PROVIDER=gemini AI_API_KEY=... \
 *     npm run backfill:languages            # eksik dilleri AI ile çevirir
 *   npm run backfill:languages -- --dry-run # hiçbir şey yazmadan rapor verir
 *
 * AI anahtarı yoksa araç varsayılan olarak durur: İngilizce metni fr/es/bg/ru/hi/zh
 * alanlarına kopyalamak "çevrildi" görüntüsü verir. Yalnızca bilinçli olarak
 * İngilizce yedek yazmak istiyorsanız --allow-english-fallback ekleyin; bu durumda
 * her kayıt "incomplete" olarak raporlanır.
 *
 * Kural: hiçbir dilde Türkçe metin bırakılmaz. Çeviri üretilemeyen dil boş kalır,
 * arayüz o dili "çeviri bekliyor" olarak işaretler ve İngilizceyi gösterir.
 */

import { connectDb, listContent } from '../api/_content-db.js';
import { ensureCompleteTranslations } from '../api/_translate.js';
import { requestAiJson } from '../api/_ai-blog.js';
import { TARGET_LANGS } from '../api/_langs.js';

export const WRITTEN_METHODS = new Set(['ai', 'mt', 'local', 'ready']);

const hasText = value => String(value ?? '').trim().length > 0;

/** Bir kayıtta çevirisi eksik olan hedef diller. */
export function missingLanguages(item) {
  return TARGET_LANGS.filter(lang => {
    const block = item?.translations?.[lang];
    return !hasText(block?.title) || !hasText(block?.body);
  });
}

/** Kayıt geri doldurulmalı mı? */
export function needsBackfill(item) {
  return missingLanguages(item).length > 0;
}

/** Raporu insan okunur tek satıra çevirir. */
export function summarizeReport(report = {}) {
  const parts = TARGET_LANGS.map(lang => `${lang}:${report[lang] || 'pending'}`);
  return parts.join(' ');
}

/** AI sağlayıcı yapılandırması (env). */
export function aiConfigFromEnv(env = process.env) {
  const provider = String(env.AI_PROVIDER || '').trim().toLowerCase();
  const apiKey = String(env.AI_API_KEY || '').trim();
  const model = String(env.AI_MODEL || '').trim();
  if (!provider || !apiKey) return null;
  return { provider, apiKey, model };
}

/** ensureCompleteTranslations'ın beklediği `requestAi(systemPrompt, userPrompt)` sarmalayıcısı. */
export function createRequester(config, options = {}) {
  if (!config) return null;
  return (systemPrompt, userPrompt) => requestAiJson(config, { systemPrompt, userPrompt }, options);
}

/**
 * Saf iş akışı: verilen kayıtları çevirir ve `save` ile yazar.
 * Testler bu fonksiyonu sahte translate/save ile çağırır.
 */
export async function runBackfill(items, options = {}) {
  const {
    translate = item => ensureCompleteTranslations(item, { env: process.env }),
    save = async () => {},
    allowEnglishFallback = false,
    dryRun = false,
    logger = console,
    onlyIds = null
  } = options;

  const summary = { scanned: 0, updated: 0, skipped: 0, incomplete: 0, failed: 0 };
  const targets = (Array.isArray(items) ? items : []).filter(item => item?.id && needsBackfill(item) && (!onlyIds || onlyIds.has(item.id)));

  for (const item of targets) {
    summary.scanned += 1;
    let result;
    try {
      result = await translate(item);
    } catch (error) {
      summary.failed += 1;
      logger.warn(`[backfill] ${item.id} çevrilemedi: ${error?.message || error}`);
      continue;
    }
    const report = result?.report || {};
    const translated = result?.item?.translations || {};
    const written = TARGET_LANGS.filter(lang => WRITTEN_METHODS.has(report[lang]));
    const incomplete = TARGET_LANGS.filter(lang => report[lang] === 'incomplete');

    if (!written.length && !(allowEnglishFallback && incomplete.length)) {
      summary.skipped += 1;
      logger.warn(`[backfill] ${item.id} atlandı · ${summarizeReport(report)}`);
      continue;
    }
    if (incomplete.length) summary.incomplete += 1;

    const translations = { ...(item.translations || {}) };
    for (const lang of [...written, ...(allowEnglishFallback ? incomplete : [])]) {
      if (translated[lang]) translations[lang] = translated[lang];
    }

    if (dryRun) {
      logger.log(`[backfill] ${item.id} (kuru çalışma) · ${summarizeReport(report)}`);
      summary.updated += 1;
      continue;
    }

    try {
      await save({ ...item, translations }, report);
      summary.updated += 1;
      logger.log(`[backfill] ${item.id} güncellendi · ${summarizeReport(report)}`);
    } catch (error) {
      summary.failed += 1;
      logger.warn(`[backfill] ${item.id} yazılamadı: ${error?.message || error}`);
    }
  }

  return summary;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const allowEnglishFallback = args.has('--allow-english-fallback');
  const config = aiConfigFromEnv();

  if (!config && !allowEnglishFallback && !dryRun) {
    console.error('AI_PROVIDER ve AI_API_KEY tanımlı değil. Gerçek çeviri için bunları verin; ' +
      'İngilizce yedeği bilinçli olarak yazmak için --allow-english-fallback ekleyin.');
    process.exitCode = 1;
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL tanımlı değil.');
    process.exitCode = 1;
    return;
  }

  const sql = connectDb();
  const items = await listContent(sql);
  const requester = createRequester(config);
  const summary = await runBackfill(items, {
    dryRun,
    allowEnglishFallback,
    translate: item => ensureCompleteTranslations(item, { requestAi: requester, env: process.env }),
    save: async (item, report) => {
      await sql`UPDATE content SET translations=${JSON.stringify(item.translations)}::jsonb, updated_at=NOW() WHERE id=${item.id}`;
      return report;
    }
  });

  console.log(`\nTarandı: ${summary.scanned} · Güncellendi: ${summary.updated} · Atlanan: ${summary.skipped} ` +
    `· Eksik kalan: ${summary.incomplete} · Hata: ${summary.failed}`);
  if (summary.incomplete) {
    console.log('Eksik kalan diller İngilizce yedeğiyle gösterilir; AI anahtarıyla tekrar çalıştırın.');
  }
}

const entry = process.argv[1] ? String(process.argv[1]) : '';
if (entry.endsWith('backfill-languages.mjs')) {
  main().catch(error => {
    console.error('[backfill] beklenmeyen hata:', error);
    process.exitCode = 1;
  });
}
