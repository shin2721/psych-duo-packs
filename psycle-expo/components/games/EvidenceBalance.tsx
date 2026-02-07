import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { GameResult } from "../../lib/games.extra";
import i18n from "../../lib/i18n";

interface Props {
  onDone: (result: GameResult) => void;
}

interface Chip {
  id: string;
  text: string;
  weight: number;
  side: "left" | "right" | "pool";
}

export function EvidenceBalance({ onDone }: Props) {
  const [chips, setChips] = useState<Chip[]>(() => [
    { id: "c1", text: String(i18n.t("gameEvidenceBalance.chips.dataA")), weight: 3, side: "pool" },
    { id: "c2", text: String(i18n.t("gameEvidenceBalance.chips.testimonyB")), weight: 2, side: "pool" },
    { id: "c3", text: String(i18n.t("gameEvidenceBalance.chips.recordC")), weight: 4, side: "pool" },
    { id: "c4", text: String(i18n.t("gameEvidenceBalance.chips.evidenceD")), weight: 3, side: "pool" },
    { id: "c5", text: String(i18n.t("gameEvidenceBalance.chips.factE")), weight: 2, side: "pool" },
    { id: "c6", text: String(i18n.t("gameEvidenceBalance.chips.infoF")), weight: 4, side: "pool" },
  ]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());

  const leftWeight = chips.filter((c) => c.side === "left").reduce((s, c) => s + c.weight, 0);
  const rightWeight = chips.filter((c) => c.side === "right").reduce((s, c) => s + c.weight, 0);
  const diff = leftWeight - rightWeight;
  const balanced = Math.abs(diff) <= 1;

  const moveChip = (id: string, newSide: "left" | "right" | "pool") => {
    setChips((prev) => prev.map((c) => (c.id === id ? { ...c, side: newSide } : c)));
  };

  const handleFinish = () => {
    if (!balanced) {
      setMistakes((m) => m + 1);
      return;
    }
    const xp = Math.max(5, 10 - mistakes);
    onDone({
      xp,
      mistakes,
      timeMs: Date.now() - startTime,
      meta: { leftWeight, rightWeight },
    });
  };

  const scaleRotation = Math.max(-20, Math.min(20, diff * 5));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("gameEvidenceBalance.title")}</Text>

      <View style={styles.scale}>
        <View style={[styles.beam, { transform: [{ rotate: `${scaleRotation}deg` }] }]}>
          <View style={styles.leftPan}>
            <Text style={styles.weightText}>{leftWeight}</Text>
          </View>
          <View style={styles.rightPan}>
            <Text style={styles.weightText}>{rightWeight}</Text>
          </View>
        </View>
        <View style={styles.pivot} />
      </View>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>{i18n.t("gameEvidenceBalance.support")}</Text>
          {chips.filter((c) => c.side === "left").map((chip) => (
            <Pressable key={chip.id} style={styles.chip} onPress={() => moveChip(chip.id, "pool")}>
              <Text style={styles.chipText}>{chip.text}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnLabel}>{i18n.t("gameEvidenceBalance.oppose")}</Text>
          {chips.filter((c) => c.side === "right").map((chip) => (
            <Pressable key={chip.id} style={styles.chip} onPress={() => moveChip(chip.id, "pool")}>
              <Text style={styles.chipText}>{chip.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.pool}>
        <Text style={styles.poolLabel}>{i18n.t("gameEvidenceBalance.pool")}</Text>
        <View style={styles.poolChips}>
          {chips.filter((c) => c.side === "pool").map((chip) => (
            <View key={chip.id} style={styles.poolChipRow}>
              <Pressable style={styles.poolChip} onPress={() => moveChip(chip.id, "left")}>
                <Text style={styles.chipText}>
                  {i18n.t("gameEvidenceBalance.moveToSupport", { text: chip.text })}
                </Text>
              </Pressable>
              <Pressable style={styles.poolChip} onPress={() => moveChip(chip.id, "right")}>
                <Text style={styles.chipText}>
                  {i18n.t("gameEvidenceBalance.moveToOppose", { text: chip.text })}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={[styles.finishButton, balanced && styles.finishButtonActive]} onPress={handleFinish}>
        <Text style={styles.finishText}>
          {balanced ? i18n.t("lessonScreen.complete") : i18n.t("gameEvidenceBalance.needsBalance")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  scale: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    height: 80,
    justifyContent: "center",
  },
  beam: {
    width: 240,
    height: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
    position: "relative",
  },
  leftPan: {
    position: "absolute",
    left: -16,
    top: -20,
    width: 48,
    height: 48,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rightPan: {
    position: "absolute",
    right: -16,
    top: -20,
    width: 48,
    height: 48,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  weightText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  pivot: {
    width: 16,
    height: 32,
    backgroundColor: theme.colors.sub,
    position: "absolute",
    bottom: -24,
    borderRadius: 8,
  },
  columns: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  column: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    minHeight: 120,
  },
  columnLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  chip: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  pool: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  poolLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.sub,
    marginBottom: theme.spacing.xs,
  },
  poolChips: {
    gap: theme.spacing.xs,
  },
  poolChipRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  poolChip: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  finishButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  finishButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
