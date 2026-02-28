export const STREAK_REPAIR_COST_GEMS = 50;
export const STREAK_REPAIR_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface StreakRepairOfferOptions {
  costGems?: number;
  windowMs?: number;
}

export interface StreakRepairOffer {
  previousStreak: number;
  costGems: number;
  expiresAtMs: number;
  active: boolean;
}

export type StreakRepairFailureReason = "no_offer" | "expired" | "insufficient_gems";

export interface StreakRepairPurchaseResult {
  success: boolean;
  reason?: StreakRepairFailureReason;
  nextOffer: StreakRepairOffer | null;
  nextGems: number;
  restoredStreak: number;
}

export function createStreakRepairOffer(
  previousStreak: number,
  nowMs: number = Date.now(),
  options?: StreakRepairOfferOptions
): StreakRepairOffer | null {
  if (!Number.isFinite(previousStreak) || previousStreak <= 1) return null;
  const costGems =
    typeof options?.costGems === "number" && Number.isFinite(options.costGems) && options.costGems > 0
      ? Math.floor(options.costGems)
      : STREAK_REPAIR_COST_GEMS;
  const windowMs =
    typeof options?.windowMs === "number" && Number.isFinite(options.windowMs) && options.windowMs > 0
      ? Math.floor(options.windowMs)
      : STREAK_REPAIR_WINDOW_MS;
  return {
    previousStreak: Math.floor(previousStreak),
    costGems,
    expiresAtMs: nowMs + windowMs,
    active: true,
  };
}

export function isStreakRepairOfferActive(offer: StreakRepairOffer | null, nowMs: number = Date.now()): boolean {
  if (!offer) return false;
  if (!offer.active) return false;
  if (!Number.isFinite(offer.previousStreak) || offer.previousStreak <= 1) return false;
  if (!Number.isFinite(offer.costGems) || offer.costGems <= 0) return false;
  if (!Number.isFinite(offer.expiresAtMs)) return false;
  return offer.expiresAtMs > nowMs;
}

export function purchaseStreakRepairOffer(input: {
  offer: StreakRepairOffer | null;
  gems: number;
  currentStreak: number;
  nowMs?: number;
}): StreakRepairPurchaseResult {
  const nowMs = input.nowMs ?? Date.now();
  const safeGems = Number.isFinite(input.gems) ? Math.max(0, Math.floor(input.gems)) : 0;
  const safeCurrentStreak = Number.isFinite(input.currentStreak) ? Math.max(0, Math.floor(input.currentStreak)) : 0;

  if (!input.offer || !input.offer.active) {
    return {
      success: false,
      reason: "no_offer",
      nextOffer: null,
      nextGems: safeGems,
      restoredStreak: safeCurrentStreak,
    };
  }

  if (input.offer.expiresAtMs <= nowMs) {
    return {
      success: false,
      reason: "expired",
      nextOffer: null,
      nextGems: safeGems,
      restoredStreak: safeCurrentStreak,
    };
  }

  if (safeGems < input.offer.costGems) {
    return {
      success: false,
      reason: "insufficient_gems",
      nextOffer: input.offer,
      nextGems: safeGems,
      restoredStreak: safeCurrentStreak,
    };
  }

  return {
    success: true,
    nextOffer: { ...input.offer, active: false },
    nextGems: safeGems - input.offer.costGems,
    restoredStreak: Math.floor(input.offer.previousStreak),
  };
}
