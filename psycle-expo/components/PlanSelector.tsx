// components/PlanSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react";
import { useAppState } from "../lib/state";
import { theme } from "../lib/theme";
import { buyPlan } from "../lib/billing";
import { getPlanPrice, detectUserRegion } from "../lib/pricing";

/**
 * プラン選択UI（Free/Pro/Max）
 * 地域別価格に対応
 */
export function PlanSelector() {
  const { planId, setPlanId, hasProAccess, canAccessMistakesHub } = useAppState();
  const userRegion = detectUserRegion();

  // デモ用：仮のユーザー情報（実際はSupabase authから取得）
  const demoUser = {
    uid: "demo-user-123",
    email: "demo@psycle.app",
  };

  const handlePlanSelect = async (selectedPlan: "free" | "pro" | "max") => {
    if (selectedPlan === "free") {
      // Freeプランはそのまま切り替え
      setPlanId(selectedPlan);
      return;
    }

    // Pro/Maxは決済画面へ
    try {
      await buyPlan(selectedPlan, demoUser.uid, demoUser.email);
    } catch (error) {
      console.error("Plan purchase error:", error);
    }
  };

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      price: "¥0 / 月",
      features: [
        "毎日5エネルギー・自動回復",
        "Lite問題アクセス",
        "❌ ミス復習なし",
      ],
    },
    {
      id: "pro" as const,
      name: "Pro",
      price: `${getPlanPrice("pro", "monthly", userRegion)} / 月`,
      features: [
        "無制限エネルギー",
        "Lite問題フルアクセス",
        "❌ ミス復習なし",
      ],
    },
    {
      id: "max" as const,
      name: "Max",
      price: `${getPlanPrice("max", "monthly", userRegion)} / 月`,
      features: [
        "無制限エネルギー",
        "✅ Pro問題アクセス",
        "✅ ミス復習無制限",
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>プラン選択</Text>
      <Text style={styles.subtitle}>
        現在のプラン: <Text style={styles.currentPlan}>{planId.toUpperCase()}</Text>
      </Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Pro問題アクセス:</Text>
        <Text style={[styles.statusValue, hasProAccess && styles.statusActive]}>
          {hasProAccess ? "✅ 利用可能" : "❌ 利用不可"}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>ミス復習:</Text>
        <Text style={[styles.statusValue, canAccessMistakesHub && styles.statusActive]}>
          {canAccessMistakesHub ? "✅ 利用可能" : "❌ 利用不可"}
        </Text>
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              planId === plan.id && styles.planCardActive,
            ]}
            onPress={() => handlePlanSelect(plan.id)}
          >
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, idx) => (
                <Text key={idx} style={styles.featureText}>
                  {feature}
                </Text>
              ))}
            </View>
            {planId === plan.id && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>現在のプラン</Text>
              </View>
            )}
            {plan.id !== "free" && planId !== plan.id && (
              <View style={styles.purchaseButton}>
                <Text style={styles.purchaseButtonText}>購入する →</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        ※ Pro/Maxプランの購入にはStripe決済が使用されます
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: theme.spacing.lg,
  },
  currentPlan: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  statusValue: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  statusActive: {
    color: theme.colors.primary,
  },
  plansContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  planCard: {
    backgroundColor: "#f5f5f5",
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#e6f2ff",
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planPrice: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: theme.spacing.md,
  },
  featuresContainer: {
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  activeBadge: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xs,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  activeBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  purchaseButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  disclaimer: {
    marginTop: theme.spacing.lg,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
