import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { QuestionAudio, QuestionImage } from "../QuestionMedia";
import type { Question } from "../../types/question";

export function QuestionPrompt({
  question,
  questionText,
}: {
  question: Question;
  questionText: string;
}) {
  return (
    <>
      {question.image ? <QuestionImage uri={question.image} caption={question.imageCaption} /> : null}
      {question.audio ? <QuestionAudio uri={question.audio} /> : null}

      {question.type === "conversation" ? (
        <View style={styles.conversationBubble}>
          <Text style={styles.conversationBubbleText} testID="question-text">
            {questionText}
          </Text>
        </View>
      ) : (
        <Text style={styles.questionText} testID="question-text">
          {questionText}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  conversationBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 24,
    padding: 20,
  },
  conversationBubbleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 30,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 32,
    lineHeight: 34,
    textAlign: "left",
  },
});
