import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";
import { Seed, QuestionType, GeneratedQuestion, GeneratedQuestionSchema } from "./types";
import { BLACKLISTED_TOPICS, CAUTIONARY_TOPICS } from "./blacklist";

const PROMPTS_DIR = join(__dirname, "..", "prompts");

function loadFireflyPersona(): string {
  return readFileSync(join(PROMPTS_DIR, "firefly_persona.md"), "utf-8");
}

function getQuestionTypeSchema(type: QuestionType): string {
  const schemas: Record<QuestionType, string> = {
    multiple_choice: `{
  "type": "multiple_choice",
  "question": "問題文（短く、インパクトのある問いかけ）",
  "choices": ["A. 選択肢1", "B. 選択肢2", "C. 選択肢3", "D. 選択肢4"],
  "correct_index": 0,
  "explanation": "解説（Fireflyの口調で）"
}`,
    swipe_judgment: `{
  "type": "swipe_judgment",
  "question": "判断を迫る状況説明",
  "is_true": true,
  "swipe_labels": { "left": "左の選択肢", "right": "右の選択肢" },
  "explanation": {
    "correct": "正解時の解説",
    "incorrect": {
      "left": "左を選んだ時のフィードバック",
      "right": "右を選んだ時のフィードバック"
    }
  }
}`,
    select_all: `{
  "type": "select_all",
  "question": "複数選択を促す問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correct_answers": [0, 2],
  "explanation": "解説"
}`,
    fill_blank_tap: `{
  "type": "fill_blank_tap",
  "question": "____に入る言葉は？（穴埋め形式）",
  "choices": ["選択肢1", "選択肢2", "選択肢3"],
  "correct_index": 0,
  "explanation": "解説"
}`,
    sort_order: `{
  "type": "sort_order",
  "question": "並べ替えを促す問題文",
  "items": ["アイテム1", "アイテム2", "アイテム3"],
  "correct_order": ["正解順1", "正解順2", "正解順3"],
  "explanation": "解説"
}`,
    conversation: `{
  "type": "conversation",
  "question": "会話のシチュエーション説明",
  "choices": ["返答A", "返答B", "返答C"],
  "correct_index": 1,
  "your_response_prompt": "あなたの返答は？",
  "explanation": "解説"
}`,
    matching: `{
  "type": "matching",
  "question": "マッチングを促す問題文",
  "left_items": ["左1", "左2", "左3"],
  "right_items": ["右1", "右2", "右3"],
  "correct_pairs": [[0, 0], [1, 1], [2, 2]],
  "explanation": "解説"
}`,
    quick_reflex: `{
  "type": "quick_reflex",
  "question": "瞬発力を試す問題文",
  "choices": ["選択肢1", "選択肢2"],
  "correct_index": 0,
  "time_limit": 3000,
  "explanation": "解説"
}`,
    consequence_scenario: `{
  "type": "consequence_scenario",
  "question": "シナリオ説明（行動の結果を予測させる）",
  "consequence_type": "negative",
  "explanation": "解説"
}`,
  };
  return schemas[type];
}

