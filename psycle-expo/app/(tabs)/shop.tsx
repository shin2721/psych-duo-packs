import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { GlobalHeader } from "../../components/GlobalHeader";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => boolean;
}

export default function ShopScreen() {
  const { gems, buyFreeze, freezeCount } = useAppState();
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

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
        <Ionicons name="storefront" size={32} color={theme.colors.primary} />
        <Text style={styles.title}>ショップ</Text>
      </View>

      {/* Gems Balance */}
      <View style={styles.gemsCard}>
        <Ionicons name="diamond" size={32} color={theme.colors.primary} />
        <View style={styles.gemsInfo}>
          <Text style={styles.gemsLabel}>所持Gems</Text>
          <Text style={styles.gemsValue}>{gems}</Text>
        </View>
      </View>

      {/* Shop Items */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.itemsContainer}>
        {shopItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={40} color={theme.colors.primary} />
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
          <Ionicons name="time-outline" size={32} color={theme.colors.textSecondary} />
          <Text style={styles.comingSoonText}>さらなるアイテムが近日公開！</Text>
        </View>
      </ScrollView>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
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
    color: theme.colors.fg,
  },
  gemsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight,
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
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  gemsValue: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary,
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
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  itemOwned: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary,
    marginTop: 4,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
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
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginTop: 8,
  },
  comingSoonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.primaryLight,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
