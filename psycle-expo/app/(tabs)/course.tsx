import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import { GlobalHeaderMenu } from "../../components/GlobalHeaderMenu";
import { PaywallModal } from "../../components/PaywallModal";
import { CourseLeagueResultGate } from "../../components/course/CourseSections";
import { getLastWeekResult, type LeagueResult } from "../../lib/leagueReward";
import { buildCourseWorldViewModel } from "../../lib/courseWorld";
import { trailsByGenre } from "../../lib/data";
import { lessonSetHasResolvedId, resolveRuntimeLessonId } from "../../lib/lessonContinuity";
import { listAvailableMasteryLessonIds } from "../../lib/masteryInventory";
import { selectMasteryCandidate } from "../../lib/masteryCandidate";
import { useAuth } from "../../lib/AuthContext";
import { Analytics } from "../../lib/analytics";
import {
  getOnboardingPrimaryGenreToApply,
  loadPrimaryOnboardingGenre,
} from "../../lib/onboardingSelection";
import { isLessonLocked, shouldShowPaywall } from "../../lib/paywall";
import { useBillingState, useEconomyState, usePracticeState, useProgressionState } from "../../lib/state";
import { useToast } from "../../components/ToastProvider";
import type { TrailNode as CourseTrailNode } from "../../components/trail/types";
import type {
  EngagementPrimaryActionType,
  EngagementUserState,
} from "../../lib/analytics.types";

type CoursePrimaryActionTelemetry = {
  lessonId?: string;
  primaryActionType: EngagementPrimaryActionType;
  priorityRank: number;
  priorityReason: string;
  supportKind?: "return" | "adaptive" | "refresh" | "replay" | "mastery" | "streakRepair" | "comebackReward";
};

function getEngagementAppEnv(): "dev" | "prod" {
  return typeof __DEV__ !== "undefined" && __DEV__ ? "dev" : "prod";
}

function deriveEngagementUserState(params: {
  comebackRewardActive: boolean;
  completedLessonCount: number;
  hasAtRiskSupport: boolean;
  hasRecoverySupport: boolean;
}): EngagementUserState {
  if (params.completedLessonCount === 0) return "new_user";
  if (params.hasRecoverySupport || params.comebackRewardActive) return "lapsed";
  if (params.hasAtRiskSupport) return "at_risk";
  if (params.completedLessonCount <= 2) return "activated";
  if (params.completedLessonCount >= 7) return "stable";
  return "daily_active";
}

function getPrimaryActionTelemetry(
  model: NonNullable<ReturnType<typeof buildCourseWorldViewModel>>,
  masteryCandidate: ReturnType<typeof selectMasteryCandidate>
): CoursePrimaryActionTelemetry {
  const supportKind = model.supportMoment?.kind;

  if (supportKind === "streakRepair") {
    return {
      primaryActionType: "streak_repair",
      priorityRank: 3,
      priorityReason: "lapse_recovery",
      supportKind,
    };
  }

  if (supportKind === "comebackReward") {
    return {
      primaryActionType: "comeback_reward",
      priorityRank: 3,
      priorityReason: "comeback_reward_available",
      supportKind,
    };
  }

  if (
    supportKind === "return" ||
    supportKind === "adaptive" ||
    supportKind === "refresh" ||
    supportKind === "replay"
  ) {
    return {
      lessonId: model.currentLesson.lessonFile,
      primaryActionType: supportKind,
      priorityRank: supportKind === "return" ? 3 : 5,
      priorityReason: supportKind === "return" ? "return_reentry" : "short_support_available",
      supportKind,
    };
  }

  if (supportKind === "mastery") {
    return {
      lessonId: masteryCandidate?.lessonId,
      primaryActionType: "mastery",
      priorityRank: 4,
      priorityReason: "mastery_slot_open",
      supportKind,
    };
  }

  if (model.primaryAction.mode === "paywall") {
    return {
      lessonId: model.primaryAction.targetLessonFile,
      primaryActionType: "paywall",
      priorityRank: 8,
      priorityReason: "locked_lesson",
    };
  }

  if (model.primaryAction.mode === "review") {
    return {
      lessonId: model.primaryAction.targetLessonFile,
      primaryActionType: "review",
      priorityRank: 5,
      priorityReason: "review_node_current",
    };
  }

  return {
    lessonId: model.primaryAction.targetLessonFile,
    primaryActionType: "lesson",
    priorityRank: 1,
    priorityReason: "next_core_lesson",
  };
}

