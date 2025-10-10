import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { GameResult } from "../../lib/games.extra";

interface Props {
  onDone: (result: GameResult) => void;
}

interface Card {
  id: string;
  amount: number;
  selected: boolean;
}

const TARGET = 10000;
const TOLERANCE_PERFECT = 100;
const TOLERANCE_GOOD = 250;

export function BudgetBonds({ onDone }: Props) {
  const [cards, setCards] = useState<Card[]>([
    { id: "c1", amount: 1200, selected: false },
    { id: "c2", amount: 3500, selected: false },
    { id: "c3", amount: 850, selected: false },
    { id: "c4", amount: 4100, selected: false },
    { id: "c5", amount: 2300, selected: false },
    { id: "c6", amount: 1050, selected: false },
    { id: "c7", amount: 2900, selected: false },
    { id: "c8", amount: 1600, selected: false },
  ]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());

  const total = cards.filter((c) => c.selected).reduce((s, c) => s + c.amount, 0);
  const diff = Math.abs(total - TARGET);
  const perfect = diff <= TOLERANCE_PERFECT;
  const good = diff <= TOLERANCE_GOOD;

  const toggleCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const handleSubmit = () => {
    if (!good) {
      setMistakes((m) => m + 1);
      return;
    }

    const baseXp = perfect ? 12 : good ? 10 : 8;
    const timeBonus = Date.now() - startTime < 30000 ? 2 : 0;

    onDone({
      xp: baseXp + timeBonus,
      mistakes,
      timeMs: Date.now() - startTime,
      meta: { total, diff, perfect, good },
    });
  };

  const stars = perfect ? 3 : good ? 2 : 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>予算の絆</Text>
      <Text style={styles.target}>目標: ¥{TARGET.toLocaleString()}</Text>
      <Text style={[styles.total, perfect && styles.totalPerfect, good && styles.totalGood]}>
        現在: ¥{total.toLocaleString()}
      </Text>
      <Text style={styles.diff}>差: ¥{diff.toLocaleString()}</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            style={[styles.card, card.selected && styles.cardSelected]}
            onPress={() => toggleCard(card.id)}
          >
            <Text style={[styles.cardAmount, card.selected && styles.cardAmountSelected]}>
              ¥{card.amount.toLocaleString()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.stars}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Text key={i} style={[styles.star, i < stars && styles.starActive]}>
            ★
          </Text>
        ))}
      </View>

      <Pressable style={[styles.submitButton, good && styles.submitButtonActive]} onPress={handleSubmit}>
        <Text style={styles.submitText}>{good ? "完了" : `あと ¥${diff.toLocaleString()}`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  target: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  total: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  totalPerfect: {
    color: theme.colors.success,
  },
  totalGood: {
    color: theme.colors.accent,
  },
  diff: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
    marginBottom: theme.spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: 100,
    height: 64,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.line,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardAmountSelected: {
    color: theme.colors.accent,
  },
  stars: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  star: {
    fontSize: 28,
    color: theme.colors.line,
  },
  starActive: {
    color: "#fbbf24",
  },
  submitButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  submitButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
});
