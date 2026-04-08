import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import type { QuestionInteractionProps } from "./QuestionInteraction.shared";

export function QuestionSubmitFooter({
  onSubmitOrder,
  question,
  selectedIndexes,
  showResult,
}: Pick<QuestionInteractionProps, "onSubmitOrder" | "question" | "selectedIndexes" | "showResult">) {
  if (showResult) return null;

  if (question.type === "select_all") {
    return (
      <Pressable
        style={[styles.submitButton, selectedIndexes.length === 0 && styles.submitButtonDisabled]}
        onPress={onSubmitOrder}
        disabled={selectedIndexes.length === 0}
      >
        <Text style={styles.submitButtonText}>{i18n.t("questionRenderer.submit")}</Text>
      </Pressable>
    );
  }

  if (question.type === "sort_order") {
    return (
      <Pressable style={styles.submitButton} onPress={onSubmitOrder}>
        <Text style={styles.submitButtonText}>{i18n.t("questionRenderer.checkAnswer")}</Text>
      </Pressable>
    );
  }

  if (question.type === "term_card") {
    return (
      <Pressable
        style={styles.continueButton}
        onPress={onSubmitOrder}
        testID="question-continue"
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("lesson.continue"))}
      >
        <Text style={styles.continueButtonText}>{i18n.t("lesson.continue")}</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </Pressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  continueButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
