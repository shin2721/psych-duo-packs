import { createComebackRewardOffer } from "../../lib/comebackReward";
import { createStreakRepairOffer } from "../../lib/streakRepair";
import { getQuestCycleKeys } from "../../lib/questCycles";
import { createInitialQuestState } from "../../lib/app-state/progressionQuests";

function loadHydrationModule(options?: {
  saved?: Record<string, string | null | undefined>;
  remoteSnapshot?: {
    xp: number | null;
    streak: number | null;
    friendCount: number;
    leaderboardRank: number;
  };
  activeEventConfig?: Record<string, unknown> | null;
}) {
  jest.resetModules();
  const loadUserEntries = jest.fn().mockResolvedValue(options?.saved ?? {});
  const parseStoredInt = jest.fn((value?: string | null) => {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const persistNumber = jest.fn().mockResolvedValue(undefined);
  const loadRemoteProgressionSnapshot = jest
    .fn()
    .mockResolvedValue(
      options?.remoteSnapshot ?? { xp: null, streak: null, friendCount: 0, leaderboardRank: 0 }
    );
  const getActiveEventCampaignConfig = jest.fn().mockReturnValue(options?.activeEventConfig ?? null);
  const track = jest.fn();

  let module: typeof import("../../lib/app-state/progression/progressionHydration");
  jest.doMock("../../lib/app-state/persistence", () => ({
    getUserStorageKey: jest.requireActual("../../lib/app-state/persistence").getUserStorageKey,
    loadUserEntries,
    parseStoredInt,
    persistNumber,
  }));
  jest.doMock("../../lib/app-state/progressionRemote", () => ({
    loadRemoteProgressionSnapshot,
  }));
  jest.doMock("../../lib/app-state/progressionLiveOps", () => ({
    getActiveEventCampaignConfig,
  }));
  jest.doMock("../../lib/analytics", () => ({
    Analytics: {
      track,
    },
  }));

  jest.isolateModules(() => {
    module = require("../../lib/app-state/progression/progressionHydration");
  });

  return {
    module: module!,
    loadUserEntries,
    persistNumber,
    loadRemoteProgressionSnapshot,
    getActiveEventCampaignConfig,
    track,
  };
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock("../../lib/app-state/persistence");
  jest.dontMock("../../lib/app-state/progressionRemote");
  jest.dontMock("../../lib/app-state/progressionLiveOps");
  jest.dontMock("../../lib/analytics");
});

describe("progressionHydration", () => {
  test("buildSignedOutProgressionReset returns empty signed-out defaults", () => {
    const { module } = loadHydrationModule();
    const result = module.buildSignedOutProgressionReset();

    expect(result.xp).toBe(0);
    expect(result.streak).toBe(0);
    expect(result.personalizationSegment).toBe("new");
    expect(result.quests).toHaveLength(createInitialQuestState(getQuestCycleKeys()).quests.length);
  });

  test("hydrateProgressionState restores local state and merges remote snapshot", async () => {
    const cycleKeys = getQuestCycleKeys();
    const questState = createInitialQuestState(cycleKeys);
    const activeEventConfig = {
      enabled: true,
      id: "event-1",
      start_at: "2026-04-01T00:00:00+09:00",
      end_at: "2026-04-30T23:59:59+09:00",
      title_key: "events.test.title",
      community_target_lessons: 10,
      reward_badge_id: "event_spring_2026",
      quests: [
        {
          template_id: "ev_lessons_1",
          metric: "lesson_complete",
          need: 1,
          reward_gems: 10,
          title_key: "events.test.quest",
        },
      ],
    };
    const streakRepairOffer = createStreakRepairOffer(7, Date.now(), { windowMs: 60_000 });
    const comebackRewardOffer = createComebackRewardOffer({
      daysSinceStudy: 8,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now: new Date(),
    });

    const { module, persistNumber } = loadHydrationModule({
      saved: {
        xp: "12",
        streak: "5",
        quests: JSON.stringify(questState.quests),
        questCycleKeys: JSON.stringify(cycleKeys),
        questSchemaVersion: "2",
        questRotationPrev: JSON.stringify(questState.rotationSelection),
        streakRepairOffer: JSON.stringify(streakRepairOffer),
        comebackRewardOffer: JSON.stringify(comebackRewardOffer),
        streakMilestonesClaimed: JSON.stringify([3, 7]),
        eventCampaignState: JSON.stringify({
          eventId: "event-1",
          started: true,
          completed: false,
          quests: [
            {
              id: "event-1__ev_lessons_1",
              templateId: "ev_lessons_1",
              metric: "lesson_complete",
              need: 1,
              progress: 0,
              rewardGems: 10,
              claimed: false,
              titleKey: "events.test.quest",
            },
          ],
        }),
        personalizationSegment: "power",
        personalizationSegmentAssignedAt: "123456",
      },
      remoteSnapshot: {
        xp: 50,
        streak: 6,
        friendCount: 4,
        leaderboardRank: 9,
      },
      activeEventConfig,
    });

    const result = await module.hydrateProgressionState({
      userId: "user-1",
      questSchemaVersion: 2,
      claimBonusGemsByType: { daily: 5, weekly: 10, monthly: 15 },
    });

    expect(result.savedXp).toBe(12);
    expect(result.savedStreak).toBe(5);
    expect(result.personalizationSegment).toBe("power");
    expect(result.personalizationAssignedAtMs).toBe(123456);
    expect(result.claimedStreakMilestones).toEqual([3, 7]);
    expect(result.streakRepairOffer).not.toBeNull();
    expect(result.comebackRewardOffer).not.toBeNull();
    expect(result.eventCampaignState?.eventId).toBe("event-1");
    expect(result.remoteSnapshot).toEqual({
      xp: 50,
      streak: 6,
      friendCount: 4,
      leaderboardRank: 9,
    });
    expect(persistNumber).toHaveBeenCalled();
  });
});
