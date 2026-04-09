import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { GLOW_COLOR, GLOW_COLOR_BRIGHT } from "./trailMath";

export function Vignette({ height }: { height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height }]} pointerEvents="none">
      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />
      <View style={styles.leftVignette} />
      <View style={styles.rightVignette} />
    </View>
  );
}

export function ShootingStar({ totalHeight, screenWidth }: { totalHeight: number; screenWidth: number }) {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const shootStar = () => {
      const startY = Math.random() * totalHeight * 0.5;
      translateY.setValue(startY);
      translateX.setValue(-50);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(translateX, { toValue: screenWidth + 100, duration: 800, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: startY + 200, duration: 800, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        timer = setTimeout(shootStar, 5000 + Math.random() * 10000);
      });
    };

    timer = setTimeout(shootStar, 2000 + Math.random() * 5000);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [opacity, screenWidth, totalHeight, translateX, translateY]);

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

export function MistLayer({ y, width }: { y: number; width: number }) {
  const translateX = useRef(new Animated.Value(-width * 0.3)).current;
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: width * 0.3, duration: 20000 + Math.random() * 10000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -width * 0.3, duration: 20000 + Math.random() * 10000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [translateX, width]);

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

export function NodeRays({ x, y }: { x: number; y: number }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 15000, useNativeDriver: true })
    );
    const fade = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 2500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    );

    spin.start();
    fade.start();
    pulse.start();

    return () => {
      spin.stop();
      fade.stop();
      pulse.stop();
    };
  }, [opacity, rotation, scale]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const rays = Array.from({ length: 8 }, (_, index) => (index * 360) / 8);

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
            transform: [{ translateY: 40 }, { rotate: `${angle}deg` }, { translateY: -40 }],
          }}
        />
      ))}
    </Animated.View>
  );
}

export function NodeSparkle({ x, y }: { x: number; y: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

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
        timeout = setTimeout(sparkle, 3000 + Math.random() * 7000);
      });
    };

    timeout = setTimeout(sparkle, Math.random() * 3000);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [opacity, rotation, scale]);

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
      <View style={styles.sparkleVertical} />
      <View style={styles.sparkleHorizontal} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  leftVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  rightVignette: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sparkleVertical: {
    position: "absolute",
    left: 4,
    top: 0,
    width: 4,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  sparkleHorizontal: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 12,
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
});
