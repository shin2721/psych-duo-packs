const fs = require("fs");
const path = require("path");
const {
  inferThemeIdFromLessonPath,
  getThemeManifestPath,
  loadThemeManifest,
  getThemeManifestReviewStatus,
} = require("./theme-manifest.js");
const { loadContinuityMetadata } = require("./continuity-metadata.js");

const READINESS_FIELDS = [
  "quality_gate_pass",
  "dependency_valid",
  "continuity_complete",
  "analytics_wired",
  "rollback_defined",
];
const ALLOWED_READINESS_OWNERS = ["content_ops", "runtime", "analytics"];
const COMPLETENESS_FIELDS = [
  "localized_copy_ready",
  "analytics_contract_named",
  "rollback_route_present",
  "owner_assigned",
  "readiness_authority_complete",
];
const HIGH_ASSURANCE_CHANGE_TYPES = [
  "safety_update",
  "dependency_bypass",
  "replace_or_merge_continuity_migration",
  "threshold_change",
  "kill_switch_restore",
];
const ALLOWED_PACKAGE_STATES = ["draft", "staging", "production", "deprecated", "killed"];
const ALLOWED_ROLLBACK_CLASSES = ["soft", "hard", "analytics_only"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getEvidencePathFromLessonPath(lessonPath) {
  return lessonPath.replace(/\.ja\.json$/, ".evidence.json");
}

function getContinuityPathFromLessonPath(lessonPath) {
  return lessonPath.replace(/\.ja\.json$/, ".continuity.json");
}

function makeExpectedAnalyticsContractId(themeId, contractVersion = 1) {
  return `content.lesson.${themeId}.v${contractVersion}`;
}

function toRelative(rootDir, targetPath) {
  return path.relative(rootDir, targetPath).replace(/\\/g, "/");
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function isValidDateString(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isPastDue(value, now) {
  return isValidDateString(value) && Date.parse(value) <= now.getTime();
}

function getDatePlusDays(value, days) {
  if (!isValidDateString(value) || typeof days !== "number" || !Number.isFinite(days)) {
    return null;
  }

  return new Date(Date.parse(value) + (days * MS_PER_DAY));
}

function pushPromoteSensitiveIssue(errors, warnings, mode, message) {
  if (mode === "promote") {
    errors.push(message);
    return;
  }

  warnings.push(message);
}

function validateCrossFileConsistency({
  mode,
  now,
  evidence,
  themeManifest,
  continuityMetadata,
  contentPackage,
}) {
  const errors = [];
  const warnings = [];

  if (!contentPackage || !themeManifest) {
    return { errors, warnings };
  }

  const packageState = contentPackage.state;
  const themeStatus = themeManifest.theme_status;
  const rolloutStage = themeManifest.rollout_stage;
  const severityTier = evidence?.severity_tier;
  const nextReviewDueAt = evidence?.next_review_due_at;

  if (themeStatus === "archived" && ["staging", "production"].includes(packageState)) {
    errors.push(`theme_status=archived の theme に package.state=${packageState} を残せません`);
  }

  if (themeStatus === "deprecated" && (mode === "promote" || packageState === "production")) {
    pushPromoteSensitiveIssue(
      errors,
      warnings,
      mode,
      "theme_status=deprecated の theme に新規 production package を作れません"
    );
  }

  if (
    continuityMetadata?.continuity_mode === "retire" &&
    packageState === "production" &&
    rolloutStage === "production_default"
  ) {
    errors.push("continuity_mode=retire の package を production_default theme に置けません");
  }

  if (packageState === "killed" && contentPackage.rollback_class !== "hard") {
    errors.push("content_package.state=killed の場合は rollback_class=hard が必要です");
  }

  if (severityTier === "A" && packageState === "production" && isPastDue(nextReviewDueAt, now)) {
    errors.push("severity_tier=A かつ stale の package を production に残せません");
  }

  if (packageState === "production" && isPastDue(nextReviewDueAt, now)) {
    if (severityTier === "B") {
      warnings.push("severity_tier=B の stale package は auto_demote か refresh_queue 候補です");
    }
    if (severityTier === "C") {
      warnings.push("severity_tier=C の stale package は refresh_queue 候補です");
    }
  }

  if (
    continuityMetadata?.deprecation &&
    packageState === "deprecated" &&
    isPastDue(continuityMetadata.deprecation.cleanup_due_at, now)
  ) {
    if (contentPackage.rollback_class !== "hard") {
      errors.push("cleanup_due_at 超過の deprecated package は rollback_class=hard が必要です");
    } else {
      warnings.push("cleanup_due_at を超過した deprecated package です");
    }
  }

  if (
    continuityMetadata?.deprecation &&
    isValidDateString(continuityMetadata.deprecation.deprecation_start_at) &&
    typeof continuityMetadata.deprecation.compatibility_window_days === "number"
  ) {
    const compatibilityDueAt = getDatePlusDays(
      continuityMetadata.deprecation.deprecation_start_at,
      continuityMetadata.deprecation.compatibility_window_days
    );
    if (compatibilityDueAt && compatibilityDueAt.getTime() <= now.getTime()) {
      warnings.push("compatibility_window_days を超過した continuity package は cleanup queue 候補です");
    }
  }

  const reviewStatus = getThemeManifestReviewStatus(themeManifest, now);
  if (reviewStatus.overdue && packageState === "production") {
    if (rolloutStage === "production_default") {
      errors.push("review_cycle_days 超過 theme に production_default package を残せません");
    } else {
      warnings.push("review_cycle_days 超過 theme の production package は production_limited 候補です");
    }
  }

  return { errors, warnings };
}

function validatePackageMetadata(packageMetadata, context) {
  const errors = [];
  const warnings = [];

  if (!packageMetadata || typeof packageMetadata !== "object" || Array.isArray(packageMetadata)) {
    errors.push("content_package は object である必要があります");
    return { errors, warnings };
  }

  const requiredStringFields = ["lesson_path", "evidence_path", "theme_manifest_path", "analytics_contract_id"];
  for (const field of requiredStringFields) {
    if (typeof packageMetadata[field] !== "string" || packageMetadata[field].trim() === "") {
      errors.push(`content_package.${field} は非空文字列である必要があります`);
    }
  }

  if (typeof packageMetadata.owner_id !== "string" || packageMetadata.owner_id.trim() === "") {
    errors.push("content_package.owner_id は非空文字列である必要があります");
  }

  if (
    typeof packageMetadata.analytics_contract_version !== "number" ||
    !Number.isInteger(packageMetadata.analytics_contract_version) ||
    packageMetadata.analytics_contract_version < 1
  ) {
    errors.push("content_package.analytics_contract_version は 1 以上の整数である必要があります");
  }

  if (
    typeof packageMetadata.analytics_schema_lineage !== "string" ||
    packageMetadata.analytics_schema_lineage.trim() === ""
  ) {
    errors.push("content_package.analytics_schema_lineage は非空文字列である必要があります");
  }

  if (
    typeof packageMetadata.analytics_backward_compat_until !== "string" ||
    !isValidDateString(packageMetadata.analytics_backward_compat_until)
  ) {
    errors.push("content_package.analytics_backward_compat_until は日付文字列である必要があります");
  }

  if (typeof packageMetadata.state !== "string" || !ALLOWED_PACKAGE_STATES.includes(packageMetadata.state)) {
    errors.push(`content_package.state は許可値のみ使用できます: ${ALLOWED_PACKAGE_STATES.join(", ")}`);
  }

  if (typeof packageMetadata.rollback_route !== "string" || packageMetadata.rollback_route.trim() === "") {
    errors.push("content_package.rollback_route は非空文字列である必要があります");
  }

  if (
    typeof packageMetadata.rollback_class !== "string" ||
    !ALLOWED_ROLLBACK_CLASSES.includes(packageMetadata.rollback_class)
  ) {
    errors.push(
      `content_package.rollback_class は許可値のみ使用できます: ${ALLOWED_ROLLBACK_CLASSES.join(", ")}`
    );
  }

  if (!Array.isArray(packageMetadata.localized_locales) || packageMetadata.localized_locales.length === 0) {
    errors.push("content_package.localized_locales は少なくとも1つ必要です");
  } else if (
    packageMetadata.localized_locales.some(
      (locale) => typeof locale !== "string" || locale.trim() === ""
    )
  ) {
    errors.push("content_package.localized_locales は空でない文字列配列である必要があります");
  }

  if (
    typeof packageMetadata.localization_owner !== "string" ||
    packageMetadata.localization_owner.trim() === ""
  ) {
    errors.push("content_package.localization_owner は非空文字列である必要があります");
  }

  if (
    !Array.isArray(packageMetadata.approval_locale_set) ||
    packageMetadata.approval_locale_set.length === 0
  ) {
    errors.push("content_package.approval_locale_set は少なくとも1つ必要です");
  } else if (
    packageMetadata.approval_locale_set.some(
      (locale) => typeof locale !== "string" || locale.trim() === ""
    )
  ) {
    errors.push("content_package.approval_locale_set は空でない文字列配列である必要があります");
  }

  if (
    typeof packageMetadata.semantic_parity_rule !== "string" ||
    packageMetadata.semantic_parity_rule.trim() === ""
  ) {
    errors.push("content_package.semantic_parity_rule は非空文字列である必要があります");
  }

  if (typeof packageMetadata.tone_guard !== "string" || packageMetadata.tone_guard.trim() === "") {
    errors.push("content_package.tone_guard は非空文字列である必要があります");
  }

  if (
    packageMetadata.continuity_metadata_path !== undefined &&
    typeof packageMetadata.continuity_metadata_path !== "string"
  ) {
    errors.push("content_package.continuity_metadata_path は文字列である必要があります");
  }

  if (
    !packageMetadata.package_dependencies ||
    typeof packageMetadata.package_dependencies !== "object" ||
    Array.isArray(packageMetadata.package_dependencies)
  ) {
    errors.push("content_package.package_dependencies は object である必要があります");
  } else {
    const packageDependencies = packageMetadata.package_dependencies;
    if (!Array.isArray(packageDependencies.requires_package_ids)) {
      errors.push("content_package.package_dependencies.requires_package_ids は配列である必要があります");
    } else if (
      packageDependencies.requires_package_ids.some(
        (value) => typeof value !== "string" || value.trim() === ""
      )
    ) {
      errors.push("content_package.package_dependencies.requires_package_ids は空でない文字列配列である必要があります");
    }

    if (
      typeof packageDependencies.dependency_rule !== "string" ||
      packageDependencies.dependency_rule.trim() === ""
    ) {
      errors.push("content_package.package_dependencies.dependency_rule は非空文字列である必要があります");
    }

    if (
      typeof packageDependencies.invalidation_rule !== "string" ||
      packageDependencies.invalidation_rule.trim() === ""
    ) {
      errors.push("content_package.package_dependencies.invalidation_rule は非空文字列である必要があります");
    }
  }

  if (
    !packageMetadata.readiness ||
    typeof packageMetadata.readiness !== "object" ||
    Array.isArray(packageMetadata.readiness)
  ) {
    errors.push("content_package.readiness は object である必要があります");
    return { errors, warnings };
  }

  for (const field of READINESS_FIELDS) {
    if (typeof packageMetadata.readiness[field] !== "boolean") {
      errors.push(`content_package.readiness.${field} は boolean である必要があります`);
    }
  }

  if (
    !packageMetadata.readiness_authority ||
    typeof packageMetadata.readiness_authority !== "object" ||
    Array.isArray(packageMetadata.readiness_authority)
  ) {
    errors.push("content_package.readiness_authority は object である必要があります");
  } else {
    for (const field of READINESS_FIELDS) {
      const authority = packageMetadata.readiness_authority[field];
      if (!authority || typeof authority !== "object" || Array.isArray(authority)) {
        errors.push(`content_package.readiness_authority.${field} は object である必要があります`);
        continue;
      }

      if (typeof authority.owner !== "string" || authority.owner.trim() === "") {
        errors.push(`content_package.readiness_authority.${field}.owner は非空文字列である必要があります`);
      } else if (!ALLOWED_READINESS_OWNERS.includes(authority.owner)) {
        errors.push(
          `content_package.readiness_authority.${field}.owner は許可値のみ使用できます: ${ALLOWED_READINESS_OWNERS.join(", ")}`
        );
      }

      if (typeof authority.auto_source !== "string" || authority.auto_source.trim() === "") {
        errors.push(
          `content_package.readiness_authority.${field}.auto_source は非空文字列である必要があります`
        );
      }

      if (
        typeof authority.final_authority !== "string" ||
        authority.final_authority.trim() === ""
      ) {
        errors.push(
          `content_package.readiness_authority.${field}.final_authority は非空文字列である必要があります`
        );
      }
    }
  }

  if (
    !packageMetadata.completeness ||
    typeof packageMetadata.completeness !== "object" ||
    Array.isArray(packageMetadata.completeness)
  ) {
    errors.push("content_package.completeness は object である必要があります");
  } else {
    for (const field of COMPLETENESS_FIELDS) {
      if (typeof packageMetadata.completeness[field] !== "boolean") {
        errors.push(`content_package.completeness.${field} は boolean である必要があります`);
      }
    }
  }

  if (
    !packageMetadata.review_decision ||
    typeof packageMetadata.review_decision !== "object" ||
    Array.isArray(packageMetadata.review_decision)
  ) {
    errors.push("content_package.review_decision は object である必要があります");
  } else {
    const reviewDecision = packageMetadata.review_decision;

    if (typeof reviewDecision.change_type !== "string" || reviewDecision.change_type.trim() === "") {
      errors.push("content_package.review_decision.change_type は非空文字列である必要があります");
    }

    if (typeof reviewDecision.human_review_required !== "boolean") {
      errors.push("content_package.review_decision.human_review_required は boolean である必要があります");
    }

    if (typeof reviewDecision.approved_source !== "string" || reviewDecision.approved_source.trim() === "") {
      errors.push("content_package.review_decision.approved_source は非空文字列である必要があります");
    }

    if (typeof reviewDecision.review_reason !== "string" || reviewDecision.review_reason.trim() === "") {
      errors.push("content_package.review_decision.review_reason は非空文字列である必要があります");
    }

    if (
      typeof reviewDecision.reviewed_at !== "string" ||
      reviewDecision.reviewed_at.trim() === "" ||
      Number.isNaN(Date.parse(reviewDecision.reviewed_at))
    ) {
      errors.push("content_package.review_decision.reviewed_at は日付文字列である必要があります");
    }

    if (
      HIGH_ASSURANCE_CHANGE_TYPES.includes(reviewDecision.change_type) &&
      (
        typeof reviewDecision.rollback_trigger_if_reverted !== "string" ||
        reviewDecision.rollback_trigger_if_reverted.trim() === ""
      )
    ) {
      errors.push(
        `content_package.review_decision.change_type=${reviewDecision.change_type} は rollback_trigger_if_reverted が必要です`
      );
    }
  }

  if (packageMetadata.lesson_path && packageMetadata.lesson_path !== context.expectedLessonPath) {
    errors.push(`content_package.lesson_path が不正です: expected=${context.expectedLessonPath}`);
  }
  if (packageMetadata.evidence_path && packageMetadata.evidence_path !== context.expectedEvidencePath) {
    errors.push(`content_package.evidence_path が不正です: expected=${context.expectedEvidencePath}`);
  }
  if (packageMetadata.theme_manifest_path && packageMetadata.theme_manifest_path !== context.expectedThemeManifestPath) {
    errors.push(`content_package.theme_manifest_path が不正です: expected=${context.expectedThemeManifestPath}`);
  }

  const expectedAnalyticsContractId = makeExpectedAnalyticsContractId(
    context.themeId,
    typeof packageMetadata.analytics_contract_version === "number"
      ? packageMetadata.analytics_contract_version
      : 1
  );
  if (
    packageMetadata.analytics_contract_id &&
    packageMetadata.analytics_contract_id !== expectedAnalyticsContractId
  ) {
    warnings.push(
      `content_package.analytics_contract_id が規定値と異なります: expected=${expectedAnalyticsContractId}`
    );
  }

  if (
    packageMetadata.package_dependencies?.requires_package_ids?.includes(context.lessonBasename)
  ) {
    errors.push("content_package.package_dependencies.requires_package_ids に自分自身を含めてはいけません");
  }

  if (
    packageMetadata.continuity_metadata_path &&
    !fs.existsSync(path.join(context.rootDir, packageMetadata.continuity_metadata_path))
  ) {
    errors.push("content_package.continuity_metadata_path のファイルが存在しません");
  }

  if (packageMetadata.state === "production" && context.expectedLessonPath.includes("_staging")) {
    errors.push("staging lesson は content_package.state=production にできません");
  }

  if (packageMetadata.state === "staging" && !context.expectedLessonPath.includes("_staging")) {
    warnings.push("production lesson なのに content_package.state=staging です");
  }

  if (
    packageMetadata.completeness?.localized_copy_ready === true &&
    Array.isArray(packageMetadata.approval_locale_set) &&
    Array.isArray(packageMetadata.localized_locales)
  ) {
    const missingApprovedLocale = packageMetadata.localized_locales.some(
      (locale) => !packageMetadata.approval_locale_set.includes(locale)
    );
    if (missingApprovedLocale) {
      errors.push("localized_copy_ready=true の場合は localized_locales が approval_locale_set に含まれている必要があります");
    }
  }

  if (
    packageMetadata.readiness?.rollback_defined === true &&
    (
      typeof packageMetadata.rollback_class !== "string" ||
      !ALLOWED_ROLLBACK_CLASSES.includes(packageMetadata.rollback_class)
    )
  ) {
    errors.push("rollback_defined=true の場合は有効な rollback_class が必要です");
  }

  return { errors, warnings };
}

function evaluateContentPackageReadiness(lessonPath, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const mode = options.mode || "audit";
  const warnOnLegacyProduction = options.warnOnLegacyProduction === true;
  const now = options.now ? new Date(options.now) : new Date();
  const themeId = inferThemeIdFromLessonPath(lessonPath);
  const evidencePath = getEvidencePathFromLessonPath(lessonPath);
  const continuityPath = getContinuityPathFromLessonPath(lessonPath);
  const themeManifestPath = themeId ? getThemeManifestPath(themeId, rootDir) : null;
  const errors = [];
  const warnings = [];

  if (!themeId) {
    errors.push("lesson filename から theme_id を推定できません");
    return { ready: false, errors, warnings, themeId: null };
  }

  if (!fs.existsSync(lessonPath)) {
    errors.push("lesson file が存在しません");
  }
  if (!fs.existsSync(evidencePath)) {
    errors.push("evidence file が存在しません");
  }
  if (themeManifestPath && !fs.existsSync(themeManifestPath)) {
    errors.push("theme manifest が存在しません");
  }

  if (errors.length > 0) {
    return { ready: false, errors, warnings, themeId, evidencePath, themeManifestPath, continuityPath };
  }

  const evidence = readJsonIfExists(evidencePath);
  const contentPackage = evidence?.content_package;
  const themeManifestResult = loadThemeManifest(themeId, rootDir);
  const themeManifest = themeManifestResult.manifest;
  const expectedLessonPath = toRelative(rootDir, lessonPath);
  const expectedEvidencePath = toRelative(rootDir, evidencePath);
  const expectedThemeManifestPath = toRelative(rootDir, themeManifestPath);

  if (!contentPackage) {
    const message = "content_package metadata がありません";
    if (mode === "promote") {
      errors.push(message);
    } else if (lessonPath.includes("_staging") || warnOnLegacyProduction) {
      warnings.push(message);
    } else {
      return {
        ready: true,
        errors,
        warnings,
        themeId,
        evidencePath,
        themeManifestPath,
        continuityPath,
      };
    }

    return {
      ready: errors.length === 0,
      errors,
      warnings,
      themeId,
      evidencePath,
      themeManifestPath,
      continuityPath,
    };
  }

  const context = {
    rootDir,
    themeId,
    lessonBasename: path.basename(lessonPath, ".ja.json"),
    expectedLessonPath,
    expectedEvidencePath,
    expectedThemeManifestPath,
  };
  const metadataValidation = validatePackageMetadata(contentPackage, context);
  errors.push(...metadataValidation.errors);
  warnings.push(...metadataValidation.warnings);

  const continuityMetadataPath =
    contentPackage.continuity_metadata_path
      ? path.join(rootDir, contentPackage.continuity_metadata_path)
      : continuityPath;
  const continuityRequired = mode === "promote" || !!contentPackage.continuity_metadata_path;
  let continuityMetadata = null;

  if (themeManifestResult.errors.length > 0) {
    errors.push(
      ...themeManifestResult.errors.map((message) => `content_package.theme_manifest_path 先の manifest が不正です: ${message}`)
    );
  }

  if (continuityRequired) {
    if (!contentPackage.continuity_metadata_path) {
      errors.push("content_package.continuity_metadata_path が必要です");
    } else {
      const continuityValidation = loadContinuityMetadata(continuityMetadataPath, {
        expectedLessonId: path.basename(lessonPath, ".ja.json"),
        expectedThemeId: themeId,
      });
      continuityMetadata = continuityValidation.metadata;
      errors.push(...continuityValidation.errors);
      warnings.push(...continuityValidation.warnings);
    }
  } else if (fs.existsSync(continuityMetadataPath)) {
    const continuityValidation = loadContinuityMetadata(continuityMetadataPath, {
      expectedLessonId: path.basename(lessonPath, ".ja.json"),
      expectedThemeId: themeId,
    });
    continuityMetadata = continuityValidation.metadata;
    warnings.push(...continuityValidation.warnings);
  }

  const readiness = contentPackage.readiness || {};
  const unmetReadiness = READINESS_FIELDS.filter((field) => readiness[field] !== true);
  const completeness = contentPackage.completeness || {};
  const unmetCompleteness = COMPLETENESS_FIELDS.filter((field) => completeness[field] !== true);

  if (unmetReadiness.length > 0) {
    const message = `content_package readiness 未達: ${unmetReadiness.join(", ")}`;
    if (mode === "promote") {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (unmetCompleteness.length > 0) {
    const message = `content_package completeness 未達: ${unmetCompleteness.join(", ")}`;
    if (mode === "promote") {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (!contentPackage.continuity_metadata_path && fs.existsSync(continuityPath)) {
    warnings.push("continuity file は存在しますが content_package.continuity_metadata_path が未設定です");
  }

  const crossFileValidation = validateCrossFileConsistency({
    mode,
    now,
    evidence,
    themeManifest,
    continuityMetadata,
    contentPackage,
  });
  errors.push(...crossFileValidation.errors);
  warnings.push(...crossFileValidation.warnings);

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    themeId,
    evidencePath,
    themeManifestPath,
    continuityPath,
    contentPackage,
  };
}

module.exports = {
  getEvidencePathFromLessonPath,
  getContinuityPathFromLessonPath,
  makeExpectedAnalyticsContractId,
  evaluateContentPackageReadiness,
  READINESS_FIELDS,
  ALLOWED_READINESS_OWNERS,
  COMPLETENESS_FIELDS,
  HIGH_ASSURANCE_CHANGE_TYPES,
  ALLOWED_PACKAGE_STATES,
  ALLOWED_ROLLBACK_CLASSES,
};
