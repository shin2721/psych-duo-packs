#!/usr/bin/env node
/**
 * Generate index.ts for lesson unit directories from filesystem
 *
 * Scans data/lessons/*_units/ for <lesson>.<locale>.json files of the ACTIVE
 * locales (config/locales.json) and generates index.ts with the imports and
 * a locale-aware getter. The source locale (ja) is always emitted; a generated
 * locale is only wired once it is listed in `active`. Files of inactive
 * locales are ignored. Every unit always exports get<Unit>DataForLocale().
 *
 * Supports all units: mental, health, money, social, study, work
 *
 * Usage: node scripts/gen-lesson-locale-index.js
 *
 * Output: Overwrites each unit's index.ts
 */

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, '..', 'data', 'lessons');
const LOCALE_CONFIG = require(path.join(__dirname, '..', 'config', 'locales.json'));
const SOURCE_LOCALE = LOCALE_CONFIG.source;
// Generated locales that are switched on. Order = fallback priority in the getter.
const ACTIVE_TARGETS = LOCALE_CONFIG.active.filter((locale) => locale !== SOURCE_LOCALE);

// Unit config: unitDir -> { prefix, exportName }
const UNITS = {
  mental_units:  { prefix: 'mental_',  exportName: 'mentalData',  funcName: 'getMentalDataForLocale' },
  health_units:  { prefix: 'health_',  exportName: 'healthData',  funcName: 'getHealthDataForLocale' },
  money_units:   { prefix: 'money_',   exportName: 'moneyData',   funcName: 'getMoneyDataForLocale' },
  social_units:  { prefix: 'social_',  exportName: 'socialData',  funcName: 'getSocialDataForLocale' },
  study_units:   { prefix: 'study_',   exportName: 'studyData',   funcName: 'getStudyDataForLocale' },
  work_units:    { prefix: 'work_',    exportName: 'workData',    funcName: 'getWorkDataForLocale' },
};

function compareLessonNames(left, right) {
  const parse = (value) => {
    const match = value.match(/^(.*)_(l|m)(\d+)$/);
    return {
      base: match?.[1] || value,
      kind: match?.[2] || 'z',
      order: Number.parseInt(match?.[3] || '999', 10),
    };
  };

  const leftParsed = parse(left);
  const rightParsed = parse(right);
  if (leftParsed.base !== rightParsed.base) {
    return leftParsed.base.localeCompare(rightParsed.base);
  }
  if (leftParsed.kind !== rightParsed.kind) {
    return leftParsed.kind === 'l' ? -1 : 1;
  }
  return leftParsed.order - rightParsed.order;
}

