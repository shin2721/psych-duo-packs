import { buildCourseTrailInventory } from "../../lib/courseTrail";
import { getCourseCoreLessonIds, getCourseManifest } from "../../lib/courseManifestRuntime";
import { genres } from "../../lib/data";
import { loadLessons } from "../../lib/lessons";

describe("course trail inventory", () => {
  test.each(genres.map((genre) => genre.id))(
    "%s uses only real core and review lessons",
    (genreId) => {
      const trail = buildCourseTrailInventory(genreId);
      const lessons = loadLessons(genreId);
      const manifest = getCourseManifest(genreId);
      const expectedLessonFiles = manifest
        ? getCourseCoreLessonIds(manifest)
        : lessons
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

  test("mental follows its versioned manifest and keeps review off the core path", () => {
    const trail = buildCourseTrailInventory("mental");

    expect(trail.map((node) => node.lessonFile)).toEqual([
      "mental_l01",
      "mental_l02",
      "mental_l03",
      "mental_l04",
      "mental_l05",
      "mental_l06",
    ]);
    expect(trail.every((node) => node.type === "lesson")).toBe(true);
  });
});
