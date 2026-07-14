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
