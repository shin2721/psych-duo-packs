import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Analytics } from "../analytics";
import { useAuth } from "../AuthContext";
import { buildMistakesHubSessionItems, selectMistakesHubItems } from "../../src/features/mistakesHub";
import { canUseMistakesHub, consumeMistakesHub, getMistakesHubRemaining } from "../../src/featureGate";
import { logDev } from "../devLog";
import { useBillingState } from "./billing";
import { runHydrationTask } from "./hydration";
import { createPersistJsonEffect } from "./persistEffects";
import { loadPracticePersistenceSnapshot, normalizeReviewEvents } from "./practicePersistence";
import type { MistakeItem, PracticeState, ReviewEvent } from "./types";

type PracticeContextValue = PracticeState & { isHydrated: boolean };

const PracticeStateContext = createContext<PracticeContextValue | undefined>(undefined);

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

    return runHydrationTask({
      setIsHydrated,
      onStart: () => {
        setMistakesHubSessionItems([]);
      },
      task: async ({ isCancelled }) => {
        const saved = await loadPracticePersistenceSnapshot(user.id);
        if (isCancelled()) return;
        setMistakes(saved.mistakes);
        setReviewEvents(saved.reviewEvents);
      },
      onError: (error) => {
        logDev("Practice local storage read failed:", error);
      },
    });
  }, [user]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: user?.id,
      isHydrated,
      key: "mistakes",
      value: mistakes,
    });
  }, [isHydrated, mistakes, user?.id]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: user?.id,
      isHydrated,
      key: "reviewEvents",
      value: reviewEvents,
    });
  }, [isHydrated, reviewEvents, user?.id]);

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
