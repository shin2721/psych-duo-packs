import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { genres, trailsByGenre } from "../../lib/data";
import { useBillingState, useEconomyState, useProgressionState } from "../../lib/state";
import { TrailV2 } from "../../components/trail-v2";
import { Modal } from "../../components/Modal";
import { GlobalHeader } from "../../components/GlobalHeader";
import { PaywallModal } from "../../components/PaywallModal";
import { LeagueResultModal } from "../../components/LeagueResultModal";
import { isLessonLocked, shouldShowPaywall } from "../../lib/paywall";
import { getLastWeekResult, LeagueResult } from "../../lib/leagueReward";
import { useAuth } from "../../lib/AuthContext";
import { router } from "expo-router";
import i18n from "../../lib/i18n";
import { Analytics } from "../../lib/analytics";
import { useToast } from "../../components/ToastProvider";

// Genre descriptions for v2 chapter subtitle
const GENRE_DESC: Record<string, string> = {
  mental: "ネガティブな自動思考を捉え、\nより柔軟な視点へ書き換える",
  money: "お金との付き合い方を\n心理学の視点から学ぶ",
  work: "生産性と満足度を\n高める仕事の心理学",
  health: "心と体の健康を\n科学的に理解する",
  social: "人間関係のパターンを知り\nより良い繋がりを築く",
  study: "効率的な学び方を\n認知科学から探る",
};

export default function CourseScreen() {
  const {
    selectedGenre,
    completedLessons,
    streakRepairOffer,
    purchaseStreakRepair,
    comebackRewardOffer,
    streak,
    xp,
  } = useProgressionState();
  const { hasProAccess } = useBillingState();
  const { setGemsDirectly } = useEconomyState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [modalNode, setModalNode] = useState<any>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallContextGenre, setPaywallContextGenre] = useState<string | null>(null);
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

  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;
  const genre = genres.find(g => g.id === selectedGenre) || genres[0];

  // Compute status based on completed lessons and paywall
  const currentTrail = useMemo(() => {
    return baseTrail.map((node: any, index: number) => {
      const lessonFile = node.lessonFile;
      if (!lessonFile) return node;

      const levelMatch = lessonFile.match(/_l(\d+)$/);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

      const locked = isLessonLocked(selectedGenre, level, hasProAccess);
      if (locked) {
        return { ...node, status: "current", isLocked: true };
      }

      const isCompleted = completedLessons.has(lessonFile);
      if (isCompleted) return { ...node, status: "done" };

      const prevNode = baseTrail[index - 1];
      const prevCompleted = prevNode?.lessonFile ? completedLessons.has(prevNode.lessonFile) : true;

      if (index === 0 || prevCompleted) return { ...node, status: "current" };
      return { ...node, status: "locked" };
    });
  }, [baseTrail, selectedGenre, completedLessons, hasProAccess]);

  const completedCount = currentTrail.filter((n: any) => n.status === "done").length;

  const handleLockedLessonAccess = async () => {
    const lessonCompleteCount = completedLessons.size;
    if (shouldShowPaywall(lessonCompleteCount)) {
      setPaywallContextGenre(selectedGenre);
      setPaywallVisible(true);
      return;
    }
    showToast(String(i18n.t("course.keepUsingMessage")));
  };

  const handleStart = () => {
    if (!modalNode) {
      setModalNode(null);
      return;
    }
    const node = currentTrail.find((n: any) => n.id === modalNode);
    if (!node?.lessonFile) {
      setModalNode(null);
      return;
    }
    if (__DEV__) console.log(`[course.tsx] Navigating to: /lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
    router.replace(`/lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
    setModalNode(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />

      <TrailV2
        trail={currentTrail}
        genre={genre}
        completedCount={completedCount}
        totalCount={currentTrail.length}
        totalXp={xp}
        streakDays={streak}
        chapterTitle={genre.label}
        chapterDesc={GENRE_DESC[selectedGenre] || ""}
        onStart={(nodeId) => setModalNode(nodeId)}
        onLockedPress={() => {
          void handleLockedLessonAccess();
        }}
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
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => {
          Analytics.track("paywall_upgrade_clicked", {
            source: "course_paywall_modal",
            genreId: paywallContextGenre ?? selectedGenre,
            lessonCompleteCount: completedLessons.size,
          });
          router.push("/(tabs)/shop");
          setPaywallVisible(false);
          setPaywallContextGenre(null);
        }}
      />

      {leagueResult && (
        <LeagueResultModal
          visible={showLeagueResult}
          result={leagueResult}
          onClaim={(claimedGems, claimedBadges, newBalance) => {
            if (newBalance !== undefined) {
              setGemsDirectly(newBalance);
            }
            showToast(
              String(
                i18n.t("course.rewardClaimedMessage", {
                  gems: claimedGems,
                  badges: claimedBadges.length,
                })
              ),
              "success"
            );
          }}
          onDismiss={() => setShowLeagueResult(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f4" },
});
