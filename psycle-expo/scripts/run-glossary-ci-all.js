#!/usr/bin/env node
/**
 * Run glossary lint across the ACTIVE generated lesson languages
 * (config/locales.json). With no active generated locale the run is a no-op.
 *
 * Usage:
 *   node scripts/run-glossary-ci-all.js --fail-on-new
 *   node scripts/run-glossary-ci-all.js --update-baseline
 */

const { spawnSync } = require('child_process');
const path = require('path');

const MODES = new Set(['--fail-on-new', '--update-baseline']);
const mode = process.argv.slice(2).find((arg) => MODES.has(arg)) || '--fail-on-new';
const fs = require('fs');
const localeConfig = require(path.join(__dirname, '..', 'config', 'locales.json'));
const activeTargets = localeConfig.active.filter((locale) => locale !== localeConfig.source);

// Present-but-inactive locales are linted too: a generated file that exists on
// disk must pass the glossary rules whether or not the locale is switched on.
function presentTargets() {
  const lessonsDir = path.resolve(__dirname, '..', 'data', 'lessons');
  const present = new Set();
  if (!fs.existsSync(lessonsDir)) return [];
  for (const unitDir of fs.readdirSync(lessonsDir)) {
    const unitPath = path.join(lessonsDir, unitDir);
    if (!unitDir.endsWith('_units') || !fs.statSync(unitPath).isDirectory()) continue;
    for (const file of fs.readdirSync(unitPath)) {
      const match = file.match(/\.([a-z]{2})\.json$/);
      if (match && localeConfig.targets.includes(match[1])) present.add(match[1]);
    }
  }
  return Array.from(present);
}

const langs = Array.from(new Set([...activeTargets, ...presentTargets()]));

if (langs.length === 0) {
  console.log('ℹ️ No active or generated locale (config/locales.json) — glossary lint skipped (not generated).');
  process.exit(0);
}

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
