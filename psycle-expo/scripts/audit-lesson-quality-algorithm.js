const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PRINCIPLES_PATH = path.join(ROOT, "docs", "PRINCIPLES.md");
const REFERENCE_SAMPLES_PATH = path.join(ROOT, "docs", "REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md");

// This audit is a structural regression net. Nothing more.
//
// It previously pinned the literal Japanese of three benchmark lessons -- scene
// text ("電車が遅れて"), diagnostic type labels ("出来事タイプ"/"解釈タイプ"/
// "身体反応タイプ"), the exact takeaway sentence, expected_question_count: 10,
// and slot ids (_006 diagnosis / _010 transfer) -- and then scored lessons
// against that exact shape. Every score dimension depended on those literals,
// so any redesign scored 0 on some dimension and hard-failed CI.
//
// The result was inverted: mental_l01 scored 16/16, 100/100 and 14/14 here while
// failing a real playthrough. A gate that awards a perfect score to a lesson its
// owner rejected is measuring the shape it was written from, not quality.
//
// So the content-shape mandates and the score system are removed. What remains
// are checks that hold for any lesson design. Whether a lesson is worth shipping
// is decided by playing it, not here.
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
  "paleo_discovery",
  "dlab_life_change",
  "duolingo_continuity",
  "psycle_reason",
  "retention_without_thinness",
  "article_advantage",
  "Judgment OS",
  "personal vulnerability hook",
  "hidden operating rule",
  "trust-building caveat",
  "agency-restoring move",
  "series pull",
];

// Lessons kept under structural regression coverage. Add a path here to cover a
// lesson; do not add expected wording, question counts, or slot ids.
const CHECKED_LESSONS = [
  { lesson_id: "mental_l01", lesson_path: path.join(ROOT, "data", "lessons", "mental_units", "mental_l01.ja.json") },
  { lesson_id: "money_l01", lesson_path: path.join(ROOT, "data", "lessons", "money_units", "money_l01.ja.json") },
  { lesson_id: "study_l01", lesson_path: path.join(ROOT, "data", "lessons", "study_units", "study_l01.ja.json") },
];

const MIN_NEAR_MISS_QUESTIONS = 2;
const MAX_OBVIOUS_BAD_CHOICES_PER_QUESTION = 1;
const MAX_XP_PER_QUESTION = 10;

// Choices so plainly wrong that they add no friction. One per question is a
// usable throwaway; more than one means the question answers itself.
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

const principles = fs.readFileSync(PRINCIPLES_PATH, "utf8");
for (const marker of REQUIRED_PRINCIPLE_MARKERS) {
  if (!principles.includes(marker)) {
    errors.push(`docs/PRINCIPLES.md is missing Lesson Quality Algorithm marker: ${marker}`);
  }
}

if (!fs.existsSync(REFERENCE_SAMPLES_PATH)) {
  errors.push("docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md is required for D-Lab/Paleo calibration.");
} else {
  const referenceSamples = fs.readFileSync(REFERENCE_SAMPLES_PATH, "utf8");
  const requiredReferenceMarkers = [
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
  ];
  for (const marker of requiredReferenceMarkers) {
    if (!referenceSamples.includes(marker)) {
      errors.push(`docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md is missing calibration marker: ${marker}`);
    }
  }
}

console.log("Lesson structure audit");
console.log("======================");

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
console.log("lesson structure: OK");
console.log("NOTE structural pass is not product quality. Play the lesson before shipping it.");

function auditLesson(lesson) {
  if (!fs.existsSync(lesson.lesson_path)) {
    errors.push(`${lesson.lesson_id} lesson file is missing: ${path.relative(ROOT, lesson.lesson_path)}`);
    return;
  }

  const questions = JSON.parse(fs.readFileSync(lesson.lesson_path, "utf8"));

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push(`${lesson.lesson_id} must be a non-empty question array.`);
    return;
  }

  const seenIds = new Set();
  let nearMissQuestionCount = 0;
  let actionableCount = 0;
  let obviousBadChoiceCount = 0;

  for (const question of questions) {
    const label = question?.id || `${lesson.lesson_id}[unknown id]`;

    if (typeof question?.id !== "string" || question.id.trim().length === 0) {
      errors.push(`${lesson.lesson_id} has a question with no id.`);
    } else if (seenIds.has(question.id)) {
      errors.push(`${lesson.lesson_id} has a duplicate question id: ${question.id}`);
    } else {
      seenIds.add(question.id);
    }

    if (typeof question?.evidence_grade !== "string" || question.evidence_grade.trim().length === 0) {
      errors.push(`${label} must declare an evidence_grade.`);
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

    if (Array.isArray(question?.expanded_details?.near_miss_choices) && question.expanded_details.near_miss_choices.length > 0) {
      nearMissQuestionCount += 1;
    }

    if (question?.actionable_advice) {
      actionableCount += 1;
    }
  }

  if (nearMissQuestionCount < MIN_NEAR_MISS_QUESTIONS) {
    errors.push(
      `${lesson.lesson_id} documents near_miss_choices on ${nearMissQuestionCount} question(s); minimum is ${MIN_NEAR_MISS_QUESTIONS}.`
    );
  }

  if (actionableCount === 0) {
    errors.push(`${lesson.lesson_id} has no question carrying actionable_advice; nothing transfers out of the lesson.`);
  }

  const visibleText = questions.map(getQuestionText).join("\n");
  if (VISIBLE_REFERENCE_NAME_PATTERN.test(visibleText)) {
    errors.push(`${lesson.lesson_id} visible lesson copy must model reference sources without naming them.`);
  }

  warnings.push(
    `${lesson.lesson_id} human_quality_unproven: this audit checks structure only; real play decides whether the lesson is worth keeping.`
  );

  console.log("");
  console.log(`lesson: ${lesson.lesson_id}`);
  console.log(`questions: ${questions.length}`);
  console.log(`question types: ${[...new Set(questions.map((item) => item.type))].join(", ")}`);
  console.log(`questions with near_miss_choices: ${nearMissQuestionCount}`);
  console.log(`questions with actionable_advice: ${actionableCount}`);
  console.log(`obvious-bad choices: ${obviousBadChoiceCount}`);
}

function getQuestionText(item) {
  return [
    item.question,
    item.your_response_prompt,
    item.explanation,
    item.actionable_advice,
    ...(Array.isArray(item.choices) ? item.choices : []),
    item.swipe_labels?.left,
    item.swipe_labels?.right,
  ]
    .filter(Boolean)
    .join(" ");
}
