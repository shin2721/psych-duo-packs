jest.mock("../../lib/league/leagueWeek", () => ({
  getCurrentWeekId: jest.fn(async () => "2026-W12"),
  getLastWeekId: jest.fn(async () => "2026-W11"),
}));

jest.mock("../../lib/analytics", () => ({
  __esModule: true,
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { getMyLeague } from "../../lib/league/leagueMembership";
import { supabase } from "../../lib/supabase";

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
};

describe("league read model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getMyLeague returns ranked members and zone boundaries", async () => {
    let leagueMembersCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "league_members") {
        throw new Error(`Unexpected table: ${table}`);
      }

      leagueMembersCallCount += 1;
      if (leagueMembersCallCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { league_id: "league-1", leagues: { tier: 2 } },
            error: null,
          }),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              user_id: "user-a",
              weekly_xp: 120,
              leaderboard: { username: "Alice" },
            },
            {
              user_id: "user-b",
              weekly_xp: 90,
              leaderboard: { username: "Bob" },
            },
            {
              user_id: "user-c",
              weekly_xp: 20,
              leaderboard: { username: "Cara" },
            },
          ],
          error: null,
        }),
      };
    });

    const result = await getMyLeague("user-b");

    expect(result).toEqual({
      league_id: "league-1",
      week_id: "2026-W12",
      tier: 2,
      tier_name: "ゴールド",
      tier_color: "#FFD700",
      tier_icon: "🥇",
      members: [
        {
          user_id: "user-a",
          username: "Alice",
          weekly_xp: 120,
          rank: 1,
          is_self: false,
        },
        {
          user_id: "user-b",
          username: "Bob",
          weekly_xp: 90,
          rank: 2,
          is_self: true,
        },
        {
          user_id: "user-c",
          username: "Cara",
          weekly_xp: 20,
          rank: 3,
          is_self: false,
        },
      ],
      my_rank: 2,
      promotion_zone: 1,
      demotion_zone: 4,
    });
  });

  test("getMyLeague returns null when membership is missing", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    await expect(getMyLeague("user-a")).resolves.toBeNull();
  });

  test("guest users short-circuit without touching supabase", async () => {
    await expect(getMyLeague("guest_user_test")).resolves.toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
