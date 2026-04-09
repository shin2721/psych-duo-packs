import React, { useMemo, useRef, useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { theme } from "../../lib/theme";
import { FIREFLY_COLORS, GLOW_COLOR, PATH_COLOR_FUTURE } from "./trailMath";

function BackgroundStar({ x, y, size }: { x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const twinkle = () => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.1, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5 + Math.random() * 0.3, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
      ]).start(() => {
        twinkle();
      });
    };

    timeout = setTimeout(twinkle, Math.random() * 3000);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [opacity]);

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

function FloatingParticle({
  delay,
  size,
  startX,
  startY,
  moveX,
  moveY,
  duration,
  color = GLOW_COLOR,
}: {
  delay: number;
  size: number;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
  duration: number;
  color?: string;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -moveY, duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: moveY, duration, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
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

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [delay, duration, moveX, moveY, opacity, translateX, translateY]);

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

export function TrailBackground({
  totalHeight,
  screenWidth,
  pathDone,
  pathFuture,
  activePathColor,
  currentNodeFireflies,
}: {
  totalHeight: number;
  screenWidth: number;
  pathDone: string;
  pathFuture: string;
  activePathColor: string;
  currentNodeFireflies: Array<{
    id: number;
    delay: number;
    size: number;
    startX: number;
    startY: number;
    moveX: number;
    moveY: number;
    duration: number;
  }>;
}) {
  const stars = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      x: Math.random() * screenWidth,
      y: Math.random() * totalHeight,
      size: index < 20 ? 2.5 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
    }));
  }, [screenWidth, totalHeight]);

  const particles = useMemo(() => {
    const cols = 4;
    const rows = 4;
    const cellWidth = screenWidth / cols;
    const cellHeight = totalHeight / rows;
    const result: Array<{
      id: number;
      delay: number;
      size: number;
      startX: number;
      startY: number;
      moveX: number;
      moveY: number;
      duration: number;
      color: string;
    }> = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const jitterX = (Math.random() - 0.5) * cellWidth;
        const jitterY = (Math.random() - 0.5) * cellHeight;
        result.push({
          id: row * cols + col,
          delay: Math.random() * 4000,
          size: 3 + Math.random() * 5,
          startX: Math.max(10, Math.min(screenWidth - 10, (col + 0.5) * cellWidth + jitterX)),
          startY: Math.max(10, Math.min(totalHeight - 10, (row + 0.5) * cellHeight + jitterY)),
          moveX: 8 + Math.random() * 30,
          moveY: 12 + Math.random() * 40,
          duration: 2000 + Math.random() * 4000,
          color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
        });
      }
    }

    for (let index = 0; index < 8; index += 1) {
      result.push({
        id: 100 + index,
        delay: Math.random() * 5000,
        size: 3 + Math.random() * 5,
        startX: 15 + Math.random() * (screenWidth - 30),
        startY: Math.random() * totalHeight,
        moveX: 10 + Math.random() * 35,
        moveY: 15 + Math.random() * 45,
        duration: 2000 + Math.random() * 4000,
        color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
      });
    }

    return result;
  }, [screenWidth, totalHeight]);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { height: totalHeight, backgroundColor: theme.colors.bg }]} />

      {stars.map((star) => (
        <BackgroundStar key={`trail-star-${star.id}`} x={star.x} y={star.y} size={star.size} />
      ))}

      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}

      {currentNodeFireflies.map((particle) => (
        <FloatingParticle
          key={particle.id}
          delay={particle.delay}
          size={particle.size}
          startX={particle.startX}
          startY={particle.startY}
          moveX={particle.moveX}
          moveY={particle.moveY}
          duration={particle.duration}
        />
      ))}

      <Svg height={totalHeight} width={screenWidth} style={StyleSheet.absoluteFill}>
        <Path d={pathFuture} stroke={PATH_COLOR_FUTURE} strokeWidth={8} fill="none" opacity={0.5} />
        <Path d={pathFuture} stroke={PATH_COLOR_FUTURE} strokeWidth={2} fill="none" opacity={0.8} />
        {pathDone ? (
          <>
            <Path d={pathDone} stroke={activePathColor} strokeWidth={14} fill="none" opacity={0.4} />
            <Path d={pathDone} stroke={activePathColor} strokeWidth={6} fill="none" opacity={1.0} />
          </>
        ) : null}
      </Svg>
    </>
  );
}
