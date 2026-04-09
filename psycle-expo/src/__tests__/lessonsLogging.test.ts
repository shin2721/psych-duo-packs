describe("loadLessons logging policy", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (global as { __DEV__?: boolean }).__DEV__ = true;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock("../../lib/i18n");
    jest.dontMock("../../data/lessons/mental_units");
    jest.dontMock("../../data/lessons/money_units");
    jest.dontMock("../../data/lessons/work_units");
    jest.dontMock("../../data/lessons/health_units");
    jest.dontMock("../../data/lessons/social_units");
    jest.dontMock("../../data/lessons/study_units");
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  function loadLessonsModule(rawQuestions: unknown[], options?: { throwOnMentalLoad?: boolean }) {
    jest.doMock("../../lib/i18n", () => ({
      __esModule: true,
      default: {
        locale: "ja",
      },
    }));

    jest.doMock("../../data/lessons/mental_units", () => ({
      getMentalDataForLocale: () => {
        if (options?.throwOnMentalLoad) {
          throw new Error("boom");
        }
        return { questions: rawQuestions };
      },
    }));

    const emptyDataModule = { questions: [] };
    jest.doMock("../../data/lessons/money_units", () => ({
      getMoneyDataForLocale: () => emptyDataModule,
    }));
    jest.doMock("../../data/lessons/work_units", () => ({
      getWorkDataForLocale: () => emptyDataModule,
    }));
    jest.doMock("../../data/lessons/health_units", () => ({
      getHealthDataForLocale: () => emptyDataModule,
    }));
    jest.doMock("../../data/lessons/social_units", () => ({
      getSocialDataForLocale: () => emptyDataModule,
    }));
    jest.doMock("../../data/lessons/study_units", () => ({
      getStudyDataForLocale: () => emptyDataModule,
    }));

    let lessonsModule!: typeof import("../../lib/lessons");
    jest.isolateModules(() => {
      lessonsModule = require("../../lib/lessons");
    });
    return lessonsModule;
  }

  test("emits a single summary warning without item-level debug logs", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { loadLessons } = loadLessonsModule([
      null,
      {
        id: "mental_l01_001",
        type: "mcq3",
        question: "Question 1",
        choices: ["A", "B"],
        correct_index: 0,
      },
      {
        id: "mental_l01_001",
        type: "mcq3",
        question: "Question 1 duplicate",
        choices: ["A", "B"],
        correct_index: 1,
      },
      {
        id: "mental_l01_003",
        type: "mcq3",
        choices: ["A", "B"],
        correct_index: 0,
      },
      {
        id: "mental_l02_001",
        type: "mcq3",
        question: "Question 2",
        choices: ["A", "B"],
        correct_index: 0,
      },
      {
        id: "mental_l02_002",
        type: "mcq3",
        question: "Question 3",
        choices: ["A", "B"],
        correct_index: 1,
      },
    ]);

    const lessons = loadLessons("mental");

    expect(lessons.length).toBeGreaterThan(0);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[loadLessons] mental data anomalies",
      expect.objectContaining({
        duplicateQuestionIds: 1,
        fallbackQuestionsFilled: expect.any(Number),
        invalidEntriesSkipped: 1,
        requiredFieldFallbacks: 1,
      })
    );
  });

  test("returns an empty array and logs only the fatal load failure", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { loadLessons } = loadLessonsModule([], { throwOnMentalLoad: true });

    expect(loadLessons("mental")).toEqual([]);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load lessons for unit mental:",
      expect.any(Error)
    );
  });
});
