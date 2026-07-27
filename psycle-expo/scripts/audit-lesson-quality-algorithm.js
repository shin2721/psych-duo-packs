const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PRINCIPLES_PATH = path.join(ROOT, "docs", "PRINCIPLES.md");
const REFERENCE_SAMPLES_PATH = path.join(ROOT, "docs", "REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md");

/**
 * Structural regression net for hand-authored benchmark lessons.
 *
 * It deliberately does not score interest, learning value, or production
 * readiness. Those require a raw pilot, runtime playthrough, and owner review.
 * This script only blocks objective breakage that remains wrong across lesson
 * designs; everything semantic is reported as needs_human_review.
 */
const REQUIRED_PRINCIPLE_MARKERS = [
  "Lesson Quality Algorithm",
  "ARTICLE_PARITY_REJECT",
  "Calibration, Not Dependency",
  "Reference-Source Modeling Protocol",
  "Popularity / Meaning Extraction Rule",
  "RAW_INSIGHT_FIRST_GATE",
  "Raw Insight Pilot Before Lesson",
  "QUESTION_BEFORE_LENS_GATE",
  "Paleo Question Arc Gate",
  "REFERENCE_SOURCE_MODEL_REJECT",
  "MEANING_PARITY_REJECT",
  "D-Lab/Paleo Lesson Content Algorithm",
  "DLAB_PALEO_ALGORITHM_REJECT",
  "D-Lab Active Learning Rule",
  "Reference Sampling Minimum",
  "D-Lab Simple Rule Constraint",
  "Paleo Article Pattern Rule",
  "Quality score contract",
  "North Star Experience Score",
];

const DEFAULT_CHECKED_LESSONS = [
  {
    lesson_id: "mental_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "mental_units", "mental_l01.ja.json"),
  },
  {
    lesson_id: "money_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "money_units", "money_l01.ja.json"),
  },
  {
    lesson_id: "study_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "study_units", "study_l01.ja.json"),
  },
];
const CHECKED_LESSONS = process.env.PSYCLE_AUDIT_LESSON_PATH
  ? [
      {
        lesson_id: process.env.PSYCLE_AUDIT_LESSON_ID || "fixture_l01",
        lesson_path: path.resolve(process.env.PSYCLE_AUDIT_LESSON_PATH),
      },
    ]
  : DEFAULT_CHECKED_LESSONS;

const MAX_OBVIOUS_BAD_CHOICES_PER_QUESTION = 1;
const MAX_XP_PER_QUESTION = 10;
const MIN_DECLARED_USAGE_CONTEXTS = 3;

const OBVIOUS_BAD_PATTERNS = [
  /全部ポジティブ/,
  /失敗確定/,
  /何も感じていないふり/,
  /後回しでOK/,
  /深刻な問題.*だけで解決/,
  /なかったこと/,
  /追いLINEを3通/,
  /自分が悪いと決め/,
  /完全になく/,
  /決めつけ/,
  /失敗扱い/,
];

const VISIBLE_REFERENCE_NAME_PATTERN = /パレオ|Dラボ|D-Lab|Daigo|メンタリストDaiGo/i;
const errors = [];
const warnings = [];

auditPrincipleContracts();

console.log("Lesson structural contract audit");
console.log("================================");

for (const lesson of CHECKED_LESSONS) {
  auditLesson(lesson);
}

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("");
console.log("lesson structural contracts: OK");
console.log("HUMAN REVIEW REQUIRED: structural pass is not product quality.");

