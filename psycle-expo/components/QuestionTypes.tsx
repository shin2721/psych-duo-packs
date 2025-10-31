import React, { useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, PanResponder, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

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
  correctAnswers: number[];
  showResult: boolean;
  onToggle: (index: number) => void;
  revealedIndexes?: number[];
}) {
  return (
    <View style={styles.choicesContainer}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndexes.includes(index);
        const isCorrect = correctAnswers.includes(index);
        const isRevealed = revealedIndexes.includes(index);
        const shouldShowCorrect = isSelected && isCorrect;
        const shouldShowIncorrect = isRevealed && !isCorrect;
        const shouldShowUnselectedIncorrect = showResult && !isSelected && !isCorrect;

        return (
          <Pressable
            key={index}
            style={[
              styles.choiceButton,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
              shouldShowUnselectedIncorrect && styles.unselectedIncorrectChoice,
            ]}
            onPress={() => onToggle(index)}
            disabled={showResult || isSelected}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                shouldShowCorrect && styles.checkboxCorrect,
                shouldShowIncorrect && styles.checkboxIncorrect,
                shouldShowUnselectedIncorrect && styles.checkboxUnselectedIncorrect,
              ]}>
                {shouldShowCorrect && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
                {(shouldShowIncorrect || shouldShowUnselectedIncorrect) && (
                  <Ionicons name="close" size={20} color={shouldShowIncorrect ? "#fff" : "#6b7280"} />
                )}
              </View>
            </View>
            <Text style={styles.choiceText}>
              {choice}
            </Text>
            {shouldShowCorrect && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            )}
            {shouldShowIncorrect && (
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// 穴埋めタップ（fill_blank_tapと同じ、名前を変えただけ）
export function FillBlankTap({
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
    <View style={styles.fillBlankContainer}>
      <Text style={styles.fillBlankPrompt}>タップして選ぼう:</Text>
      <View style={styles.fillBlankChoices}>
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
              <Text style={styles.fillBlankText}>
                {choice}
              </Text>
            </Pressable>
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
}: {
  statement: string;
  selectedAnswer: "left" | "right" | null;
  correctAnswer: string;
  showResult: boolean;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const pan = useState(new Animated.ValueXY())[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !showResult,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (e, gesture) => {
      if (showResult) return;
      const threshold = 30; // 感度を上げる（より軽く反応）
      if (Math.abs(gesture.dx) > threshold) {
        const direction = gesture.dx > 0 ? "right" : "left";
        onSwipe(direction);
        // スワイプ方向にカードを飛ばすアニメーション
        Animated.spring(pan, {
          toValue: { x: gesture.dx > 0 ? 300 : -300, y: 0 },
          useNativeDriver: false,
          speed: 20,
        }).start();
      } else {
        // しきい値に達しなかった場合は元に戻す
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeLabels}>
        <Text style={styles.swipeLabel}>← 危険</Text>
        <Text style={styles.swipeLabel}>大丈夫 →</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeCard,
          { transform: [{ translateX: pan.x }] },
          selectedAnswer && (isCorrect ? styles.swipeCorrect : styles.swipeIncorrect),
        ]}
      >
        <Ionicons name="swap-horizontal" size={24} color={selectedAnswer ? "#fff" : "#22d3ee"} />
        <Text style={styles.swipeCardText}>
          {statement}
        </Text>
        <Text style={[styles.swipeHint, selectedAnswer && styles.swipeHintSelected]}>
          ← スワイプして判定 →
        </Text>
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
      <View style={styles.conversationPrompt}>
        <Text style={styles.conversationText}>{prompt}</Text>
      </View>
      <Text style={styles.conversationResponsePrompt}>{responsePrompt}</Text>
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
                styles.conversationChoice,
                isSelected && styles.selectedChoice,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
              ]}
              onPress={() => onSelect(index)}
              disabled={showResult}
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// 並び替え (ドラッグ版 - PanResponderのみ)
export function SortOrder({
  items,
  currentOrder,
  correctOrder,
  showResult,
  onReorder,
  onDragStart,
  onDragEnd,
}: {
  items: string[];
  currentOrder: number[];
  correctOrder: number[];
  showResult: boolean;
  onReorder: (newOrder: number[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const [targetPosition, setTargetPosition] = useState<number | null>(null);

  const ITEM_HEIGHT = 80; // アイテムの高さ（padding + margin + border）

  const createPanResponder = (index: number) => {
    return PanResponder.create({
      // タップしたら即座にPanResponderを有効化
      onStartShouldSetPanResponder: () => !showResult,
      onStartShouldSetPanResponderCapture: () => !showResult, // 子のイベントをキャプチャ
      // わずかでも動いたらドラッグ開始
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !showResult && Math.abs(gestureState.dy) > 1;
      },
      onMoveShouldSetPanResponderCapture: () => !showResult, // ScrollViewより優先

      onPanResponderGrant: () => {
        if (showResult) return;
        setDraggingIndex(index);
        dragY.setValue(0);
        setTargetPosition(index);
        onDragStart?.();
      },

      onPanResponderMove: (_, gesture) => {
        if (showResult) return;

        // リアルタイムで位置を更新
        dragY.setValue(gesture.dy);

        // 現在のターゲット位置を計算
        const movedPositions = Math.round(gesture.dy / ITEM_HEIGHT);
        const newTarget = Math.max(0, Math.min(currentOrder.length - 1, index + movedPositions));
        setTargetPosition(newTarget);
      },

      onPanResponderRelease: (_, gesture) => {
        if (showResult) {
          setDraggingIndex(null);
          setTargetPosition(null);
          onDragEnd?.();
          return;
        }

        // ドラッグした距離から新しい位置を計算
        const movedPositions = Math.round(gesture.dy / ITEM_HEIGHT);
        const newPosition = Math.max(0, Math.min(currentOrder.length - 1, index + movedPositions));

        if (newPosition !== index) {
          const newOrder = [...currentOrder];
          const [removed] = newOrder.splice(index, 1);
          newOrder.splice(newPosition, 0, removed);
          onReorder(newOrder);
        }

        // アニメーションでリセット
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start(() => {
          setDraggingIndex(null);
          setTargetPosition(null);
          onDragEnd?.();
        });
      },

      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          setDraggingIndex(null);
          setTargetPosition(null);
          onDragEnd?.();
        });
      },
    });
  };

  return (
    <View style={styles.sortContainer}>
      <Text style={styles.sortHint}>👆 タップ＆ドラッグで並び替えよう</Text>
      {currentOrder.map((itemIndex, position) => {
        const isCorrectPosition = showResult && correctOrder[position] === itemIndex;
        const isIncorrectPosition = showResult && !isCorrectPosition;
        const isDragging = draggingIndex === position;
        const isTarget = targetPosition === position && !isDragging;

        return (
          <Animated.View
            key={`${position}-${itemIndex}`}
            style={[
              {
                marginBottom: 12,
                transform: isDragging ? [{ translateY: dragY }] : [],
                zIndex: isDragging ? 1000 : 1,
              },
            ]}
            {...createPanResponder(position).panHandlers}
          >
            <View
              style={[
                styles.sortItem,
                isDragging && styles.sortItemDragging,
                isTarget && styles.sortItemTarget,
                isCorrectPosition && styles.correctChoice,
                isIncorrectPosition && styles.incorrectChoice,
              ]}
            >
              <Ionicons
                name="reorder-three"
                size={24}
                color={isDragging ? "#22d3ee" : isTarget ? "#0ea5e9" : "#9aa3b2"}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.sortItemText}>
                {items[itemIndex]}
              </Text>
              {isCorrectPosition && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              )}
              {isIncorrectPosition && (
                <Ionicons name="close-circle" size={24} color={"#ef4444"} />
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// マッチング（1ペアずつ即フィードバック）
export function Matching({
  leftItems,
  rightItems,
  selectedPairs,
  correctPairs,
  showResult,
  onMatch,
}: {
  leftItems: string[];
  rightItems: string[];
  selectedPairs: number[][];
  correctPairs: number[][];
  showResult: boolean;
  onMatch: (pairs: number[][]) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [currentIncorrectRight, setCurrentIncorrectRight] = useState<number | null>(null);
  const [triedPairs, setTriedPairs] = useState<Set<string>>(new Set());

  const handleLeftPress = (index: number) => {
    // すでにマッチ済みの左アイテムは選択できない
    if (selectedPairs.some(([l, _]) => l === index)) return;

    // 右が選択されている場合、ペアを試す
    if (selectedRight !== null) {
      tryPair(index, selectedRight);
      setSelectedRight(null);
    } else {
      // 右が選択されていない場合、左を選択
      setSelectedLeft(index);
      setCurrentIncorrectRight(null);
    }
  };

  const handleRightPress = (index: number) => {
    // すでにマッチ済みの右アイテムは選択できない
    if (selectedPairs.some(([_, r]) => r === index)) return;

    // 左が選択されている場合、ペアを試す
    if (selectedLeft !== null) {
      tryPair(selectedLeft, index);
      setSelectedLeft(null);
    } else {
      // 左が選択されていない場合、右を選択
      setSelectedRight(index);
      setCurrentIncorrectRight(null);
    }
  };

  const tryPair = (leftIndex: number, rightIndex: number) => {
    // すでに試したペアは選択できない
    const pairKey = `${leftIndex}-${rightIndex}`;
    if (triedPairs.has(pairKey)) return;

    const isCorrect = correctPairs.some(([l, r]) => l === leftIndex && r === rightIndex);

    if (isCorrect) {
      // 正解の場合、ペアとして記録
      const newPairs = [...selectedPairs, [leftIndex, rightIndex]];
      onMatch(newPairs);
      setCurrentIncorrectRight(null);
    } else {
      // 不正解の場合
      setTriedPairs(new Set([...triedPairs, pairKey]));
      setCurrentIncorrectRight(rightIndex);

      // 少し待ってから赤い表示を消す
      setTimeout(() => {
        setCurrentIncorrectRight(null);
      }, 800);
    }
  };

  return (
    <View style={styles.matchingContainer}>
      <Text style={styles.matchingHint}>左右どちらからでも選べます（2つタップで結ぶ）</Text>
      <View style={styles.matchingColumns}>
        <View style={styles.matchingColumn}>
          {leftItems.map((item, index) => {
            const isMatched = selectedPairs.some(([l, _]) => l === index);
            return (
              <Pressable
                key={index}
                style={[
                  styles.matchingItem,
                  selectedLeft === index && styles.matchingItemSelected,
                  isMatched && styles.correctChoice,
                ]}
                onPress={() => handleLeftPress(index)}
                disabled={isMatched}
              >
                <Text style={styles.matchingItemText}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.matchingColumn}>
          {rightItems.map((item, index) => {
            const matchedLeft = selectedPairs.find(([_, r]) => r === index)?.[0];
            const isMatched = matchedLeft !== undefined;
            const isCurrentIncorrect = currentIncorrectRight === index;
            // Prevent clicking if already tried with current left/right selection
            const pairKeyLeft = selectedLeft !== null ? `${selectedLeft}-${index}` : "";
            const isTriedWithCurrentLeft = pairKeyLeft && triedPairs.has(pairKeyLeft);

            return (
              <Pressable
                key={index}
                style={[
                  styles.matchingItem,
                  selectedRight === index && styles.matchingItemSelected,
                  isMatched && styles.correctChoice,
                  isCurrentIncorrect && styles.incorrectChoice,
                ]}
                onPress={() => handleRightPress(index)}
                disabled={isMatched || isTriedWithCurrentLeft}
              >
                <Text style={styles.matchingItemText}>
                  {item}
                </Text>
                {isMatched && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                )}
                {isCurrentIncorrect && (
                  <Ionicons name="close-circle" size={20} color={"#ef4444"} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: "#1a1a1a",
    flex: 1,
    lineHeight: 26,
    fontWeight: "600",
  },
  selectedChoiceText: {
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
    borderColor: "#e0e0e0",
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
  fillBlankChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fillBlankButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fillBlankText: {
    fontSize: 16,
    color: "#1a1a1a",
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 240,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swipeCorrect: {
    backgroundColor: theme.colors.success,
  },
  swipeIncorrect: {
    backgroundColor: "#ef4444",
  },
  swipeCardText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
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
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
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
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    color: "#1a1a1a",
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
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchingItemSelected: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  matchingItemMatched: {
    backgroundColor: "#f5f5f5",
    borderColor: "#d0d0d0",
  },
  matchingItemText: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
    flex: 1,
  },
});
