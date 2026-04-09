import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("progression and section compression architecture", () => {
  test("progressionActions is a shell over focused action modules", () => {
    const shell = read("lib/app-state/progression/progressionActions.ts");
    const quest = read("lib/app-state/progression/progressionQuestActions.ts");
    const streak = read("lib/app-state/progression/progressionStreakEntries.ts");
    const xp = read("lib/app-state/progression/progressionXpActions.ts");

    expect(shell).toContain('from "./progressionXpActions"');
    expect(shell).toContain('from "./progressionQuestActions"');
    expect(shell).toContain('from "./progressionStreakEntries"');
    expect(quest).toContain("export function claimQuestAction");
    expect(streak).toContain("export async function updateStreakForTodayEntry");
    expect(xp).toContain("export async function addXpAction");
  });

  test("friends and leaderboard section shells delegate rows/content/styles", () => {
    const friendsShell = read("components/friends/FriendsSections.tsx");
    const leaderboardShell = read("components/leaderboard/LeaderboardSections.tsx");

    expect(friendsShell).toContain('from "./FriendsRows"');
    expect(friendsShell).toContain('from "./FriendsContent"');
    expect(leaderboardShell).toContain('from "./LeaderboardRows"');
    expect(leaderboardShell).toContain('from "./LeaderboardContent"');
  });
});
