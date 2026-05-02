const {
  createNetNewContinuityMetadata,
  validateContinuityMetadata,
} = require("../../scripts/lib/continuity-metadata.js");

describe("continuity metadata validation", () => {
  test("passes for a valid net-new continuity record", () => {
    const metadata = createNetNewContinuityMetadata({
      lessonId: "mental_l01",
      themeId: "mental",
      aftercareDefaults: {
        aftercare_window_days: 30,
        legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
      },
    });

    const result = validateContinuityMetadata(metadata, {
      expectedLessonId: "mental_l01",
      expectedThemeId: "mental",
    });

    expect(result.errors).toHaveLength(0);
  });

  test("fails when replace continuity omits predecessor lessons", () => {
    const result = validateContinuityMetadata(
      {
        schema_version: 1,
        lesson_id: "mental_l02",
        theme_id: "mental",
        continuity_mode: "replace",
        decision_basis: "single_predecessor_primary_route_migration",
        continuity_route: "continue_to_replacement",
        predecessor_lesson_ids: [],
        history_migration_rule: "move_completed_users",
        support_redirect_rule: "redirect_support_to_replacement",
        analytics_continuity_rule: "merge_old_and_new_lesson_metrics",
        deprecation: {
          deprecation_start_at: "2026-04-22",
          compatibility_window_days: 30,
          cleanup_due_at: "2026-05-22",
          migration_complete_condition: "legacy_users_redirected",
        },
        aftercare: {
          required: true,
          aftercare_window_days: 30,
          legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
          in_flight_user_route: "continue_to_replacement",
          stale_mastery_cleanup_rule: "retire_stale_mastery_variants",
          legacy_vs_replacement_analytics_window: 30,
        },
      },
      {
        expectedLessonId: "mental_l02",
        expectedThemeId: "mental",
      }
    );

    expect(result.errors).toContain("replace continuity は predecessor_lesson_ids が必要です");
    expect(result.errors).toContain("replace continuity は predecessor_lesson_ids が1件必要です");
  });

  test("fails when merge continuity has only one predecessor", () => {
    const result = validateContinuityMetadata(
      {
        schema_version: 1,
        lesson_id: "mental_l03",
        theme_id: "mental",
        continuity_mode: "merge",
        decision_basis: "two_legacy_lessons_fold_into_one",
        continuity_route: "continue_to_replacement",
        predecessor_lesson_ids: ["mental_l01"],
        history_migration_rule: "merge_completed_users",
        support_redirect_rule: "redirect_support_to_replacement",
        analytics_continuity_rule: "merge_old_and_new_lesson_metrics",
        deprecation: {
          deprecation_start_at: "2026-04-22",
          compatibility_window_days: 30,
          cleanup_due_at: "2026-05-22",
          migration_complete_condition: "all_predecessors_redirected",
        },
        aftercare: {
          required: true,
          aftercare_window_days: 30,
          legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
          in_flight_user_route: "continue_to_replacement",
          stale_mastery_cleanup_rule: "retire_stale_mastery_variants",
          legacy_vs_replacement_analytics_window: 30,
        },
      },
      {
        expectedLessonId: "mental_l03",
        expectedThemeId: "mental",
      }
    );

    expect(result.errors).toContain("merge continuity は predecessor_lesson_ids が2件以上必要です");
  });

  test("fails when retire continuity omits fallback route", () => {
    const result = validateContinuityMetadata(
      {
        schema_version: 1,
        lesson_id: "mental_l04",
        theme_id: "mental",
        continuity_mode: "retire",
        decision_basis: "lesson_removed_without_direct_successor",
        continuity_route: "restart",
        predecessor_lesson_ids: ["mental_l04"],
        history_migration_rule: "no_history_migration",
        support_redirect_rule: "redirect_support_to_theme_entry",
        analytics_continuity_rule: "track_retirement_separately",
        deprecation: {
          deprecation_start_at: "2026-04-22",
          compatibility_window_days: 30,
          cleanup_due_at: "2026-05-22",
          migration_complete_condition: "fallback_route_live",
        },
        aftercare: {
          required: true,
          aftercare_window_days: 30,
          legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
          in_flight_user_route: "restart",
          stale_mastery_cleanup_rule: "retire_stale_mastery_variants",
          legacy_vs_replacement_analytics_window: 30,
        },
      },
      {
        expectedLessonId: "mental_l04",
        expectedThemeId: "mental",
      }
    );

    expect(result.errors).toContain("retire continuity は aftercare.fallback_user_route が必要です");
  });
});
