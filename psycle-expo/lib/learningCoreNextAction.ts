import { lessonSetHasResolvedId } from "./lessonContinuity";
import type {
  LessonSessionRecord,
  LessonSupportCandidate,
  SupportSurfaceRecord,
} from "./app-state/types";
import type {
  CourseManifest,
  CourseManifestLesson,
  LearnerSkillState,
  LearningActionHistoryEntry,
  LearningCoreAction,
  LearningCoreActionKind,
} from "../types/courseManifest";

const SUPPORT_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

function isCompleted(completedLessons: Set<string>, lessonId: string): boolean {
  return lessonSetHasResolvedId(completedLessons, lessonId);
}

function actionForLesson(args: {
  manifest: CourseManifest;
  lesson: CourseManifestLesson;
  kind: LearningCoreActionKind;
  reason: LearningCoreAction["reason"];
}): LearningCoreAction {
  return {
    kind: args.kind,
    lesson_id: args.lesson.lesson_id,
    unit_id: args.lesson.unit_id,
    skill_ids: [...args.lesson.skill_ids],
    reason: args.reason,
  };
}

function unitIsCompleted(
  manifest: CourseManifest,
  unitId: string,
  completedLessons: Set<string>
): boolean {
  const unit = manifest.units.find((candidate) => candidate.unit_id === unitId);
  return Boolean(
    unit && unit.core_lesson_ids.every((lessonId) => isCompleted(completedLessons, lessonId))
  );
}

function canSurfaceSupport(
  manifest: CourseManifest,
  recentActions: LearningActionHistoryEntry[]
): boolean {
  const window = recentActions
    .slice()
    .sort((left, right) => right.ts - left.ts)
    .slice(0, manifest.progression_policy.support_window_size);
  const supportCount = window.filter((entry) => entry.kind !== "core").length;
  return supportCount < manifest.progression_policy.max_support_actions;
}

function supportKind(candidate: LessonSupportCandidate): LearningCoreActionKind {
  return candidate.kind;
}

export function selectLearningCoreAction(args: {
  manifest: CourseManifest;
  completedLessons: Set<string>;
  learnerSkillStates?: LearnerSkillState[];
  recentActions?: LearningActionHistoryEntry[];
  supportCandidate?: LessonSupportCandidate | null;
  requiredRefreshLessonId?: string | null;
  preferReturn?: boolean;
}): LearningCoreAction {
  const lessonById = new Map(
    args.manifest.lessons.map((lesson) => [lesson.lesson_id, lesson])
  );
  const recentActions = args.recentActions ?? [];

  if (args.requiredRefreshLessonId) {
    const refreshLesson = lessonById.get(args.requiredRefreshLessonId);
    if (!refreshLesson) {
      throw new Error(`Required refresh is not in course manifest: ${args.requiredRefreshLessonId}`);
    }
    return actionForLesson({
      manifest: args.manifest,
      lesson: refreshLesson,
      kind: "refresh",
      reason: "required_safety_refresh",
    });
  }

  if (
    args.preferReturn &&
    args.supportCandidate?.kind === "return" &&
    canSurfaceSupport(args.manifest, recentActions)
  ) {
    const returnLesson = lessonById.get(args.supportCandidate.lessonId);
    if (returnLesson) {
      return actionForLesson({
        manifest: args.manifest,
        lesson: returnLesson,
        kind: "return",
        reason: "explicit_return",
      });
    }
  }

  for (const unit of args.manifest.units) {
    const nextLessonId = unit.core_lesson_ids.find(
      (lessonId) => !isCompleted(args.completedLessons, lessonId)
    );
    if (!nextLessonId) continue;
    const prerequisitesComplete = unit.prerequisite_unit_ids.every((unitId) =>
      unitIsCompleted(args.manifest, unitId, args.completedLessons)
    );
    if (!prerequisitesComplete) {
      return {
        kind: "blocked",
        lesson_id: null,
        unit_id: unit.unit_id,
        skill_ids: [...unit.skill_ids],
        reason: "prerequisite_gap",
      };
    }
    const lesson = lessonById.get(nextLessonId);
    if (!lesson) {
      throw new Error(`Core lesson is not in course manifest: ${nextLessonId}`);
    }
    return actionForLesson({
      manifest: args.manifest,
      lesson,
      kind: "core",
      reason: "next_core_lesson",
    });
  }

  if (args.supportCandidate && canSurfaceSupport(args.manifest, recentActions)) {
    const lesson = lessonById.get(args.supportCandidate.lessonId);
    if (lesson) {
      return actionForLesson({
        manifest: args.manifest,
        lesson,
        kind: supportKind(args.supportCandidate),
        reason: "due_support",
      });
    }
  }

  const dueSkillIds = new Set(
    (args.learnerSkillStates ?? [])
      .filter(
        (state) =>
          state.course_id === args.manifest.course_id &&
          state.curriculum_version === args.manifest.curriculum_version &&
          state.stage === "refresh_due"
      )
      .map((state) => state.skill_id)
  );
  const masteryLessons = args.manifest.lessons.filter((lesson) => lesson.lane === "mastery");
  const dueMastery = masteryLessons.find(
    (lesson) =>
      !isCompleted(args.completedLessons, lesson.lesson_id) &&
      lesson.skill_ids.some((skillId) => dueSkillIds.has(skillId))
  );
  if (dueMastery && canSurfaceSupport(args.manifest, recentActions)) {
    return actionForLesson({
      manifest: args.manifest,
      lesson: dueMastery,
      kind: "mastery",
      reason: "due_skill_mastery",
    });
  }

  const remainingMastery = masteryLessons.find(
    (lesson) => !isCompleted(args.completedLessons, lesson.lesson_id)
  );
  if (remainingMastery && canSurfaceSupport(args.manifest, recentActions)) {
    return actionForLesson({
      manifest: args.manifest,
      lesson: remainingMastery,
      kind: "mastery",
      reason: "remaining_mastery",
    });
  }

  return {
    kind: "course_complete",
    lesson_id: null,
    unit_id: null,
    skill_ids: [],
    reason: "course_complete",
  };
}

export function buildRecentLearningActionHistory(args: {
  manifest: CourseManifest;
  lessonSessions: LessonSessionRecord[];
  supportSurfaceHistory: SupportSurfaceRecord[];
}): LearningActionHistoryEntry[] {
  const lessonById = new Map(
    args.manifest.lessons.map((lesson) => [lesson.lesson_id, lesson])
  );
  const supportEntries = args.supportSurfaceHistory
    .filter(
      (record) =>
        lessonById.has(record.lessonId) &&
        (record.lifecycleState === "started" || record.lifecycleState === "completed")
    )
    .map((record) => ({
      kind: record.kind,
      lesson_id: record.lessonId,
      ts: record.startedAt ?? record.ts,
    })) satisfies LearningActionHistoryEntry[];

  const completionEntries = args.lessonSessions.flatMap((session) => {
    if (!session.lastCompletedAt) return [];
    const lesson = lessonById.get(session.lessonId);
    if (!lesson) return [];
    const matchedSupport = supportEntries.some(
      (entry) =>
        entry.lesson_id === session.lessonId &&
        Math.abs(entry.ts - (session.lastCompletedAt ?? 0)) <= SUPPORT_MATCH_WINDOW_MS
    );
    if (matchedSupport) return [];
    return [
      {
        kind: lesson.lane === "mastery" ? "mastery" : "core",
        lesson_id: session.lessonId,
        ts: session.lastCompletedAt,
      } satisfies LearningActionHistoryEntry,
    ];
  });

  return [...supportEntries, ...completionEntries].sort((left, right) => right.ts - left.ts);
}
