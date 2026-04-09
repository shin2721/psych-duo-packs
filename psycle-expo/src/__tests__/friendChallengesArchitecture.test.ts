import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/friendChallenges.ts",
  "utf8"
);

describe("friendChallenges architecture", () => {
  test("friendChallenges no longer relies on as any for weekly xp and profile username", () => {
    expect(source).toContain("interface LeagueMemberXpRow");
    expect(source).toContain("interface LeaderboardUsernameRow");
    expect(source).toContain("for (const row of (memberRows ?? []) as LeagueMemberXpRow[])");
    expect(source).toContain("weeklyXpByUser.set(row.user_id, normalizeXp(row.weekly_xp));");
    expect(source).toContain("if (typeof profile?.username === \"string\" && profile.username.length > 0)");
    expect(source).not.toContain("(row as any).weekly_xp");
    expect(source).not.toContain("(profile as any)?.username");
  });
});
