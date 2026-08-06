import mentalManifestJson from "../../data/courses/mental.manifest.json";
import {
  courseManifestHasLessonId,
  getCourseCoreLessonIds,
  getCourseManifest,
  isLessonIdAdmittedByCourseManifest,
  validateCourseManifest,
} from "../../lib/courseManifestRuntime";
import type { CourseManifest } from "../../types/courseManifest";

function cloneManifest(): CourseManifest {
  return JSON.parse(JSON.stringify(mentalManifestJson)) as CourseManifest;
}

describe("course manifest", () => {
  test("loads the mental pilot with a stable core order", () => {
    const manifest = getCourseManifest("mental");

    expect(manifest?.curriculum_version).toBe("mental-v1.1.0");
    expect(manifest && getCourseCoreLessonIds(manifest)).toEqual([
      "mental_l01",
      "mental_l03",
    ]);
    expect(manifest && courseManifestHasLessonId(manifest, "mental_l03")).toBe(true);
    expect(manifest && courseManifestHasLessonId(manifest, "mental_l02")).toBe(false);
    expect(isLessonIdAdmittedByCourseManifest("mental_l03")).toBe(true);
    expect(isLessonIdAdmittedByCourseManifest("mental_lesson_3")).toBe(true);
    expect(isLessonIdAdmittedByCourseManifest("mental_l02")).toBe(false);
    expect(isLessonIdAdmittedByCourseManifest("mental_m01")).toBe(false);
  });

  test("rejects duplicate ids and broken references", () => {
    const manifest = cloneManifest();
    manifest.skills.push({ ...manifest.skills[0] });
    manifest.lessons[0].unit_id = "missing_unit";

    const result = validateCourseManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "duplicate skill_id: mental_calibrate_intuition",
        "lesson mental_l01 references unknown unit missing_unit",
      ])
    );
  });

  test("rejects dependency cycles", () => {
    const manifest = cloneManifest();
    manifest.units[0].prerequisite_unit_ids = [manifest.units[1].unit_id];

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
