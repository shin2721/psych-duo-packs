import { selectMasteryCandidate } from "../../lib/masteryCandidate";
import type { MasteryThemeState } from "../../lib/app-state/types";

function buildState(overrides: Partial<MasteryThemeState> = {}): MasteryThemeState {
  return {
    themeId: "mental",
    parentUnitId: "mental",
    maxActiveSlots: 3,
    activeVariantIds: ["mental_m01"],
    retiredVariantIds: [],
    sceneIdsCleared: ["mental_l01", "mental_l02", "mental_l03"],
    scenesClearedCount: 3,
    attemptCount: 3,
    transferImprovement: false,
    repeatWithoutDropoff: true,
    newLearningValueDelta: 0.8,
    transferGainSlope: 0.2,
    repetitionRisk: 0.2,
    graduationState: "learning",
    masteryCeilingState: "open",
    lastEvaluatedAt: 1,
    ...overrides,
  };
}

const completedCoreTrail = [
  { lessonFile: "mental_l01", type: "lesson" },
  { lessonFile: "mental_l02", type: "lesson" },
  { lessonFile: "mental_l03", type: "lesson" },
  { lessonFile: "mental_review_bh1", type: "review_blackhole" },
];

describe("selectMasteryCandidate", () => {
  test("returns actionable candidate when core unit is complete and state is open", () => {
    const candidate = selectMasteryCandidate({
      themeId: "mental",
      currentTrail: completedCoreTrail,
      completedLessons: new Set(["mental_l01", "mental_l02", "mental_l03"]),
      masteryThemeState: buildState(),
    });

    expect(candidate).toEqual({
      themeId: "mental",
      lessonId: "mental_m01",
      activeSlotsRemaining: 2,
      graduationState: "learning",
      masteryCeilingState: "open",
    });
  });

  test("does not return candidate before core unit completion", () => {
    const candidate = selectMasteryCandidate({
      themeId: "mental",
      currentTrail: completedCoreTrail,
      completedLessons: new Set(["mental_l01", "mental_l02"]),
      masteryThemeState: buildState(),
    });

    expect(candidate).toBeNull();
  });

  test("does not return candidate after graduation or ceiling", () => {
    expect(
      selectMasteryCandidate({
        themeId: "mental",
        currentTrail: completedCoreTrail,
        completedLessons: new Set(["mental_l01", "mental_l02", "mental_l03"]),
        masteryThemeState: buildState({ graduationState: "graduated" }),
      })
    ).toBeNull();

    expect(
      selectMasteryCandidate({
        themeId: "mental",
        currentTrail: completedCoreTrail,
        completedLessons: new Set(["mental_l01", "mental_l02", "mental_l03"]),
        masteryThemeState: buildState({ masteryCeilingState: "ceiling_reached" }),
      })
    ).toBeNull();
  });

  test("does not return candidate when slots are exhausted", () => {
    const candidate = selectMasteryCandidate({
      themeId: "mental",
      currentTrail: completedCoreTrail,
      completedLessons: new Set(["mental_l01", "mental_l02", "mental_l03"]),
      masteryThemeState: buildState({
        maxActiveSlots: 1,
        activeVariantIds: ["mental_m01"],
      }),
    });

    expect(candidate).toBeNull();
  });
});
