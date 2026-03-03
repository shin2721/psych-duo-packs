import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

export type SourceRunMetrics = {
  id: string;
  name: string;
  url: string;
  fetched: number;
  items: number;
  relevant: number;
  seeds: number;
  errors: number;
};

export type PatrolRunMetrics = {
  timestamp: string;
  dryRun: boolean;
  newsFound: number;
  relevantNews: number;
  seedsExtracted: number;
  questionsGenerated: number;
  deterministicPassed: number;
  criticPassed: number;
  savedQuestions: number;
  bundledLessons: number;
  sources: Record<string, SourceRunMetrics>;
  gateFailureReasons: Record<string, number>;
};

export type GateFailureRecord = {
  timestamp: string;
  source?: string;
  phase?: number;
  questionType?: string;
  domain?: string;
  hardViolations: string[];
  warnings?: string[];
};

const METRICS_DIR = join(__dirname, "..", "output", "_metrics");
const PATROL_RUNS_FILE = join(METRICS_DIR, "patrol_runs.jsonl");
const GATE_FAILURES_FILE = join(METRICS_DIR, "gate_failures.jsonl");

function ensureMetricsDir(): void {
  if (!existsSync(METRICS_DIR)) {
    mkdirSync(METRICS_DIR, { recursive: true });
  }
}

function appendJsonLine(filePath: string, payload: unknown): void {
  ensureMetricsDir();
  appendFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf-8");
}

export function appendPatrolMetrics(run: PatrolRunMetrics): void {
  try {
    appendJsonLine(PATROL_RUNS_FILE, run);
  } catch (error) {
    console.warn("[metrics] failed to append patrol metrics:", error);
  }
}

export function appendGateFailure(record: GateFailureRecord): void {
  try {
    appendJsonLine(GATE_FAILURES_FILE, record);
  } catch (error) {
    console.warn("[metrics] failed to append gate failure:", error);
  }
}

export function readPatrolRuns(days = 7): PatrolRunMetrics[] {
  if (!existsSync(PATROL_RUNS_FILE)) return [];

  try {
    const lines = readFileSync(PATROL_RUNS_FILE, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const now = Date.now();
    const windowMs = Math.max(1, days) * 24 * 60 * 60 * 1000;

    return lines
      .map((line) => JSON.parse(line) as PatrolRunMetrics)
      .filter((row) => {
        const ts = Date.parse(row.timestamp);
        if (!Number.isFinite(ts)) return false;
        return now - ts <= windowMs;
      });
  } catch (error) {
    console.warn("[metrics] failed to read patrol runs:", error);
    return [];
  }
}

export function getMetricsPaths(): { patrolRuns: string; gateFailures: string } {
  return {
    patrolRuns: PATROL_RUNS_FILE,
    gateFailures: GATE_FAILURES_FILE,
  };
}
