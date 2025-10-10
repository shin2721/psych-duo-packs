#!/usr/bin/env node
// Duolingo品質の300問生成（50問×6ユニット、段階的難易度）
import { readFile, writeFile } from "fs/promises";

const UNITS = ["mental", "money", "work", "health", "social", "study"];
const QUESTIONS_PER_UNIT = 50;

// 難易度分布（Duolingo風）
const DIFFICULTY_DISTRIBUTION = {
  "1-15": { easy: 0.7, medium: 0.25, hard: 0.05 },   // Lesson 1-3: 初級
  "16-35": { easy: 0.2, medium: 0.6, hard: 0.2 },    // Lesson 4-7: 中級
  "36-50": { easy: 0.1, medium: 0.3, hard: 0.6 }     // Lesson 8-10: 上級
};

// 問題タイプ分布
const TYPE_DISTRIBUTION = {
  "1-15": { multiple_choice: 0.4, true_false: 0.4, fill_blank: 0.1, scenario: 0.1 },
  "16-35": { multiple_choice: 0.3, true_false: 0.2, fill_blank: 0.3, scenario: 0.2 },
  "36-50": { multiple_choice: 0.2, true_false: 0.1, fill_blank: 0.3, scenario: 0.4 }
};

// XP設定
const XP_MAP = { easy: 8, medium: 12, hard: 15 };

// ユニット別キーワード
const UNIT_CONTEXTS = {
  mental: {
    keywords: {
      "breathing": "呼吸", "anxiety": "不安", "stress": "ストレス", "depression": "うつ",
      "mindfulness": "マインドフルネス", "meditation": "瞑想", "relaxation": "リラクゼーション",
      "cognitive": "認知的", "emotion": "感情", "heart rate": "心拍", "variability": "変動",
      "biofeedback": "バイオフィードバック", "intervention": "介入", "therapy": "療法"
    },
    summaries: [
      "呼吸法の練習で不安が減少した", "マインドフルネスがストレス軽減に効果的だった",
      "認知的再評価で感情調整が改善した", "心拍変動バイオフィードバックが有効だった",
      "瞑想の実践でストレスが軽減した", "リラクゼーション技法が不安を和らげた",
      "ポジティブ思考がメンタルヘルスを改善した", "深呼吸が緊張を緩和した"
    ]
  },
  money: {
    keywords: {
      "budget": "予算", "saving": "貯金", "debt": "借金", "financial": "金融",
      "literacy": "リテラシー", "impulse": "衝動", "spending": "支出", "income": "収入"
    },
    summaries: [
      "予算管理の訓練で貯金額が増加した", "衝動買いを避ける技術が節約につながった",
      "金融リテラシー教育が有効だった", "計画的な支出が経済的幸福度を高めた",
      "自動貯金システムが貯蓄を促進した", "家計簿の記録が支出管理に効果的だった"
    ]
  },
  work: {
    keywords: {
      "productivity": "生産性", "procrastination": "先延ばし", "time management": "時間管理",
      "goal": "目標", "task": "タスク", "performance": "パフォーマンス", "efficiency": "効率"
    },
    summaries: [
      "タスク分割で生産性が向上した", "休憩を取ることでパフォーマンスが改善した",
      "目標設定が仕事の効率を高めた", "時間管理技術が先延ばしを減らした",
      "優先順位付けが業務効率を改善した", "集中時間の確保が成果を向上させた"
    ]
  },
  health: {
    keywords: {
      "exercise": "運動", "sleep": "睡眠", "diet": "食事", "nutrition": "栄養",
      "physical": "身体", "activity": "活動", "health": "健康", "wellness": "ウェルネス"
    },
    summaries: [
      "定期的な運動が健康を改善した", "睡眠時間の確保が重要だった",
      "バランスの取れた食事が効果的だった", "ストレス軽減法が健康増進に寄与した",
      "有酸素運動が心肺機能を向上させた", "十分な休息が回復を促進した"
    ]
  },
  social: {
    keywords: {
      "relationship": "関係", "communication": "コミュニケーション", "empathy": "共感",
      "social": "社会的", "interpersonal": "対人", "conflict": "対立", "gratitude": "感謝"
    },
    summaries: [
      "共感的な対応が関係性を改善した", "感謝を伝えることが絆を強めた",
      "積極的な傾聴が信頼を築いた", "コミュニケーション技術が対立を減らした",
      "相手の立場を理解することが関係を深めた", "定期的な交流が人間関係を強化した"
    ]
  },
  study: {
    keywords: {
      "learning": "学習", "memory": "記憶", "practice": "練習", "retrieval": "想起",
      "spaced": "分散", "testing": "テスト", "metacognition": "メタ認知", "self-explanation": "自己説明"
    },
    summaries: [
      "想起練習が学習効果を向上させた", "分散学習が記憶定着を高めた",
      "テスト効果が記憶に有効だった", "自己説明が理解を深めた",
      "反復練習が習得を促進した", "教えることで学習が定着した"
    ]
  }
};

