import React from "react";
import { Text, View } from "react-native";
import { AnimatedButton } from "../AnimatedButton";
import {
  getChoiceAccessibilityState,
  sharedQuestionTypeStyles,
} from "./shared";
import i18n from "../../lib/i18n";

export function FillBlankTap({
  statement,
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  statement?: string;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={sharedQuestionTypeStyles.fillBlankContainer}>
      {statement && (
        <Text style={sharedQuestionTypeStyles.fillBlankStatement}>
          {statement}
        </Text>
      )}
      <Text style={sharedQuestionTypeStyles.fillBlankPrompt}>
        {i18n.t("questionTypes.fillBlankTapPrompt")}
      </Text>
      <View style={sharedQuestionTypeStyles.fillBlankChoices}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && isSelected && !isCorrect;

          return (
            <AnimatedButton
              key={index}
              style={[
                sharedQuestionTypeStyles.fillBlankButton,
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
              <Text style={sharedQuestionTypeStyles.fillBlankText}>{choice}</Text>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}
