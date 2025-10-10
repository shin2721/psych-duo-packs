#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";

const UNITS = ["mental", "money", "work", "health", "social", "study"];

// 日本語要約（質の高いもの）
const SUMMARIES = {
  mental: [
    "呼吸法の練習で不安が減少した",
    "マインドフルネスがストレス軽減に効果的だった",
    "認知的再評価で感情調整が改善した",
    "心拍変動バイオフィードバックが有効だった",
    "瞑想の実践でストレスが軽減した",
    "リラクゼーション技法が不安を和らげた",
    "ポジティブ思考がメンタルヘルスを改善した"
  ],
  money: [
    "予算管理の訓練で貯金額が増加した",
    "衝動買いを避ける技術が節約につながった",
    "金融リテラシー教育が有効だった",
    "計画的な支出が経済的幸福度を高めた",
    "自動貯金システムが貯蓄を促進した",
    "家計簿の記録が支出管理に効果的だった"
  ],
  work: [
    "タスク分割で生産性が向上した",
    "休憩を取ることでパフォーマンスが改善した",
    "目標設定が仕事の効率を高めた",
    "時間管理技術が先延ばしを減らした",
    "優先順位付けが業務効率を改善した",
    "集中時間の確保が成果を向上させた"
  ],
  health: [
    "定期的な運動が健康を改善した",
    "睡眠時間の確保が重要だった",
    "バランスの取れた食事が効果的だった",
    "ストレス軽減法が健康増進に寄与した",
    "有酸素運動が心肺機能を向上させた",
    "十分な休息が回復を促進した"
  ],
  social: [
    "共感的な対応が関係性を改善した",
    "感謝を伝えることが絆を強めた",
    "積極的な傾聴が信頼を築いた",
    "コミュニケーション技術が対立を減らした",
    "相手の立場を理解することが関係を深めた",
    "定期的な交流が人間関係を強化した"
  ],
  study: [
    "想起練習が学習効果を向上させた",
    "分散学習が記憶定着を高めた",
    "テスト効果が記憶に有効だった",
    "自己説明が理解を深めた",
    "反復練習が習得を促進した",
    "教えることで学習が定着した"
  ]
};

// 悪い問題を検出
function isBadQuestion(q) {
  const question = q.question || "";
  const explanation = q.explanation || "";
  const correctChoice = q.choices[q.correct_index] || "";

  // 研究ID、URL、DOIが含まれる
  const badPatterns = [
    /CRD\d+/i,
    /NCT\d+/i,
    /ISRCTN\d+/i,
    /PROSPERO/i,
    /INPLASY/i,
    /clinicaltrials\.gov/i,
    /doi\.org/i,
    /\d{4}\/s\d+-\d+-\d+/,
    /Identifier/i
  ];

  for (const pattern of badPatterns) {
    if (pattern.test(question) || pattern.test(explanation)) {
      return true;
    }
  }

  // 空文字列が正解
  if (correctChoice.trim() === "") {
    return true;
  }

  // 英語が多すぎる（30%以上）
  const englishRatio = (question.match(/[a-zA-Z]/g) || []).length / question.length;
  if (englishRatio > 0.3) {
    return true;
  }

  // 問題文が短すぎる（10文字未満）
  if (question.replace(/本当？嘘？\n/g, "").replace(/「|」/g, "").trim().length < 10) {
    return true;
  }

  return false;
}

