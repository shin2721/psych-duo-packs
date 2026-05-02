export interface LessonContinuityAftercare {
  required: boolean;
  aftercare_window_days: number;
  legacy_candidate_suppression_rule: string;
  in_flight_user_route: string;
  stale_mastery_cleanup_rule: string;
  legacy_vs_replacement_analytics_window: number;
  fallback_user_route?: string;
}

export interface LessonContinuityDeprecation {
  deprecation_start_at: string;
  compatibility_window_days: number;
  cleanup_due_at: string;
  migration_complete_condition: string;
}

export interface LessonContinuityMetadata {
  schema_version: number;
  lesson_id: string;
  theme_id: string;
  continuity_mode: "net_new" | "replace" | "merge" | "retire";
  decision_basis: string;
  continuity_route: "start_here" | "restart" | "continue_to_replacement" | "return_then_rejoin";
  predecessor_lesson_ids: string[];
  history_migration_rule: string;
  support_redirect_rule: string;
  analytics_continuity_rule: string;
  aftercare: LessonContinuityAftercare;
  deprecation?: LessonContinuityDeprecation;
}

export interface LessonContinuityResolution {
  requestedLessonId: string;
  resolvedLessonId: string | null;
  redirected: boolean;
  continuity: LessonContinuityMetadata | null;
}
