const fs = require("fs");
const path = require("path");

const EXPECTED_THEME_IDS = ["mental", "money", "work", "health", "social", "study"];
const ALLOWED_ROLLOUT_STAGES = ["draft", "staging", "production_limited", "production_default"];
const ALLOWED_SATURATION_STATES = ["growing", "saturated", "retiring"];
const ALLOWED_THEME_STATUSES = ["active", "deprecated", "archived"];
const ALLOWED_UNLOCK_CONDITIONS = [
  "core_path_available",
  "prerequisites_completed",
  "theme_manifest_active",
  "inventory_available",
  "manual_release_window_open",
];
const ALLOWED_DEPENDENCY_BYPASS_RULES = [
  "none",
  "human_reviewed_migration",
  "safety_hotfix",
  "kill_switch_recovery",
  "experiment_override",
];
const SUPPORT_POLICY_THRESHOLD_FIELDS = [
  "path_start_guardrail",
  "path_completion_guardrail",
  "support_repeat_cap",
  "support_only_progress_cap",
  "support_start_rate_floor",
];
const SUPPORT_POLICY_ACTION_REQUIREMENTS = {
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
  support_start_rate_floor: [
    "demote_noisy_support_kind",
    "review_trigger_or_copy",
  ],
};
const ALLOWED_SUPPORT_POLICY_ACTIONS = Array.from(
  new Set(Object.values(SUPPORT_POLICY_ACTION_REQUIREMENTS).flat())
);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getThemesDir(rootDir = process.cwd()) {
  return path.join(rootDir, "data", "themes");
}

function getThemeManifestPath(themeId, rootDir = process.cwd()) {
  return path.join(getThemesDir(rootDir), `${themeId}.meta.json`);
}

function inferThemeIdFromLessonPath(lessonPath) {
  const basename = path.basename(lessonPath);
  const match = basename.match(/^([a-z]+)_[lm]\d+\.ja\.json$/);
  return match ? match[1] : null;
}

