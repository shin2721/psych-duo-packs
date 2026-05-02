import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const { evaluateContentPackageReadiness } = require("../../scripts/lib/content-package.js");

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), "psycle-content-package-"));
}

function makeManifest(themeId: string) {
  return {
    schema_version: 1,
    theme_id: themeId,
    owner: "content-ops",
    last_reviewed_at: "2026-04-22",
    review_cycle_days: 90,
    rollout_stage: "production_default",
    saturation_state: "growing",
    theme_status: "active",
    migration_rule: "manual_v1_migration",
    backward_compat_window_days: 30,
    prerequisite_themes: [],
    prerequisite_skills: [],
    unlock_conditions: ["core_path_available"],
    dependency_bypass_rules: ["none"],
    replacement_aftercare_defaults: {
      aftercare_window_days: 30,
      legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
    },
    support_policy: {
      weekly_support_budget: 3,
      same_kind_cooldown_days: 2,
      same_theme_cooldown_days: 4,
      same_lesson_cooldown_days: 7,
      thresholds: {
        path_start_guardrail: 0.92,
        path_completion_guardrail: 0.9,
        support_repeat_cap: 0.35,
        support_only_progress_cap: 0.25,
        support_start_rate_floor: 0.18,
      },
      threshold_actions: {
        path_start_guardrail: [
          "reduce_support_surfacing",
          "lower_current_theme_support_priority",
        ],
        path_completion_guardrail: [
          "tighten_weekly_support_budget",
          "suppress_non_return_resurfacing",
        ],
        support_repeat_cap: ["extend_cooldown", "suppress_low_confidence_support"],
        support_only_progress_cap: [
          "review_reward_progression_coupling",
          "force_path_first_cta",
        ],
        support_start_rate_floor: ["demote_noisy_support_kind", "review_trigger_or_copy"],
      },
    },
    metric_ownership: {
      metric_owner: "analytics",
      review_cadence_days: 14,
      change_authority: "product_analytics_review",
      threshold_change_log: ["bootstrap_v1_thresholds_2026-04-22"],
    },
  };
}

function makeLesson() {
  return [
    {
      id: "mental_l01_001",
      type: "multiple_choice",
      question: "q1",
      explanation: "e1",
      difficulty: "easy",
      xp: 5,
      evidence_grade: "silver",
    },
  ];
}

function makeEvidence(contentPackage?: Record<string, unknown>) {
  return {
    source_type: "peer_reviewed",
    citation: { doi: "10.1234/example" },
    claim: "claim",
    limitations: "limits",
    evidence_grade: "silver",
    severity_tier: "B",
    generated_by: "test",
    review_sla_days: 90,
    expiry_action: "refresh_queue",
    last_verified_at: "2026-04-22",
    next_review_due_at: "2026-07-21",
    stale_route_owner: "content_ops",
    refresh_value_reason_candidate: "evidence_strength_update",
    review: { auto_approved: true },
    promotion: { eligible: true },
    ...(contentPackage ? { content_package: contentPackage } : {}),
  };
}

function makeCompleteness() {
  return {
    localized_copy_ready: true,
    analytics_contract_named: true,
    rollback_route_present: true,
    owner_assigned: true,
    readiness_authority_complete: true,
  };
}

function makeReviewDecision(
  overrides: Record<string, unknown> = {}
) {
  return {
    change_type: "content_patch",
    human_review_required: false,
    approved_source: "deterministic_validator",
    review_reason: "autonomous_default_content_package_gate",
    reviewed_at: "2026-04-22T00:00:00.000Z",
    rollback_trigger_if_reverted: "guardrail_or_contract_regression",
    ...overrides,
  };
}

function makeLocalizationFields() {
  return {
    localization_owner: "content_ops",
    approval_locale_set: ["ja"],
    semantic_parity_rule: "claim_strength_and_safety_must_match_across_locales",
    tone_guard: "no_shame_no_threat_better_choice_tone",
    analytics_contract_version: 1,
    analytics_schema_lineage: "content.lesson.mental.base",
    analytics_backward_compat_until: "2026-10-19",
    package_dependencies: {
      requires_package_ids: [],
      dependency_rule: "no_additional_package_dependency",
      invalidation_rule: "dependency_change_requires_revalidation",
    },
  };
}

