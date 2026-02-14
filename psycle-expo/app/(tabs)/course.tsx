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
  getLocalDaypart,
  getStreakGuardCopyVariant,
  getStudyStreakRiskStatus,
  getStreakData,
  getRecoveryMissionStatus,
  getStreakGuardStatus,
  markStreakVisibilityShown,
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
  const [recoveryMission, setRecoveryMission] = useState<{ missedDays: number; lastStudyDate: string; studyStreak: number } | null>(null);
  const [streakVisibility, setStreakVisibility] = useState<{
    riskType: "safe_today" | "break_streak" | "consume_freeze";
    studyStreak: number;
    freezesRemaining: number;
    todayStudied: boolean;
  } | null>(null);
  const [streakGuard, setStreakGuard] = useState<{
    studyStreak: number;
    freezesRemaining: number;
    riskType: "break_streak" | "consume_freeze";
    lastStudyDate: string;
    copyVariant: "morning" | "daytime" | "evening" | "late_night";
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
        const streakRiskStatus = await getStudyStreakRiskStatus();
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
        setStreakVisibility(streakRiskStatus);

        const visibilityShownRecorded = await markStreakVisibilityShown("course_home");
        if (visibilityShownRecorded) {
          Analytics.track("streak_visibility_shown", {
            source: "course_home",
            riskType: streakRiskStatus.riskType,
            studyStreak: streakRiskStatus.studyStreak,
            freezesRemaining: streakRiskStatus.freezesRemaining,
            todayStudied: streakRiskStatus.todayStudied,
          });
        }

        let recoveryShown = false;
        let streakGuardShown = false;
        if (recoveryStatus.eligible && recoveryStatus.lastStudyDate) {
          recoveryShown = true;
          setRecoveryMission({
            missedDays: recoveryStatus.missedDays,
            lastStudyDate: recoveryStatus.lastStudyDate,
            studyStreak: recoveryStatus.studyStreak,
          });

          if (!recoveryStatus.shownToday) {
            await markRecoveryMissionShown();
            Analytics.track("recovery_mission_shown", {
              source: "course_home",
              missedDays: recoveryStatus.missedDays,
              lastStudyDate: recoveryStatus.lastStudyDate,
              studyStreak: recoveryStatus.studyStreak,
            });
          }
        } else {
          setRecoveryMission(null);
        }

        if (!recoveryShown && streakGuardStatus.eligible && streakGuardStatus.lastStudyDate) {
          streakGuardShown = true;
          const daypart = getLocalDaypart();
          const copyVariant = getStreakGuardCopyVariant(daypart);
          setStreakGuard({
            studyStreak: streakGuardStatus.studyStreak,
            freezesRemaining: streakGuardStatus.freezesRemaining,
            riskType: streakGuardStatus.riskType,
            lastStudyDate: streakGuardStatus.lastStudyDate,
            copyVariant,
          });

          if (!streakGuardStatus.shownToday) {
            await markStreakGuardShown();
            Analytics.track("streak_guard_shown", {
              source: "course_home",
              studyStreak: streakGuardStatus.studyStreak,
              freezesRemaining: streakGuardStatus.freezesRemaining,
              riskType: streakGuardStatus.riskType,
              lastStudyDate: streakGuardStatus.lastStudyDate,
              daypart,
              copyVariant,
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

  const getCurrentPlayableLesson = () => {
    const nextNode = currentTrail.find((node: any) => node.status === "current" && !node.isLocked && node.lessonFile);
    if (!nextNode?.lessonFile) {
      Alert.alert(
        i18n.t("course.keepUsingTitle"),
        i18n.t("course.keepUsingMessage"),
        [{ text: i18n.t("common.ok") }]
      );
      return null;
    }
    return nextNode.lessonFile;
  };

  const getStreakVisibilityBody = () => {
    if (!streakVisibility) return "";
    if (streakVisibility.riskType === "safe_today") return i18n.t("course.streakVisibility.safeToday");
    if (streakVisibility.riskType === "consume_freeze") return i18n.t("course.streakVisibility.consumeFreeze");
    return i18n.t("course.streakVisibility.breakStreak");
  };

  const getStreakGuardBody = (copyVariant: "morning" | "daytime" | "evening" | "late_night") => {
    if (copyVariant === "morning") return i18n.t("course.streakGuard.bodyMorning");
    if (copyVariant === "daytime") return i18n.t("course.streakGuard.bodyDaytime");
    if (copyVariant === "evening") return i18n.t("course.streakGuard.bodyEvening");
    return i18n.t("course.streakGuard.bodyLateNight");
  };

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
    const lessonFile = getCurrentPlayableLesson();
    if (!lessonFile) return;
    router.replace(`/lesson?file=${lessonFile}&genre=${selectedGenre}`);
  };

  const handleStreakVisibilityPress = () => {
    const lessonFile = getCurrentPlayableLesson();
    if (!lessonFile || !streakVisibility) return;
    Analytics.track("streak_visibility_clicked", {
      source: "course_home",
      riskType: streakVisibility.riskType,
      studyStreak: streakVisibility.studyStreak,
      freezesRemaining: streakVisibility.freezesRemaining,
      todayStudied: streakVisibility.todayStudied,
    });
    router.replace(`/lesson?file=${lessonFile}&genre=${selectedGenre}`);
  };

  const handleStreakGuardPress = () => {
    const lessonFile = getCurrentPlayableLesson();
    if (!lessonFile) return;
    if (streakGuard) {
      Analytics.track("streak_guard_clicked", {
        source: "course_home",
        studyStreak: streakGuard.studyStreak,
        freezesRemaining: streakGuard.freezesRemaining,
        riskType: streakGuard.riskType,
        daypart: streakGuard.copyVariant,
        copyVariant: streakGuard.copyVariant,
      });
    }
    router.replace(`/lesson?file=${lessonFile}&genre=${selectedGenre}`);
  };

  const handleLeagueBoundaryPress = () => {
    const lessonFile = getCurrentPlayableLesson();
    if (!lessonFile) return;
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
        lessonId: lessonFile,
      });
    }
    router.replace(`/lesson?file=${lessonFile}&genre=${selectedGenre}&entry=league_boundary`);
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
      {streakVisibility && (
        <Pressable style={styles.streakVisibilityBanner} onPress={handleStreakVisibilityPress}>
          <Text style={styles.streakVisibilityTitle}>{i18n.t("course.streakVisibility.title")}</Text>
          <Text style={styles.streakVisibilityBody}>{getStreakVisibilityBody()}</Text>
          <Text style={styles.streakVisibilityCta}>{i18n.t("course.streakVisibility.cta")}</Text>
        </Pressable>
      )}
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
          <Text style={styles.streakGuardBody}>{getStreakGuardBody(streakGuard.copyVariant)}</Text>
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
          // condition: レッスン完了3回以上
          const lessonCompleteCount = completedLessons.size;
          if (shouldShowPaywall(lessonCompleteCount)) {
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
  streakVisibilityBanner: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "rgba(6, 182, 212, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.45)",
  },
  streakVisibilityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d9fbff",
  },
  streakVisibilityBody: {
    marginTop: 4,
    fontSize: 12,
    color: "#d2f7ff",
  },
  streakVisibilityCta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#67e8f9",
  },
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
