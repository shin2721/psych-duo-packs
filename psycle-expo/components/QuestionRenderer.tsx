import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import { Audio } from "expo-av";
import { theme } from "../lib/theme";
import { SortOrder, SelectAll, FillBlankTap, SwipeJudgment, Conversation, Matching } from "./QuestionTypes";

export interface Question {
  type: "multiple_choice" | "true_false" | "fill_blank" | "scenario" | "sort_order" | "select_all" | "fill_blank_tap" | "swipe_judgment" | "conversation" | "matching";
  question: string;
  choices: string[];
  correct_index?: number;
  correct_answers?: number[]; // For select_all
  explanation: string | { correct: string; incorrect: Record<string, string> };
  source_id: string;
  difficulty: string;
  xp: number;
  // sort_order fields
  items?: string[];
  correct_order?: number[];
  initial_order?: number[];
  // fill_blank_tap fields
  statement?: string;
  blank_options?: string[];
  // swipe_judgment fields
  is_true?: boolean;
  // conversation fields
  your_response_prompt?: string;
  // matching fields
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: number[][];
}

interface Props {
  question: Question;
  onContinue: (isCorrect: boolean, xp: number) => void;
}

export function QuestionRenderer({ question, onContinue }: Props) {
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
      console.log("[QuestionRenderer] Initializing currentOrder:", initial);
      return initial;
    }
    return [];
  });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // For fill_blank_tap
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null); // For swipe_judgment
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null); // For conversation
  const [selectedPairs, setSelectedPairs] = useState<number[][]>([]); // For matching
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Initialize state when question changes
  useEffect(() => {
    console.log("[QuestionRenderer] Question object:", {
      type: question.type,
      source_id: question.source_id,
      question: question.question?.substring(0, 50),
      hasItems: !!question.items,
      itemsLength: question.items?.length,
      items: question.items,
      correct_order: question.correct_order
    });

    if (question.type === "sort_order" && question.items) {
      const initialOrder = question.initial_order && question.initial_order.length > 0
        ? question.initial_order
        : question.items.map((_, i) => i);
      console.log("[QuestionRenderer] sort_order question:", {
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
  }, [question]);

  // select_all: Auto-show result when all correct answers are selected OR when wrong answer is selected
  useEffect(() => {
    if (question.type === "select_all" && question.correct_answers && !showResult) {
      console.log("=== SELECT_ALL DEBUG ===");
      console.log("selectedIndexes:", selectedIndexes);
      console.log("correct_answers:", question.correct_answers);

      const sortedSelected = [...selectedIndexes].sort();
      const sortedCorrect = [...question.correct_answers].sort();
      const allCorrectSelected = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);

      // Check if any wrong answer is selected
      const hasWrongAnswer = selectedIndexes.some(idx => !question.correct_answers?.includes(idx));
      console.log("hasWrongAnswer:", hasWrongAnswer);
      console.log("allCorrectSelected:", allCorrectSelected);

      if (allCorrectSelected && selectedIndexes.length > 0) {
        console.log("→ Setting showResult=true (all correct)");
        setShowResult(true);
      } else if (hasWrongAnswer) {
        console.log("→ Setting showResult=true (wrong answer)");
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

  // TODO: Re-enable after rebuilding dev client with expo-av
  // const playSound = async (isCorrect: boolean) => {
  //   try {
  //     await Audio.setAudioModeAsync({
  //       playsInSilentModeIOS: true,
  //       staysActiveInBackground: false,
  //     });

  //     const { sound } = await Audio.Sound.createAsync(
  //       isCorrect
  //         ? { uri: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" }
  //         : { uri: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg" },
  //       { shouldPlay: true, volume: 0.3 }
  //     );

  //     // Unload sound after playing
  //     sound.setOnPlaybackStatusUpdate((status) => {
  //       if (status.isLoaded && status.didJustFinish) {
  //         sound.unloadAsync();
  //       }
  //     });
  //   } catch (error) {
  //     // Audio not available or failed to load
  //   }
  // };

  const handleSelect = (index: number) => {
    if (showResult) return;

    setSelectedIndex(index);
    setShowResult(true);

    const isCorrect = index === question.correct_index;

    // Haptic feedback (TODO: Re-enable after rebuilding dev client)
    // Haptics.impactAsync requires dev client rebuild
    // try {
    //   if (isCorrect) {
    //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    //   } else {
    //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    //   }
    // } catch (error) {
    //   // Haptics not available on this platform
    // }

    // Sound feedback (TODO: Re-enable after rebuilding dev client)
    // playSound(isCorrect);
  };

  const handleToggle = (index: number) => {
    if (showResult) return;

    const isCorrect = question.correct_answers?.includes(index);

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
  };

  const handleContinue = () => {
    let isCorrect = false;
    if (question.type === "select_all" && question.correct_answers) {
      const sortedSelected = [...selectedIndexes].sort();
      const sortedCorrect = [...question.correct_answers].sort();
      isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    } else if (question.type === "sort_order") {
      isCorrect = JSON.stringify(currentOrder) === JSON.stringify(question.correct_order);
    } else if (question.type === "fill_blank_tap") {
      isCorrect = selectedIndex === question.correct_index;
    } else if (question.type === "swipe_judgment") {
      const correctDirection = question.is_true ? "right" : "left";
      isCorrect = swipeDirection === correctDirection;
    } else if (question.type === "conversation") {
      isCorrect = selectedResponse === question.correct_index;
    } else if (question.type === "matching" && question.correct_pairs) {
      isCorrect = JSON.stringify(selectedPairs.sort()) === JSON.stringify(question.correct_pairs.sort());
    } else {
      isCorrect = selectedIndex === question.correct_index;
    }
    onContinue(isCorrect, isCorrect ? question.xp : 0);
  };

  const handleReorder = (newOrder: number[]) => {
    setCurrentOrder(newOrder);
  };

  const handleSubmitOrder = () => {
    setShowResult(true);
  };

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (showResult) return;
    setSwipeDirection(direction);
    setShowResult(true);
  };

  const handleSelectResponse = (index: number) => {
    if (showResult) return;
    setSelectedResponse(index);
    setShowResult(true);
  };

  const handleMatch = (pairs: number[][]) => {
    setSelectedPairs(pairs);
  };

  const handleSubmitMatching = () => {
    setShowResult(true);
  };

  const isCorrect = (() => {
    if (question.type === "select_all" && question.correct_answers) {
      const sortedSelected = [...selectedIndexes].sort();
      const sortedCorrect = [...question.correct_answers].sort();
      return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    } else if (question.type === "sort_order") {
      return JSON.stringify(currentOrder) === JSON.stringify(question.correct_order);
    } else if (question.type === "fill_blank_tap") {
      return selectedIndex === question.correct_index;
    } else if (question.type === "swipe_judgment") {
      const correctDirection = question.is_true ? "right" : "left";
      return swipeDirection === correctDirection;
    } else if (question.type === "conversation") {
      return selectedResponse === question.correct_index;
    } else if (question.type === "matching" && question.correct_pairs) {
      return JSON.stringify(selectedPairs.sort()) === JSON.stringify(question.correct_pairs.sort());
    } else {
      return selectedIndex === question.correct_index;
    }
  })();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {question.type === "sort_order" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={scrollEnabled}
        >
          {/* 難易度バッジ */}
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {question.difficulty === "easy" ? "初級" : question.difficulty === "medium" ? "中級" : "上級"}
            </Text>
            <Text style={styles.xpText}>{question.xp} XP</Text>
          </View>

          {/* 問題文 */}
          <Text style={styles.questionText}>{question.question}</Text>

          {/* タイプ別レンダリング */}
          {question.type === "multiple_choice" && (
            <MultipleChoice
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "true_false" && (
            <TrueFalse
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "fill_blank" && (
            <FillBlank
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "scenario" && (
            <Scenario
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index || 0}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "select_all" && question.correct_answers && (
            <SelectAll
              choices={question.choices}
              selectedIndexes={selectedIndexes}
              correctAnswers={question.correct_answers}
              showResult={showResult}
              onToggle={handleToggle}
              revealedIndexes={revealedIndexes}
            />
          )}

          {question.type === "sort_order" && question.items && question.correct_order && (
            <>
              <SortOrder
                items={question.items}
                currentOrder={currentOrder}
                correctOrder={question.correct_order}
                showResult={showResult}
                onReorder={handleReorder}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={() => setScrollEnabled(true)}
              />
              {!showResult && (
                <Pressable style={styles.submitButton} onPress={handleSubmitOrder}>
                  <Text style={styles.submitButtonText}>答えを確認</Text>
                </Pressable>
              )}
            </>
          )}

          {question.type === "fill_blank_tap" && (
            <FillBlankTap
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index ?? 0}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "swipe_judgment" && (
            <SwipeJudgment
              statement={question.question}
              selectedAnswer={swipeDirection}
              correctAnswer={question.is_true ? "right" : "left"}
              showResult={showResult}
              onSwipe={handleSwipe}
            />
          )}

          {question.type === "conversation" && question.your_response_prompt && (
            <Conversation
              prompt={question.question}
              responsePrompt={question.your_response_prompt}
              choices={question.choices}
              selectedIndex={selectedResponse}
              correctIndex={question.correct_index ?? 0}
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

          {/* 結果表示 */}
          {showResult && (
            <View style={[styles.resultBox, isCorrect ? styles.correctBox : styles.incorrectBox]}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={32}
                  color={isCorrect ? theme.colors.success : theme.colors.error}
                />
                <Text style={[styles.resultTitle, isCorrect ? styles.correctText : styles.incorrectText]}>
                  {isCorrect ? "正解！" : "残念..."}
                </Text>
              </View>
              <Text style={styles.explanation}>
                {typeof question.explanation === 'string'
                  ? question.explanation
                  : typeof question.explanation === 'object' && question.explanation
                    ? (isCorrect
                      ? question.explanation.correct || ''
                      : (
                          // swipe_judgmentの場合はswipeDirectionをキーとして使う
                          question.type === 'swipe_judgment' && swipeDirection
                            ? (question.explanation.incorrect?.[swipeDirection] || question.explanation.incorrect?.default || '')
                            : (question.explanation.incorrect?.[selectedIndex ?? 0] || question.explanation.incorrect?.default || question.explanation.incorrect?.['1'] || question.explanation.incorrect?.['0'] || '')
                        ))
                    : ''
                }
              </Text>

              {/* 次へボタン */}
              <Pressable style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>続ける</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          {/* 難易度バッジ */}
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {question.difficulty === "easy" ? "初級" : question.difficulty === "medium" ? "中級" : "上級"}
            </Text>
            <Text style={styles.xpText}>{question.xp} XP</Text>
          </View>

          {/* 問題文 */}
          <Text style={styles.questionText}>{question.question}</Text>

          {/* タイプ別レンダリング */}
          {question.type === "multiple_choice" && (
            <MultipleChoice
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "true_false" && (
            <TrueFalse
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "fill_blank" && (
            <FillBlank
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "scenario" && (
            <Scenario
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index || 0}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "select_all" && question.correct_answers && (
            <SelectAll
              choices={question.choices}
              selectedIndexes={selectedIndexes}
              correctAnswers={question.correct_answers}
              showResult={showResult}
              onToggle={handleToggle}
              revealedIndexes={revealedIndexes}
            />
          )}

          {question.type === "sort_order" && question.items && question.correct_order && (
            <>
              <SortOrder
                items={question.items}
                currentOrder={currentOrder}
                correctOrder={question.correct_order}
                showResult={showResult}
                onReorder={handleReorder}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={() => setScrollEnabled(true)}
              />
              {!showResult && (
                <Pressable style={styles.submitButton} onPress={handleSubmitOrder}>
                  <Text style={styles.submitButtonText}>答えを確認</Text>
                </Pressable>
              )}
            </>
          )}

          {question.type === "fill_blank_tap" && (
            <FillBlankTap
              choices={question.choices}
              selectedIndex={selectedIndex}
              correctIndex={question.correct_index ?? 0}
              showResult={showResult}
              onSelect={handleSelect}
            />
          )}

          {question.type === "swipe_judgment" && (
            <SwipeJudgment
              statement={question.question}
              selectedAnswer={swipeDirection}
              correctAnswer={question.is_true ? "right" : "left"}
              showResult={showResult}
              onSwipe={handleSwipe}
            />
          )}

          {question.type === "conversation" && question.your_response_prompt && (
            <Conversation
              prompt={question.question}
              responsePrompt={question.your_response_prompt}
              choices={question.choices}
              selectedIndex={selectedResponse}
              correctIndex={question.correct_index ?? 0}
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

          {/* 結果表示 */}
          {showResult && (
            <View style={[styles.resultBox, isCorrect ? styles.correctBox : styles.incorrectBox]}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={32}
                  color={isCorrect ? theme.colors.success : theme.colors.error}
                />
                <Text style={[styles.resultTitle, isCorrect ? styles.correctText : styles.incorrectText]}>
                  {isCorrect ? "正解！" : "残念..."}
                </Text>
              </View>
              <Text style={styles.explanation}>
                {typeof question.explanation === 'string'
                  ? question.explanation
                  : typeof question.explanation === 'object' && question.explanation
                    ? (isCorrect
                      ? question.explanation.correct || ''
                      : (
                          // swipe_judgmentの場合はswipeDirectionをキーとして使う
                          question.type === 'swipe_judgment' && swipeDirection
                            ? (question.explanation.incorrect?.[swipeDirection] || question.explanation.incorrect?.default || '')
                            : (question.explanation.incorrect?.[selectedIndex ?? 0] || question.explanation.incorrect?.default || question.explanation.incorrect?.['1'] || question.explanation.incorrect?.['0'] || '')
                        ))
                    : ''
                }
              </Text>

              {/* 次へボタン */}
              <Pressable style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>続ける</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </Animated.View>
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
          <Pressable
            key={index}
            style={[
              styles.choiceButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Text style={[
              styles.choiceText,
              (isSelected || shouldShowCorrect || shouldShowIncorrect) && styles.selectedChoiceText
            ]}>
              {choice}
            </Text>
            {shouldShowCorrect && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            )}
            {shouldShowIncorrect && (
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// 正誤判定
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
    <View style={styles.trueFalseContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.tfButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Ionicons
              name={choice === "正しい" || choice === "本当" ? "checkmark-circle-outline" : "close-circle-outline"}
              size={48}
              color={isSelected ? "#fff" : theme.colors.primary}
            />
            <Text style={[styles.tfText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
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
          <Pressable
            key={index}
            style={[
              styles.fillBlankButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// シナリオ
function Scenario({
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
    <View style={styles.scenarioContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;
        const shouldShowCorrect = showResult && isCorrect;
        const shouldShowIncorrect = showResult && isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.scenarioButton,
              isSelected && styles.selectedChoice,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onSelect(index)}
            disabled={showResult}
          >
            <View style={styles.scenarioIcon}>
              <Ionicons name="bulb-outline" size={24} color={isSelected ? "#fff" : theme.colors.primary} />
            </View>
            <Text style={[styles.scenarioText, isSelected && styles.selectedChoiceText]}>
              {choice}
            </Text>
          </Pressable>
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
    paddingBottom: 40,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 24,
    lineHeight: 34,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedChoice: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  incorrectChoice: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  choiceText: {
    fontSize: 18,
    color: "#1a1a1a",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  selectedChoiceText: {
    color: "#fff",
  },
  trueFalseContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginVertical: 32,
  },
  tfButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  tfText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  fillBlankButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
  },
  scenarioContainer: {
    gap: 12,
  },
  scenarioButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
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
  },
  correctBox: {
    backgroundColor: "#e8f5e9",
  },
  incorrectBox: {
    backgroundColor: "#ffebee",
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
    color: "#2c2c2c",
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: "500",
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
    backgroundColor: "#22d3ee",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
});
