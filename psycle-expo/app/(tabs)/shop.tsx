import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { GlobalHeader } from "../../components/GlobalHeader";
import { PLANS, SUPABASE_FUNCTION_URL, type PlanConfig } from "../../lib/plans";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => boolean;
}

export default function ShopScreen() {
  const { gems, buyFreeze, freezeCount, planId, isSubscriptionActive, activeUntil } = useAppState();
  const [justPurchased, setJustPurchased] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handlePurchase = (item: ShopItem) => {
    const success = item.action();
    if (success) {
      setJustPurchased(item.id);
      setTimeout(() => setJustPurchased(null), 2000);
      Alert.alert("購入完了！", `${item.name}を購入しました`);
    } else {
      Alert.alert("購入失敗", "Gemsが足りません");
    }
  };

  const handleSubscribe = async (plan: PlanConfig) => {
    setIsSubscribing(true);
    try {
      // Call Supabase Function to create checkout session
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: "", // TODO: Add actual user ID when auth is implemented
          email: "user@example.com", // TODO: Get from auth
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Open Stripe Checkout in browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert("エラー", "決済ページを開けませんでした");
        }
      } else {
        Alert.alert("エラー", "決済セッションの作成に失敗しました");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("エラー", "決済処理中にエラーが発生しました");
    } finally {
      setIsSubscribing(false);
    }
  };

  const shopItems: ShopItem[] = [
    {
      id: "freeze",
      name: "ストリークフリーズ",
      description: "ストリークを1日守ることができます",
      price: 10,
      icon: "snow-outline",
      action: buyFreeze,
    },
    // Future items can be added here
    // {
    //   id: "double_xp",
    //   name: "ダブルXPブースト",
    //   description: "15分間XPが2倍になります",
    //   price: 20,
    //   icon: "flash-outline",
    //   action: buyDoubleXP,
    // },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader />
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="storefront" size={32} color={theme.colors.accent} />
        <Text style={styles.title}>ショップ</Text>
      </View>

      {/* Gems Balance */}
      <View style={styles.gemsCard}>
        <Ionicons name="diamond" size={32} color={theme.colors.accent} />
        <View style={styles.gemsInfo}>
          <Text style={styles.gemsLabel}>所持Gems</Text>
          <Text style={styles.gemsValue}>{gems}</Text>
        </View>
      </View>

      {/* Subscription Plans */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.itemsContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={24} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>プレミアムプラン</Text>
        </View>

        {/* Current Subscription Status */}
        {isSubscriptionActive && activeUntil && (
          <View style={styles.activeSubscriptionCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <View style={styles.subscriptionInfo}>
              <Text style={styles.activeSubscriptionText}>
                {planId === "pro" ? "Pro" : "Max"}プラン有効中
              </Text>
              <Text style={styles.activeSubscriptionDate}>
                有効期限: {new Date(activeUntil).toLocaleDateString("ja-JP")}
              </Text>
            </View>
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>人気</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>¥{plan.priceMonthly.toLocaleString()}</Text>
                <Text style={styles.planPeriod}>/月</Text>
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
                    ? "処理中..."
                    : planId === plan.id && isSubscriptionActive
                    ? "有効中"
                    : "登録する"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Ionicons name="diamond" size={24} color={theme.colors.accent} />
          <Text style={styles.sectionTitle}>アイテム</Text>
        </View>

        {/* Shop Items */}
        {shopItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={40} color={theme.colors.accent} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              {item.id === "freeze" && (
                <Text style={styles.itemOwned}>所持数: {freezeCount}</Text>
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
                  <Ionicons name="diamond" size={16} color="#fff" />
                  <Text style={styles.buyButtonText}>{item.price}</Text>
                </>
              )}
            </Pressable>
          </View>
        ))}

        {/* Placeholder for future items */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="time-outline" size={32} color={theme.colors.sub} />
          <Text style={styles.comingSoonText}>さらなるアイテムが近日公開！</Text>
        </View>
      </ScrollView>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.sub} />
        <Text style={styles.footerText}>Gemsはレッスンやクエストで獲得できます</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
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
