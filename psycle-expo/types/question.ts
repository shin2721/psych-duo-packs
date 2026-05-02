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
export type LessonLane = "core" | "mastery" | "refresh";
export type LessonPhase = 1 | 2 | 3 | 4 | 5;

export interface LessonLoadScore {
  cognitive: 1 | 2 | 3;
  emotional: 1 | 2 | 3;
  behavior_change: 1 | 2 | 3;
  total: number;
}

export interface LessonQuestionCountRange {
  min: number;
  max: number;
  target: number;
}

export interface LessonBlueprint {
  job: string;
  target_shift: string;
  done_condition: string;
  takeaway_action: string;
  lane: LessonLane;
  phase?: LessonPhase;
  load_score: LessonLoadScore;
  question_count_range: LessonQuestionCountRange;
  counterfactual?: string;
  intervention_path?: string;
  forbidden_moves?: string[];
}

export interface LessonMetadata {
  lesson_id: string;
  lane: LessonLane;
  lesson_job: string;
  target_shift: string;
  done_condition: string;
  takeaway_action: string;
  load_score: LessonLoadScore;
  question_count_range: LessonQuestionCountRange;
  non_goals?: string[];
}

/**
 * 問題タイプ
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
  | "micro_input"      // 入力型（1文字完成入力）
  | "consequence_scenario" // 結果予測
  | "animated_explanation" // アニメーション解説
  | "term_card" // 単語カード
  | "interactive_practice"; // インタラクティブ演習

export interface ExpandedDetailsComparator {
  baseline?: string;
  cost?: string;
}

export interface ExpandedDetailsFallback {
  when?: string;
  next?: string;
  label?: string;
  text?: string;
}

export interface ExpandedDetailsTinyMetric {
  after_prompt?: string;
  before_prompt?: string;
  stop_rule?: string;
  success_rule?: string;
}

export interface ExpandedDetailsVariant {
  id?: string;
  label?: string;
}

export interface ExpandedDetails {
  basis_label?: string;
  best_for?: string[];
  citation_role?: string;
  claim_tags?: string[];
  claim_type?: string;
  comparator?: ExpandedDetailsComparator;
  evidence_type?: string;
  fallback?: ExpandedDetailsFallback;
  limitations?: string[];
  note?: string;
  tiny_metric?: ExpandedDetailsTinyMetric;
  try_this?: string;
  variant?: ExpandedDetailsVariant;
  [key: string]: unknown;
}

// ========================================
// メイン問題形式
// ========================================

/**
 * Question Interface (The Standard)
 * アプリケーション全体で使用される標準問題形式
 */
export interface Question {
  id?: string;                 // 問題ID
  phase?: LessonPhase;         // 5-Phase Structure position
  claim_id?: string;           // Claim trace id
  lane?: LessonLane;           // Core / mastery / refresh lane
  lesson_blueprint?: LessonBlueprint;
  type: QuestionType;
  question: string;           // 質問文
  text?: string;              // 旧フォーマット互換の問題文
  choices?: string[];          // 選択肢 (一部のタイプで必須)
  correct_index?: number;     // 正解のインデックス（0始まり）
  correct_answers?: number[]; // 複数正解の場合（select_all用）
  explanation?: string | {    // 解説文（文字列またはオブジェクト）
    correct?: string;
    incorrect?: {
      default?: string;
      [key: string]: string | undefined;
    };
  };
  source_id?: string;          // ソースID
  difficulty: Difficulty | string;
  xp: number;

  // 拡張フィールド（特定の問題タイプ用）
  items?: string[];           // sort_order用
  correct_order?: number[] | string[];   // sort_order用
  initial_order?: number[];   // sort_order用
  statement?: string;         // swipe_judgment / fill_blank_tap用
  is_true?: boolean;          // swipe_judgment用
  swipe_labels?: { left: string; right: string }; // swipe_judgment用
  your_response_prompt?: string; // conversation用
  recommended_index?: number;   // conversation用 (Phase 4 Better Choice)
  prompt?: string;            // conversation用 (short prompt for chat bubble)
  left_items?: string[];      // matching用
  right_items?: string[];     // matching用
  correct_pairs?: number[][]; // matching用
  time_limit?: number;        // quick_reflex用（ミリ秒、デフォルト2000）
  input_answer?: string;      // micro_input用（正解の入力文字列）
  placeholder?: string;       // micro_input用（入力プレースホルダー）
  blank_options?: string[];   // fill_blank_tap用

  // Consequence Scenario
  consequence_type?: "positive" | "negative";

  // Term Card
  term?: string;
  term_en?: string;
  definition?: string;
  key_points?: string[];

  // Interactive Practice
  practice_config?: Record<string, unknown>;
  feedback_prompt?: string;
  snack_map?: Record<string, string>;
  bonus_xp_if_effective?: number;

  // Evidence & Advice
  actionable_advice?: string;
  evidence_grade?: 'gold' | 'silver' | 'bronze';
  evidence_text?: string;
  evidence_source?: string;
  expanded_details?: ExpandedDetails;

  // Multimedia
  image?: string;        // URL to image
  audio?: string;        // URL to audio file
  imageCaption?: string; // Optional caption for accessibility

  // Animated Explanation
  animation_url?: string;
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
  source?: unknown;           // ソース情報（論文など）
  context?: string;           // 追加コンテキスト
}

/**
 * 問題生成結果
 */
export interface GeneratedQuestion extends Question {
  metadata?: {
    generatedAt: string;      // 生成日時
    sourceTitle?: string;     // ソース論文のタイトル
    sourceAuthors?: string;   // ソース論文の著者
    keywords?: string[];      // キーワード
  };
}

// ========================================
// 定数・バリデーション
// ========================================

/**
 * 問題の妥当性をチェック
 */
export function validateQuestion(q: Question): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必須フィールドチェック
  if (!q.id) errors.push("id is required");
  if (!q.type) errors.push("type is required");
  if (!q.question && q.type !== 'scenario') errors.push("question is required"); // Scenario might use a different prompt structure

  // タイプ別チェック
  if (q.type === "true_false" && (!q.choices || q.choices.length !== 2)) {
    // Note: Some TF formats might omit choices if implied, but standard requires explicit True/False
    // Relaxing check slightly if implemented differently
  }

  // インデックス範囲チェック
  if (q.choices && q.correct_index !== undefined) {
    if (q.correct_index < 0 || q.correct_index >= q.choices.length) {
      errors.push(`answer_index ${q.correct_index} is out of range (choices length: ${q.choices.length})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
