import React from "react";
import { Animated, ScrollView, StyleSheet } from "react-native";
import { theme } from "../lib/theme";
import { ComboFeedback } from "./ComboFeedback";
import { EvidenceBottomSheet } from "./EvidenceBottomSheet";
import { QuestionInteraction } from "./question-runtime/QuestionInteraction";
import { QuestionResultView } from "./question-runtime/QuestionResultView";
import type { Question } from "../types/question";
import type { QuestionRuntime } from "./question-runtime/createQuestionRuntime";

interface Props {
  combo: number;
  currentOrder: number[];
  fadeAnim: Animated.Value;
  inputText: string;
  onContinue: () => void;
  onCloseEvidence: () => void;
  onDragEnd: () => void;
  onDragStart: () => void;
  onMatch: (pairs: number[][]) => void;
  onOpenEvidence: () => void;
  onReorder: (order: number[]) => void;
  onSelect: (index: number) => void;
  onSelectConsequence: (isPositive: boolean) => void;
  onSelectResponse: (index: number) => void;
  onSetInputText: (value: string) => void;
  onSubmitOrder: () => void;
  onSubmitTextInput: () => void;
  onSwipe: (direction: "left" | "right") => void;
  onToggle: (index: number) => void;
  onToggleExplanationDetails: () => void;
  question: Question;
  questionChoices: string[];
  questionText: string;
  revealedIndexes: number[];
  runtime: QuestionRuntime;
  scrollBottomInset: number;
  scrollEnabled: boolean;
  selectedIndex: number | null;
  selectedIndexes: number[];
  selectedPairs: number[][];
  selectedResponse: number | null;
  showCombo: boolean;
  showEvidenceSheet: boolean;
  showExplanationDetails: boolean;
  showResult: boolean;
  slideAnim: Animated.Value;
  swipeDirection: "left" | "right" | null;
}

export function QuestionRendererView(props: Props) {
  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: props.fadeAnim,
            transform: [{ translateY: props.slideAnim }],
          },
        ]}
      >
        <ComboFeedback combo={props.combo} visible={props.showCombo} />
        <ScrollView
          testID="question-scroll"
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: props.scrollBottomInset },
          ]}
          showsVerticalScrollIndicator
          scrollEnabled={props.scrollEnabled}
        >
          <QuestionInteraction
            currentOrder={props.currentOrder}
            inputText={props.inputText}
            onDragEnd={props.onDragEnd}
            onDragStart={props.onDragStart}
            onMatch={props.onMatch}
            onReorder={props.onReorder}
            onSelect={props.onSelect}
            onSelectConsequence={props.onSelectConsequence}
            onSelectResponse={props.onSelectResponse}
            onSetInputText={props.onSetInputText}
            onSubmitOrder={props.onSubmitOrder}
            onSubmitTextInput={props.onSubmitTextInput}
            onSwipe={props.onSwipe}
            onToggle={props.onToggle}
            question={props.question}
            questionChoices={props.questionChoices}
            questionText={props.questionText}
            revealedIndexes={props.revealedIndexes}
            selectedIndex={props.selectedIndex}
            selectedIndexes={props.selectedIndexes}
            selectedPairs={props.selectedPairs}
            selectedResponse={props.selectedResponse}
            showResult={props.showResult}
            swipeDirection={props.swipeDirection}
          />

          {props.showResult ? (
            <QuestionResultView
              onContinue={props.onContinue}
              onOpenEvidence={props.onOpenEvidence}
              onToggleExplanationDetails={props.onToggleExplanationDetails}
              question={props.question}
              runtime={props.runtime}
              showExplanationDetails={props.showExplanationDetails}
            />
          ) : null}
        </ScrollView>
      </Animated.View>

      <EvidenceBottomSheet
        visible={props.showEvidenceSheet}
        onClose={props.onCloseEvidence}
        source_id={props.question.source_id}
        expandedDetails={props.runtime.expandedDetails}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
});
