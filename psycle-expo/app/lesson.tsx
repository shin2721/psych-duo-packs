import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { theme } from "../lib/theme";
import {
  useBillingState,
  useEconomyState,
  usePracticeState,
  useProgressionState,
} from "../lib/state";
import { StarBackground } from "../components/StarBackground";
import { FireflyLoader } from "../components/FireflyLoader";
import i18n from "../lib/i18n";
import entitlements from "../config/entitlements.json";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../components/ToastProvider";
import { getComboXpConfig, getDoubleXpNudgeConfig } from "../lib/gamificationConfig";
import { useLessonLoader } from "../lib/lesson/useLessonLoader";
import { useLessonRuntime } from "../lib/lesson/useLessonRuntime";
import { useLessonPostCompletion } from "../lib/lesson/useLessonPostCompletion";
import { LessonCompletionView } from "../components/lesson/LessonCompletionView";
import { LessonQuestionStage } from "../components/lesson/LessonQuestionStage";

interface LessonDefaultsConfig {
  defaults?: {
    lesson_size?: number;
    first_session_lesson_size?: number;
    optimal_p_min?: number;
    optimal_p_max?: number;
  };
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

const lessonDefaults = entitlements as LessonDefaultsConfig;
const DEFAULT_LESSON_SIZE = normalizePositiveInt(lessonDefaults.defaults?.lesson_size, 10);
const FIRST_SESSION_LESSON_SIZE = normalizePositiveInt(
  lessonDefaults.defaults?.first_session_lesson_size,
  Math.min(5, DEFAULT_LESSON_SIZE)
);
const OPTIMAL_P_MIN =
  typeof lessonDefaults.defaults?.optimal_p_min === "number" ? lessonDefaults.defaults.optimal_p_min : 0.55;
const OPTIMAL_P_MAX =
  typeof lessonDefaults.defaults?.optimal_p_max === "number" ? lessonDefaults.defaults.optimal_p_max : 0.7;
const comboXpConfig = getComboXpConfig();
const doubleXpNudgeConfig = getDoubleXpNudgeConfig();

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const completionBottomInset = insets.bottom + theme.spacing.lg;
  const params = useLocalSearchParams<{ file: string; genre: string }>();
  const fileParam = params.file;
  const {
    completeLesson,
    addXp,
    incrementQuestMetric,
    quests,
    claimComebackRewardOnLessonComplete,
    questionsAnswered,
    recentAccuracy,
    skillConfidence,
    streakRepairOffer,
  } = useProgressionState();
  const {
    addReviewEvent,
    recordLessonSessionAbandon,
    recordLessonSessionComplete,
    recordLessonSessionStart,
  } = usePracticeState();
  const {
    consumeEnergy,
    lessonEnergyCost,
    tryTriggerStreakEnergyBonus,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    gems,
    buyDoubleXP,
    isDoubleXpActive,
  } = useEconomyState();
  const { isSubscriptionActive } = useBillingState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [combo, setCombo] = useState(0);
  const [showResearchDetails, setShowResearchDetails] = useState(false);
  const nudgeStorageUserId = user?.id ?? "local";
  const listSeparator = i18n.locale.startsWith("ja") ? "、" : ", ";

  const { handleEnergyBlocked, handleLoadFailed, isE2EAnalyticsMode } = useLessonLoader({
    energy,
    maxEnergy,
    showToast,
  });

  const {
    activeLessonId,
    currentIndex,
    currentLesson,
    currentQuestion,
    handleAnswer,
    isComplete,
    isReviewRound,
    loading,
    originalQuestions,
    questions,
    xpAnimation,
    canStart,
    loadError,
  } = useLessonRuntime({
    addQuestionXp: addXp,
    addReviewEvent,
    claimComebackRewardOnLessonComplete,
    comboBonusCapPerLesson: comboXpConfig.bonus_cap_per_lesson,
    comboXpConfig,
    completeLesson,
    consumeEnergy,
    energy,
    energyRefillMinutes,
    fileParam,
    difficultyPacing: {
      optimalPMax: OPTIMAL_P_MAX,
      optimalPMin: OPTIMAL_P_MIN,
      questionsAnswered,
      recentAccuracy,
      skillConfidence,
    },
    firstSessionLessonSize: FIRST_SESSION_LESSON_SIZE,
    lessonSize: DEFAULT_LESSON_SIZE,
    incrementQuestMetric,
    isSubscriptionActive,
    lastEnergyUpdateTime,
    lessonEnergyCost,
    maxEnergy,
    onEnergyBlocked: handleEnergyBlocked,
    onLoadFailed: handleLoadFailed,
    recordLessonSessionAbandon,
    recordLessonSessionComplete,
    recordLessonSessionStart,
    quests,
    streakRepairOffer,
    tryTriggerStreakEnergyBonus,
    userId: user?.id,
  });

  const {
    feltBetterSubmitted,
    lastShownInterventionId,
    showDoubleXpNudge,
    setShowDoubleXpNudge,
    submitFeltBetter,
    handleDoubleXpNudgePurchase,
    showFeltBetterPrompt,
  } = useLessonPostCompletion({
    addXp,
    buyDoubleXP,
    currentQuestion,
    dailyShowLimit: doubleXpNudgeConfig.daily_show_limit,
    enabled: doubleXpNudgeConfig.enabled,
    fileParam: activeLessonId ?? fileParam,
    gems,
    isComplete,
    isDoubleXpActive,
    minGems: doubleXpNudgeConfig.min_gems,
    nudgeStorageUserId,
    requireInactiveBoost: doubleXpNudgeConfig.require_inactive_boost,
    showToast,
  });

  if (isComplete) {
    return (
      <LessonCompletionView
        completionBottomInset={completionBottomInset}
        currentLesson={currentLesson}
        feltBetterSubmitted={feltBetterSubmitted}
        lastShownInterventionId={showFeltBetterPrompt ? lastShownInterventionId : null}
        listSeparator={listSeparator}
        onDismissDoubleXpNudge={() => setShowDoubleXpNudge(false)}
        onPressFeltBetter={(value) => {
          void submitFeltBetter(value);
        }}
        onPressPurchaseDoubleXp={handleDoubleXpNudgePurchase}
        originalQuestions={originalQuestions}
        setShowResearchDetails={setShowResearchDetails}
        showDoubleXpNudge={showDoubleXpNudge}
        showResearchDetails={showResearchDetails}
      />
    );
  }

  if (loading) {
    return (
      <View
        style={styles.loadingScreen}
        testID="lesson-loading-screen"
      >
        <StarBackground />
        <FireflyLoader />
        <Text style={[styles.loading, { marginTop: 20 }]}>{i18n.t("common.loading")}</Text>
      </View>
    );
  }

  if (loadError || !canStart || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container} testID="lesson-error-screen">
        <Text style={styles.loading}>{i18n.t("lesson.questionNotFound")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <LessonQuestionStage
      combo={combo}
      currentIndex={currentIndex}
      currentQuestion={currentQuestion}
      isE2EAnalyticsMode={isE2EAnalyticsMode}
      isReviewRound={isReviewRound}
      lessonId={activeLessonId ?? (typeof params.file === "string" ? params.file : undefined)}
      onAnswer={handleAnswer}
      onComboChange={setCombo}
      questionsLength={questions.length}
      xpAnimation={xpAnimation}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    fontSize: 18,
    color: theme.colors.sub,
    textAlign: "center",
    marginTop: 100,
  },
});
