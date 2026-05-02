import { getUserStorageKey, loadUserEntries, persistJson } from "./persistence";
import { createEmptyMasteryThemeState, reevaluateMasteryThemeState } from "./mastery";
import type {
  LessonSessionRecord,
  MasteryThemeState,
  MistakeItem,
  ReviewEvent,
  SupportSurfaceRecord,
} from "./types";

export interface PracticePersistenceSnapshot {
  mistakes: MistakeItem[];
  reviewEvents: ReviewEvent[];
  lessonSessions: LessonSessionRecord[];
  supportSurfaceHistory: SupportSurfaceRecord[];
  masteryThemeStates: MasteryThemeState[];
}

export function normalizeReviewEvents(raw: unknown, nowMs: number = Date.now()): ReviewEvent[] {
  if (!Array.isArray(raw)) return [];
  const cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  const normalized: ReviewEvent[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const event = item as Record<string, unknown>;
    const ts = Number(event.ts);
    if (!Number.isFinite(ts) || ts < cutoffMs) continue;

    const userId = typeof event.userId === "string" ? event.userId : "";
    const itemId = typeof event.itemId === "string" ? event.itemId : "";
    const lessonId = typeof event.lessonId === "string" ? event.lessonId : "";
    const result = event.result === "incorrect" ? "incorrect" : event.result === "correct" ? "correct" : null;
    if (!userId || !itemId || !lessonId || !result) continue;

    const latencyMs = Number(event.latencyMs);
    const dueAt = Number(event.dueAt);
    const beta = Number(event.beta);
    const p = Number(event.p);

    normalized.push({
      userId,
      itemId,
      lessonId,
      ts: Math.floor(ts),
      result,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : undefined,
      dueAt: Number.isFinite(dueAt) ? dueAt : undefined,
      tags: Array.isArray(event.tags) ? event.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
      beta: Number.isFinite(beta) ? beta : undefined,
      p: Number.isFinite(p) ? p : undefined,
    });
  }

  return normalized.slice(-1000);
}

export function normalizeStoredMistakes(raw: unknown, nowMs: number = Date.now()): MistakeItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const mistake = item as Record<string, unknown>;
    const id = typeof mistake.id === "string" ? mistake.id : "";
    const lessonId = typeof mistake.lessonId === "string" ? mistake.lessonId : "";
    if (!id || !lessonId) return [];

    const timestamp = Number(mistake.timestamp);
    const box = Number(mistake.box);
    const nextReviewDate = Number(mistake.nextReviewDate);
    const interval = Number(mistake.interval);

    return [{
      id,
      lessonId,
      timestamp: Number.isFinite(timestamp) ? Math.floor(timestamp) : nowMs,
      questionType: typeof mistake.questionType === "string" ? mistake.questionType : undefined,
      box: Number.isFinite(box) ? Math.max(1, Math.floor(box)) : 1,
      nextReviewDate: Number.isFinite(nextReviewDate) ? Math.floor(nextReviewDate) : nowMs,
      interval: Number.isFinite(interval) ? Math.max(0, Math.floor(interval)) : 0,
    }];
  });
}

export function normalizeLessonSessions(raw: unknown): LessonSessionRecord[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const lessonId = typeof record.lessonId === "string" ? record.lessonId : "";
    if (!lessonId) return [];

    const questionIds = Array.isArray(record.questionIds)
      ? record.questionIds.filter((questionId): questionId is string => typeof questionId === "string" && questionId.length > 0)
      : [];

    const lastStartedAt = Number(record.lastStartedAt);
    const lastCompletedAt = Number(record.lastCompletedAt);
    const lastAbandonedAt = Number(record.lastAbandonedAt);
    const abandonmentCount = Number(record.abandonmentCount);
    const completionCount = Number(record.completionCount);
    const lastCompletedContentVersion =
      typeof record.lastCompletedContentVersion === "string" ? record.lastCompletedContentVersion : null;
    const lastCompletedCurriculumUpdatedAt =
      typeof record.lastCompletedCurriculumUpdatedAt === "string"
        ? record.lastCompletedCurriculumUpdatedAt
        : null;

    return [{
      lessonId,
      questionIds,
      lastStartedAt: Number.isFinite(lastStartedAt) ? Math.floor(lastStartedAt) : null,
      lastCompletedAt: Number.isFinite(lastCompletedAt) ? Math.floor(lastCompletedAt) : null,
      lastAbandonedAt: Number.isFinite(lastAbandonedAt) ? Math.floor(lastAbandonedAt) : null,
      abandonmentCount: Number.isFinite(abandonmentCount) ? Math.max(0, Math.floor(abandonmentCount)) : 0,
      completionCount: Number.isFinite(completionCount) ? Math.max(0, Math.floor(completionCount)) : 0,
      lastCompletedContentVersion,
      lastCompletedCurriculumUpdatedAt,
    }];
  });
}

