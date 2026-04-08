import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { StarBackground } from "../StarBackground";
import { QuestionRenderer } from "../QuestionRenderer";
import { XPGainAnimation } from "../XPGainAnimation";
import { Analytics } from "../../lib/analytics";
import { sounds } from "../../lib/sounds";
import { hapticFeedback } from "../../lib/haptics";
import i18n from "../../lib/i18n";
import type { Question } from "../../types/question";

export function LessonQuestionStage(props: {
  combo: number;
  currentIndex: number;
  currentQuestion: Question;
  isE2EAnalyticsMode: boolean;
  isReviewRound: boolean;
  lessonId?: string;
  onAnswer: (isCorrect: boolean, xp: number) => void;
  onComboChange: React.Dispatch<React.SetStateAction<number>>;
  questionsLength: number;
  xpAnimation: {
    visible: boolean;
    amount: number;
    key: number;
  };
}) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="lesson-screen">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <StarBackground combo={props.combo} />
      </View>

      <View style={styles.header}>
        {props.isReviewRound && (
          <View style={styles.reviewBadge}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.reviewText}>{i18n.t("lesson.reviewBadge")}</Text>
          </View>
        )}
        <Text style={styles.progress} testID="lesson-progress">
          {props.currentIndex + 1} / {props.questionsLength}
        </Text>
        {props.isE2EAnalyticsMode && (
          <Pressable
            onPress={() => router.replace("/(tabs)/course")}
            testID="lesson-e2e-exit"
            style={styles.e2eExitButton}
          >
            <Text style={styles.e2eExitText}>Exit</Text>
          </Pressable>
        )}
      </View>

      <QuestionRenderer
        key={props.currentIndex}
        question={props.currentQuestion}
        combo={props.combo}
        onContinue={props.onAnswer}
        onComboChange={props.onComboChange}
        onComboMilestone={(milestone, questionId) => {
          void sounds.play("fever");
          void hapticFeedback.medium();
          Analytics.track("combo_milestone_shown", {
            milestone,
            lessonId: props.lessonId,
            questionId,
          });
        }}
      />
      {props.xpAnimation.visible && <XPGainAnimation key={props.xpAnimation.key} amount={props.xpAnimation.amount} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  reviewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  progress: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  e2eExitButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.card,
  },
  e2eExitText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
