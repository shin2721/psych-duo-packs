jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import { LeagueInfo, computeLeagueSprintStatus } from "../../lib/league";

function buildLeague(
  members: Array<{ userId: string; xp: number; rank: number }>,
  promotionZone = 3,
  demotionZone = 8
): LeagueInfo {
  return {
    league_id: "league-1",
    week_id: "2026-W11",
    tier: 2,
    tier_name: "Gold",
    tier_color: "#FFD700",
    tier_icon: "🥇",
    members: members.map((m) => ({
      user_id: m.userId,
      username: m.userId,
      weekly_xp: m.xp,
      rank: m.rank,
      is_self: m.userId === "me",
    })),
    my_rank: members.find((m) => m.userId === "me")?.rank || 0,
    promotion_zone: promotionZone,
    demotion_zone: demotionZone,
  };
}

describe("league sprint status", () => {
  test("日曜以外は null", () => {
    const league = buildLeague([
      { userId: "u1", xp: 160, rank: 1 },
      { userId: "u2", xp: 150, rank: 2 },
      { userId: "u3", xp: 140, rank: 3 },
      { userId: "me", xp: 100, rank: 4 },
      { userId: "u5", xp: 90, rank: 5 },
    ]);

    const status = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 16, 12, 0, 0)); // Monday
    expect(status).toBeNull();
  });

  test("日曜かつ xpGap<=60 は eligible", () => {
    const league = buildLeague([
      { userId: "u1", xp: 200, rank: 1 },
      { userId: "u2", xp: 180, rank: 2 },
      { userId: "u3", xp: 150, rank: 3 },
      { userId: "me", xp: 100, rank: 4 },
      { userId: "u5", xp: 90, rank: 5 },
    ]);

    const status = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 15, 10, 0, 0)); // Sunday
    expect(status).not.toBeNull();
    expect(status?.mode).toBe("promotion_chase");
    expect(status?.xpGap).toBe(51);
  });

  test("日曜でも xpGap>60 は null", () => {
    const league = buildLeague([
      { userId: "u1", xp: 220, rank: 1 },
      { userId: "u2", xp: 200, rank: 2 },
      { userId: "u3", xp: 180, rank: 3 },
      { userId: "me", xp: 100, rank: 4 },
      { userId: "u5", xp: 90, rank: 5 },
    ]);

    const status = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 15, 10, 0, 0)); // Sunday
    expect(status).toBeNull();
  });

  test("降格圏内では demotion_risk を返す", () => {
    const league = buildLeague([
      { userId: "u1", xp: 180, rank: 1 },
      { userId: "u2", xp: 170, rank: 2 },
      { userId: "u3", xp: 160, rank: 3 },
      { userId: "u4", xp: 150, rank: 4 },
      { userId: "u5", xp: 140, rank: 5 },
      { userId: "u6", xp: 130, rank: 6 },
      { userId: "u7", xp: 120, rank: 7 },
      { userId: "u8", xp: 110, rank: 8 },
      { userId: "me", xp: 100, rank: 9 },
    ]);

    const status = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 15, 18, 0, 0));
    expect(status).not.toBeNull();
    expect(status?.mode).toBe("demotion_risk");
    expect(status?.xpGap).toBe(21);
  });

  test("hoursToDeadline は 1..24 にクランプされる", () => {
    const league = buildLeague([
      { userId: "u1", xp: 200, rank: 1 },
      { userId: "u2", xp: 180, rank: 2 },
      { userId: "u3", xp: 150, rank: 3 },
      { userId: "me", xp: 100, rank: 4 },
      { userId: "u5", xp: 90, rank: 5 },
    ]);

    const early = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 15, 0, 5, 0));
    const late = computeLeagueSprintStatus(league, "me", new Date(2026, 2, 15, 23, 50, 0));

    expect(early?.hoursToDeadline).toBe(24);
    expect(late?.hoursToDeadline).toBe(1);
  });
});
