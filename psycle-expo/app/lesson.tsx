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
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../components/ToastProvider";
import { getComboXpConfig, getDoubleXpNudgeConfig } from "../lib/gamificationConfig";
import {
  DEFAULT_LESSON_SIZE,
  FIRST_SESSION_LESSON_SIZE,
  OPTIMAL_P_MAX,
  OPTIMAL_P_MIN,
} from "../lib/lesson/lessonDefaults";
import { useLessonLoader } from "../lib/lesson/useLessonLoader";
import { shouldSkipLessonEnergyCharge } from "../lib/lesson/lessonLaunchState";
import { useLessonRuntime } from "../lib/lesson/useLessonRuntime";
import { useLessonPostCompletion } from "../lib/lesson/useLessonPostCompletion";
import { LessonCompletionView } from "../components/lesson/LessonCompletionView";
import { LessonQuestionStage } from "../components/lesson/LessonQuestionStage";

const comboXpConfig = getComboXpConfig();
const doubleXpNudgeConfig = getDoubleXpNudgeConfig();

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const completionBottomInset = insets.bottom + theme.spacing.lg;
  const params = useLocalSearchParams<{
    chargeEnergy?: string;
    file: string;
    genre: string;
  }>();
  const fileParam = params.file;
  const skipEnergyCharge = shouldSkipLessonEnergyCharge({
    forceChargeParam: params.chargeEnergy,
    isDevelopment: __DEV__,
  });
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
  const nudgeStorageUserId = user?.id ?? "local";

  const { handleEnergyBlocked, handleLoadFailed, isE2EAnalyticsMode } = useLessonLoader({
    energy,
    maxEnergy,
    showToast,
  });

  const {
    activeLessonId,
    correctCount,
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
    energyBlocked,
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
    skipEnergyCharge,
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
    showDoubleXpNudge,
    setShowDoubleXpNudge,
    handleDoubleXpNudgePurchase,
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
        correctCount={correctCount}
        currentLesson={currentLesson}
        onDismissDoubleXpNudge={() => setShowDoubleXpNudge(false)}
        onPressPurchaseDoubleXp={handleDoubleXpNudgePurchase}
        originalQuestions={originalQuestions}
        showDoubleXpNudge={showDoubleXpNudge}
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

  if (energyBlocked) {
    return (
      <SafeAreaView style={styles.blockedScreen} testID="lesson-energy-blocked-screen">
        <StarBackground />
        <Text style={styles.blockedTitle}>{i18n.t("shop.energyStatus.title")}</Text>
        <Text style={styles.blockedMessage}>{i18n.t("lesson.energyBlockedMessage")}</Text>
      </SafeAreaView>
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
  blockedScreen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  blockedTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  blockedMessage: {
    color: theme.colors.sub,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
  },
});
