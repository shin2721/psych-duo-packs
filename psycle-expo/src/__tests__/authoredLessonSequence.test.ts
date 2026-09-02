import i18n from "../../lib/i18n";
import { loadLessonBundle } from "../../lib/lesson/loadLessonBundle";
import { getMentalDataForLocale } from "../../data/lessons/mental_units";
import localeConfig from "../../config/locales.json";

// A locale the product does not offer at all: inactive by definition, so this
// test keeps its meaning when a generated locale is activated later.
const INACTIVE_LOCALE = localeConfig.targets.find((locale) => !localeConfig.active.includes(locale)) ?? "zz";

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

  test("keeps every authored step in order for support pacing", () => {
    const bundle = loadMentalLesson02(0.4, 0.1);

    expect(bundle.pacing.mode).toBe("authored");
    expect(bundle.pacing.questionCount).toBe(5);
    expect(bundle.effectiveQuestions.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
    ]);
    expect(bundle.effectiveQuestions[1]?.feedback_prompt).toBe(
      "「寝る前」で切ると、効果は消える。"
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

  test("serves the ja source, with its authored metadata, to a locale that is not active", () => {
    // Locale policy (config/locales.json): ja is the source; other locales are
    // generated later and only wired once active. Until then every locale reads
    // the ja lesson data, and the metadata authored for that ja lesson still
    // applies (locale_scope is resolved against the locale actually served).
    expect(getMentalDataForLocale(INACTIVE_LOCALE)).toBe(getMentalDataForLocale("ja"));

    const jaBundle = loadMentalLesson02(0.7, 0.1);
    i18n.locale = INACTIVE_LOCALE;
    try {
      const bundle = loadMentalLesson02(0.7, 0.1);
      expect(bundle.pacing.mode).toBe("authored");
      expect(bundle.lesson.metadata).toBeDefined();
      expect(bundle.effectiveQuestions.map((question) => question.id)).toEqual(
        jaBundle.effectiveQuestions.map((question) => question.id)
      );
    } finally {
      i18n.locale = "ja";
    }
  });
});
