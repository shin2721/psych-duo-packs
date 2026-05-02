import { resolveLessonRuntimeAccess } from "../../lib/lessonOperational";
import * as lessonsModule from "../../lib/lessons";
import type { LessonContinuityMetadata } from "../../types/lessonContinuity";
import type { LessonOperationalMetadata, RuntimeThemeManifest } from "../../types/lessonOperational";

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
      in_flight_user_route: "restart",
      stale_mastery_cleanup_rule: "close_stale_predecessor_mastery",
      legacy_vs_replacement_analytics_window: 14,
      fallback_user_route: "return_then_rejoin",
    },
    ...overrides,
  };
}

function buildOperational(
  overrides: Partial<LessonOperationalMetadata> = {}
): LessonOperationalMetadata {
  return {
    severity_tier: "B",
    next_review_due_at: "2026-07-21",
    content_package: {
      state: "production",
    },
    ...overrides,
  };
}

function buildThemeManifest(
  overrides: Partial<RuntimeThemeManifest> = {}
): RuntimeThemeManifest {
  return {
    theme_id: "mental",
    theme_status: "active",
    rollout_stage: "production_default",
    last_reviewed_at: "2026-04-22",
    review_cycle_days: 90,
    ...overrides,
  };
}

describe("resolveLessonRuntimeAccess", () => {
  const nowMs = Date.UTC(2026, 3, 22, 0, 0, 0);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("prioritizes killed package over retired continuity", () => {
    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l02",
      nowMs,
      continuities: [
        buildContinuity({
          lesson_id: "mental_l02",
          continuity_mode: "retire",
          decision_basis: "lesson_removed_without_direct_successor",
          continuity_route: "restart",
          predecessor_lesson_ids: [],
        }),
      ],
      requestedLessonOperational: buildOperational({
        content_package: {
          state: "killed",
        },
      }),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("package_killed");
  });

  test("returns retired continuity when no higher-priority block exists", () => {
    const retirement = buildContinuity({
      lesson_id: "mental_l02",
      continuity_mode: "retire",
      decision_basis: "lesson_removed_without_direct_successor",
      continuity_route: "restart",
      predecessor_lesson_ids: [],
    });

    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l02",
      nowMs,
      continuities: [retirement],
      requestedLessonOperational: buildOperational(),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("continuity_retired");
  });

  test("prioritizes inactive theme over stale Tier A block", () => {
    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l03",
      nowMs,
      lessonOperational: buildOperational({
        severity_tier: "A",
        next_review_due_at: "2026-04-01",
      }),
      themeManifest: buildThemeManifest({
        theme_status: "deprecated",
      }),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("theme_not_active");
  });

  test("blocks runtime access when prerequisite themes are unmet", () => {
    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l03",
      nowMs,
      lessonOperational: buildOperational(),
      themeManifest: buildThemeManifest({
        prerequisite_themes: ["money"],
      }),
      completedThemeIds: [],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("dependency_unmet");
  });

  test("blocks runtime access when a required package is not production-ready", () => {
    const getLessonOperationalMetadataSpy = jest
      .spyOn(lessonsModule, "getLessonOperationalMetadata")
      .mockImplementation((lessonId: string) => {
        if (lessonId === "mental_l03") {
          return buildOperational({
            content_package: {
              state: "production",
              package_dependencies: {
                requires_package_ids: ["money_l01"],
                dependency_rule: "all_required_packages_must_be_runtime_accessible",
                invalidation_rule: "dependency_change_requires_revalidation",
              },
            },
          });
        }

        if (lessonId === "money_l01") {
          return buildOperational({
            content_package: {
              state: "deprecated",
            },
          });
        }

        return null;
      });

    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l03",
      nowMs,
      completedThemeIds: ["money"],
    });

    expect(getLessonOperationalMetadataSpy).toHaveBeenCalledWith("money_l01");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("dependency_unmet");
  });

  test("blocks stale Tier A package when no higher-priority rule applies", () => {
    const result = resolveLessonRuntimeAccess({
      lessonId: "mental_l03",
      nowMs,
      lessonOperational: buildOperational({
        severity_tier: "A",
        next_review_due_at: "2026-04-01",
      }),
      themeManifest: buildThemeManifest(),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("tier_a_stale");
  });
});
