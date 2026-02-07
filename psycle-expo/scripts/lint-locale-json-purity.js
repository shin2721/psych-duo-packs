#!/usr/bin/env node
/**
 * lint-locale-json-purity.js
 *
 * Guards lesson locale JSON purity by detecting disallowed scripts per language.
 *
 * Usage:
 *   node scripts/lint-locale-json-purity.js
 *   node scripts/lint-locale-json-purity.js --langs=en,es,fr
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'data/lessons');

// Script ranges:
// - Kana: Hiragana + Katakana (JP-specific enough for zh/ko checks)
// - CJK: Ideographs (used by JP/zh; disallowed for Latin locale files)
const KANA_REGEX = /[\u3040-\u30FF]/;
const CJK_REGEX = /[\u3400-\u9FFF]/;

const DISALLOWED_BY_LANG = {
  en: [KANA_REGEX, CJK_REGEX],
  es: [KANA_REGEX, CJK_REGEX],
  fr: [KANA_REGEX, CJK_REGEX],
  de: [KANA_REGEX, CJK_REGEX],
  pt: [KANA_REGEX, CJK_REGEX],
  zh: [KANA_REGEX],
  ko: [KANA_REGEX],
};

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--langs=')) {
      options.langs = token
        .slice('--langs='.length)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      continue;
    }
    const next = argv[i + 1];
    if (token === '--langs' && next && !next.startsWith('--')) {
      options.langs = next.split(',').map((x) => x.trim()).filter(Boolean);
      i++;
    }
  }
  return options;
}

function collectLocaleJsonFiles(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_translation_cache') continue;
      collectLocaleJsonFiles(fullPath, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.json')) continue;
    const m = entry.name.match(/\.([a-z]{2})\.json$/);
    if (!m) continue;
    out.push({ path: fullPath, lang: m[1] });
  }
}

function walk(node, jsonPath, findings, disallowedRegexes) {
  if (typeof node === 'string') {
    if (disallowedRegexes.some((re) => re.test(node))) {
      findings.push({
        path: jsonPath || '$',
        value: node.length > 120 ? `${node.slice(0, 120)}...` : node,
      });
    }
    return;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walk(node[i], `${jsonPath}[${i}]`, findings, disallowedRegexes);
    }
    return;
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const nextPath = jsonPath ? `${jsonPath}.${key}` : key;
      walk(value, nextPath, findings, disallowedRegexes);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(ROOT)) {
    console.error(`❌ Missing lessons directory: ${ROOT}`);
    process.exit(1);
  }

  const allFiles = [];
  collectLocaleJsonFiles(ROOT, allFiles);

  const targetLangs = args.langs || Object.keys(DISALLOWED_BY_LANG);
  const targetSet = new Set(targetLangs);

  const files = allFiles.filter((f) => targetSet.has(f.lang));
  if (files.length === 0) {
    console.log(`⚠️ No locale JSON files found for langs: ${targetLangs.join(',')}`);
    process.exit(0);
  }

  const allFindings = [];

  for (const file of files) {
    const disallowed = DISALLOWED_BY_LANG[file.lang];
    if (!disallowed || disallowed.length === 0) continue;

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    } catch (err) {
      console.error(`❌ Failed to parse JSON: ${path.relative(process.cwd(), file.path)} (${err.message})`);
      process.exit(1);
    }

    const findings = [];
    walk(parsed, '', findings, disallowed);

    if (findings.length > 0) {
      allFindings.push({
        file: path.relative(process.cwd(), file.path),
        lang: file.lang,
        findings,
      });
    }
  }

  if (allFindings.length === 0) {
    console.log(`✅ Locale JSON purity check passed for langs: ${targetLangs.join(',')}`);
    process.exit(0);
  }

  console.log(`❌ Locale purity violations found in ${allFindings.length} file(s):`);
  for (const hit of allFindings) {
    console.log(`\n📄 ${hit.file} (lang=${hit.lang})`);
    for (const finding of hit.findings.slice(0, 20)) {
      console.log(`  - ${finding.path}: "${finding.value}"`);
    }
    if (hit.findings.length > 20) {
      console.log(`  ... and ${hit.findings.length - 20} more`);
    }
  }

  process.exit(1);
}

main();
