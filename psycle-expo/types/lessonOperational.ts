export type LessonPackageState =
  | "draft"
  | "staging"
  | "production"
  | "deprecated"
  | "killed";

export type SeverityTier = "A" | "B" | "C";

export type ThemeRolloutStage =
  | "draft"
  | "staging"
  | "production_limited"
  | "production_default";

export type ThemeStatus = "active" | "deprecated" | "archived";

export interface LessonPackageDependencies {
  requires_package_ids?: string[];
  dependency_rule?: string;
  invalidation_rule?: string;
  [key: string]: unknown;
}

export interface LessonContentPackageMetadata {
  state?: LessonPackageState;
  rollback_route?: string;
  rollback_class?: "soft" | "hard" | "analytics_only";
  analytics_contract_id?: string;
  analytics_contract_version?: number;
  analytics_schema_lineage?: string;
  analytics_backward_compat_until?: string;
  package_dependencies?: LessonPackageDependencies;
  [key: string]: unknown;
}

export interface LessonOperationalMetadata {
  content_package?: LessonContentPackageMetadata;
  severity_tier?: SeverityTier;
  next_review_due_at?: string;
  last_verified_at?: string;
  review_sla_days?: number;
  expiry_action?: "auto_hide" | "auto_demote" | "refresh_queue";
  [key: string]: unknown;
}

export interface RuntimeThemeManifest {
  schema_version?: number;
  theme_id?: string;
  owner?: string;
  last_reviewed_at?: string;
  review_cycle_days?: number;
  prerequisite_themes?: string[];
  rollout_stage?: ThemeRolloutStage;
  theme_status?: ThemeStatus;
  [key: string]: unknown;
}
