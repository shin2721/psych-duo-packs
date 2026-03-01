import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuestionRenderer, type Question } from "../components/QuestionRenderer";
import { Analytics } from "../lib/analytics";
import { getQuestionFromId } from "../lib/lessons";
import { useAppState } from "../lib/state";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

export default function MistakesHubScreen() {
  const {
    mistakesHubSessionItems,
    clearMistakesHubSession,
    addXp,
  } = useAppState();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const completionTrackedRef = useRef(false);

  const questions = useMemo<Question[]>(() => {
    return mistakesHubSessionItems
      .map((item) => getQuestionFromId(item.lessonId, item.itemId))
      .filter((question): question is Question => Boolean(question));
  }, [mistakesHubSessionItems]);

  useEffect(() => {
    if (mistakesHubSessionItems.length > 0) return;
    Alert.alert(
      String(i18n.t("common.error")),
      String(i18n.t("mistakesHubButton.notEnoughData")),
      [{ text: String(i18n.t("common.ok")), onPress: () => router.back() }]
    );
  }, [mistakesHubSessionItems.length]);

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
    router.back();
  };

  const handleContinue = (isCorrect: boolean, xp: number) => {
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

  if (mistakesHubSessionItems.length === 0) {
    return <SafeAreaView style={styles.container} />;
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{i18n.t("review.emptyTitle")}</Text>
          <Text style={styles.emptyText}>{i18n.t("mistakesHubButton.notEnoughData")}</Text>
          <Pressable style={styles.primaryButton} onPress={handleClose}>
            <Text style={styles.primaryButtonText}>{i18n.t("review.backToCourse")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>{i18n.t("review.doneTitle")}</Text>
          <Text style={styles.resultBody}>
            {i18n.t("review.resultSummary", {
              total: questions.length,
              cleared: clearedCount,
            })}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>{i18n.t("review.backToCourse")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.sub,
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  resultBody: {
    fontSize: 16,
    color: theme.colors.sub,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
