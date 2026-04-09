import {
  calculatePromotionDemotion,
  calculateRewards,
  getPromotionBadgeId,
  getPromotionGems,
} from "../../lib/league/leagueRewards";
import type { LeagueMember } from "../../lib/league/shared";

function createMember(
  userId: string,
  weeklyXp: number,
  rank = 0
): LeagueMember {
  return {
    user_id: userId,
    username: userId,
    weekly_xp: weeklyXp,
    rank,
    is_self: false,
  };
}

describe("league rewards", () => {
  test("promotion and demotion boundaries follow configured percentages", () => {
    const members = [
      createMember("u1", 100),
      createMember("u2", 90),
      createMember("u3", 80),
      createMember("u4", 70),
      createMember("u5", 60),
    ];

    const result = calculatePromotionDemotion(members);

    expect(result.promoted).toEqual(["u1"]);
    expect(result.demoted).toEqual(["u5"]);
  });

  test("first place gets participation, promotion, and first place rewards", () => {
    const members = [
      createMember("winner", 100),
      createMember("runner-up", 90),
      createMember("third", 80),
      createMember("fourth", 70),
      createMember("fifth", 60),
    ];

    const rewards = calculateRewards(members, 0);
    const winner = rewards.find((reward) => reward.user_id === "winner");
    const fifth = rewards.find((reward) => reward.user_id === "fifth");

    expect(winner).toEqual({
      user_id: "winner",
      gems: 85,
      badges: ["league_silver", "league_first_place"],
      promoted: true,
      demoted: false,
      first_place: true,
    });
    expect(fifth).toEqual({
      user_id: "fifth",
      gems: 10,
      badges: [],
      promoted: false,
      demoted: true,
      first_place: false,
    });
  });

  test("promotion reward helpers stay aligned with reward table", () => {
    expect(getPromotionGems(3)).toBe(75);
    expect(getPromotionBadgeId(3)).toBe("league_platinum");
    expect(getPromotionGems(99)).toBe(0);
    expect(getPromotionBadgeId(99)).toBeNull();
  });
});
