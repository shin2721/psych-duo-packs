import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Analytics } from "../analytics";
import { useAuth } from "../AuthContext";
import { buildMistakesHubSessionItems, selectMistakesHubItems } from "../../src/features/mistakesHub";
import { canUseMistakesHub, consumeMistakesHub, getMistakesHubRemaining } from "../../src/featureGate";
import { useBillingState } from "./billing";
import { getUserStorageKey, loadUserEntries, persistJson } from "./persistence";
import type { MistakeItem, PracticeState, ReviewEvent } from "./types";

type PracticeContextValue = PracticeState & { isHydrated: boolean };

const PracticeStateContext = createContext<PracticeContextValue | undefined>(undefined);

function normalizeReviewEvents(raw: unknown): ReviewEvent[] {
  if (!Array.isArray(raw)) return [];
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const normalized = raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((event) => {
      const ts = Number(event.ts);
      if (!Number.isFinite(ts) || ts < cutoffMs) return null;

      const userId = typeof event.userId === "string" ? event.userId : "";
      const itemId = typeof event.itemId === "string" ? event.itemId : "";
      const lessonId = typeof event.lessonId === "string" ? event.lessonId : "";
      const result = event.result === "incorrect" ? "incorrect" : event.result === "correct" ? "correct" : null;
      if (!userId || !itemId || !lessonId || !result) return null;

      const latencyMs = Number(event.latencyMs);
      const dueAt = Number(event.dueAt);
      const beta = Number(event.beta);
      const p = Number(event.p);

      return {
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
      } satisfies ReviewEvent;
    })
    .filter((event): event is ReviewEvent => event !== null);

  return normalized.slice(-1000);
}

export function PracticeStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { planId } = useBillingState();
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [mistakesHubSessionItems, setMistakesHubSessionItems] = useState<
    Array<{ itemId: string; lessonId: string }>
  >([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [mistakesCleared] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const userId = user?.id || "user_local";
  const SRS_INTERVALS = [0, 1, 3, 7, 14];

  useEffect(() => {
    if (!user) {
      setReviewEvents([]);
      setMistakes([]);
      setMistakesHubSessionItems([]);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    setIsHydrated(false);

    const loadPractice = async () => {
      try {
        const saved = await loadUserEntries(user.id, ["mistakes", "reviewEvents"]);
        if (cancelled) return;

        if (saved.mistakes) {
          const loadedMistakes = JSON.parse(saved.mistakes);
          const migratedMistakes = loadedMistakes.map((m: any) => {
            if (m.box === undefined) {
              return {
                ...m,
                box: 1,
                nextReviewDate: Date.now(),
                interval: 0,
              };
            }
            return m;
          });
          setMistakes(migratedMistakes);
        } else {
          setMistakes([]);
        }

        if (saved.reviewEvents) {
          try {
            setReviewEvents(normalizeReviewEvents(JSON.parse(saved.reviewEvents)));
          } catch (error) {
            console.warn("Failed to parse stored review events:", error);
            setReviewEvents([]);
          }
        } else {
          setReviewEvents([]);
        }
      } catch (error) {
        if (__DEV__) {
          console.log("Practice local storage read failed:", error);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    loadPractice();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistJson(getUserStorageKey("mistakes", user.id), mistakes).catch(() => {});
  }, [isHydrated, mistakes, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistJson(getUserStorageKey("reviewEvents", user.id), reviewEvents).catch(() => {});
  }, [isHydrated, reviewEvents, user]);

  const addReviewEvent = (event: Omit<ReviewEvent, "userId" | "ts">) => {
    const fullEvent: ReviewEvent = {
      ...event,
      userId,
      ts: Date.now(),
    };
    setReviewEvents((prev) => normalizeReviewEvents([...prev, fullEvent]));
  };

  const addMistake = (questionId: string, lessonId: string, questionType?: string) => {
    setMistakes((prev) => {
      const existing = prev.find((mistake) => mistake.id === questionId);
      if (existing) {
        return prev.map((mistake) =>
          mistake.id === questionId
            ? { ...mistake, box: 1, nextReviewDate: Date.now(), interval: 0 }
            : mistake
        );
      }

      return [
        ...prev,
        {
          id: questionId,
          lessonId,
          timestamp: Date.now(),
          questionType,
          box: 1,
          nextReviewDate: Date.now(),
          interval: 0,
        },
      ];
    });
  };

  const processReviewResult = (questionId: string, isCorrect: boolean) => {
    setMistakes((prev) =>
      prev
        .map((mistake) => {
          if (mistake.id !== questionId) return mistake;

          if (isCorrect) {
            const newBox = mistake.box + 1;
            if (newBox > 5) return null;
            const newInterval = SRS_INTERVALS[newBox - 1];
            return {
              ...mistake,
              box: newBox,
              interval: newInterval,
              nextReviewDate: Date.now() + newInterval * 24 * 60 * 60 * 1000,
            };
          }

          return {
            ...mistake,
            box: 1,
            interval: 0,
            nextReviewDate: Date.now(),
          };
        })
        .filter(Boolean) as MistakeItem[]
    );
  };

  const getDueMistakes = () => {
    const now = Date.now();
    return mistakes.filter((mistake) => mistake.nextReviewDate <= now);
  };

  const clearMistake = (questionId: string) => {
    setMistakes((prev) => prev.filter((mistake) => mistake.id !== questionId));
  };

  const getMistakesHubItems = () => selectMistakesHubItems(reviewEvents);

  const clearMistakesHubSession = () => {
    setMistakesHubSessionItems([]);
  };

  const canAccessMistakesHub = canUseMistakesHub(userId, planId);
  const mistakesHubRemaining = getMistakesHubRemaining(userId, planId);

  const startMistakesHubSession = () => {
    if (!canAccessMistakesHub) {
      return { started: false as const, reason: "not_available" as const };
    }

    const selectedItemIds = selectMistakesHubItems(reviewEvents).slice(0, 10);
    if (selectedItemIds.length === 0) {
      return { started: false as const, reason: "no_items" as const };
    }

    const sessionItems = buildMistakesHubSessionItems(reviewEvents, 10);
    if (sessionItems.length < 5) {
      return { started: false as const, reason: "insufficient_data" as const };
    }

    consumeMistakesHub(userId);
    setMistakesHubSessionItems(sessionItems);
    Analytics.track("mistakes_hub_session_started", {
      itemCount: sessionItems.length,
      source: "mistakes_hub_button",
    });

    return { started: true as const };
  };

  const value = useMemo<PracticeContextValue>(
    () => ({
      reviewEvents,
      addReviewEvent,
      getMistakesHubItems,
      canAccessMistakesHub,
      mistakesHubRemaining,
      startMistakesHubSession,
      mistakesHubSessionItems,
      clearMistakesHubSession,
      mistakes,
      addMistake,
      processReviewResult,
      getDueMistakes,
      clearMistake,
      mistakesCleared,
      isHydrated,
    }),
    [canAccessMistakesHub, isHydrated, mistakes, mistakesCleared, mistakesHubRemaining, mistakesHubSessionItems, reviewEvents]
  );

  return <PracticeStateContext.Provider value={value}>{children}</PracticeStateContext.Provider>;
}

export function usePracticeState() {
  const context = useContext(PracticeStateContext);
  if (!context) {
    throw new Error("usePracticeState must be used within PracticeStateProvider");
  }
  return context;
}
