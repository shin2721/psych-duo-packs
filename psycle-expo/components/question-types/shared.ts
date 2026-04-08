import { StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

export const getChoiceAccessibilityState = (isSelected: boolean, disabled: boolean) => ({
  selected: isSelected,
  disabled,
});

export const sharedQuestionTypeStyles = StyleSheet.create({
  choiceButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceText: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  choiceTextWhite: {
    color: "#fff",
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
  fillBlankChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fillBlankContainer: {
    gap: 16,
  },
  fillBlankPrompt: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  fillBlankStatement: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 30,
    marginBottom: 8,
  },
  fillBlankText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  selectedChoice: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
