import {
  DEMOTION_PERCENT,
  PROMOTION_PERCENT,
  type LeagueMember,
  type LeagueRewardResult,
} from "./shared";

export const LEAGUE_REWARDS = {
  promotion: {
    1: { gems: 25, badge: "league_silver" },
    2: { gems: 50, badge: "league_gold" },
    3: { gems: 75, badge: "league_platinum" },
    4: { gems: 100, badge: "league_diamond" },
    5: { gems: 150, badge: "league_master" },
  } as Record<number, { gems: number; badge: string }>,
  firstPlace: {
    gems: 50,
    badge: "league_first_place",
  },
  participation: {
    gems: 10,
  },
} as const;

export function calculatePromotionDemotion(members: LeagueMember[]): {
  promoted: string[];
  demoted: string[];
} {
  const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
  const total = sorted.length;
  const promotionCount = Math.ceil(total * PROMOTION_PERCENT);
  const demotionStart = total - Math.floor(total * DEMOTION_PERCENT);

  return {
    promoted: sorted.slice(0, promotionCount).map((member) => member.user_id),
    demoted: sorted.slice(demotionStart).map((member) => member.user_id),
  };
}

export function getPromotionBadgeId(newTier: number): string | null {
  return LEAGUE_REWARDS.promotion[newTier]?.badge || null;
}

export function getPromotionGems(newTier: number): number {
  return LEAGUE_REWARDS.promotion[newTier]?.gems || 0;
}

export function calculateRewards(
  members: LeagueMember[],
  currentTier: number
): LeagueRewardResult[] {
  const { promoted, demoted } = calculatePromotionDemotion(members);
  const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
  const firstPlaceUserId = sorted[0]?.user_id;

  return members.map((member) => {
    const isPromoted = promoted.includes(member.user_id);
    const isDemoted = demoted.includes(member.user_id);
    const isFirstPlace = member.user_id === firstPlaceUserId;

    let gems = LEAGUE_REWARDS.participation.gems;
    const badges: string[] = [];

    if (isPromoted && currentTier < 5) {
      const newTier = currentTier + 1;
      gems += getPromotionGems(newTier);
      const badge = getPromotionBadgeId(newTier);
      if (badge) badges.push(badge);
    }

    if (isFirstPlace) {
      gems += LEAGUE_REWARDS.firstPlace.gems;
      badges.push(LEAGUE_REWARDS.firstPlace.badge);
    }

    return {
      user_id: member.user_id,
      gems,
      badges,
      promoted: isPromoted,
      demoted: isDemoted,
      first_place: isFirstPlace,
    };
  });
}
