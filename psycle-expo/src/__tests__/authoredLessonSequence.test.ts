import i18n from "../../lib/i18n";
import { loadLessonBundle } from "../../lib/lesson/loadLessonBundle";

describe("authored lesson sequence", () => {
  const originalLocale = i18n.locale;

  beforeAll(() => {
    i18n.locale = "ja";
  });

  afterAll(() => {
    i18n.locale = originalLocale;
  });

  function loadMentalLesson02(recentAccuracy: number, skillConfidence: number) {
    return loadLessonBundle({
      allowStaging: true,
      difficultyPacing: {
        optimalPMax: 0.7,
        optimalPMin: 0.55,
        questionsAnswered: 10,
        recentAccuracy,
        skillConfidence,
      },
      fileParam: "mental_l02",
      firstLessonCompleted: true,
      firstSessionLessonSize: 5,
      lessonSize: 10,
    });
  }

  function loadMentalLesson01(recentAccuracy: number, skillConfidence: number) {
    return loadLessonBundle({
      allowStaging: true,
      difficultyPacing: {
        optimalPMax: 0.7,
        optimalPMin: 0.55,
        questionsAnswered: 0,
        recentAccuracy,
        skillConfidence,
      },
      fileParam: "mental_l01",
      firstLessonCompleted: false,
      firstSessionLessonSize: 5,
      lessonSize: 10,
    });
  }

  test("keeps the rebuilt first lesson at six authored steps", () => {
    const supportBundle = loadMentalLesson01(0.4, 0.1);
    const stretchBundle = loadMentalLesson01(0.9, 0.5);

    expect(supportBundle.pacing.mode).toBe("authored");
    expect(supportBundle.pacing.questionCount).toBe(6);
    expect(supportBundle.effectiveQuestions.map((question) => question.id)).toEqual([
      "mental_l01_001",
      "mental_l01_002",
      "mental_l01_003",
      "mental_l01_004",
      "mental_l01_005",
      "mental_l01_006",
    ]);
    expect(stretchBundle.effectiveQuestions.map((question) => question.id)).toEqual(
      supportBundle.effectiveQuestions.map((question) => question.id)
    );
  });

  test("keeps every authored step in order for support pacing", () => {
    const bundle = loadMentalLesson02(0.4, 0.1);

    expect(bundle.pacing.mode).toBe("authored");
    expect(bundle.pacing.questionCount).toBe(6);
    expect(bundle.effectiveQuestions.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
      "mental_l02_006",
    ]);
    expect(bundle.effectiveQuestions[1]?.feedback_prompt).toBe(
      "録画に残るのはメッセージだけ。ミスや評価は、まだ画面にない意味。"
    );
  });

  test("keeps the same authored sequence for stretch pacing", () => {
    const supportBundle = loadMentalLesson02(0.4, 0.1);
    const stretchBundle = loadMentalLesson02(0.9, 0.5);

    expect(stretchBundle.pacing.mode).toBe("authored");
    expect(stretchBundle.effectiveQuestions.map((question) => question.id)).toEqual(
      supportBundle.effectiveQuestions.map((question) => question.id)
    );
  });

  test("does not apply the Japanese pilot metadata to the legacy English lesson", () => {
    i18n.locale = "en";
    try {
      const bundle = loadMentalLesson02(0.7, 0.1);

      expect(bundle.pacing.mode).toBe("steady");
      expect(bundle.effectiveQuestions).toHaveLength(10);
      expect(bundle.lesson.metadata).toBeUndefined();
    } finally {
      i18n.locale = "ja";
    }
  });

  test("does not apply the Japanese first-lesson pilot metadata to legacy English", () => {
    i18n.locale = "en";
    try {
      const bundle = loadMentalLesson01(0.7, 0.1);

      expect(bundle.pacing.mode).toBe("first_session");
      expect(bundle.effectiveQuestions).toHaveLength(5);
      expect(bundle.lesson.metadata).toBeUndefined();
    } finally {
      i18n.locale = "ja";
    }
  });
});
