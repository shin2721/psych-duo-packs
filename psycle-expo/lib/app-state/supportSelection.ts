import type {
  LessonSessionRecord,
  LessonSupportCandidate,
  MistakeItem,
  SupportBudgetSummary,
  SupportSurfaceRecord,
} from "./types";
import { resolveRuntimeLessonId } from "../lessonContinuity";
import {
  getLessonSupportSurfacingEligibility,
  type LessonRuntimeAccessBlockReason,
} from "../lessonOperational";
import type { LessonOperationalMetadata, RuntimeThemeManifest } from "../../types/lessonOperational";

const MIN_SUPPORT_QUESTION_COUNT = 3;
const MAX_RETURN_ITEMS = 5;
const RETURN_RESUME_GRACE_MS = 24 * 60 * 60 * 1000;
const RECENT_WRONG_TURN_MS = 48 * 60 * 60 * 1000;
const SUPPORT_HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const IMPRESSION_SETTLE_MS = 5 * 60 * 1000;
const SAME_KIND_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const SAME_THEME_COOLDOWN_MS = 18 * 60 * 60 * 1000;
const SAME_LESSON_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LOW_CONFIDENCE_THEME_COOLDOWN_MS = 48 * 60 * 60 * 1000;
const WEEKLY_SUPPORT_BUDGET = 6;
const WEEKLY_KIND_BUDGET: Record<LessonSupportCandidate["kind"], number> = {
  return: 2,
  adaptive: 2,
  refresh: 2,
  replay: 1,
};

export function getUnitIdFromLessonId(lessonId: string): string | null {
  const normalizedLessonId = resolveRuntimeLessonId(lessonId).resolvedLessonId ?? lessonId;
  const lessonSplit = normalizedLessonId.split("_lesson_");
  if (lessonSplit.length > 1 && lessonSplit[0]) {
    return lessonSplit[0];
  }

  const masteryMatch = normalizedLessonId.match(/^(.*)_m\d+$/);
  if (masteryMatch?.[1]) {
    return masteryMatch[1];
  }

  const levelMatch = normalizedLessonId.match(/^(.*)_l\d+$/);
  if (levelMatch?.[1]) {
    return levelMatch[1];
  }

  return null;
}

function resolveCandidateLessonId(lessonId: string): string | null {
  return resolveRuntimeLessonId(lessonId).resolvedLessonId;
}

function deriveCompletedThemeIds(lessonSessions: LessonSessionRecord[]): string[] {
  return Array.from(
    new Set(
      lessonSessions
        .filter((record) => record.completionCount > 0)
        .map((record) => getUnitIdFromLessonId(record.lessonId))
        .filter((themeId): themeId is string => typeof themeId === "string" && themeId.length > 0)
    )
  );
}

function getRelevantHistory(
  supportSurfaceHistory: SupportSurfaceRecord[],
  nowMs: number
): SupportSurfaceRecord[] {
  const cutoffMs = nowMs - SUPPORT_HISTORY_WINDOW_MS;
  return supportSurfaceHistory.filter((record) => record.ts >= cutoffMs);
}

function getStableRelevantHistory(
  supportSurfaceHistory: SupportSurfaceRecord[],
  nowMs: number
): SupportSurfaceRecord[] {
  return getRelevantHistory(supportSurfaceHistory, nowMs).filter(
    (record) => nowMs - record.ts >= IMPRESSION_SETTLE_MS
  );
}

