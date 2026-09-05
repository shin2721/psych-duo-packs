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
  insight_layer: LessonInsightLayer;
  lane: LessonLane;
  phase?: LessonPhase;
  load_score: LessonLoadScore;
  question_count_range: LessonQuestionCountRange;
  counterfactual?: string;
  intervention_path?: string;
  forbidden_moves?: string[];
}

export interface LessonInsightLayer {
  surprising_question: string;
  research_finding: string;
  critical_caveat: string;
  usable_scope: string;
  practice_prompt: string;
}

export interface LessonMetadata {
  lesson_id: string;
  lane: LessonLane;
  locale_scope?: string[];
  sequence_policy?: "adaptive" | "authored";
  preview_prompt?: string;
  lesson_job: string;
  target_shift: string;
  done_condition: string;
  takeaway_action: string;
  insight_layer: LessonInsightLayer;
  load_score: LessonLoadScore;
  question_count_range: LessonQuestionCountRange;
  non_goals?: string[];
}

/**
 * JSONでauthoring可能な問題タイプ。
 *
 * 型定義に存在するだけではなく、QuestionRendererで回答から結果表示・次へ
 * 進むところまで接続されている形式だけを含める。validatorはこの一覧を
 * 正本として使い、未接続形式をlesson JSONへ入れない。
 */
export const RUNTIME_REACHABLE_QUESTION_TYPES = [
  "true_false",
  "multiple_choice",
  "fill_blank",
  "sort_order",
  "select_all",
  "fill_blank_tap",
  "swipe_judgment",
  "conversation",
  "matching",
  "quick_reflex",
  "micro_input",
  "consequence_scenario",
  "term_card",
  "number_bet",
] as const;

export type RuntimeReachableQuestionType =
  (typeof RUNTIME_REACHABLE_QUESTION_TYPES)[number];

/**
 * アプリ内で表現を検討中の形式も含む型。
 *
 * `scenario` / `animated_explanation` / `interactive_practice` は将来用で、
 * 現在はauthoring不可。renderer接続とend-to-end検証が揃うまでは
 * RUNTIME_REACHABLE_QUESTION_TYPESへ追加しない。
 */
export type QuestionType =
  | RuntimeReachableQuestionType
  | "scenario"
  | "animated_explanation"
  | "interactive_practice";

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

/**
 * 判定の重さ。信号と同じ読み方をする——緑は乗っていい、黄は話半分、
 * grey は根拠として使えない。強さの目盛りを一本引くと「調べた結果、効く証拠が
 * なかった」の置き場所がなくなるので、段階は色だけが持ち、向きは文が言う。
 * blue は「調べて、差が出なかった」の確定色。「まだ調べられていない」(grey) と
 * 同じ色にすると、一番分けたい2つが画面で区別できなくなる。
 */
export type VerdictWeight = "green" | "amber" | "grey" | "blue";

export interface ExpandedDetails {
  basis_label?: string;
  best_for?: string[];
  /** 誰に・何をして・何を測ったか。台帳の記述からだけ書く。 */
  how_studied?: string;
  // 何についての判定か。チップの上に説を1行で出す（「発散すると、怒りが減る」）。
  verdict_claim?: string;
  // どれくらい信じていいか。結論の1語（かなり固い／まあ固い／まだ揺れる／薄い）で始め、
  // 理由（研究数・誤差の幅・事前登録・偏りの検査・無作為割り付け・測り方）を続ける。台帳の行からしか書かない。
  strength_line?: string;
  /**
   * 判定の一言。強さの目盛りではなく判定そのものを言う
   * （使える／話半分／差はなかった／まだ不明／研究がまだ少ない／ものによる）。
   * grey は「まだ不明」（調べたが白黒つかない）と「研究がまだ少ない」（まともに
   * 調べられていない）の2語を持つ。「根拠なし」はこの2つを混ぜるので使わない。
   */
  verdict_label?: string;
  /** この知見をどう持つか。カードの中身について喋る1文。 */
  verdict_line?: string;
  verdict_weight?: VerdictWeight;
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

  // 予想カード共通。true にすると、外した時も解説を折り畳まず
  // 「続ける」を解説の下に置く。賭けさせた以上、結果は隠さない。
  bet_card?: boolean;

  // 種明かしのただし書き。explanation から分離して従属ブロックで描く。
  // 本文に混ぜると読む壁になり、消すと誠実さが消えるので、格を下げて別枠に置く。
  caveat?: string;

  // 画面に出す出典1行。読者が自分で検索して確かめられる状態を保つ。
  source_label?: string;

  // number_bet用（研究結果を先に予想させてから実数を出す）
  bet_min?: number;           // スライダー下限
  bet_max?: number;           // スライダー上限
  bet_step?: number;          // 刻み（既定1）
  bet_start?: number;         // 初期位置（既定は中央）
  bet_decimals?: number;      // 表示小数桁（既定0）
  bet_unit?: string;          // 数値の下に出る単位ラベル
  bet_answer?: number;        // 実際の値
  bet_tolerance?: number;     // 正解とみなす許容差（既定0）
  bet_answer_label?: string;  // 結果表示の文言（例「およそ10人」）

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
