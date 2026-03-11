import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useBillingState, useEconomyState } from "../../lib/state";
import { useAuth } from "../../lib/AuthContext";
import { GlobalHeader } from "../../components/GlobalHeader";
import {
  getStorefrontPlans,
  getSupabaseFunctionsUrl,
  resolvePlanPriceId,
  supportsPlanBillingPeriod,
  type PriceVersion,
  type PlanConfig,
} from "../../lib/plans";
import {
  detectUserRegion,
  getPlanPrice,
  getYearlyDiscount,
  getYearlyMonthlyEquivalent,
  type BillingPeriod,
} from "../../lib/pricing";
import { getShopSinksConfig } from "../../lib/gamificationConfig";
import i18n from "../../lib/i18n";
import { GemIcon, EnergyIcon } from "../../components/CustomIcons";
import { useToast } from "../../components/ToastProvider";
import { Analytics } from "../../lib/analytics";
import { assignExperiment } from "../../lib/experimentEngine";
import { getCheckoutContextKey } from "../../lib/planChangeTracking";
import type { EnergyFullRefillFailureReason } from "../../lib/energyFullRefill";
import type { DoubleXpPurchaseFailureReason } from "../../lib/doubleXpPurchase";

// import { Firefly } from "../../components/Firefly"; // TODO: Re-enable after native rebuild

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  action: () =>
    | boolean
    | { success: boolean; reason?: EnergyFullRefillFailureReason | DoubleXpPurchaseFailureReason };
}

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
  const { showToast } = useToast();
  const [nowTs, setNowTs] = useState(Date.now());
  const bottomTabBarHeight = useBottomTabBarHeight();
  const itemsBottomInset = bottomTabBarHeight + theme.spacing.lg;
  const footerBottomInset = bottomTabBarHeight + theme.spacing.md;
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
  const userRegion = detectUserRegion();
  const accountAgeDays = React.useMemo(() => {
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

  const proYearlyAvailable = supportsPlanBillingPeriod("pro", "yearly");

  useEffect(() => {
    if (!proYearlyAvailable && proBillingPeriod === "yearly") {
      setProBillingPeriod("monthly");
    }
  }, [proYearlyAvailable, proBillingPeriod]);

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
      showToast(String(item.name), "success");
    } else {
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
    }
  };

  const resolveCheckoutTrialDays = (): number => {
    if (!user?.id) return 0;
    const assignment = assignExperiment(user.id, "pro_trial_checkout");
    if (!assignment) return 0;
    const value = Number(assignment.payload?.trialDays);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(30, Math.floor(value)));
  };

  const resolveCheckoutPriceContext = (
    plan: PlanConfig,
    billingPeriod: BillingPeriod
  ): { priceVersion: PriceVersion; priceCohort: string } => {
    if (
      plan.id !== "pro" ||
      billingPeriod !== "monthly" ||
      userRegion !== "JP" ||
      planId !== "free" ||
      !user?.id ||
      accountAgeDays === null ||
      accountAgeDays > 14
    ) {
      return { priceVersion: "control", priceCohort: "default" };
    }

    const assignment = assignExperiment(user.id, "pro_monthly_price_jp");
    const priceVersion: PriceVersion = assignment?.variantId === "variant_a" ? "variant_a" : "control";
    return {
      priceVersion,
      priceCohort: "jp_new_14d_free",
    };
  };

  const handleSubscribe = async (plan: PlanConfig) => {
    const billingPeriod: BillingPeriod = plan.id === "pro" ? proBillingPeriod : "monthly";
    if (!supportsPlanBillingPeriod(plan.id, billingPeriod)) {
      showToast(String(i18n.t("shop.errors.billingPeriodUnavailable")), "error");
      return;
    }

    const trialDays = plan.id === "pro" ? resolveCheckoutTrialDays() : 0;
    const { priceVersion, priceCohort } = resolveCheckoutPriceContext(plan, billingPeriod);
    const resolvedPriceId = resolvePlanPriceId(plan.id, billingPeriod, priceVersion);
    const source = "shop_tab";
    Analytics.track("plan_select", {
      source,
      planId: plan.id,
    });

    if (!resolvedPriceId) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "price_id_unavailable",
      });
      showToast(String(i18n.t("shop.errors.billingPeriodUnavailable")), "error");
      return;
    }

    if (!user?.id || !user?.email) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "missing_user_context",
      });
      showToast(String(i18n.t("shop.errors.checkoutProcessFailed")), "error");
      return;
    }

    const functionsUrl = getSupabaseFunctionsUrl();
    if (!functionsUrl) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "functions_url_missing",
      });
      showToast(String(i18n.t("shop.errors.checkoutProcessFailed")), "error");
      return;
    }

    if (!session?.access_token) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan.id,
        reason: "missing_auth_token",
      });
      showToast(String(i18n.t("shop.errors.checkoutProcessFailed")), "error");
      return;
    }

    Analytics.track("checkout_start", {
      source,
      planId: plan.id,
      billingPeriod,
      trialDays,
      priceVersion,
      priceCohort,
    });

    if (user?.id) {
      try {
        await AsyncStorage.setItem(
          getCheckoutContextKey(user.id),
          JSON.stringify({
            planId: plan.id,
            billingPeriod,
            trialDays,
            priceVersion,
            priceCohort,
            startedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.warn("Failed to persist checkout context", error);
      }
    }

    setIsSubscribing(true);
    try {
      // Call Supabase Function to create checkout session
      const response = await fetch(`${functionsUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          billingPeriod,
          trialDays,
          priceVersion,
          priceCohort,
          priceId: resolvedPriceId ?? undefined,
        }),
      });

      if (!response.ok) {
        Analytics.track("checkout_failed", {
          source,
          planId: plan.id,
          reason: "http_error",
          status: response.status,
        });
        throw new Error("checkout_http_error");
      }

      const data = await response.json();

      if (data.url) {
        // Open Stripe Checkout in browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          showToast(String(i18n.t("shop.errors.openCheckoutFailed")), "error");
        }
      } else {
        Analytics.track("checkout_failed", {
          source,
          planId: plan.id,
          reason: "missing_checkout_url",
        });
        showToast(String(i18n.t("shop.errors.checkoutSessionFailed")), "error");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const isCheckoutHttpError =
        error instanceof Error && error.message === "checkout_http_error";
      if (!isCheckoutHttpError) {
        Analytics.track("checkout_failed", {
          source,
          planId: plan.id,
          reason: "exception",
        });
      }
      showToast(String(i18n.t("shop.errors.checkoutProcessFailed")), "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatPlanPrice = (plan: PlanConfig, billingPeriod: BillingPeriod): string => {
    const planType = plan.id === "max" ? "max" : "pro";
    try {
      return getPlanPrice(planType, billingPeriod);
    } catch {
      return `¥${plan.priceMonthly.toLocaleString()}`;
    }
  };

  const purchasablePlans = getStorefrontPlans();
  const shouldShowProBillingToggle =
    purchasablePlans.some((plan) => plan.id === "pro") && proYearlyAvailable;

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
      action: () => buyDoubleXP("shop_item"),
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
      <ScrollView
        testID="shop-scroll"
        style={styles.scrollView}
        contentContainerStyle={[styles.itemsContainer, { paddingBottom: itemsBottomInset }]}
      >
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

        {proYearlyAvailable && (
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
        )}

        <View style={styles.energyStatusCard}>
          <View style={styles.energyStatusHeader}>
            <EnergyIcon size={20} />
            <Text style={styles.energyStatusTitle}>{i18n.t("shop.energyStatus.title")}</Text>
          </View>
          <Text
            style={styles.energyStatusRow}
            accessible
            accessibilityLabel={
              isSubscriptionActive
                ? String(i18n.t("shop.energyStatus.currentUnlimitedA11y"))
                : `${String(i18n.t("shop.energyStatus.currentLabel"))}${energy}/${maxEnergy}`
            }
          >
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

        {shouldShowProBillingToggle && (
          <View style={styles.billingPeriodToggle}>
            <Pressable
              testID="shop-billing-monthly"
              style={[
                styles.billingPeriodOption,
                proBillingPeriod === "monthly" && styles.billingPeriodOptionActive,
              ]}
              onPress={() => setProBillingPeriod("monthly")}
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
              onPress={() => setProBillingPeriod("yearly")}
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
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>

          {purchasablePlans.map((plan) => {
            const selectedPeriod: BillingPeriod = plan.id === "pro"
              ? (proYearlyAvailable ? proBillingPeriod : "monthly")
              : "monthly";
            const showYearlyMeta = plan.id === "pro" && selectedPeriod === "yearly";
            const subscribeStatusLabel = isSubscribing
              ? String(i18n.t("shop.subscription.processing"))
              : planId === plan.id && isSubscriptionActive
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
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{i18n.t("shop.subscription.popular")}</Text>
                </View>
              )}
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
                {showYearlyMeta && (
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
                )}
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
                  planId === plan.id && isSubscriptionActive && styles.subscribeButtonActive,
                  isSubscribing && styles.subscribeButtonDisabled,
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={isSubscribing || (planId === plan.id && isSubscriptionActive)}
                accessibilityRole="button"
                accessibilityLabel={subscribeAccessibilityLabel}
                accessibilityState={{
                  busy: isSubscribing,
                  disabled: isSubscribing || (planId === plan.id && isSubscriptionActive),
                  selected: planId === plan.id && isSubscriptionActive,
                }}
              >
                <Text style={styles.subscribeButtonText}>
                  {isSubscribing
                    ? i18n.t("shop.subscription.processing")
                    : planId === plan.id && isSubscriptionActive
                      ? i18n.t("shop.subscription.active")
                      : i18n.t("shop.subscription.subscribe")}
                </Text>
              </Pressable>
              <Text style={styles.cancelAnytimeText}>{i18n.t("shop.subscription.cancelAnytime")}</Text>
            </View>
          );
        })}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Ionicons name="diamond" size={24} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>{i18n.t("shop.sections.items")}</Text>
        </View>

        {/* Shop Items */}
        {shopItems.map((item) => (
          <View key={item.id} style={styles.itemCard} testID={`shop-item-${item.id}`}>
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
              testID={`shop-buy-${item.id}`}
              style={[
                styles.buyButton,
                justPurchased === item.id && styles.buyButtonSuccess,
              ]}
              onPress={() => handlePurchase(item)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                justPurchased === item.id
                  ? String(i18n.t("shop.items.purchasedA11y", { name: item.name }))
                  : String(i18n.t("shop.items.buyButtonA11y", { name: item.name, price: item.price }))
              }
              accessibilityState={{ disabled: false }}
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
    minHeight: 44,
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
    maxWidth: "100%",
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
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  yearlyEquivalent: {
    fontSize: 12,
    color: theme.colors.sub,
    flex: 1,
  },
  yearlyDiscountBadge: {
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yearlyDiscountText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
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
  cancelAnytimeText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.sub,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.line,
    marginVertical: 24,
  },
});
