import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

type SupportStatePanelProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
  testID?: string;
};

export function SupportStatePanel({
  icon,
  title,
  body,
  ctaLabel,
  onPress,
  testID = "support-state-panel",
}: SupportStatePanelProps) {
  return (
    <View style={styles.wrapper} testID={testID}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={28} color={theme.colors.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable
        style={styles.ctaButton}
        onPress={onPress}
        testID={`${testID}-cta`}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.14)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.sub,
    textAlign: "center",
  },
  ctaButton: {
    marginTop: theme.spacing.sm,
    minWidth: 220,
    alignItems: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
