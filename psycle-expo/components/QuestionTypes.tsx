import React, { useState, useRef, useMemo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, PanResponder, Animated, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hapticFeedback } from "../lib/haptics";
import { theme } from "../lib/theme";
import { AnimatedButton } from "./AnimatedButton";
import i18n from "../lib/i18n";
export { SortOrder } from "./question-types/SortOrder";
export { Matching } from "./question-types/Matching";
export { ConsequenceScenario } from "./question-types/ConsequenceScenario";

const getChoiceAccessibilityState = (isSelected: boolean, disabled: boolean) => ({
  selected: isSelected,
  disabled,
});

// 複数選択（即座フィードバック）
export function SelectAll({
  choices,
  selectedIndexes,
  correctAnswers,
  showResult,
  onToggle,
  revealedIndexes = [],
}: {
  choices: string[];
  selectedIndexes: number[];
  correctAnswers?: number[];
  showResult: boolean;
  onToggle: (index: number) => void;
  revealedIndexes?: number[];
}) {
  const isSurvey = !correctAnswers;

  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndexes.includes(index);
        const isCorrect = correctAnswers?.includes(index) ?? false;
        const isRevealed = revealedIndexes.includes(index);

        // Show correct answers: selected correct or unselected correct (when showResult)
        const shouldShowCorrect = isSurvey
          ? isSelected // Survey: just show selection check
          : isCorrect && (isSelected || showResult);

        // Show incorrect: revealed incorrect or showResult incorrect
        const shouldShowIncorrect = isSurvey
          ? false // Survey: never incorrect
          : !isCorrect && (isRevealed || showResult);

        return (
          <AnimatedButton
            key={index}
            style={[
              styles.choiceButton,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
              // Survey mode specific styling if needed
              isSurvey && isSelected && { backgroundColor: theme.colors.primary + "20", borderColor: theme.colors.primary }
            ]}
            onPress={() => {
              // Light impact on selection
              void hapticFeedback.light();
              onToggle(index);
            }}
            disabled={showResult && !isSurvey} // Allow changing selection in survey mode until submitted? Or disable if showResult implies submission
            testID={`answer-choice-${index}`}
            accessibilityRole="button"
            accessibilityLabel={choice}
            accessibilityState={getChoiceAccessibilityState(isSelected, showResult && !isSurvey)}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                shouldShowCorrect && styles.checkboxCorrect,
                shouldShowIncorrect && styles.checkboxIncorrect,
                isSurvey && isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}>
                {shouldShowCorrect && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
                {shouldShowIncorrect && (
                  <Ionicons name="close" size={20} color="#fff" />
                )}
              </View>
            </View>
            <Text style={[
              styles.choiceText,
              (shouldShowCorrect || shouldShowIncorrect) && styles.choiceTextWhite,
            ]}>
              {choice}
            </Text>
          </AnimatedButton>
        );
      })}
    </View>
  );
}

