// scripts/pack_qa.mjs
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

/**
 * Psycle Pack QA Validator
 *
 * Validates pack integrity and format compliance
 */

async function validatePack(packDir) {
  const errors = [];
  const warnings = [];
  const fixes = [];

  // Load all files
  const packPath = `${packDir}/pack.json`;
  const spansPath = `${packDir}/spans.jsonl`;
  const itemsPath = `${packDir}/items.jsonl`;
  const schedulePath = `${packDir}/schedule.jsonl`;

  if (!existsSync(packPath)) {
    errors.push(`Missing pack.json`);
    return { errors, warnings, fixes };
  }

  const pack = JSON.parse(await readFile(packPath, "utf8"));
  const spansText = await readFile(spansPath, "utf8");
  const itemsText = await readFile(itemsPath, "utf8");
  const scheduleText = await readFile(schedulePath, "utf8");

  const spans = spansText.trim().split("\n").map(line => JSON.parse(line));
  const items = itemsText.trim().split("\n").map(line => JSON.parse(line));
  const schedule = scheduleText.trim().split("\n").map(line => JSON.parse(line));

  // Create lookup maps
  const spanIds = new Set(spans.map(s => s.id));
  const itemIds = new Set(items.map(i => i.id));
  const scheduleItemIds = new Set(schedule.map(s => s.item_id));

  console.log(`\n📊 Pack: ${pack.id}`);
  console.log(`   Profile: ${pack.profiles.join(", ")}`);
  console.log(`   Units: ${pack.units.length}`);
  console.log(`   Items: ${items.length}`);
  console.log(`   Spans: ${spans.length}`);
  console.log(`   Schedule: ${schedule.length}`);

  // Check 1: Evidence span references
  console.log(`\n✓ Checking evidence span references...`);
  const missingSpans = [];
  for (const item of items) {
    if (!item.evidence_span_id) {
      errors.push(`Item ${item.id} missing evidence_span_id`);
    } else if (!spanIds.has(item.evidence_span_id)) {
      missingSpans.push(`${item.id} → ${item.evidence_span_id}`);
    }
  }
  if (missingSpans.length > 0) {
    errors.push(`${missingSpans.length} items reference missing spans:\n  ${missingSpans.slice(0, 5).join("\n  ")}`);
  }

  // Check 2: Lesson distribution
  console.log(`✓ Checking lesson distribution...`);
  const lessonCounts = new Map();
  const unitLessonCounts = new Map();

  for (const item of items) {
    const key = `${item.unit}_l${item.lesson}`;
    lessonCounts.set(key, (lessonCounts.get(key) || 0) + 1);
    unitLessonCounts.set(item.unit, (unitLessonCounts.get(item.unit) || 0) + 1);
  }

  const expectedPerLesson = pack.lesson_size;
  const unevenLessons = [];

  for (const unit of pack.units) {
    for (let lesson = 1; lesson <= unit.lessons; lesson++) {
      const key = `${unit.id}_l${lesson}`;
      const count = lessonCounts.get(key) || 0;
      if (count !== expectedPerLesson) {
        unevenLessons.push(`${key}: ${count}/${expectedPerLesson}`);
      }
    }
  }

  if (unevenLessons.length > 0) {
    errors.push(`Uneven lesson distribution:\n  ${unevenLessons.join("\n  ")}`);
  }

  // Check 3: Pack.json vs items.jsonl unit consistency
  console.log(`✓ Checking unit consistency...`);
  const packUnitIds = new Set(pack.units.map(u => u.id));
  const itemUnitIds = new Set(items.map(i => i.unit));

  const extraUnitsInItems = [...itemUnitIds].filter(u => !packUnitIds.has(u));
  const missingUnitsInItems = [...packUnitIds].filter(u => !itemUnitIds.has(u));

  if (extraUnitsInItems.length > 0) {
    warnings.push(`Items reference units not in pack.json: ${extraUnitsInItems.join(", ")}`);
  }

  if (missingUnitsInItems.length > 0) {
    // This is the issue we found - pack.json has u4_discussion but no items for it
    fixes.push({
      file: "pack.json",
      issue: `Units in pack.json have no items: ${missingUnitsInItems.join(", ")}`,
      fix: "Remove unused units from pack.json",
      data: {
        unitsToRemove: missingUnitsInItems
      }
    });
  }

  // Check 4: Profile-specific format rules
  console.log(`✓ Checking format compliance...`);
  const isLite = pack.profiles.includes("lite");
  const isPro = pack.profiles.includes("pro");
  const maxPromptLength = isLite ? 60 : 120;

  for (const item of items) {
    // Prompt length check (only for non-TF questions)
    if (item.type !== "tf" && item.prompt.length > maxPromptLength) {
      warnings.push(`${item.id}: Prompt too long (${item.prompt.length}/${maxPromptLength} chars)`);
    }

    // Choice count check
    if (item.type === "mcq") {
      const choiceCount = item.choices?.length || 0;
      if (isLite && (choiceCount < 3 || choiceCount > 4)) {
        errors.push(`${item.id}: Lite MCQ must have 3-4 choices (has ${choiceCount})`);
      }
      if (isPro && (choiceCount < 4 || choiceCount > 5)) {
        errors.push(`${item.id}: Pro MCQ must have 4-5 choices (has ${choiceCount})`);
      }
    }

    if (item.type === "tf") {
      if (item.choices?.length !== 2) {
        errors.push(`${item.id}: TF must have exactly 2 choices`);
      }
    }
  }

  // Check 5: Figure questions (Pro only)
  if (isPro) {
    console.log(`✓ Checking figure question requirements...`);
    const figureQuestions = items.filter(i =>
      i.type === "figure_reading" ||
      (i.evidence_span_id && (i.evidence_span_id.includes("Fig") || i.evidence_span_id.includes(":cap")))
    );

    const u3FigureQuestions = figureQuestions.filter(i => i.unit === "u3_results");

    if (u3FigureQuestions.length < 2) {
      warnings.push(`u3_results should have ≥2 figure questions (has ${u3FigureQuestions.length})`);
    }

    // Check other units (≥1 each, if figures exist)
    for (const unit of pack.units) {
      if (unit.id === "u3_results") continue;
      const unitFigureQuestions = figureQuestions.filter(i => i.unit === unit.id);
      if (unitFigureQuestions.length === 0 && figureQuestions.length > 2) {
        warnings.push(`${unit.id} has no figure questions (Pro pack)`);
      }
    }
  }

  // Check 6: Schedule consistency
  console.log(`✓ Checking schedule consistency...`);
  const missingScheduleItems = [...itemIds].filter(id => !scheduleItemIds.has(id));
  const extraScheduleItems = [...scheduleItemIds].filter(id => !itemIds.has(id));

  if (missingScheduleItems.length > 0) {
    errors.push(`${missingScheduleItems.length} items missing from schedule`);
  }
  if (extraScheduleItems.length > 0) {
    errors.push(`${extraScheduleItems.length} extra items in schedule`);
  }

  return { errors, warnings, fixes, pack, items, spans, schedule };
}

