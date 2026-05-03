import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hapticFeedback } from "../../lib/haptics";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";

export function SwipeJudgment({
  statement,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSwipe,
  labels,
}: {
  statement: string;
  selectedAnswer: "left" | "right" | null;
  correctAnswer: string;
  showResult: boolean;
  onSwipe: (direction: "left" | "right") => void;
  labels?: { left: string; right: string };
}) {
  const pan = useState(new Animated.ValueXY())[0];
  const scale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !showResult,
    onPanResponderGrant: () => {
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
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 20,
        useNativeDriver: true,
      }).start();

      if (showResult) return;

      const threshold = 10;
      if (Math.abs(gestureState.dx) > threshold) {
        const direction = gestureState.dx > 0 ? "right" : "left";
        void hapticFeedback.medium();
        onSwipe(direction);
        Animated.spring(pan, {
          toValue: { x: gestureState.dx > 0 ? 300 : -300, y: 0 },
          useNativeDriver: true,
          speed: 20,
        }).start();
        return;
      }

      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
    },
  });

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeLabels}>
        <Text style={styles.swipeLabel}>
          ← {labels?.left || i18n.t("questionTypes.swipeLeftFallback")}
        </Text>
        <Text style={styles.swipeLabel}>
          {labels?.right || i18n.t("questionTypes.swipeRightFallback")} →
        </Text>
      </View>

      <Animated.View
        testID="answer-swipe-card"
        style={[
          styles.swipeCard,
          showResult && isCorrect && styles.swipeCorrect,
          showResult && !isCorrect && styles.swipeIncorrect,
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
        {selectedAnswer && (
          <View style={styles.answerIcon}>
            {isCorrect ? (
              <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
            ) : (
              <Ionicons name="close-circle" size={40} color="#ef4444" />
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  answerIcon: {
    position: "absolute",
    top: -40,
  },
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
  swipeCorrect: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  swipeIncorrect: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
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
  swipeStatement: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
});