export function summarizeSupportBudget(args: {
  supportSurfaceHistory?: SupportSurfaceRecord[];
  nowMs?: number;
}): SupportBudgetSummary {
  const nowMs = args.nowMs ?? Date.now();
  const weeklyCutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const weeklyHistory = getStableRelevantHistory(args.supportSurfaceHistory ?? [], nowMs).filter(
    (record) => record.ts >= weeklyCutoffMs
  );
  const weeklyKindUsed: SupportBudgetSummary["weeklyKindUsed"] = {
    return: 0,
    adaptive: 0,
    refresh: 0,
    replay: 0,
  };

  weeklyHistory.forEach((record) => {
    weeklyKindUsed[record.kind] += 1;
  });

  return {
    weeklyBudget: WEEKLY_SUPPORT_BUDGET,
    weeklyUsed: weeklyHistory.length,
    weeklyRemaining: Math.max(0, WEEKLY_SUPPORT_BUDGET - weeklyHistory.length),
    weeklyKindBudget: { ...WEEKLY_KIND_BUDGET },
    weeklyKindUsed,
    weeklyKindRemaining: {
      return: Math.max(0, WEEKLY_KIND_BUDGET.return - weeklyKindUsed.return),
      adaptive: Math.max(0, WEEKLY_KIND_BUDGET.adaptive - weeklyKindUsed.adaptive),
      refresh: Math.max(0, WEEKLY_KIND_BUDGET.refresh - weeklyKindUsed.refresh),
      replay: Math.max(0, WEEKLY_KIND_BUDGET.replay - weeklyKindUsed.replay),
    },
  };
}

export interface KilledSupportMoment {
  lessonId: string;
  kind: LessonSupportCandidate["kind"];
  reason: LessonSupportCandidate["reason"];
  signalConfidence?: LessonSupportCandidate["signalConfidence"];
  ts: number;
  startedAt?: number;
  lifecycleState: "shown" | "started";
  blockReason: LessonRuntimeAccessBlockReason;
}

export function getKilledSupportMoments(args: {
  lessonSessions: LessonSessionRecord[];
  supportSurfaceHistory?: SupportSurfaceRecord[];
  nowMs?: number;
  lessonOperationalById?: Record<string, LessonOperationalMetadata | null>;
  themeManifestById?: Record<string, RuntimeThemeManifest | null>;
  completedThemeIds?: string[];
}): KilledSupportMoment[] {
  const nowMs = args.nowMs ?? Date.now();
  const completedThemeIds = args.completedThemeIds ?? deriveCompletedThemeIds(args.lessonSessions);

  return (args.supportSurfaceHistory ?? []).flatMap((record) => {
    if (record.lifecycleState !== "shown" && record.lifecycleState !== "started") {
      return [];
    }

    const resolvedLessonId = resolveCandidateLessonId(record.lessonId) ?? record.lessonId;
    const themeId = getUnitIdFromLessonId(record.lessonId);
    const eligibility = getLessonSupportSurfacingEligibility({
      lessonId: resolvedLessonId,
      nowMs,
      lessonOperational:
        args.lessonOperationalById?.[resolvedLessonId] ??
        args.lessonOperationalById?.[record.lessonId] ??
        null,
      lessonOperationalById: args.lessonOperationalById,
      themeManifest: themeId ? args.themeManifestById?.[themeId] ?? null : null,
      themeManifestById: args.themeManifestById,
      completedThemeIds,
    });

    if (eligibility.eligible || !eligibility.reason) {
      return [];
    }

    return [
      {
        ...record,
        lifecycleState: record.lifecycleState,
        blockReason: eligibility.reason,
      },
    ];
  });
}

function isCandidateBlockedByHistory(args: {
  candidate: LessonSupportCandidate;
  nowMs: number;
  supportSurfaceHistory: SupportSurfaceRecord[];
}): boolean {
  const { candidate, nowMs } = args;
  const stableHistory = getStableRelevantHistory(args.supportSurfaceHistory, nowMs);
  const candidateTheme = getUnitIdFromLessonId(candidate.lessonId);
  const weeklyCutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const weeklyHistory = stableHistory.filter((record) => record.ts >= weeklyCutoffMs);

  if (weeklyHistory.length >= WEEKLY_SUPPORT_BUDGET) {
    return true;
  }

  if (
    weeklyHistory.filter((record) => record.kind === candidate.kind).length >= WEEKLY_KIND_BUDGET[candidate.kind]
  ) {
    return true;
  }

  if (
    stableHistory.some(
      (record) =>
        (resolveCandidateLessonId(record.lessonId) ?? record.lessonId) === candidate.lessonId &&
        nowMs - record.ts < SAME_LESSON_COOLDOWN_MS
    )
  ) {
    return true;
  }

  if (
    stableHistory.some(
      (record) => record.kind === candidate.kind && nowMs - record.ts < SAME_KIND_COOLDOWN_MS
    )
  ) {
    return true;
  }

  if (
    candidateTheme &&
    stableHistory.some((record) => {
      const historyTheme = getUnitIdFromLessonId(record.lessonId);
      return historyTheme === candidateTheme && nowMs - record.ts < SAME_THEME_COOLDOWN_MS;
    })
  ) {
    return true;
  }

  if (
    candidate.signalConfidence === "low" &&
    candidateTheme &&
    stableHistory.some((record) => {
      const historyTheme = getUnitIdFromLessonId(record.lessonId);
      return historyTheme === candidateTheme && nowMs - record.ts < LOW_CONFIDENCE_THEME_COOLDOWN_MS;
    })
  ) {
    return true;
  }

  return false;
}

