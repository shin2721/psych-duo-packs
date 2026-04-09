import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { theme } from "../../lib/theme";
import { useProgressionState } from "../../lib/state";
import { GameResult } from "../../lib/games.extra";
import { BreathTempo } from "../../components/games/BreathTempo";
import { EchoSteps } from "../../components/games/EchoSteps";
import { EvidenceBalance } from "../../components/games/EvidenceBalance";
import { BudgetBonds } from "../../components/games/BudgetBonds";

function getMetaNumber(meta: Record<string, unknown> | undefined, key: string): number | null {
  const value = meta?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getMetaBoolean(meta: Record<string, unknown> | undefined, key: string): boolean {
  return meta?.[key] === true;
}

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXp, incrementQuest, incrementQuestMetric } = useProgressionState();

  const handleDone = (result: GameResult) => {
    addXp(result.xp);
    incrementQuestMetric("lesson_complete", 1);
    const accuracy = getMetaNumber(result.meta, "accuracy");
    const perfect = getMetaBoolean(result.meta, "perfect");

    if (id === "breathTempo" && accuracy !== null && accuracy > 0.7) {
      incrementQuest("q_monthly_breathTempo", Math.floor(result.timeMs / 1000));
    }
    if (id === "echoSteps" && result.mistakes === 0) {
      incrementQuest("q_monthly_echoSteps");
    }
    if (id === "evidenceBalance" && result.mistakes <= 1) {
      incrementQuest("q_monthly_balance");
    }
    if (id === "budgetBonds" && perfect) {
      incrementQuest("q_monthly_budget");
    }

    router.back();
  };

  const renderGame = () => {
    switch (id) {
      case "breathTempo":
        return <BreathTempo onDone={handleDone} />;
      case "echoSteps":
        return <EchoSteps onDone={handleDone} />;
      case "evidenceBalance":
        return <EvidenceBalance onDone={handleDone} />;
      case "budgetBonds":
        return <BudgetBonds onDone={handleDone} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {renderGame()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
