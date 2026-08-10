import {
  reconcileLearnerSkillStatesWithManifest,
  recordLearnerSkillLessonCompletion,
  recordLearnerSkillQuestionResult,
  refreshLearnerSkillStates,
} from "../../lib/learnerSkillState";
import { getCourseManifest } from "../../lib/courseManifestRuntime";
import type { LearnerSkillState } from "../../types/courseManifest";

const DAY = 24 * 60 * 60 * 1000;

describe("learner skill state", () => {
  test("a question introduces a skill without claiming mastery", () => {
    const states = recordLearnerSkillQuestionResult({
      states: [],
      lessonId: "mental_l01",
      result: "correct",
      nowMs: 1_000,
    });

    expect(states[0]).toMatchObject({
      skill_id: "mental_calibrate_intuition",
      stage: "introduced",
      highest_stage: "introduced",
      attempts: 1,
      correct_attempts: 1,
    });
  });

  test("pilot completion records introduction without claiming transfer", () => {
    const samplerIntroduced = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l01",
      nowMs: 1_000,
    });
    const skillIntroduced = recordLearnerSkillLessonCompletion({
      states: samplerIntroduced,
      lessonId: "mental_l03",
      nowMs: 2_000,
    });

    expect(skillIntroduced).toHaveLength(2);
    expect(skillIntroduced).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skill_id: "mental_calibrate_intuition",
          stage: "introduced",
          transfer_attempts: 0,
        }),
        expect.objectContaining({
          skill_id: "mental_separate_signal_and_forecast",
          stage: "introduced",
          transfer_attempts: 0,
        }),
      ])
    );
  });

  test("retired legacy completion cannot advance current skill state", () => {
    // mental_l04 は manifest 外に退役したままのレッスン。
    const states = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l04",
      nowMs: 1_000,
    });

    expect(states).toEqual([]);
  });

  test("elapsed time marks a learned skill for refresh without erasing its peak", () => {
    const transferred = [{
      course_id: "mental",
      curriculum_version: "mental-v1.1.0",
      skill_id: "fixture_transfer_skill",
      stage: "transferable",
      highest_stage: "transferable",
      attempts: 1,
      correct_attempts: 1,
      transfer_attempts: 1,
      transfer_successes: 1,
      recent_results: ["correct"],
      last_practiced_at: 1_000,
      next_review_at: 1_000 + 7 * DAY,
    } satisfies LearnerSkillState];

    const refreshed = refreshLearnerSkillStates(transferred, 1_000 + 8 * DAY);

    expect(refreshed[0]).toMatchObject({
      stage: "refresh_due",
      highest_stage: "transferable",
    });
  });

  test("repeated recent errors mark refresh due", () => {
    let states = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l03",
      nowMs: 1_000,
    });
    for (let index = 0; index < 3; index += 1) {
      states = recordLearnerSkillQuestionResult({
        states,
        lessonId: "mental_l03",
        result: "incorrect",
        nowMs: 2_000 + index,
      });
    }

    expect(states[0]).toMatchObject({
      stage: "refresh_due",
      highest_stage: "introduced",
      recent_results: ["incorrect", "incorrect", "incorrect"],
    });
  });

  test("existing completion history is reconciled into the current curriculum", () => {
    const manifest = getCourseManifest("mental");
    expect(manifest).not.toBeNull();
    if (!manifest) return;

    const states = reconcileLearnerSkillStatesWithManifest({
      states: [],
      manifest,
      completedLessons: new Set(["mental_l01", "mental_l03"]),
      lessonSessions: [
        {
          lessonId: "mental_l03",
          questionIds: ["mental_l03_q1"],
          lastStartedAt: 1_000,
          lastCompletedAt: 2_000,
          lastAbandonedAt: null,
          abandonmentCount: 0,
          completionCount: 1,
        },
      ],
      nowMs: 3_000,
    });

    expect(states).toHaveLength(3);
    expect(
      states.find((state) => state.skill_id === "mental_calibrate_intuition")
    ).toMatchObject({
      curriculum_version: "mental-v1.1.0",
      stage: "introduced",
      highest_stage: "introduced",
      last_practiced_at: null,
    });
    // l02 は未完了なので、そのスキルは unseen のまま登録される。
    expect(
      states.find((state) => state.skill_id === "mental_calibrate_rule_from_effect_size")
    ).toMatchObject({
      curriculum_version: "mental-v1.1.0",
      stage: "unseen",
      highest_stage: "unseen",
      last_practiced_at: null,
    });
    expect(
      states.find((state) => state.skill_id === "mental_separate_signal_and_forecast")
    ).toMatchObject({
      curriculum_version: "mental-v1.1.0",
      stage: "introduced",
      highest_stage: "introduced",
      last_practiced_at: 2_000,
    });
  });
});
