import { getComboMilestone, getNextCombo } from "../../lib/comboMilestone";

describe("comboMilestone", () => {
  test("fires milestone only on 3/5/10", () => {
    expect(getComboMilestone(3)).toBe(3);
    expect(getComboMilestone(5)).toBe(5);
    expect(getComboMilestone(10)).toBe(10);
  });

  test("returns null for non-milestone combo counts", () => {
    expect(getComboMilestone(0)).toBeNull();
    expect(getComboMilestone(1)).toBeNull();
    expect(getComboMilestone(2)).toBeNull();
    expect(getComboMilestone(4)).toBeNull();
    expect(getComboMilestone(6)).toBeNull();
    expect(getComboMilestone(11)).toBeNull();
  });

  test("resets combo on incorrect answer", () => {
    expect(getNextCombo(4, false)).toBe(0);
    expect(getNextCombo(0, false)).toBe(0);
  });
});
