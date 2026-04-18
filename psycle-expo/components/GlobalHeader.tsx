import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../lib/theme";
import { useBillingState, useEconomyState, useProgressionState } from "../lib/state";
import { router } from "expo-router";
import { genres } from "../lib/data";
import { StreakIcon, GemIcon, EnergyIcon } from "./CustomIcons";
import { Analytics } from "../lib/analytics";
import i18n from "../lib/i18n";
import { GlobalHeaderMenu } from "./GlobalHeaderMenu";
import { getGenreIcon, getGenreLabel } from "./globalHeaderHelpers";

export function GlobalHeader() {
  const { gems, energy } = useEconomyState();
  const { selectedGenre, setSelectedGenre, streak } = useProgressionState();
  const { isSubscriptionActive } = useBillingState();
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedGenreLabel = getGenreLabel(
    selectedGenre,
    genres.find((genre) => genre.id === selectedGenre)?.label || selectedGenre
  );

  return (
    <>
      <View style={styles.container}>
        {/* 1. Course Selector */}
        <Pressable
          style={styles.item}
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t("globalHeader.a11y.courseSelector", { course: selectedGenreLabel }))}
        >
          {getGenreIcon(selectedGenre, 36)}
        </Pressable>

        {/* 2. Study Streak */}
        <Pressable
          style={[styles.item, streak === 0 && styles.itemDim]}
          onPress={() => router.push("/(tabs)/course")}
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t("globalHeader.a11y.streak", { count: streak }))}
        >
          <StreakIcon size={24} />
          <Text style={[styles.value, { color: streak > 0 ? "#f97316" : theme.colors.sub }]}>{streak}</Text>
        </Pressable>

        {/* 3. Gems */}
        <Pressable
          style={[styles.item, gems === 0 && styles.itemDim]}
          onPress={() => router.push("/(tabs)/shop")}
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t("globalHeader.a11y.gems", { count: gems }))}
        >
          <GemIcon size={22} />
          <Text style={[styles.value, { color: gems > 0 ? "#3debf6" : theme.colors.sub }]}>{gems}</Text>
        </Pressable>

        {/* 4. Energy */}
        <Pressable
          style={styles.item}
          onPress={() => {
            Analytics.track("shop_open_from_energy", { source: "header_energy_tap" });
            router.push("/(tabs)/shop");
          }}
          accessibilityRole="button"
          accessibilityLabel={String(
            i18n.t(
              isSubscriptionActive ? "globalHeader.a11y.energyUnlimited" : "globalHeader.a11y.energy",
              { count: energy }
            )
          )}
        >
          <EnergyIcon
            size={22}
            color={!isSubscriptionActive && energy <= 0 ? "#ccc" : undefined}
          />
          <Text style={[styles.value, { color: !isSubscriptionActive && energy <= 0 ? theme.colors.sub : theme.colors.text }]}>
            {isSubscriptionActive ? "∞" : energy}
          </Text>
        </Pressable>
      </View>

      <GlobalHeaderMenu
        menuVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectGenre={(genreId) => {
          setSelectedGenre(genreId);
          setMenuVisible(false);
        }}
        selectedGenre={selectedGenre}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Distribute 4 items evenly
    paddingHorizontal: 24, // Increased padding
    paddingVertical: 12,
    backgroundColor: "transparent",
    zIndex: 100,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 44, // Minimum touch area
    minHeight: 44,
    justifyContent: 'center',
  },
  itemDim: {
    opacity: 0.45,
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: theme.colors.text,
  },
});
