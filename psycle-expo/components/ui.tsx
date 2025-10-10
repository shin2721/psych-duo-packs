import React, { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ value, max, style }: { value: number; max: number; style?: ViewStyle }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <View style={[styles.progressTrack, style]}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.line,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  pillActive: {
    backgroundColor: theme.colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  pillTextActive: {
    color: "#001",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
});
