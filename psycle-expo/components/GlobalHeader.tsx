import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { router } from "expo-router";
import { getEnergy, ENERGY_MAX } from "../src/energy";

export function GlobalHeader() {
  const { xp, streak, gems, dailyXP, dailyGoal } = useAppState();
  const [energy, setEnergy] = useState(ENERGY_MAX);
  const dailyProgress = Math.min((dailyXP / dailyGoal) * 100, 100);

  useEffect(() => {
    setEnergy(getEnergy());
    const interval = setInterval(() => setEnergy(getEnergy()), 60000); // 1分ごとに更新
    return () => clearInterval(interval);
  }, []);

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

        <Pressable style={styles.energyItem} onPress={() => router.push("/(tabs)/shop")}>
          <Ionicons
            name="flash"
            size={18}
            color={energy > 5 ? theme.colors.accent : energy > 0 ? "#ff9800" : "#ccc"}
          />
          <Text style={[styles.value, energy === 0 && styles.zeroEnergy]}>
            {energy}/{ENERGY_MAX}
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
  zeroEnergy: {
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
  energyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff3e0",
  },
});
