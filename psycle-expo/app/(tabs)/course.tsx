import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { genres, trailsByGenre } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Pill } from "../../components/ui";
import { Trail } from "../../components/trail";
import { Modal } from "../../components/Modal";
import { GlobalHeader } from "../../components/GlobalHeader";

export default function CourseScreen() {
  const { selectedGenre, setSelectedGenre, addXp, incrementQuest, streak, dailyXP, dailyGoal, freezeCount, gems } = useAppState();
  const [modalNode, setModalNode] = useState<string | null>(null);

  const currentTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;

  const handleStart = () => {
    addXp(10);
    incrementQuest("q_daily_3lessons");
    setModalNode(null);
  };

  const dailyProgress = Math.min((dailyXP / dailyGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Streak Card */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="flame" size={24} color={theme.colors.accent} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>日連続</Text>
          </View>
          {freezeCount > 0 && (
            <View style={styles.freezeBadge}>
              <Ionicons name="snow" size={12} color="#fff" />
              <Text style={styles.freezeCount}>{freezeCount}</Text>
            </View>
          )}
        </View>

        {/* Gems Card */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="diamond" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{gems}</Text>
            <Text style={styles.statLabel}>Gems</Text>
          </View>
        </View>
      </View>

      {/* Daily Goal Progress */}
      <View style={styles.dailyGoalCard}>
        <View style={styles.dailyGoalHeader}>
          <Text style={styles.dailyGoalTitle}>デイリーゴール</Text>
          <Text style={styles.dailyGoalXP}>{dailyXP} / {dailyGoal} XP</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${dailyProgress}%` }]} />
        </View>
        {dailyXP >= dailyGoal && (
          <View style={styles.goalCompleteRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.goalCompleteText}>達成！ +5 Gems 獲得</Text>
          </View>
        )}
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

  // Stats Cards
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  freezeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freezeCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // Daily Goal
  dailyGoalCard: {
    backgroundColor: "#fff",
    marginHorizontal: theme.spacing.md,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dailyGoalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  dailyGoalXP: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  goalCompleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  goalCompleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.success,
  },
});
