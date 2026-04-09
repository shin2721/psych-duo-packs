jest.mock("../../lib/analytics", () => ({
  __esModule: true,
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/league", () => ({
  __esModule: true,
  addWeeklyXp: jest.fn(),
}));

jest.mock("../../lib/app-state/progression/progressionBadges", () => ({
  __esModule: true,
  awardEventCompletionBadge: jest.fn().mockResolvedValue("inserted"),
}));

jest.mock("../../lib/app-state/progressionRemote", () => ({
  __esModule: true,
  syncStreakAndLeaderboard: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../lib/app-state/progressionLiveOps", () => {
  const actual = jest.requireActual("../../lib/app-state/progressionLiveOps");
  return {
    ...actual,
    getActiveEventCampaignConfig: jest.fn(),
    isTrackedStreakMilestoneDay: jest.fn(() => true),
  };
});

import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../lib/analytics";
import { addWeeklyXp } from "../../lib/league";
import type { EventCampaignState } from "../../lib/eventCampaign";
import type { EventCampaignConfig } from "../../lib/gamificationConfig";
import type { QuestInstance, QuestMetric } from "../../lib/questDefinitions";
import {
  addXpAction,
  claimQuestAction,
  incrementQuestMetricAction,
  rerollQuestAction,
} from "../../lib/app-state/progression/progressionActions";
import { getActiveEventCampaignConfig } from "../../lib/app-state/progressionLiveOps";

const mockTrack = (Analytics as unknown as { track: jest.Mock }).track;
const mockAddWeeklyXp = addWeeklyXp as jest.MockedFunction<typeof addWeeklyXp>;
const mockGetActiveEventCampaignConfig = getActiveEventCampaignConfig as jest.MockedFunction<
  typeof getActiveEventCampaignConfig
>;

function createQuest(overrides: Partial<QuestInstance> = {}): QuestInstance {
  return {
    id: "quest-1",
    templateId: "qd_lessons_2",
    type: "daily",
    metric: "lesson_complete",
    need: 2,
    progress: 0,
    rewardXp: 20,
    claimed: false,
    chestState: "closed",
    title: "Daily Lessons",
    cycleKey: "daily-2026-04-07",
    ...overrides,
  };
}

const TEST_EVENT: EventCampaignConfig = {
  enabled: true,
  id: "spring_challenge_2026",
  start_at: "2026-04-01T00:00:00+09:00",
  end_at: "2026-04-30T23:59:59+09:00",
  title_key: "events.spring2026.title",
  community_target_lessons: 100,
  reward_badge_id: "event_spring_2026",
  quests: [
    {
      template_id: "ev_lessons_1",
      metric: "lesson_complete",
      need: 1,
      reward_gems: 20,
      title_key: "events.spring.quest",
    },
  ],
};

describe("progressionActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("addXpAction preserves daily goal reward, weekly XP add, and streak trigger", async () => {
    let dailyXp = 15;
    const setDailyXP: Dispatch<SetStateAction<number>> = (value) => {
      dailyXp = typeof value === "function" ? value(dailyXp) : value;
    };

    await addXpAction({
      addGems: jest.fn(),
      amount: 10,
      dailyGoal: 20,
      dailyGoalRewardGems: 5,
      isDoubleXpActive: false,
      setDailyXP,
      setXP: jest.fn(),
      updateStreak: jest.fn(),
      updateStreakForToday: jest.fn().mockResolvedValue(undefined),
      userId: "user-1",
      xp: 100,
    });

    expect(mockAddWeeklyXp).toHaveBeenCalledWith("user-1", 10);
    expect(mockTrack).toHaveBeenCalledWith("daily_goal_reached", {
      dailyGoal: 20,
      dailyXp: 25,
      gemsAwarded: 5,
      source: "xp_gain",
    });
    expect(dailyXp).toBe(25);
  });

  test("incrementQuestMetricAction advances both quest and event boards", () => {
    mockGetActiveEventCampaignConfig.mockReturnValue(TEST_EVENT);

    let quests = [createQuest()];
    let eventState: EventCampaignState | null = null;
    const questsRef = { current: quests };
    const eventCampaignStateRef = { current: eventState };

    const setQuests: Dispatch<SetStateAction<QuestInstance[]>> = (value) => {
      quests = typeof value === "function" ? value(quests) : value;
    };
    const setEventCampaignState: Dispatch<SetStateAction<EventCampaignState | null>> = (value) => {
      eventState = typeof value === "function" ? value(eventState) : value;
    };

    incrementQuestMetricAction({
      addGems: jest.fn(),
      eventCampaignStateRef,
      questMetric: "lesson_complete" satisfies QuestMetric,
      reconcileQuestCycles: jest.fn(),
      setBadgeToastQueue: jest.fn(),
      setEventCampaignState,
      setQuests,
      setUnlockedBadges: jest.fn(),
      questsRef,
      userId: undefined,
    });

    expect(questsRef.current[0].progress).toBe(1);
    expect(eventCampaignStateRef.current?.started).toBe(true);
    expect(eventCampaignStateRef.current?.completed).toBe(true);
    expect(eventCampaignStateRef.current?.quests[0].claimed).toBe(true);
    expect(mockTrack).toHaveBeenCalledWith("event_started", {
      eventId: TEST_EVENT.id,
      source: "metric_progress",
    });
    expect(mockTrack).toHaveBeenCalledWith("event_completed", {
      eventId: TEST_EVENT.id,
      rewardBadgeId: TEST_EVENT.reward_badge_id,
      source: "metric_progress",
    });
  });

  test("claimQuestAction keeps xp, gems, and chest-open transition", () => {
    jest.useFakeTimers();

    let quests = [createQuest({ progress: 2 })];
    const questsRef = { current: quests };
    const setQuests: Dispatch<SetStateAction<QuestInstance[]>> = (value) => {
      quests = typeof value === "function" ? value(quests) : value;
    };

    const addXp = jest.fn().mockResolvedValue(undefined);
    const addGems = jest.fn();

    claimQuestAction({
      addGems,
      addXp,
      claimBonusGemsByType: { daily: 5, weekly: 10, monthly: 15 },
      id: "quest-1",
      reconcileQuestCycles: jest.fn(),
      questsRef,
      setQuests,
    });

    expect(addXp).toHaveBeenCalledWith(20);
    expect(addGems).toHaveBeenCalledWith(5);
    expect(questsRef.current[0].chestState).toBe("opening");

    jest.runAllTimers();

    expect(questsRef.current[0].chestState).toBe("opened");
  });

  test("rerollQuestAction preserves gems and reroll counters on success", () => {
    let quests = [createQuest()];
    let gems = 100;
    let rerollDate = "";
    let rerollCount = 0;
    const questsRef = { current: quests };
    const setQuests: Dispatch<SetStateAction<QuestInstance[]>> = (value) => {
      quests = typeof value === "function" ? value(quests) : value;
    };

    const result = rerollQuestAction({
      dailyQuestRerollCount: 0,
      dailyQuestRerollDate: null,
      gems,
      questId: "quest-1",
      questRerollCostGems: 5,
      questRerollDailyLimit: 2,
      questRerollEnabled: true,
      questsRef,
      setDailyQuestRerollCountRaw: (value) => {
        rerollCount = value;
      },
      setDailyQuestRerollDateRaw: (value) => {
        rerollDate = value;
      },
      setGemsDirectly: (value) => {
        gems = value;
      },
      setQuests,
    });

    expect(result).toEqual({ success: true });
    expect(gems).toBe(95);
    expect(rerollCount).toBe(1);
    expect(rerollDate).not.toBe("");
    expect(questsRef.current).toHaveLength(1);
  });
});
