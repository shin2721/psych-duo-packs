#!/usr/bin/env node
/**
 * generate-translation-draft.mjs
 *
 * Generates EN translation drafts from JA source files.
 * Features:
 * - Differential update: Only regenerates questions where JA content changed
 * - Manual edit protection: Warns if EN was hand-edited since last generation
 * - Cache-based change detection via SHA256 hash
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --dry-run
 *   OPENAI_API_KEY=sk-... node scripts/generate-translation-draft.mjs --force
 *   node scripts/generate-translation-draft.mjs --init-cache  # Initialize cache from existing EN files
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// === Configuration ===
const LESSONS_ROOT = 'data/lessons';
const CACHE_DIR = 'data/lessons/_translation_cache';
const TARGET_LANG = 'en';

// Fields to translate
const TRANSLATABLE_FIELDS = [
  'question',
  'your_response_prompt',
  'choices',
  'explanation',
  'actionable_advice',
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

// === OpenAI Setup (lazy load) ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY && !DRY_RUN && !INIT_CACHE) {
  console.error('❌ OPENAI_API_KEY is required (unless --dry-run or --init-cache)');
  process.exit(1);
}

let openai = null;
async function getOpenAI() {
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

  const systemPrompt = `You are a professional translator for a psychology learning app called "Psycle".
Translate Japanese to English. Guidelines:
- Keep the tone educational but accessible and warm
- Preserve any emojis
- Use natural, conversational English
- Keep technical psychology terms accurate (e.g., "rumination", "cognitive appraisal")
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

async function translateItem(jaItem) {
  const enItem = { ...jaItem };

  for (const field of TRANSLATABLE_FIELDS) {
    if (jaItem[field] === undefined || jaItem[field] === null) continue;

    if (field === 'choices' && Array.isArray(jaItem[field])) {
      enItem[field] = [];
      for (const choice of jaItem[field]) {
        enItem[field].push(await translateText(choice, 'This is a quiz choice option'));
      }
    } else if (typeof jaItem[field] === 'string' && jaItem[field].trim()) {
      enItem[field] = await translateText(jaItem[field], `Field: ${field}`);
    }
  }

  // Translate nested expanded_details fields if present
  if (jaItem.expanded_details) {
    enItem.expanded_details = { ...jaItem.expanded_details };

    const nestedFields = ['try_this', 'best_for', 'limitations'];
    for (const nf of nestedFields) {
      if (jaItem.expanded_details[nf]) {
        if (Array.isArray(jaItem.expanded_details[nf])) {
          enItem.expanded_details[nf] = [];
          for (const item of jaItem.expanded_details[nf]) {
            enItem.expanded_details[nf].push(await translateText(item));
          }
        } else if (typeof jaItem.expanded_details[nf] === 'string') {
          enItem.expanded_details[nf] = await translateText(jaItem.expanded_details[nf]);
        }
      }
    }

    // tiny_metric, comparator, fallback
    if (jaItem.expanded_details.tiny_metric) {
      enItem.expanded_details.tiny_metric = {};
      for (const [k, v] of Object.entries(jaItem.expanded_details.tiny_metric)) {
        enItem.expanded_details.tiny_metric[k] = typeof v === 'string' ? await translateText(v) : v;
      }
    }
    if (jaItem.expanded_details.comparator) {
      enItem.expanded_details.comparator = {};
      for (const [k, v] of Object.entries(jaItem.expanded_details.comparator)) {
        enItem.expanded_details.comparator[k] = typeof v === 'string' ? await translateText(v) : v;
      }
    }
    if (jaItem.expanded_details.fallback) {
      enItem.expanded_details.fallback = {};
      for (const [k, v] of Object.entries(jaItem.expanded_details.fallback)) {
        enItem.expanded_details.fallback[k] = typeof v === 'string' ? await translateText(v) : v;
      }
    }
  }

  return enItem;
}

// === Main Processing ===
async function processLesson(jaPath) {
  const basename = path.basename(jaPath, '.ja.json');
  const dir = path.dirname(jaPath);
  const enPath = path.join(dir, `${basename}.en.json`);

  console.log(`\n📄 Processing: ${basename}`);

  // Load JA source
  const jaData = JSON.parse(await fs.readFile(jaPath, 'utf-8'));

  // Load existing EN (if any)
  let enData = [];
  let enExists = false;
  try {
    enData = JSON.parse(await fs.readFile(enPath, 'utf-8'));
    enExists = true;
  } catch {
    // EN file doesn't exist yet
  }

  // Load cache
  const cache = await loadCache(basename);

  // Build EN item map for quick lookup
  const enMap = new Map(enData.map(item => [item.id, item]));

  // Process each item
  const newEnData = [];
  const newCache = {};
  let translatedCount = 0;
  let skippedCount = 0;
  let manualEditWarnings = [];

  for (const jaItem of jaData) {
    const id = jaItem.id;
    const jaHashable = extractHashableContent(jaItem);
    const jaHash = computeHash(jaHashable);

    const cachedEntry = cache[id];
    const existingEn = enMap.get(id);

    // Check if JA content changed
    const jaChanged = !cachedEntry || cachedEntry.ja_hash !== jaHash;

    // Check if EN was manually edited (EN hash differs from cached generated hash)
    let manuallyEdited = false;
    if (cachedEntry && existingEn && cachedEntry.en_generated_hash) {
      const currentEnHash = computeHash(extractHashableContent(existingEn));
      manuallyEdited = currentEnHash !== cachedEntry.en_generated_hash;
    }

    // Decision logic
    let enItem;
    if (FORCE) {
      // Force regeneration
      console.log(`  🔄 ${id}: Force regenerating...`);
      enItem = await translateItem(jaItem);
      translatedCount++;
    } else if (!jaChanged && existingEn && !manuallyEdited) {
      // No change, keep existing
      console.log(`  ✅ ${id}: No change, keeping existing`);
      enItem = existingEn;
      skippedCount++;
    } else if (jaChanged && manuallyEdited) {
      // JA changed but EN was manually edited - warn and skip
      console.log(`  ⚠️ ${id}: JA changed but EN was manually edited - NEEDS REVIEW`);
      manualEditWarnings.push({ id, reason: 'JA changed but EN was hand-edited' });
      enItem = existingEn; // Keep manual edit
      skippedCount++;
    } else if (jaChanged) {
      // JA changed, regenerate
      console.log(`  🔄 ${id}: JA changed, regenerating...`);
      enItem = await translateItem(jaItem);
      translatedCount++;
    } else if (!existingEn) {
      // New item
      console.log(`  🆕 ${id}: New item, generating...`);
      enItem = await translateItem(jaItem);
      translatedCount++;
    } else {
      // Keep existing
      enItem = existingEn;
      skippedCount++;
    }

    newEnData.push(enItem);

    // Update cache entry
    newCache[id] = {
      ja_hash: jaHash,
      en_generated_hash: computeHash(extractHashableContent(enItem)),
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
    await fs.writeFile(enPath, JSON.stringify(newEnData, null, 4));
    await saveCache(basename, newCache);
    console.log(`  💾 Saved: ${enPath}`);
  } else {
    console.log(`  🔍 DRY-RUN: Would write to ${enPath}`);
  }

  return { basename, translatedCount, skippedCount, manualEditWarnings };
}

// === Init Cache Mode ===
async function initCacheForLesson(jaPath) {
  const basename = path.basename(jaPath, '.ja.json');
  const dir = path.dirname(jaPath);
  const enPath = path.join(dir, `${basename}.en.json`);

  // Check if EN file exists
  let enData;
  try {
    enData = JSON.parse(await fs.readFile(enPath, 'utf-8'));
  } catch {
    console.log(`  ⏭️ ${basename}: No EN file, skipping`);
    return { basename, initialized: 0, skipped: true };
  }

  // Load JA source
  const jaData = JSON.parse(await fs.readFile(jaPath, 'utf-8'));
  const jaMap = new Map(jaData.map(item => [item.id, item]));

  // Build cache from existing files
  const newCache = {};
  let initialized = 0;

  for (const enItem of enData) {
    const id = enItem.id;
    const jaItem = jaMap.get(id);

    if (!jaItem) {
      console.log(`  ⚠️ ${id}: No matching JA item`);
      continue;
    }

    const jaHash = computeHash(extractHashableContent(jaItem));
    const enHash = computeHash(extractHashableContent(enItem));

    newCache[id] = {
      ja_hash: jaHash,
      en_generated_hash: enHash,
      last_updated: new Date().toISOString()
    };
    initialized++;
  }

  await saveCache(basename, newCache);
  console.log(`  ✅ ${basename}: Initialized ${initialized} items`);

  return { basename, initialized, skipped: false };
}

async function runInitCache() {
  console.log('🔧 Initializing translation cache from existing EN files');
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
  console.log(`   Lessons skipped (no EN): ${totalSkipped}`);
  console.log(`   Cache dir: ${CACHE_DIR}`);
  console.log('\n✅ Cache initialized! Future runs will only translate changed items.');
}

async function main() {
  // Handle --init-cache mode
  if (INIT_CACHE) {
    await runInitCache();
    return;
  }

  console.log('🚀 Translation Draft Generator');
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

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
