const fs = require("fs");
const path = require("path");

const ALLOWED_CONTINUITY_MODES = ["net_new", "replace", "merge", "retire"];
const ALLOWED_CONTINUITY_ROUTES = [
  "start_here",
  "restart",
  "continue_to_replacement",
  "return_then_rejoin",
];

function getContinuityMetadataPath(themeDirOrLessonPath, lessonId) {
  if (lessonId) {
    return path.join(themeDirOrLessonPath, `${lessonId}.continuity.json`);
  }
  return themeDirOrLessonPath.replace(/\.ja\.json$/, ".continuity.json");
}

function createNetNewContinuityMetadata({ lessonId, themeId, aftercareDefaults }) {
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
      aftercare_window_days: aftercareDefaults?.aftercare_window_days ?? 0,
      legacy_candidate_suppression_rule:
        aftercareDefaults?.legacy_candidate_suppression_rule ?? "not_applicable",
      in_flight_user_route: "start_here",
      stale_mastery_cleanup_rule: "not_applicable",
      legacy_vs_replacement_analytics_window: 0,
    },
  };
}

function isValidDateString(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function validateContinuityMetadata(metadata, context = {}) {
  const errors = [];
  const warnings = [];
  const expectedLessonId = context.expectedLessonId;
  const expectedThemeId = context.expectedThemeId;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    errors.push("continuity metadata は object である必要があります");
    return { errors, warnings };
  }

  if (typeof metadata.schema_version !== "number" || metadata.schema_version < 1) {
    errors.push("schema_version は 1 以上の number である必要があります");
  }

  const requiredStringFields = [
    "lesson_id",
    "theme_id",
    "continuity_mode",
    "decision_basis",
    "continuity_route",
    "history_migration_rule",
    "support_redirect_rule",
    "analytics_continuity_rule",
  ];

  for (const field of requiredStringFields) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      errors.push(`${field} は非空文字列である必要があります`);
    }
  }

  if (!ALLOWED_CONTINUITY_MODES.includes(metadata.continuity_mode)) {
    errors.push(`continuity_mode が不正です: ${metadata.continuity_mode}`);
  }

  if (!ALLOWED_CONTINUITY_ROUTES.includes(metadata.continuity_route)) {
    errors.push(`continuity_route が不正です: ${metadata.continuity_route}`);
  }

  if (!Array.isArray(metadata.predecessor_lesson_ids)) {
    errors.push("predecessor_lesson_ids は配列である必要があります");
  } else if (
    metadata.predecessor_lesson_ids.some(
      (lessonId) => typeof lessonId !== "string" || lessonId.trim() === ""
    )
  ) {
    errors.push("predecessor_lesson_ids は空でない文字列配列である必要があります");
  }

  if (expectedLessonId && metadata.lesson_id !== expectedLessonId) {
    errors.push(`lesson_id が lesson filename と一致しません: expected=${expectedLessonId}`);
  }

  if (expectedThemeId && metadata.theme_id !== expectedThemeId) {
    errors.push(`theme_id が lesson filename と一致しません: expected=${expectedThemeId}`);
  }

  if (!metadata.aftercare || typeof metadata.aftercare !== "object" || Array.isArray(metadata.aftercare)) {
    errors.push("aftercare は object である必要があります");
    return { errors, warnings };
  }

  if (typeof metadata.aftercare.required !== "boolean") {
    errors.push("aftercare.required は boolean である必要があります");
  }

  const numericAftercareFields = ["aftercare_window_days", "legacy_vs_replacement_analytics_window"];
  for (const field of numericAftercareFields) {
    if (
      typeof metadata.aftercare[field] !== "number" ||
      !Number.isFinite(metadata.aftercare[field]) ||
      metadata.aftercare[field] < 0
    ) {
      errors.push(`aftercare.${field} は 0 以上の number である必要があります`);
    }
  }

  const stringAftercareFields = [
    "legacy_candidate_suppression_rule",
    "in_flight_user_route",
    "stale_mastery_cleanup_rule",
  ];
  for (const field of stringAftercareFields) {
    if (typeof metadata.aftercare[field] !== "string" || metadata.aftercare[field].trim() === "") {
      errors.push(`aftercare.${field} は非空文字列である必要があります`);
    }
  }

  if (!ALLOWED_CONTINUITY_ROUTES.includes(metadata.aftercare.in_flight_user_route)) {
    errors.push(`aftercare.in_flight_user_route が不正です: ${metadata.aftercare.in_flight_user_route}`);
  }

  if (
    metadata.aftercare.fallback_user_route !== undefined &&
    (
      typeof metadata.aftercare.fallback_user_route !== "string" ||
      !ALLOWED_CONTINUITY_ROUTES.includes(metadata.aftercare.fallback_user_route)
    )
  ) {
    errors.push("aftercare.fallback_user_route は許可された continuity route である必要があります");
  }

  if (metadata.continuity_mode === "net_new") {
    if (Array.isArray(metadata.predecessor_lesson_ids) && metadata.predecessor_lesson_ids.length > 0) {
      errors.push("net_new continuity は predecessor_lesson_ids を持ってはいけません");
    }
    if (metadata.aftercare.required !== false) {
      errors.push("net_new continuity は aftercare.required=false である必要があります");
    }
  }

  if (["replace", "merge", "retire"].includes(metadata.continuity_mode)) {
    if (!Array.isArray(metadata.predecessor_lesson_ids) || metadata.predecessor_lesson_ids.length === 0) {
      errors.push(`${metadata.continuity_mode} continuity は predecessor_lesson_ids が必要です`);
    }
    if (metadata.aftercare.required !== true) {
      errors.push(`${metadata.continuity_mode} continuity は aftercare.required=true である必要があります`);
    }
    if (metadata.continuity_route === "start_here") {
      errors.push(`${metadata.continuity_mode} continuity で continuity_route=start_here は不正です`);
    }

    if (!metadata.deprecation || typeof metadata.deprecation !== "object" || Array.isArray(metadata.deprecation)) {
      errors.push(`${metadata.continuity_mode} continuity は deprecation metadata が必要です`);
    } else {
      if (!isValidDateString(metadata.deprecation.deprecation_start_at)) {
        errors.push("deprecation.deprecation_start_at は日付文字列である必要があります");
      }
      if (
        typeof metadata.deprecation.compatibility_window_days !== "number" ||
        !Number.isFinite(metadata.deprecation.compatibility_window_days) ||
        metadata.deprecation.compatibility_window_days < 0
      ) {
        errors.push("deprecation.compatibility_window_days は 0 以上の number である必要があります");
      }
      if (!isValidDateString(metadata.deprecation.cleanup_due_at)) {
        errors.push("deprecation.cleanup_due_at は日付文字列である必要があります");
      } else if (
        isValidDateString(metadata.deprecation.deprecation_start_at) &&
        Date.parse(metadata.deprecation.cleanup_due_at) < Date.parse(metadata.deprecation.deprecation_start_at)
      ) {
        errors.push("deprecation.cleanup_due_at は deprecation_start_at 以降である必要があります");
      }
      if (
        typeof metadata.deprecation.migration_complete_condition !== "string" ||
        metadata.deprecation.migration_complete_condition.trim() === ""
      ) {
        errors.push("deprecation.migration_complete_condition は非空文字列である必要があります");
      }
    }
  }

  if (metadata.continuity_mode === "replace") {
    if (Array.isArray(metadata.predecessor_lesson_ids) && metadata.predecessor_lesson_ids.length !== 1) {
      errors.push("replace continuity は predecessor_lesson_ids が1件必要です");
    }
  }

  if (metadata.continuity_mode === "merge") {
    if (Array.isArray(metadata.predecessor_lesson_ids) && metadata.predecessor_lesson_ids.length < 2) {
      errors.push("merge continuity は predecessor_lesson_ids が2件以上必要です");
    }
  }

  if (metadata.continuity_mode === "retire") {
    if (
      !metadata.aftercare ||
      typeof metadata.aftercare.fallback_user_route !== "string" ||
      !ALLOWED_CONTINUITY_ROUTES.includes(metadata.aftercare.fallback_user_route)
    ) {
      errors.push("retire continuity は aftercare.fallback_user_route が必要です");
    }
  }

  return { errors, warnings };
}

function loadContinuityMetadata(filePath, context = {}) {
  if (!fs.existsSync(filePath)) {
    return { metadata: null, errors: ["continuity metadata file が存在しません"], warnings: [] };
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const validation = validateContinuityMetadata(metadata, context);
    return { metadata, errors: validation.errors, warnings: validation.warnings };
  } catch (error) {
    return { metadata: null, errors: [`continuity metadata JSONパースエラー: ${error.message}`], warnings: [] };
  }
}

module.exports = {
  ALLOWED_CONTINUITY_MODES,
  ALLOWED_CONTINUITY_ROUTES,
  getContinuityMetadataPath,
  createNetNewContinuityMetadata,
  validateContinuityMetadata,
  loadContinuityMetadata,
};
