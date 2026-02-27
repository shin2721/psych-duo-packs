import {
  consumeNextComebackRewardToastItem,
  enqueueComebackRewardToast,
} from "../../lib/comebackRewardToastQueue";

describe("comeback reward toast queue", () => {
  test("enqueue then consume follows FIFO order", () => {
    const queue = enqueueComebackRewardToast(
      enqueueComebackRewardToast([], { rewardEnergy: 2, rewardGems: 10 }),
      { rewardEnergy: 3, rewardGems: 0 }
    );

    const first = consumeNextComebackRewardToastItem(queue);
    expect(first.nextToast).toEqual({ rewardEnergy: 2, rewardGems: 10 });

    const second = consumeNextComebackRewardToastItem(first.queue);
    expect(second.nextToast).toEqual({ rewardEnergy: 3, rewardGems: 0 });

    const third = consumeNextComebackRewardToastItem(second.queue);
    expect(third.nextToast).toBeNull();
  });
});