function hasValidQuestionSet(record: LessonSessionRecord): boolean {
  return record.questionIds.length >= MIN_SUPPORT_QUESTION_COUNT;
}

function hasOutstandingAbandonment(record: LessonSessionRecord): boolean {
  const lastStart = record.lastStartedAt ?? 0;
  const lastCompletion = record.lastCompletedAt ?? 0;
  const lastAbandon = record.lastAbandonedAt ?? 0;
  return lastAbandon >= lastStart && lastCompletion < lastAbandon;
}

function selectReturnCandidate(
  lessonSessions: LessonSessionRecord[],
  nowMs: number
): LessonSupportCandidate | null {
  const candidate = [...lessonSessions]
    .filter(hasValidQuestionSet)
    .filter(hasOutstandingAbandonment)
    .filter((record) => {
      if (record.abandonmentCount >= 2) return true;
      const lastAbandon = record.lastAbandonedAt ?? 0;
      return lastAbandon > 0 && nowMs - lastAbandon >= RETURN_RESUME_GRACE_MS;
    })
    .sort((left, right) => (right.lastAbandonedAt ?? 0) - (left.lastAbandonedAt ?? 0))[0];

  if (!candidate) return null;

  return {
    lessonId: candidate.lessonId,
    kind: "return",
    questionIds: candidate.questionIds.slice(0, MAX_RETURN_ITEMS),
    reason: "abandonment",
    signalConfidence: candidate.abandonmentCount >= 2 ? "medium" : "low",
  };
}

function selectAdaptiveCandidate(
  mistakes: MistakeItem[],
  nowMs: number
): LessonSupportCandidate | null {
  const dueMistakes = mistakes.filter((mistake) => mistake.nextReviewDate <= nowMs);
  if (dueMistakes.length < MIN_SUPPORT_QUESTION_COUNT) {
    return null;
  }

  const groupedDueMistakes = new Map<string, MistakeItem[]>();
  dueMistakes.forEach((mistake) => {
    const existing = groupedDueMistakes.get(mistake.lessonId) ?? [];
    existing.push(mistake);
    groupedDueMistakes.set(mistake.lessonId, existing);
  });

  const candidate = [...groupedDueMistakes.entries()]
    .filter(([, lessonMistakes]) => lessonMistakes.length >= MIN_SUPPORT_QUESTION_COUNT)
    .sort((left, right) => {
      const countDelta = right[1].length - left[1].length;
      if (countDelta !== 0) return countDelta;
      return (
        Math.min(...left[1].map((mistake) => mistake.nextReviewDate)) -
        Math.min(...right[1].map((mistake) => mistake.nextReviewDate))
      );
    })[0];

  if (!candidate) return null;

  const lessonMistakes = candidate[1]
    .slice()
    .sort((left, right) => left.nextReviewDate - right.nextReviewDate)
    .slice(0, MAX_RETURN_ITEMS);
  const hasRecentWrongTurn = lessonMistakes.some(
    (mistake) => nowMs - mistake.timestamp <= RECENT_WRONG_TURN_MS
  );

  return {
    lessonId: candidate[0],
    kind: "adaptive",
    questionIds: lessonMistakes.map((mistake) => mistake.id),
    reason: hasRecentWrongTurn ? "weakness" : "forgetting",
    signalConfidence: hasRecentWrongTurn || lessonMistakes.length >= 4 ? "medium" : "low",
  };
}

