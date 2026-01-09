/**
 * 問題型定義ファイル
 *
 * このファイルは全ての問題タイプの型定義を一元管理します。
 * 問題生成スクリプトとアプリケーション本体の両方で使用されます。
 */

// ========================================
// 基本型定義
// ========================================

/**
 * 難易度
 */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * 問題タイプ（レガシー形式）
 * QuestionRendererが理解できる型
 */
export type QuestionType =
  | "true_false"        // 正しい/間違い の2択
  | "multiple_choice"   // 複数選択肢（3-4択）
  | "fill_blank"        // 穴埋め問題
  | "sort_order"        // 並び替え
  | "select_all"        // 複数選択（正解が複数）
  | "fill_blank_tap"    // 穴埋めタップ
  | "swipe_judgment"    // スワイプ判定
  | "conversation"      // 会話問題
  | "matching"          // マッチング
  | "scenario"          // シナリオ問題
  | "quick_reflex"      // 反射型（2秒以内の即断）
  | "micro_input";      // 入力型（1文字完成入力）

// ========================================
// レガシー形式（アプリが使用する形式）
// ========================================

/**
 * レガシー問題形式
 * QuestionRenderer.tsxが期待する形式
 */
export interface LegacyQuestion {
  type: QuestionType;
  question: string;           // 質問文
  choices: string[];          // 選択肢
  correct_index?: number;     // 正解のインデックス（0始まり）
  correct_answers?: number[]; // 複数正解の場合（select_all用）
  explanation: string;        // 解説文
  source_id: string;          // 問題ID
  difficulty: Difficulty;
  xp: number;

  // 拡張フィールド（特定の問題タイプ用）
  items?: string[];           // sort_order用
  correct_order?: number[];   // sort_order用
  initial_order?: number[];   // sort_order用
  statement?: string;         // swipe_judgment用
  is_true?: boolean;          // swipe_judgment用
  your_response_prompt?: string; // conversation用
  left_items?: string[];      // matching用
  right_items?: string[];     // matching用
  correct_pairs?: number[][]; // matching用
  time_limit?: number;        // quick_reflex用（ミリ秒、デフォルト2000）
  input_answer?: string;      // micro_input用（正解の入力文字列）
  placeholder?: string;       // micro_input用（入力プレースホルダー）
}

// ========================================
// データ層形式（JSONファイルに保存する形式）
// ========================================

/**
 * データ層問題形式
 * data/lessons/*.json に保存される形式
 *
 * フィールド名が異なる：
 * - stem (質問文) → question
 * - answer_index (正解) → correct_index
 * - snack (解説) → explanation
 * - info (ソースID) → source_id
 */
export interface DataQuestion {
  id: string;                 // 問題ID
  type: QuestionType;
  stem: string;               // 質問文（questionの代わり）
  choices: string[];
  answer_index: number;       // 正解インデックス（correct_indexの代わり）
  snack: string;              // 解説文（explanationの代わり）
  info: string;               // ソースID（source_idの代わり）
  difficulty: Difficulty;
  xp: number;

  // 拡張フィールド（特定の問題タイプ用）
  time_limit?: number;        // quick_reflex用（ミリ秒、デフォルト2000）
  input_answer?: string;      // micro_input用（正解の入力文字列）
  placeholder?: string;       // micro_input用（入力プレースホルダー）
}

// ========================================
// 生成用型定義
// ========================================

/**
 * 問題生成パラメータ
 */
export interface QuestionGenerationParams {
  unit: string;               // ユニット名（mental, money, work, etc.）
  difficulty: Difficulty;     // 難易度
  type: QuestionType;         // 問題タイプ
  source?: any;               // ソース情報（論文など）
  context?: string;           // 追加コンテキスト
}

/**
 * 問題生成結果
 */
export interface GeneratedQuestion extends DataQuestion {
  metadata?: {
    generatedAt: string;      // 生成日時
    sourceTitle?: string;     // ソース論文のタイトル
    sourceAuthors?: string;   // ソース論文の著者
    keywords?: string[];      // キーワード
  };
}

// ========================================
// レッスン構成型定義
// ========================================

