import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/app-state/progression.tsx",
  "utf8"
);

describe("progression container architecture", () => {
  test("provider imports the new internal hooks", () => {
    expect(source).toContain('from "./progression/useProgressionRefs"');
    expect(source).toContain('from "./progression/useProgressionHydrationEffect"');
    expect(source).toContain('from "./progression/useProgressionPersistenceEffects"');
    expect(source).toContain('from "./progression/useProgressionPeriodicEffects"');
    expect(source).toContain('from "./progression/useProgressionBadgeEffects"');
    expect(source).toContain('from "./progression/useProgressionPersonalizationEffects"');
  });

  test("provider no longer keeps the old orchestration bodies inline", () => {
    expect(source).not.toContain("const assignPersonalizationSegment = useCallback");
    expect(source).not.toContain("reconcileQuestCyclesState({");
    expect(source).not.toContain("reconcileEventCampaignState({");
  });

  test("provider useEffect count is flattened away", () => {
    const useEffectCount = (source.match(/useEffect\(/g) ?? []).length;
    expect(useEffectCount).toBe(0);
  });
});
