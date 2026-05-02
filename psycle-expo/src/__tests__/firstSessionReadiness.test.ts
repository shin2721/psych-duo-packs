import { existsSync, readFileSync } from "fs";
import entitlements from "../../config/entitlements.json";
import { genres } from "../../lib/data";
import { loadLessons } from "../../lib/lessons";
import { getFirstLessonTargetForGenre } from "../../lib/onboardingSelection";

type LessonDefaultsConfig = {
  defaults?: {
    first_session_lesson_size?: number;
  };
};

const firstSessionLessonSize = (entitlements as LessonDefaultsConfig).defaults?.first_session_lesson_size ?? 5;

describe("first-session lesson readiness", () => {
  test("every onboarding genre has a short, evidence-backed first lesson target", () => {
    for (const genre of genres) {
      const target = getFirstLessonTargetForGenre(genre.id);
      const lessons = loadLessons(target.genreId);
      const firstLesson = lessons.find((lesson) => lesson.level === 1 && lesson.nodeType === "lesson");

      expect(firstLesson).toBeDefined();
      expect(firstLesson?.questions.length).toBeGreaterThanOrEqual(firstSessionLessonSize);
      expect(firstLesson?.nodeType === "lesson" || !firstLesson?.nodeType).toBe(true);
      expect(existsSync(`${process.cwd()}/data/lessons/${target.genreId}_units/${target.lessonFile}.evidence.json`)).toBe(true);
      expect(existsSync(`${process.cwd()}/data/lessons/${target.genreId}_units/${target.lessonFile}.continuity.json`)).toBe(true);
    }
  });

  test("onboarding genre selection is connected to first course activation", () => {
    const onboardingScreen = readFileSync(`${process.cwd()}/app/onboarding/interests.tsx`, "utf8");
    const courseScreen = readFileSync(`${process.cwd()}/app/(tabs)/course.tsx`, "utf8");

    expect(onboardingScreen).toContain("setSelectedGenre(primaryGenreId)");
    expect(onboardingScreen).toContain("onboarding_first_lesson_targeted");
    expect(courseScreen).toContain("loadPrimaryOnboardingGenre");
    expect(courseScreen).toContain("getOnboardingPrimaryGenreToApply");
    expect(courseScreen).toContain("onboarding_primary_genre_applied");
  });
});
