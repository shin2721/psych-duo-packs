import type { AnalyticsConfig, AnalyticsEvent } from "../analytics.types";

export const HTTP_TIMEOUT_MS = 3000;

export function generateAnalyticsUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const randomValue = (Math.random() * 16) | 0;
    const value = char === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getAnalyticsErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function postJsonWithTimeout(
  url: string,
  payload: unknown,
  timeoutMessage: string
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(timeoutMessage);
    }
    throw error;
  }
}

export async function sendAnalyticsHttpEvent(
  config: AnalyticsConfig,
  event: AnalyticsEvent,
  onSuccess?: (message: string, payload?: unknown) => void
): Promise<void> {
  if (!config.endpoint) {
    return;
  }

  await postJsonWithTimeout(config.endpoint, event, "Request timeout (3s)");
  onSuccess?.("Event sent successfully", { name: event.name });
}

export async function sendAnalyticsPostHogEvent(
  config: AnalyticsConfig,
  event: AnalyticsEvent,
  onSuccess?: (message: string, payload?: unknown) => void
): Promise<void> {
  if (!config.posthogHost || !config.posthogApiKey) {
    return;
  }

  const posthogUrl = `https://${config.posthogHost}/i/v0/e/`;
  const posthogPayload = {
    api_key: config.posthogApiKey,
    event: event.name,
    distinct_id: event.anonId,
    properties: {
      $process_person_profile: false,
      ...event.properties,
      buildId: event.buildId,
      schemaVersion: event.schemaVersion,
      platform: event.platform,
      env: event.env,
      eventId: event.eventId,
      ...(event.userId ? { userId: event.userId } : {}),
    },
    timestamp: event.timestamp,
  };

  await postJsonWithTimeout(
    posthogUrl,
    posthogPayload,
    "PostHog request timeout (3s)"
  );
  onSuccess?.("PostHog event sent successfully", { name: event.name });
}
