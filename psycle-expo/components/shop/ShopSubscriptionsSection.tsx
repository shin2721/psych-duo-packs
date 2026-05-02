import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { getStorefrontPlans, supportsPlanBillingPeriod, type PlanConfig } from "../../lib/plans";
import type { BillingPeriod } from "../../lib/pricing";
import i18n from "../../lib/i18n";
import {
  ActiveSubscriptionCard,
  BillingPeriodToggle,
  EnergyStatusCard,
  SubscriptionPlansGrid,
  YearlySummaryCard,
} from "./ShopSubscriptionCards";

interface ShopSubscriptionsSectionProps {
  activeUntil: string | null;
  dateLocale?: string;
  energy: number;
  energyRecoveryMinutesRemaining: number | null;
  freezeCount?: number;
  isSubscribing: boolean;
  isSubscriptionActive: boolean;
  itemsBottomInset?: number;
  maxEnergy: number;
  planId: string;
  proBillingPeriod: BillingPeriod;
  subscriptionCheckoutBlockedMessage?: string | null;
  dailyEnergyBonusRemaining: number;
  onChangeBillingPeriod: (value: BillingPeriod) => void;
  onSubscribe: (plan: PlanConfig) => void;
}

export function ShopSubscriptionsSection(props: ShopSubscriptionsSectionProps) {
  const proYearlyAvailable = supportsPlanBillingPeriod("pro", "yearly");
  const shouldShowProBillingToggle =
    getStorefrontPlans().some((plan) => plan.id === "pro") && proYearlyAvailable;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="sparkles" size={24} color={theme.colors.accent} />
        <Text style={styles.sectionTitle}>{i18n.t("shop.sections.premiumPlans")}</Text>
      </View>

      {props.isSubscriptionActive && props.activeUntil ? (
        <ActiveSubscriptionCard
          activeUntil={props.activeUntil}
          dateLocale={props.dateLocale}
          planId={props.planId}
        />
      ) : null}

      {proYearlyAvailable ? <YearlySummaryCard /> : null}

      <EnergyStatusCard
        dailyEnergyBonusRemaining={props.dailyEnergyBonusRemaining}
        energy={props.energy}
        energyRecoveryMinutesRemaining={props.energyRecoveryMinutesRemaining}
        isSubscriptionActive={props.isSubscriptionActive}
        maxEnergy={props.maxEnergy}
      />

      {shouldShowProBillingToggle ? (
        <BillingPeriodToggle
          onChangeBillingPeriod={props.onChangeBillingPeriod}
          proBillingPeriod={props.proBillingPeriod}
        />
      ) : null}

      <SubscriptionPlansGrid
        isSubscribing={props.isSubscribing}
        isSubscriptionActive={props.isSubscriptionActive}
        onSubscribe={props.onSubscribe}
        planId={props.planId}
        proBillingPeriod={props.proBillingPeriod}
        subscriptionCheckoutBlockedMessage={props.subscriptionCheckoutBlockedMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
