import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { CourseHeroFinalScene } from "./courseHeroFinal/CourseHeroFinalScene";

export type CourseHeroFinalNodeStatus = "done" | "current" | "locked";

export interface CourseHeroFinalNode {
  id: string;
  icon: string;
  isLocked?: boolean;
  label: string;
  levelNumber: number;
  status: CourseHeroFinalNodeStatus;
}

export interface CourseHeroFinalProps {
  body: string;
  ctaAccessibilityLabel: string;
  ctaLabel: string;
  genreIcon: string;
  meta: string;
  nodes: CourseHeroFinalNode[];
  onNodePress: (nodeId: string) => void;
  onPrimaryPress: () => void;
  progressLabel: string;
  testID?: string;
  themeColor: string;
  title: string;
  unitLabel: string;
}

function splitNodes(nodes: CourseHeroFinalNode[]) {
  return {
    currentNode: nodes.find((node) => node.status === "current") ?? nodes[0] ?? null,
  };
}

export function CourseHeroFinal({
  ctaAccessibilityLabel,
  ctaLabel,
  meta,
  nodes,
  onNodePress,
  onPrimaryPress,
  progressLabel,
  testID = "course-hero-final",
  themeColor,
  title,
}: CourseHeroFinalProps) {
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(Math.max(width - 24, 320), 404);
  const { currentNode } = splitNodes(nodes.slice(0, 6));

  return (
    <View style={[styles.shell, { width: heroWidth }]} testID={testID}>
      <View style={styles.topRail}>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progressLabel}</Text>
        </View>
        <Text numberOfLines={1} style={styles.metaText}>
          {meta}
        </Text>
      </View>

      {currentNode ? (
        <CourseHeroFinalScene
          ctaAccessibilityLabel={ctaAccessibilityLabel}
          ctaLabel={ctaLabel}
          heroWidth={heroWidth}
          node={currentNode}
          onNodePress={() => onNodePress(currentNode.id)}
          onPrimaryPress={onPrimaryPress}
          testID={`${testID}-node-${currentNode.id}`}
          themeColor={themeColor}
          title={title}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metaText: {
    color: "#94a2af",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.06,
    textAlign: "right",
  },
  progressBadge: {
    alignItems: "center",
    backgroundColor: "rgba(246, 248, 255, 0.04)",
    borderColor: "rgba(151, 169, 195, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  progressText: {
    color: "#edf3fb",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 38,
  },
  shell: {
    alignSelf: "center",
    paddingVertical: 8,
    position: "relative",
  },
  topRail: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 6,
    position: "absolute",
    right: 0,
    top: 10,
    zIndex: 20,
  },
});
