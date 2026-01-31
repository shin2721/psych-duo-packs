import fs from "fs";
import path from "path";

const GLOSSARY_PATH = "data/glossary.json";
const QUESTIONS_DIR = "data/questions";
const OUTPUT_DIR = "data/questions_improved";

// 辞書読み込み
const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf8"));

// intro テンプレート
const introTemplates = {
  mental: {
    "幸福": "幸せになる方法",
    "ストレス": "ストレス対処法",
    "睡眠": "睡眠とメンタル",
    "不安": "不安への対処",
    "うつ": "気分の落ち込み",
    "感情": "感情のコントロール",
    "運動": "運動と心の健康",
    "マインドフルネス": "今を感じる練習",
    "認知": "考え方の工夫",
    "社会": "人とのつながり"
  },
  money: {
    "損失": "損を避ける心理",
    "現在": "今すぐ欲しい心理",
    "貯金": "お金を貯めるコツ",
    "投資": "投資の心理学",
    "比較": "他人と比べる心理",
    "幸福": "お金と幸せの関係",
    "衝動": "衝動買いの仕組み",
    "価値": "価値の判断"
  },
  work: {
    "モチベーション": "やる気の出し方",
    "バーンアウト": "燃え尽きを防ぐ",
    "ワークライフ": "仕事と生活のバランス",
    "集中": "集中力を高める",
    "目標": "目標達成のコツ",
    "フィードバック": "フィードバックの効果",
    "チーム": "チームワーク"
  },
  health: {
    "運動": "運動習慣のコツ",
    "食事": "食行動の心理学",
    "睡眠": "良い睡眠のために",
    "習慣": "習慣を作る方法",
    "目標": "健康目標の立て方",
    "禁煙": "タバコをやめる"
  },
  social: {
    "協力": "助け合う心理",
    "影響": "周りの影響力",
    "偏見": "思い込みの正体",
    "説得": "説得の心理学",
    "印象": "第一印象",
    "集団": "集団での行動"
  },
  study: {
    "記憶": "覚え方のコツ",
    "復習": "効果的な復習法",
    "集中": "集中力を高める",
    "テスト": "テスト勉強の科学",
    "理解": "深く理解する方法",
    "計画": "学習計画の立て方"
  }
};

// 品質スコア計算
function qualityScore(question) {
  let score = 100;

  // 選択肢が長すぎる
  const choices = question.choices || [];
  for (const choice of choices) {
    const text = typeof choice === "string" ? choice : (choice.text || "");
    if (text.length > 60) score -= 20;
    if (text.length > 80) score -= 30;
  }

  // 専門用語・研究用語が多い
  const jargon = /研究|調査|分析|明らかに|示され|目的|質問|相関|予測|検討|実施|測定|評価|対象|参加者|結果/g;
  const choicesText = choices.map(c => typeof c === "string" ? c : (c.text || "")).join("");
  const text = (question.stem || "") + choicesText;
  const matches = text.match(jargon);
  if (matches) score -= matches.length * 5;

  // 文脈がない
  if (!question.intro || question.intro.length < 3) score -= 20;

  // snackがない
  if (!question.snack || question.snack.length < 3) score -= 15;

  // stemが長すぎる
  if ((question.stem || "").length > 50) score -= 10;

  return Math.max(0, score);
}

// 専門用語を簡略化
function simplifyTerms(text, unit) {
  if (!text) return text;
  if (typeof text !== "string") return text;

  let simplified = text;
  const unitGlossary = glossary[unit] || {};

  // 長い用語から順に置換（部分一致を避けるため）
  const terms = Object.keys(unitGlossary).sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const plain = unitGlossary[term];
    simplified = simplified.replace(new RegExp(term, "g"), plain);
  }

  return simplified;
}

// 長文を要約
function summarize(text, maxLength = 40) {
  if (!text || text.length <= maxLength) return text;

  // 句点で区切る
  const sentences = text.split("。").filter(Boolean);
  if (sentences.length > 1) {
    return sentences[0] + "。";
  }

  // 読点で区切る
  const clauses = text.split("、").filter(Boolean);
  if (clauses.length > 1 && clauses[0].length <= maxLength) {
    return clauses[0];
  }

  // 強制カット
  return text.slice(0, maxLength) + "…";
}

