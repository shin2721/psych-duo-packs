import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

export function PlanSelectorCard({
  activePlanId,
  onPress,
  plan,
}: {
  activePlanId: string;
  onPress: () => void;
  plan: {
    id: "free" | "pro";
    name: string;
    price: string;
    features: string[];
  };
}) {
  return (
    <TouchableOpacity
      style={[styles.planCard, activePlanId === plan.id && styles.planCardActive]}
      onPress={onPress}
    >
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planPrice}>{plan.price}</Text>
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <Text key={index} style={styles.featureText}>
            {feature}
          </Text>
        ))}
      </View>
      {activePlanId === plan.id ? (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>
            {i18n.t("planSelector.currentPlanBadge")}
          </Text>
        </View>
      ) : null}
      {plan.id !== "free" && activePlanId !== plan.id ? (
        <View style={styles.purchaseButton}>
          <Text style={styles.purchaseButtonText}>{i18n.t("planSelector.buy")}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
