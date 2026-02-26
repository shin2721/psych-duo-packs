// Analytics v1 - Type Definitions (最小実装)

/**
 * イベントの共通プロパティ
 */
export interface CommonProperties {
  eventId: string;            // UUID v4
  timestamp: string;          // ISO 8601形式
  anonId: string;             // 匿名ID（UUID v4）
  buildId: string;            // アプリのビルドID
  schemaVersion: string;      // イベントスキーマバージョン（"analytics_v1"）
  platform: 'ios' | 'android' | 'web';
  env: 'dev' | 'prod';
  userId?: string;            // 認証済みユーザーID（オプション）
}

/**
 * イベントデータ
 */
export interface AnalyticsEvent extends CommonProperties {
  name: string;               // イベント名
  properties: Record<string, any>; // イベント固有のプロパティ
}

/**
 * Analytics システムの設定
 */
export interface AnalyticsConfig {
  enabled: boolean;           // 分析を有効化するか（デフォルト: true）
  debug: boolean;             // デバッグログを出力するか（デフォルト: __DEV__）
  appEnv?: 'dev' | 'prod';    // アプリ環境（未設定時は __DEV__ で判定）
  endpoint?: string;          // 送信先エンドポイント（未設定の場合はConsoleのみ）
  posthogHost?: string;       // PostHogホスト（us.i.posthog.com / eu.i.posthog.com）
  posthogApiKey?: string;     // PostHog APIキー
}

// イベント型定義（12イベント）
export type AppOpenEvent = {
  name: 'app_open';
  properties: {};
};

export type SessionStartEvent = {
  name: 'session_start';
  properties: {};
};

export type AppReadyEvent = {
  name: 'app_ready';
  properties: {};
};

export type OnboardingStartEvent = {
  name: 'onboarding_start';
  properties: {};
};

export type OnboardingCompleteEvent = {
  name: 'onboarding_complete';
  properties: {};
};

export type LessonStartEvent = {
  name: 'lesson_start';
  properties: {
    lessonId: string;
    genreId: string;
  };
};

export type LessonCompleteEvent = {
  name: 'lesson_complete';
  properties: {
    lessonId: string;
    genreId: string;
  };
};

export type QuestionIncorrectEvent = {
  name: 'question_incorrect';
  properties: {
    lessonId: string;
    genreId: string;
    questionId: string;
    questionType?: string;
    questionIndex?: number;
    isReviewRound?: boolean;
  };
};

export type StreakLostEvent = {
  name: 'streak_lost';
  properties: {
    streakType: 'study';
    previousStreak: number;
    gapDays: number;
    freezesRemaining?: number;
    freezesNeeded?: number;
  };
};

export type EnergyBlockedEvent = {
  name: 'energy_blocked';
  properties: {
    lessonId: string;
    genreId: string;
    energy: number;
    maxEnergy: number;
  };
};

export type EnergyBonusHitEvent = {
  name: 'energy_bonus_hit';
  properties: {
    correctStreak: number;
    energyBefore: number;
    energyAfter: number;
    dailyBonusCount: number;
    dailyBonusCap: number;
  };
};

export type ShopOpenFromEnergyEvent = {
  name: 'shop_open_from_energy';
  properties: {
    source: string;
    lessonId?: string;
  };
};

export type NotificationPermissionResultEvent = {
  name: 'notification_permission_result';
  properties: {
    status: 'granted' | 'denied';
    source: 'settings_toggle' | 'bootstrap';
  };
};

export type ReminderScheduledEvent = {
  name: 'reminder_scheduled';
  properties: {
    kind: 'streak_risk' | 'daily_quest_deadline' | 'league_demotion_risk';
    scheduledAt: string;
    source: 'sync_daily_reminders';
  };
};

export type ReminderOpenedEvent = {
  name: 'reminder_opened';
  properties: {
    kind: 'streak_risk' | 'daily_quest_deadline' | 'league_demotion_risk';
    source: 'notification_tap';
  };
};

export type FirstDayEnergyBonusGrantedEvent = {
  name: 'first_day_energy_bonus_granted';
  properties: {
    bonusEnergy: number;
    baseCap: number;
    effectiveCap: number;
    expiresAt: string;
    source: 'first_launch';
  };
};

export type StreakRepairOfferedEvent = {
  name: 'streak_repair_offered';
  properties: {
    previousStreak: number;
    costGems: number;
    expiresAt: string;
  };
};

export type StreakRepairPurchasedEvent = {
  name: 'streak_repair_purchased';
  properties: {
    previousStreak: number;
    costGems: number;
    gemsBefore: number;
    gemsAfter: number;
  };
};

export type StreakRepairExpiredEvent = {
  name: 'streak_repair_expired';
  properties: {
    previousStreak: number;
    expiredAt: string;
  };
};

export type ComboMilestoneShownEvent = {
  name: 'combo_milestone_shown';
  properties: {
    milestone: 3 | 5 | 10;
    lessonId: string;
    questionId: string;
  };
};

export type ComboXpBonusAppliedEvent = {
  name: 'combo_xp_bonus_applied';
  properties: {
    lessonId: string;
    questionId: string;
    streak: number;
    baseXp: number;
    bonusXp: number;
    multiplier: number;
    usedBonusXp: number;
    capBonusXp: number;
  };
};

export type FeltBetterXpAwardedEvent = {
  name: 'felt_better_xp_awarded';
  properties: {
    lessonId: string;
    interventionId: string;
    feltBetterValue: -2 | -1 | 0 | 1 | 2;
    xpAwarded: number;
  };
};

export type EnergyFullRefillPurchasedEvent = {
  name: 'energy_full_refill_purchased';
  properties: {
    costGems: number;
    gemsBefore: number;
    gemsAfter: number;
    energyBefore: number;
    energyAfter: number;
    dailyCountAfter: number;
  };
};

