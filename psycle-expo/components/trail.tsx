import React, { useRef, useEffect, useMemo } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { View, Pressable, StyleSheet, Dimensions, ScrollView, Animated } from "react-native";
import Svg, {
  Path, Defs, LinearGradient, Stop,
  Circle, RadialGradient, G, Rect,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import i18n from "../lib/i18n";
import { theme } from "../lib/theme";

// ==================== TYPES ====================
type NodeStatus = "done" | "current" | "locked" | "future";
type NodeType = "lesson" | "game" | "review_blackhole";

interface TrailNode {
  id: string;
  status: NodeStatus;
  icon: string;
  type?: NodeType;
  gameId?: string;
  lessonId?: string;
  isLocked?: boolean;
}

interface Props {
  trail: TrailNode[];
  hideLabels?: boolean;
  onStart?: (nodeId: string) => void;
  onLockedPress?: (nodeId: string) => void;
  themeColor?: string;
}

// ==================== CONSTANTS ====================
const SCREEN_WIDTH = Dimensions.get("window").width;
const NODE_SIZE = 64;
const MILESTONE_NODE_SIZE = 72;
const NODE_SPACING = 120;
const GLOW_COLOR = "#a8ff60";
const GLOW_COLOR_BRIGHT = "#eaff00";
const PATH_COLOR_DONE = "#22c55e";
const PATH_COLOR_FUTURE = "rgba(255,255,255,0.15)";

// Firefly color variations
const FIREFLY_COLORS = ["#a8ff60", "#ffdd60", "#ff9b60", "#ffdd60", "#60ffb0", "#ffaa40"];

// Star color temperature variations (cool to warm)
const STAR_COLORS = ["#ccdcff", "#dde4ff", "#fff8f0", "#ffeedd", "#ffe4cc", "#ffd4aa"];

// ==================== SHOOTING STAR ====================
function ShootingStar({ totalHeight }: { totalHeight: number }) {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shootStar = () => {
      const startY = Math.random() * totalHeight * 0.5;
      translateY.setValue(startY);
      translateX.setValue(-50);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(translateX, { toValue: SCREEN_WIDTH + 100, duration: 800, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: startY + 200, duration: 800, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(shootStar, 5000 + Math.random() * 10000);
      });
    };

    const timeout = setTimeout(shootStar, 2000 + Math.random() * 5000);
    return () => clearTimeout(timeout);
  }, [totalHeight]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 40,
        height: 2,
        backgroundColor: "#fff",
        borderRadius: 1,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: "35deg" }],
      }}
    />
  );
}

// ==================== NODE SPARKLE ====================
function NodeSparkle({ x, y }: { x: number; y: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sparkle = () => {
      opacity.setValue(0);
      scale.setValue(0.5);
      rotation.setValue(0);

      Animated.sequence([
        Animated.delay(Math.random() * 5000),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => {
        setTimeout(sparkle, 3000 + Math.random() * 7000);
      });
    };

    const timeout = setTimeout(sparkle, Math.random() * 3000);
    return () => clearTimeout(timeout);
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - 6,
        top: y - 6,
        width: 12,
        height: 12,
        opacity,
        transform: [{ scale }, { rotate: spin }],
      }}
    >
      <View style={{
        position: "absolute",
        left: 4,
        top: 0,
        width: 4,
        height: 12,
        backgroundColor: "#fff",
        borderRadius: 2,
      }} />
      <View style={{
        position: "absolute",
        left: 0,
        top: 4,
        width: 12,
        height: 4,
        backgroundColor: "#fff",
        borderRadius: 2,
      }} />
    </Animated.View>
  );
}

// ==================== BACKGROUND STAR COMPONENT ====================
function BackgroundStar({ x, y, size }: { x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;

  useEffect(() => {
    const twinkle = () => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.1, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5 + Math.random() * 0.3, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
      ]).start(() => twinkle());
    };
    const timeout = setTimeout(twinkle, Math.random() * 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#fff",
        opacity,
        // Add subtle glow for larger stars
        ...(size > 2 ? {
          shadowColor: "#fff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size * 2,
        } : {}),
      }}
    />
  );
}