function lessonFileFromLessonId(lessonId: string): string | null {
  const resolvedLessonId = resolveRuntimeLessonId(lessonId).resolvedLessonId ?? lessonId;
  if (/_l\d+$/.test(resolvedLessonId) || /_m\d+$/.test(resolvedLessonId)) {
    return resolvedLessonId;
  }

  const [unit, levelRaw] = resolvedLessonId.split("_lesson_");
  const level = Number.parseInt(levelRaw ?? "", 10);
  if (!unit || !Number.isFinite(level)) return null;
  return `${unit}_l${String(level).padStart(2, "0")}`;
}

function buildCurrentTrail(
  selectedGenre: string,
  hasProAccess: boolean,
  completedLessons: Set<string>
): CourseTrailNode[] {
  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;

  return baseTrail.map((node, index) => {
    const lessonFile = node.lessonFile;
    if (!lessonFile) return node;

    const levelMatch = lessonFile.match(/_l(\d+)$/);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;
    const locked = isLessonLocked(selectedGenre, level, hasProAccess);
    if (locked) {
      return { ...node, status: "current", isLocked: true };
    }

    const isCompleted = lessonSetHasResolvedId(completedLessons, lessonFile);
    if (isCompleted) return { ...node, status: "done" };

    const prevNode = baseTrail[index - 1];
    const prevCompleted = prevNode?.lessonFile
      ? lessonSetHasResolvedId(completedLessons, prevNode.lessonFile)
      : true;
    if (index === 0 || prevCompleted) return { ...node, status: "current" };
    return { ...node, status: "locked" };
  });
}

