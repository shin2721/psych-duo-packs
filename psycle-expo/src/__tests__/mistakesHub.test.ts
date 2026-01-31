// src/__tests__/mistakesHub.test.ts
import {
  selectMistakesHubItems,
  calculateItemScore,
  filterRecentEvents,
} from "../features/mistakesHub";

describe("mistakesHub", () => {
  const now = new Date("2026-01-01T00:00:00Z").getTime();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;

  beforeAll(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterAll(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  describe("selectMistakesHubItems", () => {
    test("過去30日以内のイベントのみ対象", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["results"],
        },
        {
          userId: "user1",
          itemId: "item2",
          ts: thirtyOneDaysAgo, // 31日前 - 除外される
          result: "incorrect" as const,
          tags: ["methods"],
        },
      ];

      const selected = selectMistakesHubItems(events);
      expect(selected).toContain("item1");
      expect(selected).not.toContain("item2");
    });

    test("誤答した問題が優先される", () => {
      const events = [
        {
          userId: "user1",
          itemId: "correct_item",
          ts: oneDayAgo,
          result: "correct" as const,
          tags: ["results"],
        },
        {
          userId: "user1",
          itemId: "incorrect_item",
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["methods"],
        },
      ];

      const selected = selectMistakesHubItems(events);
      expect(selected[0]).toBe("incorrect_item"); // 誤答が優先
    });

    test("最大10問まで選定", () => {
      const events = Array.from({ length: 20 }, (_, i) => ({
        userId: "user1",
        itemId: `item${i}`,
        ts: oneDayAgo,
        result: "incorrect" as const,
        tags: ["results"],
      }));

      const selected = selectMistakesHubItems(events);
      expect(selected.length).toBeLessThanOrEqual(10);
    });

    test("タグ配分が考慮される", () => {
      const events = [
        // results タグ（目標3問）
        ...Array.from({ length: 5 }, (_, i) => ({
          userId: "user1",
          itemId: `results_${i}`,
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["results"],
        })),
        // methods タグ（目標3問）
        ...Array.from({ length: 5 }, (_, i) => ({
          userId: "user1",
          itemId: `methods_${i}`,
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["methods"],
        })),
        // background タグ（目標2問）
        ...Array.from({ length: 5 }, (_, i) => ({
          userId: "user1",
          itemId: `background_${i}`,
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["background"],
        })),
        // discussion タグ（目標2問）
        ...Array.from({ length: 5 }, (_, i) => ({
          userId: "user1",
          itemId: `discussion_${i}`,
          ts: oneDayAgo,
          result: "incorrect" as const,
          tags: ["discussion"],
        })),
      ];

      const selected = selectMistakesHubItems(events);

      // タグ別カウント
      const resultsCount = selected.filter(id => id.startsWith("results_")).length;
      const methodsCount = selected.filter(id => id.startsWith("methods_")).length;
      const backgroundCount = selected.filter(id => id.startsWith("background_")).length;
      const discussionCount = selected.filter(id => id.startsWith("discussion_")).length;

      // 配分目標に近い（完全一致は保証しないが、バランスは取れる）
      expect(resultsCount).toBeGreaterThan(0);
      expect(methodsCount).toBeGreaterThan(0);
      expect(backgroundCount).toBeGreaterThan(0);
      expect(discussionCount).toBeGreaterThan(0);
    });

    test("長考した問題が含まれる", () => {
      const events = [
        {
          userId: "user1",
          itemId: "quick_answer",
          ts: oneDayAgo,
          result: "correct" as const,
          latencyMs: 10000, // 10秒
          tags: ["results"],
        },
        {
          userId: "user1",
          itemId: "long_think",
          ts: oneDayAgo,
          result: "correct" as const,
          latencyMs: 30000, // 30秒（長考）
          tags: ["methods"],
        },
      ];

      const selected = selectMistakesHubItems(events);
      expect(selected).toContain("long_think");
    });

    test("期限超過した問題が含まれる", () => {
      const dueAt = now - 2 * 24 * 60 * 60 * 1000; // 2日前が期限
      const events = [
        {
          userId: "user1",
          itemId: "overdue_item",
          ts: oneDayAgo, // 1日前に回答（1日遅れ）
          result: "correct" as const,
          dueAt,
          tags: ["results"],
        },
      ];

      const selected = selectMistakesHubItems(events);
      expect(selected).toContain("overdue_item");
    });
  });

  describe("calculateItemScore", () => {
    test("誤答は+3点", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: oneDayAgo,
          result: "incorrect" as const,
        },
      ];

      const score = calculateItemScore(events);
      expect(score).toBeGreaterThan(3); // 3点 + 直近度ボーナス
    });

    test("長考は+2点", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: oneDayAgo,
          result: "correct" as const,
          latencyMs: 30000, // 30秒
        },
      ];

      const score = calculateItemScore(events);
      expect(score).toBeGreaterThan(2); // 2点 + 直近度ボーナス
    });

    test("複数イベントでスコア累積", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: oneDayAgo,
          result: "incorrect" as const,
        },
        {
          userId: "user1",
          itemId: "item1",
          ts: twoDaysAgo,
          result: "incorrect" as const,
        },
      ];

      const score = calculateItemScore(events);
      expect(score).toBeGreaterThan(6); // 3 + 3 + ボーナス
    });
  });

  describe("filterRecentEvents", () => {
    test("指定日数以内のイベントのみ返す", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: oneDayAgo,
          result: "incorrect" as const,
        },
        {
          userId: "user1",
          itemId: "item2",
          ts: thirtyOneDaysAgo,
          result: "incorrect" as const,
        },
      ];

      const recent = filterRecentEvents(events, 30);
      expect(recent.length).toBe(1);
      expect(recent[0].itemId).toBe("item1");
    });

    test("デフォルトは30日", () => {
      const events = [
        {
          userId: "user1",
          itemId: "item1",
          ts: thirtyDaysAgo,
          result: "incorrect" as const,
        },
        {
          userId: "user1",
          itemId: "item2",
          ts: thirtyOneDaysAgo,
          result: "incorrect" as const,
        },
      ];

      const recent = filterRecentEvents(events);
      expect(recent.length).toBe(1);
      expect(recent[0].itemId).toBe("item1");
    });
  });
});