function isValidDateString(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function getThemeManifestReviewStatus(manifest, now = new Date()) {
  if (!manifest || !isValidDateString(manifest.last_reviewed_at)) {
    return {
      overdue: false,
      reviewDueAt: null,
    };
  }

  const reviewDueAt = new Date(Date.parse(manifest.last_reviewed_at) + (manifest.review_cycle_days * MS_PER_DAY));
  return {
    overdue: reviewDueAt.getTime() <= now.getTime(),
    reviewDueAt,
  };
}

function validateThemeManifestData(themeId, manifest, manifestPath = "") {
  const errors = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    errors.push("manifest は object である必要があります");
    return errors;
  }

  const requiredStringFields = [
    "theme_id",
    "owner",
    "last_reviewed_at",
    "rollout_stage",
    "saturation_state",
    "theme_status",
    "migration_rule",
  ];

  for (const field of requiredStringFields) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      errors.push(`${field} は非空文字列である必要があります`);
    }
  }

  if (manifest.last_reviewed_at !== undefined && !isValidDateString(manifest.last_reviewed_at)) {
    errors.push("last_reviewed_at は日付文字列である必要があります");
  }

  const requiredNumberFields = [
    "schema_version",
    "review_cycle_days",
    "backward_compat_window_days",
  ];

  for (const field of requiredNumberFields) {
    if (typeof manifest[field] !== "number" || !Number.isFinite(manifest[field]) || manifest[field] < 0) {
      errors.push(`${field} は 0 以上の number である必要があります`);
    }
  }

  const requiredArrayFields = [
    "prerequisite_themes",
    "prerequisite_skills",
    "unlock_conditions",
    "dependency_bypass_rules",
  ];

  for (const field of requiredArrayFields) {
    if (!Array.isArray(manifest[field])) {
      errors.push(`${field} は配列である必要があります`);
      continue;
    }

    const invalidItem = manifest[field].find((value) => typeof value !== "string" || value.trim() === "");
    if (invalidItem !== undefined) {
      errors.push(`${field} は空でない文字列配列である必要があります`);
    }
  }

  if (Array.isArray(manifest.unlock_conditions) && manifest.unlock_conditions.length === 0) {
    errors.push("unlock_conditions は少なくとも1つ必要です");
  }

  if (
    Array.isArray(manifest.unlock_conditions) &&
    manifest.unlock_conditions.some((value) => !ALLOWED_UNLOCK_CONDITIONS.includes(value))
  ) {
    errors.push(
      `unlock_conditions は許可値のみ使用できます: ${ALLOWED_UNLOCK_CONDITIONS.join(", ")}`
    );
  }

  if (
    Array.isArray(manifest.dependency_bypass_rules) &&
    manifest.dependency_bypass_rules.some((value) => !ALLOWED_DEPENDENCY_BYPASS_RULES.includes(value))
  ) {
    errors.push(
      `dependency_bypass_rules は許可値のみ使用できます: ${ALLOWED_DEPENDENCY_BYPASS_RULES.join(", ")}`
    );
  }

  if (manifest.theme_id !== themeId) {
    errors.push(`theme_id が filename と一致しません: expected=${themeId}, actual=${manifest.theme_id}`);
  }

  if (!ALLOWED_ROLLOUT_STAGES.includes(manifest.rollout_stage)) {
    errors.push(`rollout_stage が不正です: ${manifest.rollout_stage}`);
  }

  if (!ALLOWED_SATURATION_STATES.includes(manifest.saturation_state)) {
    errors.push(`saturation_state が不正です: ${manifest.saturation_state}`);
  }

  if (!ALLOWED_THEME_STATUSES.includes(manifest.theme_status)) {
    errors.push(`theme_status が不正です: ${manifest.theme_status}`);
  }

  if (
    manifest.replacement_aftercare_defaults !== undefined &&
    (
      typeof manifest.replacement_aftercare_defaults !== "object" ||
      manifest.replacement_aftercare_defaults === null ||
      Array.isArray(manifest.replacement_aftercare_defaults)
    )
  ) {
    errors.push("replacement_aftercare_defaults は object である必要があります");
  } else if (manifest.replacement_aftercare_defaults) {
    const defaults = manifest.replacement_aftercare_defaults;
    if (
      typeof defaults.aftercare_window_days !== "number" ||
      !Number.isFinite(defaults.aftercare_window_days) ||
      defaults.aftercare_window_days < 0
    ) {
      errors.push("replacement_aftercare_defaults.aftercare_window_days は 0 以上の number である必要があります");
    }
    if (
      typeof defaults.legacy_candidate_suppression_rule !== "string" ||
      defaults.legacy_candidate_suppression_rule.trim() === ""
    ) {
      errors.push("replacement_aftercare_defaults.legacy_candidate_suppression_rule は非空文字列である必要があります");
    }
  }

  if (Array.isArray(manifest.prerequisite_themes) && manifest.prerequisite_themes.includes(themeId)) {
    errors.push("prerequisite_themes に自分自身を含めてはいけません");
  }

  if (
    !manifest.support_policy ||
    typeof manifest.support_policy !== "object" ||
    Array.isArray(manifest.support_policy)
  ) {
    errors.push("support_policy は object である必要があります");
  } else {
    const supportPolicy = manifest.support_policy;
    const numericSupportFields = [
      "weekly_support_budget",
      "same_kind_cooldown_days",
      "same_theme_cooldown_days",
      "same_lesson_cooldown_days",
    ];

    for (const field of numericSupportFields) {
      if (
        typeof supportPolicy[field] !== "number" ||
        !Number.isFinite(supportPolicy[field]) ||
        supportPolicy[field] < 0
      ) {
        errors.push(`support_policy.${field} は 0 以上の number である必要があります`);
      }
    }

    if (
      !supportPolicy.thresholds ||
      typeof supportPolicy.thresholds !== "object" ||
      Array.isArray(supportPolicy.thresholds)
    ) {
      errors.push("support_policy.thresholds は object である必要があります");
    } else {
      for (const field of SUPPORT_POLICY_THRESHOLD_FIELDS) {
        const value = supportPolicy.thresholds[field];
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
          errors.push(`support_policy.thresholds.${field} は 0 以上 1 以下の number である必要があります`);
        }
      }
    }

    if (
      !supportPolicy.threshold_actions ||
      typeof supportPolicy.threshold_actions !== "object" ||
      Array.isArray(supportPolicy.threshold_actions)
    ) {
      errors.push("support_policy.threshold_actions は object である必要があります");
    } else {
      for (const field of SUPPORT_POLICY_THRESHOLD_FIELDS) {
        const actions = supportPolicy.threshold_actions[field];
        if (!Array.isArray(actions) || actions.length === 0) {
          errors.push(`support_policy.threshold_actions.${field} は少なくとも1つの action が必要です`);
          continue;
        }

        if (actions.some((value) => typeof value !== "string" || value.trim() === "")) {
          errors.push(`support_policy.threshold_actions.${field} は空でない文字列配列である必要があります`);
        }

        if (actions.some((value) => !ALLOWED_SUPPORT_POLICY_ACTIONS.includes(value))) {
          errors.push(
            `support_policy.threshold_actions.${field} は許可値のみ使用できます: ${ALLOWED_SUPPORT_POLICY_ACTIONS.join(", ")}`
          );
        }

        for (const requiredAction of SUPPORT_POLICY_ACTION_REQUIREMENTS[field]) {
          if (!actions.includes(requiredAction)) {
            errors.push(`support_policy.threshold_actions.${field} には ${requiredAction} が必要です`);
          }
        }
      }
    }
  }

  if (
    !manifest.metric_ownership ||
    typeof manifest.metric_ownership !== "object" ||
    Array.isArray(manifest.metric_ownership)
  ) {
    errors.push("metric_ownership は object である必要があります");
  } else {
    const metricOwnership = manifest.metric_ownership;

    if (
      typeof metricOwnership.metric_owner !== "string" ||
      metricOwnership.metric_owner.trim() === ""
    ) {
      errors.push("metric_ownership.metric_owner は非空文字列である必要があります");
    }

    if (
      typeof metricOwnership.review_cadence_days !== "number" ||
      !Number.isFinite(metricOwnership.review_cadence_days) ||
      metricOwnership.review_cadence_days <= 0
    ) {
      errors.push("metric_ownership.review_cadence_days は 0 より大きい number である必要があります");
    }

    if (
      typeof metricOwnership.change_authority !== "string" ||
      metricOwnership.change_authority.trim() === ""
    ) {
      errors.push("metric_ownership.change_authority は非空文字列である必要があります");
    }

    if (!Array.isArray(metricOwnership.threshold_change_log) || metricOwnership.threshold_change_log.length === 0) {
      errors.push("metric_ownership.threshold_change_log は少なくとも1つ必要です");
    } else if (
      metricOwnership.threshold_change_log.some(
        (value) => typeof value !== "string" || value.trim() === ""
      )
    ) {
      errors.push("metric_ownership.threshold_change_log は空でない文字列配列である必要があります");
    }
  }

  if (manifestPath && !manifestPath.endsWith(`${themeId}.meta.json`)) {
    errors.push(`manifest path が theme_id と一致しません: ${manifestPath}`);
  }

  return errors;
}

