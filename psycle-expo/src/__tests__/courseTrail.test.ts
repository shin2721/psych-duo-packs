import { buildCourseTrailInventory } from "../../lib/courseTrail";
import { genres } from "../../lib/data";
import { loadLessons } from "../../lib/lessons";

describe("course trail inventory", () => {
  test.each(genres.map((genre) => genre.id))(
    "%s uses only real core and review lessons",
    (genreId) => {
      const trail = buildCourseTrailInventory(genreId);
      const lessons = loadLessons(genreId);
      const expectedLessonFiles = lessons
        .filter(
          (lesson) =>
            lesson.nodeType === "review_blackhole" ||
            lesson.id.startsWith(`${genreId}_lesson_`)
        )
        .sort((left, right) => left.level - right.level)
        .map((lesson) =>
          lesson.nodeType === "review_blackhole"
            ? lesson.id
            : `${genreId}_l${String(lesson.level).padStart(2, "0")}`
        );

      expect(trail.map((node) => node.lessonFile)).toEqual(expectedLessonFiles);
      expect(trail.some((node) => node.lessonFile.includes("_m"))).toBe(false);
      expect(trail.some((node) => /_l100$/.test(node.lessonFile))).toBe(false);
    }
  );
});
