import {
  getQuestCycleKeys,
  resetQuestsByCycleChange,
  type QuestCycleKeys,
} from "../../lib/questCycles";

type TestQuest = {
  id: string;
  type: "daily" | "weekly" | "monthly";
  progress: number;
  claimed: boolean;
  chestState: "closed" | "opening" | "opened";
};

const BASE_QUESTS: TestQuest[] = [
  { id: "d", type: "daily", progress: 2, claimed: true, chestState: "opened" },
  { id: "w", type: "weekly", progress: 4, claimed: true, chestState: "opened" },
  { id: "m", type: "monthly", progress: 7, claimed: true, chestState: "opened" },
];

function cycleKeys(daily: string, weekly: string, monthly: string): QuestCycleKeys {
  return { daily, weekly, monthly };
}

describe("questCycles", () => {
  test("ローカル時刻ベースで daily/weekly/monthly キーを生成する", () => {
    const keys = getQuestCycleKeys(new Date("2026-03-01T10:30:00"));
    expect(keys.daily).toBe("2026-03-01");
    expect(keys.monthly).toBe("2026-03");
    expect(keys.weekly).toMatch(/^2026-W\d{2}$/);
  });

  test("daily 変更時は daily quest のみリセットされる", () => {
    const { quests, resetTypes } = resetQuestsByCycleChange(
      BASE_QUESTS,
      cycleKeys("2026-03-01", "2026-W09", "2026-03"),
      cycleKeys("2026-03-02", "2026-W09", "2026-03")
    );
    expect(resetTypes).toEqual(["daily"]);
    expect(quests.find((q) => q.id === "d")).toMatchObject({ progress: 0, claimed: false, chestState: "closed" });
    expect(quests.find((q) => q.id === "w")).toMatchObject({ progress: 4, claimed: true, chestState: "opened" });
    expect(quests.find((q) => q.id === "m")).toMatchObject({ progress: 7, claimed: true, chestState: "opened" });
  });

  test("週跨ぎ時は weekly quest のみリセットされる", () => {
    const { quests, resetTypes } = resetQuestsByCycleChange(
      BASE_QUESTS,
      cycleKeys("2026-03-02", "2026-W10", "2026-03"),
      cycleKeys("2026-03-03", "2026-W11", "2026-03")
    );
    expect(resetTypes).toEqual(["daily", "weekly"]);
    expect(quests.find((q) => q.id === "w")).toMatchObject({ progress: 0, claimed: false, chestState: "closed" });
  });

  test("月跨ぎ時は monthly quest がリセットされる", () => {
    const { quests, resetTypes } = resetQuestsByCycleChange(
      BASE_QUESTS,
      cycleKeys("2026-03-31", "2026-W14", "2026-03"),
      cycleKeys("2026-04-01", "2026-W14", "2026-04")
    );
    expect(resetTypes).toEqual(["daily", "monthly"]);
    expect(quests.find((q) => q.id === "m")).toMatchObject({ progress: 0, claimed: false, chestState: "closed" });
  });
});
