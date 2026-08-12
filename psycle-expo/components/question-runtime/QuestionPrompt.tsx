import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { QuestionAudio, QuestionImage } from "../QuestionMedia";
import type { Question } from "../../types/question";

// 設問を「前提」と「問い」に分けて描く。空行区切りの最後の段落を問いとみなす。
// 全文を24px太字で並べると前提と問いが同じ重さになり、3行を超えた時点で
// 目が滑る。前提は軽く、問いだけを重くする。
function splitSetupAndAsk(text: string): { setup: string | null; ask: string } {
  const paragraphs = text.split("\n\n").filter((part) => part.trim().length > 0);
  if (paragraphs.length < 2) {
    return { setup: null, ask: text };
  }
  return {
    setup: paragraphs.slice(0, -1).join("\n\n"),
    ask: paragraphs[paragraphs.length - 1],
  };
}

export function QuestionPrompt({
  question,
  questionText,
}: {
  question: Question;
  questionText: string;
}) {
  const { setup, ask } = splitSetupAndAsk(questionText);

  return (
    <>
      {question.image ? <QuestionImage uri={question.image} caption={question.imageCaption} /> : null}
      {question.audio ? <QuestionAudio uri={question.audio} /> : null}

      {question.type === "swipe_judgment" ? null : question.type === "conversation" ? (
        <View style={styles.conversationBubble}>
          <Text style={styles.conversationBubbleText} testID="question-text">
            {questionText}
          </Text>
        </View>
      ) : (
        <View style={styles.promptBlock} testID="question-text">
          {setup ? <Text style={styles.setupText}>{setup}</Text> : null}
          <Text style={styles.askText}>{ask}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  askText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 33,
    textAlign: "left",
  },
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
  promptBlock: {
    marginBottom: 28,
  },
  setupText: {
    color: "#a8b3c5",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 26,
    marginBottom: 14,
  },
});
