import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("runtime error policy cleanup", () => {
  test("recoverable failures route through dev logging helpers", () => {
    const friendSearch = read("components/FriendSearch.tsx");
    const leagueReward = read("lib/leagueReward.ts");
    const settingsBilling = read("lib/settings/useSettingsBillingActions.ts");
    const lessonEffects = read("lib/lesson/useLessonCompletionEffects.ts");
    const lessonCompletion = read("lib/lesson/lessonCompletion.ts");
    const friendsScreen = read("lib/friends/useFriendsScreen.ts");
    const leaderboardScreen = read("lib/leaderboard/useLeaderboardScreen.ts");

    expect(friendSearch).toContain('warnDev("Friend search failed:", error);');
    expect(friendSearch).toContain('warnDev("Friend request failed:", error);');
    expect(friendSearch).not.toContain("console.error('Search error:");

    expect(leagueReward).toContain("warnDev('[Reward] Error fetching pending reward:'");
    expect(leagueReward).not.toContain("console.error('[Reward]");

    expect(settingsBilling).toContain('warnDev("Restore purchases failed:", error);');
    expect(settingsBilling).toContain('warnDev("Open billing portal failed:", error);');

    expect(lessonEffects).toContain('warnDev("[DoubleXpNudge] Failed to evaluate:", error);');
    expect(lessonEffects).toContain('warnDev("[Dogfood] Failed to log felt_better:", error);');

    expect(lessonCompletion).toContain('warnDev("[DoubleXpNudge] Failed to read state:", error);');
    expect(lessonCompletion).toContain('warnDev("[Experiment] Failed to persist exposure state:", error);');

    expect(friendsScreen).toContain("warnDev(message, error);");
    expect(leaderboardScreen).toContain("warnDev(message, error);");
  });
});
