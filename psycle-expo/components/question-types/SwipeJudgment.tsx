import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hapticFeedback } from "../../lib/haptics";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import {
  hasHorizontalSwipeIntent,
  resolveSwipeJudgmentDirection,
} from "./swipeJudgmentGesture";

export function SwipeJudgment({
  statement,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSwipe,
  onDragStart,
  onDragEnd,
  labels,
}: {
  statement: string;
  selectedAnswer: "left" | "right" | null;
  correctAnswer: string;
  showResult: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  labels?: { left: string; right: string };
}) {
  const pan = useState(new Animated.ValueXY())[0];
  const scale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const isDraggingRef = useRef(false);
  const handlersRef = useRef({ onDragEnd, onDragStart, onSwipe, showResult });
  handlersRef.current = { onDragEnd, onDragStart, onSwipe, showResult };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, scale]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  const beginDrag = useCallback(() => {
    if (isDraggingRef.current) return;
    isDraggingRef.current = true;
    handlersRef.current.onDragStart?.();
  }, []);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    handlersRef.current.onDragEnd?.();
  }, []);

  const resetMotion = useCallback(() => {
    pan.stopAnimation();
    pan.setValue({ x: 0, y: 0 });
    Animated.spring(scale, {
      toValue: 1,
      speed: 30,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, [pan, scale]);

  const commitSwipe = useCallback(
    (direction: "left" | "right") => {
      if (handlersRef.current.showResult) return;
      resetMotion();
      endDrag();
      void hapticFeedback.medium();
      handlersRef.current.onSwipe(direction);
    },
    [endDrag, resetMotion]
  );

  useEffect(() => {
    if (!showResult) return;
    resetMotion();
    endDrag();
  }, [endDrag, resetMotion, showResult]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      !handlersRef.current.showResult && hasHorizontalSwipeIntent(gestureState),
    onMoveShouldSetPanResponderCapture: (_, gestureState) =>
      !handlersRef.current.showResult && hasHorizontalSwipeIntent(gestureState),
    onPanResponderGrant: () => {
      beginDrag();
      Animated.spring(scale, {
        toValue: 0.9,
        speed: 50,
        bounciness: 10,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (_, gestureState) => {
      pan.x.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      const direction = resolveSwipeJudgmentDirection(gestureState);
      if (direction) {
        commitSwipe(direction);
        return;
      }
      resetMotion();
      endDrag();
    },
    onPanResponderTerminate: () => {
      resetMotion();
      endDrag();
    },
    onPanResponderTerminationRequest: () => false,
  }), [beginDrag, commitSwipe, endDrag, pan.x, resetMotion, scale]);

  const isCorrect = selectedAnswer === correctAnswer;
  const leftLabel = labels?.left || i18n.t("questionTypes.swipeLeftFallback");
  const rightLabel = labels?.right || i18n.t("questionTypes.swipeRightFallback");
  const selectedLabel = selectedAnswer === "left" ? leftLabel : rightLabel;

  return (
    <View style={styles.swipeContainer}>
      {showResult && selectedAnswer ? (
        <View
          style={[
            styles.selectedAnswerSummary,
            isCorrect
              ? styles.selectedAnswerCorrect
              : styles.selectedAnswerIncorrect,
          ]}
          testID="swipe-selected-answer"
        >
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "close-circle"}
            size={24}
            color={isCorrect ? theme.colors.success : theme.colors.error}
          />
          <Text style={styles.selectedAnswerText}>
            {i18n.t("questionTypes.swipeYourAnswer", { answer: selectedLabel })}
          </Text>
        </View>
      ) : (
        <View style={styles.swipeLabels}>
          <Pressable
            accessibilityLabel={`${leftLabel}を選ぶ`}
            accessibilityRole="button"
            disabled={showResult}
            onPress={() => commitSwipe("left")}
            style={({ pressed }) => [styles.swipeTarget, pressed && styles.swipeTargetPressed]}
            testID="answer-swipe-left"
          >
            <Text style={styles.swipeLabel}>← {leftLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${rightLabel}を選ぶ`}
            accessibilityRole="button"
            disabled={showResult}
            onPress={() => commitSwipe("right")}
            style={({ pressed }) => [styles.swipeTarget, pressed && styles.swipeTargetPressed]}
            testID="answer-swipe-right"
          >
            <Text style={styles.swipeLabel}>{rightLabel} →</Text>
          </Pressable>
        </View>
      )}

      <Animated.View
        testID="answer-swipe-card"
        style={[
          styles.swipeCard,
          {
            transform: [{ translateX: pan.x }, { translateY }, { rotate }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.iconRow}>
          <Ionicons name="arrow-back" size={24} color="#cbd5e1" />
          <Ionicons name="swap-horizontal" size={24} color="#cbd5e1" />
          <Ionicons name="arrow-forward" size={24} color="#cbd5e1" />
        </View>
        <Text style={styles.swipeStatement}>{statement}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  swipeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 24,
    width: 260,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  swipeContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  selectedAnswerCorrect: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: theme.colors.success,
  },
  selectedAnswerIncorrect: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderColor: theme.colors.error,
  },
  selectedAnswerSummary: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    width: "100%",
  },
  selectedAnswerText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  swipeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  swipeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  swipeTarget: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  swipeTargetPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  swipeStatement: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
});
