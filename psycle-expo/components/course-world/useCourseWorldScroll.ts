import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform } from "react-native";
import type { ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import type { CourseWorldNode } from "../../lib/courseWorld";

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
  const rotationAngle = useRef(new Animated.Value(0)).current;
  const rawAngle = useRef(0);
  const clockMode = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;
  const isClockModeRef = useRef(false);
  const [, forceUpdate] = useState(0);
  const [topNodeIdx, setTopNodeIdx] = useState(currentIdx);

  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const allNodesRef = useRef(allNodes);
  allNodesRef.current = allNodes;
  const onNodePressRef = useRef(onNodePress);
  onNodePressRef.current = onNodePress;
  const onPrimaryPressRef = useRef(onPrimaryPress);
  onPrimaryPressRef.current = onPrimaryPress;

  const lastHapticSlot = useRef(currentIdx);
  const anglePerLesson = allNodes.length > 0 ? (2 * Math.PI) / allNodes.length : 1;
  const anglePerLessonRef = useRef(anglePerLesson);
  anglePerLessonRef.current = anglePerLesson;
  const nodeCountRef = useRef(allNodes.length);
  nodeCountRef.current = allNodes.length;

  const DRAG_THRESHOLD = 6;
  const LONG_PRESS_MS = 380;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterClockMode = useCallback(() => {
    if (isClockModeRef.current) return;
    isClockModeRef.current = true;
    forceUpdate((c) => c + 1);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    Animated.spring(clockMode, {
      toValue: 1,
      stiffness: 200,
      damping: 18,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [clockMode]);

  const buildClockItemStyle = useCallback(
    (baseAngle: number) => {
      const STEP = 0.05;
      const MIN = -Math.PI * 2.5;
      const MAX = Math.PI * 2.5;
      const steps: number[] = [];

      for (let step = MIN; step <= MAX; step += STEP) {
        steps.push(step);
      }
      if (!steps.includes(0)) steps.push(0);
      steps.sort((left, right) => left - right);

      const translateX = steps.map((radians) => Math.cos(baseAngle + radians) * 160);
      const translateY = steps.map((radians) => Math.sin(baseAngle + radians) * 160);
      const scale = steps.map((radians) => 0.85 + 0.15 * Math.max(0, -Math.sin(baseAngle + radians)));
      const opacity = steps.map(() => 1.0);

      return {
        transform: [
          { translateX: rotationAngle.interpolate({ inputRange: steps, outputRange: translateX, extrapolate: "clamp" }) },
          { translateY: rotationAngle.interpolate({ inputRange: steps, outputRange: translateY, extrapolate: "clamp" }) },
          { scale: rotationAngle.interpolate({ inputRange: steps, outputRange: scale, extrapolate: "clamp" }) },
        ] as AnimatedViewStyle["transform"],
        opacity: rotationAngle.interpolate({ inputRange: steps, outputRange: opacity, extrapolate: "clamp" }),
      };
    },
    [rotationAngle]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          // 押し込みアニメーション即発火（springで瞬間的に）
          Animated.spring(tapScale, {
            toValue: 0.88,
            stiffness: 800,
            damping: 30,
            mass: 0.2,
            useNativeDriver: true,
          }).start();
          // 長押しタイマー開始
          longPressTimer.current = setTimeout(() => {
            enterClockMode();
          }, LONG_PRESS_MS);
        },
        onPanResponderMove: (_, gestureState) => {
          const moved = Math.abs(gestureState.dx) > DRAG_THRESHOLD || Math.abs(gestureState.dy) > DRAG_THRESHOLD;
          // 動いたらすぐクロックモードへ（長押し待たずに）
          if (moved && !isClockModeRef.current) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            enterClockMode();
          }
          if (!isClockModeRef.current) {
            return;
          }

          const angle = (gestureState.dx / (width * 0.35)) * Math.PI;
          rotationAngle.setValue(angle);
          rawAngle.current = angle;

          const slotOffset = Math.round(angle / anglePerLessonRef.current);
          const crossedIdx = ((currentIdxRef.current - slotOffset) % nodeCountRef.current + nodeCountRef.current) % nodeCountRef.current;
          if (crossedIdx !== lastHapticSlot.current) {
            lastHapticSlot.current = crossedIdx;
            setTopNodeIdx(crossedIdx);
            tick();
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          // ポヨン戻し
          Animated.spring(tapScale, {
            toValue: 1,
            stiffness: 350,
            damping: 12,
            mass: 0.3,
            useNativeDriver: true,
          }).start();
          if (!isClockModeRef.current) {
            // タップだった場合はprimaryPress
            onPrimaryPressRef.current?.();
            return;
          }

          const momentum = gestureState.vx * 0.5;
          const totalAngle = rawAngle.current + momentum;
          const slotOffset = Math.round(totalAngle / anglePerLessonRef.current);
          const snapAngle = slotOffset * anglePerLessonRef.current;
          const nextIndex = ((currentIdxRef.current - slotOffset) % nodeCountRef.current + nodeCountRef.current) % nodeCountRef.current;

          snap();
          // 速度に比例してdurationを短く（速く離したら速くスナップ）
          const speed = Math.abs(gestureState.vx);
          const snapDuration = Math.max(200, Math.min(500, 380 - speed * 60));
          Animated.timing(rotationAngle, {
            toValue: snapAngle,
            duration: snapDuration,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }).start(() => {
            rotationAngle.setValue(0);
            rawAngle.current = 0;
            lastHapticSlot.current = nextIndex;
            isClockModeRef.current = false;
            forceUpdate((count) => count + 1);
            setTopNodeIdx(nextIndex);

            Animated.spring(clockMode, {
              toValue: 0,
              stiffness: 260,
              damping: 24,
              mass: 0.6,
              useNativeDriver: true,
            }).start();

            if (nextIndex !== currentIdxRef.current && onNodePressRef.current && allNodesRef.current[nextIndex]) {
              onNodePressRef.current(allNodesRef.current[nextIndex].id);
            }
          });
        },
        onPanResponderTerminate: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          Animated.spring(tapScale, {
            toValue: 1, stiffness: 350, damping: 12, mass: 0.3, useNativeDriver: true,
          }).start();
          Animated.timing(rotationAngle, {
            toValue: 0,
            duration: 380,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }).start(() => {
            rawAngle.current = 0;
            isClockModeRef.current = false;
            forceUpdate((count) => count + 1);
            Animated.spring(clockMode, {
              toValue: 0,
              stiffness: 260,
              damping: 24,
              mass: 0.6,
              useNativeDriver: true,
            }).start();
          });
        },
      }),
    [clockMode, enterClockMode, rotationAngle, width]
  );

  const heroScale = clockMode.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const heroOpacity = clockMode.interpolate({
    inputRange: [0, 0.4],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const headerOpacity = clockMode.interpolate({
    inputRange: [0, 0.2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const clockOpacity = clockMode.interpolate({
    inputRange: [0.1, 0.5],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const clockScale = clockMode.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.95, 1],
  });

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