function selectRefreshCandidate(
  lessonSessions: LessonSessionRecord[],
  curriculumUpdatedAtByUnit: Record<string, string>
): LessonSupportCandidate | null {
  const candidate = [...lessonSessions]
    .filter(hasValidQuestionSet)
    .filter((record) => {
      const lastCompletedAt = record.lastCompletedAt ?? 0;
      if (record.completionCount < 1 || lastCompletedAt <= 0) return false;
      const unit = getUnitIdFromLessonId(record.lessonId);
      if (!unit) return false;
      const currentCurriculumUpdatedAt = curriculumUpdatedAtByUnit[unit];
      if (!currentCurriculumUpdatedAt || !record.lastCompletedCurriculumUpdatedAt) return false;
      return currentCurriculumUpdatedAt !== record.lastCompletedCurriculumUpdatedAt;
    })
    .sort((left, right) => (right.lastCompletedAt ?? 0) - (left.lastCompletedAt ?? 0))[0];

  if (!candidate) return null;

  return {
    lessonId: candidate.lessonId,
    kind: "refresh",
    questionIds: candidate.questionIds,
    reason: "evidence_update",
  };
}

function normalizeCandidate(candidate: LessonSupportCandidate | null): LessonSupportCandidate | null {
  if (!candidate) return null;
  const resolvedLessonId = resolveCandidateLessonId(candidate.lessonId);
  if (!resolvedLessonId) {
    return null;
  }

  if (candidate.lessonId === resolvedLessonId) {
    return candidate;
  }

  return {
    ...candidate,
    lessonId: resolvedLessonId,
  };
}

export function selectLessonSupportCandidate(args: {
  curriculumUpdatedAtByUnit: Record<string, string>;
  lessonSessions: LessonSessionRecord[];
  mistakes: MistakeItem[];
  supportSurfaceHistory?: SupportSurfaceRecord[];
  nowMs?: number;
  lessonOperationalById?: Record<string, LessonOperationalMetadata | null>;
  themeManifestById?: Record<string, RuntimeThemeManifest | null>;
  completedThemeIds?: string[];
}): LessonSupportCandidate | null {
  const nowMs = args.nowMs ?? Date.now();
  const completedThemeIds = args.completedThemeIds ?? deriveCompletedThemeIds(args.lessonSessions);
  const candidates = [
    normalizeCandidate(selectReturnCandidate(args.lessonSessions, nowMs)),
    normalizeCandidate(selectAdaptiveCandidate(args.mistakes, nowMs)),
    normalizeCandidate(selectRefreshCandidate(args.lessonSessions, args.curriculumUpdatedAtByUnit)),
  ].filter((candidate): candidate is LessonSupportCandidate => candidate !== null);

  for (const candidate of candidates) {
    const resolvedLessonId = resolveCandidateLessonId(candidate.lessonId) ?? candidate.lessonId;
    const candidateTheme = getUnitIdFromLessonId(candidate.lessonId);
    const surfacingEligibility = getLessonSupportSurfacingEligibility({
      lessonId: resolvedLessonId,
      nowMs,
      lessonOperational:
        args.lessonOperationalById?.[resolvedLessonId] ??
        args.lessonOperationalById?.[candidate.lessonId] ??
        null,
      lessonOperationalById: args.lessonOperationalById,
      themeManifest: candidateTheme ? args.themeManifestById?.[candidateTheme] ?? null : null,
      themeManifestById: args.themeManifestById,
      completedThemeIds,
    });

    if (!surfacingEligibility.eligible) {
      continue;
    }

    if (
      !isCandidateBlockedByHistory({
        candidate,
        nowMs,
        supportSurfaceHistory: args.supportSurfaceHistory ?? [],
      })
    ) {
      return candidate;
    }
  }

  return null;
}
