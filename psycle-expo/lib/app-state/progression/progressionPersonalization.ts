import type { PersonalizationSegment } from "../../gamificationConfig";
import { loadLessonsCompleted7d } from "../progressionRemote";
import {
  derivePersonalizationAssignment,
  getDateDaysAgo,
} from "../progressionLiveOps";

export interface PersonalizationAssignmentResult {
  shouldAssign: boolean;
  segmentChanged: boolean;
  nextSegment: PersonalizationSegment;
  nextAssignedAtMs: number | null;
  lessonsCompleted7d: number;
  daysSinceStudy: number;
  loadFailed: boolean;
}

export async function assignPersonalizationSegment(args: {
  userId: string | null | undefined;
  enabled: boolean;
  cooldownHours: number;
  currentSegment: PersonalizationSegment;
  lastActivityDate: string | null;
  lastAssignedAtMs: number | null;
  streak: number;
  nowMs?: number;
}): Promise<PersonalizationAssignmentResult> {
  if (!args.userId || !args.enabled) {
    return {
      shouldAssign: false,
      segmentChanged: false,
      nextSegment: args.currentSegment,
      nextAssignedAtMs: args.lastAssignedAtMs,
      lessonsCompleted7d: 0,
      daysSinceStudy: 0,
      loadFailed: false,
    };
  }

  let lessonsCompleted7d = 0;
  let loadFailed = false;
  try {
    lessonsCompleted7d = await loadLessonsCompleted7d(args.userId, getDateDaysAgo(6));
  } catch {
    lessonsCompleted7d = 0;
    loadFailed = true;
  }

  const assignment = derivePersonalizationAssignment({
    cooldownHours: args.cooldownHours,
    currentSegment: args.currentSegment,
    lastActivityDate: args.lastActivityDate,
    lastAssignedAtMs: args.lastAssignedAtMs,
    lessonsCompleted7d,
    streak: args.streak,
  });

  return {
    shouldAssign: assignment.shouldAssign,
    segmentChanged: assignment.segmentChanged,
    nextSegment: assignment.nextSegment,
    nextAssignedAtMs: assignment.shouldAssign ? args.nowMs ?? Date.now() : args.lastAssignedAtMs,
    lessonsCompleted7d,
    daysSinceStudy: assignment.daysSinceStudy,
    loadFailed,
  };
}
