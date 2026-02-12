jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import { LeagueInfo, computeLeagueBoundaryStatus } from "../../lib/league";

function buildLeague(
  members: Array<{ userId: string; xp: number; rank: number }>,
  promotionZone = 3,
  demotionZone = 8
): LeagueInfo {
  return {
    league_id: "league-1",
    week_id: "2026-W07",
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

describe("league boundary status", () => {
  test("昇格圏外・降格圏外では promotion_chase を返す", () => {
    const league = buildLeague([
      { userId: "u1", xp: 140, rank: 1 },
      { userId: "u2", xp: 130, rank: 2 },
      { userId: "u3", xp: 110, rank: 3 },
      { userId: "u4", xp: 100, rank: 4 },
      { userId: "me", xp: 95, rank: 5 },
      { userId: "u6", xp: 90, rank: 6 },
      { userId: "u7", xp: 85, rank: 7 },
      { userId: "u8", xp: 80, rank: 8 },
      { userId: "u9", xp: 70, rank: 9 },
    ]);

    const status = computeLeagueBoundaryStatus(league, "me");
    expect(status).not.toBeNull();
    expect(status?.mode).toBe("promotion_chase");
    expect(status?.xpGap).toBe(16); // 110 - 95 + 1
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

    const status = computeLeagueBoundaryStatus(league, "me");
    expect(status).not.toBeNull();
    expect(status?.mode).toBe("demotion_risk");
    expect(status?.xpGap).toBe(21); // 120 - 100 + 1
  });

  test("昇格圏内は null（非表示）", () => {
    const league = buildLeague([
      { userId: "u1", xp: 150, rank: 1 },
      { userId: "me", xp: 140, rank: 2 },
      { userId: "u3", xp: 130, rank: 3 },
      { userId: "u4", xp: 120, rank: 4 },
    ]);

    const status = computeLeagueBoundaryStatus(league, "me");
    expect(status).toBeNull();
  });

  test("同点ケースでも +1 XP を要求する", () => {
    const league = buildLeague([
      { userId: "u1", xp: 140, rank: 1 },
      { userId: "u2", xp: 130, rank: 2 },
      { userId: "u3", xp: 100, rank: 3 },
      { userId: "me", xp: 100, rank: 4 },
      { userId: "u5", xp: 90, rank: 5 },
    ], 3, 5);

    const status = computeLeagueBoundaryStatus(league, "me");
    expect(status).not.toBeNull();
    expect(status?.mode).toBe("promotion_chase");
    expect(status?.xpGap).toBe(1);
  });
});