export type DoubleXpNudgeShownEvent = {
  name: 'double_xp_nudge_shown';
  properties: {
    source: 'lesson_complete';
    gems: number;
    dailyRemainingAfterShow: number;
  };
};

export type DoubleXpNudgeClickedEvent = {
  name: 'double_xp_nudge_clicked';
  properties: {
    source: 'lesson_complete';
    gems: number;
  };
};

export type DoubleXpPurchasedEvent = {
  name: 'double_xp_purchased';
  properties: {
    source: 'shop_item' | 'lesson_complete_nudge';
    costGems: number;
    gemsBefore: number;
    gemsAfter: number;
    activeUntil: string;
  };
};

export type BadgeUnlockedEvent = {
  name: 'badge_unlocked';
  properties: {
    badgeId: string;
    source: 'auto_check';
  };
};

export type QuestCycleResetEvent = {
  name: 'quest_cycle_reset';
  properties: {
    dailyReset: boolean;
    weeklyReset: boolean;
    monthlyReset: boolean;
    source: 'cycle_reconcile';
  };
};

export type QuestRotationAppliedEvent = {
  name: 'quest_rotation_applied';
  properties: {
    dailyChanged: boolean;
    weeklyChanged: boolean;
    monthlyChanged: boolean;
    dailyCount: number;
    weeklyCount: number;
    source: 'cycle_reconcile' | 'schema_migration';
  };
};

export type QuestAutoClaimedOnCycleEvent = {
  name: 'quest_auto_claimed_on_cycle';
  properties: {
    claimedCount: number;
    totalRewardXp: number;
    totalRewardGems: number;
    dailyChanged: boolean;
    weeklyChanged: boolean;
    monthlyChanged: boolean;
    source: 'cycle_reconcile' | 'schema_migration';
  };
};

export type LeagueMatchmakingAppliedEvent = {
  name: 'league_matchmaking_applied';
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
    source: 'join_league';
  };
};

export type LeagueAutoJoinedOnXpEvent = {
  name: 'league_auto_joined_on_xp';
  properties: {
    tier: number;
    joinedNow: boolean;
    source: 'xp_gain';
  };
};

export type StreakMilestoneRewardedEvent = {
  name: 'streak_milestone_rewarded';
  properties: {
    day: 3 | 7 | 30;
    rewardGems: number;
    source: 'streak_update';
    lifetimeOnce: true;
  };
};

export type ComebackRewardOfferedEvent = {
  name: 'comeback_reward_offered';
  properties: {
    daysSinceStudy: number;
    rewardEnergy: number;
    thresholdDays: number;
    source: 'streak_update';
  };
};

export type ComebackRewardClaimedEvent = {
  name: 'comeback_reward_claimed';
  properties: {
    rewardEnergy: number;
    daysSinceStudy: number;
    source: 'lesson_complete';
  };
};

export type ComebackRewardExpiredEvent = {
  name: 'comeback_reward_expired';
  properties: {
    daysSinceStudy: number;
    expiredAt: string;
    source: 'offer_expiry';
  };
};

export type EventShownEvent = {
  name: 'event_shown';
  properties: {
    eventId: string;
    source: 'quests_tab';
  };
};

export type CommunityGoalShownEvent = {
  name: 'community_goal_shown';
  properties: {
    eventId: string;
    targetLessons: number;
    source: 'quests_tab';
  };
};

export type EventStartedEvent = {
  name: 'event_started';
  properties: {
    eventId: string;
    source: 'metric_progress';
  };
};

export type EventQuestRewardedEvent = {
  name: 'event_quest_rewarded';
  properties: {
    eventId: string;
    templateId: string;
    metric: 'lesson_complete' | 'streak5_milestone';
    rewardGems: number;
    source: 'metric_progress';
  };
};

export type EventCompletedEvent = {
  name: 'event_completed';
  properties: {
    eventId: string;
    rewardBadgeId: string;
    source: 'metric_progress';
  };
};

export type TrackedEvent =
  | AppOpenEvent
  | SessionStartEvent
  | AppReadyEvent
  | OnboardingStartEvent
  | OnboardingCompleteEvent
  | LessonStartEvent
  | LessonCompleteEvent
  | QuestionIncorrectEvent
  | StreakLostEvent
  | EnergyBlockedEvent
  | EnergyBonusHitEvent
  | ShopOpenFromEnergyEvent
  | NotificationPermissionResultEvent
  | ReminderScheduledEvent
  | ReminderOpenedEvent
  | FirstDayEnergyBonusGrantedEvent
  | StreakRepairOfferedEvent
  | StreakRepairPurchasedEvent
  | StreakRepairExpiredEvent
  | ComboMilestoneShownEvent
  | ComboXpBonusAppliedEvent
  | FeltBetterXpAwardedEvent
  | EnergyFullRefillPurchasedEvent
  | DoubleXpNudgeShownEvent
  | DoubleXpNudgeClickedEvent
  | DoubleXpPurchasedEvent
  | BadgeUnlockedEvent
  | QuestCycleResetEvent
  | QuestRotationAppliedEvent
  | QuestAutoClaimedOnCycleEvent
  | LeagueMatchmakingAppliedEvent
  | LeagueAutoJoinedOnXpEvent
  | StreakMilestoneRewardedEvent
  | ComebackRewardOfferedEvent
  | ComebackRewardClaimedEvent
  | ComebackRewardExpiredEvent
  | EventShownEvent
  | CommunityGoalShownEvent
  | EventStartedEvent
  | EventQuestRewardedEvent
  | EventCompletedEvent;
