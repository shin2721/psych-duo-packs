import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import type { CourseWorldNode, CourseWorldViewModel } from "../lib/courseWorld";

/* ── Constants ── */

const RING_SIZE = 220;
const RING_R = 95;
const RING_STROKE = 10;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

const CLOCK_RING_SIZE = 130;
const CLOCK_RADIUS = 160;

const EASE_DECEL = Easing.bezier(0.05, 0.7, 0.1, 1.0);
const EASE_SIN = Easing.bezier(0.37, 0, 0.63, 1);

const SYNAPSE: Record<string, string> = {
  mental: "#A78BFA", money: "#FCD34D", work: "#22D3EE",
  health: "#F472B6", social: "#FB923C", study: "#34D399",
};

/* ── Types ── */

interface Props {
  model: CourseWorldViewModel;
  /** ID of the lesson the user should play next (fireflies target). Falls back to model.currentLesson. */
  nextLessonId?: string;
  onNodePress?: (nodeId: string) => void;
  onPrimaryPress: () => void;
  onSupportPress?: () => void;
  onUnitPress?: () => void;
  primaryTestID?: string;
  supportTestID?: string;
  testID?: string;
}

/* ── Data ── */

function mergeNodes(model: CourseWorldViewModel): CourseWorldNode[] {
  const m = new Map<string, CourseWorldNode>();
  for (const n of model.routeNodes) m.set(n.id, n);
  m.set(model.currentLesson.id, model.currentLesson);
  return [...m.values()]
    .filter((n) => n.nodeType !== "review_blackhole")
    .sort((a, b) => a.levelNumber - b.levelNumber);
}

/* ── Haptics helper ── */

function tick() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

function snap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

/* ── Animation hooks ── */

function useBreath(min: number, ms: number = 3000) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: min, duration: ms / 2, easing: EASE_SIN, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: ms / 2, easing: EASE_SIN, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [min, ms, v]);
  return v;
}

/* ================================================================== */
/*  CLOCK RING — ring on the clock dial                                */
/* ================================================================== */