function makeReadinessAuthority() {
  return {
    quality_gate_pass: {
      owner: "content_ops",
      auto_source: "deterministic_validator",
      final_authority: "human_review_or_approved_source",
    },
    dependency_valid: {
      owner: "runtime",
      auto_source: "theme_manifest_validator",
      final_authority: "approved_bypass_only",
    },
    continuity_complete: {
      owner: "content_ops",
      auto_source: "continuity_aftercare_validator",
      final_authority: "redirect_and_analytics_continuity_complete",
    },
    analytics_wired: {
      owner: "analytics",
      auto_source: "analytics_contract_checker",
      final_authority: "continuity_events_verified",
    },
    rollback_defined: {
      owner: "content_ops",
      auto_source: "rollback_metadata_checker",
      final_authority: "rollback_route_and_owner_present",
    },
  };
}

function makeNetNewContinuityMetadata(themeId: string, lessonId: string) {
  return {
    schema_version: 1,
    lesson_id: lessonId,
    theme_id: themeId,
    continuity_mode: "net_new",
    decision_basis: "no_predecessor_or_migration_duty",
    continuity_route: "start_here",
    predecessor_lesson_ids: [],
    history_migration_rule: "no_migration_required_for_net_new",
    support_redirect_rule: "no_legacy_support_redirect_required",
    analytics_continuity_rule: "track_as_new_lesson_package",
    aftercare: {
      required: false,
      aftercare_window_days: 30,
      legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
      in_flight_user_route: "start_here",
      stale_mastery_cleanup_rule: "not_applicable",
      legacy_vs_replacement_analytics_window: 0,
    },
  };
}

function makeRetireContinuityMetadata(themeId: string, lessonId: string) {
  return {
    schema_version: 1,
    lesson_id: lessonId,
    theme_id: themeId,
    continuity_mode: "retire",
    decision_basis: "content_replaced_or_decommissioned",
    continuity_route: "continue_to_replacement",
    predecessor_lesson_ids: ["mental_l00"],
    history_migration_rule: "migrate_legacy_progress_to_replacement",
    support_redirect_rule: "suppress_legacy_support_and_redirect_to_replacement",
    analytics_continuity_rule: "preserve_theme_level_analytics_continuity",
    deprecation: {
      deprecation_start_at: "2026-01-01",
      compatibility_window_days: 14,
      cleanup_due_at: "2026-02-01",
      migration_complete_condition: "all_active_users_rerouted",
    },
    aftercare: {
      required: true,
      aftercare_window_days: 30,
      legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
      in_flight_user_route: "continue_to_replacement",
      fallback_user_route: "return_then_rejoin",
      stale_mastery_cleanup_rule: "retire_stale_mastery_and_reopen_slot",
      legacy_vs_replacement_analytics_window: 30,
    },
  };
}

