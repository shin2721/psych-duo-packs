import React, { useState, useRef, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, PanResponder, Animated, TextInput } from "react-native";
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

        // Show correct answers: selected correct or unselected correct (when showResult)
        const shouldShowCorrect = isCorrect && (isSelected || showResult);
        // Show incorrect: revealed incorrect or showResult incorrect
        const shouldShowIncorrect = !isCorrect && (isRevealed || showResult);

        return (
          <Pressable
            key={index}
            style={[
              styles.choiceButton,
              shouldShowCorrect && styles.correctChoice,
              shouldShowIncorrect && styles.incorrectChoice,
            ]}
            onPress={() => onToggle(index)}
            disabled={showResult || isSelected}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                shouldShowCorrect && styles.checkboxCorrect,
                shouldShowIncorrect && styles.checkboxIncorrect,
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
          </Pressable>
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
    onPanResponderMove: (_, gestureState) => {
      pan.x.setValue(gestureState.dx);
    },
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
  const [draggingItemIndex, setDraggingItemIndex] = useState<number | null>(null);
  const ITEM_HEIGHT = 72;

  // 各itemIndexごとにdragY値を持つ（アイテムIDベース）
  const dragYRefs = useRef<Map<number, Animated.Value>>(new Map());

  // itemIndexに対応するdragY値を取得または作成
  const getDragY = (itemIndex: number) => {
    if (!dragYRefs.current.has(itemIndex)) {
      dragYRefs.current.set(itemIndex, new Animated.Value(0));
    }
    return dragYRefs.current.get(itemIndex)!;
  };

  console.log("[SortOrder] Rendering with:", {
    items,
    currentOrder,
    correctOrder,
    itemsLength: items.length,
    currentOrderLength: currentOrder.length
  });

  if (!items || items.length === 0) {
    return (
      <View style={styles.sortContainer}>
        <Text style={{ color: 'red', fontSize: 18 }}>エラー: items配列が空です</Text>
      </View>
    );
  }

  if (!currentOrder || currentOrder.length === 0) {
    return (
      <View style={styles.sortContainer}>
        <Text style={{ color: 'red', fontSize: 18 }}>エラー: currentOrderが空です</Text>
      </View>
    );
  }

  const getPanResponder = (itemIndex: number) => {
    const dragY = getDragY(itemIndex);

    // showResultの状態を毎回参照するため、キャッシュしない
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !showResult,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 結果表示中はドラッグを無効化してスクロールを優先
        if (showResult) return false;

        const absY = Math.abs(gestureState.dy);
        const absX = Math.abs(gestureState.dx);
        // 垂直方向の動きが5px以上かつ、水平方向より大きい場合のみドラッグ
        return absY > 5 && absY > absX * 1.2;
      },

      onPanResponderGrant: () => {
        setDraggingItemIndex(itemIndex);
        dragY.setValue(0);
        onDragStart?.();
      },

      onPanResponderMove: (_, gestureState) => {
        dragY.setValue(gestureState.dy);
      },

      onPanResponderRelease: (_, gestureState) => {
        // 現在の位置を取得
        const currentPosition = currentOrder.indexOf(itemIndex);

        // どれだけ移動したか計算
        const movedPositions = Math.round(gestureState.dy / ITEM_HEIGHT);
        const newPosition = Math.max(0, Math.min(currentOrder.length - 1, currentPosition + movedPositions));

        console.log('Drag release:', {
          itemIndex,
          currentPosition,
          newPosition,
          dy: gestureState.dy,
          movedPositions,
          currentOrder,
        });

        // まずアニメーションを即座にリセット
        dragY.setValue(0);
        setDraggingItemIndex(null);

        // 位置が変わった場合は並び替え（SWAP方式）
        if (newPosition !== currentPosition) {
          const newOrder = [...currentOrder];
          // 2つのアイテムを入れ替え
          const temp = newOrder[newPosition];
          newOrder[newPosition] = newOrder[currentPosition];
          newOrder[currentPosition] = temp;
          console.log('New order (swapped):', newOrder);
          onReorder(newOrder);
        }

        onDragEnd?.();
      },

      onPanResponderTerminate: () => {
        dragY.setValue(0);
        setDraggingItemIndex(null);
        onDragEnd?.();
      },
    });

    return panResponder;
  };

  return (
    <View style={styles.sortContainer} pointerEvents={showResult ? "none" : "auto"}>
      <Text style={styles.sortHint}>≡ をドラッグして並び替えよう</Text>
      {currentOrder.map((itemIndex, position) => {
        const isCorrectPosition = showResult && correctOrder[position] === itemIndex;
        const isIncorrectPosition = showResult && !isCorrectPosition;
        const isDragging = draggingItemIndex === itemIndex;
        const itemText = items[itemIndex];
        const dragY = getDragY(itemIndex);

        return (
          <Animated.View
            key={`item-${itemIndex}`}
            pointerEvents={showResult ? "box-none" : "auto"}
            style={[
              {
                marginBottom: 12,
                transform: isDragging ? [{ translateY: dragY }] : [],
                zIndex: isDragging ? 1000 : 1,
              },
            ]}
          >
            <View
              {...(!showResult ? getPanResponder(itemIndex).panHandlers : {})}
              style={[
                styles.sortItem,
                isDragging && styles.sortItemDragging,
                isCorrectPosition && styles.correctChoice,
                isIncorrectPosition && styles.incorrectChoice,
              ]}
            >
              {!showResult && (
                <View style={{ padding: 8, marginLeft: -8, marginRight: 4 }}>
                  <Ionicons
                    name="reorder-three"
                    size={24}
                    color={isDragging ? "#22d3ee" : "#9aa3b2"}
                  />
                </View>
              )}
              <Text style={styles.sortItemText}>
                {itemText || `アイテム${position + 1}`}
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
  const [currentIncorrectLeft, setCurrentIncorrectLeft] = useState<number | null>(null);
  const [currentIncorrectRight, setCurrentIncorrectRight] = useState<number | null>(null);

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
      setCurrentIncorrectLeft(null);
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
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
    }
  };

  const tryPair = (leftIndex: number, rightIndex: number) => {
    const isCorrect = correctPairs.some(([l, r]) => l === leftIndex && r === rightIndex);

    if (isCorrect) {
      // 正解の場合、ペアとして記録
      const newPairs = [...selectedPairs, [leftIndex, rightIndex]];
      onMatch(newPairs);
      setCurrentIncorrectLeft(null);
      setCurrentIncorrectRight(null);
    } else {
      // 不正解の場合
      setCurrentIncorrectLeft(leftIndex);
      setCurrentIncorrectRight(rightIndex);

      // 少し待ってから赤い表示を消す
      setTimeout(() => {
        setCurrentIncorrectLeft(null);
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
            const isCurrentIncorrect = currentIncorrectLeft === index;
            return (
              <Pressable
                key={index}
                style={[
                  styles.matchingItem,
                  selectedLeft === index && styles.matchingItemSelected,
                  isMatched && styles.correctChoice,
                  isCurrentIncorrect && styles.incorrectChoice,
                ]}
                onPress={() => handleLeftPress(index)}
                disabled={isMatched}
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
        <View style={styles.matchingColumn}>
          {rightItems.map((item, index) => {
            const matchedLeft = selectedPairs.find(([_, r]) => r === index)?.[0];
            const isMatched = matchedLeft !== undefined;
            const isCurrentIncorrect = currentIncorrectRight === index;

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
                disabled={isMatched}
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

// Swipe判定（Q1用）
export function SwipeChoice({
  question,
  onSwipe,
}: {
  question: string;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 60) {
          const direction = gestureState.dx > 0 ? "right" : "left";
          Animated.timing(pan, {
            toValue: { x: gestureState.dx > 0 ? 500 : -500, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipe(direction);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeChoiceContainer}>
      <Animated.View
        style={[
          styles.swipeChoiceCard,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.swipeQuestion}>{question}</Text>
        <View style={styles.swipeHints}>
          <Text style={styles.swipeHintLeft}>←  いいえ</Text>
          <Text style={styles.swipeHintRight}>はい  →</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// アニメーション説明（Q3用・簡略版）
export function AnimatedExplanation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (step < 3) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setStep(step + 1);
          fadeAnim.setValue(1);
        });
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const content = [
    { icon: "heart", text: "心臓ドクドク", color: "#ef4444" },
    { icon: "fitness", text: "ゆっくり呼吸", color: "#22d3ee" },
    { icon: "heart", text: "心拍が落ち着く", color: "#10b981" },
  ];

  return (
    <View style={styles.animatedContainer}>
      <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
        {step < 3 && (
          <>
            <Ionicons name={content[step].icon as any} size={80} color={content[step].color} />
            <Text style={styles.animatedText}>{content[step].text}</Text>
          </>
        )}
      </Animated.View>
      {step === 3 && (
        <View style={styles.animatedFinal}>
          <Text style={styles.animatedFinalText}>60秒で心拍10-15%↓</Text>
        </View>
      )}
    </View>
  );
}

// リズムタップ（Q4用）
export function RhythmTap({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = React.useState<"inhale" | "hold" | "exhale" | "done">("inhale");
  const [counter, setCounter] = React.useState(4);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (phase === "done") {
      setTimeout(() => onComplete(), 1000);
      return;
    }

    if (phase === "inhale" && counter > 0) {
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        setCounter(counter - 1);
        scaleAnim.setValue(1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (phase === "inhale" && counter === 0) {
      setPhase("hold");
      setCounter(7);
    }

    if (phase === "hold" && counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (phase === "hold" && counter === 0) {
      setPhase("exhale");
      setCounter(8);
    }

    if (phase === "exhale" && counter > 0) {
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        setCounter(counter - 1);
        scaleAnim.setValue(1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (phase === "exhale" && counter === 0) {
      setPhase("done");
    }
  }, [phase, counter]);

  const phaseText = {
    inhale: `鼻から吸って (${counter})`,
    hold: `止めて (${counter})`,
    exhale: `口から吐いて (${counter})`,
    done: "完了！",
  };

  return (
    <View style={styles.rhythmContainer}>
      <Animated.View style={[styles.rhythmCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.rhythmCounter}>{phase === "done" ? "✓" : counter}</Text>
      </Animated.View>
      <Text style={styles.rhythmText}>{phaseText[phase]}</Text>
    </View>
  );
}

// 複数選択トリガー設定（Q9用）
export function MultiSelectTriggers({
  options,
  selectedIndexes,
  onToggle,
}: {
  options: string[];
  selectedIndexes: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <View style={styles.triggersContainer}>
      <Text style={styles.triggersPrompt}>どんな時に使う？</Text>
      {options.map((option, index) => {
        const isSelected = selectedIndexes.includes(index);
        return (
          <Pressable
            key={index}
            style={[
              styles.triggerOption,
              isSelected && styles.triggerOptionSelected,
            ]}
            onPress={() => onToggle(index)}
          >
            <View style={[
              styles.triggerCheckbox,
              isSelected && styles.triggerCheckboxSelected,
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={[
              styles.triggerText,
              isSelected && styles.triggerTextSelected,
            ]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
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
          {isTimeUp ? "⏰ 時間切れ！" : `⏱ ${(timeRemaining / 1000).toFixed(1)}秒`}
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
            <Pressable
              key={index}
              style={[
                styles.choiceButton,
                shouldShowCorrect && styles.correctChoice,
                shouldShowIncorrect && styles.incorrectChoice,
                isTimeUp && !showResult && styles.disabledChoice,
              ]}
              onPress={() => !isTimeUp && onSelect(index)}
              disabled={showResult || isTimeUp}
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
            </Pressable>
          );
        })}
      </View>

      {isTimeUp && !showResult && (
        <Text style={styles.timeUpMessage}>時間内に答えられませんでした</Text>
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
        <Text style={styles.inputLabel}>答えを入力してください：</Text>
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
        <Pressable
          style={[
            styles.submitButton,
            !inputText.trim() && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!inputText.trim()}
        >
          <Text style={styles.submitButtonText}>
            {inputText.trim() ? "答えを確認" : "入力してください"}
          </Text>
        </Pressable>
      )}
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
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
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
    minHeight: 60,
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
  // SwipeChoice styles
  swipeChoiceContainer: {
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeChoiceCard: {
    width: 300,
    height: 350,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeQuestion: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  swipeHintLeft: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  swipeHintRight: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
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
    color: "#1a1a1a",
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
    color: "#1a1a1a",
  },
  // MultiSelectTriggers styles
  triggersContainer: {
    gap: 12,
  },
  triggersPrompt: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  triggerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
  },
  triggerOptionSelected: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  triggerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  triggerCheckboxSelected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  triggerText: {
    fontSize: 16,
    color: "#1a1a1a",
    flex: 1,
  },
  triggerTextSelected: {
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
    borderColor: theme.colors.primary,
    backgroundColor: "#fff",
  },
  textInputDisabled: {
    borderColor: "#95a5a6",
    backgroundColor: "#ecf0f1",
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
});

// 結果予測シナリオ（Positive/Negative）
export function ConsequenceScenario({
  question,
  consequenceType,
  showResult,
  onSelect,
}: {
  question: string;
  consequenceType: "positive" | "negative";
  showResult: boolean;
  onSelect: (isPositive: boolean) => void;
}) {
  const [selected, setSelected] = useState<"positive" | "negative" | null>(null);

  const handlePress = (type: "positive" | "negative") => {
    if (showResult) return;
    setSelected(type);
    onSelect(type === "positive");
  };

  return (
    <View style={styles.consequenceContainer}>
      <Text style={styles.consequenceQuestion}>{question}</Text>
      <Text style={styles.consequencePrompt}>この行動の結果は？</Text>

      <View style={styles.consequenceButtons}>
        <Pressable
          style={[
            styles.consequenceButton,
            styles.positiveButton,
            selected === "positive" && styles.selectedPositive,
            showResult && consequenceType === "positive" && styles.correctChoice,
            showResult && selected === "positive" && consequenceType !== "positive" && styles.incorrectChoice,
            showResult && consequenceType !== "positive" && styles.disabledChoice, // Fade out wrong option if correct is negative
            showResult && consequenceType === "positive" && styles.correctChoice, // Highlight correct
          ]}
          onPress={() => handlePress("positive")}
          disabled={showResult}
        >
          <Ionicons name="happy-outline" size={32} color="#fff" />
          <Text style={styles.consequenceButtonText}>ポジティブ</Text>
        </Pressable>

        <Pressable
          style={[
            styles.consequenceButton,
            styles.negativeButton,
            selected === "negative" && styles.selectedNegative,
            showResult && consequenceType === "negative" && styles.correctChoice,
            showResult && selected === "negative" && consequenceType !== "negative" && styles.incorrectChoice,
            showResult && consequenceType !== "negative" && styles.disabledChoice,
            showResult && consequenceType === "negative" && styles.correctChoice,
          ]}
          onPress={() => handlePress("negative")}
          disabled={showResult}
        >
          <Ionicons name="sad-outline" size={32} color="#fff" />
          <Text style={styles.consequenceButtonText}>ネガティブ</Text>
        </Pressable>
      </View>
    </View>
  );
}
