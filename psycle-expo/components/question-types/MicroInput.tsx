import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedButton } from "../AnimatedButton";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import { sharedQuestionTypeStyles } from "./shared";

export function MicroInput({
  inputText,
  setInputText,
  placeholder,
  showResult,
  onSubmit,
}: {
  inputText: string;
  setInputText: (text: string) => void;
  placeholder: string;
  showResult: boolean;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>
          {i18n.t("questionTypes.microInputLabel")}
        </Text>
        <View style={styles.textInputContainer}>
          <Text style={styles.inputPrefix}>👉</Text>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            editable={!showResult}
            style={[
              styles.textInput,
              showResult && styles.textInputDisabled,
            ]}
            onSubmitEditing={() => {
              if (!showResult && inputText.trim()) {
                onSubmit();
              }
            }}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {!showResult && (
        <AnimatedButton
          style={[
            sharedQuestionTypeStyles.submitButton,
            !inputText.trim() && sharedQuestionTypeStyles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!inputText.trim()}
          testID="answer-choice-submit"
          accessibilityRole="button"
          accessibilityLabel={String(
            inputText.trim()
              ? i18n.t("questionTypes.microInputCheckAnswer")
              : i18n.t("questionTypes.microInputPleaseInput")
          )}
          accessibilityState={{ disabled: !inputText.trim() }}
        >
          <Text style={sharedQuestionTypeStyles.submitButtonText}>
            {inputText.trim()
              ? i18n.t("questionTypes.microInputCheckAnswer")
              : i18n.t("questionTypes.microInputPleaseInput")}
          </Text>
        </AnimatedButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputPrefix: {
    fontSize: 18,
    marginRight: 8,
  },
  inputWrapper: {
    gap: 8,
  },
  textInput: {
    color: "#fff",
    flex: 1,
    fontSize: 18,
    minHeight: 52,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  textInputDisabled: {
    opacity: 0.7,
  },
});
