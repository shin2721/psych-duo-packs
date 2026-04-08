import { Analytics } from "../../analytics";
import {
  isComebackOfferExpired,
  normalizeComebackRewardOffer,
  type ComebackRewardOffer,
} from "../../comebackReward";
import {
  normalizeEventCampaignState,
  reconcileEventStateOnAccess,
  type EventCampaignState,
} from "../../eventCampaign";
import { logDev } from "../../devLog";
import { normalizePersonalizationSegment } from "../../personalization";
import { normalizeClaimedMilestones } from "../../streakMilestones";
import {
  isStreakRepairOfferActive,
  type StreakRepairOffer,
} from "../../streakRepair";
import type { PersonalizationSegment } from "../../gamificationConfig";
import type { QuestCycleKeys } from "../../questCycles";
import type { QuestInstance } from "../../questDefinitions";
import {
  buildQuestBoardForCycles,
  extractSelectionFromQuests,
  normalizeQuestRotationSelection,
  type QuestRotationSelection,
} from "../../questRotation";
import { getQuestCycleKeys } from "../../questCycles";
import { getUserStorageKey, loadUserEntries, parseStoredInt, persistNumber } from "../persistence";
import {
  adjustQuestNeedsBySegment,
  createInitialQuestState,
  migrateMonthlyQuests,
  normalizeStoredQuestInstances,
  reconcileQuestCyclesState,
} from "../progressionQuests";
import { getActiveEventCampaignConfig } from "../progressionLiveOps";
import { loadRemoteProgressionSnapshot } from "../progressionRemote";

export interface SignedOutProgressionReset {
  quests: QuestInstance[];
  questCycleKeys: QuestCycleKeys;
  questRotationPrev: QuestRotationSelection;
  eventCampaignState: EventCampaignState | null;
  personalizationSegment: PersonalizationSegment;
  personalizationAssignedAtMs: number | null;
  badgeToastQueue: string[];
  streakMilestoneToastQueue: [];
  comebackRewardToastQueue: [];
  claimedStreakMilestones: number[];
  xp: number;
  streak: number;
  friendCount: number;
  leaderboardRank: number;
  streakRepairOffer: StreakRepairOffer | null;
  comebackRewardOffer: ComebackRewardOffer | null;
}

export interface ProgressionHydrationResult {
  savedXp: number | null;
  savedStreak: number | null;
  quests: QuestInstance[];
  questCycleKeys: QuestCycleKeys;
  questRotationPrev: QuestRotationSelection;
  eventCampaignState: EventCampaignState | null;
  personalizationSegment: PersonalizationSegment;
  personalizationAssignedAtMs: number | null;
  claimedStreakMilestones: number[];
  streakRepairOffer: StreakRepairOffer | null;
  comebackRewardOffer: ComebackRewardOffer | null;
  expiredStreakRepairOffer: StreakRepairOffer | null;
  expiredComebackRewardOffer: ComebackRewardOffer | null;
  pendingAutoClaimXp: number;
  pendingAutoClaimGems: number;
  remoteSnapshot: {
    xp: number | null;
    streak: number | null;
    friendCount: number;
    leaderboardRank: number;
  } | null;
}

export function buildSignedOutProgressionReset(): SignedOutProgressionReset {
  const resetCycleKeys = getQuestCycleKeys();
  const resetQuestState = createInitialQuestState(resetCycleKeys);
  return {
    quests: resetQuestState.quests,
    questCycleKeys: resetCycleKeys,
    questRotationPrev: resetQuestState.rotationSelection,
    eventCampaignState: null,
    personalizationSegment: "new",
    personalizationAssignedAtMs: null,
    badgeToastQueue: [],
    streakMilestoneToastQueue: [],
    comebackRewardToastQueue: [],
    claimedStreakMilestones: [],
    xp: 0,
    streak: 0,
    friendCount: 0,
    leaderboardRank: 0,
    streakRepairOffer: null,
    comebackRewardOffer: null,
  };
}

