import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CourseWorldNode, CourseWorldViewModel } from "../../lib/courseWorld";
import type { FirstWeekRetentionCue } from "../../lib/firstWeekRetention";
import i18n from "../../lib/i18n";

export function CourseWorldNodeColumn({
  model,
  allNodes,
  themeColor,
  primaryTestID,
  supportTestID,
  onPrimaryPress,
  onSupportPress,
  onNodePress,
  showMeta = true,
  showPrimaryAction = true,
  hideVisibleCopy = false,
  habitSummary,
  retentionCue,
}: {
  model: CourseWorldViewModel;
  allNodes: CourseWorldNode[];
  themeColor: string;
  primaryTestID: string;
  supportTestID: string;
  onPrimaryPress: () => void;
  onSupportPress?: () => void;
  onNodePress?: (nodeId: string) => void;
  showMeta?: boolean;
  showPrimaryAction?: boolean;
  hideVisibleCopy?: boolean;
  habitSummary?: {
    dailyGoal: number;
    dailyXP: number;
    streak: number;
  };
  retentionCue?: FirstWeekRetentionCue | null;
}) {
  const dailyGoal = habitSummary?.dailyGoal ?? 0;
  const dailyXP = habitSummary?.dailyXP ?? 0;
  const streak = habitSummary?.streak ?? 0;
  const remainingXp = Math.max(0, dailyGoal - dailyXP);
  const hasHabitSummary = Boolean(habitSummary && dailyGoal > 0);
  const visibleRetentionCue = model.supportMoment ? null : retentionCue;
  const supportCard = hideVisibleCopy
    ? visibleRetentionCue
      ? {
        title: visibleRetentionCue.title,
        body: visibleRetentionCue.body,
        ctaLabel: visibleRetentionCue.ctaLabel,
        accessibilityHint: visibleRetentionCue.accessibilityHint,
        onPress: onPrimaryPress,
        testID: supportTestID,
      }
      : null
    : model.supportMoment
      ? {
        title: model.supportMoment.title,
        body: model.supportMoment.body,
        ctaLabel: model.supportMoment.ctaLabel,
        accessibilityHint: model.supportMoment.accessibilityHint,
        onPress: onSupportPress,
        testID: supportTestID,
      }
      : visibleRetentionCue
        ? {
          title: visibleRetentionCue.title,
          body: visibleRetentionCue.body,
          ctaLabel: visibleRetentionCue.ctaLabel,
          accessibilityHint: visibleRetentionCue.accessibilityHint,
          onPress: onPrimaryPress,
          testID: supportTestID,
        }
      : hasHabitSummary
        ? {
          title:
            remainingXp === 0
              ? String(i18n.t("course.world.goalCompleteTitle"))
              : String(i18n.t("course.world.goalRemainingTitle", { xp: remainingXp })),
          body:
            remainingXp === 0
              ? String(i18n.t("course.world.goalCompleteBody"))
              : String(i18n.t("course.world.goalRemainingBody")),
          ctaLabel:
            remainingXp === 0
              ? String(i18n.t("course.world.goalCompleteCta"))
              : String(i18n.t("course.world.goalRemainingCta")),
          accessibilityHint: String(i18n.t("course.world.goalCardAccessibilityHint")),
          onPress: onPrimaryPress,
          testID: supportTestID,
        }
      : null;
  const supportAccessibilityLabel = supportCard
    ? [supportCard.title, supportCard.ctaLabel].filter(Boolean).join(", ")
    : undefined;
  const momentumAccessibilityLabel = hasHabitSummary
    ? `${String(i18n.t("profile.stats.streakValue", { count: streak }))}, ${dailyXP}/${dailyGoal} XP, ${model.progressLabel}`
    : undefined;

  return (
    <View style={styles.container}>
      {hasHabitSummary && !hideVisibleCopy ? (
        <View
          style={styles.momentumWrap}
          accessible
          accessibilityLabel={momentumAccessibilityLabel}
        >
          <View style={styles.momentumRow}>
            <View style={styles.momentumChip}>
              <Text style={styles.momentumChipKicker}>STREAK</Text>
              <Text style={styles.momentumChipValue}>
                {String(i18n.t("profile.stats.streakValue", { count: streak }))}
              </Text>
            </View>
            <View style={styles.momentumChip}>
              <Text style={styles.momentumChipKicker}>GOAL</Text>
              <Text style={styles.momentumChipValue}>{`${dailyXP}/${dailyGoal} XP`}</Text>
            </View>
            <View style={styles.momentumChip}>
              <Text style={styles.momentumChipKicker}>UNIT</Text>
              <Text style={styles.momentumChipValue}>{model.progressLabel}</Text>
            </View>
          </View>
          <Text style={styles.momentumSummary}>{model.summaryLabel}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        {hideVisibleCopy ? null : <Text style={styles.title}>{model.currentLesson.title}</Text>}
        {hideVisibleCopy ? null : <Text style={styles.body}>{model.currentLesson.body}</Text>}
        {showMeta && !hideVisibleCopy ? (
          <View style={[styles.metaPill, { borderColor: `${themeColor}33`, backgroundColor: `${themeColor}12` }]}>
            <Ionicons name="sparkles" size={14} color={themeColor} />
            <Text style={[styles.metaText, { color: themeColor }]}>{model.currentLesson.meta}</Text>
          </View>
        ) : null}
      </View>

      {supportCard ? (
        <Pressable
          style={styles.supportCard}
          onPress={supportCard.onPress ? () => supportCard.onPress?.() : undefined}
          accessibilityRole="button"
          accessibilityLabel={supportAccessibilityLabel}
          accessibilityHint={supportCard.accessibilityHint}
          testID={supportCard.testID}
        >
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>{supportCard.title}</Text>
            <Text style={styles.supportBody}>{supportCard.body}</Text>
          </View>
          {supportCard.ctaLabel ? (
            <View style={styles.supportCta}>
              <Text style={styles.supportCtaText}>{supportCard.ctaLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {showPrimaryAction ? (
        <Pressable
          style={[styles.primaryButton, { backgroundColor: themeColor }]}
          onPress={() => onPrimaryPress()}
          accessibilityRole="button"
          accessibilityLabel={model.primaryAction.label}
          testID={primaryTestID}
        >
          <Text style={styles.primaryButtonText}>{model.primaryAction.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 12,
  },
  momentumWrap: {
    marginHorizontal: 8,
    gap: 8,
  },
  momentumRow: {
    flexDirection: "row",
    gap: 8,
  },
  momentumChip: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 3,
  },
  momentumChipKicker: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  momentumChipValue: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  momentumSummary: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 2,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "rgba(255,255,255,0.97)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 32,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32,
  },
  body: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  supportCopy: {
    flex: 1,
    gap: 4,
  },
  supportTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  supportBody: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 18,
  },
  supportCta: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  supportCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#08111F",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
