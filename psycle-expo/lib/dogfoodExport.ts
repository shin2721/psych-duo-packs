import type { DogfoodLog, InterventionStats } from "./dogfood";
import {
  finalizeInterventionStats,
  normalizeInteractionCount,
} from "./dogfoodHelpers";

interface LessonAggregateStats {
  shown: number;
  attempted: number;
  executed: number;
}

type ExportableDogfoodJson = {
  _meta: {
    schema_version: string;
    exported_at: string;
    entry_count: number;
  };
  byIntervention: Record<string, InterventionStats>;
  byLesson: Record<string, LessonAggregateStats>;
} & Record<string, unknown>;

export async function buildInterventionStats(
  log: DogfoodLog
): Promise<Record<string, InterventionStats>> {
  const stats: Record<string, InterventionStats> = {};

  for (const entry of log.entries) {
    for (const intervention of entry.interventions_tried) {
      const id = intervention.intervention_id;

      if (!stats[id]) {
        stats[id] = {
          shown: 0,
          attempted: 0,
          executed: 0,
          felt_better_count: 0,
          felt_better_sum: 0,
          felt_better_avg: 0,
          attempt_rate: 0,
          execute_rate: 0,
          variant_breakdown: {},
        };
      }

      const shownVal = normalizeInteractionCount(intervention.shown);
      const attemptedVal = normalizeInteractionCount(intervention.attempted);
      const executedVal = normalizeInteractionCount(intervention.executed);

      stats[id].shown += shownVal;
      stats[id].attempted += attemptedVal;
      stats[id].executed += executedVal;

      if (intervention.felt_better_now !== undefined) {
        stats[id].felt_better_count++;
        stats[id].felt_better_sum += intervention.felt_better_now;
      }

      const variantId = intervention.variant?.id || "default";
      if (!stats[id].variant_breakdown[variantId]) {
        stats[id].variant_breakdown[variantId] = {
          shown: 0,
          attempted: 0,
          executed: 0,
        };
      }

      stats[id].variant_breakdown[variantId].shown += shownVal;
      stats[id].variant_breakdown[variantId].attempted += attemptedVal;
      stats[id].variant_breakdown[variantId].executed += executedVal;
    }
  }

  return finalizeInterventionStats(stats);
}

export function buildDogfoodSummary(log: DogfoodLog): {
  total_lessons: number;
  usability: { yes: number; no: number; unsure: number };
  interventions: {
    total_shown: number;
    total_attempted: number;
    total_executed: number;
    attempt_rate: string;
    execute_rate: string;
  };
} {
  const usability = { yes: 0, no: 0, unsure: 0 };
  let totalShown = 0;
  let totalAttempted = 0;
  let totalExecuted = 0;

  for (const entry of log.entries) {
    if (entry.usability_response === "yes") usability.yes++;
    else if (entry.usability_response === "no") usability.no++;
    else if (entry.usability_response === "unsure") usability.unsure++;

    for (const intervention of entry.interventions_tried) {
      totalShown += normalizeInteractionCount(intervention.shown);
      totalAttempted += normalizeInteractionCount(intervention.attempted);
      totalExecuted += normalizeInteractionCount(intervention.executed);
    }
  }

  return {
    total_lessons: log.entries.length,
    usability,
    interventions: {
      total_shown: totalShown,
      total_attempted: totalAttempted,
      total_executed: totalExecuted,
      attempt_rate:
        totalShown > 0 ? `${Math.round((totalAttempted / totalShown) * 100)}%` : "N/A",
      execute_rate:
        totalAttempted > 0
          ? `${Math.round((totalExecuted / totalAttempted) * 100)}%`
          : "N/A",
    },
  };
}

export function buildExportableDogfoodJson(params: {
  entryCount: number;
  interventionStats: Record<string, InterventionStats>;
  log: DogfoodLog;
}): string {
  const byIntervention: Record<string, InterventionStats> = {};
  const byLesson: Record<string, LessonAggregateStats> = {};

  for (const [id, stats] of Object.entries(params.interventionStats)) {
    byIntervention[id] = stats;
  }

  for (const entry of params.log.entries) {
    const match = entry.lesson_id.match(/^([a-z]+)_/);
    if (!match) continue;
    const domain = match[1];
    const key = `${domain}_units/${entry.lesson_id}.ja.json`;

    if (!byLesson[key]) {
      byLesson[key] = { shown: 0, attempted: 0, executed: 0 };
    }

    let sessionHadShown = false;
    let sessionHadAttempted = false;
    let sessionHadExecuted = false;

    for (const intervention of entry.interventions_tried) {
      if (normalizeInteractionCount(intervention.shown) > 0) sessionHadShown = true;
      if (normalizeInteractionCount(intervention.attempted) > 0) sessionHadAttempted = true;
      if (normalizeInteractionCount(intervention.executed) > 0) sessionHadExecuted = true;
    }

    if (sessionHadShown) byLesson[key].shown++;
    if (sessionHadAttempted) byLesson[key].attempted++;
    if (sessionHadExecuted) byLesson[key].executed++;
  }

  const output: ExportableDogfoodJson = {
    _meta: {
      schema_version: "2.0",
      exported_at: new Date().toISOString(),
      entry_count: params.entryCount,
    },
    byIntervention,
    byLesson,
  };

  for (const [id, stats] of Object.entries(byIntervention)) {
    output[id] = stats;
  }
  for (const [key, stats] of Object.entries(byLesson)) {
    output[key] = stats;
  }

  return JSON.stringify(output, null, 2);
}
