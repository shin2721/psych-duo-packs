import type { StreakMilestonesConfig } from "./gamificationConfig";

export interface ClaimableStreakMilestone {
  day: number;
  gems: number;
}

export interface GetClaimableStreakMilestoneArgs {
  newStreak: number;
  claimedMilestones: number[];
  config: StreakMilestonesConfig;
}

export function normalizeClaimedMilestones(input: unknown): number[] {
  if (!Array.isArray(input)) return [];

  const unique = new Set<number>();
  for (const value of input) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const day = Math.floor(value);
    if (day <= 0) continue;
    unique.add(day);
  }

  return Array.from(unique).sort((a, b) => a - b);
}

export function getClaimableStreakMilestone(
  args: GetClaimableStreakMilestoneArgs
): ClaimableStreakMilestone | null {
  const safeStreak = Number.isFinite(args.newStreak)
    ? Math.floor(args.newStreak)
    : 0;
  if (safeStreak <= 0) return null;

  const rewards = Array.isArray(args.config?.rewards) ? args.config.rewards : [];
  const matchedReward = rewards.find(
    (reward) => Number.isFinite(reward.day) && Math.floor(reward.day) === safeStreak
  );
  if (!matchedReward) return null;

  const rewardDay = Math.floor(matchedReward.day);
  const rewardGems = Number.isFinite(matchedReward.gems)
    ? Math.max(0, Math.floor(matchedReward.gems))
    : 0;
  if (rewardGems <= 0) return null;

  const claimed = new Set(normalizeClaimedMilestones(args.claimedMilestones));
  if (args.config?.lifetime_once && claimed.has(rewardDay)) {
    return null;
  }

  return { day: rewardDay, gems: rewardGems };
}
