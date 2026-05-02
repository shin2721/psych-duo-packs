import type { LessonLane, LessonPhase, Question, QuestionType } from "../../types/question";

export interface LessonLoadDiagnostics {
  duplicateQuestionIds: number;
  fallbackQuestionsFilled: number;
  invalidEntriesSkipped: number;
  requiredFieldFallbacks: number;
}

function isQuestionRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isQuestionRecord(value) ? value : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item): item is number => Number.isFinite(item))
        .map((item) => Math.floor(item))
    : [];
}

function asPairArray(value: unknown): number[][] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!Array.isArray(item)) return [];
    const pair = item
      .map((entry) => Number(entry))
      .filter((entry): entry is number => Number.isFinite(entry))
      .map((entry) => Math.floor(entry));
    return pair.length === item.length ? [pair] : [];
  });
}

function asEvidenceGrade(value: unknown): Question["evidence_grade"] {
  return value === "gold" || value === "silver" || value === "bronze"
    ? value
    : undefined;
}

function asLessonPhase(value: unknown): LessonPhase | undefined {
  const phase = Number(value);
  return phase === 1 || phase === 2 || phase === 3 || phase === 4 || phase === 5
    ? phase
    : undefined;
}

function asLessonLane(value: unknown): LessonLane | undefined {
  return value === "core" || value === "mastery" || value === "refresh"
    ? value
    : undefined;
}

const TYPE_MAP: Record<string, string> = {
  truefalse: "true_false",
  mcq3: "multiple_choice",
  ab: "multiple_choice",
  cloze1: "fill_blank",
  cloze2: "fill_blank",
  cloze3: "fill_blank",
  clozeN: "fill_blank",
  rank: "sort_order",
};

function normalizeQuestionType(value: string): QuestionType {
  const allowed: QuestionType[] = [
    "true_false",
    "multiple_choice",
    "fill_blank",
    "sort_order",
    "select_all",
    "fill_blank_tap",
    "swipe_judgment",
    "conversation",
    "matching",
    "scenario",
    "quick_reflex",
    "micro_input",
    "consequence_scenario",
    "animated_explanation",
    "term_card",
    "interactive_practice",
  ];
  return allowed.includes(value as QuestionType)
    ? (value as QuestionType)
    : "multiple_choice";
}

export function createLessonLoadDiagnostics(): LessonLoadDiagnostics {
  return {
    duplicateQuestionIds: 0,
    fallbackQuestionsFilled: 0,
    invalidEntriesSkipped: 0,
    requiredFieldFallbacks: 0,
  };
}

function hasLessonLoadAnomalies(diagnostics: LessonLoadDiagnostics): boolean {
  return (
    diagnostics.duplicateQuestionIds > 0 ||
    diagnostics.fallbackQuestionsFilled > 0 ||
    diagnostics.invalidEntriesSkipped > 0 ||
    diagnostics.requiredFieldFallbacks > 0
  );
}

export function warnLessonLoadSummary(
  unit: string,
  diagnostics: LessonLoadDiagnostics
) {
  if (!__DEV__ || !hasLessonLoadAnomalies(diagnostics)) {
    return;
  }

  console.warn(`[loadLessons] ${unit} data anomalies`, diagnostics);
}

