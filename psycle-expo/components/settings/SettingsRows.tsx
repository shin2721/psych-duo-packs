import React from "react";
import { View, Text, StyleSheet, Pressable, Switch, type AccessibilityState } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import type { IoniconName } from "../../lib/ioniconName";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

export function SettingStatusRow({
  status,
  message,
  testID,
}: {
  status: "loading" | "success" | "error";
  message: string;
  testID: string;
}) {
  return (
    <View style={styles.statusRow} testID={testID}>
      <Text
        style={[
          styles.statusText,
          status === "success" && styles.statusTextSuccess,
          status === "error" && styles.statusTextError,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function SettingRow({
  icon,
  label,
  value,
  onPress,
  isDestructive = false,
  testID,
  showDivider = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
  testID?: string;
  showDivider?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}) {
  return (
    <Pressable
      style={[styles.settingRow, !showDivider && styles.settingRowNoDivider]}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={isDestructive ? theme.colors.error : theme.colors.text}
        />
        <Text style={[styles.settingLabel, isDestructive && styles.destructiveText]}>{label}</Text>
      </View>
      {value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.sub} />
      )}
    </Pressable>
  );
}

export function SettingToggle({
  icon,
  label,
  value,
  onValueChange,
  showDivider = true,
}: {
  icon: IoniconName;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !showDivider && styles.settingRowNoDivider]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.colors.text} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
        thumbColor="#fff"
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  settingRowNoDivider: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.sub,
  },
  statusRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.md,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.sub,
  },
  statusTextSuccess: {
    color: theme.colors.success,
  },
  statusTextError: {
    color: theme.colors.error,
  },
  destructiveText: {
    color: theme.colors.error,
  },
});
