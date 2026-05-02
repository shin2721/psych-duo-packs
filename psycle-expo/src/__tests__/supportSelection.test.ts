import {
  getKilledSupportMoments,
  getUnitIdFromLessonId,
  selectLessonSupportCandidate,
  summarizeSupportBudget,
} from "../../lib/app-state/supportSelection";
import type { LessonSessionRecord, MistakeItem } from "../../lib/app-state/types";
import type { LessonOperationalMetadata, RuntimeThemeManifest } from "../../types/lessonOperational";

function buildLessonSession(
  overrides: Partial<LessonSessionRecord> = {}
): LessonSessionRecord {
  return {
    lessonId: "mental_l01",
    questionIds: ["q1", "q2", "q3", "q4"],
    lastStartedAt: null,
    lastCompletedAt: null,
    lastAbandonedAt: null,
    abandonmentCount: 0,
    completionCount: 0,
    lastCompletedContentVersion: null,
    lastCompletedCurriculumUpdatedAt: null,
    ...overrides,
  };
}

function buildMistake(overrides: Partial<MistakeItem> = {}): MistakeItem {
  return {
    id: "q1",
    lessonId: "mental_l01",
    timestamp: 0,
    questionType: "multiple_choice",
    box: 1,
    nextReviewDate: 0,
    interval: 0,
    ...overrides,
  };
}

function buildOperationalMetadata(
  overrides: Partial<LessonOperationalMetadata> = {}
): LessonOperationalMetadata {
  return {
    severity_tier: "B",
    next_review_due_at: "2026-07-21",
    content_package: {
      state: "production",
    },
    ...overrides,
  };
}

function buildThemeManifest(
  overrides: Partial<RuntimeThemeManifest> = {}
): RuntimeThemeManifest {
  return {
    theme_id: "mental",
    last_reviewed_at: "2026-04-22",
    review_cycle_days: 90,
    rollout_stage: "production_default",
    theme_status: "active",
    ...overrides,
  };
}

