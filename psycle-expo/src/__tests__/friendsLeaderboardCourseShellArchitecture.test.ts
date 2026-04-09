import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("friends / leaderboard / course shell architecture", () => {
  test("friends screen composes extracted section components", () => {
    const source = read("app/(tabs)/friends.tsx");
    const sections = read("components/friends/FriendsSections.tsx");
    const rows = read("components/friends/FriendsRows.tsx");
    const content = read("components/friends/FriendsContent.tsx");

    expect(source).toContain("FriendsContentView");
    expect(source).toContain("FriendsTabBar");
    expect(source).not.toContain("const renderFriend =");
    expect(source).not.toContain("const renderRequest =");

    expect(sections).toContain('from "./FriendsRows"');
    expect(sections).toContain('from "./FriendsContent"');
    expect(rows).toContain("export function FriendRow");
    expect(rows).toContain("export function FriendRequestRow");
    expect(rows).toContain("export function FriendChallengeCard");
    expect(content).toContain("export function FriendsContentView");
  });

  test("leaderboard screen composes extracted section components", () => {
    const source = read("app/(tabs)/leaderboard.tsx");
    const sections = read("components/leaderboard/LeaderboardSections.tsx");
    const rows = read("components/leaderboard/LeaderboardRows.tsx");
    const content = read("components/leaderboard/LeaderboardContent.tsx");

    expect(source).toContain("LeaderboardHeader");
    expect(source).toContain("LeaderboardContent");
    expect(source).not.toContain("const renderLeaderboardRow =");

    expect(sections).toContain('from "./LeaderboardRows"');
    expect(sections).toContain('from "./LeaderboardContent"');
    expect(rows).toContain("export function LeaderboardSegmentControl");
    expect(rows).toContain("export function LeaderboardRow");
    expect(rows).toContain("export function LeagueLeaderboardSection");
    expect(content).toContain("export function LeaderboardContent");
  });

  test("course screen delegates offer, modal, and league gate rendering", () => {
    const source = read("app/(tabs)/course.tsx");
    const sections = read("components/course/CourseSections.tsx");

    expect(source).toContain("CourseOfferBanner");
    expect(source).toContain("CourseNextStepCard");
    expect(source).toContain("CourseLessonModal");
    expect(source).toContain("CourseLeagueResultGate");
    expect(source).not.toContain("streakRepairCard:");
    expect(source).not.toContain("nextStepCard:");

    expect(sections).toContain("export function CourseOfferBanner");
    expect(sections).toContain("export function CourseNextStepCard");
    expect(sections).toContain("export function CourseLessonModal");
    expect(sections).toContain("export function CourseLeagueResultGate");
  });
});
