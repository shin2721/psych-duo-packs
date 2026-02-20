const FIRST_DAY_BONUS_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isFirstDayBonusActive(firstLaunchAtMs: number | null, nowMs: number = Date.now()): boolean {
  if (firstLaunchAtMs === null) return false;
  if (!Number.isFinite(firstLaunchAtMs) || firstLaunchAtMs <= 0) return false;
  const elapsed = nowMs - firstLaunchAtMs;
  return elapsed >= 0 && elapsed < FIRST_DAY_BONUS_WINDOW_MS;
}

export function getEffectiveFreeEnergyCap(
  baseCap: number,
  firstDayBonus: number,
  firstLaunchAtMs: number | null,
  nowMs: number = Date.now()
): number {
  const normalizedBase = Math.max(0, Math.floor(baseCap));
  const normalizedBonus = Math.max(0, Math.floor(firstDayBonus));
  if (!isFirstDayBonusActive(firstLaunchAtMs, nowMs)) {
    return normalizedBase;
  }
  return normalizedBase + normalizedBonus;
}
