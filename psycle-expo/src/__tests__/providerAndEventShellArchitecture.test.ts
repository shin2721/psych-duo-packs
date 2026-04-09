import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("provider and event shell architecture", () => {
  test("progression delegates config constants and value assembly", () => {
    const source = read("lib/app-state/progression.tsx");

    expect(source).toContain('from "./progression/progressionConfig"');
    expect(source).toContain('from "./progression/useProgressionValue"');
    expect(source).not.toContain("const QUEST_CLAIM_BONUS_GEMS_BY_TYPE =");
    expect(source).not.toContain("const value = useMemo<ProgressionContextValue>(");
  });

  test("economy delegates config constants and value assembly", () => {
    const source = read("lib/app-state/economy.tsx");

    expect(source).toContain('from "./economy/economyConfig"');
    expect(source).toContain('from "./economy/useEconomyValue"');
    expect(source).not.toContain("const entitlementConfig =");
    expect(source).not.toContain("const value = useMemo<EconomyContextValue>(");
  });

  test("analytics events file is a façade over category files", () => {
    const source = read("lib/analytics.events.ts");

    expect(source).toContain('from "./analytics-events/lifecycle"');
    expect(source).toContain('from "./analytics-events/economy"');
    expect(source).toContain('from "./analytics-events/progression"');
    expect(source).toContain('from "./analytics-events/commerceSocial"');
    expect(source).toContain("export type TrackedEvent =");
  });
});
