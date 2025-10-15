import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { router } from "expo-router";

export function GlobalHeader() {
  const { xp, streak, gems, lives, maxLives, dailyXP, dailyGoal } = useAppState();
  const dailyProgress = Math.min((dailyXP / dailyGoal) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Left: Streak */}
      <Pressable style={styles.item} onPress={() => router.push("/(tabs)/course")}>
        <Ionicons name="flame" size={20} color={theme.colors.accent} />
        <Text style={styles.value}>{streak}</Text>
      </Pressable>

      {/* Center: Daily Goal Ring */}
      <Pressable style={styles.goalRing} onPress={() => router.push("/(tabs)/course")}>
        <Svg width={48} height={48}>
          {/* Background ring */}
          <Circle
            cx={24}
            cy={24}
            r={20}
            stroke="#e0e0e0"
            strokeWidth={4}
            fill="none"
          />
          {/* Progress ring */}
          <Circle
            cx={24}
            cy={24}
            r={20}
            stroke={theme.colors.success}
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${(dailyProgress / 100) * 125.6} 125.6`}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        </Svg>
        <View style={styles.goalContent}>
          <Text style={styles.goalXP}>{dailyXP}</Text>
        </View>
      </Pressable>

      {/* Right: Gems & Lives */}
      <View style={styles.rightGroup}>
        <Pressable style={styles.item} onPress={() => router.push("/(tabs)/shop")}>
          <Ionicons name="diamond" size={18} color={theme.colors.primary} />
          <Text style={styles.value}>{gems}</Text>
        </Pressable>

        <Pressable style={styles.livesItem} onPress={() => router.push("/(tabs)/shop")}>
          <Ionicons
            name="heart"
            size={18}
            color={lives > 0 ? theme.colors.error : "#ccc"}
          />
          <Text style={[styles.value, lives === 0 && styles.zeroLives]}>
            {lives}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Simple SVG components (React Native doesn't have built-in SVG)
import Svg, { Circle } from "react-native-svg";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"], // Monospace numbers
    color: "#1a1a1a",
  },
  zeroLives: {
    color: "#ccc",
  },
  goalRing: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  goalContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  goalXP: {
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: theme.colors.success,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  livesItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffe0e0",
  },
});
