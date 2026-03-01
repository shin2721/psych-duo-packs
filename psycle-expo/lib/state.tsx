import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import { BADGES, Badge, BadgeStats } from "./badges";
import {
  getStreakData,
  addFreezes,
  useFreeze as useFreezeStreak
} from "../lib/streaks";
import {
  createStreakRepairOffer,
  isStreakRepairOfferActive,
  purchaseStreakRepairOffer,
  type StreakRepairOffer,
} from "./streakRepair";
import { consumeNextBadgeToastItem, enqueueBadgeToastIds } from "./badgeToastQueue";
import {
  getComebackRewardConfig,
  getDailyGoalConfig,
  getDoubleXpBoostConfig,
  getEventCampaignConfig,
  getInitialGems,
  getPersonalizationConfig,
  getQuestRerollConfig,
  getQuestRewardsConfig,
  getShopSinksConfig,
  getStreakRepairConfig,
  getStreakMilestonesConfig,
  type EventCampaignConfig,
  type EventQuestMetric,
  type PersonalizationSegment,
} from "./gamificationConfig";
import {
  getClaimableStreakMilestone,
  normalizeClaimedMilestones,
} from "./streakMilestones";
import {
  consumeNextStreakMilestoneToastItem,
  enqueueStreakMilestoneToast,
  type StreakMilestoneToastItem,
} from "./streakMilestoneToastQueue";
import {
  canClaimComebackReward,
  createComebackRewardOffer,
  isComebackOfferExpired,
  normalizeComebackRewardOffer,
  type ComebackRewardOffer,
} from "./comebackReward";
import {
  applyEventMetricProgress,
  buildInitialEventState,
  isEventWindowActive,
  normalizeEventCampaignState,
  reconcileEventStateOnAccess,
  type EventCampaignState,
  type EventQuestInstance,
} from "./eventCampaign";
import {
  consumeNextComebackRewardToastItem,
  enqueueComebackRewardToast,
  type ComebackRewardToastItem,
} from "./comebackRewardToastQueue";
import {
  areQuestCycleKeysEqual,
  getQuestCycleKeys,
  type QuestCycleKeys
} from "./questCycles";
import {
  createMonthlyFixedQuestInstances,
  getQuestTemplateNeed,
  type QuestInstance,
  type QuestMetric,
} from "./questDefinitions";
import {
  applyQuestMetricProgress,
  buildQuestBoardForCycles,
  extractSelectionFromQuests,
  normalizeQuestRotationSelection,
  reconcileQuestBoardOnCycleChange,
  rerollQuestInstance,
  type QuestRotationSelection,
} from "./questRotation";
import {
  canUseMistakesHub,
  consumeMistakesHub,
  getMistakesHubRemaining,
  hasProItemAccess,
} from "../src/featureGate";
import {
  deriveUserSegment,
  getAdjustedComebackReward,
  getAdjustedQuestNeed,
  normalizePersonalizationSegment,
  shouldReassignSegment,
} from "./personalization";
import {
  buildMistakesHubSessionItems,
  selectMistakesHubItems,
} from "../src/features/mistakesHub";
import { Analytics } from "./analytics";
import type { PlanId } from "./types/plan";
import entitlements from "../config/entitlements.json";
import { getEffectiveFreeEnergyCap } from "./energyPolicy";
import {
  evaluateEnergyFullRefillPurchase,
  type EnergyFullRefillFailureReason,
} from "./energyFullRefill";
import {
  evaluateDoubleXpPurchase,
  type DoubleXpPurchaseFailureReason,
} from "./doubleXpPurchase";
import {
  getPlanChangeDirection,
  getPlanChangeSnapshotKey,
  hasPlanSnapshotChanged,
  normalizePlanIdValue,
  parsePlanChangeSnapshot,
  type PlanChangeSnapshot,
} from "./planChangeTracking";

interface EntitlementsConfig {
  plans?: {
    free?: {
      energy?: {
        daily_cap?: number | null;
      };
    };
  };
  defaults?: {
    energy_refill_minutes?: number;
    lesson_energy_cost?: number;
    first_day_bonus_energy?: number;
    energy_streak_bonus_every?: number;
    energy_streak_bonus_chance?: number;
    energy_streak_bonus_daily_cap?: number;
  };
}

function normalizePositiveInt(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

function normalizeNonNegativeInt(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized >= 0 ? normalized : fallback;
}

function normalizeReviewEvents(raw: unknown): ReviewEvent[] {
  if (!Array.isArray(raw)) return [];
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const normalized = raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((event) => {
      const ts = Number(event.ts);
      if (!Number.isFinite(ts)) return null;
      if (ts < cutoffMs) return null;

      const userId = typeof event.userId === "string" ? event.userId : "";
      const itemId = typeof event.itemId === "string" ? event.itemId : "";
      const lessonId = typeof event.lessonId === "string" ? event.lessonId : "";
      const result = event.result === "incorrect" ? "incorrect" : event.result === "correct" ? "correct" : null;
      if (!userId || !itemId || !lessonId || !result) return null;

      const latencyMs = Number(event.latencyMs);
      const dueAt = Number(event.dueAt);
      const beta = Number(event.beta);
      const p = Number(event.p);

      return {
        userId,
        itemId,
        lessonId,
        ts: Math.floor(ts),
        result,
        latencyMs: Number.isFinite(latencyMs) ? latencyMs : undefined,
        dueAt: Number.isFinite(dueAt) ? dueAt : undefined,
        tags: Array.isArray(event.tags) ? event.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
        beta: Number.isFinite(beta) ? beta : undefined,
        p: Number.isFinite(p) ? p : undefined,
      } satisfies ReviewEvent;
    })
    .filter((event): event is ReviewEvent => event !== null);

  return normalized.slice(-1000);
}

function normalizeProbability(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

const entitlementConfig = entitlements as EntitlementsConfig;
const FREE_BASE_MAX_ENERGY = normalizePositiveInt(
  entitlementConfig.plans?.free?.energy?.daily_cap ?? null,
  3
);
const FIRST_DAY_BONUS_ENERGY = normalizePositiveInt(
  entitlementConfig.defaults?.first_day_bonus_energy,
  0
);
const SUBSCRIBER_MAX_ENERGY = 999;
const ENERGY_REFILL_MINUTES = normalizePositiveInt(
  entitlementConfig.defaults?.energy_refill_minutes,
  60
);
const LESSON_ENERGY_COST = normalizePositiveInt(
  entitlementConfig.defaults?.lesson_energy_cost,
  1
);
const ENERGY_STREAK_BONUS_EVERY = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_every,
  5
);
const ENERGY_STREAK_BONUS_CHANCE = normalizeProbability(
  entitlementConfig.defaults?.energy_streak_bonus_chance,
  0.1
);
const ENERGY_STREAK_BONUS_DAILY_CAP = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_daily_cap,
  1
);
const QUEST_SCHEMA_VERSION = 2;
const ENERGY_REFILL_MS = ENERGY_REFILL_MINUTES * 60 * 1000;
const streakMilestonesConfig = getStreakMilestonesConfig();
const shopSinksConfig = getShopSinksConfig();
const personalizationConfig = getPersonalizationConfig();
const comebackRewardConfig = getComebackRewardConfig();
const dailyGoalConfig = getDailyGoalConfig();
const questRewardsConfig = getQuestRewardsConfig();
const questRerollConfig = getQuestRerollConfig();
const doubleXpBoostConfig = getDoubleXpBoostConfig();
const streakRepairConfig = getStreakRepairConfig();
const INITIAL_GEMS = normalizeNonNegativeInt(getInitialGems(), 50);
const COMEBACK_REWARD_THRESHOLD_DAYS = normalizePositiveInt(comebackRewardConfig.threshold_days, 7);
const COMEBACK_REWARD_ENERGY = normalizePositiveInt(comebackRewardConfig.reward_energy, 2);
const COMEBACK_REWARD_GEMS = normalizeNonNegativeInt(comebackRewardConfig.reward_gems, 10);
const DAILY_GOAL_DEFAULT_XP = normalizePositiveInt(dailyGoalConfig.default_xp, 10);
const DAILY_GOAL_REWARD_GEMS = normalizeNonNegativeInt(dailyGoalConfig.reward_gems, 5);
const DOUBLE_XP_COST_GEMS = normalizeNonNegativeInt(doubleXpBoostConfig.cost_gems, 20);
const DOUBLE_XP_DURATION_MS = normalizePositiveInt(doubleXpBoostConfig.duration_minutes, 15) * 60 * 1000;
const STREAK_REPAIR_COST_GEMS = normalizePositiveInt(streakRepairConfig.cost_gems, 50);
const STREAK_REPAIR_WINDOW_MS = normalizePositiveInt(streakRepairConfig.window_hours, 48) * 60 * 60 * 1000;
const QUEST_CLAIM_BONUS_GEMS_BY_TYPE = {
  daily: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.daily, 5),
  weekly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.weekly, 10),
  monthly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.monthly, 15),
} as const;
const QUEST_REROLL_COST_GEMS = normalizeNonNegativeInt(questRerollConfig.cost_gems, 5);
const QUEST_REROLL_DAILY_LIMIT = normalizePositiveInt(questRerollConfig.daily_limit, 1);

function getActiveEventCampaignConfig(now: Date = new Date()): EventCampaignConfig | null {
  const config = getEventCampaignConfig();
  if (!config) return null;
  return isEventWindowActive(now, config) ? config : null;
}

function isTrackedStreakMilestoneDay(day: number): day is 3 | 7 | 14 | 30 | 60 | 100 | 365 {
  return day === 3 || day === 7 || day === 14 || day === 30 || day === 60 || day === 100 || day === 365;
}

function adjustQuestNeedsBySegment(
  quests: QuestInstance[],
  segment: PersonalizationSegment
): QuestInstance[] {
  if (!personalizationConfig.enabled) return quests;

  let changed = false;
  const next = quests.map((quest) => {
    if (quest.type === "monthly" || quest.claimed) return quest;

    const baseNeed = getQuestTemplateNeed(quest.templateId) ?? quest.need;
    const adjustedNeed = getAdjustedQuestNeed(baseNeed, segment, personalizationConfig);
    if (adjustedNeed === quest.need) return quest;

    changed = true;
    return {
      ...quest,
      need: adjustedNeed,
      progress: Math.min(quest.progress, adjustedNeed),
    };
  });

  return changed ? next : quests;
}

function createInitialQuestState(cycleKeys: QuestCycleKeys): {
  quests: QuestInstance[];
  rotationSelection: QuestRotationSelection;
} {
  const { quests, selection } = buildQuestBoardForCycles({
    cycleKeys,
    previousSelection: { daily: [], weekly: [] },
    monthlyQuests: createMonthlyFixedQuestInstances(cycleKeys.monthly),
  });

  return {
    quests,
    rotationSelection: selection,
  };
}