export default function CourseScreen() {
  const {
    selectedGenre,
    setSelectedGenre,
    completedLessons,
    dailyGoal,
    dailyXP,
    streakRepairOffer,
    streak,
    purchaseStreakRepair,
    comebackRewardOffer,
  } = useProgressionState();
  const {
    activateReviewSupportSession,
    getLessonSupportCandidate,
    getMasteryThemeState,
    getSupportBudgetSummary,
    markSupportMomentStarted,
    primeMasteryTheme,
    recordSupportMomentSeen,
    startReturnSession,
  } = usePracticeState();
  const { hasProAccess } = useBillingState();
  const { setGemsDirectly } = useEconomyState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [menuVisible, setMenuVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallContextGenre, setPaywallContextGenre] = useState<string | null>(null);
  const [leagueResult, setLeagueResult] = useState<LeagueResult | null>(null);
  const [showLeagueResult, setShowLeagueResult] = useState(false);

  useEffect(() => {
    async function checkLeagueResult() {
      if (!user) return;
      const result = await getLastWeekResult(user.id);
      if (result.hasReward) {
        setLeagueResult(result);
        setShowLeagueResult(true);
      }
    }
    void checkLeagueResult();
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function applyOnboardingPrimaryGenre() {
      if (completedLessons.size > 0) return;
      const primaryGenreId = await loadPrimaryOnboardingGenre();
      if (cancelled) return;

      const genreIdToApply = getOnboardingPrimaryGenreToApply({
        completedLessonCount: completedLessons.size,
        primaryGenreId,
        selectedGenre,
      });
      if (!genreIdToApply) return;

      setSelectedGenre(genreIdToApply);
      Analytics.track("onboarding_primary_genre_applied", {
        previousGenreId: selectedGenre,
        genreId: genreIdToApply,
        surface: "course_world",
      });
    }

    void applyOnboardingPrimaryGenre();

    return () => {
      cancelled = true;
    };
  }, [completedLessons.size, selectedGenre, setSelectedGenre]);

  const currentTrail = useMemo(
    () => buildCurrentTrail(selectedGenre, hasProAccess, completedLessons),
    [selectedGenre, hasProAccess, completedLessons]
  );
  const availableMasteryVariantIds = useMemo(
    () => listAvailableMasteryLessonIds(selectedGenre),
    [selectedGenre]
  );
  const lessonSupportCandidate = getLessonSupportCandidate();

  useEffect(() => {
    primeMasteryTheme({
      themeId: selectedGenre,
      availableVariantIds: availableMasteryVariantIds,
    });
  }, [availableMasteryVariantIds, primeMasteryTheme, selectedGenre]);

  const masteryCandidate = useMemo(
    () =>
      selectMasteryCandidate({
        themeId: selectedGenre,
        currentTrail,
        completedLessons,
        masteryThemeState: getMasteryThemeState(selectedGenre),
      }),
    [completedLessons, currentTrail, getMasteryThemeState, selectedGenre]
  );
  const supportBudgetSummary = useMemo(() => getSupportBudgetSummary(), [getSupportBudgetSummary]);
  const lastSupportAnalyticsKeyRef = useRef<string | null>(null);
  const lastPrimaryActionShownKeyRef = useRef<string | null>(null);
  const lastReturnReasonShownKeyRef = useRef<string | null>(null);
  const nextActionNode = useMemo(
    () => currentTrail.find((node) => node.status === "current" && !!node.lessonFile),
    [currentTrail]
  );
  const model = useMemo(
    () =>
      buildCourseWorldViewModel({
        selectedGenre,
        currentTrail,
        lessonSupportCandidate,
        masteryCandidate,
        nextActionNode,
        supportBudgetSummary,
        streakRepairOffer,
        comebackRewardOffer,
      }),
    [
      selectedGenre,
      currentTrail,
      lessonSupportCandidate,
      masteryCandidate,
      nextActionNode,
      supportBudgetSummary,
      streakRepairOffer,
      comebackRewardOffer,
    ]
  );
  const activeComebackRewardOffer =
    comebackRewardOffer?.active && comebackRewardOffer.expiresAtMs > Date.now()
      ? comebackRewardOffer
      : null;
  const engagementUserState = useMemo(
    () =>
      deriveEngagementUserState({
        comebackRewardActive: Boolean(activeComebackRewardOffer),
        completedLessonCount: completedLessons.size,
        hasAtRiskSupport:
          lessonSupportCandidate?.kind === "adaptive" ||
          lessonSupportCandidate?.kind === "refresh" ||
          lessonSupportCandidate?.kind === "replay",
        hasRecoverySupport: lessonSupportCandidate?.kind === "return",
      }),
    [
      activeComebackRewardOffer,
      completedLessons.size,
      lessonSupportCandidate?.kind,
    ]
  );
  const primaryActionTelemetry = useMemo(
    () => (model ? getPrimaryActionTelemetry(model, masteryCandidate) : null),
    [masteryCandidate, model]
  );
  const returnReasonTelemetry = useMemo(() => {
    if (dailyGoal <= 0 || !primaryActionTelemetry) return null;
    const remainingXp = Math.max(0, dailyGoal - dailyXP);
    let reason:
      | "daily_goal_remaining"
      | "daily_goal_complete"
      | "streak_repair_available"
      | "comeback_reward_available"
      | "return_support_available" =
      remainingXp === 0 ? "daily_goal_complete" : "daily_goal_remaining";

    if (primaryActionTelemetry.supportKind === "streakRepair") {
      reason = "streak_repair_available";
    } else if (primaryActionTelemetry.supportKind === "comebackReward") {
      reason = "comeback_reward_available";
    } else if (primaryActionTelemetry.supportKind === "return") {
      reason = "return_support_available";
    }

    return {
      reason,
      remainingXp,
      primaryActionType: primaryActionTelemetry.primaryActionType,
      supportKind: primaryActionTelemetry.supportKind,
    } as const;
  }, [dailyGoal, dailyXP, primaryActionTelemetry]);

  useEffect(() => {
    if (!model || !primaryActionTelemetry) return;
    const analyticsKey = [
      selectedGenre,
      engagementUserState,
      primaryActionTelemetry.primaryActionType,
      primaryActionTelemetry.priorityRank,
      primaryActionTelemetry.lessonId ?? "none",
      primaryActionTelemetry.supportKind ?? "none",
    ].join(":");
    if (lastPrimaryActionShownKeyRef.current === analyticsKey) return;
    lastPrimaryActionShownKeyRef.current = analyticsKey;

    Analytics.track("engagement_primary_action_shown", {
      userState: engagementUserState,
      surface: "course_world",
      source: "course_world_model",
      primaryActionType: primaryActionTelemetry.primaryActionType,
      priorityRank: primaryActionTelemetry.priorityRank,
      priorityReason: primaryActionTelemetry.priorityReason,
      genreId: selectedGenre,
      lessonId: primaryActionTelemetry.lessonId,
      supportKind: primaryActionTelemetry.supportKind,
      appEnv: getEngagementAppEnv(),
    });
  }, [engagementUserState, model, primaryActionTelemetry, selectedGenre]);

  useEffect(() => {
    if (!returnReasonTelemetry) return;
    const analyticsKey = [
      selectedGenre,
      engagementUserState,
      returnReasonTelemetry.reason,
      dailyGoal,
      dailyXP,
      streak,
      returnReasonTelemetry.primaryActionType,
      returnReasonTelemetry.supportKind ?? "none",
    ].join(":");
    if (lastReturnReasonShownKeyRef.current === analyticsKey) return;
    lastReturnReasonShownKeyRef.current = analyticsKey;

    Analytics.track("engagement_return_reason_shown", {
      userState: engagementUserState,
      surface: "course_world",
      source: "course_world_habit_summary",
      reason: returnReasonTelemetry.reason,
      dailyGoal,
      dailyXp: dailyXP,
      remainingXp: returnReasonTelemetry.remainingXp,
      streak,
      genreId: selectedGenre,
      primaryActionType: returnReasonTelemetry.primaryActionType,
      supportKind: returnReasonTelemetry.supportKind,
      appEnv: getEngagementAppEnv(),
    });
  }, [
    dailyGoal,
    dailyXP,
    engagementUserState,
    returnReasonTelemetry,
    selectedGenre,
    streak,
  ]);

  useEffect(() => {
    if (!lessonSupportCandidate) return;
    if (model?.supportMoment?.kind !== lessonSupportCandidate.kind) return;
    recordSupportMomentSeen(lessonSupportCandidate);
  }, [
    model?.supportMoment?.kind,
    lessonSupportCandidate?.kind,
    lessonSupportCandidate?.lessonId,
    lessonSupportCandidate?.reason,
    recordSupportMomentSeen,
  ]);

  useEffect(() => {
    if (!lessonSupportCandidate) return;
    if (model?.supportMoment?.kind !== lessonSupportCandidate.kind) return;
    const analyticsKey = [
      lessonSupportCandidate.kind,
      lessonSupportCandidate.lessonId,
      lessonSupportCandidate.reason,
      supportBudgetSummary.weeklyUsed,
    ].join(":");
    if (lastSupportAnalyticsKeyRef.current === analyticsKey) return;
    lastSupportAnalyticsKeyRef.current = analyticsKey;

    Analytics.track("course_support_shown", {
      source: "course_world",
      lessonId: lessonSupportCandidate.lessonId,
      kind: lessonSupportCandidate.kind,
      reason: lessonSupportCandidate.reason,
      signalConfidence: lessonSupportCandidate.signalConfidence ?? "unknown",
      weeklySupportBudget: supportBudgetSummary.weeklyBudget,
      weeklySupportUsed: supportBudgetSummary.weeklyUsed,
      weeklySupportRemaining: supportBudgetSummary.weeklyRemaining,
      weeklyKindRemaining: supportBudgetSummary.weeklyKindRemaining[lessonSupportCandidate.kind],
    });
  }, [
    lessonSupportCandidate,
    model?.supportMoment?.kind,
    supportBudgetSummary.weeklyBudget,
    supportBudgetSummary.weeklyKindRemaining,
    supportBudgetSummary.weeklyRemaining,
    supportBudgetSummary.weeklyUsed,
  ]);

  useEffect(() => {
    if (!masteryCandidate?.lessonId) return;
    if (model?.supportMoment?.kind !== "mastery") return;
    const analyticsKey = [
      "mastery",
      masteryCandidate.lessonId,
      masteryCandidate.activeSlotsRemaining,
      masteryCandidate.graduationState,
      masteryCandidate.masteryCeilingState,
    ].join(":");
    if (lastSupportAnalyticsKeyRef.current === analyticsKey) return;
    lastSupportAnalyticsKeyRef.current = analyticsKey;

    Analytics.track("course_support_shown", {
      source: "course_world",
      lessonId: masteryCandidate.lessonId,
      kind: "mastery",
      reason: "mastery_slot_open",
      signalConfidence: "unknown",
      activeSlotsRemaining: masteryCandidate.activeSlotsRemaining,
      graduationState: masteryCandidate.graduationState,
      masteryCeilingState: masteryCandidate.masteryCeilingState,
    });
  }, [
    masteryCandidate?.activeSlotsRemaining,
    masteryCandidate?.graduationState,
    masteryCandidate?.lessonId,
    masteryCandidate?.masteryCeilingState,
    model?.supportMoment?.kind,
  ]);

  const handleLockedLessonAccess = async () => {
    const lessonCompleteCount = completedLessons.size;
    const allowed = shouldShowPaywall(lessonCompleteCount);
    Analytics.track("engagement_paywall_guardrail", {
      userState: engagementUserState,
      surface: "course_world",
      source: "locked_lesson_access",
      genreId: selectedGenre,
      lessonCompleteCount,
      allowed,
      blockedReason: allowed ? "eligible" : "below_lesson_complete_threshold",
      appEnv: getEngagementAppEnv(),
    });

    if (allowed) {
      setPaywallContextGenre(selectedGenre);
      setPaywallVisible(true);
      return;
    }

    showToast("このレッスンはまだ準備中です。");
  };

  const trackPrimaryActionStarted = (entrypoint: "primary_cta" | "node" | "support_card") => {
    if (!primaryActionTelemetry) return;
    Analytics.track("engagement_primary_action_started", {
      userState: engagementUserState,
      surface: "course_world",
      source: "course_world_model",
      primaryActionType: primaryActionTelemetry.primaryActionType,
      priorityRank: primaryActionTelemetry.priorityRank,
      entrypoint,
      genreId: selectedGenre,
      lessonId: primaryActionTelemetry.lessonId,
      supportKind: primaryActionTelemetry.supportKind,
      appEnv: getEngagementAppEnv(),
    });
  };

  const handleLaunchCurrent = (entrypoint: "primary_cta" | "node" = "primary_cta") => {
    if (!model) return;
    trackPrimaryActionStarted(entrypoint);

    if (model.primaryAction.mode === "paywall") {
      void handleLockedLessonAccess();
      return;
    }

    if (model.primaryAction.mode === "review") {
      router.replace("/review");
      return;
    }

    if (model.primaryAction.targetLessonFile) {
      router.replace(`/lesson?file=${model.primaryAction.targetLessonFile}&genre=${selectedGenre}`);
    }
  };

  const handleNodePress = (nodeId: string) => {
    if (!model) return;
    if (nodeId !== model.currentLesson.id) return;
    handleLaunchCurrent("node");
  };

  const handleSupportPress = () => {
    trackPrimaryActionStarted("support_card");
    const activeStreakRepairOffer =
      streakRepairOffer?.active && streakRepairOffer.expiresAtMs > Date.now() ? streakRepairOffer : null;
    if (activeStreakRepairOffer) {
      const result = purchaseStreakRepair();
      if (!result.success) {
        if (result.reason === "insufficient_gems") {
          showToast("ジェムが足りません。", "error");
          return;
        }
        if (result.reason === "expired") {
          showToast("オファーの期限が切れました。", "error");
        }
      }
      return;
    }

    if (!activeComebackRewardOffer) {
      if (lessonSupportCandidate?.kind === "return") {
        const returnStart = startReturnSession();
        if (returnStart.started) {
          Analytics.track("course_support_started", {
            source: "course_world",
            lessonId: lessonSupportCandidate.lessonId,
            kind: "return",
            reason: lessonSupportCandidate.reason,
          });
          router.replace("/review?mode=return");
        }
        return;
      }

      if (lessonSupportCandidate?.kind === "adaptive") {
        activateReviewSupportSession(lessonSupportCandidate);
        Analytics.track("course_support_started", {
          source: "course_world",
          lessonId: lessonSupportCandidate.lessonId,
          kind: "adaptive",
          reason: lessonSupportCandidate.reason,
        });
        router.replace("/review");
        return;
      }

      if (lessonSupportCandidate?.kind === "refresh" || lessonSupportCandidate?.kind === "replay") {
        const lessonFile = lessonFileFromLessonId(lessonSupportCandidate.lessonId);
        if (lessonFile) {
          markSupportMomentStarted(lessonSupportCandidate);
          Analytics.track("course_support_started", {
            source: "course_world",
            lessonId: lessonSupportCandidate.lessonId,
            kind: lessonSupportCandidate.kind,
            reason: lessonSupportCandidate.reason,
          });
          router.replace(`/lesson?file=${lessonFile}&genre=${selectedGenre}`);
        }
      }
      if (model?.supportMoment?.kind === "mastery" && masteryCandidate?.lessonId) {
        Analytics.track("course_support_started", {
          source: "course_world",
          lessonId: masteryCandidate.lessonId,
          kind: "mastery",
          reason: "mastery_slot_open",
          activeSlotsRemaining: masteryCandidate.activeSlotsRemaining,
        });
        router.replace(`/lesson?file=${masteryCandidate.lessonId}&genre=${selectedGenre}`);
      }
      return;
    }

    const startableNode = currentTrail.find(
      (node) => node.status === "current" && !node.isLocked && !!node.lessonFile
    );
    if (startableNode?.lessonFile) {
      router.replace(`/lesson?file=${startableNode.lessonFile}&genre=${selectedGenre}`);
    }
  };

  if (!model) {
    return <View style={styles.container} />;
  }

  const shouldShowFirstStepCopy = completedLessons.size === 0 || model.currentLesson.levelNumber <= 1;

  return (
    <View style={styles.container}>
      <CourseWorldHero
        model={model}
        nextLessonId={model.primaryAction.mode === "lesson" ? model.primaryAction.targetNodeId : undefined}
        onNodePress={handleNodePress}
        onPrimaryPress={handleLaunchCurrent}
        onSupportPress={handleSupportPress}
        onUnitPress={() => setMenuVisible(true)}
        showMeta={shouldShowFirstStepCopy}
        showPrimaryAction
        hideVisibleCopy={!shouldShowFirstStepCopy}
        heroOffsetY={shouldShowFirstStepCopy ? 8 : 42}
        habitSummary={{
          dailyGoal,
          dailyXP,
          streak,
        }}
      />

      <GlobalHeaderMenu
        menuVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectGenre={(genreId) => {
          setSelectedGenre(genreId);
          setMenuVisible(false);
        }}
        selectedGenre={selectedGenre}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => {
          Analytics.track("paywall_upgrade_clicked", {
            source: "course_world_paywall_modal",
            genreId: paywallContextGenre ?? selectedGenre,
            lessonCompleteCount: completedLessons.size,
          });
          router.push("/(tabs)/shop");
          setPaywallVisible(false);
          setPaywallContextGenre(null);
        }}
      />

      <CourseLeagueResultGate
        result={leagueResult}
        visible={showLeagueResult}
        onClaim={(claimedGems, claimedBadges, newBalance) => {
          if (newBalance !== undefined) {
            setGemsDirectly(newBalance);
          }
          showToast(`報酬を受け取りました: ${claimedGems}ジェム / ${claimedBadges.length}バッジ`, "success");
        }}
        onDismiss={() => setShowLeagueResult(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
});
