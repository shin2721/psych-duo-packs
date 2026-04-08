import { getUserStorageKey, loadUserEntries, persistJson } from "./persistence";
import type { MistakeItem, ReviewEvent } from "./types";

export interface PracticePersistenceSnapshot {
  mistakes: MistakeItem[];
  reviewEvents: ReviewEvent[];
}

export function normalizeReviewEvents(raw: unknown, nowMs: number = Date.now()): ReviewEvent[] {
  if (!Array.isArray(raw)) return [];
  const cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  const normalized: ReviewEvent[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const event = item as Record<string, unknown>;
    const ts = Number(event.ts);
    if (!Number.isFinite(ts) || ts < cutoffMs) continue;

    const userId = typeof event.userId === "string" ? event.userId : "";
    const itemId = typeof event.itemId === "string" ? event.itemId : "";
    const lessonId = typeof event.lessonId === "string" ? event.lessonId : "";
    const result = event.result === "incorrect" ? "incorrect" : event.result === "correct" ? "correct" : null;
    if (!userId || !itemId || !lessonId || !result) continue;

    const latencyMs = Number(event.latencyMs);
    const dueAt = Number(event.dueAt);
    const beta = Number(event.beta);
    const p = Number(event.p);

    normalized.push({
      userId,
      itemId,
      lessonId,
      ts: Math.floor(ts),
      result,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : undefined,
      dueAt: Number.isFinite(dueAt) ? dueAt : undefined,
      tags: Array.isArray(event.tags) ? event.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
      beta: Number.isFinite(beta) ? beta : undefined,
      p: Number.isFinite(p) ? p : undefined,
    });
  }

  return normalized.slice(-1000);
}

export function normalizeStoredMistakes(raw: unknown, nowMs: number = Date.now()): MistakeItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const mistake = item as Record<string, unknown>;
    const id = typeof mistake.id === "string" ? mistake.id : "";
    const lessonId = typeof mistake.lessonId === "string" ? mistake.lessonId : "";
    if (!id || !lessonId) return [];

    const timestamp = Number(mistake.timestamp);
    const box = Number(mistake.box);
    const nextReviewDate = Number(mistake.nextReviewDate);
    const interval = Number(mistake.interval);

    return [{
      id,
      lessonId,
      timestamp: Number.isFinite(timestamp) ? Math.floor(timestamp) : nowMs,
      questionType: typeof mistake.questionType === "string" ? mistake.questionType : undefined,
      box: Number.isFinite(box) ? Math.max(1, Math.floor(box)) : 1,
      nextReviewDate: Number.isFinite(nextReviewDate) ? Math.floor(nextReviewDate) : nowMs,
      interval: Number.isFinite(interval) ? Math.max(0, Math.floor(interval)) : 0,
    }];
  });
}

export async function loadPracticePersistenceSnapshot(userId: string): Promise<PracticePersistenceSnapshot> {
  const saved = await loadUserEntries(userId, ["mistakes", "reviewEvents"]);
  let mistakes: MistakeItem[] = [];
  let reviewEvents: ReviewEvent[] = [];

  if (saved.mistakes) {
    try {
      mistakes = normalizeStoredMistakes(JSON.parse(saved.mistakes));
    } catch (error) {
      console.warn("Failed to parse stored mistakes:", error);
    }
  }

  if (saved.reviewEvents) {
    try {
      reviewEvents = normalizeReviewEvents(JSON.parse(saved.reviewEvents));
    } catch (error) {
      console.warn("Failed to parse stored review events:", error);
    }
  }

  return {
    mistakes,
    reviewEvents,
  };
}

export async function persistPracticeJsonState(
  userId: string,
  key: "mistakes" | "reviewEvents",
  value: MistakeItem[] | ReviewEvent[]
): Promise<void> {
  await persistJson(getUserStorageKey(key, userId), value);
}
