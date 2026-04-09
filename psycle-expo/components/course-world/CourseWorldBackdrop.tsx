import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { ViewStyle } from "react-native";
import {
  COURSE_WORLD_RING_CIRCUMFERENCE,
  COURSE_WORLD_RING_CX,
  COURSE_WORLD_RING_CY,
  COURSE_WORLD_RING_RADIUS,
  COURSE_WORLD_RING_SIZE,
  COURSE_WORLD_RING_STROKE,
} from "./courseWorldModel";

const EASE_SIN = Easing.bezier(0.37, 0, 0.63, 1);

export interface FireflyConfig {
  cx: number;
  cy: number;
  driftX: number;
  driftY: number;
  dur: number;
  glowDur: number;
  size: number;
}

export const HERO_FIREFLY_CONFIGS: FireflyConfig[] = [
  { cx: -140, cy: -50, driftX: 20, driftY: 24, dur: 12000, glowDur: 4000, size: 7 },
  { cx: 135, cy: -35, driftX: 24, driftY: 18, dur: 14000, glowDur: 3500, size: 6 },
  { cx: -120, cy: 70, driftX: 16, driftY: 22, dur: 16000, glowDur: 5000, size: 5 },
  { cx: 125, cy: 60, driftX: 28, driftY: 20, dur: 11000, glowDur: 3800, size: 8 },
  { cx: 20, cy: -145, driftX: 14, driftY: 16, dur: 18000, glowDur: 4500, size: 5 },
];

export const CLOCK_FIREFLY_CONFIGS: FireflyConfig[] = [
  { cx: -95, cy: -30, driftX: 14, driftY: 16, dur: 10000, glowDur: 3500, size: 5 },
  { cx: 90, cy: -25, driftX: 16, driftY: 12, dur: 12000, glowDur: 3000, size: 5 },
  { cx: -80, cy: 45, driftX: 12, driftY: 15, dur: 14000, glowDur: 4500, size: 4 },
  { cx: 85, cy: 40, driftX: 18, driftY: 14, dur: 9000, glowDur: 3200, size: 6 },
  { cx: 10, cy: -100, driftX: 10, driftY: 12, dur: 16000, glowDur: 4000, size: 4 },
];

function useBreath(min: number, ms: number = 3000) {
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: min, duration: ms / 2, easing: EASE_SIN, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: ms / 2, easing: EASE_SIN, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [min, ms, value]);

  return value;
}

function buildAnimatedTranslateStyle(
  translateX: Animated.AnimatedAddition<string | number>,
  translateY: Animated.AnimatedAddition<string | number>
): Animated.WithAnimatedObject<ViewStyle> {
  return {
    transform: [{ translateX }, { translateY }],
  };
}

