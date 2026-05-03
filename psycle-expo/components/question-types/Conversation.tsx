import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { theme } from "../../lib/theme";
import {
  getChoiceAccessibilityState,
  sharedQuestionTypeStyles,
} from "./shared";

export function Conversation({
  responsePrompt,
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  prompt: string;
  responsePrompt: string;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View>
      <Text style={styles.responsePrompt}>{responsePrompt}</Text>
      <View style={sharedQuestionTypeStyles.choicesContainer}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const hasRecommendation = typeof correctIndex === "number";
          const isCorrect = hasRecommendation && index === correctIndex;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && hasRecommendation && isSelected && !isCorrect;

          return (
            <AnimatedButton
              key={index}
              style={[
                styles.choice,
                isSelected && sharedQuestionTypeStyles.selectedChoice,
                shouldShowCorrect && sharedQuestionTypeStyles.correctChoice,
                shouldShowIncorrect && sharedQuestionTypeStyles.incorrectChoice,
              ]}
              onPress={() => onSelect(index)}
              disabled={showResult}
              testID={`answer-choice-${index}`}
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
            >
              <Text style={sharedQuestionTypeStyles.choiceText}>{choice}</Text>
              {shouldShowCorrect && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              )}
              {shouldShowIncorrect && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    ...sharedQuestionTypeStyles.choiceButton,
  },
  responsePrompt: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
});
