#!/usr/bin/env node
/**
 * lint-translation-glossary.js
 *
 * Rule-based translation quality linter.
 * Checks:
 * - Term consistency (glossary terms)
 * - Banned expressions (too assertive)
 * - Hedging expression pairs (JA ↔ EN consistency)
 *
 * Usage:
 *   node scripts/lint-translation-glossary.js
 *   node scripts/lint-translation-glossary.js --strict  # Treat warnings as errors
 */

const fs = require('fs');
const path = require('path');

// === Configuration ===
const LESSONS_ROOT = 'data/lessons';
const RULES_PATH = 'scripts/translation-glossary.rules.json';
const REPORT_PATH = 'docs/_reports/translation_glossary.md';

const args = process.argv.slice(2);
const STRICT_MODE = args.includes('--strict');

// === Load Rules ===
let RULES;
try {
  RULES = JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));
} catch (err) {
  console.error(`❌ Failed to load rules from ${RULES_PATH}:`, err.message);
  process.exit(1);
}

// === Utilities ===
function extractTextFields(item) {
  const texts = [];
  const fields = ['question', 'your_response_prompt', 'explanation', 'actionable_advice'];

  for (const field of fields) {
    if (item[field] && typeof item[field] === 'string') {
      texts.push({ field, text: item[field] });
    }
  }

  if (item.choices && Array.isArray(item.choices)) {
    item.choices.forEach((c, i) => {
      if (typeof c === 'string') {
        texts.push({ field: `choices[${i}]`, text: c });
      }
    });
  }

  // expanded_details
  if (item.expanded_details) {
    const ed = item.expanded_details;
    if (ed.try_this) texts.push({ field: 'expanded_details.try_this', text: ed.try_this });
    if (ed.best_for && Array.isArray(ed.best_for)) {
      ed.best_for.forEach((b, i) => texts.push({ field: `expanded_details.best_for[${i}]`, text: b }));
    }
    if (ed.limitations && Array.isArray(ed.limitations)) {
      ed.limitations.forEach((l, i) => texts.push({ field: `expanded_details.limitations[${i}]`, text: l }));
    }
  }

  return texts;
}

// === Linting Functions ===
function checkBannedExpressions(text, lang, rules) {
  const issues = [];
  const bannedList = rules.banned_expressions[lang] || [];

  for (const banned of bannedList) {
    const regex = new RegExp(banned.pattern, banned.flags || 'i');
    if (regex.test(text)) {
      issues.push({
        type: 'banned',
        severity: 'warning',
        message: banned.message || `Contains banned expression: "${banned.pattern}"`,
        matched: text.match(regex)?.[0]
      });
    }
  }

  return issues;
}

function checkGlossaryTerms(jaTexts, enTexts, rules) {
  const issues = [];
  const glossary = rules.glossary || [];

  for (const term of glossary) {
    // Check if JA contains the term
    const jaHasTerm = jaTexts.some(t => t.text.includes(term.ja));
    const enHasTerm = enTexts.some(t => {
      const regex = new RegExp(term.en, 'i');
      return regex.test(t.text);
    });

    if (jaHasTerm && !enHasTerm) {
      issues.push({
        type: 'glossary_missing',
        severity: 'warning',
        message: `JA has "${term.ja}" but EN missing expected translation "${term.en}"`,
        ja_term: term.ja,
        en_expected: term.en
      });
    }
  }

  return issues;
}

function checkHedgingPairs(jaTexts, enTexts, rules) {
  const issues = [];
  const hedging = rules.hedging_pairs || [];

  for (const pair of hedging) {
    const jaHas = jaTexts.some(t => t.text.includes(pair.ja));
    const enHas = enTexts.some(t => {
      const regex = new RegExp(pair.en, 'i');
      return regex.test(t.text);
    });

    // If JA has hedging but EN doesn't, warn
    if (jaHas && !enHas) {
      issues.push({
        type: 'hedging_missing',
        severity: 'warning',
        message: `JA has hedging "${pair.ja}" but EN missing equivalent "${pair.en}"`,
        ja_hedge: pair.ja,
        en_expected: pair.en
      });
    }
  }

  return issues;
}

// === Main Processing ===
function lintLessonPair(jaPath, enPath, lessonId) {
  const issues = [];

  let jaData, enData;
  try {
    jaData = JSON.parse(fs.readFileSync(jaPath, 'utf-8'));
  } catch (err) {
    return [{ type: 'parse_error', severity: 'error', message: `Failed to parse JA: ${err.message}` }];
  }

  try {
    enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  } catch (err) {
    return [{ type: 'parse_error', severity: 'error', message: `Failed to parse EN: ${err.message}` }];
  }

  // Build maps by ID
  const jaMap = new Map(jaData.map(item => [item.id, item]));
  const enMap = new Map(enData.map(item => [item.id, item]));

  // Check each item pair
  for (const [id, jaItem] of jaMap) {
    const enItem = enMap.get(id);
    if (!enItem) {
      issues.push({
        id,
        type: 'missing_translation',
        severity: 'error',
        message: `EN translation missing for ${id}`
      });
      continue;
    }

    const jaTexts = extractTextFields(jaItem);
    const enTexts = extractTextFields(enItem);

    // Check banned expressions in EN
    for (const { field, text } of enTexts) {
      const bannedIssues = checkBannedExpressions(text, 'en', RULES);
      for (const issue of bannedIssues) {
        issues.push({ id, field, ...issue });
      }
    }

    // Check glossary terms
    const glossaryIssues = checkGlossaryTerms(jaTexts, enTexts, RULES);
    for (const issue of glossaryIssues) {
      issues.push({ id, ...issue });
    }

    // Check hedging pairs
    const hedgingIssues = checkHedgingPairs(jaTexts, enTexts, RULES);
    for (const issue of hedgingIssues) {
      issues.push({ id, ...issue });
    }
  }

  return issues;
}

