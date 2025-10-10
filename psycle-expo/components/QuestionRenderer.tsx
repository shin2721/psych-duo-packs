import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

export interface Question {
  type: "multiple_choice" | "true_false" | "fill_blank" | "scenario";
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  source_id: string;
  difficulty: string;
  xp: number;
}

interface Props {
  question: Question;
  onAnswer: (isCorrect: boolean, xp: number) => void;
}

export function QuestionRenderer({ question, onAnswer }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;

    setSelectedIndex(index);
    setShowResult(true);

    const isCorrect = index === question.correct_index;

    setTimeout(() => {
      onAnswer(isCorrect, isCorrect ? question.xp : 0);
    }, 1500);
  };

  const isCorrect = selectedIndex === question.correct_index;

  return (
    <View style={styles.container}>
      {/* 難易度バッジ */}
      <View style={styles.difficultyBadge}>
        <Text style={styles.difficultyText}>
          {question.difficulty === "easy" ? "初級" : question.difficulty === "medium" ? "中級" : "上級"}
        </Text>
        <Text style={styles.xpText}>{question.xp} XP</Text>
      </View>

      {/* 問題文 */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* タイプ別レンダリング */}
      {question.type === "multiple_choice" && (
        <MultipleChoice
          choices={question.choices}
          selectedIndex={selectedIndex}
          correctIndex={question.correct_index}
          showResult={showResult}
          onSelect={handleSelect}
        />
      )}

      {question.type === "true_false" && (
        <TrueFalse
          choices={question.choices}
          selectedIndex={selectedIndex}
          correctIndex={question.correct_index}
          showResult={showResult}
          onSelect={handleSelect}
        />
      )}

      {question.type === "fill_blank" && (
        <FillBlank
          choices={question.choices}
          selectedIndex={selectedIndex}
          correctIndex={question.correct_index}
          showResult={showResult}
          onSelect={handleSelect}
        />
      )}

      {question.type === "scenario" && (
        <Scenario
          choices={question.choices}
          selectedIndex={selectedIndex}
          correctIndex={question.correct_index}
          showResult={showResult}
          onSelect={handleSelect}
        />
      )}

      {/* 結果表示 */}
      {showResult && (
        <View style={[styles.resultBox, isCorrect ? styles.correctBox : styles.incorrectBox]}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={isCorrect ? "checkmark-circle" : "close-circle"}
              size={32}
              color={isCorrect ? theme.colors.success : theme.colors.error}
            />
            <Text style={[styles.resultTitle, isCorrect ? styles.correctText : styles.incorrectText]}>
              {isCorrect ? "正解！" : "残念..."}
            </Text>
          </View>
          <Text style={styles.explanation}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

// 4択MCQ
function MultipleChoice({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.choiceButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
            {shouldShowCorrect && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            )}
            {shouldShowIncorrect && (
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// 正誤判定
function TrueFalse({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.trueFalseContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.tfButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Ionicons
              name={choice === "本当" ? "checkmark-circle-outline" : "close-circle-outline"}
              size={48}
              color={isSelected ? "#fff" : theme.colors.primary}
            />
            <Text style={[styles.tfText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// 穴埋め
function FillBlank({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.fillBlankButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// シナリオ
function Scenario({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.scenarioContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.scenarioButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <View style={styles.scenarioIcon}>
              <Ionicons name="bulb-outline" size={24} color={isSelected ? "#fff" : theme.colors.primary} />
            </View>
            <Text style={[styles.scenarioText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  difficultyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 24,
    lineHeight: 28,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedChoice: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  incorrectChoice: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  choiceText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  selectedChoiceText: {
    color: "#fff",
  },
  trueFalseContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginVertical: 32,
  },
  tfButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  tfText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  fillBlankButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
  },
  scenarioContainer: {
    gap: 12,
  },
  scenarioButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scenarioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  resultBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
  },
  correctBox: {
    backgroundColor: "#e8f5e9",
  },
  incorrectBox: {
    backgroundColor: "#ffebee",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  correctText: {
    color: theme.colors.success,
  },
  incorrectText: {
    color: theme.colors.error,
  },
  explanation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
