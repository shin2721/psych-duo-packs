import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Analytics } from "../analytics";
import { useAuth } from "../AuthContext";
import { buildMistakesHubSessionItems, selectMistakesHubItems } from "../../src/features/mistakesHub";
import { canUseMistakesHub, consumeMistakesHub, getMistakesHubRemaining } from "../../src/featureGate";
import { logDev } from "../devLog";
import { getCachedManifest } from "../remoteContent";
import {
  completeMasteryVariant,
  createEmptyMasteryThemeState,
  isMasteryVariantId,
  recordMasteryThemeEvidence,
  registerMasteryVariant as registerMasteryVariantEntry,
  syncMasteryThemeSupply,
  retireMasteryVariant as retireMasteryVariantEntry,
} from "./mastery";
import { useBillingState } from "./billing";
import { runHydrationTask } from "./hydration";
import { createPersistJsonEffect } from "./persistEffects";
import { loadPracticePersistenceSnapshot, normalizeReviewEvents } from "./practicePersistence";
import {
  getKilledSupportMoments,
  getUnitIdFromLessonId,
  selectLessonSupportCandidate,
  summarizeSupportBudget,
} from "./supportSelection";
import type {
  LessonSessionRecord,
  LessonSupportCandidate,
  MasteryThemeState,
  MistakeItem,
  PracticeState,
  ReturnSessionItem,
  ReviewEvent,
  SupportBudgetSummary,
  SupportSurfaceRecord,
} from "./types";

type PracticeContextValue = PracticeState & { isHydrated: boolean };

const PracticeStateContext = createContext<PracticeContextValue | undefined>(undefined);

