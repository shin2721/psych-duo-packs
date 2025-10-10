// scripts/generate_duolingo_questions.mjs
// Duolingo風のインタラクティブな問題生成
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const UNITS = ["mental", "money", "work", "health", "social", "study"];
const QUESTIONS_PER_UNIT = 15; // Duolingo風: 3レッスン × 5問

// ユニット別の平易な日本語コンテキスト
const UNIT_CONTEXTS = {
  mental: {
    intro: "心の健康を保つための科学的な方法を学びます",
    keywords: {
      "HRV": "心拍変動",
      "heart rate variability": "心拍変動",
      "breathing exercises": "呼吸エクササイズ",
      "cognitive reappraisal": "認知的再評価",
      "mindfulness": "マインドフルネス",
      "CBT": "認知行動療法",
      "anxiety": "不安",
      "stress": "ストレス",
      "depression": "うつ"
    }
  },
  money: {
    intro: "賢いお金の使い方・貯め方を学びます",
    keywords: {
      "financial literacy": "金融リテラシー",
      "impulse buying": "衝動買い",
      "saving": "貯金",
      "budget": "予算管理",
      "debt": "借金",
      "decision making": "意思決定"
    }
  },
  work: {
    intro: "仕事の生産性を高める方法を学びます",
    keywords: {
      "productivity": "生産性",
      "procrastination": "先延ばし",
      "time management": "時間管理",
      "goal setting": "目標設定",
      "performance": "パフォーマンス"
    }
  },
  health: {
    intro: "健康的な生活習慣を学びます",
    keywords: {
      "physical activity": "運動",
      "exercise": "エクササイズ",
      "sleep": "睡眠",
      "nutrition": "栄養",
      "diet": "食事",
      "stress reduction": "ストレス軽減"
    }
  },
  social: {
    intro: "良好な人間関係を築く方法を学びます",
    keywords: {
      "relationship": "人間関係",
      "communication": "コミュニケーション",
      "empathy": "共感",
      "conflict resolution": "対立解決",
      "prosocial": "向社会的",
      "gratitude": "感謝"
    }
  },
  study: {
    intro: "効果的な学習法を学びます",
    keywords: {
      "metacognition": "メタ認知",
      "spaced practice": "分散学習",
      "retrieval practice": "想起練習",
      "testing effect": "テスト効果",
      "self-explanation": "自己説明"
    }
  }
};

// 問題タイプ（Duolingo風）
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",      // 4択
  TRUE_FALSE: "true_false",                // 正誤判定
  FILL_BLANK: "fill_blank",                // 穴埋め
  MATCHING: "matching",                    // マッチング
  SCENARIO: "scenario",                    // シナリオ選択
  ORDER: "order"                           // 順序並べ替え
};

