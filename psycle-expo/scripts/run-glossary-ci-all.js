#!/usr/bin/env node
/**
 * Run glossary lint across all supported lesson languages.
 *
 * Usage:
 *   node scripts/run-glossary-ci-all.js --fail-on-new
 *   node scripts/run-glossary-ci-all.js --update-baseline
 */

const { spawnSync } = require('child_process');
const path = require('path');

const MODES = new Set(['--fail-on-new', '--update-baseline']);
const mode = process.argv.slice(2).find((arg) => MODES.has(arg)) || '--fail-on-new';
const langs = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ko'];

function runForLang(lang) {
  const args = ['scripts/lint-translation-glossary.js', `--lang=${lang}`, mode];
  const result = spawnSync(process.execPath, args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

for (const lang of langs) {
  runForLang(lang);
}

console.log(`\n✅ Glossary run completed for ${langs.length} languages (${mode})`);
