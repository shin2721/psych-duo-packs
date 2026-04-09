import type { CommerceSocialTrackedEvent } from "./analytics-events/commerceSocial";
import type { EconomyTrackedEvent } from "./analytics-events/economy";
import type { LifecycleTrackedEvent } from "./analytics-events/lifecycle";
import type { ProgressionTrackedEvent } from "./analytics-events/progression";

export type {
  AppOpenEvent,
  SessionStartEvent,
  AppReadyEvent,
  OnboardingStartEvent,
  OnboardingCompleteEvent,
  LessonStartEvent,
  LessonCompleteEvent,
  QuestionIncorrectEvent,
  NotificationPermissionResultEvent,
  ReminderScheduledEvent,
  ReminderOpenedEvent,
  MistakesHubSessionStartedEvent,
  MistakesHubSessionCompletedEvent,
  LifecycleTrackedEvent,
} from "./analytics-events/lifecycle";

export type {
  StreakLostEvent,
  EnergyBlockedEvent,
  EnergyBonusHitEvent,
  ShopOpenFromEnergyEvent,
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
  FreezeUsedEvent,
  DailyGoalReachedEvent,
  StreakMilestoneRewardedEvent,
  ComebackRewardOfferedEvent,
  ComebackRewardClaimedEvent,
  ComebackRewardExpiredEvent,
  EconomyTrackedEvent,
} from "./analytics-events/economy";

export type {
  BadgeUnlockedEvent,
  QuestCycleResetEvent,
  QuestRotationAppliedEvent,
  QuestAutoClaimedOnCycleEvent,
  QuestClaimedEvent,
  QuestRerolledEvent,
  EventShownEvent,
  CommunityGoalShownEvent,
  EventStartedEvent,
  EventQuestRewardedEvent,
  EventCompletedEvent,
  ExperimentExposedEvent,
  ExperimentConvertedEvent,
  PersonalizationSegmentAssignedEvent,
  LiveOpsEventActivatedEvent,
  ProgressionTrackedEvent,
} from "./analytics-events/progression";

export type {
  LeagueRewardClaimedEvent,
  PlanSelectEvent,
  CheckoutStartEvent,
  CheckoutFailedEvent,
  PlanChangedEvent,
  PaywallUpgradeClickedEvent,
  LeagueMatchmakingAppliedEvent,
  LeagueAutoJoinedOnXpEvent,
  FriendChallengeShownEvent,
  FriendChallengeCompletedEvent,
  CommerceSocialTrackedEvent,
} from "./analytics-events/commerceSocial";

export type TrackedEvent =
  | LifecycleTrackedEvent
  | EconomyTrackedEvent
  | ProgressionTrackedEvent
  | CommerceSocialTrackedEvent;
