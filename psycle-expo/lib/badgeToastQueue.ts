export function enqueueBadgeToastIds(queue: string[], badgeIds: string[]): string[] {
  if (badgeIds.length === 0) return queue;

  const nextQueue = [...queue];
  for (const badgeId of badgeIds) {
    if (!badgeId) continue;
    nextQueue.push(badgeId);
  }
  return nextQueue;
}

export function consumeNextBadgeToastItem(queue: string[]): {
  nextBadgeId: string | null;
  queue: string[];
} {
  if (queue.length === 0) {
    return {
      nextBadgeId: null,
      queue,
    };
  }

  const [nextBadgeId, ...rest] = queue;
  return {
    nextBadgeId,
    queue: rest,
  };
}
