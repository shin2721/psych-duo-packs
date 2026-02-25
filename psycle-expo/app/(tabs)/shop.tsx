import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/AuthContext";
import { GlobalHeader } from "../../components/GlobalHeader";
import { PLANS, getSupabaseFunctionsUrl, type PlanConfig } from "../../lib/plans";
import { getPlanPrice } from "../../lib/pricing";
import { getShopSinksConfig } from "../../lib/gamificationConfig";
import i18n from "../../lib/i18n";
import { GemIcon, EnergyIcon } from "../../components/CustomIcons";
import { Analytics } from "../../lib/analytics";
import type { EnergyFullRefillFailureReason } from "../../lib/energyFullRefill";

// import { Firefly } from "../../components/Firefly"; // TODO: Re-enable after native rebuild

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  action: () => boolean | { success: boolean; reason?: EnergyFullRefillFailureReason };
}

export default function ShopScreen() {
  const {
    gems,
    buyFreeze,
    buyEnergyFullRefill,
    freezeCount,
    planId,
    isSubscriptionActive,
    activeUntil,
    buyDoubleXP,
    isDoubleXpActive,
    doubleXpEndTime,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    dailyEnergyBonusRemaining,
    dailyEnergyRefillRemaining,
  } = useAppState();
  const { user } = useAuth();
  const [justPurchased, setJustPurchased] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const dateLocaleByLanguage: Record<string, string> = {
    ja: "ja-JP",
    en: "en-US",
    es: "es-ES",
    zh: "zh-CN",
    fr: "fr-FR",
    de: "de-DE",
    ko: "ko-KR",
    pt: "pt-BR",
  };
  const languageCode = String(i18n.locale || "ja").split("-")[0];
  const dateLocale = dateLocaleByLanguage[languageCode];
  const energyFullRefillConfig = getShopSinksConfig().energy_full_refill;

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const energyRecoveryMinutesRemaining = (() => {
    if (isSubscriptionActive) return null;
    if (energy >= maxEnergy || lastEnergyUpdateTime === null) return null;

    const refillMs = energyRefillMinutes * 60 * 1000;
    const elapsed = Math.max(0, nowTs - lastEnergyUpdateTime);
    const remainingMs = refillMs - (elapsed % refillMs);
    return Math.max(1, Math.ceil(remainingMs / 60000));
  })();

  const handlePurchase = (item: ShopItem) => {
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
      Alert.alert(i18n.t('common.ok'), `${item.name}`);
    } else {
      const message = (() => {
        switch (result.reason) {
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
      Alert.alert(i18n.t('common.error'), message);
    }
  };

  const handleSubscribe = async (plan: PlanConfig) => {
    const source = "shop_tab";
    Analytics.track("plan_select", {
      source,
      planId: plan.id,
    });

    if (!user?.id || !user?.email) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "missing_user_context",
      });
      Alert.alert(i18n.t("common.error"), i18n.t("shop.errors.checkoutProcessFailed"));
      return;
    }

    const functionsUrl = getSupabaseFunctionsUrl();
    if (!functionsUrl) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "functions_url_missing",
      });
      Alert.alert(i18n.t("common.error"), i18n.t("shop.errors.checkoutProcessFailed"));
      return;
    }

    Analytics.track("checkout_start", {
      source,
      planId: plan.id,
    });

    setIsSubscribing(true);
    try {
      // Call Supabase Function to create checkout session
      const response = await fetch(`${functionsUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        Analytics.track("checkout_failed", {
          source,
          planId: plan.id,
          reason: "http_error",
          status: response.status,
        });
      }

      const data = await response.json();

      if (data.url) {
        // Open Stripe Checkout in browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert(i18n.t("common.error"), i18n.t("shop.errors.openCheckoutFailed"));
        }
      } else {
        Analytics.track("checkout_failed", {
          source,
          planId: plan.id,
          reason: "missing_checkout_url",
        });
        Alert.alert(i18n.t("common.error"), i18n.t("shop.errors.checkoutSessionFailed"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "exception",
      });
      Alert.alert(i18n.t("common.error"), i18n.t("shop.errors.checkoutProcessFailed"));
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatPlanMonthlyPrice = (plan: PlanConfig): string => {
    const planType = plan.id === "max" ? "max" : "pro";
    try {
      return getPlanPrice(planType, "monthly");
    } catch {
      return `¥${plan.priceMonthly.toLocaleString()}`;
    }
  };

  const shopItems: ShopItem[] = [
    {
      id: "freeze",
      name: i18n.t('shop.items.freeze.name'),
      description: i18n.t('shop.items.freeze.desc'),
      price: 10,
      icon: "snow-outline",
      action: buyFreeze,
    },
    {
      id: "double_xp",
      name: i18n.t('shop.items.doubleXP.name'),
      description: isDoubleXpActive
        ? i18n.t("shop.items.doubleXP.activeWithMinutes", {
          minutes: Math.ceil((doubleXpEndTime! - Date.now()) / 60000),
        })
        : i18n.t('shop.items.doubleXP.desc'),
      price: 20,
      icon: "flash-outline",
      customIcon: <EnergyIcon size={36} />,
      action: buyDoubleXP,
    },
  ];

  if (energyFullRefillConfig.enabled) {
    shopItems.push({
      id: "energy_full_refill",
      name: i18n.t("shop.items.energyFullRefill.name"),
      description: i18n.t("shop.items.energyFullRefill.desc"),
      price: energyFullRefillConfig.cost_gems,
      icon: "battery-charging-outline",
      customIcon: <EnergyIcon size={36} />,
      action: buyEnergyFullRefill,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader />
      <View style={styles.header}>
        <Ionicons name="storefront" size={32} color={theme.colors.accent} />
        <Text style={styles.title}>{i18n.t('shop.title')}</Text>

        {/* Gems Display */}
        <View style={styles.gemsContainer}>
          <GemIcon size={20} />
          <Text style={styles.gemsText}>{gems}</Text>
        </View>
      </View>

      {/* Firefly Character */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {/* <Firefly /> */}{/* TODO: Re-enable after native rebuild */}
      </View>

      {/* Subscription Plans */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.itemsContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={24} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{i18n.t("shop.sections.premiumPlans")}</Text>
        </View>

        {/* Current Subscription Status */}
        {isSubscriptionActive && activeUntil && (
          <View style={styles.activeSubscriptionCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <View style={styles.subscriptionInfo}>
              <Text style={styles.activeSubscriptionText}>
                {i18n.t("shop.subscription.activePlan", { plan: planId === "pro" ? "Pro" : "Max" })}
              </Text>
              <Text style={styles.activeSubscriptionDate}>
                {i18n.t("shop.subscription.expiresOn", {
                  date: new Date(activeUntil).toLocaleDateString(dateLocale),
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.energyStatusCard}>
          <View style={styles.energyStatusHeader}>
            <EnergyIcon size={20} />
            <Text style={styles.energyStatusTitle}>{i18n.t("shop.energyStatus.title")}</Text>
          </View>
          <Text style={styles.energyStatusRow}>
            {i18n.t("shop.energyStatus.currentLabel")}
            <Text style={styles.energyStatusValue}>
              {isSubscriptionActive ? "∞" : `${energy}/${maxEnergy}`}
            </Text>
          </Text>
          {!isSubscriptionActive && (
            <>
              <Text style={styles.energyStatusRow}>
                {i18n.t("shop.energyStatus.nextRefillLabel")}
                <Text style={styles.energyStatusValue}>
                  {energyRecoveryMinutesRemaining === null
                    ? i18n.t("shop.energyStatus.full")
                    : i18n.t("shop.energyStatus.minutes", { minutes: energyRecoveryMinutesRemaining })}
                </Text>
              </Text>
              <Text style={styles.energyStatusRow}>
                {i18n.t("shop.energyStatus.dailyBonusRemainingLabel")}
                <Text style={styles.energyStatusValue}>{dailyEnergyBonusRemaining}</Text>
              </Text>
            </>
          )}
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {PLANS.filter(p => p.id === 'pro').map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{i18n.t("shop.subscription.popular")}</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{formatPlanMonthlyPrice(plan)}</Text>
                <Text style={styles.planPeriod}>{i18n.t("shop.subscription.monthlySuffix")}</Text>
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
                style={[
                  styles.subscribeButton,
                  planId === plan.id && isSubscriptionActive && styles.subscribeButtonActive,
                  isSubscribing && styles.subscribeButtonDisabled,
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={isSubscribing || (planId === plan.id && isSubscriptionActive)}
              >
                <Text style={styles.subscribeButtonText}>
                  {isSubscribing
                    ? i18n.t("shop.subscription.processing")
                    : planId === plan.id && isSubscriptionActive
                      ? i18n.t("shop.subscription.active")
                      : i18n.t("shop.subscription.subscribe")}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Ionicons name="diamond" size={24} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{i18n.t("shop.sections.items")}</Text>
        </View>

        {/* Shop Items */}
        {shopItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              {item.customIcon ? (
                item.customIcon
              ) : (
                <Ionicons name={item.icon} size={40} color={theme.colors.accent} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              {item.id === "freeze" && (
                <Text style={styles.itemOwned}>
                  {i18n.t("shop.items.ownedCount", { count: freezeCount })}
                </Text>
              )}
              {item.id === "energy_full_refill" && (
                <Text style={styles.itemOwned}>
                  {i18n.t("shop.items.energyFullRefill.remainingToday", { count: dailyEnergyRefillRemaining })}
                </Text>
              )}
            </View>
            <Pressable
              style={[
                styles.buyButton,
                justPurchased === item.id && styles.buyButtonSuccess,
              ]}
              onPress={() => handlePurchase(item)}
            >
              {justPurchased === item.id ? (
                <Ionicons name="checkmark" size={20} color="#fff" />
              ) : (
                <>
                  <GemIcon size={16} />
                  <Text style={styles.buyButtonText}>{item.price}</Text>
                </>
              )}
            </Pressable>
          </View>
        ))}

        {/* Placeholder for future items */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="time-outline" size={32} color={theme.colors.sub} />
          <Text style={styles.comingSoonText}>{i18n.t("shop.comingSoon")}</Text>
        </View>
      </ScrollView>

      {/* Info Footer */}
      <View style={styles.footer}>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  gemsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  gemsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  gemsInfo: {
    flex: 1,
  },
  gemsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
    marginBottom: 4,
  },
  gemsValue: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  itemIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.sub,
    lineHeight: 20,
  },
  itemOwned: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accent,
    marginTop: 4,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: "center",
  },
  buyButtonSuccess: {
    backgroundColor: theme.colors.success,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  comingSoonCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  comingSoonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.sub,
    marginTop: 12,
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
  // Subscription styles
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
  plansContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.colors.line,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  planHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    paddingBottom: 16,
  },
  planName: {
    fontSize: 24,
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
  planFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonActive: {
    backgroundColor: theme.colors.success,
  },
  subscribeButtonDisabled: {
    backgroundColor: theme.colors.line,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.line,
    marginVertical: 24,
  },
});