// ==================== FLOATING PARTICLE COMPONENT ====================
function FloatingParticle({
  delay, size, startX, startY, moveX, moveY, duration, color = GLOW_COLOR
}: {
  delay: number; size: number; startX: number; startY: number;
  moveX: number; moveY: number; duration: number; color?: string;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -moveY, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: moveY, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, { toValue: moveX, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -moveX, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: duration * 0.9, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: duration * 0.5, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: duration * 0.5, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: size * 5,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

// ==================== LEVEL INDICATOR COMPONENT ====================
function LevelIndicator({ level, x, y, isLeft, isMilestone, color }: { level: number; x: number; y: number; isLeft: boolean; isMilestone: boolean, color?: string }) {
  const activeColor = color || GLOW_COLOR;
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
      <View style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: isMilestone ? `${activeColor}25` : "rgba(255,255,255,0.05)",
      }}>
        <Animated.Text style={{
          fontSize: isMilestone ? 13 : 11,
          fontWeight: isMilestone ? "700" : "500",
          color: isMilestone ? activeColor : "rgba(255,255,255,0.35)",
          textAlign: "center",
        }}>
          {level}
        </Animated.Text>
      </View>
    </View>
  );
}

// ==================== GLOWING NODE COMPONENT ====================
function GlowingNode({
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
  const outerGlowOpacity = useRef(new Animated.Value(0.5)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const nodeSize = isMilestone ? MILESTONE_NODE_SIZE : NODE_SIZE;
  const activeGlow = themeColor || GLOW_COLOR_BRIGHT;
  const activeSuccess = themeColor || theme.colors.success;
  const nodeNumber = nodeIndex + 1;
  const accessibilityLabel = (() => {
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
  })();

  useEffect(() => {
    // All nodes float gently
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
      ])
    ).start();

    if (node.status === "current") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(outerGlowOpacity, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
          Animated.timing(outerGlowOpacity, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [node.status]);

  const getNodeStyle = () => {
    switch (node.status) {
      case "done":
        return {
          bg: "rgba(34, 197, 94, 0.15)",
          iconColor: activeSuccess,
          borderWidth: 2.5,
          borderColor: activeSuccess,
        };
      case "current":
        return {
          bg: "rgba(11, 18, 32, 0.9)",
          iconColor: activeGlow,
          borderWidth: 3,
          borderColor: activeGlow,
        };
      case "locked":
      case "future":
        return {
          bg: "rgba(255,255,255,0.03)",
          iconColor: "rgba(255,255,255,0.2)",
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.1)",
        };
    }
  };

  const style = getNodeStyle();

  const getIcon = () => {
    if (node.isLocked) return <Ionicons name="lock-closed" size={isMilestone ? 24 : 20} color={style.iconColor} />;
    if (node.status === "done") return <Ionicons name="checkmark" size={isMilestone ? 28 : 24} color={style.iconColor} />;
    if (node.type === "review_blackhole") {
      return <Ionicons name="planet" size={isMilestone ? 32 : 28} color={style.iconColor} />;
    }
    if (node.status === "locked" || node.status === "future") {
      if (isMilestone) return <Ionicons name="star" size={24} color={style.iconColor} />;
      return null;
    }
    return <Ionicons name={node.icon as any} size={isMilestone ? 32 : 28} color={style.iconColor} />;
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - nodeSize / 2,
        top: y - nodeSize / 2,
        transform: [{ translateY: floatY }],
      }}
    >
      {/* Current node outer glow via RN shadow (layered on top of SVG glow) */}
      {node.status === "current" && (
        <Animated.View
          style={{
            position: "absolute",
            width: nodeSize,
            height: nodeSize,
            borderRadius: nodeSize / 2,
            backgroundColor: "transparent",
            shadowColor: activeGlow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 25,
            opacity: outerGlowOpacity,
          }}
        />
      )}

      {/* Done node subtle shadow glow */}
      {node.status === "done" && (
        <View
          style={{
            position: "absolute",
            width: nodeSize,
            height: nodeSize,
            borderRadius: nodeSize / 2,
            backgroundColor: "transparent",
            shadowColor: activeSuccess,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
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
              backgroundColor: style.bg,
              borderWidth: style.borderWidth,
              borderColor: style.borderColor,
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
          {getIcon()}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ==================== HELPER: hex to rgba ====================
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ==================== MAIN TRAIL COMPONENT ====================
export function Trail({ trail, hideLabels, onStart, onLockedPress, themeColor }: Props) {
  const activePathColor = themeColor || PATH_COLOR_DONE;
  const bottomTabBarHeight = useBottomTabBarHeight();
  const trailBottomInset = bottomTabBarHeight + theme.spacing.lg;
  const currentIndex = useMemo(() => {
    return trail.findIndex(n => n.status === "current");
  }, [trail]);

  const nodePositions = useMemo(() => {
    const centerX = SCREEN_WIDTH / 2;
    const maxAmplitude = SCREEN_WIDTH / 2 - MILESTONE_NODE_SIZE - 16;
    return trail.map((_, index) => {
      const y = 80 + index * NODE_SPACING;
      const x = centerX + Math.sin(index * Math.PI - Math.PI / 2) * maxAmplitude;
      return { x, y };
    });
  }, [trail.length]);

  // Generate two path strings: one for completed, one for future
  const { pathDone, pathFuture } = useMemo(() => {
    if (nodePositions.length < 2) return { pathDone: "", pathFuture: "" };

    let pathDone = "";
    let pathFuture = "";

    for (let i = 0; i < nodePositions.length; i++) {
      const curr = nodePositions[i];

      if (i === 0) {
        if (currentIndex >= 0) {
          pathDone = `M ${curr.x} ${curr.y}`;
        }
        pathFuture = `M ${curr.x} ${curr.y}`;
      } else {
        const prev = nodePositions[i - 1];
        const cpY = (prev.y + curr.y) / 2;
        const segment = ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;

        if (i <= currentIndex) {
          pathDone += segment;
        }
        pathFuture += segment;
      }
    }

    return { pathDone, pathFuture };
  }, [nodePositions, currentIndex]);

  const totalHeight = trail.length * NODE_SPACING + 200;

  // Background stars with color temperature variation
  const stars = useMemo(() => {
    const count = 60;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * totalHeight,
      size: i < 15 ? 2.5 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }, [totalHeight]);

  // Floating particles
  const particles = useMemo(() => {
    const cols = 4;
    const rows = 4;
    const cellWidth = SCREEN_WIDTH / cols;
    const cellHeight = totalHeight / rows;
    const result: Array<{
      id: number; delay: number; size: number; startX: number; startY: number;
      moveX: number; moveY: number; duration: number; color: string;
    }> = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        const jitterX = (Math.random() - 0.5) * cellWidth;
        const jitterY = (Math.random() - 0.5) * cellHeight;
        result.push({
          id,
          delay: Math.random() * 4000,
          size: 3 + Math.random() * 5,
          startX: Math.max(10, Math.min(SCREEN_WIDTH - 10, (col + 0.5) * cellWidth + jitterX)),
          startY: Math.max(10, Math.min(totalHeight - 10, (row + 0.5) * cellHeight + jitterY)),
          moveX: 8 + Math.random() * 30,
          moveY: 12 + Math.random() * 40,
          duration: 2000 + Math.random() * 4000,
          color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
        });
      }
    }

    for (let i = 0; i < 8; i++) {
      result.push({
        id: 100 + i,
        delay: Math.random() * 5000,
        size: 3 + Math.random() * 5,
        startX: 15 + Math.random() * (SCREEN_WIDTH - 30),
        startY: Math.random() * totalHeight,
        moveX: 10 + Math.random() * 35,
        moveY: 15 + Math.random() * 45,
        duration: 2000 + Math.random() * 4000,
        color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
      });
    }

    return result;
  }, [totalHeight]);

  // Extra concentrated fireflies near current node
  const currentNodeFireflies = useMemo(() => {
    if (currentIndex < 0 || !nodePositions[currentIndex]) return [];
    const currentPos = nodePositions[currentIndex];
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 60 + Math.random() * 80;
      return {
        id: 200 + i,
        delay: Math.random() * 2000,
        size: 4 + Math.random() * 4,
        startX: currentPos.x + Math.cos(angle) * radius,
        startY: currentPos.y + Math.sin(angle) * radius,
        moveX: 15 + Math.random() * 25,
        moveY: 20 + Math.random() * 30,
        duration: 1500 + Math.random() * 2500,
      };
    });
  }, [currentIndex, nodePositions]);

  // SVG star halos for brighter stars
  const svgStarHalos = useMemo(() => {
    return stars.filter(s => s.size > 2).map(s => ({
      ...s,
      haloRadius: s.size * 4,
    }));
  }, [stars]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { minHeight: totalHeight, paddingBottom: trailBottomInset }]}>

      {/* Background Stars (dimmer ones as simple views) */}
      {stars.map((s) => (
        <BackgroundStar key={`star-${s.id}`} x={s.x} y={s.y} size={s.size} />
      ))}

      {/* Floating Particles */}
      {particles.map((p) => (
        <FloatingParticle
          key={p.id}
          delay={p.delay}
          size={p.size}
          startX={p.startX}
          startY={p.startY}
          moveX={p.moveX}
          moveY={p.moveY}
          duration={p.duration}
          color={p.color}
        />
      ))}

      {/* Concentrated fireflies near current node */}
      {currentNodeFireflies.map((p) => (
        <FloatingParticle
          key={p.id}
          delay={p.delay}
          size={p.size}
          startX={p.startX}
          startY={p.startY}
          moveX={p.moveX}
          moveY={p.moveY}
          duration={p.duration}
        />
      ))}

      {/* ============ MAIN SVG LAYER ============ */}
      <Svg height={totalHeight} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Gradient for done path glow */}
          <LinearGradient id="donePathGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={activePathColor} stopOpacity="0.6" />
            <Stop offset="0.5" stopColor={activePathColor} stopOpacity="0.8" />
            <Stop offset="1" stopColor={activePathColor} stopOpacity="0.6" />
          </LinearGradient>

          {/* Radial gradient for current node glow */}
          <RadialGradient id="currentNodeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={themeColor || GLOW_COLOR_BRIGHT} stopOpacity="0.6" />
            <Stop offset="0.3" stopColor={themeColor || GLOW_COLOR_BRIGHT} stopOpacity="0.3" />
            <Stop offset="0.6" stopColor={themeColor || GLOW_COLOR_BRIGHT} stopOpacity="0.1" />
            <Stop offset="1" stopColor={themeColor || GLOW_COLOR_BRIGHT} stopOpacity="0" />
          </RadialGradient>

          {/* Radial gradient for done node glow */}
          <RadialGradient id="doneNodeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={themeColor || theme.colors.success} stopOpacity="0.5" />
            <Stop offset="0.4" stopColor={themeColor || theme.colors.success} stopOpacity="0.2" />
            <Stop offset="0.7" stopColor={themeColor || theme.colors.success} stopOpacity="0.05" />
            <Stop offset="1" stopColor={themeColor || theme.colors.success} stopOpacity="0" />
          </RadialGradient>

          {/* Radial gradient for star halos */}
          <RadialGradient id="starHalo" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
            <Stop offset="0.2" stopColor="#ffffff" stopOpacity="0.3" />
            <Stop offset="0.5" stopColor="#ccdcff" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#ccdcff" stopOpacity="0" />
          </RadialGradient>

          {/* Radial gradient for locked/future node - dim ring */}
          <RadialGradient id="lockedNodeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
            <Stop offset="0.8" stopColor="#ffffff" stopOpacity="0.04" />
            <Stop offset="0.95" stopColor="#ffffff" stopOpacity="0.02" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ---- Star halos for brighter stars ---- */}
        {svgStarHalos.map((s) => (
          <Circle
            key={`halo-${s.id}`}
            cx={s.x + s.size / 2}
            cy={s.y + s.size / 2}
            r={s.haloRadius}
            fill="url(#starHalo)"
            opacity={0.6}
          />
        ))}

        {/* ---- NODE GLOWS (behind everything) ---- */}
        {trail.map((node, index) => {
          const { x, y } = nodePositions[index];
          const isMilestone = (index + 1) % 5 === 0;
          const nodeSize = isMilestone ? MILESTONE_NODE_SIZE : NODE_SIZE;

          if (node.status === "current") {
            // Multi-layer glow for current node
            return (
              <G key={`glow-${node.id}`}>
                {/* Outermost atmospheric glow */}
                <Circle cx={x} cy={y} r={nodeSize * 1.8} fill="url(#currentNodeGlow)" opacity={0.4} />
                {/* Mid glow ring */}
                <Circle cx={x} cy={y} r={nodeSize * 1.2} fill="url(#currentNodeGlow)" opacity={0.5} />
                {/* Inner bright ring */}
                <Circle
                  cx={x} cy={y} r={nodeSize * 0.55}
                  fill="none"
                  stroke={themeColor || GLOW_COLOR_BRIGHT}
                  strokeWidth={1}
                  opacity={0.4}
                />
                {/* Outer decorative ring */}
                <Circle
                  cx={x} cy={y} r={nodeSize * 0.85}
                  fill="none"
                  stroke={themeColor || GLOW_COLOR_BRIGHT}
                  strokeWidth={0.5}
                  opacity={0.2}
                  strokeDasharray="4,6"
                />
              </G>
            );
          }
          if (node.status === "done") {
            return (
              <G key={`glow-${node.id}`}>
                <Circle cx={x} cy={y} r={nodeSize * 1.2} fill="url(#doneNodeGlow)" opacity={0.6} />
                <Circle cx={x} cy={y} r={nodeSize * 0.8} fill="url(#doneNodeGlow)" opacity={0.4} />
              </G>
            );
          }
          // Locked/future: very subtle presence
          return (
            <Circle
              key={`glow-${node.id}`}
              cx={x} cy={y} r={nodeSize * 0.9}
              fill="url(#lockedNodeGlow)"
              opacity={0.5}
            />
          );
        })}

        {/* ---- FUTURE PATH (dashed, subtle glow) ---- */}
        {/* Widest glow layer */}
        <Path d={pathFuture} stroke="rgba(255,255,255,0.03)" strokeWidth={16} fill="none" strokeLinecap="round" />
        {/* Mid glow */}
        <Path d={pathFuture} stroke="rgba(255,255,255,0.06)" strokeWidth={8} fill="none" strokeLinecap="round" />
        {/* Core dashed line */}
        <Path
          d={pathFuture}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8,12"
        />

        {/* ---- DONE PATH (multi-layer cinematic bloom) ---- */}
        {pathDone && (
          <G>
            {/* Layer 1: Widest atmospheric glow */}
            <Path
              d={pathDone}
              stroke={hexToRgba(activePathColor, 0.06)}
              strokeWidth={28}
              fill="none"
              strokeLinecap="round"
            />
            {/* Layer 2: Wide bloom */}
            <Path
              d={pathDone}
              stroke={hexToRgba(activePathColor, 0.1)}
              strokeWidth={18}
              fill="none"
              strokeLinecap="round"
            />
            {/* Layer 3: Mid glow */}
            <Path
              d={pathDone}
              stroke={hexToRgba(activePathColor, 0.2)}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
            />
            {/* Layer 4: Inner glow */}
            <Path
              d={pathDone}
              stroke={hexToRgba(activePathColor, 0.5)}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
            {/* Layer 5: Bright core */}
            <Path
              d={pathDone}
              stroke={activePathColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              opacity={0.9}
            />
            {/* Layer 6: White-hot center */}
            <Path
              d={pathDone}
              stroke="#ffffff"
              strokeWidth={1}
              fill="none"
              strokeLinecap="round"
              opacity={0.5}
            />
          </G>
        )}

        {/* ---- Connection dots at done nodes on path ---- */}
        {trail.map((node, index) => {
          if (node.status !== "done" && node.status !== "current") return null;
          const { x, y } = nodePositions[index];
          return (
            <G key={`pathDot-${node.id}`}>
              <Circle cx={x} cy={y} r={5} fill={activePathColor} opacity={0.8} />
              <Circle cx={x} cy={y} r={3} fill="#ffffff" opacity={0.6} />
            </G>
          );
        })}
      </Svg>

      {/* ============ RN NODES (interactive layer) ============ */}
      {trail.map((node, index) => {
        const { x, y } = nodePositions[index];
        const isMilestone = (index + 1) % 5 === 0;

        return (
          <View key={node.id}>
            {!hideLabels && (
              <LevelIndicator
                level={index + 1}
                x={x}
                y={y}
                isLeft={x < SCREEN_WIDTH / 2}
                isMilestone={isMilestone}
                color={themeColor}
              />
            )}
            <GlowingNode
              node={node}
              x={x}
              y={y}
              isMilestone={isMilestone}
              onPress={() => node.status === "locked" ? onLockedPress?.(node.id) : onStart?.(node.id)}
              themeColor={themeColor}
              nodeIndex={index}
            />
          </View>
        );
      })}

      {/* Node Sparkles on completed nodes */}
      {trail.map((node, index) => {
        if (node.status !== "done") return null;
        const pos = nodePositions[index];
        return (
          <NodeSparkle
            key={`sparkle-${node.id}`}
            x={pos.x + (Math.random() - 0.5) * 40}
            y={pos.y + (Math.random() - 0.5) * 40}
          />
        );
      })}

      {/* Shooting star overlay */}
      <ShootingStar totalHeight={totalHeight} />

    </ScrollView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  node: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