describe("selectLessonSupportCandidate", () => {
  const nowMs = Date.UTC(2026, 3, 21, 8, 0, 0);

  test("surfaces return after repeated abandonment", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 2,
        }),
      ],
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        lessonId: "mental_l02",
        kind: "return",
        reason: "abandonment",
        signalConfidence: "medium",
      })
    );
  });

  test("does not surface return immediately after a single abandonment", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 1,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("surfaces return after a single stale abandonment with a resume gap", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 3 * 24 * 60 * 60 * 1000,
          lastAbandonedAt: nowMs - 2 * 24 * 60 * 60 * 1000,
          abandonmentCount: 1,
        }),
      ],
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        lessonId: "mental_l02",
        kind: "return",
        signalConfidence: "low",
      })
    );
  });

  test("prefers adaptive resurfacing over refresh when there is no return need", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      curriculumUpdatedAtByUnit: { mental: "2026-04-20" },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l03",
          lastCompletedAt: nowMs - 4 * 24 * 60 * 60 * 1000,
          completionCount: 1,
          lastCompletedCurriculumUpdatedAt: "2026-04-01",
        }),
      ],
      mistakes: [
        buildMistake({
          id: "q1",
          lessonId: "mental_l04",
          timestamp: nowMs - 2 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 10_000,
        }),
        buildMistake({
          id: "q2",
          lessonId: "mental_l04",
          timestamp: nowMs - 4 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 20_000,
        }),
        buildMistake({
          id: "q3",
          lessonId: "mental_l04",
          timestamp: nowMs - 6 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 30_000,
        }),
      ],
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        lessonId: "mental_l04",
        kind: "adaptive",
        reason: "weakness",
      })
    );
  });

  test("surfaces refresh when curriculum changed and there is no higher-priority support", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: { mental: "2026-04-20" },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l03",
          lastCompletedAt: nowMs - 4 * 24 * 60 * 60 * 1000,
          completionCount: 1,
          lastCompletedCurriculumUpdatedAt: "2026-04-01",
        }),
      ],
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        lessonId: "mental_l03",
        kind: "refresh",
        reason: "evidence_update",
      })
    );
  });

  test("does not auto-surface replay from completion drift alone", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l05",
          lastStartedAt: nowMs - 5 * 24 * 60 * 60 * 1000,
          lastCompletedAt: nowMs - 4 * 24 * 60 * 60 * 1000,
          completionCount: 2,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("blocks same kind resurfacing inside cooldown", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      supportSurfaceHistory: [
        {
          lessonId: "mental_l01",
          kind: "return",
          reason: "abandonment",
          signalConfidence: "medium",
          ts: nowMs - 2 * 60 * 60 * 1000,
        },
      ],
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 2,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("blocks low-confidence resurfacing when same theme was surfaced recently", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      curriculumUpdatedAtByUnit: {},
      supportSurfaceHistory: [
        {
          lessonId: "mental_l01",
          kind: "adaptive",
          reason: "weakness",
          signalConfidence: "medium",
          ts: nowMs - 24 * 60 * 60 * 1000,
        },
      ],
      lessonSessions: [],
      mistakes: [
        buildMistake({
          id: "q1",
          lessonId: "mental_l04",
          timestamp: nowMs - 7 * 24 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 10_000,
        }),
        buildMistake({
          id: "q2",
          lessonId: "mental_l04",
          timestamp: nowMs - 7 * 24 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 20_000,
        }),
        buildMistake({
          id: "q3",
          lessonId: "mental_l04",
          timestamp: nowMs - 7 * 24 * 60 * 60 * 1000,
          nextReviewDate: nowMs - 30_000,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("suppresses support for deprecated packages", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      lessonOperationalById: {
        mental_l02: buildOperationalMetadata({
          content_package: {
            state: "deprecated",
          },
        }),
      },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 2,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("suppresses support for Tier A stale packages", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: { mental: "2026-04-20" },
      lessonOperationalById: {
        mental_l03: buildOperationalMetadata({
          severity_tier: "A",
          next_review_due_at: "2026-04-01",
        }),
      },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l03",
          lastCompletedAt: nowMs - 4 * 24 * 60 * 60 * 1000,
          completionCount: 1,
          lastCompletedCurriculumUpdatedAt: "2026-04-01",
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("suppresses support when theme review is overdue in production_default", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      themeManifestById: {
        mental: buildThemeManifest({
          last_reviewed_at: "2025-12-01",
          review_cycle_days: 30,
          rollout_stage: "production_default",
        }),
      },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 2,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("suppresses support when prerequisite themes are unmet", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: {},
      completedThemeIds: [],
      themeManifestById: {
        mental: buildThemeManifest({
          prerequisite_themes: ["money"],
        }),
      },
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l02",
          lastStartedAt: nowMs - 10_000,
          lastAbandonedAt: nowMs - 5_000,
          abandonmentCount: 2,
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("blocks support when weekly dosage budget is exhausted", () => {
    const candidate = selectLessonSupportCandidate({
      nowMs,
      mistakes: [],
      curriculumUpdatedAtByUnit: { mental: "2026-04-20" },
      supportSurfaceHistory: [
        { lessonId: "mental_l01", kind: "return", reason: "abandonment", ts: nowMs - 6 * 24 * 60 * 60 * 1000 },
        { lessonId: "study_l01", kind: "adaptive", reason: "weakness", ts: nowMs - 5 * 24 * 60 * 60 * 1000 },
        { lessonId: "work_l01", kind: "refresh", reason: "evidence_update", ts: nowMs - 4 * 24 * 60 * 60 * 1000 },
        { lessonId: "social_l01", kind: "adaptive", reason: "forgetting", ts: nowMs - 3 * 24 * 60 * 60 * 1000 },
        { lessonId: "health_l01", kind: "return", reason: "abandonment", ts: nowMs - 2 * 24 * 60 * 60 * 1000 },
        { lessonId: "money_l01", kind: "refresh", reason: "evidence_update", ts: nowMs - 24 * 60 * 60 * 1000 },
      ],
      lessonSessions: [
        buildLessonSession({
          lessonId: "mental_l03",
          lastCompletedAt: nowMs - 4 * 24 * 60 * 60 * 1000,
          completionCount: 1,
          lastCompletedCurriculumUpdatedAt: "2026-04-01",
        }),
      ],
    });

    expect(candidate).toBeNull();
  });

  test("summarizes remaining weekly support budget by kind", () => {
    const summary = summarizeSupportBudget({
      nowMs,
      supportSurfaceHistory: [
        { lessonId: "mental_l01", kind: "return", reason: "abandonment", ts: nowMs - 6 * 24 * 60 * 60 * 1000 },
        { lessonId: "study_l01", kind: "adaptive", reason: "weakness", ts: nowMs - 5 * 24 * 60 * 60 * 1000 },
        { lessonId: "work_l01", kind: "adaptive", reason: "forgetting", ts: nowMs - 4 * 24 * 60 * 60 * 1000 },
        { lessonId: "social_l01", kind: "refresh", reason: "evidence_update", ts: nowMs - 3 * 24 * 60 * 60 * 1000 },
      ],
    });

    expect(summary.weeklyBudget).toBe(6);
    expect(summary.weeklyUsed).toBe(4);
    expect(summary.weeklyRemaining).toBe(2);
    expect(summary.weeklyKindUsed).toEqual({
      return: 1,
      adaptive: 2,
      refresh: 1,
      replay: 0,
    });
    expect(summary.weeklyKindRemaining).toEqual({
      return: 1,
      adaptive: 0,
      refresh: 1,
      replay: 1,
    });
  });
});

describe("getUnitIdFromLessonId", () => {
  test("normalizes mastery variant ids to their theme", () => {
    expect(getUnitIdFromLessonId("mental_m01")).toBe("mental");
    expect(getUnitIdFromLessonId("mental_l03")).toBe("mental");
    expect(getUnitIdFromLessonId("mental_lesson_3")).toBe("mental");
  });
});

describe("getKilledSupportMoments", () => {
  const nowMs = Date.UTC(2026, 3, 22, 0, 0, 0);

  test("marks shown or started support as killed when runtime access is lost", () => {
    const killed = getKilledSupportMoments({
      nowMs,
      lessonSessions: [
        buildLessonSession({
          lessonId: "money_l01",
          completionCount: 1,
          lastCompletedAt: nowMs - 2 * 24 * 60 * 60 * 1000,
        }),
      ],
      supportSurfaceHistory: [
        {
          lessonId: "mental_l03",
          kind: "return",
          reason: "abandonment",
          signalConfidence: "medium",
          lifecycleState: "started",
          ts: nowMs - 5 * 60 * 1000,
          startedAt: nowMs - 4 * 60 * 1000,
        },
      ],
      lessonOperationalById: {
        mental_l03: buildOperationalMetadata({
          content_package: {
            state: "production",
            package_dependencies: {
              requires_package_ids: ["money_l01"],
              dependency_rule: "all_required_packages_must_be_runtime_accessible",
              invalidation_rule: "dependency_change_requires_revalidation",
            },
          },
        }),
        money_l01: buildOperationalMetadata({
          content_package: {
            state: "killed",
          },
        }),
      },
    });

    expect(killed).toEqual([
      expect.objectContaining({
        lessonId: "mental_l03",
        kind: "return",
        lifecycleState: "started",
        blockReason: "dependency_unmet",
      }),
    ]);
  });
});
