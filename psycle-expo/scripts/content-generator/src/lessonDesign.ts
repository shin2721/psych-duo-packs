import type { PhaseId } from "./phasePolicy";
import type {
  Lane,
  LessonBlueprint,
  LessonLoadScore,
  LessonWorthinessScore,
  MasteryNoveltyReason,
  RefreshValueReason,
  Seed,
} from "./types";

export const LESSON_WORTHINESS_THRESHOLD = 12;

function clampScore(value: number): 1 | 2 | 3 {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return Math.round(value) as 1 | 2 | 3;
}

export function evidenceGradeToStrengthScore(grade: Seed["evidence_grade"]): 1 | 2 | 3 {
  if (grade === "gold") return 3;
  if (grade === "silver") return 2;
  return 1;
}

export function finalizeLessonWorthiness(
  score?: Partial<LessonWorthinessScore> | null,
  evidenceGrade?: Seed["evidence_grade"]
): LessonWorthinessScore {
  const evidenceStrength = clampScore(
    score?.evidence_strength ?? evidenceGradeToStrengthScore(evidenceGrade ?? "bronze")
  );
  const pain = clampScore(score?.pain ?? 2);
  const recurrence = clampScore(score?.recurrence ?? 2);
  const actionability = clampScore(score?.actionability ?? 2);
  const novelty = clampScore(score?.novelty ?? 2);
  const total = pain + recurrence + actionability + evidenceStrength + novelty;

  return {
    pain,
    recurrence,
    actionability,
    evidence_strength: evidenceStrength,
    novelty,
    total,
  };
}

export function finalizeLessonLoad(score?: Partial<LessonLoadScore> | null): LessonLoadScore {
  const cognitive = clampScore(score?.cognitive ?? 2);
  const emotional = clampScore(score?.emotional ?? 2);
  const behavior_change = clampScore(score?.behavior_change ?? 2);
  const total = cognitive + emotional + behavior_change;

  return {
    cognitive,
    emotional,
    behavior_change,
    total,
  };
}

export function getQuestionCountRange(loadTotal: number): LessonBlueprint["question_count_range"] {
  if (loadTotal <= 4) return { min: 5, max: 6, target: 6 };
  if (loadTotal <= 6) return { min: 7, max: 8, target: 8 };
  return { min: 9, max: 10, target: 10 };
}

export function deriveLane(
  explicitLane: Lane | null | undefined,
  worthiness: LessonWorthinessScore
): Lane {
  if (explicitLane === "core" || explicitLane === "mastery" || explicitLane === "refresh") {
    return explicitLane;
  }
  return worthiness.recurrence >= 2 && worthiness.pain >= 2 ? "core" : "refresh";
}

export function normalizeReviewDate(input?: string | null): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  return new Date().toISOString().slice(0, 10);
}

export function buildClaimId(seed: Seed, phase: PhaseId): string {
  const principle = seed.core_principle_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "lesson_claim";
  return `${seed.domain}_${principle}_p${phase}`;
}

export function buildLessonBlueprint(args: {
  phase: PhaseId;
  seed: Seed;
  lane: Lane;
  lessonJob?: string | null;
  targetShift?: string | null;
  doneCondition?: string | null;
  takeawayAction?: string | null;
  counterfactual?: string | null;
  interventionPath?: string | null;
  noveltyReason?: MasteryNoveltyReason | null;
  refreshValueReason?: RefreshValueReason | null;
  forbiddenMoves?: string[] | null;
  load: LessonLoadScore;
}): LessonBlueprint {
  const {
    phase,
    seed,
    lane,
    lessonJob,
    targetShift,
    doneCondition,
    takeawayAction,
    counterfactual,
    interventionPath,
    noveltyReason,
    refreshValueReason,
    forbiddenMoves,
    load,
  } = args;

  return {
    job: lessonJob?.trim() || `${seed.core_principle} を日常の選び方に戻す`,
    target_shift:
      targetShift?.trim() || `${seed.common_misconception} から ${seed.actionable_tactic} へ移す`,
    done_condition:
      doneCondition?.trim() || `${seed.actionable_tactic} を次の場面で1回試せる状態になる`,
    takeaway_action:
      takeawayAction?.trim() || seed.actionable_tactic,
    counterfactual:
      counterfactual?.trim() || `${seed.common_misconception} のままだと戻りやすい流れを比較する`,
    intervention_path:
      interventionPath?.trim() || seed.actionable_tactic,
    novelty_reason:
      lane === "mastery" ? noveltyReason ?? undefined : undefined,
    refresh_value_reason:
      lane === "refresh" ? refreshValueReason ?? undefined : undefined,
    lane,
    phase,
    load_score: load,
    question_count_range: getQuestionCountRange(load.total),
    forbidden_moves:
      forbiddenMoves && forbiddenMoves.length > 0
        ? forbiddenMoves
        : ["textbook_quiz", "overclaim", "self_judgment"],
  };
}
