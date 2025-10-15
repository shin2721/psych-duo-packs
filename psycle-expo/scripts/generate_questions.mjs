// scripts/generate_questions.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

// ============ 設定 ============
const QUESTIONS_PER_BATCH = 15; // 1回の実行で追加する問題数
const MIN_ABSTRACTS_REQUIRED = 12;
const MAX_QUESTIONS_PER_SOURCE = 3; // 1論文から最大3問まで生成
const MIN_UNUSED_SOURCES_FOR_NEW = 10; // 未使用論文が10件未満なら既存論文も再利用

// ============ MCQ生成ルール ============
/**
 * 厳格な作問原則:
 * 1. 抄録に明記された事実・結論・定義のみを使用
 * 2. 推測・一般化・未根拠の拡張は禁止
 * 3. 正答は1つのみ（4択形式）
 * 4. 誤答は plausible だが明確に誤り
 * 5. ステム（問い）は具体的で曖昧さなし
 */

async function generateQuestionsFromSource(source, maxQuestions = MAX_QUESTIONS_PER_SOURCE) {
  if (!source.abstract || source.abstract.length < 100) {
    return [];
  }

  // 抄録から具体的な事実を抽出
  const abstract = source.abstract;
  const title = source.title;

  // 抄録をセンテンスに分割
  const sentences = abstract.split(/[。\.]/g).filter(s => s.trim().length > 20);

  if (sentences.length < 3) {
    return []; // 情報不足
  }

  // 結論・結果を含むセンテンスを優先
  const conclusionSentences = sentences.filter(s =>
    /result|conclusion|finding|showed|demonstrated|indicated|suggest|found|observed/i.test(s)
  );

  if (conclusionSentences.length === 0) {
    return []; // 具体的な結論がない
  }

  // 複数のセンテンスから問題を生成
  const questions = [];
  const usedSentences = new Set();

  for (let i = 0; i < Math.min(maxQuestions, conclusionSentences.length); i++) {
    const targetSentence = conclusionSentences[i];

    // 既に使用したセンテンスはスキップ
    if (usedSentences.has(targetSentence)) continue;
    usedSentences.add(targetSentence);

    // センテンスから数値・比較・効果などのキーファクトを抽出
    const hasNumber = /\d+/.test(targetSentence);
    const hasComparison = /more|less|higher|lower|better|worse|increased|decreased|improved|reduced/i.test(targetSentence);
    const hasEffect = /effect|impact|influence|association|relationship|correlation/i.test(targetSentence);

    // 質問タイプを決定
    let questionType = "fact";
    if (hasNumber && hasEffect) questionType = "quantitative";
    else if (hasComparison) questionType = "comparison";
    else if (hasEffect) questionType = "relationship";

    // 質問とchoicesを生成
    questions.push({
      unit: source.unit,
      source_id: source.id || source.doi || source.pmid,
      question_type: questionType,
      stem: extractStem(targetSentence, title, questionType),
      choices: generateChoices(targetSentence, questionType, abstract),
      correct_index: 0, // 最初の選択肢を正答とする
      difficulty: estimateDifficulty(abstract, questionType),
      tags: source.tags || [],
      citation: formatCitation(source)
    });
  }

  return questions;
}

function extractStem(sentence, title, type) {
  // 抄録の事実から質問を生成
  // 実装: センテンスから主要な概念を抽出して質問形式に変換

  if (type === "quantitative") {
    // 例: "Study found X% improvement" → "研究により報告された改善率は?"
    const numMatch = sentence.match(/(\d+\.?\d*)\s*%/);
    if (numMatch) {
      return `${title.slice(0, 80)}に関する研究で報告された主要な数値的結果は？`;
    }
  }

  if (type === "comparison") {
    // 例: "A was more effective than B" → "AとBを比較した結果は？"
    return `以下の研究における比較結果として正しいものはどれか？`;
  }

  if (type === "relationship") {
    return `${title.slice(0, 80)}の研究で明らかになった関連性は？`;
  }

  // デフォルト: 一般的な事実問題
  return `以下の研究結果として正しく述べられているものはどれか？`;
}

