const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const METADATA_PATH = path.join(ROOT, "lib", "lesson-data", "lessonMetadata.ts");
const LESSON_ROOT = path.join(ROOT, "data", "lessons");
const PROTECTED_BENCHMARK_LESSONS = new Set(["mental_l01"]);
const forceAllBenchmarks =
  process.argv.includes("--force-benchmarks") ||
  process.env.PSYCLE_FORCE_BENCHMARK_REBUILD === "1";
const forceBenchmarkIds = new Set(
  process.argv
    .filter((arg) => arg.startsWith("--force-benchmark="))
    .map((arg) => arg.slice("--force-benchmark=".length))
    .filter(Boolean)
);

const DOMAIN_DIRS = {
  health: "health_units",
  mental: "mental_units",
  money: "money_units",
  social: "social_units",
  study: "study_units",
  work: "work_units",
};

const TARGET_BY_LOAD_TOTAL = {
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 10,
};

const metadata = parseLessonMetadata(fs.readFileSync(METADATA_PATH, "utf8"));

for (const lesson of metadata) {
  const domain = lesson.lesson_id.split("_")[0];
  const dir = DOMAIN_DIRS[domain];
  if (!dir) continue;

  const filePath = path.join(LESSON_ROOT, dir, `${lesson.lesson_id}.ja.json`);
  if (!fs.existsSync(filePath)) continue;

  if (
    PROTECTED_BENCHMARK_LESSONS.has(lesson.lesson_id) &&
    !forceAllBenchmarks &&
    !forceBenchmarkIds.has(lesson.lesson_id)
  ) {
    console.log(
      `skipped protected benchmark ${path.relative(ROOT, filePath)} (use --force-benchmark=${lesson.lesson_id} to overwrite)`
    );
    continue;
  }

  const existingQuestions = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const rebuilt = buildQuestions(lesson, existingQuestions);
  fs.writeFileSync(filePath, `${JSON.stringify(rebuilt, null, 2)}\n`);
  console.log(`rebuilt ${path.relative(ROOT, filePath)} (${rebuilt.length} questions)`);
}

function parseLessonMetadata(source) {
  const lessons = [];
  const entryPattern = /([a-z]+_[lm]\d+): lessonMetadata\(\{([\s\S]*?)\n  \}\),/g;
  let match;
  while ((match = entryPattern.exec(source)) !== null) {
    const body = match[2];
    const loadMatch = body.match(/load_score: loadScore\((\d),\s*(\d),\s*(\d)\)/);
    const loadTotal = loadMatch
      ? Number(loadMatch[1]) + Number(loadMatch[2]) + Number(loadMatch[3])
      : 6;
    lessons.push({
      lesson_id: readString(body, "lesson_id"),
      lane: readString(body, "lane"),
      lesson_job: readString(body, "lesson_job"),
      target_shift: readString(body, "target_shift"),
      done_condition: readString(body, "done_condition"),
      takeaway_action: readString(body, "takeaway_action"),
      loadTotal,
      targetQuestionCount: TARGET_BY_LOAD_TOTAL[loadTotal] || 8,
      insight: {
        surprising_question: readString(body, "surprising_question"),
        research_finding: readString(body, "research_finding"),
        critical_caveat: readString(body, "critical_caveat"),
        usable_scope: readString(body, "usable_scope"),
        practice_prompt: readString(body, "practice_prompt"),
      },
      non_goals: readStringArray(body, "non_goals"),
    });
  }
  return lessons.filter((lesson) => lesson.lesson_id);
}

function readString(source, key) {
  const match = source.match(new RegExp(`${key}: "([^"]*)"`, "m"));
  return match ? match[1] : "";
}

