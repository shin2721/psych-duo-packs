import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/app-state/progression/progressionEvents.ts",
  "utf8"
);

describe("progression type architecture", () => {
  test("event reward quest accumulation is typed", () => {
    expect(source).toContain("type EventQuestInstance");
    expect(source).toContain("const rewardedQuests: EventQuestInstance[] = [];");
    expect(source).not.toContain("let rewardedQuests: any[] = [];");
  });
});
