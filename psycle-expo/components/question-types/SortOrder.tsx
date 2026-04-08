import React, { useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";

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
  const dragYRefs = useRef<Map<number, Animated.Value>>(new Map());
  const ITEM_HEIGHT = 72;

  const getDragY = (itemIndex: number) => {
    if (!dragYRefs.current.has(itemIndex)) {
      dragYRefs.current.set(itemIndex, new Animated.Value(0));
    }
    return dragYRefs.current.get(itemIndex)!;
  };

  if (!items || items.length === 0) {
    return (
      <View style={styles.sortContainer}>
        <Text style={styles.errorText}>{i18n.t("questionTypes.sortItemsEmptyError")}</Text>
      </View>
    );
  }

  if (!currentOrder || currentOrder.length === 0) {
    return (
      <View style={styles.sortContainer}>
        <Text style={styles.errorText}>{i18n.t("questionTypes.sortOrderEmptyError")}</Text>
      </View>
    );
  }

  const getPanResponder = (itemIndex: number) => {
    const dragY = getDragY(itemIndex);

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !showResult,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (showResult) return false;

        const absY = Math.abs(gestureState.dy);
        const absX = Math.abs(gestureState.dx);
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
        const currentPosition = currentOrder.indexOf(itemIndex);
        const movedPositions = Math.round(gestureState.dy / ITEM_HEIGHT);
        const newPosition = Math.max(0, Math.min(currentOrder.length - 1, currentPosition + movedPositions));

        dragY.setValue(0);
        setDraggingItemIndex(null);

        if (newPosition !== currentPosition) {
          const newOrder = [...currentOrder];
          const temp = newOrder[newPosition];
          newOrder[newPosition] = newOrder[currentPosition];
          newOrder[currentPosition] = temp;
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
  };

  return (
    <View style={styles.sortContainer} pointerEvents={showResult ? "none" : "auto"}>
      <Text style={styles.sortHint}>{i18n.t("questionTypes.sortHint")}</Text>
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
              styles.sortItemShell,
              {
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
                <View style={styles.reorderIconWrap}>
                  <Ionicons
                    name="reorder-three"
                    size={24}
                    color={isDragging ? "#22d3ee" : "#9aa3b2"}
                  />
                </View>
              )}
              <Text style={styles.sortItemText}>
                {itemText || i18n.t("questionTypes.sortItemFallback", { index: position + 1 })}
              </Text>
              {isCorrectPosition && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              )}
              {isIncorrectPosition && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  correctChoice: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  errorText: {
    color: "red",
    fontSize: 18,
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  reorderIconWrap: {
    marginLeft: -8,
    marginRight: 4,
    padding: 8,
  },
  sortContainer: {
    gap: 12,
  },
  sortHint: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  sortItem: {
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 12,
    minHeight: 60,
    padding: 16,
  },
  sortItemDragging: {
    borderColor: "#22d3ee",
    borderWidth: 3,
    elevation: 10,
    opacity: 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  sortItemShell: {
    marginBottom: 12,
  },
  sortItemText: {
    color: "#fff",
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
