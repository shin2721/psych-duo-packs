import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { theme } from "../lib/theme";

interface ChestProps {
  state: "closed" | "opening" | "opened";
  onOpen?: () => void;
  size?: "sm" | "md";
  label?: string;
}

export function Chest({ state, onOpen, size = "sm", label }: ChestProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === "opening") {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.08, duration: 300, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -1, duration: 300, useNativeDriver: true }),
          ]),
        ]),
        { iterations: 2 }
      ).start(() => {
        scaleAnim.setValue(1);
        rotateAnim.setValue(0);
      });
    }
  }, [state]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-12deg", "12deg"],
  });

  const dimensions = size === "md" ? { width: 80, height: 80 } : { width: 56, height: 56 };
  const disabled = state === "opened" || !onOpen;

  return (
    <Pressable onPress={onOpen} disabled={disabled} style={styles.container}>
      <Animated.View
        style={[
          styles.chest,
          dimensions,
          state === "opened" && styles.chestOpened,
          { transform: [{ scale: scaleAnim }, { rotate }] },
        ]}
      >
        <Text style={[styles.icon, size === "md" && styles.iconMd]}>
          {state === "opened" ? "📦" : "🎁"}
        </Text>
      </Animated.View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 4 },
  chest: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.warn,
  },
  chestOpened: {
    borderColor: theme.colors.success,
  },
  icon: {
    fontSize: 28,
  },
  iconMd: {
    fontSize: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.warn,
  },
});
