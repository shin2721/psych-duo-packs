import { getCourseManifest, getCourseManifestLesson } from "./courseManifestRuntime";
import { lessonSetHasResolvedId, resolveRuntimeLessonId } from "./lessonContinuity";
import type { LessonSessionRecord } from "./app-state/types";
import type {
  CourseManifest,
  CourseLessonRole,
  LearnerSkillHighestStage,
  LearnerSkillState,
  LearnerSkillStage,
} from "../types/courseManifest";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_RESULT_LIMIT = 5;
const STAGE_RANK: Record<LearnerSkillHighestStage, number> = {
  unseen: 0,
  introduced: 1,
  usable: 2,
  transferable: 3,
  stable: 4,
};
const HIGHEST_STAGES = new Set<LearnerSkillHighestStage>([
  "unseen",
  "introduced",
  "usable",
  "transferable",
  "stable",
]);

function courseIdFromLessonId(lessonId: string): string | null {
  return lessonId.match(/^([a-z]+)_(?:l|m)\d+$/)?.[1] ?? null;
}

function higherStage(
  current: LearnerSkillHighestStage,
  candidate: LearnerSkillHighestStage
): LearnerSkillHighestStage {
  return STAGE_RANK[candidate] > STAGE_RANK[current] ? candidate : current;
}

function stageForRole(role: CourseLessonRole): LearnerSkillHighestStage {
  switch (role) {
    case "introduce":
      return "introduced";
    case "practice":
      return "usable";
    case "transfer":
    case "recover":
      return "transferable";
  }
}

function reviewIntervalDays(
  stage: LearnerSkillHighestStage,
  stableReviewIntervalDays: number
): number | null {
  switch (stage) {
    case "unseen":
      return null;
    case "introduced":
      return 1;
    case "usable":
      return 3;
    case "transferable":
      return 7;
    case "stable":
      return stableReviewIntervalDays;
  }
}

function createSkillState(args: {
  courseId: string;
  curriculumVersion: string;
  skillId: string;
}): LearnerSkillState {
  return {
    course_id: args.courseId,
    curriculum_version: args.curriculumVersion,
    skill_id: args.skillId,
    stage: "unseen",
    highest_stage: "unseen",
    attempts: 0,
    correct_attempts: 0,
    transfer_attempts: 0,
    transfer_successes: 0,
    recent_results: [],
    last_practiced_at: null,
    next_review_at: null,
  };
}

function applyReviewSchedule(args: {
  state: LearnerSkillState;
  nowMs: number;
  stableReviewIntervalDays: number;
}): LearnerSkillState {
  const intervalDays = reviewIntervalDays(
    args.state.highest_stage,
    args.stableReviewIntervalDays
  );
  return {
    ...args.state,
    stage: args.state.highest_stage,
    last_practiced_at: args.nowMs,
    next_review_at: intervalDays === null ? null : args.nowMs + intervalDays * MS_PER_DAY,
  };
}

function upsertSkillState(
  states: LearnerSkillState[],
  courseId: string,
  curriculumVersion: string,
  skillId: string,
  update: (state: LearnerSkillState) => LearnerSkillState
): LearnerSkillState[] {
  const current =
    states.find((state) => state.course_id === courseId && state.skill_id === skillId) ??
    createSkillState({ courseId, curriculumVersion, skillId });
  const next = update({ ...current, curriculum_version: curriculumVersion });
  return [
    ...states.filter((state) => !(state.course_id === courseId && state.skill_id === skillId)),
    next,
  ];
}

export function refreshLearnerSkillStates(
  states: LearnerSkillState[],
  nowMs: number = Date.now()
): LearnerSkillState[] {
  return states.map((state) => {
    const recentIncorrect = state.recent_results.filter((result) => result === "incorrect").length;
    const recentResultDue =
      state.recent_results.length >= 3 && recentIncorrect > state.recent_results.length / 2;
    const timeDue = state.next_review_at !== null && state.next_review_at <= nowMs;
    const stage: LearnerSkillStage =
      state.highest_stage !== "unseen" && (recentResultDue || timeDue)
        ? "refresh_due"
        : state.highest_stage;
    return { ...state, stage };
  });
}

