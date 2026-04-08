import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { theme } from "../../lib/theme";
import {
  getChoiceAccessibilityState,
  sharedQuestionTypeStyles,
} from "./shared";

export function SelectAll({
  choices,
  selectedIndexes,
  correctAnswers,
  showResult,
  onToggle,
  revealedIndexes = [],
}: {
  choices: string[];
  selectedIndexes: number[];
  correctAnswers?: number[];
  showResult: boolean;
  onToggle: (index: number) => void;
  revealedIndexes?: number[];
}) {
  const isSurvey = !correctAnswers;

  return (
    <View style={sharedQuestionTypeStyles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndexes.includes(index);
        const isCorrect = correctAnswers?.includes(index) ?? false;
        const isRevealed = revealedIndexes.includes(index);

        const shouldShowCorrect = isSurvey
          ? isSelected
          : isCorrect && (isSelected || showResult);
        const shouldShowIncorrect = isSurvey
          ? false
          : !isCorrect && (isRevealed || showResult);

        return (
          <AnimatedButton
            key={index}
            style={[
              sharedQuestionTypeStyles.choiceButton,
              shouldShowCorrect && sharedQuestionTypeStyles.correctChoice,
              shouldShowIncorrect && sharedQuestionTypeStyles.incorrectChoice,
              isSurvey &&
                isSelected && {
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: theme.colors.primary,
                },
            ]}
            onPress={() => onToggle(index)}
            disabled={showResult && !isSurvey}
            testID={`answer-choice-${index}`}
            accessibilityRole="button"
            accessibilityLabel={choice}
            accessibilityState={getChoiceAccessibilityState(
              isSelected,
              showResult && !isSurvey
            )}
          >
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  shouldShowCorrect && styles.checkboxCorrect,
                  shouldShowIncorrect && styles.checkboxIncorrect,
                  isSurvey &&
                    isSelected && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                ]}
              >
                {shouldShowCorrect && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
                {shouldShowIncorrect && (
                  <Ionicons name="close" size={20} color="#fff" />
                )}
              </View>
            </View>
            <Text
              style={[
                sharedQuestionTypeStyles.choiceText,
                (shouldShowCorrect || shouldShowIncorrect) &&
                  sharedQuestionTypeStyles.choiceTextWhite,
              ]}
            >
              {choice}
            </Text>
          </AnimatedButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkboxCorrect: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkboxIncorrect: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
});
