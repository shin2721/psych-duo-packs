import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticFeedback } from "../lib/HapticFeedback";
import { useAppState } from "../lib/state";
import { QuestionImage, QuestionAudio } from "./QuestionMedia";
import { Audio } from "expo-av";
import { theme } from "../lib/theme";
import { AnimatedButton } from "./AnimatedButton";
import { InsightText } from "./InsightText";
import { Firefly } from "./Firefly";
import { EvidenceBottomSheet } from "./EvidenceBottomSheet";
import {
  QuickReflex,
  SelectAll,
  FillBlankTap,
  SwipeJudgment,
  Conversation,
  Matching,



  MicroInput,
  ConsequenceScenario,
  SortOrder,
} from "./QuestionTypes";
import { ComboFeedback } from "./ComboFeedback";
import i18n from "../lib/i18n";

import { Question } from "../types/question";
export { Question };


import { sounds } from "../lib/sounds";

interface Props {
  question: Question;
  onContinue: (isCorrect: boolean, xp: number) => void;
  onComboChange?: (combo: number) => void;
  onInterventionAttempted?: (questionId: string) => void;
  onInterventionExecuted?: (questionId: string) => void;
}

export const getQuestionText = (question: Question) => question.text ?? question.question ?? "";

export const getQuestionChoices = (question: Question) => question.choices ?? [];

export const isChoiceCorrect = (question: Question, index: number | null | undefined) => {
  if (typeof index !== "number") return false;
  if (typeof question.correct_index !== "number") return false;
  return index === question.correct_index;
};

export const areSelectAllAnswersCorrect = (question: Question, selectedIndexes: number[]) => {
  if (!question.correct_answers) return true;
  const sortedSelected = [...selectedIndexes].sort();
  const sortedCorrect = [...question.correct_answers].sort();
  return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
};

