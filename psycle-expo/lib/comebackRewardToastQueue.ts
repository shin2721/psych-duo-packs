export interface ComebackRewardToastItem {
  rewardEnergy: number;
}

export function enqueueComebackRewardToast(
  queue: ComebackRewardToastItem[],
  item: ComebackRewardToastItem
): ComebackRewardToastItem[] {
  return [...queue, item];
}

export function consumeNextComebackRewardToastItem(
  queue: ComebackRewardToastItem[]
): {
  nextToast: ComebackRewardToastItem | null;
  queue: ComebackRewardToastItem[];
} {
  if (queue.length === 0) {
    return {
      nextToast: null,
      queue,
    };
  }

  const [nextToast, ...rest] = queue;
  return {
    nextToast,
    queue: rest,
  };
}
