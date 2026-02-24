import {
  consumeNextStreakMilestoneToastItem,
  enqueueStreakMilestoneToast,
} from "../../lib/streakMilestoneToastQueue";

describe("streak milestone toast queue", () => {
  test("enqueue then consume follows FIFO order", () => {
    const queue = enqueueStreakMilestoneToast(
      enqueueStreakMilestoneToast([], { day: 3, gems: 5 }),
      { day: 7, gems: 10 }
    );

    const first = consumeNextStreakMilestoneToastItem(queue);
    expect(first.nextToast).toEqual({ day: 3, gems: 5 });

    const second = consumeNextStreakMilestoneToastItem(first.queue);
    expect(second.nextToast).toEqual({ day: 7, gems: 10 });

    const third = consumeNextStreakMilestoneToastItem(second.queue);
    expect(third.nextToast).toBeNull();
  });
});
