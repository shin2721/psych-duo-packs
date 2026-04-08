import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import {
  getStorefrontPlans,
  supportsPlanBillingPeriod,
  type PlanConfig,
} from "../../lib/plans";
import {
  getYearlyDiscount,
  getYearlyMonthlyEquivalent,
  type BillingPeriod,
} from "../../lib/pricing";
import { formatPlanPrice } from "../../lib/shop/shopCatalog";
import i18n from "../../lib/i18n";
import { EnergyIcon } from "../CustomIcons";

export function ActiveSubscriptionCard({
  activeUntil,
  dateLocale,
  planId,
}: {
  activeUntil: string;
  dateLocale?: string;
  planId: string;
}) {
  return (
    <View style={styles.activeSubscriptionCard}>
      <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
      <View style={styles.subscriptionInfo}>
        <Text style={styles.activeSubscriptionText}>
          {i18n.t("shop.subscription.activePlan", {
            plan: planId === "pro" ? "Pro" : "Max",
          })}
        </Text>
        <Text style={styles.activeSubscriptionDate}>
          {i18n.t("shop.subscription.expiresOn", {
            date: new Date(activeUntil).toLocaleDateString(dateLocale),
          })}
        </Text>
      </View>
    </View>
  );
}

export function YearlySummaryCard() {
  return (
    <View style={styles.yearlySummaryCard} testID="shop-yearly-summary">
      <View style={styles.yearlySummaryHeader}>
        <Ionicons name="wallet" size={16} color={theme.colors.accent} />
        <Text style={styles.yearlySummaryTitle}>{i18n.t("shop.subscription.yearly")}</Text>
      </View>
      <Text style={styles.yearlySummaryLine}>
        {i18n.t("shop.subscription.yearlyEquivalent", {
          price: getYearlyMonthlyEquivalent("pro"),
        })}
      </Text>
      <Text style={styles.yearlySummaryDiscount}>
        {i18n.t("shop.subscription.yearlyDiscount", {
          percent: getYearlyDiscount("pro"),
        })}
      </Text>
      <Text style={styles.yearlySummaryTrust}>
        {i18n.t("shop.subscription.cancelAnytime")}
      </Text>
    </View>
  );
}

export function EnergyStatusCard(props: {
  dailyEnergyBonusRemaining: number;
  energy: number;
  energyRecoveryMinutesRemaining: number | null;
  isSubscriptionActive: boolean;
  maxEnergy: number;
}) {
  return (
    <View style={styles.energyStatusCard}>
      <View style={styles.energyStatusHeader}>
        <EnergyIcon size={20} />
        <Text style={styles.energyStatusTitle}>{i18n.t("shop.energyStatus.title")}</Text>
      </View>
      <Text
        style={styles.energyStatusRow}
        accessible
        accessibilityLabel={
          props.isSubscriptionActive
            ? String(i18n.t("shop.energyStatus.currentUnlimitedA11y"))
            : `${String(i18n.t("shop.energyStatus.currentLabel"))}${props.energy}/${props.maxEnergy}`
        }
      >
        {i18n.t("shop.energyStatus.currentLabel")}
        <Text style={styles.energyStatusValue}>
          {props.isSubscriptionActive ? "∞" : `${props.energy}/${props.maxEnergy}`}
        </Text>
      </Text>
      {!props.isSubscriptionActive ? (
        <>
          <Text style={styles.energyStatusRow}>
            {i18n.t("shop.energyStatus.nextRefillLabel")}
            <Text style={styles.energyStatusValue}>
              {props.energyRecoveryMinutesRemaining === null
                ? i18n.t("shop.energyStatus.full")
                : i18n.t("shop.energyStatus.minutes", {
                    minutes: props.energyRecoveryMinutesRemaining,
                  })}
            </Text>
          </Text>
          <Text style={styles.energyStatusRow}>
            {i18n.t("shop.energyStatus.dailyBonusRemainingLabel")}
            <Text style={styles.energyStatusValue}>{props.dailyEnergyBonusRemaining}</Text>
          </Text>
        </>
      ) : null}
    </View>
  );
}

export function BillingPeriodToggle({
  proBillingPeriod,
  onChangeBillingPeriod,
}: {
  onChangeBillingPeriod: (value: BillingPeriod) => void;
  proBillingPeriod: BillingPeriod;
}) {
  return (
    <View style={styles.billingPeriodToggle}>
      <Pressable
        testID="shop-billing-monthly"
        style={[
          styles.billingPeriodOption,
          proBillingPeriod === "monthly" && styles.billingPeriodOptionActive,
        ]}
        onPress={() => onChangeBillingPeriod("monthly")}
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("shop.subscription.monthly"))}
        accessibilityState={{ selected: proBillingPeriod === "monthly" }}
      >
        <Text
          style={[
            styles.billingPeriodOptionText,
            proBillingPeriod === "monthly" && styles.billingPeriodOptionTextActive,
          ]}
        >
          {i18n.t("shop.subscription.monthly")}
        </Text>
      </Pressable>
      <Pressable
        testID="shop-billing-yearly"
        style={[
          styles.billingPeriodOption,
          proBillingPeriod === "yearly" && styles.billingPeriodOptionActive,
        ]}
        onPress={() => onChangeBillingPeriod("yearly")}
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("shop.subscription.yearly"))}
        accessibilityState={{ selected: proBillingPeriod === "yearly" }}
      >
        <Text
          style={[
            styles.billingPeriodOptionText,
            proBillingPeriod === "yearly" && styles.billingPeriodOptionTextActive,
          ]}
        >
          {i18n.t("shop.subscription.yearly")}
        </Text>
      </Pressable>
    </View>
  );
}

