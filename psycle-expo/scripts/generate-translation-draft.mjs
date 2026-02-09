#!/usr/bin/env node
/**
 * generate-translation-draft.mjs
 *
 * Generates translation drafts from JA source files to any target language.
 * Features:
 * - Differential update: Only regenerates questions where JA content changed
 * - Manual edit protection: Warns if target was hand-edited since last generation
 * - Cache-based change detection via SHA256 hash
 * - Multi-language support via --lang option
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs              # Default: en
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --lang=es    # Spanish
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --lang=zh    # Chinese
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --dry-run
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --force
 *   node scripts/generate-translation-draft.mjs --init-cache                       # Init EN cache
 *   node scripts/generate-translation-draft.mjs --init-cache --lang=es             # Init ES cache
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// === Configuration ===
const LESSONS_ROOT = 'data/lessons';
const CACHE_DIR = 'data/lessons/_translation_cache';

// Language configuration
const LANG_CONFIG = {
  en: { name: 'English', instruction: 'Translate Japanese to English.' },
  es: { name: 'Spanish', instruction: 'Translate Japanese to Spanish (Latin American).' },
  zh: { name: 'Chinese (Simplified)', instruction: 'Translate Japanese to Simplified Chinese.' },
  ko: { name: 'Korean', instruction: 'Translate Japanese to Korean.' },
  fr: { name: 'French', instruction: 'Translate Japanese to French.' },
  de: { name: 'German', instruction: 'Translate Japanese to German.' },
  pt: { name: 'Portuguese', instruction: 'Translate Japanese to Portuguese (Brazilian).' },
};

// Fields to translate
export const TOP_LEVEL_TRANSLATABLE_FIELDS = [
  'question',
  'your_response_prompt',
  'choices',
  'explanation',
  'actionable_advice',
];

export const EXPANDED_DETAILS_TRANSLATABLE_FIELDS = [
  'try_this',
  'best_for',
  'limitations',
  'citation_role',
  'claim_tags',
];

export const EXPANDED_DETAILS_OBJECT_TRANSLATABLE_FIELDS = [
  'tiny_metric',
  'comparator',
  'fallback',
];

// Fields included in hash for change detection (JA side)
const HASH_FIELDS = [
  'question',
  'your_response_prompt',
  'choices',
  'explanation',
  'actionable_advice',
];

// === CLI Args ===
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const INIT_CACHE = args.includes('--init-cache');

// Parse --lang=XX option
function parseLang() {
  const langArg = args.find(a => a.startsWith('--lang='));
  if (langArg) {
    const lang = langArg.split('=')[1];
    if (!LANG_CONFIG[lang]) {
      console.error(`❌ Unsupported language: ${lang}`);
      console.error(`   Supported: ${Object.keys(LANG_CONFIG).join(', ')}`);
      process.exit(1);
    }
    return lang;
  }
  return 'en'; // Default
}

const TARGET_LANG = parseLang();

// === OpenAI Setup (lazy load) ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openai = null;
async function getOpenAI() {
  if (!OPENAI_API_KEY) {
    if (DRY_RUN || INIT_CACHE) return null;
    throw new Error('OPENAI_API_KEY is required (unless --dry-run or --init-cache)');
  }

  if (!openai && OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openai;
}

// === Hash Utilities ===
function computeHash(obj) {
  const content = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function extractHashableContent(item) {
  const result = {};
  for (const field of HASH_FIELDS) {
    if (item[field] !== undefined) {
      result[field] = item[field];
    }
  }
  return result;
}

// === Cache Management ===
async function loadCache(lessonId) {
  const cachePath = path.join(CACHE_DIR, `${lessonId}.${TARGET_LANG}.cache.json`);
  try {
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {}; // No cache exists
  }
}

async function saveCache(lessonId, cache) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${lessonId}.${TARGET_LANG}.cache.json`);
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
}

// === Translation ===
async function translateText(text, context = '') {
  const client = await getOpenAI();
  if (!client) return `[DRAFT] ${text}`;

  const langConfig = LANG_CONFIG[TARGET_LANG];
  const systemPrompt = `You are a professional translator for a psychology learning app called "Psycle".
${langConfig.instruction} Guidelines:
- Keep the tone educational but accessible and warm
- Preserve any emojis
- Use natural, conversational ${langConfig.name}
- Keep technical psychology terms accurate (e.g., "rumination", "cognitive appraisal" - use standard translations for these terms in ${langConfig.name})
- Maintain the supportive, non-judgmental tone
${context ? `Context: ${context}` : ''}`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ]
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`  ⚠️ Translation error: ${error.message}`);
    return `[ERROR] ${text}`;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function translateMixedValue(value, translateFn, context) {
  if (typeof value === 'string') {
    return value.trim() ? translateFn(value, context) : value;
  }
  if (Array.isArray(value)) {
    const translated = [];
    for (const item of value) {
      if (typeof item === 'string') {
        translated.push(item.trim() ? await translateFn(item, context) : item);
      } else {
        translated.push(clone(item));
      }
    }
    return translated;
  }
  return clone(value);
}

export async function translateItemWithPolicy(jaItem, translateFn) {
  const targetItem = { ...jaItem };

  for (const field of TOP_LEVEL_TRANSLATABLE_FIELDS) {
    if (jaItem[field] === undefined || jaItem[field] === null) continue;
    targetItem[field] = await translateMixedValue(
      jaItem[field],
      translateFn,
      field === 'choices' ? 'This is a quiz choice option' : `Field: ${field}`
    );
  }

  // Explicit translation policy for nested expanded_details fields.
  if (jaItem.expanded_details) {
    targetItem.expanded_details = { ...jaItem.expanded_details };

    for (const nf of EXPANDED_DETAILS_TRANSLATABLE_FIELDS) {
      if (jaItem.expanded_details[nf]) {
        targetItem.expanded_details[nf] = await translateMixedValue(
          jaItem.expanded_details[nf],
          translateFn,
          `expanded_details.${nf}`
        );
      }
    }

    for (const nf of EXPANDED_DETAILS_OBJECT_TRANSLATABLE_FIELDS) {
      if (jaItem.expanded_details[nf]) {
        targetItem.expanded_details[nf] = {};
        for (const [k, v] of Object.entries(jaItem.expanded_details[nf])) {
          targetItem.expanded_details[nf][k] = typeof v === 'string'
            ? await translateFn(v, `expanded_details.${nf}.${k}`)
            : clone(v);
        }
      }
    }
  }

  return targetItem;
}

async function translateItem(jaItem) {
  return translateItemWithPolicy(jaItem, translateText);
}

// === Main Processing ===
async function processLesson(jaPath) {
  const basename = path.basename(jaPath, '.ja.json');
  const dir = path.dirname(jaPath);
  const targetPath = path.join(dir, `${basename}.${TARGET_LANG}.json`);

  console.log(`\n📄 Processing: ${basename}`);

  // Load JA source
  const jaData = JSON.parse(await fs.readFile(jaPath, 'utf-8'));

  // Load existing EN (if any)
  let targetData = [];
  let targetExists = false;
  try {
    targetData = JSON.parse(await fs.readFile(targetPath, 'utf-8'));
    targetExists = true;
  } catch {
    // EN file doesn't exist yet
  }

  // Load cache
  const cache = await loadCache(basename);

  // Build EN item map for quick lookup
  const targetMap = new Map(targetData.map(item => [item.id, item]));

  // Process each item
  const newTargetData = [];
  const newCache = {};
  let translatedCount = 0;
  let skippedCount = 0;
  let manualEditWarnings = [];

  for (const jaItem of jaData) {
    const id = jaItem.id;
    const jaHashable = extractHashableContent(jaItem);
    const jaHash = computeHash(jaHashable);

    const cachedEntry = cache[id];
    const existingTarget = targetMap.get(id);

    // Check if JA content changed
    const jaChanged = !cachedEntry || cachedEntry.ja_hash !== jaHash;

    // Check if EN was manually edited (EN hash differs from cached generated hash)
    let manuallyEdited = false;
    if (cachedEntry && existingTarget && cachedEntry.en_generated_hash) {
      const currentEnHash = computeHash(extractHashableContent(existingTarget));
      manuallyEdited = currentEnHash !== cachedEntry.en_generated_hash;
    }

    // Decision logic
    let targetItem;
    if (FORCE) {
      // Force regeneration
      console.log(`  🔄 ${id}: Force regenerating...`);
      targetItem = await translateItem(jaItem);
      translatedCount++;
    } else if (!jaChanged && existingTarget && !manuallyEdited) {
      // No change, keep existing
      console.log(`  ✅ ${id}: No change, keeping existing`);
      targetItem = existingTarget;
      skippedCount++;
    } else if (jaChanged && manuallyEdited) {
      // JA changed but EN was manually edited - warn and skip
      console.log(`  ⚠️ ${id}: JA changed but EN was manually edited - NEEDS REVIEW`);
      manualEditWarnings.push({ id, reason: 'JA changed but EN was hand-edited' });
      targetItem = existingTarget; // Keep manual edit
      skippedCount++;
    } else if (jaChanged) {
      // JA changed, regenerate
      console.log(`  🔄 ${id}: JA changed, regenerating...`);
      targetItem = await translateItem(jaItem);
      translatedCount++;
    } else if (!existingTarget) {
      // New item
      console.log(`  🆕 ${id}: New item, generating...`);
      targetItem = await translateItem(jaItem);
      translatedCount++;
    } else {
      // Keep existing
      targetItem = existingTarget;
      skippedCount++;
    }

    newTargetData.push(targetItem);

    // Update cache entry
    newCache[id] = {
      ja_hash: jaHash,
      en_generated_hash: computeHash(extractHashableContent(targetItem)),
      last_updated: new Date().toISOString()
    };
  }

  // Summary
  console.log(`  📊 Summary: ${translatedCount} translated, ${skippedCount} skipped`);

  if (manualEditWarnings.length > 0) {
    console.log(`  ⚠️ Manual edit warnings (${manualEditWarnings.length}):`);
    for (const w of manualEditWarnings) {
      console.log(`     - ${w.id}: ${w.reason}`);
    }
  }

  // Write output (unless dry-run)
  if (!DRY_RUN) {
    await fs.writeFile(targetPath, JSON.stringify(newTargetData, null, 4));
    await saveCache(basename, newCache);
    console.log(`  💾 Saved: ${targetPath}`);
  } else {
    console.log(`  🔍 DRY-RUN: Would write to ${targetPath}`);
  }

  return { basename, translatedCount, skippedCount, manualEditWarnings };
}

// === Init Cache Mode ===
async function initCacheForLesson(jaPath) {
  const basename = path.basename(jaPath, '.ja.json');
  const dir = path.dirname(jaPath);
  const targetPath = path.join(dir, `${basename}.${TARGET_LANG}.json`);

  // Check if target language file exists
  let targetData;
  try {
    targetData = JSON.parse(await fs.readFile(targetPath, 'utf-8'));
  } catch {
    console.log(`  ⏭️ ${basename}: No ${TARGET_LANG.toUpperCase()} file, skipping`);
    return { basename, initialized: 0, skipped: true };
  }

  // Load JA source
  const jaData = JSON.parse(await fs.readFile(jaPath, 'utf-8'));
  const jaMap = new Map(jaData.map(item => [item.id, item]));

  // Build cache from existing files
  const newCache = {};
  let initialized = 0;

  for (const targetItem of targetData) {
    const id = targetItem.id;
    const jaItem = jaMap.get(id);

    if (!jaItem) {
      console.log(`  ⚠️ ${id}: No matching JA item`);
      continue;
    }

    const jaHash = computeHash(extractHashableContent(jaItem));
    const targetHash = computeHash(extractHashableContent(targetItem));

    newCache[id] = {
      ja_hash: jaHash,
      en_generated_hash: targetHash,
      last_updated: new Date().toISOString()
    };
    initialized++;
  }

  await saveCache(basename, newCache);
  console.log(`  ✅ ${basename}: Initialized ${initialized} items`);

  return { basename, initialized, skipped: false };
}

async function runInitCache() {
  const langConfig = LANG_CONFIG[TARGET_LANG];
  console.log(`🔧 Initializing translation cache for ${langConfig.name} (${TARGET_LANG})`);
  console.log('');

  const units = ['mental_units', 'health_units', 'money_units', 'social_units', 'study_units', 'work_units'];
  const jaFiles = [];

  for (const unit of units) {
    const unitDir = path.join(LESSONS_ROOT, unit);
    try {
      const files = await fs.readdir(unitDir);
      for (const f of files) {
        if (f.endsWith('.ja.json')) {
          jaFiles.push(path.join(unitDir, f));
        }
      }
    } catch {
      // Unit doesn't exist
    }
  }

  console.log(`📁 Found ${jaFiles.length} JA lesson files\n`);

  let totalInitialized = 0;
  let totalSkipped = 0;

  for (const jaFile of jaFiles.sort()) {
    const result = await initCacheForLesson(jaFile);
    if (result.skipped) {
      totalSkipped++;
    } else {
      totalInitialized += result.initialized;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Init Cache Summary');
  console.log('='.repeat(50));
  console.log(`   Total items cached: ${totalInitialized}`);
  console.log(`   Lessons skipped (no ${TARGET_LANG.toUpperCase()}): ${totalSkipped}`);
  console.log(`   Cache dir: ${CACHE_DIR}`);
  console.log('\n✅ Cache initialized! Future runs will only translate changed items.');
}

async function main() {
  if (!OPENAI_API_KEY && !DRY_RUN && !INIT_CACHE) {
    console.error('❌ OPENAI_API_KEY is required (unless --dry-run or --init-cache)');
    process.exit(1);
  }

  // Handle --init-cache mode
  if (INIT_CACHE) {
    await runInitCache();
    return;
  }

  const langConfig = LANG_CONFIG[TARGET_LANG];
  console.log('🚀 Translation Draft Generator');
  console.log(`   Target: ${langConfig.name} (${TARGET_LANG})`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY-RUN' : FORCE ? 'FORCE' : 'DIFFERENTIAL'}`);
  console.log('');

  // Find all JA lesson files
  const units = ['mental_units', 'health_units', 'money_units', 'social_units', 'study_units', 'work_units'];
  const jaFiles = [];

  for (const unit of units) {
    const unitDir = path.join(LESSONS_ROOT, unit);
    try {
      const files = await fs.readdir(unitDir);
      for (const f of files) {
        if (f.endsWith('.ja.json')) {
          jaFiles.push(path.join(unitDir, f));
        }
      }
    } catch {
      // Unit doesn't exist
    }
  }

  console.log(`📁 Found ${jaFiles.length} JA lesson files\n`);

  // Process each
  const results = [];
  for (const jaFile of jaFiles.sort()) {
    const result = await processLesson(jaFile);
    results.push(result);
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Final Summary');
  console.log('='.repeat(50));

  let totalTranslated = 0;
  let totalSkipped = 0;
  let totalWarnings = 0;

  for (const r of results) {
    totalTranslated += r.translatedCount;
    totalSkipped += r.skippedCount;
    totalWarnings += r.manualEditWarnings.length;
  }

  console.log(`   Total translated: ${totalTranslated}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Manual edit warnings: ${totalWarnings}`);

  if (totalWarnings > 0) {
    console.log('\n⚠️ Items needing manual review:');
    for (const r of results) {
      for (const w of r.manualEditWarnings) {
        console.log(`   - ${r.basename}/${w.id}`);
      }
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 This was a DRY-RUN. No files were modified.');
  }

  console.log('\n✅ Done!');
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}
