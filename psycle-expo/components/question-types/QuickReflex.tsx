import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import {
  getChoiceAccessibilityState,
  sharedQuestionTypeStyles,
} from "./shared";

export function QuickReflex({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
  timeLimit = 2000,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
  timeLimit?: number;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    setTimeRemaining(timeLimit);
    setIsTimeUp(false);
  }, [timeLimit, choices, correctIndex]);

  useEffect(() => {
    if (showResult || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          setIsTimeUp(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [showResult, isTimeUp]);

  useEffect(() => {
    if (isTimeUp && !showResult) {
      onSelect(-1);
    }
  }, [isTimeUp, showResult, onSelect]);

  const progressPercent = (timeRemaining / timeLimit) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <View
            style={[
              styles.timerProgress,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent > 30 ? theme.colors.primary : "#e74c3c",
              },
            ]}
          />
        </View>
        <Text style={styles.timerText}>
          {isTimeUp
            ? i18n.t("questionTypes.timeUp")
            : i18n.t("questionTypes.timerSeconds", {
                seconds: (timeRemaining / 1000).toFixed(1),
              })}
        </Text>
      </View>

      <View style={sharedQuestionTypeStyles.choicesContainer}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && isSelected && !isCorrect;

          return (
            <AnimatedButton
              key={index}
              style={[
                sharedQuestionTypeStyles.choiceButton,
                shouldShowCorrect && sharedQuestionTypeStyles.correctChoice,
                shouldShowIncorrect && sharedQuestionTypeStyles.incorrectChoice,
                isTimeUp && !showResult && styles.disabledChoice,
              ]}
              onPress={() => !isTimeUp && onSelect(index)}
              disabled={showResult || isTimeUp}
              testID={`answer-choice-${index}`}
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(
                isSelected,
                showResult || isTimeUp
              )}
            >
              <Text
                style={[
                  sharedQuestionTypeStyles.choiceText,
                  (shouldShowCorrect || shouldShowIncorrect) &&
                    sharedQuestionTypeStyles.choiceTextWhite,
                ]}
              >
                {choice}
              </Text>
              {shouldShowCorrect && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
              {shouldShowIncorrect && (
                <Ionicons name="close-circle" size={24} color="#fff" />
              )}
            </AnimatedButton>
          );
        })}
      </View>

      {isTimeUp && !showResult && (
        <Text style={styles.timeUpMessage}>
          {i18n.t("questionTypes.timeUpMessage")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  disabledChoice: {
    opacity: 0.5,
  },
  timeUpMessage: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  timerBar: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  timerContainer: {
    gap: 8,
  },
  timerProgress: {
    borderRadius: 999,
    height: "100%",
  },
  timerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
