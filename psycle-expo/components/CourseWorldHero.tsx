import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  CLOCK_FIREFLY_CONFIGS,
  CourseWorldBackdrop,
  Fireflies,
  HERO_FIREFLY_CONFIGS,
  HeroRing,
} from "./course-world/CourseWorldBackdrop";
import { CourseWorldClockDial } from "./course-world/CourseWorldClock";
import { CourseWorldNodeColumn } from "./course-world/CourseWorldNodeColumn";
import {
  buildCourseWorldModelSnapshot,
  COURSE_WORLD_CLOCK_RADIUS,
} from "./course-world/courseWorldModel";
import { useCourseWorldScroll } from "./course-world/useCourseWorldScroll";
import type { CourseWorldViewModel } from "../lib/courseWorld";

interface Props {
  model: CourseWorldViewModel;
  nextLessonId?: string;
  onNodePress?: (nodeId: string) => void;
  onPrimaryPress: () => void;
  onSupportPress?: () => void;
  onUnitPress?: () => void;
  primaryTestID?: string;
  supportTestID?: string;
  testID?: string;
  showMeta?: boolean;
  showPrimaryAction?: boolean;
  hideVisibleCopy?: boolean;
  heroOffsetY?: number;
  habitSummary?: {
    dailyGoal: number;
    dailyXP: number;
    streak: number;
  };
}

const CLOCK_ZONE = COURSE_WORLD_CLOCK_RADIUS * 3 + 130 + 60;

export function CourseWorldHero({
  model,
  nextLessonId,
  onNodePress,
  onPrimaryPress,
  onSupportPress,
  onUnitPress,
  primaryTestID = "course-world-primary",
  supportTestID = "course-world-support",
  testID = "course-world-hero",
  showMeta = true,
  showPrimaryAction = true,
  hideVisibleCopy = false,
  heroOffsetY = 0,
  habitSummary,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const snapshot = useMemo(
    () => buildCourseWorldModelSnapshot(model, nextLessonId),
    [model, nextLessonId]
  );
  const reservesActionSpace = !hideVisibleCopy || showPrimaryAction;
  const interactionZoneHeight = reservesActionSpace
    ? Math.max(260, Math.min(CLOCK_ZONE, height * 0.28))
    : Math.max(280, Math.min(CLOCK_ZONE, height * 0.34));
  const mountOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [mountOpacity]);

  const {
    svRotOffset,
    svCurrentIdx,
    svNodeCount,
    clockOpacity,
    clockScale,
    headerOpacity,
    heroOpacity,
    heroScale,
    panHandlers,
    tapScale,
    topNodeIdx,
  } = useCourseWorldScroll({
    width,
    currentIdx: snapshot.currentIdx,
    allNodes: snapshot.allNodes,
    onNodePress,
    onPrimaryPress,
  });

  return (
    <View style={[styles.root, { width }]} testID={testID}>
      <CourseWorldBackdrop themeColor={model.themeColor} synColor={snapshot.synColor} />

      <Animated.View style={styles.mountLayer}>
        <View style={reservesActionSpace ? styles.spacerTopCompact : styles.spacerTop} />

        <Animated.View
          style={[
            styles.header,
            hideVisibleCopy ? styles.headerIconOnly : null,
            { opacity: headerOpacity, paddingTop: insets.top },
          ]}
        >
          <Pressable
            style={[
              styles.unitBadge,
              hideVisibleCopy ? [
                styles.unitBadgeIconOnly,
                { borderColor: `${model.themeColor}33`, backgroundColor: `${model.themeColor}12` },
              ] : null,
            ]}
            onPress={onUnitPress}
            accessibilityRole="button"
            accessibilityLabel="ユニット選択"
          >
            <View
              style={[
                styles.unitDot,
                { backgroundColor: model.themeColor, shadowColor: model.themeColor },
              ]}
            />
            {hideVisibleCopy ? null : <Text style={styles.unitText}>{model.unitLabel}</Text>}
            <Ionicons color="rgba(255,255,255,0.35)" name="chevron-down" size={14} />
          </Pressable>
        </Animated.View>

        <View
          style={[
            styles.interactionZone,
            { width, height: interactionZoneHeight, marginTop: heroOffsetY },
          ]}
          {...panHandlers}
        >
          <Animated.View
            style={[styles.heroContainer, { zIndex: 15, opacity: heroOpacity }]}
            pointerEvents="none"
          >
            <Fireflies
              themeColor={model.themeColor}
              synColor={snapshot.synColor}
              configs={HERO_FIREFLY_CONFIGS}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroContainer,
              {
                transform: [{ scale: Animated.multiply(heroScale, tapScale) }],
                opacity: heroOpacity,
              },
            ]}
          >
            <Pressable
              testID="hero-root-orb"
              accessibilityRole="button"
              accessibilityLabel={model.currentLesson.accessibilityLabel}
              onPress={() => onNodePress?.(model.currentLesson.id)}
              style={styles.heroOrbPressable}
            >
              <HeroRing
                progress={snapshot.progress}
                themeColor={model.themeColor}
                synColor={snapshot.synColor}
                icon={model.currentLesson.icon}
              />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.clockContainer,
              {
                width: CLOCK_ZONE,
                height: CLOCK_ZONE,
                opacity: clockOpacity,
                transform: [{ scale: clockScale }],
              },
            ]}
          >
            <CourseWorldClockDial
              clockItems={snapshot.clockItems}
              rotOffset={svRotOffset}
              svCurrentIdx={svCurrentIdx}
              svNodeCount={svNodeCount}
              topNodeIdx={topNodeIdx}
              nextLessonIdx={snapshot.nextLessonIdx}
              themeColor={model.themeColor}
              synColor={snapshot.synColor}
              renderNextLessonEffects={() => (
                <Fireflies
                  themeColor={model.themeColor}
                  synColor={snapshot.synColor}
                  configs={CLOCK_FIREFLY_CONFIGS}
                />
              )}
            />
          </Animated.View>
        </View>

        <CourseWorldNodeColumn
          model={model}
          allNodes={snapshot.allNodes}
          themeColor={model.themeColor}
          primaryTestID={primaryTestID}
          supportTestID={supportTestID}
          onPrimaryPress={onPrimaryPress}
          onSupportPress={onSupportPress}
          onNodePress={onNodePress}
          showMeta={showMeta}
          showPrimaryAction={showPrimaryAction}
          hideVisibleCopy={hideVisibleCopy}
          habitSummary={habitSummary}
        />

        <View style={reservesActionSpace ? styles.spacerBottomCompact : styles.spacerBottom} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "visible" as const },
  mountLayer: { flex: 1 },
  spacerTop: { flex: 0.38 },
  spacerTopCompact: { height: 28 },
  spacerBottom: { flex: 0.2 },
  spacerBottomCompact: { height: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    height: 52,
  },
  headerIconOnly: {
    height: 64,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  unitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  unitBadgeIconOnly: {
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  unitDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  unitText: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
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
  heroOrbPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  clockContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible" as const,
  },
});
