/*
 * Toplu dil geri doldurma aracı (tools/backfill-languages.mjs).
 *
 * Amaç: yayındaki içerikler de altı yeni dilde bulunmalı; hiçbir dilde Türkçe
 * metin gösterilmemeli. Araç AI anahtarı olmadan gerçek çeviri yazmaz.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WRITTEN_METHODS,
  aiConfigFromEnv,
  createRequester,
  missingLanguages,
  needsBackfill,
  runBackfill,
  summarizeReport
} from '../tools/backfill-languages.mjs';
import { TARGET_LANGS } from '../api/_langs.js';

const block = (lang, complete = true) => ({
  title: complete ? `${lang} başlık` : '',
  summary: complete ? `${lang} özet` : '',
  body: complete ? `${lang} gövde` : '',
  category: `cat-${lang}`,
  time: '5 min',
  ingredients: []
});

const fullItem = id => ({
  id,
  type: 'blog',
  title: 'Türkçe başlık',
  summary: 'Türkçe özet',
  body: 'Türkçe gövde',
  translations: Object.fromEntries(TARGET_LANGS.map(lang => [lang, block(lang)]))
});

test('eksik diller yalnızca başlığı veya gövdesi olmayanları döndürür', () => {
  const item = fullItem('a');
  assert.deepEqual(missingLanguages(item), []);
  assert.equal(needsBackfill(item), false);

  delete item.translations.fr;
  item.translations.hi = { ...block('hi'), body: '' };
  assert.deepEqual(missingLanguages(item), ['fr', 'hi']);
  assert.equal(needsBackfill(item), true);
});

test('çeviri raporu tüm hedef dilleri listeler', () => {
  const text = summarizeReport({ fr: 'ai', es: 'incomplete' });
  for (const lang of TARGET_LANGS) assert.ok(text.includes(`${lang}:`), `${lang} raporda yok`);
  assert.match(text, /fr:ai/);
  assert.match(text, /es:incomplete/);
  assert.deepEqual([...WRITTEN_METHODS], ['ai', 'mt', 'local', 'ready']);
});

test('AI yapılandırması yalnızca sağlayıcı ve anahtar birlikteyken kurulur', () => {
  assert.equal(aiConfigFromEnv({}), null);
  assert.equal(aiConfigFromEnv({ AI_PROVIDER: 'gemini' }), null);
  assert.deepEqual(aiConfigFromEnv({ AI_PROVIDER: 'Gemini', AI_API_KEY: ' k ' }), { provider: 'gemini', apiKey: 'k', model: '' });
  assert.equal(createRequester(null), null);
  assert.equal(typeof createRequester({ provider: 'groq', apiKey: 'k', model: '' }), 'function');
});

test('geri doldurma yalnızca eksik kayıtları çevirir ve yazar', async () => {
  const partial = { ...fullItem('partial'), translations: { en: block('en'), de: block('de') } };
  const written = [];
  const summary = await runBackfill([fullItem('done'), partial], {
    translate: async item => ({
      item: { ...item, translations: Object.fromEntries(TARGET_LANGS.map(lang => [lang, block(lang)])) },
      report: Object.fromEntries(TARGET_LANGS.map(lang => [lang, 'ai']))
    }),
    save: async item => { written.push(item.id); },
    logger: { log() {}, warn() {} }
  });
  assert.deepEqual(summary, { scanned: 1, updated: 1, skipped: 0, incomplete: 0, failed: 0 });
  assert.deepEqual(written, ['partial']);
});

test('AI üretemediğinde kayıt yazılmaz; istenirse İngilizce yedek "incomplete" olarak yazılır', async () => {
  const partial = { ...fullItem('x'), translations: {} };
  const report = Object.fromEntries(TARGET_LANGS.map(lang => [lang, 'incomplete']));
  const translated = { item: { ...partial, translations: Object.fromEntries(TARGET_LANGS.map(lang => [lang, block(lang)])) }, report };
  const skippedWrites = [];

  const skipped = await runBackfill([partial], {
    translate: async () => translated,
    save: async item => { skippedWrites.push(item.id); },
    logger: { log() {}, warn() {} }
  });
  assert.equal(skipped.updated, 0);
  assert.equal(skipped.skipped, 1);
  assert.deepEqual(skippedWrites, []);

  const allowed = [];
  const fallback = await runBackfill([partial], {
    translate: async () => translated,
    save: async item => { allowed.push(item.id); },
    allowEnglishFallback: true,
    logger: { log() {}, warn() {} }
  });
  assert.equal(fallback.updated, 1);
  assert.equal(fallback.incomplete, 1);
  assert.deepEqual(allowed, ['x']);
});

test('kuru çalışma veritabanına dokunmaz, hata alan kayıt sayılır', async () => {
  const partial = { ...fullItem('p'), translations: {} };
  const okReport = Object.fromEntries(TARGET_LANGS.map(lang => [lang, 'ai']));
  let saves = 0;

  const dry = await runBackfill([partial], {
    dryRun: true,
    translate: async item => ({ item, report: okReport }),
    save: async () => { saves += 1; },
    logger: { log() {}, warn() {} }
  });
  assert.equal(dry.updated, 1);
  assert.equal(saves, 0);

  const failed = await runBackfill([partial], {
    translate: async () => { throw new Error('sağlayıcı kapalı'); },
    save: async () => { saves += 1; },
    logger: { log() {}, warn() {} }
  });
  assert.equal(failed.failed, 1);
  assert.equal(saves, 0);
});
