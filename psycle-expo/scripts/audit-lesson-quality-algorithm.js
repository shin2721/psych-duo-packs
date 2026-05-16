const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PRINCIPLES_PATH = path.join(ROOT, "docs", "PRINCIPLES.md");
const REFERENCE_SAMPLES_PATH = path.join(ROOT, "docs", "REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md");

// This audit is a regression net. It verifies that the source-of-truth docs
// still contain the content-quality contracts it depends on, but it must not be
// treated as proof that a lesson is interesting or production-ready.
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
  "Required 10-question arc for benchmark core lessons",
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

const BENCHMARKS = [
  {
    lesson_id: "mental_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "mental_units", "mental_l01.ja.json"),
    expected_question_count: 10,
    scene_markers: ["電車が遅れて", "面接開始まで残り3分", "17時の会議", "明日、返信が遅くて"],
    type_markers: ["出来事タイプ", "解釈タイプ", "身体反応タイプ"],
    takeaway_action: "焦りを感じたら「身体が反応している」と10秒だけラベルを貼る",
    required_near_miss_questions: ["mental_l01_004", "mental_l01_008", "mental_l01_009"],
    diagnosis_question_id: "mental_l01_006",
    transfer_question_id: "mental_l01_010",
    novelty_patterns: [/発見/, /出来事そのものだけ|脅威|準備エネルギー/],
    evidence_critique_patterns: [/限界/, /ツッコミ/, /使える範囲/, /過剰解釈/, /現実対応の代わりではない/],
    personalization_patterns: [/仮診断/, /出来事タイプ/, /解釈タイプ/, /身体反応タイプ/],
    no_visible_reference_names: true,
  },
  {
    lesson_id: "money_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "money_units", "money_l01.ja.json"),
    expected_question_count: 10,
    scene_markers: ["23:40", "仕事で軽く扱われた夜", "SNS", "明日、カートに何か入れた瞬間"],
    type_markers: ["商品価値", "自己回復プレミアム", "見られたい価値"],
    takeaway_action: "カートに入れた後、10秒だけ手を止めて「明日の昼、商品だけでも欲しい？」を見る",
    required_near_miss_questions: ["money_l01_004", "money_l01_007", "money_l01_009"],
    diagnosis_question_id: "money_l01_006",
    transfer_question_id: "money_l01_010",
    novelty_patterns: [/発見/, /孤独感|ストレス/, /自己回復プレミアム|上乗せ/],
    evidence_critique_patterns: [/観察研究/, /断定しない/, /使える範囲/, /相関を因果として扱わない/],
    personalization_patterns: [/仮診断/, /商品価値/, /自己回復プレミアム/, /見られたい価値/],
    no_visible_reference_names: true,
  },
  {
    lesson_id: "study_l01",
    lesson_path: path.join(ROOT, "data", "lessons", "study_units", "study_l01.ja.json"),
    expected_question_count: 10,
    scene_markers: ["23:40", "カート", "LINE", "AI"],
    type_markers: ["買うサイン", "送るサイン", "採用サイン"],
    takeaway_action: "夜に強い気持ちが来たら、10秒だけ「情報は何？ 契約は何？」を分ける",
    required_near_miss_questions: ["study_l01_004", "study_l01_007", "study_l01_009"],
    diagnosis_question_id: "study_l01_006",
    transfer_question_id: "study_l01_010",
    novelty_patterns: [/値札|見積もり|発見/, /夜|疲れ/, /情報|契約/],
    evidence_critique_patterns: [/断定しない/, /嘘扱いしない|偽物扱いしない|否定しない/, /緊急|安全判断/, /10秒技法だけで扱わない|一人で抱えない/],
    personalization_patterns: [/仮診断/, /買うサイン/, /送るサイン/, /採用サイン/],
    question_arc: {
      forbidden_q1_patterns: [/情報型/, /契約型/, /保留型/, /情報と契約/, /夜の値札/, /行動の値札/, /見積もり/],
      required_q1_patterns: [/23:40/, /普通|自然|説明|なぜ|どうして|見える/],
      required_by_q3_patterns: [/本音|普通|自然|説明/, /情報.*契約|契約.*情報|買う.*送る.*採用する|買う・送る・採用する/],
    },
    no_visible_reference_names: true,
  },
];

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
    "50-Sample Second-Pass: Popularity / Meaning Synthesis",
    "Popularity / Meaning Model",
    "personal vulnerability hook",
    "hidden operating rule",
    "trust-building caveat",
    "agency-restoring move",
    "series identity",
    "MEANING_PARITY_REJECT",
    "lens acquisition system",
    "dlab_paleo_ai_average_deviation_20260331",
    "dlab_paleo_coachability_reception_20260506",
    "dlab_paleo_stress_spending_breakpoint_20260501",
    "dlab_paleo_scientific_thinking_quiz_20260417",
    "dlab_paleo_interpretation_bias_20260508",
    "dlab_paleo_centaur_role_split_20260504",
    "reject_paleo_supplement_commercial_risk",
  ];
  for (const marker of requiredReferenceMarkers) {
    if (!referenceSamples.includes(marker)) {
      errors.push(`docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md is missing calibration marker: ${marker}`);
    }
  }
}

