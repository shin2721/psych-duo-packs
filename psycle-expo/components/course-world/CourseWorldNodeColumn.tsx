import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CourseWorldNode, CourseWorldViewModel } from "../../lib/courseWorld";

export function CourseWorldNodeColumn({
  model,
  allNodes,
  themeColor,
  primaryTestID,
  supportTestID,
  onPrimaryPress,
  onSupportPress,
  onNodePress,
}: {
  model: CourseWorldViewModel;
  allNodes: CourseWorldNode[];
  themeColor: string;
  primaryTestID: string;
  supportTestID: string;
  onPrimaryPress: () => void;
  onSupportPress?: () => void;
  onNodePress?: (nodeId: string) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.title}>{model.currentLesson.title}</Text>
        <Text style={styles.body}>{model.currentLesson.body}</Text>
        <View style={[styles.metaPill, { borderColor: `${themeColor}33`, backgroundColor: `${themeColor}12` }]}>
          <Ionicons name="sparkles" size={14} color={themeColor} />
          <Text style={[styles.metaText, { color: themeColor }]}>{model.currentLesson.meta}</Text>
        </View>
      </View>

      <View style={styles.nodeRow}>
        {allNodes
          .filter((node) => node.id !== model.currentLesson.id)
          .map((node) => (
          <Pressable
            key={node.id}
            style={[
              styles.nodeChip,
              node.status === "current"
                ? { borderColor: themeColor, backgroundColor: `${themeColor}18` }
                : styles.nodeChipIdle,
            ]}
            onPress={node.isInteractive ? () => onNodePress?.(node.id) : undefined}
            accessibilityRole="button"
            accessibilityLabel={node.accessibilityLabel}
            accessibilityState={{
              disabled: !node.isInteractive,
              selected: node.status === "current",
            }}
          >
            <Ionicons name={node.icon as keyof typeof Ionicons.glyphMap} size={16} color={node.status === "current" ? themeColor : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.nodeChipLabel, node.status === "current" ? { color: "#fff" } : undefined]}>{node.label}</Text>
          </Pressable>
        ))}
      </View>

      {model.supportMoment ? (
        <Pressable
          style={styles.supportCard}
          onPress={onSupportPress}
          accessibilityRole="button"
          accessibilityHint={model.supportMoment.accessibilityHint}
          testID={supportTestID}
        >
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>{model.supportMoment.title}</Text>
            <Text style={styles.supportBody}>{model.supportMoment.body}</Text>
          </View>
          {model.supportMoment.ctaLabel ? (
            <View style={styles.supportCta}>
              <Text style={styles.supportCtaText}>{model.supportMoment.ctaLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.primaryButton, { backgroundColor: themeColor }]}
        onPress={onPrimaryPress}
        accessibilityRole="button"
        accessibilityLabel={model.primaryAction.label}
        testID={primaryTestID}
      >
        <Text style={styles.primaryButtonText}>{model.primaryAction.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  infoCard: {
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "rgba(255,255,255,0.97)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 32,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32,
  },
  body: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  nodeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  nodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  nodeChipIdle: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  nodeChipLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  supportCopy: {
    flex: 1,
    gap: 4,
  },
  supportTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  supportBody: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 18,
  },
  supportCta: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  supportCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#08111F",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
