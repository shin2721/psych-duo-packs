import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "../Modal";
import { LeagueResultModal } from "../LeagueResultModal";
import { Button } from "../ui";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";
import type { LeagueResult } from "../../lib/leagueReward";

export function CourseOfferBanner({
  variant,
  title,
  body,
  ctaLabel,
  accessibilityHint,
  onPress,
}: {
  variant: "streakRepair" | "comeback";
  title: string;
  body: string;
  ctaLabel: string;
  accessibilityHint: string;
  onPress: () => void;
}) {
  const isStreakRepair = variant === "streakRepair";

  return (
    <View style={[styles.offerCard, isStreakRepair ? styles.streakRepairCard : styles.comebackCard]}>
      <View style={styles.offerTexts}>
        <Text style={[styles.offerTitle, isStreakRepair ? styles.streakRepairTitle : styles.comebackTitle]}>
          {title}
        </Text>
        <Text style={styles.offerBody}>{body}</Text>
      </View>
      <Pressable
        style={[styles.offerButton, isStreakRepair ? styles.streakRepairButton : styles.comebackButton]}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
      >
        <Text style={styles.offerButtonText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

export function CourseNextStepCard({
  isLocked,
  onPress,
}: {
  isLocked: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.nextStepCard} testID="course-next-step-card">
      <View style={styles.nextStepHeader}>
        <View style={styles.nextStepIconWrap}>
          <Ionicons
            name={isLocked ? "lock-closed" : "play"}
            size={16}
            color={isLocked ? theme.colors.warn : theme.colors.accent}
          />
        </View>
        <Text style={styles.nextStepLabel}>{i18n.t("course.nextStep.label")}</Text>
      </View>
      <Text style={styles.nextStepTitle}>
        {isLocked ? i18n.t("course.nextStep.lockedTitle") : i18n.t("course.nextStep.readyTitle")}
      </Text>
      <Text style={styles.nextStepBody}>
        {isLocked ? i18n.t("course.nextStep.lockedBody") : i18n.t("course.nextStep.readyBody")}
      </Text>
      <Button
        label={String(isLocked ? i18n.t("course.nextStep.ctaLocked") : i18n.t("course.nextStep.ctaReady"))}
        size="sm"
        onPress={onPress}
        testID="course-next-step-cta"
        style={[styles.nextStepButton, isLocked && styles.nextStepButtonLocked]}
        accessibilityLabel={
          isLocked
            ? `${String(i18n.t("course.nextStep.lockedTitle"))}. ${String(i18n.t("course.nextStep.ctaLocked"))}`
            : `${String(i18n.t("course.nextStep.readyTitle"))}. ${String(i18n.t("course.nextStep.ctaReady"))}`
        }
      />
    </View>
  );
}

export function CourseLessonModal({
  visible,
  onStart,
  onCancel,
}: {
  visible: boolean;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      title={i18n.t("course.startLessonTitle")}
      description={i18n.t("course.startLessonDescription", { xp: 10 })}
      primaryLabel={i18n.t("course.startButton")}
      onPrimary={onStart}
      onCancel={onCancel}
    />
  );
}

export function CourseLeagueResultGate({
  result,
  visible,
  onClaim,
  onDismiss,
}: {
  result: LeagueResult | null;
  visible: boolean;
  onClaim: (claimedGems: number, claimedBadges: string[], newBalance?: number) => void;
  onDismiss: () => void;
}) {
  if (!result) return null;

  return (
    <LeagueResultModal
      visible={visible}
      result={result}
      onClaim={onClaim}
      onDismiss={onDismiss}
    />
  );
}

const styles = StyleSheet.create({
  offerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakRepairCard: {
    borderColor: "rgba(249, 115, 22, 0.4)",
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  comebackCard: {
    borderColor: "rgba(34, 197, 94, 0.4)",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
  },
  offerTexts: {
    flex: 1,
    gap: 4,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  streakRepairTitle: {
    color: "#f97316",
  },
  comebackTitle: {
    color: "#22c55e",
  },
  offerBody: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
  },
  offerButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  streakRepairButton: {
    backgroundColor: "#f97316",
  },
  comebackButton: {
    backgroundColor: "#22c55e",
  },
  offerButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  nextStepCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.card,
    gap: 6,
  },
  nextStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextStepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.16)",
  },
  nextStepLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: theme.colors.sub,
    textTransform: "uppercase",
  },
  nextStepTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },
  nextStepBody: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.sub,
  },
  nextStepButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: 999,
  },
  nextStepButtonLocked: {
    backgroundColor: theme.colors.warn,
  },
});
