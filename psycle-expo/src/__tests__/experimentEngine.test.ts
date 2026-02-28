import {
  assignExperiment,
  assignVariant,
  getVariantPayload,
  isUserInRollout,
  isExperimentEnabled,
} from "../../lib/experimentEngine";

describe("experimentEngine", () => {
  test("assignVariant is deterministic for same user and experiment", () => {
    const variants = [
      { id: "control", weight: 50, payload: {} },
      { id: "variant_a", weight: 50, payload: {} },
    ];

    const first = assignVariant("user_1", "exp_a", variants);
    const second = assignVariant("user_1", "exp_a", variants);

    expect(first).toBe(second);
    expect(["control", "variant_a"]).toContain(first);
  });

  test("assignVariant falls back to first variant when total weight is zero", () => {
    const variants = [
      { id: "control", weight: 0, payload: {} },
      { id: "variant_a", weight: 0, payload: {} },
    ];
    expect(assignVariant("user_2", "exp_b", variants)).toBe("control");
  });

  test("unknown variant payload returns null", () => {
    expect(getVariantPayload("missing_experiment", "control")).toBeNull();
  });

  test("disabled experiments are not assignable by default config", () => {
    expect(isExperimentEnabled("double_xp_nudge_lesson_complete")).toBe(false);
    expect(assignExperiment("user_3", "double_xp_nudge_lesson_complete")).toBeNull();
  });

  test("rollout gate returns false at 0% and true at 100%", () => {
    expect(isUserInRollout("user_1", "exp_rollout", 0)).toBe(false);
    expect(isUserInRollout("user_1", "exp_rollout", 100)).toBe(true);
  });

  test("rollout gate is deterministic for same user and experiment", () => {
    const first = isUserInRollout("user_9", "exp_rollout", 37);
    const second = isUserInRollout("user_9", "exp_rollout", 37);
    expect(first).toBe(second);
  });
});