// 良い問題を生成
function createGoodQuestion(unit, index) {
  const summary = SUMMARIES[unit][index % SUMMARIES[unit].length];
  const types = ["multiple_choice", "true_false", "fill_blank", "scenario"];
  const type = types[index % types.length];

  // 対義語・変形パターン
  const variations = {
    "増加": "減少",
    "減少": "増加",
    "改善": "悪化",
    "向上": "低下",
    "軽減": "増大",
    "効果的": "効果なし",
    "促進": "阻害",
    "強化": "弱化",
    "高めた": "下げた",
    "深めた": "浅くした",
    "築いた": "壊した"
  };

  // 反対の結果を生成
  let opposite = summary;
  for (const [from, to] of Object.entries(variations)) {
    if (summary.includes(from)) {
      opposite = summary.replace(from, to);
      break;
    }
  }

  const misconceptions = {
    mental: "気の持ちようで治る",
    money: "収入が増えれば解決する",
    work: "長時間働けば成果が出る",
    health: "サプリメントだけで十分",
    social: "我慢すれば良い関係が築ける",
    study: "一夜漬けでも覚えられる"
  };

  if (type === "multiple_choice") {
    return {
      type: "multiple_choice",
      question: "科学的に証明されているのはどれ？",
      choices: [
        summary,
        summary + "（ただし一部の人のみ）",
        misconceptions[unit],
        "この効果は確認されていない"
      ],
      correct_index: 0,
      explanation: `研究によると、${summary}`,
      source_id: `generated_${index}`,
      difficulty: "hard",
      xp: 15
    };
  } else if (type === "true_false") {
    const isTrue = index % 2 === 0;
    return {
      type: "true_false",
      question: `本当？嘘？\n「${summary}」`,
      choices: ["本当", "嘘"],
      correct_index: isTrue ? 0 : 1,
      explanation: isTrue ? `正解！${summary}` : `実際は「${summary}」です`,
      source_id: `generated_${index}`,
      difficulty: "easy",
      xp: 8
    };
  } else if (type === "fill_blank") {
    const parts = summary.split(/が|で|を|に/);
    if (parts.length >= 2) {
      const blank = parts[0];
      const rest = summary.slice(blank.length);
      return {
        type: "fill_blank",
        question: `空欄に入る言葉は？\n___${rest}`,
        choices: [
          blank,
          blank + "（一部のみ）",
          "効果なし",
          "確認されていない"
        ],
        correct_index: 0,
        explanation: `正解は「${blank}」。${summary}`,
        source_id: `generated_${index}`,
        difficulty: "medium",
        xp: 12
      };
    }
    // fallback to multiple choice
    return createGoodQuestion(unit, index + 1);
  } else { // scenario
    const actions = {
      mental: "深呼吸する",
      money: "予算を立てる",
      work: "タスクを分割する",
      health: "運動する",
      social: "相手の話を聞く",
      study: "復習する"
    };

    const contexts = {
      mental: "ストレスを感じている",
      money: "お金を貯めたい",
      work: "仕事の効率を上げたい",
      health: "健康になりたい",
      social: "人間関係を良くしたい",
      study: "効率よく勉強したい"
    };

    return {
      type: "scenario",
      question: `あなたは${contexts[unit]}と感じています。\n研究に基づくと、どうするのが良い？`,
      choices: [
        actions[unit],
        actions[unit] + "の逆をする",
        "何もしない",
        "他人に任せる"
      ],
      correct_index: 0,
      explanation: `研究によると、${summary}`,
      source_id: `generated_${index}`,
      difficulty: "medium",
      xp: 15
    };
  }
}

async function main() {
  for (const unit of UNITS) {
    console.log(`\n=== Processing ${unit} ===`);

    const inputPath = `data/lessons/${unit}.json`;
    const questions = JSON.parse(await readFile(inputPath, "utf8"));

    const goodQuestions = [];
    const badQuestions = [];

    // 良い問題と悪い問題を分類
    for (const q of questions) {
      if (isBadQuestion(q)) {
        badQuestions.push(q);
      } else {
        goodQuestions.push(q);
      }
    }

    console.log(`Good: ${goodQuestions.length}, Bad: ${badQuestions.length}`);

    // 悪い問題を置き換え
    const replacements = [];
    for (let i = 0; i < badQuestions.length; i++) {
      const newQ = createGoodQuestion(unit, goodQuestions.length + i);
      replacements.push(newQ);
    }

    // 結合（良い問題 + 新しい問題）
    const finalQuestions = [...goodQuestions, ...replacements];

    // 15問に調整
    const target = 15;
    if (finalQuestions.length < target) {
      // 不足分を追加生成
      for (let i = finalQuestions.length; i < target; i++) {
        finalQuestions.push(createGoodQuestion(unit, i));
      }
    } else if (finalQuestions.length > target) {
      // 超過分を削除
      finalQuestions.splice(target);
    }

    console.log(`Final: ${finalQuestions.length} questions`);

    // 保存
    await writeFile(inputPath, JSON.stringify(finalQuestions, null, 2), "utf8");
  }

  console.log("\n✅ All questions cleaned!");
}

main().catch(console.error);
