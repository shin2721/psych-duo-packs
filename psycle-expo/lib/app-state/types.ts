import type { EnergyFullRefillFailureReason } from "../energyFullRefill";
import type { DoubleXpPurchaseFailureReason } from "../doubleXpPurchase";
import type { EventQuestInstance } from "../eventCampaign";
import type { QuestInstance, QuestMetric } from "../questDefinitions";
import type { StreakMilestoneToastItem } from "../streakMilestoneToastQueue";
import type { ComebackRewardToastItem } from "../comebackRewardToastQueue";
import type { StreakRepairOffer } from "../streakRepair";
import type { ComebackRewardOffer } from "../comebackReward";
import type { PlanId } from "../types/plan";

export interface ReviewEvent {
  userId: string;
  itemId: string;
  lessonId: string;
  ts: number;
  result: "correct" | "incorrect";
  latencyMs?: number;
  dueAt?: number;
  tags?: string[];
  beta?: number;
  p?: number;
}

export interface MistakeItem {
  id: string;
  lessonId: string;
  timestamp: number;
  questionType?: string;
  box: number;
  nextReviewDate: number;
  interval: number;
}

export interface LessonSessionRecord {
  lessonId: string;
  questionIds: string[];
  lastStartedAt: number | null;
  lastCompletedAt: number | null;
  lastAbandonedAt: number | null;
  abandonmentCount: number;
  completionCount: number;
  lastCompletedContentVersion?: string | null;
  lastCompletedCurriculumUpdatedAt?: string | null;
}

export interface ReturnSessionItem {
  itemId: string;
  lessonId: string;
}

export interface LessonSupportCandidate {
  lessonId: string;
  kind: "return" | "adaptive" | "refresh" | "replay";
  questionIds: string[];
  reason:
    | "abandonment"
    | "weakness"
    | "forgetting"
    | "evidence_update"
    | "completion_drift";
  signalConfidence?: "low" | "medium" | "high";
}

export interface SupportSurfaceRecord {
  lessonId: string;
  kind: LessonSupportCandidate["kind"];
  reason: LessonSupportCandidate["reason"];
  signalConfidence?: LessonSupportCandidate["signalConfidence"];
  lifecycleState: "shown" | "started" | "completed" | "suppressed" | "killed";
  ts: number;
  startedAt?: number;
}

export interface SupportBudgetSummary {
  weeklyBudget: number;
  weeklyUsed: number;
  weeklyRemaining: number;
  weeklyKindBudget: Record<LessonSupportCandidate["kind"], number>;
  weeklyKindUsed: Record<LessonSupportCandidate["kind"], number>;
  weeklyKindRemaining: Record<LessonSupportCandidate["kind"], number>;
}

export interface MasteryThemeState {
  themeId: string;
  parentUnitId: string;
  maxActiveSlots: number;
  activeVariantIds: string[];
  retiredVariantIds: string[];
  sceneIdsCleared: string[];
  scenesClearedCount: number;
  attemptCount: number;
  transferImprovement: boolean;
  repeatWithoutDropoff: boolean;
  newLearningValueDelta: number;
  transferGainSlope: number;
  repetitionRisk: number;
  graduationState: "learning" | "graduated";
  masteryCeilingState: "open" | "ceiling_reached";
  lastEvaluatedAt: number | null;
}

export interface MasteryCandidate {
  themeId: string;
  lessonId?: string;
  activeSlotsRemaining: number;
  graduationState: MasteryThemeState["graduationState"];
  masteryCeilingState: MasteryThemeState["masteryCeilingState"];
}

export interface EventCampaignSummary {
  id: string;
  titleKey: string;
  communityTargetLessons: number;
  startAt: string;
  endAt: string;
}

export interface ProgressionState {
  selectedGenre: string;
  setSelectedGenre: (id: string) => void;
  xp: number;
  addXp: (amount: number) => Promise<void>;
  isStateHydrated: boolean;
  skill: number;
  skillConfidence: number;
  questionsAnswered: number;
  updateSkill: (isCorrect: boolean, itemDifficulty?: number) => void;
  quests: QuestInstance[];
  eventCampaign: EventCampaignSummary | null;
  eventQuests: EventQuestInstance[];
  hasPendingDailyQuests: boolean;
  incrementQuest: (id: string, step?: number) => void;
  incrementQuestMetric: (metric: QuestMetric, step?: number) => void;
  claimQuest: (id: string) => void;
  rerollQuest: (
    id: string
  ) => {
    success: boolean;
    reason?:
      | "disabled"
      | "invalid_type"
      | "limit_reached"
      | "insufficient_gems"
      | "already_completed"
      | "no_candidate";
  };
  badgeToastQueue: string[];
  consumeNextBadgeToast: () => string | null;
  streakMilestoneToastQueue: StreakMilestoneToastItem[];
  consumeNextStreakMilestoneToast: () => StreakMilestoneToastItem | null;
  streak: number;
  lastStudyDate: string | null;
  lastActivityDate: string | null;
  streakHistory: { date: string; xp: number; lessonsCompleted: number }[];
  updateStreakForToday: (currentXP?: number) => Promise<void>;
  streakRepairOffer: StreakRepairOffer | null;
  purchaseStreakRepair: () => {
    success: boolean;
    reason?: "no_offer" | "expired" | "insufficient_gems";
  };
  comebackRewardOffer: ComebackRewardOffer | null;
  claimComebackRewardOnLessonComplete: () => {
    awarded: boolean;
    reason?: "no_offer" | "expired" | "already_claimed" | "subscription_excluded";
  };
  comebackRewardToastQueue: ComebackRewardToastItem[];
  consumeNextComebackRewardToast: () => ComebackRewardToastItem | null;
  dailyGoal: number;
  dailyXP: number;
  setDailyGoal: (xp: number) => void;
  completedLessons: Set<string>;
  completeLesson: (lessonId: string) => void;
  recentQuestionTypes: string[];
  recentAccuracy: number;
  currentStreak: number;
  recordQuestionResult: (questionType: string, isCorrect: boolean) => void;
  unlockedBadges: Set<string>;
  checkAndUnlockBadges: () => Promise<string[]>;
}