function adaptQuestion(raw: Record<string, unknown>): Question {
  const content = asRecord(raw.content);

  const rawType = typeof raw.type === "string" ? raw.type : "multiple_choice";
  const mappedType = normalizeQuestionType(TYPE_MAP[rawType] || rawType);

  const adapted: Question = {
    id: typeof raw.id === "string" ? raw.id : undefined,
    phase: asLessonPhase(raw.phase),
    claim_id: typeof raw.claim_id === "string" ? raw.claim_id : undefined,
    lane: asLessonLane(raw.lane),
    lesson_blueprint: isQuestionRecord(raw.lesson_blueprint)
      ? (raw.lesson_blueprint as unknown as Question["lesson_blueprint"])
      : undefined,
    type: mappedType,
    question:
      (typeof content.prompt === "string" && content.prompt) ||
      (typeof raw.stem === "string" && raw.stem) ||
      (typeof raw.question === "string" && raw.question) ||
      (typeof raw.text === "string" && raw.text) ||
      "質問",
    choices: asStringArray(content.options ?? raw.choices ?? raw.bank),
    correct_index: Number(
      raw.correct_answer ?? raw.answer_index ?? raw.correct_index ?? 0
    ),
    explanation:
      (typeof raw.snack === "string" && raw.snack) ||
      (typeof raw.explanation === "string" ? raw.explanation : raw.explanation) ||
      "",
    source_id: typeof raw.id === "string" ? raw.id : "",
    difficulty:
      raw.difficulty === 1 ? "easy" : raw.difficulty === 3 ? "hard" : "medium",
    xp: 5,
    image: typeof raw.image === "string" ? raw.image : undefined,
    audio: typeof raw.audio === "string" ? raw.audio : undefined,
    imageCaption:
      typeof raw.imageCaption === "string" ? raw.imageCaption : undefined,
    actionable_advice:
      typeof raw.actionable_advice === "string"
        ? raw.actionable_advice
        : undefined,
    evidence_grade: asEvidenceGrade(raw.evidence_grade),
    evidence_text:
      typeof raw.evidence_text === "string" ? raw.evidence_text : undefined,
    expanded_details: isQuestionRecord(raw.expanded_details)
      ? raw.expanded_details
      : undefined,
  };

  if (raw.type === "select_all") {
    const correctAnswers = raw.correct_answers ?? raw.correct_indices;
    if (correctAnswers) {
      adapted.correct_answers = asNumberArray(correctAnswers);
    }
  }

  if (raw.type === "swipe_judgment") {
    adapted.statement =
      (typeof content.statement === "string" && content.statement) ||
      (typeof raw.statement === "string" && raw.statement) ||
      adapted.question;
    adapted.is_true =
      typeof raw.is_true === "boolean"
        ? raw.is_true
        : raw.correct_answer === "right" || raw.correct_answer === "True";
    adapted.swipe_labels =
      isQuestionRecord(raw.swipe_labels) &&
      typeof raw.swipe_labels.left === "string" &&
      typeof raw.swipe_labels.right === "string"
        ? { left: raw.swipe_labels.left, right: raw.swipe_labels.right }
        : typeof raw.left_label === "string" && typeof raw.right_label === "string"
          ? { left: raw.left_label, right: raw.right_label }
        : undefined;
  }

  if (raw.type === "sort_order") {
    adapted.items = asStringArray(content.items ?? raw.items);
    adapted.correct_order = asNumberArray(raw.correct_order);
    const itemCount = adapted.items.length;
    const shuffled = Array.from({ length: itemCount }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    adapted.initial_order = shuffled;
  }

  if (raw.type === "matching") {
    adapted.left_items = asStringArray(content.left_items ?? raw.left_items);
    adapted.right_items = asStringArray(content.right_items ?? raw.right_items);
    adapted.correct_pairs = asPairArray(raw.correct_pairs);
  }

  if (raw.type === "conversation") {
    adapted.your_response_prompt =
      (typeof content.your_response_prompt === "string" &&
        content.your_response_prompt) ||
      (typeof raw.your_response_prompt === "string" &&
        raw.your_response_prompt) ||
      "";
    adapted.prompt =
      (typeof content.prompt === "string" && content.prompt) ||
      (typeof raw.prompt === "string" && raw.prompt) ||
      "";
    adapted.recommended_index =
      typeof raw.recommended_index === "number" ? raw.recommended_index : undefined;
  }

  if (raw.type === "quick_reflex") {
    adapted.time_limit = Number.isFinite(raw.time_limit)
      ? Number(raw.time_limit)
      : 2000;
  }

  if (raw.type === "consequence_scenario") {
    adapted.consequence_type =
      raw.consequence_type === "positive" ||
      raw.consequence_type === "negative"
        ? raw.consequence_type
        : undefined;
  }

  if (raw.type === "term_card") {
    adapted.term = typeof raw.term === "string" ? raw.term : undefined;
    adapted.term_en = typeof raw.term_en === "string" ? raw.term_en : undefined;
    adapted.definition =
      typeof raw.definition === "string" ? raw.definition : undefined;
    adapted.key_points = asStringArray(raw.key_points);
  }

  if (raw.type === "swipe_choice") {
    (adapted as Question & { answer?: unknown }).answer = raw.answer;
  }

  if (raw.type === "micro_input") {
    adapted.input_answer =
      typeof raw.input_answer === "string" ? raw.input_answer : "";
    adapted.placeholder =
      typeof raw.placeholder === "string" ? raw.placeholder : "答えを入力";
  }

  return adapted;
}

export function adaptRawQuestion(
  raw: unknown,
  diagnostics: LessonLoadDiagnostics
): Question | null {
  if (!isQuestionRecord(raw)) {
    diagnostics.invalidEntriesSkipped += 1;
    return null;
  }

  const content = asRecord(raw.content);
  const rawType = typeof raw.type === "string" ? raw.type : "multiple_choice";
  const mappedType = normalizeQuestionType(TYPE_MAP[rawType] || rawType);
  const hasPrompt =
    content.prompt !== undefined ||
    raw.stem !== undefined ||
    raw.question !== undefined ||
    raw.text !== undefined;
  const hasChoices =
    content.options !== undefined ||
    raw.choices !== undefined ||
    raw.bank !== undefined ||
    mappedType === "swipe_judgment" ||
    mappedType === "micro_input" ||
    mappedType === "term_card";
  const hasCorrectAnswer =
    raw.correct_answer !== undefined ||
    raw.answer_index !== undefined ||
    raw.correct_index !== undefined ||
    raw.correct_answers !== undefined ||
    raw.correct_indices !== undefined ||
    raw.is_true !== undefined ||
    raw.input_answer !== undefined ||
    raw.recommended_index !== undefined ||
    mappedType === "conversation" ||
    mappedType === "term_card" ||
    mappedType === "animated_explanation";

  if (!hasPrompt || !hasChoices || !hasCorrectAnswer) {
    diagnostics.requiredFieldFallbacks += 1;
  }

  return adaptQuestion(raw);
}
