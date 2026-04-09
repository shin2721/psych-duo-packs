import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("useLessonPostCompletion architecture", () => {
  test("wraps completion effects and nudge purchase handling", () => {
    const source = read("lib/lesson/useLessonPostCompletion.ts");

    expect(source).toContain("export function useLessonPostCompletion");
    expect(source).toContain("const completionEffects = useLessonCompletionEffects");
    expect(source).toContain("const handleDoubleXpNudgePurchase = useCallback");
    expect(source).toContain('trackDoubleXpNudgeClicked(params.gems)');
    expect(source).toContain('params.buyDoubleXP("lesson_complete_nudge")');
    expect(source).toContain("showFeltBetterPrompt:");
  });
});