function isQuestType(value: unknown): value is "daily" | "weekly" | "monthly" {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function isQuestMetric(value: unknown): value is QuestMetric {
  return value === "lesson_complete" || value === "streak5_milestone";
}

function normalizeQuestChestState(value: unknown): "closed" | "opening" | "opened" {
  return value === "opening" || value === "opened" ? value : "closed";
}

function normalizeStoredQuestInstances(
  raw: unknown,
  cycleKeys: QuestCycleKeys
): QuestInstance[] | null {
  if (!Array.isArray(raw)) return null;

  const normalized: QuestInstance[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const quest = item as Record<string, unknown>;
    const type = isQuestType(quest.type) ? quest.type : null;
    if (!type) continue;

    const needRaw = Number(quest.need);
    const need = Number.isFinite(needRaw) ? Math.max(1, Math.floor(needRaw)) : 1;
    const progressRaw = Number(quest.progress);
    const progress = Number.isFinite(progressRaw) ? Math.max(0, Math.floor(progressRaw)) : 0;
    const rewardXpRaw = Number(quest.rewardXp);
    const rewardXp = Number.isFinite(rewardXpRaw) ? Math.max(0, Math.floor(rewardXpRaw)) : 0;
    const templateId = typeof quest.templateId === "string" && quest.templateId.length > 0
      ? quest.templateId
      : typeof quest.id === "string" && quest.id.length > 0
        ? quest.id
        : null;
    if (!templateId) continue;

    const id = typeof quest.id === "string" && quest.id.length > 0
      ? quest.id
      : `${templateId}__${type}`;
    const metric = isQuestMetric(quest.metric) ? quest.metric : null;
    const cycleKey = typeof quest.cycleKey === "string" && quest.cycleKey.length > 0
      ? quest.cycleKey
      : type === "daily"
        ? cycleKeys.daily
        : type === "weekly"
          ? cycleKeys.weekly
          : cycleKeys.monthly;

    normalized.push({
      id,
      templateId,
      type,
      metric,
      need,
      progress: Math.min(need, progress),
      rewardXp,
      claimed: Boolean(quest.claimed),
      chestState: normalizeQuestChestState(quest.chestState),
      title: typeof quest.title === "string" ? quest.title : templateId,
      titleKey: typeof quest.titleKey === "string" ? quest.titleKey : undefined,
      cycleKey,
    });
  }

  return normalized.length > 0 ? normalized : null;
}

function migrateMonthlyQuests(
  storedQuests: QuestInstance[] | null,
  monthlyCycleKey: string
): QuestInstance[] {
  const baseMonthly = createMonthlyFixedQuestInstances(monthlyCycleKey);
  if (!storedQuests) return baseMonthly;

  const previousMonthly = new Map<string, QuestInstance>();
  storedQuests
    .filter((quest) => quest.type === "monthly")
    .forEach((quest) => {
      previousMonthly.set(quest.templateId, quest);
      previousMonthly.set(quest.id, quest);
    });

  return baseMonthly.map((quest) => {
    const previous = previousMonthly.get(quest.templateId) ?? previousMonthly.get(quest.id);
    if (!previous) return quest;
    return {
      ...quest,
      progress: Math.min(quest.need, Math.max(0, previous.progress)),
      claimed: previous.claimed,
      chestState: normalizeQuestChestState(previous.chestState),
    };
  });
}

interface ReviewEvent {
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
  id: string; // Question ID
  lessonId: string;
  timestamp: number;
  questionType?: string;

  // Spaced Repetition System (SRS) fields
  box: number; // 1-5 (Current proficiency level, 6 = graduated/cleared)
  nextReviewDate: number; // Timestamp when this item becomes available for review
  interval: number; // Current interval in days
}

interface AppState {
  selectedGenre: string;
  setSelectedGenre: (id: string) => void;
  xp: number;
  addXp: (amount: number) => Promise<void>;
  isStateHydrated: boolean;
  skill: number; // Elo rating (default 1500)
  skillConfidence: number; // Confidence in skill rating (0-100)
  questionsAnswered: number; // Total questions answered
  updateSkill: (isCorrect: boolean, itemDifficulty?: number) => void;
  quests: QuestInstance[];
  eventCampaign: {
    id: string;
    titleKey: string;
    communityTargetLessons: number;
    startAt: string;
    endAt: string;
  } | null;
  eventQuests: EventQuestInstance[];
  hasPendingDailyQuests: boolean;
  incrementQuest: (id: string, step?: number) => void;
  incrementQuestMetric: (metric: QuestMetric, step?: number) => void;
  claimQuest: (id: string) => void;
  rerollQuest: (
    questId: string
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
  // Streak system
  streak: number;
  lastStudyDate: string | null;
  lastActivityDate: string | null; // ISO date string for streak calculation
  streakHistory: { date: string; xp: number; lessonsCompleted: number }[]; // Last 30 days
  updateStreakForToday: (currentXP?: number) => Promise<void>;
  freezeCount: number;
  useFreeze: () => boolean;
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
  // Currency system
  gems: number;
  addGems: (amount: number) => void;
  setGemsDirectly: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  buyFreeze: () => boolean;
  buyEnergyFullRefill: () => {
    success: boolean;
    reason?: EnergyFullRefillFailureReason;
  };
  // Double XP Boost
  doubleXpEndTime: number | null;
  buyDoubleXP: (
    source?: "shop_item" | "lesson_complete_nudge"
  ) => {
    success: boolean;
    reason?: DoubleXpPurchaseFailureReason;
  };
  isDoubleXpActive: boolean;
  // Daily goal system
  dailyGoal: number;
  dailyXP: number;
  setDailyGoal: (xp: number) => void;
  // Energy system
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
  // Plan & Entitlements
  planId: PlanId;
  setPlanId: (plan: PlanId) => void;
  hasProAccess: boolean;
  activeUntil: string | null;
  setActiveUntil: (date: string | null) => void;
  isSubscriptionActive: boolean;
  // MistakesHub
  reviewEvents: ReviewEvent[];
  addReviewEvent: (event: Omit<ReviewEvent, "userId" | "ts">) => void;
  getMistakesHubItems: () => string[];
  canAccessMistakesHub: boolean;
  mistakesHubRemaining: number | null;
  startMistakesHubSession: () => {
    started: boolean;
    reason?: "not_available" | "insufficient_data" | "no_items";
  };
  mistakesHubSessionItems: Array<{ itemId: string; lessonId: string }>;
  clearMistakesHubSession: () => void;
  // Lesson progress
  completedLessons: Set<string>;
  completeLesson: (lessonId: string) => void;
  // Adaptive difficulty tracking
  recentQuestionTypes: string[]; // Last 5 question types
  recentAccuracy: number; // Rolling accuracy (0-1) from last 10 questions
  currentStreak: number; // Current correct answer streak
  recordQuestionResult: (questionType: string, isCorrect: boolean) => void;
  // Mistakes Hub (SRS)
  mistakes: MistakeItem[];
  addMistake: (questionId: string, lessonId: string, questionType?: string) => void;
  processReviewResult: (questionId: string, isCorrect: boolean) => void; // Handle SRS transitions
  getDueMistakes: () => MistakeItem[]; // Get items due for review
  clearMistake: (questionId: string) => void; // Manually remove (for migration/cleanup)
  // Badges
  unlockedBadges: Set<string>; // Badge IDs
  checkAndUnlockBadges: () => Promise<string[]>; // Returns newly unlocked badge IDs
  mistakesCleared: number; // Track for badge unlock
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedGenre, setSelectedGenre] = useState("mental");
  const [xp, setXP] = useState(0);
  const [skill, setSkill] = useState(1500); // Default Elo rating
  const [skillConfidence, setSkillConfidence] = useState(100); // Start with low confidence
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Plan & Entitlements
  const [planId, setPlanIdState] = useState<PlanId>("free");
  const [activeUntil, setActiveUntilState] = useState<string | null>(null);
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [mistakesHubSessionItems, setMistakesHubSessionItems] = useState<
    Array<{ itemId: string; lessonId: string }>
  >([]);

  const { user } = useAuth();
  const userId = user?.id || "user_local";

  const initialQuestCycleKeys = getQuestCycleKeys();
  const initialQuestState = createInitialQuestState(initialQuestCycleKeys);
  const [quests, setQuests] = useState<QuestInstance[]>(initialQuestState.quests);
  const [questCycleKeys, setQuestCycleKeys] = useState<QuestCycleKeys>(initialQuestCycleKeys);
  const [questRotationPrev, setQuestRotationPrev] = useState<QuestRotationSelection>(
    initialQuestState.rotationSelection
  );
  const initialEventConfig = getActiveEventCampaignConfig();
  const [eventCampaignState, setEventCampaignState] = useState<EventCampaignState | null>(
    initialEventConfig ? buildInitialEventState(initialEventConfig) : null
  );
  const [personalizationSegment, setPersonalizationSegment] = useState<PersonalizationSegment>("new");
  const [personalizationAssignedAtMs, setPersonalizationAssignedAtMs] = useState<number | null>(null);
  const eventCampaignStateRef = useRef<EventCampaignState | null>(
    initialEventConfig ? buildInitialEventState(initialEventConfig) : null
  );
  const personalizationSegmentRef = useRef<PersonalizationSegment>("new");
  const personalizationAssignedAtMsRef = useRef<number | null>(null);
  const liveOpsActivationRef = useRef<string | null>(null);
  const questsRef = useRef<QuestInstance[]>(initialQuestState.quests);
  const questCycleKeysRef = useRef<QuestCycleKeys>(initialQuestCycleKeys);
  const questRotationPrevRef = useRef<QuestRotationSelection>(initialQuestState.rotationSelection);
  const [badgeToastQueue, setBadgeToastQueue] = useState<string[]>([]);
  const badgeToastQueueRef = useRef<string[]>([]);
  const [streakMilestoneToastQueue, setStreakMilestoneToastQueue] = useState<StreakMilestoneToastItem[]>([]);
  const streakMilestoneToastQueueRef = useRef<StreakMilestoneToastItem[]>([]);
  const [comebackRewardToastQueue, setComebackRewardToastQueue] = useState<ComebackRewardToastItem[]>([]);
  const comebackRewardToastQueueRef = useRef<ComebackRewardToastItem[]>([]);
  const [claimedStreakMilestones, setClaimedStreakMilestones] = useState<number[]>([]);
  const claimedStreakMilestonesRef = useRef<number[]>([]);

  // Streak system
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [streakHistory, setStreakHistory] = useState<{ date: string; xp: number; lessonsCompleted: number }[]>([]);
  const [freezeCount, setFreezeCount] = useState(2); // Start with 2 free freezes
  const [streakRepairOffer, setStreakRepairOffer] = useState<StreakRepairOffer | null>(null);
  const [comebackRewardOffer, setComebackRewardOffer] = useState<ComebackRewardOffer | null>(null);

  // Currency system
  const [gems, setGems] = useState(INITIAL_GEMS);

  // Double XP Boost
  const [doubleXpEndTime, setDoubleXpEndTime] = useState<number | null>(null);

  // Social stats (fetched from Supabase)
  const [friendCount, setFriendCount] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState(0);

  // Lesson progress
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  function completeLesson(lessonId: string) {
    setCompletedLessons(prev => new Set(prev).add(lessonId));
  }

  // Adaptive difficulty tracking
  const [recentQuestionTypes, setRecentQuestionTypes] = useState<string[]>([]);
  const [recentAccuracy, setRecentAccuracy] = useState(0.7); // Default 70%
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentResults, setRecentResults] = useState<boolean[]>([]); // Track last 10 results

  function recordQuestionResult(questionType: string, isCorrect: boolean) {
    // Update question type history (keep last 5)
    setRecentQuestionTypes(prev => {
      const updated = [...prev, questionType];
      return updated.slice(-5);
    });

    // Update recent results (keep last 10)
    setRecentResults(prev => {
      const updated = [...prev, isCorrect];
      const last10 = updated.slice(-10);

      // Calculate new accuracy
      const correctCount = last10.filter(r => r).length;
      const newAccuracy = correctCount / last10.length;
      setRecentAccuracy(newAccuracy);

      return last10;
    });

    // Update streak
    setCurrentStreak(prev => isCorrect ? prev + 1 : 0);
  }

  // Mistakes Hub Implementation (SRS)
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [isStateHydrated, setIsStateHydrated] = useState(false);

  // SRS Intervals (in days)
  const SRS_INTERVALS = [0, 1, 3, 7, 14]; // Box 1-5

  function addMistake(questionId: string, lessonId: string, questionType?: string) {
    setMistakes(prev => {
      // Check if already exists
      const existing = prev.find(m => m.id === questionId);
      if (existing) {
        // Reset to Box 1 if re-added
        return prev.map(m => m.id === questionId ? {
          ...m,
          box: 1,
          nextReviewDate: Date.now(),
          interval: 0
        } : m);
      }

      return [...prev, {
        id: questionId,
        lessonId,
        timestamp: Date.now(),
        questionType,
        box: 1,
        nextReviewDate: Date.now(), // Available immediately
        interval: 0
      }];
    });
  }

  function processReviewResult(questionId: string, isCorrect: boolean) {
    setMistakes(prev => {
      return prev.map(m => {
        if (m.id !== questionId) return m;

        if (isCorrect) {
          const newBox = m.box + 1;

          // Graduated (Box 6 = cleared)
          if (newBox > 5) {
            return null; // Will be filtered out
          }

          const newInterval = SRS_INTERVALS[newBox - 1];
          const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

          return {
            ...m,
            box: newBox,
            interval: newInterval,
            nextReviewDate: nextReview
          };
        } else {
          // Incorrect: Reset to Box 1
          return {
            ...m,
            box: 1,
            interval: 0,
            nextReviewDate: Date.now()
          };
        }
      }).filter(Boolean) as MistakeItem[]; // Remove graduated items
    });
  }

  function getDueMistakes(): MistakeItem[] {
    const now = Date.now();
    return mistakes.filter(m => m.nextReviewDate <= now);
  }

  function clearMistake(questionId: string) {
    setMistakes(prev => prev.filter(m => m.id !== questionId));
  }

  // Badges Implementation
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [mistakesCleared, setMistakesCleared] = useState(0);
  const [badgesHydrated, setBadgesHydrated] = useState(false);
  const badgeCheckInFlightRef = useRef(false);

  async function checkAndUnlockBadges(): Promise<string[]> {
    if (!user) return [];

    const stats: BadgeStats = {
      completedLessons: completedLessons.size,
      streak,
      xp,
      mistakesCleared,
      friendCount,
      leaderboardRank,
    };

    const newlyUnlocked: string[] = [];

    for (const badge of BADGES) {
      if (!unlockedBadges.has(badge.id) && badge.unlockCondition(stats)) {
        // Unlock badge
        try {
          const { error } = await supabase
            .from("user_badges")
            .insert({ user_id: user.id, badge_id: badge.id });

          if (error) {
            if (error.code !== "23505") {
              console.error("Failed to unlock badge:", error);
            }
            continue;
          }

          setUnlockedBadges(prev => new Set(prev).add(badge.id));
          newlyUnlocked.push(badge.id);
        } catch (err) {
          console.error("Failed to unlock badge:", err);
        }
      }
    }

    return newlyUnlocked;
  }

  // Load user badges from Supabase
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setUnlockedBadges(new Set());
      setBadgesHydrated(false);
      return;
    }

    setBadgesHydrated(false);
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load user badges:", error);
        }
        if (data) {
          setUnlockedBadges(new Set(data.map(b => b.badge_id)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBadgesHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  useEffect(() => {
    questCycleKeysRef.current = questCycleKeys;
  }, [questCycleKeys]);

  useEffect(() => {
    questRotationPrevRef.current = questRotationPrev;
  }, [questRotationPrev]);

  useEffect(() => {
    eventCampaignStateRef.current = eventCampaignState;
  }, [eventCampaignState]);

  useEffect(() => {
    personalizationSegmentRef.current = personalizationSegment;
  }, [personalizationSegment]);

  useEffect(() => {
    personalizationAssignedAtMsRef.current = personalizationAssignedAtMs;
  }, [personalizationAssignedAtMs]);

  useEffect(() => {
    badgeToastQueueRef.current = badgeToastQueue;
  }, [badgeToastQueue]);

  useEffect(() => {
    streakMilestoneToastQueueRef.current = streakMilestoneToastQueue;
  }, [streakMilestoneToastQueue]);

  useEffect(() => {
    comebackRewardToastQueueRef.current = comebackRewardToastQueue;
  }, [comebackRewardToastQueue]);

  useEffect(() => {
    claimedStreakMilestonesRef.current = claimedStreakMilestones;
  }, [claimedStreakMilestones]);

    const reconcileQuestCycles = useCallback(
      (source: "cycle_reconcile" | "schema_migration" = "cycle_reconcile") => {
      const prevKeys = questCycleKeysRef.current;
      const nextKeys = getQuestCycleKeys();

      const reconcileResult = reconcileQuestBoardOnCycleChange({
        quests: questsRef.current,
        prevKeys,
        nextKeys,
        previousSelection: questRotationPrevRef.current,
        claimBonusGemsByType: QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
      });

        if (reconcileResult.changedTypes.length > 0) {
        const adjustedQuests = adjustQuestNeedsBySegment(
          reconcileResult.quests,
          personalizationSegmentRef.current
        );
        questsRef.current = adjustedQuests;
        setQuests(adjustedQuests);
        questRotationPrevRef.current = reconcileResult.selection;
        setQuestRotationPrev(reconcileResult.selection);

        if (reconcileResult.autoClaimed.totalRewardXp > 0) {
          setXP((prev) => prev + reconcileResult.autoClaimed.totalRewardXp);
        }
          if (reconcileResult.autoClaimed.totalRewardGems > 0) {
            setGems((prev) => prev + reconcileResult.autoClaimed.totalRewardGems);
          }

          if (source === "cycle_reconcile") {
            Analytics.track("quest_cycle_reset", {
              dailyReset: reconcileResult.changedTypes.includes("daily"),
              weeklyReset: reconcileResult.changedTypes.includes("weekly"),
              monthlyReset: reconcileResult.changedTypes.includes("monthly"),
              source: "cycle_reconcile",
            });
          }

          Analytics.track("quest_rotation_applied", {
            dailyChanged: reconcileResult.changedTypes.includes("daily"),
          weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
          monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
          dailyCount: adjustedQuests.filter((quest) => quest.type === "daily").length,
          weeklyCount: adjustedQuests.filter((quest) => quest.type === "weekly").length,
          source,
        });

        if (reconcileResult.autoClaimed.claimedCount > 0) {
          Analytics.track("quest_auto_claimed_on_cycle", {
            claimedCount: reconcileResult.autoClaimed.claimedCount,
            totalRewardXp: reconcileResult.autoClaimed.totalRewardXp,
            totalRewardGems: reconcileResult.autoClaimed.totalRewardGems,
            dailyChanged: reconcileResult.changedTypes.includes("daily"),
            weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
            monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
            source,
          });
        }
      }

      if (!areQuestCycleKeysEqual(prevKeys, nextKeys)) {
        questCycleKeysRef.current = nextKeys;
        setQuestCycleKeys(nextKeys);
      }
    },
    []
  );

  const reconcileEventCampaign = useCallback(() => {
    const activeConfig = getActiveEventCampaignConfig(new Date());
    if (!activeConfig) {
      if (eventCampaignStateRef.current) {
        setEventCampaignState(null);
      }
      liveOpsActivationRef.current = null;
      return;
    }

    if (liveOpsActivationRef.current !== activeConfig.id) {
      liveOpsActivationRef.current = activeConfig.id;
      Analytics.track("liveops_event_activated", {
        eventId: activeConfig.id,
        source: "event_reconcile",
      });
    }

    setEventCampaignState((prev) =>
      reconcileEventStateOnAccess(prev, activeConfig, new Date())
    );
  }, []);

  useEffect(() => {
    if (!user || !isStateHydrated || !badgesHydrated) return;

    const timer = setTimeout(async () => {
      if (badgeCheckInFlightRef.current) return;
      badgeCheckInFlightRef.current = true;
      try {
        const newlyUnlocked = await checkAndUnlockBadges();
        if (newlyUnlocked.length > 0) {
          setBadgeToastQueue((prev) => enqueueBadgeToastIds(prev, newlyUnlocked));
          newlyUnlocked.forEach((badgeId) => {
            Analytics.track("badge_unlocked", {
              badgeId,
              source: "auto_check",
            });
          });
        }
      } finally {
        badgeCheckInFlightRef.current = false;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    user?.id,
    isStateHydrated,
    badgesHydrated,
    xp,
    streak,
    completedLessons,
    mistakesCleared,
    friendCount,
    leaderboardRank,
  ]);

  // Save mistakes to AsyncStorage whenever it changes
  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`mistakes_${user.id}`, JSON.stringify(mistakes));
  }, [mistakes, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`review_events_${user.id}`, JSON.stringify(reviewEvents));
  }, [reviewEvents, user, isStateHydrated]);


    // Daily goal system
    const [dailyGoal, setDailyGoalState] = useState(DAILY_GOAL_DEFAULT_XP);
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoalLastReset, setDailyGoalLastReset] = useState(getTodayDate());

  // Energy system
  const [energy, setEnergy] = useState(FREE_BASE_MAX_ENERGY);
  const [lastEnergyUpdateTime, setLastEnergyUpdateTime] = useState<number | null>(null);
  const [dailyEnergyBonusDate, setDailyEnergyBonusDate] = useState(getTodayDate());
  const [dailyEnergyBonusCount, setDailyEnergyBonusCount] = useState(0);
  const [dailyEnergyRefillDate, setDailyEnergyRefillDate] = useState(getTodayDate());
  const [dailyEnergyRefillCount, setDailyEnergyRefillCount] = useState(0);
  const [dailyQuestRerollDate, setDailyQuestRerollDate] = useState(getTodayDate());
  const [dailyQuestRerollCount, setDailyQuestRerollCount] = useState(0);
  const [firstLaunchAtMs, setFirstLaunchAtMs] = useState<number | null>(null);

  // Load persisted state on mount (LOCAL FIRST, then Supabase sync in background)
  useEffect(() => {
    if (!user) {
      setIsStateHydrated(false);
      setReviewEvents([]);
      setMistakesHubSessionItems([]);
      setFirstLaunchAtMs(null);
      setStreakRepairOffer(null);
      setComebackRewardOffer(null);
      setBadgeToastQueue([]);
      setStreakMilestoneToastQueue([]);
      setComebackRewardToastQueue([]);
      setClaimedStreakMilestones([]);
      const resetCycleKeys = getQuestCycleKeys();
      const resetQuestState = createInitialQuestState(resetCycleKeys);
      setQuests(resetQuestState.quests);
      questsRef.current = resetQuestState.quests;
      setQuestCycleKeys(resetCycleKeys);
      questCycleKeysRef.current = resetCycleKeys;
      setQuestRotationPrev(resetQuestState.rotationSelection);
      questRotationPrevRef.current = resetQuestState.rotationSelection;
      setDailyQuestRerollDate(getTodayDate());
      setDailyQuestRerollCount(0);
      setEventCampaignState(null);
      eventCampaignStateRef.current = null;
      setPersonalizationSegment("new");
      personalizationSegmentRef.current = "new";
      setPersonalizationAssignedAtMs(null);
      personalizationAssignedAtMsRef.current = null;
      liveOpsActivationRef.current = null;
      badgeToastQueueRef.current = [];
      streakMilestoneToastQueueRef.current = [];
      comebackRewardToastQueueRef.current = [];
      claimedStreakMilestonesRef.current = [];
      return;
    }

    let cancelled = false;
    setIsStateHydrated(false);

    const loadState = async () => {
      let savedPlanChangeSnapshot: string | null = null;
      // STEP 1: Load from local storage FIRST (instant)
      try {
        const [
          savedXp,
          savedGems,
          savedStreak,
          savedQuests,
          savedQuestCycleKeys,
          savedQuestSchemaVersion,
          savedQuestRotationPrev,
          savedEnergy,
          savedEnergyUpdateTime,
          savedEnergyBonusDate,
          savedEnergyBonusCount,
          savedEnergyRefillDate,
          savedEnergyRefillCount,
          savedQuestRerollDate,
          savedQuestRerollCount,
          savedMistakes,
          savedReviewEvents,
          savedFirstLaunchAt,
          savedFirstDayBonusTracked,
          savedStreakRepairOffer,
          savedComebackRewardOffer,
          savedClaimedStreakMilestones,
          savedEventCampaignState,
          savedPersonalizationSegment,
          savedPersonalizationAssignedAtMs,
          savedPlanChangeSnapshotValue,
        ] = await Promise.all([
          AsyncStorage.getItem(`xp_${user.id}`),
          AsyncStorage.getItem(`gems_${user.id}`),
          AsyncStorage.getItem(`streak_${user.id}`),
          AsyncStorage.getItem(`quests_${user.id}`),
          AsyncStorage.getItem(`quest_cycle_keys_${user.id}`),
          AsyncStorage.getItem(`quest_schema_version_${user.id}`),
          AsyncStorage.getItem(`quest_rotation_prev_${user.id}`),
          AsyncStorage.getItem(`energy_${user.id}`),
          AsyncStorage.getItem(`energy_update_time_${user.id}`),
          AsyncStorage.getItem(`energy_bonus_date_${user.id}`),
          AsyncStorage.getItem(`energy_bonus_count_${user.id}`),
          AsyncStorage.getItem(`energy_refill_date_${user.id}`),
          AsyncStorage.getItem(`energy_refill_count_${user.id}`),
          AsyncStorage.getItem(`quest_reroll_date_${user.id}`),
          AsyncStorage.getItem(`quest_reroll_count_${user.id}`),
          AsyncStorage.getItem(`mistakes_${user.id}`),
          AsyncStorage.getItem(`review_events_${user.id}`),
          AsyncStorage.getItem(`first_launch_at_${user.id}`),
          AsyncStorage.getItem(`first_day_energy_bonus_tracked_${user.id}`),
          AsyncStorage.getItem(`streak_repair_offer_${user.id}`),
          AsyncStorage.getItem(`comeback_reward_offer_${user.id}`),
          AsyncStorage.getItem(`streak_milestones_claimed_${user.id}`),
          AsyncStorage.getItem(`event_campaign_state_${user.id}`),
          AsyncStorage.getItem(`personalization_segment_${user.id}`),
          AsyncStorage.getItem(`personalization_segment_assigned_at_${user.id}`),
          AsyncStorage.getItem(getPlanChangeSnapshotKey(user.id)),
        ]);
        savedPlanChangeSnapshot = savedPlanChangeSnapshotValue;

        if (cancelled) return;

        if (savedXp) setXP(parseInt(savedXp, 10));
        if (savedGems) setGems(parseInt(savedGems, 10));
        if (savedStreak) setStreak(parseInt(savedStreak, 10));
        const initialSegment = normalizePersonalizationSegment(savedPersonalizationSegment);
        setPersonalizationSegment(initialSegment);
        personalizationSegmentRef.current = initialSegment;
        const parsedPersonalizationAssignedAt = Number.parseInt(savedPersonalizationAssignedAtMs ?? "", 10);
        const initialAssignedAt = Number.isFinite(parsedPersonalizationAssignedAt)
          ? parsedPersonalizationAssignedAt
          : null;
        setPersonalizationAssignedAtMs(initialAssignedAt);
        personalizationAssignedAtMsRef.current = initialAssignedAt;

        const nowQuestCycleKeys = getQuestCycleKeys();
        let loadedQuestCycleKeys = nowQuestCycleKeys;
        if (savedQuestCycleKeys) {
          try {
            const parsed = JSON.parse(savedQuestCycleKeys) as Partial<QuestCycleKeys>;
            if (
              typeof parsed?.daily === "string" &&
              typeof parsed?.weekly === "string" &&
              typeof parsed?.monthly === "string"
            ) {
              loadedQuestCycleKeys = {
                daily: parsed.daily,
                weekly: parsed.weekly,
                monthly: parsed.monthly,
              };
            }
          } catch (error) {
            console.warn("Failed to parse stored quest cycle keys:", error);
          }
        }
        const initialQuestStateForLoad = createInitialQuestState(nowQuestCycleKeys);
        let loadedQuests = initialQuestStateForLoad.quests;
        let loadedRotationSelection = initialQuestStateForLoad.rotationSelection;

        if (savedQuestRotationPrev) {
          try {
            loadedRotationSelection = normalizeQuestRotationSelection(
              JSON.parse(savedQuestRotationPrev)
            );
          } catch (error) {
            console.warn("Failed to parse stored quest rotation selection:", error);
          }
        }

        if (savedQuests) {
          try {
            const parsed = JSON.parse(savedQuests);
            const normalized = normalizeStoredQuestInstances(parsed, loadedQuestCycleKeys);
            if (normalized) {
              loadedQuests = normalized;
              if (!savedQuestRotationPrev) {
                loadedRotationSelection = normalizeQuestRotationSelection(
                  extractSelectionFromQuests(normalized)
                );
              }
            }
          } catch (error) {
            console.warn("Failed to parse stored quests:", error);
          }
        }

        const parsedSchemaVersion = Number.parseInt(savedQuestSchemaVersion ?? "", 10);
        const questSchemaVersion = Number.isFinite(parsedSchemaVersion) ? parsedSchemaVersion : 1;
        let pendingAutoClaimXp = 0;
        let pendingAutoClaimGems = 0;

        if (questSchemaVersion < QUEST_SCHEMA_VERSION) {
          const claimableOnMigration = loadedQuests.filter(
            (quest) => quest.progress >= quest.need && !quest.claimed
          );
          if (claimableOnMigration.length > 0) {
            pendingAutoClaimXp += claimableOnMigration.reduce(
              (sum, quest) => sum + quest.rewardXp,
              0
            );
            pendingAutoClaimGems += claimableOnMigration.reduce(
              (sum, quest) => sum + (QUEST_CLAIM_BONUS_GEMS_BY_TYPE[quest.type] ?? 0),
              0
            );
            Analytics.track("quest_auto_claimed_on_cycle", {
              claimedCount: claimableOnMigration.length,
              totalRewardXp: pendingAutoClaimXp,
              totalRewardGems: pendingAutoClaimGems,
              dailyChanged: true,
              weeklyChanged: true,
              monthlyChanged: false,
              source: "schema_migration",
            });
          }

          const migratedMonthly = migrateMonthlyQuests(loadedQuests, nowQuestCycleKeys.monthly);
          const rebuilt = buildQuestBoardForCycles({
            cycleKeys: nowQuestCycleKeys,
            previousSelection: loadedRotationSelection,
            monthlyQuests: migratedMonthly,
          });
          loadedQuests = rebuilt.quests;
          loadedRotationSelection = rebuilt.selection;

          Analytics.track("quest_rotation_applied", {
            dailyChanged: true,
            weeklyChanged: true,
            monthlyChanged: false,
            dailyCount: loadedQuests.filter((quest) => quest.type === "daily").length,
            weeklyCount: loadedQuests.filter((quest) => quest.type === "weekly").length,
            source: "schema_migration",
          });
          } else {
            const reconcileResult = reconcileQuestBoardOnCycleChange({
            quests: loadedQuests,
            prevKeys: loadedQuestCycleKeys,
            nextKeys: nowQuestCycleKeys,
            previousSelection: loadedRotationSelection,
            claimBonusGemsByType: QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
          });
          loadedQuests = reconcileResult.quests;
          loadedRotationSelection = reconcileResult.selection;

            if (reconcileResult.changedTypes.length > 0) {
              Analytics.track("quest_cycle_reset", {
                dailyReset: reconcileResult.changedTypes.includes("daily"),
                weeklyReset: reconcileResult.changedTypes.includes("weekly"),
                monthlyReset: reconcileResult.changedTypes.includes("monthly"),
                source: "cycle_reconcile",
              });

              pendingAutoClaimXp += reconcileResult.autoClaimed.totalRewardXp;
              pendingAutoClaimGems += reconcileResult.autoClaimed.totalRewardGems;
              Analytics.track("quest_rotation_applied", {
              dailyChanged: reconcileResult.changedTypes.includes("daily"),
              weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
              monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
              dailyCount: loadedQuests.filter((quest) => quest.type === "daily").length,
              weeklyCount: loadedQuests.filter((quest) => quest.type === "weekly").length,
              source: "cycle_reconcile",
            });

            if (reconcileResult.autoClaimed.claimedCount > 0) {
              Analytics.track("quest_auto_claimed_on_cycle", {
                claimedCount: reconcileResult.autoClaimed.claimedCount,
                totalRewardXp: reconcileResult.autoClaimed.totalRewardXp,
                totalRewardGems: reconcileResult.autoClaimed.totalRewardGems,
                dailyChanged: reconcileResult.changedTypes.includes("daily"),
                weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
                monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
                source: "cycle_reconcile",
              });
            }
          }
        }

        if (pendingAutoClaimXp > 0) {
          setXP((prev) => prev + pendingAutoClaimXp);
        }
        if (pendingAutoClaimGems > 0) {
          setGems((prev) => prev + pendingAutoClaimGems);
        }

        const adjustedLoadedQuests = adjustQuestNeedsBySegment(loadedQuests, initialSegment);
        setQuests(adjustedLoadedQuests);
        questsRef.current = adjustedLoadedQuests;
        setQuestCycleKeys(nowQuestCycleKeys);
        questCycleKeysRef.current = nowQuestCycleKeys;
        setQuestRotationPrev(loadedRotationSelection);
        questRotationPrevRef.current = loadedRotationSelection;

        await AsyncStorage.setItem(`quest_schema_version_${user.id}`, String(QUEST_SCHEMA_VERSION));

        if (savedEnergy) {
          const parsedEnergy = parseInt(savedEnergy, 10);
          if (!Number.isNaN(parsedEnergy)) setEnergy(parsedEnergy);
        }
        if (savedEnergyUpdateTime) {
          const parsedEnergyUpdateTime = parseInt(savedEnergyUpdateTime, 10);
          if (!Number.isNaN(parsedEnergyUpdateTime)) setLastEnergyUpdateTime(parsedEnergyUpdateTime);
        }
        if (savedEnergyBonusDate) {
          setDailyEnergyBonusDate(savedEnergyBonusDate);
        }
        if (savedEnergyBonusCount) {
          const parsedEnergyBonusCount = parseInt(savedEnergyBonusCount, 10);
          if (!Number.isNaN(parsedEnergyBonusCount)) setDailyEnergyBonusCount(parsedEnergyBonusCount);
        }
        if (savedEnergyRefillDate) {
          setDailyEnergyRefillDate(savedEnergyRefillDate);
        }
        if (savedEnergyRefillCount) {
          const parsedEnergyRefillCount = parseInt(savedEnergyRefillCount, 10);
          if (!Number.isNaN(parsedEnergyRefillCount)) setDailyEnergyRefillCount(parsedEnergyRefillCount);
        }
        if (savedQuestRerollDate) {
          setDailyQuestRerollDate(savedQuestRerollDate);
        }
        if (savedQuestRerollCount) {
          const parsedQuestRerollCount = parseInt(savedQuestRerollCount, 10);
          if (!Number.isNaN(parsedQuestRerollCount)) setDailyQuestRerollCount(parsedQuestRerollCount);
        }
        const initializeFirstLaunch = async () => {
          const firstLaunchAt = Date.now();
          setFirstLaunchAtMs(firstLaunchAt);
          await AsyncStorage.setItem(`first_launch_at_${user.id}`, firstLaunchAt.toString());

          if (!savedFirstDayBonusTracked) {
            const effectiveCap = getEffectiveFreeEnergyCap(
              FREE_BASE_MAX_ENERGY,
              FIRST_DAY_BONUS_ENERGY,
              firstLaunchAt,
              firstLaunchAt
            );
            Analytics.track("first_day_energy_bonus_granted", {
              bonusEnergy: FIRST_DAY_BONUS_ENERGY,
              baseCap: FREE_BASE_MAX_ENERGY,
              effectiveCap,
              expiresAt: new Date(firstLaunchAt + 24 * 60 * 60 * 1000).toISOString(),
              source: "first_launch",
            });
            await AsyncStorage.setItem(`first_day_energy_bonus_tracked_${user.id}`, "1");
          }
        };

        if (savedFirstLaunchAt) {
          const parsedFirstLaunchAt = parseInt(savedFirstLaunchAt, 10);
          if (!Number.isNaN(parsedFirstLaunchAt) && parsedFirstLaunchAt > 0) {
            setFirstLaunchAtMs(parsedFirstLaunchAt);
          } else {
            await initializeFirstLaunch();
          }
        } else {
          await initializeFirstLaunch();
        }
        if (savedMistakes) {
          const loadedMistakes = JSON.parse(savedMistakes);
          const migratedMistakes = loadedMistakes.map((m: any) => {
            if (m.box === undefined) {
              return {
                ...m,
                box: 1,
                nextReviewDate: Date.now(),
                interval: 0
              };
            }
            return m;
          });
          setMistakes(migratedMistakes);
        }
        if (savedReviewEvents) {
          try {
            const parsedReviewEvents = JSON.parse(savedReviewEvents);
            setReviewEvents(normalizeReviewEvents(parsedReviewEvents));
          } catch (error) {
            console.warn("Failed to parse stored review events:", error);
            setReviewEvents([]);
          }
        } else {
          setReviewEvents([]);
        }

        if (savedStreakRepairOffer) {
          try {
            const parsedOffer = JSON.parse(savedStreakRepairOffer) as StreakRepairOffer;
            if (isStreakRepairOfferActive(parsedOffer)) {
              setStreakRepairOffer(parsedOffer);
            } else {
              if (parsedOffer?.active && typeof parsedOffer.expiresAtMs === "number") {
                Analytics.track("streak_repair_expired", {
                  previousStreak: parsedOffer.previousStreak,
                  expiredAt: new Date(parsedOffer.expiresAtMs).toISOString(),
                });
              }
              setStreakRepairOffer(null);
            }
          } catch {
            setStreakRepairOffer(null);
          }
        } else {
          setStreakRepairOffer(null);
        }

        if (savedComebackRewardOffer) {
          try {
            const parsedOffer = normalizeComebackRewardOffer(JSON.parse(savedComebackRewardOffer));
            if (parsedOffer && !isComebackOfferExpired(parsedOffer)) {
              setComebackRewardOffer(parsedOffer);
            } else {
              if (parsedOffer?.active) {
                Analytics.track("comeback_reward_expired", {
                  daysSinceStudy: parsedOffer.daysSinceStudy,
                  expiredAt: new Date(parsedOffer.expiresAtMs).toISOString(),
                  source: "offer_expiry",
                });
              }
              setComebackRewardOffer(null);
            }
          } catch {
            setComebackRewardOffer(null);
          }
        } else {
          setComebackRewardOffer(null);
        }

        if (savedClaimedStreakMilestones) {
          try {
            const parsedClaimedMilestones = JSON.parse(savedClaimedStreakMilestones);
            const normalizedClaimedMilestones = normalizeClaimedMilestones(parsedClaimedMilestones);
            setClaimedStreakMilestones(normalizedClaimedMilestones);
            claimedStreakMilestonesRef.current = normalizedClaimedMilestones;
          } catch {
            setClaimedStreakMilestones([]);
            claimedStreakMilestonesRef.current = [];
          }
        } else {
          setClaimedStreakMilestones([]);
          claimedStreakMilestonesRef.current = [];
        }

        const activeEventConfig = getActiveEventCampaignConfig();
        if (activeEventConfig) {
          let nextEventCampaignState: EventCampaignState | null = null;
          if (savedEventCampaignState) {
            try {
              nextEventCampaignState = normalizeEventCampaignState(
                JSON.parse(savedEventCampaignState)
              );
            } catch {
              nextEventCampaignState = null;
            }
          }
          nextEventCampaignState = reconcileEventStateOnAccess(
            nextEventCampaignState,
            activeEventConfig,
            new Date()
          );
          setEventCampaignState(nextEventCampaignState);
          eventCampaignStateRef.current = nextEventCampaignState;
        } else {
          setEventCampaignState(null);
          eventCampaignStateRef.current = null;
        }

        // Freeze一本化: streaks.tsから読み込み
        const streakData = await getStreakData();
        if (cancelled) return;
        setFreezeCount(streakData.freezesRemaining);

        if (__DEV__) console.log("Loaded from local storage (instant):", {
          savedXp,
          savedGems,
          savedStreak,
          savedQuests,
          savedQuestCycleKeys,
          savedEnergy,
          savedEnergyUpdateTime,
          savedEnergyBonusDate,
          savedEnergyBonusCount,
          savedEnergyRefillDate,
          savedEnergyRefillCount,
          savedQuestRerollDate,
          savedQuestRerollCount,
          savedFirstLaunchAt,
          savedStreakRepairOffer,
          savedComebackRewardOffer,
          savedClaimedStreakMilestones,
          savedEventCampaignState,
          freezes: streakData.freezesRemaining,
        });
      } catch (e) {
        if (__DEV__) console.log("Local storage read failed:", e);
      }

      // STEP 2: Sync from Supabase in background (non-blocking)
      // This will update state if Supabase has newer data
      try {
        const previousPlanSnapshot = parsePlanChangeSnapshot(savedPlanChangeSnapshot);
        const { data, error } = await supabase
          .from('profiles')
          .select('xp, gems, streak, plan_id, active_until')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (data && !error) {
          if (__DEV__) console.log("Background Supabase sync:", data);
          // Only update if Supabase has different/newer values
          if (data.xp !== undefined) setXP(data.xp);
          if (data.gems !== undefined) setGems(data.gems);
          if (data.streak !== undefined) setStreak(data.streak);

          const nextPlanId = normalizePlanIdValue(data.plan_id) ?? planId;
          const nextActiveUntil = typeof data.active_until === "string" ? data.active_until : null;

          setPlanIdState(nextPlanId);
          setActiveUntilState(nextActiveUntil);

          const nextSnapshot: PlanChangeSnapshot = {
            planId: nextPlanId,
            activeUntil: nextActiveUntil,
          };

          if (hasPlanSnapshotChanged(previousPlanSnapshot, nextSnapshot)) {
            if (previousPlanSnapshot) {
              const { isUpgrade, isDowngrade } = getPlanChangeDirection(
                previousPlanSnapshot.planId,
                nextSnapshot.planId
              );
              Analytics.track("plan_changed", {
                source: "profile_sync",
                fromPlan: previousPlanSnapshot.planId,
                toPlan: nextSnapshot.planId,
                isUpgrade,
                isDowngrade,
                activeUntil: nextSnapshot.activeUntil,
              });
            }
            await AsyncStorage.setItem(
              getPlanChangeSnapshotKey(user.id),
              JSON.stringify(nextSnapshot)
            );
          }

          // Fetch social stats (non-blocking)
          supabase
            .from("friendships")
            .select("*", { count: "exact", head: true })
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .then(({ count }) => { if (count !== null) setFriendCount(count); });

          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gt("xp", data.xp ?? 0)
            .then(({ count }) => { if (count !== null) setLeaderboardRank(count + 1); });
        }
      } catch (e) {
        // Supabase failed - that's okay, we already have local data
        if (__DEV__) console.log("Supabase sync failed (using local data):", e);
      } finally {
        if (!cancelled) {
          setIsStateHydrated(true);
        }
      }
    };
    loadState();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persist state changes
  // Persist state changes to Supabase (and Local Storage as backup)
  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`xp_${user.id}`, xp.toString());

    // Debounced update to Supabase to avoid too many requests
    const timer = setTimeout(() => {
      supabase.from('profiles').update({ xp }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync XP to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [xp, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`gems_${user.id}`, gems.toString());

    const timer = setTimeout(() => {
      supabase.from('profiles').update({ gems }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync Gems to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [gems, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`streak_${user.id}`, streak.toString());

    supabase.from('profiles').update({ streak }).eq('id', user.id).then(({ error }) => {
      if (error) console.error("Failed to sync Streak to Supabase", error);
    });
  }, [streak, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quests_${user.id}`, JSON.stringify(quests));
  }, [quests, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quest_cycle_keys_${user.id}`, JSON.stringify(questCycleKeys));
  }, [questCycleKeys, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quest_rotation_prev_${user.id}`, JSON.stringify(questRotationPrev));
  }, [questRotationPrev, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quest_schema_version_${user.id}`, String(QUEST_SCHEMA_VERSION));
  }, [user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_${user.id}`, energy.toString());
  }, [energy, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (lastEnergyUpdateTime === null) {
      AsyncStorage.removeItem(`energy_update_time_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(`energy_update_time_${user.id}`, lastEnergyUpdateTime.toString());
  }, [lastEnergyUpdateTime, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_bonus_date_${user.id}`, dailyEnergyBonusDate);
  }, [dailyEnergyBonusDate, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_bonus_count_${user.id}`, dailyEnergyBonusCount.toString());
  }, [dailyEnergyBonusCount, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_refill_date_${user.id}`, dailyEnergyRefillDate);
  }, [dailyEnergyRefillDate, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_refill_count_${user.id}`, dailyEnergyRefillCount.toString());
  }, [dailyEnergyRefillCount, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quest_reroll_date_${user.id}`, dailyQuestRerollDate);
  }, [dailyQuestRerollDate, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`quest_reroll_count_${user.id}`, dailyQuestRerollCount.toString());
  }, [dailyQuestRerollCount, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated || firstLaunchAtMs === null) return;
    AsyncStorage.setItem(`first_launch_at_${user.id}`, firstLaunchAtMs.toString());
  }, [firstLaunchAtMs, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (!streakRepairOffer || !streakRepairOffer.active) {
      AsyncStorage.removeItem(`streak_repair_offer_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(`streak_repair_offer_${user.id}`, JSON.stringify(streakRepairOffer));
  }, [streakRepairOffer, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (!comebackRewardOffer) {
      AsyncStorage.removeItem(`comeback_reward_offer_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(`comeback_reward_offer_${user.id}`, JSON.stringify(comebackRewardOffer));
  }, [comebackRewardOffer, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(
      `streak_milestones_claimed_${user.id}`,
      JSON.stringify(claimedStreakMilestones)
    );
  }, [claimedStreakMilestones, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (!eventCampaignState) {
      AsyncStorage.removeItem(`event_campaign_state_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(`event_campaign_state_${user.id}`, JSON.stringify(eventCampaignState));
  }, [eventCampaignState, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`personalization_segment_${user.id}`, personalizationSegment);
  }, [personalizationSegment, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (personalizationAssignedAtMs === null) {
      AsyncStorage.removeItem(`personalization_segment_assigned_at_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(
      `personalization_segment_assigned_at_${user.id}`,
      personalizationAssignedAtMs.toString()
    );
  }, [personalizationAssignedAtMs, user, isStateHydrated]);

  useEffect(() => {
    if (!streakRepairOffer || !streakRepairOffer.active) return;
    const nowMs = Date.now();
    const remainingMs = streakRepairOffer.expiresAtMs - nowMs;
    if (remainingMs <= 0) {
      Analytics.track("streak_repair_expired", {
        previousStreak: streakRepairOffer.previousStreak,
        expiredAt: new Date(streakRepairOffer.expiresAtMs).toISOString(),
      });
      setStreakRepairOffer(null);
      return;
    }

    const timer = setTimeout(() => {
      Analytics.track("streak_repair_expired", {
        previousStreak: streakRepairOffer.previousStreak,
        expiredAt: new Date(streakRepairOffer.expiresAtMs).toISOString(),
      });
      setStreakRepairOffer(null);
    }, remainingMs + 100);

    return () => clearTimeout(timer);
  }, [streakRepairOffer]);

  useEffect(() => {
    if (!comebackRewardOffer) return;
    const nowMs = Date.now();
    const remainingMs = comebackRewardOffer.expiresAtMs - nowMs;

    if (remainingMs <= 0) {
      if (comebackRewardOffer.active) {
        Analytics.track("comeback_reward_expired", {
          daysSinceStudy: comebackRewardOffer.daysSinceStudy,
          expiredAt: new Date(comebackRewardOffer.expiresAtMs).toISOString(),
          source: "offer_expiry",
        });
      }
      setComebackRewardOffer(null);
      return;
    }

    const timer = setTimeout(() => {
      setComebackRewardOffer((prev) => {
        if (!prev) return null;
        if (prev.active) {
          Analytics.track("comeback_reward_expired", {
            daysSinceStudy: prev.daysSinceStudy,
            expiredAt: new Date(prev.expiresAtMs).toISOString(),
            source: "offer_expiry",
          });
        }
        return null;
      });
    }, remainingMs + 100);

    return () => clearTimeout(timer);
  }, [comebackRewardOffer]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    reconcileQuestCycles("cycle_reconcile");
    reconcileEventCampaign();
    const interval = setInterval(() => {
      reconcileQuestCycles("cycle_reconcile");
      reconcileEventCampaign();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, isStateHydrated, reconcileQuestCycles, reconcileEventCampaign]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    const interval = setInterval(() => {
      setComebackRewardOffer((prev) => {
        if (!prev) return prev;
        if (!isComebackOfferExpired(prev)) return prev;

        if (prev.active) {
          Analytics.track("comeback_reward_expired", {
            daysSinceStudy: prev.daysSinceStudy,
            expiredAt: new Date(prev.expiresAtMs).toISOString(),
            source: "offer_expiry",
          });
        }
        return null;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [user, isStateHydrated]);

  // Helper: Get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Helper: Get yesterday's date
  function getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function parseDateKey(dateKey: string): Date | null {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!matched) return null;

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  function getDaysSinceDate(dateKey: string | null): number {
    if (!dateKey) return 0;
    const parsed = parseDateKey(dateKey);
    if (!parsed) return 0;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const parsedStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diffMs = todayStart.getTime() - parsedStart.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }

  function getDateDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.max(0, Math.floor(daysAgo)));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  const assignPersonalizationSegment = useCallback(async () => {
    if (!user || !isStateHydrated || !personalizationConfig.enabled) return;
    if (
      !shouldReassignSegment({
        lastAssignedAtMs: personalizationAssignedAtMsRef.current,
        cooldownHours: personalizationConfig.segment_reassign_cooldown_hours,
      })
    ) {
      return;
    }

    let lessonsCompleted7d = 0;
    try {
      const fromDate = getDateDaysAgo(6);
      const { data, error } = await supabase
        .from("streak_history")
        .select("lessons_completed")
        .eq("user_id", user.id)
        .gte("date", fromDate);
      if (error) throw error;

      lessonsCompleted7d = (data ?? []).reduce((sum, row) => {
        const value = Number((row as { lessons_completed?: number | null }).lessons_completed ?? 0);
        return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
      }, 0);
    } catch (error) {
      if (__DEV__) {
        console.warn("[Personalization] Failed to fetch 7d lesson counts:", error);
      }
      lessonsCompleted7d = 0;
    }

    const daysSinceStudy = getDaysSinceDate(lastActivityDate);
    const nextSegment = deriveUserSegment({
      lessonsCompleted7d,
      daysSinceStudy,
      currentStreak: streak,
    });
    const nowMs = Date.now();
    const segmentChanged = nextSegment !== personalizationSegmentRef.current;

    personalizationAssignedAtMsRef.current = nowMs;
    setPersonalizationAssignedAtMs(nowMs);

    if (!segmentChanged && personalizationSegmentRef.current === nextSegment) {
      return;
    }

    personalizationSegmentRef.current = nextSegment;
    setPersonalizationSegment(nextSegment);
    setQuests((prev) => {
      const adjusted = adjustQuestNeedsBySegment(prev, nextSegment);
      questsRef.current = adjusted;
      return adjusted;
    });

    Analytics.track("personalization_segment_assigned", {
      segment: nextSegment,
      lessonsCompleted7d,
      daysSinceStudy,
      source: "daily_reassign",
    });
  }, [user, isStateHydrated, lastActivityDate, streak]);

  useEffect(() => {
    if (!user || !isStateHydrated || !personalizationConfig.enabled) return;

    assignPersonalizationSegment().catch((error) => {
      console.warn("[Personalization] Initial segment assignment failed:", error);
    });

    const interval = setInterval(() => {
      assignPersonalizationSegment().catch((error) => {
        console.warn("[Personalization] Segment reassignment failed:", error);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [user, isStateHydrated, assignPersonalizationSegment]);

  // Check and reset daily progress
  useEffect(() => {
    const today = getTodayDate();
    if (dailyGoalLastReset !== today) {
      setDailyXP(0);
      setDailyGoalLastReset(today);
    }
  }, [dailyGoalLastReset]);

  useEffect(() => {
    const resetBonusIfNeeded = () => {
      const today = getTodayDate();
      if (dailyEnergyBonusDate !== today) {
        setDailyEnergyBonusDate(today);
        setDailyEnergyBonusCount(0);
      }
    };

    resetBonusIfNeeded();
    const interval = setInterval(resetBonusIfNeeded, 60000);
    return () => clearInterval(interval);
  }, [dailyEnergyBonusDate]);

  useEffect(() => {
    const resetEnergyRefillIfNeeded = () => {
      const today = getTodayDate();
      if (dailyEnergyRefillDate !== today) {
        setDailyEnergyRefillDate(today);
        setDailyEnergyRefillCount(0);
      }
    };

    resetEnergyRefillIfNeeded();
    const interval = setInterval(resetEnergyRefillIfNeeded, 60000);
    return () => clearInterval(interval);
  }, [dailyEnergyRefillDate]);

  useEffect(() => {
    const resetQuestRerollIfNeeded = () => {
      const today = getTodayDate();
      if (dailyQuestRerollDate !== today) {
        setDailyQuestRerollDate(today);
        setDailyQuestRerollCount(0);
      }
    };

    resetQuestRerollIfNeeded();
    const interval = setInterval(resetQuestRerollIfNeeded, 60000);
    return () => clearInterval(interval);
  }, [dailyQuestRerollDate]);

  // Update streak when studying
  const updateStreak = () => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    if (lastStudyDate === today) {
      // Already studied today, no change
      return;
    } else if (lastStudyDate === yesterday) {
      // Studied yesterday, increment streak
      setStreak((prev) => prev + 1);
      setLastStudyDate(today);
    } else if (lastStudyDate === null) {
      // First time studying
      setStreak(1);
      setLastStudyDate(today);
    } else {
      // Streak broken, check if freeze available
      if (freezeCount > 0) {
        // Auto-use freeze to save streak
        setFreezeCount((prev) => prev - 1);
        setStreak((prev) => prev + 1);
        setLastStudyDate(today);
      }
    }
  };

  // Update streak for today with Supabase integration
  const updateStreakForToday = async (currentXP?: number) => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    const previousStreak = streak;
    const daysSinceStudy = getDaysSinceDate(lastActivityDate);

    if (lastActivityDate === today) {
      // Already updated today
      return;
    }

    let newStreak = streak;
    if (lastActivityDate === yesterday) {
      // Continue streak
      newStreak = streak + 1;
    } else if (lastActivityDate === null) {
      // First time
      newStreak = 1;
    } else if (freezeCount > 0) {
      // Use freeze item
      setFreezeCount(freezeCount - 1);
      newStreak = streak + 1;
    } else {
      // Break streak
      newStreak = 1;
      const offer = createStreakRepairOffer(previousStreak, Date.now(), {
        costGems: STREAK_REPAIR_COST_GEMS,
        windowMs: STREAK_REPAIR_WINDOW_MS,
      });
      if (offer) {
        setStreakRepairOffer(offer);
        Analytics.track("streak_repair_offered", {
          previousStreak: offer.previousStreak,
          costGems: offer.costGems,
          expiresAt: new Date(offer.expiresAtMs).toISOString(),
        });
      }
    }

    setStreak(newStreak);
    setLastActivityDate(today);

    if (!isSubscriptionActive) {
      const adjustedComebackReward = getAdjustedComebackReward(
        COMEBACK_REWARD_ENERGY,
        personalizationSegmentRef.current,
        personalizationConfig
      );
      if (adjustedComebackReward > 0) {
        const offer = createComebackRewardOffer({
          daysSinceStudy,
          thresholdDays: COMEBACK_REWARD_THRESHOLD_DAYS,
          rewardEnergy: adjustedComebackReward,
          rewardGems: COMEBACK_REWARD_GEMS,
        });

        if (offer) {
          setComebackRewardOffer(offer);
          Analytics.track("comeback_reward_offered", {
            daysSinceStudy: offer.daysSinceStudy,
            rewardEnergy: offer.rewardEnergy,
            rewardGems: offer.rewardGems,
            thresholdDays: COMEBACK_REWARD_THRESHOLD_DAYS,
            source: "streak_update",
          });
        }
      }
    }

    const claimableMilestone = getClaimableStreakMilestone({
      newStreak,
      claimedMilestones: claimedStreakMilestonesRef.current,
      config: streakMilestonesConfig,
    });

    if (claimableMilestone) {
      const nextClaimedMilestones = normalizeClaimedMilestones([
        ...claimedStreakMilestonesRef.current,
        claimableMilestone.day,
      ]);
      claimedStreakMilestonesRef.current = nextClaimedMilestones;
      setClaimedStreakMilestones(nextClaimedMilestones);
      setGems((prev) => prev + claimableMilestone.gems);
      setStreakMilestoneToastQueue((prev) =>
        enqueueStreakMilestoneToast(prev, claimableMilestone)
      );

      if (isTrackedStreakMilestoneDay(claimableMilestone.day)) {
        Analytics.track("streak_milestone_rewarded", {
          day: claimableMilestone.day,
          rewardGems: claimableMilestone.gems,
          source: "streak_update",
          lifetimeOnce: true,
        });
      }
    }

    // Update streak history in Supabase
    if (user) {
      try {
        // Insert or update today's streak history
        await supabase
          .from('streak_history')
          .upsert({
            user_id: user.id,
            date: today,
            lessons_completed: 1,
            xp_earned: 0, // Will be updated when XP is added
          });

        // Update leaderboard
        await supabase
          .from('leaderboard')
          .upsert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User',
            total_xp: currentXP ?? xp,
            current_streak: newStreak,
          }, {
            onConflict: 'user_id',
          });
      } catch (error) {
        console.error('Error updating streak in Supabase:', error);
      }
    }
  };

  // Check if Double XP is active
  const isDoubleXpActive = doubleXpEndTime !== null && Date.now() < doubleXpEndTime;

  // Add XP and update daily progress + streak
    const addXp = async (amount: number) => {
    // Apply Double XP boost if active
    const effectiveAmount = isDoubleXpActive ? amount * 2 : amount;
    const newXP = xp + effectiveAmount;
    setXP(newXP);
      setDailyXP((prev) => {
        const newDailyXP = prev + effectiveAmount;
        // Award gems when daily goal is reached
        if (prev < dailyGoal && newDailyXP >= dailyGoal) {
          if (DAILY_GOAL_REWARD_GEMS > 0) {
            addGems(DAILY_GOAL_REWARD_GEMS);
          }
          Analytics.track("daily_goal_reached", {
            dailyGoal,
            dailyXp: newDailyXP,
            gemsAwarded: DAILY_GOAL_REWARD_GEMS,
            source: "xp_gain",
          });
        }
        return newDailyXP;
      });
    updateStreak(); // Keep old streak logic for backward compatibility
    updateStreakForToday(newXP); // Update Supabase streak with latest XP

    // 週次リーグXP加算
    if (user) {
      try {
        const { addWeeklyXp } = await import('./league');
        await addWeeklyXp(user.id, effectiveAmount);
        if (__DEV__) console.log('[League] Weekly XP added:', effectiveAmount);
      } catch (e) {
        console.warn('[League] Failed to add weekly XP:', e);
      }
    }
  };

  // Adaptive Difficulty (Enhanced Elo with IRT principles)
  const updateSkill = (isCorrect: boolean, itemDifficulty = 1500) => {
    // Dynamic K-factor: decreases as user gains experience
    // New users: K = 40 (fast adaptation)
    // Experienced users: K = 24 (stable ratings)
    const baseK = 40;
    const minK = 24;
    const K = Math.max(minK, baseK - (questionsAnswered / 100) * (baseK - minK));

    // Calculate expected score (probability of correct answer)
    const expectedScore = 1 / (1 + Math.pow(10, (itemDifficulty - skill) / 400));
    const actualScore = isCorrect ? 1 : 0;

    // Update skill rating
    const newSkill = skill + K * (actualScore - expectedScore);
    setSkill(Math.round(newSkill));

    // Update confidence: decreases when performance matches expectations
    // Increases when performance surprises (very easy or very hard questions)
    const surprise = Math.abs(actualScore - expectedScore);
    const confidenceChange = surprise > 0.3 ? -5 : 2;
    setSkillConfidence((prev) => Math.max(0, Math.min(100, prev + confidenceChange)));

    // Increment questions answered counter
    setQuestionsAnswered((prev) => prev + 1);
  };

  const incrementQuest = (id: string, step = 1) => {
    reconcileQuestCycles("cycle_reconcile");
    setQuests((prev) => {
      const next = prev.map((q) =>
        q.id === id
          ? { ...q, progress: Math.min(q.progress + step, q.need) }
          : q
      );
      questsRef.current = next;
      return next;
    });
  };

  const incrementQuestMetric = (metric: QuestMetric, step = 1) => {
    reconcileQuestCycles("cycle_reconcile");
    setQuests((prev) => {
      const next = applyQuestMetricProgress(prev, metric, step);
      questsRef.current = next;
      return next;
    });

    const activeEventConfig = getActiveEventCampaignConfig(new Date());
    if (!activeEventConfig) {
      if (eventCampaignStateRef.current) {
        setEventCampaignState(null);
      }
      return;
    }

    let rewardedQuests: EventQuestInstance[] = [];
    let rewardedGems = 0;
    let startedNow = false;
    let completedNow = false;

    setEventCampaignState((prev) => {
      const reconciled = reconcileEventStateOnAccess(prev, activeEventConfig, new Date());
      const progressed = applyEventMetricProgress(
        reconciled,
        metric as EventQuestMetric,
        step
      );

      let nextStarted = progressed.started;
      let nextCompleted = progressed.completed;

      const nextQuests = progressed.quests.map((quest) => {
        if (quest.progress >= quest.need && !quest.claimed) {
          const claimedQuest = { ...quest, claimed: true };
          rewardedQuests.push(claimedQuest);
          rewardedGems += claimedQuest.rewardGems;
          return claimedQuest;
        }
        return quest;
      });

      if (!nextStarted && nextQuests.some((quest) => quest.progress > 0)) {
        nextStarted = true;
        startedNow = true;
      }

      if (!nextCompleted && nextQuests.length > 0 && nextQuests.every((quest) => quest.claimed)) {
        nextCompleted = true;
        completedNow = true;
      }

      return {
        ...progressed,
        started: nextStarted,
        completed: nextCompleted,
        quests: nextQuests,
      };
    });

    if (rewardedGems > 0) {
      setGems((prev) => prev + rewardedGems);
    }

    rewardedQuests.forEach((quest) => {
      Analytics.track("event_quest_rewarded", {
        eventId: activeEventConfig.id,
        templateId: quest.templateId,
        metric: quest.metric,
        rewardGems: quest.rewardGems,
        source: "metric_progress",
      });
    });

    if (startedNow) {
      Analytics.track("event_started", {
        eventId: activeEventConfig.id,
        source: "metric_progress",
      });
    }

    if (completedNow) {
      const rewardBadgeId = activeEventConfig.reward_badge_id;
      Analytics.track("event_completed", {
        eventId: activeEventConfig.id,
        rewardBadgeId,
        source: "metric_progress",
      });

      if (user) {
        supabase
          .from("user_badges")
          .insert({ user_id: user.id, badge_id: rewardBadgeId })
          .then(({ error }) => {
            if (error && error.code !== "23505") {
              console.error("Failed to unlock event badge:", error);
              return;
            }
            setUnlockedBadges((prev) => {
              if (prev.has(rewardBadgeId)) return prev;
              const next = new Set(prev);
              next.add(rewardBadgeId);
              return next;
            });
            setBadgeToastQueue((prev) => enqueueBadgeToastIds(prev, [rewardBadgeId]));
          })
          .catch((error) => {
            console.error("Failed to unlock event badge:", error);
          });
      }
    }
  };

  const claimQuest = (id: string) => {
    reconcileQuestCycles("cycle_reconcile");
    setQuests((prev) => {
      const next = prev.map((q) => {
        if (q.id === id && q.progress >= q.need && !q.claimed) {
          const rewardGems = QUEST_CLAIM_BONUS_GEMS_BY_TYPE[q.type] ?? 0;
          addXp(q.rewardXp);
          if (rewardGems > 0) {
            addGems(rewardGems);
          }
          Analytics.track("quest_claimed", {
            templateId: q.templateId,
            type: q.type,
            rewardXp: q.rewardXp,
            rewardGems,
            source: "manual_claim",
          });
          return { ...q, claimed: true, chestState: "opening" as const };
        }
        return q;
      });
      questsRef.current = next;
      return next;
    });

    setTimeout(() => {
      setQuests((prev) => {
        const next = prev.map((q) => (q.id === id ? { ...q, chestState: "opened" as const } : q));
        questsRef.current = next;
        return next;
      });
    }, 1200);
  };

  const rerollQuest = (
    questId: string
  ): {
    success: boolean;
    reason?:
      | "disabled"
      | "invalid_type"
      | "limit_reached"
      | "insufficient_gems"
      | "already_completed"
      | "no_candidate";
  } => {
    reconcileQuestCycles("cycle_reconcile");

    if (!questRerollConfig.enabled) {
      return { success: false, reason: "disabled" };
    }

    const targetQuest = questsRef.current.find((quest) => quest.id === questId);
    if (!targetQuest) {
      return { success: false, reason: "no_candidate" };
    }

    if (targetQuest.type !== "daily" && targetQuest.type !== "weekly") {
      return { success: false, reason: "invalid_type" };
    }

    const today = getTodayDate();
    const usedCount = dailyQuestRerollDate === today ? dailyQuestRerollCount : 0;
    if (usedCount >= QUEST_REROLL_DAILY_LIMIT) {
      return { success: false, reason: "limit_reached" };
    }

    if (gems < QUEST_REROLL_COST_GEMS) {
      return { success: false, reason: "insufficient_gems" };
    }

    if (targetQuest.claimed || targetQuest.progress >= targetQuest.need) {
      return { success: false, reason: "already_completed" };
    }

    const rerolled = rerollQuestInstance({
      quests: questsRef.current,
      questId,
    });
    if (!rerolled.success) {
      return { success: false, reason: rerolled.reason };
    }

    const nextQuests = rerolled.quests;
    questsRef.current = nextQuests;
    setQuests(nextQuests);
    setGems((prev) => prev - QUEST_REROLL_COST_GEMS);
    setDailyQuestRerollDate(today);
    setDailyQuestRerollCount(usedCount + 1);

    if (rerolled.oldTemplateId && rerolled.newTemplateId && rerolled.type) {
      Analytics.track("quest_rerolled", {
        questId,
        type: rerolled.type,
        oldTemplateId: rerolled.oldTemplateId,
        newTemplateId: rerolled.newTemplateId,
        costGems: QUEST_REROLL_COST_GEMS,
        source: "quests_tab",
      });
    }

    return { success: true };
  };

  const consumeNextBadgeToast = (): string | null => {
    const { nextBadgeId, queue } = consumeNextBadgeToastItem(badgeToastQueueRef.current);
    if (!nextBadgeId) return null;
    badgeToastQueueRef.current = queue;
    setBadgeToastQueue(queue);
    return nextBadgeId;
  };

  const consumeNextStreakMilestoneToast = (): StreakMilestoneToastItem | null => {
    const { nextToast, queue } = consumeNextStreakMilestoneToastItem(
      streakMilestoneToastQueueRef.current
    );
    if (!nextToast) return null;
    streakMilestoneToastQueueRef.current = queue;
    setStreakMilestoneToastQueue(queue);
    return nextToast;
  };

  const consumeNextComebackRewardToast = (): ComebackRewardToastItem | null => {
    const { nextToast, queue } = consumeNextComebackRewardToastItem(
      comebackRewardToastQueueRef.current
    );
    if (!nextToast) return null;
    comebackRewardToastQueueRef.current = queue;
    setComebackRewardToastQueue(queue);
    return nextToast;
  };

  // Currency methods
  const addGems = (amount: number) => {
    setGems((prev) => prev + amount);
  };

  const setGemsDirectly = (amount: number) => {
    setGems(amount);
  };

  const spendGems = (amount: number): boolean => {
    if (gems >= amount) {
      setGems((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const buyFreeze = (): boolean => {
    const cost = 10; // 10 gems per freeze
    if (spendGems(cost)) {
      setFreezeCount((prev) => prev + 1);
      // Action Streak側のFreezeも増やす（一本化）
      addFreezes(1).catch(e => console.error("Failed to add freeze to streak data", e));
      return true;
    }
    return false;
  };

  const buyEnergyFullRefill = (): {
    success: boolean;
    reason?: EnergyFullRefillFailureReason;
  } => {
    const config = shopSinksConfig.energy_full_refill;
    const today = getTodayDate();
    const currentRefillCount = dailyEnergyRefillDate === today ? dailyEnergyRefillCount : 0;

    const result = evaluateEnergyFullRefillPurchase({
      enabled: config.enabled,
      isSubscriptionActive,
      energy,
      maxEnergy,
      dailyCount: currentRefillCount,
      dailyLimit: config.daily_limit,
      gems,
      costGems: config.cost_gems,
    });

    if (!result.success) {
      return { success: false, reason: result.reason };
    }

    const gemsBefore = gems;
    const energyBefore = energy;
    const nextGems = gemsBefore - config.cost_gems;
    const nextDailyCount = currentRefillCount + 1;

    setGems(nextGems);
    setEnergy(maxEnergy);
    setLastEnergyUpdateTime(null);
    setDailyEnergyRefillDate(today);
    setDailyEnergyRefillCount(nextDailyCount);

    Analytics.track("energy_full_refill_purchased", {
      costGems: config.cost_gems,
      gemsBefore,
      gemsAfter: nextGems,
      energyBefore,
      energyAfter: maxEnergy,
      dailyCountAfter: nextDailyCount,
    });

    return { success: true };
  };

  const buyDoubleXP = (
    source: "shop_item" | "lesson_complete_nudge" = "shop_item"
  ): {
    success: boolean;
    reason?: DoubleXpPurchaseFailureReason;
  } => {
    const nowMs = Date.now();
    const purchase = evaluateDoubleXpPurchase({
      gems,
      costGems: DOUBLE_XP_COST_GEMS,
      isActive: isDoubleXpActive,
      nowMs,
      durationMs: DOUBLE_XP_DURATION_MS,
    });

    if (!purchase.success) {
      return { success: false, reason: purchase.reason };
    }

    const gemsBefore = gems;
    setGems(purchase.gemsAfter);
    setDoubleXpEndTime(purchase.activeUntilMs);

    Analytics.track("double_xp_purchased", {
      source,
      costGems: DOUBLE_XP_COST_GEMS,
      gemsBefore,
      gemsAfter: purchase.gemsAfter,
      activeUntil: new Date(purchase.activeUntilMs).toISOString(),
    });

    return { success: true };
  };

    const useFreeze = (): boolean => {
      if (freezeCount > 0) {
        const nextCount = freezeCount - 1;
        setFreezeCount((prev) => prev - 1);
        Analytics.track("freeze_used", {
          freezesRemaining: nextCount,
          streak,
          source: "streak_protection",
        });
        // Action Streak側のFreezeも減らす（一本化）
        useFreezeStreak().catch(e => console.error("Failed to use freeze from streak data", e));
        return true;
    }
    return false;
  };

  const purchaseStreakRepair = (): {
    success: boolean;
    reason?: "no_offer" | "expired" | "insufficient_gems";
  } => {
    const result = purchaseStreakRepairOffer({
      offer: streakRepairOffer,
      gems,
      currentStreak: streak,
      nowMs: Date.now(),
    });

    if (!result.success) {
      if (result.reason === "expired" && streakRepairOffer?.active) {
        Analytics.track("streak_repair_expired", {
          previousStreak: streakRepairOffer.previousStreak,
          expiredAt: new Date(streakRepairOffer.expiresAtMs).toISOString(),
        });
        setStreakRepairOffer(null);
      }
      return { success: false, reason: result.reason };
    }

    const gemsBefore = gems;
    setGems(result.nextGems);
    setStreak(result.restoredStreak);
    setStreakRepairOffer(result.nextOffer);

    Analytics.track("streak_repair_purchased", {
      previousStreak: result.restoredStreak,
      costGems: streakRepairOffer?.costGems ?? STREAK_REPAIR_COST_GEMS,
      gemsBefore,
      gemsAfter: result.nextGems,
    });

    return { success: true };
  };

  const claimComebackRewardOnLessonComplete = (): {
    awarded: boolean;
    reason?: "no_offer" | "expired" | "already_claimed" | "subscription_excluded";
  } => {
    const today = getTodayDate();
    const claimResult = canClaimComebackReward({
      offer: comebackRewardOffer,
      isSubscriptionActive,
      todayDateKey: today,
    });

    if (!claimResult.claimable) {
      if (claimResult.reason === "expired" && comebackRewardOffer) {
        if (comebackRewardOffer.active) {
          Analytics.track("comeback_reward_expired", {
            daysSinceStudy: comebackRewardOffer.daysSinceStudy,
            expiredAt: new Date(comebackRewardOffer.expiresAtMs).toISOString(),
            source: "offer_expiry",
          });
        }
        setComebackRewardOffer(null);
      }
      return { awarded: false, reason: claimResult.reason };
    }

    if (!comebackRewardOffer) {
      return { awarded: false, reason: "no_offer" };
    }

    const rewardEnergy = Math.max(1, Math.floor(comebackRewardOffer.rewardEnergy));
    const rewardGems = Math.max(0, Math.floor(comebackRewardOffer.rewardGems ?? 0));

    addEnergy(rewardEnergy);
    if (rewardGems > 0) {
      addGems(rewardGems);
    }
    setComebackRewardOffer({ ...comebackRewardOffer, active: false });
    setComebackRewardToastQueue((prev) =>
      enqueueComebackRewardToast(prev, {
        rewardEnergy,
        rewardGems,
      })
    );
    Analytics.track("comeback_reward_claimed", {
      rewardEnergy,
      rewardGems,
      daysSinceStudy: comebackRewardOffer.daysSinceStudy,
      source: "lesson_complete",
    });
    return { awarded: true };
  };

  const setDailyGoal = (xp: number) => {
    setDailyGoalState(xp);
  };

  const getCurrentFreeMaxEnergy = (nowMs: number = Date.now()) =>
    getEffectiveFreeEnergyCap(
      FREE_BASE_MAX_ENERGY,
      FIRST_DAY_BONUS_ENERGY,
      firstLaunchAtMs,
      nowMs
    );

  // Energy system methods
  const consumeEnergy = (amount = LESSON_ENERGY_COST): boolean => {
    if (isSubscriptionActive) return true;
    const freeMaxEnergy = getCurrentFreeMaxEnergy();
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return true;
    if (energy < normalized) return false;

    const nextEnergy = Math.max(0, energy - normalized);
    setEnergy(nextEnergy);
    if (nextEnergy < freeMaxEnergy && lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
    return true;
  };

  const addEnergy = (amount: number) => {
    if (isSubscriptionActive) return;
    const freeMaxEnergy = getCurrentFreeMaxEnergy();
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return;

    const nextEnergy = Math.min(freeMaxEnergy, energy + normalized);
    setEnergy(nextEnergy);
    if (nextEnergy >= freeMaxEnergy) {
      setLastEnergyUpdateTime(null);
    } else if (lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
  };

  const tryTriggerStreakEnergyBonus = (correctStreak: number): boolean => {
    if (isSubscriptionActive) return false;
    if (correctStreak <= 0 || correctStreak % ENERGY_STREAK_BONUS_EVERY !== 0) return false;

    const today = getTodayDate();
    const currentBonusCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    if (currentBonusCount >= ENERGY_STREAK_BONUS_DAILY_CAP) return false;

    const roll = Math.random();
    if (roll >= ENERGY_STREAK_BONUS_CHANCE) return false;

    const prevEnergy = energy;
    const freeMaxEnergy = getCurrentFreeMaxEnergy();
    const nextEnergy = Math.min(freeMaxEnergy, prevEnergy + 1);
    addEnergy(1);
    setDailyEnergyBonusDate(today);
    setDailyEnergyBonusCount(currentBonusCount + 1);
    Analytics.track("energy_bonus_hit", {
      correctStreak,
      energyBefore: prevEnergy,
      energyAfter: nextEnergy,
      dailyBonusCount: currentBonusCount + 1,
      dailyBonusCap: ENERGY_STREAK_BONUS_DAILY_CAP,
    });
    return true;
  };

  // Plan & Entitlements methods
  const setPlanId = (plan: PlanId) => {
    setPlanIdState(plan);
  };

  const setActiveUntil = (date: string | null) => {
    setActiveUntilState(date);
  };

  // Check if subscription is currently active
  const isSubscriptionActive = (() => {
    if (!activeUntil || planId === "free") return false;
    const expirationDate = new Date(activeUntil);
    const now = new Date();
    return now < expirationDate;
  })();
  const effectiveFreeMaxEnergy = getCurrentFreeMaxEnergy();
  const maxEnergy = isSubscriptionActive ? SUBSCRIBER_MAX_ENERGY : effectiveFreeMaxEnergy;
  const energyRefillMinutes = ENERGY_REFILL_MINUTES;
  const dailyEnergyBonusRemaining = (() => {
    if (isSubscriptionActive) return ENERGY_STREAK_BONUS_DAILY_CAP;
    const today = getTodayDate();
    const usedCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    return Math.max(0, ENERGY_STREAK_BONUS_DAILY_CAP - usedCount);
  })();
  const dailyEnergyRefillRemaining = (() => {
    const config = shopSinksConfig.energy_full_refill;
    if (!config.enabled || isSubscriptionActive) return 0;
    const today = getTodayDate();
    const usedCount = dailyEnergyRefillDate === today ? dailyEnergyRefillCount : 0;
    return Math.max(0, config.daily_limit - usedCount);
  })();
  const dailyQuestRerollRemaining = (() => {
    if (!questRerollConfig.enabled) return 0;
    const today = getTodayDate();
    const usedCount = dailyQuestRerollDate === today ? dailyQuestRerollCount : 0;
    return Math.max(0, QUEST_REROLL_DAILY_LIMIT - usedCount);
  })();

  const hasProAccess = hasProItemAccess(planId);
  const canAccessMistakesHub = canUseMistakesHub(userId, planId);
  const mistakesHubRemaining = getMistakesHubRemaining(userId, planId);
  const activeEventConfig = getActiveEventCampaignConfig(new Date());
  const eventCampaign =
    activeEventConfig && eventCampaignState?.eventId === activeEventConfig.id
      ? {
          id: activeEventConfig.id,
          titleKey: activeEventConfig.title_key,
          communityTargetLessons: activeEventConfig.community_target_lessons,
          startAt: activeEventConfig.start_at,
          endAt: activeEventConfig.end_at,
        }
      : null;
  const eventQuests =
    eventCampaign && eventCampaignState?.eventId === activeEventConfig?.id
      ? eventCampaignState.quests
      : [];
  const hasPendingDailyQuests = quests.some((quest) => quest.type === "daily" && quest.progress < quest.need);

  // MistakesHub methods
  const addReviewEventFunc = (event: Omit<ReviewEvent, "userId" | "ts">) => {
    const fullEvent: ReviewEvent = {
      ...event,
      userId: userId,
      ts: Date.now(),
    };
    setReviewEvents((prev) => normalizeReviewEvents([...prev, fullEvent]));
  };

  const getMistakesHubItemsFunc = (): string[] => {
    return selectMistakesHubItems(reviewEvents);
  };

  const clearMistakesHubSessionFunc = () => {
    setMistakesHubSessionItems([]);
  };

  const startMistakesHubSessionFunc = () => {
    if (!canAccessMistakesHub) {
      return { started: false as const, reason: "not_available" as const };
    }

    const selectedItemIds = selectMistakesHubItems(reviewEvents).slice(0, 10);
    if (selectedItemIds.length === 0) {
      return { started: false as const, reason: "no_items" as const };
    }

    const sessionItems = buildMistakesHubSessionItems(reviewEvents, 10);
    if (sessionItems.length < 5) {
      return { started: false as const, reason: "insufficient_data" as const };
    }

    consumeMistakesHub(userId);
    setMistakesHubSessionItems(sessionItems);
    Analytics.track("mistakes_hub_session_started", {
      itemCount: sessionItems.length,
      source: "mistakes_hub_button",
    });

    return { started: true as const };
  };

  // Auto-recover energy over time (60 minutes per +1)
  useEffect(() => {
    if (isSubscriptionActive) {
      if (energy !== SUBSCRIBER_MAX_ENERGY) setEnergy(SUBSCRIBER_MAX_ENERGY);
      if (lastEnergyUpdateTime !== null) setLastEnergyUpdateTime(null);
      return;
    }

    if (energy > effectiveFreeMaxEnergy) {
      setEnergy(effectiveFreeMaxEnergy);
      setLastEnergyUpdateTime(null);
      return;
    }

    const recoverEnergy = () => {
      if (lastEnergyUpdateTime === null) return;
      if (energy >= effectiveFreeMaxEnergy) {
        setLastEnergyUpdateTime(null);
        return;
      }

      const elapsed = Date.now() - lastEnergyUpdateTime;
      const recovered = Math.floor(elapsed / ENERGY_REFILL_MS);
      if (recovered <= 0) return;

      const nextEnergy = Math.min(effectiveFreeMaxEnergy, energy + recovered);
      setEnergy(nextEnergy);
      if (nextEnergy >= effectiveFreeMaxEnergy) {
        setLastEnergyUpdateTime(null);
      } else {
        setLastEnergyUpdateTime(lastEnergyUpdateTime + recovered * ENERGY_REFILL_MS);
      }
    };

    recoverEnergy();
    const interval = setInterval(recoverEnergy, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [energy, isSubscriptionActive, lastEnergyUpdateTime, effectiveFreeMaxEnergy]);

  // Computed state
  // hasProAccess is already calculated at the top level
  // const hasProAccess = planId === "pro" || planId === "max"; 

  // Value object to provide
  const value: AppState = {
    selectedGenre,
    setSelectedGenre,
    xp,
    addXp,
    isStateHydrated,
    skill,
    skillConfidence,
    questionsAnswered,
    updateSkill,
    quests,
    eventCampaign,
    eventQuests,
    hasPendingDailyQuests,
    incrementQuest,
    incrementQuestMetric,
    claimQuest,
    rerollQuest,
    badgeToastQueue,
    consumeNextBadgeToast,
    streakMilestoneToastQueue,
    consumeNextStreakMilestoneToast,
    comebackRewardToastQueue,
    consumeNextComebackRewardToast,
    streak,
    lastStudyDate,
    lastActivityDate,
    streakHistory,
    updateStreakForToday,
    freezeCount,
    useFreeze,
    streakRepairOffer,
    purchaseStreakRepair,
    comebackRewardOffer,
    claimComebackRewardOnLessonComplete,
    gems,
    addGems,
    setGemsDirectly,
    spendGems,
    buyFreeze,
    buyEnergyFullRefill,
    buyDoubleXP,
    isDoubleXpActive,
    doubleXpEndTime,
    dailyGoal,
    dailyXP,
    setDailyGoal,
    energy,
    maxEnergy,
    consumeEnergy,
    lessonEnergyCost: LESSON_ENERGY_COST,
    addEnergy,
    tryTriggerStreakEnergyBonus,
    energyRefillMinutes,
    dailyEnergyBonusRemaining,
    dailyEnergyRefillRemaining,
    dailyQuestRerollRemaining,
    lastEnergyUpdateTime,
    planId,
    setPlanId,
    hasProAccess,
    activeUntil,
    setActiveUntil,
    isSubscriptionActive,
    reviewEvents,
    addReviewEvent: addReviewEventFunc,
    getMistakesHubItems: getMistakesHubItemsFunc,
    canAccessMistakesHub,
    mistakesHubRemaining,
    startMistakesHubSession: startMistakesHubSessionFunc,
    mistakesHubSessionItems,
    clearMistakesHubSession: clearMistakesHubSessionFunc,
    // Mistakes Hub (SRS)
    mistakes,
    addMistake,
    processReviewResult,
    getDueMistakes,
    clearMistake,
    // Badges
    unlockedBadges,
    checkAndUnlockBadges,
    mistakesCleared,
    // Lesson progress
    completedLessons,
    completeLesson,
    // Adaptive difficulty tracking
    recentQuestionTypes,
    recentAccuracy,
    currentStreak,
    recordQuestionResult,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
