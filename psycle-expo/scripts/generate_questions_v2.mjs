#!/usr/bin/env node

/**
 * 問題生成スクリプト v2
 *
 * types/question.ts で定義された型を使用して問題を生成します。
 *
 * 使い方:
 *   node scripts/generate_questions_v2.mjs <unit> <level>
 *   例: node scripts/generate_questions_v2.mjs mental 1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// 型定義（types/question.ts から複製）
// ========================================

/**
 * レッスン構成
 */
const LESSON_COMPOSITIONS = {
  1: {
    level: 1,
    questions: [
      { type: "multiple_choice", count: 2, difficulty: "easy" },   // 用語
      { type: "true_false", count: 2, difficulty: "easy" },        // 真偽
      { type: "scenario", count: 2, difficulty: "easy" },          // シナリオ
      { type: "fill_blank", count: 1, difficulty: "easy" },        // 穴埋め
      { type: "fill_blank_tap", count: 1, difficulty: "easy" },    // タップ穴埋め
      { type: "select_all", count: 1, difficulty: "easy" },        // 複数選択
      { type: "swipe_judgment", count: 2, difficulty: "easy" },    // スワイプ
      { type: "conversation", count: 2, difficulty: "easy" },      // 会話
      { type: "matching", count: 1, difficulty: "medium" },        // マッチング
      { type: "sort_order", count: 1, difficulty: "medium" },      // 並び替え
    ],
    totalQuestions: 15,
  },
  2: {
    level: 2,
    questions: [
      { type: "true_false", count: 5, difficulty: "easy" },
      { type: "multiple_choice", count: 5, difficulty: "medium" },
      { type: "true_false", count: 3, difficulty: "medium" },
      { type: "fill_blank", count: 1, difficulty: "medium" },
      { type: "multiple_choice", count: 1, difficulty: "medium" },
    ],
    totalQuestions: 15,
  },
  3: {
    level: 3,
    questions: [
      { type: "true_false", count: 5, difficulty: "medium" },
      { type: "multiple_choice", count: 5, difficulty: "medium" },
      { type: "true_false", count: 3, difficulty: "medium" },
      { type: "fill_blank", count: 1, difficulty: "medium" },
      { type: "multiple_choice", count: 1, difficulty: "hard" },
    ],
    totalQuestions: 15,
  },
  4: {
    level: 4,
    questions: [
      { type: "true_false", count: 5, difficulty: "medium" },
      { type: "multiple_choice", count: 5, difficulty: "hard" },
      { type: "true_false", count: 3, difficulty: "hard" },
      { type: "fill_blank", count: 1, difficulty: "hard" },
      { type: "multiple_choice", count: 1, difficulty: "hard" },
    ],
    totalQuestions: 15,
  },
  5: {
    level: 5,
    questions: [
      { type: "true_false", count: 5, difficulty: "hard" },
      { type: "multiple_choice", count: 5, difficulty: "hard" },
      { type: "true_false", count: 3, difficulty: "hard" },
      { type: "fill_blank", count: 1, difficulty: "hard" },
      { type: "multiple_choice", count: 1, difficulty: "hard" },
    ],
    totalQuestions: 15,
  },
  6: {
    level: 6,
    questions: [
      { type: "true_false", count: 5, difficulty: "hard" },
      { type: "multiple_choice", count: 5, difficulty: "hard" },
      { type: "true_false", count: 3, difficulty: "hard" },
      { type: "fill_blank", count: 1, difficulty: "hard" },
      { type: "multiple_choice", count: 1, difficulty: "hard" },
    ],
    totalQuestions: 15,
  },
};

// ========================================
// ヘルパー関数
// ========================================

/**
 * 問題の妥当性をチェック
 */
