import React from "react";

import type { LeagueResult } from "../../lib/leagueReward";
import { LeagueResultModal } from "../LeagueResultModal";

export function CourseLeagueResultGate({
  result,
  visible,
  onClaim,
  onDismiss,
}: {
  result: LeagueResult | null;
  visible: boolean;
  onClaim: (claimedGems: number, claimedBadges: string[], newBalance?: number) => void;
  onDismiss: () => void;
}) {
  if (!result) return null;

  return (
    <LeagueResultModal
      visible={visible}
      result={result}
      onClaim={onClaim}
      onDismiss={onDismiss}
    />
  );
}
