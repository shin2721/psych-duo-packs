import { dateKey } from "./streaks";
import type { DogfoodEntry, DogfoodLog, InterventionStats } from "./dogfood";

export function createEmptyDogfoodLog(
  schemaVersion: number,
  buildId: string
): DogfoodLog {
  return {
    schemaVersion,
    buildId,
    entries: [],
    last_updated: new Date().toISOString(),
  };
}

export function createDogfoodEntry(
  lessonId: string,
  buildId: string,
  schemaVersion: number
): DogfoodEntry {
  return {
    lesson_id: lessonId,
    date_key: dateKey(),
    timestamp: new Date().toISOString(),
    meta: { buildId, schemaVersion },
    usability_response: null,
    interventions_tried: [],
  };
}

export function getOrCreateDogfoodEntry(
  log: DogfoodLog,
  lessonId: string,
  buildId: string,
  schemaVersion: number
): DogfoodEntry {
  const today = dateKey();
  let entry = log.entries.find(
    (current) => current.lesson_id === lessonId && current.date_key === today
  );

  if (!entry) {
    entry = createDogfoodEntry(lessonId, buildId, schemaVersion);
    log.entries.push(entry);
  }

  return entry;
}

export function normalizeInteractionCount(value: boolean | number | undefined): number {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value || 0;
}

export function finalizeInterventionStats(stats: Record<string, InterventionStats>): Record<string, InterventionStats> {
  for (const id of Object.keys(stats)) {
    const current = stats[id];
    current.attempt_rate =
      current.shown > 0 ? Math.round((current.attempted / current.shown) * 100) : 0;
    current.execute_rate =
      current.attempted > 0
        ? Math.round((current.executed / current.attempted) * 100)
        : 0;
    current.felt_better_avg =
      current.felt_better_count > 0
        ? Math.round((current.felt_better_sum / current.felt_better_count) * 100) / 100
        : 0;
  }

  return stats;
}
