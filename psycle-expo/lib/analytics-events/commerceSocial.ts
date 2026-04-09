export type LeagueRewardClaimedEvent = {
  name: "league_reward_claimed";
  properties: { rewardId: string; gems: number; badgesCount: number; weekId: string; source: "league_result_modal" };
};

export type PlanSelectEvent = {
  name: "plan_select";
  properties: { source: "shop_tab"; planId: "pro" | "max" };
};

export type CheckoutStartEvent = {
  name: "checkout_start";
  properties: {
    source: "shop_tab";
    planId: "pro" | "max";
    billingPeriod: "monthly" | "yearly";
    trialDays: number;
    priceVersion: "control" | "variant_a";
    priceCohort: string;
  };
};

export type CheckoutFailedEvent = {
  name: "checkout_failed";
  properties: { source: "shop_tab" | "billing_lib"; planId?: "pro" | "max"; reason: string; status?: number };
};

export type PlanChangedEvent = {
  name: "plan_changed";
  properties: {
    source: "profile_sync" | "restore_purchases";
    fromPlan: "free" | "pro" | "max";
    toPlan: "free" | "pro" | "max";
    isUpgrade: boolean;
    isDowngrade: boolean;
    activeUntil: string | null;
    priceVersion?: "control" | "variant_a";
  };
};

export type PaywallUpgradeClickedEvent = {
  name: "paywall_upgrade_clicked";
  properties: { source: "course_paywall_modal"; genreId: string; lessonCompleteCount: number };
};

export type LeagueMatchmakingAppliedEvent = {
  name: "league_matchmaking_applied";
  properties: {
    tier: number;
    candidateCount: number;
    selectedLeagueSize: number;
    userTotalXp: number;
    avgLeagueTotalXp: number;
    xpGap: number;
    xpGapRelative: number;
    xpStddev: number;
    matchScore: number;
    relativeGapWeight: number;
    variancePenaltyWeight: number;
    source: "join_league";
  };
};

export type LeagueAutoJoinedOnXpEvent = {
  name: "league_auto_joined_on_xp";
  properties: { tier: number; joinedNow: boolean; source: "xp_gain" };
};

export type FriendChallengeShownEvent = {
  name: "friend_challenge_shown";
  properties: { weekId: string; source: "friends_tab" };
};

export type FriendChallengeCompletedEvent = {
  name: "friend_challenge_completed";
  properties: { weekId: string; opponentId: string; rewardGems: number; source: "friends_tab" };
};

export type CommerceSocialTrackedEvent =
  | LeagueRewardClaimedEvent
  | PlanSelectEvent
  | CheckoutStartEvent
  | CheckoutFailedEvent
  | PlanChangedEvent
  | PaywallUpgradeClickedEvent
  | LeagueMatchmakingAppliedEvent
  | LeagueAutoJoinedOnXpEvent
  | FriendChallengeShownEvent
  | FriendChallengeCompletedEvent;
