import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform } from "react-native";
import { useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import type { CourseWorldNode } from "../../lib/courseWorld";
import { COURSE_WORLD_CLOCK_RADIUS } from "./courseWorldModel";

export const CLOCK_R = COURSE_WORLD_CLOCK_RADIUS;

/** ノード i の基準角度（currentIdx が 12 時位置） — worklet 対応 */
export function baseAngleOf(i: number, currentIdx: number, n: number): number {
  "worklet";
  return -Math.PI / 2 + ((i - currentIdx) * 2 * Math.PI) / n;
}

/** 角度 → scale（上が大、下が小） — worklet 対応 */
export function scaleOf(a: number): number {
  "worklet";
  return 0.85 + 0.15 * Math.max(0, -Math.sin(a));
}

/** ease-out-expo — worklet 対応 */
function easeOutExpo(t: number): number {
  "worklet";
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function doTick() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
function doSnapHaptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
  // ── JS スレッド（Animated）: clockMode / tapScale / opacity 系 ──────────
  const clockMode = useRef(new Animated.Value(0)).current;
  const tapScale  = useRef(new Animated.Value(1)).current;
  const [, forceUpdate] = useState(0);
  const [topNodeIdx, setTopNodeIdx] = useState(currentIdx);

  // JS refs
  const isClockModeRef = useRef(false);
  const currentIdxRef  = useRef(currentIdx); currentIdxRef.current = currentIdx;
  const allNodesRef    = useRef(allNodes);   allNodesRef.current   = allNodes;
  const onNodePressRef = useRef(onNodePress); onNodePressRef.current = onNodePress;
  const onPrimaryRef   = useRef(onPrimaryPress); onPrimaryRef.current  = onPrimaryPress;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI スレッド（Reanimated SharedValue）: 回転オフセット ────────────────
  const rotOffset    = useSharedValue(0);
  const svCurrentIdx = useSharedValue(currentIdx);
  const svNodeCount  = useSharedValue(allNodes.length);
  const svAnglePer   = useSharedValue((2 * Math.PI) / Math.max(allNodes.length, 1));
  const svIsClockMode = useSharedValue(0);
  const svLastHaptic  = useSharedValue(currentIdx);
  const svWidth       = useSharedValue(width);

  // props が変わったら SharedValue を同期（毎レンダー、軽量）
  svCurrentIdx.value = currentIdx;
  svNodeCount.value  = allNodes.length;
  svAnglePer.value   = (2 * Math.PI) / Math.max(allNodes.length, 1);
  svWidth.value      = width;

  // ── JS 側コールバック（worklet から runOnJS で呼ばれる） ─────────────────

  const enterClockMode = useCallback(() => {
    if (isClockModeRef.current) return;
    isClockModeRef.current = true;
    forceUpdate(c => c + 1);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Animated.spring(clockMode, { toValue: 1, stiffness: 200, damping: 18, mass: 0.7, useNativeDriver: true }).start();
  }, [clockMode]);

  const onPressDown = useCallback(() => {
    Animated.spring(tapScale, { toValue: 0.88, stiffness: 800, damping: 30, mass: 0.2, useNativeDriver: true }).start();
    longPressTimer.current = setTimeout(() => {
      if (!svIsClockMode.value) { svIsClockMode.value = 1; enterClockMode(); }
    }, 380);
  }, [tapScale, enterClockMode, svIsClockMode]);

  const onPressUp = useCallback(() => {
    Animated.spring(tapScale, { toValue: 1, stiffness: 350, damping: 12, mass: 0.3, useNativeDriver: true }).start();
  }, [tapScale]);

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const onTap = useCallback(() => { onPrimaryRef.current?.(); }, []);

  const onHapticTick = useCallback((idx: number) => {
    setTopNodeIdx(idx);
    doTick();
  }, []);

  const onSnapDone = useCallback((nextIndex: number) => {
    isClockModeRef.current = false;
    svIsClockMode.value = 0;
    forceUpdate(c => c + 1);
    setTopNodeIdx(nextIndex);
    svLastHaptic.value = nextIndex;

    Animated.spring(clockMode, { toValue: 0, stiffness: 260, damping: 24, mass: 0.6, useNativeDriver: true }).start(() => {
      rotOffset.value = 0;
    });

    if (nextIndex !== currentIdxRef.current && onNodePressRef.current && allNodesRef.current[nextIndex]) {
      onNodePressRef.current(allNodesRef.current[nextIndex].id);
    }
  }, [clockMode, rotOffset, svIsClockMode, svLastHaptic]);

  const onTerminate = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    isClockModeRef.current = false;
    svIsClockMode.value = 0;
    forceUpdate(c => c + 1);
    Animated.spring(clockMode, { toValue: 0, stiffness: 260, damping: 24, mass: 0.6, useNativeDriver: true }).start(() => {
      rotOffset.value = 0;
    });
  }, [clockMode, rotOffset, svIsClockMode]);

  // ── Gesture（UI スレッド worklet）────────────────────────────────────────
  const gesture = Gesture.Pan()
    .onBegin(() => {
      "worklet";
      runOnJS(onPressDown)();
    })
    .onUpdate((e) => {
      "worklet";
      const moved = Math.abs(e.translationX) > 6 || Math.abs(e.translationY) > 6;
      if (moved) {
        if (!svIsClockMode.value) {
          svIsClockMode.value = 1;
          runOnJS(clearTimer)();
          runOnJS(enterClockMode)();
        }
        const offset = (e.translationX / (svWidth.value * 0.35)) * Math.PI;
        rotOffset.value = offset;

        const n          = svNodeCount.value;
        const slotOffset = Math.round(offset / svAnglePer.value);
        const crossed    = ((svCurrentIdx.value - slotOffset) % n + n) % n;
        if (crossed !== svLastHaptic.value) {
          svLastHaptic.value = crossed;
          runOnJS(onHapticTick)(crossed);
        }
      }
    })
    .onEnd((e) => {
      "worklet";
      runOnJS(onPressUp)();
      runOnJS(clearTimer)();

      if (!svIsClockMode.value) {
        runOnJS(onTap)();
        return;
      }

      const n          = svNodeCount.value;
      const momentum   = e.velocityX * 0.5;
      const total      = rotOffset.value + momentum;
      const slotOffset = Math.round(total / svAnglePer.value);
      const snapOff    = slotOffset * svAnglePer.value;
      const nextIndex  = ((svCurrentIdx.value - slotOffset) % n + n) % n;
      const speed      = Math.abs(e.velocityX);
      const dur        = Math.max(200, Math.min(500, 380 - speed * 60));

      runOnJS(doSnapHaptic)();
      rotOffset.value = withTiming(snapOff, { duration: dur, easing: easeOutExpo }, (finished) => {
        "worklet";
        if (finished) runOnJS(onSnapDone)(nextIndex);
      });
    })
    .onFinalize((_e, success) => {
      "worklet";
      if (!success) runOnJS(onTerminate)();
    });

  // currentIdx 変化時（スナップ後の親 state 更新）に SharedValue を同期
  useEffect(() => {
    if (!isClockModeRef.current) {
      svCurrentIdx.value = currentIdx;
      svLastHaptic.value = currentIdx;
    }
  }, [currentIdx]);

  // ── Animated 補間（clockMode 基準）────────────────────────────────────────
  const heroScale     = clockMode.interpolate({ inputRange: [0, 1],   outputRange: [1, 0] });
  const heroOpacity   = clockMode.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: "clamp" });
  const headerOpacity = clockMode.interpolate({ inputRange: [0, 0.2], outputRange: [1, 0], extrapolate: "clamp" });
  const clockOpacity  = clockMode.interpolate({ inputRange: [0.1, 0.5], outputRange: [0, 1], extrapolate: "clamp" });
  const clockScale    = clockMode.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.95, 1] });

  return {
    gesture,
    rotOffset,
    svCurrentIdx,
    svNodeCount,
    clockOpacity,
    clockScale,
    headerOpacity,
    heroOpacity,
    heroScale,
    tapScale,
    topNodeIdx,
  };
}
