import {
  canAddMasteryVariant,
  completeMasteryVariant,
  createEmptyMasteryThemeState,
  getThemeIdFromMasteryVariantId,
  isMasteryVariantId,
  recordMasteryThemeEvidence,
  registerMasteryVariant,
  syncMasteryThemeSupply,
  retireMasteryVariant,
} from "../../lib/app-state/mastery";

describe("mastery runtime state", () => {
  test("graduates only when repeat stability and scene/transfer evidence exist", () => {
    const base = createEmptyMasteryThemeState({ themeId: "mental" });
    const next = recordMasteryThemeEvidence(base, {
      attemptDelta: 3,
      sceneId: "mental_l01",
      repeatWithoutDropoff: true,
    });
    const final = recordMasteryThemeEvidence(next, {
      sceneId: "mental_l02",
    });
    const graduated = recordMasteryThemeEvidence(final, {
      sceneId: "mental_l03",
    });

    expect(next.graduationState).toBe("learning");
    expect(graduated.graduationState).toBe("graduated");
  });

  test("reaches ceiling when repetition risk is high and learning delta is flat", () => {
    const base = createEmptyMasteryThemeState({ themeId: "mental" });
    const next = recordMasteryThemeEvidence(base, {
      attemptDelta: 5,
      sceneId: "mental_l01",
      newLearningValueDelta: 0.05,
      transferGainSlope: 0,
      repetitionRisk: 0.9,
    });

    expect(next.masteryCeilingState).toBe("ceiling_reached");
  });

  test("respects active mastery slot limits and supports retire", () => {
    let state = createEmptyMasteryThemeState({ themeId: "mental", maxActiveSlots: 2 });
    state = registerMasteryVariant(state, "m1");
    state = registerMasteryVariant(state, "m2");

    expect(canAddMasteryVariant(state)).toBe(false);
    expect(state.activeVariantIds).toEqual(["m1", "m2"]);

    const retired = retireMasteryVariant(state, "m1");
    expect(retired.activeVariantIds).toEqual(["m2"]);
    expect(retired.retiredVariantIds).toContain("m1");
    expect(canAddMasteryVariant(retired)).toBe(true);
  });

  test("does not revive retired mastery variants", () => {
    let state = createEmptyMasteryThemeState({ themeId: "mental", maxActiveSlots: 2 });
    state = registerMasteryVariant(state, "mental_m01");
    state = retireMasteryVariant(state, "mental_m01");
    state = registerMasteryVariant(state, "mental_m01");

    expect(state.activeVariantIds).toEqual([]);
    expect(state.retiredVariantIds).toEqual(["mental_m01"]);
  });

  test("completion retires the variant, reopens the slot, and can graduate the theme", () => {
    let state = createEmptyMasteryThemeState({ themeId: "mental", maxActiveSlots: 2 });
    state = registerMasteryVariant(state, "mental_m01");
    state = registerMasteryVariant(state, "mental_m02");

    const afterFirst = completeMasteryVariant(state, {
      variantId: "mental_m01",
      completionCount: 1,
      abandonmentCount: 0,
    });

    expect(afterFirst.activeVariantIds).toEqual(["mental_m02"]);
    expect(afterFirst.retiredVariantIds).toContain("mental_m01");
    expect(canAddMasteryVariant(afterFirst)).toBe(true);

    let towardGraduation = registerMasteryVariant(afterFirst, "mental_m03");
    towardGraduation = completeMasteryVariant(towardGraduation, {
      variantId: "mental_m02",
      completionCount: 1,
      abandonmentCount: 0,
    });
    towardGraduation = completeMasteryVariant(towardGraduation, {
      variantId: "mental_m03",
      completionCount: 1,
      abandonmentCount: 0,
      transferImprovement: true,
    });

    expect(towardGraduation.graduationState).toBe("graduated");
    expect(towardGraduation.activeVariantIds).toEqual([]);
    expect(towardGraduation.retiredVariantIds).toEqual(
      expect.arrayContaining(["mental_m01", "mental_m02", "mental_m03"])
    );
  });

  test("parses mastery variant ids by theme", () => {
    expect(isMasteryVariantId("mental_m01")).toBe(true);
    expect(getThemeIdFromMasteryVariantId("mental_m01")).toBe("mental");
    expect(isMasteryVariantId("mental_l01")).toBe(false);
    expect(getThemeIdFromMasteryVariantId("mental_l01")).toBeNull();
  });

  test("syncs available mastery supply into open slots without reviving retired variants", () => {
    const base = createEmptyMasteryThemeState({ themeId: "mental", maxActiveSlots: 2 });
    const seeded = syncMasteryThemeSupply(base, {
      availableVariantIds: ["mental_m01", "mental_m02", "mental_m03"],
    });

    expect(seeded.activeVariantIds).toEqual(["mental_m01", "mental_m02"]);

    const retired = retireMasteryVariant(seeded, "mental_m01");
    const resynced = syncMasteryThemeSupply(retired, {
      availableVariantIds: ["mental_m01", "mental_m02", "mental_m03"],
    });

    expect(resynced.activeVariantIds).toEqual(["mental_m02", "mental_m03"]);
    expect(resynced.retiredVariantIds).toContain("mental_m01");
  });
});