export async function hydrateProgressionState(args: {
  userId: string;
  questSchemaVersion: number;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}): Promise<ProgressionHydrationResult> {
  const saved = await loadUserEntries(args.userId, [
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

  const savedXp = parseStoredInt(saved.xp);
  const savedStreak = parseStoredInt(saved.streak);

  const initialSegment = normalizePersonalizationSegment(saved.personalizationSegment);
  const parsedAssignedAt = parseStoredInt(saved.personalizationSegmentAssignedAt);
  const initialAssignedAt = parsedAssignedAt !== null ? parsedAssignedAt : null;

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

  if (questSchemaVersion < args.questSchemaVersion) {
    const claimableOnMigration = loadedQuests.filter((quest) => quest.progress >= quest.need && !quest.claimed);
    if (claimableOnMigration.length > 0) {
      pendingAutoClaimXp += claimableOnMigration.reduce((sum, quest) => sum + quest.rewardXp, 0);
      pendingAutoClaimGems += claimableOnMigration.reduce(
        (sum, quest) => sum + (args.claimBonusGemsByType[quest.type] ?? 0),
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
    const reconcileResult = reconcileQuestCyclesState({
      quests: loadedQuests,
      prevKeys: loadedQuestCycleKeys,
      nextKeys: nowQuestCycleKeys,
      previousSelection: loadedRotationSelection,
      claimBonusGemsByType: args.claimBonusGemsByType,
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

  const adjustedLoadedQuests = adjustQuestNeedsBySegment(loadedQuests, initialSegment);
  await persistNumber(getUserStorageKey("questSchemaVersion", args.userId), args.questSchemaVersion);

  let streakRepairOffer: StreakRepairOffer | null = null;
  let expiredStreakRepairOffer: StreakRepairOffer | null = null;
  if (saved.streakRepairOffer) {
    try {
      const parsedOffer = JSON.parse(saved.streakRepairOffer);
      if (isStreakRepairOfferActive(parsedOffer)) {
        streakRepairOffer = parsedOffer;
      } else {
        expiredStreakRepairOffer =
          parsedOffer?.active && typeof parsedOffer.expiresAtMs === "number" ? parsedOffer : null;
        streakRepairOffer = null;
      }
    } catch {
      streakRepairOffer = null;
    }
  }

  let comebackRewardOffer: ComebackRewardOffer | null = null;
  let expiredComebackRewardOffer: ComebackRewardOffer | null = null;
  if (saved.comebackRewardOffer) {
    try {
      const parsedOffer = normalizeComebackRewardOffer(JSON.parse(saved.comebackRewardOffer));
      if (parsedOffer && !isComebackOfferExpired(parsedOffer)) {
        comebackRewardOffer = parsedOffer;
      } else {
        expiredComebackRewardOffer = parsedOffer?.active ? parsedOffer : null;
        comebackRewardOffer = null;
      }
    } catch {
      comebackRewardOffer = null;
    }
  }

  let claimedStreakMilestones: number[] = [];
  if (saved.streakMilestonesClaimed) {
    try {
      claimedStreakMilestones = normalizeClaimedMilestones(JSON.parse(saved.streakMilestonesClaimed));
    } catch {
      claimedStreakMilestones = [];
    }
  }

  const activeEventConfig = getActiveEventCampaignConfig();
  let eventCampaignState: EventCampaignState | null = null;
  if (activeEventConfig) {
    let nextEventCampaignState: EventCampaignState | null = null;
    if (saved.eventCampaignState) {
      try {
        nextEventCampaignState = normalizeEventCampaignState(JSON.parse(saved.eventCampaignState));
      } catch {
        nextEventCampaignState = null;
      }
    }
    eventCampaignState = reconcileEventStateOnAccess(nextEventCampaignState, activeEventConfig, new Date());
  }

  let remoteSnapshot: ProgressionHydrationResult["remoteSnapshot"] = null;
  try {
    remoteSnapshot = await loadRemoteProgressionSnapshot(args.userId, savedXp ?? 0);
  } catch (error) {
    logDev("Progression Supabase sync failed (using local data):", error);
  }

  return {
    savedXp,
    savedStreak,
    quests: adjustedLoadedQuests,
    questCycleKeys: nowQuestCycleKeys,
    questRotationPrev: loadedRotationSelection,
    eventCampaignState,
    personalizationSegment: initialSegment,
    personalizationAssignedAtMs: initialAssignedAt,
    claimedStreakMilestones,
    streakRepairOffer,
    comebackRewardOffer,
    expiredStreakRepairOffer,
    expiredComebackRewardOffer,
    pendingAutoClaimXp,
    pendingAutoClaimGems,
    remoteSnapshot,
  };
}