function validateQuestion(q) {
  const errors = [];

  if (!q.id) errors.push("id is required");
  if (!q.type) errors.push("type is required");
  if (!q.stem) errors.push("stem is required");
  if (!q.snack) errors.push("snack is required");
  if (!q.difficulty) errors.push("difficulty is required");
  if (q.xp === undefined || q.xp === null) errors.push("xp is required");

  // swipe_judgment, matching, sort_orderはchoicesが空でOK
  const typesWithoutChoices = ["swipe_judgment", "matching", "sort_order"];
  if (!typesWithoutChoices.includes(q.type)) {
    if (!q.choices || q.choices.length === 0) {
      errors.push("choices must have at least one option");
    }
    if (q.answer_index === undefined || q.answer_index === null) {
      errors.push("answer_index is required");
    }
  }

  if (q.type === "true_false" && q.choices && q.choices.length !== 2) {
    errors.push("true_false must have exactly 2 choices");
  }

  if (q.type === "multiple_choice" && q.choices && (q.choices.length < 2 || q.choices.length > 4)) {
    errors.push("multiple_choice must have 2-4 choices");
  }

  if (q.choices && q.choices.length > 0 && q.answer_index !== undefined) {
    if (q.answer_index < 0 || q.answer_index >= q.choices.length) {
      errors.push(`answer_index ${q.answer_index} is out of range (choices length: ${q.choices.length})`);
    }
  }

  // 各タイプの固有バリデーション
  if (q.type === "swipe_judgment" && q.is_true === undefined) {
    errors.push("swipe_judgment must have is_true field");
  }
  if (q.type === "sort_order" && (!q.items || !q.correct_order)) {
    errors.push("sort_order must have items and correct_order");
  }
  if (q.type === "matching" && (!q.left_items || !q.right_items || !q.correct_pairs)) {
    errors.push("matching must have left_items, right_items, and correct_pairs");
  }
  if (q.type === "select_all" && !q.correct_answers) {
    errors.push("select_all must have correct_answers");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========================================
// 問題生成ロジック
// ========================================

/**
 * 単一の問題を生成
 */
function generateQuestion(unit, type, difficulty, index) {
  // ここに問題生成ロジックを実装
  // 現在はプレースホルダーを返す

  const templates = {
    true_false: () => ({
      id: `${unit}_${type}_${index}`,
      type: "true_false",
      stem: `これは${difficulty}難易度の真偽問題です`,
      choices: ["正しい", "誤り"],
      answer_index: Math.floor(Math.random() * 2),
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
    }),
    multiple_choice: () => ({
      id: `${unit}_${type}_${index}`,
      type: "multiple_choice",
      stem: `これは${difficulty}難易度の選択問題です`,
      choices: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      answer_index: Math.floor(Math.random() * 4),
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
    }),
    fill_blank: () => ({
      id: `${unit}_${type}_${index}`,
      type: "fill_blank",
      stem: `これは${difficulty}難易度の穴埋め問題です：［　］`,
      choices: ["選択肢A", "選択肢B", "選択肢C"],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
    }),
    sort_order: () => ({
      id: `${unit}_${type}_${index}`,
      type: "sort_order",
      stem: `これは${difficulty}難易度の並び替え問題です`,
      choices: [],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
      items: ["項目1", "項目2", "項目3", "項目4"],
      correct_order: [0, 1, 2, 3],
    }),
    select_all: () => ({
      id: `${unit}_${type}_${index}`,
      type: "select_all",
      stem: `これは${difficulty}難易度の複数選択問題です`,
      choices: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
      correct_answers: [0, 2],
    }),
    fill_blank_tap: () => ({
      id: `${unit}_${type}_${index}`,
      type: "fill_blank_tap",
      stem: `これは${difficulty}難易度のタップ穴埋め問題です：［　］`,
      choices: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
    }),
    swipe_judgment: () => ({
      id: `${unit}_${type}_${index}`,
      type: "swipe_judgment",
      stem: `これは${difficulty}難易度のスワイプ判定問題です`,
      choices: [],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
      statement: "これは判定文です",
      is_true: Math.random() > 0.5,
    }),
    conversation: () => ({
      id: `${unit}_${type}_${index}`,
      type: "conversation",
      stem: `これは${difficulty}難易度の会話問題です`,
      choices: ["返答A", "返答B", "返答C"],
      answer_index: Math.floor(Math.random() * 3),
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
      your_response_prompt: "あなたならどう返しますか？",
    }),
    matching: () => ({
      id: `${unit}_${type}_${index}`,
      type: "matching",
      stem: `これは${difficulty}難易度のマッチング問題です`,
      choices: [],
      answer_index: 0,
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
      left_items: ["左項目1", "左項目2", "左項目3"],
      right_items: ["右項目A", "右項目B", "右項目C"],
      correct_pairs: [[0, 0], [1, 1], [2, 2]],
    }),
    scenario: () => ({
      id: `${unit}_${type}_${index}`,
      type: "scenario",
      stem: `これは${difficulty}難易度のシナリオ問題です`,
      choices: ["選択肢A", "選択肢B", "選択肢C"],
      answer_index: Math.floor(Math.random() * 3),
      snack: "これは解説文です",
      info: `${unit}_basics`,
      difficulty,
      xp: 5,
    }),
  };

  const generator = templates[type] || templates.multiple_choice;
  return generator();
}

/**
 * レッスン全体の問題を生成
 */
function generateLesson(unit, level) {
  const composition = LESSON_COMPOSITIONS[level];
  if (!composition) {
    throw new Error(`Invalid level: ${level}. Must be 1-6.`);
  }

  const questions = [];
  let questionIndex = 1;

  for (const spec of composition.questions) {
    for (let i = 0; i < spec.count; i++) {
      const question = generateQuestion(unit, spec.type, spec.difficulty, questionIndex);
      questions.push(question);
      questionIndex++;
    }
  }

  return questions;
}

// ========================================
// メイン処理
// ========================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate_questions_v2.mjs <unit> <level>');
    console.error('Example: node generate_questions_v2.mjs mental 1');
    process.exit(1);
  }

  const unit = args[0];
  const level = parseInt(args[1], 10);

  if (isNaN(level) || level < 1 || level > 6) {
    console.error('Error: level must be a number between 1 and 6');
    process.exit(1);
  }

  console.log(`Generating questions for ${unit}, level ${level}...`);

  try {
    // 問題を生成
    const questions = generateLesson(unit, level);

    // 妥当性チェック
    let hasErrors = false;
    questions.forEach((q, index) => {
      const validation = validateQuestion(q);
      if (!validation.valid) {
        console.error(`Question ${index + 1} (${q.id}) validation failed:`);
        validation.errors.forEach(err => console.error(`  - ${err}`));
        hasErrors = true;
      }
    });

    if (hasErrors) {
      console.error('\nValidation failed. Please fix the errors above.');
      process.exit(1);
    }

    // ファイルに保存
    const outputDir = path.join(__dirname, '..', 'data', 'lessons');
    const outputPath = path.join(outputDir, `${unit}.json`);

    // 既存ファイルがあればバックアップ
    if (fs.existsSync(outputPath)) {
      const backupPath = `${outputPath}.backup.${Date.now()}`;
      fs.copyFileSync(outputPath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8');

    console.log(`\n✅ Successfully generated ${questions.length} questions`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`\nQuestion type breakdown:`);

    const typeCounts = {};
    questions.forEach(q => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