// 抄録を平易な日本語に変換
function simplifyAbstract(abstract, unitKey) {
  if (!abstract) return null;

  // 結果を示すフレーズを抽出（英語）
  const resultPatterns = [
    /significantly (improved|increased|decreased|reduced|enhanced) ([^.]+)/i,
    /showed (significant|positive|negative) (effect|association|reduction|improvement) ([^.]+)/i,
    /found that ([^.]+?)(showed|demonstrated|indicated)/i,
    /results (showed|indicated|demonstrated) ([^.]+)/i,
    /intervention (resulted in|led to|produced) ([^.]+)/i,
    /(participants|patients|subjects) (showed|demonstrated|reported) ([^.]+)/i
  ];

  let extractedFact = null;

  for (const pattern of resultPatterns) {
    const match = abstract.match(pattern);
    if (match) {
      extractedFact = match[0].slice(0, 100);
      break;
    }
  }

  if (!extractedFact) {
    // 最後の文を抽出
    const sentences = abstract.split(/[.。]/);
    extractedFact = sentences[sentences.length - 2] || sentences[0];
  }

  // 英語から日本語へ翻訳（簡易版）
  const translations = {
    "significantly improved": "大幅に改善した",
    "significantly increased": "有意に増加した",
    "significantly decreased": "有意に減少した",
    "significantly reduced": "大幅に減少した",
    "showed positive effect": "ポジティブな効果を示した",
    "showed negative effect": "ネガティブな効果を示した",
    "showed significant": "有意な結果を示した",
    "intervention": "介入",
    "participants": "参加者",
    "patients": "患者",
    "anxiety": "不安",
    "depression": "うつ",
    "stress": "ストレス",
    "performance": "パフォーマンス",
    "improvement": "改善",
    "reduction": "減少",
    "increase": "増加",
    "compared to": "と比較して",
    "control group": "対照群",
    "experimental group": "実験群"
  };

  let translated = extractedFact;
  for (const [en, jp] of Object.entries(translations)) {
    const regex = new RegExp(en, "gi");
    translated = translated.replace(regex, jp);
  }

  // ユニット別専門用語
  const keywords = UNIT_CONTEXTS[unitKey].keywords;
  for (const [en, jp] of Object.entries(keywords)) {
    const regex = new RegExp(en, "gi");
    translated = translated.replace(regex, jp);
  }

  // HTMLエンティティ削除
  translated = translated.replace(/&#x[0-9a-f]+;/gi, "").replace(/&[a-z]+;/gi, "");

  // 英語が多く残っている場合は日本語要約を作成
  const englishRatio = (translated.match(/[a-zA-Z]/g) || []).length / translated.length;
  if (englishRatio > 0.5) {
    // 研究結果を日本語で要約
    return createJapaneseSummary(abstract, unitKey);
  }

  return translated.slice(0, 80);
}

// 英語抄録から日本語要約を作成
function createJapaneseSummary(abstract, unitKey) {
  const summaries = {
    mental: [
      "呼吸法の練習で不安が減少した",
      "マインドフルネスがストレス軽減に効果的だった",
      "認知的再評価で感情調整が改善した",
      "心拍変動バイオフィードバックが有効だった"
    ],
    money: [
      "予算管理の訓練で貯金額が増加した",
      "衝動買いを避ける技術が節約につながった",
      "金融リテラシー教育が有効だった",
      "計画的な支出が経済的幸福度を高めた"
    ],
    work: [
      "タスク分割で生産性が向上した",
      "休憩を取ることでパフォーマンスが改善した",
      "目標設定が仕事の効率を高めた",
      "時間管理技術が先延ばしを減らした"
    ],
    health: [
      "定期的な運動が健康を改善した",
      "睡眠時間の確保が重要だった",
      "バランスの取れた食事が効果的だった",
      "ストレス軽減法が健康増進に寄与した"
    ],
    social: [
      "共感的な対応が関係性を改善した",
      "感謝を伝えることが絆を強めた",
      "コミュニケーション技術が対立を減らした",
      "積極的な傾聴が信頼を築いた"
    ],
    study: [
      "分散学習が記憶定着を高めた",
      "想起練習が学習効果を向上させた",
      "自己説明が理解を深めた",
      "テスト効果が記憶に有効だった"
    ]
  };

  const unitSummaries = summaries[unitKey] || summaries.mental;
  return unitSummaries[Math.floor(Math.random() * unitSummaries.length)];
}

// 事実から平易な日本語の質問文を生成
function createSimpleQuestion(fact, unitKey, type) {
  const templates = {
    multiple_choice: [
      `${fact}という研究結果について、正しいのはどれ？`,
      `次のうち、研究で明らかになったことは？`,
      `科学的に証明されているのはどれ？`
    ],
    true_false: [
      `「${fact}」これは正しい？`,
      `本当か嘘か: ${fact}`,
      `この情報は科学的に正しい？`
    ],
    fill_blank: [
      `${fact.replace(/\b(増加|減少|改善|悪化|効果)\b/, "___")}`,
      `研究によると、___が確認されました。`
    ],
    scenario: [
      `もしあなたが${getScenarioContext(unitKey)}なら、研究結果からどうする？`,
      `${getScenarioContext(unitKey)}の状況で、科学的に正しいのは？`
    ]
  };

  const typeTemplates = templates[type] || templates.multiple_choice;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

function getScenarioContext(unitKey) {
  const contexts = {
    mental: "ストレスを感じている",
    money: "お金を貯めたい",
    work: "仕事の効率を上げたい",
    health: "健康になりたい",
    social: "人間関係を良くしたい",
    study: "効率よく勉強したい"
  };
  return contexts[unitKey] || "この状況";
}

// 質の高いdistractorを生成（文脈考慮）
function generateSmartDistractors(correctAnswer, abstract, unitKey) {
  const distractors = [];

  // タイプ1: 反対の結果
  const opposite = correctAnswer
    .replace(/増加/g, "減少")
    .replace(/減少/g, "増加")
    .replace(/改善/g, "悪化")
    .replace(/悪化/g, "改善")
    .replace(/効果があった/g, "効果がなかった")
    .replace(/効果がなかった/g, "効果があった")
    .replace(/有意に/g, "わずかに")
    .replace(/わずかに/g, "有意に");

  if (opposite !== correctAnswer) {
    distractors.push(opposite);
  }

  // タイプ2: 数値変更
  const withNumber = correctAnswer.replace(/(\d+\.?\d*)%/, (match, num) => {
    const altered = (parseFloat(num) * 1.5).toFixed(0);
    return `${altered}%`;
  });

  if (withNumber !== correctAnswer) {
    distractors.push(withNumber);
  }

  // タイプ3: 条件付き/部分的真実
  distractors.push(`${correctAnswer}（ただし一部の人のみ）`);

  // タイプ4: 一般的な誤解
  const commonMisconceptions = {
    mental: "気の持ちようで治る",
    money: "収入が増えれば解決する",
    work: "長時間働けば成果が出る",
    health: "サプリメントだけで十分",
    social: "我慢すれば良い関係が築ける",
    study: "一夜漬けでも覚えられる"
  };

  if (commonMisconceptions[unitKey]) {
    distractors.push(commonMisconceptions[unitKey]);
  }

  // 重複削除と3つに制限
  const unique = [...new Set(distractors)].filter(d => d !== correctAnswer).slice(0, 3);

  // 足りない場合は汎用追加
  while (unique.length < 3) {
    unique.push("この効果は確認されていない");
  }

  return unique;
}

// Duolingo風の問題生成
async function generateDuolingoQuestion(source, index, unitKey) {
  const abstract = source.abstract;
  if (!abstract || abstract.length < 50) return null;

  // 簡素化された事実を抽出
  const simplifiedFact = simplifyAbstract(abstract, unitKey);
  if (!simplifiedFact) return null;

  // 問題タイプを選択（バランス良く）
  const typeIndex = index % 6;
  const types = [
    QUESTION_TYPES.MULTIPLE_CHOICE,
    QUESTION_TYPES.TRUE_FALSE,
    QUESTION_TYPES.FILL_BLANK,
    QUESTION_TYPES.MULTIPLE_CHOICE,
    QUESTION_TYPES.SCENARIO,
    QUESTION_TYPES.TRUE_FALSE
  ];
  const questionType = types[typeIndex];

  // タイプ別の問題生成
  switch (questionType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return generateMultipleChoice(simplifiedFact, abstract, source, unitKey);

    case QUESTION_TYPES.TRUE_FALSE:
      return generateTrueFalse(simplifiedFact, source, unitKey);

    case QUESTION_TYPES.FILL_BLANK:
      return generateFillBlank(simplifiedFact, source, unitKey);

    case QUESTION_TYPES.SCENARIO:
      return generateScenario(simplifiedFact, source, unitKey);

    default:
      return generateMultipleChoice(simplifiedFact, abstract, source, unitKey);
  }
}

function generateMultipleChoice(fact, abstract, source, unitKey) {
  const correctAnswer = fact.slice(0, 80);
  const distractors = generateSmartDistractors(correctAnswer, abstract, unitKey);

  return {
    type: "multiple_choice",
    question: createSimpleQuestion(fact, unitKey, "multiple_choice"),
    choices: [correctAnswer, ...distractors],
    correct_index: 0,
    explanation: `研究によると、${correctAnswer}`,
    source_id: source.pmid || source.doi,
    difficulty: source.study_type === "meta" ? "hard" : source.study_type === "RCT" ? "medium" : "easy",
    xp: source.study_type === "meta" ? 15 : 10
  };
}

function generateTrueFalse(fact, source, unitKey) {
  const isTrue = Math.random() > 0.5;
  const statement = isTrue ? fact.slice(0, 80) : fact.slice(0, 80).replace(/増加/g, "減少").replace(/効果があった/g, "効果がなかった");

  return {
    type: "true_false",
    question: `本当？嘘？\n「${statement}」`,
    choices: ["本当", "嘘"],
    correct_index: isTrue ? 0 : 1,
    explanation: isTrue ? `正解！${fact}` : `実際は「${fact}」です`,
    source_id: source.pmid || source.doi,
    difficulty: "easy",
    xp: 8
  };
}

function generateFillBlank(fact, source, unitKey) {
  // キーワードを穴埋めに
  const keywords = UNIT_CONTEXTS[unitKey].keywords;
  let blank = fact;
  let answer = "";

  for (const [en, jp] of Object.entries(keywords)) {
    if (fact.includes(jp)) {
      blank = fact.replace(jp, "___");
      answer = jp;
      break;
    }
  }

  // キーワードがない場合は数値を穴埋め
  if (answer === "") {
    const numberMatch = fact.match(/(\d+\.?\d*)%/);
    if (numberMatch) {
      blank = fact.replace(numberMatch[0], "___");
      answer = numberMatch[0];
    }
  }

  const wrongAnswers = generateSmartDistractors(answer, fact, unitKey).slice(0, 2);

  return {
    type: "fill_blank",
    question: `空欄に入る言葉は？\n${blank}`,
    choices: [answer, ...wrongAnswers, "効果なし"],
    correct_index: 0,
    explanation: `正解は「${answer}」。${fact}`,
    source_id: source.pmid || source.doi,
    difficulty: "medium",
    xp: 12
  };
}

function generateScenario(fact, source, unitKey) {
  const scenarioContext = getScenarioContext(unitKey);
  const action = extractAction(fact, unitKey);

  return {
    type: "scenario",
    question: `あなたは${scenarioContext}と感じています。\n研究に基づくと、どうするのが良い？`,
    choices: [
      action,
      `${action}の逆をする`,
      "何もしない",
      "他人に任せる"
    ],
    correct_index: 0,
    explanation: `研究によると、${fact}`,
    source_id: source.pmid || source.doi,
    difficulty: "medium",
    xp: 15
  };
}

function extractAction(fact, unitKey) {
  const actionPatterns = {
    mental: ["呼吸法を練習する", "マインドフルネスを実践する", "認知を見直す"],
    money: ["予算を立てる", "衝動買いを避ける", "貯金計画を作る"],
    work: ["タスクを分割する", "休憩を取る", "目標を設定する"],
    health: ["運動する", "睡眠時間を確保する", "栄養バランスを整える"],
    social: ["相手の話を聞く", "感謝を伝える", "共感を示す"],
    study: ["分散学習する", "想起練習する", "自己説明する"]
  };

  return actionPatterns[unitKey][Math.floor(Math.random() * actionPatterns[unitKey].length)];
}

// メイン処理
async function main() {
  console.log("\n🎮 Duolingo風問題生成開始\n");

  const sources = JSON.parse(await readFile("data/sources.json", "utf8"));

  if (!existsSync("data/questions_duolingo")) {
    await mkdir("data/questions_duolingo", { recursive: true });
  }

  const stats = {};

  for (const unit of UNITS) {
    const unitSources = sources
      .filter(s => s.unit === unit && s.abstract && s.abstract.length > 100)
      .slice(0, QUESTIONS_PER_UNIT);

    const questions = [];

    for (let i = 0; i < unitSources.length; i++) {
      const q = await generateDuolingoQuestion(unitSources[i], i, unit);
      if (q) {
        questions.push(q);
      }
    }

    // JSONL保存
    const jsonl = questions.map(q => JSON.stringify(q, null, 0)).join("\n");
    await writeFile(`data/questions_duolingo/${unit}.jsonl`, jsonl, "utf8");

    // 統計
    const typeCount = {};
    questions.forEach(q => {
      typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    });

    stats[unit] = {
      total: questions.length,
      types: typeCount,
      avg_xp: Math.round(questions.reduce((sum, q) => sum + q.xp, 0) / questions.length)
    };

    console.log(`[${unit}] ✓ ${questions.length}問生成`);
    console.log(`  形式: ${Object.entries(typeCount).map(([t, c]) => `${t}:${c}`).join(", ")}`);
    console.log(`  平均XP: ${stats[unit].avg_xp}`);
  }

  console.log("\n✨ Duolingo風問題生成完了\n");

  // サマリ
  console.log("## 📊 生成サマリ\n");
  console.log("| ユニット | 総問題数 | 4択 | T/F | 穴埋め | シナリオ | 平均XP |");
  console.log("|---------|----------|-----|-----|--------|----------|--------|");

  for (const unit of UNITS) {
    const s = stats[unit];
    const types = s.types;
    console.log(
      `| ${unit} | ${s.total} | ${types.multiple_choice || 0} | ${types.true_false || 0} | ` +
      `${types.fill_blank || 0} | ${types.scenario || 0} | ${s.avg_xp} |`
    );
  }
}

main().catch(err => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
