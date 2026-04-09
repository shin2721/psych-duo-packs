import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final recoverable logging", () => {
  test("recoverable fallback files route through dev logging helpers", () => {
    const analyticsConfig = read("lib/analytics.config.ts");
    const analyticsCore = read("lib/analyticsCore.ts");
    const remoteContent = read("lib/remoteContent.ts");
    const leagueWeek = read("lib/league/leagueWeek.ts");
    const leagueMatchmaking = read("lib/league/leagueMatchmaking.ts");
    const badgeEffects = read("lib/app-state/progression/useProgressionBadgeEffects.ts");
    const personalizationEffects = read("lib/app-state/progression/useProgressionPersonalizationEffects.ts");
    const sounds = read("lib/sounds.ts");
    const haptics = read("lib/haptics.ts");

    expect(analyticsConfig).toContain('warnDev(');
    expect(analyticsConfig).not.toContain("console.warn(");

    expect(analyticsCore).toContain("logDev(`[Analytics] ${message}`, payload);");
    expect(analyticsCore).toContain('warnDev(`[Analytics] ${message}:`, error);');
    expect(analyticsCore).not.toContain("console.log(`[Analytics]");

    expect(remoteContent).toContain('warnRemoteContent("Failed to save to cache:", error);');
    expect(remoteContent).not.toContain("console.error('[RemoteContent] Failed to save to cache:");

    expect(leagueWeek).toContain('warnDev(');
    expect(leagueWeek).not.toContain("console.warn(");

    expect(leagueMatchmaking).toContain('warnDev("[League] Failed to fetch total_xp:", error);');
    expect(leagueMatchmaking).toContain('warnDev("[League] Failed to list candidate leagues:", leaguesError);');
    expect(leagueMatchmaking).toContain('warnDev(');
    expect(leagueMatchmaking).not.toContain("console.warn(");

    expect(badgeEffects).toContain('warnDev("Failed to load user badges:", error);');
    expect(badgeEffects).not.toContain('console.error("Failed to load user badges:"');

    expect(personalizationEffects).toContain('warnDev("[Personalization] Failed to fetch 7d lesson counts:");');
    expect(personalizationEffects).toContain('warnDev("[Personalization] Initial segment assignment failed:", error);');
    expect(personalizationEffects).toContain('warnDev("[Personalization] Segment reassignment failed:", error);');
    expect(personalizationEffects).not.toContain("console.warn(");

    expect(sounds).toContain("warnDev('Error playing sound:', error);");
    expect(sounds).not.toContain("console.log('Error playing sound:");

    expect(haptics).toContain("warnDev('Haptics not supported', error);");
    expect(haptics).not.toContain("console.warn('Haptics not supported'");
  });
});
