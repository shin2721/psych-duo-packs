import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../lib/theme";
import { genres, trailsByGenre } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Pill } from "../../components/ui";
import { Trail } from "../../components/trail";
import { Modal } from "../../components/Modal";

export default function CourseScreen() {
  const { selectedGenre, setSelectedGenre, addXp, incrementQuest } = useAppState();
  const [modalNode, setModalNode] = useState<string | null>(null);

  const currentTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;

  const handleStart = () => {
    addXp(10);
    incrementQuest("q_daily_3lessons");
    setModalNode(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>コース</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          {genres.map((g) => (
            <Pill
              key={g.id}
              label={g.label}
              active={selectedGenre === g.id}
              onPress={() => setSelectedGenre(g.id)}
            />
          ))}
        </ScrollView>
      </View>

      <Trail trail={currentTrail} hideLabels onStart={(nodeId) => setModalNode(nodeId)} />

      <Modal
        visible={!!modalNode}
        title="レッスンを開始"
        description="このレッスンで 10 XP 獲得できます。"
        primaryLabel="開始"
        onPrimary={handleStart}
        onCancel={() => setModalNode(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.sm },
  genreScroll: { marginTop: theme.spacing.sm },
});
