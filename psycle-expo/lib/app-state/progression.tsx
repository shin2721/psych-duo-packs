import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { BADGES, type BadgeStats } from "../badges";
import {
  getComebackRewardConfig,
  getDailyGoalConfig,
  getEventCampaignConfig,
  getPersonalizationConfig,
  getQuestRewardsConfig,
  getQuestRerollConfig,
  getShopSinksConfig,
  getStreakMilestonesConfig,
  getStreakRepairConfig,
  type EventCampaignConfig,
  type EventQuestMetric,
  type PersonalizationSegment,
} from "../gamificationConfig";
import { getClaimableStreakMilestone, normalizeClaimedMilestones } from "../streakMilestones";
import { consumeNextBadgeToastItem, enqueueBadgeToastIds } from "../badgeToastQueue";
import {
  consumeNextStreakMilestoneToastItem,
  enqueueStreakMilestoneToast,
  type StreakMilestoneToastItem,
} from "../streakMilestoneToastQueue";
import {
  consumeNextComebackRewardToastItem,
  enqueueComebackRewardToast,
  type ComebackRewardToastItem,
} from "../comebackRewardToastQueue";
import {
  canClaimComebackReward,
  createComebackRewardOffer,
  isComebackOfferExpired,
  normalizeComebackRewardOffer,
  type ComebackRewardOffer,
} from "../comebackReward";
import {
  createStreakRepairOffer,
  isStreakRepairOfferActive,
  purchaseStreakRepairOffer,
  type StreakRepairOffer,
} from "../streakRepair";
import {
  applyEventMetricProgress,
  buildInitialEventState,
  isEventWindowActive,
  normalizeEventCampaignState,
  reconcileEventStateOnAccess,
  type EventCampaignState,
} from "../eventCampaign";
import { areQuestCycleKeysEqual, getQuestCycleKeys, type QuestCycleKeys } from "../questCycles";
import {
  createMonthlyFixedQuestInstances,
  getQuestTemplateNeed,
  type QuestInstance,
  type QuestMetric,
} from "../questDefinitions";
import {
  applyQuestMetricProgress,
  buildQuestBoardForCycles,
  extractSelectionFromQuests,
  normalizeQuestRotationSelection,
  reconcileQuestBoardOnCycleChange,
  rerollQuestInstance,
  type QuestRotationSelection,
} from "../questRotation";
import {
  getAdjustedComebackReward,
  normalizePersonalizationSegment,
} from "../personalization";
import { Analytics } from "../analytics";
import { useBillingState } from "./billing";
import { useEconomyState } from "./economy";
import {
  getUserStorageKey,
  loadUserEntries,
  parseStoredInt,
  persistJson,
  persistNumber,
  persistString,
} from "./persistence";
import {
  insertUserBadge,
  loadLessonsCompleted7d,
  loadRemoteBadgeIds,
  loadRemoteProgressionSnapshot,
  syncProfileStreak,
  syncProfileXp,
  syncStreakAndLeaderboard,
} from "./progressionRemote";
import {
  derivePersonalizationAssignment,
  getActiveEventCampaignConfig,
  getDateDaysAgo,
  getDaysSinceDate,
  isTrackedStreakMilestoneDay,
} from "./progressionLiveOps";
import {
  adjustQuestNeedsBySegment,
  createInitialQuestState,
  migrateMonthlyQuests,
  normalizeStoredQuestInstances,
} from "./progressionQuests";
import type { EventCampaignSummary, ProgressionState } from "./types";

type ProgressionContextValue = ProgressionState;

const ProgressionStateContext = createContext<ProgressionContextValue | undefined>(undefined);

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