/**
 * レッスン構成
 * 各レッスンの問題タイプと数を定義
 */
export interface LessonComposition {
  level: number;              // レッスンレベル（1-6）
  questions: {
    type: QuestionType;
    count: number;
    difficulty?: Difficulty;
  }[];
  totalQuestions: number;     // 合計問題数（15問固定）
}

/**
 * 標準レッスン構成
 *
 * L01: 新規問題タイプ導入 (Quick Reflex + Micro Input含む15問)
 * L02-L06: 従来通り15問
 */
export const LESSON_COMPOSITIONS: Record<number, LessonComposition> = {
  1: {
    level: 1,
    questions: [
      { type: "scenario", count: 1, difficulty: "easy" },          // シナリオ
      { type: "true_false", count: 3, difficulty: "easy" },        // TF (recall含む)
      { type: "multiple_choice", count: 1, difficulty: "easy" },   // MCQ
      { type: "swipe_judgment", count: 2, difficulty: "easy" },    // スワイプ
      { type: "matching", count: 1, difficulty: "easy" },          // マッチング
      { type: "fill_blank", count: 2, difficulty: "easy" },        // 穴埋め
      { type: "conversation", count: 1, difficulty: "easy" },      // 会話
      { type: "sort_order", count: 1, difficulty: "easy" },        // 並び替え
      { type: "select_all", count: 1, difficulty: "easy" },        // 複数選択
      { type: "quick_reflex", count: 1, difficulty: "easy" },      // 反射型 NEW
      { type: "micro_input", count: 1, difficulty: "easy" },       // 入力型 NEW
    ],
    totalQuestions: 15,
  },
  2: {
    level: 2,
    questions: [
      { type: "true_false", count: 5, difficulty: "easy" },        // AB
      { type: "multiple_choice", count: 5, difficulty: "medium" }, // MCQ3
      { type: "true_false", count: 3, difficulty: "medium" },      // TF
      { type: "fill_blank", count: 1, difficulty: "medium" },      // 穴埋め
      { type: "multiple_choice", count: 1, difficulty: "medium" }, // 方法
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
 * DataQuestionをLegacyQuestionに変換
 */
export function dataToLegacy(data: DataQuestion): LegacyQuestion {
  return {
    type: data.type,
    question: data.stem,
    choices: data.choices,
    correct_index: data.answer_index,
    explanation: data.snack,
    source_id: data.info || data.id,
    difficulty: data.difficulty,
    xp: data.xp,
    time_limit: data.time_limit,
    input_answer: data.input_answer,
    placeholder: data.placeholder,
  };
}

/**
 * LegacyQuestionをDataQuestionに変換
 */
export function legacyToData(legacy: LegacyQuestion, id: string): DataQuestion {
  return {
    id,
    type: legacy.type,
    stem: legacy.question,
    choices: legacy.choices,
    answer_index: legacy.correct_index || 0,
    snack: legacy.explanation,
    info: legacy.source_id,
    difficulty: legacy.difficulty,
    xp: legacy.xp,
  };
}

/**
 * 問題の妥当性をチェック
 */
export function validateQuestion(q: DataQuestion): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必須フィールドチェック
  if (!q.id) errors.push("id is required");
  if (!q.type) errors.push("type is required");
  if (!q.stem) errors.push("stem is required");
  if (!q.choices || q.choices.length === 0) errors.push("choices must have at least one option");
  if (q.answer_index === undefined || q.answer_index === null) errors.push("answer_index is required");
  if (!q.snack) errors.push("snack is required");
  if (!q.difficulty) errors.push("difficulty is required");
  if (q.xp === undefined || q.xp === null) errors.push("xp is required");

  // タイプ別チェック
  if (q.type === "true_false" && q.choices.length !== 2) {
    errors.push("true_false must have exactly 2 choices");
  }

  if (q.type === "multiple_choice" && (q.choices.length < 2 || q.choices.length > 4)) {
    errors.push("multiple_choice must have 2-4 choices");
  }

  // インデックス範囲チェック
  if (q.answer_index < 0 || q.answer_index >= q.choices.length) {
    errors.push(`answer_index ${q.answer_index} is out of range (choices length: ${q.choices.length})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
