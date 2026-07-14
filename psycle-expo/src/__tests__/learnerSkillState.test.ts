import {
  reconcileLearnerSkillStatesWithManifest,
  recordLearnerSkillLessonCompletion,
  recordLearnerSkillQuestionResult,
  refreshLearnerSkillStates,
} from "../../lib/learnerSkillState";
import { getCourseManifest } from "../../lib/courseManifestRuntime";

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
      skill_id: "mental_separate_signal_story",
      stage: "introduced",
      highest_stage: "introduced",
      attempts: 1,
      correct_attempts: 1,
    });
  });

  test("completion uses the manifest lesson role", () => {
    const introduced = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l01",
      nowMs: 1_000,
    });
    const transferred = recordLearnerSkillLessonCompletion({
      states: introduced,
      lessonId: "mental_l02",
      nowMs: 2_000,
    });

    expect(transferred[0]).toMatchObject({
      stage: "transferable",
      highest_stage: "transferable",
      transfer_attempts: 1,
      transfer_successes: 1,
    });
  });

  test("a spaced second transfer reaches stable", () => {
    const first = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l02",
      nowMs: 1_000,
    });
    const second = recordLearnerSkillLessonCompletion({
      states: first,
      lessonId: "mental_l02",
      nowMs: 1_000 + DAY,
    });

    expect(second[0]).toMatchObject({
      stage: "stable",
      highest_stage: "stable",
      transfer_attempts: 2,
    });
  });

  test("elapsed time marks a learned skill for refresh without erasing its peak", () => {
    const transferred = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l02",
      nowMs: 1_000,
    });

    const refreshed = refreshLearnerSkillStates(transferred, 1_000 + 8 * DAY);

    expect(refreshed[0]).toMatchObject({
      stage: "refresh_due",
      highest_stage: "transferable",
    });
  });

  test("repeated recent errors mark refresh due", () => {
    let states = recordLearnerSkillLessonCompletion({
      states: [],
      lessonId: "mental_l02",
      nowMs: 1_000,
    });
    for (let index = 0; index < 3; index += 1) {
      states = recordLearnerSkillQuestionResult({
        states,
        lessonId: "mental_l02",
        result: "incorrect",
        nowMs: 2_000 + index,
      });
    }

    expect(states[0]).toMatchObject({
      stage: "refresh_due",
      highest_stage: "transferable",
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
      completedLessons: new Set(["mental_l01", "mental_l02"]),
      lessonSessions: [
        {
          lessonId: "mental_l02",
          questionIds: ["mental_l02_001"],
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
      states.find((state) => state.skill_id === "mental_separate_signal_story")
    ).toMatchObject({
      curriculum_version: "mental-v1.0.0",
      stage: "transferable",
      highest_stage: "transferable",
      last_practiced_at: 2_000,
    });
    expect(
      states.find((state) => state.skill_id === "mental_choose_reversible_step")
    ).toMatchObject({ stage: "unseen", highest_stage: "unseen" });
  });
});
