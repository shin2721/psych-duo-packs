import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  V2_PILOT_SCHEMA_VERSION,
  V2_PILOT_UNIT_ID,
  type V2PilotBoundaryAnswer,
  type V2PilotBoundaryHeadlineId,
  type V2PilotDay1Step,
  type V2PilotPrediction,
  type V2PilotPredictionDirection,
  type V2PilotQualityComparison,
  type V2PilotQualityUpdate,
  type V2PilotRecall,
  type V2PilotSnapshot,
} from "../../types/v2Pilot";

export const V2_PILOT_STORAGE_KEY_PREFIX =
  "psycle:v2-owner-pilot:ai-diversity:v1";

const DAY_1_STEPS = new Set<V2PilotDay1Step>([
  "prediction",
  "diversity_prediction",
  "research",
  "quality_update",
  "boundary",
  "recall",
  "complete",
]);

const PREDICTION_DIRECTIONS = new Set<V2PilotPredictionDirection>([
  "decrease",
  "same",
  "increase",
]);

const QUALITY_COMPARISONS = new Set<V2PilotQualityComparison>([
  "higher_than_expected",
  "as_expected",
  "lower_than_expected",
]);

const BOUNDARY_HEADLINE_IDS: V2PilotBoundaryHeadlineId[] = [
  "headline_1",
  "headline_2",
  "headline_3",
  "headline_4",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(100, value)));
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function normalizeNow(nowIso?: string): string {
  return normalizeTimestamp(nowIso) ?? new Date().toISOString();
}

function normalizePrediction(value: unknown): V2PilotPrediction {
  const record = isRecord(value) ? value : {};
  const rawDirection = record.direction;
  return {
    direction:
      typeof rawDirection === "string" &&
      PREDICTION_DIRECTIONS.has(rawDirection as V2PilotPredictionDirection)
        ? (rawDirection as V2PilotPredictionDirection)
        : null,
    reason: normalizeString(record.reason),
    confidence: normalizeConfidence(record.confidence),
  };
}

function normalizeQualityUpdate(value: unknown): V2PilotQualityUpdate {
  const record = isRecord(value) ? value : {};
  const rawComparison = record.comparison;
  return {
    comparison:
      typeof rawComparison === "string" &&
      QUALITY_COMPARISONS.has(rawComparison as V2PilotQualityComparison)
        ? (rawComparison as V2PilotQualityComparison)
        : null,
    reason: normalizeString(record.reason),
    confidence: normalizeConfidence(record.confidence),
  };
}

function normalizeBoundaryAnswer(value: unknown): V2PilotBoundaryAnswer | null {
  if (!isRecord(value)) return null;
  const boundaryTag = normalizeString(value.boundaryTag);
  const note = normalizeString(value.note);
  if (!boundaryTag && !note) return null;
  return { boundaryTag, note };
}

function normalizeBoundaryAnswers(
  value: unknown
): V2PilotSnapshot["boundaryAnswers"] {
  const record = isRecord(value) ? value : {};
  return BOUNDARY_HEADLINE_IDS.reduce<V2PilotSnapshot["boundaryAnswers"]>(
    (answers, headlineId) => {
      answers[headlineId] = normalizeBoundaryAnswer(record[headlineId]);
      return answers;
    },
    {
      headline_1: null,
      headline_2: null,
      headline_3: null,
      headline_4: null,
    }
  );
}

function normalizeRecall(value: unknown): V2PilotRecall {
  const record = isRecord(value) ? value : {};
  return {
    answer: normalizeString(record.answer),
    confidence: normalizeConfidence(record.confidence),
  };
}

export function getV2PilotStorageKey(userId?: string | null): string {
  return `${V2_PILOT_STORAGE_KEY_PREFIX}:${userId ?? "local"}`;
}

export function createInitialV2PilotSnapshot(nowIso?: string): V2PilotSnapshot {
  return {
    schemaVersion: V2_PILOT_SCHEMA_VERSION,
    unitId: V2_PILOT_UNIT_ID,
    currentStep: "prediction",
    qualityPrediction: {
      direction: null,
      reason: "",
      confidence: null,
    },
    diversityPrediction: {
      direction: null,
      reason: "",
      confidence: null,
    },
    qualityUpdate: {
      comparison: null,
      reason: "",
      confidence: null,
    },
    boundaryAnswers: {
      headline_1: null,
      headline_2: null,
      headline_3: null,
      headline_4: null,
    },
    recall: {
      answer: "",
      confidence: null,
    },
    completedAt: null,
    updatedAt: normalizeNow(nowIso),
  };
}

export function normalizeV2PilotSnapshot(
  value: unknown,
  nowIso?: string
): V2PilotSnapshot {
  const initial = createInitialV2PilotSnapshot(nowIso);
  if (!isRecord(value)) return initial;
  if (value.schemaVersion !== V2_PILOT_SCHEMA_VERSION) return initial;
  if (value.unitId !== V2_PILOT_UNIT_ID) return initial;

  const rawStep = value.currentStep;
  const currentStep =
    typeof rawStep === "string" && DAY_1_STEPS.has(rawStep as V2PilotDay1Step)
      ? (rawStep as V2PilotDay1Step)
      : initial.currentStep;
  const storedCompletedAt = normalizeTimestamp(value.completedAt);

  return {
    schemaVersion: V2_PILOT_SCHEMA_VERSION,
    unitId: V2_PILOT_UNIT_ID,
    currentStep,
    qualityPrediction: normalizePrediction(value.qualityPrediction),
    diversityPrediction: normalizePrediction(value.diversityPrediction),
    qualityUpdate: normalizeQualityUpdate(value.qualityUpdate),
    boundaryAnswers: normalizeBoundaryAnswers(value.boundaryAnswers),
    recall: normalizeRecall(value.recall),
    completedAt: currentStep === "complete" ? storedCompletedAt : null,
    updatedAt: normalizeTimestamp(value.updatedAt) ?? initial.updatedAt,
  };
}

export async function loadV2PilotSnapshot(
  userId?: string | null,
  nowIso?: string
): Promise<V2PilotSnapshot> {
  const raw = await AsyncStorage.getItem(getV2PilotStorageKey(userId));
  if (!raw) return createInitialV2PilotSnapshot(nowIso);

  try {
    return normalizeV2PilotSnapshot(JSON.parse(raw), nowIso);
  } catch {
    return createInitialV2PilotSnapshot(nowIso);
  }
}

export async function saveV2PilotSnapshot(
  userId: string | null | undefined,
  snapshot: V2PilotSnapshot,
  nowIso?: string
): Promise<V2PilotSnapshot> {
  const updatedAt = normalizeNow(nowIso);
  const normalized = normalizeV2PilotSnapshot(
    {
      ...snapshot,
      completedAt:
        snapshot.currentStep === "complete"
          ? normalizeTimestamp(snapshot.completedAt) ?? updatedAt
          : null,
      updatedAt,
    },
    updatedAt
  );
  await AsyncStorage.setItem(
    getV2PilotStorageKey(userId),
    JSON.stringify(normalized)
  );
  return normalized;
}

export async function resetV2PilotSnapshot(
  userId?: string | null
): Promise<void> {
  await AsyncStorage.removeItem(getV2PilotStorageKey(userId));
}