function generateChoices(sentence, type, abstract) {
  // 正答（センテンスから完全な形で抽出）
  const correctAnswer = cleanSentence(sentence);

  // 抄録から他のセンテンスを取得（誤答候補）
  const allSentences = abstract
    .split(/[。\.]/g)
    .map(s => cleanSentence(s))
    .filter(s => s.length > 40 && s !== correctAnswer);

  // 誤答生成戦略:
  // 1. 数値を変える
  // 2. 方向性を反転
  // 3. 他のセンテンスから文脈違いを作る

  const distractor1 = perturbNumber(correctAnswer);
  const distractor2 = perturbDirection(correctAnswer);
  const distractor3 = allSentences.length > 0
    ? allSentences[0].slice(0, 150)
    : perturbSubject(correctAnswer);

  // 重複チェック
  const choices = [
    { text: correctAnswer, is_correct: true },
    { text: distractor1, is_correct: false },
    { text: distractor2, is_correct: false },
    { text: distractor3, is_correct: false }
  ];

  // 重複削除とシャッフル準備
  const uniqueChoices = [];
  const seen = new Set();
  for (const c of choices) {
    const key = c.text.slice(0, 50).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueChoices.push(c);
    }
  }

  // 足りない場合は汎用誤答を追加
  while (uniqueChoices.length < 4) {
    uniqueChoices.push({
      text: `研究では${uniqueChoices.length === 1 ? "相関が" : uniqueChoices.length === 2 ? "効果が" : "差が"}見られなかった`,
      is_correct: false
    });
  }

  return uniqueChoices;
}

function cleanSentence(s) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\s*[-•]\s*/, "")
    .slice(0, 150);
}

function perturbNumber(sentence) {
  // 数値を変更（1.2倍 or 0.8倍）
  const modified = sentence.replace(/(\d+\.?\d*)(%| percent|\s+participants|\s+patients)/gi, (match, num, unit) => {
    const original = parseFloat(num);
    const perturbed = Math.random() > 0.5
      ? (original * 1.3).toFixed(1)
      : (original * 0.7).toFixed(1);
    return perturbed + unit;
  });

  return modified !== sentence ? modified : sentence.replace(/\d+/, m => parseInt(m) + 5);
}

function perturbDirection(sentence) {
  // 方向性を反転
  return sentence
    .replace(/\bincreased\b/gi, "decreased")
    .replace(/\bdecreased\b/gi, "increased")
    .replace(/\bimproved\b/gi, "worsened")
    .replace(/\bworsened\b/gi, "improved")
    .replace(/\bmore\b/gi, "less")
    .replace(/\bless\b/gi, "more")
    .replace(/\bhigher\b/gi, "lower")
    .replace(/\blower\b/gi, "higher")
    .replace(/\bpositive\b/gi, "negative")
    .replace(/\bnegative\b/gi, "positive")
    .replace(/\breduced\b/gi, "increased")
    .replace(/\benhanced\b/gi, "diminished");
}

function perturbSubject(sentence) {
  // 主語・対象を変更
  return sentence
    .replace(/\bparticipants\b/gi, "control group")
    .replace(/\bintervention group\b/gi, "placebo group")
    .replace(/\btreatment\b/gi, "no treatment")
    .replace(/\bexperimental\b/gi, "control")
    .replace(/\bactive\b/gi, "passive");
}

function estimateDifficulty(abstract, questionType) {
  // 難易度推定: 抄録の複雑さと質問タイプから
  const complexityIndicators = (abstract.match(/however|although|whereas|complex|multifaceted/gi) || []).length;

  if (questionType === "quantitative") return complexityIndicators > 2 ? "hard" : "medium";
  if (questionType === "comparison") return "medium";
  return complexityIndicators > 3 ? "hard" : "easy";
}

function formatCitation(source) {
  const authors = Array.isArray(source.authors) ? source.authors.slice(0, 3).join(", ") : "Unknown";
  const year = source.year || "n.d.";
  const title = source.title;
  const venue = source.venue || "";
  const doi = source.doi ? `https://doi.org/${source.doi}` : source.url;

  return `${authors} (${year}). ${title}. ${venue}. ${doi}`;
}