function generateReport(allIssues, stats) {
  let md = `# Translation Glossary Lint Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Lessons checked | ${stats.lessonsChecked} |
| Total issues | ${stats.totalIssues} |
| Errors | ${stats.errors} |
| Warnings | ${stats.warnings} |

## Issue Types

| Type | Count | Description |
|------|-------|-------------|
| banned | ${stats.byType.banned || 0} | Too assertive expressions |
| glossary_missing | ${stats.byType.glossary_missing || 0} | Expected translation term missing |
| hedging_missing | ${stats.byType.hedging_missing || 0} | Hedging expression inconsistency |
| missing_translation | ${stats.byType.missing_translation || 0} | EN item missing for JA item |
| parse_error | ${stats.byType.parse_error || 0} | JSON parse failures |

`;

  if (allIssues.length === 0) {
    md += `\n## Results\n\n✅ No issues found!\n`;
  } else {
    md += `\n## Issues by Lesson\n\n`;

    // Group by lesson
    const byLesson = {};
    for (const issue of allIssues) {
      const lesson = issue.lesson || 'unknown';
      if (!byLesson[lesson]) byLesson[lesson] = [];
      byLesson[lesson].push(issue);
    }

    for (const [lesson, issues] of Object.entries(byLesson)) {
      md += `### ${lesson}\n\n`;
      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        const field = issue.field ? ` (${issue.field})` : '';
        const id = issue.id ? `**${issue.id}**${field}: ` : '';
        md += `- ${icon} ${id}${issue.message}\n`;
      }
      md += '\n';
    }
  }

  md += `
## Rules Reference

See \`scripts/translation-glossary.rules.json\` for the full ruleset.

## Next Steps

\`\`\`bash
# Re-run after fixes
node scripts/lint-translation-glossary.js

# Run in strict mode (fail on warnings)
node scripts/lint-translation-glossary.js --strict
\`\`\`
`;

  return md;
}

function main() {
  console.log('🔍 Translation Glossary Lint');
  console.log(`   Mode: ${STRICT_MODE ? 'STRICT' : 'WARNING-ONLY'}`);
  console.log('');

  const units = ['mental_units', 'health_units', 'money_units', 'social_units', 'study_units', 'work_units'];
  const allIssues = [];
  let lessonsChecked = 0;

  for (const unit of units) {
    const unitDir = path.join(LESSONS_ROOT, unit);
    if (!fs.existsSync(unitDir)) continue;

    const files = fs.readdirSync(unitDir).filter(f => f.endsWith('.ja.json'));

    for (const jaFile of files) {
      const lessonId = jaFile.replace('.ja.json', '');
      const jaPath = path.join(unitDir, jaFile);
      const enPath = path.join(unitDir, `${lessonId}.en.json`);

      if (!fs.existsSync(enPath)) {
        console.log(`  ⏭️ ${lessonId}: No EN file, skipping`);
        continue;
      }

      console.log(`  📄 ${lessonId}`);
      lessonsChecked++;

      const issues = lintLessonPair(jaPath, enPath, lessonId);
      for (const issue of issues) {
        issue.lesson = lessonId;
        allIssues.push(issue);

        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.log(`     ${icon} ${issue.type}: ${issue.message.slice(0, 60)}...`);
      }

      if (issues.length === 0) {
        console.log(`     ✅ OK`);
      }
    }
  }

  // Stats
  const stats = {
    lessonsChecked,
    totalIssues: allIssues.length,
    errors: allIssues.filter(i => i.severity === 'error').length,
    warnings: allIssues.filter(i => i.severity === 'warning').length,
    byType: {}
  };

  for (const issue of allIssues) {
    stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
  }

  // Generate report
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const report = generateReport(allIssues, stats);
  fs.writeFileSync(REPORT_PATH, report);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`   Lessons checked: ${lessonsChecked}`);
  console.log(`   Total issues: ${allIssues.length}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`   Warnings: ${stats.warnings}`);
  console.log(`   Report: ${REPORT_PATH}`);

  // Exit code
  if (STRICT_MODE && allIssues.length > 0) {
    console.log('\n❌ FAIL: Issues found in strict mode');
    process.exit(1);
  } else if (stats.errors > 0) {
    console.log('\n❌ FAIL: Errors found');
    process.exit(1);
  } else {
    console.log('\n✅ PASS');
    process.exit(0);
  }
}

main();