function readStringArray(source, key) {
  const match = source.match(new RegExp(`${key}: \\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function buildQuestions(lesson, existingQuestions) {
  const sources = existingQuestions.length > 0 ? existingQuestions : [{}];
  const templates = [
    hookQuestion,
    researchQuestion,
    caveatQuestion,
    scopeQuestion,
    practiceQuestion,
    transferQuestion,
    fallbackQuestion,
    anchorQuestion,
    repeatQuestion,
    boundaryQuestion,
  ];

  return templates
    .slice(0, lesson.targetQuestionCount)
    .map((template, index) => {
      const source = sources[index] || sources[sources.length - 1] || {};
      return withEvidence(template(lesson, index + 1), lesson, index + 1, source);
    });
}

function withEvidence(question, lesson, number, source) {
  const claimId = `${lesson.lesson_id}_${String(number).padStart(3, "0")}_claim`;
  return cleanObject({
    ...question,
    id: `${lesson.lesson_id}_${String(number).padStart(3, "0")}`,
    claim_id: claimId,
    difficulty: question.difficulty || (number <= 3 ? "easy" : "medium"),
    xp: question.xp || 5,
    source_id: source.source_id || `${lesson.lesson_id}_source`,
    evidence_grade: source.evidence_grade || "silver",
    expanded_details: {
      claim_type: question.expanded_details?.claim_type || "intervention",
      evidence_type: question.expanded_details?.evidence_type || "theoretical",
      best_for: question.expanded_details?.best_for || [lesson.insight.usable_scope],
      limitations:
        question.expanded_details?.limitations || safeLimitations(lesson),
      citation_role:
        question.expanded_details?.citation_role ||
        "lesson blueprint の research_finding と usable_scope を日常判断へ落とす",
      ...(question.expanded_details?.try_this
        ? { try_this: question.expanded_details.try_this }
        : {}),
      claim_tags: [lesson.lesson_id, lesson.lane, "paleo_to_practice"],
    },
  });
}

function hookQuestion(lesson) {
  return {
    type: "conversation",
    question: `${lesson.insight.surprising_question}\n\n最近の自分に近いのは？`,
    your_response_prompt: "直感で選んでください",
    choices: ["かなり近い", "少し近い", "今はあまりない"],
    recommended_index: null,
    explanation: `${lesson.insight.research_finding}。まずは自分の場面で気づければ十分。`,
    actionable_advice: null,
    difficulty: "easy",
    expanded_details: {
      claim_type: "observation",
      evidence_type: "direct",
      citation_role: "意外な問いを生活場面へ接続",
    },
  };
}

function researchQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "この場面をPsycleで見るなら、いちばん近い見方は？",
    choices: [
      cap(lesson.insight.research_finding, 70),
      "自分の性格だけで決まると見る",
      "考えずに勢いだけで押し切る",
    ],
    correct_index: 0,
    explanation: `${lesson.insight.research_finding}。ただし、ここでは日常で使える範囲に絞って扱う。`,
    actionable_advice: null,
    difficulty: "easy",
    expanded_details: {
      claim_type: "theory",
      evidence_type: "theoretical",
      citation_role: "研究発見を過剰に広げず説明",
    },
  };
}

function caveatQuestion(lesson) {
  return {
    type: "swipe_judgment",
    question: `この発見は、どんな人・どんな場面にもそのまま当てはめてよい。\n\n${lesson.insight.critical_caveat}`,
    is_true: false,
    swipe_labels: {
      left: "広げすぎ",
      right: "そのまま使う",
    },
    explanation: `広げすぎないのが大事。${lesson.insight.critical_caveat}`,
    actionable_advice: null,
    difficulty: "easy",
    expanded_details: {
      claim_type: "theory",
      evidence_type: "theoretical",
      citation_role: "研究の限界と安全な解釈を確認",
    },
  };
}

function scopeQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "このlessonを使う範囲として、いちばん安全なのは？",
    choices: [
      cap(lesson.insight.usable_scope, 72),
      "強い症状や深刻な問題をこれだけで解決する",
      "相手や環境の影響をないものとして扱う",
    ],
    correct_index: 0,
    explanation: `使う範囲は狭くていい。${lesson.insight.usable_scope}`,
    actionable_advice: null,
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "usable_scope を日常場面へ限定",
    },
  };
}

function practiceQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "次に同じ場面が来たら、最初の10秒で何をする？",
    choices: practiceChoices(lesson),
    correct_index: 0,
    explanation: `ここでは完璧な改善より、最初の10秒で選べることを作る。${lesson.takeaway_action}`,
    actionable_advice: `次に試す: ${lesson.takeaway_action}`,
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "takeaway_action を10秒練習に変換",
      try_this: lesson.takeaway_action,
    },
  };
}

function transferQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "別の場面に移して使うなら、どの判断が近い？",
    choices: [
      cap(lesson.done_condition, 72),
      "同じやり方を無理にあらゆる場面へ当てる",
      "できなかったらこのlessonは失敗と決める",
    ],
    correct_index: 0,
    explanation: `ゴールは理解だけではなく、${lesson.done_condition}`,
    actionable_advice: `迷ったら: ${lesson.takeaway_action}`,
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "done_condition を transfer 判断へ接続",
      try_this: lesson.takeaway_action,
    },
  };
}

function fallbackQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "10秒試して、逆につらくなった時の扱いは？",
    choices: [
      "今日は撤退して、別の小さい一手に替える",
      "合わなくても続けることだけを優先する",
      "できない自分を責める",
    ],
    correct_index: 0,
    explanation: "合わない時に引けることも練習の一部。続けることより、安全に戻れることを優先する。",
    actionable_advice: "合わなければ今日は撤退でOK",
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "介入の撤退条件を明確化",
      try_this: "合わなければ今日は撤退でOK",
    },
  };
}

function anchorQuestion(lesson) {
  return {
    type: "conversation",
    question: "最後に、このlessonで持ち帰るならどれ？",
    your_response_prompt: "次の場面に残す一言を選んでください",
    choices: practiceChoices(lesson),
    recommended_index: 0,
    explanation: `今日の持ち帰りはこれ。${lesson.takeaway_action}`,
    actionable_advice: lesson.takeaway_action,
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "anchor として次の小さい行動を保存",
      try_this: lesson.takeaway_action,
    },
  };
}

function repeatQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "明日もう一度やるなら、何を見れば十分？",
    choices: [
      "同じ場面に気づけたかだけ見る",
      "気分が完全に良くなったかで判断する",
      "毎回うまくできたかだけで判断する",
    ],
    correct_index: 0,
    explanation: "継続では、完璧さより再発見と戻り方を見る。気づけた時点で次の練習につながる。",
    actionable_advice: lesson.takeaway_action,
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "repeat 判断を完璧主義から切り離す",
      try_this: lesson.takeaway_action,
    },
  };
}

function boundaryQuestion(lesson) {
  return {
    type: "multiple_choice",
    question: "このlessonで扱わないものは？",
    choices: [
      safeBoundary(lesson),
      cap(lesson.insight.usable_scope, 72),
      cap(lesson.takeaway_action, 72),
    ],
    correct_index: 0,
    explanation: `扱う範囲を狭くするほど、安全に使いやすい。${lesson.insight.critical_caveat}`,
    actionable_advice: "範囲外なら、無理にこのlessonだけで扱わない",
    difficulty: "medium",
    expanded_details: {
      claim_type: "intervention",
      evidence_type: "indirect",
      citation_role: "non_goal と安全境界を確認",
    },
  };
}

function splitPractice(prompt) {
  const cleaned = prompt
    .replace(/、?から選ぶ$/, "")
    .replace(/を選ぶ$/, "")
    .trim();
  const parts = cleaned
    .split(/\s*\/\s*|、/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  while (parts.length < 3) {
    parts.push(["今日は撤退", "後で戻る", "必要なら休む"][parts.length]);
  }

  return parts.map((part) => cap(part, 42));
}

function practiceChoices(lesson) {
  const choices = [
    lesson.takeaway_action,
    ...splitPractice(lesson.insight.practice_prompt).filter(
      (choice) => choice !== lesson.takeaway_action,
    ),
    "いつもの反応をそのまま続ける",
    "今日の結果だけで良し悪しを決める",
  ];

  return unique(choices.map((choice) => cap(choice, 46))).slice(0, 3);
}

function safeBoundary(lesson) {
  const explicit = lesson.non_goals.find((item) => /強い|慢性|深刻|医療|睡眠制限/.test(item));
  return explicit || "家計・職場・人間関係などの大きな問題をこれだけで解決すること";
}

function safeLimitations(lesson) {
  return unique([
    lesson.insight.critical_caveat,
    safeBoundary(lesson),
    "強い症状や深刻な問題はこのlessonだけで扱わない",
  ]).slice(0, 2);
}

function unique(items) {
  return items.filter(Boolean).filter((item, index, array) => array.indexOf(item) === index);
}

function cap(text, maxLength) {
  const cleaned = cleanText(text);
  if (!cleaned || cleaned.length <= maxLength) return cleaned || "";
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function cleanObject(value) {
  if (typeof value === "string") return cleanText(value);
  if (Array.isArray(value)) return value.map(cleanObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanObject(item)]));
}

function cleanText(text) {
  return String(text || "")
    .replace(/必ず効く/g, "いつも効く")
    .replace(/必ず/g, "いつも")
    .replace(/確実/g, "かなり")
    .replace(/治る/g, "楽になる")
    .replace(/自己治療/g, "自己判断の対応")
    .replace(/治療/g, "医療的対応")
    .replace(/全部/g, "すべて")
    .replace(/気合い/g, "勢い")
    .replace(/100%/g, "完全に");
}
