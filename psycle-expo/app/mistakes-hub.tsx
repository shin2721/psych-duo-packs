import React, { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuestionRenderer, type Question } from "../components/QuestionRenderer";
import { Analytics } from "../lib/analytics";
import { getQuestionFromId } from "../lib/lessons";
import { SupportStatePanel } from "../components/SupportStatePanel";
import { usePracticeState, useProgressionState } from "../lib/state";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

export default function MistakesHubScreen() {
  const {
    mistakesHubSessionItems,
    clearMistakesHubSession,
    addReviewEvent,
  } = usePracticeState();
  const { addXp } = useProgressionState();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const completionTrackedRef = useRef(false);

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

  if (mistakesHubSessionItems.length === 0 || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} testID="mistakes-hub-screen">
        <View testID="mistakes-hub-empty" style={styles.statePanelWrap}>
          <SupportStatePanel
            icon="albums-outline"
            title={String(i18n.t("review.emptyTitle"))}
            body={String(i18n.t("mistakesHubButton.notEnoughData"))}
            ctaLabel={String(i18n.t("review.backToCourse"))}
            onPress={handleClose}
          />
        </View>
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
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          testID="mistakes-hub-close"
          accessibilityRole="button"
          accessibilityLabel={`${i18n.t("common.close")}: ${i18n.t("mistakesHub.title")}`}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    gap: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  statePanelWrap: {
    flex: 1,
  },
});
