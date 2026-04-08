import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";

export function ReviewScreenHeader({
  title,
  icon,
  onPress,
  progress,
  accessibilityLabel,
  testID,
}: {
  title: string;
  icon: "arrow-back" | "close";
  onPress: () => void;
  progress?: number;
  accessibilityLabel: string;
  testID?: string;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onPress}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        <Ionicons name={icon} size={24} color={theme.colors.text} />
      </Pressable>
      {progress == null ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

export function ReviewIntroSection({
  dueCount,
  onStart,
}: {
  dueCount: number;
  onStart: () => void;
}) {
  return (
    <View style={styles.introContainer}>
      <View style={styles.statsCard}>
        <Text style={styles.statsNumber}>{dueCount}</Text>
        <Text style={styles.statsLabel}>{i18n.t("review.pendingLabel")}</Text>
      </View>
      <Text style={styles.description}>{i18n.t("review.description")}</Text>
      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>
          {i18n.t("review.startButton", { count: Math.min(dueCount, 10) })}
        </Text>
      </Pressable>
    </View>
  );
}

export function ReviewFeedbackBanner({ message }: { message: string }) {
  return (
    <View style={styles.reviewFeedback}>
      <Text style={styles.reviewFeedbackText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    marginLeft: theme.spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  introContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    width: "100%",
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statsLabel: {
    fontSize: 16,
    color: theme.colors.sub,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewFeedback: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  reviewFeedbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
});
