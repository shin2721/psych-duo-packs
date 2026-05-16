const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const METADATA_PATH = path.join(ROOT, "lib", "lesson-data", "lessonMetadata.ts");
const PRINCIPLES_PATH = path.join(ROOT, "docs", "PRINCIPLES.md");
const SPEC_PATH = path.join(ROOT, "docs", "CONTENT_SYSTEM_SPEC.md");
const CANDIDATE_PATH = path.join(ROOT, "data", "content-intake", "lesson-candidate-backlog.json");
const LESSON_ROOT = path.join(ROOT, "data", "lessons");

const PROTECTED_BENCHMARK_LESSONS = [
  {
    lesson_id: "mental_l01",
    file: path.join(LESSON_ROOT, "mental_units", "mental_l01.ja.json"),
    expected_question_count: 10,
    scene_markers: ["電車が遅れて", "面接開始まで残り3分", "17時の会議", "明日、返信が遅くて"],
    takeaway_action: "焦りを感じたら「身体が反応している」と10秒だけラベルを貼る",
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

for (const benchmark of PROTECTED_BENCHMARK_LESSONS) {
  if (!fs.existsSync(benchmark.file)) {
    errors.push(`${benchmark.lesson_id} protected benchmark file is missing.`);
    continue;
  }

  const questions = JSON.parse(fs.readFileSync(benchmark.file, "utf8"));
  const label = path.relative(ROOT, benchmark.file);
  const serialized = JSON.stringify(questions);

  if (!Array.isArray(questions)) {
    errors.push(`${label} must be a question array.`);
    continue;
  }

  if (questions.length !== benchmark.expected_question_count) {
    errors.push(`${label} must keep ${benchmark.expected_question_count} benchmark questions; got ${questions.length}.`);
  }

  for (const marker of benchmark.scene_markers) {
    if (!serialized.includes(marker)) {
      errors.push(`${label} is missing protected concrete scene marker: ${marker}`);
    }
  }

  if (!serialized.includes(benchmark.takeaway_action)) {
    errors.push(`${label} is missing protected takeaway action: ${benchmark.takeaway_action}`);
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
    }
    if (question.source_id === question.id) {
      errors.push(`${questionLabel}.source_id must not be the question id.`);
    }
  }
}

console.log("Paleo-to-Practice insight layer audit");
console.log("====================================");
console.log(`lesson metadata entries: ${lessonCount}`);
console.log(`lesson metadata insight_layer entries: ${insightLayerCount}`);
console.log(`lesson candidate entries: ${candidates.length}`);
console.log(`protected benchmark lessons: ${PROTECTED_BENCHMARK_LESSONS.length}`);

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
