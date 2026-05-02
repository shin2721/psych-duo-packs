import fs from "fs";
import path from "path";

const progressionFile = path.join(
  __dirname,
  "../../lib/app-state/progression.tsx"
);
const progressionHydrationFile = path.join(
  __dirname,
  "../../lib/app-state/progression/progressionHydration.ts"
);
const progressionHydrationEffectFile = path.join(
  __dirname,
  "../../lib/app-state/progression/useProgressionHydrationEffect.ts"
);
const progressionPersistenceEffectsFile = path.join(
  __dirname,
  "../../lib/app-state/progression/useProgressionPersistenceEffects.ts"
);
const progressionXpActionsFile = path.join(
  __dirname,
  "../../lib/app-state/progression/progressionXpActions.ts"
);

describe("progression logging policy", () => {
  test("recoverable sync paths use dev helpers and do not keep legacy console calls", () => {
    const source = fs.readFileSync(progressionFile, "utf8");
    const hydrationSource = fs.readFileSync(progressionHydrationFile, "utf8");
    const hydrationEffectSource = fs.readFileSync(progressionHydrationEffectFile, "utf8");
    const persistenceEffectsSource = fs.readFileSync(progressionPersistenceEffectsFile, "utf8");
    const xpActionsSource = fs.readFileSync(progressionXpActionsFile, "utf8");

    expect(hydrationSource).toContain('logDev("Progression Supabase sync failed (using local data):", error)');
    expect(hydrationEffectSource).toContain('logDev("Progression local storage read failed:", error)');
    expect(persistenceEffectsSource).toContain('warnDev("Failed to sync XP to Supabase", error)');
    expect(persistenceEffectsSource).toContain('warnDev("Failed to sync streak to Supabase", error)');
    expect(xpActionsSource).toContain('warnDev("[League] Failed to add weekly XP:", error)');

    expect(source).not.toContain('console.log("Progression Supabase sync failed (using local data):"');
    expect(source).not.toContain('console.log("Progression local storage read failed:"');
    expect(source).not.toContain('console.error("Failed to sync XP to Supabase"');
    expect(source).not.toContain('console.error("Failed to sync streak to Supabase"');
    expect(source).not.toContain('console.log("[League] Weekly XP added:"');
  });
});
