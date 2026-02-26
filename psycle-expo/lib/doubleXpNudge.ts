export interface DoubleXpNudgeState {
  lastShownDate: string | null;
  shownCountToday: number;
}

export interface DoubleXpNudgeVisibilityInput {
  enabled: boolean;
  isComplete: boolean;
  isDoubleXpActive: boolean;
  gems: number;
  minGems: number;
  requireInactiveBoost: boolean;
  dailyShowLimit: number;
  state: DoubleXpNudgeState;
  today: string;
}

export function getLocalDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeDoubleXpNudgeState(input: unknown): DoubleXpNudgeState {
  if (!input || typeof input !== "object") {
    return { lastShownDate: null, shownCountToday: 0 };
  }

  const candidate = input as Record<string, unknown>;
  const lastShownDate = typeof candidate.lastShownDate === "string" ? candidate.lastShownDate : null;
  const shownCountRaw = Number(candidate.shownCountToday);
  const shownCountToday = Number.isFinite(shownCountRaw)
    ? Math.max(0, Math.floor(shownCountRaw))
    : 0;

  return { lastShownDate, shownCountToday };
}

export function getDailyNudgeRemaining(
  state: DoubleXpNudgeState,
  limit: number,
  today: string
): number {
  const normalizedLimit = Math.max(0, Math.floor(limit));
  if (normalizedLimit === 0) return 0;
  const used = state.lastShownDate === today ? state.shownCountToday : 0;
  return Math.max(0, normalizedLimit - used);
}

export function consumeDailyNudgeQuota(
  state: DoubleXpNudgeState,
  today: string
): DoubleXpNudgeState {
  const used = state.lastShownDate === today ? state.shownCountToday : 0;
  return {
    lastShownDate: today,
    shownCountToday: used + 1,
  };
}

export function shouldShowDoubleXpNudge(input: DoubleXpNudgeVisibilityInput): boolean {
  if (!input.enabled) return false;
  if (!input.isComplete) return false;
  if (input.gems < input.minGems) return false;
  if (input.requireInactiveBoost && input.isDoubleXpActive) return false;
  return getDailyNudgeRemaining(input.state, input.dailyShowLimit, input.today) > 0;
}

