import { BADGES, type BadgeStats } from "../../badges";
import { insertUserBadge, loadRemoteBadgeIds } from "../progressionRemote";

export async function hydrateRemoteBadgeIds(userId: string): Promise<string[]> {
  return loadRemoteBadgeIds(userId);
}

export async function checkAndUnlockBadges(args: {
  userId: string | null | undefined;
  stats: BadgeStats;
  unlockedBadges: Set<string>;
}): Promise<string[]> {
  if (!args.userId) return [];

  const newlyUnlocked: string[] = [];
  for (const badge of BADGES) {
    if (args.unlockedBadges.has(badge.id)) continue;
    if (!badge.unlockCondition(args.stats)) continue;

    try {
      await insertUserBadge(args.userId, badge.id);
      newlyUnlocked.push(badge.id);
    } catch {
      // Provider keeps existing error policy and state updates.
    }
  }

  return newlyUnlocked;
}

export async function awardEventCompletionBadge(
  userId: string | null | undefined,
  badgeId: string
): Promise<"inserted" | "duplicate" | "skipped"> {
  if (!userId) return "skipped";
  return insertUserBadge(userId, badgeId);
}