function auditPrincipleContracts() {
  const principles = fs.readFileSync(PRINCIPLES_PATH, "utf8");
  for (const marker of REQUIRED_PRINCIPLE_MARKERS) {
    if (!principles.includes(marker)) {
      errors.push(`docs/PRINCIPLES.md is missing lesson-quality marker: ${marker}`);
    }
  }

  if (!fs.existsSync(REFERENCE_SAMPLES_PATH)) {
    errors.push("docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md is required for D-Lab/Paleo calibration.");
    return;
  }

  const referenceSamples = fs.readFileSync(REFERENCE_SAMPLES_PATH, "utf8");
  for (const marker of [
    "D-Lab",
    "Paleo",
    "Rejection Calibration Samples",
    "calibrated_v1_candidate",
    "Popularity / Meaning Model",
    "personal vulnerability hook",
    "hidden operating rule",
    "trust-building caveat",
    "agency-restoring move",
    "series identity",
    "MEANING_PARITY_REJECT",
    "lens acquisition system",
  ]) {
    if (!referenceSamples.includes(marker)) {
      errors.push(`docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md is missing calibration marker: ${marker}`);
    }
  }
}

function auditLesson(lesson) {
  if (!fs.existsSync(lesson.lesson_path)) {
    errors.push(`${lesson.lesson_id} lesson file is missing: ${path.relative(ROOT, lesson.lesson_path)}`);
    return;
  }

  let questions;
  try {
    questions = JSON.parse(fs.readFileSync(lesson.lesson_path, "utf8"));
  } catch (error) {
    errors.push(`${lesson.lesson_id} is not valid JSON: ${error.message}`);
    return;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push(`${lesson.lesson_id} must be a non-empty question array.`);
    return;
  }

  const seenIds = new Set();
  const usageContexts = new Set();
  let actionableCount = 0;
  let nearMissQuestionCount = 0;
  let obviousBadChoiceCount = 0;
  let structuredBoundaryCount = 0;
  let paraphraseWarningCount = 0;

  for (const question of questions) {
    const label = question?.id || `${lesson.lesson_id}[missing id]`;

    if (typeof question?.id !== "string" || question.id.trim().length === 0) {
      errors.push(`${lesson.lesson_id} has a question with no id.`);
    } else {
      if (!question.id.startsWith(`${lesson.lesson_id}_`)) {
        errors.push(`${question.id} crosses lesson identity; expected prefix ${lesson.lesson_id}_.`);
      }
      if (seenIds.has(question.id)) {
        errors.push(`${lesson.lesson_id} has a duplicate question id: ${question.id}`);
      }
      seenIds.add(question.id);
    }

    for (const field of ["claim_id", "source_id", "evidence_grade"]) {
      if (typeof question?.[field] !== "string" || question[field].trim().length === 0) {
        errors.push(`${label} must declare ${field}.`);
      }
    }

    if (Number(question?.xp || 0) > MAX_XP_PER_QUESTION) {
      errors.push(`${label} xp is ${question.xp}; maximum is ${MAX_XP_PER_QUESTION}.`);
    }

    const choices = Array.isArray(question?.choices) ? question.choices : [];
    const obviousBadChoices = choices.filter((choice) =>
      OBVIOUS_BAD_PATTERNS.some((pattern) => pattern.test(String(choice)))
    );
    obviousBadChoiceCount += obviousBadChoices.length;
    if (obviousBadChoices.length > MAX_OBVIOUS_BAD_CHOICES_PER_QUESTION) {
      errors.push(`${label} has too many obvious-bad choices: ${obviousBadChoices.join(" / ")}`);
    }

    if (
      Array.isArray(question?.expanded_details?.near_miss_choices) &&
      question.expanded_details.near_miss_choices.length > 0
    ) {
      nearMissQuestionCount += 1;
    }

    if (isNonEmptyString(question?.actionable_advice)) {
      actionableCount += 1;
    }

    for (const context of question?.expanded_details?.best_for || []) {
      if (isNonEmptyString(context)) usageContexts.add(context.trim());
    }

    if (
      (Array.isArray(question?.expanded_details?.limitations) &&
        question.expanded_details.limitations.some(isNonEmptyString)) ||
      question?.expanded_details?.fallback
    ) {
      structuredBoundaryCount += 1;
    }

    if (isNearParaphrase(question)) {
      paraphraseWarningCount += 1;
    }
  }

  const finalQuestion = questions[questions.length - 1];
  if (
    !isNonEmptyString(finalQuestion?.actionable_advice) &&
    !isNonEmptyString(finalQuestion?.expanded_details?.try_this)
  ) {
    errors.push(`${lesson.lesson_id} final question must carry an authored takeaway action.`);
  }

  const visibleText = questions.map(getVisibleQuestionText).join("\n");
  if (VISIBLE_REFERENCE_NAME_PATTERN.test(visibleText)) {
    errors.push(`${lesson.lesson_id} visible lesson copy must model reference sources without naming them.`);
  }

  if (usageContexts.size < MIN_DECLARED_USAGE_CONTEXTS) {
    warnings.push(
      `${lesson.lesson_id} needs_human_review: only ${usageContexts.size} distinct best_for context(s) are declared.`
    );
  }
  if (nearMissQuestionCount === 0) {
    warnings.push(`${lesson.lesson_id} needs_human_review: no plausible near-miss is documented.`);
  }
  if (actionableCount === 0) {
    warnings.push(`${lesson.lesson_id} needs_human_review: no question carries actionable_advice.`);
  }
  if (structuredBoundaryCount === 0) {
    warnings.push(`${lesson.lesson_id} needs_human_review: no structured limitation or fallback is declared.`);
  }
  if (paraphraseWarningCount > 0) {
    warnings.push(
      `${lesson.lesson_id} needs_human_review: ${paraphraseWarningCount} explanation(s) may only repeat the prompt or answer.`
    );
  }
  if (opensWithDiagnosticLabels(questions[0])) {
    warnings.push(
      `${lesson.lesson_id} needs_human_review: Q1 appears to expose diagnostic labels before the curiosity/reversal arc.`
    );
  }

  warnings.push(
    `${lesson.lesson_id} human_quality_unproven: play and owner taste review must confirm interest, learning, transfer, and reason to continue.`
  );

  console.log("");
  console.log(`lesson: ${lesson.lesson_id}`);
  console.log(`questions: ${questions.length} (not fixed by this audit)`);
  console.log(`question types: ${[...new Set(questions.map((item) => item.type))].join(", ")}`);
  console.log(`declared usage contexts: ${usageContexts.size}`);
  console.log(`questions with near_miss_choices: ${nearMissQuestionCount}`);
  console.log(`questions with actionable_advice: ${actionableCount}`);
  console.log(`structured boundaries: ${structuredBoundaryCount}`);
  console.log(`obvious-bad choices: ${obviousBadChoiceCount}`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function opensWithDiagnosticLabels(question) {
  const choices = Array.isArray(question?.choices) ? question.choices : [];
  if (choices.length < 2) return false;
  const labeledChoices = choices.filter((choice) => /(タイプ|型)[：:]/.test(String(choice)));
  return labeledChoices.length >= Math.min(2, choices.length);
}

function isNearParaphrase(question) {
  const explanation =
    typeof question?.explanation === "string"
      ? question.explanation
      : question?.explanation?.correct;
  if (!isNonEmptyString(explanation)) return false;

  const normalizedExplanation = normalize(explanation);
  if (normalizedExplanation.length < 8) return false;

  const candidates = [
    question?.question,
    ...(Array.isArray(question?.choices) ? question.choices : []),
  ]
    .filter(isNonEmptyString)
    .map(normalize);

  return candidates.some(
    (candidate) =>
      candidate.length >= 8 &&
      (candidate === normalizedExplanation ||
        candidate.includes(normalizedExplanation) ||
        normalizedExplanation.includes(candidate))
  );
}

function normalize(value) {
  return String(value)
    .replace(/[\s。、！？!?「」『』（）()：:・…]/g, "")
    .toLowerCase();
}

function getVisibleQuestionText(item) {
  return [
    item.question,
    item.your_response_prompt,
    typeof item.explanation === "string"
      ? item.explanation
      : JSON.stringify(item.explanation || ""),
    item.actionable_advice,
    ...(Array.isArray(item.choices) ? item.choices : []),
    item.swipe_labels?.left,
    item.swipe_labels?.right,
  ]
    .filter(Boolean)
    .join(" ");
}
