const mockWarnDev = jest.fn();
const mockTrack = jest.fn();

jest.mock("../../lib/league/leagueWeek", () => ({
  getCurrentWeekId: jest.fn(async () => "2026-W12"),
  getLastWeekId: jest.fn(async () => "2026-W11"),
}));

jest.mock("../../lib/devLog", () => ({
  logDev: jest.fn(),
  warnDev: (...args: unknown[]) => mockWarnDev(...args),
  errorDev: jest.fn(),
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock("../../lib/gamificationConfig", () => ({
  getLeagueMatchmakingConfig: jest.fn(() => ({
    relative_gap_weight: 1,
    variance_penalty_weight: 1,
  })),
}));

jest.mock("../../lib/league/leagueMatchmaking", () => ({
  evaluateLeagueCandidatesByXpProxy: jest.fn().mockResolvedValue({
    candidateCount: 0,
    selected: null,
    userTotalXp: 120,
  }),
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

import { addWeeklyXp, getMyLeague, joinLeague } from "../../lib/league/leagueMembership";
import { supabase } from "../../lib/supabase";

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
};

function createMembershipBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
}

describe("league logging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getMyLeague no-membership path is silent", async () => {
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    await expect(getMyLeague("user-a")).resolves.toBeNull();
    expect(consoleLogSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  test("addWeeklyXp recoverable failure routes through dev warn helper", async () => {
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn === "add_weekly_xp") {
        return Promise.resolve({ error: new Error("rpc failed") });
      }
      return Promise.resolve({ data: "2026-W12", error: null });
    });

    mockSupabase.from.mockReturnValue(createMembershipBuilder({
      data: { league_id: "league-1", leagues: { tier: 1 } },
      error: null,
    }));

    await addWeeklyXp("user-a", 25);

    expect(mockWarnDev).toHaveBeenCalledWith("[League] Failed to add weekly XP:", expect.any(Error));
  });

  test("joinLeague recoverable failure routes through dev warn helper", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "league_members") {
        return {
          ...createMembershipBuilder({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: new Error("join failed") }),
        };
      }

      if (table === "leagues") {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: "league-new" }, error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(joinLeague("user-a", 0)).resolves.toBeNull();
    expect(mockWarnDev).toHaveBeenCalledWith("[League] Error joining league:", expect.any(Error));
  });
});
