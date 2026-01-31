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

  // 抄録をセンテンスに分割（改善版：複数の終端記号に対応）
  const sentences = abstract
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && /[.!?。！？]$/.test(s)); // 完全な文のみ

  if (sentences.length < 3) {
    return []; // 情報不足
  }

  // 結論・結果を含むセンテンスを優先（キーワードを拡張）
  const conclusionSentences = sentences.filter(s =>
    /result|conclusion|finding|showed|demonstrated|indicated|suggest|found|observed|associated|revealed|confirmed|reported|significant|positive|negative|correlation|relationship|effect|impact/i.test(s)
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
    const question = {
      unit: source.unit,
      source_id: source.id || source.doi || source.pmid,
      question_type: questionType,
      stem: extractStem(targetSentence, title, questionType),
      choices: generateChoices(targetSentence, questionType, abstract),
      correct_index: 0, // 最初の選択肢を正答とする
      difficulty: estimateDifficulty(abstract, questionType),
      tags: source.tags || [],
      citation: formatCitation(source)
    };

    // 品質チェック
    const validation = validateQuestion(question);
    if (validation.valid) {
      questions.push(question);
    }
    // Invalid questions are silently skipped
  }

  return questions;
}

function extractStem(sentence, title, type) {
  // 抄録の事実から質問を生成
  // 主要な心理学概念を検出して問題文に含める

  // 主要な心理学用語のリスト
  const psychConcepts = [
    "認知的再評価", "マインドフルネス", "感情調整", "呼吸法", "リラクゼーション",
    "バイオフィードバック", "ストレス管理", "レジリエンス", "共感", "積極的傾聴",
    "傾聴", "コミュニケーション", "ポモドーロ", "時間管理", "先延ばし", "実行意図",
    "目標設定", "自己効力感", "集中力", "運動習慣", "睡眠衛生", "習慣", "栄養",
    "身体活動", "想起練習", "分散学習", "間隔反復", "メタ認知", "ワーキングメモリ",
    "自己説明", "予算管理", "衝動買い", "メンタルアカウンティング", "金融リテラシー",
    "貯蓄"
  ];

  // タイトルまたは文から概念を検出
  const detectedConcept = psychConcepts.find(concept =>
    title.includes(concept) || sentence.includes(concept)
  );

  // 英語の心理学用語も検出
  const englishConcepts = {
    "cognitive reappraisal": "認知的再評価",
    "mindfulness": "マインドフルネス",
    "emotion regulation": "感情調整",
    "breathing": "呼吸法",
    "relaxation": "リラクゼーション",
    "biofeedback": "バイオフィードバック",
    "stress management": "ストレス管理",
    "resilience": "レジリエンス",
    "empathy": "共感",
    "active listening": "積極的傾聴",
    "time management": "時間管理",
    "procrastination": "先延ばし",
    "self-efficacy": "自己効力感",
    "sleep hygiene": "睡眠衛生",
    "working memory": "ワーキングメモリ",
    "metacognition": "メタ認知"
  };

  let conceptForQuestion = detectedConcept;
  if (!conceptForQuestion) {
    for (const [eng, jpn] of Object.entries(englishConcepts)) {
      if (title.toLowerCase().includes(eng.toLowerCase()) ||
          sentence.toLowerCase().includes(eng.toLowerCase())) {
        conceptForQuestion = jpn;
        break;
      }
    }
  }

  // タイトルの一部を抽出（最初の50文字程度）
  const titlePreview = title.length > 50 ? title.substring(0, 50) + "..." : title;

  // 日本語で問題文を生成（研究タイトルを含む）
  if (type === "quantitative") {
    return `「${titlePreview}」の研究で報告された数値的結果は？`;
  }

  if (type === "comparison") {
    return `「${titlePreview}」の研究で比較されたことは？`;
  }

  if (type === "relationship") {
    return `「${titlePreview}」の研究で見つかった関連性は？`;
  }

  // デフォルト: 一般的な事実問題
  return `「${titlePreview}」の研究で明らかになったことは？`;
}