function ClockRing({
  node, themeColor, synColor, isTop,
}: {
  node: CourseWorldNode; themeColor: string; synColor: string; isTop: boolean;
}) {
  const size = isTop ? CLOCK_RING_SIZE * 1.2 : CLOCK_RING_SIZE;
  const done = node.status === "done";
  const locked = node.status === "locked" || node.isLocked;
  const r = size / 2 - 6;
  const stroke = isTop ? 6 : 4;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  // Top item gets full theme color highlight
  const ringColor = isTop
    ? themeColor
    : done ? synColor : locked ? "rgba(60,75,120,0.35)" : `${themeColor}77`;
  const iconColor = isTop
    ? "#FFFFFF"
    : done ? `${synColor}CC` : locked ? "rgba(60,75,120,0.5)" : `${themeColor}AA`;

  return (
    <View style={{ width: size + 40, height: size + 40, alignItems: "center", justifyContent: "center" }}>
      {/* Glow for top item */}
      {isTop && (
        <>
          <View style={{
            position: "absolute", width: size + 50, height: size + 50,
            borderRadius: (size + 50) / 2,
            backgroundColor: themeColor,
            opacity: 0.15,
          }} />
          <View style={{
            position: "absolute", width: size + 24, height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: themeColor,
            opacity: 0.25,
          }} />
        </>
      )}
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill="none"
          stroke={isTop ? `${themeColor}30` : "rgba(60,75,120,0.12)"} strokeWidth={stroke} />
        {isTop && (
          <Circle cx={cx} cy={cy} r={r} fill="none"
            stroke={themeColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={0}
            opacity={0.9} />
        )}
        {!isTop && (done || !locked) && (
          <Circle cx={cx} cy={cy} r={r} fill="none"
            stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={done ? 0 : circ * 0.5}
            transform={`rotate(-90, ${cx}, ${cy})`}
            opacity={0.5} />
        )}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Ionicons
          color={iconColor}
          name={node.icon as keyof typeof Ionicons.glyphMap}
          size={size * 0.28}
        />
        <Text style={{
          color: iconColor,
          fontSize: size * 0.12,
          fontWeight: "800",
          marginTop: 2,
          letterSpacing: -0.3,
        }}>{node.label}</Text>
      </View>
    </View>
  );
}

/* ================================================================== */
/*  HERO RING — full size with glow                                     */
/* ================================================================== */

function HeroRing({
  progress, themeColor, synColor, icon,
}: {
  progress: number; themeColor: string; synColor: string; icon: string;
}) {
  const glowBreath = useBreath(0.5, 4000);
  const iconBreath = useBreath(0.85, 3200);

  const displayProgress = Math.max(progress, 0.03); // minimum 3% arc
  const arcOff = RING_CIRC * (1 - displayProgress);
  const dotDeg = (progress > 0 ? progress * 360 : 0) - 90;
  const dotRad = (dotDeg * Math.PI) / 180;
  const dotX = RING_CX + RING_R * Math.cos(dotRad);
  const dotY = RING_CY + RING_R * Math.sin(dotRad);

  const GS = RING_SIZE + 160;
  const GO = 80;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{
        pointerEvents: "none",
        position: "absolute", width: GS, height: GS, left: -GO, top: -GO, opacity: glowBreath,
      }}>
        <Svg width={GS} height={GS}>
          <Defs>
            <RadialGradient id="g1" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={themeColor} stopOpacity="0.50" />
              <Stop offset="0.2" stopColor={themeColor} stopOpacity="0.28" />
              <Stop offset="0.45" stopColor={synColor} stopOpacity="0.10" />
              <Stop offset="0.7" stopColor={synColor} stopOpacity="0.03" />
              <Stop offset="1" stopColor={synColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={GS / 2} cy={GS / 2} rx={GS / 2} ry={GS / 2} fill="url(#g1)" />
        </Svg>
      </Animated.View>

      <View style={{
        pointerEvents: "none",
        position: "absolute", width: RING_SIZE + 80, height: RING_SIZE + 80, left: -40, top: -40,
      }}>
        <Svg width={RING_SIZE + 80} height={RING_SIZE + 80}>
          <Defs>
            <RadialGradient id="g2" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={themeColor} stopOpacity="0.30" />
              <Stop offset="0.35" stopColor={themeColor} stopOpacity="0.14" />
              <Stop offset="0.65" stopColor={synColor} stopOpacity="0.05" />
              <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={(RING_SIZE + 80) / 2} cy={(RING_SIZE + 80) / 2} r={(RING_SIZE + 80) / 2} fill="url(#g2)" />
        </Svg>
      </View>

      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={themeColor} stopOpacity="1" />
            <Stop offset="0.5" stopColor={synColor} stopOpacity="0.95" />
            <Stop offset="1" stopColor={synColor} stopOpacity="0.75" />
          </SvgLinearGradient>
          <RadialGradient id="inner" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={themeColor} stopOpacity="0.14" />
            <Stop offset="0.5" stopColor={themeColor} stopOpacity="0.05" />
            <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={RING_CX} cy={RING_CY} r={RING_R - RING_STROKE} fill="url(#inner)" />
        <Circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none"
          stroke="rgba(60,75,120,0.12)" strokeWidth={RING_STROKE} />
        {displayProgress > 0 && (
          <Circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none"
            stroke="url(#arc)" strokeWidth={RING_STROKE} strokeLinecap="round"
            strokeDasharray={`${RING_CIRC}`} strokeDashoffset={arcOff}
            transform={`rotate(-90, ${RING_CX}, ${RING_CY})`} />
        )}
        <Circle cx={dotX} cy={dotY} r={12} fill={themeColor} opacity={0.06} />
        <Circle cx={dotX} cy={dotY} r={7} fill={themeColor} opacity={0.18} />
        <Circle cx={dotX} cy={dotY} r={5} fill={themeColor} opacity={0.90} />
      </Svg>

      <Animated.View style={[st.ringIcon, { opacity: iconBreath, pointerEvents: "none" }]}>
        <Ionicons color={`${themeColor}EE`} name={icon as keyof typeof Ionicons.glyphMap} size={48} />
      </Animated.View>
    </View>
  );
}

/* ================================================================== */
/*  BACKGROUND                                                          */
/* ================================================================== */

