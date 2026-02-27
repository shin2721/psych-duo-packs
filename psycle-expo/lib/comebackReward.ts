export type ComebackClaimFailureReason =
  | "no_offer"
  | "expired"
  | "already_claimed"
  | "subscription_excluded";

export interface ComebackRewardOffer {
  active: boolean;
  triggerDate: string; // YYYY-MM-DD (local)
  daysSinceStudy: number;
  rewardEnergy: number;
  rewardGems: number;
  expiresAtMs: number;
}

function toPositiveInt(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function toDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEndOfLocalDayMs(date: Date): number {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function isComebackEligible(daysSinceStudy: number, thresholdDays: number): boolean {
  const normalizedDays = toPositiveInt(daysSinceStudy);
  const normalizedThreshold = Math.max(1, toPositiveInt(thresholdDays, 7));
  return normalizedDays >= normalizedThreshold;
}

export function createComebackRewardOffer(input: {
  daysSinceStudy: number;
  thresholdDays: number;
  rewardEnergy: number;
  rewardGems?: number;
  now?: Date;
}): ComebackRewardOffer | null {
  const now = input.now ?? new Date();
  if (!isComebackEligible(input.daysSinceStudy, input.thresholdDays)) {
    return null;
  }

  const rewardEnergy = Math.max(1, toPositiveInt(input.rewardEnergy, 2));
  const rewardGems = Math.max(0, toPositiveInt(input.rewardGems ?? 0, 0));

  return {
    active: true,
    triggerDate: toDateKeyLocal(now),
    daysSinceStudy: toPositiveInt(input.daysSinceStudy),
    rewardEnergy,
    rewardGems,
    expiresAtMs: getEndOfLocalDayMs(now),
  };
}

export function normalizeComebackRewardOffer(raw: unknown): ComebackRewardOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Partial<ComebackRewardOffer>;

  if (
    typeof source.active !== "boolean" ||
    typeof source.triggerDate !== "string" ||
    typeof source.daysSinceStudy !== "number" ||
    typeof source.rewardEnergy !== "number" ||
    typeof source.expiresAtMs !== "number"
  ) {
    return null;
  }

  return {
    active: source.active,
    triggerDate: source.triggerDate,
    daysSinceStudy: toPositiveInt(source.daysSinceStudy, 0),
    rewardEnergy: Math.max(1, toPositiveInt(source.rewardEnergy, 2)),
    rewardGems: Math.max(0, toPositiveInt(source.rewardGems ?? 0, 0)),
    expiresAtMs: source.expiresAtMs,
  };
}

export function isComebackOfferExpired(
  offer: Pick<ComebackRewardOffer, "expiresAtMs"> | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!offer) return true;
  if (!Number.isFinite(offer.expiresAtMs)) return true;
  return nowMs > offer.expiresAtMs;
}

export function canClaimComebackReward(input: {
  offer: ComebackRewardOffer | null;
  isSubscriptionActive: boolean;
  todayDateKey: string;
  nowMs?: number;
}): { claimable: boolean; reason?: ComebackClaimFailureReason } {
  const { offer, isSubscriptionActive, todayDateKey } = input;
  const nowMs = input.nowMs ?? Date.now();

  if (!offer) {
    return { claimable: false, reason: "no_offer" };
  }

  if (isSubscriptionActive) {
    return { claimable: false, reason: "subscription_excluded" };
  }

  if (isComebackOfferExpired(offer, nowMs)) {
    return { claimable: false, reason: "expired" };
  }

  if (!offer.active) {
    return {
      claimable: false,
      reason: offer.triggerDate === todayDateKey ? "already_claimed" : "no_offer",
    };
  }

  return { claimable: true };
}
