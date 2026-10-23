#!/usr/bin/env node
import { configurationReport } from '../api/_settings.js';
const report = configurationReport();
for (const check of report.checks) {
  console.log(`${check.status === 'configured' ? 'OK' : check.required ? 'EKSİK' : 'İSTEĞE BAĞLI'} | ${check.label}: ${check.message}`);
}
console.log('\nBu kontrol değişkenlerin biçimini inceler; veritabanı/AI bağlantısını doğrulamaz. Hiçbir gizli değer yazdırılmaz.');
process.exitCode = report.ready ? 0 : 1;
