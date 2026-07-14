import mentalManifestJson from "../../data/courses/mental.manifest.json";
import {
  getCourseCoreLessonIds,
  getCourseManifest,
  validateCourseManifest,
} from "../../lib/courseManifestRuntime";
import type { CourseManifest } from "../../types/courseManifest";

function cloneManifest(): CourseManifest {
  return JSON.parse(JSON.stringify(mentalManifestJson)) as CourseManifest;
}

describe("course manifest", () => {
  test("loads the mental pilot with a stable core order", () => {
    const manifest = getCourseManifest("mental");

    expect(manifest?.curriculum_version).toBe("mental-v1.0.0");
    expect(manifest && getCourseCoreLessonIds(manifest)).toEqual([
      "mental_l01",
      "mental_l02",
      "mental_l03",
      "mental_l04",
      "mental_l05",
      "mental_l06",
    ]);
  });

  test("rejects duplicate ids and broken references", () => {
    const manifest = cloneManifest();
    manifest.skills.push({ ...manifest.skills[0] });
    manifest.lessons[0].unit_id = "missing_unit";

    const result = validateCourseManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "duplicate skill_id: mental_separate_signal_story",
        "lesson mental_l01 references unknown unit missing_unit",
      ])
    );
  });

  test("rejects dependency cycles", () => {
    const manifest = cloneManifest();
    manifest.units[0].prerequisite_unit_ids = [manifest.units[2].unit_id];

    const result = validateCourseManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.startsWith("unit dependency cycle:"))).toBe(true);
  });

  test("rejects lessons missing from runtime inventory", () => {
    const manifest = cloneManifest();
    const inventory = new Set(manifest.lessons.slice(1).map((lesson) => lesson.lesson_id));

    const result = validateCourseManifest(manifest, inventory);

    expect(result.errors).toContain("lesson mental_l01 is missing from runtime inventory");
  });
});
