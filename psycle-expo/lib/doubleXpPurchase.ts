export type DoubleXpPurchaseFailureReason = "insufficient_gems" | "already_active";

export type DoubleXpPurchaseResult =
  | { success: true; gemsAfter: number; activeUntilMs: number }
  | { success: false; reason: DoubleXpPurchaseFailureReason };

export function evaluateDoubleXpPurchase(input: {
  gems: number;
  costGems: number;
  isActive: boolean;
  nowMs: number;
  durationMs: number;
}): DoubleXpPurchaseResult {
  if (input.isActive) return { success: false, reason: "already_active" };
  if (input.gems < input.costGems) return { success: false, reason: "insufficient_gems" };

  return {
    success: true,
    gemsAfter: input.gems - input.costGems,
    activeUntilMs: input.nowMs + input.durationMs,
  };
}

