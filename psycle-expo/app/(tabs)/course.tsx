import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Alert, Pressable, Text } from "react-native";
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
import { getLeagueBoundaryStatus } from "../../lib/league";
import {
  dateKey,
  getStreakData,
  getRecoveryMissionStatus,
  getStreakGuardStatus,
  markLeagueBoundaryShown,
  markRecoveryMissionShown,
  markStreakGuardShown,
} from "../../lib/streaks";
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
  const [recoveryMission, setRecoveryMission] = useState<{ missedDays: number; lastActionDate: string; actionStreak: number } | null>(null);
  const [streakGuard, setStreakGuard] = useState<{
    actionStreak: number;
    freezesRemaining: number;
    riskType: "break_streak" | "consume_freeze";
    lastActionDate: string;
  } | null>(null);
  const [leagueBoundary, setLeagueBoundary] = useState<{
    mode: "promotion_chase" | "demotion_risk";
    myRank: number;
    promotionZone: number;
    demotionZone: number;
    weeklyXp: number;
    xpGap: number;
    weekId: string;
    tier: number;
  } | null>(null);

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
        const recoveryStatus = await getRecoveryMissionStatus();
        const streakGuardStatus = await getStreakGuardStatus();
        const leagueBoundaryStatus = user
          ? await getLeagueBoundaryStatus(user.id)
          : null;
        const studyHistory = streakData.studyHistory || {};
        const today = dateKey();
        if (!isActive) return;
        setStudyStreakDays(streakData.studyStreak || 0);
        setTodayLessonsCompleted(studyHistory[today]?.lessonsCompleted || 0);
        setRecentStudyActivity(buildRecentActivity(studyHistory));

        let recoveryShown = false;
        let streakGuardShown = false;
        if (recoveryStatus.eligible && recoveryStatus.lastActionDate) {
          recoveryShown = true;
          setRecoveryMission({
            missedDays: recoveryStatus.missedDays,
            lastActionDate: recoveryStatus.lastActionDate,
            actionStreak: recoveryStatus.actionStreak,
          });

          if (!recoveryStatus.shownToday) {
            await markRecoveryMissionShown();
            Analytics.track("recovery_mission_shown", {
              source: "course_home",
              missedDays: recoveryStatus.missedDays,
              lastActionDate: recoveryStatus.lastActionDate,
              actionStreak: recoveryStatus.actionStreak,
            });
          }
        } else {
          setRecoveryMission(null);
        }

        if (!recoveryShown && streakGuardStatus.eligible && streakGuardStatus.lastActionDate) {
          streakGuardShown = true;
          setStreakGuard({
            actionStreak: streakGuardStatus.actionStreak,
            freezesRemaining: streakGuardStatus.freezesRemaining,
            riskType: streakGuardStatus.riskType,
            lastActionDate: streakGuardStatus.lastActionDate,
          });

          if (!streakGuardStatus.shownToday) {
            await markStreakGuardShown();
            Analytics.track("streak_guard_shown", {
              source: "course_home",
              actionStreak: streakGuardStatus.actionStreak,
              freezesRemaining: streakGuardStatus.freezesRemaining,
              riskType: streakGuardStatus.riskType,
              lastActionDate: streakGuardStatus.lastActionDate,
            });
          }
        } else {
          setStreakGuard(null);
        }

        if (!recoveryShown && !streakGuardShown && leagueBoundaryStatus) {
          setLeagueBoundary(leagueBoundaryStatus);
          const shownRecorded = await markLeagueBoundaryShown();
          if (shownRecorded) {
            Analytics.track("league_boundary_shown", {
              source: "course_home",
              mode: leagueBoundaryStatus.mode,
              myRank: leagueBoundaryStatus.myRank,
              promotionZone: leagueBoundaryStatus.promotionZone,
              demotionZone: leagueBoundaryStatus.demotionZone,
              weeklyXp: leagueBoundaryStatus.weeklyXp,
              xpGap: leagueBoundaryStatus.xpGap,
              weekId: leagueBoundaryStatus.weekId,
              tier: leagueBoundaryStatus.tier,
            });
          }
        } else {
          setLeagueBoundary(null);
        }
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

  const handleRecoveryMissionPress = () => {
    const nextNode = currentTrail.find((node: any) => node.status === "current" && !node.isLocked && node.lessonFile);
    if (!nextNode?.lessonFile) {
      Alert.alert(
        i18n.t("course.keepUsingTitle"),
        i18n.t("course.keepUsingMessage"),
        [{ text: i18n.t("common.ok") }]
      );
      return;
    }
    router.replace(`/lesson?file=${nextNode.lessonFile}&genre=${selectedGenre}`);
  };

  const handleStreakGuardPress = () => {
    const nextNode = currentTrail.find((node: any) => node.status === "current" && !node.isLocked && node.lessonFile);
    if (!nextNode?.lessonFile) {
      Alert.alert(
        i18n.t("course.keepUsingTitle"),
        i18n.t("course.keepUsingMessage"),
        [{ text: i18n.t("common.ok") }]
      );
      return;
    }
    if (streakGuard) {
      Analytics.track("streak_guard_clicked", {
        source: "course_home",
        actionStreak: streakGuard.actionStreak,
        freezesRemaining: streakGuard.freezesRemaining,
        riskType: streakGuard.riskType,
      });
    }
    router.replace(`/lesson?file=${nextNode.lessonFile}&genre=${selectedGenre}`);
  };

  const handleLeagueBoundaryPress = () => {
    const nextNode = currentTrail.find((node: any) => node.status === "current" && !node.isLocked && node.lessonFile);
    if (!nextNode?.lessonFile) {
      Alert.alert(
        i18n.t("course.keepUsingTitle"),
        i18n.t("course.keepUsingMessage"),
        [{ text: i18n.t("common.ok") }]
      );
      return;
    }
    if (leagueBoundary) {
      Analytics.track("league_boundary_clicked", {
        source: "course_home",
        mode: leagueBoundary.mode,
        myRank: leagueBoundary.myRank,
        promotionZone: leagueBoundary.promotionZone,
        demotionZone: leagueBoundary.demotionZone,
        weeklyXp: leagueBoundary.weeklyXp,
        xpGap: leagueBoundary.xpGap,
        weekId: leagueBoundary.weekId,
        tier: leagueBoundary.tier,
        lessonId: nextNode.lessonFile,
      });
    }
    router.replace(`/lesson?file=${nextNode.lessonFile}&genre=${selectedGenre}&entry=league_boundary`);
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
      {recoveryMission && (
        <Pressable style={styles.recoveryMissionBanner} onPress={handleRecoveryMissionPress}>
          <Text style={styles.recoveryMissionTitle}>{i18n.t("course.recoveryMission.title")}</Text>
          <Text style={styles.recoveryMissionBody}>{i18n.t("course.recoveryMission.body")}</Text>
          <Text style={styles.recoveryMissionCta}>{i18n.t("course.recoveryMission.cta")}</Text>
        </Pressable>
      )}
      {!recoveryMission && streakGuard && (
        <Pressable style={styles.streakGuardBanner} onPress={handleStreakGuardPress}>
          <Text style={styles.streakGuardTitle}>{i18n.t("course.streakGuard.title")}</Text>
          <Text style={styles.streakGuardBody}>
            {streakGuard.riskType === "consume_freeze"
              ? i18n.t("course.streakGuard.bodyFreeze")
              : i18n.t("course.streakGuard.bodyBreak")}
          </Text>
          <Text style={styles.streakGuardCta}>{i18n.t("course.streakGuard.cta")}</Text>
        </Pressable>
      )}
      {!recoveryMission && !streakGuard && leagueBoundary && (
        <Pressable style={styles.leagueBoundaryBanner} onPress={handleLeagueBoundaryPress}>
          <Text style={styles.leagueBoundaryTitle}>{i18n.t("course.leagueBoundary.title")}</Text>
          <Text style={styles.leagueBoundaryBody}>
            {leagueBoundary.mode === "promotion_chase"
              ? i18n.t("course.leagueBoundary.bodyPromotion", { xpGap: leagueBoundary.xpGap })
              : i18n.t("course.leagueBoundary.bodyDemotion", { xpGap: leagueBoundary.xpGap })}
          </Text>
          <Text style={styles.leagueBoundaryCta}>{i18n.t("course.leagueBoundary.cta")}</Text>
        </Pressable>
      )}

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
  recoveryMissionBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(34,197,94,0.16)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.45)",
  },
  recoveryMissionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d9ffe4",
  },
  recoveryMissionBody: {
    marginTop: 4,
    fontSize: 12,
    color: "#d7f8e2",
  },
  recoveryMissionCta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#86efac",
  },
  streakGuardBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  streakGuardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffe7c2",
  },
  streakGuardBody: {
    marginTop: 4,
    fontSize: 12,
    color: "#ffe0ae",
  },
  streakGuardCta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#fbbf24",
  },
  leagueBoundaryBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(99, 102, 241, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.45)",
  },
  leagueBoundaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#dbe3ff",
  },
  leagueBoundaryBody: {
    marginTop: 4,
    fontSize: 12,
    color: "#c7d2fe",
  },
  leagueBoundaryCta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#a5b4fc",
  },
  header: {
    // Empty header reserved for spacing if needed, or remove completely.
    // Actually GlobalHeader is outside, so maybe just 0 height or specific bg.
    backgroundColor: "transparent",
  },


});
