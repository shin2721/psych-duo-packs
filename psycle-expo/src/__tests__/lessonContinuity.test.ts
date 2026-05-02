import {
  getUnitFromAnyLessonId,
  lessonSetHasResolvedId,
  resolveLessonIdWithContinuities,
} from "../../lib/lessonContinuity";
import type { LessonContinuityMetadata } from "../../types/lessonContinuity";

function buildContinuity(
  overrides: Partial<LessonContinuityMetadata> = {}
): LessonContinuityMetadata {
  return {
    schema_version: 1,
    lesson_id: "mental_l03",
    theme_id: "mental",
    continuity_mode: "replace",
    decision_basis: "single_predecessor_primary_route_migration",
    continuity_route: "continue_to_replacement",
    predecessor_lesson_ids: ["mental_l02"],
    history_migration_rule: "migrate_completion_if_equivalent",
    support_redirect_rule: "redirect_support_to_replacement",
    analytics_continuity_rule: "join_predecessor_and_replacement",
    deprecation: {
      deprecation_start_at: "2026-04-22",
      compatibility_window_days: 30,
      cleanup_due_at: "2026-05-22",
      migration_complete_condition: "legacy_users_redirected",
    },
    aftercare: {
      required: true,
      aftercare_window_days: 30,
      legacy_candidate_suppression_rule: "suppress_predecessor_candidates",
      in_flight_user_route: "resume_on_replacement",
      stale_mastery_cleanup_rule: "close_stale_predecessor_mastery",
      legacy_vs_replacement_analytics_window: 14,
    },
    ...overrides,
  };
}

describe("lessonContinuity", () => {
  test("resolves predecessor lesson ids to the replacement lesson", () => {
    const result = resolveLessonIdWithContinuities("mental_l02", [buildContinuity()]);

    expect(result).toEqual({
      requestedLessonId: "mental_l02",
      resolvedLessonId: "mental_l03",
      redirected: true,
      continuity: buildContinuity(),
    });
  });

  test("returns null for retired lessons without a runtime route", () => {
    const retirement = buildContinuity({
      lesson_id: "mental_l02",
      continuity_mode: "retire",
      decision_basis: "lesson_removed_without_direct_successor",
      continuity_route: "restart",
      predecessor_lesson_ids: [],
    });

    const result = resolveLessonIdWithContinuities("mental_l02", [retirement]);

    expect(result).toEqual({
      requestedLessonId: "mental_l02",
      resolvedLessonId: null,
      redirected: true,
      continuity: retirement,
    });
  });

  test("keeps active lesson ids unchanged when they already point at the current lesson", () => {
    const continuity = buildContinuity();
    const result = resolveLessonIdWithContinuities("mental_l03", [continuity]);

    expect(result).toEqual({
      requestedLessonId: "mental_l03",
      resolvedLessonId: "mental_l03",
      redirected: false,
      continuity,
    });
  });

  test("extracts unit ids from lesson, mastery, and legacy lesson ids", () => {
    expect(getUnitFromAnyLessonId("mental_l03")).toBe("mental");
    expect(getUnitFromAnyLessonId("mental_m01")).toBe("mental");
    expect(getUnitFromAnyLessonId("mental_lesson_3")).toBe("mental");
  });

  test("matches completed lesson sets using resolved lesson ids", () => {
    const completedLessons = new Set(["mental_l03"]);

    expect(lessonSetHasResolvedId(completedLessons, "mental_l03")).toBe(true);
    expect(lessonSetHasResolvedId(completedLessons, "mental_l02")).toBe(false);
  });
});