export function normalizeLearnerSkillStates(
  raw: unknown,
  nowMs: number = Date.now()
): LearnerSkillState[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const courseId = typeof record.course_id === "string" ? record.course_id : "";
    const curriculumVersion =
      typeof record.curriculum_version === "string" ? record.curriculum_version : "";
    const skillId = typeof record.skill_id === "string" ? record.skill_id : "";
    const highestStage = HIGHEST_STAGES.has(record.highest_stage as LearnerSkillHighestStage)
      ? (record.highest_stage as LearnerSkillHighestStage)
      : "unseen";
    if (!courseId || !curriculumVersion || !skillId) return [];

    const toCount = (value: unknown) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
    };
    const toTimestamp = (value: unknown) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
    };
    const recentResults = Array.isArray(record.recent_results)
      ? record.recent_results
          .filter(
            (result): result is "correct" | "incorrect" =>
              result === "correct" || result === "incorrect"
          )
          .slice(-RECENT_RESULT_LIMIT)
      : [];

    return [
      {
        course_id: courseId,
        curriculum_version: curriculumVersion,
        skill_id: skillId,
        stage: highestStage,
        highest_stage: highestStage,
        attempts: toCount(record.attempts),
        correct_attempts: toCount(record.correct_attempts),
        transfer_attempts: toCount(record.transfer_attempts),
        transfer_successes: toCount(record.transfer_successes),
        recent_results: recentResults,
        last_practiced_at: toTimestamp(record.last_practiced_at),
        next_review_at: toTimestamp(record.next_review_at),
      } satisfies LearnerSkillState,
    ];
  });

  const deduplicated = new Map<string, LearnerSkillState>();
  normalized.forEach((state) => {
    deduplicated.set(`${state.course_id}:${state.skill_id}`, state);
  });
  return refreshLearnerSkillStates([...deduplicated.values()], nowMs);
}

export function reconcileLearnerSkillStatesWithManifest(args: {
  states: LearnerSkillState[];
  manifest: CourseManifest;
  completedLessons: Set<string>;
  lessonSessions?: LessonSessionRecord[];
  nowMs?: number;
}): LearnerSkillState[] {
  const nowMs = args.nowMs ?? Date.now();
  const currentSkillIds = new Set(args.manifest.skills.map((skill) => skill.skill_id));
  const existingBySkillId = new Map(
    args.states
      .filter((state) => state.course_id === args.manifest.course_id)
      .map((state) => [state.skill_id, state])
  );
  const lastCompletionByLessonId = new Map<string, number>();

  (args.lessonSessions ?? []).forEach((session) => {
    if (!session.lastCompletedAt) return;
    const canonicalLessonId =
      resolveRuntimeLessonId(session.lessonId).resolvedLessonId ?? session.lessonId;
    const current = lastCompletionByLessonId.get(canonicalLessonId) ?? 0;
    if (session.lastCompletedAt > current) {
      lastCompletionByLessonId.set(canonicalLessonId, session.lastCompletedAt);
    }
  });

  const reconciledCurrentStates = args.manifest.skills.map((skill) => {
    const existing =
      existingBySkillId.get(skill.skill_id) ??
      createSkillState({
        courseId: args.manifest.course_id,
        curriculumVersion: args.manifest.curriculum_version,
        skillId: skill.skill_id,
      });
    let inferredStage: LearnerSkillHighestStage = "unseen";
    let inferredLastPracticedAt: number | null = null;

    args.manifest.lessons.forEach((lesson) => {
      if (!lesson.skill_ids.includes(skill.skill_id)) return;
      if (!lessonSetHasResolvedId(args.completedLessons, lesson.lesson_id)) return;
      inferredStage = higherStage(inferredStage, stageForRole(lesson.role));
      const completedAt = lastCompletionByLessonId.get(lesson.lesson_id) ?? null;
      if (
        completedAt !== null &&
        (inferredLastPracticedAt === null || completedAt > inferredLastPracticedAt)
      ) {
        inferredLastPracticedAt = completedAt;
      }
    });

    const highestStage = higherStage(existing.highest_stage, inferredStage);
    const lastPracticedAt =
      existing.last_practiced_at === null
        ? inferredLastPracticedAt
        : inferredLastPracticedAt === null
          ? existing.last_practiced_at
          : Math.max(existing.last_practiced_at, inferredLastPracticedAt);
    const intervalDays = reviewIntervalDays(
      highestStage,
      args.manifest.progression_policy.stable_review_interval_days
    );

    return {
      ...existing,
      course_id: args.manifest.course_id,
      curriculum_version: args.manifest.curriculum_version,
      skill_id: skill.skill_id,
      stage: highestStage,
      highest_stage: highestStage,
      last_practiced_at: lastPracticedAt,
      next_review_at:
        lastPracticedAt === null || intervalDays === null
          ? existing.next_review_at
          : lastPracticedAt + intervalDays * MS_PER_DAY,
    } satisfies LearnerSkillState;
  });

  const preservedStates = args.states.filter(
    (state) =>
      state.course_id !== args.manifest.course_id || !currentSkillIds.has(state.skill_id)
  );
  return refreshLearnerSkillStates([...preservedStates, ...reconciledCurrentStates], nowMs);
}

