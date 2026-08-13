import mentalManifestJson from "../../data/courses/mental.manifest.json";
import {
  buildRecentLearningActionHistory,
  selectLearningCoreAction,
} from "../../lib/learningCoreNextAction";
import type { CourseManifest, LearningActionHistoryEntry } from "../../types/courseManifest";

function manifest(): CourseManifest {
  return JSON.parse(JSON.stringify(mentalManifestJson)) as CourseManifest;
}

describe("learning core next action", () => {
  test("selects the first incomplete core lesson from the approved manifest", () => {
    const action = selectLearningCoreAction({
      manifest: manifest(),
      completedLessons: new Set(["mental_l01"]),
    });

    expect(action).toMatchObject({
      kind: "core",
      lesson_id: "mental_l02",
      unit_id: "mental_screen_and_sleep",
      reason: "next_core_lesson",
    });
  });

  test("does not put a retired legacy lesson back into the core path", () => {
    const action = selectLearningCoreAction({
      manifest: manifest(),
      completedLessons: new Set(["mental_l01", "mental_l02", "mental_l04"]),
    });

    expect(action).toMatchObject({ kind: "core", lesson_id: "mental_l03" });
  });

  test("required safety refresh overrides core and the support cap", () => {
    const recentActions: LearningActionHistoryEntry[] = [
      { kind: "return", lesson_id: "mental_l01", ts: 7 },
      { kind: "adaptive", lesson_id: "mental_l02", ts: 6 },
    ];
    const action = selectLearningCoreAction({
      manifest: manifest(),
      completedLessons: new Set(),
      recentActions,
      requiredRefreshLessonId: "mental_l03",
    });

    expect(action).toMatchObject({
      kind: "refresh",
      lesson_id: "mental_l03",
      reason: "required_safety_refresh",
    });
  });

  test("an explicit return can lead only while support remains under two of seven", () => {
    const course = manifest();
    const returnCandidate = {
      kind: "return" as const,
      lessonId: "mental_l01",
      questionIds: ["q1", "q2", "q3"],
      reason: "abandonment" as const,
    };
    const allowed = selectLearningCoreAction({
      manifest: course,
      completedLessons: new Set(),
      supportCandidate: returnCandidate,
      preferReturn: true,
      recentActions: [{ kind: "core", lesson_id: "mental_l01", ts: 1 }],
    });
    const capped = selectLearningCoreAction({
      manifest: course,
      completedLessons: new Set(),
      supportCandidate: returnCandidate,
      preferReturn: true,
      recentActions: [
        { kind: "return", lesson_id: "mental_l01", ts: 3 },
        { kind: "adaptive", lesson_id: "mental_l03", ts: 2 },
        { kind: "core", lesson_id: "mental_l01", ts: 1 },
      ],
    });

    expect(allowed.kind).toBe("return");
    expect(capped).toMatchObject({ kind: "core", lesson_id: "mental_l01" });
  });

  test("does not let optional adaptive practice replace available core", () => {
    const action = selectLearningCoreAction({
      manifest: manifest(),
      completedLessons: new Set(),
      supportCandidate: {
        kind: "adaptive",
        lessonId: "mental_l02",
        questionIds: ["q1", "q2", "q3"],
        reason: "weakness",
      },
    });

    expect(action).toMatchObject({ kind: "core", lesson_id: "mental_l01" });
  });

  test("fails closed at the first incomplete unit when its prerequisite is missing", () => {
    const course = manifest();
    course.units[0].prerequisite_unit_ids = [course.units[1].unit_id];
    course.units[1].prerequisite_unit_ids = [];

    const action = selectLearningCoreAction({
      manifest: course,
      completedLessons: new Set(),
    });

    expect(action).toMatchObject({
      kind: "blocked",
      unit_id: "mental_discovery_sampler",
      reason: "prerequisite_gap",
    });
  });

  test("reports course completion without inventing mastery inventory", () => {
    const action = selectLearningCoreAction({
      manifest: manifest(),
      completedLessons: new Set([
        "mental_l01",
        "mental_l02",
        "mental_l03",
        "mental_l07",
      ]),
    });

    expect(action).toEqual({
      kind: "course_complete",
      lesson_id: null,
      unit_id: null,
      skill_ids: [],
      reason: "course_complete",
    });
  });

  test("builds rolling action history without double counting support completion", () => {
    const history = buildRecentLearningActionHistory({
      manifest: manifest(),
      lessonSessions: [
        {
          lessonId: "mental_l01",
          questionIds: ["q1", "q2", "q3"],
          lastStartedAt: 900,
          lastCompletedAt: 1_000,
          lastAbandonedAt: null,
          abandonmentCount: 0,
          completionCount: 1,
        },
        {
          lessonId: "mental_l03",
          questionIds: ["q1", "q2", "q3"],
          lastStartedAt: 1_900,
          lastCompletedAt: 2_000,
          lastAbandonedAt: null,
          abandonmentCount: 0,
          completionCount: 1,
        },
      ],
      supportSurfaceHistory: [
        {
          lessonId: "mental_l04",
          kind: "replay",
          reason: "completion_drift",
          lifecycleState: "started",
          ts: 2_500,
          startedAt: 2_500,
        },
        {
          lessonId: "mental_l03",
          kind: "adaptive",
          reason: "weakness",
          lifecycleState: "completed",
          ts: 1_800,
          startedAt: 1_900,
        },
      ],
    });

    expect(history).toEqual([
      { kind: "adaptive", lesson_id: "mental_l03", ts: 1_900 },
      { kind: "core", lesson_id: "mental_l01", ts: 1_000 },
    ]);
  });
});
