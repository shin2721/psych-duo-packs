import type { PlanId } from "./types/plan";

export type PlanChangeSnapshot = {
  planId: PlanId;
  activeUntil: string | null;
};

export const PLAN_CHANGE_SNAPSHOT_KEY_PREFIX = "plan_change_snapshot_";

export const PLAN_PRIORITY: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  max: 2,
};

export function normalizePlanIdValue(value: unknown): PlanId | null {
  if (value === "free" || value === "pro" || value === "max") return value;
  return null;
}

export function parsePlanChangeSnapshot(raw: string | null): PlanChangeSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PlanChangeSnapshot>;
    const planId = normalizePlanIdValue(parsed.planId);
    if (!planId) return null;
    return {
      planId,
      activeUntil: typeof parsed.activeUntil === "string" ? parsed.activeUntil : null,
    };
  } catch {
    return null;
  }
}

export function hasPlanSnapshotChanged(
  prev: PlanChangeSnapshot | null,
  next: PlanChangeSnapshot
): boolean {
  if (!prev) return true;
  return prev.planId !== next.planId || prev.activeUntil !== next.activeUntil;
}

export function getPlanChangeSnapshotKey(userId: string): string {
  return `${PLAN_CHANGE_SNAPSHOT_KEY_PREFIX}${userId}`;
}

export function getPlanChangeDirection(fromPlan: PlanId, toPlan: PlanId): {
  isUpgrade: boolean;
  isDowngrade: boolean;
} {
  const fromRank = PLAN_PRIORITY[fromPlan];
  const toRank = PLAN_PRIORITY[toPlan];
  return {
    isUpgrade: toRank > fromRank,
    isDowngrade: toRank < fromRank,
  };
}
