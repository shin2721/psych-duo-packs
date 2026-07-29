import React from "react";
import { QuestionAdvancedBlocks } from "./QuestionAdvancedBlocks";
import { QuestionChoiceBlocks } from "./QuestionChoiceBlocks";
import { QuestionPrompt } from "./QuestionPrompt";
import { QuestionSubmitFooter } from "./QuestionSubmitFooter";
import type { QuestionInteractionProps } from "./QuestionInteraction.shared";

export function QuestionInteraction({
  betValue,
  currentOrder,
  inputText,
  onDragEnd,
  onDragStart,
  onLockBet,
  onMatch,
  onSetBetValue,
  onReorder,
  onSelect,
  onSelectConsequence,
  onSelectResponse,
  onSetInputText,
  onSubmitOrder,
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
}: QuestionInteractionProps) {
  return (
    <>
      <QuestionPrompt question={question} questionText={questionText} />
      <QuestionChoiceBlocks
        onSelect={onSelect}
        question={question}
        questionChoices={questionChoices}
        selectedIndex={selectedIndex}
        showResult={showResult}
      />
      <QuestionAdvancedBlocks
        betValue={betValue}
        currentOrder={currentOrder}
        inputText={inputText}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onLockBet={onLockBet}
        onMatch={onMatch}
        onSetBetValue={onSetBetValue}
        onReorder={onReorder}
        onSelect={onSelect}
        onSelectConsequence={onSelectConsequence}
        onSelectResponse={onSelectResponse}
        onSetInputText={onSetInputText}
        onSubmitOrder={onSubmitOrder}
        onSubmitTextInput={onSubmitTextInput}
        onSwipe={onSwipe}
        onToggle={onToggle}
        question={question}
        questionChoices={questionChoices}
        questionText={questionText}
        revealedIndexes={revealedIndexes}
        selectedIndex={selectedIndex}
        selectedIndexes={selectedIndexes}
        selectedPairs={selectedPairs}
        selectedResponse={selectedResponse}
        showResult={showResult}
        swipeDirection={swipeDirection}
      />
      <QuestionSubmitFooter
        onSubmitOrder={onSubmitOrder}
        question={question}
        selectedIndexes={selectedIndexes}
        showResult={showResult}
      />
    </>
  );
}
