jest.mock("../../lib/league", () => ({
  getCurrentWeekId: jest.fn(async () => "2026-W20"),
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  getFriendChallengeRewardGems,
  resolveFriendChallengeClaimResult,
} from "../../lib/friendChallenges";

describe("friend challenge claims", () => {
  test("reward gems value comes from config", () => {
    expect(getFriendChallengeRewardGems()).toBe(15);
  });

  test("insert success resolves to claimed", () => {
    const result = resolveFriendChallengeClaimResult({
      inserted: true,
      insertErrorCode: null,
    });
    expect(result).toBe("claimed");
  });

  test("duplicate key resolves to already_claimed", () => {
    const result = resolveFriendChallengeClaimResult({
      inserted: false,
      insertErrorCode: "23505",
    });
    expect(result).toBe("already_claimed");
  });

  test("other insert errors resolve to error", () => {
    const result = resolveFriendChallengeClaimResult({
      inserted: false,
      insertErrorCode: "42501",
    });
    expect(result).toBe("error");
  });
});
