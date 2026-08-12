import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { InsightText } from "../InsightText";
import { getEvidenceSummary } from "../../lib/evidenceSummary";
import i18n from "../../lib/i18n";
import { resolveIncorrectFeedbackHint } from "../../lib/lesson/incorrectFeedbackHint";
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
  const incorrectFeedbackHint = resolveIncorrectFeedbackHint(
    question,
    summary?.actionHint ?? null
  );

  // 予想カード（先に賭けてから答え合わせする形式）は、外した時こそ本文が要る。
  // 賭けた結果を「詳しく見る」の裏に隠すと、答え合わせが成立しない。
  const isBetCard = question.type === "number_bet" || question.bet_card === true;
  const showExplanationInline = runtime.isCorrect || isBetCard;
  const betHeadline = runtime.isCorrect ? "当たり" : "はずれ";
  // 賭けの外れは誤答ではなく測定結果。赤×ではなく金色（実際の値の色）で返す。
  const isBetMiss = isBetCard && !runtime.isCorrect;

  return (
    <View
      style={[
        styles.resultBox,
        runtime.isSurveyMode
          ? styles.surveyBox
          : runtime.isCorrect
            ? styles.correctBox
            : isBetMiss
              ? styles.betMissBox
              : styles.incorrectBox,
      ]}
    >
      {!runtime.isSurveyMode && (
        <View style={styles.resultHeader}>
          <Ionicons
            name={
              runtime.isCorrect
                ? "checkmark-circle"
                : isBetMiss
                  ? "swap-horizontal"
                  : "close-circle"
            }
            size={32}
            color={
              runtime.isCorrect
                ? theme.colors.success
                : isBetMiss
                  ? BET_TRUTH
                  : theme.colors.error
            }
          />
          <Text
            style={[
              styles.resultTitle,
              runtime.isCorrect
                ? styles.correctText
                : isBetMiss
                  ? styles.betMissText
                  : styles.incorrectText,
            ]}
          >
            {isBetCard
              ? betHeadline
              : runtime.isCorrect
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

      {!isBetCard ? (
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
      ) : null}

      {showExplanationInline ? (
        <>
          {runtime.explanationText
            .split("\n\n")
            .filter((paragraph) => paragraph.trim().length > 0)
            .map((paragraph, index) => (
              <InsightText
                key={index}
                text={paragraph}
                style={[
                  styles.explanation,
                  index === 0 && styles.explanationLead,
                  runtime.isSurveyMode && styles.surveyExplanation,
                ]}
              />
            ))}
          {question.caveat ? (
            <View style={styles.caveatBox} testID="question-caveat">
              <Text style={styles.caveatLabel}>ただし</Text>
              <Text style={styles.caveatText}>{question.caveat}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.incorrectFeedbackContainer}>
          {incorrectFeedbackHint ? (
            <View style={styles.actionHintContainer}>
              <Text style={styles.actionHintText}>💡 {incorrectFeedbackHint}</Text>
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

      {isBetCard ? (
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
      ) : null}
    </View>
  );
}

const BET_TRUTH = "#E5A93C";

const styles = StyleSheet.create({
  caveatBox: {
    borderLeftColor: "rgba(148,163,184,0.45)",
    borderLeftWidth: 2,
    marginTop: 16,
    paddingLeft: 12,
  },
  caveatLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  caveatText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 21,
  },
  betMissBox: {
    borderColor: "rgba(229, 169, 60, 0.5)",
  },
  betMissText: {
    color: BET_TRUTH,
  },
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
    color: "#e6ebf2",
    fontSize: 15,
    lineHeight: 25,
    marginTop: 14,
  },
  // 最初の段落は結論。少しだけ格を上げて、走り読みでも一行目が残るようにする。
  explanationLead: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 27,
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
