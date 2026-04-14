import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform } from "react-native";
import type { ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import type { CourseWorldNode } from "../../lib/courseWorld";
import { COURSE_WORLD_CLOCK_RADIUS } from "./courseWorldModel";

const CLOCK_R = COURSE_WORLD_CLOCK_RADIUS;
const MAX_NODES = 12; // 最大ノード数（pre-allocate）

function tick() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}
function snapHaptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

/** ノード i の基準角度 (currentIdx が 12時位置) */
function baseAngleOf(i: number, currentIdx: number, n: number): number {
  return -Math.PI / 2 + ((i - currentIdx) * 2 * Math.PI) / n;
}

/** 角度 → scale (上が大きく、下が小さい) */
function scaleOf(a: number): number {
  return 0.85 + 0.15 * Math.max(0, -Math.sin(a));
}

export function useCourseWorldScroll({
  width,
  currentIdx,
  allNodes,
  onNodePress,
  onPrimaryPress,
}: {
  width: number;
  currentIdx: number;
  allNodes: CourseWorldNode[];
  onNodePress?: (nodeId: string) => void;
  onPrimaryPress?: () => void;
}) {
  type AnimatedViewStyle = Animated.WithAnimatedObject<ViewStyle>;

  const clockMode   = useRef(new Animated.Value(0)).current;
  const tapScale    = useRef(new Animated.Value(1)).current;
  const isClockRef  = useRef(false);
  const rawAngle    = useRef(0);
  const [, forceUpdate] = useState(0);
  const [topNodeIdx, setTopNodeIdx] = useState(currentIdx);

  // 安定した ref 群
  const currentIdxRef  = useRef(currentIdx);   currentIdxRef.current  = currentIdx;
  const allNodesRef    = useRef(allNodes);      allNodesRef.current    = allNodes;
  const onNodePressRef = useRef(onNodePress);   onNodePressRef.current = onNodePress;
  const onPrimaryRef   = useRef(onPrimaryPress); onPrimaryRef.current  = onPrimaryPress;
  const nodeCountRef   = useRef(allNodes.length); nodeCountRef.current = allNodes.length;
  const lastHapticSlot = useRef(currentIdx);

  // ─── 各ノード個別の Animated.Value（補間テーブル不要） ───────────────
  const nX  = useRef(Array.from({ length: MAX_NODES }, (_, i) => {
    const a = baseAngleOf(i, currentIdx, Math.max(allNodes.length, 1));
    return new Animated.Value(i < allNodes.length ? Math.cos(a) * CLOCK_R : 0);
  })).current;
  const nY  = useRef(Array.from({ length: MAX_NODES }, (_, i) => {
    const a = baseAngleOf(i, currentIdx, Math.max(allNodes.length, 1));
    return new Animated.Value(i < allNodes.length ? Math.sin(a) * CLOCK_R : 0);
  })).current;
  const nS  = useRef(Array.from({ length: MAX_NODES }, (_, i) => {
    const a = baseAngleOf(i, currentIdx, Math.max(allNodes.length, 1));
    return new Animated.Value(i < allNodes.length ? scaleOf(a) : 1);
  })).current;

  // currentIdx が変わったとき（スナップ後）に基準位置をリセット
  useEffect(() => {
    if (isClockRef.current) return;
    const n = allNodesRef.current.length;
    for (let i = 0; i < n; i++) {
      const a = baseAngleOf(i, currentIdx, n);
      nX[i].setValue(Math.cos(a) * CLOCK_R);
      nY[i].setValue(Math.sin(a) * CLOCK_R);
      nS[i].setValue(scaleOf(a));
    }
    lastHapticSlot.current = currentIdx;
  }, [currentIdx]);

  /** ドラッグ中: 全ノードに直接 setValue（補間なし・完全スムーズ） */
  const applyRotation = useCallback((offset: number) => {
    const n = nodeCountRef.current;
    const idx = currentIdxRef.current;
    for (let i = 0; i < n; i++) {
      const a = baseAngleOf(i, idx, n) + offset;
      nX[i].setValue(Math.cos(a) * CLOCK_R);
      nY[i].setValue(Math.sin(a) * CLOCK_R);
      nS[i].setValue(scaleOf(a));
    }
  }, []);

  /** スナップアニメーション */
  const animateToRotation = useCallback((
    offset: number,
    duration: number,
    onDone?: () => void
  ) => {
    const n   = nodeCountRef.current;
    const idx = currentIdxRef.current;
    const ez  = Easing.bezier(0.22, 1, 0.36, 1);
    const anims: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < n; i++) {
      const a = baseAngleOf(i, idx, n) + offset;
      anims.push(
        Animated.timing(nX[i], { toValue: Math.cos(a) * CLOCK_R, duration, easing: ez, useNativeDriver: true }),
        Animated.timing(nY[i], { toValue: Math.sin(a) * CLOCK_R, duration, easing: ez, useNativeDriver: true }),
        Animated.timing(nS[i], { toValue: scaleOf(a),            duration, easing: ez, useNativeDriver: true }),
      );
    }
    Animated.parallel(anims).start(() => onDone?.());
  }, []);

  /** スタイルを返す（各ノードの個別 Animated.Value を直接参照） */
  const buildClockItemStyle = useCallback((nodeIndex: number): AnimatedViewStyle => ({
    transform: [
      { translateX: nX[nodeIndex] },
      { translateY: nY[nodeIndex] },
      { scale:      nS[nodeIndex] },
    ] as AnimatedViewStyle["transform"],
    opacity: 1,
  }), [nX, nY, nS]);

  const enterClockMode = useCallback(() => {
    if (isClockRef.current) return;
    isClockRef.current = true;
    forceUpdate((c) => c + 1);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    Animated.spring(clockMode, {
      toValue: 1, stiffness: 200, damping: 18, mass: 0.7, useNativeDriver: true,
    }).start();
  }, [clockMode]);

  const LONG_PRESS_MS  = 380;
  const DRAG_THRESHOLD = 6;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anglePerLessonRef = useRef((2 * Math.PI) / allNodes.length);
  anglePerLessonRef.current = (2 * Math.PI) / Math.max(allNodes.length, 1);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,

      onPanResponderGrant: () => {
        Animated.spring(tapScale, {
          toValue: 0.88, stiffness: 800, damping: 30, mass: 0.2, useNativeDriver: true,
        }).start();
        longPressTimer.current = setTimeout(() => enterClockMode(), LONG_PRESS_MS);
      },

      onPanResponderMove: (_, g) => {
        const moved = Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD;
        if (moved && !isClockRef.current) {
          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
          enterClockMode();
        }
        if (!isClockRef.current) return;

        const offset = (g.dx / (width * 0.35)) * Math.PI;
        rawAngle.current = offset;
        applyRotation(offset);

        const slotOffset  = Math.round(offset / anglePerLessonRef.current);
        const crossedIdx  = ((currentIdxRef.current - slotOffset) % nodeCountRef.current + nodeCountRef.current) % nodeCountRef.current;
        if (crossedIdx !== lastHapticSlot.current) {
          lastHapticSlot.current = crossedIdx;
          setTopNodeIdx(crossedIdx);
          tick();
        }
      },

      onPanResponderRelease: (_, g) => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        Animated.spring(tapScale, {
          toValue: 1, stiffness: 350, damping: 12, mass: 0.3, useNativeDriver: true,
        }).start();
        if (!isClockRef.current) { onPrimaryRef.current?.(); return; }

        const momentum    = g.vx * 0.5;
        const totalAngle  = rawAngle.current + momentum;
        const slotOffset  = Math.round(totalAngle / anglePerLessonRef.current);
        const snapOffset  = slotOffset * anglePerLessonRef.current;
        const nextIndex   = ((currentIdxRef.current - slotOffset) % nodeCountRef.current + nodeCountRef.current) % nodeCountRef.current;
        const speed       = Math.abs(g.vx);
        const snapDur     = Math.max(200, Math.min(500, 380 - speed * 60));

        snapHaptic();
        animateToRotation(snapOffset, snapDur, () => {
          rawAngle.current = 0;
          lastHapticSlot.current = nextIndex;
          isClockRef.current = false;
          forceUpdate((c) => c + 1);
          setTopNodeIdx(nextIndex);

          Animated.spring(clockMode, {
            toValue: 0, stiffness: 260, damping: 24, mass: 0.6, useNativeDriver: true,
          }).start();
          if (nextIndex !== currentIdxRef.current && onNodePressRef.current && allNodesRef.current[nextIndex]) {
            onNodePressRef.current(allNodesRef.current[nextIndex].id);
          }
        });
      },

      onPanResponderTerminate: () => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        Animated.spring(tapScale, {
          toValue: 1, stiffness: 350, damping: 12, mass: 0.3, useNativeDriver: true,
        }).start();
        animateToRotation(0, 380, () => {
          rawAngle.current = 0;
          isClockRef.current = false;
          forceUpdate((c) => c + 1);
          Animated.spring(clockMode, {
            toValue: 0, stiffness: 260, damping: 24, mass: 0.6, useNativeDriver: true,
          }).start();
        });
      },
    }),
    [animateToRotation, applyRotation, clockMode, enterClockMode, width]
  );

  const heroScale    = clockMode.interpolate({ inputRange: [0, 1],   outputRange: [1, 0] });
  const heroOpacity  = clockMode.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: "clamp" });
  const headerOpacity = clockMode.interpolate({ inputRange: [0, 0.2], outputRange: [1, 0], extrapolate: "clamp" });
  const clockOpacity = clockMode.interpolate({ inputRange: [0.1, 0.5], outputRange: [0, 1], extrapolate: "clamp" });
  const clockScale   = clockMode.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.95, 1] });

  return {
    buildClockItemStyle,
    clockOpacity,
    clockScale,
    headerOpacity,
    heroOpacity,
    heroScale,
    panHandlers: panResponder.panHandlers,
    tapScale,
    topNodeIdx,
  };
}
