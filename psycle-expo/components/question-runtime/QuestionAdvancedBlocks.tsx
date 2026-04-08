import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Conversation } from "../question-types/Conversation";
import { ConsequenceScenario } from "../question-types/ConsequenceScenario";
import { FillBlankTap } from "../question-types/FillBlankTap";
import { Matching } from "../question-types/Matching";
import { MicroInput } from "../question-types/MicroInput";
import { QuickReflex } from "../question-types/QuickReflex";
import { SelectAll } from "../question-types/SelectAll";
import { SortOrder } from "../question-types/SortOrder";
import { SwipeJudgment } from "../question-types/SwipeJudgment";
import i18n from "../../lib/i18n";
import type { QuestionInteractionProps } from "./QuestionInteraction.shared";

function resolveCorrectOrder(question: QuestionInteractionProps["question"]): number[] {
  if (!question.items || !question.correct_order) return [];
  if (question.correct_order.length > 0 && typeof question.correct_order[0] === "string") {
    return (question.correct_order as string[]).map((item) => question.items!.indexOf(item));
  }
  return (question.correct_order as number[]) || [];
}

export function QuestionAdvancedBlocks(props: QuestionInteractionProps) {
  const {
    currentOrder,
    inputText,
    onDragEnd,
    onDragStart,
    onMatch,
    onReorder,
    onSelect,
    onSelectConsequence,
    onSelectResponse,
    onSetInputText,
    onSubmitTextInput,
    onSwipe,
    onToggle,
    question,
    questionChoices,
    questionText,
    revealedIndexes,
    selectedIndex,
    selectedIndexes,
    selectedPairs,
    selectedResponse,
    showResult,
    swipeDirection,
  } = props;

  if (question.type === "quick_reflex") {
    return (
      <QuickReflex
        choices={questionChoices}
        selectedIndex={selectedIndex}
        correctIndex={question.correct_index ?? 0}
        showResult={showResult}
        onSelect={onSelect}
        timeLimit={question.time_limit || 2000}
      />
    );
  }

  if (question.type === "micro_input") {
    return (
      <MicroInput
        inputText={inputText}
        setInputText={onSetInputText}
        placeholder={question.placeholder || i18n.t("questionRenderer.inputPlaceholder")}
        showResult={showResult}
        onSubmit={onSubmitTextInput}
      />
    );
  }

  if (question.type === "select_all") {
    return (
      <SelectAll
        choices={questionChoices}
        selectedIndexes={selectedIndexes}
        correctAnswers={question.correct_answers}
        showResult={showResult}
        onToggle={onToggle}
        revealedIndexes={revealedIndexes}
      />
    );
  }

  if (question.type === "sort_order" && question.items && question.correct_order) {
    return (
      <SortOrder
        items={question.items}
        currentOrder={currentOrder}
        correctOrder={resolveCorrectOrder(question)}
        showResult={showResult}
        onReorder={onReorder}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (question.type === "fill_blank_tap") {
    return (
      <FillBlankTap
        statement={question.statement}
        choices={questionChoices}
        selectedIndex={selectedIndex}
        correctIndex={question.correct_index ?? 0}
        showResult={showResult}
        onSelect={onSelect}
      />
    );
  }

  if (question.type === "swipe_judgment") {
    return (
      <SwipeJudgment
        statement={questionText}
        selectedAnswer={swipeDirection}
        correctAnswer={question.is_true ? "right" : "left"}
        showResult={showResult}
        onSwipe={onSwipe}
        labels={question.swipe_labels}
      />
    );
  }

  if (question.type === "conversation") {
    return (
      <Conversation
        prompt={question.prompt || questionText}
        responsePrompt={question.your_response_prompt || ""}
        choices={questionChoices}
        selectedIndex={selectedResponse}
        correctIndex={question.recommended_index ?? question.correct_index ?? 0}
        showResult={showResult}
        onSelect={onSelectResponse}
      />
    );
  }

  if (question.type === "matching" && question.left_items && question.right_items && question.correct_pairs) {
    return (
      <Matching
        leftItems={question.left_items}
        rightItems={question.right_items}
        selectedPairs={selectedPairs}
        correctPairs={question.correct_pairs}
        showResult={showResult}
        onMatch={onMatch}
      />
    );
  }

  if (question.type === "term_card") {
    return (
      <View style={styles.termCard}>
        <Text style={styles.termTitle}>{question.term}</Text>
        {question.term_en ? <Text style={styles.termEn}>{question.term_en}</Text> : null}
        {question.definition ? <Text style={styles.termDefinition}>{question.definition}</Text> : null}
        {question.key_points && question.key_points.length > 0 ? (
          <View style={styles.keyPointsContainer}>
            {question.key_points.map((point, index) => (
              <Text key={index} style={styles.keyPoint}>
                • {point}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (question.type === "consequence_scenario" && question.consequence_type) {
    return (
      <ConsequenceScenario
        question={question.question}
        consequenceType={question.consequence_type}
        showResult={showResult}
        onSelect={onSelectConsequence}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  keyPoint: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  keyPointsContainer: {
    gap: 8,
    marginTop: 16,
  },
  termCard: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    marginBottom: 24,
  },
  termDefinition: {
    color: "#e2e8f0",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  termEn: {
    color: "#9dd9ff",
    fontSize: 18,
    marginTop: 8,
  },
  termTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
  },
});
