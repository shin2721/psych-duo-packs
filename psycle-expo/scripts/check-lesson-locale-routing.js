const { readFileSync } = require('fs');
const { resolve } = require('path');

const LESSONS_PATH = resolve(__dirname, '../lib/lessons.ts');

const UNIT_CONFIGS = [
  { unit: 'mental', exportName: 'mentalData', getter: 'getMentalDataForLocale' },
  { unit: 'money', exportName: 'moneyData', getter: 'getMoneyDataForLocale' },
  { unit: 'work', exportName: 'workData', getter: 'getWorkDataForLocale' },
  { unit: 'health', exportName: 'healthData', getter: 'getHealthDataForLocale' },
  { unit: 'social', exportName: 'socialData', getter: 'getSocialDataForLocale' },
  { unit: 'study', exportName: 'studyData', getter: 'getStudyDataForLocale' },
];

function fail(message) {
  console.error(`[i18n-smoke] ${message}`);
  process.exit(1);
}

function checkLessonsRouter() {
  const lessonsSource = readFileSync(LESSONS_PATH, 'utf8');

  for (const config of UNIT_CONFIGS) {
    if (!lessonsSource.includes(config.getter)) {
      fail(`Missing locale loader import: ${config.getter}`);
    }
    if (!lessonsSource.includes(`${config.getter}(locale)`)) {
      fail(`Missing locale loader call: ${config.getter}(locale)`);
    }
  }

  const localeFallback = /const\s+locale\s*=\s*i18n\.locale\s*\|\|\s*['"]ja['"]/;
  if (!localeFallback.test(lessonsSource)) {
    fail('Locale fallback line missing in lessons.ts');
  }
}

function collectLocales(indexSource) {
  const importLocaleMatches = indexSource.match(/\.([a-z]{2})\.json/g) || [];
  const locales = new Set();
  for (const match of importLocaleMatches) {
    locales.add(match.slice(1, 3));
  }
  return locales;
}

function hasLocaleBranch(indexSource, locale, exportName) {
  const escapedLocale = locale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const branchPattern = new RegExp(
    `if\\s*\\(lang\\s*===\\s*['"]${escapedLocale}['"]\\)\\s*\\{\\s*return\\s+${exportName}_${escapedLocale};\\s*\\}`,
    'm'
  );
  return branchPattern.test(indexSource);
}

function checkUnitIndex(config) {
  const indexPath = resolve(__dirname, `../data/lessons/${config.unit}_units/index.ts`);
  const indexSource = readFileSync(indexPath, 'utf8');
  const locales = collectLocales(indexSource);

  if (!indexSource.includes(`export function ${config.getter}(locale: string)`)) {
    fail(`Missing locale getter in ${config.unit}_units/index.ts: ${config.getter}`);
  }

  if (!locales.has('ja')) {
    fail(`Missing ja locale imports in ${config.unit}_units/index.ts`);
  }

  for (const locale of locales) {
    if (locale === 'ja') continue;

    if (!indexSource.includes(`export const ${config.exportName}_${locale}`)) {
      fail(`Missing export ${config.exportName}_${locale} in ${config.unit}_units/index.ts`);
    }
    if (!hasLocaleBranch(indexSource, locale, config.exportName)) {
      fail(`Missing locale branch for '${locale}' in ${config.unit}_units/index.ts`);
    }
  }

  if (locales.has('en')) {
    if (!indexSource.includes(`return ${config.exportName}_en;`)) {
      fail(`Missing en fallback return in ${config.unit}_units/index.ts`);
    }
  } else if (!indexSource.includes(`return ${config.exportName}_ja;`)) {
    fail(`Missing ja fallback return in ${config.unit}_units/index.ts`);
  }
}

checkLessonsRouter();
for (const config of UNIT_CONFIGS) {
  checkUnitIndex(config);
}

console.log('[i18n-smoke] OK: locale routing is wired for all unit index files (including es/fr when present)');
