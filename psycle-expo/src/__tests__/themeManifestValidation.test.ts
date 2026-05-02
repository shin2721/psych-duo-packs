import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { LessonValidator } from "../../scripts/validate-lessons";

const {
  ALLOWED_UNLOCK_CONDITIONS,
  validateThemeManifestData,
  loadThemeManifest,
  evaluateThemeManifestReadiness,
} = require("../../scripts/lib/theme-manifest.js");

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), "psycle-theme-manifest-"));
}

function makeValidManifest(themeId: string) {
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

function makeValidLesson() {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `mental_l01_00${index + 1}`,
    type: "multiple_choice",
    question: `question ${index + 1}`,
    explanation: `explanation ${index + 1}`,
    difficulty: "easy",
    xp: 5,
    evidence_grade: "silver",
    choices: ["a", "b", "c"],
    correct_index: 0,
  }));
}

function makeValidEvidence() {
  return {
    source_type: "peer_reviewed",
    citation: {
      doi: "10.1234/example",
    },
    claim: "example claim",
    limitations: "example limitation",
    evidence_grade: "silver",
    severity_tier: "B",
    review_sla_days: 90,
    expiry_action: "refresh_queue",
    last_verified_at: "2026-04-22",
    next_review_due_at: "2026-07-21",
    stale_route_owner: "content_ops",
    refresh_value_reason_candidate: "evidence_strength_update",
    generated_by: "test",
    review: {
      auto_approved: true,
    },
    promotion: {
      eligible: true,
    },
  };
}

describe("theme manifest validation", () => {
  test("reports missing required manifest fields", () => {
    const errors = validateThemeManifestData("mental", {
      theme_id: "mental",
    });

    expect(errors).toContain("schema_version は 0 以上の number である必要があります");
    expect(errors).toContain("owner は非空文字列である必要があります");
  });

  test("rejects unknown dependency enum values", () => {
    const errors = validateThemeManifestData("mental", {
      ...makeValidManifest("mental"),
      unlock_conditions: [...ALLOWED_UNLOCK_CONDITIONS, "unknown_unlock"],
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining("unlock_conditions は許可値のみ使用できます")])
    );
  });

  test("rejects missing threshold action mapping", () => {
    const errors = validateThemeManifestData("mental", {
      ...makeValidManifest("mental"),
      support_policy: {
        ...makeValidManifest("mental").support_policy,
        threshold_actions: {
          ...makeValidManifest("mental").support_policy.threshold_actions,
          path_start_guardrail: ["reduce_support_surfacing"],
        },
      },
    });

    expect(errors).toContain(
      "support_policy.threshold_actions.path_start_guardrail には lower_current_theme_support_priority が必要です"
    );
  });

  test("loads a valid theme manifest from disk", () => {
    const rootDir = createTempRoot();
    try {
      const manifestPath = join(rootDir, "data", "themes", "mental.meta.json");
      mkdirSync(join(rootDir, "data", "themes"), { recursive: true });
      writeFileSync(manifestPath, JSON.stringify(makeValidManifest("mental"), null, 2), "utf-8");

      const result = loadThemeManifest("mental", rootDir);

      expect(result.errors).toHaveLength(0);
      expect(result.manifest.theme_id).toBe("mental");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("lesson validator fails when the theme manifest is missing", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "mental_units");
      mkdirSync(lessonDir, { recursive: true });
      writeFileSync(join(lessonDir, "mental_l01.ja.json"), JSON.stringify(makeValidLesson(), null, 2), "utf-8");
      writeFileSync(join(lessonDir, "mental_l01.evidence.json"), JSON.stringify(makeValidEvidence(), null, 2), "utf-8");

      const validator = new LessonValidator({
        rootDir,
        lessonDirs: [lessonDir],
        stagingDirs: [],
      });

      expect(validator.validate()).toBe(false);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("lesson validator passes when the theme manifest is valid", () => {
    const rootDir = createTempRoot();
    try {
      const lessonDir = join(rootDir, "data", "lessons", "mental_units");
      const themeDir = join(rootDir, "data", "themes");
      mkdirSync(lessonDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });
      writeFileSync(join(lessonDir, "mental_l01.ja.json"), JSON.stringify(makeValidLesson(), null, 2), "utf-8");
      writeFileSync(join(lessonDir, "mental_l01.evidence.json"), JSON.stringify(makeValidEvidence(), null, 2), "utf-8");
      writeFileSync(join(themeDir, "mental.meta.json"), JSON.stringify(makeValidManifest("mental"), null, 2), "utf-8");

      const validator = new LessonValidator({
        rootDir,
        lessonDirs: [lessonDir],
        stagingDirs: [],
      });

      expect(validator.validate()).toBe(true);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  test("production readiness fails when review_cycle_days is exceeded on production_default", () => {
    const rootDir = createTempRoot();
    try {
      const manifestPath = join(rootDir, "data", "themes", "mental.meta.json");
      mkdirSync(join(rootDir, "data", "themes"), { recursive: true });
      writeFileSync(
        manifestPath,
        JSON.stringify(
          {
            ...makeValidManifest("mental"),
            last_reviewed_at: "2025-12-01",
            rollout_stage: "production_default",
          },
          null,
          2
        ),
        "utf-8"
      );

      const result = evaluateThemeManifestReadiness("mental", rootDir, "production");

      expect(result.ready).toBe(false);
      expect(result.errors).toContain("review_cycle_days 超過 theme は production_default にできません");
      expect(result.warnings).toContain("review_cycle_days を超過しています");
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
