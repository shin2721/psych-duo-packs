import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { GameResult } from "../../lib/games.extra";
import { BreathTempo } from "../../components/games/BreathTempo";
import { EchoSteps } from "../../components/games/EchoSteps";
import { EvidenceBalance } from "../../components/games/EvidenceBalance";
import { BudgetBonds } from "../../components/games/BudgetBonds";

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXp } = useAppState();

  const handleDone = async (result: GameResult) => {
    await addXp(result.xp, "system");
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
