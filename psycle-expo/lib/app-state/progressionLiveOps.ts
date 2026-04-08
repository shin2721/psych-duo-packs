import {
  deriveUserSegment,
  shouldReassignSegment,
} from "../personalization";
import {
  getEventCampaignConfig,
  type EventCampaignConfig,
  type PersonalizationSegment,
} from "../gamificationConfig";

function parseDateKey(dateKey: string): Date | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysSinceDate(dateKey: string | null): number {
  if (!dateKey) return 0;
  const parsed = parseDateKey(dateKey);
  if (!parsed) return 0;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const parsedStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffMs = todayStart.getTime() - parsedStart.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, Math.floor(daysAgo)));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getActiveEventCampaignConfig(now: Date = new Date()): EventCampaignConfig | null {
  const config = getEventCampaignConfig();
  if (!config) return null;
  const startAt = new Date(config.start_at).getTime();
  const endAt = new Date(config.end_at).getTime();
  const nowMs = now.getTime();
  return nowMs >= startAt && nowMs <= endAt ? config : null;
}

export function isTrackedStreakMilestoneDay(day: number): day is 3 | 7 | 14 | 30 | 60 | 100 | 365 {
  return day === 3 || day === 7 || day === 14 || day === 30 || day === 60 || day === 100 || day === 365;
}

export function derivePersonalizationAssignment(params: {
  cooldownHours: number;
  currentSegment: PersonalizationSegment;
  lastActivityDate: string | null;
  lastAssignedAtMs: number | null;
  lessonsCompleted7d: number;
  streak: number;
}): {
  daysSinceStudy: number;
  nextSegment: PersonalizationSegment;
  shouldAssign: boolean;
  segmentChanged: boolean;
} {
  const shouldAssign = shouldReassignSegment({
    lastAssignedAtMs: params.lastAssignedAtMs,
    cooldownHours: params.cooldownHours,
  });

  const daysSinceStudy = getDaysSinceDate(params.lastActivityDate);
  const nextSegment = deriveUserSegment({
    lessonsCompleted7d: params.lessonsCompleted7d,
    daysSinceStudy,
    currentStreak: params.streak,
  });

  return {
    daysSinceStudy,
    nextSegment,
    shouldAssign,
    segmentChanged: nextSegment !== params.currentSegment,
  };
}
