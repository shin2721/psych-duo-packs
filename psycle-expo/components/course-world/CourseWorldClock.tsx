import React, { useEffect, useRef } from "react";
import { Text, View, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { CourseWorldNode } from "../../lib/courseWorld";
import { COURSE_WORLD_CLOCK_RING_SIZE } from "./courseWorldModel";
import { baseAngleOf, scaleOf, CLOCK_R } from "./useCourseWorldScroll";

// ─── ClockRing（見た目のみ、アニメーションなし）─────────────────────────────

export function ClockRing({
  node,
  themeColor,
  synColor,
  isTop,
  isNextLesson = false,
}: {
  node: CourseWorldNode;
  themeColor: string;
  synColor: string;
  isTop: boolean;
  isNextLesson?: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const topScale  = useRef(new Animated.Value(1)).current;
  const prevIsTop = useRef(false);

  // 次のレッスン — 脈動アウトライン
  useEffect(() => {
    if (!isNextLesson || isTop) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => { anim.stop(); pulseAnim.setValue(0.3); };
  }, [isNextLesson, isTop]);

  // top になった瞬間にポップ
  useEffect(() => {
    if (isTop && !prevIsTop.current) {
      Animated.sequence([
        Animated.spring(topScale, { toValue: 1.14, stiffness: 500, damping: 10, mass: 0.25, useNativeDriver: true }),
        Animated.spring(topScale, { toValue: 1,    stiffness: 320, damping: 20, mass: 0.3,  useNativeDriver: true }),
      ]).start();
    }
    prevIsTop.current = isTop;
  }, [isTop]);

  const size = isTop ? COURSE_WORLD_CLOCK_RING_SIZE * 1.2 : COURSE_WORLD_CLOCK_RING_SIZE;
  const isDone   = node.status === "done";
  const isLocked = node.status === "locked" || node.isLocked;
  const radius   = size / 2 - 6;
  const stroke   = isTop ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const ringColor = isTop
    ? themeColor
    : isDone   ? synColor
    : isLocked ? "rgba(60,75,120,0.35)"
    : `${themeColor}77`;
  const iconColor = isTop
    ? "#FFFFFF"
    : isDone   ? `${synColor}CC`
    : isLocked ? "rgba(60,75,120,0.5)"
    : `${themeColor}AA`;

  return (
    <Animated.View style={{ width: size + 40, height: size + 40, alignItems: "center", justifyContent: "center", transform: [{ scale: topScale }] }}>
      {/* 次のレッスン — 脈動アウトライン */}
      {isNextLesson && !isTop ? (
        <Animated.View style={{
          position: "absolute",
          width: size + 32, height: size + 32,
          borderRadius: (size + 32) / 2,
          borderWidth: 1.5, borderColor: themeColor,
          opacity: pulseAnim,
        }} />
      ) : null}

      {/* top ノードの外輪グロー */}
      {isTop ? (
        <>
          <View style={{ position: "absolute", width: size + 50, height: size + 50, borderRadius: (size + 50) / 2, backgroundColor: themeColor, opacity: 0.15 }} />
          <View style={{ position: "absolute", width: size + 24, height: size + 24, borderRadius: (size + 24) / 2, backgroundColor: themeColor, opacity: 0.25 }} />
        </>
      ) : null}

      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={isTop ? `${themeColor}30` : "rgba(60,75,120,0.12)"} strokeWidth={stroke} />
        {isTop ? (
          <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={themeColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circumference}`} strokeDashoffset={0} opacity={0.9} />
        ) : null}
        {!isTop && (isDone || !isLocked) ? (
          <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circumference}`} strokeDashoffset={isDone ? 0 : circumference * 0.5}
            transform={`rotate(-90, ${cx}, ${cy})`} opacity={0.5} />
        ) : null}
      </Svg>

      <View style={{ position: "absolute", alignItems: "center" }}>
        <Ionicons color={iconColor} name={node.icon as keyof typeof Ionicons.glyphMap} size={size * 0.28} />
        <Text style={{ color: iconColor, fontSize: size * 0.12, fontWeight: "800", marginTop: 2, letterSpacing: -0.3 }}>
          {node.label}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── ClockItem（UI スレッドで位置を計算）────────────────────────────────────

function ClockItem({
  node,
  index,
  rotOffset,
  svCurrentIdx,
  svNodeCount,
  isTop,
  isNextLesson,
  themeColor,
  synColor,
  renderNextLessonEffects,
}: {
  node: CourseWorldNode;
  index: number;
  rotOffset: SharedValue<number>;
  svCurrentIdx: SharedValue<number>;
  svNodeCount: SharedValue<number>;
  isTop: boolean;
  isNextLesson: boolean;
  themeColor: string;
  synColor: string;
  renderNextLessonEffects?: () => React.ReactNode;
}) {
  // UI スレッドで直接 cos/sin を計算 — bridge 呼び出しなし・完全スムーズ
  const animStyle = useAnimatedStyle(() => {
    "worklet";
    const n = svNodeCount.value;
    const a = baseAngleOf(index, svCurrentIdx.value, n) + rotOffset.value;
    return {
      transform: [
        { translateX: Math.cos(a) * CLOCK_R },
        { translateY: Math.sin(a) * CLOCK_R },
        { scale: scaleOf(a) },
      ],
    };
  });

  return (
    <Reanimated.View style={[
      { position: "absolute", alignItems: "center", justifyContent: "center", zIndex: isTop ? 10 : 1 },
      animStyle,
    ]}>
      <ClockRing node={node} themeColor={themeColor} synColor={synColor} isTop={isTop} isNextLesson={isNextLesson} />
      {isNextLesson && renderNextLessonEffects ? (
        <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }} pointerEvents="none">
          {renderNextLessonEffects()}
        </View>
      ) : null}
    </Reanimated.View>
  );
}

// ─── CourseWorldClockDial ────────────────────────────────────────────────────

export function CourseWorldClockDial({
  clockItems,
  rotOffset,
  svCurrentIdx,
  svNodeCount,
  topNodeIdx,
  nextLessonIdx,
  themeColor,
  synColor,
  renderNextLessonEffects,
}: {
  clockItems: Array<{ node: CourseWorldNode; baseAngle: number; index: number }>;
  rotOffset: SharedValue<number>;
  svCurrentIdx: SharedValue<number>;
  svNodeCount: SharedValue<number>;
  topNodeIdx: number;
  nextLessonIdx: number;
  themeColor: string;
  synColor: string;
  renderNextLessonEffects?: () => React.ReactNode;
}) {
  return (
    <>
      {clockItems.map(({ node, index }) => (
        <ClockItem
          key={node.id}
          node={node}
          index={index}
          rotOffset={rotOffset}
          svCurrentIdx={svCurrentIdx}
          svNodeCount={svNodeCount}
          isTop={index === topNodeIdx}
          isNextLesson={index === nextLessonIdx}
          themeColor={themeColor}
          synColor={synColor}
          renderNextLessonEffects={renderNextLessonEffects}
        />
      ))}
    </>
  );
}
