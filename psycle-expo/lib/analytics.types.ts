// Analytics v1 - Type Definitions (最小実装)

/**
 * イベントの共通プロパティ
 */
export interface CommonProperties {
  eventId: string; // UUID v4
  timestamp: string; // ISO 8601形式
  anonId: string; // 匿名ID（UUID v4）
  buildId: string; // アプリのビルドID
  schemaVersion: string; // イベントスキーマバージョン（"analytics_v1"）
  platform: "ios" | "android" | "web";
  env: "dev" | "prod";
  userId?: string; // 認証済みユーザーID（オプション）
}

export type AnalyticsProperties = Record<string, unknown>;

/**
 * イベントデータ
 */
export interface AnalyticsEvent extends CommonProperties {
  name: string; // イベント名
  properties: AnalyticsProperties; // イベント固有のプロパティ
}

/**
 * Analytics システムの設定
 */
export interface AnalyticsConfig {
  enabled: boolean; // 分析を有効化するか（デフォルト: true）
  debug: boolean; // デバッグログを出力するか（デフォルト: __DEV__）
  appEnv?: "dev" | "prod"; // アプリ環境（未設定時は __DEV__ で判定）
  endpoint?: string; // 送信先エンドポイント（未設定の場合はConsoleのみ）
  posthogHost?: string; // PostHogホスト（us.i.posthog.com / eu.i.posthog.com）
  posthogApiKey?: string; // PostHog APIキー
}

export type {
  AppOpenEvent,
  SessionStartEvent,
  AppReadyEvent,
  OnboardingStartEvent,
  OnboardingCompleteEvent,
  LessonStartEvent,
  LessonCompleteEvent,
  QuestionIncorrectEvent,
  StreakLostEvent,
  EnergyBlockedEvent,
  EnergyBonusHitEvent,
  ShopOpenFromEnergyEvent,
  NotificationPermissionResultEvent,
  ReminderScheduledEvent,
  ReminderOpenedEvent,
  FirstDayEnergyBonusGrantedEvent,
  StreakRepairOfferedEvent,
  StreakRepairPurchasedEvent,
  StreakRepairExpiredEvent,
  ComboMilestoneShownEvent,
  ComboXpBonusAppliedEvent,
  FeltBetterXpAwardedEvent,
  EnergyFullRefillPurchasedEvent,
  DoubleXpNudgeShownEvent,
  DoubleXpNudgeClickedEvent,
  DoubleXpPurchasedEvent,
  BadgeUnlockedEvent,
  QuestCycleResetEvent,
  QuestRotationAppliedEvent,
  QuestAutoClaimedOnCycleEvent,
  QuestClaimedEvent,
  QuestRerolledEvent,
  FreezeUsedEvent,
  DailyGoalReachedEvent,
  LeagueRewardClaimedEvent,
  PlanSelectEvent,
  CheckoutStartEvent,
  CheckoutFailedEvent,
  PlanChangedEvent,
  PaywallUpgradeClickedEvent,
  LeagueMatchmakingAppliedEvent,
  LeagueAutoJoinedOnXpEvent,
  StreakMilestoneRewardedEvent,
  ComebackRewardOfferedEvent,
  ComebackRewardClaimedEvent,
  ComebackRewardExpiredEvent,
  EventShownEvent,
  CommunityGoalShownEvent,
  EventStartedEvent,
  EventQuestRewardedEvent,
  EventCompletedEvent,
  ExperimentExposedEvent,
  ExperimentConvertedEvent,
  PersonalizationSegmentAssignedEvent,
  FriendChallengeShownEvent,
  FriendChallengeCompletedEvent,
  MistakesHubSessionStartedEvent,
  MistakesHubSessionCompletedEvent,
  LiveOpsEventActivatedEvent,
  TrackedEvent,
} from "./analytics.events";