export function PracticeStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { planId } = useBillingState();
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [lessonSessions, setLessonSessions] = useState<LessonSessionRecord[]>([]);
  const [supportSurfaceHistory, setSupportSurfaceHistory] = useState<SupportSurfaceRecord[]>([]);
  const [activeReviewSupportCandidate, setActiveReviewSupportCandidate] = useState<LessonSupportCandidate | null>(null);
  const [masteryThemeStates, setMasteryThemeStates] = useState<MasteryThemeState[]>([]);
  const [mistakesHubSessionItems, setMistakesHubSessionItems] = useState<
    Array<{ itemId: string; lessonId: string }>
  >([]);
  const [returnSessionItems, setReturnSessionItems] = useState<ReturnSessionItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [mistakesCleared] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [contentVersion, setContentVersion] = useState<string | null>(null);
  const [curriculumUpdatedAtByUnit, setCurriculumUpdatedAtByUnit] = useState<Record<string, string>>({});
  const killedSupportKeysRef = React.useRef<Set<string>>(new Set());

  const userId = user?.id || "user_local";
  const SRS_INTERVALS = [0, 1, 3, 7, 14];

  useEffect(() => {
    if (!user) {
      setReviewEvents([]);
      setLessonSessions([]);
      setSupportSurfaceHistory([]);
      setActiveReviewSupportCandidate(null);
      setMasteryThemeStates([]);
      setMistakes([]);
      setMistakesHubSessionItems([]);
      setReturnSessionItems([]);
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
        setLessonSessions(saved.lessonSessions);
        setSupportSurfaceHistory(saved.supportSurfaceHistory);
        setMasteryThemeStates(saved.masteryThemeStates);
      },
      onError: (error) => {
        logDev("Practice local storage read failed:", error);
      },
    });
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateManifest() {
      try {
        const manifest = await getCachedManifest();
        if (!isMounted) return;
        setContentVersion(manifest?.content_version ?? null);
        setCurriculumUpdatedAtByUnit(
          Object.fromEntries(
            Object.entries(manifest?.curricula ?? {}).flatMap(([unit, meta]) =>
              typeof meta?.updated_at === "string" ? [[unit, meta.updated_at]] : []
            )
          )
        );
      } catch (error) {
        logDev("Practice manifest hydration failed:", error);
      }
    }

    void hydrateManifest();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    createPersistJsonEffect({
      userId: user?.id,
      isHydrated,
      key: "lessonSessions",
      value: lessonSessions,
    });
  }, [isHydrated, lessonSessions, user?.id]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: user?.id,
      isHydrated,
      key: "supportSurfaceHistory",
      value: supportSurfaceHistory,
    });
  }, [isHydrated, supportSurfaceHistory, user?.id]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: user?.id,
      isHydrated,
      key: "masteryThemeStates",
      value: masteryThemeStates,
    });
  }, [isHydrated, masteryThemeStates, user?.id]);

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

  const recordLessonSessionStart = (lessonId: string, questionIds: string[]) => {
    if (!lessonId || questionIds.length === 0) return;
    const startedAt = Date.now();
    setLessonSessions((prev) => {
      const existing = prev.find((record) => record.lessonId === lessonId);
      if (!existing) {
      return [
          ...prev,
          {
            lessonId,
            questionIds,
            lastStartedAt: startedAt,
            lastCompletedAt: null,
            lastAbandonedAt: null,
            abandonmentCount: 0,
            completionCount: 0,
            lastCompletedContentVersion: null,
            lastCompletedCurriculumUpdatedAt: null,
          },
        ];
      }

      return prev.map((record) =>
        record.lessonId === lessonId
          ? {
              ...record,
              questionIds,
              lastStartedAt: startedAt,
            }
          : record
      );
    });
  };

  const recordLessonSessionComplete = (lessonId: string) => {
    if (!lessonId) return;
    const completedAt = Date.now();
    const unit = getUnitIdFromLessonId(lessonId);
    const isMasteryLesson = isMasteryVariantId(lessonId);
    const curriculumUpdatedAt = unit ? curriculumUpdatedAtByUnit[unit] ?? null : null;
    setLessonSessions((prev) => {
      const existingIndex = prev.findIndex((record) => record.lessonId === lessonId);
      if (existingIndex < 0) {
        return prev;
      }

      const existingRecord = prev[existingIndex];
      const completedRecord: LessonSessionRecord = {
        ...existingRecord,
        lastCompletedAt: completedAt,
        completionCount: existingRecord.completionCount + 1,
        lastCompletedContentVersion: contentVersion,
        lastCompletedCurriculumUpdatedAt: curriculumUpdatedAt,
      };
      const nextSessions = prev.map((record, index) =>
        index === existingIndex ? completedRecord : record
      );

      if (unit) {
        setMasteryThemeStates((current) => {
          const existing =
            current.find((state) => state.themeId === unit) ??
            createEmptyMasteryThemeState({
              themeId: unit,
              parentUnitId: unit,
            });
          const nextEntry = isMasteryLesson
            ? completeMasteryVariant(existing, {
                variantId: lessonId,
                completionCount: completedRecord.completionCount,
                abandonmentCount: completedRecord.abandonmentCount,
              })
            : recordMasteryThemeEvidence(existing, {
                attemptDelta: 1,
                sceneId: lessonId,
                repeatWithoutDropoff:
                  completedRecord.abandonmentCount <= Math.max(1, completedRecord.completionCount),
                newLearningValueDelta: completedRecord.completionCount <= 1 ? 1 : 0.2,
                repetitionRisk:
                  completedRecord.completionCount <= 1
                    ? 0.15
                    : Math.min(1, completedRecord.completionCount / Math.max(2, existing.sceneIdsCleared.length + 1)),
                transferGainSlope: existing.transferImprovement ? 0.4 : existing.transferGainSlope,
              });
          return [...current.filter((state) => state.themeId !== unit), nextEntry];
        });
      }

      return nextSessions;
    });

    setSupportSurfaceHistory((prev) =>
      prev.map((record) => {
        if (record.lessonId !== lessonId || record.lifecycleState !== "started") {
          return record;
        }

        Analytics.track("course_support_completed", {
          source: "lesson_session",
          lessonId: record.lessonId,
          kind: record.kind,
          reason: record.reason,
        });

        return {
          ...record,
          lifecycleState: "completed",
        };
      })
    );
  };

  const recordLessonSessionAbandon = (lessonId: string) => {
    if (!lessonId) return;
    const abandonedAt = Date.now();
    setLessonSessions((prev) =>
      prev.map((record) => {
        if (record.lessonId !== lessonId) return record;
        const lastStart = record.lastStartedAt ?? 0;
        const lastCompletion = record.lastCompletedAt ?? 0;
        if (lastStart === 0 || lastCompletion >= lastStart) {
          return record;
        }

        return {
          ...record,
          lastAbandonedAt: abandonedAt,
          abandonmentCount: record.abandonmentCount + 1,
        };
      })
    );
  };

  const getLessonSupportCandidate = useCallback((): LessonSupportCandidate | null => {
    const completedThemeIds = Array.from(
      new Set(
        lessonSessions
          .filter((record) => record.completionCount > 0)
          .map((record) => getUnitIdFromLessonId(record.lessonId))
          .filter((themeId): themeId is string => typeof themeId === "string" && themeId.length > 0)
      )
    );

    return selectLessonSupportCandidate({
      lessonSessions,
      mistakes,
      curriculumUpdatedAtByUnit,
      supportSurfaceHistory,
      completedThemeIds,
    });
  }, [curriculumUpdatedAtByUnit, lessonSessions, mistakes, supportSurfaceHistory]);

  const getSupportBudgetSummary = useCallback((): SupportBudgetSummary => {
    return summarizeSupportBudget({
      supportSurfaceHistory,
    });
  }, [supportSurfaceHistory]);

  const getMasteryThemeState = useCallback(
    (themeId: string): MasteryThemeState | null =>
      masteryThemeStates.find((state) => state.themeId === themeId) ?? null,
    [masteryThemeStates]
  );

  const primeMasteryTheme = useCallback(
    (args: { themeId: string; availableVariantIds: string[]; maxActiveSlots?: number }) => {
      if (!args.themeId) return;
      setMasteryThemeStates((prev) => {
        const existing =
          prev.find((state) => state.themeId === args.themeId) ??
          createEmptyMasteryThemeState({
            themeId: args.themeId,
            maxActiveSlots: args.maxActiveSlots,
          });
        const baseState =
          typeof args.maxActiveSlots === "number" && args.maxActiveSlots !== existing.maxActiveSlots
            ? { ...existing, maxActiveSlots: Math.max(1, Math.floor(args.maxActiveSlots)) }
            : existing;
        const nextEntry = syncMasteryThemeSupply(baseState, {
          availableVariantIds: args.availableVariantIds,
        });
        return [...prev.filter((state) => state.themeId !== args.themeId), nextEntry];
      });
    },
    []
  );

  const registerMasteryVariant = useCallback(
    (args: { themeId: string; variantId: string; maxActiveSlots?: number }) => {
      if (!args.themeId || !args.variantId) return;
      setMasteryThemeStates((prev) => {
        const existing =
          prev.find((state) => state.themeId === args.themeId) ??
          createEmptyMasteryThemeState({
            themeId: args.themeId,
            maxActiveSlots: args.maxActiveSlots,
          });
        const nextEntry = registerMasteryVariantEntry(existing, args.variantId);
        return [...prev.filter((state) => state.themeId !== args.themeId), nextEntry];
      });
    },
    []
  );

  const retireMasteryVariant = useCallback((args: { themeId: string; variantId: string }) => {
    if (!args.themeId || !args.variantId) return;
    setMasteryThemeStates((prev) =>
      prev.map((state) =>
        state.themeId === args.themeId ? retireMasteryVariantEntry(state, args.variantId) : state
      )
    );
  }, []);

  const recordMasteryTransferOutcome = useCallback(
    (args: {
      themeId: string;
      transferImprovement?: boolean;
      repeatWithoutDropoff?: boolean;
      newLearningValueDelta?: number;
      transferGainSlope?: number;
      repetitionRisk?: number;
    }) => {
      if (!args.themeId) return;
      setMasteryThemeStates((prev) => {
        const existing =
          prev.find((state) => state.themeId === args.themeId) ??
          createEmptyMasteryThemeState({ themeId: args.themeId });
        const nextEntry = recordMasteryThemeEvidence(existing, {
          transferImprovement: args.transferImprovement,
          repeatWithoutDropoff: args.repeatWithoutDropoff,
          newLearningValueDelta: args.newLearningValueDelta,
          transferGainSlope: args.transferGainSlope,
          repetitionRisk: args.repetitionRisk,
        });
        return [...prev.filter((state) => state.themeId !== args.themeId), nextEntry];
      });
    },
    []
  );

  const recordSupportMomentSeen = useCallback((candidate: LessonSupportCandidate) => {
    const now = Date.now();
    setSupportSurfaceHistory((prev) => {
      const next = prev.filter((record) => now - record.ts <= 30 * 24 * 60 * 60 * 1000);
      const hasRecentDuplicate = next.some(
        (record) =>
          record.kind === candidate.kind &&
          record.lessonId === candidate.lessonId &&
          record.reason === candidate.reason &&
          now - record.ts < 6 * 60 * 60 * 1000
      );
      if (hasRecentDuplicate) {
        return prev;
      }

      return [
        ...next,
        {
          lessonId: candidate.lessonId,
          kind: candidate.kind,
          reason: candidate.reason,
          signalConfidence: candidate.signalConfidence,
          lifecycleState: "shown",
          ts: now,
        },
      ];
    });
  }, []);

  const markSupportMomentStarted = useCallback((candidate: LessonSupportCandidate) => {
    const now = Date.now();
    setSupportSurfaceHistory((prev) => {
      let updated = false;
      const next = prev.map((record, index) => {
        const isMatchingRecord =
          !updated &&
          record.lessonId === candidate.lessonId &&
          record.kind === candidate.kind &&
          record.reason === candidate.reason &&
          (record.lifecycleState === "shown" || record.lifecycleState === "started") &&
          now - record.ts <= 30 * 24 * 60 * 60 * 1000 &&
          index ===
            prev.reduce((latestIndex, current, currentIndex) => {
              if (
                current.lessonId === candidate.lessonId &&
                current.kind === candidate.kind &&
                current.reason === candidate.reason &&
                (current.lifecycleState === "shown" || current.lifecycleState === "started")
              ) {
                return currentIndex;
              }
              return latestIndex;
            }, -1);

        if (!isMatchingRecord) {
          return record;
        }

        updated = true;
        return {
          ...record,
          lifecycleState: "started" as const,
          startedAt: now,
        };
      });

      if (updated) {
        return next;
      }

      return [
        ...next,
        {
          lessonId: candidate.lessonId,
          kind: candidate.kind,
          reason: candidate.reason,
          signalConfidence: candidate.signalConfidence,
          lifecycleState: "started",
          ts: now,
          startedAt: now,
        },
      ];
    });
  }, []);

  const transitionSupportMomentLifecycle = useCallback(
    (candidate: LessonSupportCandidate, lifecycleState: SupportSurfaceRecord["lifecycleState"]) => {
      setSupportSurfaceHistory((prev) => {
        const next = [...prev];
        for (let index = next.length - 1; index >= 0; index -= 1) {
          const record = next[index];
          if (
            record.lessonId === candidate.lessonId &&
            record.kind === candidate.kind &&
            record.reason === candidate.reason &&
            (record.lifecycleState === "shown" || record.lifecycleState === "started")
          ) {
            next[index] = {
              ...record,
              lifecycleState,
            };
            return next;
          }
        }

        return prev;
      });
    },
    []
  );

  const activateReviewSupportSession = useCallback(
    (candidate: LessonSupportCandidate) => {
      markSupportMomentStarted(candidate);
      setActiveReviewSupportCandidate(candidate);
    },
    [markSupportMomentStarted]
  );

  const completeActiveReviewSupport = useCallback(() => {
    if (!activeReviewSupportCandidate) return;
    transitionSupportMomentLifecycle(activeReviewSupportCandidate, "completed");
    Analytics.track("course_support_completed", {
      source: "review_session",
      lessonId: activeReviewSupportCandidate.lessonId,
      kind: activeReviewSupportCandidate.kind,
      reason: activeReviewSupportCandidate.reason,
    });
    setActiveReviewSupportCandidate(null);
  }, [activeReviewSupportCandidate, transitionSupportMomentLifecycle]);

  const suppressActiveReviewSupport = useCallback(() => {
    if (!activeReviewSupportCandidate) return;
    transitionSupportMomentLifecycle(activeReviewSupportCandidate, "suppressed");
    Analytics.track("course_support_suppressed", {
      source: "review_session",
      lessonId: activeReviewSupportCandidate.lessonId,
      kind: activeReviewSupportCandidate.kind,
      reason: activeReviewSupportCandidate.reason,
    });
    setActiveReviewSupportCandidate(null);
  }, [activeReviewSupportCandidate, transitionSupportMomentLifecycle]);

  const clearMistakesHubSession = () => {
    setMistakesHubSessionItems([]);
  };

  const clearReturnSession = () => {
    setReturnSessionItems([]);
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

  const startReturnSession = () => {
    const candidate = getLessonSupportCandidate();
    if (!candidate || candidate.kind !== "return") {
      return { started: false as const, reason: "no_candidate" as const };
    }

    const sessionItems = candidate.questionIds
      .slice(0, 5)
      .map((itemId: string) => ({ itemId, lessonId: candidate.lessonId }))
      .filter((item: ReturnSessionItem) => item.itemId.length > 0);

    if (sessionItems.length < 3) {
      return { started: false as const, reason: "insufficient_data" as const };
    }

    setReturnSessionItems(sessionItems);
    activateReviewSupportSession(candidate);
    Analytics.track("return_session_started", {
      itemCount: sessionItems.length,
      lessonId: candidate.lessonId,
      reason: candidate.reason,
    });
    return { started: true as const };
  };

  useEffect(() => {
    const killedSupportMoments = getKilledSupportMoments({
      lessonSessions,
      supportSurfaceHistory,
    });
    if (killedSupportMoments.length === 0) {
      return;
    }

    const killedKeys = new Set(
      killedSupportMoments.map((record) =>
        [record.lessonId, record.kind, record.reason, String(record.ts)].join(":")
      )
    );

    setSupportSurfaceHistory((prev) => {
      let changed = false;
      const next = prev.map((record) => {
        const recordKey = [record.lessonId, record.kind, record.reason, String(record.ts)].join(":");
        if (
          !killedKeys.has(recordKey) ||
          (record.lifecycleState !== "shown" && record.lifecycleState !== "started")
        ) {
          return record;
        }

        changed = true;
        return {
          ...record,
          lifecycleState: "killed" as const,
        };
      });

      return changed ? next : prev;
    });

    killedSupportMoments.forEach((record) => {
      const analyticsKey = [record.lessonId, record.kind, record.reason, String(record.ts)].join(":");
      if (killedSupportKeysRef.current.has(analyticsKey)) {
        return;
      }
      killedSupportKeysRef.current.add(analyticsKey);
      Analytics.track("course_support_killed", {
        source: "runtime_guard",
        lessonId: record.lessonId,
        kind: record.kind,
        reason: record.reason,
        blockReason: record.blockReason,
      });
    });

    if (
      activeReviewSupportCandidate &&
      killedSupportMoments.some(
        (record) =>
          record.lessonId === activeReviewSupportCandidate.lessonId &&
          record.kind === activeReviewSupportCandidate.kind &&
          record.reason === activeReviewSupportCandidate.reason
      )
    ) {
      setActiveReviewSupportCandidate(null);
      if (activeReviewSupportCandidate.kind === "return") {
        setReturnSessionItems([]);
      }
    }
  }, [activeReviewSupportCandidate, lessonSessions, supportSurfaceHistory]);

  const value = useMemo<PracticeContextValue>(
    () => ({
      reviewEvents,
      addReviewEvent,
      lessonSessions,
      supportSurfaceHistory,
      masteryThemeStates,
      getSupportBudgetSummary,
      getMasteryThemeState,
      primeMasteryTheme,
      registerMasteryVariant,
      retireMasteryVariant,
      recordMasteryTransferOutcome,
      recordLessonSessionStart,
      recordLessonSessionComplete,
      recordLessonSessionAbandon,
      getLessonSupportCandidate,
      recordSupportMomentSeen,
      markSupportMomentStarted,
      activateReviewSupportSession,
      completeActiveReviewSupport,
      suppressActiveReviewSupport,
      startReturnSession,
      returnSessionItems,
      clearReturnSession,
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
    [
      canAccessMistakesHub,
      getMasteryThemeState,
      primeMasteryTheme,
      getSupportBudgetSummary,
      isHydrated,
      lessonSessions,
      masteryThemeStates,
      mistakes,
      mistakesCleared,
      mistakesHubRemaining,
      mistakesHubSessionItems,
      markSupportMomentStarted,
      activateReviewSupportSession,
      completeActiveReviewSupport,
      recordMasteryTransferOutcome,
      registerMasteryVariant,
      retireMasteryVariant,
      returnSessionItems,
      reviewEvents,
      suppressActiveReviewSupport,
      supportSurfaceHistory,
    ]
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
