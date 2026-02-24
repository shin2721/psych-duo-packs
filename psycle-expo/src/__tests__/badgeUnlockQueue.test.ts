import { consumeNextBadgeToastItem, enqueueBadgeToastIds } from "../../lib/badgeToastQueue";

describe("badge toast queue", () => {
  test("新規解除IDが順序どおりキューに積まれる", () => {
    const next = enqueueBadgeToastIds(["first_lesson"], ["level_5", "level_10"]);
    expect(next).toEqual(["first_lesson", "level_5", "level_10"]);
  });

  test("consume は FIFO で先頭から取り出す", () => {
    const first = consumeNextBadgeToastItem(["first_lesson", "level_5"]);
    expect(first.nextBadgeId).toBe("first_lesson");
    expect(first.queue).toEqual(["level_5"]);

    const second = consumeNextBadgeToastItem(first.queue);
    expect(second.nextBadgeId).toBe("level_5");
    expect(second.queue).toEqual([]);
  });

  test("空キューでは null を返す", () => {
    const result = consumeNextBadgeToastItem([]);
    expect(result.nextBadgeId).toBeNull();
    expect(result.queue).toEqual([]);
  });
});
