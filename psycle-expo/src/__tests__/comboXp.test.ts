import { computeComboBonusXp, getComboMultiplier } from "../../lib/comboXp";
import type { ComboXpConfig } from "../../lib/gamificationConfig";

const baseConfig: ComboXpConfig = {
  enabled: true,
  milestones: [
    { streak: 3, multiplier: 1.2 },
    { streak: 5, multiplier: 1.5 },
    { streak: 10, multiplier: 2.0 },
  ],
  bonus_cap_per_lesson: 20,
};

describe("comboXp", () => {
  test("streak 2 では bonus=0", () => {
    const result = computeComboBonusXp({
      baseXp: 5,
      streak: 2,
      usedBonusXp: 0,
      cap: 20,
      config: baseConfig,
    });
    expect(result.bonusXp).toBe(0);
    expect(result.multiplier).toBe(1);
  });

  test("streak 3/5/10 で倍率が 1.2/1.5/2.0", () => {
    expect(getComboMultiplier(3, baseConfig)).toBe(1.2);
    expect(getComboMultiplier(5, baseConfig)).toBe(1.5);
    expect(getComboMultiplier(10, baseConfig)).toBe(2.0);
  });

  test("cap超過時に bonus が切り詰められる", () => {
    const result = computeComboBonusXp({
      baseXp: 5,
      streak: 10,
      usedBonusXp: 19,
      cap: 20,
      config: baseConfig,
    });
    expect(result.bonusXp).toBe(1);
    expect(result.nextUsedBonusXp).toBe(20);
  });

  test("config無効時は bonus=0", () => {
    const result = computeComboBonusXp({
      baseXp: 5,
      streak: 10,
      usedBonusXp: 0,
      cap: 20,
      config: { ...baseConfig, enabled: false },
    });
    expect(result.bonusXp).toBe(0);
    expect(result.multiplier).toBe(1);
  });
});
