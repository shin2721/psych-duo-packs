import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useBillingState, useEconomyState } from "../../lib/state";
import { useAuth } from "../../lib/AuthContext";
import { GlobalHeader } from "../../components/GlobalHeader";
import { getDateLocaleForLanguage, getEnergyRecoveryMinutesRemaining, buildShopItems } from "../../lib/shop/shopCatalog";
import { type BillingPeriod } from "../../lib/pricing";
import i18n from "../../lib/i18n";
import { GemIcon } from "../../components/CustomIcons";
import { useToast } from "../../components/ToastProvider";
import type { EnergyFullRefillFailureReason } from "../../lib/energyFullRefill";
import { startShopCheckout } from "../../lib/shop/shopCheckout";
import { ShopSubscriptionsSection } from "../../components/shop/ShopSubscriptionsSection";
import { ShopItemsSection } from "../../components/shop/ShopItemsSection";

export default function ShopScreen() {
  const {
    gems,
    buyFreeze,
    buyEnergyFullRefill,
    freezeCount,
    buyDoubleXP,
    isDoubleXpActive,
    doubleXpEndTime,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    dailyEnergyBonusRemaining,
    dailyEnergyRefillRemaining,
  } = useEconomyState();
  const { planId, isSubscriptionActive, activeUntil } = useBillingState();
  const { user, session } = useAuth();
  const [justPurchased, setJustPurchased] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [proBillingPeriod, setProBillingPeriod] = useState<BillingPeriod>("monthly");
  const [nowTs, setNowTs] = useState(Date.now());
  const { showToast } = useToast();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const itemsBottomInset = bottomTabBarHeight + theme.spacing.lg;
  const footerBottomInset = bottomTabBarHeight + theme.spacing.md;
  const languageCode = String(i18n.locale || "ja").split("-")[0];
  const dateLocale = getDateLocaleForLanguage(languageCode);

  const accountAgeDays = useMemo(() => {
    if (!user?.created_at) return null;
    const createdAtMs = Date.parse(user.created_at);
    if (!Number.isFinite(createdAtMs)) return null;
    const elapsedMs = Date.now() - createdAtMs;
    return Math.max(0, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)));
  }, [user?.created_at]);

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const energyRecoveryMinutesRemaining = getEnergyRecoveryMinutesRemaining({
    isSubscriptionActive,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    nowTs,
  });

  const shopItems = buildShopItems({
    buyFreeze,
    buyEnergyFullRefill,
    buyDoubleXP,
    isDoubleXpActive,
    doubleXpEndTime,
  });

  const handlePurchase = (item: (typeof shopItems)[number]) => {
    const rawResult = item.action();
    const result =
      typeof rawResult === "boolean"
        ? {
            success: rawResult,
            reason: rawResult ? undefined : ("insufficient_gems" as EnergyFullRefillFailureReason),
          }
        : rawResult;

    if (result.success) {
      setJustPurchased(item.id);
      setTimeout(() => setJustPurchased(null), 2000);
      showToast(String(item.name), "success");
      return;
    }

    const message = (() => {
      switch (result.reason) {
        case "already_active":
          return i18n.t("shop.errors.doubleXpAlreadyActive");
        case "limit_reached":
          return i18n.t("shop.errors.energyRefillLimitReached");
        case "already_full":
          return i18n.t("shop.errors.energyAlreadyFull");
        case "subscription_unnecessary":
          return i18n.t("shop.errors.energyRefillSubscriptionUnnecessary");
        case "disabled":
          return i18n.t("shop.errors.energyRefillDisabled");
        case "insufficient_gems":
        default:
          return i18n.t("shop.errors.notEnoughGems");
      }
    })();
    showToast(String(message), "error");
  };

  const handleSubscribe = async (plan: Parameters<typeof startShopCheckout>[0]["plan"]) => {
    const billingPeriod: BillingPeriod = plan.id === "pro" ? proBillingPeriod : "monthly";
    setIsSubscribing(true);
    try {
      const result = await startShopCheckout({
        plan,
        billingPeriod,
        user,
        currentPlanId: planId,
        accountAgeDays,
        sessionAccessToken: session?.access_token,
      });
      if (!result.ok) {
        showToast(String(i18n.t(result.messageKey)), "error");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader />
      <View style={styles.header}>
        <Ionicons name="storefront" size={32} color={theme.colors.accent} />
        <Text style={styles.title}>{i18n.t("shop.title")}</Text>
        <View style={styles.gemsContainer}>
          <GemIcon size={20} />
          <Text style={styles.gemsText}>{gems}</Text>
        </View>
      </View>

      <View style={styles.fireflySlot} />

      <ScrollView
        testID="shop-scroll"
        style={styles.scrollView}
        contentContainerStyle={[styles.itemsContainer, { paddingBottom: itemsBottomInset }]}
      >
        <ShopSubscriptionsSection
          activeUntil={activeUntil}
          dailyEnergyBonusRemaining={dailyEnergyBonusRemaining}
          dateLocale={dateLocale}
          energy={energy}
          energyRecoveryMinutesRemaining={energyRecoveryMinutesRemaining}
          isSubscribing={isSubscribing}
          isSubscriptionActive={isSubscriptionActive}
          maxEnergy={maxEnergy}
          onChangeBillingPeriod={setProBillingPeriod}
          onSubscribe={handleSubscribe}
          planId={planId}
          proBillingPeriod={proBillingPeriod}
        />

        <ShopItemsSection
          dailyEnergyRefillRemaining={dailyEnergyRefillRemaining}
          freezeCount={freezeCount}
          justPurchased={justPurchased}
          onPurchase={handlePurchase}
          shopItems={shopItems}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomInset }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.sub} />
        <Text style={styles.footerText}>{i18n.t("shop.gemsHint")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
  },
  gemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  gemsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  fireflySlot: {
    alignItems: "center",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.sub,
    flex: 1,
  },
});
