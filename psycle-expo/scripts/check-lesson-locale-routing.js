const { readFileSync } = require('fs');
const { resolve } = require('path');

const LESSONS_PATH = resolve(__dirname, '../lib/lessons.ts');

function fail(message) {
  console.error(`[i18n-smoke] ${message}`);
  process.exit(1);
}

const lessonsSource = readFileSync(LESSONS_PATH, 'utf8');

const expectedImports = [
  'getMentalDataForLocale',
  'getMoneyDataForLocale',
  'getWorkDataForLocale',
  'getHealthDataForLocale',
  'getSocialDataForLocale',
  'getStudyDataForLocale',
];

for (const name of expectedImports) {
  if (!lessonsSource.includes(name)) {
    fail(`Missing locale loader import: ${name}`);
  }
}

const expectedCalls = [
  'getMentalDataForLocale(locale)',
  'getMoneyDataForLocale(locale)',
  'getWorkDataForLocale(locale)',
  'getHealthDataForLocale(locale)',
  'getSocialDataForLocale(locale)',
  'getStudyDataForLocale(locale)',
];

for (const call of expectedCalls) {
  if (!lessonsSource.includes(call)) {
    fail(`Missing locale loader call: ${call}`);
  }
}

const localeFallback = /const\s+locale\s*=\s*i18n\.locale\s*\|\|\s*['"]ja['"]/;
if (!localeFallback.test(lessonsSource)) {
  fail('Locale fallback line missing');
}

console.log('[i18n-smoke] OK: lessons.ts is wired to locale-specific data helpers');
