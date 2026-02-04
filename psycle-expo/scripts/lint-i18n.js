#!/usr/bin/env node
/**
 * i18n Lint Script
 *
 * Validates translation files for:
 * 1. Missing keys (compared to base locale 'ja')
 * 2. Placeholder mismatch ({{name}} style)
 * 3. ICU MessageFormat parse errors
 * 4. Duplicate values (potential copy-paste errors)
 *
 * Usage: node scripts/lint-i18n.js
 * Exit codes: 0 = PASS, 1 = FAIL
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'lib', 'locales');
const BASE_LOCALE = 'ja';

// Simple placeholder pattern: {{variableName}}
const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/g;

// ICU MessageFormat patterns
const ICU_PATTERNS = {
  plural: /\{[^,}]+,\s*plural\s*,/,
  select: /\{[^,}]+,\s*select\s*,/,
  selectordinal: /\{[^,}]+,\s*selectordinal\s*,/,
};

/**
 * Flatten nested object to dot-notation keys
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Extract placeholders from a string
 */
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(PLACEHOLDER_PATTERN) || [];
  return matches.sort();
}

/**
 * Basic ICU syntax validation
 */
function validateICU(str, key) {
  if (typeof str !== 'string') return [];
  const errors = [];

  for (const [type, pattern] of Object.entries(ICU_PATTERNS)) {
    if (pattern.test(str)) {
      // Check for balanced braces
      let depth = 0;
      for (const char of str) {
        if (char === '{') depth++;
        if (char === '}') depth--;
        if (depth < 0) {
          errors.push(`${key}: Unbalanced braces in ${type} format`);
          break;
        }
      }
      if (depth !== 0) {
        errors.push(`${key}: Unbalanced braces in ${type} format`);
      }
    }
  }

  return errors;
}

/**
 * Load locale file
 */
function loadLocale(localeName) {
  const filePath = path.join(LOCALES_DIR, `${localeName}.ts`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract the exported object (simple regex-based extraction)
  // This works for our simple flat/nested object format
  const match = content.match(/export\s+const\s+\w+\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) {
    console.error(`Failed to parse ${localeName}.ts`);
    return null;
  }

  try {
    // Use Function constructor to safely evaluate the object literal
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return ${match[1]}`);
    return fn();
  } catch (e) {
    console.error(`Failed to evaluate ${localeName}.ts:`, e.message);
    return null;
  }
}

/**
 * Get all locale names from the locales directory
 */
function getLocaleNames() {
  const files = fs.readdirSync(LOCALES_DIR);
  return files
    .filter(f => f.endsWith('.ts') && !f.startsWith('index'))
    .map(f => f.replace('.ts', ''));
}

/**
 * Main validation function
 */
function validate() {
  const errors = [];
  const warnings = [];

  console.log('=== i18n Lint Report ===\n');

  // Load base locale
  const baseLocale = loadLocale(BASE_LOCALE);
  if (!baseLocale) {
    console.error(`ERROR: Base locale '${BASE_LOCALE}' not found or invalid`);
    process.exit(1);
  }

  const baseFlat = flattenObject(baseLocale);
  const baseKeys = Object.keys(baseFlat);

  console.log(`Base locale (${BASE_LOCALE}): ${baseKeys.length} keys\n`);

  // Get all locales
  const localeNames = getLocaleNames();
  console.log(`Found locales: ${localeNames.join(', ')}\n`);

  // Check each locale
  for (const localeName of localeNames) {
    if (localeName === BASE_LOCALE) continue;

    const locale = loadLocale(localeName);
    if (!locale) {
      errors.push(`[${localeName}] Failed to load locale file`);
      continue;
    }

    const flat = flattenObject(locale);
    const keys = Object.keys(flat);

    console.log(`Checking ${localeName}...`);

    // 1. Missing keys
    const missingKeys = baseKeys.filter(k => !(k in flat));
    for (const key of missingKeys) {
      errors.push(`[${localeName}] Missing key: ${key}`);
    }

    // 2. Extra keys (not in base)
    const extraKeys = keys.filter(k => !(k in baseFlat));
    for (const key of extraKeys) {
      warnings.push(`[${localeName}] Extra key (not in ${BASE_LOCALE}): ${key}`);
    }

    // 3. Placeholder mismatch
    for (const key of keys) {
      if (key in baseFlat) {
        const basePlaceholders = extractPlaceholders(baseFlat[key]);
        const localePlaceholders = extractPlaceholders(flat[key]);

        if (JSON.stringify(basePlaceholders) !== JSON.stringify(localePlaceholders)) {
          errors.push(`[${localeName}] Placeholder mismatch at '${key}': ` +
            `base has ${basePlaceholders.join(',')||'none'}, ` +
            `${localeName} has ${localePlaceholders.join(',')||'none'}`);
        }
      }
    }

    // 4. ICU validation
    for (const [key, value] of Object.entries(flat)) {
      const icuErrors = validateICU(value, key);
      for (const err of icuErrors) {
        errors.push(`[${localeName}] ${err}`);
      }
    }
  }

  // 5. Check for duplicates within each locale (potential copy-paste errors)
  for (const localeName of localeNames) {
    const locale = loadLocale(localeName);
    if (!locale) continue;

    const flat = flattenObject(locale);
    const valueToKeys = new Map();

    for (const [key, value] of Object.entries(flat)) {
      if (typeof value !== 'string' || value.length < 10) continue;

      if (!valueToKeys.has(value)) {
        valueToKeys.set(value, []);
      }
      valueToKeys.get(value).push(key);
    }

    for (const [value, keys] of valueToKeys.entries()) {
      if (keys.length > 1) {
        warnings.push(`[${localeName}] Duplicate value "${value.substring(0, 30)}..." at: ${keys.join(', ')}`);
      }
    }
  }

  // Report
  console.log('\n=== Results ===\n');

  if (errors.length > 0) {
    console.log(`ERRORS (${errors.length}):`);
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const warn of warnings) {
      console.log(`  - ${warn}`);
    }
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('All checks passed!');
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Locales checked: ${localeNames.length}`);
  console.log(`Total keys (base): ${baseKeys.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  // Exit code
  if (errors.length > 0) {
    console.log('\nStatus: FAIL');
    process.exit(1);
  } else {
    console.log('\nStatus: PASS');
    process.exit(0);
  }
}

// Run
validate();
