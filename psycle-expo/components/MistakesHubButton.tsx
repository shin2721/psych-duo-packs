// components/MistakesHubButton.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
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

  const handlePress = () => {
    if (availabilityState !== "ready") {
      return;
    }

    const result = startMistakesHubSession();
    if (result.started) {
      router.push("/mistakes-hub");
      return;
    }

    // Non-blocking for known states; keep route discoverable.
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="mistakes-hub-button"
        style={[
          styles.button,
          !canAccessMistakesHub && styles.buttonLocked,
          canAccessMistakesHub && !hasEnoughData && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={canAccessMistakesHub && !hasEnoughData}
        accessibilityRole="button"
        accessibilityLabel={
          availabilityState === "locked"
            ? String(i18n.t("mistakesHubButton.titleLocked"))
            : String(i18n.t("mistakesHubButton.titleAvailable"))
        }
        accessibilityState={{ disabled: canAccessMistakesHub && !hasEnoughData }}
      >
        <Text style={styles.buttonTitle}>
          {canAccessMistakesHub
            ? i18n.t("mistakesHubButton.titleAvailable")
            : i18n.t("mistakesHubButton.titleLocked")}
        </Text>
        <Text style={styles.buttonSubtitle}>{i18n.t("mistakesHubButton.subtitle")}</Text>
      </TouchableOpacity>

      {canAccessMistakesHub ? (
        <Text style={styles.statusText}>
          {!hasEnoughData
            ? i18n.t("mistakesHubButton.statusNeedData")
            : mistakesHubRemaining === null
            ? i18n.t("mistakesHubButton.statusUnlimited")
            : i18n.t("mistakesHubButton.statusRemaining", {
                remaining: mistakesHubRemaining,
              })}
        </Text>
      ) : (
        <Text style={styles.statusText}>{i18n.t("mistakesHubButton.statusLocked")}</Text>
      )}

      <Text style={styles.hintText} testID="mistakes-hub-status">
        {availabilityState === "locked"
          ? i18n.t("mistakesHubButton.routeHintLocked")
          : availabilityState === "insufficient_data"
            ? i18n.t("mistakesHubButton.routeHintInsufficientData")
            : i18n.t("mistakesHubButton.routeHintReady")}
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
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  buttonLocked: {
    backgroundColor: "#999",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: theme.spacing.xs,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.sub,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  itemCount: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});
