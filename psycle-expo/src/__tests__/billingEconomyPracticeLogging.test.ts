import fs from "node:fs";

function read(relativePath: string): string {
  return fs.readFileSync(
    `/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${relativePath}`,
    "utf8"
  );
}

describe("billing/economy/practice log policy", () => {
  test("billing hydrate fallback uses logDev instead of console.log", () => {
    const source = read("lib/app-state/billing.tsx");

    expect(source).toContain('logDev("Billing sync failed (using local defaults):", error);');
    expect(source).not.toContain('console.log("Billing sync failed (using local defaults):", error);');
  });

  test("economy recoverable fallbacks use devLog helpers", () => {
    const providerSource = read("lib/app-state/economy.tsx");
    const hydrationSource = read("lib/app-state/economy/useEconomyHydrationEffect.ts");
    const persistenceSource = read("lib/app-state/economy/useEconomyPersistenceEffects.ts");
    const actionsSource = read("lib/app-state/economy/economyActions.ts");

    expect(hydrationSource).toContain('logDev("Economy local storage read failed:", error);');
    expect(persistenceSource).toContain('warnDev("Failed to sync gems to Supabase", error);');
    expect(actionsSource).toContain('warnDev("Failed to add freeze to streak data", error)');
    expect(actionsSource).toContain('warnDev("Failed to use freeze from streak data", error)');
    expect(providerSource).not.toContain('console.log("Economy local storage read failed:", error);');
    expect(providerSource).not.toContain('console.error("Failed to sync gems to Supabase", error);');
    expect(providerSource).not.toContain('console.error("Failed to add freeze to streak data", error);');
    expect(providerSource).not.toContain('console.error("Failed to use freeze from streak data", error);');
  });

  test("practice hydrate fallback uses logDev and parse warnings remain", () => {
    const practiceSource = read("lib/app-state/practice.tsx");
    const persistenceSource = read("lib/app-state/practicePersistence.ts");

    expect(practiceSource).toContain('logDev("Practice local storage read failed:", error);');
    expect(practiceSource).not.toContain('console.log("Practice local storage read failed:", error);');
    expect(persistenceSource).toContain('console.warn("Failed to parse stored mistakes:", error);');
    expect(persistenceSource).toContain('console.warn("Failed to parse stored review events:", error);');
  });
});
