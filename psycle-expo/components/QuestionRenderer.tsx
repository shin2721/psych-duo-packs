import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticFeedback } from "../lib/HapticFeedback";
import { useProgressionState } from "../lib/state";
import { theme } from "../lib/theme";
import { QuestionRendererView } from "./QuestionRendererView";
import { createQuestionRuntime } from "./question-runtime/createQuestionRuntime";
import type { Question } from "../types/question";
export type { Question };
export {
  areSelectAllAnswersCorrect,
  getQuestionChoices,
  getQuestionText,
  isChoiceCorrect,
} from "./question-runtime/questionRendererHelpers";

import { sounds } from "../lib/sounds";
import { getComboMilestone, getNextCombo } from "../lib/comboMilestone";
import {
  areSelectAllAnswersCorrect,
  getQuestionChoices,
  getQuestionText,
  isChoiceCorrect,
} from "./question-runtime/questionRendererHelpers";

interface Props {
  question: Question;
  onContinue: (isCorrect: boolean, xp: number) => void;
  combo?: number;
  onComboChange?: (combo: number) => void;
  onComboMilestone?: (milestone: 3 | 5 | 10, questionId: string) => void;
}

export function QuestionRenderer({
  question,
  onContinue,
  combo: externalCombo,
  onComboChange,
  onComboMilestone,
}: Props) {
  const questionText = getQuestionText(question);
  const questionChoices = getQuestionChoices(question);
  const insets = useSafeAreaInsets();
  const scrollBottomInset = insets.bottom + theme.spacing.xl;
  const { updateSkill } = useProgressionState();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<number[]>(() => {
    if (question.type === "sort_order" && question.items) {
      return question.initial_order && question.initial_order.length > 0
        ? question.initial_order
        : question.items.map((_, index) => index);
    }
    return [];
  });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const [selectedPairs, setSelectedPairs] = useState<number[][]>([]);
  const [inputText, setInputText] = useState("");
  const [consequenceSelection, setConsequenceSelection] = useState<boolean | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const [showEvidenceSheet, setShowEvidenceSheet] = useState(false);
  const [showExplanationDetails, setShowExplanationDetails] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [internalCombo, setInternalCombo] = useState(0);
  const combo = typeof externalCombo === "number" ? externalCombo : internalCombo;

  const commitCombo = (nextCombo: number) => {
    if (onComboChange) onComboChange(nextCombo);
    if (typeof externalCombo !== "number") {
      setInternalCombo(nextCombo);
    }
  };

  useEffect(() => {
    if (question.type === "sort_order" && question.items) {
      const initialOrder =
        question.initial_order && question.initial_order.length > 0
          ? question.initial_order
          : question.items.map((_, index) => index);
      setCurrentOrder(initialOrder);
    }
    setScrollEnabled(true);
    setSelectedIndex(null);
    setSelectedIndexes([]);
    setRevealedIndexes([]);
    setShowResult(false);
    setSwipeDirection(null);
    setSelectedResponse(null);
    setSelectedPairs([]);
    setInputText("");
    setConsequenceSelection(null);
    setShowExplanationDetails(false);
    setShowEvidenceSheet(false);
  }, [question]);

  useEffect(() => {
    if (question.type === "select_all" && question.correct_answers && !showResult) {
      const allCorrectSelected = areSelectAllAnswersCorrect(question, selectedIndexes);
      const hasWrongAnswer = selectedIndexes.some(
        (index) => !question.correct_answers?.includes(index)
      );

      if ((allCorrectSelected && selectedIndexes.length > 0) || hasWrongAnswer) {
        setShowResult(true);
      }
    }
  }, [question, selectedIndexes, showResult]);

  useEffect(() => {
    if (question.type === "matching" && question.correct_pairs && !showResult) {
      if (selectedPairs.length === question.correct_pairs.length) {
        setShowResult(true);
      }
    }
  }, [question, selectedPairs, showResult]);

  useEffect(() => {
    if (showResult) {
      setScrollEnabled(true);
    }
  }, [showResult]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const runtime = createQuestionRuntime(question, {
    consequenceSelection,
    currentOrder,
    inputText,
    selectedIndex,
    selectedIndexes,
    selectedPairs,
    selectedResponse,
    swipeDirection,
  });

  const handleSelect = (index: number) => {
    if (showResult) return;

    setSelectedIndex(index);
    setShowResult(true);

    if (isChoiceCorrect(question, index)) {
      void HapticFeedback.success();
      void sounds.play("correct");
      return;
    }

    void HapticFeedback.error();
    void sounds.play("incorrect");
  };

  const handleToggle = (index: number) => {
    if (showResult) return;

    if (!question.correct_answers) {
      setSelectedIndexes((prev) =>
        prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
      );
      void HapticFeedback.selection();
      return;
    }

    const isCorrect = question.correct_answers.includes(index);
    setRevealedIndexes((prev) => [...prev, index]);
    setSelectedIndexes((prev) => [...prev, index]);
    void HapticFeedback.selection();

    if (!isCorrect) {
      setShowResult(true);
    }
  };

  const handleContinue = () => {
    if (runtime.isCorrect) {
      const newCombo = getNextCombo(combo, true);
      commitCombo(newCombo);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 2000);

      const milestone = getComboMilestone(newCombo);
      if (milestone) {
        void HapticFeedback.impact();
        if (milestone >= 5) {
          void HapticFeedback.success();
        }
        onComboMilestone?.(milestone, question.id || "unknown");
      }
    } else {
      commitCombo(getNextCombo(combo, false));
      setShowCombo(false);
    }

    const difficultyMap: Record<string, number> = {
      easy: 1200,
      medium: 1500,
      hard: 1800,
    };
    const itemDifficulty = difficultyMap[question.difficulty] || 1500;
    updateSkill(runtime.isCorrect, itemDifficulty);

    onContinue(runtime.isCorrect, runtime.isCorrect ? question.xp : 0);
  };

  return (
    <QuestionRendererView
      combo={combo}
      currentOrder={currentOrder}
      fadeAnim={fadeAnim}
      inputText={inputText}
      onContinue={handleContinue}
      onCloseEvidence={() => setShowEvidenceSheet(false)}
      onDragEnd={() => setScrollEnabled(true)}
      onDragStart={() => setScrollEnabled(false)}
      onMatch={(pairs) => {
        setSelectedPairs(pairs);
        void HapticFeedback.selection();
      }}
      onOpenEvidence={() => setShowEvidenceSheet((prev) => !prev)}
      onReorder={(newOrder) => {
        setCurrentOrder(newOrder);
        void HapticFeedback.selection();
      }}
      onSelect={handleSelect}
      onSelectConsequence={(isPositive) => {
        if (showResult) return;
        setConsequenceSelection(isPositive);
        setShowResult(true);
      }}
      onSelectResponse={(index) => {
        if (showResult) return;
        setSelectedResponse(index);
        setShowResult(true);
        void HapticFeedback.selection();
      }}
      onSetInputText={setInputText}
      onSubmitOrder={() => setShowResult(true)}
      onSubmitTextInput={() => setShowResult(true)}
      onSwipe={(direction) => {
        if (showResult) return;
        setSwipeDirection(direction);
        setShowResult(true);
        void HapticFeedback.selection();
      }}
      onToggle={handleToggle}
      onToggleExplanationDetails={() =>
        setShowExplanationDetails((prev) => !prev)
      }
      question={question}
      questionChoices={questionChoices}
      questionText={questionText}
      revealedIndexes={revealedIndexes}
      runtime={runtime}
      scrollBottomInset={scrollBottomInset}
      scrollEnabled={scrollEnabled}
      selectedIndex={selectedIndex}
      selectedIndexes={selectedIndexes}
      selectedPairs={selectedPairs}
      selectedResponse={selectedResponse}
      showCombo={showCombo}
      showEvidenceSheet={showEvidenceSheet}
      showExplanationDetails={showExplanationDetails}
      showResult={showResult}
      slideAnim={slideAnim}
      swipeDirection={swipeDirection}
    />
  );
}