export function normalizeSupportSurfaceHistory(raw: unknown, nowMs: number = Date.now()): SupportSurfaceRecord[] {
  if (!Array.isArray(raw)) return [];
  const cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const lessonId = typeof record.lessonId === "string" ? record.lessonId : "";
    const kind =
      record.kind === "return" || record.kind === "adaptive" || record.kind === "refresh" || record.kind === "replay"
        ? record.kind
        : null;
    const reason =
      record.reason === "abandonment" ||
      record.reason === "weakness" ||
      record.reason === "forgetting" ||
      record.reason === "evidence_update" ||
      record.reason === "completion_drift"
        ? record.reason
        : null;
    const signalConfidence =
      record.signalConfidence === "low" || record.signalConfidence === "medium" || record.signalConfidence === "high"
        ? record.signalConfidence
        : undefined;
    const lifecycleState =
      record.lifecycleState === "shown" ||
      record.lifecycleState === "started" ||
      record.lifecycleState === "completed" ||
      record.lifecycleState === "suppressed" ||
      record.lifecycleState === "killed"
        ? record.lifecycleState
        : "shown";
    const ts = Number(record.ts);
    const startedAt = Number(record.startedAt);

    if (!lessonId || !kind || !reason || !Number.isFinite(ts) || ts < cutoffMs) return [];

    return [{
      lessonId,
      kind,
      reason,
      signalConfidence,
      lifecycleState,
      ts: Math.floor(ts),
      startedAt: Number.isFinite(startedAt) ? Math.floor(startedAt) : undefined,
    }];
  });
}

export function normalizeMasteryThemeStates(raw: unknown): MasteryThemeState[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const themeId = typeof record.themeId === "string" ? record.themeId : "";
    if (!themeId) return [];

    const base = createEmptyMasteryThemeState({
      themeId,
      parentUnitId: typeof record.parentUnitId === "string" ? record.parentUnitId : themeId,
      maxActiveSlots: Number(record.maxActiveSlots),
    });

    return [
      reevaluateMasteryThemeState({
        ...base,
        activeVariantIds: Array.isArray(record.activeVariantIds)
          ? record.activeVariantIds.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [],
        retiredVariantIds: Array.isArray(record.retiredVariantIds)
          ? record.retiredVariantIds.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [],
        sceneIdsCleared: Array.isArray(record.sceneIdsCleared)
          ? record.sceneIdsCleared.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [],
        scenesClearedCount: Number.isFinite(Number(record.scenesClearedCount))
          ? Math.max(0, Math.floor(Number(record.scenesClearedCount)))
          : base.scenesClearedCount,
        attemptCount: Number.isFinite(Number(record.attemptCount))
          ? Math.max(0, Math.floor(Number(record.attemptCount)))
          : 0,
        transferImprovement: record.transferImprovement === true,
        repeatWithoutDropoff: record.repeatWithoutDropoff === true,
        newLearningValueDelta: Number.isFinite(Number(record.newLearningValueDelta))
          ? Math.max(0, Math.min(1, Number(record.newLearningValueDelta)))
          : base.newLearningValueDelta,
        transferGainSlope: Number.isFinite(Number(record.transferGainSlope))
          ? Number(record.transferGainSlope)
          : base.transferGainSlope,
        repetitionRisk: Number.isFinite(Number(record.repetitionRisk))
          ? Math.max(0, Math.min(1, Number(record.repetitionRisk)))
          : base.repetitionRisk,
        graduationState: record.graduationState === "graduated" ? "graduated" : "learning",
        masteryCeilingState: record.masteryCeilingState === "ceiling_reached" ? "ceiling_reached" : "open",
        lastEvaluatedAt: Number.isFinite(Number(record.lastEvaluatedAt))
          ? Math.floor(Number(record.lastEvaluatedAt))
          : null,
      }),
    ];
  });
}

export async function loadPracticePersistenceSnapshot(userId: string): Promise<PracticePersistenceSnapshot> {
  const saved = await loadUserEntries(userId, [
    "mistakes",
    "reviewEvents",
    "lessonSessions",
    "supportSurfaceHistory",
    "masteryThemeStates",
  ]);
  let mistakes: MistakeItem[] = [];
  let reviewEvents: ReviewEvent[] = [];
  let lessonSessions: LessonSessionRecord[] = [];
  let supportSurfaceHistory: SupportSurfaceRecord[] = [];
  let masteryThemeStates: MasteryThemeState[] = [];

  if (saved.mistakes) {
    try {
      mistakes = normalizeStoredMistakes(JSON.parse(saved.mistakes));
    } catch (error) {
      console.warn("Failed to parse stored mistakes:", error);
    }
  }

  if (saved.reviewEvents) {
    try {
      reviewEvents = normalizeReviewEvents(JSON.parse(saved.reviewEvents));
    } catch (error) {
      console.warn("Failed to parse stored review events:", error);
    }
  }

  if (saved.lessonSessions) {
    try {
      lessonSessions = normalizeLessonSessions(JSON.parse(saved.lessonSessions));
    } catch (error) {
      console.warn("Failed to parse stored lesson sessions:", error);
    }
  }

  if (saved.supportSurfaceHistory) {
    try {
      supportSurfaceHistory = normalizeSupportSurfaceHistory(JSON.parse(saved.supportSurfaceHistory));
    } catch (error) {
      console.warn("Failed to parse stored support surface history:", error);
    }
  }

  if (saved.masteryThemeStates) {
    try {
      masteryThemeStates = normalizeMasteryThemeStates(JSON.parse(saved.masteryThemeStates));
    } catch (error) {
      console.warn("Failed to parse stored mastery theme states:", error);
    }
  }

  return {
    mistakes,
    reviewEvents,
    lessonSessions,
    supportSurfaceHistory,
    masteryThemeStates,
  };
}

export async function persistPracticeJsonState(
  userId: string,
  key: "mistakes" | "reviewEvents" | "lessonSessions" | "supportSurfaceHistory" | "masteryThemeStates",
  value:
    | MistakeItem[]
    | ReviewEvent[]
    | LessonSessionRecord[]
    | SupportSurfaceRecord[]
    | MasteryThemeState[]
): Promise<void> {
  await persistJson(getUserStorageKey(key, userId), value);
}