async function applyFixes(packDir, fixes, pack) {
  if (fixes.length === 0) return;

  console.log(`\n🔧 Applying ${fixes.length} fix(es)...`);

  for (const fix of fixes) {
    if (fix.file === "pack.json" && fix.data.unitsToRemove) {
      const unitsToRemove = new Set(fix.data.unitsToRemove);
      pack.units = pack.units.filter(u => !unitsToRemove.has(u.id));

      await writeFile(
        `${packDir}/pack.json`,
        JSON.stringify(pack, null, 2),
        "utf8"
      );

      console.log(`   ✓ Removed units: ${[...unitsToRemove].join(", ")}`);
    }
  }
}

async function main() {
  const packDir = process.argv[2];

  if (!packDir || !existsSync(packDir)) {
    console.error("Usage: node scripts/pack_qa.mjs <pack_directory>");
    console.error("Example: node scripts/pack_qa.mjs paper_packs/pack_abstract_test");
    process.exit(1);
  }

  console.log("🔍 Psycle Pack QA Validator\n");

  const { errors, warnings, fixes, pack } = await validatePack(packDir);

  // Report results
  console.log("\n" + "=".repeat(60));

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} ERROR(S):`);
    errors.forEach((err, i) => console.log(`\n${i + 1}. ${err}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} WARNING(S):`);
    warnings.forEach((warn, i) => console.log(`\n${i + 1}. ${warn}`));
  }

  if (fixes.length > 0) {
    console.log(`\n🔧 ${fixes.length} FIXABLE ISSUE(S):`);
    fixes.forEach((fix, i) => console.log(`\n${i + 1}. ${fix.issue}\n   → ${fix.fix}`));

    // Auto-apply fixes if --fix flag is present
    if (process.argv.includes("--fix")) {
      await applyFixes(packDir, fixes, pack);
    } else {
      console.log(`\n💡 Run with --fix to auto-apply fixes`);
    }
  }

  if (errors.length === 0 && warnings.length === 0 && fixes.length === 0) {
    console.log("\n✅ Pack validation passed!");
  }

  console.log("\n" + "=".repeat(60));

  // Exit with error code if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