function loadThemeManifest(themeId, rootDir = process.cwd()) {
  const manifestPath = getThemeManifestPath(themeId, rootDir);
  if (!fs.existsSync(manifestPath)) {
    return {
      themeId,
      manifestPath,
      manifest: null,
      errors: ["theme manifest が見つかりません"],
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const errors = validateThemeManifestData(themeId, manifest, manifestPath);
    return {
      themeId,
      manifestPath,
      manifest,
      errors,
    };
  } catch (error) {
    return {
      themeId,
      manifestPath,
      manifest: null,
      errors: [`theme manifest JSONパースエラー: ${error.message}`],
    };
  }
}

function listThemeManifestIds(rootDir = process.cwd()) {
  const themesDir = getThemesDir(rootDir);
  if (!fs.existsSync(themesDir)) {
    return [];
  }

  return fs
    .readdirSync(themesDir)
    .filter((entry) => entry.endsWith(".meta.json"))
    .map((entry) => entry.replace(/\.meta\.json$/, ""))
    .sort();
}

function evaluateThemeManifestReadiness(themeId, rootDir = process.cwd(), target = "production") {
  const loadResult = loadThemeManifest(themeId, rootDir);
  const warnings = [];

  if (loadResult.errors.length > 0 || !loadResult.manifest) {
    return {
      ...loadResult,
      warnings,
      ready: false,
    };
  }

  const manifest = loadResult.manifest;
  const errors = [...loadResult.errors];
  const reviewStatus = getThemeManifestReviewStatus(manifest);

  if (manifest.theme_status === "archived") {
    errors.push("archived theme は readiness を満たしません");
  }

  if (target === "production") {
    if (!["production_limited", "production_default"].includes(manifest.rollout_stage)) {
      errors.push(`production readiness には production_* rollout_stage が必要です: ${manifest.rollout_stage}`);
    }
  } else if (target === "staging") {
    if (manifest.rollout_stage === "draft") {
      warnings.push("draft theme は staging でのみ利用可能です");
    }
  }

  if (manifest.theme_status === "deprecated") {
    warnings.push("deprecated theme です");
  }

  if (reviewStatus.overdue) {
    warnings.push("review_cycle_days を超過しています");
    if (manifest.rollout_stage === "production_default") {
      errors.push("review_cycle_days 超過 theme は production_default にできません");
    }
  }

  return {
    ...loadResult,
    warnings,
    errors,
    ready: errors.length === 0,
  };
}

function validateAllThemeManifests(rootDir = process.cwd(), target = "production") {
  const themeIds = Array.from(new Set([...EXPECTED_THEME_IDS, ...listThemeManifestIds(rootDir)])).sort();
  const results = themeIds.map((themeId) => evaluateThemeManifestReadiness(themeId, rootDir, target));
  const errors = results.flatMap((result) => result.errors.map((message) => `${result.themeId}: ${message}`));
  const warnings = results.flatMap((result) => result.warnings.map((message) => `${result.themeId}: ${message}`));

  return {
    themeIds,
    results,
    errors,
    warnings,
    ready: errors.length === 0,
  };
}

module.exports = {
  EXPECTED_THEME_IDS,
  ALLOWED_ROLLOUT_STAGES,
  ALLOWED_SATURATION_STATES,
  ALLOWED_THEME_STATUSES,
  ALLOWED_UNLOCK_CONDITIONS,
  ALLOWED_DEPENDENCY_BYPASS_RULES,
  ALLOWED_SUPPORT_POLICY_ACTIONS,
  SUPPORT_POLICY_THRESHOLD_FIELDS,
  isValidDateString,
  getThemeManifestReviewStatus,
  getThemeManifestPath,
  inferThemeIdFromLessonPath,
  validateThemeManifestData,
  loadThemeManifest,
  listThemeManifestIds,
  evaluateThemeManifestReadiness,
  validateAllThemeManifests,
};