// intro を生成
function generateIntro(question, unit) {
  if (question.intro && question.intro.length >= 5) {
    return question.intro;
  }

  const templates = introTemplates[unit] || {};
  const choicesText = (question.choices || []).map(c =>
    typeof c === "string" ? c : (c.text || "")
  ).join("");
  const text = (question.stem || "") + choicesText;

  for (const [keyword, intro] of Object.entries(templates)) {
    if (text.includes(keyword)) {
      return intro;
    }
  }

  return "研究結果";
}

// snack を生成
function generateSnack(question, unit) {
  if (question.snack && question.snack.length >= 5) {
    return question.snack;
  }

  const correctIndex = question.answer_index || question.correct_index || 0;
  const correctChoice = (question.choices || [])[correctIndex];
  if (correctChoice) {
    const text = typeof correctChoice === "string" ? correctChoice : (correctChoice.text || "");
    return simplifyTerms(summarize(text, 20), unit) + " が効果的";
  }

  return "覚えておこう！";
}

// 問題を改善
function improveQuestion(question, unit) {
  const improved = { ...question };

  // 選択肢を簡略化
  improved.choices = (question.choices || []).map(choice => {
    const text = typeof choice === "string" ? choice : (choice.text || "");
    let c = simplifyTerms(text, unit);

    // 研究文脈を削除
    c = c.replace(/研究の?質問は、?/g, "");
    c = c.replace(/研究結果によると、?/g, "");
    c = c.replace(/調査の?結果、?/g, "");
    c = c.replace(/分析の?結果、?/g, "");
    c = c.replace(/ただし、.*$/g, ""); // 但し書きを削除
    c = c.replace(/なお、.*$/g, ""); // 補足を削除

    // 長すぎる場合は要約
    if (c.length > 40) {
      c = summarize(c, 35);
    }

    return typeof choice === "string" ? c.trim() : { ...choice, text: c.trim() };
  }).filter(c => typeof c === "string" ? c : c.text);

  // stemを簡略化
  improved.stem = simplifyTerms(question.stem || "正しいのはどれ？", unit);
  improved.stem = improved.stem.replace(/研究の?質問は、?/g, "");
  if (improved.stem.length > 40) {
    improved.stem = summarize(improved.stem, 35);
  }

  // intro生成
  improved.intro = generateIntro(question, unit);

  // snack生成
  improved.snack = generateSnack(question, unit);

  // infoを簡略化
  if (improved.info) {
    improved.info = improved.info.replace(/研究|調査|分析/g, "");
    improved.info = summarize(improved.info, 30);
  }

  return improved;
}

// メイン処理
function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const units = ["mental", "money", "work", "health", "social", "study"];

  let totalProcessed = 0;
  let totalImproved = 0;

  for (const unit of units) {
    const inputPath = path.join(QUESTIONS_DIR, `${unit}.jsonl`);
    if (!fs.existsSync(inputPath)) {
      console.log(`⊘ ${unit}: ファイルなし`);
      continue;
    }

    const lines = fs.readFileSync(inputPath, "utf8").split("\n").filter(Boolean);
    const improved = [];

    let lowQualityCount = 0;

    for (const line of lines) {
      try {
        const question = JSON.parse(line);
        const scoreBefore = qualityScore(question);

        totalProcessed++;

        if (scoreBefore < 60) {
          // 低品質なので改善
          const better = improveQuestion(question, unit);
          const scoreAfter = qualityScore(better);

          improved.push(better);
          lowQualityCount++;
          totalImproved++;

          console.log(`  改善: ${question.id} (${scoreBefore}→${scoreAfter})`);
        } else {
          // 品質OKなのでそのまま
          improved.push(question);
        }
      } catch (err) {
        console.error(`✗ ${unit}: JSON解析エラー - ${err.message}`);
      }
    }

    // 出力
    const outputPath = path.join(OUTPUT_DIR, `${unit}.jsonl`);
    fs.writeFileSync(
      outputPath,
      improved.map(q => JSON.stringify(q)).join("\n") + "\n",
      "utf8"
    );

    console.log(`✓ ${unit}: ${lines.length}問 (${lowQualityCount}問を改善)`);
  }

  console.log(`\n合計: ${totalProcessed}問処理、${totalImproved}問改善`);
  console.log(`→ 出力: ${OUTPUT_DIR}/`);
}

main();
