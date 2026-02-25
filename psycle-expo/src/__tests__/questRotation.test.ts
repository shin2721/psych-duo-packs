import { buildQuestBoardForCycles, reconcileQuestBoardOnCycleChange } from "../../lib/questRotation";
import type { QuestCycleKeys } from "../../lib/questCycles";

const BASE_KEYS: QuestCycleKeys = {
  daily: "2026-03-10",
  weekly: "2026-W11",
  monthly: "2026-03",
};

describe("questRotation", () => {
  test("daily=3件 / weekly=2件 / monthly固定件数で生成される", () => {
    const { quests } = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });

    expect(quests.filter((q) => q.type === "daily")).toHaveLength(3);
    expect(quests.filter((q) => q.type === "weekly")).toHaveLength(2);
    expect(quests.filter((q) => q.type === "monthly")).toHaveLength(5);
  });

  test("同一周期では再生成されない", () => {
    const built = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });

    const reconciled = reconcileQuestBoardOnCycleChange({
      quests: built.quests,
      prevKeys: BASE_KEYS,
      nextKeys: BASE_KEYS,
      previousSelection: built.selection,
      random: () => 0.99,
    });

    expect(reconciled.changedTypes).toEqual([]);
    expect(reconciled.autoClaimed.claimedCount).toBe(0);
    expect(reconciled.quests).toBe(built.quests);
  });

  test("前周期の選択は可能なら除外される", () => {
    const first = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });

    const next = buildQuestBoardForCycles({
      cycleKeys: { ...BASE_KEYS, daily: "2026-03-11", weekly: "2026-W12" },
      previousSelection: first.selection,
      random: () => 0,
    });

    const firstDaily = new Set(first.selection.daily);
    const firstWeekly = new Set(first.selection.weekly);
    const dailyOverlap = next.selection.daily.filter((id) => firstDaily.has(id));
    const weeklyOverlap = next.selection.weekly.filter((id) => firstWeekly.has(id));

    // Daily pool is 5 and we pick 3; at most one overlap is allowed when exclusions are insufficient.
    expect(dailyOverlap.length).toBeLessThanOrEqual(1);
    expect(weeklyOverlap).toHaveLength(0);
  });
});
