import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { StarBackground } from "../StarBackground";
import { VictoryConfetti } from "../VictoryConfetti";
import { getEvidenceSummary, getTryValueColor } from "../../lib/evidenceSummary";
import { XP_REWARDS } from "../../lib/streaks";
import i18n from "../../lib/i18n";
import type { Lesson } from "../../lib/lessons";
import type { Question } from "../../types/question";

export function LessonCompletionView(props: {
  completionBottomInset: number;
  currentLesson: Lesson | null;
  feltBetterSubmitted: boolean;
  lastShownInterventionId: string | null;
  listSeparator: string;
  originalQuestions: Question[];
  onDismissDoubleXpNudge: () => void;
  onPressFeltBetter: (value: -2 | -1 | 0 | 1 | 2) => void;
  onPressPurchaseDoubleXp: () => void;
  setShowResearchDetails: React.Dispatch<React.SetStateAction<boolean>>;
  showDoubleXpNudge: boolean;
  showResearchDetails: boolean;
}) {
  const meta = props.currentLesson?.research_meta;
  const ref = props.currentLesson?.references?.[0];
  const expandedDetails = props.originalQuestions.find((q) => q.expanded_details)?.expanded_details;
  const evidenceSummary = getEvidenceSummary(expandedDetails);
  const tryValueColor = getTryValueColor(evidenceSummary.tryValue);
  const claimTypeLabels: Record<string, string> = {
    observation: i18n.t("lesson.claimType.observation"),
    theory: i18n.t("lesson.claimType.theory"),
    intervention: i18n.t("lesson.claimType.intervention"),
  };
  const evidenceTypeLabels: Record<string, string> = {
    direct: i18n.t("lesson.evidenceType.direct"),
    indirect: i18n.t("lesson.evidenceType.indirect"),
    theoretical: i18n.t("lesson.evidenceType.theoretical"),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="lesson-complete-screen">
      <StarBackground />
      <VictoryConfetti />

      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView contentContainerStyle={[styles.completionContainer, { paddingBottom: props.completionBottomInset }]}>
          <Text style={styles.completionTitle}>{i18n.t("lesson.completeTitle")}</Text>
          <Text style={styles.completionSub}>+{XP_REWARDS.LESSON_COMPLETE} XP</Text>

          {!props.feltBetterSubmitted && props.lastShownInterventionId && (
            <View style={styles.feltBetterContainer}>
              <Text style={styles.feltBetterTitle}>{i18n.t("lesson.howDoYouFeelNow")}</Text>
              <View style={styles.feltBetterRow}>
                {[
                  { value: -2 as const, emoji: "😢" },
                  { value: -1 as const, emoji: "😕" },
                  { value: 0 as const, emoji: "😐" },
                  { value: 1 as const, emoji: "😊" },
                  { value: 2 as const, emoji: "😄" },
                ].map((item) => (
                  <TouchableOpacity key={item.value} style={styles.feltBetterButton} onPress={() => props.onPressFeltBetter(item.value)}>
                    <Text style={styles.feltBetterEmoji}>{item.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {props.feltBetterSubmitted && (
            <View style={styles.feltBetterThanks}>
              <Text style={styles.feltBetterThanksText}>{i18n.t("lesson.feedbackThanks")}</Text>
            </View>
          )}

          {props.showDoubleXpNudge && (
            <View style={styles.doubleXpNudgeCard}>
              <Text style={styles.doubleXpNudgeTitle}>{i18n.t("lesson.doubleXpNudge.title")}</Text>
              <Text style={styles.doubleXpNudgeBody}>{i18n.t("lesson.doubleXpNudge.body")}</Text>
              <View style={styles.doubleXpNudgeActions}>
                <TouchableOpacity style={styles.doubleXpNudgeDismissButton} onPress={props.onDismissDoubleXpNudge}>
                  <Text style={styles.doubleXpNudgeDismissText}>{i18n.t("lesson.doubleXpNudge.dismiss")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doubleXpNudgeCtaButton} onPress={props.onPressPurchaseDoubleXp}>
                  <Text style={styles.doubleXpNudgeCtaText}>{i18n.t("lesson.doubleXpNudge.cta")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.breakdownContainer}>
            <View style={styles.tryValueSummary}>
              <Text style={styles.actionHint}>{evidenceSummary.actionHint}</Text>
              {expandedDetails?.claim_type === "intervention" && (
                <>
                  <View style={styles.tryValueRow}>
                    <Text style={styles.tryValueLabel}>{evidenceSummary.valueLabel}：</Text>
                    <View style={[styles.tryValueBadge, { backgroundColor: tryValueColor }]}>
                      <Text style={styles.tryValueText}>{evidenceSummary.tryValue}</Text>
                    </View>
                  </View>
                  <Text style={styles.basisLabel}>
                    {i18n.t("lesson.basisLabelPrefix")}
                    {evidenceSummary.basisLabel}
                  </Text>
                </>
              )}
              <Text style={styles.safetyNote}>{evidenceSummary.note}</Text>
            </View>

            <TouchableOpacity
              onPress={() => props.setShowResearchDetails(!props.showResearchDetails)}
              style={styles.detailsToggle}
            >
              <Text style={styles.detailsToggleText}>
                {props.showResearchDetails ? i18n.t("lesson.closeDetails") : i18n.t("lesson.showDetails")}
              </Text>
            </TouchableOpacity>

            {props.showResearchDetails && expandedDetails && (
              <>
                <Text style={styles.readingGuide}>{i18n.t("lesson.readingGuide")}</Text>
                {expandedDetails.best_for && expandedDetails.best_for.length > 0 && (
                  <View style={styles.applicabilitySection}>
                    <Text style={styles.applicabilityHeader}>{i18n.t("lesson.bestForHeader")}</Text>
                    <Text style={styles.applicabilityText}>{expandedDetails.best_for.join(props.listSeparator)}</Text>
                  </View>
                )}
                {expandedDetails.limitations && expandedDetails.limitations.length > 0 && (
                  <View style={styles.limitationsSection}>
                    <Text style={styles.limitationsHeader}>{i18n.t("lesson.limitationsHeader")}</Text>
                    <Text style={styles.limitationsText}>{expandedDetails.limitations.join(props.listSeparator)}</Text>
                  </View>
                )}
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {expandedDetails.claim_type
                        ? claimTypeLabels[expandedDetails.claim_type] || expandedDetails.claim_type
                        : i18n.t("common.unknown")}
                    </Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {expandedDetails.evidence_type
                        ? evidenceTypeLabels[expandedDetails.evidence_type] || expandedDetails.evidence_type
                        : i18n.t("common.unknown")}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {!expandedDetails && meta && (
              <>
                <View style={styles.theoryBox}>
                  <Text style={styles.theoryName}>{meta.theory}</Text>
                  <Text style={styles.theoryAuthors}>{meta.primary_authors.join(" & ")}（{meta.year}）</Text>
                </View>
                {meta.best_for && meta.best_for.length > 0 && (
                  <View style={styles.applicabilitySection}>
                    <Text style={styles.applicabilityHeader}>{i18n.t("lesson.bestForHeader")}</Text>
                    <Text style={styles.applicabilityText}>{meta.best_for.join(props.listSeparator)}</Text>
                  </View>
                )}
              </>
            )}

            {!expandedDetails && !meta && ref && (
              <View style={styles.theorySection}>
                <Text style={styles.theoryText}>
                  {i18n.t("lesson.basedOnResearchPrefix")}
                  {"\n"}
                  {ref.citation}
                  {i18n.t("lesson.basedOnResearchSuffix")}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/course")}
            style={styles.continueButton}
            testID="lesson-complete-continue"
            accessibilityRole="button"
            accessibilityLabel={String(i18n.t("lesson.continue"))}
          >
            <Text style={styles.continueText}>{i18n.t("lesson.continue")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  completionContainer: { padding: theme.spacing.lg },
  completionTitle: { fontSize: 32, fontWeight: "800", color: theme.colors.text, textAlign: "center", marginTop: 16 },
  completionSub: { fontSize: 18, fontWeight: "700", color: theme.colors.accent, textAlign: "center", marginTop: 8, marginBottom: 24 },
  feltBetterContainer: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  feltBetterTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 12, textAlign: "center" },
  feltBetterRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  feltBetterButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.surface },
  feltBetterEmoji: { fontSize: 28 },
  feltBetterThanks: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  feltBetterThanksText: { fontSize: 15, fontWeight: "700", color: theme.colors.success, textAlign: "center" },
  doubleXpNudgeCard: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.line },
  doubleXpNudgeTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text, marginBottom: 8 },
  doubleXpNudgeBody: { fontSize: 14, color: theme.colors.sub, lineHeight: 20, marginBottom: 12 },
  doubleXpNudgeActions: { flexDirection: "row", gap: 10 },
  doubleXpNudgeDismissButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: "center" },
  doubleXpNudgeDismissText: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  doubleXpNudgeCtaButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: "center" },
  doubleXpNudgeCtaText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  breakdownContainer: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  tryValueSummary: { marginBottom: 12 },
  actionHint: { fontSize: 15, fontWeight: "700", color: theme.colors.text, marginBottom: 8 },
  tryValueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  tryValueLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.sub },
  tryValueBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tryValueText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  basisLabel: { fontSize: 13, color: theme.colors.sub, marginBottom: 6 },
  safetyNote: { fontSize: 13, color: theme.colors.sub, lineHeight: 18 },
  detailsToggle: { alignSelf: "flex-start", marginBottom: 12 },
  detailsToggleText: { fontSize: 14, fontWeight: "700", color: theme.colors.accent },
  readingGuide: { fontSize: 13, color: theme.colors.sub, marginBottom: 10 },
  applicabilitySection: { marginBottom: 12 },
  applicabilityHeader: { fontSize: 14, fontWeight: "700", color: theme.colors.text, marginBottom: 4 },
  applicabilityText: { fontSize: 13, color: theme.colors.sub, lineHeight: 18 },
  limitationsSection: { marginBottom: 12 },
  limitationsHeader: { fontSize: 14, fontWeight: "700", color: theme.colors.text, marginBottom: 4 },
  limitationsText: { fontSize: 13, color: theme.colors.sub, lineHeight: 18 },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  chip: { borderRadius: 999, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: "700", color: theme.colors.text },
  theoryBox: { marginBottom: 12 },
  theoryName: { fontSize: 16, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  theoryAuthors: { fontSize: 13, color: theme.colors.sub },
  theorySection: { marginBottom: 12 },
  theoryText: { fontSize: 13, color: theme.colors.sub, lineHeight: 18 },
  continueButton: { backgroundColor: theme.colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  continueText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
