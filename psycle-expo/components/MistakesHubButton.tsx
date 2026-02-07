// components/MistakesHubButton.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppState } from "../lib/state";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

/**
 * MistakesHub（個別化復習）へのアクセスボタン
 *
 * Free/Pro: 利用不可（アップセル表示）
 * Max: 無制限アクセス
 */
export function MistakesHubButton() {
  const {
    planId,
    canAccessMistakesHub,
    mistakesHubRemaining,
    getMistakesHubItems,
    startMistakesHubSession,
  } = useAppState();

  const mistakesItems = getMistakesHubItems();
  const hasEnoughData = mistakesItems.length >= 5; // 最低5問必要

  const handlePress = () => {
    if (!canAccessMistakesHub) {
      alert(String(i18n.t("mistakesHubButton.upsellMessage")));
      return;
    }

    if (!hasEnoughData) {
      alert(String(i18n.t("mistakesHubButton.notEnoughData")));
      return;
    }

    startMistakesHubSession();
    alert(
      String(
        i18n.t("mistakesHubButton.sessionStarted", {
          count: mistakesItems.length,
        })
      )
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          !canAccessMistakesHub && styles.buttonLocked,
          !hasEnoughData && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={!hasEnoughData}
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
          {mistakesHubRemaining === null
            ? i18n.t("mistakesHubButton.statusUnlimited")
            : i18n.t("mistakesHubButton.statusRemaining", {
                remaining: mistakesHubRemaining,
              })}
        </Text>
      ) : (
        <Text style={styles.statusText}>{i18n.t("mistakesHubButton.statusLocked")}</Text>
      )}

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
  itemCount: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});
