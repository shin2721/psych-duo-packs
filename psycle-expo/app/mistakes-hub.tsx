import React, { useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuestionRenderer, type Question } from "../components/QuestionRenderer";
import { SupportStatePanel } from "../components/SupportStatePanel";
import { Analytics } from "../lib/analytics";
import { getQuestionFromId } from "../lib/lessons";
import { MistakesHubSessionHeader, MistakesHubStateView } from "../components/review/MistakesHubSections";
import { usePracticeState, useProgressionState } from "../lib/state";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

export default function MistakesHubScreen() {
  const {
    mistakesHubSessionItems,
    clearMistakesHubSession,
    addReviewEvent,
    canAccessMistakesHub,
    getMistakesHubItems,
    mistakesHubRemaining,
    startMistakesHubSession,
  } = usePracticeState();
  const { addXp } = useProgressionState();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const completionTrackedRef = useRef(false);
  const availableMistakesHubItems = getMistakesHubItems();
  const hasEnoughData = availableMistakesHubItems.length >= 5;

  const questions = useMemo<Question[]>(() => {
    return mistakesHubSessionItems
      .map((item) => getQuestionFromId(item.lessonId, item.itemId))
      .filter((question): question is Question => Boolean(question));
  }, [mistakesHubSessionItems]);

  const finishSession = (nextClearedCount: number) => {
    if (!completionTrackedRef.current) {
      completionTrackedRef.current = true;
      Analytics.track("mistakes_hub_session_completed", {
        itemCount: questions.length,
        clearedCount: nextClearedCount,
        source: "mistakes_hub_screen",
      });
    }

    clearMistakesHubSession();
    setIsComplete(true);
  };

  const handleClose = () => {
    clearMistakesHubSession();
    router.replace("/(tabs)/course");
  };

  const handleOpenShop = () => {
    clearMistakesHubSession();
    router.replace("/(tabs)/shop");
  };

  const handleStartSession = () => {
    const result = startMistakesHubSession();
    if (!result.started) {
      return;
    }

    setCurrentIndex(0);
    setClearedCount(0);
    setIsComplete(false);
    completionTrackedRef.current = false;
  };

  const handleContinue = (isCorrect: boolean, xp: number) => {
    const currentQuestion = questions[currentIndex];
    const currentItemId = currentQuestion?.source_id ?? currentQuestion?.id;
    const resolvedSessionItem = typeof currentItemId === "string"
      ? mistakesHubSessionItems.find((item) => item.itemId === currentItemId)
      : undefined;
    if (typeof currentItemId === "string" && resolvedSessionItem?.lessonId) {
      addReviewEvent({
        itemId: currentItemId,
        lessonId: resolvedSessionItem.lessonId,
        result: isCorrect ? "correct" : "incorrect",
      });
    }

    const nextClearedCount = isCorrect ? clearedCount + 1 : clearedCount;

    if (isCorrect) {
      addXp(xp);
      setClearedCount(nextClearedCount);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    finishSession(nextClearedCount);
  };

  if (!canAccessMistakesHub) {
    return (
      <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
        <MistakesHubStateView
          testID="mistakes-hub-locked"
          icon="lock-closed-outline"
          title={String(i18n.t("mistakesHubButton.titleLocked"))}
          body={`${String(i18n.t("mistakesHubButton.statusLocked"))}\n\n${String(
            i18n.t("mistakesHubButton.routeHintLocked")
          )}`}
          ctaLabel={String(i18n.t("tabs.shop"))}
          onPress={handleOpenShop}
        />
      </SafeAreaView>
    );
  }

  if (mistakesHubSessionItems.length === 0) {
    if (!hasEnoughData) {
      return (
        <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
          <MistakesHubStateView
            testID="mistakes-hub-insufficient"
            icon="albums-outline"
            title={String(i18n.t("mistakesHubButton.titleAvailable"))}
            body={`${String(i18n.t("mistakesHubButton.notEnoughData"))}\n\n${String(
              i18n.t("mistakesHubButton.routeHintInsufficientData")
            )}`}
            ctaLabel={String(i18n.t("review.backToCourse"))}
            onPress={handleClose}
          />
        </SafeAreaView>
      );
    }

    const sessionStatus = mistakesHubRemaining === null
      ? String(i18n.t("mistakesHubButton.statusUnlimited"))
      : String(
          i18n.t("mistakesHubButton.statusRemaining", {
            remaining: mistakesHubRemaining,
          })
        );

    return (
      <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
        <MistakesHubStateView
          testID="mistakes-hub-ready"
          icon="play-circle-outline"
          title={String(i18n.t("mistakesHubButton.titleAvailable"))}
          body={`${String(i18n.t("mistakesHubButton.routeHintReady"))}\n\n${String(
            i18n.t("mistakesHubButton.itemCountReady", {
              count: availableMistakesHubItems.length,
            })
          )}\n${sessionStatus}`}
          ctaLabel={String(
            i18n.t("review.startButton", {
              count: Math.min(availableMistakesHubItems.length, 10),
            })
          )}
          onPress={handleStartSession}
        />
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
        <MistakesHubStateView
          testID="mistakes-hub-empty"
          icon="alert-circle-outline"
          title={String(i18n.t("common.error"))}
          body={String(i18n.t("common.unexpectedError"))}
          ctaLabel={String(i18n.t("review.backToCourse"))}
          onPress={handleClose}
        />
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
        <SupportStatePanel
          icon="sparkles-outline"
          title={String(i18n.t("review.doneTitle"))}
          body={String(
            i18n.t("review.resultSummary", {
              total: questions.length,
              cleared: clearedCount,
            })
          )}
          ctaLabel={String(i18n.t("review.backToCourse"))}
          onPress={() => router.replace("/(tabs)/course")}
        />
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
      <MistakesHubSessionHeader progress={(currentIndex + 1) / questions.length} onClose={handleClose} />

      <QuestionRenderer
        question={currentQuestion}
        onContinue={handleContinue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
