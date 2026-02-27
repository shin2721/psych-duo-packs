import {
  getPersonalizationConfig,
  type PersonalizationConfig,
  type PersonalizationSegment,
} from "./gamificationConfig";

export interface PersonalizationInput {
  lessonsCompleted7d: number;
  daysSinceStudy: number;
  currentStreak: number;
}

function clampInt(value: number, min: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.floor(value));
}

export function normalizePersonalizationSegment(value: unknown): PersonalizationSegment {
  if (value === "new" || value === "active" || value === "at_risk" || value === "power") {
    return value;
  }
  return "new";
}

export function deriveUserSegment(input: PersonalizationInput): PersonalizationSegment {
  const lessonsCompleted7d = clampInt(input.lessonsCompleted7d, 0);
  const daysSinceStudy = clampInt(input.daysSinceStudy, 0);
  const currentStreak = clampInt(input.currentStreak, 0);

  if (daysSinceStudy >= 3) return "at_risk";
  if (lessonsCompleted7d >= 20 || currentStreak >= 21) return "power";
  if (lessonsCompleted7d <= 2 && currentStreak <= 1) return "new";
  return "active";
}

export function shouldReassignSegment(input: {
  lastAssignedAtMs: number | null;
  nowMs?: number;
  cooldownHours: number;
}): boolean {
  const nowMs = typeof input.nowMs === "number" && Number.isFinite(input.nowMs)
    ? input.nowMs
    : Date.now();
  const cooldownMs = Math.max(1, Math.floor(input.cooldownHours)) * 60 * 60 * 1000;

  if (!Number.isFinite(input.lastAssignedAtMs as number) || (input.lastAssignedAtMs ?? 0) <= 0) {
    return true;
  }

  return nowMs - (input.lastAssignedAtMs as number) >= cooldownMs;
}

export function getAdjustedQuestNeed(
  baseNeed: number,
  segment: PersonalizationSegment,
  config: PersonalizationConfig = getPersonalizationConfig()
): number {
  const normalizedBase = clampInt(baseNeed, 1);
  if (!config.enabled) return normalizedBase;

  const delta = Number(config.quest_need_adjustment[segment] ?? 0);
  if (!Number.isFinite(delta)) return normalizedBase;
  return Math.max(1, normalizedBase + Math.trunc(delta));
}

export function getAdjustedComebackReward(
  baseReward: number,
  segment: PersonalizationSegment,
  config: PersonalizationConfig = getPersonalizationConfig()
): number {
  const normalizedBase = clampInt(baseReward, 0);
  if (!config.enabled) return normalizedBase;

  const delta = Number(config.comeback_reward_adjustment[segment] ?? 0);
  if (!Number.isFinite(delta)) return normalizedBase;
  return Math.max(0, normalizedBase + Math.trunc(delta));
}
