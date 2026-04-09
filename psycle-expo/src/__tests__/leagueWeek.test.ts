jest.mock("../../lib/analytics", () => ({
  __esModule: true,
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import {
  ensureJoinedLeagueForCurrentWeek,
  getCurrentWeekId,
  getLastWeekId,
} from "../../lib/league";
import { supabase } from "../../lib/supabase";

const mockSupabase = supabase as unknown as {
  rpc: jest.Mock;
  from: jest.Mock;
};

describe("league week helpers", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  test("getCurrentWeekId returns server value when rpc succeeds", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: "2026-W12", error: null });

    await expect(getCurrentWeekId()).resolves.toBe("2026-W12");
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_current_week_id");
  });

  test("getLastWeekId falls back to formatted week id when rpc fails", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-07T12:00:00.000Z"));
    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("offline") });

    const result = await getLastWeekId();

    expect(result).toMatch(/^\d{4}-W\d{2}$/);
    expect(warnSpy).toHaveBeenCalledWith(
      "[League] Failed to get last week ID from server, using fallback:",
      expect.any(Error)
    );
  });

  test("membership cache is cleared when the week changes", async () => {
    const weekIds = ["2026-W12", "2026-W12", "2026-W13"];
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn !== "get_current_week_id") {
        return Promise.resolve({ data: null, error: null });
      }

      const nextWeekId = weekIds.shift() || "2026-W13";
      return Promise.resolve({ data: nextWeekId, error: null });
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "league_members") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { league_id: "league-1", leagues: { tier: 1 } },
          error: null,
        }),
      };
    });

    await ensureJoinedLeagueForCurrentWeek("user-a");
    await ensureJoinedLeagueForCurrentWeek("user-a");
    await ensureJoinedLeagueForCurrentWeek("user-a");

    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });
});