function generateChoices(sentence, type, abstract) {
  // 正答（センテンスから完全な形で抽出）
  const correctAnswer = cleanSentence(sentence);

  // 抄録から他の完全なセンテンスを取得（改善版）
  const allSentences = abstract
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => cleanSentence(s.trim()))
    .filter(s =>
      s.length > 40 &&
      s !== correctAnswer &&
      /[.!?。！？]$/.test(s) && // 完全な文のみ
      s.length < 200 // 長すぎる文は除外
    );

  // 誤答生成戦略（優先順位変更 - より難しくするため）:
  // 1. 抄録内の他の結論文を使う（最優先 - 最も挑戦的）
  // 2. 同じトピックだが異なるメカニズムの文
  // 3. 条件付きの真実（部分的に正しいが全体として誤り）
  // 4. 数値や方向性の微妙な変更（最終手段）

  const candidates = [
    { text: correctAnswer, is_correct: true }
  ];
  const seen = new Set([correctAnswer.slice(0, 80).toLowerCase().replace(/\s+/g, ' ')]);

  // 1. 抄録内の結論文をすべて候補として追加（最大3つ）
  const conclusionSentences = allSentences.filter(s =>
    /result|conclusion|finding|showed|demonstrated|indicated|suggest|found|observed|associated|revealed|confirmed|reported|significant|correlation|relationship|effect/i.test(s)
  );

  for (const contextualSentence of conclusionSentences.slice(0, 3)) {
    const key = contextualSentence.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key) && contextualSentence.length >= 40) {
      candidates.push({ text: contextualSentence, is_correct: false });
      seen.add(key);
      if (candidates.length >= 4) break;
    }
  }

  // 2. まだ足りない場合、方法論や背景の文を追加（同じ研究内容なので混乱しやすい）
  if (candidates.length < 4) {
    const methodSentences = allSentences.filter(s =>
      /method|procedure|participant|measure|assess|evaluate|examined|investigated|analyzed/i.test(s)
    );

    for (const methodSentence of methodSentences.slice(0, 2)) {
      const key = methodSentence.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key) && methodSentence.length >= 40) {
        candidates.push({ text: methodSentence, is_correct: false });
        seen.add(key);
        if (candidates.length >= 4) break;
      }
    }
  }

  // 3. まだ足りない場合のみ、微妙な変更を加えた誤答を生成
  if (candidates.length < 4) {
    const subtleDistractor = perturbSubtly(correctAnswer);
    const key = subtleDistractor.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key) && subtleDistractor !== correctAnswer) {
      candidates.push({ text: subtleDistractor, is_correct: false });
      seen.add(key);
    }
  }

  // 4. 足りない場合は文脈に応じた高度な汎用誤答を追加
  const advancedFallbacks = [
    "この効果は統計的に有意であったものの、臨床的には小さい効果量（d < 0.3）にとどまった",
    "介入群と対照群の間に統計的有意差は認められたが、事前に設定した最小臨床的重要差には達しなかった",
    "初期の効果は観察されたが、6ヶ月後のフォローアップでは効果の持続は確認されなかった",
    "サブグループ解析では特定の条件下でのみ効果が認められ、全体としては有意な差は検出されなかった",
    "媒介分析の結果、当初想定されたメカニズムとは異なる経路を通じて効果が生じていることが示された",
    "交絡変数を調整した多変量解析では、単変量解析で見られた関連性は有意ではなくなった"
  ];

  let fallbackIndex = 0;
  while (candidates.length < 4 && fallbackIndex < advancedFallbacks.length) {
    const fallbackText = advancedFallbacks[fallbackIndex];
    const fallbackKey = fallbackText.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');

    if (!seen.has(fallbackKey)) {
      candidates.push({
        text: fallbackText,
        is_correct: false
      });
      seen.add(fallbackKey);
    }
    fallbackIndex++;
  }

  // 5. 最終手段：抄録内の任意の長い文を使用
  if (candidates.length < 4) {
    for (const anySentence of allSentences) {
      const key = anySentence.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key) && anySentence.length >= 40) {
        candidates.push({ text: anySentence, is_correct: false });
        seen.add(key);
        if (candidates.length >= 4) break;
      }
    }
  }

  return candidates.slice(0, 4); // 4択に制限
}