function generateUnit(unitDir, config) {
  const unitPath = path.join(LESSONS_DIR, unitDir);
  if (!fs.existsSync(unitPath)) return null;

  const files = fs.readdirSync(unitPath).sort();
  const pattern = new RegExp(`^(${config.prefix}(?:l|m)\\d+)\\.([a-z]{2})\\.json$`);
  const continuityPattern = new RegExp(`^(${config.prefix}(?:l|m)\\d+)\\.continuity\\.json$`);
  const evidencePattern = new RegExp(`^(${config.prefix}(?:l|m)\\d+)\\.evidence\\.json$`);
  const lessons = new Map();
  const continuityLessons = new Set();
  const evidenceLessons = new Set();

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const [, lessonName, locale] = match;
      if (!lessons.has(lessonName)) {
        lessons.set(lessonName, new Set());
      }
      lessons.get(lessonName).add(locale);
    }

    const continuityMatch = file.match(continuityPattern);
    if (continuityMatch) {
      continuityLessons.add(continuityMatch[1]);
    }

    const evidenceMatch = file.match(evidencePattern);
    if (evidenceMatch) {
      evidenceLessons.add(evidenceMatch[1]);
    }
  }

  const sortedLessons = Array.from(lessons.keys())
    .filter((lesson) => lessons.get(lesson).has(SOURCE_LOCALE))
    .sort(compareLessonNames);
  if (sortedLessons.length === 0) return null;

  // Active generated locales that have at least one file in this unit.
  const presentTargets = ACTIVE_TARGETS.filter((locale) =>
    sortedLessons.some((lesson) => lessons.get(lesson).has(locale))
  );

  // Build imports
  const jaImports = [];
  const targetImports = new Map(presentTargets.map((locale) => [locale, []]));
  const continuityImports = [];
  const evidenceImports = [];

  for (const lesson of sortedLessons) {
    const locales = lessons.get(lesson);
    const varName = lesson.replace(/\./g, '_');

    jaImports.push(`import ${varName}_ja from "./${lesson}.${SOURCE_LOCALE}.json";`);
    for (const locale of presentTargets) {
      if (locales.has(locale)) {
        targetImports.get(locale).push(`import ${varName}_${locale} from "./${lesson}.${locale}.json";`);
      }
    }
    if (continuityLessons.has(lesson)) {
      continuityImports.push(`import ${varName}_continuity from "./${lesson}.continuity.json";`);
    }
    if (evidenceLessons.has(lesson)) {
      evidenceImports.push(`import ${varName}_evidence from "./${lesson}.evidence.json";`);
    }
  }

  // Build export arrays
  const jaSpreadEntries = sortedLessons.map((l) => `  ...${l.replace(/\./g, '_')}_ja,`);

  const targetSpreadEntries = (locale) =>
    sortedLessons.map((l) => {
      const varName = l.replace(/\./g, '_');
      if (lessons.get(l).has(locale)) {
        return `  ...${varName}_${locale},`;
      }
      return `  ...${varName}_ja, // fallback to ja`;
    });

  // Generate output
  let output = `// AUTO-GENERATED by scripts/gen-lesson-locale-index.js — do not edit manually
import type { RawLessonJsonEntry } from "../../../types/lessonData";
import type { LessonContinuityMetadata } from "../../../types/lessonContinuity";
import type { LessonOperationalMetadata } from "../../../types/lessonOperational";
${jaImports.join('\n')}
`;

  for (const locale of presentTargets) {
    output += `
// ${locale} (generated from ja; falls back to ja per lesson when missing)
${targetImports.get(locale).join('\n')}
`;
  }

  if (continuityImports.length > 0) {
    output += `
// Continuity metadata
${continuityImports.join('\n')}
`;
  }

  if (evidenceImports.length > 0) {
    output += `
// Evidence metadata
${evidenceImports.join('\n')}
`;
  }

  output += `
// Japanese (base) - always available
export const ${config.exportName}_ja = [
${jaSpreadEntries.join('\n')}
];
`;

  for (const locale of presentTargets) {
    output += `
// ${locale} - uses ${locale} where available, falls back to ja
export const ${config.exportName}_${locale} = [
${targetSpreadEntries(locale).join('\n')}
];
`;
  }

  output += `
// Default export (ja for backward compatibility)
export const ${config.exportName} = ${config.exportName}_ja;
`;

  const continuityEntries = sortedLessons
    .filter((lesson) => continuityLessons.has(lesson))
    .map((lesson) => `  "${lesson}": ${lesson.replace(/\./g, '_')}_continuity as LessonContinuityMetadata,`);

  output += `
export const ${config.exportName}_continuity: Record<string, LessonContinuityMetadata> = {
${continuityEntries.join('\n')}
};

export function get${config.exportName[0].toUpperCase() + config.exportName.slice(1)}ContinuityForLesson(
  lessonId: string
): LessonContinuityMetadata | null {
  return ${config.exportName}_continuity[lessonId] ?? null;
}

export function get${config.exportName[0].toUpperCase() + config.exportName.slice(1)}ContinuityMap(): Record<string, LessonContinuityMetadata> {
  return ${config.exportName}_continuity;
}
`;

  const evidenceEntries = sortedLessons
    .filter((lesson) => evidenceLessons.has(lesson))
    .map((lesson) => `  "${lesson}": ${lesson.replace(/\./g, '_')}_evidence as LessonOperationalMetadata,`);

  output += `
export const ${config.exportName}_evidence: Record<string, LessonOperationalMetadata> = {
${evidenceEntries.join('\n')}
};

export function get${config.exportName[0].toUpperCase() + config.exportName.slice(1)}EvidenceForLesson(
  lessonId: string
): LessonOperationalMetadata | null {
  return ${config.exportName}_evidence[lessonId] ?? null;
}

export function get${config.exportName[0].toUpperCase() + config.exportName.slice(1)}EvidenceMap(): Record<string, LessonOperationalMetadata> {
  return ${config.exportName}_evidence;
}
`;

  if (presentTargets.length > 0) {
    const branches = presentTargets
      .map((locale) => `  if (lang === '${locale}') {\n    return ${config.exportName}_${locale};\n  }`)
      .join('\n');
    output += `
/**
 * Get ${unitDir.replace('_units', '')} data for specified locale with fallback
 * Fallback order: requested active locale -> ja (source)
 */
export function ${config.funcName}(locale: string): RawLessonJsonEntry[] {
  const lang = locale.split('-')[0].toLowerCase();

${branches}

  // Every other language reads the ja source
  return ${config.exportName}_ja;
}
`;
  } else {
    output += `
/**
 * Get ${unitDir.replace('_units', '')} data for specified locale
 * No generated locale is active for this unit: every language reads the ja source.
 */
export function ${config.funcName}(_locale: string): RawLessonJsonEntry[] {
  return ${config.exportName}_ja;
}
`;
  }

  const outputPath = path.join(unitPath, 'index.ts');
  fs.writeFileSync(outputPath, output, 'utf-8');

  return {
    lessons: sortedLessons.length,
    ja: jaImports.length,
    targets: Object.fromEntries(presentTargets.map((locale) => [locale, targetImports.get(locale).length])),
    outputPath,
  };
}

function main() {
  console.log('=== gen-lesson-locale-index (all units) ===\n');
  console.log(`source locale: ${SOURCE_LOCALE}; active generated locales: ${ACTIVE_TARGETS.join(', ') || '(none)'}\n`);

  let totalGenerated = 0;

  for (const [unitDir, config] of Object.entries(UNITS)) {
    const result = generateUnit(unitDir, config);
    if (result) {
      const targetSummary = Object.entries(result.targets).map(([locale, count]) => `, ${locale}=${count}`).join('');
      console.log(`${unitDir}: ${result.lessons} lessons (ja=${result.ja}${targetSummary})`);
      totalGenerated++;
    } else {
      console.log(`${unitDir}: skipped (no lesson files found)`);
    }
  }

  console.log(`\nGenerated: ${totalGenerated} unit index files`);
  console.log('Done.');
}

main();
