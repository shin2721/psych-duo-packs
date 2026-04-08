import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "../AuthContext";
import type { BadgeStats } from "../badges";
import { type PersonalizationSegment } from "../gamificationConfig";
import { consumeNextBadgeToastItem } from "../badgeToastQueue";
import {
  consumeNextStreakMilestoneToastItem,
  type StreakMilestoneToastItem,
} from "../streakMilestoneToastQueue";
import {
  consumeNextComebackRewardToastItem,
  type ComebackRewardToastItem,
} from "../comebackRewardToastQueue";
import type { ComebackRewardOffer } from "../comebackReward";
import type { StreakRepairOffer } from "../streakRepair";
import { buildInitialEventState, type EventCampaignState } from "../eventCampaign";
import { getQuestCycleKeys, type QuestCycleKeys } from "../questCycles";
import { type QuestInstance, type QuestMetric } from "../questDefinitions";
import type { QuestRotationSelection } from "../questRotation";
import { useBillingState } from "./billing";
import { useEconomyState } from "./economy";
import { getActiveEventCampaignConfig } from "./progressionLiveOps";
import { createInitialQuestState } from "./progressionQuests";
import { checkAndUnlockBadges as runBadgeUnlockCheck } from "./progression/progressionBadges";
import {
  addXpAction,
  claimComebackRewardEntry,
  claimQuestAction,
  incrementQuestAction,
  incrementQuestMetricAction,
  purchaseStreakRepairEntry,
  reconcileEventCampaignAction,
  reconcileQuestCyclesAction,
  rerollQuestAction,
  updateInlineStreakAction,
  updateStreakForTodayEntry,
} from "./progression/progressionActions";
import { useProgressionBadgeEffects } from "./progression/useProgressionBadgeEffects";
import { useProgressionHydrationEffect } from "./progression/useProgressionHydrationEffect";
import { useProgressionPeriodicEffects } from "./progression/useProgressionPeriodicEffects";
import { useProgressionPersistenceEffects } from "./progression/useProgressionPersistenceEffects";
import { useProgressionPersonalizationEffects } from "./progression/useProgressionPersonalizationEffects";
import { useProgressionRefs } from "./progression/useProgressionRefs";
import { getTodayDate } from "./progression/progressionUtils";
import {
  COMEBACK_REWARD_ENERGY,
  COMEBACK_REWARD_GEMS,
  COMEBACK_REWARD_THRESHOLD_DAYS,
  DAILY_GOAL_DEFAULT_XP,
  DAILY_GOAL_REWARD_GEMS,
  personalizationConfig,
  QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
  QUEST_REROLL_CONFIG,
  QUEST_REROLL_COST_GEMS,
  QUEST_REROLL_DAILY_LIMIT,
  QUEST_SCHEMA_VERSION,
  STREAK_REPAIR_COST_GEMS,
  STREAK_REPAIR_WINDOW_MS,
  streakMilestonesConfig,
} from "./progression/progressionConfig";
import { useProgressionValue } from "./progression/useProgressionValue";
import type { ProgressionState } from "./types";

type ProgressionContextValue = ProgressionState;

const ProgressionStateContext = createContext<ProgressionContextValue | undefined>(undefined);