export interface EconomyState {
  gems: number;
  addGems: (amount: number) => void;
  setGemsDirectly: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  freezeCount: number;
  useFreeze: () => boolean;
  buyFreeze: () => boolean;
  buyEnergyFullRefill: () => {
    success: boolean;
    reason?: EnergyFullRefillFailureReason;
  };
  doubleXpEndTime: number | null;
  buyDoubleXP: (
    source?: "shop_item" | "lesson_complete_nudge"
  ) => {
    success: boolean;
    reason?: DoubleXpPurchaseFailureReason;
  };
  isDoubleXpActive: boolean;
  energy: number;
  maxEnergy: number;
  consumeEnergy: (amount?: number) => boolean;
  lessonEnergyCost: number;
  addEnergy: (amount: number) => void;
  tryTriggerStreakEnergyBonus: (correctStreak: number) => boolean;
  energyRefillMinutes: number;
  dailyEnergyBonusRemaining: number;
  dailyEnergyRefillRemaining: number;
  dailyQuestRerollRemaining: number;
  lastEnergyUpdateTime: number | null;
}

export interface BillingState {
  planId: PlanId;
  setPlanId: (plan: PlanId) => void;
  hasProAccess: boolean;
  activeUntil: string | null;
  setActiveUntil: (date: string | null) => void;
  isSubscriptionActive: boolean;
}

export interface PracticeState {
  reviewEvents: ReviewEvent[];
  addReviewEvent: (event: Omit<ReviewEvent, "userId" | "ts">) => void;
  lessonSessions: LessonSessionRecord[];
  supportSurfaceHistory: SupportSurfaceRecord[];
  masteryThemeStates: MasteryThemeState[];
  getSupportBudgetSummary: () => SupportBudgetSummary;
  getMasteryThemeState: (themeId: string) => MasteryThemeState | null;
  primeMasteryTheme: (args: { themeId: string; availableVariantIds: string[]; maxActiveSlots?: number }) => void;
  registerMasteryVariant: (args: { themeId: string; variantId: string; maxActiveSlots?: number }) => void;
  retireMasteryVariant: (args: { themeId: string; variantId: string }) => void;
  recordMasteryTransferOutcome: (args: {
    themeId: string;
    transferImprovement?: boolean;
    repeatWithoutDropoff?: boolean;
    newLearningValueDelta?: number;
    transferGainSlope?: number;
    repetitionRisk?: number;
  }) => void;
  recordLessonSessionStart: (lessonId: string, questionIds: string[]) => void;
  recordLessonSessionComplete: (lessonId: string) => void;
  recordLessonSessionAbandon: (lessonId: string) => void;
  getLessonSupportCandidate: () => LessonSupportCandidate | null;
  recordSupportMomentSeen: (candidate: LessonSupportCandidate) => void;
  markSupportMomentStarted: (candidate: LessonSupportCandidate) => void;
  activateReviewSupportSession: (candidate: LessonSupportCandidate) => void;
  completeActiveReviewSupport: () => void;
  suppressActiveReviewSupport: () => void;
  startReturnSession: () => {
    started: boolean;
    reason?: "no_candidate" | "insufficient_data";
  };
  returnSessionItems: ReturnSessionItem[];
  clearReturnSession: () => void;
  getMistakesHubItems: () => string[];
  canAccessMistakesHub: boolean;
  mistakesHubRemaining: number | null;
  startMistakesHubSession: () => {
    started: boolean;
    reason?: "not_available" | "insufficient_data" | "no_items";
  };
  mistakesHubSessionItems: Array<{ itemId: string; lessonId: string }>;
  clearMistakesHubSession: () => void;
  mistakes: MistakeItem[];
  addMistake: (questionId: string, lessonId: string, questionType?: string) => void;
  processReviewResult: (questionId: string, isCorrect: boolean) => void;
  getDueMistakes: () => MistakeItem[];
  clearMistake: (questionId: string) => void;
  mistakesCleared: number;
}

export type AppState = ProgressionState & EconomyState & BillingState & PracticeState;
