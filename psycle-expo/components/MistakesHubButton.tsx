// components/MistakesHubButton.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePracticeState } from "../lib/state";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

/**
 * MistakesHub（個別化復習）へのアクセスボタン
 *
 * Free: 利用不可（アップセル表示）
 * Pro: 無制限アクセス
 */
export function MistakesHubButton() {
  const {
    canAccessMistakesHub,
    mistakesHubRemaining,
    getMistakesHubItems,
    startMistakesHubSession,
  } = usePracticeState();

  const mistakesItems = getMistakesHubItems();
  const hasEnoughData = mistakesItems.length >= 5; // 最低5問必要

  const availabilityState: "locked" | "insufficient_data" | "ready" = !canAccessMistakesHub
    ? "locked"
    : hasEnoughData
      ? "ready"
      : "insufficient_data";

  const statusText = canAccessMistakesHub
    ? !hasEnoughData
      ? String(i18n.t("mistakesHubButton.statusNeedData"))
      : mistakesHubRemaining === null
        ? String(i18n.t("mistakesHubButton.statusUnlimited"))
        : String(
            i18n.t("mistakesHubButton.statusRemaining", {
              remaining: mistakesHubRemaining,
            })
          )
    : String(i18n.t("mistakesHubButton.statusLocked"));

  const hintText = availabilityState === "locked"
    ? String(i18n.t("mistakesHubButton.routeHintLocked"))
    : availabilityState === "insufficient_data"
      ? String(i18n.t("mistakesHubButton.routeHintInsufficientData"))
      : String(i18n.t("mistakesHubButton.routeHintReady"));

  const handlePress = () => {
    if (availabilityState === "ready") {
      const result = startMistakesHubSession();
      if (result.started) {
        router.push("/mistakes-hub");
        return;
      }
    }

    router.push("/mistakes-hub");
  };

  const badgeLabel = availabilityState === "locked"
    ? "PRO"
    : availabilityState === "insufficient_data"
      ? `${mistakesItems.length}/5`
      : "READY";

  const badgeStyle = availabilityState === "locked"
    ? styles.badgeLocked
    : availabilityState === "insufficient_data"
      ? styles.badgePending
      : styles.badgeReady;

  const chevronColor = availabilityState === "locked"
    ? theme.colors.sub
    : theme.colors.primary;

  return (
    <View style={styles.container}>
      <Pressable
        testID="mistakes-hub-button"
        style={[
          styles.button,
          availabilityState === "locked" && styles.buttonLocked,
          availabilityState === "insufficient_data" && styles.buttonPending,
          availabilityState === "ready" && styles.buttonReady,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={
          availabilityState === "locked"
            ? String(i18n.t("mistakesHubButton.titleLocked"))
            : String(i18n.t("mistakesHubButton.titleAvailable"))
        }
        accessibilityHint={hintText}
      >
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.buttonTitle}>
              {canAccessMistakesHub
                ? i18n.t("mistakesHubButton.titleAvailable")
                : i18n.t("mistakesHubButton.titleLocked")}
            </Text>
            <View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          </View>
          <Text style={styles.buttonSubtitle}>{i18n.t("mistakesHubButton.subtitle")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={chevronColor} />
      </Pressable>

      <Text style={styles.statusText}>{statusText}</Text>

      <Text style={styles.hintText} testID="mistakes-hub-status">
        {hintText}
      </Text>

      {hasEnoughData && (
        <Text style={styles.itemCount}>
          {i18n.t("mistakesHubButton.itemCountReady", {
            count: mistakesItems.length,
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  button: {
    minHeight: 88,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  buttonLocked: {
    borderColor: theme.colors.line,
  },
  buttonPending: {
    borderColor: theme.colors.line,
  },
  buttonReady: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  buttonTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: theme.colors.sub,
    lineHeight: 20,
  },
  badge: {
    minWidth: 52,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  badgeLocked: {
    backgroundColor: theme.colors.line,
  },
  badgePending: {
    backgroundColor: theme.colors.surface,
  },
  badgeReady: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.text,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.8,
    textAlign: "center",
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.sub,
    textAlign: "center",
  },
  itemCount: {
    fontSize: 13,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});