export function QuestionRenderer({ question, onContinue, onComboChange, onInterventionAttempted, onInterventionExecuted }: Props) {
  const questionText = getQuestionText(question);
  const questionChoices = getQuestionChoices(question);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]); // For select_all
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]); // For select_all immediate feedback
  const [showResult, setShowResult] = useState(false);
  // Initialize currentOrder properly for sort_order questions
  const [currentOrder, setCurrentOrder] = useState<number[]>(() => {
    if (question.type === "sort_order" && question.items) {
      const initial = question.initial_order && question.initial_order.length > 0
        ? question.initial_order
        : question.items.map((_, i) => i);
      if (__DEV__) console.log("[QuestionRenderer] Initializing currentOrder:", initial);
      return initial;
    }
    return [];
  });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // For fill_blank_tap
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null); // For swipe_judgment
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null); // For conversation
  const [selectedPairs, setSelectedPairs] = useState<number[][]>([]); // For matching
  const [swipeChoiceDirection, setSwipeChoiceDirection] = useState<"left" | "right" | null>(null); // For swipe_choice

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // For quick_reflex
  const [inputText, setInputText] = useState<string>(""); // For micro_input
  const [consequenceSelection, setConsequenceSelection] = useState<boolean | null>(null); // For consequence_scenario
  const { addXp, updateSkill } = useAppState();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [showEvidenceSheet, setShowEvidenceSheet] = useState(false);
  const [showExplanationDetails, setShowExplanationDetails] = useState(false); // 誤答時の詳細展開
  const [hasAttempted, setHasAttempted] = useState(false); // 介入を試したか
  const [attemptCountdown, setAttemptCountdown] = useState(0); // 10秒カウントダウン
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state when question changes
  useEffect(() => {
    if (__DEV__) console.log("[QuestionRenderer] Question object:", {
      type: question.type,
      source_id: question.source_id,
      prompt: question.prompt, // DEBUG
      question: typeof question.question === 'string' ? question.question.substring(0, 50) : 'Object/Array',
      hasItems: !!question.items,
      itemsLength: question.items?.length,
      items: question.items,
      correct_order: question.correct_order
    });

    if (question.type === "sort_order" && question.items) {
      const initialOrder = question.initial_order && question.initial_order.length > 0
        ? question.initial_order
        : question.items.map((_, i) => i);
      if (__DEV__) console.log("[QuestionRenderer] sort_order question:", {
        items: question.items,
        itemsLength: question.items?.length,
        correct_order: question.correct_order,
        initial_order: question.initial_order,
        computedInitialOrder: initialOrder
      });
      setCurrentOrder(initialOrder);
    }
    setScrollEnabled(true); // スクロールはデフォルトで有効
    setSelectedIndex(null);
    setSelectedIndexes([]);
    setRevealedIndexes([]);
    setShowResult(false);
    setSelectedAnswer(null);
    setSwipeDirection(null);
    setSelectedResponse(null);
    setSelectedPairs([]);
    setConsequenceSelection(null);
    setShowExplanationDetails(false); // 誤答時の詳細展開をリセット
    setHasAttempted(false); // 介入試行状態をリセット
    setAttemptCountdown(0); // カウントダウンをリセット
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [question]);

  // select_all: Auto-show result when all correct answers are selected OR when wrong answer is selected
  useEffect(() => {
    if (question.type === "select_all" && question.correct_answers && !showResult) {
      if (__DEV__) {
        console.log("=== SELECT_ALL DEBUG ===");
        console.log("selectedIndexes:", selectedIndexes);
        console.log("correct_answers:", question.correct_answers);
      }

      const allCorrectSelected = areSelectAllAnswersCorrect(question, selectedIndexes);

      // Check if any wrong answer is selected
      const hasWrongAnswer = selectedIndexes.some(idx => !question.correct_answers?.includes(idx));
      if (__DEV__) {
        console.log("hasWrongAnswer:", hasWrongAnswer);
        console.log("allCorrectSelected:", allCorrectSelected);
      }

      if (allCorrectSelected && selectedIndexes.length > 0) {
        if (__DEV__) console.log("→ Setting showResult=true (all correct)");
        setShowResult(true);
      } else if (hasWrongAnswer) {
        if (__DEV__) console.log("→ Setting showResult=true (wrong answer)");
        // Immediately show result if wrong answer is selected
        setShowResult(true);
      }
    }
  }, [selectedIndexes, question, showResult]);

  // matching: Auto-show result when all pairs are matched
  useEffect(() => {
    if (question.type === "matching" && question.correct_pairs && !showResult) {
      const totalPairs = question.correct_pairs.length;
      if (selectedPairs.length === totalPairs) {
        setShowResult(true);
      }
    }
  }, [selectedPairs, question, showResult]);

  // Ensure scroll is enabled when result is shown
  useEffect(() => {
    if (showResult) {
      setScrollEnabled(true);
    }
  }, [showResult]);

  useEffect(() => {
    // フェードイン・スライドインアニメーション
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
  }, []);

  const handleSelect = (index: number) => {
    if (showResult) return;

    setSelectedIndex(index);
    setShowResult(true);

    const isCorrect = isChoiceCorrect(question, index);

    if (isCorrect) {
      HapticFeedback.success();
      sounds.play("correct");
    } else {
      HapticFeedback.error();
      sounds.play("incorrect");
    }
  };

  const handleToggle = (index: number) => {
    if (showResult) return;

    // Survey Mode (No correct answers defined)
    if (!question.correct_answers) {
      setSelectedIndexes(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        } else {
          return [...prev, index];
        }
      });
      HapticFeedback.selection();
      return;
    }

    // Quiz Mode (Instant feedback)
    const isCorrect = question.correct_answers.includes(index);

    // Immediate feedback - keep showing both correct and incorrect choices
    setRevealedIndexes(prev => [...prev, index]);

    if (isCorrect) {
      // Add to selected list if correct
      setSelectedIndexes(prev => [...prev, index]);
    } else {
      // Add wrong answer to trigger useEffect
      setSelectedIndexes(prev => [...prev, index]);
      // Keep incorrect choices visible (removed setTimeout)
    }
    HapticFeedback.selection();
  };

  const handleContinue = () => {
    let isCorrect = false;
    if (question.type === "select_all" && question.correct_answers) {
      const sortedSelected = [...selectedIndexes].sort();
      const sortedCorrect = [...question.correct_answers].sort();
      isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    } else if (question.type === "sort_order" && question.items) {
      const currentItems = currentOrder.map(idx => question.items![idx]);
      isCorrect = JSON.stringify(currentItems) === JSON.stringify(question.correct_order);
    } else if (question.type === "fill_blank_tap") {
      isCorrect = selectedIndex === question.correct_index;
    } else if (question.type === "swipe_judgment") {
      const correctDirection = question.is_true ? "right" : "left";
      isCorrect = swipeDirection === correctDirection;
    } else if (question.type === "conversation") {
      isCorrect = selectedResponse === question.correct_index;
    } else if (question.type === "matching" && question.correct_pairs) {
      isCorrect = JSON.stringify(selectedPairs.sort()) === JSON.stringify(question.correct_pairs.sort());
    } else if (question.type === "consequence_scenario") {
      const isPositive = question.consequence_type === "positive";
      isCorrect = consequenceSelection === isPositive;
    } else {
      isCorrect = selectedIndex === question.correct_index;
    }


    if (isCorrect) {
      setCombo(prev => {
        const newCombo = prev + 1;
        if (onComboChange) onComboChange(newCombo);
        return newCombo;
      });
      setShowCombo(true);
      // Hide combo after delay
      setTimeout(() => setShowCombo(false), 2000);
    } else {
      setCombo(0);
      if (onComboChange) onComboChange(0);
      setShowCombo(false);
    }

    // Map difficulty string to Elo rating
    const difficultyMap: Record<string, number> = {
      "easy": 1200,
      "medium": 1500,
      "hard": 1800
    };
    const itemDifficulty = difficultyMap[question.difficulty] || 1500;

    // Update Skill Rating
    updateSkill(isCorrect, itemDifficulty);

    onContinue(isCorrect, isCorrect ? question.xp : 0);
  };

  const handleReorder = (newOrder: number[]) => {
    setCurrentOrder(newOrder);
    HapticFeedback.selection();
  };

  const handleSubmitOrder = () => {
    setShowResult(true);
  };

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    HapticFeedback.selection();
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (showResult) return;
    setSwipeDirection(direction);
    setShowResult(true);
    HapticFeedback.selection();
  };

  const handleSelectResponse = (index: number) => {
    if (showResult) return;
    setSelectedResponse(index);
    setShowResult(true);
    HapticFeedback.selection();
  };

  const handleMatch = (pairs: number[][]) => {
    setSelectedPairs(pairs);
    HapticFeedback.selection();
  };

  const handleSubmitMatching = () => {
    setShowResult(true);
  };

  const isCorrect = (() => {
    if (question.type === "quick_reflex") {
      // quick_reflex is a timed true/false question
      return selectedIndex === question.correct_index;
    } else if (question.type === "micro_input") {
      // micro_input checks text input against correct answer
      return inputText.trim() === question.input_answer?.trim();
    } else if (question.type === "term_card") {
      // term_cardは学習コンテンツのため常に正解
      return true;


    } else if (question.type === "select_all") {
      if (question.correct_answers) {
        const sortedSelected = [...selectedIndexes].sort();
        const sortedCorrect = [...question.correct_answers].sort();
        return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
      }
      return true;

    } else if (question.type === "sort_order" && question.items) {
      const currentItems = currentOrder.map(idx => question.items![idx]);
      return JSON.stringify(currentItems) === JSON.stringify(question.correct_order);
    } else if (question.type === "fill_blank_tap") {
      return selectedIndex === question.correct_index;
    } else if (question.type === "swipe_judgment") {
      const correctDirection = question.is_true ? "right" : "left";
      return swipeDirection === correctDirection;
    } else if (question.type === "conversation") {
      return selectedResponse === question.correct_index;
    } else if (question.type === "matching" && question.correct_pairs) {
      return JSON.stringify(selectedPairs.sort()) === JSON.stringify(question.correct_pairs.sort());
    } else if (question.type === "consequence_scenario") {
      const isPositive = question.consequence_type === "positive";
      return consequenceSelection === isPositive;
    } else {
      return selectedIndex === question.correct_index;
    }
  })();

  const explanationText = (() => {
    if (typeof question.explanation === 'string') {
      return question.explanation;
    }
    if (typeof question.explanation === 'object' && question.explanation) {
      const mainExplanation = question.explanation.correct || '';

      if (isCorrect) {
        return mainExplanation;
      }

      // Incorrect case
      let specificFeedback = '';
      if (question.type === 'swipe_judgment' && swipeDirection) {
        specificFeedback = question.explanation.incorrect?.[swipeDirection] || question.explanation.incorrect?.default || '';
      } else {
        // Default incorrect case for other types that might use object explanation
        const indexKey = String(selectedIndex ?? 0);
        specificFeedback = question.explanation.incorrect?.[indexKey] ||
          question.explanation.incorrect?.default ||
          question.explanation.incorrect?.['1'] ||
          question.explanation.incorrect?.['0'] || '';
      }

      // If there is specific feedback, return it directly
      if (specificFeedback) {
        return specificFeedback;
      }

      return mainExplanation;
    }
    return '';
  })();

  const positiveFeedbacks = [
    i18n.t("questionRenderer.feedback.correct1"),
    i18n.t("questionRenderer.feedback.correct2"),
    i18n.t("questionRenderer.feedback.correct3"),
    i18n.t("questionRenderer.feedback.correct4"),
    i18n.t("questionRenderer.feedback.correct5"),
  ];

  const navigationFeedbacks = [
    i18n.t("questionRenderer.feedback.incorrect1"),
    i18n.t("questionRenderer.feedback.incorrect2"),
    i18n.t("questionRenderer.feedback.incorrect3"),
    i18n.t("questionRenderer.feedback.incorrect4"),
  ];

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >

        {/* Firefly temporarily disabled due to reanimated initialization issue
      <Firefly
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 50 }}
        scale={0.4}
        state={showResult ? (isCorrect ? 'happy' : 'thinking') : 'idle'}
      />
      */}

        <ComboFeedback combo={combo} visible={showCombo} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={scrollEnabled}
        >
          {(() => {
            // Logging disabled for performance
            return null;
          })()}


          {/* Multimedia Section */}
          {question.image && (
            <QuestionImage uri={question.image} caption={question.imageCaption} />
          )}
          {question.audio && (
            <QuestionAudio uri={question.audio} />
          )}

          {/* 問題文 */}
          {question.type === "conversation" ? (
            <View style={styles.conversationBubble}>
              <Text style={styles.conversationBubbleText} testID="question-text">{questionText}</Text>
            </View>
          ) : (
            /* Question Text */
            <Text style={styles.questionText} testID="question-text">{questionText}</Text>
          )}

          {/* タイプ別レンダリング */}
          {question.type === "multiple_choice" && (
            <MultipleChoice
              choices={questionChoices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "true_false" && (
            <TrueFalse
              choices={questionChoices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "fill_blank" && (
            <FillBlank
              choices={questionChoices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}



          {question.type === "quick_reflex" && (() => {
            if (__DEV__) console.log("[QuestionRenderer] Rendering quick_reflex:", {
              type: question.type,
              time_limit: question.time_limit,
              choices: question.choices,
              question: question.question
            });
            return (
              <QuickReflex
                choices={questionChoices}
                selectedIndex={selectedIndex}
                correctIndex={question.correct_index || 0}
                showResult={showResult}
                onSelect={handleSelect}
                timeLimit={question.time_limit || 2000}
              />
            );
          })()}

          {question.type === "micro_input" && (() => {
            if (__DEV__) console.log("[QuestionRenderer] Rendering micro_input:", {
              type: question.type,
              input_answer: question.input_answer,
              placeholder: question.placeholder,
              question: question.question
            });
            return (
              <MicroInput
                inputText={inputText}
                setInputText={setInputText}
                placeholder={question.placeholder || i18n.t("questionRenderer.inputPlaceholder")}
                showResult={showResult}
                onSubmit={() => setShowResult(true)}
              />
            );
          })()}

          {question.type === "select_all" && (
            <SelectAll
              choices={questionChoices}
              selectedIndexes={selectedIndexes}
              correctAnswers={question.correct_answers}
              showResult={showResult}
              onToggle={handleToggle}
              revealedIndexes={revealedIndexes}
            />
          )}

          {/* SelectAll (Survey Mode) needs a submit button */}
          {question.type === "select_all" && !showResult && (
            <Pressable
              style={[styles.submitButton, selectedIndexes.length === 0 && styles.submitButtonDisabled]}
              onPress={() => {
                if (selectedIndexes.length === 0) return; // Prevent empty submission? Or allow it? Let's require at least one.
                setShowResult(true);
              }}
              disabled={selectedIndexes.length === 0}
            >
              <Text style={styles.submitButtonText}>{i18n.t("questionRenderer.submit")}</Text>
            </Pressable>
          )}

          {question.type === "sort_order" && question.items && question.correct_order && (
            <>
              <SortOrder
                items={question.items}
                currentOrder={currentOrder}
                correctOrder={
                  question.correct_order && question.correct_order.length > 0 && typeof question.correct_order[0] === 'string'
                    ? (question.correct_order as string[]).map((item) => question.items!.indexOf(item))
                    : (question.correct_order as number[]) || []
                }
                showResult={showResult}
                onReorder={handleReorder}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={() => setScrollEnabled(true)}
              />
              {!showResult && (
                <Pressable style={styles.submitButton} onPress={handleSubmitOrder}>
                  <Text style={styles.submitButtonText}>{i18n.t("questionRenderer.checkAnswer")}</Text>
                </Pressable>
              )}
            </>
          )}

          {question.type === "fill_blank_tap" && (
            <FillBlankTap
              statement={question.statement}
              choices={questionChoices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index ?? 0}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "swipe_judgment" && (
            <SwipeJudgment
              statement={questionText}
              selectedAnswer={swipeDirection}
              correctAnswer={question.is_true ? "right" : "left"}
              showResult={showResult}
              onSwipe={handleSwipe}
              labels={question.swipe_labels}
            />
          )}

          {question.type === "conversation" && (
            <Conversation
              prompt={question.prompt || questionText}
              responsePrompt={question.your_response_prompt || ""}
              choices={questionChoices}
              selectedIndex={selectedResponse}
              correctIndex={question.recommended_index ?? question.correct_index ?? 0}
              showResult={showResult}
              onSelect={handleSelectResponse}
            />
          )}

          {question.type === "matching" && question.left_items && question.right_items && question.correct_pairs && (
            <Matching
              leftItems={question.left_items}
              rightItems={question.right_items}
              selectedPairs={selectedPairs}
              correctPairs={question.correct_pairs}
              showResult={showResult}
              onMatch={handleMatch}
            />
          )}












          {
            question.type === "term_card" && (
              <View style={styles.termCard}>
                <Text style={styles.termTitle}>{question.term}</Text>
                {question.term_en && (
                  <Text style={styles.termEn}>{question.term_en}</Text>
                )}
                {question.definition && (
                  <Text style={styles.termDefinition}>{question.definition}</Text>
                )}
                {question.key_points && question.key_points.length > 0 && (
                  <View style={styles.keyPointsContainer}>
                    {question.key_points.map((point, index) => (
                      <Text key={index} style={styles.keyPoint}>• {point}</Text>
                    ))}
                  </View>
                )}
                {/* term_cardは自動的に続けるボタンを表示 */}
                {!showResult && (
                  <Pressable style={styles.continueButton} onPress={() => setShowResult(true)} testID="question-continue">
                    <Text style={styles.continueButtonText}>{i18n.t("lesson.continue")}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </Pressable>
                )}
              </View>
            )
          }







          {
            question.type === "consequence_scenario" && question.consequence_type && (
              <ConsequenceScenario
                question={question.question}
                consequenceType={question.consequence_type}
                showResult={showResult}
                onSelect={(isPositive) => {
                  setConsequenceSelection(isPositive);
                  setShowResult(true);
                }}
              />
            )
          }

          {/* 結果表示 */}
          {
            showResult && (
              <View style={[
                styles.resultBox,
                (question.type === "select_all" && !question.correct_answers)
                  ? styles.termCard // Use neutral style
                  : (isCorrect ? styles.correctBox : styles.incorrectBox)
              ]}>
                {/* Only show Result Header if NOT survey mode */}
                {!(question.type === "select_all" && !question.correct_answers) && (
                  <View style={styles.resultHeader}>
                    <Ionicons
                      name={isCorrect ? "checkmark-circle" : "close-circle"}
                      size={32}
                      color={isCorrect ? theme.colors.success : theme.colors.error}

                    />
                    <Text style={[styles.resultTitle, isCorrect ? styles.correctText : styles.incorrectText]}>
                      {isCorrect ? (() => {
                        return positiveFeedbacks[Math.floor(Math.random() * positiveFeedbacks.length)];
                      })() : (() => {
                        // Navigation style: Empathetic, not judgmental
                        return navigationFeedbacks[Math.floor(Math.random() * navigationFeedbacks.length)];
                      })()}
                    </Text>
                  </View>
                )}

                {!isCorrect && (() => {
                  // 正解テキストを問題タイプごとに生成
                  let correctAnswerText = "";

                  if ((question.type === "multiple_choice" || question.type === "fill_blank_tap" || question.type === "conversation" || question.type === "quick_reflex" || question.type === "swipe_judgment" || question.type === "consequence_scenario" || question.type === "interactive_practice") && (question.choices && typeof question.correct_index === 'number')) {
                    correctAnswerText = question.choices[question.correct_index];
                  } else if (question.type === "select_all" && question.choices && question.correct_answers) {
                    correctAnswerText = question.correct_answers.map(i => question.choices[i]).join(i18n.t("questionRenderer.listSeparator"));
                  } else if (question.type === "swipe_judgment" && question.swipe_labels) {
                    correctAnswerText = question.is_true ? `→ ${question.swipe_labels.right}` : `← ${question.swipe_labels.left}`;
                  } else if (question.type === "sort_order" && question.correct_order) {
                    correctAnswerText = question.correct_order.join(" → ");
                  } else if (question.type === "consequence_scenario") {
                    correctAnswerText = question.consequence_type === "positive"
                      ? i18n.t("questionRenderer.consequencePositive")
                      : i18n.t("questionRenderer.consequenceNegative");
                  } else if (question.type === "matching") {
                    correctAnswerText = i18n.t("questionRenderer.matchingCorrectAnswer");
                  }

                  if (!correctAnswerText) return null;

                  // ラベルを動的に決定
                  let labelText = i18n.t("questionRenderer.correctLabel");
                  if (
                    question.type === "conversation" ||
                    question.type === "consequence_scenario" ||
                    question.type === "swipe_judgment"
                  ) {
                    labelText = i18n.t("questionRenderer.recommendedLabel");
                  }

                  return (
                    <View style={styles.correctAnswerBox}>
                      <Text style={styles.correctAnswerLabel}>{labelText}</Text>
                      <Text style={styles.correctAnswerText}>{correctAnswerText}</Text>
                    </View>
                  );
                })()}

                {/* 次へボタン (Moved before explanation to ensure visibility) */}
                <AnimatedButton style={styles.continueButton} onPress={handleContinue} testID="question-continue">
                  <Text style={styles.continueButtonText}>{i18n.t("lesson.continue")}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </AnimatedButton>

                {/* 正答時: 説明文を常に表示 */}
                {isCorrect && (
                  <InsightText
                    text={explanationText}
                    style={[
                      styles.explanation,
                      (question.type === "select_all" && !question.correct_answers) && { color: "#FFF" }
                    ]}
                  />
                )}

                {/* 誤答時: 1行actionHint + 「詳しく見る」で展開 */}
                {!isCorrect && (() => {
                  const details = (question as any).expanded_details;
                  const hasEvidence = details?.claim_type || details?.evidence_type;
                  const { getEvidenceSummary } = require('../lib/evidenceSummary');
                  const summary = hasEvidence ? getEvidenceSummary(details) : null;

                  return (
                    <View style={styles.incorrectFeedbackContainer}>
                      {/* 1行ヒント（常に表示） */}
                      {summary && (
                        <View style={styles.actionHintContainer}>
                          <Text style={styles.actionHintText}>
                            💡 {summary.actionHint}
                          </Text>
                        </View>
                      )}

                      {/* 介入問題: attempted/executed ボタン */}
                      {details?.claim_type === 'intervention' && (
                        <View style={styles.interventionButtonsContainer}>
                          {!hasAttempted ? (
                            <TouchableOpacity
                              style={styles.attemptButton}
                              onPress={() => {
                                const questionId = question.id;
                                setHasAttempted(true);
                                setAttemptCountdown(10); // 10秒カウントダウン開始
                                onInterventionAttempted?.(questionId);

                                // 1秒ごとにカウントダウン
                                countdownRef.current = setInterval(() => {
                                  setAttemptCountdown(prev => {
                                    if (prev <= 1) {
                                      if (countdownRef.current) clearInterval(countdownRef.current);
                                      return 0;
                                    }
                                    return prev - 1;
                                  });
                                }, 1000);
                              }}
                            >
                              <Text style={styles.attemptButtonText}>{i18n.t("questionRenderer.attempt10sec")}</Text>
                            </TouchableOpacity>
                          ) : attemptCountdown > 0 ? (
                            // カウントダウン中：無効化されたボタン
                            <View style={[styles.executeButton, { backgroundColor: '#374151', opacity: 0.7 }]}>
                              <Text style={[styles.executeButtonText, { color: '#9ca3af' }]}>
                                {i18n.t("questionRenderer.countdown", { seconds: attemptCountdown })}
                              </Text>
                            </View>
                          ) : (
                            // 10秒経過：有効化
                            <TouchableOpacity
                              style={styles.executeButton}
                              onPress={() => {
                                const questionId = question.id;
                                onInterventionExecuted?.(questionId);
                              }}
                            >
                              <Text style={styles.executeButtonText}>{i18n.t("questionRenderer.executed")}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* 「詳しく見る」展開ボタン */}
                      <TouchableOpacity
                        onPress={() => setShowExplanationDetails(!showExplanationDetails)}
                        style={styles.detailsToggleButton}
                      >
                        <Text style={styles.detailsToggleButtonText}>
                          {showExplanationDetails ? i18n.t("lesson.closeDetails") : i18n.t("lesson.showDetails")}
                        </Text>
                      </TouchableOpacity>

                      {/* 展開時のみ詳細を表示 */}
                      {showExplanationDetails && (
                        <View style={styles.expandedDetails}>
                          <InsightText
                            text={explanationText}
                            style={[styles.explanation, { marginTop: 8 }]}
                          />

                          {/* interventionのみ: 根拠ラベル表示 */}
                          {details?.claim_type === 'intervention' && summary && (
                            <View style={styles.evidenceCompactRow}>
                              <Text style={styles.evidenceCompactLabel}>
                                {summary.valueLabel}：{summary.tryValue}
                              </Text>
                              <Text style={styles.evidenceCompactNote}>
                                {summary.note}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* 正答時: BottomSheetリンク */}
                {isCorrect && (() => {
                  const details = (question as any).expanded_details;
                  const hasEvidence = details?.claim_type || details?.evidence_type;

                  if (!question.evidence_grade || !hasEvidence) return null;

                  return (
                    <Pressable
                      onPress={() => {
                        if (showEvidenceSheet) return;
                        setShowEvidenceSheet(true);
                      }}
                      style={({ pressed }) => [
                        styles.evidenceBadge,
                        { backgroundColor: 'rgba(255,255,255,0.1)' },
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <Text style={[styles.evidenceText, { fontSize: 11, color: '#aaa' }]}>
                        {i18n.t("questionRenderer.evidenceAvailable")}
                      </Text>
                    </Pressable>
                  );
                })()}

                {question.actionable_advice && (
                  <View style={styles.actionAdviceContainer}>
                    <Text style={styles.actionAdviceText}>
                      {question.actionable_advice}
                    </Text>
                  </View>
                )}

                {/* 正答時: intervention用CTAボタン（計測精度向上） */}
                {isCorrect && (question as any).expanded_details?.claim_type === 'intervention' && (
                  <View style={styles.interventionButtonsContainer}>
                    {!hasAttempted ? (
                      <TouchableOpacity
                        style={[styles.attemptButton, { backgroundColor: '#3b82f6' }]}
                        onPress={() => {
                          const questionId = question.id;
                          setHasAttempted(true);
                          setAttemptCountdown(10);
                          onInterventionAttempted?.(questionId);

                          countdownRef.current = setInterval(() => {
                            setAttemptCountdown(prev => {
                              if (prev <= 1) {
                                if (countdownRef.current) clearInterval(countdownRef.current);
                                return 0;
                              }
                              return prev - 1;
                            });
                          }, 1000);
                        }}
                      >
                        <Text style={styles.attemptButtonText}>{i18n.t("questionRenderer.attempt10sec")}</Text>
                      </TouchableOpacity>
                    ) : attemptCountdown > 0 ? (
                      <View style={[styles.executeButton, { backgroundColor: '#374151', opacity: 0.7 }]}>
                        <Text style={[styles.executeButtonText, { color: '#9ca3af' }]}>
                          {i18n.t("questionRenderer.countdown", { seconds: attemptCountdown })}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.executeButton, { backgroundColor: '#22c55e' }]}
                        onPress={() => {
                          const questionId = question.id;
                          onInterventionExecuted?.(questionId);
                        }}
                      >
                        <Text style={styles.executeButtonText}>{i18n.t("questionRenderer.executed")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          }
        </ScrollView >

      </Animated.View >

      {/* Evidence Bottom Sheet */}
      <EvidenceBottomSheet
        visible={showEvidenceSheet}
        onClose={() => setShowEvidenceSheet(false)}
        source_id={(question as any).source_id}
        expandedDetails={(question as any).expanded_details}
      />
    </>
  );
}

// 4択MCQ
function MultipleChoice({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        // correctIndex might be null/undefined in some cases but usually number
        const isCorrect = correctIndex === index;

        // Result display logic
        // Result display logic - initialize with undefined to use styles
        let borderColor: string | undefined;
        let bg: string | undefined;
        let showCheck = false;
        let showCross = false;

        if (showResult) {
          if (index === correctIndex) {
            borderColor = "rgba(34, 197, 94, 0.8)";
            bg = "rgba(34, 197, 94, 0.15)";
            showCheck = true;
          } else if (isSelected) {
            borderColor = "rgba(239, 68, 68, 0.8)";
            bg = "rgba(239, 68, 68, 0.15)";
            showCross = true;
          }
        } else {
          if (isSelected) {
            borderColor = theme.colors.primary;
            bg = "rgba(6, 182, 212, 0.15)";
          }
        }

        return (
          <AnimatedButton
            key={index}
            style={[
              styles.choiceButton,
              bg && { backgroundColor: bg },
              borderColor && { borderColor },
              showResult && !isSelected && index !== correctIndex && { opacity: 0.6 },
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
            testID={`answer-choice-${index}`}
          >
            <Text style={[
              styles.choiceText,
              (isSelected || showCheck || showCross) && { fontWeight: "bold" }
            ]}>
              {choice}
            </Text>
            {showCheck && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            )}
            {showCross && (
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            )}
          </AnimatedButton>
        );
      })}
    </View>
  );
}

// 2択判定 (Binary Choice)
function TrueFalse({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      <View style={{ flexDirection: 'row', gap: 12, height: 180 }}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && isSelected && !isCorrect;

          return (
            <AnimatedButton
              key={index}
              style={[
                styles.tfButton,
                // { flex: 1, backgroundColor: '#f0f4f8', borderBottomWidth: 4, borderColor: '#d9e2ec', justifyContent: 'center', alignItems: 'center' }, // REMOVED hardcoded light styles
                isSelected && styles.selectedChoice,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
              ]}
              onPress={() => onSelect(index)}
              disabled={showResult}
              testID={`answer-choice-${index}`}
            >
              <Text style={[
                styles.choiceText,
                { fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
                (isSelected || shouldShowCorrect || shouldShowIncorrect) && styles.selectedChoiceText
              ]}>
                {choice}
              </Text>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

// 穴埋め
function FillBlank({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <AnimatedButton
            key={index}
            style={[
              styles.fillBlankButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
            testID={`answer-choice-${index}`}
          >
            <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </AnimatedButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  xpText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fbbf24",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 32,
    lineHeight: 34,
    textAlign: "left",
  },
  sectionTitle: { // Add a specific style if needed, or inline logic
  },
  choicesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  choiceButton: {
    backgroundColor: "#1e293b", // Solid Slate-800 for consistent visibility
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedChoice: {
    backgroundColor: "rgba(6, 182, 212, 0.2)", // Primary Cyan tint
    borderColor: theme.colors.primary,
  },
  correctChoice: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: theme.colors.success,
  },
  incorrectChoice: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: theme.colors.error,
  },
  choiceText: {
    fontSize: 18,
    color: "#fff", // White text
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  selectedChoiceText: {
    color: "#a5f3fc", // Cyan 200
  },
  trueFalseContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginVertical: 32,
  },
  tfButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  tfText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
  },
  fillBlankButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    padding: 16,
  },
  scenarioContainer: {
    gap: 12,
  },
  scenarioButton: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scenarioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioText: {
    fontSize: 18,
    color: "#1a1a1a",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  resultBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    marginBottom: 40, // Add margin bottom
  },
  correctBox: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.5)",
    borderWidth: 1,
  },
  incorrectBox: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  correctText: {
    color: theme.colors.success,
  },
  incorrectText: {
    color: theme.colors.error,
  },
  explanation: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    marginTop: 16,
    fontWeight: "500",
  },
  actionAdviceContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionAdviceText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: "600",
  },
  evidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  evidence_gold: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  evidence_silver: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#9E9E9E',
  },
  evidence_bronze: {
    backgroundColor: '#EFEBE9',
    borderWidth: 1,
    borderColor: '#8D6E63',
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: "#1a1a1a", // Keep dark text for badges as they have light bg
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    opacity: 0.5,
  },
  continueButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // term_card styles
  termCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  termTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  termEn: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 16,
    fontStyle: "italic",
  },
  termDefinition: {
    fontSize: 17,
    color: "#e2e8f0",
    lineHeight: 26,
    marginBottom: 16,
  },


  keyPointsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  keyPoint: {
    fontSize: 16,
    color: "#cbd5e1",
    lineHeight: 24,
    marginBottom: 8,
  },
  // Quick Reflex styles
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "right",
  },
  correctAnswerBox: {
    backgroundColor: "#1e3a2f",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  correctAnswerLabel: {
    fontSize: 13,
    color: "#4ade80",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 1,
  },
  correctAnswerText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 26,
  },
  // Conversation bubble styles
  conversationBubble: {
    backgroundColor: "#374151",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  conversationBubbleText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 30,
  },
  // ActionHint styles (for incorrect answer feedback)
  actionHintContainer: {
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  actionHintText: {
    fontSize: 14,
    color: "#60a5fa",
    lineHeight: 20,
    fontWeight: "500",
  },
  // Incorrect feedback container styles (for collapsed/expanded view)
  incorrectFeedbackContainer: {
    marginTop: 8,
  },
  detailsToggleButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  detailsToggleButtonText: {
    fontSize: 13,
    color: "#a5b4fc",
    fontWeight: "500",
  },
  expandedDetails: {
    marginTop: 4,
  },
  evidenceCompactRow: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  evidenceCompactLabel: {
    fontSize: 13,
    color: "#60a5fa",
    fontWeight: "600",
    marginBottom: 4,
  },
  evidenceCompactNote: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Intervention attempted/executed buttons
  interventionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    gap: 12,
  },
  attemptButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attemptButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  executeButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  executeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
