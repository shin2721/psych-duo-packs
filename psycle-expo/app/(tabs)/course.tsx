import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { genres, trailsByGenre } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Pill } from "../../components/ui";
import { Trail } from "../../components/trail";
import { Modal } from "../../components/Modal";
import { GlobalHeader } from "../../components/GlobalHeader";
import { XPProgressBar } from "../../components/XPProgressBar";
import { PaywallModal } from "../../components/PaywallModal";
import { isLessonLocked, GenreId } from "../../lib/paywall";
import { router } from "expo-router";

export default function CourseScreen() {
  const { selectedGenre, setSelectedGenre, addXp, incrementQuest, streak, dailyXP, dailyGoal, freezeCount, gems, completedLessons, skill, xp, purchasedPacks, purchasePack, mistakes } = useAppState();
  const [modalNode, setModalNode] = useState<any>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallGenre, setPaywallGenre] = useState<GenreId>('mental');

  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;
  console.log(`[CourseScreen] selectedGenre: ${selectedGenre}`);
  console.log(`[CourseScreen] baseTrail length: ${baseTrail?.length}`);
  console.log(`[CourseScreen] baseTrail first node: ${JSON.stringify(baseTrail?.[0])}`);
  console.log(`[CourseScreen] baseTrail last node: ${JSON.stringify(baseTrail?.[baseTrail.length - 1])}`);

  // Compute status based on completed lessons and paywall
  const currentTrail = baseTrail.map((node, index) => {
    const lessonFile = node.lessonFile;
    if (!lessonFile) return node;

    // Extract level from lessonFile (e.g., "mental_l07" -> 7)
    const levelMatch = lessonFile.match(/_l(\d+)$/);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

    // Check if lesson is locked by paywall
    const locked = isLessonLocked(selectedGenre, level, purchasedPacks);
    if (locked) {
      return { ...node, status: "current", isLocked: true }; // Show as current but locked
    }

    const isCompleted = completedLessons.has(lessonFile);
    if (isCompleted) return { ...node, status: "done" };

    // Check if previous lesson is completed
    const prevNode = baseTrail[index - 1];
    const prevCompleted = prevNode?.lessonFile ? completedLessons.has(prevNode.lessonFile) : true;

    if (index === 0 || prevCompleted) return { ...node, status: "current" };
    return { ...node, status: "locked" };
  });

  const handleStart = () => {
    if (!modalNode) {
      setModalNode(null);
      return;
    }

    // Find the node in the trail
    const node = currentTrail.find(n => n.id === modalNode);
    if (!node?.lessonFile) {
      setModalNode(null);
      return;
    }

    // Navigate to lesson screen
    router.push(`/lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
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

      </View>

      {/* Skill & Gems Row */}
      <View style={styles.statsContainer}>
        {/* Skill Card */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy" size={24} color={theme.colors.warn} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{skill}</Text>
            <Text style={styles.statLabel}>Skill Rating</Text>
          </View>
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

      {/* XP Progress Bar */}
      <XPProgressBar currentXP={xp} currentLevel={Math.floor(xp / 100) + 1} />

      {/* Mistakes Review Button */}
      {mistakes.length > 0 && (
        <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <Pressable
            style={{
              backgroundColor: theme.colors.error,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.sm
            }}
            onPress={() => router.push("/review")}
          >
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              苦手克服 ({mistakes.length}問)
            </Text>
          </Pressable>
        </View>
      )}

      {/* Daily Goal */}
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

      <Trail
        trail={currentTrail}
        hideLabels
        onStart={(nodeId) => setModalNode(nodeId)}
        onLockedPress={() => {
          setPaywallGenre(selectedGenre as GenreId);
          setPaywallVisible(true);
        }}
      />

      <Modal
        visible={!!modalNode}
        title="レッスンを開始"
        description="このレッスンで 10 XP 獲得できます。"
        primaryLabel="開始"
        onPrimary={handleStart}
        onCancel={() => setModalNode(null)}
      />

      <PaywallModal
        visible={paywallVisible}
        genreId={paywallGenre}
        onClose={() => setPaywallVisible(false)}
        onPurchase={(genreId) => {
          purchasePack(genreId);
          setPaywallVisible(false);
        }}
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
    color: theme.colors.sub,
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
    color: theme.colors.sub,
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
