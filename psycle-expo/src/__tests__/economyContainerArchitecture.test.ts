import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/app-state/economy.tsx",
  "utf8"
);

describe("economy container architecture", () => {
  test("provider imports new internal hooks and action helpers", () => {
    expect(source).toContain('from "./economy/useEconomyHydrationEffect"');
    expect(source).toContain('from "./economy/useEconomyPersistenceEffects"');
    expect(source).toContain('from "./economy/useEconomyPeriodicEffects"');
    expect(source).toContain('from "./economy/useEconomyEnergyRuntime"');
    expect(source).toContain('from "./economy/economyActions"');
  });

  test("provider no longer keeps old inline effect bodies", () => {
    expect(source).not.toContain("const recoverEnergy = () =>");
    expect(source).not.toContain('createPersistNumberEffect({');
    expect(source).not.toContain("runHydrationTask({");
  });

  test("provider useEffect count is flattened away", () => {
    const useEffectCount = (source.match(/useEffect\(/g) ?? []).length;
    expect(useEffectCount).toBe(0);
  });
});
