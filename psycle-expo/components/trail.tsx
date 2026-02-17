import React, { useRef, useEffect, useMemo } from "react";
import { View, Pressable, StyleSheet, Dimensions, ScrollView, Animated } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

// Firefly color variations - more variety with warm colors
const FIREFLY_COLORS = ["#a8ff60", "#ffdd60", "#ff9b60", "#ffdd60", "#60ffb0", "#ffaa40"];

// ==================== VIGNETTE EFFECT ====================
function Vignette({ height }: { height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height }]} pointerEvents="none">
      {/* Top vignette - stronger gradient effect */}
      <View style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 180,
        backgroundColor: "rgba(0,0,0,0.5)",
      }} />
      {/* Bottom vignette */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: "rgba(0,0,0,0.35)",
      }} />
      {/* Left edge */}
      <View style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: 40,
        backgroundColor: "rgba(0,0,0,0.3)",
      }} />
      {/* Right edge */}
      <View style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 40,
        backgroundColor: "rgba(0,0,0,0.3)",
      }} />
    </View>
  );
}

// ==================== SHOOTING STAR ====================
function ShootingStar({ totalHeight }: { totalHeight: number }) {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shootStar = () => {
      // Random start position
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
        // Wait random interval before next shooting star
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

// ==================== MIST LAYER ====================
function MistLayer({ y, width }: { y: number; width: number }) {
  const translateX = useRef(new Animated.Value(-width * 0.3)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: width * 0.3, duration: 20000 + Math.random() * 10000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -width * 0.3, duration: 20000 + Math.random() * 10000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: -width * 0.5,
        top: y,
        width: width * 2,
        height: 150,
        backgroundColor: "rgba(168, 255, 96, 0.08)",
        borderRadius: 75,
        opacity,
        transform: [{ translateX }],
      }}
    />
  );
}

// ==================== CURRENT NODE LIGHT RAYS ====================
function NodeRays({ x, y }: { x: number; y: number }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slow rotation
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 15000, useNativeDriver: true })
    ).start();

    // Subtle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 2500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - 80,
        top: y - 80,
        width: 160,
        height: 160,
        opacity,
        transform: [{ rotate: spin }, { scale }],
      }}
    >
      {rays.map((angle) => (
        <View
          key={angle}
          style={{
            position: "absolute",
            left: 76,
            top: 20,
            width: 8,
            height: 60,
            backgroundColor: GLOW_COLOR_BRIGHT,
            borderRadius: 4,
            opacity: 0.6,
            transform: [
              { translateY: 40 },
              { rotate: `${angle}deg` },
              { translateY: -40 },
            ],
          }}
        />
      ))}
    </Animated.View>
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