function Background({ tc, syn }: { tc: string; syn: string }) {
  const wash = useBreath(0, 8000);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <LinearGradient
        colors={["#040812", "#08102A", "#0C0824", "#060610"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: wash }]}>
        <LinearGradient
          colors={["transparent", `${tc}18`, `${syn}0C`, "transparent"]}
          locations={[0.1, 0.35, 0.55, 0.8]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/* ── Fireflies drifting near ring ── */

// Hero ring fireflies — orbit OUTSIDE the ring (ring radius ≈ 95px)
const HERO_FIREFLY_CONFIGS = [
  { cx: -140, cy: -50, driftX: 20, driftY: 24, dur: 12000, glowDur: 4000, size: 7 },
  { cx: 135, cy: -35, driftX: 24, driftY: 18, dur: 14000, glowDur: 3500, size: 6 },
  { cx: -120, cy: 70, driftX: 16, driftY: 22, dur: 16000, glowDur: 5000, size: 5 },
  { cx: 125, cy: 60, driftX: 28, driftY: 20, dur: 11000, glowDur: 3800, size: 8 },
  { cx: 20, cy: -145, driftX: 14, driftY: 16, dur: 18000, glowDur: 4500, size: 5 },
];

// Clock ring fireflies — orbit OUTSIDE the smaller clock ring (ring ≈ 78px)
const CLOCK_FIREFLY_CONFIGS = [
  { cx: -95, cy: -30, driftX: 14, driftY: 16, dur: 10000, glowDur: 3500, size: 5 },
  { cx: 90, cy: -25, driftX: 16, driftY: 12, dur: 12000, glowDur: 3000, size: 5 },
  { cx: -80, cy: 45, driftX: 12, driftY: 15, dur: 14000, glowDur: 4500, size: 4 },
  { cx: 85, cy: 40, driftX: 18, driftY: 14, dur: 9000, glowDur: 3200, size: 6 },
  { cx: 10, cy: -100, driftX: 10, driftY: 12, dur: 16000, glowDur: 4000, size: 4 },
];

interface FireflyConfig {
  cx: number; cy: number; driftX: number; driftY: number;
  dur: number; glowDur: number; size: number;
}

function Fireflies({ themeColor, synColor, configs }: {
  themeColor: string; synColor: string; configs: FireflyConfig[];
}) {
  const anims = useRef(
    configs.map(() => ({
      driftX: new Animated.Value(0),
      driftY: new Animated.Value(0),
      glow: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      const cfg = configs[i];
      Animated.loop(
        Animated.sequence([
          Animated.timing(a.driftX, { toValue: 1, duration: cfg.dur / 2, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(a.driftX, { toValue: -1, duration: cfg.dur, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(a.driftX, { toValue: 0, duration: cfg.dur / 2, easing: EASE_SIN, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(a.driftY, { toValue: -1, duration: cfg.dur * 0.6, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(a.driftY, { toValue: 1, duration: cfg.dur * 0.8, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(a.driftY, { toValue: 0, duration: cfg.dur * 0.6, easing: EASE_SIN, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(a.glow, { toValue: 1, duration: cfg.glowDur / 2, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(a.glow, { toValue: 0, duration: cfg.glowDur / 2, easing: EASE_SIN, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <>
      {configs.map((cfg, i) => {
        const color = i % 2 === 0 ? themeColor : synColor;
        const translateX = Animated.add(cfg.cx, Animated.multiply(anims[i].driftX, cfg.driftX));
        const translateY = Animated.add(cfg.cy, Animated.multiply(anims[i].driftY, cfg.driftY));
        const opacity = anims[i].glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.0] });

        return (
          <Animated.View
            key={`firefly-${i}`}
            style={{
              position: "absolute",
              alignSelf: "center",
              width: cfg.size,
              height: cfg.size,
              borderRadius: cfg.size,
              backgroundColor: color,
              opacity,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: cfg.size * 4,
              zIndex: 3,
              transform: [{ translateX: translateX as any }, { translateY: translateY as any }],
            }}
          />
        );
      })}
    </>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT — Clock Dial Carousel                                */
/* ================================================================== */

export function CourseWorldHero({
  model, nextLessonId, onNodePress, onPrimaryPress, onUnitPress,
  primaryTestID = "course-world-primary",
  testID = "course-world-hero",
}: Props) {
  const { width: W } = useWindowDimensions();

  const les = model.currentLesson;
  const allNodes = useMemo(() => mergeNodes(model), [model]);
  const doneN = useMemo(() => allNodes.filter((n) => n.status === "done").length, [allNodes]);
  const prog = allNodes.length > 0 ? doneN / allNodes.length : 0;
  const syn = SYNAPSE[model.genreId] ?? "#A78BFA";
  const N = allNodes.length;

  const currentIdx = useMemo(
    () => Math.max(0, allNodes.findIndex((n) => n.id === les.id)),
    [allNodes, les.id],
  );

  // Rotation angle (radians)
  const rotAngle = useRef(new Animated.Value(0)).current;
  const rawAngle = useRef(0);
  const lastHapticSlot = useRef(currentIdx);

  // Clock mode
  const clockMode = useRef(new Animated.Value(0)).current;
  const isClockModeRef = useRef(false);
  const [, forceUpdate] = useState(0);

  // Keep refs to latest values for PanResponder (avoids stale closure)
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const nRef = useRef(N);
  nRef.current = N;
  const allNodesRef = useRef(allNodes);
  allNodesRef.current = allNodes;
  const onNodePressRef = useRef(onNodePress);
  onNodePressRef.current = onNodePress;
  const onPrimaryPressRef = useRef(onPrimaryPress);
  onPrimaryPressRef.current = onPrimaryPress;

  // Angle per lesson
  const anglePerLesson = N > 0 ? (2 * Math.PI) / N : 1;
  const anglePerLessonRef = useRef(anglePerLesson);
  anglePerLessonRef.current = anglePerLesson;

  // State to track which node is "at top" during drag
  const [topNodeIdx, setTopNodeIdx] = useState(currentIdx);

  // Long press timer ref
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LONG_PRESS_MS = 350;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          if (!isClockModeRef.current) {
            isClockModeRef.current = true;
            forceUpdate((c) => c + 1);
            // "ポコ" haptic feedback
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            }
            Animated.spring(clockMode, {
              toValue: 1,
              stiffness: 300,
              damping: 22,
              mass: 0.6,
              useNativeDriver: true,
            }).start();
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_, gs) => {
        // Cancel long press if user moves too much before it fires
        if (!isClockModeRef.current) {
          if (Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
          return;
        }

        const w = W;
        const apl = anglePerLessonRef.current;
        const n = nRef.current;
        const cIdx = currentIdxRef.current;

        // Map horizontal drag to rotation
        const angle = (gs.dx / (w * 0.35)) * Math.PI;
        rotAngle.setValue(angle);
        rawAngle.current = angle;

        // Track which node is at top & haptic
        const slotOffset = Math.round(angle / apl);
        const crossedIdx = ((cIdx - slotOffset) % n + n) % n;
        if (crossedIdx !== lastHapticSlot.current) {
          lastHapticSlot.current = crossedIdx;
          setTopNodeIdx(crossedIdx);
          tick();
        }
      },
      onPanResponderRelease: (_, gs) => {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // If not in clock mode, it was a tap → start lesson
        if (!isClockModeRef.current) {
          onPrimaryPressRef.current?.();
          return;
        }

        const apl = anglePerLessonRef.current;
        const n = nRef.current;
        const cIdx = currentIdxRef.current;
        const nodes = allNodesRef.current;
        const onPress = onNodePressRef.current;

        const raw = rawAngle.current;
        const momentum = gs.vx * 0.5;
        const totalAngle = raw + momentum;

        const slotOffset = Math.round(totalAngle / apl);
        const snapAngle = slotOffset * apl;
        const newIdx = ((cIdx - slotOffset) % n + n) % n;

        snap();
        Animated.spring(rotAngle, {
          toValue: snapAngle,
          stiffness: 180,
          damping: 18,
          mass: 0.6,
          useNativeDriver: true,
        }).start(() => {
          rotAngle.setValue(0);
          rawAngle.current = 0;
          lastHapticSlot.current = newIdx;
          isClockModeRef.current = false;
          forceUpdate((c) => c + 1);
          setTopNodeIdx(newIdx);

          Animated.spring(clockMode, {
            toValue: 0,
            stiffness: 300,
            damping: 22,
            mass: 0.6,
            useNativeDriver: true,
          }).start();

          if (newIdx !== cIdx && onPress && nodes[newIdx]) {
            onPress(nodes[newIdx].id);
          }
        });
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.spring(rotAngle, {
          toValue: 0, stiffness: 200, damping: 25, mass: 1, useNativeDriver: true,
        }).start(() => {
          rawAngle.current = 0;
          isClockModeRef.current = false;
          forceUpdate((c) => c + 1);
          Animated.spring(clockMode, {
            toValue: 0, stiffness: 300, damping: 22, mass: 0.6, useNativeDriver: true,
          }).start();
        });
      },
    }),
  ).current;

  // Animated interpolations for clock mode transition
  const heroScale = clockMode.interpolate({
    inputRange: [0, 1], outputRange: [1, 0],
  });
  const heroOpacity = clockMode.interpolate({
    inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp",
  });
  const headerOpacity = clockMode.interpolate({
    inputRange: [0, 0.2], outputRange: [1, 0], extrapolate: "clamp",
  });
  const clockOpacity = clockMode.interpolate({
    inputRange: [0.2, 0.6], outputRange: [0, 1], extrapolate: "clamp",
  });
  const clockScale = clockMode.interpolate({
    inputRange: [0, 1], outputRange: [0.5, 1],
  });

  // Find the "next lesson to play" index — uses explicit prop if provided
  const nextLessonIdx = useMemo(() => {
    if (nextLessonId) {
      const idx = allNodes.findIndex((n) => n.id === nextLessonId);
      if (idx >= 0) return idx;
    }
    const idx = allNodes.findIndex((n) => n.status === "current" || (!n.isLocked && n.status !== "done"));
    return idx >= 0 ? idx : currentIdx;
  }, [allNodes, nextLessonId, currentIdx]);

  const CLOCK_ZONE = CLOCK_RADIUS * 3 + CLOCK_RING_SIZE + 60;

  // Build clock item styles with DENSE sampling for smooth cos/sin
  const buildClockItemStyle = useCallback((baseAngle: number) => {
    // Dense sampling: 0.1 rad steps over ±2π range = ~126 steps
    const STEP = 0.1;
    const MIN = -Math.PI * 2.5;
    const MAX = Math.PI * 2.5;
    const steps: number[] = [];
    for (let s = MIN; s <= MAX; s += STEP) steps.push(s);
    // Ensure we have exact 0
    if (!steps.includes(0)) steps.push(0);
    steps.sort((a, b) => a - b);

    const txOut = steps.map((r) => Math.cos(baseAngle + r) * CLOCK_RADIUS);
    const tyOut = steps.map((r) => Math.sin(baseAngle + r) * CLOCK_RADIUS);
    const scaleOut = steps.map((r) => {
      const yNorm = -Math.sin(baseAngle + r); // 1 at top, -1 at bottom
      return 0.85 + 0.15 * Math.max(0, yNorm);
    });
    const opOut = steps.map(() => 1.0);

    return {
      transform: [
        { translateX: rotAngle.interpolate({ inputRange: steps, outputRange: txOut, extrapolate: "clamp" }) },
        { translateY: rotAngle.interpolate({ inputRange: steps, outputRange: tyOut, extrapolate: "clamp" }) },
        { scale: rotAngle.interpolate({ inputRange: steps, outputRange: scaleOut, extrapolate: "clamp" }) },
      ],
      opacity: rotAngle.interpolate({ inputRange: steps, outputRange: opOut, extrapolate: "clamp" }),
    };
  }, [rotAngle]);

  // Clock items — currentIdx starts at top (-π/2)
  const clockItems = useMemo(() => {
    return allNodes.map((node, i) => {
      const baseAngle = -Math.PI / 2 + (i - currentIdx) * anglePerLesson;
      return { node, baseAngle, index: i };
    });
  }, [allNodes, anglePerLesson, currentIdx]);

  return (
    <View style={[st.root, { width: W }]} testID={testID}>
      <Background tc={model.themeColor} syn={syn} />

      <View style={st.spacerTop} />

      {/* Header */}
      <Animated.View style={[st.header, { opacity: headerOpacity }]}>
        <Pressable style={st.unitBadge} onPress={onUnitPress} accessibilityRole="button" accessibilityLabel="ユニット選択">
          <View style={[st.unitDot, { backgroundColor: model.themeColor, shadowColor: model.themeColor }]} />
          <Text style={st.unitText}>{model.unitLabel}</Text>
          <Ionicons color="rgba(255,255,255,0.35)" name="chevron-down" size={14} />
        </Pressable>
      </Animated.View>

      {/* Main interaction zone */}
      <View style={[st.interactionZone, { width: W, height: CLOCK_ZONE }]} {...panResponder.panHandlers}>

        {/* Fireflies — hero ring (normal mode only, fades out with hero) */}
        <Animated.View
          style={[st.heroContainer, { zIndex: 15, opacity: heroOpacity }]}
          pointerEvents="none"
        >
          <Fireflies themeColor={model.themeColor} synColor={syn} configs={HERO_FIREFLY_CONFIGS} />
        </Animated.View>

        {/* Hero ring — normal mode (tap handled by PanResponder) */}
        <Animated.View
          style={[st.heroContainer, {
            transform: [{ scale: heroScale }],
            opacity: heroOpacity,
          }]}
          accessibilityLabel={model.primaryAction.label}
          accessibilityRole="button"
          testID={primaryTestID}
        >
          <HeroRing progress={prog} themeColor={model.themeColor} synColor={syn} icon={les.icon} />
        </Animated.View>

        {/* Clock dial — swiping mode */}
        <Animated.View style={[st.clockContainer, {
          width: CLOCK_ZONE,
          height: CLOCK_ZONE,
          opacity: clockOpacity,
          transform: [{ scale: clockScale }],
        }]}>
          {clockItems.map(({ node, baseAngle, index }) => {
            const itemStyle = buildClockItemStyle(baseAngle);
            const isTop = index === topNodeIdx;
            const isNextLesson = index === nextLessonIdx;

            return (
              <Animated.View
                key={node.id}
                style={[st.clockItem, {
                  transform: itemStyle.transform,
                  opacity: itemStyle.opacity,
                  zIndex: isTop ? 10 : 1,
                }]}
              >
                <ClockRing
                  node={node}
                  themeColor={model.themeColor}
                  synColor={syn}
                  isTop={isTop}
                />
                {/* Fireflies around the next lesson to play */}
                {isNextLesson && (
                  <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }} pointerEvents="none">
                    <Fireflies themeColor={model.themeColor} synColor={syn} configs={CLOCK_FIREFLY_CONFIGS} />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>

      <View style={st.spacerBottom} />
    </View>
  );
}

/* ================================================================== */
/*  Styles                                                              */
/* ================================================================== */

const st = StyleSheet.create({
  root: { flex: 1, overflow: "visible" as const },
  spacerTop: { flex: 3 },
  spacerBottom: { flex: 1 },

  header: {
    flexDirection: "row", justifyContent: "flex-start", alignItems: "center",
    paddingHorizontal: 24, paddingTop: 56, height: 80,
  },
  unitBadge: { flexDirection: "row", alignItems: "center", gap: 7 },
  unitDot: {
    width: 9, height: 9, borderRadius: 5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6,
  },
  unitText: { color: "rgba(255,255,255,0.50)", fontSize: 14, fontWeight: "600", letterSpacing: 0.3 },
  progPill: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  progText: { color: "rgba(255,255,255,0.38)", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },

  interactionZone: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible" as const,
  },

  heroContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  clockContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible" as const,
  },
  clockItem: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  ringIcon: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },

  infoCard: {
    marginHorizontal: 20,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12,
    alignItems: "center", gap: 10,
  },
  title: {
    color: "rgba(255,255,255,0.97)", fontSize: 26, fontWeight: "900",
    letterSpacing: -0.8, lineHeight: 32, textAlign: "center",
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 32,
  },
  body: {
    color: "rgba(255,255,255,0.52)", fontSize: 14, fontWeight: "400",
    lineHeight: 20, textAlign: "center", letterSpacing: 0.1,
  },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 999, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  metaText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
});
