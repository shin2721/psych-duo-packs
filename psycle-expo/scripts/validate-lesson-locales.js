#!/usr/bin/env node
/**
 * Lesson Locale Validator
 *
 * Validates translated lesson files against the base Japanese (ja) files.
 * Ensures structural consistency across all language versions.
 *
 * Checks:
 * 1. All keys match between ja and other locales
 * 2. Array lengths match (choices, etc.)
 * 3. Non-translatable fields are identical (id, type, correct_index, etc.)
 * 4. Placeholder consistency in strings
 *
 * Usage:
 *   node scripts/validate-lesson-locales.js          # Report mode (always exit 0)
 *   node scripts/validate-lesson-locales.js --check  # CI mode (exit 1 on errors)
 *
 * Exit codes:
 *   0 = PASS (or report mode)
 *   1 = FAIL (check mode with errors)
 */

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, '..', 'data', 'lessons');
const BASE_LOCALE = 'ja';

// Fields that must be identical (not translated)
const NON_TRANSLATABLE_FIELDS = new Set([
  'id',
  'type',
  'correct_index',
  'recommended_index',
  'is_true',
  'difficulty',
  'xp',
  'source_id',
  'evidence_grade',
]);

// Fields that contain translatable text
const TRANSLATABLE_FIELDS = new Set([
  'question',
  'explanation',
  'actionable_advice',
  'your_response_prompt',
  'hint',
  'title',
]);

// Placeholder pattern: {variableName}
const PLACEHOLDER_PATTERN = /\{[^}]+\}/g;

/**
 * Get all lesson base names (without locale suffix)
 */
function getLessonBaseNames() {
  const lessons = new Map(); // baseName -> Set of locales

  const unitDirs = fs.readdirSync(LESSONS_DIR).filter(d => {
    const fullPath = path.join(LESSONS_DIR, d);
    return fs.statSync(fullPath).isDirectory() && d.endsWith('_units');
  });

  for (const unitDir of unitDirs) {
    const unitPath = path.join(LESSONS_DIR, unitDir);
    const files = fs.readdirSync(unitPath);

    for (const file of files) {
      // Match pattern: lesson_name.locale.json (e.g., mental_l01.ja.json)
      const match = file.match(/^(.+)\.([a-z]{2})\.json$/);
      if (match) {
        const [, baseName, locale] = match;
        if (!lessons.has(baseName)) {
          lessons.set(baseName, new Set());
        }
        lessons.get(baseName).add(locale);
      }
    }
  }

  return lessons;
}

/**
 * Find the unit directory for a lesson
 */
function findUnitDir(baseName) {
  const unitDirs = fs.readdirSync(LESSONS_DIR).filter(d => {
    const fullPath = path.join(LESSONS_DIR, d);
    return fs.statSync(fullPath).isDirectory() && d.endsWith('_units');
  });

  for (const unitDir of unitDirs) {
    const unitPath = path.join(LESSONS_DIR, unitDir);
    const jaFile = path.join(unitPath, `${baseName}.${BASE_LOCALE}.json`);
    if (fs.existsSync(jaFile)) {
      return unitDir;
    }
  }
  return null;
}

/**
 * Load lesson file
 */