// ==================== BACKGROUND GRADIENT ====================
function BackgroundGradient({ height }: { height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height, backgroundColor: theme.colors.bg }]} />
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
      // Smooth Y movement: 0 → up → 0 → down → 0 (no teleporting)
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -moveY, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: moveY, duration: duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
      // Smooth X movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, { toValue: moveX, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -moveX, duration: duration * 0.9, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: duration * 0.9, useNativeDriver: true }),
        ])
      ).start();
      // Opacity pulsing
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
        shadowRadius: size * 5, // Stronger glow
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
function GlowingNode({ node, x, y, isMilestone, onPress, themeColor }: { node: TrailNode; x: number; y: number; isMilestone: boolean; onPress: () => void; themeColor?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const outerRingScale = useRef(new Animated.Value(1)).current;
  const outerRingOpacity = useRef(new Animated.Value(0.3)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const nodeSize = isMilestone ? MILESTONE_NODE_SIZE : NODE_SIZE;
  const activeGlow = themeColor || GLOW_COLOR_BRIGHT;
  const activeSuccess = themeColor || theme.colors.success;

  useEffect(() => {
    // All nodes float gently (案4)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 2000 + Math.random() * 500, useNativeDriver: true }),
      ])
    ).start();

    if (node.status === "current") {
      // Inner pulsing
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      // Outer ring pulsing
      Animated.loop(
        Animated.sequence([
          Animated.timing(outerRingScale, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
          Animated.timing(outerRingScale, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(outerRingOpacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          Animated.timing(outerRingOpacity, { toValue: 0.2, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [node.status]);

  const getNodeStyle = () => {
    switch (node.status) {
      case "done":
        return {
          bg: activeSuccess,
          glow: activeSuccess,
          iconColor: "#000",
          borderWidth: 0,
        };
      case "current":
        return {
          bg: activeGlow,
          glow: activeGlow,
          iconColor: "#000",
          borderWidth: 0,
        };
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
  };

  const style = getNodeStyle();

  const getIcon = () => {
    if (node.isLocked) return <Ionicons name="lock-closed" size={isMilestone ? 24 : 20} color={style.iconColor} />;
    if (node.status === "done") return <Ionicons name="checkmark" size={isMilestone ? 30 : 26} color={style.iconColor} />;
    if (node.status === "locked" || node.status === "future") {
      // Milestone nodes show a star icon even when locked
      if (isMilestone) return <Ionicons name="star" size={24} color={style.iconColor} />;
      return null;
    }
    if (node.type === "review_blackhole") {
      return <Ionicons name="planet" size={isMilestone ? 32 : 28} color={style.iconColor} />;
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
      {/* Outer glow ring for current node - Very subtle to not wash out core color */}
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
            opacity: 0.2, // Fixed low opacity for subtle glow
          }}
        />
      )}

      {/* Milestone special ring */}
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
              backgroundColor: style.bg,
              shadowColor: style.glow,
              shadowOpacity: node.status === "current" ? 1 : node.status === "done" ? 0.7 : 0,
              shadowRadius: node.status === "current" ? 30 : 15,
              borderWidth: style.borderWidth,
              borderColor: style.borderWidth ? style.borderColor : undefined,
            },
          ]}
          onPress={node.isLocked || node.status === "current" ? onPress : undefined}
          disabled={!node.isLocked && node.status !== "current"}
          testID={`lesson-node-${node.id}`}
        >
          {getIcon()}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ==================== MAIN TRAIL COMPONENT ====================
export function Trail({ trail, hideLabels, onStart, onLockedPress, themeColor }: Props) {
  const activePathColor = themeColor || PATH_COLOR_DONE;
  // Find the index of the current node for path coloring
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

  // Generate two path strings: one for completed, one for future (案1)
  const { pathDone, pathFuture } = useMemo(() => {
    if (nodePositions.length < 2) return { pathDone: "", pathFuture: "" };

    let pathDone = "";
    let pathFuture = "";

    // Build the full path, but split at current node
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

  // Background stars - more stars with varied sizes for depth
  const stars = useMemo(() => {
    const count = 40; // Reduced from 100 for performance
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * totalHeight,
      // More size variation: tiny (1px) to medium (4px) for depth effect
      size: i < 20 ? 2.5 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
    }));
  }, [totalHeight]);

  // Floating particles - Spread evenly with MORE jitter and color variations
  const particles = useMemo(() => {
    const cols = 4; // Reduced from 6 for performance
    const rows = 4; // Reduced from 6 for performance
    const cellWidth = SCREEN_WIDTH / cols;
    const cellHeight = totalHeight / rows;
    const result: Array<{
      id: number; delay: number; size: number; startX: number; startY: number;
      moveX: number; moveY: number; duration: number; color: string;
    }> = [];

    // Grid-based particles with high jitter
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        // More jitter: ±50% of cell size
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

    // Add 8 fully random particles for extra chaos (reduced from 20)
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
    const count = 4; // Reduced from 8 for performance
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

  return (
    <ScrollView contentContainerStyle={[styles.container, { minHeight: totalHeight }]}>
      {/* Background Gradient REMOVED - Using Global Star Background */}
      {/* <BackgroundGradient height={totalHeight} /> */}


      {/* Mist Layers REMOVED to match header color */}

      {/* Background Stars */}
      {stars.map((s) => (
        <BackgroundStar key={`star-${s.id}`} x={s.x} y={s.y} size={s.size} />
      ))}

      {/* Floating Particles with color variations */}
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

      {/* SVG Paths - Future (gray) and Done (green) */}
      <Svg height={totalHeight} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
        {/* Future path (gray, underneath) */}
        <Path d={pathFuture} stroke={PATH_COLOR_FUTURE} strokeWidth={8} fill="none" opacity={0.5} />
        <Path d={pathFuture} stroke={PATH_COLOR_FUTURE} strokeWidth={2} fill="none" opacity={0.8} />

        {/* Done path (vibrant color, on top) */}
        {pathDone && (
          <>
            {/* Outer Glow - Stronger and more opaque to match header color */}
            <Path d={pathDone} stroke={activePathColor} strokeWidth={14} fill="none" opacity={0.4} />
            {/* Core - Almost solid */}
            <Path d={pathDone} stroke={activePathColor} strokeWidth={6} fill="none" opacity={1.0} />
          </>
        )}
      </Svg>

      {/* Nodes */}
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

    </ScrollView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingBottom: 100,
  },
  node: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
