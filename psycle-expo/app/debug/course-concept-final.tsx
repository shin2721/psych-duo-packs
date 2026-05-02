import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80";

const GLOW_ORBS = [
  { top: "18%", left: "16%", size: 72, opacity: 0.16 },
  { top: "24%", right: "18%", size: 118, opacity: 0.2 },
  { top: "42%", left: "12%", size: 56, opacity: 0.14 },
  { top: "46%", right: "10%", size: 94, opacity: 0.18 },
  { top: "66%", left: "26%", size: 64, opacity: 0.12 },
];

const PROGRESS_DOTS = Array.from({ length: 6 });

export default function CourseConceptFinalScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const beamLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(beam, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(beam, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    shimmerLoop.start();
    beamLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      beamLoop.stop();
    };
  }, [beam, pulse, shimmer]);

  const beamScale = beam.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });
  const beamOpacity = beam.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.62],
  });
  const coreScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });
  const coreGlow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.36],
  });
  const shimmerShift = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 18],
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.screen} testID="course-concept-final-screen">
        <ImageBackground
          source={{ uri: HERO_IMAGE }}
          style={styles.hero}
          imageStyle={styles.heroImage}
          testID="course-concept-final-hero"
        >
          <LinearGradient
            colors={["rgba(8,10,18,0.18)", "rgba(7,10,18,0.52)", "rgba(7,10,18,0.86)", "#04060d"]}
            locations={[0, 0.34, 0.72, 1]}
            style={styles.overlay}
          >
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="戻る"
                accessibilityRole="button"
                onPress={() => router.back()}
                style={styles.backButton}
                testID="course-concept-final-back"
              >
                <Ionicons color="rgba(255,255,255,0.94)" name="arrow-back" size={18} />
              </Pressable>

              <View style={styles.progressRail}>
                {PROGRESS_DOTS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index < 2 ? styles.progressDotActive : null,
                      index === 2 ? styles.progressDotNext : null,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.scene}>
              <Animated.View
                style={[
                  styles.beam,
                  {
                    opacity: beamOpacity,
                    transform: [{ scaleY: beamScale }],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.beamCore,
                  {
                    opacity: beamOpacity,
                    transform: [{ scaleY: beamScale }],
                  },
                ]}
              />

              {GLOW_ORBS.map((orb, index) => (
                <View
                  key={index}
                  style={[
                    styles.orb,
                    {
                      top: orb.top as never,
                      left: orb.left as never,
                      right: orb.right as never,
                      width: orb.size,
                      height: orb.size,
                      borderRadius: orb.size / 2,
                      opacity: orb.opacity,
                    },
                  ]}
                />
              ))}

              <Animated.View
                style={[
                  styles.surfaceGlow,
                  {
                    transform: [{ translateX: shimmerShift }],
                  },
                ]}
              />

              <View style={styles.gatewayZone}>
                <Animated.View
                  style={[
                    styles.gatewayHalo,
                    {
                      opacity: coreGlow,
                      transform: [{ scale: coreScale }],
                    },
                  ]}
                />

                <Pressable accessibilityRole="button" style={styles.gatewayButton}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.26)", "rgba(180,211,255,0.18)", "rgba(12,16,28,0.72)"]}
                    locations={[0, 0.32, 1]}
                    style={styles.gatewayGlass}
                  >
                    <View style={styles.gatewayCore}>
                      <Ionicons color="#fbfaff" name="arrow-forward" size={26} />
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>

              <View style={styles.floorWrap}>
                <LinearGradient
                  colors={["rgba(170,214,255,0)", "rgba(170,214,255,0.12)", "rgba(255,210,237,0.22)"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.floorGlow}
                />
                <View style={styles.floorGlass} />
                <View style={styles.floorRippleLarge} />
                <View style={styles.floorRippleMedium} />
                <View style={styles.floorRippleSmall} />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#04060d",
  },
  hero: {
    flex: 1,
    backgroundColor: "#04060d",
  },
  heroImage: {
    opacity: 0.52,
  },
  overlay: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 18,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  progressRail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotActive: {
    backgroundColor: "rgba(255,204,232,0.96)",
    shadowColor: "#ffcae6",
    shadowOpacity: 0.48,
    shadowRadius: 10,
  },
  progressDotNext: {
    backgroundColor: "rgba(182,210,255,0.7)",
  },
  scene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  beam: {
    position: "absolute",
    top: "10%",
    width: 150,
    height: "58%",
    borderRadius: 999,
    backgroundColor: "rgba(187,220,255,0.28)",
  },
  beamCore: {
    position: "absolute",
    top: "8%",
    width: 32,
    height: "66%",
    borderRadius: 999,
    backgroundColor: "rgba(239,248,255,0.5)",
  },
  orb: {
    position: "absolute",
    backgroundColor: "rgba(255,245,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  surfaceGlow: {
    position: "absolute",
    bottom: 140,
    width: "120%",
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(190,214,255,0.08)",
  },
  gatewayZone: {
    position: "absolute",
    bottom: 162,
    alignItems: "center",
    justifyContent: "center",
  },
  gatewayHalo: {
    position: "absolute",
    width: 170,
    height: 96,
    borderRadius: 999,
    backgroundColor: "rgba(238,244,255,0.28)",
  },
  gatewayButton: {
    width: 176,
    height: 88,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  gatewayGlass: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gatewayCore: {
    width: 66,
    height: 66,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  floorWrap: {
    position: "absolute",
    left: -36,
    right: -36,
    bottom: -12,
    height: 220,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  floorGlow: {
    position: "absolute",
    inset: 0,
  },
  floorGlass: {
    position: "absolute",
    bottom: 22,
    width: "112%",
    height: 120,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  floorRippleLarge: {
    position: "absolute",
    bottom: 68,
    width: "88%",
    height: 88,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,212,236,0.18)",
  },
  floorRippleMedium: {
    position: "absolute",
    bottom: 40,
    width: "68%",
    height: 62,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(184,213,255,0.2)",
  },
  floorRippleSmall: {
    position: "absolute",
    bottom: 22,
    width: "42%",
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
});