// ============ メイン処理 ============
async function main() {
  // sources.json を読み込み
  const sourcesPath = "data/sources.json";
  if (!existsSync(sourcesPath)) {
    console.error("❌ data/sources.json not found. Run fetch_sources.mjs first.");
    process.exit(1);
  }

  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));

  // ユニットごとに集計
  const units = ["mental", "money", "work", "health", "social", "study"];

  for (const unit of units) {
    const unitSources = sources.filter(s => s.unit === unit && s.abstract && s.abstract.length > 100);

    console.log(`\n[${unit}] ${unitSources.length} sources with abstracts`);

    if (unitSources.length < MIN_ABSTRACTS_REQUIRED) {
      console.log(`  ⚠️  Insufficient abstracts (need ${MIN_ABSTRACTS_REQUIRED}). Skipping question generation.`);
      continue;
    }

    // 既存の問題を読み込み
    const outputPath = `data/questions/${unit}.jsonl`;
    let existingQuestions = [];
    const sourceUsageCount = new Map(); // 論文IDごとの使用回数

    if (existsSync(outputPath)) {
      const existingContent = await readFile(outputPath, "utf8");
      existingQuestions = existingContent
        .split("\n")
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      // 論文IDごとの使用回数をカウント
      existingQuestions.forEach(q => {
        if (q.source_id) {
          sourceUsageCount.set(q.source_id, (sourceUsageCount.get(q.source_id) || 0) + 1);
        }
      });

      console.log(`  📚 Found ${existingQuestions.length} existing questions (${Math.ceil(existingQuestions.length / 15)} units)`);
    }

    // 未使用または使用回数が少ない論文をフィルタリング
    const availableSources = unitSources
      .map(s => ({
        source: s,
        usageCount: sourceUsageCount.get(s.id || s.doi || s.pmid) || 0
      }))
      .filter(({ usageCount }) => usageCount < MAX_QUESTIONS_PER_SOURCE)
      .sort((a, b) => a.usageCount - b.usageCount) // 使用回数が少ない順
      .map(({ source }) => source);

    const unusedSources = availableSources.filter(s => {
      const sourceId = s.id || s.doi || s.pmid;
      return !sourceUsageCount.has(sourceId);
    });

    console.log(`  🆕 ${unusedSources.length} unused sources available`);
    console.log(`  🔄 ${availableSources.length - unusedSources.length} partially used sources can generate more questions`);

    // 新しい論文を優先、足りなければ既存論文も使う
    let sourcesToUse = [];
    if (unusedSources.length >= MIN_UNUSED_SOURCES_FOR_NEW) {
      sourcesToUse = unusedSources;
      console.log(`  ✨ Using only unused sources`);
    } else {
      sourcesToUse = availableSources;
      console.log(`  🔄 Using all available sources (including partially used)`);
    }

    if (sourcesToUse.length === 0) {
      console.log(`  ⚠️  No sources available. Skipping.`);
      continue;
    }

    // 抄録の質でソート（長さと内容の充実度）
    const rankedSources = sourcesToUse
      .map(s => ({
        source: s,
        score: s.abstract.length +
               (s.abstract.match(/result|conclusion|finding|showed|demonstrated/gi) || []).length * 100
      }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.source);

    // 質問生成（1論文から複数問題を生成）
    const newQuestions = [];
    let sourcesProcessed = 0;

    for (const source of rankedSources) {
      if (newQuestions.length >= QUESTIONS_PER_BATCH) break;

      const sourceId = source.id || source.doi || source.pmid;
      const currentUsage = sourceUsageCount.get(sourceId) || 0;
      const questionsToGenerate = Math.min(
        MAX_QUESTIONS_PER_SOURCE - currentUsage,
        QUESTIONS_PER_BATCH - newQuestions.length
      );

      if (questionsToGenerate > 0) {
        const questions = await generateQuestionsFromSource(source, questionsToGenerate);
        newQuestions.push(...questions);
        sourcesProcessed++;
      }
    }

    console.log(`  ✓ Generated ${newQuestions.length} new questions from ${sourcesProcessed} sources`);

    if (newQuestions.length === 0) {
      console.log(`  ⚠️  Could not generate questions from available sources.`);
      continue;
    }

    // 問題の重複チェック（正答の内容で判定）
    const existingAnswerKeys = new Set(
      existingQuestions.map(q => {
        const correctChoice = q.choices.find(c => c.is_correct);
        return correctChoice ? correctChoice.text.slice(0, 100).toLowerCase() : '';
      }).filter(Boolean)
    );

    const deduplicatedQuestions = newQuestions.filter(q => {
      const correctChoice = q.choices.find(c => c.is_correct);
      if (!correctChoice) return false;

      const answerKey = correctChoice.text.slice(0, 100).toLowerCase();
      if (existingAnswerKeys.has(answerKey)) {
        return false; // 重複している
      }
      existingAnswerKeys.add(answerKey);
      return true;
    });

    if (deduplicatedQuestions.length < newQuestions.length) {
      console.log(`  🔍 Removed ${newQuestions.length - deduplicatedQuestions.length} duplicate questions`);
    }

    // 既存の問題に追加
    const allQuestions = [...existingQuestions, ...deduplicatedQuestions];
    const totalUnits = Math.ceil(allQuestions.length / 15);

    // JSONL形式で保存
    if (!existsSync("data/questions")) {
      await mkdir("data/questions", { recursive: true });
    }

    const jsonlContent = allQuestions.map(q => JSON.stringify(q, null, 0)).join("\n");
    await writeFile(outputPath, jsonlContent, "utf8");

    console.log(`  📝 Saved to ${outputPath}`);
    console.log(`  📊 Total: ${allQuestions.length} questions (${totalUnits} units)`);
    if (deduplicatedQuestions.length > 0) {
      console.log(`  ➕ Added ${deduplicatedQuestions.length} new questions this run`);
    }
  }

  console.log("\n✅ Question generation complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
