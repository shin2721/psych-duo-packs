import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedButton } from "../AnimatedButton";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";

const getChoiceAccessibilityState = (isSelected: boolean, disabled: boolean) => ({
  selected: isSelected,
  disabled,
});

export function ConsequenceScenario({
  consequenceType,
  showResult,
  onSelect,
}: {
  question: string;
  consequenceType: "positive" | "negative";
  showResult: boolean;
  onSelect: (isPositive: boolean) => void;
}) {
  const [selected, setSelected] = useState<"positive" | "negative" | null>(null);

  const handlePress = (type: "positive" | "negative") => {
    if (showResult) return;
    setSelected(type);
    onSelect(type === "positive");
  };

  return (
    <View style={styles.consequenceContainer}>
      <Text style={styles.consequencePrompt}>{i18n.t("questionTypes.consequencePrompt")}</Text>
      <View style={styles.consequenceButtons}>
        <AnimatedButton
          style={[
            styles.consequenceButton,
            styles.neutralButton,
            selected === "positive" && styles.selectedPositive,
            showResult && consequenceType === "positive" && styles.correctChoice,
            showResult && selected === "positive" && consequenceType !== "positive" && styles.incorrectChoice,
            showResult && consequenceType !== "positive" && styles.disabledChoice,
          ]}
          onPress={() => handlePress("positive")}
          disabled={showResult}
          testID="answer-choice-positive"
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t("questionTypes.consequencePositive"))}
          accessibilityState={getChoiceAccessibilityState(selected === "positive", showResult)}
        >
          <Ionicons
            name="happy-outline"
            size={32}
            color={
              selected === "positive" || (showResult && consequenceType === "positive") ? "#fff" : "#cbd5e1"
            }
          />
          <Text
            style={[
              styles.consequenceButtonText,
              {
                color:
                  selected === "positive" || (showResult && consequenceType === "positive")
                    ? "#fff"
                    : "#cbd5e1",
              },
            ]}
          >
            {i18n.t("questionTypes.consequencePositive")}
          </Text>
        </AnimatedButton>

        <AnimatedButton
          style={[
            styles.consequenceButton,
            styles.neutralButton,
            selected === "negative" && styles.selectedNegative,
            showResult && consequenceType === "negative" && styles.correctChoice,
            showResult && selected === "negative" && consequenceType !== "negative" && styles.incorrectChoice,
            showResult && consequenceType !== "negative" && styles.disabledChoice,
          ]}
          onPress={() => handlePress("negative")}
          disabled={showResult}
          testID="answer-choice-negative"
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t("questionTypes.consequenceNegative"))}
          accessibilityState={getChoiceAccessibilityState(selected === "negative", showResult)}
        >
          <Ionicons
            name="sad-outline"
            size={32}
            color={
              selected === "negative" || (showResult && consequenceType === "negative") ? "#fff" : "#cbd5e1"
            }
          />
          <Text
            style={[
              styles.consequenceButtonText,
              {
                color:
                  selected === "negative" || (showResult && consequenceType === "negative")
                    ? "#fff"
                    : "#cbd5e1",
              },
            ]}
          >
            {i18n.t("questionTypes.consequenceNegative")}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  consequenceButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 2,
    elevation: 3,
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  consequenceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  consequenceButtons: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    width: "100%",
  },
  consequenceContainer: {
    alignItems: "center",
    width: "100%",
  },
  consequencePrompt: {
    color: theme.colors.sub,
    fontSize: 16,
    marginBottom: 24,
  },
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  disabledChoice: {
    opacity: 0.5,
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  neutralButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedNegative: {
    borderColor: "#991b1b",
    borderWidth: 4,
  },
  selectedPositive: {
    borderColor: "#166534",
    borderWidth: 4,
  },
});
