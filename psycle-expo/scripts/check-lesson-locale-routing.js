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

const expectedSwitches = [
  'case "mental":\n        rawData = getMentalDataForLocale(locale);',
  'case "money":\n        rawData = getMoneyDataForLocale(locale);',
  'case "work":\n        rawData = getWorkDataForLocale(locale);',
  'case "health":\n        rawData = getHealthDataForLocale(locale);',
  'case "social":\n        rawData = getSocialDataForLocale(locale);',
  'case "study":\n        rawData = getStudyDataForLocale(locale);',
];

for (const snippet of expectedSwitches) {
  if (!lessonsSource.includes(snippet)) {
    fail('Locale loader switch is missing expected wiring');
  }
}

if (!lessonsSource.includes('const locale = i18n.locale || \"ja\";')) {
  fail('Locale fallback line missing');
}

console.log('[i18n-smoke] OK: lessons.ts is wired to locale-specific data helpers');