// 穴埋めタップ（fill_blank_tapと同じ、名前を変えただけ）
export function FillBlankTap({
  statement,
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  statement?: string;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.fillBlankContainer}>
      {statement && (
        <Text style={styles.fillBlankStatement}>{statement}</Text>
      )}
      <Text style={styles.fillBlankPrompt}>{i18n.t("questionTypes.fillBlankTapPrompt")}</Text>
      <View style={styles.fillBlankChoices}>
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
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
            >
              <Text style={styles.fillBlankText}>
                {choice}
              </Text>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

// スワイプ判定
export function SwipeJudgment({
  statement,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSwipe,
  labels,
}: {
  statement: string;
  selectedAnswer: "left" | "right" | null;
  correctAnswer: string;
  showResult: boolean;
  onSwipe: (direction: "left" | "right") => void;
  labels?: { left: string; right: string };
}) {
  const pan = useState(new Animated.ValueXY())[0];
  const scale = useRef(new Animated.Value(1)).current; // For squash/stretch
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Idle Animation: Floating & Breathing
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
        ])
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !showResult,
    onPanResponderGrant: () => {
      // Squash effect on touch
      Animated.spring(scale, {
        toValue: 0.9,
        speed: 50,
        bounciness: 10,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (_, gestureState) => {
      pan.x.setValue(gestureState.dx);
    },
    onPanResponderRelease: (e, gesture) => {
      // Release Scale
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 20, // Extra bouncy release
        useNativeDriver: true,
      }).start();

      if (showResult) return;
      const threshold = 10;
      if (Math.abs(gesture.dx) > threshold) {
        // Swipe committed
        const direction = gesture.dx > 0 ? "right" : "left";
        const isSwipeCorrect = (direction === correctAnswer);

        // Haptic Feedback based on result (simulated prediction or after-fact?
        // Component logic: onSwipe triggers parent, which sets showResult/isCorrect.
        // We can't know isCorrect HERE immediately unless passed or calculated.
        // But visuals update fast. Let's trigger a 'Selection' impact first.
        void hapticFeedback.medium();

        onSwipe(direction);
        Animated.spring(pan, {
          toValue: { x: gesture.dx > 0 ? 300 : -300, y: 0 },
          useNativeDriver: true,
          speed: 20,
        }).start();
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <View style={styles.swipeContainer}>

      <View style={styles.swipeLabels}>
        <Text style={styles.swipeLabel}>← {labels?.left || i18n.t("questionTypes.swipeLeftFallback")}</Text>
        <Text style={styles.swipeLabel}>{labels?.right || i18n.t("questionTypes.swipeRightFallback")} →</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeCard,
          {
            transform: [
              { translateX: pan.x },
              { translateY: translateY },
              { rotate: rotate },
              { scaleY: scale },
            ],
            // Removed transparency override to ensure card is visible
          },
        ]}
      >
        {/* Creating a sprite window */}
        <View style={{ width: 140, height: 140, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {/* Reactive Sprite Sheet via Native Interpolation */}
          <Animated.Image
            source={require('../assets/firefly_sprites.png')}
            style={{
              width: 280, height: 280,
              resizeMode: 'stretch',
              position: 'absolute',
              top: 0, left: 0, // Base position
              transform: [
                {
                  translateX: pan.x.interpolate({
                    // Logic: Right Swipe (>20) -> Happy (TR, X=-140). Else 0.
                    inputRange: [-300, 20, 20.1, 300],
                    outputRange: [0, 0, -140, -140],
                    extrapolate: 'clamp'
                  })
                },
                {
                  translateY: pan.x.interpolate({
                    // Logic: Left Swipe (<-20) -> Sad (BL, Y=-140). Else 0.
                    inputRange: [-300, -20.1, -20, 300],
                    outputRange: [-140, -140, 0, 0],
                    extrapolate: 'clamp'
                  })
                }
              ]
            }}
          />
        </View>
        {selectedAnswer && (
          <View style={{ position: 'absolute', top: -40 }}>
            {isCorrect ? (
              <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
            ) : (
              <Ionicons name="close-circle" size={40} color="#ef4444" />
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// 会話問題（conversationは通常のmultiple_choiceと同じ見た目だが、プロンプトが違う）
export function Conversation({
  prompt,
  responsePrompt,
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  prompt: string;
  responsePrompt: string;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View>
      <Text style={styles.conversationResponsePrompt}>{responsePrompt}</Text>
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
                styles.conversationChoice,
                isSelected && styles.selectedChoice,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
              ]}
              onPress={() => onSelect(index)}
              disabled={showResult}
              testID={`answer-choice-${index}`}
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(isSelected, showResult)}
            >
              <Text style={styles.choiceText}>
                {choice}
              </Text>
              {shouldShowCorrect && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              )}
              {shouldShowIncorrect && (
                <Ionicons name="close-circle" size={24} color={"#ef4444"} />
              )}
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );
}

// アニメーション説明（汎用）
export function AnimatedExplanation({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // 4秒読んで完了

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.animatedContainer}>
      <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
        <Text style={styles.animatedText}>{text}</Text>
      </Animated.View>
    </View>
  );
}





// ========================================
// Quick Reflex（反射型：時間制限付き即答問題）
// ========================================
export function QuickReflex({
  choices,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
  timeLimit = 2000,
}: {
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
  timeLimit?: number;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // タイマー処理
  React.useEffect(() => {
    if (showResult || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          setIsTimeUp(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [showResult, isTimeUp]);

  // 時間切れ時に自動的に不正解として処理
  React.useEffect(() => {
    if (isTimeUp && !showResult) {
      onSelect(-1); // 無効なインデックスで不正解扱い
    }
  }, [isTimeUp, showResult, onSelect]);

  const progressPercent = (timeRemaining / timeLimit) * 100;

  return (
    <View style={styles.quickReflexContainer}>
      {/* タイマー表示 */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <View
            style={[
              styles.timerProgress,
              {
                width: `${progressPercent}%`,
                backgroundColor: progressPercent > 30 ? theme.colors.primary : "#e74c3c",
              },
            ]}
          />
        </View>
        <Text style={styles.timerText}>
          {isTimeUp
            ? i18n.t("questionTypes.timeUp")
            : i18n.t("questionTypes.timerSeconds", { seconds: (timeRemaining / 1000).toFixed(1) })}
        </Text>
      </View>

      {/* 選択肢 */}
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
                styles.choiceButton,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
                isTimeUp && !showResult && styles.disabledChoice,
              ]}
              onPress={() => !isTimeUp && onSelect(index)}
              disabled={showResult || isTimeUp}
              testID={`answer-choice-${index}`}
              accessibilityRole="button"
              accessibilityLabel={choice}
              accessibilityState={getChoiceAccessibilityState(isSelected, showResult || isTimeUp)}
            >
              <Text
                style={[
                  styles.choiceText,
                  (shouldShowCorrect || shouldShowIncorrect) && styles.choiceTextWhite,
                ]}
              >
                {choice}
              </Text>
              {shouldShowCorrect && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
              {shouldShowIncorrect && <Ionicons name="close-circle" size={24} color="#fff" />}
            </AnimatedButton>
          );
        })}
      </View>

      {isTimeUp && !showResult && (
        <Text style={styles.timeUpMessage}>{i18n.t("questionTypes.timeUpMessage")}</Text>
      )}
    </View>
  );
}

// ========================================
// Micro Input（入力型：短文入力問題）
// ========================================
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
    <View style={styles.microInputContainer}>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{i18n.t("questionTypes.microInputLabel")}</Text>
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
            styles.submitButton,
            !inputText.trim() && styles.submitButtonDisabled,
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
          <Text style={styles.submitButtonText}>
            {inputText.trim() ? i18n.t("questionTypes.microInputCheckAnswer") : i18n.t("questionTypes.microInputPleaseInput")}
          </Text>
        </AnimatedButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesContainer: {
    gap: 12,
  },
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
  selectedChoice: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  unselectedIncorrectChoice: {
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  choiceText: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  selectedChoiceText: {
    color: "#fff",
  },
  choiceTextWhite: {
    color: "#fff",
  },

  // Select All
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  checkboxCorrect: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkboxIncorrect: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  checkboxUnselectedIncorrect: {
    backgroundColor: "#4b5563",
    borderColor: "#6b7280",
  },

  // Fill Blank Tap
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
  fillBlankChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fillBlankButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fillBlankText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },

  // Swipe Judgment
  swipeContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  swipeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  swipeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  swipeCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 24,
    width: 260,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  swipeCorrect: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  swipeIncorrect: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  swipeCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  swipeHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  swipeHintSelected: {
    color: "#fff",
  },

  // Conversation
  conversationPrompt: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  conversationText: {
    fontSize: 18,
    color: "#fff",
    lineHeight: 26,
    fontWeight: "600",
  },
  conversationResponsePrompt: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
  },
  conversationChoice: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  // Sort Order
  sortContainer: {
    gap: 12,
  },
  sortHint: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  sortItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sortButtons: {
    gap: 4,
  },
  sortArrow: {
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sortArrowDisabled: {
    opacity: 0.3,
  },
  sortItem: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
  },
  sortItemDragging: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderColor: "#22d3ee",
    borderWidth: 3,
    opacity: 0.9,
  },
  sortItemTarget: {
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    borderColor: "#0ea5e9",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  sortItemText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
    fontWeight: "600",
  },

  // Matching
  matchingContainer: {
    gap: 16,
  },
  matchingHint: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  matchingColumns: {
    flexDirection: "row",
    gap: 16,
  },
  matchingColumn: {
    flex: 1,
    gap: 12,
  },
  matchingItem: {
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchingItemSelected: {
    backgroundColor: "rgba(34, 211, 238, 0.3)",
    borderColor: "#22d3ee",
  },
  matchingItemMatched: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.6,
  },
  matchingItemText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  // AnimatedExplanation styles
  animatedContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  animatedContent: {
    alignItems: "center",
    gap: 16,
  },
  animatedText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  animatedFinal: {
    alignItems: "center",
  },
  animatedFinalText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
  },
  // RhythmTap styles
  rhythmContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  rhythmCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
  },
  rhythmCounter: {
    fontSize: 48,
    fontWeight: "700",
    color: "#fff",
  },
  rhythmText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  // Quick Reflex styles
  quickReflexContainer: {
    width: "100%",
  },
  timerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  timerBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  timerProgress: {
    height: "100%",
    borderRadius: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  timeUpMessage: {
    marginTop: 16,
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    fontWeight: "500",
  },
  disabledChoice: {
    opacity: 0.5,
  },
  // Micro Input styles
  microInputContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: 12,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputPrefix: {
    fontSize: 24,
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    color: "#fff",
  },
  textInputDisabled: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(30, 41, 59, 0.4)",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
  // Consequence Scenario styles
  consequenceContainer: {
    width: "100%",
    alignItems: "center",
  },
  consequenceQuestion: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  consequencePrompt: {
    fontSize: 16,
    color: theme.colors.sub,
    marginBottom: 24,
  },
  consequenceButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    justifyContent: "center",
  },
  consequenceButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  neutralButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  positiveButton: {
    backgroundColor: theme.colors.success,
  },
  negativeButton: {
    backgroundColor: "#ef4444",
  },
  selectedPositive: {
    borderColor: "#166534", // Darker green
    borderWidth: 4,
  },
  selectedNegative: {
    borderColor: "#991b1b", // Darker red
    borderWidth: 4,
  },
  consequenceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
  },
});
