import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { genres, trailsByGenre } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Trail } from "../../components/trail";
import { Modal } from "../../components/Modal";
import { GlobalHeader } from "../../components/GlobalHeader";
import { PaywallModal } from "../../components/PaywallModal";
import { LeagueResultModal } from "../../components/LeagueResultModal";
import { isLessonLocked, GenreId, shouldShowPaywall } from "../../lib/paywall";
import { getLastWeekResult, LeagueResult } from "../../lib/leagueReward";
import { useAuth } from "../../lib/AuthContext";
import { router } from "expo-router";
import i18n from "../../lib/i18n";



// Genre Theme Colors
const GENRE_COLORS: Record<string, string> = {
  mental: "#ec4899", // Pink
  money: "#eab308", // Yellow
  work: "#3b82f6", // Blue
  health: "#ef4444", // Red
  social: "#f97316", // Orange
  study: "#22c55e", // Green
};

export default function CourseScreen() {
  const { selectedGenre, setSelectedGenre, addXp, incrementQuest, streak, dailyXP, dailyGoal, freezeCount, gems, completedLessons, skill, xp, purchasedPacks, purchasePack, mistakes, addGems, setGemsDirectly, streakRepairOffer, purchaseStreakRepair } = useAppState();
  const { user } = useAuth();
  const [modalNode, setModalNode] = useState<any>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallGenre, setPaywallGenre] = useState<GenreId>('mental');
  const [leagueResult, setLeagueResult] = useState<LeagueResult | null>(null);
  const [showLeagueResult, setShowLeagueResult] = useState(false);

  // リーグ結果チェック（アプリ起動時）
  useEffect(() => {
    async function checkLeagueResult() {
      if (!user) return;
      const result = await getLastWeekResult(user.id);
      if (result.hasReward) {
        setLeagueResult(result);
        setShowLeagueResult(true);
      }
    }
    checkLeagueResult();
  }, [user]);

  const themeColor = GENRE_COLORS[selectedGenre] || GENRE_COLORS.mental;
  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;
  if (__DEV__) {
    console.log(`[CourseScreen] selectedGenre: ${selectedGenre}`);
    console.log(`[CourseScreen] baseTrail length: ${baseTrail?.length}`);
    console.log(`[CourseScreen] baseTrail first node: ${JSON.stringify(baseTrail?.[0])}`);
    console.log(`[CourseScreen] baseTrail last node: ${JSON.stringify(baseTrail?.[baseTrail.length - 1])}`);
  }

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
    if (__DEV__) console.log(`[course.tsx] Navigating to: /lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
    // Alert.alert("Debug", `Navigating to: ${node.lessonFile}`);
    router.replace(`/lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
    setModalNode(null);
  };

  const dailyProgress = Math.min((dailyXP / dailyGoal) * 100, 100);
  const activeStreakRepairOffer = streakRepairOffer?.active && streakRepairOffer.expiresAtMs > Date.now()
    ? streakRepairOffer
    : null;
  const streakRepairRemainingHours = activeStreakRepairOffer
    ? Math.max(1, Math.ceil((activeStreakRepairOffer.expiresAtMs - Date.now()) / (60 * 60 * 1000)))
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />

      {activeStreakRepairOffer && (
        <View style={styles.streakRepairCard}>
          <View style={styles.streakRepairTexts}>
            <Text style={styles.streakRepairTitle}>{i18n.t("course.streakRepair.title")}</Text>
            <Text style={styles.streakRepairBody}>
              {i18n.t("course.streakRepair.body", {
                streak: activeStreakRepairOffer.previousStreak,
                cost: activeStreakRepairOffer.costGems,
                hours: streakRepairRemainingHours,
              })}
            </Text>
          </View>
          <Pressable
            style={styles.streakRepairButton}
            onPress={() => {
              const result = purchaseStreakRepair();
              if (!result.success) {
                if (result.reason === "insufficient_gems") {
                  Alert.alert(
                    i18n.t("course.streakRepair.title"),
                    i18n.t("course.streakRepair.insufficientGems")
                  );
                  return;
                }
                if (result.reason === "expired") {
                  Alert.alert(
                    i18n.t("course.streakRepair.title"),
                    i18n.t("course.streakRepair.expired")
                  );
                }
              }
            }}
          >
            <Text style={styles.streakRepairButtonText}>{i18n.t("course.streakRepair.cta")}</Text>
          </Pressable>
        </View>
      )}

      {/* Stats Cards REMOVED as per minimal design requirement */}




      <Trail
        trail={currentTrail}
        hideLabels
        onStart={(nodeId) => setModalNode(nodeId)}
        onLockedPress={async () => {
          // Paywall表示条件チェック（Study基準: レッスン完了3回以上）
          const lessonCompleteCount = completedLessons.size;
          if (shouldShowPaywall(lessonCompleteCount)) {
            setPaywallGenre(selectedGenre as GenreId);
            setPaywallVisible(true);
          } else {
            // 条件未達成：もう少し使ってみてメッセージ
            Alert.alert(
              i18n.t("course.keepUsingTitle"),
              i18n.t("course.keepUsingMessage"),
              [{ text: i18n.t("common.ok") }]
            );
          }
        }}
        themeColor={themeColor}
      />

      <Modal
        visible={!!modalNode}
        title={i18n.t("course.startLessonTitle")}
        description={i18n.t("course.startLessonDescription", { xp: 10 })}
        primaryLabel={i18n.t("course.startButton")}
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

      {/* リーグ結果モーダル（週明け表示） */}
      {leagueResult && (
        <LeagueResultModal
          visible={showLeagueResult}
          result={leagueResult}
          onClaim={(claimedGems, claimedBadges, newBalance) => {
            // サーバー側で既に加算済み。ローカルStateを新しい残高で上書き同期する
            if (newBalance !== undefined) {
              setGemsDirectly(newBalance);
            }
            Alert.alert(
              i18n.t("course.rewardClaimedTitle"),
              i18n.t("course.rewardClaimedMessage", { gems: claimedGems, badges: claimedBadges.length })
            );
          }}
          onDismiss={() => setShowLeagueResult(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  streakRepairCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.4)",
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakRepairTexts: {
    flex: 1,
    gap: 4,
  },
  streakRepairTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f97316",
  },
  streakRepairBody: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
  },
  streakRepairButton: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakRepairButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  header: {
    // Empty header reserved for spacing if needed, or remove completely.
    // Actually GlobalHeader is outside, so maybe just 0 height or specific bg.
    backgroundColor: "transparent",
  },


});
