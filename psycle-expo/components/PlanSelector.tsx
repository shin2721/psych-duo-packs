// components/PlanSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useBillingState, usePracticeState } from "../lib/state";
import { theme } from "../lib/theme";
import { buyPlan } from "../lib/billing";
import { detectUserRegion } from "../lib/pricing";
import i18n from "../lib/i18n";
import { useToast } from "./ToastProvider";
import { PlanSelectorCard } from "./PlanSelectorCard";
import {
  buildPlanSelectorPlans,
  DEMO_PLAN_SELECTOR_USER,
} from "./planSelectorData";

/**
 * プラン選択UI（Free/Pro）
 * 地域別価格に対応
 */
export function PlanSelector() {
  const { planId, setPlanId, hasProAccess } = useBillingState();
  const { canAccessMistakesHub } = usePracticeState();
  const userRegion = detectUserRegion();
  const { showToast } = useToast();

  const handlePlanSelect = async (selectedPlan: "free" | "pro") => {
    if (selectedPlan === "free") {
      // Freeプランはそのまま切り替え
      setPlanId(selectedPlan);
      return;
    }

    // Proは決済画面へ
    try {
      const result = await buyPlan(
        selectedPlan,
        DEMO_PLAN_SELECTOR_USER.uid,
        DEMO_PLAN_SELECTOR_USER.email
      );
      if (!result.ok) {
        const messageKey =
          result.reason === "billing_period_unsupported"
            ? "shop.errors.billingPeriodUnavailable"
            : result.reason === "open_url_failed"
              ? "shop.errors.openCheckoutFailed"
              : result.reason === "checkout_session_failed"
                ? "shop.errors.checkoutSessionFailed"
                : "shop.errors.checkoutProcessFailed";
        showToast(String(i18n.t(messageKey)), "error");
      }
    } catch (error) {
      console.error("Plan purchase error:", error);
      showToast(String(i18n.t("shop.errors.checkoutProcessFailed")), "error");
    }
  };

  const plans = buildPlanSelectorPlans(userRegion);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("planSelector.title")}</Text>
      <Text style={styles.subtitle}>
        {i18n.t("planSelector.currentPlanLabel")}{" "}
        <Text style={styles.currentPlan}>{planId.toUpperCase()}</Text>
      </Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>{i18n.t("planSelector.proAccess")}:</Text>
        <Text style={[styles.statusValue, hasProAccess && styles.statusActive]}>
          {hasProAccess ? i18n.t("planSelector.available") : i18n.t("planSelector.unavailable")}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>{i18n.t("planSelector.mistakesReview")}:</Text>
        <Text style={[styles.statusValue, canAccessMistakesHub && styles.statusActive]}>
          {canAccessMistakesHub ? i18n.t("planSelector.available") : i18n.t("planSelector.unavailable")}
        </Text>
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <PlanSelectorCard
            key={plan.id}
            activePlanId={planId}
            onPress={() => handlePlanSelect(plan.id)}
            plan={plan}
          />
        ))}
      </View>

      <Text style={styles.disclaimer}>
        {i18n.t("planSelector.disclaimer")}
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
  disclaimer: {
    marginTop: theme.spacing.lg,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
