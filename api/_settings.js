// Yalnızca durum döndürür. Anahtar, parola, bağlantı dizesi veya model değeri dışarı çıkmaz.
export function configurationReport(env = process.env) {
  const present = key => typeof env[key] === 'string' && Boolean(env[key].trim());
  const checks = [];
  const add = (id, label, required, ready, message) => checks.push({ id, label, required, status: ready ? 'configured' : required ? 'missing' : 'optional', message });
  let database = false;
  try { const url = new URL(env.DATABASE_URL); database = ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname && url.pathname.length > 1); } catch {}
  add('database', 'Veritabanı', true, database, database ? 'Bağlantı biçimi uygun. Bağlantı testi yapılmadı.' : 'DATABASE_URL için geçerli bir Postgres bağlantısı gerekli.');
  const password = present('ADMIN_PASSWORD') && env.ADMIN_PASSWORD.length >= 16;
  add('admin', 'Yönetici parolası', true, password, password ? 'Parola uzunluğu uygun.' : 'ADMIN_PASSWORD en az 16 karakter olmalı.');
  const secret = present('SESSION_SECRET') && env.SESSION_SECRET.length >= 32;
  add('session', 'Oturum imzası', true, secret, secret ? 'İmza anahtarı uzunluğu uygun.' : 'SESSION_SECRET için en az 32 karakterlik rastgele bir değer gerekli.');
  let site = false;
  try { const url = new URL(env.SITE_URL); site = url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash; } catch {}
  add('site', 'Kalıcı site adresi', false, site, site ? 'HTTPS site kökü tanımlı.' : 'SITE_URL için canlı HTTPS adresini tanımlayın; yoksa mevcut site adresi yedeği kullanılır.');
  const ai = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'MOONSHOT_API_KEY', 'KIMI_API_KEY', 'DEEPSEEK_API_KEY', 'AI_API_KEY'].some(present);
  add('ai', 'Konuya göre AI taslağı', false, ai, ai ? 'Sunucu anahtarı tanımlı. Sağlayıcı/model erişimi test edilmedi.' : 'Konu taslağı için desteklenen bir AI sağlayıcısının sunucu anahtarı gerekli.');
  const pinterest = present('PINTEREST_ACCESS_TOKEN') && present('PINTEREST_BOARD_ID');
  add('pinterest', 'Pinterest paylaşımı', false, pinterest, pinterest ? 'Token ve pano tanımlı. API erişimi test edilmedi.' : 'İsteğe bağlı: PINTEREST_ACCESS_TOKEN ve PINTEREST_BOARD_ID birlikte gerekli.');
  return { ready: checks.filter(check => check.required).every(check => check.status === 'configured'), checks, connectivityTested: false };
}
