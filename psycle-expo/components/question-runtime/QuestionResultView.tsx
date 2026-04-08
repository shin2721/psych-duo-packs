import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { InsightText } from "../InsightText";
import { getEvidenceSummary } from "../../lib/evidenceSummary";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import type { Question } from "../../types/question";
import type { QuestionRuntime } from "./createQuestionRuntime";

interface Props {
  onContinue: () => void;
  onOpenEvidence: () => void;
  onToggleExplanationDetails: () => void;
  question: Question;
  runtime: QuestionRuntime;
  showExplanationDetails: boolean;
}

export function QuestionResultView({
  onContinue,
  onOpenEvidence,
  onToggleExplanationDetails,
  question,
  runtime,
  showExplanationDetails,
}: Props) {
  const positiveFeedbacks = [
    i18n.t("questionRenderer.feedback.correct1"),
    i18n.t("questionRenderer.feedback.correct2"),
    i18n.t("questionRenderer.feedback.correct3"),
    i18n.t("questionRenderer.feedback.correct4"),
    i18n.t("questionRenderer.feedback.correct5"),
  ];

  const navigationFeedbacks = [
    i18n.t("questionRenderer.feedback.incorrect1"),
    i18n.t("questionRenderer.feedback.incorrect2"),
    i18n.t("questionRenderer.feedback.incorrect3"),
    i18n.t("questionRenderer.feedback.incorrect4"),
  ];

  const summary = runtime.hasEvidence
    ? getEvidenceSummary(runtime.expandedDetails)
    : null;

  return (
    <View
      style={[
        styles.resultBox,
        runtime.isSurveyMode
          ? styles.surveyBox
          : runtime.isCorrect
            ? styles.correctBox
            : styles.incorrectBox,
      ]}
    >
      {!runtime.isSurveyMode && (
        <View style={styles.resultHeader}>
          <Ionicons
            name={runtime.isCorrect ? "checkmark-circle" : "close-circle"}
            size={32}
            color={runtime.isCorrect ? theme.colors.success : theme.colors.error}
          />
          <Text
            style={[
              styles.resultTitle,
              runtime.isCorrect ? styles.correctText : styles.incorrectText,
            ]}
          >
            {runtime.isCorrect
              ? positiveFeedbacks[Math.floor(Math.random() * positiveFeedbacks.length)]
              : navigationFeedbacks[
                  Math.floor(Math.random() * navigationFeedbacks.length)
                ]}
          </Text>
        </View>
      )}

      {!runtime.isCorrect && runtime.correctAnswerText ? (
        <View style={styles.correctAnswerBox}>
          <Text style={styles.correctAnswerLabel}>
            {runtime.correctAnswerLabel}
          </Text>
          <Text style={styles.correctAnswerText}>{runtime.correctAnswerText}</Text>
        </View>
      ) : null}

      <AnimatedButton
        style={styles.continueButton}
        onPress={onContinue}
        testID="question-continue"
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("lesson.continue"))}
      >
        <Text style={styles.continueButtonText}>{i18n.t("lesson.continue")}</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </AnimatedButton>

      {runtime.isCorrect ? (
        <InsightText
          text={runtime.explanationText}
          style={[
            styles.explanation,
            runtime.isSurveyMode && styles.surveyExplanation,
          ]}
        />
      ) : (
        <View style={styles.incorrectFeedbackContainer}>
          {summary ? (
            <View style={styles.actionHintContainer}>
              <Text style={styles.actionHintText}>💡 {summary.actionHint}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onToggleExplanationDetails}
            style={styles.detailsToggleButton}
          >
            <Text style={styles.detailsToggleButtonText}>
              {showExplanationDetails
                ? i18n.t("lesson.closeDetails")
                : i18n.t("lesson.showDetails")}
            </Text>
          </TouchableOpacity>

          {showExplanationDetails ? (
            <View style={styles.expandedDetails}>
              <InsightText
                text={runtime.explanationText}
                style={[styles.explanation, { marginTop: 8 }]}
              />

              {runtime.expandedDetails?.claim_type === "intervention" && summary ? (
                <View style={styles.evidenceCompactRow}>
                  <Text style={styles.evidenceCompactLabel}>
                    {summary.valueLabel}：{summary.tryValue}
                  </Text>
                  <Text style={styles.evidenceCompactNote}>{summary.note}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      {runtime.isCorrect && question.evidence_grade && runtime.hasEvidence ? (
        <Pressable
          onPress={onOpenEvidence}
          style={({ pressed }) => [
            styles.evidenceBadge,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.evidenceText}>
            {i18n.t("questionRenderer.evidenceAvailable")}
          </Text>
        </Pressable>
      ) : null}

      {question.actionable_advice ? (
        <View style={styles.actionAdviceContainer}>
          <Text style={styles.actionAdviceText}>{question.actionable_advice}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionAdviceContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
  },
  actionAdviceText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  actionHintContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
  },
  actionHintText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  correctAnswerBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  correctAnswerLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  correctAnswerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  correctBox: {
    borderColor: "rgba(34, 197, 94, 0.45)",
  },
  correctText: {
    color: theme.colors.success,
  },
  detailsToggleButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  detailsToggleButtonText: {
    color: "#9dd9ff",
    fontSize: 14,
    fontWeight: "700",
  },
  evidenceBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  evidenceCompactLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  evidenceCompactNote: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
  },
  evidenceCompactRow: {
    gap: 6,
    marginTop: 12,
  },
  evidenceText: {
    fontSize: 11,
    color: "#aaa",
  },
  expandedDetails: {
    marginTop: 4,
  },
  explanation: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  incorrectBox: {
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  incorrectFeedbackContainer: {
    gap: 12,
    marginTop: 16,
  },
  incorrectText: {
    color: theme.colors.error,
  },
  resultBox: {
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginTop: 24,
    padding: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  surveyBox: {
    borderColor: "rgba(255,255,255,0.12)",
  },
  surveyExplanation: {
    color: "#fff",
  },
});
