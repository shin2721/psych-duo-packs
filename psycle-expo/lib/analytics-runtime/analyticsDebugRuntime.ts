import {
  recordDebugEvent,
  recordSystemEvent,
  setCurrentAnonId,
} from "../analytics-debug";
import type { AnalyticsProperties } from "../analytics.types";

export const ANALYTICS_DEBUG_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";

export type AnalyticsDebugMeta = Record<string, string | number | boolean>;

const MAX_DEBUG_META_STRING_LENGTH = 240;

function truncateDebugMetaString(value: string): string {
  return value.length > MAX_DEBUG_META_STRING_LENGTH
    ? `${value.slice(0, MAX_DEBUG_META_STRING_LENGTH - 1)}…`
    : value;
}

function toDebugMetaValue(value: unknown): string | number | boolean | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    try {
      return truncateDebugMetaString(JSON.stringify(value));
    } catch {
      return "[unserializable]";
    }
  }

  return undefined;
}

export function toAnalyticsDebugMeta(
  properties: AnalyticsProperties
): AnalyticsDebugMeta {
  const meta: AnalyticsDebugMeta = {};

  Object.entries(properties).forEach(([key, value]) => {
    const debugValue = toDebugMetaValue(value);
    if (debugValue !== undefined) {
      meta[key] = debugValue;
    }
  });

  return meta;
}

export function recordAnalyticsEventStatus(
  name: string,
  status: "queued" | "sent" | "failed",
  anonId: string,
  properties: AnalyticsProperties
): void {
  if (!ANALYTICS_DEBUG_ENABLED) {
    return;
  }

  recordDebugEvent(name, status, anonId, toAnalyticsDebugMeta(properties));
}

export function safeRecordAnalyticsSystemEvent(
  name: string,
  anonId: string,
  meta?: AnalyticsDebugMeta
): void {
  if (!ANALYTICS_DEBUG_ENABLED) {
    return;
  }

  try {
    recordSystemEvent(name, anonId, meta);
  } catch {
    // Debug hooks must never break analytics runtime.
  }
}

export function safeSetAnalyticsCurrentAnonId(anonId: string): void {
  if (!ANALYTICS_DEBUG_ENABLED) {
    return;
  }

  setCurrentAnonId(anonId);
}