export function ProgressionStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isSubscriptionActive } = useBillingState();
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

  const completeLesson = useCallback((lessonId: string) => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  }, []);

  const recordQuestionResult = useCallback((questionType: string, isCorrect: boolean) => {
    setRecentQuestionTypes((prev) => [...prev, questionType].slice(-5));
    setRecentResults((prev) => {
      const next = [...prev, isCorrect].slice(-10);
      const correctCount = next.filter(Boolean).length;
      setRecentAccuracy(correctCount / next.length);
      return next;
    });
    setCurrentStreak((prev) => (isCorrect ? prev + 1 : 0));
  }, []);

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

    const newlyUnlocked = await runBadgeUnlockCheck({
      userId: user.id,
      stats,
      unlockedBadges,
    });
    if (newlyUnlocked.length > 0) {
      setUnlockedBadges((prev) => {
        const next = new Set(prev);
        newlyUnlocked.forEach((badgeId) => next.add(badgeId));
        return next;
      });
    }
    return newlyUnlocked;
  }, [completedLessons.size, friendCount, leaderboardRank, mistakesCleared, streak, unlockedBadges, user, xp]);

  const refs = useProgressionRefs({
    quests,
    questCycleKeys,
    questRotationPrev,
    eventCampaignState,
    personalizationSegment,
    personalizationAssignedAtMs,
    badgeToastQueue,
    streakMilestoneToastQueue,
    comebackRewardToastQueue,
    claimedStreakMilestones,
  });

  useProgressionBadgeEffects({
    badgesHydrated,
    checkAndUnlockBadges,
    completedLessonsSize: completedLessons.size,
    friendCount,
    isStateHydrated,
    leaderboardRank,
    setBadgeToastQueue,
    setBadgesHydrated,
    setUnlockedBadges,
    streak,
    userId: user?.id,
    xp,
  });

  useProgressionHydrationEffect({
    addGems,
    claimBonusGemsByType: QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
    questSchemaVersion: QUEST_SCHEMA_VERSION,
    refs,
    setBadgeToastQueue,
    setClaimedStreakMilestones,
    setComebackRewardOffer,
    setComebackRewardToastQueue,
    setEventCampaignState,
    setFriendCount,
    setIsStateHydrated,
    setLeaderboardRank,
    setPersonalizationAssignedAtMs,
    setPersonalizationSegment,
    setQuestCycleKeys,
    setQuestRotationPrev,
    setQuests,
    setStreak,
    setStreakMilestoneToastQueue,
    setStreakRepairOffer,
    setXP,
    userId: user?.id,
  });

  const reconcileQuestCycles = useCallback(
    (source: "cycle_reconcile" | "schema_migration" = "cycle_reconcile") => {
      reconcileQuestCyclesAction({
        addGems,
        claimBonusGemsByType: QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
        personalizationSegment: refs.personalizationSegmentRef.current,
        questCycleKeysRef: refs.questCycleKeysRef,
        questRotationPrevRef: refs.questRotationPrevRef,
        questsRef: refs.questsRef,
        setQuestCycleKeys,
        setQuestRotationPrev,
        setQuests,
        setXP,
        source,
      });
    },
    [addGems, refs]
  );

  const reconcileEventCampaign = useCallback(() => {
    reconcileEventCampaignAction({
      eventCampaignStateRef: refs.eventCampaignStateRef,
      liveOpsActivationRef: refs.liveOpsActivationRef,
      setEventCampaignState,
    });
  }, [refs]);

  useProgressionPersistenceEffects({
    eventCampaignState,
    personalizationAssignedAtMs,
    personalizationSegment,
    isStateHydrated,
    questCycleKeys,
    questRotationPrev,
    questSchemaVersion: QUEST_SCHEMA_VERSION,
    quests,
    streak,
    streakRepairOffer,
    comebackRewardOffer,
    claimedStreakMilestones,
    userId: user?.id,
    xp,
  });

  useProgressionPeriodicEffects({
    dailyGoalLastReset,
    isStateHydrated,
    reconcileEventCampaign,
    reconcileQuestCycles,
    setComebackRewardOffer,
    setDailyGoalLastReset,
    setDailyXP,
    userId: user?.id,
  });

  useProgressionPersonalizationEffects({
    isStateHydrated,
    lastActivityDate,
    personalizationConfig,
    refs,
    setPersonalizationAssignedAtMs,
    setPersonalizationSegment,
    setQuests,
    streak,
    userId: user?.id,
  });

  const updateStreak = useCallback(() => {
    updateInlineStreakAction({
      freezeCount,
      lastStudyDate,
      setFreezeCountRaw,
      setLastStudyDate,
      setStreak,
      streak,
    });
  }, [freezeCount, lastStudyDate, setFreezeCountRaw, streak]);

  const updateStreakForToday = useCallback(
    async (currentXP?: number) => {
      await updateStreakForTodayEntry({
        addGems,
        claimedStreakMilestonesRef: refs.claimedStreakMilestonesRef,
        comebackRewardEnergy: COMEBACK_REWARD_ENERGY,
        comebackRewardGems: COMEBACK_REWARD_GEMS,
        comebackRewardThresholdDays: COMEBACK_REWARD_THRESHOLD_DAYS,
        currentXp: currentXP ?? xp,
        freezeCount,
        isSubscriptionActive,
        lastActivityDate,
        personalizationConfig,
        personalizationSegment: refs.personalizationSegmentRef.current,
        setClaimedStreakMilestones,
        setComebackRewardOffer,
        setFreezeCountRaw,
        setLastActivityDate,
        setStreak,
        setStreakMilestoneToastQueue,
        setStreakRepairOffer,
        streak,
        streakMilestonesConfig,
        streakRepairCostGems: STREAK_REPAIR_COST_GEMS,
        streakRepairWindowMs: STREAK_REPAIR_WINDOW_MS,
        user,
      });
    },
    [
      addGems,
      freezeCount,
      isSubscriptionActive,
      lastActivityDate,
      refs,
      setFreezeCountRaw,
      streak,
      user,
      xp,
    ]
  );

  const addXp = useCallback(
    async (amount: number) => {
      await addXpAction({
        addGems,
        amount,
        dailyGoal,
        dailyGoalRewardGems: DAILY_GOAL_REWARD_GEMS,
        isDoubleXpActive,
        setDailyXP,
        setXP,
        updateStreak,
        updateStreakForToday,
        userId: user?.id,
        xp,
      });
    },
    [addGems, dailyGoal, isDoubleXpActive, updateStreak, updateStreakForToday, user?.id, xp]
  );

  const updateSkill = useCallback((isCorrect: boolean, itemDifficulty = 1500) => {
    const baseK = 40;
    const minK = 24;
    const kFactor = Math.max(minK, baseK - (questionsAnswered / 100) * (baseK - minK));
    const expectedScore = 1 / (1 + Math.pow(10, (itemDifficulty - skill) / 400));
    const actualScore = isCorrect ? 1 : 0;
    const newSkill = skill + kFactor * (actualScore - expectedScore);
    setSkill(Math.round(newSkill));
    const surprise = Math.abs(actualScore - expectedScore);
    const confidenceChange = surprise > 0.3 ? -5 : 2;
    setSkillConfidence((prev) => Math.max(0, Math.min(100, prev + confidenceChange)));
    setQuestionsAnswered((prev) => prev + 1);
  }, [questionsAnswered, skill]);

  const incrementQuest = useCallback(
    (id: string, step = 1) => {
      incrementQuestAction({
        id,
        reconcileQuestCycles,
        questsRef: refs.questsRef,
        setQuests,
        step,
      });
    },
    [reconcileQuestCycles, refs]
  );

  const incrementQuestMetric = useCallback(
    (metric: QuestMetric, step = 1) => {
      incrementQuestMetricAction({
        addGems,
        eventCampaignStateRef: refs.eventCampaignStateRef,
        questMetric: metric,
        reconcileQuestCycles,
        setBadgeToastQueue,
        setEventCampaignState,
        setQuests,
        setUnlockedBadges,
        step,
        userId: user?.id,
        questsRef: refs.questsRef,
      });
    },
    [addGems, reconcileQuestCycles, refs, user?.id]
  );

  const claimQuest = useCallback(
    (id: string) => {
      claimQuestAction({
        addGems,
        addXp,
        claimBonusGemsByType: QUEST_CLAIM_BONUS_GEMS_BY_TYPE,
        id,
        reconcileQuestCycles,
        questsRef: refs.questsRef,
        setQuests,
      });
    },
    [addGems, addXp, reconcileQuestCycles, refs]
  );

  const rerollQuest = useCallback(
    (questId: string) => {
      return rerollQuestAction({
        dailyQuestRerollCount,
        dailyQuestRerollDate,
        gems,
        questId,
        questRerollCostGems: QUEST_REROLL_COST_GEMS,
        questRerollDailyLimit: QUEST_REROLL_DAILY_LIMIT,
        questRerollEnabled: QUEST_REROLL_CONFIG.enabled,
        questsRef: refs.questsRef,
        setDailyQuestRerollCountRaw,
        setDailyQuestRerollDateRaw,
        setGemsDirectly,
        setQuests,
      });
    },
    [
      dailyQuestRerollCount,
      dailyQuestRerollDate,
      gems,
      refs,
      setDailyQuestRerollCountRaw,
      setDailyQuestRerollDateRaw,
      setGemsDirectly,
    ]
  );

  const consumeNextBadgeToast = useCallback(() => {
    const { nextBadgeId, queue } = consumeNextBadgeToastItem(refs.badgeToastQueueRef.current);
    if (!nextBadgeId) return null;
    refs.badgeToastQueueRef.current = queue;
    setBadgeToastQueue(queue);
    return nextBadgeId;
  }, [refs]);

  const consumeNextStreakMilestoneToast = useCallback(() => {
    const { nextToast, queue } = consumeNextStreakMilestoneToastItem(refs.streakMilestoneToastQueueRef.current);
    if (!nextToast) return null;
    refs.streakMilestoneToastQueueRef.current = queue;
    setStreakMilestoneToastQueue(queue);
    return nextToast;
  }, [refs]);

  const consumeNextComebackRewardToast = useCallback(() => {
    const { nextToast, queue } = consumeNextComebackRewardToastItem(refs.comebackRewardToastQueueRef.current);
    if (!nextToast) return null;
    refs.comebackRewardToastQueueRef.current = queue;
    setComebackRewardToastQueue(queue);
    return nextToast;
  }, [refs]);

  const purchaseStreakRepair = useCallback(() => {
    return purchaseStreakRepairEntry({
      gems,
      offer: streakRepairOffer,
      setGemsDirectly,
      setStreak,
      setStreakRepairOffer,
      streak,
      streakRepairCostGems: STREAK_REPAIR_COST_GEMS,
    });
  }, [gems, setGemsDirectly, streak, streakRepairOffer]);

  const claimComebackRewardOnLessonComplete = useCallback(() => {
    return claimComebackRewardEntry({
      addEnergy,
      addGems,
      comebackRewardOffer,
      enqueueToast: setComebackRewardToastQueue,
      isSubscriptionActive,
      setComebackRewardOffer,
    });
  }, [addEnergy, addGems, comebackRewardOffer, isSubscriptionActive]);

  const setDailyGoal = useCallback((nextXp: number) => {
    setDailyGoalState(nextXp);
  }, []);

  const value = useProgressionValue({
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
    eventCampaignState,
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
  });

  return <ProgressionStateContext.Provider value={value}>{children}</ProgressionStateContext.Provider>;
}

export function useProgressionState() {
  const context = useContext(ProgressionStateContext);
  if (!context) {
    throw new Error("useProgressionState must be used within ProgressionStateProvider");
  }
  return context;
}
