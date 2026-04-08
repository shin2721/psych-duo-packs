import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";

const getChoiceAccessibilityState = (isSelected: boolean, disabled: boolean) => ({
  selected: isSelected,
  disabled,
});

export function Matching({
  leftItems,
  rightItems,
  selectedPairs,
  correctPairs,
  showResult,
  onMatch,
}: {
  leftItems: string[];
  rightItems: string[];
  selectedPairs: number[][];
  correctPairs: number[][];
  showResult: boolean;
  onMatch: (pairs: number[][]) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [currentIncorrectLeft, setCurrentIncorrectLeft] = useState<number | null>(null);
  const [currentIncorrectRight, setCurrentIncorrectRight] = useState<number | null>(null);

  const tryPair = (leftIndex: number, rightIndex: number) => {
    const isCorrect = correctPairs.some(([l, r]) => l === leftIndex && r === rightIndex);

    if (isCorrect) {
      const newPairs = [...selectedPairs, [leftIndex, rightIndex]];
      onMatch(newPairs);
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
      return;
    }

    setCurrentIncorrectLeft(leftIndex);
    setCurrentIncorrectRight(rightIndex);
    setTimeout(() => {
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
    }, 800);
  };

  const handleLeftPress = (index: number) => {
    if (selectedPairs.some(([l]) => l === index)) return;
    if (selectedRight !== null) {
      tryPair(index, selectedRight);
      setSelectedRight(null);
    } else {
      setSelectedLeft(index);
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
    }
  };

  const handleRightPress = (index: number) => {
    if (selectedPairs.some(([, r]) => r === index)) return;
    if (selectedLeft !== null) {
      tryPair(selectedLeft, index);
      setSelectedLeft(null);
    } else {
      setSelectedRight(index);
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
    }
  };

  return (
    <View style={styles.matchingContainer}>
      <Text style={styles.matchingHint}>{i18n.t("questionTypes.matchingHint")}</Text>
      <View style={styles.matchingColumns}>
        <View style={styles.matchingColumn}>
          {leftItems.map((item, index) => {
            const isMatched = selectedPairs.some(([l]) => l === index);
            const isCurrentIncorrect = currentIncorrectLeft === index;
            return (
              <AnimatedButton
                key={index}
                style={[
                  styles.matchingItem,
                  selectedLeft === index && styles.matchingItemSelected,
                  isMatched && styles.correctChoice,
                  isCurrentIncorrect && styles.incorrectChoice,
                ]}
                onPress={() => handleLeftPress(index)}
                disabled={isMatched}
                accessibilityRole="button"
                accessibilityLabel={item}
                accessibilityState={getChoiceAccessibilityState(selectedLeft === index, isMatched)}
              >
                <Text style={styles.matchingItemText}>{item}</Text>
                {isMatched && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                )}
                {isCurrentIncorrect && (
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                )}
              </AnimatedButton>
            );
          })}
        </View>
        <View style={styles.matchingColumn}>
          {rightItems.map((item, index) => {
            const matchedLeft = selectedPairs.find(([, r]) => r === index)?.[0];
            const isMatched = matchedLeft !== undefined;
            const isCurrentIncorrect = currentIncorrectRight === index;
            return (
              <AnimatedButton
                key={index}
                style={[
                  styles.matchingItem,
                  selectedRight === index && styles.matchingItemSelected,
                  isMatched && styles.correctChoice,
                  isCurrentIncorrect && styles.incorrectChoice,
                ]}
                onPress={() => handleRightPress(index)}
                disabled={isMatched}
                accessibilityRole="button"
                accessibilityLabel={item}
                accessibilityState={getChoiceAccessibilityState(selectedRight === index, isMatched)}
              >
                <Text style={styles.matchingItemText}>{item}</Text>
                {isMatched && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                )}
                {isCurrentIncorrect && (
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                )}
              </AnimatedButton>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  matchingColumn: {
    flex: 1,
    gap: 12,
  },
  matchingColumns: {
    flexDirection: "row",
    gap: 16,
  },
  matchingContainer: {
    gap: 16,
  },
  matchingHint: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  matchingItem: {
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 60,
    padding: 12,
  },
  matchingItemSelected: {
    backgroundColor: "rgba(34, 211, 238, 0.3)",
    borderColor: "#22d3ee",
  },
  matchingItemText: {
    color: "#fff",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
