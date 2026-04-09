import {
  recordDebugEvent,
  recordSystemEvent,
  setCurrentAnonId,
} from "../analytics-debug";
import type { AnalyticsProperties } from "../analytics.types";

export const ANALYTICS_DEBUG_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";

export type AnalyticsDebugMeta = Record<string, string | number | boolean>;

export function toAnalyticsDebugMeta(
  properties: AnalyticsProperties
): AnalyticsDebugMeta {
  const meta: AnalyticsDebugMeta = {};

  Object.entries(properties).forEach(([key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      meta[key] = value;
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
