jest.mock("../../lib/app-state/persistence", () => ({
  getUserStorageKey: jest.fn((key: string, userId: string) => `${userId}:${key}`),
  loadUserEntries: jest.fn(),
  persistJson: jest.fn().mockResolvedValue(undefined),
}));

import {
  loadPracticePersistenceSnapshot,
  persistPracticeJsonState,
} from "../../lib/app-state/practicePersistence";
import {
  loadUserEntries,
  persistJson,
} from "../../lib/app-state/persistence";

const mockLoadUserEntries = loadUserEntries as jest.Mock;
const mockPersistJson = persistJson as jest.Mock;

describe("practicePersistence helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("loads mistakes and review events with migration-safe normalization", async () => {
    const nowMs = Date.UTC(2026, 3, 6, 0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(nowMs);
    mockLoadUserEntries.mockResolvedValueOnce({
      mistakes: JSON.stringify([
        {
          id: "q1",
          lessonId: "lesson-1",
          timestamp: nowMs - 1000,
          questionType: "multiple_choice",
        },
      ]),
      reviewEvents: JSON.stringify([
        {
          userId: "user-1",
          itemId: "q1",
          lessonId: "lesson-1",
          ts: nowMs - 1000,
          result: "correct",
        },
        {
          userId: "user-1",
          itemId: "stale",
          lessonId: "lesson-1",
          ts: nowMs - 40 * 24 * 60 * 60 * 1000,
          result: "incorrect",
        },
      ]),
    });

    await expect(loadPracticePersistenceSnapshot("user-1")).resolves.toEqual({
      mistakes: [
        {
          id: "q1",
          lessonId: "lesson-1",
          timestamp: nowMs - 1000,
          questionType: "multiple_choice",
          box: 1,
          nextReviewDate: nowMs,
          interval: 0,
        },
      ],
      reviewEvents: [
        {
          userId: "user-1",
          itemId: "q1",
          lessonId: "lesson-1",
          ts: nowMs - 1000,
          result: "correct",
          beta: undefined,
          dueAt: undefined,
          latencyMs: undefined,
          p: undefined,
          tags: undefined,
        },
      ],
      lessonSessions: [],
      supportSurfaceHistory: [],
      masteryThemeStates: [],
    });
  });

  test("returns empty defaults and warns when stored payloads are invalid", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockLoadUserEntries.mockResolvedValueOnce({
      mistakes: "{invalid",
      reviewEvents: "{invalid",
    });

    await expect(loadPracticePersistenceSnapshot("user-1")).resolves.toEqual({
      mistakes: [],
      reviewEvents: [],
      lessonSessions: [],
      supportSurfaceHistory: [],
      masteryThemeStates: [],
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  test("normalizes mastery theme states and reevaluates graduation fields", async () => {
    mockLoadUserEntries.mockResolvedValueOnce({
      masteryThemeStates: JSON.stringify([
        {
          themeId: "mental",
          parentUnitId: "mental",
          maxActiveSlots: 2,
          activeVariantIds: ["m1", "m2"],
          retiredVariantIds: ["m0"],
          sceneIdsCleared: ["mental_l01", "mental_l02", "mental_l03"],
          attemptCount: 4,
          transferImprovement: false,
          repeatWithoutDropoff: true,
          newLearningValueDelta: 0.8,
          transferGainSlope: 0.2,
          repetitionRisk: 0.2,
        },
      ]),
    });

    const snapshot = await loadPracticePersistenceSnapshot("user-1");
    expect(snapshot.masteryThemeStates).toEqual([
      expect.objectContaining({
        themeId: "mental",
        maxActiveSlots: 2,
        scenesClearedCount: 3,
        graduationState: "graduated",
        masteryCeilingState: "open",
      }),
    ]);
  });

  test("normalizes support lifecycle state metadata", async () => {
    const nowMs = Date.UTC(2026, 3, 22, 0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(nowMs);
    mockLoadUserEntries.mockResolvedValueOnce({
      supportSurfaceHistory: JSON.stringify([
        {
          lessonId: "mental_l02",
          kind: "return",
          reason: "abandonment",
          signalConfidence: "medium",
          lifecycleState: "started",
          ts: nowMs - 1000,
          startedAt: nowMs - 500,
        },
      ]),
    });

    const snapshot = await loadPracticePersistenceSnapshot("user-1");
    expect(snapshot.supportSurfaceHistory).toEqual([
      expect.objectContaining({
        lessonId: "mental_l02",
        lifecycleState: "started",
        startedAt: nowMs - 500,
      }),
    ]);
  });

  test("persistPracticeJsonState keeps the existing storage call shape", async () => {
    await expect(
      persistPracticeJsonState("user-1", "mistakes", [])
    ).resolves.toBeUndefined();

    expect(mockPersistJson).toHaveBeenCalledWith("user-1:mistakes", []);
  });
});
