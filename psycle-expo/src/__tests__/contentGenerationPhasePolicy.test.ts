import {
  getPhaseForIndex,
  getQuestionTypeForPhase,
  isSupportedDomain,
  selectBalancedPhaseItems,
} from "../../scripts/content-generator/src/phasePolicy";
import { hasHardViolations } from "../../scripts/content-generator/src/critic";

describe("content-generator phase policy", () => {
  test("cycles phases in round-robin order", () => {
    expect(getPhaseForIndex(0)).toBe(1);
    expect(getPhaseForIndex(1)).toBe(2);
    expect(getPhaseForIndex(2)).toBe(3);
    expect(getPhaseForIndex(3)).toBe(4);
    expect(getPhaseForIndex(4)).toBe(5);
    expect(getPhaseForIndex(5)).toBe(1);
  });

  test("maps phase to fixed question type", () => {
    expect(getQuestionTypeForPhase(1)).toBe("swipe_judgment");
    expect(getQuestionTypeForPhase(2)).toBe("multiple_choice");
    expect(getQuestionTypeForPhase(3)).toBe("multiple_choice");
    expect(getQuestionTypeForPhase(4)).toBe("conversation");
    expect(getQuestionTypeForPhase(5)).toBe("conversation");
  });

  test("supports only known domains", () => {
    expect(isSupportedDomain("mental")).toBe(true);
    expect(isSupportedDomain("social")).toBe(true);
    expect(isSupportedDomain("unknown")).toBe(false);
    expect(isSupportedDomain(undefined)).toBe(false);
  });

  test("returns null when any phase has fewer than 2 questions", () => {
    const items = [
      { phase: 1, id: "a" },
      { phase: 1, id: "b" },
      { phase: 2, id: "c" },
      { phase: 2, id: "d" },
      { phase: 3, id: "e" },
      { phase: 3, id: "f" },
      { phase: 4, id: "g" }, // only one for phase 4
      { phase: 5, id: "h" },
      { phase: 5, id: "i" },
    ];
    expect(selectBalancedPhaseItems(items, 2)).toBeNull();
  });

  test("selects 2 items per phase in fixed order", () => {
    const items = [
      { phase: 3, id: "p3a" },
      { phase: 1, id: "p1a" },
      { phase: 2, id: "p2a" },
      { phase: 4, id: "p4a" },
      { phase: 5, id: "p5a" },
      { phase: 1, id: "p1b" },
      { phase: 2, id: "p2b" },
      { phase: 3, id: "p3b" },
      { phase: 4, id: "p4b" },
      { phase: 5, id: "p5b" },
      { phase: 1, id: "p1c" }, // extra, should not be selected
    ];

    const selected = selectBalancedPhaseItems(items, 2);
    expect(selected).not.toBeNull();
    expect(selected!.length).toBe(10);
    expect(selected!.map((x) => x.phase)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});

describe("critic hard-violation gate", () => {
  test("treats vocabulary_hygiene as hard violation", () => {
    expect(
      hasHardViolations({
        vocabulary_hygiene: true,
      } as any)
    ).toBe(true);
  });

  test("returns false when no hard violations exist", () => {
    expect(hasHardViolations(undefined as any)).toBe(false);
  });
});
