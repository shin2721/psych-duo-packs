import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("runtime noise cleanup 2", () => {
  test("recoverable logs route through devLog helpers", () => {
    const authContext = read("lib/AuthContext.tsx");
    const dogfood = read("lib/dogfood.ts");
    const streaks = read("lib/streaks.ts");
    const profile = read("lib/profile/useProfileScreen.ts");

    expect(authContext).toContain('warnDev(\'Failed to load guest session for E2E mode\'');
    expect(authContext).toContain("logDev('Supabase auth check failed', error);");
    expect(authContext).not.toContain("console.log('Supabase auth check failed')");

    expect(dogfood).toContain('logDev("[Dogfood] Logged lesson completion"');
    expect(dogfood).toContain('logDev("[Dogfood] Logged intervention"');
    expect(dogfood).toContain('warnDev("[Dogfood] Failed to save log:", e);');
    expect(dogfood).not.toContain('console.log("[Dogfood] Logged lesson completion:');

    expect(streaks).toContain("logDev('[Analytics] streak_lost'");
    expect(streaks).not.toContain("console.log('[Analytics] streak_lost'");

    expect(profile).toContain('warnDev("Failed to load profile data:", error);');
    expect(profile).toContain('warnDev("Failed to load profile league:", error);');
    expect(profile).not.toContain('console.error("Failed to load profile data:", error);');
  });
});