export function CourseWorldBackdrop({ themeColor, synColor }: { themeColor: string; synColor: string }) {
  const wash = useBreath(0, 8000);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <LinearGradient
        colors={["#040812", "#08102A", "#0C0824", "#060610"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: wash }]}>
        <LinearGradient
          colors={["transparent", `${themeColor}18`, `${synColor}0C`, "transparent"]}
          locations={[0.1, 0.35, 0.55, 0.8]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function Fireflies({
  themeColor,
  synColor,
  configs,
}: {
  themeColor: string;
  synColor: string;
  configs: FireflyConfig[];
}) {
  const anims = useRef(
    configs.map(() => ({
      driftX: new Animated.Value(0),
      driftY: new Animated.Value(0),
      glow: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.flatMap((animationValues, index) => {
      const config = configs[index];
      const driftX = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValues.driftX, { toValue: 1, duration: config.dur / 2, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(animationValues.driftX, { toValue: -1, duration: config.dur, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(animationValues.driftX, { toValue: 0, duration: config.dur / 2, easing: EASE_SIN, useNativeDriver: true }),
        ])
      );
      const driftY = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValues.driftY, { toValue: -1, duration: config.dur * 0.6, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(animationValues.driftY, { toValue: 1, duration: config.dur * 0.8, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(animationValues.driftY, { toValue: 0, duration: config.dur * 0.6, easing: EASE_SIN, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValues.glow, { toValue: 1, duration: config.glowDur / 2, easing: EASE_SIN, useNativeDriver: true }),
          Animated.timing(animationValues.glow, { toValue: 0, duration: config.glowDur / 2, easing: EASE_SIN, useNativeDriver: true }),
        ])
      );

      driftX.start();
      driftY.start();
      glow.start();

      return [driftX, driftY, glow];
    });

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [anims, configs]);

  return (
    <>
      {configs.map((config, index) => {
        const color = index % 2 === 0 ? themeColor : synColor;
        const translateX = Animated.add(config.cx, Animated.multiply(anims[index].driftX, config.driftX));
        const translateY = Animated.add(config.cy, Animated.multiply(anims[index].driftY, config.driftY));
        const opacity = anims[index].glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.0] });

        return (
          <Animated.View
            key={`firefly-${index}`}
            style={[
              {
                position: "absolute",
                alignSelf: "center",
                width: config.size,
                height: config.size,
                borderRadius: config.size,
                backgroundColor: color,
                opacity,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: config.size * 4,
                zIndex: 3,
              },
              buildAnimatedTranslateStyle(translateX, translateY),
            ]}
          />
        );
      })}
    </>
  );
}

export function HeroRing({
  progress,
  themeColor,
  synColor,
  icon,
}: {
  progress: number;
  themeColor: string;
  synColor: string;
  icon: string;
}) {
  const glowBreath = useBreath(0.5, 4000);
  const iconBreath = useBreath(0.85, 3200);

  const displayProgress = Math.max(progress, 0.03);
  const arcOffset = COURSE_WORLD_RING_CIRCUMFERENCE * (1 - displayProgress);
  const dotDegrees = (progress > 0 ? progress * 360 : 0) - 90;
  const dotRadians = (dotDegrees * Math.PI) / 180;
  const dotX = COURSE_WORLD_RING_CX + COURSE_WORLD_RING_RADIUS * Math.cos(dotRadians);
  const dotY = COURSE_WORLD_RING_CY + COURSE_WORLD_RING_RADIUS * Math.sin(dotRadians);
  const glowSize = COURSE_WORLD_RING_SIZE + 160;
  const glowOffset = 80;

  return (
    <View style={{ width: COURSE_WORLD_RING_SIZE, height: COURSE_WORLD_RING_SIZE, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          pointerEvents: "none",
          position: "absolute",
          width: glowSize,
          height: glowSize,
          left: -glowOffset,
          top: -glowOffset,
          opacity: glowBreath,
        }}
      >
        <Svg width={glowSize} height={glowSize}>
          <Defs>
            <RadialGradient id="course-world-hero-glow-1" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={themeColor} stopOpacity="0.50" />
              <Stop offset="0.2" stopColor={themeColor} stopOpacity="0.28" />
              <Stop offset="0.45" stopColor={synColor} stopOpacity="0.10" />
              <Stop offset="0.7" stopColor={synColor} stopOpacity="0.03" />
              <Stop offset="1" stopColor={synColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={glowSize / 2} cy={glowSize / 2} rx={glowSize / 2} ry={glowSize / 2} fill="url(#course-world-hero-glow-1)" />
        </Svg>
      </Animated.View>

      <View
        style={{
          pointerEvents: "none",
          position: "absolute",
          width: COURSE_WORLD_RING_SIZE + 80,
          height: COURSE_WORLD_RING_SIZE + 80,
          left: -40,
          top: -40,
        }}
      >
        <Svg width={COURSE_WORLD_RING_SIZE + 80} height={COURSE_WORLD_RING_SIZE + 80}>
          <Defs>
            <RadialGradient id="course-world-hero-glow-2" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={themeColor} stopOpacity="0.30" />
              <Stop offset="0.35" stopColor={themeColor} stopOpacity="0.14" />
              <Stop offset="0.65" stopColor={synColor} stopOpacity="0.05" />
              <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={(COURSE_WORLD_RING_SIZE + 80) / 2}
            cy={(COURSE_WORLD_RING_SIZE + 80) / 2}
            r={(COURSE_WORLD_RING_SIZE + 80) / 2}
            fill="url(#course-world-hero-glow-2)"
          />
        </Svg>
      </View>

      <Svg width={COURSE_WORLD_RING_SIZE} height={COURSE_WORLD_RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="course-world-hero-arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={themeColor} stopOpacity="1" />
            <Stop offset="0.5" stopColor={synColor} stopOpacity="0.95" />
            <Stop offset="1" stopColor={synColor} stopOpacity="0.75" />
          </SvgLinearGradient>
          <RadialGradient id="course-world-hero-inner" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={themeColor} stopOpacity="0.14" />
            <Stop offset="0.5" stopColor={themeColor} stopOpacity="0.05" />
            <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={COURSE_WORLD_RING_CX}
          cy={COURSE_WORLD_RING_CY}
          r={COURSE_WORLD_RING_RADIUS - COURSE_WORLD_RING_STROKE}
          fill="url(#course-world-hero-inner)"
        />
        <Circle
          cx={COURSE_WORLD_RING_CX}
          cy={COURSE_WORLD_RING_CY}
          r={COURSE_WORLD_RING_RADIUS}
          fill="none"
          stroke="rgba(60,75,120,0.12)"
          strokeWidth={COURSE_WORLD_RING_STROKE}
        />
        {displayProgress > 0 ? (
          <Circle
            cx={COURSE_WORLD_RING_CX}
            cy={COURSE_WORLD_RING_CY}
            r={COURSE_WORLD_RING_RADIUS}
            fill="none"
            stroke="url(#course-world-hero-arc)"
            strokeWidth={COURSE_WORLD_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${COURSE_WORLD_RING_CIRCUMFERENCE}`}
            strokeDashoffset={arcOffset}
            transform={`rotate(-90, ${COURSE_WORLD_RING_CX}, ${COURSE_WORLD_RING_CY})`}
          />
        ) : null}
        <Circle cx={dotX} cy={dotY} r={12} fill={themeColor} opacity={0.06} />
        <Circle cx={dotX} cy={dotY} r={7} fill={themeColor} opacity={0.18} />
        <Circle cx={dotX} cy={dotY} r={5} fill={themeColor} opacity={0.9} />
      </Svg>

      <Animated.View style={[styles.ringIcon, { opacity: iconBreath, pointerEvents: "none" }]}>
        <Ionicons color={`${themeColor}EE`} name={icon as keyof typeof Ionicons.glyphMap} size={48} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringIcon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
