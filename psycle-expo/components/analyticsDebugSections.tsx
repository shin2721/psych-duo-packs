import React from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import type { DebugState } from "../lib/analytics-debug";

export function AnalyticsDebugHeader({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} style={styles.backButton}>
        <Ionicons name="close" size={24} color={theme.colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Analytics Debug</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function AnalyticsStatusSection({
  onToggleSecondLaunchMode,
  state,
}: {
  onToggleSecondLaunchMode: (value: boolean) => void;
  state: DebugState;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>STATUS</Text>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Result:</Text>
          <View
            style={[styles.badge, state.passed ? styles.passBadge : styles.failBadge]}
            testID="analytics-status"
          >
            <Text style={styles.badgeText} testID="analytics-status-text">
              {state.passed ? "✅ PASS" : "❌ FAIL"}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>anonId:</Text>
          <Text style={styles.value} numberOfLines={1} testID="analytics-anonid">
            {state.anonId}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Second Launch Mode:</Text>
          <Switch
            value={state.secondLaunchMode}
            onValueChange={onToggleSecondLaunchMode}
            trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
            thumbColor="#fff"
            testID="analytics-second-launch-toggle"
          />
        </View>

        {state.failures.length > 0 ? (
          <View style={styles.failuresContainer} testID="analytics-failures">
            <Text style={styles.failuresTitle}>Failures:</Text>
            {state.failures.map((failure, index) => (
              <Text key={index} style={styles.failureText}>
                • {failure}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function AnalyticsCountersSection({ state }: { state: DebugState }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>EVENT COUNTERS</Text>

      <View style={styles.countersGrid}>
        {Object.entries(state.counters).map(([name, count]) => (
          <View key={name} style={styles.counterItem}>
            <Text style={styles.counterValue} testID={`count-${name}`}>
              {count}
            </Text>
            <Text style={styles.counterName}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AnalyticsRecentEventsSection({ state }: { state: DebugState }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RECENT EVENTS (Last 10)</Text>

      <View style={styles.eventsContainer}>
        {state.events.slice(0, 10).map((event, index) => (
          <View key={index} style={styles.eventRow}>
            <View
              style={[
                styles.statusDot,
                event.status === "sent" && styles.sentDot,
                event.status === "queued" && styles.queuedDot,
                event.status === "failed" && styles.failedDot,
                event.status === "system" && styles.systemDot,
              ]}
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventMeta}>
                {event.status} • {event.timestamp.split("T")[1]?.slice(0, 8)}
              </Text>
            </View>
          </View>
        ))}
        {state.events.length === 0 ? (
          <Text style={styles.emptyText}>No events recorded yet</Text>
        ) : null}
      </View>
    </View>
  );
}

export function AnalyticsDebugActions({
  isResetting,
  onCopyReport,
  onReset,
}: {
  isResetting: boolean;
  onCopyReport: () => void;
  onReset: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.actionButton, styles.resetButton]}
        onPress={onReset}
        disabled={isResetting}
        testID="analytics-reset"
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>
          {isResetting ? "Resetting..." : "Reset"}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.actionButton, styles.copyButton]}
        onPress={onCopyReport}
        testID="analytics-copy-report"
      >
        <Ionicons name="copy" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Copy Report</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.sub,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: theme.colors.sub,
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    textAlign: "right",
    marginLeft: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passBadge: {
    backgroundColor: "#22c55e",
  },
  failBadge: {
    backgroundColor: "#ef4444",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  failuresContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },
  failuresTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 4,
  },
  failureText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 2,
  },
  countersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.sm,
  },
  counterItem: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  counterValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  counterName: {
    fontSize: 10,
    color: theme.colors.sub,
    marginTop: 2,
    textAlign: "center",
  },
  eventsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.sub,
  },
  sentDot: {
    backgroundColor: "#22c55e",
  },
  queuedDot: {
    backgroundColor: "#f59e0b",
  },
  failedDot: {
    backgroundColor: "#ef4444",
  },
  systemDot: {
    backgroundColor: "#3b82f6",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  eventMeta: {
    fontSize: 12,
    color: theme.colors.sub,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.sub,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  actions: {
    flexDirection: "row",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  resetButton: {
    backgroundColor: "#ef4444",
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
