import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { trailsByGenre } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Trail } from "../../components/trail";
import { Modal } from "../../components/Modal";
import { GlobalHeader } from "../../components/GlobalHeader";
import { StudyStreakWidget, StudyActivityDay } from "../../components/StudyStreakWidget";
import { LeagueResultModal } from "../../components/LeagueResultModal";
import { isLessonLocked, shouldShowPaywall } from "../../lib/paywall";
import { getLastWeekResult, LeagueResult } from "../../lib/leagueReward";
import { dateKey, getStreakData } from "../../lib/streaks";
import { useAuth } from "../../lib/AuthContext";
import { router } from "expo-router";
import { Analytics } from "../../lib/analytics";
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
  const { selectedGenre, completedLessons, setGemsDirectly, isSubscriptionActive } = useAppState();
  const { user } = useAuth();
  const [modalNode, setModalNode] = useState<any>(null);
  const [leagueResult, setLeagueResult] = useState<LeagueResult | null>(null);
  const [showLeagueResult, setShowLeagueResult] = useState(false);
  const [studyStreakDays, setStudyStreakDays] = useState(0);
  const [todayLessonsCompleted, setTodayLessonsCompleted] = useState(0);
  const [recentStudyActivity, setRecentStudyActivity] = useState<StudyActivityDay[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const buildRecentActivity = (studyHistory: Record<string, { lessonsCompleted: number; xp: number }>) => {
        const days: StudyActivityDay[] = [];
        const now = new Date();

        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = dateKey(d);
          const lessons = studyHistory[key]?.lessonsCompleted || 0;
          days.push({
            date: key,
            completed: lessons > 0,
            isToday: i === 0,
          });
        }
        return days;
      };

      const loadStudyWidget = async () => {
        const streakData = await getStreakData();
        const studyHistory = streakData.studyHistory || {};
        const today = dateKey();
        if (!isActive) return;
        setStudyStreakDays(streakData.studyStreak || 0);
        setTodayLessonsCompleted(studyHistory[today]?.lessonsCompleted || 0);
        setRecentStudyActivity(buildRecentActivity(studyHistory));
      };

      loadStudyWidget().catch(console.error);
      return () => {
        isActive = false;
      };
    }, [])
  );

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
    const locked = isLessonLocked(selectedGenre, level, isSubscriptionActive);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />
      <StudyStreakWidget
        streakDays={studyStreakDays}
        todayLessons={todayLessonsCompleted}
        recentActivity={recentStudyActivity}
        onOpenCalendar={() => {
          Analytics.track("streak_widget_opened", { source: "course_home" });
          router.push("/(tabs)/quests");
        }}
      />

      {/* Stats Cards REMOVED as per minimal design requirement */}




      <Trail
        trail={currentTrail}
        hideLabels
        onStart={(nodeId) => setModalNode(nodeId)}
        onLockedPress={async () => {
          // Paywall表示条件チェック
          // condition: executed 1回達成 (StreakDataから前回実行日を確認) OR レッスン完了3回以上
          const lessonCompleteCount = completedLessons.size;
          let executedCount = 0;

          try {
            const streakData = await getStreakData();
            if (streakData && streakData.lastActionDate) {
              executedCount = 1; // 一度でも実行していれば1とみなす
            }
          } catch (e) {
            console.error("Failed to check streak data:", e);
          }

          if (shouldShowPaywall(executedCount, lessonCompleteCount)) {
            router.push("/(tabs)/shop");
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
  header: {
    // Empty header reserved for spacing if needed, or remove completely.
    // Actually GlobalHeader is outside, so maybe just 0 height or specific bg.
    backgroundColor: "transparent",
  },


});