function cleanSentence(s) {
  const cleaned = s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\s*[-•]\s*/, "");

  // 完全な文かチェック（150文字以上でも終端記号があればOK）
  if (cleaned.length > 200 && /[.!?。！？]/.test(cleaned)) {
    // 長すぎる場合は最初の完全な文だけ取る
    const firstSentenceMatch = cleaned.match(/^[^.!?。！？]+[.!?。！？]/);
    return firstSentenceMatch ? firstSentenceMatch[0] : cleaned.slice(0, 180);
  }

  return cleaned;
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

  // If no change was made or result is too short, return original
  if (modified === sentence || modified.length < 30) {
    return sentence.replace(/\d+/, m => parseInt(m) + 5);
  }
  return modified;
}

function perturbSubtly(sentence) {
  // 微妙な変更を加える（より難易度が高い）
  const strategies = [
    // 1. 限定詞を追加（部分的な真実にする）
    () => {
      if (Math.random() > 0.5 && !sentence.includes("一部")) {
        return sentence.replace(/([。.])$/, "（ただし一部の参加者のみ）$1");
      }
      return sentence.replace(/([。.])$/, "（特定の条件下でのみ）$1");
    },
    // 2. 因果関係を相関関係に変える
    () => sentence
      .replace(/caused|led to|resulted in/gi, "was associated with")
      .replace(/により|によって/g, "と関連して"),
    // 3. 統計的有意性の曖昧化
    () => sentence
      .replace(/significant/gi, "marginal")
      .replace(/有意/g, "やや"),
    // 4. 時間軸の変更
    () => sentence
      .replace(/immediately/gi, "after several months")
      .replace(/直後/g, "数ヶ月後"),
    // 5. 程度の微調整
    () => sentence
      .replace(/\bstrong\b/gi, "moderate")
      .replace(/\blarge\b/gi, "small to moderate")
      .replace(/強い/g, "中程度の")
      .replace(/大きな/g, "小から中程度の")
  ];

  // ランダムに戦略を1つ選択
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  return strategy();
}

function perturbDirection(sentence) {
  // 方向性を反転（使用頻度を下げるため、この関数は直接呼ばれなくなった）
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
  // 主語・対象を変更（使用頻度を下げるため、この関数は直接呼ばれなくなった）
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

function validateQuestion(question) {
  // 質問の品質をチェック
  const correctChoice = question.choices.find(c => c.is_correct);

  if (!correctChoice) {
    return { valid: false, reason: "No correct answer" };
  }

  // 正解が完全な文か確認
  if (correctChoice.text.length < 30) {
    return { valid: false, reason: "Correct answer too short" };
  }

  // 正解が途中で切れていないか確認（句読点または完結している文）
  const endsWithPunctuation = /[.!?。！？]$/.test(correctChoice.text);
  const seemsComplete = correctChoice.text.length >= 50 && !/\.\.\.$|…$/.test(correctChoice.text);
  if (!endsWithPunctuation && !seemsComplete) {
    return { valid: false, reason: "Correct answer is incomplete" };
  }

  // 選択肢が重複していないか確認
  const texts = question.choices.map(c => c.text.slice(0, 50).toLowerCase());
  const uniqueTexts = new Set(texts);
  if (uniqueTexts.size < 4) {
    return { valid: false, reason: "Duplicate choices" };
  }

  // 4つの選択肢があるか確認
  if (question.choices.length !== 4) {
    return { valid: false, reason: `Wrong number of choices: ${question.choices.length}` };
  }

  // すべての選択肢が最小限の長さがあるか確認
  const allChoicesValid = question.choices.every(c => c.text.length >= 20);
  if (!allChoicesValid) {
    return { valid: false, reason: "Some choices are too short" };
  }

  return { valid: true };
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