console.log("Lesson Quality Algorithm audit");
console.log("==============================");

for (const benchmark of BENCHMARKS) {
  auditBenchmark(benchmark);
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

console.log("lesson quality algorithm: OK");

function auditBenchmark(benchmark) {
  const questions = JSON.parse(fs.readFileSync(benchmark.lesson_path, "utf8"));
  const serialized = JSON.stringify(questions);
  const visibleText = getVisibleLessonText(questions);

  if (!Array.isArray(questions)) {
    errors.push(`${benchmark.lesson_id} must be a question array.`);
    return;
  }

  if (questions.length !== benchmark.expected_question_count) {
    errors.push(`${benchmark.lesson_id} must keep ${benchmark.expected_question_count} questions; got ${questions.length}.`);
  }

  for (const marker of benchmark.scene_markers) {
    if (!serialized.includes(marker)) {
      errors.push(`${benchmark.lesson_id} is missing concrete life scene marker: ${marker}`);
    }
  }

  for (const marker of benchmark.type_markers) {
    if (!serialized.includes(marker)) {
      errors.push(`${benchmark.lesson_id} is missing diagnostic type marker: ${marker}`);
    }
  }

  if (!serialized.includes(benchmark.takeaway_action)) {
    errors.push(`${benchmark.lesson_id} is missing transfer anchor: ${benchmark.takeaway_action}`);
  }

  for (const id of benchmark.required_near_miss_questions) {
    const question = questions.find((item) => item.id === id);
    const nearMisses = question?.expanded_details?.near_miss_choices;
    if (!Array.isArray(nearMisses) || nearMisses.length === 0) {
      errors.push(`${id} must document at least one plausible near-miss choice in expanded_details.near_miss_choices.`);
    }
  }

  const firstThree = questions
    .slice(0, 3)
    .map((item) => `${item.question || ""} ${item.explanation || ""}`)
    .join("\n");

  if (!/発見|ツボ|意外|出来事そのものだけ|脅威|孤独感|穴埋め|情報と契約/.test(firstThree)) {
    errors.push(`${benchmark.lesson_id} must introduce a curiosity gap by Q3.`);
  }

  auditQuestionArc(benchmark, questions);

  const diagnosisQuestion = questions.find((item) => item.id === benchmark.diagnosis_question_id);
  if (!diagnosisQuestion || !/仮診断|どれ寄り/.test(`${diagnosisQuestion.question || ""} ${diagnosisQuestion.explanation || ""}`)) {
    errors.push(`${benchmark.diagnosis_question_id} must be a diagnosis/personalization step.`);
  }

  const transferQuestion = questions.find((item) => item.id === benchmark.transfer_question_id);
  if (!transferQuestion || !JSON.stringify(transferQuestion).includes(benchmark.takeaway_action)) {
    errors.push(`${benchmark.transfer_question_id} must carry the transfer anchor into tomorrow.`);
  }

  if (benchmark.no_visible_reference_names && VISIBLE_REFERENCE_NAME_PATTERN.test(visibleText)) {
    errors.push(`${benchmark.lesson_id} visible lesson copy must model reference sources without naming them.`);
  }

  let obviousBadChoiceCount = 0;
  for (const question of questions) {
    const choices = Array.isArray(question.choices) ? question.choices : [];
    const obviousBadChoices = choices.filter((choice) =>
      OBVIOUS_BAD_PATTERNS.some((pattern) => pattern.test(String(choice)))
    );
    obviousBadChoiceCount += obviousBadChoices.length;
    if (obviousBadChoices.length > 1) {
      errors.push(`${question.id} has too many obvious-bad choices: ${obviousBadChoices.join(" / ")}`);
    }
  }

  const qualityScores = scoreQualityContract(benchmark, questions, serialized, obviousBadChoiceCount);
  const qualityTotal = Object.values(qualityScores).reduce((sum, score) => sum + score, 0);
  for (const [key, score] of Object.entries(qualityScores)) {
    if (score === 0) {
      errors.push(`${benchmark.lesson_id} quality score ${key}=0; ARTICLE_PARITY_REJECT.`);
    }
  }
  if (qualityTotal < 12) {
    errors.push(`${benchmark.lesson_id} quality score is ${qualityTotal}/16; minimum is 12.`);
  }
  if (qualityTotal < 15) {
    warnings.push(`${benchmark.lesson_id} needs_human_review: quality score is ${qualityTotal}/16.`);
  }

  const northStarScores = scoreNorthStarExperience(benchmark, questions, serialized, visibleText, qualityScores, obviousBadChoiceCount);
  const northStarTotal = Object.values(northStarScores).reduce((sum, score) => sum + score, 0);
  if (northStarTotal < 85) {
    errors.push(`${benchmark.lesson_id} North Star Experience Score is ${northStarTotal}/100; minimum is 85 before production.`);
  }
  if (northStarTotal < 90) {
    warnings.push(`${benchmark.lesson_id} needs_human_review: North Star Experience Score is ${northStarTotal}/100.`);
  }

  const meaningScores = scoreMeaningParity(benchmark, questions, serialized);
  const meaningTotal = Object.values(meaningScores).reduce((sum, score) => sum + score, 0);
  if (meaningTotal < 10) {
    errors.push(`${benchmark.lesson_id} Meaning Parity Score is ${meaningTotal}/14; MEANING_PARITY_REJECT.`);
  }
  if (meaningTotal < 14) {
    warnings.push(`${benchmark.lesson_id} needs_human_meaning_review: Meaning Parity Score is ${meaningTotal}/14.`);
  }
  warnings.push(
    `${benchmark.lesson_id} human_quality_unproven: machine scores only verify structure; real play must confirm personal stakes, hidden rule, and reason to return.`
  );

  console.log("");
  console.log(`benchmark lesson: ${benchmark.lesson_id}`);
  console.log(`questions: ${questions.length}`);
  console.log(`obvious-bad choices: ${obviousBadChoiceCount}`);
  console.log(`quality score: ${qualityTotal}/16`);
  for (const [key, score] of Object.entries(qualityScores)) {
    console.log(`- ${key}: ${score}/2`);
  }
  console.log(`North Star Experience Score: ${northStarTotal}/100`);
  for (const [key, score] of Object.entries(northStarScores)) {
    console.log(`- ${key}: ${score}/20`);
  }
  console.log(`Meaning Parity Score: ${meaningTotal}/14`);
  for (const [key, score] of Object.entries(meaningScores)) {
    console.log(`- ${key}: ${score}/2`);
  }
}

function auditQuestionArc(benchmark, questions) {
  const questionArc = benchmark.question_arc;
  if (!questionArc || questions.length === 0) {
    return;
  }

  const firstQuestion = questions[0];
  const firstQuestionText = getQuestionText(firstQuestion);
  const firstQuestionChoices = Array.isArray(firstQuestion.choices) ? firstQuestion.choices.map(String).join("\n") : "";
  const firstThreeText = questions.slice(0, 3).map(getQuestionText).join("\n");

  for (const pattern of questionArc.forbidden_q1_patterns || []) {
    if (pattern.test(firstQuestionText)) {
      errors.push(`${benchmark.lesson_id} Q1 leaks the lesson lens before the curiosity/reversal arc: ${pattern}`);
    }
  }

  if (/^[^\n]*(型|タイプ)[：:]/m.test(firstQuestionChoices)) {
    errors.push(`${benchmark.lesson_id} Q1 must not start with diagnostic labels; diagnosis belongs after the hook/reversal.`);
  }

  for (const pattern of questionArc.required_q1_patterns || []) {
    if (!pattern.test(firstQuestionText)) {
      errors.push(`${benchmark.lesson_id} Q1 must open with a concrete mystery / ordinary explanation marker: ${pattern}`);
    }
  }

  for (const pattern of questionArc.required_by_q3_patterns || []) {
    if (!pattern.test(firstThreeText)) {
      errors.push(`${benchmark.lesson_id} must establish the ordinary explanation and reversal by Q3: ${pattern}`);
    }
  }
}

function scoreQualityContract(benchmark, questions, source, obviousBadChoiceCount) {
  const nearMissQuestions = benchmark.required_near_miss_questions.map((id) => questions.find((item) => item.id === id));
  const nearMissCount = nearMissQuestions.filter(
    (item) => Array.isArray(item?.expanded_details?.near_miss_choices) && item.expanded_details.near_miss_choices.length > 0
  ).length;
  const actionableCount = questions.filter((item) => item.actionable_advice).length;
  const evidenceCritiqueHits = countHits(source, benchmark.evidence_critique_patterns);

  return {
    pain_specificity: countHits(source, benchmark.scene_markers.map((marker) => new RegExp(escapeRegExp(marker)))) >= 3 ? 2 : 0,
    novelty: countHits(source, benchmark.novelty_patterns) >= 2 ? 2 : 1,
    evidence_critique: evidenceCritiqueHits >= 3 ? 2 : evidenceCritiqueHits > 0 ? 1 : 0,
    personalization: countHits(source, benchmark.personalization_patterns) >= benchmark.personalization_patterns.length ? 2 : 0,
    choice_friction: nearMissCount >= 3 && obviousBadChoiceCount <= 3 ? 2 : nearMissCount > 0 ? 1 : 0,
    practice_ladder: actionableCount >= 4 && nearMissCount >= 2 ? 2 : actionableCount >= 2 ? 1 : 0,
    transfer: source.includes(benchmark.takeaway_action) && /明日/.test(source) ? 2 : 0,
    article_advantage: nearMissCount >= 3 && /仮診断/.test(source) && /スワイプ|swipe_judgment/.test(source) ? 2 : 1,
  };
}

function scoreNorthStarExperience(benchmark, questions, source, visibleText, qualityScores, obviousBadChoiceCount) {
  const actionableCount = questions.filter((item) => item.actionable_advice).length;
  const nearMissCount = benchmark.required_near_miss_questions.filter((id) => {
    const question = questions.find((item) => item.id === id);
    return Array.isArray(question?.expanded_details?.near_miss_choices) && question.expanded_details.near_miss_choices.length > 0;
  }).length;
  const questionTypes = new Set(questions.map((item) => item.type));
  const hasFallback = questions.some((item) => /fallback|失敗時|戻り方|苦しく/.test(JSON.stringify(item)));
  const hasTomorrowQuest = questions.some((item) => /明日/.test(`${item.question || ""} ${item.explanation || ""} ${item.actionable_advice || ""}`));
  const hasEvidenceGrades = questions.every((item) => typeof item.evidence_grade === "string" && item.evidence_grade.length > 0);
  const visibleReferenceNames = VISIBLE_REFERENCE_NAME_PATTERN.test(visibleText);

  return {
    paleo_discovery: scoreChecks([
      countHits(source, benchmark.novelty_patterns) >= 2,
      countHits(source, benchmark.evidence_critique_patterns) >= 3,
      hasEvidenceGrades,
      questions.some((item) => /断定しない|限界|使える範囲|過剰解釈/.test(JSON.stringify(item))),
    ]),
    dlab_life_change: scoreChecks([
      countHits(source, benchmark.scene_markers.map((marker) => new RegExp(escapeRegExp(marker)))) >= 3,
      countHits(source, benchmark.personalization_patterns) >= benchmark.personalization_patterns.length,
      actionableCount >= 4,
      source.includes(benchmark.takeaway_action),
    ]),
    duolingo_continuity: scoreChecks([
      questions.length === benchmark.expected_question_count,
      questionTypes.size >= 2,
      nearMissCount >= 3,
      hasFallback && hasTomorrowQuest,
    ]),
    psycle_reason: scoreChecks([
      qualityScores.article_advantage === 2,
      questions.filter((item) => item.type === "conversation").length >= 2,
      questions.some((item) => item.type === "swipe_judgment"),
      !visibleReferenceNames,
    ]),
    retention_without_thinness: scoreChecks([
      qualityScores.transfer === 2,
      qualityScores.practice_ladder === 2,
      obviousBadChoiceCount <= 3,
      questions.every((item) => Number(item.xp || 0) <= 10),
    ]),
  };
}

function scoreMeaningParity(benchmark, questions, source) {
  const hasFallback = questions.some((item) => /fallback|失敗時|戻り方|苦しく|戻れる/.test(JSON.stringify(item)));
  const hasTomorrowQuest = questions.some((item) => /明日/.test(`${item.question || ""} ${item.explanation || ""} ${item.actionable_advice || ""}`));
  const hasDiagnosisPayoff = questions.some((item) => /仮診断|どれ寄り|型/.test(JSON.stringify(item))) && source.includes(benchmark.takeaway_action);
  const evidenceCritiqueHits = countHits(source, benchmark.evidence_critique_patterns);

  return {
    personal_vulnerability_hook: /嫌われたかも|仕事で削られた|仕事で軽く扱われた|無駄遣い|焦り|苦しく|削られた夜|夜には|自責|反芻|丸投げ|整えすぎ|自分の判断|モヤモヤ/.test(source) ? 2 : 0,
    status_intelligence_threat: /意志が弱い|普通は|見せたい|追いLINE|自動|防御的|だまされ|逃げて|平均|丸投げ|自分の判断|AIが賢い|夜の本音|本当の自分/.test(source) ? 2 : 0,
    protective_reframing: /責め|悪者ではない|勝負にしない|ゼロにすることではない|失敗扱いしない|OK|嘘つきではない|否定ではない/.test(source) ? 2 : 0,
    hidden_operating_rule: source.includes(benchmark.takeaway_action) || /物欲.*気分消し|身体が反応|反応に名前|情報.*契約|契約.*情報/.test(source) ? 2 : 0,
    trust_building_caveat: evidenceCritiqueHits >= 3 ? 2 : evidenceCritiqueHits > 0 ? 1 : 0,
    agency_restoring_move: /10秒|分類|保留|ラベル|選ぶ|戻り方|次の一手/.test(source) && hasDiagnosisPayoff ? 2 : 0,
    series_pull_proxy: hasTomorrowQuest && hasFallback ? 2 : 1,
  };
}

function scoreChecks(checks) {
  return Math.round((checks.filter(Boolean).length / checks.length) * 20);
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

function getVisibleLessonText(questions) {
  return questions
    .map(getQuestionText)
    .join("\n");
}

function countHits(source, patterns) {
  return patterns.filter((pattern) => pattern.test(source)).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
