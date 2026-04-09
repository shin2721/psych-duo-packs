import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import { GLOW_COLOR_BRIGHT, MILESTONE_NODE_SIZE, NODE_SIZE } from "./trailMath";
import type { TrailNode } from "./types";

type IoniconName = keyof typeof Ionicons.glyphMap;

function isIoniconName(name: string): name is IoniconName {
  const glyphMap = (Ionicons as unknown as { glyphMap?: Record<string, number> }).glyphMap ?? {};
  return name in glyphMap;
}

function resolveTrailIcon(node: TrailNode, isMilestone: boolean): IoniconName | null {
  if (node.isLocked) return "lock-closed";
  if (node.status === "done") return "checkmark";
  if (node.type === "review_blackhole") return "planet";
  if (node.status === "locked" || node.status === "future") {
    return isMilestone ? "star" : null;
  }
  return isIoniconName(node.icon) ? node.icon : "ellipse";
}

export function LevelIndicator({
  level,
  x,
  y,
  isLeft,
  isMilestone,
  color,
}: {
  level: number;
  x: number;
  y: number;
  isLeft: boolean;
  isMilestone: boolean;
  color?: string;
}) {
  const activeColor = color || GLOW_COLOR_BRIGHT;
  const offset = isMilestone ? 52 : 44;

  return (
    <View
      style={{
        position: "absolute",
        left: isLeft ? x - offset - 30 : x + offset,
        top: y - 10,
        width: 30,
        alignItems: isLeft ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          backgroundColor: isMilestone ? `${activeColor}25` : "rgba(255,255,255,0.05)",
        }}
      >
        <Animated.Text
          style={{
            fontSize: isMilestone ? 13 : 11,
            fontWeight: isMilestone ? "700" : "500",
            color: isMilestone ? activeColor : "rgba(255,255,255,0.35)",
            textAlign: "center",
          }}
        >
          {level}
        </Animated.Text>
      </View>
    </View>
  );
}

export function TrailNodeView({
  node,
  x,
  y,
  isMilestone,
  onPress,
  themeColor,
  nodeIndex,
}: {
  node: TrailNode;
  x: number;
  y: number;
  isMilestone: boolean;
  onPress: () => void;
  themeColor?: string;
  nodeIndex: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const outerRingScale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const nodeSize = isMilestone ? MILESTONE_NODE_SIZE : NODE_SIZE;
  const activeGlow = themeColor || GLOW_COLOR_BRIGHT;
  const activeSuccess = themeColor || theme.colors.success;
  const nodeNumber = nodeIndex + 1;

  const accessibilityLabel = useMemo(() => {
    if (node.status === "done") {
      return String(i18n.t("course.accessibility.nodeCompleted", { number: nodeNumber }));
    }
    if (node.isLocked) {
      return String(i18n.t("course.accessibility.nodeLocked", { number: nodeNumber }));
    }
    if (node.status === "current") {
      return String(i18n.t("course.accessibility.nodeCurrent", { number: nodeNumber }));
    }
    return String(i18n.t("course.accessibility.nodeAvailable", { number: nodeNumber }));
  }, [node.isLocked, node.status, nodeNumber]);

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
      ])
    );
    floatAnimation.start();

    let scaleAnimation: Animated.CompositeAnimation | null = null;
    let outerRingAnimation: Animated.CompositeAnimation | null = null;

    if (node.status === "current") {
      scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      outerRingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(outerRingScale, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
          Animated.timing(outerRingScale, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        ])
      );

      scaleAnimation.start();
      outerRingAnimation.start();
    }

    return () => {
      floatAnimation.stop();
      scaleAnimation?.stop();
      outerRingAnimation?.stop();
    };
  }, [floatY, node.status, outerRingScale, scale]);

  const palette = (() => {
    switch (node.status) {
      case "done":
        return { bg: activeSuccess, glow: activeSuccess, iconColor: "#000", borderWidth: 0 };
      case "current":
        return { bg: activeGlow, glow: activeGlow, iconColor: "#000", borderWidth: 0 };
      case "locked":
      case "future":
        return {
          bg: "transparent",
          glow: "transparent",
          iconColor: "rgba(255,255,255,0.25)",
          borderWidth: isMilestone ? 3 : 2,
          borderColor: isMilestone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
        };
    }
  })();

  const iconName = resolveTrailIcon(node, isMilestone);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - nodeSize / 2,
        top: y - nodeSize / 2,
        transform: [{ translateY: floatY }],
      }}
    >
      {node.status === "current" && (
        <Animated.View
          style={{
            position: "absolute",
            width: nodeSize * 1.4,
            height: nodeSize * 1.4,
            left: -nodeSize * 0.2,
            top: -nodeSize * 0.2,
            borderRadius: (nodeSize * 1.4) / 2,
            backgroundColor: activeGlow,
            transform: [{ scale: outerRingScale }],
            opacity: 0.2,
          }}
        />
      )}

      {isMilestone && node.status !== "current" && (
        <View
          style={{
            position: "absolute",
            width: nodeSize + 8,
            height: nodeSize + 8,
            left: -4,
            top: -4,
            borderRadius: (nodeSize + 8) / 2,
            borderWidth: 1,
            borderColor: node.status === "done" ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.1)",
            borderStyle: "dashed",
          }}
        />
      )}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              backgroundColor: palette.bg,
              shadowColor: palette.glow,
              shadowOpacity: node.status === "current" ? 1 : node.status === "done" ? 0.7 : 0,
              shadowRadius: node.status === "current" ? 30 : 15,
              borderWidth: palette.borderWidth,
              borderColor: palette.borderWidth ? palette.borderColor : undefined,
            },
          ]}
          onPress={node.isLocked || node.status === "current" ? onPress : undefined}
          disabled={!node.isLocked && node.status !== "current"}
          testID={`lesson-node-${node.id}`}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{
            disabled: !node.isLocked && node.status !== "current",
            selected: node.status === "current",
          }}
        >
          {iconName ? (
            <Ionicons
              name={iconName}
              size={node.isLocked ? (isMilestone ? 24 : 20) : isMilestone ? 32 : 28}
              color={palette.iconColor}
            />
          ) : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
