function loadPersonalizationModule(options: {
  lessonsCompleted7d?: number;
  loadShouldFail?: boolean;
  assignment?: {
    shouldAssign: boolean;
    segmentChanged: boolean;
    nextSegment: "new" | "active" | "at_risk" | "power";
    daysSinceStudy: number;
  };
}) {
  jest.resetModules();
  const loadLessonsCompleted7d = jest.fn();
  const derivePersonalizationAssignment = jest.fn();
  const getDateDaysAgo = jest.fn(() => "2026-04-01");

  if (options.loadShouldFail) {
    loadLessonsCompleted7d.mockRejectedValue(new Error("fail"));
  } else {
    loadLessonsCompleted7d.mockResolvedValue(options.lessonsCompleted7d ?? 0);
  }

  derivePersonalizationAssignment.mockReturnValue(
    options.assignment ?? {
      shouldAssign: true,
      segmentChanged: true,
      nextSegment: "active",
      daysSinceStudy: 2,
    }
  );

  let module: typeof import("../../lib/app-state/progression/progressionPersonalization");
  jest.doMock("../../lib/app-state/progressionRemote", () => ({
    loadLessonsCompleted7d,
  }));
  jest.doMock("../../lib/app-state/progressionLiveOps", () => ({
    derivePersonalizationAssignment,
    getDateDaysAgo,
  }));

  jest.isolateModules(() => {
    module = require("../../lib/app-state/progression/progressionPersonalization");
  });

  return { module: module!, loadLessonsCompleted7d, derivePersonalizationAssignment, getDateDaysAgo };
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock("../../lib/app-state/progressionRemote");
  jest.dontMock("../../lib/app-state/progressionLiveOps");
});

describe("progressionPersonalization", () => {
  test("assigns segment from 7d lesson load", async () => {
    const { module, loadLessonsCompleted7d, derivePersonalizationAssignment, getDateDaysAgo } =
      loadPersonalizationModule({ lessonsCompleted7d: 12 });

    const result = await module.assignPersonalizationSegment({
      userId: "user-1",
      enabled: true,
      cooldownHours: 24,
      currentSegment: "new",
      lastActivityDate: "2026-04-06",
      lastAssignedAtMs: null,
      streak: 5,
      nowMs: 123,
    });

    expect(loadLessonsCompleted7d).toHaveBeenCalledWith("user-1", "2026-04-01");
    expect(getDateDaysAgo).toHaveBeenCalledWith(6);
    expect(derivePersonalizationAssignment).toHaveBeenCalled();
    expect(result).toMatchObject({
      shouldAssign: true,
      segmentChanged: true,
      nextSegment: "active",
      lessonsCompleted7d: 12,
      nextAssignedAtMs: 123,
      loadFailed: false,
    });
  });

  test("load failure falls back without throwing", async () => {
    const { module } = loadPersonalizationModule({
      loadShouldFail: true,
      assignment: {
        shouldAssign: false,
        segmentChanged: false,
        nextSegment: "new",
        daysSinceStudy: 0,
      },
    });

    const result = await module.assignPersonalizationSegment({
      userId: "user-1",
      enabled: true,
      cooldownHours: 24,
      currentSegment: "new",
      lastActivityDate: null,
      lastAssignedAtMs: null,
      streak: 0,
    });

    expect(result.loadFailed).toBe(true);
    expect(result.lessonsCompleted7d).toBe(0);
  });
});