// 抄録を日本語に簡略化
function simplifyAbstract(abstract, unitKey) {
  if (!abstract) return UNIT_CONTEXTS[unitKey].summaries[0];

  const keywords = UNIT_CONTEXTS[unitKey].keywords;
  let translated = abstract.toLowerCase();

  // キーワード翻訳
  for (const [en, jp] of Object.entries(keywords)) {
    translated = translated.replace(new RegExp(en, "gi"), jp);
  }

  // 英語が多い場合は要約を使用
  const englishRatio = (translated.match(/[a-zA-Z]/g) || []).length / translated.length;
  if (englishRatio > 0.4 || translated.length < 20) {
    const summaries = UNIT_CONTEXTS[unitKey].summaries;
    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  // 結果文を抽出
  const sentences = translated.split(/[.。]/);
  for (const sent of sentences) {
    if (sent.length > 15 && sent.length < 80 && /が|を|に|で/.test(sent)) {
      return sent.trim();
    }
  }

  return UNIT_CONTEXTS[unitKey].summaries[0];
}

// スマートな選択肢生成
function generateSmartDistractors(correctAnswer, unitKey) {
  const variations = {
    "増加": "減少", "減少": "増加", "改善": "悪化", "向上": "低下",
    "軽減": "増大", "効果的": "効果なし", "促進": "阻害", "強化": "弱化",
    "高めた": "下げた", "深めた": "浅くした", "築いた": "壊した"
  };

  const distractors = [];

  // 1. 反対の結果
  let opposite = correctAnswer;
  for (const [from, to] of Object.entries(variations)) {
    if (correctAnswer.includes(from)) {
      opposite = correctAnswer.replace(from, to);
      break;
    }
  }
  if (opposite !== correctAnswer) distractors.push(opposite);

  // 2. 部分的真実
  distractors.push(`${correctAnswer}（ただし一部の人のみ）`);

  // 3. よくある誤解
  const misconceptions = {
    mental: "気の持ちようで治る",
    money: "収入が増えれば解決する",
    work: "長時間働けば成果が出る",
    health: "サプリメントだけで十分",
    social: "我慢すれば良い関係が築ける",
    study: "一夜漬けでも覚えられる"
  };
  distractors.push(misconceptions[unitKey]);

  // 4. 一般的な否定
  distractors.push("この効果は確認されていない");

  return distractors.slice(0, 3);
}

// 問題生成
function generateQuestion(source, index, unitKey, difficulty, type) {
  const summary = simplifyAbstract(source.abstract, unitKey);
  const xp = XP_MAP[difficulty];

  if (type === "multiple_choice") {
    const distractors = generateSmartDistractors(summary, unitKey);
    return {
      type: "multiple_choice",
      question: index < 20 ? "次のうち、研究で明らかになったことは？" : "科学的に証明されているのはどれ？",
      choices: [summary, ...distractors],
      correct_index: 0,
      explanation: `研究によると、${summary}`,
      source_id: source.pmid || source.doi || `source_${index}`,
      difficulty,
      xp
    };
  } else if (type === "true_false") {
    const isTrue = Math.random() > 0.5;
    return {
      type: "true_false",
      question: `本当？嘘？\n「${summary}」`,
      choices: ["本当", "嘘"],
      correct_index: isTrue ? 0 : 1,
      explanation: isTrue ? `正解！${summary}` : `実際は「${summary}」です`,
      source_id: source.pmid || source.doi || `source_${index}`,
      difficulty,
      xp
    };
  } else if (type === "fill_blank") {
    const parts = summary.split(/が|で|を|に/);
    if (parts.length >= 2) {
      const blank = parts[0];
      const rest = summary.slice(blank.length);
      return {
        type: "fill_blank",
        question: `空欄に入る言葉は？\n___${rest}`,
        choices: [blank, `${blank}（一部のみ）`, "効果なし", "確認されていない"],
        correct_index: 0,
        explanation: `正解は「${blank}」。${summary}`,
        source_id: source.pmid || source.doi || `source_${index}`,
        difficulty,
        xp
      };
    }
    // Fallback to MCQ
    return generateQuestion(source, index, unitKey, difficulty, "multiple_choice");
  } else { // scenario
    const actions = {
      mental: ["深呼吸する", "マインドフルネスを実践する", "リラックスする"],
      money: ["予算を立てる", "支出を記録する", "貯金計画を作る"],
      work: ["タスクを分割する", "優先順位をつける", "休憩を取る"],
      health: ["運動する", "睡眠時間を確保する", "バランス良く食べる"],
      social: ["相手の話を聞く", "共感を示す", "感謝を伝える"],
      study: ["復習する", "想起練習する", "分散学習する"]
    };

    const contexts = {
      mental: "ストレスを感じている",
      money: "お金を貯めたい",
      work: "仕事の効率を上げたい",
      health: "健康になりたい",
      social: "人間関係を良くしたい",
      study: "効率よく勉強したい"
    };

    const actionList = actions[unitKey];
    const action = actionList[index % actionList.length];

    return {
      type: "scenario",
      question: `あなたは${contexts[unitKey]}と感じています。\n研究に基づくと、どうするのが良い？`,
      choices: [action, `${action}の逆をする`, "何もしない", "他人に任せる"],
      correct_index: 0,
      explanation: `研究によると、${summary}`,
      source_id: source.pmid || source.doi || `source_${index}`,
      difficulty,
      xp
    };
  }
}

// 難易度とタイプを決定
function getDifficultyAndType(index) {
  let range, diffDist, typeDist;

  if (index < 15) {
    range = "1-15";
  } else if (index < 35) {
    range = "16-35";
  } else {
    range = "36-50";
  }

  diffDist = DIFFICULTY_DISTRIBUTION[range];
  typeDist = TYPE_DISTRIBUTION[range];

  // 難易度決定
  const diffRand = Math.random();
  let difficulty;
  if (diffRand < diffDist.easy) {
    difficulty = "easy";
  } else if (diffRand < diffDist.easy + diffDist.medium) {
    difficulty = "medium";
  } else {
    difficulty = "hard";
  }

  // タイプ決定
  const typeRand = Math.random();
  let type;
  if (typeRand < typeDist.multiple_choice) {
    type = "multiple_choice";
  } else if (typeRand < typeDist.multiple_choice + typeDist.true_false) {
    type = "true_false";
  } else if (typeRand < typeDist.multiple_choice + typeDist.true_false + typeDist.fill_blank) {
    type = "fill_blank";
  } else {
    type = "scenario";
  }

  return { difficulty, type };
}

// メイン処理
async function main() {
  console.log("🎓 Duolingo品質の300問生成開始\n");

  const sources = JSON.parse(await readFile("data/sources.json", "utf8"));

  for (const unit of UNITS) {
    console.log(`\n=== ${unit} ===`);

    const unitSources = sources.filter(s => s.unit === unit && s.abstract && s.abstract.length > 50);
    console.log(`  利用可能なソース: ${unitSources.length}件`);

    if (unitSources.length < QUESTIONS_PER_UNIT) {
      console.warn(`  ⚠️  ソース不足！ ${unitSources.length}件 < ${QUESTIONS_PER_UNIT}問`);
    }

    const questions = [];

    for (let i = 0; i < QUESTIONS_PER_UNIT; i++) {
      const source = unitSources[i % unitSources.length];
      const { difficulty, type } = getDifficultyAndType(i);
      const question = generateQuestion(source, i, unit, difficulty, type);
      questions.push(question);
    }

    // 統計
    const stats = {
      easy: questions.filter(q => q.difficulty === "easy").length,
      medium: questions.filter(q => q.difficulty === "medium").length,
      hard: questions.filter(q => q.difficulty === "hard").length,
      types: {
        multiple_choice: questions.filter(q => q.type === "multiple_choice").length,
        true_false: questions.filter(q => q.type === "true_false").length,
        fill_blank: questions.filter(q => q.type === "fill_blank").length,
        scenario: questions.filter(q => q.type === "scenario").length
      }
    };

    console.log(`  生成: ${questions.length}問`);
    console.log(`  難易度: easy=${stats.easy}, medium=${stats.medium}, hard=${stats.hard}`);
    console.log(`  タイプ: MCQ=${stats.types.multiple_choice}, T/F=${stats.types.true_false}, Fill=${stats.types.fill_blank}, Scenario=${stats.types.scenario}`);

    // 保存
    await writeFile(`data/lessons/${unit}.json`, JSON.stringify(questions, null, 2), "utf8");
  }

  console.log("\n✅ 完了！300問生成しました");
  console.log("📁 保存先: data/lessons/*.json");
}

main().catch(console.error);
