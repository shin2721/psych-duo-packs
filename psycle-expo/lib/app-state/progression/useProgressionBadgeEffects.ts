import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { enqueueBadgeToastIds } from "../../badgeToastQueue";
import { warnDev } from "../../devLog";
import { hydrateRemoteBadgeIds } from "./progressionBadges";

export function useProgressionBadgeEffects(args: {
  badgesHydrated: boolean;
  checkAndUnlockBadges: () => Promise<string[]>;
  completedLessonsSize: number;
  friendCount: number;
  isStateHydrated: boolean;
  leaderboardRank: number;
  setBadgeToastQueue: Dispatch<SetStateAction<string[]>>;
  setBadgesHydrated: Dispatch<SetStateAction<boolean>>;
  setUnlockedBadges: Dispatch<SetStateAction<Set<string>>>;
  streak: number;
  userId?: string | null;
  xp: number;
}): void {
  const badgeCheckInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!args.userId) {
      args.setUnlockedBadges(new Set());
      args.setBadgesHydrated(true);
      return;
    }

    args.setBadgesHydrated(false);
    hydrateRemoteBadgeIds(args.userId)
      .then((badgeIds) => {
        if (cancelled) return;
        args.setUnlockedBadges(new Set(badgeIds));
      })
      .catch((error: unknown) => {
        if (!cancelled) warnDev("Failed to load user badges:", error);
      })
      .finally(() => {
        if (!cancelled) args.setBadgesHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [args.setBadgesHydrated, args.setUnlockedBadges, args.userId]);

  useEffect(() => {
    if (!args.userId || !args.isStateHydrated || !args.badgesHydrated) return;
    const timer = setTimeout(async () => {
      if (badgeCheckInFlightRef.current) return;
      badgeCheckInFlightRef.current = true;
      try {
        const newlyUnlocked = await args.checkAndUnlockBadges();
        if (newlyUnlocked.length > 0) {
          args.setBadgeToastQueue((prev) => enqueueBadgeToastIds(prev, newlyUnlocked));
          newlyUnlocked.forEach((badgeId) => {
            Analytics.track("badge_unlocked", { badgeId, source: "auto_check" });
          });
        }
      } finally {
        badgeCheckInFlightRef.current = false;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    args.badgesHydrated,
    args.checkAndUnlockBadges,
    args.completedLessonsSize,
    args.friendCount,
    args.isStateHydrated,
    args.leaderboardRank,
    args.setBadgeToastQueue,
    args.streak,
    args.userId,
    args.xp,
  ]);
}