export async function generateQuestion(
  genAI: GoogleGenerativeAI,
  seed: Seed,
  questionType: QuestionType,
  difficulty: "easy" | "medium" | "hard"
): Promise<GeneratedQuestion> {
  const fireflyPersona = loadFireflyPersona();
  const schemaExample = getQuestionTypeSchema(questionType);

  const xpMap = { easy: 10, medium: 15, hard: 20 };

  const systemInstruction = `あなたはPsycleアプリのコンテンツジェネレーターです。

## Fireflyのペルソナ（このキャラクターになりきって書いてください）
${fireflyPersona}

## 🔴 最重要原則: Life-Scene First
Psycleは「心理学を学ばせるアプリ」ではなく「人生の判断を1つずつマシにする体験装置」です。

**問題の主語は「心理学原理」ではなく「ユーザーの生活シーン」にすること**

形式: 「◯◯しない方がいいと分かっているのに、△△してしまう瞬間」

❌ 禁止（原理ベース）:
- 「返報性の原理とは...」
- 「損失回避バイアスについて...」
- 「サンクコスト・ファラシーの例として...」

✅ 推奨（シーンベース）:
- 「断れない飲み会に誘われた時、あなたは...」
- 「衝動買いしそうになった時...」
- 「もう続けたくないけど、ここまで頑張ったし...と思った時」

## 🟠 Phase 4 (conversation/consequence_scenario) 特別ルール
このタイプはシミュレーション問題です。詳細ルールは [docs/PRINCIPLES.md](../../../docs/PRINCIPLES.md) を参照してください。

**禁止表現:**
- 「正解！」「不正解」「間違い」
- 赤/緑のジャッジ表現

**代わりに使う表現:**
- 「Better Choice（よりスマートな選択）」
- 「Recommended」「こっちの方が摩擦が少ないよ」
- 「いい選択だね。相手も自分も傷つけない方法。」
- 「それもアリだけど、こっちの方が後悔が少ないかも。」

## 🟡 Success Granularity (One Day Rule)
成功状態の約束は「**明日1回使える**」レベルに限定する。

❌ 禁止（大きすぎる約束）:
- 「人生が変わる」「うつが治る」「劇的に改善」
- 「必ず成功する」「人間関係が激変する」

✅ 推奨（小さな成功）:
- 「罪悪感が軽くなる」「会話がスムーズに」
- 「断った後の後悔が減る」「次に似た場面で迷いにくくなる」

## 禁止事項（Blacklist）
以下のテーマが含まれる場合は、**絶対に生成せず**、代わりに "error": "BLACKLISTED: [理由]" を返してください。

${BLACKLISTED_TOPICS.map(
    (t) => `- **${t.topic}**: ${t.reason} (Keywords: ${t.keywords.join(", ")})`
  ).join("\n")}

## 注意事項（Cautionary）
以下のテーマは取扱注意です。指示に従ってください。

${CAUTIONARY_TOPICS.map(
    (t) => `- **${t.topic}**: ${t.reason} -> 指示: ${t.instruction}`
  ).join("\n")}

## 出力フォーマット (JSON)
以下のJSONスキーマに厳密に従ってください。JSONのみを出力し、説明文は不要です：
${schemaExample}

## 必須フィールド（全問題タイプ共通）
- id: "${seed.domain}_generated_${Date.now()}"
- source_id: 上記idと同じ
- difficulty: "${difficulty}"
- xp: ${xpMap[difficulty]}
- evidence_grade: "${seed.evidence_grade}"
- actionable_advice: "💡 今日のアクション：\\n具体的な行動指示（Fireflyの口調で）"

## 品質基準
1. 文脈の適正化: 極端な例を避け、現実的なシチュエーションを設定する
2. 常識とのバランス: 逆張りしすぎない。「意外だけど納得できる」を目指す
3. 文化的適合性: 日本文化で違和感がないか確認する

## 禁止事項
- 人格否定的な表現
- 過度に説教臭い表現
- 「〜しろ」などの命令形
- 「絶対に」などの断定表現`;

  const userPrompt = `以下の心理学原理から、${questionType}形式の問題を1つ生成してください。

【心理学原理】
- 原理名: ${seed.core_principle}（${seed.core_principle_en}）
- 直感に反する洞察: ${seed.counter_intuitive_insight}
- よくある誤解: ${seed.common_misconception}
- 具体的アクション: ${seed.actionable_tactic}
- 参考文献: ${seed.academic_reference}
- 文化的注意点: ${seed.cultural_notes}

難易度: ${difficulty}
ドメイン: ${seed.domain}

JSONのみを出力してください。`;

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("No content in response");
  }

  const parsed = JSON.parse(content);

  // Validate with Zod
  const validated = GeneratedQuestionSchema.parse(parsed);

  return validated;
}