describe("content package readiness", () => {
  test("warns in audit mode when content_package metadata is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      writeFileSync(join(lessonDir, "mental_l01.ja.json"), JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(lessonDir, "mental_l01.evidence.json"), JSON.stringify(makeEvidence(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));

      const result = evaluateContentPackageReadiness(join(lessonDir, "mental_l01.ja.json"), {
        rootDir,
        mode: "audit",
        warnOnLegacyProduction: true,
      });

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain("content_package metadata がありません");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails in promote mode when readiness metadata is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      writeFileSync(join(lessonDir, "mental_l01.ja.json"), JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(lessonDir, "mental_l01.evidence.json"), JSON.stringify(makeEvidence(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));

      const result = evaluateContentPackageReadiness(join(lessonDir, "mental_l01.ja.json"), {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("content_package metadata がありません");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails in promote mode when continuity metadata path is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      writeFileSync(join(lessonDir, "mental_l01.ja.json"), JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(join(lessonDir, "mental_l01.ja.json"), {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("content_package.continuity_metadata_path が必要です");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("passes in promote mode when content_package metadata is complete", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const evidencePath = join(lessonDir, "mental_l01.evidence.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      const manifestPath = join(themeDir, "mental.meta.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(manifestPath, JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        evidencePath,
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(true);
      expect(result.errors).toHaveLength(0);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when readiness authority metadata is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("content_package.readiness_authority は object である必要があります");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when completeness metadata is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("content_package.completeness は object である必要があります");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when high-assurance change has no rollback trigger metadata", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision({
              change_type: "safety_update",
              rollback_trigger_if_reverted: "",
            }),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain(
        "content_package.review_decision.change_type=safety_update は rollback_trigger_if_reverted が必要です"
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when analytics contract versioning metadata is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      const analyticsFields = makeLocalizationFields();
      delete (analyticsFields as Record<string, unknown>).analytics_contract_version;

      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...analyticsFields,
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain(
        "content_package.analytics_contract_version は 1 以上の整数である必要があります"
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when package state does not match staging lesson path", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "production",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("staging lesson は content_package.state=production にできません");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when localized locales are not fully approved", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja", "en"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain(
        "localized_copy_ready=true の場合は localized_locales が approval_locale_set に含まれている必要があります"
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails in promote mode when deprecated theme tries to create a new production package", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "_staging", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(
        join(themeDir, "mental.meta.json"),
        JSON.stringify({ ...makeManifest("mental"), theme_status: "deprecated" }, null, 2)
      );
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/_staging/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/_staging/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/_staging/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "staging",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "promote",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("theme_status=deprecated の theme に新規 production package を作れません");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when Tier A stale package remains in production", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeNetNewContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          {
            ...makeEvidence({
              lesson_path: "data/lessons/mental_units/mental_l01.ja.json",
              evidence_path: "data/lessons/mental_units/mental_l01.evidence.json",
              theme_manifest_path: "data/themes/mental.meta.json",
              continuity_metadata_path: "data/lessons/mental_units/mental_l01.continuity.json",
              analytics_contract_id: "content.lesson.mental.v1",
              owner_id: "content_ops",
              state: "production",
              rollback_route: "course:mental:entry",
              rollback_class: "soft",
              localized_locales: ["ja"],
              ...makeLocalizationFields(),
              readiness: {
                quality_gate_pass: true,
                dependency_valid: true,
                continuity_complete: true,
                analytics_wired: true,
                rollback_defined: true,
              },
              readiness_authority: makeReadinessAuthority(),
              completeness: makeCompleteness(),
              review_decision: makeReviewDecision(),
            }),
            severity_tier: "A",
            next_review_due_at: "2026-04-01",
          },
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "audit",
        now: "2026-04-22T00:00:00.000Z",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("severity_tier=A かつ stale の package を production に残せません");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("fails when deprecated package passes cleanup_due_at without hard rollback", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      const lessonPath = join(lessonDir, "mental_l01.ja.json");
      const continuityPath = join(lessonDir, "mental_l01.continuity.json");
      writeFileSync(lessonPath, JSON.stringify(makeLesson(), null, 2));
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeManifest("mental"), null, 2));
      writeFileSync(
        continuityPath,
        JSON.stringify(makeRetireContinuityMetadata("mental", "mental_l01"), null, 2)
      );
      writeFileSync(
        join(lessonDir, "mental_l01.evidence.json"),
        JSON.stringify(
          makeEvidence({
            lesson_path: "data/lessons/mental_units/mental_l01.ja.json",
            evidence_path: "data/lessons/mental_units/mental_l01.evidence.json",
            theme_manifest_path: "data/themes/mental.meta.json",
            continuity_metadata_path: "data/lessons/mental_units/mental_l01.continuity.json",
            analytics_contract_id: "content.lesson.mental.v1",
            owner_id: "content_ops",
            state: "deprecated",
            rollback_route: "course:mental:entry",
            rollback_class: "soft",
            localized_locales: ["ja"],
            ...makeLocalizationFields(),
            readiness: {
              quality_gate_pass: true,
              dependency_valid: true,
              continuity_complete: true,
              analytics_wired: true,
              rollback_defined: true,
            },
            readiness_authority: makeReadinessAuthority(),
            completeness: makeCompleteness(),
            review_decision: makeReviewDecision(),
          }),
          null,
          2
        )
      );

      const result = evaluateContentPackageReadiness(lessonPath, {
        rootDir,
        mode: "audit",
        now: "2026-04-22T00:00:00.000Z",
      });

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("cleanup_due_at 超過の deprecated package は rollback_class=hard が必要です");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
