// components/MistakesHubButton.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppState } from "../lib/state";
import { theme } from "../lib/theme";

/**
 * MistakesHub（個別化復習）へのアクセスボタン
 *
 * Free: 利用不可（アップセル表示）
 * Pro/Max: 無制限アクセス
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
      // Show upsell modal for Pro/Max
      alert(
        "Proプランで\"ミス復習\"が使えます\n\n" +
          "✓ 直近のミスを10問厳選\n" +
          "✓ 無制限で何度でも復習可能\n" +
          "✓ タグ配分を自動最適化\n\n" +
          "今すぐアップグレード →"
      );
      return;
    }

    if (!hasEnoughData) {
      alert(
        "復習データがまだ十分ではありません\n" +
          "もう少し問題を解いてから試してください"
      );
      return;
    }

    startMistakesHubSession();
    alert(`復習セッション開始（${mistakesItems.length}問）`);
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
          {canAccessMistakesHub ? "ミスだけ5分で復習" : "🔒 ミスだけ5分で復習（Pro）"}
        </Text>
        <Text style={styles.buttonSubtitle}>直近のつまずきを10問だけ</Text>
      </TouchableOpacity>

      {canAccessMistakesHub ? (
        <Text style={styles.statusText}>
          {mistakesHubRemaining === null
            ? "復習セッション: 無制限"
            : `本日の復習セッション: 残り ${mistakesHubRemaining}/1`}
        </Text>
      ) : (
        <Text style={styles.statusText}>ミス復習は Pro 以上で利用できます</Text>
      )}

      {hasEnoughData && (
        <Text style={styles.itemCount}>
          {mistakesItems.length}問の復習問題が準備されています
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
