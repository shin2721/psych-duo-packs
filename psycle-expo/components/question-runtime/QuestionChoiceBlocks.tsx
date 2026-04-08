import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { theme } from "../../lib/theme";
import { getChoiceAccessibilityState } from "../question-types/shared";
import type { QuestionInteractionProps } from "./QuestionInteraction.shared";

export function QuestionChoiceBlocks({
  onSelect,
  question,
  questionChoices,
  selectedIndex,
  showResult,
}: Pick<
  QuestionInteractionProps,
  "onSelect" | "question" | "questionChoices" | "selectedIndex" | "showResult"
>) {
  if (question.type === "multiple_choice") {
    return (
      <MultipleChoice
        choices={questionChoices}
        selectedIndex={selectedIndex}
        correctIndex={question.correct_index ?? null}
        showResult={showResult}
        onSelect={onSelect}
      />
    );
  }

  if (question.type === "true_false") {
    return (
      <TrueFalse
        choices={questionChoices}
        selectedIndex={selectedIndex}
        correctIndex={question.correct_index}
        showResult={showResult}
        onSelect={onSelect}
      />
    );
  }

  if (question.type === "fill_blank") {
    return (
      <FillBlank
        choices={questionChoices}
        selectedIndex={selectedIndex}
        correctIndex={question.correct_index}
        showResult={showResult}
        onSelect={onSelect}
      />
    );
  }

  return null;
}

function MultipleChoice({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        let borderColor: string | undefined;
        let bg: string | undefined;
        let showCheck = false;
        let showCross = false;

        if (showResult) {
          if (index === correctIndex) {
            borderColor = "rgba(34, 197, 94, 0.8)";
            bg = "rgba(34, 197, 94, 0.15)";
            showCheck = true;
          } else if (isSelected) {
            borderColor = "rgba(239, 68, 68, 0.8)";
            bg = "rgba(239, 68, 68, 0.15)";
            showCross = true;
          }
        } else if (isSelected) {
          borderColor = theme.colors.primary;
          bg = "rgba(6, 182, 212, 0.15)";
        }

        return (
          <AnimatedButton
            key={index}
            style={[
              styles.choiceButton,
              bg && { backgroundColor: bg },
              borderColor && { borderColor },
              showResult && !isSelected && index !== correctIndex && { opacity: 0.6 },
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
            testID={`answer-choice-${index}`}
            accessibilityRole="button"
            accessibilityLabel={choice}
            accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
          >
            <Text
              style={[
                styles.choiceText,
                (isSelected || showCheck || showCross) && { fontWeight: "bold" },
              ]}
            >
              {choice}
            </Text>
            {showCheck ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            ) : null}
            {showCross ? <Ionicons name="close-circle" size={24} color={theme.colors.error} /> : null}
          </AnimatedButton>
        );
      })}
    </View>
  );
}

function TrueFalse({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex?: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      <View style={styles.trueFalseRow}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = typeof correctIndex === "number" && index === correctIndex;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && isSelected && !isCorrect;

          return (
            <AnimatedButton
              key={index}
              style={[
                styles.tfButton,
                isSelected && styles.selectedChoice,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
              ]}
              onPress={() => onSelect(index)}
              disabled={showResult}
              testID={`answer-choice-${index}`}
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
            >
              <Text
                style={[
                  styles.choiceText,
                  styles.tfButtonText,
                  (isSelected || shouldShowCorrect || shouldShowIncorrect) && styles.selectedChoiceText,
                ]}
              >
                {choice}
              </Text>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

function FillBlank({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex?: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = typeof correctIndex === "number" && index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <AnimatedButton
            key={index}
            style={[
              styles.fillBlankButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
            testID={`answer-choice-${index}`}
            accessibilityRole="button"
            accessibilityLabel={choice}
            accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
          >
            <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>{choice}</Text>
          </AnimatedButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  choiceButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  choiceText: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  fillBlankButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  selectedChoice: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  selectedChoiceText: {
    color: "#fff",
  },
  tfButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tfButtonText: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
  trueFalseRow: {
    flexDirection: "row",
    gap: 12,
    height: 180,
  },
});
