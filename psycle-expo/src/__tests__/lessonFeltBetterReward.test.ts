import { shouldAwardFeltBetterXp } from "../../lib/questProgressRules";

const FELT_BETTER_XP = 10;

function applyFeltBetterSelection(
  value: -2 | -1 | 0 | 1 | 2,
  feltBetterSubmitted: boolean,
  addXp: (amount: number) => void
): boolean {
  if (feltBetterSubmitted) return true;
  if (shouldAwardFeltBetterXp(value)) {
    addXp(FELT_BETTER_XP);
  }
  return true;
}

describe("lesson felt_better reward", () => {
  test("felt_better=1 で addXp(10) が1回呼ばれる", () => {
    const addXp = jest.fn();
    applyFeltBetterSelection(1, false, addXp);
    expect(addXp).toHaveBeenCalledTimes(1);
    expect(addXp).toHaveBeenCalledWith(10);
  });

  test("同一レッスンで再タップしても2回目は付与されない", () => {
    const addXp = jest.fn();
    let submitted = false;
    submitted = applyFeltBetterSelection(1, submitted, addXp);
    submitted = applyFeltBetterSelection(2, submitted, addXp);
    expect(addXp).toHaveBeenCalledTimes(1);
  });

  test("felt_better=0 でXP付与されない", () => {
    const addXp = jest.fn();
    applyFeltBetterSelection(0, false, addXp);
    expect(addXp).not.toHaveBeenCalled();
  });
});