export function SubscriptionPlansGrid(props: {
  isSubscribing: boolean;
  isSubscriptionActive: boolean;
  onSubscribe: (plan: PlanConfig) => void;
  planId: string;
  proBillingPeriod: BillingPeriod;
}) {
  const purchasablePlans = getStorefrontPlans();
  const proYearlyAvailable = supportsPlanBillingPeriod("pro", "yearly");

  return (
    <View style={styles.plansContainer}>
      {purchasablePlans.map((plan) => {
        const selectedPeriod: BillingPeriod =
          plan.id === "pro" ? (proYearlyAvailable ? props.proBillingPeriod : "monthly") : "monthly";
        const showYearlyMeta = plan.id === "pro" && selectedPeriod === "yearly";
        const subscribeStatusLabel = props.isSubscribing
          ? String(i18n.t("shop.subscription.processing"))
          : props.planId === plan.id && props.isSubscriptionActive
            ? String(i18n.t("shop.subscription.active"))
            : null;

        const subscribeAccessibilityLabel = [
          plan.name,
          formatPlanPrice(plan, selectedPeriod),
          String(
            selectedPeriod === "yearly"
              ? i18n.t("shop.subscription.yearly")
              : i18n.t("shop.subscription.monthly")
          ),
          subscribeStatusLabel,
        ]
          .filter(Boolean)
          .join(", ");

        return (
          <View key={plan.id} style={styles.planCard} testID={`shop-plan-${plan.id}`}>
            {plan.popular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{i18n.t("shop.subscription.popular")}</Text>
              </View>
            ) : null}
            <View style={styles.planHeader}>
              <Text style={styles.planName} numberOfLines={1} ellipsizeMode="tail">
                {plan.name}
              </Text>
              <Text style={styles.planPrice}>{formatPlanPrice(plan, selectedPeriod)}</Text>
              <Text style={styles.planPeriod}>
                {selectedPeriod === "yearly"
                  ? i18n.t("shop.subscription.yearlySuffix")
                  : i18n.t("shop.subscription.monthlySuffix")}
              </Text>
              {showYearlyMeta ? (
                <View style={styles.yearlyMeta}>
                  <Text style={styles.yearlyEquivalent}>
                    {i18n.t("shop.subscription.yearlyEquivalent", {
                      price: getYearlyMonthlyEquivalent("pro"),
                    })}
                  </Text>
                  <View style={styles.yearlyDiscountBadge}>
                    <Text style={styles.yearlyDiscountText}>
                      {i18n.t("shop.subscription.yearlyDiscount", {
                        percent: getYearlyDiscount("pro"),
                      })}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Pressable
              testID={`shop-subscribe-${plan.id}`}
              style={[
                styles.subscribeButton,
                props.planId === plan.id &&
                  props.isSubscriptionActive &&
                  styles.subscribeButtonActive,
                props.isSubscribing && styles.subscribeButtonDisabled,
              ]}
              onPress={() => props.onSubscribe(plan)}
              disabled={props.isSubscribing || (props.planId === plan.id && props.isSubscriptionActive)}
              accessibilityRole="button"
              accessibilityLabel={subscribeAccessibilityLabel}
              accessibilityState={{
                busy: props.isSubscribing,
                disabled:
                  props.isSubscribing || (props.planId === plan.id && props.isSubscriptionActive),
                selected: props.planId === plan.id && props.isSubscriptionActive,
              }}
            >
              <Text style={styles.subscribeButtonText}>
                {props.isSubscribing
                  ? i18n.t("shop.subscription.processing")
                  : props.planId === plan.id && props.isSubscriptionActive
                    ? i18n.t("shop.subscription.active")
                    : i18n.t("shop.subscription.subscribe")}
              </Text>
            </Pressable>
            <Text style={styles.cancelAnytimeText}>
              {i18n.t("shop.subscription.cancelAnytime")}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeSubscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  subscriptionInfo: {
    flex: 1,
  },
  activeSubscriptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  activeSubscriptionDate: {
    fontSize: 13,
    color: theme.colors.sub,
  },
  energyStatusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 8,
  },
  energyStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  energyStatusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  energyStatusRow: {
    fontSize: 14,
    color: theme.colors.sub,
  },
  energyStatusValue: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  yearlySummaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  yearlySummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  yearlySummaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  yearlySummaryLine: {
    fontSize: 13,
    color: theme.colors.sub,
  },
  yearlySummaryDiscount: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  yearlySummaryTrust: {
    fontSize: 12,
    color: theme.colors.sub,
  },
  plansContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  billingPeriodToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 4,
    marginBottom: 12,
  },
  billingPeriodOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 8,
  },
  billingPeriodOptionActive: {
    backgroundColor: theme.colors.accent,
  },
  billingPeriodOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.sub,
  },
  billingPeriodOptionTextActive: {
    color: "#fff",
  },
  planCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.line,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 16,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.accent,
  },
  planPeriod: {
    fontSize: 14,
    color: theme.colors.sub,
    marginTop: 4,
  },
  yearlyMeta: {
    marginTop: 12,
    gap: 8,
  },
  yearlyEquivalent: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  yearlyDiscountBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  yearlyDiscountText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  planFeatures: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  subscribeButtonActive: {
    backgroundColor: theme.colors.success,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelAnytimeText: {
    fontSize: 12,
    color: theme.colors.sub,
    textAlign: "center",
  },
});
