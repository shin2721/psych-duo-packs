export const COURSE_MANIFEST_SCHEMA_VERSION = 1 as const;

export type CourseManifestStatus = "draft" | "pilot" | "active" | "retired";
export type CourseLessonLane = "core" | "mastery";
export type CourseLessonRole = "introduce" | "practice" | "transfer" | "recover";

export interface CourseManifestUnit {
  unit_id: string;
  outcome: string;
  prerequisite_unit_ids: string[];
  skill_ids: string[];
  core_lesson_ids: string[];
  mastery_lesson_ids: string[];
}

export interface CourseManifestSkill {
  skill_id: string;
  outcome: string;
  prerequisite_skill_ids: string[];
}

export interface CourseManifestLesson {
  lesson_id: string;
  unit_id: string;
  skill_ids: string[];
  lane: CourseLessonLane;
  role: CourseLessonRole;
}

export interface CourseProgressionPolicy {
  support_window_size: number;
  max_support_actions: number;
  stable_review_interval_days: number;
}

export interface CourseManifest {
  schema_version: typeof COURSE_MANIFEST_SCHEMA_VERSION;
  curriculum_version: string;
  course_id: string;
  status: CourseManifestStatus;
  updated_at: string;
  progression_policy: CourseProgressionPolicy;
  units: CourseManifestUnit[];
  skills: CourseManifestSkill[];
  lessons: CourseManifestLesson[];
}

export interface CourseManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export type LearnerSkillHighestStage =
  | "unseen"
  | "introduced"
  | "usable"
  | "transferable"
  | "stable";

export type LearnerSkillStage = LearnerSkillHighestStage | "refresh_due";

export interface LearnerSkillState {
  course_id: string;
  curriculum_version: string;
  skill_id: string;
  stage: LearnerSkillStage;
  highest_stage: LearnerSkillHighestStage;
  attempts: number;
  correct_attempts: number;
  transfer_attempts: number;
  transfer_successes: number;
  recent_results: Array<"correct" | "incorrect">;
  last_practiced_at: number | null;
  next_review_at: number | null;
}

export type LearningCoreActionKind =
  | "core"
  | "return"
  | "adaptive"
  | "refresh"
  | "replay"
  | "mastery"
  | "course_complete"
  | "blocked";

export interface LearningCoreAction {
  kind: LearningCoreActionKind;
  lesson_id: string | null;
  unit_id: string | null;
  skill_ids: string[];
  reason:
    | "required_safety_refresh"
    | "explicit_return"
    | "next_core_lesson"
    | "due_support"
    | "due_skill_mastery"
    | "remaining_mastery"
    | "course_complete"
    | "prerequisite_gap";
}

export interface LearningActionHistoryEntry {
  kind: Exclude<LearningCoreActionKind, "course_complete" | "blocked">;
  lesson_id: string;
  ts: number;
}