export function recordLearnerSkillQuestionResult(args: {
  states: LearnerSkillState[];
  lessonId: string;
  result: "correct" | "incorrect";
  nowMs?: number;
}): LearnerSkillState[] {
  const courseId = courseIdFromLessonId(args.lessonId);
  if (!courseId) return args.states;
  const manifest = getCourseManifest(courseId);
  const lesson = getCourseManifestLesson(courseId, args.lessonId);
  if (!manifest || !lesson) return args.states;
  const nowMs = args.nowMs ?? Date.now();

  const updated = lesson.skill_ids.reduce(
    (states, skillId) =>
      upsertSkillState(
        states,
        courseId,
        manifest.curriculum_version,
        skillId,
        (state) => {
          const recentResults = [...state.recent_results, args.result].slice(-RECENT_RESULT_LIMIT);
          return applyReviewSchedule({
            state: {
              ...state,
              highest_stage: higherStage(state.highest_stage, "introduced"),
              attempts: state.attempts + 1,
              correct_attempts: state.correct_attempts + (args.result === "correct" ? 1 : 0),
              recent_results: recentResults,
            },
            nowMs,
            stableReviewIntervalDays: manifest.progression_policy.stable_review_interval_days,
          });
        }
      ),
    args.states
  );

  return refreshLearnerSkillStates(updated, nowMs);
}

export function recordLearnerSkillLessonCompletion(args: {
  states: LearnerSkillState[];
  lessonId: string;
  nowMs?: number;
}): LearnerSkillState[] {
  const courseId = courseIdFromLessonId(args.lessonId);
  if (!courseId) return args.states;
  const manifest = getCourseManifest(courseId);
  const lesson = getCourseManifestLesson(courseId, args.lessonId);
  if (!manifest || !lesson) return args.states;
  const nowMs = args.nowMs ?? Date.now();

  return lesson.skill_ids.reduce(
    (states, skillId) =>
      upsertSkillState(
        states,
        courseId,
        manifest.curriculum_version,
        skillId,
        (state) => {
          const roleStage = stageForRole(lesson.role);
          const spacedTransfer =
            (lesson.role === "transfer" || lesson.role === "recover") &&
            state.highest_stage === "transferable" &&
            state.last_practiced_at !== null &&
            nowMs - state.last_practiced_at >= MS_PER_DAY;
          const highestStage = spacedTransfer
            ? "stable"
            : higherStage(state.highest_stage, roleStage);
          const isTransfer = lesson.role === "transfer" || lesson.role === "recover";
          return applyReviewSchedule({
            state: {
              ...state,
              highest_stage: highestStage,
              transfer_attempts: state.transfer_attempts + (isTransfer ? 1 : 0),
              transfer_successes: state.transfer_successes + (isTransfer ? 1 : 0),
            },
            nowMs,
            stableReviewIntervalDays: manifest.progression_policy.stable_review_interval_days,
          });
        }
      ),
    args.states
  );
}