const streakMilestonesConfig = getStreakMilestonesConfig();
const shopSinksConfig = getShopSinksConfig();
const personalizationConfig = getPersonalizationConfig();
const comebackRewardConfig = getComebackRewardConfig();
const dailyGoalConfig = getDailyGoalConfig();
const questRewardsConfig = getQuestRewardsConfig();
const questRerollConfig = getQuestRerollConfig();
const streakRepairConfig = getStreakRepairConfig();
const QUEST_SCHEMA_VERSION = 2;
const COMEBACK_REWARD_THRESHOLD_DAYS = normalizePositiveInt(comebackRewardConfig.threshold_days, 7);
const COMEBACK_REWARD_ENERGY = normalizePositiveInt(comebackRewardConfig.reward_energy, 2);
const COMEBACK_REWARD_GEMS = normalizeNonNegativeInt(comebackRewardConfig.reward_gems, 10);
const DAILY_GOAL_DEFAULT_XP = normalizePositiveInt(dailyGoalConfig.default_xp, 10);
const DAILY_GOAL_REWARD_GEMS = normalizeNonNegativeInt(dailyGoalConfig.reward_gems, 5);
const STREAK_REPAIR_COST_GEMS = normalizePositiveInt(streakRepairConfig.cost_gems, 50);
const STREAK_REPAIR_WINDOW_MS = normalizePositiveInt(streakRepairConfig.window_hours, 48) * 60 * 60 * 1000;
const QUEST_CLAIM_BONUS_GEMS_BY_TYPE = {
  daily: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.daily, 5),
  weekly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.weekly, 10),
  monthly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.monthly, 15),
} as const;
const QUEST_REROLL_COST_GEMS = normalizeNonNegativeInt(questRerollConfig.cost_gems, 5);
const QUEST_REROLL_DAILY_LIMIT = normalizePositiveInt(questRerollConfig.daily_limit, 1);

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ProgressionStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { planId, isSubscriptionActive } = useBillingState();
  const {
    gems,
    addGems,
    setGemsDirectly,
    addEnergy,
    freezeCount,
    setFreezeCountRaw,
    isDoubleXpActive,
    dailyQuestRerollDate,
    dailyQuestRerollCount,
    setDailyQuestRerollDateRaw,
    setDailyQuestRerollCountRaw,
  } = useEconomyState();

  const [selectedGenre, setSelectedGenre] = useState("mental");
  const [xp, setXP] = useState(0);
  const [skill, setSkill] = useState(1500);
  const [skillConfidence, setSkillConfidence] = useState(100);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [quests, setQuests] = useState<QuestInstance[]>(() => {
    const initialQuestCycleKeys = getQuestCycleKeys();
    return createInitialQuestState(initialQuestCycleKeys).quests;
  });
  const [questCycleKeys, setQuestCycleKeys] = useState<QuestCycleKeys>(() => getQuestCycleKeys());
  const [questRotationPrev, setQuestRotationPrev] = useState<QuestRotationSelection>(() =>
    createInitialQuestState(getQuestCycleKeys()).rotationSelection
  );
  const initialEventConfig = getActiveEventCampaignConfig();
  const [eventCampaignState, setEventCampaignState] = useState<EventCampaignState | null>(
    initialEventConfig ? buildInitialEventState(initialEventConfig) : null
  );
  const [personalizationSegment, setPersonalizationSegment] = useState<PersonalizationSegment>("new");
  const [personalizationAssignedAtMs, setPersonalizationAssignedAtMs] = useState<number | null>(null);
  const [badgeToastQueue, setBadgeToastQueue] = useState<string[]>([]);
  const [streakMilestoneToastQueue, setStreakMilestoneToastQueue] = useState<StreakMilestoneToastItem[]>([]);
  const [comebackRewardToastQueue, setComebackRewardToastQueue] = useState<ComebackRewardToastItem[]>([]);
  const [claimedStreakMilestones, setClaimedStreakMilestones] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [streakHistory] = useState<{ date: string; xp: number; lessonsCompleted: number }[]>([]);
  const [streakRepairOffer, setStreakRepairOffer] = useState<StreakRepairOffer | null>(null);
  const [comebackRewardOffer, setComebackRewardOffer] = useState<ComebackRewardOffer | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [recentQuestionTypes, setRecentQuestionTypes] = useState<string[]>([]);
  const [recentAccuracy, setRecentAccuracy] = useState(0.7);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentResults, setRecentResults] = useState<boolean[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [mistakesCleared] = useState(0);
  const [badgesHydrated, setBadgesHydrated] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState(DAILY_GOAL_DEFAULT_XP);
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoalLastReset, setDailyGoalLastReset] = useState(getTodayDate());
  const [isStateHydrated, setIsStateHydrated] = useState(false);

  const badgeCheckInFlightRef = useRef(false);
  const questsRef = useRef<QuestInstance[]>(quests);
  const questCycleKeysRef = useRef<QuestCycleKeys>(questCycleKeys);
  const questRotationPrevRef = useRef<QuestRotationSelection>(questRotationPrev);
  const eventCampaignStateRef = useRef<EventCampaignState | null>(eventCampaignState);
  const personalizationSegmentRef = useRef<PersonalizationSegment>(personalizationSegment);
  const personalizationAssignedAtMsRef = useRef<number | null>(personalizationAssignedAtMs);
  const liveOpsActivationRef = useRef<string | null>(null);
  const badgeToastQueueRef = useRef<string[]>(badgeToastQueue);
  const streakMilestoneToastQueueRef = useRef(streakMilestoneToastQueue);
  const comebackRewardToastQueueRef = useRef(comebackRewardToastQueue);
  const claimedStreakMilestonesRef = useRef<number[]>(claimedStreakMilestones);

  const completeLesson = (lessonId: string) => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  };

  const recordQuestionResult = (questionType: string, isCorrect: boolean) => {
    setRecentQuestionTypes((prev) => [...prev, questionType].slice(-5));
    setRecentResults((prev) => {
      const next = [...prev, isCorrect].slice(-10);
      const correctCount = next.filter(Boolean).length;
      setRecentAccuracy(correctCount / next.length);
      return next;
    });
    setCurrentStreak((prev) => (isCorrect ? prev + 1 : 0));
  };

  const checkAndUnlockBadges = useCallback(async (): Promise<string[]> => {
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
        try {
          await insertUserBadge(user.id, badge.id);
          setUnlockedBadges((prev) => new Set(prev).add(badge.id));
          newlyUnlocked.push(badge.id);
        } catch (error) {
          console.error("Failed to unlock badge:", error);
        }
      }
    }
    return newlyUnlocked;
  }, [completedLessons.size, friendCount, leaderboardRank, mistakesCleared, streak, unlockedBadges, user, xp]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setUnlockedBadges(new Set());
      setBadgesHydrated(true);
      return;
    }

    setBadgesHydrated(false);
    loadRemoteBadgeIds(user.id)
      .then((badgeIds) => {
        if (cancelled) return;
        setUnlockedBadges(new Set(badgeIds));
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error("Failed to load user badges:", error);
      })
      .finally(() => {
        if (!cancelled) setBadgesHydrated(true);
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

  const reconcileQuestCycles = useCallback((source: "cycle_reconcile" | "schema_migration" = "cycle_reconcile") => {
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
      const adjustedQuests = adjustQuestNeedsBySegment(reconcileResult.quests, personalizationSegmentRef.current);
      questsRef.current = adjustedQuests;
      setQuests(adjustedQuests);
      questRotationPrevRef.current = reconcileResult.selection;
      setQuestRotationPrev(reconcileResult.selection);

      if (reconcileResult.autoClaimed.totalRewardXp > 0) {
        setXP((prev) => prev + reconcileResult.autoClaimed.totalRewardXp);
      }
      if (reconcileResult.autoClaimed.totalRewardGems > 0) {
        addGems(reconcileResult.autoClaimed.totalRewardGems);
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
  }, [addGems]);

  const reconcileEventCampaign = useCallback(() => {
    const activeConfig = getActiveEventCampaignConfig(new Date());
    if (!activeConfig) {
      if (eventCampaignStateRef.current) setEventCampaignState(null);
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

    setEventCampaignState((prev) => reconcileEventStateOnAccess(prev, activeConfig, new Date()));
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
            Analytics.track("badge_unlocked", { badgeId, source: "auto_check" });
          });
        }
      } finally {
        badgeCheckInFlightRef.current = false;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    badgesHydrated,
    checkAndUnlockBadges,
    completedLessons,
    friendCount,
    isStateHydrated,
    leaderboardRank,
    mistakesCleared,
    user?.id,
    streak,
    xp,
  ]);

  useEffect(() => {
    if (!user) {
      setIsStateHydrated(false);
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
      setXP(0);
      setStreak(0);
      setFriendCount(0);
      setLeaderboardRank(0);
      setStreakRepairOffer(null);
      setComebackRewardOffer(null);
      return;
    }

    let cancelled = false;
    setIsStateHydrated(false);

    const loadProgression = async () => {
      try {
        const saved = await loadUserEntries(user.id, [
          "xp",
          "streak",
          "quests",
          "questCycleKeys",
          "questSchemaVersion",
          "questRotationPrev",
          "streakRepairOffer",
          "comebackRewardOffer",
          "streakMilestonesClaimed",
          "eventCampaignState",
          "personalizationSegment",
          "personalizationSegmentAssignedAt",
        ]);

        if (cancelled) return;

        const savedXp = parseStoredInt(saved.xp);
        const savedStreak = parseStoredInt(saved.streak);
        if (savedXp !== null) setXP(savedXp);
        if (savedStreak !== null) setStreak(savedStreak);

        const initialSegment = normalizePersonalizationSegment(saved.personalizationSegment);
        setPersonalizationSegment(initialSegment);
        personalizationSegmentRef.current = initialSegment;

        const parsedAssignedAt = parseStoredInt(saved.personalizationSegmentAssignedAt);
        const initialAssignedAt = parsedAssignedAt !== null ? parsedAssignedAt : null;
        setPersonalizationAssignedAtMs(initialAssignedAt);
        personalizationAssignedAtMsRef.current = initialAssignedAt;

        const nowQuestCycleKeys = getQuestCycleKeys();
        let loadedQuestCycleKeys = nowQuestCycleKeys;
        if (saved.questCycleKeys) {
          try {
            const parsed = JSON.parse(saved.questCycleKeys) as Partial<QuestCycleKeys>;
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

        if (saved.questRotationPrev) {
          try {
            loadedRotationSelection = normalizeQuestRotationSelection(JSON.parse(saved.questRotationPrev));
          } catch (error) {
            console.warn("Failed to parse stored quest rotation selection:", error);
          }
        }

        if (saved.quests) {
          try {
            const normalized = normalizeStoredQuestInstances(JSON.parse(saved.quests), loadedQuestCycleKeys);
            if (normalized) {
              loadedQuests = normalized;
              if (!saved.questRotationPrev) {
                loadedRotationSelection = normalizeQuestRotationSelection(extractSelectionFromQuests(normalized));
              }
            }
          } catch (error) {
            console.warn("Failed to parse stored quests:", error);
          }
        }

        const questSchemaVersion = parseStoredInt(saved.questSchemaVersion) ?? 1;
        let pendingAutoClaimXp = 0;
        let pendingAutoClaimGems = 0;

        if (questSchemaVersion < QUEST_SCHEMA_VERSION) {
          const claimableOnMigration = loadedQuests.filter((quest) => quest.progress >= quest.need && !quest.claimed);
          if (claimableOnMigration.length > 0) {
            pendingAutoClaimXp += claimableOnMigration.reduce((sum, quest) => sum + quest.rewardXp, 0);
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

        if (pendingAutoClaimXp > 0) setXP((prev) => prev + pendingAutoClaimXp);
        if (pendingAutoClaimGems > 0) addGems(pendingAutoClaimGems);

        const adjustedLoadedQuests = adjustQuestNeedsBySegment(loadedQuests, initialSegment);
        setQuests(adjustedLoadedQuests);
        questsRef.current = adjustedLoadedQuests;
        setQuestCycleKeys(nowQuestCycleKeys);
        questCycleKeysRef.current = nowQuestCycleKeys;
        setQuestRotationPrev(loadedRotationSelection);
        questRotationPrevRef.current = loadedRotationSelection;

        await persistNumber(getUserStorageKey("questSchemaVersion", user.id), QUEST_SCHEMA_VERSION);

        if (saved.streakRepairOffer) {
          try {
            const parsedOffer = JSON.parse(saved.streakRepairOffer);
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

        if (saved.comebackRewardOffer) {
          try {
            const parsedOffer = normalizeComebackRewardOffer(JSON.parse(saved.comebackRewardOffer));
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

        if (saved.streakMilestonesClaimed) {
          try {
            const normalizedClaimedMilestones = normalizeClaimedMilestones(JSON.parse(saved.streakMilestonesClaimed));
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
          if (saved.eventCampaignState) {
            try {
              nextEventCampaignState = normalizeEventCampaignState(JSON.parse(saved.eventCampaignState));
            } catch {
              nextEventCampaignState = null;
            }
          }
          nextEventCampaignState = reconcileEventStateOnAccess(nextEventCampaignState, activeEventConfig, new Date());
          setEventCampaignState(nextEventCampaignState);
          eventCampaignStateRef.current = nextEventCampaignState;
        } else {
          setEventCampaignState(null);
          eventCampaignStateRef.current = null;
        }

        try {
          const remoteSnapshot = await loadRemoteProgressionSnapshot(user.id, savedXp ?? 0);
          if (!cancelled) {
            if (remoteSnapshot.xp !== null) setXP(remoteSnapshot.xp);
            if (remoteSnapshot.streak !== null) setStreak(remoteSnapshot.streak);
            setFriendCount(remoteSnapshot.friendCount);
            setLeaderboardRank(remoteSnapshot.leaderboardRank);
          }
        } catch (error) {
          if (__DEV__) {
            console.log("Progression Supabase sync failed (using local data):", error);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log("Progression local storage read failed:", error);
        }
      } finally {
        if (!cancelled) setIsStateHydrated(true);
      }
    };

    loadProgression();
    return () => {
      cancelled = true;
    };
  }, [addGems, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistNumber(getUserStorageKey("xp", user.id), xp).catch(() => {});
    const timer = setTimeout(() => {
      syncProfileXp(user.id, xp).catch((error) => {
        console.error("Failed to sync XP to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [isStateHydrated, user, xp]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistNumber(getUserStorageKey("streak", user.id), streak).catch(() => {});
    syncProfileStreak(user.id, streak).catch((error) => {
      if (error) console.error("Failed to sync streak to Supabase", error);
    });
  }, [isStateHydrated, streak, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("quests", user.id), quests).catch(() => {});
  }, [isStateHydrated, quests, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("questCycleKeys", user.id), questCycleKeys).catch(() => {});
  }, [isStateHydrated, questCycleKeys, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("questRotationPrev", user.id), questRotationPrev).catch(() => {});
  }, [isStateHydrated, questRotationPrev, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistNumber(getUserStorageKey("questSchemaVersion", user.id), QUEST_SCHEMA_VERSION).catch(() => {});
  }, [isStateHydrated, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("streakRepairOffer", user.id), streakRepairOffer).catch(() => {});
  }, [isStateHydrated, streakRepairOffer, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("comebackRewardOffer", user.id), comebackRewardOffer).catch(() => {});
  }, [comebackRewardOffer, isStateHydrated, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("streakMilestonesClaimed", user.id), claimedStreakMilestones).catch(() => {});
  }, [claimedStreakMilestones, isStateHydrated, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistJson(getUserStorageKey("eventCampaignState", user.id), eventCampaignState).catch(() => {});
  }, [eventCampaignState, isStateHydrated, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistString(getUserStorageKey("personalizationSegment", user.id), personalizationSegment).catch(() => {});
  }, [isStateHydrated, personalizationSegment, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    persistNumber(getUserStorageKey("personalizationSegmentAssignedAt", user.id), personalizationAssignedAtMs).catch(() => {});
  }, [isStateHydrated, personalizationAssignedAtMs, user]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    reconcileQuestCycles("cycle_reconcile");
    reconcileEventCampaign();
    const interval = setInterval(() => {
      reconcileQuestCycles("cycle_reconcile");
      reconcileEventCampaign();
    }, 60000);
    return () => clearInterval(interval);
  }, [isStateHydrated, reconcileEventCampaign, reconcileQuestCycles, user]);

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
  }, [isStateHydrated, user]);

  const assignPersonalizationSegment = useCallback(async () => {
    if (!user || !isStateHydrated || !personalizationConfig.enabled) return;

    let lessonsCompleted7d = 0;
    try {
      const fromDate = getDateDaysAgo(6);
      lessonsCompleted7d = await loadLessonsCompleted7d(user.id, fromDate);
    } catch (error) {
      if (__DEV__) {
        console.warn("[Personalization] Failed to fetch 7d lesson counts:", error);
      }
      lessonsCompleted7d = 0;
    }

    const assignment = derivePersonalizationAssignment({
      cooldownHours: personalizationConfig.segment_reassign_cooldown_hours,
      currentSegment: personalizationSegmentRef.current,
      lastActivityDate,
      lastAssignedAtMs: personalizationAssignedAtMsRef.current,
      lessonsCompleted7d,
      streak,
    });
    if (!assignment.shouldAssign) return;

    const nowMs = Date.now();

    personalizationAssignedAtMsRef.current = nowMs;
    setPersonalizationAssignedAtMs(nowMs);

    if (!assignment.segmentChanged && personalizationSegmentRef.current === assignment.nextSegment) {
      return;
    }

    personalizationSegmentRef.current = assignment.nextSegment;
    setPersonalizationSegment(assignment.nextSegment);
    setQuests((prev) => {
      const adjusted = adjustQuestNeedsBySegment(prev, assignment.nextSegment);
      questsRef.current = adjusted;
      return adjusted;
    });

    Analytics.track("personalization_segment_assigned", {
      segment: assignment.nextSegment,
      lessonsCompleted7d,
      daysSinceStudy: assignment.daysSinceStudy,
      source: "daily_reassign",
    });
  }, [isStateHydrated, lastActivityDate, streak, user]);

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
  }, [assignPersonalizationSegment, isStateHydrated, user]);

  useEffect(() => {
    const today = getTodayDate();
    if (dailyGoalLastReset !== today) {
      setDailyXP(0);
      setDailyGoalLastReset(today);
    }
  }, [dailyGoalLastReset]);

  const updateStreak = () => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    if (lastStudyDate === today) {
      return;
    } else if (lastStudyDate === yesterday) {
      setStreak((prev) => prev + 1);
      setLastStudyDate(today);
    } else if (lastStudyDate === null) {
      setStreak(1);
      setLastStudyDate(today);
    } else if (freezeCount > 0) {
      setFreezeCountRaw((prev) => prev - 1);
      setStreak((prev) => prev + 1);
      setLastStudyDate(today);
    }
  };

  const updateStreakForToday = async (currentXP?: number) => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    const previousStreak = streak;
    const daysSinceStudy = getDaysSinceDate(lastActivityDate);

    if (lastActivityDate === today) {
      return;
    }

    let newStreak = streak;
    if (lastActivityDate === yesterday) {
      newStreak = streak + 1;
    } else if (lastActivityDate === null) {
      newStreak = 1;
    } else if (freezeCount > 0) {
      setFreezeCountRaw(freezeCount - 1);
      newStreak = streak + 1;
    } else {
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
      addGems(claimableMilestone.gems);
      setStreakMilestoneToastQueue((prev) => enqueueStreakMilestoneToast(prev, claimableMilestone));

      if (isTrackedStreakMilestoneDay(claimableMilestone.day)) {
        Analytics.track("streak_milestone_rewarded", {
          day: claimableMilestone.day,
          rewardGems: claimableMilestone.gems,
          source: "streak_update",
          lifetimeOnce: true,
        });
      }
    }

    if (user) {
      try {
        await syncStreakAndLeaderboard(user.id, {
          date: today,
          lessonsCompleted: 1,
          xpEarned: 0,
          username: user.email?.split("@")[0] || "User",
          totalXp: currentXP ?? xp,
          currentStreak: newStreak,
        });
      } catch (error) {
        console.error("Error updating streak in Supabase:", error);
      }
    }
  };

  const addXp = async (amount: number) => {
    const effectiveAmount = isDoubleXpActive ? amount * 2 : amount;
    const newXP = xp + effectiveAmount;
    setXP(newXP);
    setDailyXP((prev) => {
      const newDailyXP = prev + effectiveAmount;
      if (prev < dailyGoal && newDailyXP >= dailyGoal) {
        if (DAILY_GOAL_REWARD_GEMS > 0) addGems(DAILY_GOAL_REWARD_GEMS);
        Analytics.track("daily_goal_reached", {
          dailyGoal,
          dailyXp: newDailyXP,
          gemsAwarded: DAILY_GOAL_REWARD_GEMS,
          source: "xp_gain",
        });
      }
      return newDailyXP;
    });

    updateStreak();
    updateStreakForToday(newXP);

    if (user) {
      try {
        const { addWeeklyXp } = await import("../league");
        await addWeeklyXp(user.id, effectiveAmount);
        if (__DEV__) console.log("[League] Weekly XP added:", effectiveAmount);
      } catch (error) {
        console.warn("[League] Failed to add weekly XP:", error);
      }
    }
  };

  const updateSkill = (isCorrect: boolean, itemDifficulty = 1500) => {
    const baseK = 40;
    const minK = 24;
    const K = Math.max(minK, baseK - (questionsAnswered / 100) * (baseK - minK));
    const expectedScore = 1 / (1 + Math.pow(10, (itemDifficulty - skill) / 400));
    const actualScore = isCorrect ? 1 : 0;
    const newSkill = skill + K * (actualScore - expectedScore);
    setSkill(Math.round(newSkill));
    const surprise = Math.abs(actualScore - expectedScore);
    const confidenceChange = surprise > 0.3 ? -5 : 2;
    setSkillConfidence((prev) => Math.max(0, Math.min(100, prev + confidenceChange)));
    setQuestionsAnswered((prev) => prev + 1);
  };

  const incrementQuest = (id: string, step = 1) => {
    reconcileQuestCycles("cycle_reconcile");
    setQuests((prev) => {
      const next = prev.map((quest) =>
        quest.id === id ? { ...quest, progress: Math.min(quest.progress + step, quest.need) } : quest
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
      if (eventCampaignStateRef.current) setEventCampaignState(null);
      return;
    }

    let rewardedQuests: any[] = [];
    let rewardedGems = 0;
    let startedNow = false;
    let completedNow = false;

    setEventCampaignState((prev) => {
      const reconciled = reconcileEventStateOnAccess(prev, activeEventConfig, new Date());
      const progressed = applyEventMetricProgress(reconciled, metric as EventQuestMetric, step);
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

      return { ...progressed, started: nextStarted, completed: nextCompleted, quests: nextQuests };
    });

    if (rewardedGems > 0) addGems(rewardedGems);

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
      Analytics.track("event_started", { eventId: activeEventConfig.id, source: "metric_progress" });
    }

    if (completedNow) {
      const rewardBadgeId = activeEventConfig.reward_badge_id;
      Analytics.track("event_completed", {
        eventId: activeEventConfig.id,
        rewardBadgeId,
        source: "metric_progress",
      });

      if (user) {
        Promise.resolve(
          insertUserBadge(user.id, rewardBadgeId)
        )
          .then(() => {
            setUnlockedBadges((prev) => {
              if (prev.has(rewardBadgeId)) return prev;
              const next = new Set(prev);
              next.add(rewardBadgeId);
              return next;
            });
            setBadgeToastQueue((prev) => enqueueBadgeToastIds(prev, [rewardBadgeId]));
          })
          .catch((error: unknown) => {
            console.error("Failed to unlock event badge:", error);
          });
      }
    }
  };

  const claimQuest = (id: string) => {
    reconcileQuestCycles("cycle_reconcile");
    setQuests((prev) => {
      const next = prev.map((quest) => {
        if (quest.id === id && quest.progress >= quest.need && !quest.claimed) {
          const rewardGems = QUEST_CLAIM_BONUS_GEMS_BY_TYPE[quest.type] ?? 0;
          addXp(quest.rewardXp);
          if (rewardGems > 0) addGems(rewardGems);
          Analytics.track("quest_claimed", {
            templateId: quest.templateId,
            type: quest.type,
            rewardXp: quest.rewardXp,
            rewardGems,
            source: "manual_claim",
          });
          return { ...quest, claimed: true, chestState: "opening" as const };
        }
        return quest;
      });
      questsRef.current = next;
      return next;
    });

    setTimeout(() => {
      setQuests((prev) => {
        const next = prev.map((quest) => (quest.id === id ? { ...quest, chestState: "opened" as const } : quest));
        questsRef.current = next;
        return next;
      });
    }, 1200);
  };

  const rerollQuest = (questId: string) => {
    reconcileQuestCycles("cycle_reconcile");

    if (!questRerollConfig.enabled) return { success: false as const, reason: "disabled" as const };
    const targetQuest = questsRef.current.find((quest) => quest.id === questId);
    if (!targetQuest) return { success: false as const, reason: "no_candidate" as const };
    if (targetQuest.type !== "daily" && targetQuest.type !== "weekly") {
      return { success: false as const, reason: "invalid_type" as const };
    }

    const today = getTodayDate();
    const usedCount = dailyQuestRerollDate === today ? dailyQuestRerollCount : 0;
    if (usedCount >= QUEST_REROLL_DAILY_LIMIT) {
      return { success: false as const, reason: "limit_reached" as const };
    }
    if (gems < QUEST_REROLL_COST_GEMS) {
      return { success: false as const, reason: "insufficient_gems" as const };
    }
    if (targetQuest.claimed || targetQuest.progress >= targetQuest.need) {
      return { success: false as const, reason: "already_completed" as const };
    }

    const rerolled = rerollQuestInstance({
      quests: questsRef.current,
      questId,
    });
    if (!rerolled.success) {
      return { success: false as const, reason: rerolled.reason };
    }

    questsRef.current = rerolled.quests;
    setQuests(rerolled.quests);
    setGemsDirectly(gems - QUEST_REROLL_COST_GEMS);
    setDailyQuestRerollDateRaw(today);
    setDailyQuestRerollCountRaw(usedCount + 1);

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

    return { success: true as const };
  };

  const consumeNextBadgeToast = () => {
    const { nextBadgeId, queue } = consumeNextBadgeToastItem(badgeToastQueueRef.current);
    if (!nextBadgeId) return null;
    badgeToastQueueRef.current = queue;
    setBadgeToastQueue(queue);
    return nextBadgeId;
  };

  const consumeNextStreakMilestoneToast = () => {
    const { nextToast, queue } = consumeNextStreakMilestoneToastItem(streakMilestoneToastQueueRef.current);
    if (!nextToast) return null;
    streakMilestoneToastQueueRef.current = queue;
    setStreakMilestoneToastQueue(queue);
    return nextToast;
  };

  const consumeNextComebackRewardToast = () => {
    const { nextToast, queue } = consumeNextComebackRewardToastItem(comebackRewardToastQueueRef.current);
    if (!nextToast) return null;
    comebackRewardToastQueueRef.current = queue;
    setComebackRewardToastQueue(queue);
    return nextToast;
  };

  const purchaseStreakRepair = () => {
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
      return { success: false as const, reason: result.reason };
    }

    const gemsBefore = gems;
    setGemsDirectly(result.nextGems);
    setStreak(result.restoredStreak);
    setStreakRepairOffer(result.nextOffer);

    Analytics.track("streak_repair_purchased", {
      previousStreak: result.restoredStreak,
      costGems: streakRepairOffer?.costGems ?? STREAK_REPAIR_COST_GEMS,
      gemsBefore,
      gemsAfter: result.nextGems,
    });

    return { success: true as const };
  };

  const claimComebackRewardOnLessonComplete = () => {
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
      return { awarded: false as const, reason: claimResult.reason };
    }

    if (!comebackRewardOffer) {
      return { awarded: false as const, reason: "no_offer" as const };
    }

    const rewardEnergy = Math.max(1, Math.floor(comebackRewardOffer.rewardEnergy));
    const rewardGems = Math.max(0, Math.floor(comebackRewardOffer.rewardGems ?? 0));

    addEnergy(rewardEnergy);
    if (rewardGems > 0) addGems(rewardGems);
    setComebackRewardOffer({ ...comebackRewardOffer, active: false });
    setComebackRewardToastQueue((prev) => enqueueComebackRewardToast(prev, { rewardEnergy, rewardGems }));
    Analytics.track("comeback_reward_claimed", {
      rewardEnergy,
      rewardGems,
      daysSinceStudy: comebackRewardOffer.daysSinceStudy,
      source: "lesson_complete",
    });
    return { awarded: true as const };
  };

  const setDailyGoal = (nextXp: number) => {
    setDailyGoalState(nextXp);
  };

  const activeEventConfig = getActiveEventCampaignConfig(new Date());
  const matchingEventCampaignState =
    activeEventConfig && eventCampaignState?.eventId === activeEventConfig.id
      ? eventCampaignState
      : null;
  const eventCampaign: EventCampaignSummary | null =
    activeEventConfig && matchingEventCampaignState
      ? {
          id: activeEventConfig.id,
          titleKey: activeEventConfig.title_key,
          communityTargetLessons: activeEventConfig.community_target_lessons,
          startAt: activeEventConfig.start_at,
          endAt: activeEventConfig.end_at,
        }
      : null;
  const eventQuests = matchingEventCampaignState ? matchingEventCampaignState.quests : [];
  const hasPendingDailyQuests = quests.some((quest) => quest.type === "daily" && quest.progress < quest.need);

  const value = useMemo<ProgressionContextValue>(
    () => ({
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
      streak,
      lastStudyDate,
      lastActivityDate,
      streakHistory,
      updateStreakForToday,
      streakRepairOffer,
      purchaseStreakRepair,
      comebackRewardOffer,
      claimComebackRewardOnLessonComplete,
      comebackRewardToastQueue,
      consumeNextComebackRewardToast,
      dailyGoal,
      dailyXP,
      setDailyGoal,
      completedLessons,
      completeLesson,
      recentQuestionTypes,
      recentAccuracy,
      currentStreak,
      recordQuestionResult,
      unlockedBadges,
      checkAndUnlockBadges,
    }),
    [
      badgeToastQueue,
      comebackRewardOffer,
      comebackRewardToastQueue,
      completedLessons,
      currentStreak,
      dailyGoal,
      dailyXP,
      eventCampaign,
      eventQuests,
      hasPendingDailyQuests,
      isStateHydrated,
      lastActivityDate,
      lastStudyDate,
      questionsAnswered,
      quests,
      recentAccuracy,
      recentQuestionTypes,
      selectedGenre,
      skill,
      skillConfidence,
      streak,
      streakHistory,
      streakMilestoneToastQueue,
      streakRepairOffer,
      unlockedBadges,
      xp,
    ]
  );

  return <ProgressionStateContext.Provider value={value}>{children}</ProgressionStateContext.Provider>;
}

export function useProgressionState() {
  const context = useContext(ProgressionStateContext);
  if (!context) {
    throw new Error("useProgressionState must be used within ProgressionStateProvider");
  }
  return context;
}
