import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { GemIcon } from "../CustomIcons";
import i18n from "../../lib/i18n";
import type { ShopItem } from "../../lib/shop/shopCatalog";

interface ShopItemsSectionProps {
  dailyEnergyRefillRemaining: number;
  freezeCount: number;
  justPurchased: string | null;
  onPurchase: (item: ShopItem) => void;
  shopItems: ShopItem[];
}

export function ShopItemsSection(props: ShopItemsSectionProps) {
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.sectionHeader}>
        <Ionicons name="diamond" size={24} color={theme.colors.accent} />
        <Text style={styles.sectionTitle}>{i18n.t("shop.sections.items")}</Text>
      </View>

      {props.shopItems.map((item) => (
        <View key={item.id} style={styles.itemCard} testID={`shop-item-${item.id}`}>
          <View style={styles.itemIcon}>
            {item.customIcon ? item.customIcon : <Ionicons name={item.icon} size={40} color={theme.colors.accent} />}
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.id === "freeze" && (
              <Text style={styles.itemOwned}>
                {i18n.t("shop.items.ownedCount", { count: props.freezeCount })}
              </Text>
            )}
            {item.id === "energy_full_refill" && (
              <Text style={styles.itemOwned}>
                {i18n.t("shop.items.energyFullRefill.remainingToday", {
                  count: props.dailyEnergyRefillRemaining,
                })}
              </Text>
            )}
          </View>
          <Pressable
            testID={`shop-buy-${item.id}`}
            style={[
              styles.buyButton,
              props.justPurchased === item.id && styles.buyButtonSuccess,
            ]}
            onPress={() => props.onPurchase(item)}
            accessibilityRole="button"
            accessibilityLabel={
              props.justPurchased === item.id
                ? String(i18n.t("shop.items.purchasedA11y", { name: item.name }))
                : String(i18n.t("shop.items.buyButtonA11y", { name: item.name, price: item.price }))
            }
            accessibilityState={{ disabled: false }}
          >
            {props.justPurchased === item.id ? (
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

      <View style={styles.comingSoonCard}>
        <Ionicons name="time-outline" size={32} color={theme.colors.sub} />
        <Text style={styles.comingSoonText}>{i18n.t("shop.comingSoon")}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.line,
    marginBottom: 24,
  },
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
});
