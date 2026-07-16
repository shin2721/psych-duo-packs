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

  test("keeps every authored step in order for support pacing", () => {
    const bundle = loadMentalLesson02(0.4, 0.1);

    expect(bundle.pacing.mode).toBe("authored");
    expect(bundle.pacing.questionCount).toBe(8);
    expect(bundle.effectiveQuestions.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
      "mental_l02_006",
      "mental_l02_007",
      "mental_l02_008",
    ]);
  });

  test("keeps the same authored sequence for stretch pacing", () => {
    const supportBundle = loadMentalLesson02(0.4, 0.1);
    const stretchBundle = loadMentalLesson02(0.9, 0.5);

    expect(stretchBundle.pacing.mode).toBe("authored");
    expect(stretchBundle.effectiveQuestions.map((question) => question.id)).toEqual(
      supportBundle.effectiveQuestions.map((question) => question.id)
    );
  });
});
