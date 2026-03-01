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

  test("double_xp_nudge_lesson_complete stays disabled until rollout start", () => {
    expect(isExperimentEnabled("double_xp_nudge_lesson_complete")).toBe(false);
    expect(assignExperiment("user_aa_hold", "double_xp_nudge_lesson_complete")).toBeNull();
  });

  test("assignment is deterministic with rollout gating enabled", () => {
    const first = assignExperiment("user_3", "double_xp_nudge_lesson_complete");
    const second = assignExperiment("user_3", "double_xp_nudge_lesson_complete");
    expect(second).toEqual(first);
    if (first) {
      expect(first.experimentId).toBe("double_xp_nudge_lesson_complete");
      expect(["control", "variant_a"]).toContain(first.variantId);
    }
  });

  test("pro_trial_checkout keeps deterministic rollout buckets", () => {
    const first = isUserInRollout("user_10", "pro_trial_checkout", 5);
    const second = isUserInRollout("user_10", "pro_trial_checkout", 5);
    expect(first).toBe(second);
    expect(isExperimentEnabled("pro_trial_checkout")).toBe(false);
    expect(assignExperiment("user_10", "pro_trial_checkout")).toBeNull();
  });

  test("pro_monthly_price_jp remains disabled until explicitly enabled", () => {
    const first = isUserInRollout("user_11", "pro_monthly_price_jp", 5);
    const second = isUserInRollout("user_11", "pro_monthly_price_jp", 5);
    expect(first).toBe(second);
    expect(isExperimentEnabled("pro_monthly_price_jp")).toBe(false);
    expect(assignExperiment("user_11", "pro_monthly_price_jp")).toBeNull();
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
