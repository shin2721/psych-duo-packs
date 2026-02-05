import i18n from "../lib/i18n";
import { loadLessons } from "../lib/lessons";
import mentalEn from "../data/lessons/mental_units/mental_l01.en.json";
import mentalJa from "../data/lessons/mental_units/mental_l01.ja.json";

const TARGET_ID = "mental_l01_001";

function extractQuestion(raw: any): string {
  return raw?.content?.prompt || raw?.stem || raw?.question || raw?.text || "";
}

function findRaw(data: any[], id: string): any | undefined {
  return data.find((q: any) => q?.id === id);
}

function findQuestion(lessons: { questions: any[] }[], id: string): string | undefined {
  for (const lesson of lessons) {
    const hit = lesson.questions.find((q: any) => q?.source_id === id);
    if (hit) return hit.question;
  }
  return undefined;
}

function fail(message: string): never {
  console.error(`[i18n-smoke] ${message}`);
  process.exit(1);
}

const enRaw = findRaw(mentalEn as any[], TARGET_ID);
const jaRaw = findRaw(mentalJa as any[], TARGET_ID);

if (!enRaw || !jaRaw) {
  fail(`Missing target question ${TARGET_ID} in EN/JA source data`);
}

const enExpected = extractQuestion(enRaw);
const jaExpected = extractQuestion(jaRaw);

if (!enExpected || !jaExpected) {
  fail(`Could not extract expected question text for ${TARGET_ID}`);
}

// EN should surface EN text
i18n.locale = "en";
const enLessons = loadLessons("mental");
const enActual = findQuestion(enLessons, TARGET_ID);
if (enActual !== enExpected) {
  fail(`EN routing mismatch for ${TARGET_ID}`);
}

// JA should surface JA text
i18n.locale = "ja";
const jaLessons = loadLessons("mental");
const jaActual = findQuestion(jaLessons, TARGET_ID);
if (jaActual !== jaExpected) {
  fail(`JA routing mismatch for ${TARGET_ID}`);
}

console.log("[i18n-smoke] OK: locale-specific lesson data routed correctly");
