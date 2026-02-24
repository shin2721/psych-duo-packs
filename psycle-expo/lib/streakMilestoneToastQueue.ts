export interface StreakMilestoneToastItem {
  day: number;
  gems: number;
}

export function enqueueStreakMilestoneToast(
  queue: StreakMilestoneToastItem[],
  item: StreakMilestoneToastItem
): StreakMilestoneToastItem[] {
  return [...queue, item];
}

export function consumeNextStreakMilestoneToastItem(
  queue: StreakMilestoneToastItem[]
): {
  nextToast: StreakMilestoneToastItem | null;
  queue: StreakMilestoneToastItem[];
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
