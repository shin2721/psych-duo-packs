const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const METADATA_PATH = path.join(ROOT, "lib", "lesson-data", "lessonMetadata.ts");
const PRINCIPLES_PATH = path.join(ROOT, "docs", "PRINCIPLES.md");
const SPEC_PATH = path.join(ROOT, "docs", "CONTENT_SYSTEM_SPEC.md");
const CANDIDATE_PATH = path.join(ROOT, "data", "content-intake", "lesson-candidate-backlog.json");
const LESSON_ROOT = path.join(ROOT, "data", "lessons");
const CURATED_SOURCES_PATH = path.join(ROOT, "data", "curated_sources.json");

// This is traceability coverage, not a frozen lesson template. Copy, question
// count, scene choice and interaction format may change without editing this
// audit. New benchmark lessons can join after their source registry is clean.
const TRACEABILITY_LESSONS = [
  {
    lesson_id: "mental_l01",
    file: path.join(LESSON_ROOT, "mental_units", "mental_l01.ja.json"),
  },
];

const REQUIRED_FIELDS = [
  "surprising_question",
  "research_finding",
  "critical_caveat",
  "usable_scope",
  "practice_prompt",
];

const errors = [];

const metadataSource = fs.readFileSync(METADATA_PATH, "utf8");
const principles = fs.readFileSync(PRINCIPLES_PATH, "utf8");
const spec = fs.readFileSync(SPEC_PATH, "utf8");
const candidates = JSON.parse(fs.readFileSync(CANDIDATE_PATH, "utf8")).items || [];
const curatedSourceIds = new Set(
  Object.keys(JSON.parse(fs.readFileSync(CURATED_SOURCES_PATH, "utf8")).sources || {})
);

const lessonCount = countMatches(metadataSource, /:\s*lessonMetadata\(\{/g);
const insightLayerCount = countMatches(metadataSource, /insight_layer:\s*\{/g);

if (!principles.includes("Paleo-to-Practice Lesson Spine")) {
  errors.push("docs/PRINCIPLES.md must define Paleo-to-Practice Lesson Spine.");
}

if (!spec.includes('"insight_layer"')) {
  errors.push("docs/CONTENT_SYSTEM_SPEC.md must include insight_layer in the lesson blueprint example.");
}

if (lessonCount === 0) {
  errors.push("lesson metadata count is 0; audit cannot verify insight_layer coverage.");
}

if (insightLayerCount !== lessonCount) {
  errors.push(`lesson metadata insight_layer coverage mismatch: ${insightLayerCount}/${lessonCount}.`);
}

for (const field of REQUIRED_FIELDS) {
  const metadataFieldCount = countMatches(metadataSource, new RegExp(`${field}:`, "g"));
  if (metadataFieldCount < lessonCount) {
    errors.push(`lesson metadata field ${field} coverage is ${metadataFieldCount}/${lessonCount}.`);
  }
}

for (const [index, candidate] of candidates.entries()) {
  const label = candidate.candidate_id || `candidate.items[${index}]`;
  for (const field of REQUIRED_FIELDS) {
    if (!candidate.insight_layer?.[field]?.trim()) {
      errors.push(`${label}.insight_layer.${field} is required.`);
    }
  }
}

for (const lesson of TRACEABILITY_LESSONS) {
  if (!fs.existsSync(lesson.file)) {
    errors.push(`${lesson.lesson_id} traceability lesson file is missing.`);
    continue;
  }

  const questions = JSON.parse(fs.readFileSync(lesson.file, "utf8"));
  const label = path.relative(ROOT, lesson.file);

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push(`${label} must be a non-empty question array.`);
    continue;
  }

  for (const [index, question] of questions.entries()) {
    const questionLabel = `${label}[${index}]`;
    if (!question || typeof question !== "object") {
      errors.push(`${questionLabel} must be an object.`);
      continue;
    }
    if (typeof question.claim_id !== "string" || question.claim_id.trim().length === 0) {
      errors.push(`${questionLabel}.claim_id is required.`);
    }
    if (typeof question.source_id !== "string" || question.source_id.trim().length === 0) {
      errors.push(`${questionLabel}.source_id is required.`);
    } else if (!curatedSourceIds.has(question.source_id)) {
      errors.push(`${questionLabel}.source_id is not registered in data/curated_sources.json: ${question.source_id}`);
    }
    if (question.source_id === question.id) {
      errors.push(`${questionLabel}.source_id must not be the question id.`);
    }
    if (typeof question.evidence_grade !== "string" || question.evidence_grade.trim().length === 0) {
      errors.push(`${questionLabel}.evidence_grade is required.`);
    }
    for (const field of ["claim_type", "evidence_type", "citation_role"]) {
      const value = question.expanded_details?.[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(`${questionLabel}.expanded_details.${field} is required.`);
      }
    }
  }
}

console.log("Paleo-to-Practice insight layer audit");
console.log("====================================");
console.log(`lesson metadata entries: ${lessonCount}`);
console.log(`lesson metadata insight_layer entries: ${insightLayerCount}`);
console.log(`lesson candidate entries: ${candidates.length}`);
console.log(`traceability lessons: ${TRACEABILITY_LESSONS.length}`);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("paleo insight layer: OK");

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}