function loadLesson(baseName, locale) {
  const unitDir = findUnitDir(baseName);
  if (!unitDir) return null;

  const filePath = path.join(LESSONS_DIR, unitDir, `${baseName}.${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return { error: e.message };
  }
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
 * Compare two values for structural equality
 */
function compareStructure(base, target, path = '', errors = []) {
  const currentPath = path || 'root';

  // Type check
  if (typeof base !== typeof target) {
    errors.push(`Type mismatch at ${currentPath}: expected ${typeof base}, got ${typeof target}`);
    return errors;
  }

  // Null check
  if (base === null || target === null) {
    if (base !== target) {
      errors.push(`Null mismatch at ${currentPath}`);
    }
    return errors;
  }

  // Array check
  if (Array.isArray(base)) {
    if (!Array.isArray(target)) {
      errors.push(`Expected array at ${currentPath}`);
      return errors;
    }
    if (base.length !== target.length) {
      errors.push(`Array length mismatch at ${currentPath}: expected ${base.length}, got ${target.length}`);
      return errors;
    }
    for (let i = 0; i < base.length; i++) {
      compareStructure(base[i], target[i], `${currentPath}[${i}]`, errors);
    }
    return errors;
  }

  // Object check
  if (typeof base === 'object') {
    const baseKeys = Object.keys(base).sort();
    const targetKeys = Object.keys(target).sort();

    // Check for missing keys
    for (const key of baseKeys) {
      if (!(key in target)) {
        errors.push(`Missing key at ${currentPath}.${key}`);
      }
    }

    // Check for extra keys
    for (const key of targetKeys) {
      if (!(key in base)) {
        errors.push(`Extra key at ${currentPath}.${key}`);
      }
    }

    // Recursively check common keys
    for (const key of baseKeys) {
      if (key in target) {
        const newPath = path ? `${path}.${key}` : key;

        // Non-translatable fields must be identical
        if (NON_TRANSLATABLE_FIELDS.has(key)) {
          if (JSON.stringify(base[key]) !== JSON.stringify(target[key])) {
            errors.push(`Non-translatable field mismatch at ${newPath}: expected ${JSON.stringify(base[key])}, got ${JSON.stringify(target[key])}`);
          }
        } else {
          compareStructure(base[key], target[key], newPath, errors);
        }
      }
    }
    return errors;
  }

  // String placeholder check
  if (typeof base === 'string' && typeof target === 'string') {
    const basePlaceholders = extractPlaceholders(base);
    const targetPlaceholders = extractPlaceholders(target);
    if (JSON.stringify(basePlaceholders) !== JSON.stringify(targetPlaceholders)) {
      errors.push(`Placeholder mismatch at ${currentPath}: expected [${basePlaceholders.join(', ')}], got [${targetPlaceholders.join(', ')}]`);
    }
  }

  return errors;
}

/**
 * Validate a single lesson across all locales
 */
function validateLesson(baseName, locales) {
  const results = {
    baseName,
    locales: Array.from(locales),
    errors: [],
    warnings: [],
  };

  // Load base (ja) file
  const baseLesson = loadLesson(baseName, BASE_LOCALE);
  if (!baseLesson) {
    results.errors.push(`Base locale (${BASE_LOCALE}) file not found`);
    return results;
  }
  if (baseLesson.error) {
    results.errors.push(`Base locale (${BASE_LOCALE}) parse error: ${baseLesson.error}`);
    return results;
  }

  // Validate each other locale
  for (const locale of locales) {
    if (locale === BASE_LOCALE) continue;

    const targetLesson = loadLesson(baseName, locale);
    if (!targetLesson) {
      // Not an error - locale doesn't exist yet (gradual rollout)
      continue;
    }
    if (targetLesson.error) {
      results.errors.push(`[${locale}] Parse error: ${targetLesson.error}`);
      continue;
    }

    // Compare structure
    const structureErrors = compareStructure(baseLesson, targetLesson);
    for (const err of structureErrors) {
      results.errors.push(`[${locale}] ${err}`);
    }
  }

  return results;
}

/**
 * Main validation function
 */
function validate() {
  const isCheckMode = process.argv.includes('--check');
  const allErrors = [];
  const allWarnings = [];

  console.log('=== Lesson Locale Validation Report ===\n');
  console.log(`Mode: ${isCheckMode ? 'CHECK (CI)' : 'REPORT'}\n`);

  // Get all lessons
  const lessons = getLessonBaseNames();
  console.log(`Found ${lessons.size} lesson(s)\n`);

  // Summary
  const summary = {
    total: lessons.size,
    withMultipleLocales: 0,
    errors: 0,
  };

  // Validate each lesson
  for (const [baseName, locales] of lessons) {
    const results = validateLesson(baseName, locales);

    // Count lessons with multiple locales
    if (locales.size > 1) {
      summary.withMultipleLocales++;
    }

    // Report
    const localeList = Array.from(locales).join(', ');
    const status = results.errors.length === 0 ? 'OK' : 'ERRORS';
    console.log(`${baseName} [${localeList}]: ${status}`);

    if (results.errors.length > 0) {
      summary.errors += results.errors.length;
      for (const err of results.errors) {
        console.log(`  ERROR: ${err}`);
        allErrors.push(`${baseName}: ${err}`);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total lessons: ${summary.total}`);
  console.log(`Lessons with translations: ${summary.withMultipleLocales}`);
  console.log(`Total errors: ${summary.errors}`);

  // Exit code
  if (isCheckMode && allErrors.length > 0) {
    console.log('\nStatus: FAIL');
    process.exit(1);
  } else {
    console.log('\nStatus: PASS');
    process.exit(0);
  }
}

// Run
validate();
