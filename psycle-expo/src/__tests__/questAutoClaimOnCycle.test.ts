import { reconcileQuestBoardOnCycleChange } from "../../lib/questRotation";
import type { QuestCycleKeys } from "../../lib/questCycles";
import type { QuestInstance } from "../../lib/questDefinitions";

const PREV_KEYS: QuestCycleKeys = {
  daily: "2026-03-10",
  weekly: "2026-W11",
  monthly: "2026-03",
};

const NEXT_KEYS_DAILY_CHANGED: QuestCycleKeys = {
  daily: "2026-03-11",
  weekly: "2026-W11",
  monthly: "2026-03",
};

function createQuest(overrides: Partial<QuestInstance>): QuestInstance {
  return {
    id: "q",
    templateId: "q",
    type: "daily",
    metric: "lesson_complete",
    need: 3,
    progress: 0,
    rewardXp: 30,
    claimed: false,
    chestState: "closed",
    title: "quest",
    cycleKey: PREV_KEYS.daily,
    ...overrides,
  };
}

describe("quest auto claim on cycle change", () => {
  test("周期変更タイプの達成済み未受取だけ自動受取する", () => {
    const quests: QuestInstance[] = [
      createQuest({
        id: "daily_done",
        templateId: "qd_lessons_3",
        type: "daily",
        metric: "lesson_complete",
        progress: 3,
        need: 3,
        rewardXp: 30,
      }),
      createQuest({
        id: "daily_not_done",
        templateId: "qd_lessons_5",
        type: "daily",
        metric: "lesson_complete",
        progress: 2,
        need: 5,
        rewardXp: 45,
      }),
      createQuest({
        id: "weekly_done",
        templateId: "qw_lessons_10",
        type: "weekly",
        metric: "lesson_complete",
        cycleKey: PREV_KEYS.weekly,
        progress: 10,
        need: 10,
        rewardXp: 100,
      }),
    ];

    const result = reconcileQuestBoardOnCycleChange({
      quests,
      prevKeys: PREV_KEYS,
      nextKeys: NEXT_KEYS_DAILY_CHANGED,
      claimBonusGemsByType: {
        daily: 5,
        weekly: 10,
        monthly: 15,
      },
      previousSelection: {
        daily: ["qd_lessons_3", "qd_lessons_5", "qd_streak5_1"],
        weekly: ["qw_lessons_10", "qw_streak5_5"],
      },
      random: () => 0,
    });

    expect(result.changedTypes).toEqual(["daily"]);
    expect(result.autoClaimed).toEqual({
      claimedCount: 1,
      totalRewardXp: 30,
      totalRewardGems: 5,
    });
    expect(result.quests.filter((q) => q.type === "daily")).toHaveLength(3);
    expect(result.quests.filter((q) => q.type === "daily").every((q) => q.cycleKey === NEXT_KEYS_DAILY_CHANGED.daily)).toBe(true);
    expect(result.quests.filter((q) => q.type === "weekly")).toHaveLength(1);
    expect(result.quests.find((q) => q.id === "weekly_done")?.progress).toBe(10);
  });

  test("未達成クエストは自動受取されない", () => {
    const quests: QuestInstance[] = [
      createQuest({
        id: "daily_not_done",
        templateId: "qd_lessons_2",
        progress: 1,
        need: 2,
        rewardXp: 20,
      }),
    ];

    const result = reconcileQuestBoardOnCycleChange({
      quests,
      prevKeys: PREV_KEYS,
      nextKeys: NEXT_KEYS_DAILY_CHANGED,
      previousSelection: { daily: ["qd_lessons_2"], weekly: [] },
      random: () => 0,
    });

    expect(result.autoClaimed.claimedCount).toBe(0);
    expect(result.autoClaimed.totalRewardXp).toBe(0);
    expect(result.autoClaimed.totalRewardGems).toBe(0);
  });
});
