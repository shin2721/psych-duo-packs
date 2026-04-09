import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Platform } from "react-native";
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

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LONG_PRESS_MS = 350;

  const buildClockItemStyle = useCallback(
    (baseAngle: number) => {
      const STEP = 0.1;
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
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          longPressTimer.current = setTimeout(() => {
            if (!isClockModeRef.current) {
              isClockModeRef.current = true;
              forceUpdate((count) => count + 1);
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
        onPanResponderMove: (_, gestureState) => {
          if (!isClockModeRef.current) {
            if (Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8) {
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
            }
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

          if (!isClockModeRef.current) {
            onPrimaryPressRef.current?.();
            return;
          }

          const momentum = gestureState.vx * 0.5;
          const totalAngle = rawAngle.current + momentum;
          const slotOffset = Math.round(totalAngle / anglePerLessonRef.current);
          const snapAngle = slotOffset * anglePerLessonRef.current;
          const nextIndex = ((currentIdxRef.current - slotOffset) % nodeCountRef.current + nodeCountRef.current) % nodeCountRef.current;

          snap();
          Animated.spring(rotationAngle, {
            toValue: snapAngle,
            stiffness: 180,
            damping: 18,
            mass: 0.6,
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
              stiffness: 300,
              damping: 22,
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

          Animated.spring(rotationAngle, {
            toValue: 0,
            stiffness: 200,
            damping: 25,
            mass: 1,
            useNativeDriver: true,
          }).start(() => {
            rawAngle.current = 0;
            isClockModeRef.current = false;
            forceUpdate((count) => count + 1);
            Animated.spring(clockMode, {
              toValue: 0,
              stiffness: 300,
              damping: 22,
              mass: 0.6,
              useNativeDriver: true,
            }).start();
          });
        },
      }),
    [clockMode, rotationAngle, width]
  );

  const heroScale = clockMode.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const heroOpacity = clockMode.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const headerOpacity = clockMode.interpolate({
    inputRange: [0, 0.2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const clockOpacity = clockMode.interpolate({
    inputRange: [0.2, 0.6],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const clockScale = clockMode.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return {
    buildClockItemStyle,
    clockOpacity,
    clockScale,
    headerOpacity,
    heroOpacity,
    heroScale,
    panHandlers: panResponder.panHandlers,
    topNodeIdx,
  };
}
